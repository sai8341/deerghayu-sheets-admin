import React from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { 
  LayoutDashboard, 
  Users, 
  PlusCircle, 
  LogOut, 
  Leaf, 
  Search,
  Settings
} from 'lucide-react';
import { useAuthStore } from '../../store/authStore';

export const AdminLayout: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { user, logout } = useAuthStore();
  const navigate = useNavigate();
  const location = useLocation();

  const handleLogout = () => {
    logout();
    navigate('/admin/login');
  };

  const menuItems = [
    { name: 'Dashboard', icon: LayoutDashboard, path: '/admin/dashboard' },
    { name: 'Patients', icon: Users, path: '/admin/patients' },
    { name: 'Register Patient', icon: PlusCircle, path: '/admin/patients/new' },
  ];

  const isActive = (path: string) => location.pathname === path;

  return (
    <div className="min-h-screen bg-gray-50 flex">
      {/* Sidebar */}
      <aside className="w-64 bg-white border-r border-gray-200 fixed h-full z-10 hidden md:flex flex-col">
        <div className="h-16 flex items-center px-6 border-b border-gray-100">
           <Leaf className="h-6 w-6 text-ayur-600 mr-2" />
           <span className="font-serif font-bold text-lg text-gray-800">EMR Admin</span>
        </div>
        
        <div className="flex-1 py-6 flex flex-col gap-1 px-3">
          {menuItems.map((item) => (
            <Link
              key={item.path}
              to={item.path}
              className={`flex items-center px-3 py-2.5 rounded-lg text-sm font-medium transition-colors ${
                isActive(item.path)
                  ? 'bg-ayur-50 text-ayur-700'
                  : 'text-gray-600 hover:bg-gray-50 hover:text-gray-900'
              }`}
            >
              <item.icon size={18} className="mr-3" />
              {item.name}
            </Link>
          ))}
        </div>

        <div className="p-4 border-t border-gray-100">
            <div className="flex items-center mb-4 px-2">
                <img src={user?.avatar || "https://i.pravatar.cc/150"} alt="Avatar" className="h-8 w-8 rounded-full bg-gray-200" />
                <div className="ml-3">
                    <p className="text-sm font-medium text-gray-900">{user?.name}</p>
                    <p className="text-xs text-gray-500 capitalize">{user?.role}</p>
                </div>
            </div>
          <button
            onClick={handleLogout}
            className="flex w-full items-center px-3 py-2 text-sm font-medium text-red-600 hover:bg-red-50 rounded-lg transition-colors"
          >
            <LogOut size={18} className="mr-3" />
            Sign Out
          </button>
        </div>
      </aside>

      {/* Main Content */}
      <main className="flex-1 md:ml-64 flex flex-col min-h-screen">
        {/* Top Header */}
        <header className="h-16 bg-white border-b border-gray-200 sticky top-0 z-20 flex items-center justify-between px-4 sm:px-6">
            <h1 className="text-xl font-serif font-semibold text-gray-800">
                {menuItems.find(i => i.path === location.pathname)?.name || 'Portal'}
            </h1>
            <div className="md:hidden flex items-center">
                {/* Mobile Menu Toggle would go here */}
            </div>
        </header>

        <div className="flex-1 p-4 sm:p-6 lg:p-8 overflow-y-auto">
          {children}
        </div>
      </main>
    </div>
  );
};