


import { useState, useEffect, type ReactNode } from 'react';
import { NavLink, useNavigate, useLocation, Link } from 'react-router-dom';
import { ArrowLeft, Menu, X } from 'lucide-react';
import clsx from 'clsx';
import { useAppDispatch, useAppSelector } from '@/hooks/useAppRedux';
import { logoutUser } from '@/redux/slices/authSlice';
import type { UserRole } from '@/services/authApi';
import { NotificationBell } from './NotificationBell';

interface NavItem {
  label: string;
  to: string;
  icon: ReactNode;
}

const ICONS = {
  overview: (
    <path
      d="M3 10.5 12 3l9 7.5M5 9.5V21h5v-6h4v6h5V9.5"
      strokeWidth="1.7"
      strokeLinecap="round"
      strokeLinejoin="round"
    />
  ),

  bookings: (
    <path
      d="M4 5h16v15H4zM4 9h16M8 3v4M16 3v4"
      strokeWidth="1.7"
      strokeLinecap="round"
      strokeLinejoin="round"
    />
  ),

  wallet: (
    <path
      d="M3 7a2 2 0 0 1 2-2h13a1 1 0 0 1 1 1v3M3 7v11a2 2 0 0 0 2 2h15a1 1 0 0 0 1-1v-6a1 1 0 0 0-1-1h-4a2 2 0 1 0 0 4h5"
      strokeWidth="1.7"
      strokeLinecap="round"
      strokeLinejoin="round"
    />
  ),

  vehicles: (
    <path
      d="M3 13l1.5-5A2 2 0 0 1 6.4 6.5h11.2A2 2 0 0 1 19.5 8L21 13v6a1 1 0 0 1-1 1h-1a1 1 0 0 1-1-1v-1H6v1a1 1 0 0 1-1 1H4a1 1 0 0 1-1-1zM5 13h14"
      strokeWidth="1.7"
      strokeLinecap="round"
      strokeLinejoin="round"
    />
  ),

  analytics: (
    <path
      d="M4 20V10M11 20V4M18 20v-7"
      strokeWidth="1.7"
      strokeLinecap="round"
      strokeLinejoin="round"
    />
  ),

  users: (
    <path
      d="M17 20v-2a4 4 0 0 0-4-4H7a4 4 0 0 0-4 4v2M10 10a4 4 0 1 0 0-8 4 4 0 0 0 0 8ZM20 20v-2a4 4 0 0 0-3-3.87M16 3.13a4 4 0 0 1 0 7.75"
      strokeWidth="1.7"
      strokeLinecap="round"
      strokeLinejoin="round"
    />
  ),

  disputes: (
    <path
      d="M12 9v4m0 4h.01M10.29 3.86 1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0Z"
      strokeWidth="1.7"
      strokeLinecap="round"
      strokeLinejoin="round"
    />
  ),

  messages: (
    <path
      d="M21 11.5a8.38 8.38 0 0 1-.9 3.8 8.5 8.5 0 0 1-7.6 4.7 8.38 8.38 0 0 1-3.8-.9L3 21l1.9-5.7a8.38 8.38 0 0 1-.9-3.8 8.5 8.5 0 0 1 4.7-7.6 8.38 8.38 0 0 1 3.8-.9h.5a8.48 8.48 0 0 1 8 8v.5z"
      strokeWidth="1.7"
      strokeLinecap="round"
      strokeLinejoin="round"
    />
  ),
};

const NAV_BY_ROLE: Record<UserRole, NavItem[]> = {
  customer: [
    {
      label: 'Overview',
      to: '/customer',
      icon: ICONS.overview,
    },
    {
      label: 'Bookings',
      to: '/customer/bookings',
      icon: ICONS.bookings,
    },
    {
      label: 'Messages',
      to: '/messages',
      icon: ICONS.messages,
    },
    {
      label: 'Wallet',
      to: '/customer/wallet',
      icon: ICONS.wallet,
    },
  ],

  owner: [
    {
      label: 'Overview',
      to: '/owner',
      icon: ICONS.overview,
    },
    {
      label: 'Vehicles',
      to: '/owner/vehicles',
      icon: ICONS.vehicles,
    },
    {
      label: 'Bookings',
      to: '/owner/bookings',
      icon: ICONS.bookings,
    },
    {
      label: 'Messages',
      to: '/messages',
      icon: ICONS.messages,
    },
    {
      label: 'Analytics',
      to: '/owner/analytics',
      icon: ICONS.analytics,
    },
  ],

  admin: [
    {
      label: 'Overview',
      to: '/admin',
      icon: ICONS.overview,
    },
    {
      label: 'Users',
      to: '/admin/users',
      icon: ICONS.users,
    },
    {
      label: 'Vehicles',
      to: '/admin/vehicles',
      icon: ICONS.vehicles,
    },
    {
      label: 'Disputes',
      to: '/admin/disputes',
      icon: ICONS.disputes,
    },
  ],
};

const ROLE_LABEL: Record<UserRole, string> = {
  customer: 'Customer Dashboard',
  owner: 'Vehicle Owner',
  admin: 'Administrator',
};

export function DashboardLayout({
  children,
}: {
  children: ReactNode;
}) {
  const dispatch = useAppDispatch();
  const navigate = useNavigate();
  const location = useLocation();

  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  const user = useAppSelector((s) => s.auth.user);

  const role = (user?.role || 'customer') as UserRole;
  const rootDashboardPath = '/' + role;
  const isRootDashboard = location.pathname === rootDashboardPath;

  const items = NAV_BY_ROLE[role] || NAV_BY_ROLE.customer;

  // Auto-close mobile drawer upon navigation
  useEffect(() => {
    setMobileMenuOpen(false);
  }, [location.pathname]);

  // Close mobile drawer on Escape key
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        setMobileMenuOpen(false);
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

  const onLogout = async () => {
    setMobileMenuOpen(false);
    await dispatch(logoutUser());

    navigate('/login', {
      replace: true,
    });
  };

  const renderSidebarContent = (isMobile = false) => (
    <>
      {/* DriveHub Logo & Mobile Close */}
      <div className="flex items-center justify-between gap-2">
        <Link
          to={rootDashboardPath}
          onClick={() => isMobile && setMobileMenuOpen(false)}
          className="flex-1 rounded-2xl border border-white/15 bg-white/10 p-3 sm:p-4 backdrop-blur-xl transition-transform hover:scale-[1.02] block cursor-pointer"
          title="Return to Main Dashboard"
        >
          <div className="flex items-center gap-3">
            <div className="flex h-11 w-11 sm:h-12 sm:w-12 items-center justify-center rounded-2xl bg-gradient-to-br from-[#ffc45d] via-[#ff9f2d] to-[#f56a3d] shadow-lg shadow-orange-950/30 flex-shrink-0">
              <img
                src="/drivehub-logo.png"
                alt="DriveHub Logo"
                className="h-8 w-8 sm:h-9 sm:w-9 object-contain"
              />
            </div>
            <div className="min-w-0">
              <h1 className="font-display text-lg sm:text-xl font-extrabold tracking-wide text-white truncate">
                Drive<span className="text-[#ffc15a]">Hub</span>
              </h1>
              <p className="mt-0.5 text-[10px] font-semibold uppercase tracking-[0.2em] text-purple-200 truncate">
                Smart Vehicle Rental
              </p>
            </div>
          </div>
        </Link>

        {isMobile && (
          <button
            type="button"
            onClick={() => setMobileMenuOpen(false)}
            className="flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-xl border border-white/20 bg-white/10 text-white transition-colors hover:bg-white/20 active:scale-95"
            aria-label="Close navigation menu"
          >
            <X className="h-5 w-5" />
          </button>
        )}
      </div>

      {/* Role Badge */}
      <div className="mt-4 px-3">
        <p className="text-[10px] font-bold uppercase tracking-[0.2em] text-purple-300">
          {ROLE_LABEL[role]}
        </p>
      </div>

      {/* Navigation */}
      <nav className="mt-3 flex flex-1 flex-col gap-1.5 overflow-y-auto pr-1">
        {items.map((item) => (
          <NavLink
            key={item.to}
            to={item.to}
            end={item.to === `/${role}`}
            onClick={() => isMobile && setMobileMenuOpen(false)}
            className={({ isActive }) =>
              clsx(
                'group relative flex items-center gap-3 overflow-hidden rounded-xl px-4 py-3 text-sm font-semibold transition-all duration-300',
                isActive
                  ? 'scale-[1.02] bg-gradient-to-r from-[#f4a83f] via-[#e8864c] to-[#c95e71] text-white shadow-xl shadow-black/30'
                  : 'text-purple-100 hover:translate-x-1 hover:bg-white/10 hover:text-white'
              )
            }
          >
            {/* Icon */}
            <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-white/10 transition-all duration-300 group-hover:scale-110 group-hover:bg-white/20 flex-shrink-0">
              <svg
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                className="h-[18px] w-[18px]"
                aria-hidden="true"
              >
                {item.icon}
              </svg>
            </span>

            {/* Label */}
            <span className="truncate">{item.label}</span>

            {/* Active indicator */}
            <span className="absolute right-3 h-2 w-2 rounded-full bg-white opacity-0 transition-opacity group-hover:opacity-100" />
          </NavLink>
        ))}
      </nav>

      {/* Bottom User Section */}
      <div className="mt-auto pt-3">
        <div className="border-t border-white/10 pt-3">
          {/* User Profile */}
          <Link
            to="/profile"
            onClick={() => isMobile && setMobileMenuOpen(false)}
            className="group flex items-center justify-between rounded-2xl border border-white/10 bg-white/10 p-3 backdrop-blur-xl transition-all duration-300 hover:bg-white/20 hover:border-white/25 hover:shadow-lg cursor-pointer"
            title="View and edit your profile"
          >
            <div className="flex items-center gap-3 min-w-0">
              <div className="flex h-10 w-10 flex-shrink-0 items-center justify-center overflow-hidden rounded-full bg-gradient-to-br from-[#ffc65c] to-[#f47a42] text-sm font-extrabold text-[#32193f] shadow-lg group-hover:scale-105 transition-transform">
                {user?.avatar?.url ? (
                  <img src={user.avatar.url} alt={user.name} className="h-full w-full object-cover" />
                ) : (
                  user?.name?.[0]?.toUpperCase() || '?'
                )}
              </div>

              <div className="min-w-0">
                <p className="truncate text-sm font-bold text-white group-hover:text-[#ffc65c] transition-colors">
                  {user?.name}
                </p>
                <p className="mt-0.5 truncate text-xs text-purple-200">
                  {user?.email}
                </p>
              </div>
            </div>

            <div className="text-purple-300 group-hover:text-white transition-colors pl-1 flex-shrink-0">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="h-4 w-4">
                <path d="M9 18l6-6-6-6" strokeLinecap="round" strokeLinejoin="round" />
              </svg>
            </div>
          </Link>

          {/* Logout */}
          <button
            onClick={onLogout}
            className="mt-2.5 flex w-full items-center gap-3 rounded-xl border border-white/10 bg-white/5 px-4 py-2.5 text-left text-sm font-semibold text-purple-100 transition-all duration-300 hover:bg-red-500/20 hover:text-white cursor-pointer"
          >
            <svg
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="1.8"
              className="h-5 w-5 flex-shrink-0"
            >
              <path
                d="M10 17l5-5-5-5M15 12H3M21 19V5a2 2 0 0 0-2-2h-6"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
            </svg>
            <span>Log out</span>
          </button>
        </div>
      </div>
    </>
  );

  return (
    <div className="flex min-h-screen overflow-hidden bg-gradient-to-br from-[#f8f4fa] via-[#e2c497] to-[#eee8f2]">
      {/* ================= DESKTOP SIDEBAR (Visible lg+) ================= */}
      <aside className="hidden lg:flex w-[280px] flex-shrink-0 flex-col border-r border-white/40 bg-gradient-to-b from-[#2d163d] via-[#4b235e] to-[#21132d] px-4 py-5 shadow-2xl">
        {renderSidebarContent(false)}
      </aside>

      {/* ================= MOBILE SLIDE-OVER DRAWER (Visible < lg) ================= */}
      {mobileMenuOpen && (
        <div
          className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs transition-opacity lg:hidden"
          onClick={() => setMobileMenuOpen(false)}
          aria-hidden="true"
        />
      )}

      <div
        className={clsx(
          'fixed inset-y-0 left-0 z-50 flex w-[280px] max-w-[85vw] flex-col border-r border-white/30 bg-gradient-to-b from-[#2d163d] via-[#4b235e] to-[#21132d] px-4 py-5 shadow-2xl transition-transform duration-300 ease-in-out lg:hidden',
          mobileMenuOpen ? 'translate-x-0' : '-translate-x-full'
        )}
      >
        {renderSidebarContent(true)}
      </div>

      {/* ================= MAIN AREA ================= */}
      <main className="flex min-w-0 flex-1 flex-col overflow-hidden">
        {/* Top Header */}
        <header className="relative z-40 flex h-16 sm:h-[72px] flex-shrink-0 items-center justify-between border-b border-[#ded4e2] bg-white/80 px-3 sm:px-6 lg:px-8 backdrop-blur-xl">
          <div className="flex items-center gap-2 sm:gap-4 min-w-0">
            {/* Hamburger button for mobile/tablet */}
            <button
              type="button"
              onClick={() => setMobileMenuOpen(true)}
              className="flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-xl border border-purple-200/80 bg-white/90 text-[#32193f] shadow-xs transition-colors hover:bg-white active:scale-95 lg:hidden cursor-pointer"
              aria-label="Open sidebar menu"
            >
              <Menu className="h-5 w-5 text-[#32193f]" />
            </button>

            {/* Back button or compact mobile actions */}
            {!isRootDashboard ? (
              <button
                type="button"
                onClick={() => navigate(rootDashboardPath)}
                className="inline-flex items-center gap-1.5 rounded-xl border border-purple-200/80 bg-white/80 px-2.5 sm:px-3.5 py-1.5 text-xs sm:text-sm font-semibold text-[#32193f] shadow-xs transition-all hover:bg-white hover:border-amber-400 hover:text-amber-600 active:scale-95 cursor-pointer flex-shrink-0"
                title="Return to Main Dashboard Overview"
              >
                <ArrowLeft className="h-4 w-4 text-amber-500" />
                <span className="hidden sm:inline">Back to Main Page</span>
                <span className="sm:hidden">Back</span>
              </button>
            ) : (
              <Link to={rootDashboardPath} className="flex items-center gap-2 lg:hidden flex-shrink-0">
                <div className="flex h-8 w-8 items-center justify-center rounded-xl bg-gradient-to-br from-[#ffc45d] via-[#ff9f2d] to-[#f56a3d]">
                  <img src="/drivehub-logo.png" alt="DriveHub" className="h-5 w-5 object-contain" />
                </div>
                <span className="font-display text-base font-extrabold text-[#2d163d]">
                  Drive<span className="text-[#f56a3d]">Hub</span>
                </span>
              </Link>
            )}

            {role === 'customer' && (
              <Link
                to="/vehicles"
                className="inline-flex items-center gap-1.5 rounded-xl border border-amber-300/80 bg-gradient-to-r from-amber-400/20 to-orange-400/20 px-2.5 sm:px-3.5 py-1.5 text-xs sm:text-sm font-bold text-amber-900 shadow-xs transition-all hover:from-amber-400/30 hover:to-orange-400/30 hover:border-amber-400 active:scale-95 flex-shrink-0"
              >
                <span>🚗 <span className="hidden xs:inline">Browse </span>Vehicles</span>
              </Link>
            )}
          </div>

          <div className="flex items-center gap-2 sm:gap-4 flex-shrink-0">
            <div className="hidden rounded-full border border-purple-100 bg-purple-50 px-4 py-2 text-xs font-semibold text-[#6e3d7c] md:block">
              ✨ Have a great journey
            </div>
            <NotificationBell />
            <Link
              to="/profile"
              className="flex h-9 w-9 items-center justify-center overflow-hidden rounded-full border border-purple-200 bg-gradient-to-br from-[#ffc65c] to-[#f47a42] text-xs font-extrabold text-[#32193f] shadow-xs hover:scale-105 active:scale-95 transition-transform"
              title="Your Profile"
            >
              {user?.avatar?.url ? (
                <img src={user.avatar.url} alt={user.name} className="h-full w-full object-cover" />
              ) : (
                user?.name?.[0]?.toUpperCase() || '?'
              )}
            </Link>
          </div>
        </header>

        {/* Page Content with responsive horizontal padding */}
        <div className="flex-1 overflow-y-auto">
          <div className="mx-auto w-full max-w-[1600px] px-3.5 sm:px-6 lg:px-8 py-4 sm:py-6 lg:py-8">
            {children}
          </div>
        </div>
      </main>
    </div>
  );
}