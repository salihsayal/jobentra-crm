const THEME_KEY = 'jobentra-theme';

export function getStoredTheme() {
  if (typeof window === 'undefined') return 'dark';
  return localStorage.getItem(THEME_KEY) || 'dark';
}

export function setStoredTheme(mode) {
  if (typeof window === 'undefined') return;
  localStorage.setItem(THEME_KEY, mode);
}

export function applyTheme(mode) {
  if (typeof document === 'undefined') return;
  const root = document.documentElement;
  if (mode === 'light') {
    root.classList.add('theme-light');
  } else {
    root.classList.remove('theme-light');
  }
}

export function toggleTheme(mode) {
  const next = mode === 'dark' ? 'light' : 'dark';
  applyTheme(next);
  setStoredTheme(next);
  return next;
}
