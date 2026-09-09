import React, { useCallback, useMemo, useState, memo } from 'react';
import { 
  Folder, 
  FolderOpen, 
  FileCode, 
  Plus, 
  FolderPlus, 
  Trash2, 
  Edit2, 
  ChevronRight, 
  ChevronDown,
  X,
} from 'lucide-react';
import { buildFileTree, useWorkspaceStore } from '../../store/workspaceStore';
import type { FileTreeNode } from '../../types/workspace';

interface FileTreeExplorerProps {
  className?: string;
  onClose?: () => void;
  onFileOpened?: () => void;
}

export const FileTreeExplorer: React.FC<FileTreeExplorerProps> = ({
  className = '',
  onClose,
  onFileOpened,
}) => {
  const nodes = useWorkspaceStore((s) => s.nodes);
  const activeNodeId = useWorkspaceStore((s) => s.activeNodeId);
  const openFileTab = useWorkspaceStore((s) => s.openFileTab);
  const createFileOrFolder = useWorkspaceStore((s) => s.createFileOrFolder);
  const deleteNode = useWorkspaceStore((s) => s.deleteNode);
  const moveOrRenameNode = useWorkspaceStore((s) => s.moveOrRenameNode);

  const [expandedFolders, setExpandedFolders] = useState<Record<string, boolean>>({ '/src': true, '/src/utils': true });
  const [isCreating, setIsCreating] = useState<{ parentPath: string; kind: 'file' | 'folder' } | null>(null);
  const [newPathInput, setNewPathInput] = useState('');
  const [renamingNodeId, setRenamingNodeId] = useState<string | null>(null);
  const [renameInput, setRenameInput] = useState('');

  // Rebuild only when node structure changes — drafts do not touch `nodes` while typing.
  const fileTree = useMemo(() => buildFileTree(nodes), [nodes]);

  const toggleFolder = useCallback((path: string) => {
    setExpandedFolders((prev) => ({ ...prev, [path]: !prev[path] }));
  }, []);

  const handleOpenFile = useCallback(
    (node: FileTreeNode) => {
      const full = useWorkspaceStore.getState().nodes.find((n) => n.id === node.id);
      if (!full) return;
      openFileTab(full);
      onFileOpened?.();
    },
    [openFileTab, onFileOpened],
  );

  const handleCreateSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!isCreating || !newPathInput.trim()) return;

    let fullPath = newPathInput.trim();
    if (!fullPath.startsWith('/')) {
      fullPath = isCreating.parentPath === '/' ? `/${fullPath}` : `${isCreating.parentPath}/${fullPath}`;
    }

    await createFileOrFolder(fullPath, isCreating.kind);
    setIsCreating(null);
    setNewPathInput('');
  };

  const handleRenameSubmit = useCallback(
    async (nodeId: string, oldPath: string, e: React.FormEvent) => {
      e.preventDefault();
      if (!renameInput.trim()) {
        setRenamingNodeId(null);
        return;
      }

      const parts = oldPath.split('/');
      parts[parts.length - 1] = renameInput.trim();
      const newPath = parts.join('/');

      await moveOrRenameNode(nodeId, newPath);
      setRenamingNodeId(null);
    },
    [renameInput, moveOrRenameNode],
  );

  return (
    <div
      className={`w-64 bg-charcoal-surface border-r border-slate flex flex-col h-full font-mono text-xs select-none text-cream shrink-0 contain-strict ${className}`}
    >
      <div className="flex items-center justify-between px-3 min-h-11 bg-charcoal-base border-b border-slate text-xs font-bold text-beige">
        <span className="tracking-wider uppercase text-nano text-greige">Files</span>
        <div className="flex items-center gap-1">
          <button
            type="button"
            onClick={() => setIsCreating({ parentPath: '/', kind: 'file' })}
            title="New File"
            aria-label="New file"
            className="ide-touch-target p-2 hover:bg-charcoal-card rounded text-beige transition"
          >
            <Plus className="h-4 w-4" />
          </button>
          <button
            type="button"
            onClick={() => setIsCreating({ parentPath: '/', kind: 'folder' })}
            title="New Folder"
            aria-label="New folder"
            className="ide-touch-target p-2 hover:bg-charcoal-card rounded text-beige transition"
          >
            <FolderPlus className="h-4 w-4" />
          </button>
          {onClose && (
            <button
              type="button"
              onClick={onClose}
              title="Close file explorer"
              aria-label="Close file explorer"
              className="ide-touch-target p-2 hover:bg-charcoal-card rounded text-greige hover:text-cream transition"
            >
              <X className="h-4 w-4" />
            </button>
          )}
        </div>
      </div>

      <div className="flex-1 overflow-y-auto p-2 space-y-0.5 content-visibility-auto">
        {fileTree.map((node) => (
          <TreeNodeItem
            key={node.id}
            node={node}
            depth={0}
            expandedFolders={expandedFolders}
            toggleFolder={toggleFolder}
            activeNodeId={activeNodeId}
            openFileTab={handleOpenFile}
            renamingNodeId={renamingNodeId}
            setRenamingNodeId={setRenamingNodeId}
            renameInput={renameInput}
            setRenameInput={setRenameInput}
            handleRenameSubmit={handleRenameSubmit}
            deleteNode={deleteNode}
            setIsCreating={setIsCreating}
          />
        ))}

        {isCreating && (
          <form onSubmit={handleCreateSubmit} className="flex items-center gap-1.5 px-2 py-1 bg-charcoal-card rounded border border-greige/60 mt-1">
            {isCreating.kind === 'folder' ? <Folder className="h-3.5 w-3.5 text-greige" /> : <FileCode className="h-3.5 w-3.5 text-beige" />}
            <input
              type="text"
              value={newPathInput}
              onChange={(e) => setNewPathInput(e.target.value)}
              placeholder={isCreating.kind === 'folder' ? 'folder-name' : 'filename.ts'}
              autoFocus
              onBlur={() => setIsCreating(null)}
              className="bg-transparent text-base md:text-xs text-cream focus:outline-none w-full font-mono min-h-11"
            />
          </form>
        )}
      </div>
    </div>
  );
};

interface TreeNodeItemProps {
  node: FileTreeNode;
  depth: number;
  expandedFolders: Record<string, boolean>;
  toggleFolder: (path: string) => void;
  activeNodeId: string | null;
  openFileTab: (node: FileTreeNode) => void;
  renamingNodeId: string | null;
  setRenamingNodeId: (id: string | null) => void;
  renameInput: string;
  setRenameInput: (val: string) => void;
  handleRenameSubmit: (id: string, oldPath: string, e: React.FormEvent) => void;
  deleteNode: (id: string) => void;
  setIsCreating: (val: { parentPath: string; kind: 'file' | 'folder' } | null) => void;
}

const TreeNodeItem = memo(function TreeNodeItem({
  node,
  depth,
  expandedFolders,
  toggleFolder,
  activeNodeId,
  openFileTab,
  renamingNodeId,
  setRenamingNodeId,
  renameInput,
  setRenameInput,
  handleRenameSubmit,
  deleteNode,
  setIsCreating,
}: TreeNodeItemProps) {
  const isFolder = node.kind === 'folder';
  const isExpanded = !!expandedFolders[node.path];
  const isActive = activeNodeId === node.id;
  const isRenaming = renamingNodeId === node.id;

  return (
    <div>
      <div
        style={{ paddingLeft: `${depth * 12 + 6}px` }}
        className={`group flex items-center justify-between min-h-11 py-2 px-2 rounded cursor-pointer transition text-xs ${
          isActive ? 'bg-charcoal-card text-cream font-semibold border-l-2 border-beige' : 'text-greige hover:bg-charcoal-base hover:text-beige'
        }`}
        onClick={() => {
          if (isFolder) toggleFolder(node.path);
          else openFileTab(node);
        }}
      >
        <div className="flex items-center gap-1.5 min-w-0 flex-1">
          {isFolder ? (
            <>
              {isExpanded ? <ChevronDown className="h-3.5 w-3.5 shrink-0 text-greige" /> : <ChevronRight className="h-3.5 w-3.5 shrink-0 text-greige" />}
              {isExpanded ? <FolderOpen className="h-4 w-4 shrink-0 text-greige" /> : <Folder className="h-4 w-4 shrink-0 text-greige" />}
            </>
          ) : (
            <FileCode className="h-4 w-4 shrink-0 text-beige" />
          )}

          {isRenaming ? (
            <form onSubmit={(e) => handleRenameSubmit(node.id, node.path, e)} className="flex-1" onClick={(e) => e.stopPropagation()}>
              <input
                type="text"
                value={renameInput}
                onChange={(e) => setRenameInput(e.target.value)}
                autoFocus
                onBlur={() => setRenamingNodeId(null)}
                className="bg-charcoal-card text-xs text-cream px-1 rounded border border-greige focus:border-amber-500 focus:outline-none font-mono w-full min-h-9"
              />
            </form>
          ) : (
            <span className="truncate">{node.name}</span>
          )}
        </div>

        <div
          className="ide-hover-reveal flex items-center gap-0.5 shrink-0 text-greige"
          onClick={(e) => e.stopPropagation()}
        >
          {isFolder && (
            <button
              type="button"
              onClick={() => setIsCreating({ parentPath: node.path, kind: 'file' })}
              title="Add file inside"
              aria-label={`Add file in ${node.name}`}
              className="ide-touch-target p-2 hover:text-cream rounded"
            >
              <Plus className="h-3.5 w-3.5" />
            </button>
          )}
          <button
            type="button"
            onClick={() => {
              setRenamingNodeId(node.id);
              setRenameInput(node.name);
            }}
            title="Rename"
            aria-label={`Rename ${node.name}`}
            className="ide-touch-target p-2 hover:text-cream rounded"
          >
            <Edit2 className="h-3.5 w-3.5" />
          </button>
          <button
            type="button"
            onClick={() => deleteNode(node.id)}
            title="Delete"
            aria-label={`Delete ${node.name}`}
            className="ide-touch-target p-2 hover:text-red-400 rounded"
          >
            <Trash2 className="h-3.5 w-3.5" />
          </button>
        </div>
      </div>

      {isFolder && isExpanded && node.children && (
        <div>
          {node.children.map((child) => (
            <TreeNodeItem
              key={child.id}
              node={child}
              depth={depth + 1}
              expandedFolders={expandedFolders}
              toggleFolder={toggleFolder}
              activeNodeId={activeNodeId}
              openFileTab={openFileTab}
              renamingNodeId={renamingNodeId}
              setRenamingNodeId={setRenamingNodeId}
              renameInput={renameInput}
              setRenameInput={setRenameInput}
              handleRenameSubmit={handleRenameSubmit}
              deleteNode={deleteNode}
              setIsCreating={setIsCreating}
            />
          ))}
        </div>
      )}
    </div>
  );
});
