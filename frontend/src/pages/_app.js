import '@/styles/globals.css';
import { useEffect } from 'react';
import { getStoredTheme, applyTheme } from '@/utils/theme';

export default function App({ Component, pageProps }) {
  useEffect(() => {
    const mode = getStoredTheme();
    applyTheme(mode);
    fetch('/api/customers?size=1').catch(() => {});
  }, []);

  return <Component {...pageProps} />;
}
