import { useState } from "react";
import { createPortal } from "react-dom";
import { LogOut, Menu, Moon, Search, Sun } from "lucide-react";

import { useAuth } from "../context/AuthContext";
import { useTheme } from "../hooks/useTheme";

export default function Navbar({ onMenuClick }) {
  const { logout, user } = useAuth();
  const { isDark, toggleTheme } = useTheme();
  const [confirmOpen, setConfirmOpen] = useState(false);

  function handleConfirmSignOut() {
    setConfirmOpen(false);
    logout();
  }

  return (
    <header className="sticky top-0 z-20 border-b border-line bg-mist/95 backdrop-blur dark:border-edge dark:bg-night/95">
      <div className="flex h-16 items-center gap-3 px-4 md:px-6">
        <button
          type="button"
          onClick={onMenuClick}
          className="focus-ring inline-flex h-10 w-10 items-center justify-center rounded-md border border-line bg-white text-ink md:hidden dark:border-edge dark:bg-panel dark:text-fog"
          aria-label="Open navigation"
        >
          <Menu size={20} />
        </button>
        <div className="hidden min-w-0 flex-1 items-center gap-2 rounded-md border border-line bg-white px-3 py-2 md:flex dark:border-edge dark:bg-panel">
          <Search size={18} className="text-ink/45 dark:text-fog/45" />
          <span className="text-sm text-ink/55 dark:text-fog/55">Search, review, and manage employee operations</span>
        </div>
        <div className="ml-auto flex items-center gap-3">
          <button
            type="button"
            onClick={toggleTheme}
            className="focus-ring inline-flex h-10 w-10 items-center justify-center rounded-md border border-line bg-white text-ink dark:border-edge dark:bg-panel dark:text-fog"
            aria-label={isDark ? "Switch to light mode" : "Switch to dark mode"}
            aria-pressed={isDark}
            title={isDark ? "Switch to light mode" : "Switch to dark mode"}
          >
            {isDark ? <Sun size={18} /> : <Moon size={18} />}
          </button>
          <div className="hidden text-right sm:block">
            <p className="text-sm font-semibold text-ink dark:text-fog">{user?.username || "Admin"}</p>
            <p className="text-xs uppercase tracking-normal text-ink/50 dark:text-fog/50">{user?.role || "admin"}</p>
          </div>
          <button
            type="button"
            onClick={() => setConfirmOpen(true)}
            className="focus-ring inline-flex h-10 items-center gap-2 rounded-md bg-ink px-3 text-sm font-semibold text-white dark:bg-pine"
          >
            <LogOut size={16} />
            <span className="hidden sm:inline">Sign out</span>
          </button>
        </div>
      </div>

      {confirmOpen &&
        createPortal(
          <div
            className="fixed inset-0 z-50 flex items-center justify-center p-4"
            role="dialog"
            aria-modal="true"
            aria-labelledby="signout-dialog-title"
          >
            <button
              type="button"
              className="absolute inset-0 bg-ink/35 dark:bg-black/55"
              onClick={() => setConfirmOpen(false)}
              aria-label="Cancel sign out"
            />
            <div className="relative w-full max-w-sm rounded-lg border border-line bg-white p-6 shadow-lg dark:border-edge dark:bg-panel">
              <h2 id="signout-dialog-title" className="text-base font-semibold text-ink dark:text-fog">
                Sign out
              </h2>
              <p className="mt-2 text-sm text-ink/65 dark:text-fog/65">Are you sure you want to sign out?</p>
              <div className="mt-6 flex justify-end gap-3">
                <button
                  type="button"
                  onClick={() => setConfirmOpen(false)}
                  className="focus-ring inline-flex h-10 items-center rounded-md border border-line bg-white px-4 text-sm font-semibold text-ink dark:border-edge dark:bg-panel dark:text-fog"
                >
                  Cancel
                </button>
                <button
                  type="button"
                  onClick={handleConfirmSignOut}
                  className="focus-ring inline-flex h-10 items-center gap-2 rounded-md bg-ink px-4 text-sm font-semibold text-white dark:bg-pine"
                >
                  <LogOut size={16} />
                  Sign out
                </button>
              </div>
            </div>
          </div>,
          document.body,
        )}
    </header>
  );
}
