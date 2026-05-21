import '@/styles/globals.css';
import { useEffect } from 'react';
import { getStoredTheme, applyTheme } from '@/utils/theme';
import { restoreFromStorage } from '@/utils/mockData';

export default function App({ Component, pageProps }) {
  useEffect(() => {
    const mode = getStoredTheme();
    applyTheme(mode);
    restoreFromStorage();
  }, []);

  return <Component {...pageProps} />;
}
