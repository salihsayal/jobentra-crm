import ThemeToggle from './ThemeToggle';

const NAV_ITEMS = [
  { key: 'dashboard', label: 'Dashboard', icon: '\u25A0' },
  { key: 'candidates', label: 'Kandidaten', icon: '\uD83D\uDC64' },
  { key: 'customers', label: 'Kunden', icon: '\uD83C\uDFE2' },
  { key: 'jobs', label: 'Jobs', icon: '\uD83D\uDCBC' },
  { key: 'billings', label: 'Billing', icon: '\uD83D\uDCC4' },
];

export default function Sidebar({ currentView, onNavigate, theme, onToggleTheme }) {
  return (
    <aside style={{ width: 220 }} className="flex flex-col bg-app-bg-sidebar border-r border-app-border h-full">
      <nav className="flex-1 px-2 py-4 space-y-1">
        {NAV_ITEMS.map(item => (
          <button
            key={item.key}
            onClick={() => onNavigate(item.key)}
            className={`w-full flex items-center gap-3 px-3 py-2 rounded-md text-sm transition-colors ${
              currentView === item.key
                ? 'bg-app-accent text-white font-medium'
                : 'text-app-text-muted hover:bg-app-bg-hover hover:text-app-text-main'
            }`}
          >
            <span className="text-base">{item.icon}</span>
            <span>{item.label}</span>
          </button>
        ))}
      </nav>

      <div className="px-2 py-3 border-t border-app-border">
        <ThemeToggle theme={theme} onToggle={onToggleTheme} />
      </div>
    </aside>
  );
}
