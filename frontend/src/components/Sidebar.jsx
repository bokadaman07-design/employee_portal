import { CalendarDays, LayoutDashboard, Users } from "lucide-react";
import { NavLink } from "react-router-dom";

const links = [
  { to: "/", label: "Dashboard", icon: LayoutDashboard },
  { to: "/employees", label: "Employees", icon: Users },
  { to: "/leaves", label: "Leaves", icon: CalendarDays },
];

export default function Sidebar({ open, onClose }) {
  return (
    <>
      {open && <button className="fixed inset-0 z-30 bg-ink/35 md:hidden" onClick={onClose} aria-label="Close navigation" />}
      <aside
        className={`fixed inset-y-0 left-0 z-40 w-72 border-r border-line bg-white px-4 py-5 transition-transform md:static md:z-auto md:w-64 md:translate-x-0 ${
          open ? "translate-x-0" : "-translate-x-full"
        }`}
      >
        <div className="mb-8">
          <p className="text-xl font-semibold text-ink">Employee Tracker</p>
          <p className="mt-1 text-sm text-ink/55">People operations workspace</p>
        </div>
        <nav className="space-y-1">
          {links.map((link) => {
            const Icon = link.icon;
            return (
              <NavLink
                key={link.to}
                to={link.to}
                onClick={onClose}
                className={({ isActive }) =>
                  `focus-ring flex items-center gap-3 rounded-md px-3 py-2.5 text-sm font-medium ${
                    isActive ? "bg-pine text-white" : "text-ink/70 hover:bg-mist hover:text-ink"
                  }`
                }
              >
                <Icon size={18} />
                {link.label}
              </NavLink>
            );
          })}
        </nav>
      </aside>
    </>
  );
}
