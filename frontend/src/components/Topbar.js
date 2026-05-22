import { Search } from 'lucide-react';

export default function Topbar({ omniQuery, onOmniChange, omniResults, onOmniSelect }) {
  const hasResults = omniResults &&
    (omniResults.customers.length > 0 || omniResults.candidates.length > 0 || omniResults.jobs.length > 0);

  return (
    <header style={{ height: 56 }} className="flex items-center px-4 bg-app-bg-topbar border-b border-app-border relative z-30">
      <div className="flex-1 flex justify-start">
        <div className="text-lg font-bold text-app-accent whitespace-nowrap">
          Jobentra CRM
        </div>
      </div>

      <div className="w-full max-w-2xl relative">
        <div className="relative">
          <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-app-text-dim pointer-events-none" />
          <input
            type="text"
            value={omniQuery}
            onChange={(e) => onOmniChange(e.target.value)}
            placeholder="Suche uber Kunden, Kandidaten, Jobs..."
            className="w-full pl-9 pr-4 py-1.5 rounded-lg text-sm bg-app-bg-input text-app-text-main placeholder:text-app-text-dim border border-app-border focus:outline-none focus:border-app-accent transition-colors"
          />
        </div>
        {hasResults && (
          <div className="absolute top-full left-0 right-0 mt-1 bg-app-bg-card border border-app-border rounded-lg shadow-xl max-h-80 overflow-y-auto z-50">
            {omniResults.customers.length > 0 && (
              <div className="px-3 py-1.5 text-xs text-app-text-dim uppercase tracking-wider font-semibold">
                Gefundene Kunden
              </div>
            )}
            {omniResults.customers.map(c => (
              <button
                key={'cust-' + c.id}
                onClick={() => onOmniSelect('customer', c)}
                className="w-full text-left px-4 py-2 text-sm hover:bg-app-bg-hover transition-colors flex justify-between items-center"
              >
                <span>{c.companyName}</span>
                <span className="text-xs text-app-text-dim">{c.industry || 'Kunde'}</span>
              </button>
            ))}
            {omniResults.candidates.length > 0 && (
              <div className="px-3 py-1.5 text-xs text-app-text-dim uppercase tracking-wider font-semibold border-t border-app-border">
                Gefundene Kandidaten
              </div>
            )}
            {omniResults.candidates.map(c => (
              <button
                key={'cand-' + c.id}
                onClick={() => onOmniSelect('candidate', c)}
                className="w-full text-left px-4 py-2 text-sm hover:bg-app-bg-hover transition-colors flex justify-between items-center"
              >
                <span>{c.firstName} {c.lastName} {'\u2014'} {c.job || ''}</span>
                <span className="text-xs text-app-text-dim">{c.location ? c.location.replace(/^\d{5}\s+(\S+).*/, '$1') : ''}</span>
              </button>
            ))}
            {omniResults.jobs.length > 0 && (
              <div className="px-3 py-1.5 text-xs text-app-text-dim uppercase tracking-wider font-semibold border-t border-app-border">
                Gefundene Jobs
              </div>
            )}
            {omniResults.jobs.map(j => (
              <button
                key={'job-' + j.id}
                onClick={() => onOmniSelect('job', j)}
                className="w-full text-left px-4 py-2 text-sm hover:bg-app-bg-hover transition-colors flex justify-between items-center"
              >
                <span>{j.title}</span>
                <span className="text-xs text-app-text-dim">{j.customerName}</span>
              </button>
            ))}
          </div>
        )}
      </div>

      <div className="flex-1 flex justify-end items-center gap-2 text-sm text-app-text-muted">
        <span className="w-7 h-7 rounded-lg bg-app-accent flex items-center justify-center text-white text-xs font-semibold">
          A
        </span>
        <span className="hidden sm:inline">Admin</span>
      </div>
    </header>
  );
}
