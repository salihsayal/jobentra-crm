import { ArrowLeft, FileText, ShieldOff } from 'lucide-react';

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

  const actionLabels = {
    candidate: ['Lebenslauf-Generator', 'CV-Anonymisierer'],
    customer: ['Unternehmensprofil erstellen', 'Als PDF exportieren'],
    job: ['Job-Ausschreibung generieren', 'Als PDF exportieren'],
    billing: ['Rechnung generieren', 'Als PDF exportieren'],
  };
  const [label1, label2] = actionLabels[entityType] || actionLabels.candidate;

  return (
    <div>
      <div style={{ marginBottom: 16 }}>
        <button
          onClick={onBack}
          className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-sm text-app-text-muted hover:text-app-text-main hover:bg-app-bg-hover border border-app-border transition-colors"
        >
          <ArrowLeft size={16} />
          Zur&uuml;ck
        </button>
      </div>

      <div style={{
        background: 'var(--bg-card)', border: '1px solid var(--card-border)',
        borderRadius: 12, padding: 24, marginBottom: 20,
      }}>
        <h2 style={{ fontSize: 22, fontWeight: 700, marginBottom: 24, color: 'var(--text-main)' }}>
          {entityType === 'candidate'
            ? `${entity.firstName} ${entity.lastName}`
            : entity.companyName || entity.title || entity.invoiceNumber}
        </h2>

        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px 24px' }}>
          {fields.map(([key, value]) => (
            <div key={key} style={{ padding: '10px 0', borderBottom: '1px solid var(--border)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <span style={{ fontSize: 13, fontWeight: 500, color: 'var(--text-muted)' }}>{FIELD_LABELS[key]}</span>
              <span style={{ fontSize: 13, fontWeight: 600, color: 'var(--text-main)', textAlign: 'right' }}>{formatValue(key, value)}</span>
            </div>
          ))}
          {fields.length % 2 !== 0 && <div />}
        </div>
      </div>

      <div style={{
        background: 'var(--bg-card)', border: '1px solid var(--card-border)',
        borderRadius: 12, padding: 24,
      }}>
        <h3 style={{ fontSize: 14, fontWeight: 700, color: 'var(--text-main)', marginBottom: 16, textTransform: 'uppercase', letterSpacing: '0.05em' }}>
          Aktionen
        </h3>
        <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap' }}>
          <button className="inline-flex items-center gap-2 px-4 py-2.5 rounded-lg text-sm font-semibold bg-app-accent text-white hover:bg-app-accent-hover transition-colors">
            <FileText size={16} />
            {label1}
          </button>
          <button className="inline-flex items-center gap-2 px-4 py-2.5 rounded-lg text-sm font-semibold border border-app-accent text-app-accent hover:bg-app-accent hover:text-white transition-colors">
            <ShieldOff size={16} />
            {label2}
          </button>
        </div>
      </div>
    </div>
  );
}
