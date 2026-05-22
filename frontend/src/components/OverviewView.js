import { useState, useReducer, useEffect } from 'react';
import { Plus } from 'lucide-react';
import StatsCharts from './StatsCharts';
import DataTable from './DataTable';
import CreateSlideOver from './CreateSlideOver';

const STATUS_COLORS = {
  ACTIVE: { bg: 'rgba(52,211,153,0.12)', text: '#34d399' }, INACTIVE: { bg: 'rgba(100,116,139,0.12)', text: '#94a3b8' }, LEAD: { bg: 'rgba(129,140,248,0.12)', text: '#818cf8' },
  NEW: { bg: 'rgba(129,140,248,0.12)', text: '#818cf8' }, IN_PROCESS: { bg: 'rgba(251,191,36,0.12)', text: '#fbbf24' }, PLACED: { bg: 'rgba(52,211,153,0.12)', text: '#34d399' },
  REJECTED: { bg: 'rgba(251,113,133,0.12)', text: '#fb7185' }, OPEN: { bg: 'rgba(52,211,153,0.12)', text: '#34d399' }, CLOSED: { bg: 'rgba(100,116,139,0.12)', text: '#94a3b8' },
  DRAFT: { bg: 'rgba(167,139,250,0.12)', text: '#a78bfa' }, SENT: { bg: 'rgba(129,140,248,0.12)', text: '#818cf8' }, PAID: { bg: 'rgba(52,211,153,0.12)', text: '#34d399' },
  CANCELLED: { bg: 'rgba(251,113,133,0.12)', text: '#fb7185' },
};
function StatusBadge({ status }) { const s = STATUS_COLORS[status] || { bg: 'rgba(100,116,139,0.12)', text: '#94a3b8' }; return <span style={{ display: 'inline-block', padding: '2px 10px', borderRadius: 999, fontSize: 11, fontWeight: 600, background: s.bg, color: s.text, letterSpacing: '0.02em' }}>{status}</span>; }
function formatEur(v) { if (v == null) return '-'; return new Intl.NumberFormat('de-DE', { style: 'currency', currency: 'EUR' }).format(v); }
function Card({ children, style }) { return <div style={{ background: 'var(--bg-card)', border: '1px solid var(--card-border)', borderRadius: 12, padding: 20, ...style }}>{children}</div>; }
function StatCard({ label, value, color }) { return <div style={{ position: 'relative', overflow: 'hidden', background: 'var(--bg-card)', border: '1px solid var(--card-border)', borderRadius: 12, padding: 20 }}><div style={{ position: 'absolute', top: 0, left: 0, bottom: 0, width: 3, background: color }} /><div style={{ fontSize: 12, fontWeight: 600, color: 'var(--text-muted)', marginBottom: 8, textTransform: 'uppercase', letterSpacing: '0.05em' }}>{label}</div><div style={{ fontSize: 26, fontWeight: 700, color: 'var(--text-main)' }}>{value}</div></div>; }

const LABELS = { customers: { title: 'Kunden', article: 'Neuen', entityType: 'customer' }, candidates: { title: 'Kandidaten', article: 'Neuen', entityType: 'candidate' }, jobs: { title: 'Job', article: 'Neuen', entityType: 'job' }, billings: { title: 'Rechnung', article: 'Neue', entityType: 'billing' } };

const TABLE_COLUMNS = {
  customers: [{ key: 'companyName', label: 'Unternehmen' },{ key: 'contactPerson', label: 'Ansprechpartner' },{ key: 'email', label: 'Email' },{ key: 'industry', label: 'Branche' },{ key: 'status', label: 'Status', render: v => <StatusBadge status={v} /> }],
  candidates: [
    { key: 'firstName', label: 'Name & Beruf', render: (v, row) => (
      <div>
        <div style={{ fontWeight: 600 }}>{row.firstName} {row.lastName}</div>
        <div style={{ fontSize: 11, color: 'var(--text-dim)', marginTop: 1 }}>{row.job || '-'}</div>
      </div>
    )},
    { key: 'skills', label: 'F\u00E4higkeiten', render: (v) => <span style={{ fontSize: 12, maxWidth: 180, display: 'inline-block', whiteSpace: 'normal', lineHeight: 1.4 }}>{v || '-'}</span> },
    { key: 'location', label: 'Ort', render: (v, row) => (
      <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
        <span>{v || '-'}</span>
        {row.mobility ? (
          <span style={{ display: 'inline-flex', alignItems: 'center', gap: 3, fontSize: 10, fontWeight: 600, background: 'rgba(59,130,246,0.12)', color: '#3b82f6', padding: '1px 6px', borderRadius: 4, width: 'fit-content' }}>
            PKW
          </span>
        ) : (
          <span style={{ display: 'inline-flex', alignItems: 'center', gap: 3, fontSize: 10, fontWeight: 600, background: 'rgba(239,68,68,0.12)', color: '#ef4444', padding: '1px 6px', borderRadius: 4, width: 'fit-content' }}>
            Kein PKW
          </span>
        )}
      </div>
    )},
    { key: 'availability', label: 'Verf\u00FCgbar', render: (v) => {
      if (v && /^\d{4}-\d{2}-\d{2}/.test(v)) {
        return new Date(v + 'T00:00:00').toLocaleDateString('de-DE', { day: '2-digit', month: 'long', year: 'numeric' });
      }
      return v || '-';
    } },
    { key: 'status', label: 'Status', render: v => <StatusBadge status={v} /> },
  ],
  jobs: [{ key: 'title', label: 'Position' },{ key: 'customerName', label: 'Kunde', render: (v, row) => row.customer?.companyName || v || '-' },{ key: 'status', label: 'Status', render: v => <StatusBadge status={v} /> },{ key: 'salaryRange', label: 'Gehaltsspanne' }],
  billings: [{ key: 'invoiceNumber', label: 'Rechnungsnr.' },{ key: 'customerName', label: 'Kunde', render: (v, r) => r.customer?.companyName || v || '-' },{ key: 'candidateName', label: 'Kandidat', render: (v, r) => r.candidate ? `${r.candidate.firstName} ${r.candidate.lastName}` : (v || '-') },{ key: 'amount', label: 'Betrag', render: v => formatEur(v) },{ key: 'status', label: 'Status', render: v => <StatusBadge status={v} /> }],
};

export default function OverviewView({ view, data, allData, onRowClick, onCreate, onBulkArchive, onBulkUnarchive, onBulkDelete }) {
  const [slideOverOpen, setSlideOverOpen] = useState(false);
  const [showArchived, setShowArchived] = useState(false);
  const [, forceUpdate] = useReducer(x => x + 1, 0);
  const L = LABELS[view] || {};
  const totalArchived = data ? data.filter(d => d.archived).length : 0;
  useEffect(() => { if (showArchived && totalArchived === 0) setShowArchived(false); }, [showArchived, totalArchived]);

  async function handleCreate(e) { await onCreate(e); forceUpdate(); setSlideOverOpen(false); }
  async function handleBulkArchive(ids) { await onBulkArchive(ids); forceUpdate(); }
  async function handleBulkUnarchive(ids) { await onBulkUnarchive(ids); forceUpdate(); }
  async function handleBulkDelete(ids) { await onBulkDelete(ids); forceUpdate(); }

  function getActiveData() { if (!data) return []; return showArchived ? data.filter(d => d.archived) : data.filter(d => !d.archived); }

  if (view === 'dashboard') {
    const tc = (allData?.customers || []).filter(c => !c.archived).length;
    const tca = (allData?.candidates || []).filter(c => !c.archived).length;
    const oj = (allData?.jobs || []).filter(j => j.status === 'OPEN' && !j.archived).length;
    const tr = (allData?.billings || []).filter(b => b.status === 'PAID' && !b.archived).reduce((s, b) => s + (b.amount || 0), 0);
    const pie = (allData?.jobs || []).filter(j => !j.archived).reduce((a, j) => { a[j.status || 'DRAFT'] = (a[j.status || 'DRAFT'] || 0) + 1; return a; }, {});
    const bar = (allData?.candidates || []).filter(c => !c.archived).reduce((a, c) => { a[c.status || 'NEW'] = (a[c.status || 'NEW'] || 0) + 1; return a; }, {});
    return (
      <div>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 12, marginBottom: 20 }}>
          {[{ label: 'Kunden', value: tc, color: 'var(--chart-1)' },{ label: 'Kandidaten', value: tca, color: 'var(--chart-2)' },{ label: 'Offene Jobs', value: oj, color: 'var(--chart-3)' },{ label: 'Umsatz (bezahlt)', value: formatEur(tr), color: 'var(--chart-4)' }].map(c => <StatCard key={c.label} {...c} />)}
        </div>
        <StatsCharts pieData={Object.entries(pie).map(([n, v]) => ({ name: n, value: v }))} barData={Object.entries(bar).map(([n, c]) => ({ name: n, count: c }))} pieLabel="Job Status Verteilung" barLabel="Kandidaten Status" entityType="dashboard" />
      </div>
    );
  }

  const dp = data || [];
  const grouped = (d, k, dk, vk) => { const r = {}; d.filter(x => !x.archived).forEach(x => { const v = x[k] || dk; r[v] = (r[v] || 0) + 1; }); return Object.entries(r).map(([n, v]) => ({ name: n, [vk]: v })); };
  const skillsForBar = (d) => { const r = {}; d.filter(x => !x.archived).forEach(x => { (x.skills || '').split(',').map(s => s.trim()).filter(Boolean).forEach(s => { r[s] = (r[s] || 0) + 1; }); }); return Object.entries(r).map(([n, c]) => ({ name: n, count: c })); };
  let pieD = [], barD = [];
  if (view === 'customers') { pieD = grouped(dp, 'industry', 'Sonstige', 'value'); barD = grouped(dp, 'status', 'LEAD', 'count'); }
  else if (view === 'candidates') { pieD = grouped(dp, 'status', 'NEW', 'value'); barD = grouped(dp, 'job', 'Keine Angabe', 'count'); }
  else if (view === 'jobs') { pieD = grouped(dp, 'status', 'DRAFT', 'value'); barD = grouped(dp, 'title', 'Unbenannt', 'count'); }
  else if (view === 'billings') {
    const sums = {}; dp.filter(b => !b.archived).forEach(b => { sums[b.status || 'DRAFT'] = (sums[b.status || 'DRAFT'] || 0) + (b.amount || 0); });
    pieD = Object.entries(sums).map(([n, v]) => ({ name: n, value: Math.round(v) }));
    barD = grouped(dp, 'status', 'DRAFT', 'count');
  }

  return (
    <div>
      <StatsCharts pieData={pieD} barData={barD} entityType={L.entityType || view} barLabel={view === 'candidates' ? 'Berufe' : undefined} />
      <div style={{ marginTop: 24 }}>
        <Card>
          <DataTable data={getActiveData()} columns={TABLE_COLUMNS[view] || []} searchPlaceholder={`${L.title || ''} durchsuchen...`}
            onRowClick={onRowClick} onBulkArchive={handleBulkArchive} onBulkUnarchive={handleBulkUnarchive} onBulkDelete={handleBulkDelete}
            showArchived={showArchived} totalArchived={totalArchived}
            headerRight={view !== 'dashboard' ? (<div style={{ display: 'flex', gap: 8, alignItems: 'center', flexShrink: 0 }}>
              {totalArchived > 0 && <button onClick={() => setShowArchived(p => !p)} className="inline-flex items-center gap-1.5 px-3 py-2.5 rounded-lg text-sm font-medium border border-app-border text-app-text-muted hover:text-app-text-main hover:bg-app-bg-hover transition-colors whitespace-nowrap">{showArchived ? 'Aktive anzeigen' : 'Archiv anzeigen'}</button>}
              <button onClick={() => setSlideOverOpen(true)} className="inline-flex items-center gap-2 px-4 py-2.5 rounded-lg text-sm font-semibold bg-app-accent text-white hover:bg-app-accent-hover transition-colors whitespace-nowrap"><Plus size={16} />{L.article} {L.title} anlegen</button>
            </div>) : null} />
        </Card>
      </div>
      <CreateSlideOver entityType={L.entityType || view} open={slideOverOpen} onClose={() => setSlideOverOpen(false)} onSave={handleCreate} refData={allData} />
    </div>
  );
}
