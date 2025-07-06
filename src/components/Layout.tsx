import React, { useState } from 'react';
import { Outlet, Link, useLocation } from 'react-router-dom';
import { 
   Users, BarChart3, Calendar, CheckSquare, Settings, 
  Menu, X, Sun, Moon, LogOut, User, FileText, Receipt,
  Sparkles, MessageSquare // Sparkles ikonunu import et
} from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';
import { useTheme } from '../contexts/ThemeContext';

export const Layout: React.FC = () => {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const { user, logout } = useAuth();
  const { isDark, toggleTheme } = useTheme();
  const location = useLocation();

  const navigation = [
    { name: 'Dashboard', href: '/dashboard', icon: BarChart3 },
    { name: 'Müşteriler', href: '/customers', icon: Users },
    { name: 'Teklifler', href: '/proposals', icon: FileText },
    { name: 'Toplantılar', href: '/meetings', icon: Calendar },
    { name: 'Görevler', href: '/tasks', icon: CheckSquare },
    { name: 'Giderler', href: '/expenses', icon: Receipt },
    { name: 'AI Müşteri Uzmanı', href: '/ai-uzman', icon: Sparkles },
    { name: 'WhatsApp', href: '/whatsapp', icon: MessageSquare }, // YENİ MENÜ ELEMANI
    { name: 'Yönetim', href: '/admin', icon: Settings },
  ];

  return (
    <div className="h-screen flex overflow-hidden bg-gray-100 dark:bg-gray-900">
      {/* Mobile sidebar backdrop */}
      {sidebarOpen && (
        <div 
          className="fixed inset-0 flex z-40 md:hidden animate-fade-in"
          onClick={() => setSidebarOpen(false)}
        >
          <div className="fixed inset-0 bg-gray-600 bg-opacity-75 backdrop-blur-sm" />
        </div>
      )}

      {/* Sidebar */}
      <div className={`${
        sidebarOpen ? 'translate-x-0' : '-translate-x-full'
      } fixed inset-y-0 left-0 z-50 w-64 bg-white dark:bg-gray-800 shadow-2xl transition-transform duration-300 ease-in-out md:translate-x-0 md:static md:inset-0`}>
        
        {/* Sidebar header */}
        <div className="flex items-center justify-between h-16 px-4 bg-gradient-to-r from-blue-600 to-purple-600 shadow-lg">
          <div className="flex items-center">
            <div className="flex-shrink-0 hover:scale-105 transition-transform duration-200">
              <div className="w-8 h-8 bg-white rounded-xl flex items-center justify-center shadow-lg">
                <span className="text-blue-600 font-bold text-lg">A</span>
              </div>
            </div>
            <div className="ml-3">
              <h1 className="text-white font-semibold text-lg">Agency CRM</h1>
              <p className="text-blue-100 text-xs">Ultimate Edition</p>
            </div>
          </div>
          
          <button
            onClick={() => setSidebarOpen(false)}
            className="md:hidden text-white hover:bg-blue-700 p-1 rounded-lg transition-colors duration-200"
          >
            <X className="w-6 h-6" />
          </button>
        </div>

        {/* Navigation */}
        <nav className="mt-5 px-2">
          <div className="space-y-1">
            {navigation.map((item) => {
              const isActive = location.pathname === item.href || 
                             (item.href === '/customers' && location.pathname.startsWith('/customers'));
              
              return (
                <Link
                  key={item.name}
                  to={item.href}
                  className="group"
                  onClick={() => setSidebarOpen(false)}
                >
                  <div className={`${
                      isActive
                        ? 'bg-gradient-to-r from-blue-500 to-purple-600 text-white shadow-lg transform translate-x-1'
                        : 'text-gray-600 hover:bg-gray-50 hover:text-gray-900 dark:text-gray-300 dark:hover:bg-gray-700 dark:hover:text-white hover:translate-x-1'
                    } group flex items-center px-4 py-3 text-sm font-medium rounded-xl transition-all duration-200 mx-2`}
                  >
                    <item.icon className={`${
                      isActive ? 'text-white' : 'text-gray-400 group-hover:text-gray-500 dark:text-gray-400'
                    } mr-3 flex-shrink-0 h-5 w-5`} />
                    {item.name}
                  </div>
                </Link>
              );
            })}
          </div>
        </nav>

        {/* User section */}
        <div className="absolute bottom-0 left-0 right-0 p-4 border-t border-gray-200 dark:border-gray-700">
          <div className="flex items-center justify-between">
            <div className="flex items-center">
              <div className="flex-shrink-0">
                <div className="w-10 h-10 bg-gradient-to-r from-blue-500 to-purple-600 rounded-xl flex items-center justify-center shadow-lg">
                  <User className="w-5 h-5 text-white" />
                </div>
              </div>
              <div className="ml-3">
                <p className="text-sm font-medium text-gray-700 dark:text-gray-200">
                  {user?.username}
                </p>
                <p className="text-xs text-gray-500 dark:text-gray-400 capitalize">
                  {user?.role}
                </p>
              </div>
            </div>
            
            <div className="flex items-center space-x-2">
              <button
                onClick={toggleTheme}
                className="p-2 rounded-xl text-gray-400 hover:text-gray-600 dark:text-gray-500 dark:hover:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 transition-all duration-200 hover:scale-110"
              >
                {isDark ? <Sun className="w-4 h-4" /> : <Moon className="w-4 h-4" />}
              </button>
              
              <button
                onClick={logout}
                className="p-2 rounded-xl text-gray-400 hover:text-red-600 dark:text-gray-500 dark:hover:text-red-400 hover:bg-red-50 dark:hover:bg-red-900 transition-all duration-200 hover:scale-110"
              >
                <LogOut className="w-4 h-4" />
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Main content */}
      <div className="flex flex-col w-0 flex-1 overflow-hidden">
        {/* Mobile header */}
        <div className="md:hidden">
          <div className="relative z-10 flex-shrink-0 flex h-16 bg-white dark:bg-gray-800 shadow-lg">
            <button
              onClick={() => setSidebarOpen(true)}
              className="px-4 border-r border-gray-200 dark:border-gray-700 text-gray-500 focus:outline-none focus:ring-2 focus:ring-inset focus:ring-blue-500 md:hidden"
            >
              <Menu className="h-6 w-6" />
            </button>
            
            <div className="flex-1 px-4 flex justify-between items-center">
              <h1 className="text-lg font-semibold text-gray-900 dark:text-white">
                Agency CRM
              </h1>
              
              <div className="flex items-center space-x-2">
                <button
                  onClick={toggleTheme}
                  className="p-2 rounded-xl text-gray-400 hover:text-gray-600 dark:text-gray-500 dark:hover:text-gray-300 hover:scale-110 transition-all duration-200"
                >
                  {isDark ? <Sun className="w-5 h-5" /> : <Moon className="w-5 h-5" />}
                </button>
              </div>
            </div>
          </div>
        </div>

        {/* Page content */}
        <main className="flex-1 relative overflow-y-auto focus:outline-none">
          <div className="py-6">
            <div className="max-w-7xl mx-auto px-4 sm:px-6 md:px-8">
              <Outlet />
            </div>
          </div>
        </main>
      </div>
    </div>
  );
};