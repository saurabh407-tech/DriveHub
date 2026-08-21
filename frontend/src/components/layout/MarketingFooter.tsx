import { Link } from 'react-router-dom';

const FOOTER_LINKS: Record<string, { label: string; to: string }[]> = {
  Product: [
    { label: 'Browse vehicles', to: '/vehicles' },
    { label: 'Features', to: '/features' },
    { label: 'List your vehicle', to: '/register' },
  ],
  Company: [
    { label: 'About us', to: '/about' },
    { label: 'Contact', to: '/contact' },
  ],
  Account: [
    { label: 'Log in', to: '/login' },
    { label: 'Create account', to: '/register' },
  ],
};

export function MarketingFooter() {
  return (
    <footer className="border-t border-paper-line bg-paper-soft">
      <div className="mx-auto max-w-6xl px-6 py-12">
        <div className="grid grid-cols-2 gap-8 sm:grid-cols-4">
          <div className="col-span-2 sm:col-span-1">
            <span className="font-display text-lg font-bold tracking-tight text-ink">DriveHub</span>
            <p className="mt-2 text-sm text-slate">
              Smart vehicle rental and fleet management, built for renters and owners alike.
            </p>
          </div>
          {Object.entries(FOOTER_LINKS).map(([heading, links]) => (
            <div key={heading}>
              <h3 className="text-xs font-semibold uppercase tracking-wider text-slate">{heading}</h3>
              <ul className="mt-3 flex flex-col gap-2">
                {links.map((link) => (
                  <li key={link.to}>
                    <Link to={link.to} className="text-sm text-ink/80 hover:text-ink">
                      {link.label}
                    </Link>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>
        <div className="mt-10 border-t border-paper-line pt-6 text-xs text-slate">
          © {new Date().getFullYear()} DriveHub. All rights reserved.
        </div>
      </div>
    </footer>
  );
}