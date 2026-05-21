import '@/styles/globals.css';
import { useEffect } from 'react';
import { getStoredTheme, applyTheme } from '@/utils/theme';

export default function App({ Component, pageProps }) {
  useEffect(() => {
    const mode = getStoredTheme();
    applyTheme(mode);
  }, []);

  return <Component {...pageProps} />;
}
