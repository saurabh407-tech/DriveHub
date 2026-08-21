



import { useState } from 'react';
import { Link, NavLink } from 'react-router-dom';
import { Button } from '@/components/ui/Button';

const NAV_LINKS = [
  { label: 'Home', to: '/' },
  { label: 'Features', to: '/features' },
  { label: 'About Us', to: '/about' },
  { label: 'Contact', to: '/contact' },
];

export function MarketingNavbar() {
  const [open, setOpen] = useState(false);

  return (
    <header className="sticky top-0 z-30 border-b border-paper-line bg-gradient-to-br from-[#eac6ed] via-[#d6c3d3] to-[#fafafa] backdrop-blur">
      {/* <div className="mx-auto flex max-w-6xl items-center justify-between px-6 py-4"> */}
      <div className="relative flex w-full items-center px-6 py-4">

       {/* DriveHub Logo */}
<Link
  to="/"
  className="flex items-center transition-all duration-300 hover:scale-105"
>
  {/* Logo Image */}
  <img
    src="/drivehub-logo.png"
    alt="DriveHub Logo"
    className="h-11 w-11 ml-18 scale-700 rounded-xl object-contain"
  />
</Link>

        {/* Desktop Navigation */}
        {/* <nav className="hidden items-center gap-15 md:flex"> */}
        <nav className="absolute left-1/2 hidden -translate-x-1/2 items-center gap-15 md:flex">
          {NAV_LINKS.map((link) => (
            <NavLink
              key={link.to}
              to={link.to}
              end={link.to === '/'}
              className={({ isActive }) =>
                `rounded-xl px-5 py-2.5 text-base font-semibold transition-all duration-300 ${
                  isActive
                    ? 'scale-105 bg-white/70 text-[#4a235a] shadow-md'
                    : 'text-slate hover:scale-105 hover:bg-white/50 hover:text-[#4a235a] hover:shadow-sm'
                }`
              }
            >
              {link.label}
            </NavLink>
          ))}
        </nav>

        {/* Desktop Buttons */}
        <div className="hidden ml-auto items-center gap-3 md:flex">
          <Link to="/login">
            <Button variant="ghost" size="sm">
              Log in
            </Button>
          </Link>

          <Link to="/register">
            <Button size="sm">
              Get started
            </Button>
          </Link>
        </div>

        {/* Mobile Menu Button */}
        <button
          className="flex h-10 w-10 items-center justify-center rounded-xl text-ink transition-all duration-300 hover:scale-105 hover:bg-white/50 md:hidden"
          onClick={() => setOpen((v) => !v)}
          aria-label="Toggle menu"
          aria-expanded={open}
        >
          <svg
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="1.7"
            className="h-6 w-6"
            aria-hidden="true"
          >
            {open ? (
              <path
                d="M6 6l12 12M6 18L18 6"
                strokeLinecap="round"
              />
            ) : (
              <path
                d="M4 7h16M4 12h16M4 17h16"
                strokeLinecap="round"
              />
            )}
          </svg>
        </button>
      </div>

      {/* Mobile Navigation */}
      {open && (
        <div className="border-t border-paper-line bg-white/30 px-6 py-5 backdrop-blur-md md:hidden">
          <nav className="flex flex-col gap-3">
            {NAV_LINKS.map((link) => (
              <NavLink
                key={link.to}
                to={link.to}
                end={link.to === '/'}
                onClick={() => setOpen(false)}
                className={({ isActive }) =>
                  `rounded-xl px-5 py-3 text-base font-semibold transition-all ${
                    isActive
                      ? 'bg-white/70 text-[#4a235a] shadow-md'
                      : 'text-ink hover:bg-white/50'
                  }`
                }
              >
                {link.label}
              </NavLink>
            ))}

            <div className="mt-3 flex flex-col gap-2">
              <Link to="/login" onClick={() => setOpen(false)}>
                <Button variant="ghost" size="sm" fullWidth>
                  Log in
                </Button>
              </Link>

              <Link to="/register" onClick={() => setOpen(false)}>
                <Button size="sm" fullWidth>
                  Get started
                </Button>
              </Link>
            </div>
          </nav>
        </div>
      )}
    </header>
  );
}