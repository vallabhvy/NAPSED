import { supabase } from '../lib/supabase';
import type { Workspace, WorkspaceNode, ExecutionRun } from '../types/workspace';

export const workspaceService = {
  /**
   * Fetch all workspaces belonging to current authenticated user
   */
  async getWorkspaces(): Promise<Workspace[]> {
    const { data, error } = await supabase
      .from('workspaces')
      .select('*')
      .order('updated_at', { ascending: false });

    if (error) {
      console.warn('Error fetching workspaces from Supabase:', error.message);
      return [];
    }
    return data || [];
  },

  /**
   * Create a new workspace
   */
  async createWorkspace(name: string, challengeId?: string): Promise<Workspace | null> {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return null;

    const { data, error } = await supabase
      .from('workspaces')
      .insert({
        owner_id: user.id,
        name,
        challenge_id: challengeId || null,
      })
      .select()
      .single();

    if (error) {
      console.error('Error creating workspace:', error.message);
      return null;
    }

    // Seed default workspace root files
    await this.seedDefaultWorkspaceNodes(data.id);
    return data;
  },

  /**
   * Seed default starter files for a newly created workspace
   */
  async seedDefaultWorkspaceNodes(workspaceId: string): Promise<void> {
    const defaultNodes = [
      { workspace_id: workspaceId, path: '/src', kind: 'folder', content: null, language: null },
      { workspace_id: workspaceId, path: '/src/main.ts', kind: 'file', language: 'typescript', content: `// Napsed in-browser multi-file sandbox\n\nimport { greet } from './utils/helper';\n\nfunction main() {\n  console.log("Napsed workspace ready");\n  console.log(greet("Developer"));\n}\n\nmain();\n` },
      { workspace_id: workspaceId, path: '/src/utils', kind: 'folder', content: null, language: null },
      { workspace_id: workspaceId, path: '/src/utils/helper.ts', kind: 'file', language: 'typescript', content: `export function greet(name: string): string {\n  return \`Hello \${name}! Running in the Napsed WebAssembly sandbox.\`;\n}\n` },
      { workspace_id: workspaceId, path: '/README.md', kind: 'file', language: 'markdown', content: `# Napsed sandbox\n\nMulti-file workspace. Code runs in your browser via WebAssembly.\n` },
    ];

    await supabase.from('workspace_nodes').insert(defaultNodes);
  },

  /**
   * Fetch all nodes (files & folders) for a given workspace
   */
  async getWorkspaceNodes(workspaceId: string): Promise<WorkspaceNode[]> {
    const { data, error } = await supabase
      .from('workspace_nodes')
      .select('*')
      .eq('workspace_id', workspaceId)
      .order('path', { ascending: true });

    if (error) {
      console.warn('Error fetching workspace nodes:', error.message);
      return [];
    }
    return data || [];
  },

  /**
   * Save/Update single node content
   */
  async saveNodeContent(nodeId: string, content: string): Promise<boolean> {
    const { error } = await supabase
      .from('workspace_nodes')
      .update({ content, updated_at: new Date().toISOString() })
      .eq('id', nodeId);

    if (error) {
      console.error('Error saving node content:', error.message);
      return false;
    }
    return true;
  },

  /**
   * Create a new file or folder node
   */
  async createNode(workspaceId: string, path: string, kind: 'file' | 'folder', language?: string, content?: string): Promise<WorkspaceNode | null> {
    const { data, error } = await supabase
      .from('workspace_nodes')
      .insert({
        workspace_id: workspaceId,
        path,
        kind,
        language: language || null,
        content: content !== undefined ? content : (kind === 'file' ? '' : null),
      })
      .select()
      .single();

    if (error) {
      console.error('Error creating node:', error.message);
      return null;
    }
    return data;
  },

  /**
   * Delete a node (and subchildren if folder)
   */
  async deleteNode(nodeId: string): Promise<boolean> {
    const { error } = await supabase
      .from('workspace_nodes')
      .delete()
      .eq('id', nodeId);

    if (error) {
      console.error('Error deleting node:', error.message);
      return false;
    }
    return true;
  },

  /**
   * Execute Atomic Node Move via Postgres RPC (Tree Safety)
   */
  async moveNodeRpc(nodeId: string, newPath: string): Promise<{ success: boolean; affectedNodes?: number; error?: string }> {
    const { data, error } = await supabase.rpc('move_workspace_node', {
      p_node_id: nodeId,
      p_new_path: newPath,
    });

    if (error) {
      console.error('RPC move_workspace_node failed:', error.message);
      return { success: false, error: error.message };
    }

    return {
      success: true,
      affectedNodes: data?.affected_nodes || 1,
    };
  },

  /**
   * Record telemetry run into execution_runs
   */
  async recordExecutionRun(run: Omit<ExecutionRun, 'id' | 'created_at'>): Promise<void> {
    const { error } = await supabase.from('execution_runs').insert(run);
    if (error) {
      console.warn('Failed to log telemetry run:', error.message);
    }
  },
};
