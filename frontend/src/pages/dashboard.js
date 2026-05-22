import { useState, useCallback, useEffect, useReducer } from 'react';
import { useRouter } from 'next/router';
import Topbar from '@/components/Topbar';
import Sidebar from '@/components/Sidebar';
import Canvas from '@/components/Canvas';
import { ToastProvider, showToast } from '@/components/Toast';
import { toggleTheme as toggleThemeUtil, getStoredTheme } from '@/utils/theme';
import { api } from '@/utils/api';

const INITIAL = { customers: [], candidates: [], jobs: [], billings: [] };

export default function Dashboard() {
  const router = useRouter();
  const [theme, setTheme] = useState('dark');
  const [currentView, setCurrentView] = useState('dashboard');
  const [selectedEntity, setSelectedEntity] = useState(null);
  const [omniQuery, setOmniQuery] = useState('');
  const [omniResults, setOmniResults] = useState(null);
  const [data, setData] = useState(INITIAL);
  const [dataVersion, refreshData] = useReducer(x => x + 1, 0);
  const [loading, setLoading] = useState(true);

  useEffect(() => { setTheme(getStoredTheme()); }, []);

  useEffect(() => {
    async function loadAll() {
      try {
        const [customers, candidates, jobs, billings] = await Promise.all([
          api.customers.list({ size: 100, sort: 'companyName' }),
          api.candidates.list({ size: 100, sort: 'lastName' }),
          api.jobs.list({ size: 100, sort: 'title' }),
          api.billings.list({ size: 100, sort: 'invoiceNumber' }),
        ]);
        setData({
          customers: customers.content || [],
          candidates: candidates.content || [],
          jobs: jobs.content || [],
          billings: billings.content || [],
        });
      } catch {}
      setLoading(false);
    }
    loadAll();
  }, [dataVersion]);

  useEffect(() => {
    async function checkAuth() {
      try {
        const res = await fetch('/api/customers?size=1', { credentials: 'include' });
        if (!res.ok) router.push('/');
      } catch { router.push('/'); }
    }
    checkAuth();
  }, [router]);

  const handleToggleTheme = useCallback(() => setTheme(prev => toggleThemeUtil(prev)), []);
  const handleNavigate = useCallback((view) => { setCurrentView(view); setSelectedEntity(null); }, []);

  async function searchBackend(query) {
    const q = query.trim();
    if (q.length < 2) return { customers: [], candidates: [], jobs: [] };
    try {
      const [cust, cand, j] = await Promise.all([
        api.customers.list({ search: q, size: 5 }),
        api.candidates.list({ search: q, size: 5 }),
        api.jobs.list({ search: q, size: 5 }),
      ]);
      return { customers: cust.content || [], candidates: cand.content || [], jobs: j.content || [] };
    } catch { return { customers: [], candidates: [], jobs: [] }; }
  }

  const handleOmniChange = useCallback((value) => {
    setOmniQuery(value);
    searchBackend(value).then(r => setOmniResults(r));
  }, []);

  const handleOmniSelect = useCallback((type, row) => {
    setSelectedEntity({ type, data: row });
    setOmniQuery(''); setOmniResults(null);
  }, []);

  const handleRowClick = useCallback((view, row) => {
    const m = { candidates: 'candidate', customers: 'customer', jobs: 'job', billings: 'billing' };
    setSelectedEntity({ type: m[view] || 'customer', data: row });
  }, []);

  const handleBack = useCallback(() => setSelectedEntity(null), []);

  const ENTITY_API = { candidate: api.candidates, customer: api.customers, job: api.jobs, billing: api.billings };

  async function handleCreate(et, e) { await ENTITY_API[et].create(e); refreshData(); }
  async function handleBulkArchive(et, ids) { await Promise.all(ids.map(id => ENTITY_API[et].archive(id).catch(() => {}))); refreshData(); }
  async function handleBulkUnarchive(et, ids) { await Promise.all(ids.map(id => ENTITY_API[et].unarchive(id).catch(() => {}))); refreshData(); }
  async function handleBulkDelete(et, ids) {
    const errors = [];
    await Promise.all(ids.map(async (id) => {
      try { await ENTITY_API[et].delete(id); } catch (e) { errors.push(e.message); }
    }));
    if (errors.length > 0) showToast(errors.join('\n'));
    refreshData();
  }
  async function handleEntityUpdate(et, id, body) { const u = await ENTITY_API[et].update(id, body); refreshData(); return u; }

  function getEntityData(view) {
    const m = { customers: data.customers, candidates: data.candidates, jobs: data.jobs, billings: data.billings };
    return m[view] || [];
  }

  if (loading) return <div style={{ background: 'var(--bg-primary)', height: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center' }}><div style={{ color: 'var(--text-muted)', fontSize: 14 }}>Laden...</div></div>;

  const V2E = { candidates: 'candidate', customers: 'customer', jobs: 'job', billings: 'billing' };

  return (
    <ToastProvider>
    <div style={{ display: 'flex', flexDirection: 'column', height: '100vh', overflow: 'hidden' }}>
      <Topbar omniQuery={omniQuery} onOmniChange={handleOmniChange} omniResults={omniResults} onOmniSelect={handleOmniSelect} />
      <div style={{ display: 'flex', flex: 1, overflow: 'hidden' }}>
        <Sidebar currentView={currentView} onNavigate={handleNavigate} theme={theme} onToggleTheme={handleToggleTheme} />
        <main style={{ flex: 1, overflow: 'auto', padding: 24, background: 'var(--bg-canvas)' }}>
          <Canvas
            currentView={currentView} omniResults={omniResults} selectedEntity={selectedEntity}
            onRowClick={handleRowClick} onBack={handleBack} onOmniSelect={handleOmniSelect}
            allData={data} getEntityData={getEntityData}
            onCreate={handleCreate}
            onBulkArchive={(ids) => handleBulkArchive(V2E[currentView], ids)}
            onBulkUnarchive={(ids) => handleBulkUnarchive(V2E[currentView], ids)}
            onBulkDelete={(ids) => handleBulkDelete(V2E[currentView], ids)}
            onEntityUpdate={handleEntityUpdate}
          />
        </main>
      </div>
    </div>
    </ToastProvider>
  );
}
