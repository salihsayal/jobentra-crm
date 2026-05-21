import StatsCharts from './StatsCharts';
import DataTable from './DataTable';
import {
  mockCustomers, mockCandidates, mockJobs, mockBillings,
} from '@/utils/mockData';

const STATUS_COLORS = {
  ACTIVE: { bg: 'rgba(34,197,94,0.15)', text: '#22c55e' },
  INACTIVE: { bg: 'rgba(100,116,139,0.15)', text: '#94a3b8' },
  LEAD: { bg: 'rgba(59,130,246,0.15)', text: '#3b82f6' },
  NEW: { bg: 'rgba(59,130,246,0.15)', text: '#3b82f6' },
  IN_PROCESS: { bg: 'rgba(245,158,11,0.15)', text: '#f59e0b' },
  PLACED: { bg: 'rgba(34,197,94,0.15)', text: '#22c55e' },
  REJECTED: { bg: 'rgba(239,68,68,0.15)', text: '#ef4444' },
  OPEN: { bg: 'rgba(34,197,94,0.15)', text: '#22c55e' },
  CLOSED: { bg: 'rgba(100,116,139,0.15)', text: '#94a3b8' },
  DRAFT: { bg: 'rgba(139,92,246,0.15)', text: '#8b5cf6' },
  SENT: { bg: 'rgba(59,130,246,0.15)', text: '#3b82f6' },
  PAID: { bg: 'rgba(34,197,94,0.15)', text: '#22c55e' },
  CANCELLED: { bg: 'rgba(239,68,68,0.15)', text: '#ef4444' },
};

function StatusBadge({ status }) {
  const s = STATUS_COLORS[status] || { bg: 'rgba(100,116,139,0.15)', text: '#94a3b8' };
  return (
    <span style={{
      display: 'inline-block', padding: '2px 8px', borderRadius: 999, fontSize: 11, fontWeight: 500,
      background: s.bg, color: s.text,
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

export default function OverviewView({ view, onRowClick }) {
  const config = VIEW_CONFIG[view];
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
            <div key={card.label} style={{ background: 'var(--bg-card)', border: '1px solid var(--border)', borderRadius: 8, padding: 16 }}>
              <div style={{ fontSize: 12, color: 'var(--text-muted)', marginBottom: 6 }}>{card.label}</div>
              <div style={{ fontSize: 24, fontWeight: 700, color: 'var(--text-main)' }}>{card.value}</div>
            </div>
          ))}
        </div>
        <StatsCharts
          pieData={pieChartData}
          barData={barChartData}
          pieLabel="Job Status Verteilung"
          barLabel="Kandidaten Status"
        />
      </div>
    );
  }

  const pieData = config.pieData ? config.pieData() : [];
  const barData = config.barData ? config.barData() : [];

  return (
    <div>
      <StatsCharts pieData={pieData} barData={barData} />
      <div style={{ marginTop: 24 }}>
        <DataTable
          data={config.data || []}
          columns={config.tableColumns || []}
          searchPlaceholder={`${config.title} durchsuchen...`}
          onRowClick={onRowClick}
        />
      </div>
    </div>
  );
}
