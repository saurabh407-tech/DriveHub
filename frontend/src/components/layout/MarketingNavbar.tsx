import { useState, useEffect, useRef } from 'react';
import { Link, NavLink, useLocation, useNavigate } from 'react-router-dom';
import { ChevronDown, User, LogOut, LayoutDashboard, Car, Menu, X } from 'lucide-react';
import { useAppDispatch, useAppSelector } from '@/hooks/useAppRedux';
import { logoutUser } from '@/redux/slices/authSlice';
import { dashboardPathForRole } from '@/routes/roleRedirect';

const NAV_ITEMS = [
  { id: 'home', label: 'Home', to: '/', sectionId: 'home' },
  { id: 'vehicles', label: 'Vehicles', to: '/vehicles' },
  { id: 'how-it-works', label: 'How It Works', to: '/', sectionId: 'how-it-works' },
  { id: 'features', label: 'Features', to: '/features', sectionId: 'features' },
  { id: 'about', label: 'About', to: '/about', sectionId: 'about' },
  { id: 'contact', label: 'Contact', to: '/contact', sectionId: 'contact' },
];

export function MarketingNavbar() {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [userDropdownOpen, setUserDropdownOpen] = useState(false);
  const [isScrolled, setIsScrolled] = useState(false);
  const [activeSection, setActiveSection] = useState<string>('home');

  const location = useLocation();
  const navigate = useNavigate();
  const dispatch = useAppDispatch();
  const { user } = useAppSelector((s) => s.auth);

  const dropdownRef = useRef<HTMLDivElement>(null);

  // Smooth scroll-driven navbar transformation
  useEffect(() => {
    const handleScroll = () => {
      setIsScrolled(window.scrollY > 25);
    };

    window.addEventListener('scroll', handleScroll, { passive: true });
    handleScroll();
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  // Track active section on home page so ONLY ONE item is highlighted at any time
  useEffect(() => {
    if (location.pathname !== '/') {
      return;
    }

    const sections = ['contact', 'about', 'features', 'how-it-works', 'home'];
    const handleScrollSpy = () => {
      if (window.scrollY < 200) {
        setActiveSection('home');
        return;
      }
      const scrollPosition = window.scrollY + 140;
      for (const sectionId of sections) {
        const el = document.getElementById(sectionId);
        if (el) {
          const top = el.offsetTop;
          if (scrollPosition >= top) {
            setActiveSection(sectionId);
            return;
          }
        }
      }
      setActiveSection('home');
    };

    window.addEventListener('scroll', handleScrollSpy, { passive: true });
    handleScrollSpy();
    return () => window.removeEventListener('scroll', handleScrollSpy);
  }, [location.pathname]);

  // Determine precisely if an item is active (guarantees exactly one active item)
  const isItemActive = (item: (typeof NAV_ITEMS)[0]) => {
    if (location.pathname === '/vehicles') {
      return item.id === 'vehicles';
    }
    if (location.pathname === '/features') {
      return item.id === 'features';
    }
    if (location.pathname === '/about') {
      return item.id === 'about';
    }
    if (location.pathname === '/contact') {
      return item.id === 'contact';
    }
    if (location.pathname === '/') {
      return activeSection === item.id;
    }
    return false;
  };

  // Close user dropdown on outside click
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setUserDropdownOpen(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Section anchor scroll or route navigation
  const handleNavClick = (e: React.MouseEvent, item: (typeof NAV_ITEMS)[0]) => {
    // If attempting to browse vehicles without being logged in, redirect to register with alert
    if (item.to === '/vehicles' && !user) {
      e.preventDefault();
      navigate('/register', {
        state: {
          from: '/vehicles',
          alert: 'Please sign up or log in first to view listed vehicles. Account creation is required to browse our fleet.',
        },
      });
      setMobileMenuOpen(false);
      return;
    }

    if (item.sectionId && location.pathname === '/') {
      setActiveSection(item.id);
      const el = document.getElementById(item.sectionId);
      if (el) {
        e.preventDefault();
        el.scrollIntoView({ behavior: 'smooth' });
        setMobileMenuOpen(false);
        return;
      }
    } else if (item.sectionId && location.pathname !== '/') {
      e.preventDefault();
      navigate(`/#${item.sectionId}`);
      setMobileMenuOpen(false);
      return;
    }
    setMobileMenuOpen(false);
  };

  const handleLogout = async () => {
    setUserDropdownOpen(false);
    setMobileMenuOpen(false);
    await dispatch(logoutUser());
    navigate('/', { replace: true });
  };

  return (
    <header
      className={`sticky top-0 z-40 w-full transition-all duration-300 ${
        isScrolled
          ? 'bg-[#06090e]/85 backdrop-blur-2xl border-b border-white/10 py-2 sm:py-2.5 shadow-[0_15px_35px_rgba(0,0,0,0.7)]'
          : 'bg-gradient-to-b from-black/60 via-black/30 to-transparent backdrop-blur-md border-b border-white/[0.08] py-2.5 sm:py-3.5'
      }`}
    >
      <div className="mx-auto flex max-w-[92rem] items-center justify-between px-3 sm:px-6 lg:px-8">
        {/* Left Side: Brand Logo */}
        <Link
          to="/"
          className="flex items-center -ml-1 sm:-ml-2 lg:-ml-3 transition-transform duration-200 hover:scale-[1.03]"
        >
          <img
            src="/drivehub-logo.png"
            alt="DriveHub"
            className="h-14 sm:h-[60px] lg:h-[66px] w-auto object-contain drop-shadow"
          />
        </Link>

        {/* Center: Desktop Navigation Links Capsule */}
        <nav className="hidden items-center gap-1 lg:flex rounded-full border border-white/15 bg-[#0a0f18]/65 p-1 backdrop-blur-2xl shadow-[0_8px_30px_rgba(0,0,0,0.6),inset_0_1px_1px_rgba(255,255,255,0.15)]">
          {NAV_ITEMS.map((item) => {
            const isActive = isItemActive(item);

            return (
              <NavLink
                key={item.id}
                to={item.to}
                onClick={(e) => handleNavClick(e, item)}
                className={`relative px-4 py-1.5 text-xs sm:text-sm font-medium rounded-full transition-all duration-200 ${
                  isActive
                    ? 'text-white bg-white/[0.14] shadow-sm font-bold border border-white/15'
                    : 'text-white/70 hover:text-white hover:bg-white/[0.08]'
                }`}
              >
                {item.label}
                {isActive && (
                  <span className="absolute bottom-0.5 left-3.5 right-3.5 h-[2.5px] rounded-full bg-gradient-to-r from-amber-400 via-orange-400 to-amber-300 shadow-[0_0_10px_rgba(255,176,32,0.9)]" />
                )}
              </NavLink>
            );
          })}
        </nav>

        {/* Right Side: Primary CTA & Auth State Actions */}
        <div className="hidden sm:flex items-center gap-2.5">
          {/* Primary Automotive Rental CTA Button */}
          <Link
            to={user ? '/vehicles' : '/register'}
            state={
              user
                ? undefined
                : {
                    from: '/vehicles',
                    alert: 'Please sign up or log in first to view listed vehicles. Account creation is required to browse our fleet.',
                  }
            }
            className="group flex items-center gap-1.5 rounded-full bg-gradient-to-r from-amber-400 via-amber-500 to-orange-500 hover:from-amber-300 hover:to-orange-400 px-4 py-2 text-xs sm:text-sm font-extrabold text-black shadow-[0_0_20px_rgba(255,176,32,0.35)] hover:shadow-[0_0_28px_rgba(255,176,32,0.55)] transition-all duration-200 hover:scale-[1.03] active:scale-[0.98]"
          >
            <Car className="h-4 w-4 transition-transform group-hover:rotate-6" />
            <span>Browse Vehicles</span>
          </Link>

          {/* Authenticated User Menu */}
          {user ? (
            <div className="relative" ref={dropdownRef}>
              <button
                type="button"
                onClick={() => setUserDropdownOpen((v) => !v)}
                className="flex items-center gap-2 rounded-xl border border-white/15 bg-white/[0.08] hover:bg-white/15 px-3 py-1.5 text-xs font-medium text-white transition-all backdrop-blur-md"
              >
                <div className="flex h-6 w-6 items-center justify-center rounded-lg bg-amber-500/25 border border-amber-400/30 text-amber-300 font-bold text-xs uppercase">
                  {user.name ? user.name.charAt(0) : 'U'}
                </div>
                <span className="max-w-[100px] truncate text-white/90">
                  {user.name ? user.name.split(' ')[0] : 'Account'}
                </span>
                <span className="rounded bg-white/10 px-1.5 py-0.5 text-[9px] uppercase font-semibold text-white/60">
                  {user.role}
                </span>
                <ChevronDown className={`h-3.5 w-3.5 text-white/60 transition-transform ${userDropdownOpen ? 'rotate-180' : ''}`} />
              </button>

              {/* Glassmorphic Dropdown */}
              {userDropdownOpen && (
                <div className="absolute right-0 mt-2 w-56 rounded-2xl border border-white/20 bg-black/90 p-2 shadow-2xl backdrop-blur-2xl text-xs z-50">
                  <div className="px-3 py-2 border-b border-white/10 mb-1">
                    <p className="font-semibold text-white truncate">{user.name}</p>
                    <p className="text-[11px] text-white/60 truncate">{user.email}</p>
                  </div>

                  <Link
                    to={dashboardPathForRole(user.role)}
                    onClick={() => setUserDropdownOpen(false)}
                    className="flex items-center gap-2 rounded-xl px-3 py-2 text-white/80 hover:bg-white/10 hover:text-white transition-colors"
                  >
                    <LayoutDashboard className="h-4 w-4 text-amber-400" />
                    <span>Dashboard</span>
                  </Link>

                  <Link
                    to={user.role === 'owner' ? '/owner/bookings' : '/customer/bookings'}
                    onClick={() => setUserDropdownOpen(false)}
                    className="flex items-center gap-2 rounded-xl px-3 py-2 text-white/80 hover:bg-white/10 hover:text-white transition-colors"
                  >
                    <Car className="h-4 w-4 text-emerald-400" />
                    <span>My Bookings</span>
                  </Link>

                  <button
                    type="button"
                    onClick={handleLogout}
                    className="w-full flex items-center gap-2 rounded-xl px-3 py-2 text-red-400 hover:bg-red-500/15 hover:text-red-300 transition-colors text-left mt-1 border-t border-white/10 pt-2"
                  >
                    <LogOut className="h-4 w-4" />
                    <span>Sign out</span>
                  </button>
                </div>
              )}
            </div>
          ) : (
            /* Guest / Public User Actions */
            <div className="flex items-center gap-1.5">
              <Link
                to="/login"
                className="rounded-xl px-3 py-2 text-xs sm:text-sm font-medium text-white/80 hover:bg-white/10 hover:text-white transition-colors"
              >
                Log in
              </Link>
              <Link
                to="/register"
                className="rounded-xl border border-white/15 bg-white/[0.08] hover:bg-white/15 px-3.5 py-2 text-xs sm:text-sm font-semibold text-white transition-all backdrop-blur-md"
              >
                List Fleet
              </Link>
            </div>
          )}
        </div>

        {/* Mobile Hamburger Button */}
        <div className="flex sm:hidden items-center gap-2">
          <Link
            to={user ? '/vehicles' : '/register'}
            state={
              user
                ? undefined
                : {
                    from: '/vehicles',
                    alert: 'Please sign up or log in first to view listed vehicles. Account creation is required to browse our fleet.',
                  }
            }
            className="flex items-center gap-1 rounded-lg bg-amber-500 px-2.5 py-1.5 text-xs font-bold text-black"
          >
            <Car className="h-3.5 w-3.5" />
            <span>Rent</span>
          </Link>

          <button
            type="button"
            onClick={() => setMobileMenuOpen((v) => !v)}
            className="flex h-9 w-9 items-center justify-center rounded-xl border border-white/15 bg-white/10 text-white transition-colors hover:bg-white/20"
            aria-label="Toggle Navigation Menu"
          >
            {mobileMenuOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
          </button>
        </div>
      </div>

      {/* Mobile Drawer / Glass Menu */}
      {mobileMenuOpen && (
        <div className="border-t border-white/15 bg-black/90 p-5 backdrop-blur-2xl sm:hidden">
          <nav className="flex flex-col gap-1.5">
            {NAV_ITEMS.map((item) => {
              const isActive = isItemActive(item);
              return (
                <NavLink
                  key={item.id}
                  to={item.to}
                  onClick={(e) => handleNavClick(e, item)}
                  className={`flex items-center justify-between rounded-xl px-4 py-2.5 text-sm font-medium transition-all ${
                    isActive
                      ? 'bg-amber-500/20 text-white border border-amber-500/40 font-semibold'
                      : 'text-white/75 hover:bg-white/10 hover:text-white'
                  }`}
                >
                  <div className="flex items-center gap-2">
                    {isActive && <span className="h-1.5 w-1.5 rounded-full bg-amber-400 animate-pulse" />}
                    <span>{item.label}</span>
                  </div>
                  <span className={`text-xs ${isActive ? 'text-amber-400 font-bold' : 'text-white/40'}`}>&rarr;</span>
                </NavLink>
              );
            })}

            <div className="my-2 border-t border-white/10" />

            {/* Mobile Auth Actions */}
            {user ? (
              <div className="flex flex-col gap-2">
                <div className="flex items-center gap-2 px-3 py-1.5 text-xs text-white/70">
                  <User className="h-3.5 w-3.5 text-amber-400" />
                  <span>Logged in as <strong className="text-white">{user.name}</strong></span>
                </div>
                <Link
                  to={dashboardPathForRole(user.role)}
                  onClick={() => setMobileMenuOpen(false)}
                  className="rounded-xl border border-white/15 bg-white/10 px-4 py-2.5 text-sm font-semibold text-white text-center"
                >
                  Go to Dashboard
                </Link>
                <button
                  type="button"
                  onClick={handleLogout}
                  className="rounded-xl border border-red-500/30 bg-red-500/10 px-4 py-2 text-sm font-semibold text-red-400 text-center"
                >
                  Log out
                </button>
              </div>
            ) : (
              <div className="flex flex-col gap-2 pt-1">
                <Link
                  to="/login"
                  onClick={() => setMobileMenuOpen(false)}
                  className="rounded-xl border border-white/15 bg-white/10 px-4 py-2.5 text-center text-sm font-semibold text-white"
                >
                  Log in
                </Link>
                <Link
                  to="/register"
                  onClick={() => setMobileMenuOpen(false)}
                  className="rounded-xl bg-gradient-to-r from-amber-500 to-orange-500 px-4 py-2.5 text-center text-sm font-bold text-black shadow-lg shadow-amber-500/25"
                >
                  Get started
                </Link>
              </div>
            )}
          </nav>
        </div>
      )}
    </header>
  );
}