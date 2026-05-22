import { useState, useEffect } from 'react';
import { X, Plus } from 'lucide-react';

const FIELD_ORDER = {
  candidate: ['id', 'firstName', 'lastName', 'email', 'phone', 'status', 'skills', 'isArchived'],
  customer: ['id', 'companyName', 'contactPerson', 'email', 'phone', 'industry', 'status', 'isArchived'],
  job: ['id', 'title', 'description', 'customerId', 'salaryRange', 'status', 'isArchived'],
  billing: ['id', 'invoiceNumber', 'customerId', 'candidateId', 'jobId', 'amount', 'currency', 'status', 'dueDate', 'archived'],
};

const FORM_CONFIGS = {
  candidate: {
    title: 'Neuen Kandidaten anlegen',
    fields: [
      { key: 'firstName', label: 'Vorname', type: 'text', required: true },
      { key: 'lastName', label: 'Nachname', type: 'text', required: true },
      { key: 'email', label: 'Email', type: 'email', required: true },
      { key: 'phone', label: 'Telefon', type: 'text' },
      { key: 'skills', label: 'F\u00E4higkeiten (kommagetrennt)', type: 'text' },
      { key: 'status', label: 'Status', type: 'select', options: ['NEW', 'IN_PROCESS', 'PLACED', 'REJECTED'] },
    ],
    defaults: { status: 'NEW', skills: '' },
    generateId: () => 'ca' + Date.now(),
  },
  customer: {
    title: 'Neuen Kunden anlegen',
    fields: [
      { key: 'companyName', label: 'Unternehmen', type: 'text', required: true },
      { key: 'email', label: 'Email', type: 'email', required: true },
      { key: 'contactPerson', label: 'Ansprechpartner', type: 'text' },
      { key: 'phone', label: 'Telefon', type: 'text' },
      { key: 'industry', label: 'Branche', type: 'text' },
      { key: 'status', label: 'Status', type: 'select', options: ['ACTIVE', 'INACTIVE', 'LEAD'] },
    ],
    defaults: { status: 'LEAD' },
    generateId: () => 'c' + Date.now(),
  },
  job: {
    title: 'Neuen Job anlegen',
    fields: [
      { key: 'title', label: 'Position', type: 'text', required: true },
      { key: 'customerId', label: 'Kunde', type: 'entity-select', entity: 'customers', required: true },
      { key: 'description', label: 'Beschreibung', type: 'text' },
      { key: 'salaryRange', label: 'Gehaltsspanne', type: 'text' },
      { key: 'status', label: 'Status', type: 'select', options: ['OPEN', 'CLOSED', 'DRAFT'] },
    ],
    defaults: { status: 'DRAFT' },
    generateId: () => 'j' + Date.now(),
  },
  billing: {
    title: 'Neue Rechnung anlegen',
    fields: [
      { key: 'invoiceNumber', label: 'Rechnungsnummer', type: 'text', required: true },
      { key: 'customerId', label: 'Kunde', type: 'entity-select', entity: 'customers', required: true },
      { key: 'candidateId', label: 'Kandidat', type: 'entity-select', entity: 'candidates' },
      { key: 'jobId', label: 'Job', type: 'entity-select', entity: 'jobs' },
      { key: 'amount', label: 'Betrag', type: 'number', required: true },
      { key: 'currency', label: 'W\u00E4hrung', type: 'text' },
      { key: 'dueDate', label: 'F\u00E4lligkeitsdatum', type: 'date' },
      { key: 'status', label: 'Status', type: 'select', options: ['DRAFT', 'SENT', 'PAID', 'CANCELLED'] },
    ],
    defaults: { status: 'DRAFT', currency: 'EUR' },
    generateId: () => 'b' + Date.now(),
  },
};

const inputStyle = {
  background: 'transparent',
  border: 'none',
  borderBottom: '1px solid var(--border)',
  color: 'var(--text-main)',
  fontSize: 14,
  width: '100%',
  padding: '8px 0',
  borderRadius: 0,
  outline: 'none',
  transition: 'border-color 0.15s ease',
};

const selectStyle = {
  background: 'var(--bg-input)',
  border: '1px solid var(--border)',
  color: 'var(--text-main)',
  fontSize: 14,
  width: '100%',
  padding: '10px 12px',
  borderRadius: 8,
  outline: 'none',
  cursor: 'pointer',
  appearance: 'none',
  WebkitAppearance: 'none',
  backgroundImage: 'url("data:image/svg+xml,%3Csvg xmlns=%27http://www.w3.org/2000/svg%27 width=%2712%27 height=%2712%27 viewBox=%270 0 24 24%27 fill=%27none%27 stroke=%27%2371717a%27 stroke-width=%272%27 stroke-linecap=%27round%27 stroke-linejoin=%27round%27%3E%3Cpolyline points=%276 9 12 15 18 9%27%3E%3C/polyline%3E%3C/svg%3E")',
  backgroundRepeat: 'no-repeat',
  backgroundPosition: 'right 10px center',
  paddingRight: 36,
  transition: 'border-color 0.15s ease, background-color 0.15s ease',
};

export default function CreateSlideOver({ entityType, open, onClose, onSave, refData }) {
  const config = FORM_CONFIGS[entityType];
  const [formData, setFormData] = useState({});
  const [validationErrors, setValidationErrors] = useState({});

  useEffect(() => {
    if (open && config) {
      setFormData({ ...config.defaults });
      setValidationErrors({});
    }
  }, [open, config]);

  useEffect(() => {
    function handleKey(e) {
      if (e.key === 'Escape') onClose();
    }
    if (open) document.addEventListener('keydown', handleKey);
    return () => document.removeEventListener('keydown', handleKey);
  }, [open, onClose]);

  if (!config) return null;

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

  function updateField(key, value) {
    setFormData(prev => ({ ...prev, [key]: value }));
    validateField(key, value);
  }

  function handleSave() {
    const hasErrors = Object.values(validationErrors).some(Boolean);
    if (hasErrors) return;

    const id = config.generateId();
    const order = FIELD_ORDER[entityType] || Object.keys(formData);
    const newEntity = {};
    order.forEach(key => {
      if (key === 'id') newEntity.id = id;
      else if (key in formData) newEntity[key] = formData[key];
    });

    if (entityType === 'candidate' && typeof newEntity.skills === 'string') {
      newEntity.skills = newEntity.skills.split(',').map(s => s.trim()).filter(Boolean);
    }
    if (entityType === 'billing' && newEntity.amount) {
      newEntity.amount = parseFloat(newEntity.amount) || 0;
    }

    onSave(newEntity);
  }

  return (
    <>
      <div
        onClick={onClose}
        style={{
          position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.5)',
          zIndex: 40, opacity: open ? 1 : 0, pointerEvents: open ? 'auto' : 'none',
          transition: 'opacity 0.3s ease',
        }}
      />

      <div
        style={{
          position: 'fixed', top: 0, right: 0, bottom: 0, width: 420, maxWidth: '100vw',
          background: 'var(--bg-card)',
          borderLeft: '1px solid var(--card-border)',
          zIndex: 50,
          transform: open ? 'translateX(0)' : 'translateX(100%)',
          transition: 'transform 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
          display: 'flex', flexDirection: 'column',
          boxShadow: '0 0 40px rgba(0,0,0,0.5)',
        }}
      >
        <div style={{
          display: 'flex', alignItems: 'center', justifyContent: 'space-between',
          padding: '20px 24px', borderBottom: '1px solid var(--border)',
        }}>
          <h2 style={{ fontSize: 17, fontWeight: 700, color: 'var(--text-main)', margin: 0 }}>
            {config.title}
          </h2>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-app-text-muted hover:text-app-text-main hover:bg-app-bg-hover transition-colors"
          >
            <X size={18} />
          </button>
        </div>

        <div style={{ flex: 1, overflowY: 'auto', padding: '24px' }}>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 18 }}>
            {config.fields.map(field => (
              <div key={field.key}>
                <label style={{
                  display: 'block', fontSize: 12, fontWeight: 600,
                  color: 'var(--text-dim)', marginBottom: 4,
                  textTransform: 'uppercase', letterSpacing: '0.05em',
                }}>
                  {field.label}
                  {field.required && <span style={{ color: 'var(--danger)', marginLeft: 2 }}>*</span>}
                </label>

                {field.type === 'select' ? (
                  <select
                    value={formData[field.key] || ''}
                    onChange={e => updateField(field.key, e.target.value)}
                    style={selectStyle}
                    className="focus:border-app-accent"
                  >
                    {field.options.map(opt => (
                      <option key={opt} value={opt} style={{ background: 'var(--bg-card)', color: 'var(--text-main)' }}>
                        {opt}
                      </option>
                    ))}
                  </select>
                ) : field.type === 'entity-select' ? (
                  <select
                    value={formData[field.key] || ''}
                    onChange={e => updateField(field.key, e.target.value)}
                    style={selectStyle}
                    className="focus:border-app-accent"
                  >
                    <option value="" style={{ background: 'var(--bg-card)', color: 'var(--text-dim)' }}>
                      {field.required ? 'Bitte w\u00e4hlen...' : 'Keine'}
                    </option>
                    {(refData?.[field.entity] || []).filter(e => !e.archived).map(entity => {
                      const label = entity.companyName || (entity.firstName && entity.lastName ? `${entity.firstName} ${entity.lastName}` : null) || entity.title || entity.invoiceNumber || entity.id;
                      return (
                        <option key={entity.id} value={entity.id} style={{ background: 'var(--bg-card)', color: 'var(--text-main)' }}>
                          {label}
                        </option>
                      );
                    })}
                  </select>
                ) : field.type === 'date' ? (
                  <input
                    type="date"
                    value={formData[field.key] || ''}
                    onChange={e => updateField(field.key, e.target.value)}
                    style={{ ...inputStyle, colorScheme: 'dark' }}
                    className="focus:border-app-accent"
                  />
                ) : (
                  <input
                    type={field.type}
                    value={formData[field.key] || ''}
                    onChange={e => updateField(field.key, e.target.value)}
                    placeholder={field.required ? undefined : 'Optional'}
                    style={inputStyle}
                    className="focus:border-app-accent placeholder:text-app-text-dim"
                    step={field.type === 'number' ? '0.01' : undefined}
                  />
                )}
                {validationErrors[field.key] && (
                  <div style={{ fontSize: 11, color: 'var(--danger)', marginTop: 4 }}>
                    {validationErrors[field.key]}
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>

        <div style={{
          padding: '20px 24px', borderTop: '1px solid var(--border)',
          display: 'flex', gap: 10,
        }}>
          <button
            onClick={onClose}
            className="flex-1 inline-flex items-center justify-center gap-2 px-4 py-2.5 rounded-lg text-sm font-medium border border-app-border text-app-text-muted hover:text-app-text-main hover:bg-app-bg-hover transition-colors"
          >
            Abbrechen
          </button>
          <button
            onClick={handleSave}
            className="flex-1 inline-flex items-center justify-center gap-2 px-4 py-2.5 rounded-lg text-sm font-semibold bg-app-accent text-white hover:bg-app-accent-hover transition-colors"
          >
            <Plus size={14} />
            Speichern
          </button>
        </div>
      </div>
    </>
  );
}
