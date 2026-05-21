import { useState, useReducer } from 'react';
import { Plus } from 'lucide-react';
import StatsCharts from './StatsCharts';
import DataTable from './DataTable';
import CreateSlideOver from './CreateSlideOver';
import {
  mockCustomers, mockCandidates, mockJobs, mockBillings,
} from '@/utils/mockData';

const STATUS_COLORS = {
  ACTIVE:    { bg: 'rgba(52,211,153,0.12)', text: '#34d399' },
  INACTIVE:  { bg: 'rgba(100,116,139,0.12)', text: '#94a3b8' },
  LEAD:      { bg: 'rgba(129,140,248,0.12)', text: '#818cf8' },
  NEW:       { bg: 'rgba(129,140,248,0.12)', text: '#818cf8' },
  IN_PROCESS:{ bg: 'rgba(251,191,36,0.12)', text: '#fbbf24' },
  PLACED:    { bg: 'rgba(52,211,153,0.12)', text: '#34d399' },
  REJECTED:  { bg: 'rgba(251,113,133,0.12)', text: '#fb7185' },
  OPEN:      { bg: 'rgba(52,211,153,0.12)', text: '#34d399' },
  CLOSED:    { bg: 'rgba(100,116,139,0.12)', text: '#94a3b8' },
  DRAFT:     { bg: 'rgba(167,139,250,0.12)', text: '#a78bfa' },
  SENT:      { bg: 'rgba(129,140,248,0.12)', text: '#818cf8' },
  PAID:      { bg: 'rgba(52,211,153,0.12)', text: '#34d399' },
  CANCELLED: { bg: 'rgba(251,113,133,0.12)', text: '#fb7185' },
};

function StatusBadge({ status }) {
  const s = STATUS_COLORS[status] || { bg: 'rgba(100,116,139,0.12)', text: '#94a3b8' };
  return (
    <span style={{
      display: 'inline-block', padding: '2px 10px', borderRadius: 999, fontSize: 11, fontWeight: 600,
      background: s.bg, color: s.text, letterSpacing: '0.02em',
    }}>
      {status}
    </span>
  );
}

function formatEur(amount) {
  if (amount == null) return '-';
  return new Intl.NumberFormat('de-DE', { style: 'currency', currency: 'EUR' }).format(amount);
}

const VIEW_CONFIG = {
  dashboard: {
    title: 'Dashboard \u00DCbersicht',
    data: null,
  },
  customers: {
    title: 'Kunden',
    data: mockCustomers,
    tableColumns: [
      { key: 'companyName', label: 'Unternehmen' },
      { key: 'contactPerson', label: 'Ansprechpartner' },
      { key: 'email', label: 'Email' },
      { key: 'industry', label: 'Branche' },
      { key: 'status', label: 'Status', render: (v) => <StatusBadge status={v} /> },
    ],
    pieData: () => {
      const counts = {};
      mockCustomers.forEach(c => { counts[c.industry || 'Sonstige'] = (counts[c.industry || 'Sonstige'] || 0) + 1; });
      return Object.entries(counts).map(([name, value]) => ({ name, value }));
    },
    barData: () => {
      const counts = {};
      mockCustomers.forEach(c => { const st = c.status || 'LEAD'; counts[st] = (counts[st] || 0) + 1; });
      return Object.entries(counts).map(([name, count]) => ({ name, count }));
    },
  },
  candidates: {
    title: 'Kandidaten',
    data: mockCandidates,
    tableColumns: [
      { key: 'firstName', label: 'Vorname' },
      { key: 'lastName', label: 'Nachname' },
      { key: 'email', label: 'Email' },
      { key: 'phone', label: 'Telefon' },
      { key: 'status', label: 'Status', render: (v) => <StatusBadge status={v} /> },
    ],
    pieData: () => {
      const counts = {};
      mockCandidates.forEach(c => { counts[c.status || 'NEW'] = (counts[c.status || 'NEW'] || 0) + 1; });
      return Object.entries(counts).map(([name, value]) => ({ name, value }));
    },
    barData: () => {
      const allSkills = new Set();
      mockCandidates.forEach(c => (c.skills || []).forEach(s => allSkills.add(s)));
      const topSkills = [...allSkills].slice(0, 10);
      const counts = {};
      mockCandidates.forEach(c => {
        (c.skills || []).forEach(s => {
          if (topSkills.includes(s)) counts[s] = (counts[s] || 0) + 1;
        });
      });
      return Object.entries(counts).map(([name, count]) => ({ name, count }));
    },
  },
  jobs: {
    title: 'Jobs',
    data: mockJobs,
    tableColumns: [
      { key: 'title', label: 'Position' },
      { key: 'customerName', label: 'Kunde' },
      { key: 'status', label: 'Status', render: (v) => <StatusBadge status={v} /> },
      { key: 'salaryRange', label: 'Gehaltsspanne' },
    ],
    pieData: () => {
      const counts = {};
      mockJobs.forEach(j => { counts[j.status || 'DRAFT'] = (counts[j.status || 'DRAFT'] || 0) + 1; });
      return Object.entries(counts).map(([name, value]) => ({ name, value }));
    },
    barData: () => {
      const counts = {};
      mockJobs.forEach(j => { const c = j.customerName || 'Unbekannt'; counts[c] = (counts[c] || 0) + 1; });
      return Object.entries(counts).map(([name, count]) => ({ name, count }));
    },
  },
  billings: {
    title: 'Billing',
    data: mockBillings,
    tableColumns: [
      { key: 'invoiceNumber', label: 'Rechnungsnr.' },
      { key: 'customerName', label: 'Kunde' },
      { key: 'candidateName', label: 'Kandidat', render: (v) => v || '-' },
      { key: 'amount', label: 'Betrag', render: (v) => formatEur(v) },
      { key: 'status', label: 'Status', render: (v) => <StatusBadge status={v} /> },
    ],
    pieData: () => {
      const counts = {};
      mockBillings.forEach(b => { counts[b.status || 'DRAFT'] = (counts[b.status || 'DRAFT'] || 0) + 1; });
      return Object.entries(counts).map(([name, value]) => ({ name, value }));
    },
    barData: () => {
      const counts = {};
      mockBillings.forEach(b => {
        const key = b.currency || 'EUR';
        counts[key] = (counts[key] || 0) + (b.amount || 0);
      });
      return Object.entries(counts).map(([name, count]) => ({ name, count: Math.round(count) }));
    },
  },
};

function Card({ children, style }) {
  return (
    <div style={{
      background: 'var(--bg-card)',
      border: '1px solid var(--card-border)',
      borderRadius: 12,
      padding: 20,
      ...style,
    }}>
      {children}
    </div>
  );
}

function StatCard({ label, value, color }) {
  return (
    <div style={{
      position: 'relative', overflow: 'hidden',
      background: 'var(--bg-card)',
      border: '1px solid var(--card-border)',
      borderRadius: 12,
      padding: 20,
    }}>
      <div style={{
        position: 'absolute', top: 0, left: 0, bottom: 0, width: 3,
        background: color,
      }} />
      <div style={{ fontSize: 12, fontWeight: 600, color: 'var(--text-muted)', marginBottom: 8, textTransform: 'uppercase', letterSpacing: '0.05em' }}>
        {label}
      </div>
      <div style={{ fontSize: 26, fontWeight: 700, color: 'var(--text-main)' }}>
        {value}
      </div>
    </div>
  );
}

export default function OverviewView({ view, onRowClick }) {
  const config = VIEW_CONFIG[view];
  const [slideOverOpen, setSlideOverOpen] = useState(false);
  const [, forceUpdate] = useReducer(x => x + 1, 0);

  const LABELS = {
    customers: { title: 'Kunden', article: 'Neuen', entityType: 'customer' },
    candidates: { title: 'Kandidaten', article: 'Neuen', entityType: 'candidate' },
    jobs: { title: 'Job', article: 'Neuen', entityType: 'job' },
    billings: { title: 'Rechnung', article: 'Neue', entityType: 'billing' },
  };

  function handleCreate(newEntity) {
    const map = {
      candidates: mockCandidates,
      customers: mockCustomers,
      jobs: mockJobs,
      billings: mockBillings,
    };
    const arr = map[view];
    if (arr) {
      arr.push(newEntity);
      forceUpdate();
      setSlideOverOpen(false);
    }
  }

  if (!config) return null;

  if (view === 'dashboard') {
    const totalCustomers = mockCustomers.length;
    const totalCandidates = mockCandidates.length;
    const openJobs = mockJobs.filter(j => j.status === 'OPEN').length;
    const totalRevenue = mockBillings.filter(b => b.status === 'PAID').reduce((s, b) => s + b.amount, 0);

    const cards = [
      { label: 'Kunden', value: totalCustomers, color: 'var(--chart-1)' },
      { label: 'Kandidaten', value: totalCandidates, color: 'var(--chart-2)' },
      { label: 'Offene Jobs', value: openJobs, color: 'var(--chart-3)' },
      { label: 'Umsatz (bezahlt)', value: formatEur(totalRevenue), color: 'var(--chart-4)' },
    ];

    const pieData = mockJobs.reduce((acc, j) => {
      const st = j.status || 'DRAFT'; acc[st] = (acc[st] || 0) + 1; return acc;
    }, {});
    const pieChartData = Object.entries(pieData).map(([name, value]) => ({ name, value }));

    const barData = mockCandidates.reduce((acc, c) => {
      const st = c.status || 'NEW'; acc[st] = (acc[st] || 0) + 1; return acc;
    }, {});
    const barChartData = Object.entries(barData).map(([name, count]) => ({ name, count }));

    return (
      <div>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 12, marginBottom: 20 }}>
          {cards.map(card => (
            <StatCard key={card.label} label={card.label} value={card.value} color={card.color} />
          ))}
        </div>
        <StatsCharts
          pieData={pieChartData}
          barData={barChartData}
          pieLabel="Job Status Verteilung"
          barLabel="Kandidaten Status"
          entityType="dashboard"
        />
      </div>
    );
  }

  const pieData = config.pieData ? config.pieData() : [];
  const barData = config.barData ? config.barData() : [];

  return (
    <div>
      <StatsCharts pieData={pieData} barData={barData} entityType={LABELS[view]?.entityType || view} />
      <div style={{ marginTop: 24 }}>
        <Card>
          <DataTable
            data={config.data || []}
            columns={config.tableColumns || []}
            searchPlaceholder={`${config.title} durchsuchen...`}
            onRowClick={onRowClick}
            headerRight={view !== 'dashboard' ? (
              <button
                onClick={() => setSlideOverOpen(true)}
                className="inline-flex items-center gap-2 px-4 py-2.5 rounded-lg text-sm font-semibold bg-app-accent text-white hover:bg-app-accent-hover transition-colors whitespace-nowrap"
              >
                <Plus size={16} />
                {LABELS[view]?.article} {LABELS[view]?.title} anlegen
              </button>
            ) : null}
          />
        </Card>
      </div>

      <CreateSlideOver
        entityType={LABELS[view]?.entityType || view}
        open={slideOverOpen}
        onClose={() => setSlideOverOpen(false)}
        onSave={handleCreate}
      />
    </div>
  );
}
