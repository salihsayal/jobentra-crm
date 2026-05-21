import { PieChart, Pie, Cell, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import { mockBillings } from '@/utils/mockData';

const CHART_COLORS = [
  'var(--chart-1)', 'var(--chart-2)', 'var(--chart-3)',
  'var(--chart-4)', 'var(--chart-5)', 'var(--chart-6)',
  'var(--chart-7)',
];

function formatEur(value) {
  return new Intl.NumberFormat('de-DE', { style: 'currency', currency: 'EUR', minimumFractionDigits: 0, maximumFractionDigits: 0 }).format(value);
}

function CustomTooltip({ active, payload, label, isEuroPie }) {
  if (!active || !payload || !payload.length) return null;
  return (
    <div style={{
      background: 'var(--bg-card)',
      border: '1px solid var(--accent)',
      borderRadius: 10,
      padding: '10px 14px',
      fontSize: 13,
      boxShadow: '0 4px 16px rgba(0,0,0,0.5)',
    }}>
      {payload.map((p, i) => (
        <div key={i} style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: i < payload.length - 1 ? 4 : 0 }}>
          <span style={{ width: 8, height: 8, borderRadius: '50%', background: p.color, flexShrink: 0 }} />
          <span style={{ color: 'var(--text-muted)' }}>{p.name}:</span>
          <strong style={{ color: 'var(--text-main)' }}>{isEuroPie ? formatEur(p.value) : p.value}</strong>
        </div>
      ))}
    </div>
  );
}

function CustomLegend({ data, colors, isEuroPie }) {
  if (!data || data.length === 0) return null;
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 10, justifyContent: 'center' }}>
      {data.map((entry, i) => (
        <div key={i} style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          <span style={{
            width: 10, height: 10, borderRadius: 3,
            background: colors[i % colors.length], flexShrink: 0,
          }} />
          <span style={{ fontSize: 13, color: 'var(--text-muted)', fontWeight: 500 }}>
            {entry.name}
          </span>
          <span style={{ fontSize: 13, color: 'var(--text-main)', fontWeight: 600, marginLeft: 'auto' }}>
            {isEuroPie ? formatEur(entry.value) : entry.value}
          </span>
        </div>
      ))}
    </div>
  );
}

function getBillingPieData() {
  const sums = { PAID: 0, SENT: 0, DRAFT: 0, CANCELLED: 0 };
  mockBillings.forEach(b => {
    const key = b.status || 'DRAFT';
    sums[key] = (sums[key] || 0) + (b.amount || 0);
  });
  return Object.entries(sums).map(([name, value]) => ({ name, value: Math.round(value) }));
}

function getBillingBarData() {
  const counts = { PAID: 0, SENT: 0, DRAFT: 0, CANCELLED: 0 };
  mockBillings.forEach(b => {
    const key = b.status || 'DRAFT';
    counts[key] = (counts[key] || 0) + 1;
  });
  return Object.entries(counts).map(([name, count]) => ({ name, count }));
}

export default function StatsCharts({ pieData, barData, pieLabel, barLabel, entityType }) {
  const isBilling = entityType === 'billing';
  const finalPieData = isBilling ? getBillingPieData() : pieData;
  const finalBarData = isBilling ? getBillingBarData() : barData;
  const finalPieLabel = isBilling ? 'Umsatz pro Status (EUR)' : (pieLabel || 'Status Verteilung');
  const finalBarLabel = isBilling ? 'Rechnungen pro Status' : (barLabel || 'Kategorien');

  return (
    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
      <div style={{
        background: 'var(--bg-card)',
        border: '1px solid var(--card-border)',
        borderRadius: 12,
        padding: 20,
      }}>
        <h3 style={{ fontSize: 13, fontWeight: 600, color: 'var(--text-muted)', marginBottom: 16, textTransform: 'uppercase', letterSpacing: '0.05em' }}>
          {finalPieLabel}
        </h3>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          <div style={{ flex: '0 0 180px' }}>
            <ResponsiveContainer width={180} height={180}>
              <PieChart>
                <Pie
                  data={finalPieData}
                  cx="50%" cy="50%"
                  innerRadius={52} outerRadius={78}
                  dataKey="value"
                  paddingAngle={2}
                  stroke="var(--bg-card)"
                  strokeWidth={3}
                >
                  {finalPieData.map((_, i) => (
                    <Cell key={i} fill={CHART_COLORS[i % CHART_COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip content={<CustomTooltip isEuroPie={isBilling} />} />
              </PieChart>
            </ResponsiveContainer>
          </div>
          <div style={{ flex: 1 }}>
            <CustomLegend data={finalPieData} colors={CHART_COLORS} isEuroPie={isBilling} />
          </div>
        </div>
      </div>

      <div style={{
        background: 'var(--bg-card)',
        border: '1px solid var(--card-border)',
        borderRadius: 12,
        padding: 20,
      }}>
        <h3 style={{ fontSize: 13, fontWeight: 600, color: 'var(--text-muted)', marginBottom: 16, textTransform: 'uppercase', letterSpacing: '0.05em' }}>
          {finalBarLabel}
        </h3>
        <ResponsiveContainer width="100%" height={260}>
          <BarChart data={finalBarData} margin={{ top: 4, right: 4, left: -8, bottom: 0 }}>
            <CartesianGrid strokeDasharray="4 4" stroke="rgba(255,255,255,0.04)" vertical={false} />
            <XAxis
              dataKey="name"
              tick={{ fontSize: 11, fill: 'var(--text-dim)' }}
              axisLine={false}
              tickLine={false}
              interval={0}
              angle={finalBarData && finalBarData.length > 6 ? -30 : 0}
              textAnchor={finalBarData && finalBarData.length > 6 ? 'end' : 'middle'}
              height={finalBarData && finalBarData.length > 6 ? 50 : 30}
            />
            <YAxis
              tick={{ fontSize: 11, fill: 'var(--text-dim)' }}
              axisLine={false}
              tickLine={false}
              allowDecimals={false}
            />
            <Tooltip content={<CustomTooltip />} />
            <Bar dataKey="count" fill="var(--accent)" radius={[6, 6, 0, 0]} maxBarSize={48} />
          </BarChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}
