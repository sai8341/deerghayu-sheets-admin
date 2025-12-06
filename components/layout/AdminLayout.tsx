import React, { useState, useEffect } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { 
  LayoutDashboard, 
  Users, 
  PlusCircle, 
  LogOut, 
  Leaf, 
  Menu,
  X,
  ChevronRight
} from 'lucide-react';
import { useAuthStore } from '../../store/authStore';

export const AdminLayout: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { user, logout } = useAuthStore();
  const navigate = useNavigate();
  const location = useLocation();
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  // Close mobile menu on route change
  useEffect(() => {
    setIsMobileMenuOpen(false);
  }, [location.pathname]);

  const handleLogout = () => {
    logout();
    navigate('/admin/login');
  };

  const menuItems = [
    { name: 'Dashboard', icon: LayoutDashboard, path: '/admin/dashboard' },
    { name: 'Patients', icon: Users, path: '/admin/patients' },
    { name: 'Register Patient', icon: PlusCircle, path: '/admin/patients/new' },
  ];

  const isActive = (path: string) => location.pathname === path || (path !== '/admin/dashboard' && location.pathname.startsWith(path));

  const SidebarContent = () => (
    <div className="flex flex-col h-full bg-white border-r border-gray-200">
        <div className="h-16 flex items-center px-6 border-b border-gray-100">
           <Leaf className="h-6 w-6 text-ayur-600 mr-2" />
           <span className="font-serif font-bold text-lg text-gray-800 tracking-tight">EMR Admin</span>
        </div>
        
        <div className="flex-1 py-6 flex flex-col gap-1 px-3 overflow-y-auto">
          {menuItems.map((item) => {
            const active = isActive(item.path);
            return (
              <Link
                key={item.path}
                to={item.path}
                className={`flex items-center px-3 py-2.5 rounded-lg text-sm font-medium transition-all group relative ${
                  active
                    ? 'bg-ayur-50 text-ayur-700'
                    : 'text-gray-600 hover:bg-gray-50 hover:text-gray-900'
                }`}
              >
                <item.icon size={18} className={`mr-3 ${active ? 'text-ayur-600' : 'text-gray-400 group-hover:text-gray-600'}`} />
                {item.name}
                {active && <ChevronRight size={16} className="ml-auto text-ayur-400" />}
              </Link>
            );
          })}
        </div>

        <div className="p-4 border-t border-gray-100 bg-gray-50/50">
            <div className="flex items-center mb-4 px-2">
                <img 
                    src={user?.avatar || `https://ui-avatars.com/api/?name=${user?.name}&background=random`} 
                    alt="Avatar" 
                    className="h-9 w-9 rounded-full bg-gray-200 object-cover border border-gray-200 shadow-sm" 
                />
                <div className="ml-3 overflow-hidden">
                    <p className="text-sm font-semibold text-gray-900 truncate">{user?.name}</p>
                    <p className="text-xs text-gray-500 capitalize truncate">{user?.role}</p>
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
    </div>
  );

  return (
    <div className="min-h-screen bg-gray-50 flex">
      {/* Desktop Sidebar */}
      <aside className="hidden md:block w-64 fixed inset-y-0 z-20">
        <SidebarContent />
      </aside>

      {/* Mobile Sidebar Overlay */}
      {isMobileMenuOpen && (
        <div className="fixed inset-0 z-50 md:hidden">
          <div className="fixed inset-0 bg-gray-900/50 backdrop-blur-sm transition-opacity" onClick={() => setIsMobileMenuOpen(false)}></div>
          <div className="fixed inset-y-0 left-0 w-64 bg-white shadow-xl transform transition-transform duration-300 ease-out flex flex-col">
             <div className="absolute top-0 right-0 -mr-12 pt-4">
               <button onClick={() => setIsMobileMenuOpen(false)} className="ml-1 flex items-center justify-center h-10 w-10 rounded-full focus:outline-none">
                 <X className="h-6 w-6 text-white" />
               </button>
             </div>
             <SidebarContent />
          </div>
        </div>
      )}

      {/* Main Content */}
      <main className="flex-1 md:ml-64 flex flex-col min-h-screen w-full transition-all duration-300">
        {/* Top Header */}
        <header className="h-16 bg-white border-b border-gray-200 sticky top-0 z-30 flex items-center justify-between px-4 sm:px-6 shadow-sm">
             <div className="flex items-center">
                <button
                    type="button"
                    className="md:hidden -ml-2 mr-3 p-2 text-gray-500 hover:text-gray-900 hover:bg-gray-100 rounded-lg focus:outline-none"
                    onClick={() => setIsMobileMenuOpen(true)}
                >
                    <Menu className="h-6 w-6" />
                </button>
                <h1 className="text-lg font-bold text-gray-800 truncate">
                    {menuItems.find(i => isActive(i.path))?.name || 'Portal'}
                </h1>
            </div>
            {/* Optional Header Actions */}
            <div className="flex items-center gap-3">
                 <div className="hidden sm:block text-xs text-gray-400">
                    {new Date().toLocaleDateString(undefined, {weekday: 'long', year: 'numeric', month: 'long', day: 'numeric'})}
                 </div>
            </div>
        </header>

        <div className="flex-1 p-4 sm:p-6 lg:p-8 overflow-x-hidden">
          {children}
        </div>
      </main>
    </div>
  );
};