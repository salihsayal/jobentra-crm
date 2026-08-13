import { useState, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { X, Printer } from 'lucide-react';
import { parseAddress } from '@/utils/format';
import { api } from '@/utils/api';
import { showToast } from '@/components/Toast';

const GENERIC_COMPANIES = [
  'Branchenführendes Unternehmen',
  'IT-Dienstleister',
  'Mittelständisches Industrieunternehmen',
  'Internationaler Konzern',
  'Innovatives Technologieunternehmen',
  'Etabliertes Handelsunternehmen',
];

function anonymizeCompany(name) {
  const s = String(name || '').trim();
  if (!s) return '';
  let hash = 0;
  for (let i = 0; i < s.length; i++) {
    hash = (hash * 31 + s.charCodeAt(i)) >>> 0;
  }
  return GENERIC_COMPANIES[hash % GENERIC_COMPANIES.length];
}

function SectionTitle({ children }) {
  return (
    <h2 className="text-[#0E2A47] text-xs font-bold uppercase tracking-widest mb-3">
      {children}
    </h2>
  );
}

export default function CandidateProfileModal({ candidate, workExperiences, certificates, onClose }) {
  const [refNumber] = useState(() => 50 + Math.floor(Math.random() * 101));
  const [exporting, setExporting] = useState(false);

  useEffect(() => {
    function handleKey(e) {
      if (e.key === 'Escape') onClose();
    }
    document.addEventListener('keydown', handleKey);
    return () => document.removeEventListener('keydown', handleKey);
  }, [onClose]);

  const city = candidate.city || parseAddress(candidate.location).city || '';
  const skills = String(candidate.skills || '')
    .split(',').map(s => s.trim()).filter(Boolean);
  const job = candidate.job || '';

  async function handleExportPdf() {
    setExporting(true);
    try {
      const fileName = `Kandidaten-Profil-${refNumber}.pdf`;
      const payload = {
        fileName,
        refNumber,
        city,
        job,
        skills,
        workExperience: workExperiences.map(we => ({
          jobTitle: we.jobTitle || '',
          company: anonymizeCompany(we.company),
          startDate: we.startDate || '',
          endDate: we.endDate || '',
          description: we.description || '',
        })),
        certificates: certificates.map(c => c.originalFilename || c.filename),
      };
      const blob = await api.candidates.profilePdf(candidate.id, payload);
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = fileName;
      document.body.appendChild(a);
      a.click();
      a.remove();
      URL.revokeObjectURL(url);
    } catch (e) {
      console.error('PDF export failed:', e);
      showToast(e.message || 'PDF-Export fehlgeschlagen');
    } finally {
      setExporting(false);
    }
  }

  return createPortal(
    <div className="profile-print-root">
      <div
        className="fixed inset-0 z-[119] bg-black/60 print:hidden"
        onClick={onClose}
      />
      <div
        className="fixed inset-0 z-[120] overflow-y-auto print:static"
        onClick={onClose}
      >
        <div
          className="flex min-h-full items-start justify-center p-6 print:block print:p-0"
          onClick={(e) => e.stopPropagation()}
        >
          <div className="w-full max-w-[820px] overflow-hidden rounded-xl shadow-2xl print:max-w-none print:rounded-none print:shadow-none">
            <div className="print:hidden flex items-center justify-between gap-3 border-b border-[#E2E8F0] bg-white px-5 py-3">
              <span className="text-sm font-bold text-[#0E2A47]">
                Kandidaten-Profil
              </span>
              <div className="flex items-center gap-2">
                <button
                  onClick={handleExportPdf}
                  disabled={exporting}
                  className="inline-flex items-center gap-1.5 rounded-lg bg-[#F38430] px-3.5 py-2 text-xs font-semibold text-white hover:bg-[#d9701f] transition-colors disabled:opacity-60 disabled:cursor-not-allowed"
                >
                  <Printer size={14} /> {exporting ? 'Exportiere...' : 'Export PDF'}
                </button>
                <button
                  onClick={onClose}
                  className="inline-flex items-center gap-1.5 rounded-lg border border-[#E2E8F0] px-3 py-2 text-xs font-medium text-gray-600 hover:bg-[#F8FAFC] transition-colors"
                >
                  <X size={14} /> Schließen
                </button>
              </div>
            </div>

            <div id="candidate-profile-print" className="bg-white text-[#0E2A47]">
              <div className="flex items-center justify-between gap-4 border-b border-[#E2E8F0] px-8 py-6">
                <img
                  src="/logo.png"
                  alt="Jobentra"
                  className="h-24 w-auto"
                />
                <div className="rounded-lg bg-[#0E2A47] px-4 py-2 text-sm font-semibold text-white">
                  Ref: #{refNumber}{city ? ` | Standort: ${city}` : ''}
                </div>
              </div>

              <div className="px-8 pt-6">
                <h1 className="text-2xl font-bold text-[#0E2A47]">
                  Kandidat/in (m/w/d)
                </h1>
                {job && (
                  <p className="mt-1 text-sm text-gray-500">{job}</p>
                )}
              </div>

              {skills.length > 0 && (
                <section className="px-8 pt-6">
                  <SectionTitle>Fähigkeiten</SectionTitle>
                  <div className="flex flex-wrap gap-2">
                    {skills.map((skill, i) => (
                      <span
                        key={i}
                        className="rounded-full bg-[#F38430] px-3 py-1 text-xs font-semibold text-white"
                      >
                        {skill}
                      </span>
                    ))}
                  </div>
                </section>
              )}

              {workExperiences.length > 0 && (
                <section className="px-8 pt-6">
                  <SectionTitle>Arbeitserfahrung</SectionTitle>
                  <div className="flex flex-col gap-3">
                    {workExperiences.map((we, i) => (
                      <div
                        key={we.id || i}
                        className="rounded-lg border border-[#E2E8F0] bg-[#F8FAFC] p-4 print:break-inside-avoid"
                      >
                        <div className="flex items-center justify-between gap-3">
                          <span className="font-semibold text-[#0E2A47]">
                            {we.jobTitle || '-'}
                          </span>
                          <span className="whitespace-nowrap text-xs text-gray-500">
                            {we.startDate || '?'} – {we.endDate || 'heute'}
                          </span>
                        </div>
                        {we.company && (
                          <div className="mt-0.5 text-sm text-gray-500">
                            {anonymizeCompany(we.company)}
                          </div>
                        )}
                        {we.description && (
                          <p className="mt-2 text-sm leading-relaxed text-gray-700">
                            {we.description}
                          </p>
                        )}
                      </div>
                    ))}
                  </div>
                </section>
              )}

              {certificates.length > 0 && (
                <section className="px-8 pt-6">
                  <SectionTitle>Zertifikate</SectionTitle>
                  <ul className="list-disc space-y-1.5 pl-5">
                    {certificates.map((cert, i) => (
                      <li key={cert.id || i} className="text-sm text-gray-700">
                        {cert.originalFilename || cert.filename}
                      </li>
                    ))}
                  </ul>
                </section>
              )}

              <footer className="mt-8 border-t border-[#E2E8F0] px-8 py-6 text-sm text-gray-500">
                Jobentra GmbH | Franz-Haniel-Platz 1a, 47119 Duisburg | HRB 39507
                (Amtsgericht Duisburg) | USt-ID: DE457971028
              </footer>
            </div>
          </div>
        </div>
      </div>
    </div>,
    document.body
  );
}
