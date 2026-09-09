export type NodeKind = 'file' | 'folder';

export interface Workspace {
  id: string;
  owner_id: string;
  name: string;
  challenge_id?: string | null;
  created_at: string;
  updated_at: string;
}

export interface WorkspaceNode {
  id: string;
  workspace_id: string;
  path: string;
  kind: NodeKind;
  language?: string | null;
  content?: string | null;
  updated_at: string;
}

export interface ExecutionRun {
  id: string;
  workspace_id: string;
  entrypoint_path: string;
  language: string;
  status: 'COMPLETED' | 'COMPILE_ERROR' | 'RUNTIME_ERROR' | 'TIME_LIMIT' | 'NATIVE_REQUIRED';
  stdout: string;
  stderr: string;
  execution_time_ms: number;
  created_at: string;
}

export interface EditorTab {
  nodeId: string;
  path: string;
  name: string;
  language: string;
  isDirty: boolean;
}

export interface FileTreeNode {
  id: string;
  name: string;
  path: string;
  kind: NodeKind;
  language?: string;
  children?: FileTreeNode[];
}
