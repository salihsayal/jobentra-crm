import { useState, useEffect } from 'react';
import { X, Plus } from 'lucide-react';

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
      { key: 'customerName', label: 'Kunde', type: 'text', required: true },
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
      { key: 'customerName', label: 'Kunde', type: 'text', required: true },
      { key: 'candidateName', label: 'Kandidat', type: 'text' },
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

const inputFocusStyle = {
  borderBottom: '1px solid var(--accent)',
};

const selectStyle = {
  ...inputStyle,
  cursor: 'pointer',
  appearance: 'none',
};

export default function CreateSlideOver({ entityType, open, onClose, onSave }) {
  const config = FORM_CONFIGS[entityType];
  const [formData, setFormData] = useState({});

  useEffect(() => {
    if (open && config) {
      setFormData({ ...config.defaults });
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

  function updateField(key, value) {
    setFormData(prev => ({ ...prev, [key]: value }));
  }

  function handleSave() {
    const newEntity = { id: config.generateId(), ...formData };

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
