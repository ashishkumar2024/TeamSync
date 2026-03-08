import { Outlet, NavLink } from 'react-router-dom';
import { NotificationsDropdown } from './NotificationsDropdown';

export function Layout() {
  return (
    <div className="min-h-screen flex bg-slate-100">
      <aside className="w-64 bg-slate-900 text-white flex flex-col">
        <div className="p-4 text-xl font-semibold">TeamSync</div>
        <nav className="flex-1 px-2 space-y-1">
          <NavLink
            to="/"
            end
            className={({ isActive }) =>
              `block px-3 py-2 rounded-md text-sm font-medium ${
                isActive ? 'bg-slate-800' : 'hover:bg-slate-800'
              }`
            }
          >
            Dashboard
          </NavLink>
          <NavLink
            to="/projects"
            className={({ isActive }) =>
              `block px-3 py-2 rounded-md text-sm font-medium ${
                isActive ? 'bg-slate-800' : 'hover:bg-slate-800'
              }`
            }
          >
            Projects
          </NavLink>
          <NavLink
            to="/tasks"
            className={({ isActive }) =>
              `block px-3 py-2 rounded-md text-sm font-medium ${
                isActive ? 'bg-slate-800' : 'hover:bg-slate-800'
              }`
            }
          >
            Tasks
          </NavLink>
          <NavLink
            to="/notifications"
            className={({ isActive }) =>
              `block px-3 py-2 rounded-md text-sm font-medium ${
                isActive ? 'bg-slate-800' : 'hover:bg-slate-800'
              }`
            }
          >
            Notifications
          </NavLink>
          <NavLink
            to="/profile"
            className={({ isActive }) =>
              `block px-3 py-2 rounded-md text-sm font-medium ${
                isActive ? 'bg-slate-800' : 'hover:bg-slate-800'
              }`
            }
          >
            Profile
          </NavLink>
        </nav>
      </aside>
      <main className="flex-1 flex flex-col">
        <header className="h-14 bg-white border-b flex items-center justify-end px-4">
          <NotificationsDropdown />
        </header>
        <section className="flex-1 p-6">
          <Outlet />
        </section>
      </main>
    </div>
  );
}

