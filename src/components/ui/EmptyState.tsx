import React from 'react';
import { Inbox, Plus } from 'lucide-react';

interface EmptyStateProps {
  title: string;
  description: string;
  icon?: React.ComponentType<{ className?: string }>;
  actionLabel?: string;
  onAction?: () => void;
}

export const EmptyState: React.FC<EmptyStateProps> = ({
  title,
  description,
  icon: Icon = Inbox,
  actionLabel,
  onAction
}) => {
  return (
    <div className="rounded-none chassis-plate p-8 text-center flex flex-col items-center justify-center space-y-4">
      <div className="p-3.5 rounded-none bg-theme-base text-theme-ink border border-theme-ink">
        <Icon className="h-6 w-6 text-theme-ink" />
      </div>

      <div className="space-y-1 max-w-sm">
        <h3 className="text-sm font-bold text-theme-ink uppercase tracking-wider">
          {title}
        </h3>
        <p className="text-xs text-theme-ink leading-relaxed font-sans">
          {description}
        </p>
      </div>

      {actionLabel && onAction && (
        <button
          onClick={onAction}
className="flex items-center gap-2 rounded-none tactile-btn-primary px-4 py-2 text-xs uppercase font-medium tracking-wider text-theme-base mt-2"
        >
          <Plus className="h-4 w-4" />
          <span>{actionLabel}</span>
        </button>
      )}
    </div>
  );
};
