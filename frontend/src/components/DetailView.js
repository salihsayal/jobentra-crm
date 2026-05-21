import { useState, useRef, useMemo } from 'react';
import { ArrowLeft, FileText, ShieldOff, Check, Undo2 } from 'lucide-react';

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

const EDITABLE_FIELDS = {
  candidate: ['firstName', 'lastName', 'email', 'phone', 'skills', 'status'],
  customer:  ['companyName', 'contactPerson', 'email', 'phone', 'industry', 'status'],
  job:       ['title', 'description', 'customerName', 'salaryRange', 'status'],
  billing:   ['invoiceNumber', 'customerName', 'candidateName', 'amount', 'currency', 'dueDate', 'status'],
};

const STATUS_OPTIONS = {
  candidate: ['NEW', 'IN_PROCESS', 'PLACED', 'REJECTED'],
  customer:  ['ACTIVE', 'INACTIVE', 'LEAD'],
  job:       ['OPEN', 'CLOSED', 'DRAFT'],
  billing:   ['DRAFT', 'SENT', 'PAID', 'CANCELLED'],
};

function formatValue(key, value) {
  if (value == null) return '';
  if (Array.isArray(value)) return value.join(', ');
  if (key === 'amount') return String(value);
  return String(value);
}

function parseValue(key, value, entityType) {
  if (key === 'skills' && entityType === 'candidate') {
    if (Array.isArray(value)) return value;
    return String(value ?? '').split(',').map(s => s.trim()).filter(Boolean);
  }
  if (key === 'amount' && entityType === 'billing') {
    return parseFloat(value) || 0;
  }
  return value;
}

const inputBaseStyle = {
  background: 'transparent',
  border: 'none',
  color: 'var(--text-main)',
  fontSize: 13,
  fontWeight: 600,
  textAlign: 'right',
  width: '100%',
  padding: '2px 4px',
  borderRadius: 4,
  outline: 'none',
  cursor: 'text',
  transition: 'background 0.15s ease, border-color 0.15s ease',
};

export default function DetailView({ entity, entityType, onBack }) {
  const originalData = useRef({ ...entity });
  const [formData, setFormData] = useState({ ...entity });
  const [focusedField, setFocusedField] = useState(null);
  const [hoveredField, setHoveredField] = useState(null);

  const editableKeys = EDITABLE_FIELDS[entityType] || [];

  function normalizeForCompare(val, key) {
    if (key === 'skills' && entityType === 'candidate') {
      return Array.isArray(val) ? val.join(', ') : String(val ?? '');
    }
    return String(val ?? '');
  }

  const isDirty = useMemo(() => {
    return editableKeys.some(key => {
      const a = normalizeForCompare(formData[key], key);
      const b = normalizeForCompare(originalData.current[key], key);
      return a !== b;
    });
  }, [formData, entityType, editableKeys]);

  const [validationErrors, setValidationErrors] = useState({});

  function validateField(key, value) {
    const str = String(value ?? '').trim();
    if (!str) {
      setValidationErrors(prev => ({ ...prev, [key]: null }));
      return true;
    }
    if (key === 'email') {
      const valid = str.includes('@') && str.lastIndexOf('.') > str.indexOf('@');
      setValidationErrors(prev => ({ ...prev, [key]: valid ? null : 'Ung\u00fcltige E-Mail-Adresse' }));
      return valid;
    }
    if (key === 'phone') {
      const valid = !/[^0-9+\-() ]/.test(str);
      setValidationErrors(prev => ({ ...prev, [key]: valid ? null : 'Nur Zahlen und Sonderzeichen erlaubt' }));
      return valid;
    }
    setValidationErrors(prev => ({ ...prev, [key]: null }));
    return true;
  }

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

  const statusOpts = STATUS_OPTIONS[entityType] || [];

  function handleChange(key, value) {
    setFormData(prev => ({ ...prev, [key]: value }));
    validateField(key, value);
  }

  function handleSave() {
    const hasErrors = Object.values(validationErrors).some(Boolean);
    if (hasErrors) return;

    editableKeys.forEach(key => {
      entity[key] = parseValue(key, formData[key], entityType);
    });
    originalData.current = { ...entity };
    setFormData({ ...entity });
    setValidationErrors({});
  }

  function handleCancel() {
    setFormData({ ...originalData.current });
  }

  function inputStyle(key) {
    const isFocused = focusedField === key;
    const isHovered = hoveredField === key;
    return {
      ...inputBaseStyle,
      background: isFocused ? 'var(--bg-input)' : isHovered ? 'var(--bg-hover)' : 'transparent',
      borderBottom: isFocused ? '1px solid var(--accent)' : '1px solid transparent',
    };
  }

  const entityTitle = entityType === 'candidate'
    ? `${formData.firstName || entity.firstName} ${formData.lastName || entity.lastName}`
    : entityType === 'customer'
    ? (formData.companyName || entity.companyName)
    : entityType === 'job'
    ? (formData.title || entity.title)
    : (formData.invoiceNumber || entity.invoiceNumber);

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
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 24 }}>
          <h2 style={{ fontSize: 22, fontWeight: 700, color: 'var(--text-main)', margin: 0 }}>
            {entityTitle}
          </h2>

          <div style={{
            display: 'flex', gap: 8,
            opacity: isDirty ? 1 : 0,
            transform: isDirty ? 'translateX(0)' : 'translateX(8px)',
            pointerEvents: isDirty ? 'auto' : 'none',
            transition: 'opacity 0.2s ease, transform 0.2s ease',
          }}>
            <button
              onClick={handleCancel}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-sm font-medium border border-app-border text-app-text-muted hover:text-app-text-main hover:bg-app-bg-hover transition-colors"
            >
              <Undo2 size={14} />
              R&uuml;ckg&auml;ngig machen
            </button>
            <button
              onClick={handleSave}
              className="inline-flex items-center gap-1.5 px-4 py-1.5 rounded-lg text-sm font-semibold bg-app-accent text-white hover:bg-app-accent-hover transition-colors"
            >
              <Check size={14} />
              Anwenden
            </button>
          </div>
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px 24px' }}>
          {fields.map(([key]) => {
            const value = formData[key];
            const display = formatValue(key, value);
            const editable = editableKeys.includes(key);

            const err = validationErrors[key];

            return (
              <div
                key={key}
                style={{
                  padding: '10px 0', borderBottom: '1px solid var(--border)',
                }}
                onMouseEnter={() => setHoveredField(key)}
                onMouseLeave={() => setHoveredField(null)}
              >
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <span style={{ fontSize: 13, fontWeight: 500, color: 'var(--text-muted)', minWidth: 100 }}>
                    {FIELD_LABELS[key]}
                  </span>

                  {!editable ? (
                    <span style={{ fontSize: 13, fontWeight: 600, color: 'var(--text-main)', textAlign: 'right' }}>
                      {display || '-'}
                    </span>
                  ) : statusOpts.length > 0 && key === 'status' ? (
                    <select
                      value={formData[key] || ''}
                      onChange={(e) => handleChange(key, e.target.value)}
                      style={{
                        ...inputBaseStyle,
                        cursor: 'pointer',
                        background: 'var(--bg-input)',
                        padding: '2px 6px',
                        borderRadius: 4,
                        border: '1px solid var(--border)',
                        maxWidth: 160,
                      }}
                    >
                      {statusOpts.map(opt => (
                        <option key={opt} value={opt}>{opt}</option>
                      ))}
                    </select>
                  ) : key === 'amount' ? (
                    <input
                      type="number"
                      step="0.01"
                      value={formData[key] ?? ''}
                      onChange={(e) => handleChange(key, e.target.value)}
                      onFocus={() => setFocusedField(key)}
                      onBlur={() => setFocusedField(null)}
                      style={inputStyle(key)}
                    />
                  ) : key === 'dueDate' ? (
                    <input
                      type="date"
                      value={formData[key] ?? ''}
                      onChange={(e) => handleChange(key, e.target.value)}
                      onFocus={() => setFocusedField(key)}
                      onBlur={() => setFocusedField(null)}
                      style={inputStyle(key)}
                    />
                  ) : (
                    <input
                      type="text"
                      value={typeof formData[key] === 'string' ? formData[key] : display}
                      onChange={(e) => handleChange(key, e.target.value)}
                      onFocus={() => setFocusedField(key)}
                      onBlur={() => setFocusedField(null)}
                      style={inputStyle(key)}
                    />
                  )}
                </div>
                {err && (
                  <div style={{ fontSize: 11, color: 'var(--danger)', marginTop: 4, textAlign: 'right' }}>
                    {err}
                  </div>
                )}
              </div>
            );
          })}
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
