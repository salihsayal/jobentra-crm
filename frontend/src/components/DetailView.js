import { toPairs } from '@/utils/mockData';

const FIELD_LABELS = {
  companyName: 'Unternehmen',
  contactPerson: 'Ansprechpartner',
  email: 'Email',
  phone: 'Telefon',
  industry: 'Branche',
  status: 'Status',
  firstName: 'Vorname',
  lastName: 'Nachname',
  skills: 'F\u00E4higkeiten',
  title: 'Position',
  customerName: 'Kunde',
  salaryRange: 'Gehaltsspanne',
  invoiceNumber: 'Rechnungsnr.',
  candidateName: 'Kandidat',
  amount: 'Betrag',
  currency: 'W\u00E4hrung',
  dueDate: 'F\u00E4lligkeitsdatum',
};

function formatValue(key, value) {
  if (value == null) return '-';
  if (Array.isArray(value)) return value.join(', ');
  if (key === 'amount') return new Intl.NumberFormat('de-DE', { style: 'currency', currency: 'EUR' }).format(value);
  return String(value);
}

export default function DetailView({ entity, entityType, onBack }) {
  const fields = Object.entries(entity).filter(([key]) =>
    key !== 'id' && FIELD_LABELS[key]
  );

  return (
    <div>
      <div style={{ marginBottom: 16 }}>
        <button
          onClick={onBack}
          style={{
            display: 'inline-flex', alignItems: 'center', gap: 6, padding: '6px 14px', borderRadius: 6, fontSize: 13,
            background: 'var(--bg-input)', color: 'var(--text-muted)', border: '1px solid var(--border)',
            cursor: 'pointer', transition: 'all 0.15s',
          }}
          className="hover:bg-app-bg-hover hover:text-app-text-main"
        >
          &larr; Zur&uuml;ck
        </button>
      </div>

      <div style={{ background: 'var(--bg-card)', border: '1px solid var(--border)', borderRadius: 8, padding: 20, marginBottom: 20 }}>
        <h2 style={{ fontSize: 20, fontWeight: 700, marginBottom: 20, color: 'var(--text-main)' }}>
          {entityType === 'candidate'
            ? `${entity.firstName} ${entity.lastName}`
            : entity.companyName || entity.title || entity.invoiceNumber}
        </h2>

        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '8px 20px' }}>
          {fields.map(([key, value]) => (
            <div key={key} style={{ padding: '8px 0', borderBottom: '1px solid var(--border)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <span style={{ fontSize: 13, color: 'var(--text-muted)' }}>{FIELD_LABELS[key]}</span>
              <span style={{ fontSize: 13, fontWeight: 500, color: 'var(--text-main)', textAlign: 'right' }}>{formatValue(key, value)}</span>
            </div>
          ))}
          {fields.length % 2 !== 0 && <div />}
        </div>
      </div>

      {(entityType === 'candidate' || entityType === 'customer' || entityType === 'job' || entityType === 'billing') && (
        <div style={{ background: 'var(--bg-card)', border: '1px solid var(--border)', borderRadius: 8, padding: 20 }}>
          <h3 style={{ fontSize: 15, fontWeight: 600, color: 'var(--text-main)', marginBottom: 16 }}>Aktionen</h3>
          <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap' }}>
            <button
              style={{
                padding: '8px 18px', borderRadius: 6, fontSize: 13, fontWeight: 500,
                background: 'var(--accent)', color: '#fff', border: 'none', cursor: 'pointer',
              }}
            >
              {entityType === 'candidate' ? 'Lebenslauf-Generator' : entityType === 'customer' ? 'Unternehmensprofil erstellen' : entityType === 'job' ? 'Job-Ausschreibung generieren' : 'Rechnung generieren'}
            </button>
            <button
              style={{
                padding: '8px 18px', borderRadius: 6, fontSize: 13, fontWeight: 500,
                background: 'var(--accent-light)', color: 'var(--accent)', border: '1px solid var(--accent)', cursor: 'pointer',
              }}
            >
              {entityType === 'candidate' ? 'CV-Anonymisierer' : 'Als PDF exportieren'}
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
