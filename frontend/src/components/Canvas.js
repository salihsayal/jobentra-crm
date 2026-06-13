import OverviewView from './OverviewView';
import DetailView from './DetailView';
import CandidateDetailView from './CandidateDetailView';
import DataTable from './DataTable';

function StatusBadge({ status }) {
  const c = { ACTIVE: { bg: 'rgba(52,211,153,0.12)', text: '#34d399' }, INACTIVE: { bg: 'rgba(100,116,139,0.12)', text: '#94a3b8' }, LEAD: { bg: 'rgba(129,140,248,0.12)', text: '#818cf8' }, NEW: { bg: 'rgba(129,140,248,0.12)', text: '#818cf8' }, IN_PROCESS: { bg: 'rgba(251,191,36,0.12)', text: '#fbbf24' }, PLACED: { bg: 'rgba(52,211,153,0.12)', text: '#34d399' }, REJECTED: { bg: 'rgba(251,113,133,0.12)', text: '#fb7185' }, OPEN: { bg: 'rgba(52,211,153,0.12)', text: '#34d399' }, CLOSED: { bg: 'rgba(100,116,139,0.12)', text: '#94a3b8' }, DRAFT: { bg: 'rgba(167,139,250,0.12)', text: '#a78bfa' }, SENT: { bg: 'rgba(129,140,248,0.12)', text: '#818cf8' }, PAID: { bg: 'rgba(52,211,153,0.12)', text: '#34d399' }, CANCELLED: { bg: 'rgba(251,113,133,0.12)', text: '#fb7185' } };
  const s = c[status] || { bg: 'rgba(100,116,139,0.12)', text: '#94a3b8' };
  return <span style={{ display: 'inline-block', padding: '2px 8px', borderRadius: 999, fontSize: 11, fontWeight: 500, background: s.bg, color: s.text }}>{status}</span>;
}

export default function Canvas({ currentView, omniResults, selectedEntity, onRowClick, onBack, onOmniSelect, allData, getEntityData, onCreate, onBulkArchive, onBulkUnarchive, onBulkDelete, onEntityUpdate }) {
  if (selectedEntity) {
    if (selectedEntity.type === 'candidate') {
      return <CandidateDetailView entity={selectedEntity.data} onBack={onBack} onEntityUpdate={onEntityUpdate} />;
    }
    return <DetailView entity={selectedEntity.data} entityType={selectedEntity.type} onBack={onBack} onEntityUpdate={onEntityUpdate} />;
  }

  if (currentView === 'search') {
    const hAny = (omniResults?.customers?.length || 0) + (omniResults?.candidates?.length || 0) + (omniResults?.jobs?.length || 0) > 0;
    if (!hAny) return <div style={{ padding: 40, textAlign: 'center', color: 'var(--text-dim)', fontSize: 14 }}>Keine Suchergebnisse gefunden.</div>;
    return (
      <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
        {omniResults.customers?.length > 0 && <div><h3 style={{ fontSize: 14, fontWeight: 600, color: 'var(--text-main)', marginBottom: 8 }}>Gefundene Kunden ({omniResults.customers.length})</h3><DataTable data={omniResults.customers} columns={[{ key: 'companyName', label: 'Unternehmen' },{ key: 'contactPerson', label: 'Ansprechpartner' },{ key: 'email', label: 'Email' },{ key: 'industry', label: 'Branche' },{ key: 'status', label: 'Status', render: v => <StatusBadge status={v} /> }]} onRowClick={r => onOmniSelect('customer', r)} /></div>}
        {omniResults.candidates?.length > 0 && <div><h3 style={{ fontSize: 14, fontWeight: 600, color: 'var(--text-main)', marginBottom: 8 }}>Gefundene Kandidaten ({omniResults.candidates.length})</h3><DataTable data={omniResults.candidates} columns={[{ key: 'firstName', label: 'Name & Beruf', render: (v, r) => <div><div style={{ fontWeight: 600 }}>{r.firstName} {r.lastName}</div><div style={{ fontSize: 11, color: 'var(--text-dim)', marginTop: 1 }}>{r.job || '-'}</div></div> },{ key: 'skills', label: 'Fähigkeiten' },{ key: 'location', label: 'Ort' },{ key: 'status', label: 'Status', render: v => <StatusBadge status={v} /> }]} onRowClick={r => onOmniSelect('candidate', r)} /></div>}
        {omniResults.jobs?.length > 0 && <div><h3 style={{ fontSize: 14, fontWeight: 600, color: 'var(--text-main)', marginBottom: 8 }}>Gefundene Jobs ({omniResults.jobs.length})</h3><DataTable data={omniResults.jobs} columns={[{ key: 'title', label: 'Position' },{ key: 'customerName', label: 'Kunde', render: (v, r) => r.customer?.companyName || v || '-' },{ key: 'status', label: 'Status', render: v => <StatusBadge status={v} /> },{ key: 'salaryRange', label: 'Gehaltsspanne' }]} onRowClick={r => onOmniSelect('job', r)} /></div>}
      </div>
    );
  }

  const V2E = { candidates: 'candidate', customers: 'customer', jobs: 'job', billings: 'billing' };
  return (
    <OverviewView
      view={currentView || 'dashboard'} data={getEntityData(currentView)} allData={allData}
      onRowClick={row => onRowClick(currentView, row)}
      onCreate={e => { onCreate(V2E[currentView], e); return true; }}
      onBulkArchive={ids => onBulkArchive(ids)}
      onBulkUnarchive={ids => onBulkUnarchive(ids)}
      onBulkDelete={ids => onBulkDelete(ids)}
    />
  );
}
