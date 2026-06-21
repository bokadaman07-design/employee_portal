import { useState } from "react";
import { LogOut, Menu, Search } from "lucide-react";

import { useAuth } from "../context/AuthContext";

export default function Navbar({ onMenuClick }) {
  const { logout, user } = useAuth();
  const [confirmOpen, setConfirmOpen] = useState(false);

  function handleConfirmSignOut() {
    setConfirmOpen(false);
    logout();
  }

  return (
    <header className="sticky top-0 z-20 border-b border-line bg-mist/95 backdrop-blur">
      <div className="flex h-16 items-center gap-3 px-4 md:px-6">
        <button
          type="button"
          onClick={onMenuClick}
          className="focus-ring inline-flex h-10 w-10 items-center justify-center rounded-md border border-line bg-white text-ink md:hidden"
          aria-label="Open navigation"
        >
          <Menu size={20} />
        </button>
        <div className="hidden min-w-0 flex-1 items-center gap-2 rounded-md border border-line bg-white px-3 py-2 md:flex">
          <Search size={18} className="text-ink/45" />
          <span className="text-sm text-ink/55">Search, review, and manage employee operations</span>
        </div>
        <div className="ml-auto flex items-center gap-3">
          <div className="hidden text-right sm:block">
            <p className="text-sm font-semibold text-ink">{user?.username || "Admin"}</p>
            <p className="text-xs uppercase tracking-normal text-ink/50">{user?.role || "admin"}</p>
          </div>
          <button
            type="button"
            onClick={() => setConfirmOpen(true)}
            className="focus-ring inline-flex h-10 items-center gap-2 rounded-md bg-ink px-3 text-sm font-semibold text-white"
          >
            <LogOut size={16} />
            <span className="hidden sm:inline">Sign out</span>
          </button>
        </div>
      </div>

      {confirmOpen && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center p-4"
          role="dialog"
          aria-modal="true"
          aria-labelledby="signout-dialog-title"
        >
          <button
            type="button"
            className="absolute inset-0 bg-ink/35"
            onClick={() => setConfirmOpen(false)}
            aria-label="Cancel sign out"
          />
          <div className="relative w-full max-w-sm rounded-lg border border-line bg-white p-6 shadow-lg">
            <h2 id="signout-dialog-title" className="text-base font-semibold text-ink">
              Sign out
            </h2>
            <p className="mt-2 text-sm text-ink/65">Are you sure you want to sign out?</p>
            <div className="mt-6 flex justify-end gap-3">
              <button
                type="button"
                onClick={() => setConfirmOpen(false)}
                className="focus-ring inline-flex h-10 items-center rounded-md border border-line bg-white px-4 text-sm font-semibold text-ink"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleConfirmSignOut}
                className="focus-ring inline-flex h-10 items-center gap-2 rounded-md bg-ink px-4 text-sm font-semibold text-white"
              >
                <LogOut size={16} />
                Sign out
              </button>
            </div>
          </div>
        </div>
      )}
    </header>
  );
}
