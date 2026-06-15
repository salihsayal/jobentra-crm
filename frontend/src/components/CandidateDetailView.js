import { useState, useRef, useMemo, useEffect, useCallback } from 'react';
import {
  ArrowLeft, FileText, ShieldOff, Check, Undo2, MapPin, Calendar,
  User, Mail, Phone, Briefcase, GraduationCap, FolderOpen, Clock,
  MessageSquare, Award, Upload, Download, Trash2, Plus, X
} from 'lucide-react';
import { api } from '@/utils/api';
import { extractCity } from '@/utils/format';

const STATUS_COLORS = {
  NEW: { bg: 'rgba(129,140,248,0.12)', text: '#818cf8' },
  IN_PROCESS: { bg: 'rgba(251,191,36,0.12)', text: '#fbbf24' },
  PLACED: { bg: 'rgba(52,211,153,0.12)', text: '#34d399' },
  REJECTED: { bg: 'rgba(251,113,133,0.12)', text: '#fb7185' },
};

const TIMELINE_ICONS = {
  CALL_NOTE: { color: 'rgba(251,191,36,0.15)', iconColor: 'var(--chart-3)', icon: MessageSquare, label: 'Anrufnotiz' },
  ASSIGNMENT: { color: 'rgba(129,140,248,0.15)', iconColor: 'var(--chart-1)', icon: Briefcase, label: 'Einsatz' },
  STATUS_CHANGE: { color: 'rgba(34,211,238,0.15)', iconColor: 'var(--chart-7)', icon: Clock, label: 'Status' },
};

function StatusBadge({ status }) {
  const s = STATUS_COLORS[status] || { bg: 'rgba(100,116,139,0.12)', text: '#94a3b8' };
  return (
    <span style={{ display: 'inline-block', padding: '3px 12px', borderRadius: 999, fontSize: 12, fontWeight: 600, background: s.bg, color: s.text, letterSpacing: '0.02em' }}>
      {status}
    </span>
  );
}

const INPUT_STYLE = {
  background: 'transparent', border: 'none', color: 'var(--text-main)', fontSize: 13,
  fontWeight: 600, textAlign: 'right', width: '100%', padding: '2px 4px', borderRadius: 4,
  outline: 'none', cursor: 'text', transition: 'background 0.15s ease, border-color 0.15s ease',
};

const FIELD_LABELS = {
  firstName: 'Vorname', lastName: 'Nachname', email: 'Email', phone: 'Telefon',
  skills: 'F\u00E4higkeiten', job: 'Position', location: 'Adresse',
  mobility: 'Mobilit\u00E4t', availability: 'Verf\u00FCgbarkeit', status: 'Status',
};

const STATUS_OPTIONS = ['NEW', 'IN_PROCESS', 'PLACED', 'REJECTED'];
const EDITABLE_KEYS = ['firstName', 'lastName', 'email', 'phone', 'skills', 'job', 'location', 'mobility', 'availability', 'status'];

const TABS = [
  { key: 'info', label: 'Info' },
  { key: 'skills', label: 'Skills' },
  { key: 'vault', label: 'Vault' },
  { key: 'timeline', label: 'Timeline' },
];

function formatField(key, value) {
  if (value == null) return '';
  if (key === 'mobility') return value ? 'PKW vorhanden' : 'Kein PKW';
  if (key === 'availability' && /^\d{4}-\d{2}-\d{2}/.test(value)) {
    return new Date(value + 'T00:00:00').toLocaleDateString('de-DE', { day: '2-digit', month: 'long', year: 'numeric' });
  }
  if (Array.isArray(value)) return value.join(', ');
  return String(value);
}

function formatFileSize(bytes) {
  if (!bytes) return '0 B';
  if (bytes < 1024) return bytes + ' B';
  if (bytes < 1048576) return (bytes / 1024).toFixed(1) + ' KB';
  return (bytes / 1048576).toFixed(1) + ' MB';
}

function formatDate(dateStr) {
  if (!dateStr) return '';
  const d = new Date(dateStr);
  return d.toLocaleDateString('de-DE', { day: '2-digit', month: '2-digit', year: 'numeric' });
}

function parseField(key, value) {
  if (key === 'skills') return String(value ?? '');
  if (key === 'mobility') return value === true || value === 'true';
  return value;
}

function detectCategory(filename) {
  const lower = (filename || '').toLowerCase();
  if (lower.includes('censored') || lower.includes('anonym')) return 'CENSORED';
  if (lower.includes('lebenslauf') || lower.includes('cv') || lower.includes('resume')) return 'CV';
  if (lower.includes('zertifikat') || lower.includes('zeugnis') || lower.includes('certificate')) return 'CERTIFICATE';
  return 'OTHER';
}

export default function CandidateDetailView({ entity, onBack, onEntityUpdate }) {
  const originalData = useRef({ ...entity });
  const [formData, setFormData] = useState({ ...entity });
  const [focusedField, setFocusedField] = useState(null);
  const [hoveredField, setHoveredField] = useState(null);
  const [validationErrors, setValidationErrors] = useState({});
  const [activeTab, setActiveTab] = useState('info');

  const [documents, setDocuments] = useState([]);
  const [timelineEvents, setTimelineEvents] = useState([]);
  const [docsLoading, setDocsLoading] = useState(false);
  const [timelineLoading, setTimelineLoading] = useState(false);

  const [showTimelineForm, setShowTimelineForm] = useState(false);
  const [newEvent, setNewEvent] = useState({ eventType: 'CALL_NOTE', title: '', description: '' });
  const [savingEvent, setSavingEvent] = useState(false);

  const [pendingFile, setPendingFile] = useState(null);
  const [pendingCategory, setPendingCategory] = useState('CV');
  const [showCategoryPicker, setShowCategoryPicker] = useState(false);

  const [geoCoords, setGeoCoords] = useState(null);
  const [geoLoading, setGeoLoading] = useState(false);
  const [geoError, setGeoError] = useState(false);
  const geoCachedRef = useRef({});

  const [processingDoc, setProcessingDoc] = useState(false);
  const pollTimerRef = useRef(null);

  const candidateId = entity.id;

  const fetchDocuments = useCallback(async () => {
    setDocsLoading(true);
    try {
      const docs = await api.candidates.documents.list(candidateId);
      setDocuments(Array.isArray(docs) ? docs : []);
    } catch (e) {
      console.error('Failed to fetch documents:', e);
    }
    setDocsLoading(false);
  }, [candidateId]);

  const fetchTimeline = useCallback(async () => {
    setTimelineLoading(true);
    try {
      const events = await api.candidates.timeline.list(candidateId);
      setTimelineEvents(Array.isArray(events) ? events : []);
    } catch (e) {
      console.error('Failed to fetch timeline:', e);
    }
    setTimelineLoading(false);
  }, [candidateId]);

  useEffect(() => { setFormData({ ...entity }); originalData.current = { ...entity }; }, [entity]);
  useEffect(() => { fetchDocuments(); fetchTimeline(); }, [fetchDocuments, fetchTimeline]);

  useEffect(() => {
    const address = entity.location;
    if (!address) { setGeoCoords(null); return; }
    if (geoCachedRef.current[address]) {
      setGeoCoords(geoCachedRef.current[address]);
      return;
    }
    let cancelled = false;
    setGeoLoading(true);
    setGeoError(false);
    fetch(`https://nominatim.openstreetmap.org/search?format=json&limit=1&q=${encodeURIComponent(address)}`)
      .then(r => r.json())
      .then(data => {
        if (cancelled) return;
        if (data && data.length > 0) {
          const coords = { lat: parseFloat(data[0].lat), lon: parseFloat(data[0].lon) };
          geoCachedRef.current[address] = coords;
          setGeoCoords(coords);
        } else {
          setGeoError(true);
        }
      })
      .catch(() => { if (!cancelled) setGeoError(true); })
      .finally(() => { if (!cancelled) setGeoLoading(false); });
    return () => { cancelled = true; };
  }, [entity.location]);

  async function handleUpload(file, category) {
    try {
      await api.candidates.documents.upload(candidateId, file, category);
      fetchDocuments();
      let elapsed = 0;
      clearInterval(pollTimerRef.current);
      pollTimerRef.current = setInterval(async () => {
        elapsed += 3;
        fetchDocuments();
        try {
          const candidate = await api.candidates.getById(candidateId);
          if (candidate && candidate.skills !== entity.skills) {
            entity.skills = candidate.skills;
            setFormData(prev => ({ ...prev, skills: candidate.skills }));
            clearInterval(pollTimerRef.current);
            setProcessingDoc(false);
          }
        } catch {}
        if (elapsed >= 60) {
          clearInterval(pollTimerRef.current);
          setProcessingDoc(false);
        }
      }, 3000);
    } catch (e) {
      console.error('Upload failed:', e);
      setProcessingDoc(false);
    }
  }

  async function handleDeleteDocument(docId) {
    try {
      await api.candidates.documents.delete(candidateId, docId);
      fetchDocuments();
    } catch (e) {
      console.error('Delete failed:', e);
    }
  }

  async function handleCreateTimelineEvent() {
    if (!newEvent.title.trim()) return;
    setSavingEvent(true);
    try {
      await api.candidates.timeline.create(candidateId, {
        eventType: newEvent.eventType,
        title: newEvent.title,
        description: newEvent.description,
        userName: 'Admin',
      });
      setNewEvent({ eventType: 'CALL_NOTE', title: '', description: '' });
      setShowTimelineForm(false);
      fetchTimeline();
    } catch (e) {
      console.error('Failed to create event:', e);
    }
    setSavingEvent(false);
  }

  const fullName = `${formData.firstName || entity.firstName} ${formData.lastName || entity.lastName}`;
  const initials = `${(formData.firstName || '?')[0]}${(formData.lastName || '?')[0]}`;

  const isDirty = useMemo(() => {
    return EDITABLE_KEYS.some(key => {
      const a = key === 'skills' ? String(formData[key] ?? '') : String(formData[key] ?? '');
      const b = key === 'skills' ? String(originalData.current[key] ?? '') : String(originalData.current[key] ?? '');
      return a !== b;
    });
  }, [formData]);

  function validate(key, value) {
    const str = String(value ?? '').trim();
    if (!str) { setValidationErrors(prev => ({ ...prev, [key]: null })); return true; }
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

  function handleChange(key, value) {
    setFormData(prev => ({ ...prev, [key]: value }));
    validate(key, value);
  }

  async function handleSave() {
    if (Object.values(validationErrors).some(Boolean)) return;
    const body = {};
    EDITABLE_KEYS.forEach(k => { body[k] = parseField(k, formData[k]); });
    if (onEntityUpdate) {
      try {
        const updated = await onEntityUpdate('candidate', entity.id, body);
        if (updated) Object.keys(updated).forEach(k => { if (k in entity) entity[k] = updated[k]; });
      } catch (e) { console.error('Save failed:', e); return; }
    }
    originalData.current = { ...entity };
    setFormData({ ...entity });
    setValidationErrors({});
  }

  function handleCancel() {
    setFormData({ ...originalData.current });
  }

  function inputStyle(key) {
    const f = focusedField === key;
    const h = hoveredField === key;
    return {
      ...INPUT_STYLE,
      background: f ? 'var(--bg-input)' : h ? 'var(--bg-hover)' : 'transparent',
      borderBottom: f ? '1px solid var(--accent)' : '1px solid transparent',
    };
  }

  const skillTags = (formData.skills || entity.skills || '')
    .split(',').map(s => s.trim()).filter(Boolean);

  const locationCity = extractCity(formData.location || entity.location);

  return (
    <div>
      {/* Back button */}
      <div style={{ marginBottom: 16 }}>
        <button
          onClick={onBack}
          className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-sm text-app-text-muted hover:text-app-text-main hover:bg-app-bg-hover border border-app-border transition-colors"
        >
          <ArrowLeft size={16} />
          Zur&uuml;ck
        </button>
      </div>

      {/* Header Card */}
      <div style={{ background: 'var(--bg-card)', border: '1px solid var(--card-border)', borderRadius: 12, padding: 24, marginBottom: 16 }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: 16, flexWrap: 'wrap' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
            <div style={{
              width: 56, height: 56, borderRadius: '50%', background: 'var(--accent-light)',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              fontSize: 20, fontWeight: 700, color: 'var(--accent)', flexShrink: 0,
            }}>
              {initials}
            </div>
            <div>
              <div style={{ display: 'flex', alignItems: 'center', gap: 12, flexWrap: 'wrap' }}>
                <h2 style={{ fontSize: 22, fontWeight: 700, color: 'var(--text-main)', margin: 0 }}>
                  {fullName}
                </h2>
                <StatusBadge status={formData.status || entity.status} />
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: 16, marginTop: 6, flexWrap: 'wrap' }}>
                <span style={{ display: 'inline-flex', alignItems: 'center', gap: 4, fontSize: 13, color: 'var(--text-muted)' }}>
                  <Briefcase size={14} /> {formData.job || entity.job || '-'}
                </span>
                <span style={{ display: 'inline-flex', alignItems: 'center', gap: 4, fontSize: 13, color: 'var(--text-muted)' }}>
                  <MapPin size={14} /> {locationCity || (formData.location || entity.location || '-')}
                </span>
              </div>
            </div>
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: 10 }}>
            <div style={{ display: 'flex', gap: 8 }}>
              <button className="inline-flex items-center gap-2 px-3.5 py-2 rounded-lg text-sm font-semibold bg-app-accent text-white hover:bg-app-accent-hover transition-colors">
                <FileText size={15} /> Lebenslauf-Generator
              </button>
              <button className="inline-flex items-center gap-2 px-3.5 py-2 rounded-lg text-sm font-semibold border border-app-accent text-app-accent hover:bg-app-accent hover:text-white transition-colors">
                <ShieldOff size={15} /> CV-Anonymisierer
              </button>
            </div>
            <div style={{
              display: 'flex', gap: 8,
              opacity: isDirty ? 1 : 0,
              transform: isDirty ? 'translateX(0)' : 'translateX(8px)',
              pointerEvents: isDirty ? 'auto' : 'none',
              transition: 'opacity 0.2s ease, transform 0.2s ease',
            }}>
              <button onClick={handleCancel} className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-sm font-medium border border-app-border text-app-text-muted hover:text-app-text-main hover:bg-app-bg-hover transition-colors">
                <Undo2 size={14} /> R&uuml;ckg&auml;ngig machen
              </button>
              <button onClick={handleSave} className="inline-flex items-center gap-1.5 px-4 py-1.5 rounded-lg text-sm font-semibold bg-app-accent text-white hover:bg-app-accent-hover transition-colors">
                <Check size={14} /> Anwenden
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Tab Navigation */}
      <div style={{ display: 'flex', gap: 0, marginBottom: 16, borderBottom: '1px solid var(--border)' }}>
        {TABS.map(tab => (
          <button
            key={tab.key}
            onClick={() => setActiveTab(tab.key)}
            style={{
              padding: '10px 20px', fontSize: 13, fontWeight: 600,
              color: activeTab === tab.key ? 'var(--accent)' : 'var(--text-dim)',
              background: 'transparent', border: 'none',
              borderBottom: activeTab === tab.key ? '2px solid var(--accent)' : '2px solid transparent',
              cursor: 'pointer', transition: 'color 0.15s, border-color 0.15s',
            }}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {/* Info Tab */}
      {activeTab === 'info' && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
          <div style={{ background: 'var(--bg-card)', border: '1px solid var(--card-border)', borderRadius: 12, padding: 24 }}>
            <h3 style={{ fontSize: 13, fontWeight: 700, color: 'var(--text-dim)', marginBottom: 16, textTransform: 'uppercase', letterSpacing: '0.05em' }}>
              Pers&ouml;nliche Daten
            </h3>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px 24px' }}>
              {['firstName', 'lastName', 'email', 'phone', 'location', 'availability', 'mobility', 'job', 'status'].map(key => {
                const value = formData[key];
                const display = formatField(key, value);
                const err = validationErrors[key];
                return (
                  <div key={key} style={{ padding: '10px 0', borderBottom: '1px solid var(--border)' }}
                    onMouseEnter={() => setHoveredField(key)} onMouseLeave={() => setHoveredField(null)}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                      <span style={{ fontSize: 13, fontWeight: 500, color: 'var(--text-muted)', minWidth: 110 }}>
                        {FIELD_LABELS[key]}
                      </span>
                      {key === 'status' ? (
                        <select value={formData[key] || ''} onChange={(e) => handleChange(key, e.target.value)}
                          style={{
                            background: 'var(--bg-input)', border: '1px solid var(--border)',
                            color: 'var(--text-main)', fontSize: 12, fontWeight: 600,
                            padding: '6px 28px 6px 10px', borderRadius: 6, outline: 'none',
                            cursor: 'pointer', appearance: 'none', WebkitAppearance: 'none',
                            backgroundImage: 'url("data:image/svg+xml,%3Csvg xmlns=%27http://www.w3.org/2000/svg%27 width=%2710%27 height=%2710%27 viewBox=%270 0 24 24%27 fill=%27none%27 stroke=%27%2371717a%27 stroke-width=%272%27 stroke-linecap=%27round%27 stroke-linejoin=%27round%27%3E%3Cpolyline points=%276 9 12 15 18 9%27%3E%3C/polyline%3E%3C/svg%3E")',
                            backgroundRepeat: 'no-repeat', backgroundPosition: 'right 8px center',
                            transition: 'border-color 0.15s ease',
                          }}>
                          {STATUS_OPTIONS.map(opt => (
                            <option key={opt} value={opt} style={{ background: 'var(--bg-card)', color: 'var(--text-main)' }}>{opt}</option>
                          ))}
                        </select>
                      ) : key === 'mobility' ? (
                        <label style={{ cursor: 'pointer', display: 'inline-flex', alignItems: 'center', gap: 8 }}>
                          <span style={{ fontSize: 11, color: 'var(--text-dim)' }}>Kein PKW</span>
                          <div onClick={() => handleChange(key, !formData[key])}
                            style={{
                              width: 36, height: 20, borderRadius: 10,
                              background: formData[key] ? 'var(--accent)' : 'var(--border)',
                              position: 'relative', transition: 'background 0.2s ease',
                            }}>
                            <div style={{
                              width: 16, height: 16, borderRadius: '50%', background: '#fff',
                              position: 'absolute', top: 2, left: formData[key] ? 18 : 2,
                              transition: 'left 0.2s ease',
                            }} />
                          </div>
                          <span style={{ fontSize: 11, color: 'var(--text-dim)' }}>PKW</span>
                        </label>
                      ) : key === 'availability' ? (
                        <input type="text" value={typeof formData[key] === 'string' ? formData[key] : display}
                          placeholder="Sofort oder JJJJ-MM-TT"
                          onChange={(e) => handleChange(key, e.target.value)}
                          onFocus={() => setFocusedField(key)} onBlur={() => setFocusedField(null)} style={inputStyle(key)} />
                      ) : (
                        <input type="text" value={typeof formData[key] === 'string' ? formData[key] : display}
                          onChange={(e) => handleChange(key, e.target.value)}
                          onFocus={() => setFocusedField(key)} onBlur={() => setFocusedField(null)} style={inputStyle(key)} />
                      )}
                    </div>
                    {err && <div style={{ fontSize: 11, color: 'var(--danger)', marginTop: 4, textAlign: 'right' }}>{err}</div>}
                  </div>
                );
              })}
            </div>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
            <div style={{ background: 'var(--bg-card)', border: '1px solid var(--card-border)', borderRadius: 12, padding: 20 }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 12 }}>
                <MapPin size={16} style={{ color: 'var(--accent)' }} />
                <span style={{ fontSize: 13, fontWeight: 700, color: 'var(--text-dim)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                  Geokodierte Adresse
                </span>
              </div>
              {geoLoading ? (
                <div style={{ background: 'var(--bg-input)', borderRadius: 8, height: 250, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                  <span style={{ fontSize: 12, color: 'var(--text-dim)' }}>Adresse wird gesucht...</span>
                </div>
              ) : geoCoords ? (
                <div style={{ borderRadius: 8, overflow: 'hidden', height: 250 }}>
                  <iframe
                    title="Karte"
                    width="100%"
                    height="250"
                    frameBorder="0"
                    scrolling="no"
                    src={`https://www.openstreetmap.org/export/embed.html?bbox=${geoCoords.lon - 0.02}%2C${geoCoords.lat - 0.01}%2C${geoCoords.lon + 0.02}%2C${geoCoords.lat + 0.01}&layer=mapnik&marker=${geoCoords.lat}%2C${geoCoords.lon}`}
                    style={{ border: 'none' }}
                  />
                </div>
              ) : (
                <div style={{
                  background: 'var(--bg-input)', borderRadius: 8, height: 250,
                  display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center',
                  border: '1px dashed var(--border)', gap: 6,
                }}>
                  <MapPin size={28} style={{ color: 'var(--text-dim)', opacity: 0.4 }} />
                  <span style={{ fontSize: 13, fontWeight: 600, color: 'var(--text-main)' }}>
                    {geoError ? 'Adresse nicht gefunden' : (formData.location || entity.location || 'Keine Adresse')}
                  </span>
                  <span style={{ fontSize: 11, color: 'var(--text-dim)' }}>
                    {geoError ? 'Bitte Adresse pr\u00fcfen' : 'Keine Koordinaten verf\u00fcgbar'}
                  </span>
                </div>
              )}
            </div>
            <div style={{ background: 'var(--bg-card)', border: '1px solid var(--card-border)', borderRadius: 12, padding: 20 }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 12 }}>
                <Calendar size={16} style={{ color: 'var(--accent)' }} />
                <span style={{ fontSize: 13, fontWeight: 700, color: 'var(--text-dim)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                  DSGVO-Timer
                </span>
              </div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <span style={{ fontSize: 12, color: 'var(--text-muted)' }}>Einwilligung erteilt</span>
                  <span style={{ fontSize: 13, fontWeight: 700, color: 'var(--text-main)' }}>01.01.2024</span>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <span style={{ fontSize: 12, color: 'var(--text-muted)' }}>Datenl&ouml;schung in</span>
                  <span style={{ fontSize: 18, fontWeight: 700, color: 'var(--warning)' }}>365 Tagen</span>
                </div>
                <div style={{ marginTop: 4, height: 6, borderRadius: 3, background: 'var(--bg-input)', overflow: 'hidden' }}>
                  <div style={{ width: '48%', height: '100%', borderRadius: 3, background: 'var(--success)', transition: 'width 0.5s ease' }} />
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Skills Tab */}
      {activeTab === 'skills' && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
          <div style={{ background: 'var(--bg-card)', border: '1px solid var(--card-border)', borderRadius: 12, padding: 24 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 16 }}>
              <Award size={16} style={{ color: 'var(--accent)' }} />
              <span style={{ fontSize: 13, fontWeight: 700, color: 'var(--text-dim)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                 F&auml;higkeiten
              </span>
            </div>
            {skillTags.length > 0 ? (
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8 }}>
                {skillTags.map((tag, i) => (
                  <span key={i} style={{
                    display: 'inline-flex', alignItems: 'center', gap: 4,
                    padding: '6px 14px', borderRadius: 999, fontSize: 12, fontWeight: 600,
                    background: 'var(--accent-light)', color: 'var(--accent)',
                  }}>
                    {tag}
                  </span>
                ))}
              </div>
            ) : (
              <div style={{ padding: 32, textAlign: 'center', color: 'var(--text-dim)', fontSize: 13 }}>
                <GraduationCap size={32} style={{ margin: '0 auto 12', opacity: 0.3 }} />
                <div>Keine F&auml;higkeiten hinterlegt.</div>
                <div style={{ fontSize: 12, marginTop: 4 }}>F&uuml;ge &quot;Skills&quot; im Info-Tab hinzu, um sie hier anzuzeigen.</div>
              </div>
            )}
          </div>
          <div style={{ background: 'var(--bg-card)', border: '1px solid var(--card-border)', borderRadius: 12, padding: 24 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 16 }}>
              <FileText size={16} style={{ color: 'var(--accent)' }} />
              <span style={{ fontSize: 13, fontWeight: 700, color: 'var(--text-dim)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                Zertifikate
              </span>
            </div>
            <div style={{ padding: 32, textAlign: 'center', color: 'var(--text-dim)', fontSize: 13 }}>
              <Award size={32} style={{ margin: '0 auto 12', opacity: 0.3 }} />
              <div>Keine Zertifikate hinterlegt.</div>
              <div style={{ fontSize: 12, marginTop: 4 }}>Lade Zertifikate im Vault-Tab hoch.</div>
            </div>
          </div>
        </div>
      )}

      {/* Vault Tab */}
      {activeTab === 'vault' && (
        <div style={{ background: 'var(--bg-card)', border: '1px solid var(--card-border)', borderRadius: 12, padding: 24 }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 16 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
              <FolderOpen size={16} style={{ color: 'var(--accent)' }} />
              <span style={{ fontSize: 13, fontWeight: 700, color: 'var(--text-dim)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                Dokumente
              </span>
            </div>
            <label style={{ cursor: 'pointer' }} className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold bg-app-accent text-white hover:bg-app-accent-hover transition-colors">
              <Upload size={13} /> Upload
              <input type="file" style={{ display: 'none' }} onChange={(e) => {
                if (e.target.files[0]) {
                  setPendingFile(e.target.files[0]);
                  setPendingCategory(detectCategory(e.target.files[0].name));
                  setShowCategoryPicker(true);
                  e.target.value = '';
                }
              }} />
            </label>
          </div>

          {showCategoryPicker && pendingFile && (
            <div style={{
              marginTop: 12, padding: 14, background: 'var(--bg-input)', borderRadius: 8,
              border: '1px solid var(--border)', display: 'flex', flexDirection: 'column', gap: 10,
            }}>
              <div style={{ fontSize: 12, color: 'var(--text-muted)', display: 'flex', alignItems: 'center', gap: 6 }}>
                <FileText size={14} style={{ color: 'var(--accent)' }} />
                <span style={{ fontWeight: 600, color: 'var(--text-main)' }}>{pendingFile.name}</span>
                <span style={{ color: 'var(--text-dim)' }}>({(pendingFile.size / 1024).toFixed(1)} KB)</span>
              </div>
              <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
                <span style={{ fontSize: 11, color: 'var(--text-dim)', whiteSpace: 'nowrap' }}>Kategorie:</span>
                <select value={pendingCategory} onChange={(e) => setPendingCategory(e.target.value)}
                  style={{
                    flex: 1, background: 'var(--bg-card)', border: '1px solid var(--border)',
                    color: 'var(--text-main)', fontSize: 12, padding: '6px 10px', borderRadius: 6, outline: 'none',
                  }}>
                  <option value="CV" style={{ background: 'var(--bg-card)', color: 'var(--text-main)' }}>CV (Lebenslauf)</option>
                  <option value="CERTIFICATE" style={{ background: 'var(--bg-card)', color: 'var(--text-main)' }}>CERTIFICATE (Zertifikat / Zeugnis)</option>
                  <option value="CENSORED" style={{ background: 'var(--bg-card)', color: 'var(--text-main)' }}>CENSORED (Anonymisiert)</option>
                  <option value="OTHER" style={{ background: 'var(--bg-card)', color: 'var(--text-main)' }}>OTHER (Sonstiges)</option>
                </select>
              </div>
              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 6 }}>
                <button onClick={() => { setShowCategoryPicker(false); setPendingFile(null); }}
                  className="inline-flex items-center gap-1 px-3 py-1.5 rounded-lg text-xs font-medium border border-app-border text-app-text-muted hover:text-app-text-main hover:bg-app-bg-hover transition-colors">
                  <X size={12} /> Abbrechen
                </button>
                <button onClick={() => {
                  setProcessingDoc(true);
                  setShowCategoryPicker(false);
                  handleUpload(pendingFile, pendingCategory);
                  setPendingFile(null);
                }}
                  className="inline-flex items-center gap-1 px-3 py-1.5 rounded-lg text-xs font-semibold bg-app-accent text-white hover:bg-app-accent-hover transition-colors">
                  <Upload size={12} /> Hochladen
                </button>
              </div>
            </div>
          )}

          {processingDoc && (
            <div style={{
              marginTop: 12, padding: '12px 16px', background: 'var(--bg-input)',
              borderRadius: 8, border: '1px solid var(--card-border)',
              display: 'flex', alignItems: 'center', gap: 10,
            }}>
              <svg width="20" height="20" viewBox="0 0 20 20" style={{ flexShrink: 0 }}>
                <circle cx="10" cy="10" r="8" fill="none" stroke="var(--border)" strokeWidth="2" opacity="0.3" />
                <g>
                  <animateTransform attributeName="transform" type="rotate" from="0 10 10" to="360 10 10" dur="0.8s" repeatCount="indefinite" />
                  <path d="M10 2a8 8 0 0 1 8 8" fill="none" stroke="var(--accent)" strokeWidth="2" strokeLinecap="round" />
                </g>
              </svg>
              <span style={{ fontSize: 13, color: 'var(--text-muted)', fontWeight: 500 }}>
                Dokument wird verarbeitet...
              </span>
            </div>
          )}
          {docsLoading ? (
            <div style={{ padding: 32, textAlign: 'center', color: 'var(--text-dim)', fontSize: 13 }}>Lade Dokumente...</div>
          ) : documents.length === 0 ? (
            <div style={{ padding: 32, textAlign: 'center', color: 'var(--text-dim)', fontSize: 13 }}>
              <FolderOpen size={32} style={{ margin: '0 auto 12', opacity: 0.3 }} />
              <div>Keine Dokumente vorhanden.</div>
              <div style={{ fontSize: 12, marginTop: 4 }}>Lade Lebensl&auml;ufe, Zeugnisse oder Zertifikate hoch.</div>
            </div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 0 }}>
              {documents.map((doc, i) => (
                <div key={doc.id || i} style={{
                  display: 'flex', alignItems: 'center', gap: 12,
                  padding: '12px 14px', borderBottom: i < documents.length - 1 ? '1px solid var(--border)' : 'none',
                }}>
                  <div style={{
                    width: 36, height: 36, borderRadius: 8, flexShrink: 0,
                    background: 'var(--accent-light)', display: 'flex',
                    alignItems: 'center', justifyContent: 'center',
                  }}>
                    <FileText size={16} style={{ color: 'var(--accent)' }} />
                  </div>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ fontSize: 13, fontWeight: 600, color: 'var(--text-main)', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                      {doc.originalFilename || doc.filename}
                    </div>
                    <div style={{ fontSize: 11, color: 'var(--text-dim)', marginTop: 2 }}>
                      {formatDate(doc.createdAt)} &middot; {formatFileSize(doc.fileSize)}
                      {doc.category && (
                        <span style={{
                          marginLeft: 8, padding: '1px 6px', borderRadius: 4, fontSize: 10, fontWeight: 600,
                          background: doc.category === 'CENSORED' ? 'rgba(5, 150, 105, 0.12)' : 'var(--accent-light)',
                          color: doc.category === 'CENSORED' ? 'var(--success)' : 'var(--accent)',
                        }}>{doc.category}</span>
                      )}
                    </div>
                  </div>
                  <a
                    href={api.candidates.documents.downloadUrl(candidateId, doc.id)}
                    download={doc.originalFilename}
                    style={{ color: 'var(--text-dim)', padding: 6, borderRadius: 6 }}
                    className="hover:text-app-accent hover:bg-app-bg-hover transition-colors"
                    title="Herunterladen"
                  >
                    <Download size={14} />
                  </a>
                  <button
                    onClick={() => handleDeleteDocument(doc.id)}
                    style={{ color: 'var(--text-dim)', padding: 6, borderRadius: 6 }}
                    className="hover:text-app-danger hover:bg-app-bg-hover transition-colors"
                    title="L\u00f6schen"
                  >
                    <Trash2 size={14} />
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Timeline Tab */}
      {activeTab === 'timeline' && (
        <div style={{ background: 'var(--bg-card)', border: '1px solid var(--card-border)', borderRadius: 12, padding: 24 }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 20 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
              <Clock size={16} style={{ color: 'var(--accent)' }} />
              <span style={{ fontSize: 13, fontWeight: 700, color: 'var(--text-dim)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                Aktivit&auml;tsverlauf
              </span>
            </div>
            <button
              onClick={() => setShowTimelineForm(!showTimelineForm)}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold bg-app-accent text-white hover:bg-app-accent-hover transition-colors"
            >
              <Plus size={13} /> Eintrag
            </button>
          </div>

          {showTimelineForm && (
            <div style={{ marginBottom: 16, padding: 14, background: 'var(--bg-input)', borderRadius: 8, border: '1px solid var(--border)' }}>
              <div style={{ display: 'flex', gap: 8, marginBottom: 8 }}>
                <select value={newEvent.eventType} onChange={e => setNewEvent(prev => ({ ...prev, eventType: e.target.value }))}
                  style={{
                    background: 'var(--bg-card)', border: '1px solid var(--border)', color: 'var(--text-main)',
                    fontSize: 12, padding: '6px 10px', borderRadius: 6, outline: 'none',
                  }}>
                  <option value="CALL_NOTE" style={{ background: 'var(--bg-card)', color: 'var(--text-main)' }}>Anrufnotiz</option>
                  <option value="ASSIGNMENT" style={{ background: 'var(--bg-card)', color: 'var(--text-main)' }}>Einsatz</option>
                  <option value="STATUS_CHANGE" style={{ background: 'var(--bg-card)', color: 'var(--text-main)' }}>Status&auml;nderung</option>
                </select>
                <input type="text" placeholder="Titel" value={newEvent.title}
                  onChange={e => setNewEvent(prev => ({ ...prev, title: e.target.value }))}
                  style={{ flex: 1, background: 'var(--bg-card)', border: '1px solid var(--border)', color: 'var(--text-main)', fontSize: 12, padding: '6px 10px', borderRadius: 6, outline: 'none' }} />
              </div>
              <textarea placeholder="Beschreibung" value={newEvent.description}
                onChange={e => setNewEvent(prev => ({ ...prev, description: e.target.value }))}
                rows={3}
                style={{ width: '100%', background: 'var(--bg-card)', border: '1px solid var(--border)', color: 'var(--text-main)', fontSize: 12, padding: '6px 10px', borderRadius: 6, outline: 'none', resize: 'vertical', marginBottom: 8 }} />
              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 6 }}>
                <button onClick={() => setShowTimelineForm(false)}
                  className="inline-flex items-center gap-1 px-3 py-1.5 rounded-lg text-xs font-medium border border-app-border text-app-text-muted hover:text-app-text-main hover:bg-app-bg-hover transition-colors">
                  Abbrechen
                </button>
                <button onClick={handleCreateTimelineEvent} disabled={savingEvent || !newEvent.title.trim()}
                  style={{ opacity: savingEvent || !newEvent.title.trim() ? 0.5 : 1 }}
                  className="inline-flex items-center gap-1 px-3 py-1.5 rounded-lg text-xs font-semibold bg-app-accent text-white hover:bg-app-accent-hover transition-colors">
                  <Check size={13} /> Speichern
                </button>
              </div>
            </div>
          )}

          {timelineLoading ? (
            <div style={{ padding: 32, textAlign: 'center', color: 'var(--text-dim)', fontSize: 13 }}>Lade Verlauf...</div>
          ) : timelineEvents.length === 0 ? (
            <div style={{ padding: 32, textAlign: 'center', color: 'var(--text-dim)', fontSize: 13 }}>
              <Clock size={32} style={{ margin: '0 auto 12', opacity: 0.3 }} />
              <div>Keine Eintr&auml;ge vorhanden.</div>
              <div style={{ fontSize: 12, marginTop: 4 }}>Erfasse Anrufnotizen, Einsatzhistorien oder Status&auml;nderungen.</div>
            </div>
          ) : (
            <div style={{ position: 'relative', paddingLeft: 28 }}>
              <div style={{ position: 'absolute', left: 7, top: 8, bottom: 8, width: 2, background: 'var(--border)' }} />
              {timelineEvents.map((item, i) => {
                const ti = TIMELINE_ICONS[item.eventType] || TIMELINE_ICONS.STATUS_CHANGE;
                const IconComp = ti.icon;
                return (
                  <div key={item.id || i} style={{ position: 'relative', paddingBottom: i < timelineEvents.length - 1 ? 24 : 0 }}>
                    <div style={{
                      position: 'absolute', left: -21, top: 4, width: 16, height: 16, borderRadius: '50%',
                      background: ti.color, display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1,
                    }}>
                      <IconComp size={10} style={{ color: ti.iconColor }} />
                    </div>
                    <div style={{ background: 'var(--bg-input)', borderRadius: 8, padding: '10px 14px' }}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: 8 }}>
                        <div style={{ fontSize: 13, fontWeight: 700, color: 'var(--text-main)' }}>{item.title}</div>
                        <span style={{ fontSize: 10, color: 'var(--text-dim)', whiteSpace: 'nowrap', flexShrink: 0 }}>
                          {formatDate(item.createdAt)}
                        </span>
                      </div>
                      {item.description && (
                        <div style={{ fontSize: 12, color: 'var(--text-muted)', marginTop: 4, lineHeight: 1.5 }}>
                          {item.description}
                        </div>
                      )}
                      {item.userName && (
                        <div style={{ fontSize: 10, color: 'var(--text-dim)', marginTop: 4, fontStyle: 'italic' }}>
                          {item.userName}
                        </div>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
