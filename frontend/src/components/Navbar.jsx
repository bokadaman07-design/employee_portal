import { LogOut, Menu, Search } from "lucide-react";

import { useAuth } from "../context/AuthContext";

export default function Navbar({ onMenuClick }) {
  const { logout, user } = useAuth();

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
            onClick={logout}
            className="focus-ring inline-flex h-10 items-center gap-2 rounded-md bg-coral px-3 text-sm font-semibold text-white"
          >
            <LogOut size={16} />
            <span className="hidden sm:inline">Sign out</span>
          </button>
        </div>
      </div>
    </header>
  );
}
