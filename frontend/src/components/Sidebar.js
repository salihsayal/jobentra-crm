import { LayoutDashboard, Users, Building2, Briefcase, CreditCard } from 'lucide-react';
import ThemeToggle from './ThemeToggle';

const NAV_ITEMS = [
  { key: 'dashboard', label: 'Dashboard', Icon: LayoutDashboard },
  { key: 'candidates', label: 'Kandidaten', Icon: Users },
  { key: 'customers', label: 'Kunden', Icon: Building2 },
  { key: 'jobs', label: 'Jobs', Icon: Briefcase },
  { key: 'billings', label: 'Billing', Icon: CreditCard },
];

export default function Sidebar({ currentView, onNavigate, theme, onToggleTheme }) {
  return (
    <aside style={{ width: 220 }} className="flex flex-col bg-app-bg-sidebar border-r border-app-border h-full">
      <nav className="flex-1 px-2 py-4 space-y-0.5">
        {NAV_ITEMS.map(({ key, label, Icon }) => (
          <button
            key={key}
            onClick={() => onNavigate(key)}
            className={`w-full flex items-center gap-2.5 px-2.5 py-2 rounded-md text-sm transition-colors ${
              currentView === key
                ? 'bg-app-accent text-white font-medium'
                : 'text-app-text-muted hover:bg-app-bg-hover hover:text-app-text-main'
            }`}
          >
            <Icon size={17} />
            <span>{label}</span>
          </button>
        ))}
      </nav>

      <div className="px-1.5 py-3 border-t border-app-border">
        <ThemeToggle theme={theme} onToggle={onToggleTheme} />
      </div>
    </aside>
  );
}
