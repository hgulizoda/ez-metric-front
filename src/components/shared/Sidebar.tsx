import { NavLink, useLocation } from 'react-router-dom';
import {
  LayoutDashboard,
  Users,
  Clock,
  BarChart3,
  FileText,
  Settings,
  ChevronLeft,
  ChevronRight,
  Truck,
  UserCircle,
  LogOut,
  ChevronDown,
  ChevronUp,
  CalendarClock,
  DollarSign,
  Gauge,
  ClipboardList,
  AlertTriangle,
  UserCheck,
  Eye,
  Banknote,
  Monitor,
  Layers,
  Building2,
  Briefcase,
} from 'lucide-react';
import { useState } from 'react';
import { useAuth } from '@/services/hooks/useAuth';
import clsx from 'clsx';

interface SidebarProps {
  collapsed: boolean;
  onToggle: () => void;
}

interface NavItem {
  label: string;
  icon: React.ReactNode;
  path: string;
  badge?: string;
  badgeColor?: string;
  children?: { label: string; path: string; icon: React.ReactNode }[];
}

interface NavSection {
  title: string;
  items: NavItem[];
}

const NAV_SECTIONS: NavSection[] = [
  {
    title: 'TRACK',
    items: [
      { label: 'Dashboard', icon: <LayoutDashboard size={18} />, path: '/dashboard' },
      { label: 'Clock Records', icon: <Clock size={18} />, path: '/punches' },
      { label: 'Shifts', icon: <CalendarClock size={18} />, path: '/shifts' },
    ],
  },
  {
    title: 'FINANCE',
    items: [
      { label: 'Salary', icon: <DollarSign size={18} />, path: '/salary' },
      { label: 'Efficiency', icon: <Gauge size={18} />, path: '/efficiency' },
    ],
  },
  {
    title: 'REPORTS',
    items: [
      { label: 'Analytics', icon: <BarChart3 size={18} />, path: '/analytics' },
      {
        label: 'Reports',
        icon: <FileText size={18} />,
        path: '/reports',
        children: [
          { label: 'Timecard Detail', path: '/reports/timecard', icon: <Clock size={14} /> },
          { label: 'Totals Summary', path: '/reports/totals-summary', icon: <BarChart3 size={14} /> },
          { label: 'Jobs Report', path: '/reports/jobs', icon: <ClipboardList size={14} /> },
          { label: 'Authorization', path: '/reports/authorization', icon: <UserCheck size={14} /> },
          { label: 'Missed Punches', path: '/reports/missed-punches', icon: <AlertTriangle size={14} /> },
          { label: 'Exceptions', path: '/reports/exceptions', icon: <AlertTriangle size={14} /> },
          { label: 'Who Is In/Out', path: '/reports/who-is-in', icon: <Eye size={14} /> },
          { label: 'Payroll Export', path: '/reports/payroll', icon: <Banknote size={14} /> },
        ],
      },
    ],
  },
  {
    title: 'MANAGE',
    items: [
      { label: 'Employees', icon: <Users size={18} />, path: '/employees' },
      { label: 'Devices', icon: <Monitor size={18} />, path: '/devices' },
      { label: 'Shift Types', icon: <Layers size={18} />, path: '/shift-types' },
      { label: 'Departments', icon: <Building2 size={18} />, path: '/departments' },
      { label: 'Jobs', icon: <Briefcase size={18} />, path: '/jobs' },
    ],
  },
  {
    title: 'SETTINGS',
    items: [
      { label: 'Settings', icon: <Settings size={18} />, path: '/settings' },
    ],
  },
];

export function Sidebar({ collapsed, onToggle }: SidebarProps) {
  const location = useLocation();
  const { user, logout } = useAuth();
  const [showUserMenu, setShowUserMenu] = useState(false);
  const [expandedItems, setExpandedItems] = useState<Record<string, boolean>>({});

  const isActive = (path: string) => location.pathname === path;
  const isChildActive = (item: NavItem) =>
    item.children?.some((child) => location.pathname === child.path) ?? false;

  const toggleExpand = (path: string) => {
    setExpandedItems((prev) => ({ ...prev, [path]: !prev[path] }));
  };

  return (
    <div
      className={clsx(
        'flex flex-col h-full sidebar-transition relative z-50 flex-shrink-0',
        collapsed ? 'w-16' : 'w-64'
      )}
      style={{ backgroundColor: 'var(--bg-sidebar)', borderRight: '1px solid var(--border-color)' }}
    >
      {/* Logo */}
      <div className="flex items-center justify-between px-4 py-5 border-b border-white/5">
        {!collapsed && (
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl gradient-bg flex items-center justify-center flex-shrink-0">
              <Truck size={18} className="text-white" />
            </div>
            <div>
              <div className="gradient-text font-bold text-sm tracking-widest">EZ METRIC</div>
              <div className="text-xs text-gray-500 truncate max-w-[130px]">EZ Truck Repair LLC</div>
            </div>
          </div>
        )}
        {collapsed && (
          <div className="w-9 h-9 rounded-xl gradient-bg flex items-center justify-center mx-auto">
            <Truck size={18} className="text-white" />
          </div>
        )}

        {/* Toggle button - only show when not collapsed */}
        {!collapsed && (
          <button
            onClick={onToggle}
            className="p-1.5 rounded-lg hover:bg-white/5 transition-colors text-gray-400 hover:text-white ml-2 flex-shrink-0"
          >
            <ChevronLeft size={16} />
          </button>
        )}
      </div>

      {/* Collapsed toggle */}
      {collapsed && (
        <button
          onClick={onToggle}
          className="absolute -right-3 top-16 w-6 h-6 rounded-full gradient-bg flex items-center justify-center shadow-lg z-50 border border-indigo-500/30"
        >
          <ChevronRight size={12} className="text-white" />
        </button>
      )}

      {/* Nav sections */}
      <nav className="flex-1 overflow-y-auto py-4 scrollbar-thin">
        {NAV_SECTIONS.map((section) => (
          <div key={section.title} className="mb-4">
            {!collapsed && (
              <div className="px-4 py-1 text-xs font-semibold text-gray-500 tracking-widest mb-1">
                {section.title}
              </div>
            )}
            {section.items.map((item) => {
              const hasChildren = item.children && item.children.length > 0;
              const isExpanded = expandedItems[item.path] || isChildActive(item);
              const parentActive = isActive(item.path) || isChildActive(item);

              if (hasChildren && !collapsed) {
                return (
                  <div key={item.path}>
                    {/* Parent item - clickable to expand/collapse */}
                    <button
                      onClick={() => toggleExpand(item.path)}
                      className={clsx(
                        'w-full flex items-center gap-3 mx-2 mb-0.5 rounded-xl transition-all duration-150 group px-3 py-2',
                        parentActive
                          ? 'nav-item-active text-indigo-300'
                          : 'text-gray-400 hover:text-gray-200 hover:bg-white/5'
                      )}
                      style={{ width: 'calc(100% - 16px)' }}
                    >
                      <span
                        className={clsx(
                          'flex-shrink-0 transition-colors',
                          parentActive ? 'text-indigo-400' : 'text-gray-500 group-hover:text-gray-300'
                        )}
                      >
                        {item.icon}
                      </span>
                      <span className="text-sm font-medium">{item.label}</span>
                      <span className="ml-auto text-gray-500">
                        {isExpanded ? <ChevronUp size={14} /> : <ChevronDown size={14} />}
                      </span>
                    </button>

                    {/* Children */}
                    {isExpanded && (
                      <div className="ml-4 mt-0.5 mb-1">
                        {item.children!.map((child) => (
                          <NavLink
                            key={child.path}
                            to={child.path}
                            className={clsx(
                              'flex items-center gap-2.5 mx-2 mb-0.5 rounded-lg transition-all duration-150 group px-3 py-1.5',
                              location.pathname === child.path
                                ? 'text-indigo-300 bg-indigo-500/10'
                                : 'text-gray-500 hover:text-gray-300 hover:bg-white/5'
                            )}
                          >
                            <span
                              className={clsx(
                                'flex-shrink-0 transition-colors',
                                location.pathname === child.path
                                  ? 'text-indigo-400'
                                  : 'text-gray-600 group-hover:text-gray-400'
                              )}
                            >
                              {child.icon}
                            </span>
                            <span className="text-xs font-medium">{child.label}</span>
                          </NavLink>
                        ))}
                      </div>
                    )}
                  </div>
                );
              }

              // Regular nav item (no children, or collapsed)
              return (
                <NavLink
                  key={item.path}
                  to={hasChildren ? item.children![0].path : item.path}
                  className={({ isActive: active }) =>
                    clsx(
                      'flex items-center gap-3 mx-2 mb-0.5 rounded-xl transition-all duration-150 group',
                      collapsed ? 'px-2.5 py-2.5 justify-center' : 'px-3 py-2',
                      active || parentActive
                        ? 'nav-item-active text-indigo-300'
                        : 'text-gray-400 hover:text-gray-200 hover:bg-white/5'
                    )
                  }
                  title={collapsed ? item.label : undefined}
                >
                  <span
                    className={clsx(
                      'flex-shrink-0 transition-colors',
                      parentActive
                        ? 'text-indigo-400'
                        : 'text-gray-500 group-hover:text-gray-300'
                    )}
                  >
                    {item.icon}
                  </span>
                  {!collapsed && (
                    <span className="text-sm font-medium">{item.label}</span>
                  )}
                  {!collapsed && item.badge && (
                    <span
                      className={clsx(
                        'ml-auto text-xs px-1.5 py-0.5 rounded-full',
                        item.badgeColor || 'bg-indigo-500/20 text-indigo-300'
                      )}
                    >
                      {item.badge}
                    </span>
                  )}
                </NavLink>
              );
            })}
          </div>
        ))}
      </nav>

      {/* User section at bottom */}
      <div className="border-t border-white/5 p-3">
        <div
          className={clsx(
            'relative flex items-center gap-2.5 p-2 rounded-xl cursor-pointer hover:bg-white/5 transition-colors',
            collapsed && 'justify-center'
          )}
          onClick={() => setShowUserMenu(!showUserMenu)}
        >
          {/* Avatar */}
          <div className="w-8 h-8 rounded-full gradient-bg flex items-center justify-center flex-shrink-0 text-white text-xs font-bold">
            {user?.name?.charAt(0).toUpperCase() ?? 'U'}
          </div>

          {!collapsed && (
            <>
              <div className="flex-1 min-w-0">
                <div className="text-sm font-medium text-gray-200 truncate">{user?.name}</div>
                <div className="text-xs text-gray-500 capitalize">{user?.role}</div>
              </div>
              <ChevronDown size={14} className="text-gray-500 flex-shrink-0" />
            </>
          )}

          {/* User dropdown */}
          {showUserMenu && (
            <div
              className={clsx(
                'absolute bottom-full mb-2 rounded-xl shadow-xl z-50 overflow-hidden',
                collapsed ? 'left-14' : 'left-0 right-0'
              )}
              style={{
                backgroundColor: '#1a1d2e',
                border: '1px solid rgba(255,255,255,0.1)',
                minWidth: '180px',
              }}
            >
              <NavLink
                to="/profile"
                className="flex items-center gap-2 px-4 py-2.5 text-sm text-gray-300 hover:bg-white/5 hover:text-white transition-colors"
                onClick={() => setShowUserMenu(false)}
              >
                <UserCircle size={15} />
                My Profile
              </NavLink>
              <hr className="border-white/5" />
              <button
                className="w-full flex items-center gap-2 px-4 py-2.5 text-sm text-red-400 hover:bg-red-500/10 transition-colors"
                onClick={() => {
                  setShowUserMenu(false);
                  logout();
                }}
              >
                <LogOut size={15} />
                Sign Out
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
