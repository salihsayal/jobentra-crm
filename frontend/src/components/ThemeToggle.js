export default function ThemeToggle({ theme, onToggle }) {
  return (
    <button
      onClick={onToggle}
      className="w-full flex items-center gap-2 px-3 py-2 rounded text-sm text-app-text-muted hover:bg-app-bg-hover transition-colors"
      title={theme === 'dark' ? 'Switch to Light Mode' : 'Switch to Dark Mode'}
    >
      <span className="text-lg">
        {theme === 'dark' ? '\u2600\uFE0F' : '\uD83C\uDF19'}
      </span>
      <span>{theme === 'dark' ? 'Light Mode' : 'Dark Mode'}</span>
    </button>
  );
}
