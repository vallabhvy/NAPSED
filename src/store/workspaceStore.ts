import { create } from 'zustand';
import type { Workspace, WorkspaceNode, EditorTab, FileTreeNode } from '../types/workspace';
import { workspaceService } from '../services/workspaceService';

/** Flat nodes → nested explorer tree (structure only; ignores file bodies). */
export function buildFileTree(nodes: WorkspaceNode[]): FileTreeNode[] {
  const map = new Map<string, FileTreeNode>();
  const roots: FileTreeNode[] = [];
  const sorted = [...nodes].sort((a, b) => a.path.localeCompare(b.path));

  sorted.forEach((node) => {
    const treeNode: FileTreeNode = {
      id: node.id,
      name: node.path.split('/').pop() || '',
      path: node.path,
      kind: node.kind,
      language: node.language || undefined,
      children: node.kind === 'folder' ? [] : undefined,
    };

    map.set(node.path, treeNode);

    const parts = node.path.split('/').filter(Boolean);
    if (parts.length === 1) {
      roots.push(treeNode);
    } else {
      const parentPath = '/' + parts.slice(0, -1).join('/');
      const parent = map.get(parentPath);
      if (parent && parent.children) {
        parent.children.push(treeNode);
      } else {
        roots.push(treeNode);
      }
    }
  });

  return roots;
}

interface WorkspaceState {
  // Current active workspace & nodes
  activeWorkspace: Workspace | null;
  nodes: WorkspaceNode[];
  /** In-flight editor buffers — typing updates these, not `nodes`, so the file tree stays stable. */
  draftContents: Record<string, string>;
  isLoading: boolean;

  // Editor Tabs & Active Selection (Keyed by Immutable Node ID for Path Safety)
  openTabs: EditorTab[];
  activeNodeId: string | null;
  
  // Autosave Status
  isSaving: boolean;
  lastSavedAt: Date | null;

  // Actions
  loadWorkspace: (workspaceId: string) => Promise<void>;
  initInMemoryWorkspace: (name: string, initialFiles?: Array<{ path: string; content: string; language: string }>) => void;
  openFileTab: (node: WorkspaceNode) => void;
  closeTab: (nodeId: string) => void;
  setActiveTab: (nodeId: string) => void;
  updateActiveFileContent: (content: string) => void;
  /** Nodes with draft buffers merged — use for submit / run / export. */
  getResolvedNodes: () => WorkspaceNode[];
  getNodeContent: (nodeId: string) => string;

  // Node Mutations
  createFileOrFolder: (path: string, kind: 'file' | 'folder', language?: string, content?: string) => Promise<boolean>;
  deleteNode: (nodeId: string) => Promise<boolean>;
  moveOrRenameNode: (nodeId: string, newPath: string) => Promise<boolean>;

  // Helper
  getFileTree: () => FileTreeNode[];
}

let autosaveTimer: ReturnType<typeof setTimeout> | null = null;

export const useWorkspaceStore = create<WorkspaceState>((set, get) => {
  const flushDraftToNodes = async (nodeId: string) => {
    const { draftContents, nodes, activeWorkspace, openTabs } = get();
    if (!(nodeId in draftContents)) {
      set({ isSaving: false });
      return;
    }

    const content = draftContents[nodeId];
    set({ isSaving: true });

    try {
      if (activeWorkspace && !activeWorkspace.id.startsWith('local-sandbox')) {
        await workspaceService.saveNodeContent(nodeId, content);
      }

      const updatedNodes = nodes.map((n) =>
        n.id === nodeId ? { ...n, content, updated_at: new Date().toISOString() } : n,
      );
      const nextDrafts = { ...draftContents };
      delete nextDrafts[nodeId];

      set({
        nodes: updatedNodes,
        draftContents: nextDrafts,
        openTabs: openTabs.map((t) => (t.nodeId === nodeId ? { ...t, isDirty: false } : t)),
        isSaving: false,
        lastSavedAt: new Date(),
      });
    } catch (err) {
      console.error('Autosave failed:', err);
      set({ isSaving: false });
    }
  };

  return {
  activeWorkspace: null,
  nodes: [],
  draftContents: {},
  isLoading: false,
  openTabs: [],
  activeNodeId: null,
  isSaving: false,
  lastSavedAt: null,

  /**
   * Load workspace and its node tree from Supabase
   */
  loadWorkspace: async (workspaceId: string) => {
    set({ isLoading: true });
    try {
      const nodes = await workspaceService.getWorkspaceNodes(workspaceId);
      const workspaces = await workspaceService.getWorkspaces();
      const currentWorkspace = workspaces.find((w) => w.id === workspaceId) || null;

      // Select default entrypoint file if exists
      const entryFile = nodes.find((n) => n.kind === 'file' && (n.path.includes('main') || n.path.includes('index') || n.path.endsWith('.ts') || n.path.endsWith('.js'))) || nodes.find((n) => n.kind === 'file');

      const initialTab: EditorTab[] = entryFile ? [{
        nodeId: entryFile.id,
        path: entryFile.path,
        name: entryFile.path.split('/').pop() || 'file',
        language: entryFile.language || 'typescript',
        isDirty: false
      }] : [];

      set({
        activeWorkspace: currentWorkspace,
        nodes,
        draftContents: {},
        openTabs: initialTab,
        activeNodeId: entryFile ? entryFile.id : null,
        isLoading: false,
      });
    } catch (err) {
      console.error('Failed to load workspace:', err);
      set({ isLoading: false });
    }
  },

  /**
   * Initialize in-memory workspace for Challenge Sandbox Mode
   */
  initInMemoryWorkspace: (name: string, initialFiles = []) => {
    const workspaceId = 'local-sandbox-' + Math.random().toString(36).substring(2, 9);
    
    const mockWorkspace: Workspace = {
      id: workspaceId,
      owner_id: 'local-user',
      name,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    };

    const mockNodes: WorkspaceNode[] = initialFiles.map((f, index) => ({
      id: `node-${index}-${Math.random().toString(36).substring(2, 6)}`,
      workspace_id: workspaceId,
      path: f.path,
      kind: 'file',
      language: f.language,
      content: f.content,
      updated_at: new Date().toISOString(),
    }));

    const entryFile = mockNodes[0];

    set({
      activeWorkspace: mockWorkspace,
      nodes: mockNodes,
      draftContents: {},
      openTabs: entryFile ? [{
        nodeId: entryFile.id,
        path: entryFile.path,
        name: entryFile.path.split('/').pop() || 'solution.ts',
        language: entryFile.language || 'typescript',
        isDirty: false
      }] : [],
      activeNodeId: entryFile ? entryFile.id : null,
      isLoading: false,
    });
  },

  /**
   * Open an editor tab (keyed by immutable node.id)
   */
  openFileTab: (node: WorkspaceNode) => {
    if (node.kind !== 'file') return;
    const { openTabs } = get();

    const existingIndex = openTabs.findIndex((t) => t.nodeId === node.id);
    if (existingIndex >= 0) {
      set({ activeNodeId: node.id });
      return;
    }

    const newTab: EditorTab = {
      nodeId: node.id,
      path: node.path,
      name: node.path.split('/').pop() || 'file',
      language: node.language || 'typescript',
      isDirty: false,
    };

    set({
      openTabs: [...openTabs, newTab],
      activeNodeId: node.id,
    });
  },

  /**
   * Close an editor tab
   */
  closeTab: (nodeId: string) => {
    const { openTabs, activeNodeId } = get();
    const updatedTabs = openTabs.filter((t) => t.nodeId !== nodeId);

    let nextActiveId = activeNodeId;
    if (activeNodeId === nodeId) {
      nextActiveId = updatedTabs.length > 0 ? updatedTabs[updatedTabs.length - 1].nodeId : null;
    }

    set({
      openTabs: updatedTabs,
      activeNodeId: nextActiveId,
    });
  },

  /**
   * Set active focused tab
   */
  setActiveTab: (nodeId: string) => {
    set({ activeNodeId: nodeId });
  },

  /**
   * Update active editor buffer. Drafts absorb keystrokes so `nodes` (and the file tree) stay stable.
   */
  updateActiveFileContent: (content: string) => {
    const { activeNodeId, openTabs, draftContents } = get();
    if (!activeNodeId) return;

    const nextDrafts = { ...draftContents, [activeNodeId]: content };
    const tab = openTabs.find((t) => t.nodeId === activeNodeId);
    if (tab && !tab.isDirty) {
      set({
        draftContents: nextDrafts,
        openTabs: openTabs.map((t) =>
          t.nodeId === activeNodeId ? { ...t, isDirty: true } : t,
        ),
      });
    } else {
      set({ draftContents: nextDrafts });
    }

    if (autosaveTimer) clearTimeout(autosaveTimer);
    autosaveTimer = setTimeout(() => {
      void flushDraftToNodes(activeNodeId);
    }, 800);
  },

  getNodeContent: (nodeId: string) => {
    const { draftContents, nodes } = get();
    if (nodeId in draftContents) return draftContents[nodeId];
    return nodes.find((n) => n.id === nodeId)?.content || '';
  },

  getResolvedNodes: () => {
    const { nodes, draftContents } = get();
    if (Object.keys(draftContents).length === 0) return nodes;
    return nodes.map((n) =>
      n.id in draftContents
        ? { ...n, content: draftContents[n.id], updated_at: new Date().toISOString() }
        : n,
    );
  },

  /**
   * Create new file or folder
   */
  createFileOrFolder: async (path: string, kind: 'file' | 'folder', language?: string, content?: string) => {
    const { activeWorkspace, nodes } = get();
    if (!activeWorkspace) return false;

    // Local in-memory sandbox creation
    if (activeWorkspace.id.startsWith('local-sandbox')) {
      const newNode: WorkspaceNode = {
        id: `node-${Math.random().toString(36).substring(2, 7)}`,
        workspace_id: activeWorkspace.id,
        path,
        kind,
        language: language || (kind === 'file' ? 'typescript' : null),
        content: content !== undefined ? content : (kind === 'file' ? '' : null),
        updated_at: new Date().toISOString(),
      };
      set({ nodes: [...nodes, newNode] });
      if (kind === 'file') get().openFileTab(newNode);
      return true;
    }

    // Supabase Persistence
    const created = await workspaceService.createNode(activeWorkspace.id, path, kind, language, content);
    if (created) {
      set({ nodes: [...nodes, created] });
      if (kind === 'file') get().openFileTab(created);
      return true;
    }
    return false;
  },

  /**
   * Delete node by ID
   */
  deleteNode: async (nodeId: string) => {
    const { activeWorkspace, nodes } = get();
    if (!activeWorkspace) return false;

    const targetNode = nodes.find((n) => n.id === nodeId);
    if (!targetNode) return false;

    // Filter local node tree
    const isFolder = targetNode.kind === 'folder';
    const remainingNodes = nodes.filter((n) => isFolder ? !n.path.startsWith(targetNode.path) : n.id !== nodeId);

    set({ nodes: remainingNodes, draftContents: Object.fromEntries(
      Object.entries(get().draftContents).filter(([id]) => remainingNodes.some((n) => n.id === id)),
    ) });
    get().closeTab(nodeId);

    if (!activeWorkspace.id.startsWith('local-sandbox')) {
      await workspaceService.deleteNode(nodeId);
    }
    return true;
  },

  /**
   * Atomic Node Move / Rename (Path Safety Guarantee)
   */
  moveOrRenameNode: async (nodeId: string, newPath: string) => {
    const { activeWorkspace, nodes, openTabs } = get();
    if (!activeWorkspace) return false;

    const targetNode = nodes.find((n) => n.id === nodeId);
    if (!targetNode) return false;

    const oldPath = targetNode.path;
    const isFolder = targetNode.kind === 'folder';

    // Local optimistic update
    const updatedNodes = nodes.map((n) => {
      if (n.id === nodeId) {
        return { ...n, path: newPath };
      }
      if (isFolder && n.path.startsWith(oldPath + '/')) {
        const subPath = n.path.substring(oldPath.length);
        return { ...n, path: newPath + subPath };
      }
      return n;
    });

    // Update Open Tabs with Path-Invariant Immutable Node.id
    const updatedTabs = openTabs.map((t) => {
      const matchingNode = updatedNodes.find((n) => n.id === t.nodeId);
      if (matchingNode) {
        return {
          ...t,
          path: matchingNode.path,
          name: matchingNode.path.split('/').pop() || 'file',
        };
      }
      return t;
    });

    set({ nodes: updatedNodes, openTabs: updatedTabs });

    // Execute Atomic Postgres RPC if persistent
    if (!activeWorkspace.id.startsWith('local-sandbox')) {
      const res = await workspaceService.moveNodeRpc(nodeId, newPath);
      if (!res.success) {
        console.error('Failed RPC move, reverting tree:', res.error);
        // Rollback on RPC error
        set({ nodes, openTabs });
        return false;
      }
    }
    return true;
  },

  /**
   * Helper: Convert flat WorkspaceNodes array to nested FileTreeNode hierarchy
   */
  getFileTree: () => buildFileTree(get().nodes),
  };
});
