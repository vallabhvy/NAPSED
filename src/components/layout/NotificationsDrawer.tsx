import React from 'react';
import { Bell, X } from 'lucide-react';

interface NotificationsDrawerProps {
  isOpen: boolean;
  onClose: () => void;
  notifications?: Array<{ id: string; title: string; message: string; timestamp: string; unread: boolean }>;
}

export const NotificationsDrawer: React.FC<NotificationsDrawerProps> = ({ 
  isOpen, 
  onClose,
  notifications = [] 
}) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 overflow-hidden bg-theme-base/60 backdrop-blur-sm">
      <div className="absolute inset-y-0 right-0 flex max-w-full pl-10">
        <div className="w-screen max-w-sm border-l chassis-plate">
          
          {/* Header */}
          <div className="flex items-center justify-between border-b border-theme-ink px-4 py-4 bg-theme-base">
            <div className="flex items-center gap-2">
              <Bell className="h-4 w-4 text-theme-ink" />
              <h2 className="text-xs font-bold text-theme-ink uppercase tracking-wider font-mono">NOTIFICATIONS</h2>
            </div>
            <button 
              onClick={onClose}
              className="rounded-none p-1 text-theme-ink hover:bg-theme-surface"
            >
              <X className="h-4 w-4" />
            </button>
          </div>

          {/* List */}
          <div className="overflow-y-auto p-4 space-y-3 pb-16">
            {notifications.length === 0 ? (
              <div className="p-6 text-center text-xs font-mono uppercase tracking-wider text-theme-ink rounded-none recessed-meter">
                NO NEW NOTIFICATIONS.
              </div>
            ) : (
              notifications.map((n) => (
                <div 
                  key={n.id}
                  className={`p-3 rounded-none border text-xs transition ${
                    n.unread 
                      ? 'recessed-meter text-theme-ink' 
                      : 'border-theme-ink/50 bg-theme-surface text-theme-ink/70'
                  }`}
                >
                  <div className="font-semibold uppercase tracking-wider text-theme-ink">{n.title}</div>
                  <div className="text-micro text-theme-ink mt-0.5">{n.message}</div>
                  <div className="text-micro font-mono tabular-nums text-theme-ink/60 mt-2">{n.timestamp}</div>
                </div>
              ))
            )}
          </div>

          {/* Footer */}
          <div className="absolute bottom-0 inset-x-0 border-t recessed-meter p-3 text-center text-xs uppercase tracking-wider font-medium text-theme-ink font-mono">
            <span>NAPSED PROTOCOL</span>
          </div>

        </div>
      </div>
    </div>
  );
};
