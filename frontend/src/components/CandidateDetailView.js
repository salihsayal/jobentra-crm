import { useState, useRef, useMemo, useEffect, useCallback } from 'react';
import {
  ArrowLeft, FileText, Check, Undo2, MapPin, Calendar,
  User, Mail, Phone, Briefcase, GraduationCap, FolderOpen, Clock,
  MessageSquare, Award, Upload, Download, Trash2, Plus, X, Pencil
} from 'lucide-react';
import { api } from '@/utils/api';
import { showToast } from '@/components/Toast';
import { parseAddress, sortWorkExperience } from '@/utils/format';
import CandidateProfileModal from './CandidateProfileModal';

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

const WE_INPUT_STYLE = {
  background: 'var(--bg-card)', border: '1px solid var(--border)',
  color: 'var(--text-main)', fontSize: 12, padding: '6px 10px', borderRadius: 6,
  outline: 'none', minWidth: 0,
};

const FIELD_LABELS = {
  firstName: 'Vorname', lastName: 'Nachname', email: 'Email', phone: 'Telefon',
  skills: 'F\u00E4higkeiten', job: 'Position', location: 'Ort',
  plz: 'PLZ', city: 'Ort', street: 'Stra\u00DFe', streetNumber: 'Nr.',
  mobility: 'Mobilit\u00E4t', availability: 'Verf\u00FCgbarkeit', status: 'Status',
};

const STATUS_OPTIONS = ['NEW', 'IN_PROCESS', 'PLACED', 'REJECTED'];
const EDITABLE_KEYS = ['firstName', 'lastName', 'email', 'phone', 'skills', 'job', 'location', 'plz', 'city', 'street', 'streetNumber', 'mobility', 'availability', 'status'];
const INFO_GRID_KEYS = ['firstName', 'lastName', 'email', 'phone', 'availability', 'mobility', 'job', 'status', 'plz', 'street', 'city', 'streetNumber'];

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
  if (lower.includes('lebenslauf') || lower.includes('cv') || lower.includes('resume')) return 'CV';
  if (lower.includes('zertifikat') || lower.includes('zeugnis') || lower.includes('certificate')) return 'CERTIFICATE';
  return 'OTHER';
}

function getPreviewKind(doc) {
  const mime = String(doc.mimeType || '').toLowerCase();
  const name = String(doc.originalFilename || doc.filename || '').toLowerCase();
  if (mime.startsWith('image/') || /\.(png|jpe?g|gif|webp|svg|bmp)$/.test(name)) return 'image';
  if (mime.includes('pdf') || name.endsWith('.pdf')) return 'pdf';
  if (mime.startsWith('text/') || /\.(txt|md|csv|log|json)$/.test(name)) return 'text';
  return 'other';
}

export default function CandidateDetailView({ entity, onBack, onEntityUpdate, onDataRefresh }) {
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
  const [newSkill, setNewSkill] = useState('');

  const [workExperiences, setWorkExperiences] = useState([]);
  const [weLoading, setWeLoading] = useState(false);
  const [showWeForm, setShowWeForm] = useState(false);
  const [weForm, setWeForm] = useState({ jobTitle: '', company: '', startDate: '', endDate: '', description: '' });
  const [editingWeId, setEditingWeId] = useState(null);
  const [editingWeForm, setEditingWeForm] = useState({ jobTitle: '', company: '', startDate: '', endDate: '', description: '' });
  const [savingWe, setSavingWe] = useState(false);

  const [hoverPreview, setHoverPreview] = useState(null);
  const [hoverTexts, setHoverTexts] = useState({});
  const hoverTimerRef = useRef(null);
  const [viewerDoc, setViewerDoc] = useState(null);
  const [viewerText, setViewerText] = useState(null);
  const [viewerLoading, setViewerLoading] = useState(false);
  const [showProfile, setShowProfile] = useState(false);

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

  const fetchWorkExperience = useCallback(async () => {
    setWeLoading(true);
    try {
      const entries = await api.candidates.workExperience.list(candidateId);
      setWorkExperiences(Array.isArray(entries) ? entries : []);
    } catch (e) {
      console.error('Failed to fetch work experience:', e);
    }
    setWeLoading(false);
  }, [candidateId]);

  useEffect(() => {
    const initial = { ...entity };
    const hasStructured = ['plz', 'city', 'street', 'streetNumber'].some(k => initial[k] != null && initial[k] !== '');
    if (!hasStructured && initial.location) {
      const parsed = parseAddress(initial.location);
      initial.plz = parsed.plz;
      initial.city = parsed.city;
      initial.street = parsed.street;
      initial.streetNumber = parsed.streetNumber;
    }
    setFormData(initial);
    originalData.current = initial;
  }, [entity]);
  useEffect(() => { fetchDocuments(); fetchTimeline(); fetchWorkExperience(); }, [fetchDocuments, fetchTimeline, fetchWorkExperience]);

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
      const savedDoc = await api.candidates.documents.upload(candidateId, file, category);
      fetchDocuments();
      if (category === 'CV' && savedDoc && savedDoc.id) {
        pollExtractionStatus(savedDoc.id);
      }
    } catch (e) {
      console.error('Upload failed:', e);
      showToast('Upload fehlgeschlagen: ' + e.message);
    }
  }

  async function pollExtractionStatus(documentId) {
    const maxAttempts = 12;
    for (let attempt = 0; attempt < maxAttempts; attempt++) {
      await new Promise(r => setTimeout(r, 2500));
      try {
        const docs = await api.candidates.documents.list(candidateId);
        const docsList = Array.isArray(docs) ? docs : [];
        const doc = docsList.find(d => d.id === documentId);
        if (doc && doc.extractionStatus === 'DONE') {
          showToast('CV ausgewertet – Fähigkeiten und Arbeitserfahrung aktualisiert.', 'success');
          await refreshCandidateAfterExtraction();
          return;
        }
        if (doc && doc.extractionStatus === 'FAILED') {
          showToast('CV-Analyse fehlgeschlagen. Bitte Daten manuell pflegen.');
          return;
        }
      } catch (e) {
        console.error('Extraction polling failed:', e);
      }
    }
    showToast('CV-Analyse dauert länger als erwartet. Ergebnisse erscheinen sobald verfügbar.');
  }

  async function refreshCandidateAfterExtraction() {
    try {
      const fresh = await api.candidates.get(candidateId);
      Object.keys(fresh).forEach(k => { if (k in entity) entity[k] = fresh[k]; });
      originalData.current = { ...entity };
      setFormData({ ...entity });
      fetchWorkExperience();
      if (onDataRefresh) onDataRefresh();
    } catch (e) {
      console.error('Failed to refresh candidate after extraction:', e);
    }
  }

  function openWeForm() {
    setWeForm({ jobTitle: '', company: '', startDate: '', endDate: '', description: '' });
    setShowWeForm(true);
  }

  async function handleCreateWorkExperience() {
    if (!weForm.jobTitle.trim()) return;
    setSavingWe(true);
    try {
      await api.candidates.workExperience.create(candidateId, weForm);
      setWeForm({ jobTitle: '', company: '', startDate: '', endDate: '', description: '' });
      setShowWeForm(false);
      fetchWorkExperience();
    } catch (e) {
      console.error('Failed to create work experience:', e);
      showToast('Speichern fehlgeschlagen: ' + e.message);
    }
    setSavingWe(false);
  }

  function startEditingWe(entry) {
    setEditingWeId(entry.id);
    setEditingWeForm({
      jobTitle: entry.jobTitle || '',
      company: entry.company || '',
      startDate: entry.startDate || '',
      endDate: entry.endDate || '',
      description: entry.description || '',
    });
  }

  async function handleUpdateWorkExperience() {
    if (!editingWeForm.jobTitle.trim()) return;
    setSavingWe(true);
    try {
      await api.candidates.workExperience.update(candidateId, editingWeId, editingWeForm);
      setEditingWeId(null);
      fetchWorkExperience();
    } catch (e) {
      console.error('Failed to update work experience:', e);
      showToast('Speichern fehlgeschlagen: ' + e.message);
    }
    setSavingWe(false);
  }

  async function handleDeleteWorkExperience(entryId) {
    try {
      await api.candidates.workExperience.delete(candidateId, entryId);
      if (editingWeId === entryId) setEditingWeId(null);
      fetchWorkExperience();
    } catch (e) {
      console.error('Failed to delete work experience:', e);
      showToast('Löschen fehlgeschlagen: ' + e.message);
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

  function handleDocHoverStart(e, doc) {
    clearTimeout(hoverTimerRef.current);
    hoverTimerRef.current = setTimeout(() => {
      const x = Math.min(e.clientX + 16, (typeof window !== 'undefined' ? window.innerWidth : 1200) - 340);
      const y = Math.min(e.clientY + 16, (typeof window !== 'undefined' ? window.innerHeight : 800) - 430);
      setHoverPreview({ doc, x: Math.max(8, x), y: Math.max(8, y) });
      if (getPreviewKind(doc) === 'text' && !hoverTexts[doc.id]) {
        fetch(api.candidates.documents.downloadUrl(candidateId, doc.id), { credentials: 'include' })
          .then(r => r.text())
          .then(t => setHoverTexts(prev => ({ ...prev, [doc.id]: t })))
          .catch(() => {});
      }
    }, 200);
  }

  function handleDocHoverEnd() {
    clearTimeout(hoverTimerRef.current);
    setHoverPreview(null);
  }

  function handleOpenViewer(doc) {
    setHoverPreview(null);
    setViewerDoc(doc);
    setViewerText(null);
    setViewerLoading(false);
    if (getPreviewKind(doc) === 'text') {
      setViewerLoading(true);
      fetch(api.candidates.documents.downloadUrl(candidateId, doc.id), { credentials: 'include' })
        .then(r => r.text())
        .then(t => { setViewerText(t); setViewerLoading(false); })
        .catch(() => { setViewerText('Vorschau nicht verfügbar.'); setViewerLoading(false); });
    }
  }

  function closeViewer() {
    setViewerDoc(null);
    setViewerText(null);
    setViewerLoading(false);
  }

  useEffect(() => {
    if (!viewerDoc) return;
    function handleKey(e) {
      if (e.key === 'Escape') closeViewer();
    }
    document.addEventListener('keydown', handleKey);
    return () => document.removeEventListener('keydown', handleKey);
  }, [viewerDoc]);

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
    const plz = String(formData.plz || '').trim();
    const city = String(formData.city || '').trim();
    const street = String(formData.street || '').trim();
    const streetNumber = String(formData.streetNumber || '').trim();
    const combined = [plz, city, street, streetNumber].filter(Boolean).join(' ');
    body.plz = plz;
    body.city = city;
    body.street = street;
    body.streetNumber = streetNumber;
    body.location = combined || String(entity.location || '');
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

  function handleAddSkill() {
    const trimmed = newSkill.trim();
    if (!trimmed) return;
    const currentSkills = String(formData.skills || '').trim();
    const existingTags = currentSkills ? currentSkills.split(',').map(s => s.trim()).filter(Boolean) : [];
    if (existingTags.includes(trimmed)) { setNewSkill(''); return; }
    const newSkills = [...existingTags, trimmed].join(', ');
    setFormData(prev => ({ ...prev, skills: newSkills }));
    setNewSkill('');
  }

  function handleRemoveSkill(tag) {
    const currentSkills = String(formData.skills || '').trim();
    const existingTags = currentSkills ? currentSkills.split(',').map(s => s.trim()).filter(Boolean) : [];
    const newSkills = existingTags.filter(t => t !== tag).join(', ');
    setFormData(prev => ({ ...prev, skills: newSkills }));
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

  const locationCity = (formData.location || entity.location || '')
    .replace(/^\d{5}\s+(\S+).*/, '$1');

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
            <button
              onClick={() => setShowProfile(true)}
              className="inline-flex items-center gap-2 px-3.5 py-2 rounded-lg text-sm font-semibold bg-app-accent text-white hover:bg-app-accent-hover transition-colors"
            >
              <FileText size={15} /> Kandidaten-Profil
            </button>
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
              {INFO_GRID_KEYS.map(key => {
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
            <div style={{ marginBottom: 12 }}>
              <div style={{ display: 'flex', gap: 8 }}>
                <input
                  type="text"
                  value={newSkill}
                  onChange={(e) => setNewSkill(e.target.value)}
                  onKeyDown={(e) => { if (e.key === 'Enter') { e.preventDefault(); handleAddSkill(); } }}
                  placeholder="Neue Fähigkeit hinzufügen..."
                  style={{
                    flex: 1, background: 'var(--bg-input)', border: '1px solid var(--border)',
                    color: 'var(--text-main)', fontSize: 12, padding: '6px 10px', borderRadius: 6,
                    outline: 'none',
                  }}
                />
                <button
                  onClick={handleAddSkill}
                  className="inline-flex items-center gap-1 px-3 py-1.5 rounded-lg text-xs font-semibold bg-app-accent text-white hover:bg-app-accent-hover transition-colors"
                >
                  <Plus size={13} /> Hinzufügen
                </button>
              </div>
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
                    <button
                      onClick={() => handleRemoveSkill(tag)}
                      style={{
                        background: 'transparent', border: 'none', cursor: 'pointer',
                        color: 'var(--accent)', padding: 0, display: 'inline-flex',
                        marginLeft: 2, opacity: 0.6,
                      }}
                      className="hover:opacity-100"
                    >
                      <X size={12} />
                    </button>
                  </span>
                ))}
              </div>
            ) : (
              <div style={{ padding: 32, textAlign: 'center', color: 'var(--text-dim)', fontSize: 13 }}>
                <GraduationCap size={32} style={{ margin: '0 auto 12', opacity: 0.3 }} />
                <div>Keine F&auml;higkeiten hinterlegt.</div>
                <div style={{ fontSize: 12, marginTop: 4 }}>Füge neue Fähigkeiten über das Eingabefeld hinzu.</div>
              </div>
            )}
          </div>
          <div style={{ background: 'var(--bg-card)', border: '1px solid var(--card-border)', borderRadius: 12, padding: 24 }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 16 }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                <Briefcase size={16} style={{ color: 'var(--accent)' }} />
                <span style={{ fontSize: 13, fontWeight: 700, color: 'var(--text-dim)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                  Arbeitserfahrung
                </span>
              </div>
              {!showWeForm && (
                <button
                  onClick={openWeForm}
                  className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold bg-app-accent text-white hover:bg-app-accent-hover transition-colors"
                >
                  <Plus size={13} /> Hinzufügen
                </button>
              )}
            </div>

            {showWeForm && (
              <div style={{ marginBottom: 16, padding: 14, background: 'var(--bg-input)', borderRadius: 8, border: '1px solid var(--border)' }}>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8, marginBottom: 8 }}>
                  <input type="text" placeholder="Position / Jobtitel" value={weForm.jobTitle}
                    onChange={e => setWeForm(prev => ({ ...prev, jobTitle: e.target.value }))}
                    style={WE_INPUT_STYLE} />
                  <input type="text" placeholder="Unternehmen" value={weForm.company}
                    onChange={e => setWeForm(prev => ({ ...prev, company: e.target.value }))}
                    style={WE_INPUT_STYLE} />
                  <input type="text" placeholder="Start (z.B. 03.2020)" value={weForm.startDate}
                    onChange={e => setWeForm(prev => ({ ...prev, startDate: e.target.value }))}
                    style={WE_INPUT_STYLE} />
                  <input type="text" placeholder="Ende (z.B. heute)" value={weForm.endDate}
                    onChange={e => setWeForm(prev => ({ ...prev, endDate: e.target.value }))}
                    style={WE_INPUT_STYLE} />
                </div>
                <textarea placeholder="Aufgaben & Verantwortlichkeiten" value={weForm.description}
                  onChange={e => setWeForm(prev => ({ ...prev, description: e.target.value }))}
                  rows={3}
                  style={{ ...WE_INPUT_STYLE, width: '100%', resize: 'vertical', marginBottom: 8 }} />
                <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 6 }}>
                  <button onClick={() => setShowWeForm(false)}
                    className="inline-flex items-center gap-1 px-3 py-1.5 rounded-lg text-xs font-medium border border-app-border text-app-text-muted hover:text-app-text-main hover:bg-app-bg-hover transition-colors">
                    Abbrechen
                  </button>
                  <button onClick={handleCreateWorkExperience} disabled={savingWe || !weForm.jobTitle.trim()}
                    style={{ opacity: savingWe || !weForm.jobTitle.trim() ? 0.5 : 1 }}
                    className="inline-flex items-center gap-1 px-3 py-1.5 rounded-lg text-xs font-semibold bg-app-accent text-white hover:bg-app-accent-hover transition-colors">
                    <Check size={13} /> Speichern
                  </button>
                </div>
              </div>
            )}

            {weLoading ? (
              <div style={{ padding: 32, textAlign: 'center', color: 'var(--text-dim)', fontSize: 13 }}>Lade Arbeitserfahrung...</div>
            ) : workExperiences.length === 0 ? (
              <div style={{ padding: 32, textAlign: 'center', color: 'var(--text-dim)', fontSize: 13 }}>
                <Briefcase size={32} style={{ margin: '0 auto 12', opacity: 0.3 }} />
                <div>Keine Arbeitserfahrung hinterlegt.</div>
                <div style={{ fontSize: 12, marginTop: 4 }}>Lade einen CV im Vault-Tab hoch, um diese automatisch auszufüllen.</div>
              </div>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                {sortWorkExperience(workExperiences).map((entry, i) => (
                  <div key={entry.id || i} style={{
                    background: 'var(--bg-input)', borderRadius: 8, padding: '12px 14px',
                    border: editingWeId === entry.id ? '1px solid var(--accent)' : '1px solid var(--border)',
                  }}>
                    {editingWeId === entry.id ? (
                      <div>
                        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8, marginBottom: 8 }}>
                          <input type="text" placeholder="Position / Jobtitel" value={editingWeForm.jobTitle}
                            onChange={e => setEditingWeForm(prev => ({ ...prev, jobTitle: e.target.value }))}
                            style={WE_INPUT_STYLE} />
                          <input type="text" placeholder="Unternehmen" value={editingWeForm.company}
                            onChange={e => setEditingWeForm(prev => ({ ...prev, company: e.target.value }))}
                            style={WE_INPUT_STYLE} />
                          <input type="text" placeholder="Start" value={editingWeForm.startDate}
                            onChange={e => setEditingWeForm(prev => ({ ...prev, startDate: e.target.value }))}
                            style={WE_INPUT_STYLE} />
                          <input type="text" placeholder="Ende" value={editingWeForm.endDate}
                            onChange={e => setEditingWeForm(prev => ({ ...prev, endDate: e.target.value }))}
                            style={WE_INPUT_STYLE} />
                        </div>
                        <textarea placeholder="Aufgaben & Verantwortlichkeiten" value={editingWeForm.description}
                          onChange={e => setEditingWeForm(prev => ({ ...prev, description: e.target.value }))}
                          rows={3}
                          style={{ ...WE_INPUT_STYLE, width: '100%', resize: 'vertical', marginBottom: 8 }} />
                        <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 6 }}>
                          <button onClick={() => setEditingWeId(null)}
                            className="inline-flex items-center gap-1 px-3 py-1.5 rounded-lg text-xs font-medium border border-app-border text-app-text-muted hover:text-app-text-main hover:bg-app-bg-hover transition-colors">
                            Abbrechen
                          </button>
                          <button onClick={handleUpdateWorkExperience} disabled={savingWe || !editingWeForm.jobTitle.trim()}
                            style={{ opacity: savingWe || !editingWeForm.jobTitle.trim() ? 0.5 : 1 }}
                            className="inline-flex items-center gap-1 px-3 py-1.5 rounded-lg text-xs font-semibold bg-app-accent text-white hover:bg-app-accent-hover transition-colors">
                            <Check size={13} /> Speichern
                          </button>
                        </div>
                      </div>
                    ) : (
                      <div>
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: 8 }}>
                          <div style={{ flex: 1, minWidth: 0 }}>
                            <div style={{ fontSize: 13, fontWeight: 700, color: 'var(--text-main)' }}>
                              {entry.jobTitle || '-'}
                              {entry.company && <span style={{ fontWeight: 500, color: 'var(--text-muted)' }}> &middot; {entry.company}</span>}
                            </div>
                            {(entry.startDate || entry.endDate) && (
                              <div style={{ fontSize: 11, color: 'var(--text-dim)', marginTop: 2 }}>
                                {entry.startDate || '?'} – {entry.endDate || 'heute'}
                              </div>
                            )}
                            {entry.description && (
                              <div style={{ fontSize: 12, color: 'var(--text-muted)', marginTop: 6, lineHeight: 1.5 }}>
                                {entry.description}
                              </div>
                            )}
                          </div>
                          <div style={{ display: 'flex', gap: 2, flexShrink: 0 }}>
                            <button
                              onClick={() => startEditingWe(entry)}
                              style={{ color: 'var(--text-dim)', padding: 6, borderRadius: 6 }}
                              className="hover:text-app-accent hover:bg-app-bg-hover transition-colors"
                              title="Bearbeiten"
                            >
                              <Pencil size={14} />
                            </button>
                            <button
                              onClick={() => handleDeleteWorkExperience(entry.id)}
                              style={{ color: 'var(--text-dim)', padding: 6, borderRadius: 6 }}
                              className="hover:text-app-danger hover:bg-app-bg-hover transition-colors"
                              title="L\u00f6schen"
                            >
                              <Trash2 size={14} />
                            </button>
                          </div>
                        </div>
                      </div>
                    )}
                  </div>
                ))}
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
            {documents.filter(d => d.category === 'CERTIFICATE').length > 0 ? (
              <div style={{ display: 'flex', flexDirection: 'column', gap: 0 }}>
                {documents.filter(d => d.category === 'CERTIFICATE').map((doc, i, arr) => (
                  <div key={doc.id || i} style={{
                    display: 'flex', alignItems: 'center', gap: 12,
                    padding: '10px 14px',
                    borderBottom: i < arr.length - 1 ? '1px solid var(--border)' : 'none',
                  }}>
                    <div style={{
                      width: 32, height: 32, borderRadius: 8, flexShrink: 0,
                      background: 'var(--accent-light)', display: 'flex',
                      alignItems: 'center', justifyContent: 'center',
                    }}>
                      <FileText size={14} style={{ color: 'var(--accent)' }} />
                    </div>
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <div style={{ fontSize: 13, fontWeight: 600, color: 'var(--text-main)', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                        {doc.originalFilename || doc.filename}
                      </div>
                      <div style={{ fontSize: 11, color: 'var(--text-dim)', marginTop: 2 }}>
                        {formatDate(doc.createdAt)} &middot; {formatFileSize(doc.fileSize)}
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
                  </div>
                ))}
              </div>
            ) : (
              <div style={{ padding: 32, textAlign: 'center', color: 'var(--text-dim)', fontSize: 13 }}>
                <Award size={32} style={{ margin: '0 auto 12', opacity: 0.3 }} />
                <div>Keine Zertifikate hinterlegt.</div>
                <div style={{ fontSize: 12, marginTop: 4 }}>Lade Zertifikate im Vault-Tab hoch.</div>
              </div>
            )}
          </div>
        </div>
      )}
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
                  <option value="OTHER" style={{ background: 'var(--bg-card)', color: 'var(--text-main)' }}>OTHER (Sonstiges)</option>
                </select>
              </div>
              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 6 }}>
                <button onClick={() => { setShowCategoryPicker(false); setPendingFile(null); }}
                  className="inline-flex items-center gap-1 px-3 py-1.5 rounded-lg text-xs font-medium border border-app-border text-app-text-muted hover:text-app-text-main hover:bg-app-bg-hover transition-colors">
                  <X size={12} /> Abbrechen
                </button>
                <button onClick={() => {
                  handleUpload(pendingFile, pendingCategory);
                  setShowCategoryPicker(false);
                  setPendingFile(null);
                }}
                  className="inline-flex items-center gap-1 px-3 py-1.5 rounded-lg text-xs font-semibold bg-app-accent text-white hover:bg-app-accent-hover transition-colors">
                  <Upload size={12} /> Hochladen
                </button>
              </div>
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
                  cursor: 'pointer', transition: 'background 0.15s',
                }}
                  className="hover:bg-app-bg-hover"
                  onMouseEnter={(e) => handleDocHoverStart(e, doc)}
                  onMouseLeave={handleDocHoverEnd}
                  onClick={() => handleOpenViewer(doc)}
                >
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
                    onClick={(e) => e.stopPropagation()}
                    style={{ color: 'var(--text-dim)', padding: 6, borderRadius: 6 }}
                    className="hover:text-app-accent hover:bg-app-bg-hover transition-colors"
                    title="Herunterladen"
                  >
                    <Download size={14} />
                  </a>
                  <button
                    onClick={(e) => { e.stopPropagation(); handleDeleteDocument(doc.id); }}
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

      {/* Hover Preview */}
      {hoverPreview && (
        <div style={{
          position: 'fixed', left: hoverPreview.x, top: hoverPreview.y, zIndex: 90,
          width: 320, background: 'var(--bg-card)', border: '1px solid var(--card-border)',
          borderRadius: 12, boxShadow: '0 12px 40px rgba(0,0,0,0.5)', overflow: 'hidden',
          pointerEvents: 'none',
        }}>
          <div style={{
            padding: '8px 12px', borderBottom: '1px solid var(--border)',
            fontSize: 11, fontWeight: 600, color: 'var(--text-muted)',
            whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis',
          }}>
            {hoverPreview.doc.originalFilename || hoverPreview.doc.filename}
          </div>
          <div style={{
            height: 340, display: 'flex', alignItems: 'center', justifyContent: 'center',
            background: 'var(--bg-input)', overflow: 'hidden',
          }}>
            {getPreviewKind(hoverPreview.doc) === 'pdf' && (
              <iframe
                src={api.candidates.documents.previewUrl(candidateId, hoverPreview.doc.id)}
                title="Vorschau"
                style={{ width: '100%', height: '100%', border: 'none' }}
              />
            )}
            {getPreviewKind(hoverPreview.doc) === 'image' && (
              <img
                src={api.candidates.documents.previewUrl(candidateId, hoverPreview.doc.id)}
                alt="Vorschau"
                style={{ maxWidth: '100%', maxHeight: '100%', objectFit: 'contain' }}
              />
            )}
            {getPreviewKind(hoverPreview.doc) === 'text' && (
              <pre style={{
                width: '100%', height: '100%', margin: 0, padding: 12,
                fontSize: 10, lineHeight: 1.5, color: 'var(--text-main)',
                whiteSpace: 'pre-wrap', wordBreak: 'break-word', overflow: 'hidden',
              }}>
                {hoverTexts[hoverPreview.doc.id] != null
                  ? hoverTexts[hoverPreview.doc.id].split('\n').slice(0, 20).join('\n')
                  : 'Lädt Textvorschau...'}
              </pre>
            )}
            {getPreviewKind(hoverPreview.doc) === 'other' && (
              <div style={{ textAlign: 'center', padding: 16 }}>
                <FileText size={32} style={{ color: 'var(--text-dim)', opacity: 0.4, margin: '0 auto 8' }} />
                <div style={{ fontSize: 12, color: 'var(--text-dim)' }}>Keine Vorschau verfügbar</div>
                <div style={{ fontSize: 11, color: 'var(--text-dim)', marginTop: 4 }}>
                  Klicken zum Öffnen
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Document Viewer Modal */}
      {viewerDoc && (
        <div
          onClick={closeViewer}
          style={{
            position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.65)', zIndex: 100,
            display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 32,
          }}
        >
          <div
            onClick={(e) => e.stopPropagation()}
            style={{
              background: 'var(--bg-card)', borderRadius: 12, border: '1px solid var(--card-border)',
              width: '100%', maxWidth: 960, height: '85vh',
              display: 'flex', flexDirection: 'column', overflow: 'hidden',
              boxShadow: '0 20px 60px rgba(0,0,0,0.6)',
            }}
          >
            <div style={{
              display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 12,
              padding: '12px 16px', borderBottom: '1px solid var(--border)', flexShrink: 0,
            }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 10, minWidth: 0 }}>
                <FileText size={16} style={{ color: 'var(--accent)', flexShrink: 0 }} />
                <span style={{
                  fontSize: 13, fontWeight: 700, color: 'var(--text-main)',
                  whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis',
                }}>
                  {viewerDoc.originalFilename || viewerDoc.filename}
                </span>
                {viewerDoc.category && (
                  <span style={{
                    padding: '1px 6px', borderRadius: 4, fontSize: 10, fontWeight: 600,
                    background: viewerDoc.category === 'CENSORED' ? 'rgba(5, 150, 105, 0.12)' : 'var(--accent-light)',
                    color: viewerDoc.category === 'CENSORED' ? 'var(--success)' : 'var(--accent)',
                    flexShrink: 0,
                  }}>{viewerDoc.category}</span>
                )}
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexShrink: 0 }}>
                <a
                  href={api.candidates.documents.downloadUrl(candidateId, viewerDoc.id)}
                  download={viewerDoc.originalFilename}
                  className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold bg-app-accent text-white hover:bg-app-accent-hover transition-colors"
                >
                  <Download size={13} /> Download
                </a>
                <button
                  onClick={closeViewer}
                  style={{ color: 'var(--text-dim)', padding: 6, borderRadius: 6 }}
                  className="hover:text-app-text-main hover:bg-app-bg-hover transition-colors"
                  title="Schließen"
                >
                  <X size={18} />
                </button>
              </div>
            </div>
            <div style={{
              flex: 1, overflow: 'hidden', background: 'var(--bg-input)',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
            }}>
              {getPreviewKind(viewerDoc) === 'pdf' && (
                <iframe
                  src={api.candidates.documents.previewUrl(candidateId, viewerDoc.id)}
                  title="Dokument"
                  style={{ width: '100%', height: '100%', border: 'none' }}
                />
              )}
              {getPreviewKind(viewerDoc) === 'image' && (
                <img
                  src={api.candidates.documents.previewUrl(candidateId, viewerDoc.id)}
                  alt={viewerDoc.originalFilename}
                  style={{ maxWidth: '100%', maxHeight: '100%', objectFit: 'contain' }}
                />
              )}
              {getPreviewKind(viewerDoc) === 'text' && (
                <div style={{
                  width: '100%', height: '100%', overflow: 'auto', padding: 20,
                  display: 'flex', flexDirection: 'column', alignItems: 'stretch',
                }}>
                  {viewerLoading ? (
                    <div style={{ textAlign: 'center', color: 'var(--text-dim)', fontSize: 13, paddingTop: 40 }}>
                      Lade Text...
                    </div>
                  ) : (
                    <pre style={{
                      margin: 0, fontSize: 12, lineHeight: 1.6, color: 'var(--text-main)',
                      whiteSpace: 'pre-wrap', wordBreak: 'break-word', fontFamily: 'inherit',
                    }}>
                      {viewerText}
                    </pre>
                  )}
                </div>
              )}
              {getPreviewKind(viewerDoc) === 'other' && (
                <div style={{ textAlign: 'center', padding: 24 }}>
                  <FileText size={48} style={{ color: 'var(--text-dim)', opacity: 0.4, margin: '0 auto 12' }} />
                  <div style={{ fontSize: 14, fontWeight: 600, color: 'var(--text-main)' }}>
                    Keine Vorschau verfügbar
                  </div>
                  <div style={{ fontSize: 12, color: 'var(--text-dim)', marginTop: 6 }}>
                    Dieses Dateiformat kann nicht direkt angezeigt werden.
                  </div>
                  <a
                    href={api.candidates.documents.downloadUrl(candidateId, viewerDoc.id)}
                    download={viewerDoc.originalFilename}
                    className="inline-flex items-center gap-1.5 px-4 py-2 rounded-lg text-sm font-semibold bg-app-accent text-white hover:bg-app-accent-hover transition-colors"
                    style={{ marginTop: 16 }}
                  >
                    <Download size={14} /> Herunterladen
                  </a>
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Candidate Profile Modal */}
      {showProfile && (
        <CandidateProfileModal
          candidate={entity}
          workExperiences={sortWorkExperience(workExperiences)}
          certificates={documents.filter(d => d.category === 'CERTIFICATE')}
          onClose={() => setShowProfile(false)}
        />
      )}
    </div>
  );
}
