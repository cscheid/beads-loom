/**
 * Main layout component
 */
import { Link, Outlet } from 'react-router-dom';
import { useUIStore } from '@/stores/uiStore';
import { UpdateNotification } from './UpdateNotification';

export function Layout() {
  const wsConnected = useUIStore((state) => state.wsConnected);

  return (
    <div className="min-h-screen bg-white">
      {/* Header */}
      <header className="bg-white border-b border-gray-200">
        <div className="px-6 py-4">
          <div className="flex items-center justify-between">
            <h1 className="text-2xl font-bold text-gray-900">Loom</h1>
            <div className="flex items-center gap-2">
              <div
                className={`w-2 h-2 rounded-full ${
                  wsConnected ? 'bg-green-500' : 'bg-red-500'
                }`}
                title={wsConnected ? 'Connected' : 'Disconnected'}
              />
              <span className="text-sm text-gray-600">
                {wsConnected ? 'Connected' : 'Disconnected'}
              </span>
            </div>
          </div>
        </div>
      </header>

      <div className="flex">
        {/* Sidebar */}
        <aside className="w-64 bg-white border-r border-gray-200 min-h-[calc(100vh-73px)]">
          <nav className="p-4 space-y-1">
            <NavLink to="/ready" label="Ready Work" />
            <NavLink to="/" label="All Issues" />
            <NavLink to="/graph" label="Visual Mode" />
          </nav>
        </aside>

        {/* Main content */}
        <main className="flex-1">
          <Outlet />
        </main>
      </div>

      {/* Update notification */}
      <UpdateNotification />
    </div>
  );
}

function NavLink({ to, label }: { to: string; label: string }) {
  return (
    <Link
      to={to}
      className="block px-4 py-2 text-gray-700 hover:bg-gray-100 rounded-md transition-colors"
    >
      {label}
    </Link>
  );
}
