import OverviewView from './OverviewView';
import DetailView from './DetailView';
import DataTable from './DataTable';

const STATUS_COLORS = {
  ACTIVE: { bg: 'rgba(34,197,94,0.15)', text: '#22c55e' },
  INACTIVE: { bg: 'rgba(100,116,139,0.15)', text: '#94a3b8' },
  LEAD: { bg: 'rgba(59,130,246,0.15)', text: '#3b82f6' },
  NEW: { bg: 'rgba(59,130,246,0.15)', text: '#3b82f6' },
  IN_PROCESS: { bg: 'rgba(245,158,11,0.15)', text: '#f59e0b' },
  PLACED: { bg: 'rgba(34,197,94,0.15)', text: '#22c55e' },
  REJECTED: { bg: 'rgba(239,68,68,0.15)', text: '#ef4444' },
  OPEN: { bg: 'rgba(34,197,94,0.15)', text: '#22c55e' },
  CLOSED: { bg: 'rgba(100,116,139,0.15)', text: '#94a3b8' },
  DRAFT: { bg: 'rgba(139,92,246,0.15)', text: '#8b5cf6' },
  SENT: { bg: 'rgba(59,130,246,0.15)', text: '#3b82f6' },
  PAID: { bg: 'rgba(34,197,94,0.15)', text: '#22c55e' },
  CANCELLED: { bg: 'rgba(239,68,68,0.15)', text: '#ef4444' },
};

function StatusBadge({ status }) {
  const s = STATUS_COLORS[status] || { bg: 'rgba(100,116,139,0.15)', text: '#94a3b8' };
  return (
    <span style={{
      display: 'inline-block', padding: '2px 8px', borderRadius: 999, fontSize: 11, fontWeight: 500,
      background: s.bg, color: s.text,
    }}>
      {status}
    </span>
  );
}

function SearchResultsView({ results, onSelect }) {
  const hasAny = (results.customers?.length || 0) + (results.candidates?.length || 0) + (results.jobs?.length || 0) > 0;

  if (!hasAny) {
    return (
      <div style={{ padding: 40, textAlign: 'center', color: 'var(--text-dim)', fontSize: 14 }}>
        Keine Suchergebnisse gefunden.
      </div>
    );
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
      {results.customers?.length > 0 && (
        <div>
          <h3 style={{ fontSize: 14, fontWeight: 600, color: 'var(--text-main)', marginBottom: 8 }}>
            Gefundene Kunden ({results.customers.length})
          </h3>
          <DataTable
            data={results.customers}
            columns={[
              { key: 'companyName', label: 'Unternehmen' },
              { key: 'contactPerson', label: 'Ansprechpartner' },
              { key: 'email', label: 'Email' },
              { key: 'industry', label: 'Branche' },
              { key: 'status', label: 'Status', render: (v) => <StatusBadge status={v} /> },
            ]}
            searchPlaceholder="Kunden filtern..."
            onRowClick={(row) => onSelect('customer', row)}
          />
        </div>
      )}
      {results.candidates?.length > 0 && (
        <div>
          <h3 style={{ fontSize: 14, fontWeight: 600, color: 'var(--text-main)', marginBottom: 8 }}>
            Gefundene Kandidaten ({results.candidates.length})
          </h3>
          <DataTable
            data={results.candidates}
            columns={[
              { key: 'firstName', label: 'Vorname' },
              { key: 'lastName', label: 'Nachname' },
              { key: 'email', label: 'Email' },
              { key: 'phone', label: 'Telefon' },
              { key: 'status', label: 'Status', render: (v) => <StatusBadge status={v} /> },
            ]}
            searchPlaceholder="Kandidaten filtern..."
            onRowClick={(row) => onSelect('candidate', row)}
          />
        </div>
      )}
      {results.jobs?.length > 0 && (
        <div>
          <h3 style={{ fontSize: 14, fontWeight: 600, color: 'var(--text-main)', marginBottom: 8 }}>
            Gefundene Jobs ({results.jobs.length})
          </h3>
          <DataTable
            data={results.jobs}
            columns={[
              { key: 'title', label: 'Position' },
              { key: 'customerName', label: 'Kunde' },
              { key: 'status', label: 'Status', render: (v) => <StatusBadge status={v} /> },
              { key: 'salaryRange', label: 'Gehaltsspanne' },
            ]}
            searchPlaceholder="Jobs filtern..."
            onRowClick={(row) => onSelect('job', row)}
          />
        </div>
      )}
    </div>
  );
}

export default function Canvas({ currentView, omniResults, selectedEntity, onRowClick, onBack, onOmniSelect }) {
  if (selectedEntity) {
    return (
      <DetailView
        entity={selectedEntity.data}
        entityType={selectedEntity.type}
        onBack={onBack}
      />
    );
  }

  if (currentView === 'search') {
    return <SearchResultsView results={omniResults} onSelect={onOmniSelect} />;
  }

  return (
    <OverviewView
      view={currentView || 'dashboard'}
      onRowClick={(row) => onRowClick(currentView, row)}
    />
  );
}
