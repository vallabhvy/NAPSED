import React, { useState } from "react";
import {
  Search,
  CheckSquare,
  Grid,
  Bell,
  LogOut,
  Layers,
  Activity,
  Moon,
  Sun,
} from "lucide-react";
import type { UserProfile } from "../../types";
import { Avatar } from "../ui/Avatar";
import { Logo } from "../ui/Logo";
import { useTheme } from "../ui/ThemeProvider";

interface NavbarProps {
  user: UserProfile;
  currentTab: string;
  onSelectTab: (tab: string) => void;
  onOpenCommandPalette: () => void;
  onOpenNotifications: () => void;
  onLogout?: () => void;
  pendingAuditCount?: number;
}

export const Navbar: React.FC<NavbarProps> = ({
  user,
  currentTab,
  onSelectTab,
  onOpenCommandPalette,
  onOpenNotifications,
  onLogout,
  pendingAuditCount = 0,
}) => {
  const [showLogoutConfirm, setShowLogoutConfirm] = useState(false);
  const { theme, setTheme } = useTheme();

  const getPrimaryTab = (tab: string) => {
    if (tab === "feed" || tab === "landing") return "feed";
    if (tab === "challenge-specs" || tab === "spec-writer") return "challenge-specs";
    if (tab === "practice") return "practice";
    if (tab === "audit") return "audit";
    if (tab === "guilds") return "guilds";
    if (
      tab === "portfolio" ||
      tab === "recruiter" ||
      tab === "settings" ||
      tab === "identity"
    )
      return "portfolio";
    if (tab === "simulation") return "simulation";
    return "feed";
  };

  const activePrimary = getPrimaryTab(currentTab);

  const primaryNavItems = [
    { id: "feed", label: "FEED", targetScreen: "feed" },
    { id: "challenge-specs", label: "CHALLENGES", targetScreen: "challenge-specs" },
    { id: "practice", label: "PRACTICE", targetScreen: "practice" },
    { id: "simulation", label: "SIMULATION", targetScreen: "simulation" },
    { id: "audit", label: "PEER AUDIT", targetScreen: "audit", badgeCount: pendingAuditCount },
    { id: "guilds", label: "GUILDS", targetScreen: "guilds" },
  ];

  return (
    <header className="sticky top-0 z-40 w-full border-b recessed-meter">
      <div className="mx-auto flex h-14 max-w-7xl items-center justify-between px-4 sm:px-6 lg:px-8">
        <div className="flex items-center gap-6 lg:gap-8">
          <button
            onClick={() => onSelectTab("landing")}
            className="flex items-center gap-3 text-left transition hover:opacity-90 shrink-0 py-1"
          >
            <Logo size="md" light={theme === 'dark'} />
          </button>

          <nav className="hidden md:flex items-center gap-0">
            {primaryNavItems.map((item) => {
              const isActive = activePrimary === item.id;
              return (
                <button
                  key={item.id}
                  onClick={() => onSelectTab(item.targetScreen)}
                  className={`flex items-center gap-2 rounded-none px-3.5 py-2 text-xs uppercase font-medium tracking-wider transition border-b-2 ${
                    isActive
                      ? "border-theme-ink text-theme-ink"
                      : "border-transparent text-theme-ink/60 hover:text-theme-ink hover:border-theme-ink/30"
                  }`}
                >
                  <span>{item.label}</span>
                  {item.badgeCount && item.badgeCount > 0 ? (
                    <span className="rounded-none bg-[#1D1F23] text-theme-base px-1.5 py-0.5 text-xs font-mono font-bold">
                      {item.badgeCount}
                    </span>
                  ) : null}
                </button>
              );
            })}
          </nav>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={() => setTheme(theme === 'dark' ? 'light' : 'dark')}
            className="flex items-center justify-center tactile-btn-secondary min-h-8 min-w-10 rounded-none transition"
            aria-label="Toggle Theme"
          >
            {theme === 'dark' ? (
              <Sun className="h-4 w-4 text-theme-ink" />
            ) : (
              <Moon className="h-4 w-4 text-theme-ink" />
            )}
          </button>

          <button
            onClick={onOpenCommandPalette}
            className="hidden sm:flex items-center gap-2 rounded-none chassis-plate px-3 py-1.5 text-xs uppercase font-medium tracking-wider text-theme-ink hover:bg-theme-surface transition"
          >
            <Search className="h-3.5 w-3.5" />
            <span className="font-mono text-xs">SEARCH</span>
            <kbd className="rounded-none recessed-meter px-1.5 py-0.5 font-mono text-xs text-theme-ink">
              ⌘K
            </kbd>
          </button>

          <div className="flex items-center gap-1.5 rounded-none chassis-plate px-2.5 py-1.5 text-xs font-mono tabular-nums font-bold text-theme-ink">
            <span>{user.streakDays ?? 0}D</span>
          </div>

          <button
            onClick={onOpenNotifications}
            className="relative rounded-none p-2.5 min-h-11 min-w-11 text-theme-ink hover:bg-theme-surface transition border border-transparent hover:border-theme-ink"
            aria-label="Notifications"
          >
            <Bell className="h-4 w-4" />
            <span className="absolute top-2 right-2 h-1.5 w-1.5 rounded-full bg-[#1D1F23]" aria-hidden />
          </button>

          <button
            onClick={() => onSelectTab("portfolio")}
            className="flex items-center transition hover:opacity-90 rounded-none border border-theme-ink"
            aria-label="Public Proof Profile"
          >
            <Avatar src={user.avatarUrl} alt="" className="h-8 w-8 rounded-none" />
          </button>

          {onLogout && (
            <button
              onClick={() => setShowLogoutConfirm(true)}
              className="rounded-none p-2.5 min-h-11 min-w-11 text-theme-ink hover:bg-theme-surface transition border border-transparent hover:border-theme-ink"
              aria-label="Sign out"
            >
              <LogOut className="h-4 w-4" />
            </button>
          )}
        </div>
      </div>

      <div className="flex md:hidden border-t chassis-plate px-2 py-1.5 overflow-x-auto whitespace-nowrap scrollbar-none gap-1.5">
        {primaryNavItems.map((item) => {
          const isActive = activePrimary === item.id;
          return (
            <button
              key={item.id}
              onClick={() => onSelectTab(item.targetScreen)}
              className={`flex items-center gap-1.5 rounded-none px-3 py-1.5 text-xs uppercase font-medium tracking-wider shrink-0 ${
                isActive
                  ? "bg-[#1D1F23] text-theme-base font-bold"
                  : "text-theme-ink/70 hover:text-theme-ink"
              }`}
            >
              <span>{item.label}</span>
              {item.badgeCount && item.badgeCount > 0 ? (
                <span className="rounded-none bg-theme-base text-theme-ink px-1.5 py-0.2 text-[10px] font-mono font-bold">
                  {item.badgeCount}
                </span>
              ) : null}
            </button>
          );
        })}
      </div>

      {showLogoutConfirm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-theme-base/60 backdrop-blur-sm p-4">
          <div className="floating-card w-full max-w-sm p-6 space-y-4">
            <div>
              <h3 className="text-sm font-bold uppercase tracking-wider text-theme-ink">CONFIRM SIGN OUT</h3>
              <p className="mt-1 text-xs text-theme-ink">END CURRENT NAPSED SESSION?</p>
            </div>
            <p className="text-xs text-theme-ink leading-relaxed">
              You will need to re-authenticate with GitHub to access workspaces and audit
              submissions.
            </p>
            <div className="flex items-center justify-end gap-3 pt-2">
              <button
                onClick={() => setShowLogoutConfirm(false)}
                className="tactile-btn-secondary rounded-none px-4 py-2 text-xs uppercase font-medium tracking-wider text-theme-ink"
              >
                CANCEL
              </button>
              <button
                onClick={() => {
                  setShowLogoutConfirm(false);
                  onLogout?.();
                }}
                className="tactile-btn-danger rounded-none px-4 py-2 text-xs uppercase font-bold tracking-wider text-[#FFF]"
              >
                SIGN OUT
              </button>
            </div>
          </div>
        </div>
      )}
    </header>
  );
};
