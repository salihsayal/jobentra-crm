import { PieChart, Pie, Cell, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';

const CHART_COLORS = ['var(--chart-1)', 'var(--chart-2)', 'var(--chart-3)', 'var(--chart-4)', 'var(--chart-5)', 'var(--chart-6)'];

function toPieData(data, labelKey, countKey, statusMap) {
  const counts = {};
  data.forEach(item => {
    const val = item[labelKey];
    const display = statusMap ? (statusMap[val] || val) : val;
    counts[display] = (counts[display] || 0) + 1;
  });
  return Object.entries(counts).map(([name, value]) => ({ name, value }));
}

function toBarData(data, labelKey) {
  const counts = {};
  data.forEach(item => {
    const val = item[labelKey] || 'Unbekannt';
    counts[val] = (counts[val] || 0) + 1;
  });
  return Object.entries(counts).map(([name, count]) => ({ name, count }));
}

function CustomTooltip({ active, payload, label }) {
  if (!active || !payload || !payload.length) return null;
  return (
    <div style={{ background: 'var(--bg-card)', border: '1px solid var(--border)', borderRadius: 8, padding: '8px 12px', fontSize: 13 }}>
      {payload.map((p, i) => (
        <div key={i} style={{ color: p.color }}>{p.name}: <strong>{p.value}</strong></div>
      ))}
    </div>
  );
}

export default function StatsCharts({ pieData, barData, pieLabel, barLabel }) {
  return (
    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
      <div style={{ background: 'var(--bg-card)', border: '1px solid var(--border)', borderRadius: 8, padding: 16 }}>
        <h3 style={{ fontSize: 13, color: 'var(--text-muted)', marginBottom: 12 }}>{pieLabel || 'Status Verteilung'}</h3>
        <ResponsiveContainer width="100%" height={250}>
          <PieChart>
            <Pie data={pieData} cx="50%" cy="50%" outerRadius={90} innerRadius={40} dataKey="value" paddingAngle={3}>
              {pieData.map((_, i) => (
                <Cell key={i} fill={CHART_COLORS[i % CHART_COLORS.length]} stroke="var(--bg-card)" strokeWidth={2} />
              ))}
            </Pie>
            <Tooltip content={<CustomTooltip />} />
            <Legend />
          </PieChart>
        </ResponsiveContainer>
      </div>

      <div style={{ background: 'var(--bg-card)', border: '1px solid var(--border)', borderRadius: 8, padding: 16 }}>
        <h3 style={{ fontSize: 13, color: 'var(--text-muted)', marginBottom: 12 }}>{barLabel || 'Kategorien'}</h3>
        <ResponsiveContainer width="100%" height={250}>
          <BarChart data={barData}>
            <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" />
            <XAxis dataKey="name" tick={{ fontSize: 11, fill: 'var(--text-dim)' }} />
            <YAxis tick={{ fontSize: 11, fill: 'var(--text-dim)' }} allowDecimals={false} />
            <Tooltip content={<CustomTooltip />} />
            <Bar dataKey="count" fill="var(--accent)" radius={[4, 4, 0, 0]} />
          </BarChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}
