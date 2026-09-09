-- ----------------------------------------------------
-- DevProof / Napsed Workspaces & Multi-File IDE Schema
-- ----------------------------------------------------

-- 1. Workspaces Table
CREATE TABLE IF NOT EXISTS public.workspaces (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  owner_id UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  challenge_id UUID REFERENCES public.challenges(id) ON DELETE SET NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_workspaces_owner ON public.workspaces(owner_id);
CREATE INDEX IF NOT EXISTS idx_workspaces_challenge ON public.workspaces(challenge_id);

-- 2. Workspace Nodes Table (Files & Folders)
CREATE TABLE IF NOT EXISTS public.workspace_nodes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  workspace_id UUID NOT NULL REFERENCES public.workspaces(id) ON DELETE CASCADE,
  path TEXT NOT NULL,
  kind TEXT NOT NULL CHECK (kind IN ('file', 'folder')),
  language TEXT,
  content TEXT,
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  CONSTRAINT unique_workspace_node_path UNIQUE (workspace_id, path)
);

CREATE INDEX IF NOT EXISTS idx_workspace_nodes_workspace ON public.workspace_nodes(workspace_id);
CREATE INDEX IF NOT EXISTS idx_workspace_nodes_path ON public.workspace_nodes(workspace_id, path);

-- 3. Execution Runs Telemetry Table
CREATE TABLE IF NOT EXISTS public.execution_runs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  workspace_id UUID NOT NULL REFERENCES public.workspaces(id) ON DELETE CASCADE,
  entrypoint_path TEXT NOT NULL,
  language TEXT NOT NULL,
  status TEXT NOT NULL CHECK (status IN ('COMPLETED', 'COMPILE_ERROR', 'RUNTIME_ERROR', 'TIME_LIMIT')),
  stdout TEXT NOT NULL DEFAULT '',
  stderr TEXT NOT NULL DEFAULT '',
  execution_time_ms INT NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_execution_runs_workspace ON public.execution_runs(workspace_id);
CREATE INDEX IF NOT EXISTS idx_execution_runs_created ON public.execution_runs(created_at DESC);

-- ----------------------------------------------------
-- Enable Row Level Security (RLS)
-- ----------------------------------------------------
ALTER TABLE public.workspaces ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.workspace_nodes ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.execution_runs ENABLE ROW LEVEL SECURITY;

-- Workspaces Policies
CREATE POLICY "Users can manage own workspaces" 
  ON public.workspaces 
  FOR ALL 
  USING (owner_id = auth.uid()) 
  WITH CHECK (owner_id = auth.uid());

-- Workspace Nodes Policies (Verify Workspace Ownership)
CREATE POLICY "Users can manage own workspace nodes" 
  ON public.workspace_nodes 
  FOR ALL 
  USING (
    EXISTS (
      SELECT 1 FROM public.workspaces w 
      WHERE w.id = workspace_nodes.workspace_id 
        AND w.owner_id = auth.uid()
    )
  ) 
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.workspaces w 
      WHERE w.id = workspace_nodes.workspace_id 
        AND w.owner_id = auth.uid()
    )
  );

-- Execution Runs Policies
CREATE POLICY "Users can manage own execution runs" 
  ON public.execution_runs 
  FOR ALL 
  USING (
    EXISTS (
      SELECT 1 FROM public.workspaces w 
      WHERE w.id = execution_runs.workspace_id 
        AND w.owner_id = auth.uid()
    )
  ) 
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.workspaces w 
      WHERE w.id = execution_runs.workspace_id 
        AND w.owner_id = auth.uid()
    )
  );

-- ----------------------------------------------------
-- Atomic Folder/File Move RPC (Tree Safety)
-- ----------------------------------------------------
CREATE OR REPLACE FUNCTION public.move_workspace_node(
  p_node_id UUID,
  p_new_path TEXT
)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY INVOKER
AS $$
DECLARE
  v_workspace_id UUID;
  v_old_path TEXT;
  v_kind TEXT;
  v_owner_id UUID;
  v_new_parent_path TEXT;
  v_affected_count INT := 0;
BEGIN
  -- 1. Fetch target node & check existence
  SELECT workspace_id, path, kind 
  INTO v_workspace_id, v_old_path, v_kind
  FROM public.workspace_nodes
  WHERE id = p_node_id;

  IF NOT FOUND THEN
    RAISE EXCEPTION 'Node with ID % not found', p_node_id;
  END IF;

  -- 2. Verify auth.uid() ownership
  SELECT owner_id INTO v_owner_id
  FROM public.workspaces
  WHERE id = v_workspace_id;

  IF v_owner_id IS NULL OR v_owner_id <> auth.uid() THEN
    RAISE EXCEPTION 'Unauthorized: User does not own target workspace';
  END IF;

  -- 3. Prevent Self-Nesting (moving a folder inside its own subtree)
  IF v_kind = 'folder' AND p_new_path LIKE v_old_path || '/%' THEN
    RAISE EXCEPTION 'Invalid Move: Cannot move folder inside its own child subtree';
  END IF;

  -- 4. Check for destination path collision
  IF EXISTS (
    SELECT 1 FROM public.workspace_nodes 
    WHERE workspace_id = v_workspace_id 
      AND path = p_new_path 
      AND id <> p_node_id
  ) THEN
    RAISE EXCEPTION 'Path Collision: A node already exists at path %', p_new_path;
  END IF;

  -- 5. Atomic Path Updates
  IF v_kind = 'file' THEN
    UPDATE public.workspace_nodes
    SET path = p_new_path,
        updated_at = NOW()
    WHERE id = p_node_id;

    v_affected_count := 1;
  ELSE
    -- Folder Move: Update folder node and all descendants atomically
    UPDATE public.workspace_nodes
    SET path = REGEXP_REPLACE(path, '^' || quote_literal(v_old_path), p_new_path),
        updated_at = NOW()
    WHERE workspace_id = v_workspace_id
      AND (path = v_old_path OR path LIKE v_old_path || '/%');

    GET DIAGNOSTICS v_affected_count = ROW_COUNT;
  END IF;

  RETURN jsonb_build_object(
    'success', true,
    'node_id', p_node_id,
    'old_path', v_old_path,
    'new_path', p_new_path,
    'affected_nodes', v_affected_count
  );
END;
$$;

-- Security hardening on RPC
REVOKE EXECUTE ON FUNCTION public.move_workspace_node(UUID, TEXT) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.move_workspace_node(UUID, TEXT) TO authenticated;
