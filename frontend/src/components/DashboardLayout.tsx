import React from 'react';
import { useNavigate, useLocation, Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { 
  Calendar, 
  CheckSquare, 
  Award, 
  Compass,
  LogOut, 
  Menu, 
  X,
  ChevronRight,
  Shield
} from 'lucide-react';

export const DashboardLayout: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const [mobileMenuOpen, setMobileMenuOpen] = React.useState(false);

  if (!user) {
    navigate('/login');
    return null;
  }

  const menuItems = [
    { name: 'Events', path: '/dashboard', icon: Calendar, roles: ['SUPER_ADMIN', 'DEPARTMENT_ADMIN', 'VOLUNTEER'] },
    { name: 'Tasks', path: '/dashboard/tasks', icon: CheckSquare, roles: ['SUPER_ADMIN', 'DEPARTMENT_ADMIN', 'VOLUNTEER'] },
    { name: 'Strategy Plan', path: '/dashboard/strategy', icon: Compass, roles: ['SUPER_ADMIN', 'DEPARTMENT_ADMIN', 'VOLUNTEER'] },
    { name: 'Certificates', path: '/dashboard/certificates', icon: Award, roles: ['SUPER_ADMIN', 'DEPARTMENT_ADMIN'] },
  ];

  const filteredMenuItems = menuItems.filter(item => item.roles.includes(user.role));

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  const getRoleLabel = (role: string) => {
    switch (role) {
      case 'SUPER_ADMIN':
        return 'State Admin';
      case 'DEPARTMENT_ADMIN':
        return 'Dept Admin';
      case 'VOLUNTEER':
        return 'Volunteer Coord';
      default:
        return 'Volunteer';
    }
  };

  const SidebarContent = () => (
    <>
      {/* Sidebar Header Brand */}
      <div className="p-5 border-b border-gray-border">
        <div className="flex items-center gap-3">
          <img
            src="/logo.png"
            alt="Tamil Nadu Volunteers Logo"
            className="w-10 h-10 rounded-full object-contain border-2 border-primary-mid shadow-soft"
          />
          <div>
            <h1 className="font-serif font-bold text-sm text-primary tracking-wide leading-tight">தமிழ்நாடு தன்னார்வலர்கள்</h1>
            <p className="text-[10px] text-accent-hover tracking-wider font-bold uppercase mt-0.5">Volunteer Portal</p>
          </div>
        </div>
      </div>

      {/* User Card */}
      <div className="p-4 mx-3 mt-4 mb-2 rounded-xl bg-primary-light border border-primary-mid">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-full bg-primary text-white font-bold flex justify-center items-center text-sm shadow">
            {user.name.charAt(0)}
          </div>
          <div className="overflow-hidden">
            <h4 className="font-semibold text-sm text-gray-dark truncate">{user.name}</h4>
            <div className="flex items-center gap-1 mt-0.5">
              <Shield className="w-3 h-3 text-primary" />
              <span className="text-[10px] font-bold text-primary uppercase tracking-wider">{getRoleLabel(user.role)}</span>
            </div>
          </div>
        </div>
        {user.departmentName && (
          <div className="mt-2 text-[10px] bg-white border border-primary-mid text-gray-dark px-2 py-1 rounded-lg font-medium truncate">
            {user.departmentName}
          </div>
        )}
      </div>

      {/* Sidebar Menu Navigation */}
      <nav className="flex-1 px-3 py-3 space-y-1">
        {filteredMenuItems.map((item) => {
          const Icon = item.icon;
          const isActive = location.pathname === item.path || (item.path !== '/dashboard' && location.pathname.startsWith(item.path));
          return (
            <Link
              key={item.name}
              to={item.path}
              className={`flex items-center justify-between px-4 py-3 rounded-xl font-medium text-sm transition-all duration-150 ${
                isActive
                  ? 'bg-primary text-white font-bold shadow-soft'
                  : 'text-gray-dark hover:bg-primary-light hover:text-primary'
              }`}
            >
              <div className="flex items-center gap-3">
                <Icon className="w-5 h-5" />
                <span>{item.name}</span>
              </div>
              {isActive && <ChevronRight className="w-4 h-4 opacity-70" />}
            </Link>
          );
        })}
      </nav>

      {/* Sidebar Footer Logout */}
      <div className="p-3 border-t border-gray-border">
        <button
          onClick={handleLogout}
          className="w-full flex items-center gap-3 px-4 py-3 text-sm text-gray-medium hover:text-danger hover:bg-danger-light font-medium rounded-xl transition-all duration-150"
        >
          <LogOut className="w-5 h-5" />
          <span>Sign Out</span>
        </button>
      </div>
    </>
  );

  return (
    <div className="min-h-screen flex bg-background">
      {/* SIDEBAR FOR DESKTOP — white, light, with green accents */}
      <aside className="hidden md:flex flex-col w-64 bg-white border-r border-gray-border flex-shrink-0 shadow-soft">
        <SidebarContent />
      </aside>

      {/* MAIN CONTAINER */}
      <div className="flex-1 flex flex-col min-w-0">
        {/* TOP HEADER */}
        <header className="bg-white border-b border-gray-border px-6 py-3.5 flex items-center justify-between shadow-card">
          {/* Mobile Menu trigger */}
          <button
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            className="md:hidden p-2 rounded-lg hover:bg-primary-light text-primary transition-all"
          >
            {mobileMenuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
          </button>

          {/* Mobile title */}
          <h2 className="text-base font-serif font-bold text-primary tracking-wide block md:hidden">
            TN Volunteer Platform
          </h2>

          {/* Desktop breadcrumb title */}
          <h2 className="text-xl font-serif font-bold text-primary tracking-wide hidden md:flex items-center gap-2">
            <span className="w-1 h-6 bg-accent rounded-full inline-block"></span>
            Dashboard
          </h2>

          {/* Desktop User Info */}
          <div className="hidden md:flex items-center gap-3">
            <div className="text-right">
              <span className="block text-sm font-semibold text-gray-dark">{user.name}</span>
              <span className="block text-[10px] font-bold text-primary uppercase tracking-wider">{getRoleLabel(user.role)}</span>
            </div>
            <div className="w-9 h-9 rounded-full bg-primary text-white font-bold text-sm flex justify-center items-center shadow">
              {user.name.charAt(0)}
            </div>
          </div>
        </header>

        {/* MOBILE SIDEBAR OVERLAY */}
        {mobileMenuOpen && (
          <div className="md:hidden fixed inset-0 z-50 flex">
            <div
              className="fixed inset-0 bg-gray-dark/30 backdrop-blur-sm"
              onClick={() => setMobileMenuOpen(false)}
            />
            <aside className="relative flex flex-col w-64 max-w-sm bg-white border-r border-gray-border h-full shadow-premium">
              <div className="absolute top-4 right-4">
                <button
                  onClick={() => setMobileMenuOpen(false)}
                  className="p-1.5 rounded-full hover:bg-primary-light text-gray-medium"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>
              <SidebarContent />
            </aside>
          </div>
        )}

        {/* MAIN CONTENT */}
        <main className="flex-grow p-6 overflow-y-auto max-w-7xl w-full mx-auto">
          {children}
        </main>
      </div>
    </div>
  );
};
