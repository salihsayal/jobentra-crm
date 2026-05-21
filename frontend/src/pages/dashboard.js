import { useState, useCallback, useEffect } from 'react';
import { useRouter } from 'next/router';
import Topbar from '@/components/Topbar';
import Sidebar from '@/components/Sidebar';
import Canvas from '@/components/Canvas';
import { toggleTheme as toggleThemeUtil, getStoredTheme } from '@/utils/theme';
import { searchAllEntities } from '@/utils/mockData';

export default function Dashboard() {
  const router = useRouter();
  const [theme, setTheme] = useState('dark');
  const [currentView, setCurrentView] = useState('dashboard');
  const [selectedEntity, setSelectedEntity] = useState(null);
  const [omniQuery, setOmniQuery] = useState('');
  const [omniResults, setOmniResults] = useState(null);
  const [omniVisible, setOmniVisible] = useState(false);

  useEffect(() => {
    setTheme(getStoredTheme());
  }, []);

  const handleToggleTheme = useCallback(() => {
    setTheme(prev => {
      const next = toggleThemeUtil(prev);
      return next;
    });
  }, []);

  const handleNavigate = useCallback((view) => {
    setCurrentView(view);
    setSelectedEntity(null);
    if (view !== 'search') {
      setOmniQuery('');
      setOmniResults(null);
      setOmniVisible(false);
    }
  }, []);

  const handleOmniChange = useCallback((value) => {
    setOmniQuery(value);
    if (value.trim().length >= 2) {
      const results = searchAllEntities(value);
      setOmniResults(results);
      setOmniVisible(true);
    } else {
      setOmniResults(null);
      setOmniVisible(false);
    }
  }, []);

  const handleOmniSelect = useCallback((type, data) => {
    setSelectedEntity({ type, data });
    setOmniQuery('');
    setOmniResults(null);
    setOmniVisible(false);
  }, []);

  const handleRowClick = useCallback((view, row) => {
    let type = 'customer';
    if (view === 'candidates') type = 'candidate';
    else if (view === 'jobs') type = 'job';
    else if (view === 'billings') type = 'billing';
    setSelectedEntity({ type, data: row });
  }, []);

  const handleBack = useCallback(() => {
    setSelectedEntity(null);
  }, []);

  useEffect(() => {
    async function checkAuth() {
      try {
        const res = await fetch('/api/customers?size=1', { credentials: 'include' });
        if (!res.ok) router.push('/');
      } catch {
        router.push('/');
      }
    }
    checkAuth();
  }, [router]);

  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: '100vh', overflow: 'hidden' }}>
      <Topbar
        omniQuery={omniQuery}
        onOmniChange={handleOmniChange}
        omniResults={omniVisible ? omniResults : null}
        onOmniSelect={handleOmniSelect}
      />
      <div style={{ display: 'flex', flex: 1, overflow: 'hidden' }}>
        <Sidebar
          currentView={currentView}
          onNavigate={handleNavigate}
          theme={theme}
          onToggleTheme={handleToggleTheme}
        />
        <main style={{ flex: 1, overflow: 'auto', padding: 24, background: 'var(--bg-canvas)' }}>
          <Canvas
            currentView={currentView}
            omniResults={omniVisible ? omniResults : null}
            selectedEntity={selectedEntity}
            onRowClick={handleRowClick}
            onBack={handleBack}
            onOmniSelect={handleOmniSelect}
          />
        </main>
      </div>
    </div>
  );
}
