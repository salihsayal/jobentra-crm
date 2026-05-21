import { useState, useMemo } from 'react';

export default function DataTable({ data, columns, searchPlaceholder, onRowClick }) {
  const [search, setSearch] = useState('');
  const [sortKey, setSortKey] = useState(null);
  const [sortDir, setSortDir] = useState('asc');

  const filtered = useMemo(() => {
    if (!search.trim()) return data;
    const q = search.toLowerCase();
    return data.filter(row =>
      columns.some(col => {
        const val = row[col.key];
        return val && String(val).toLowerCase().includes(q);
      })
    );
  }, [data, search, columns]);

  const sorted = useMemo(() => {
    if (!sortKey) return filtered;
    return [...filtered].sort((a, b) => {
      const va = a[sortKey] ?? '';
      const vb = b[sortKey] ?? '';
      const cmp = String(va).localeCompare(String(vb), 'de', { sensitivity: 'base' });
      return sortDir === 'asc' ? cmp : -cmp;
    });
  }, [filtered, sortKey, sortDir]);

  function handleSort(key) {
    if (sortKey === key) {
      setSortDir(d => d === 'asc' ? 'desc' : 'asc');
    } else {
      setSortKey(key);
      setSortDir('asc');
    }
  }

  return (
    <div>
      <div style={{ marginBottom: 16 }}>
        <input
          type="text"
          value={search}
          onChange={e => setSearch(e.target.value)}
          placeholder={searchPlaceholder || 'Tabelle durchsuchen...'}
          style={{
            width: '100%', maxWidth: 360, padding: '8px 14px', borderRadius: 10, fontSize: 13,
            background: 'var(--bg-input)', color: 'var(--text-main)',
            border: '1px solid var(--border)', outline: 'none',
          }}
        />
      </div>

      <div style={{ overflowX: 'auto' }}>
        <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 13 }}>
          <thead>
            <tr style={{ borderBottom: '1px solid var(--border)' }}>
              {columns.map(col => (
                <th
                  key={col.key}
                  onClick={() => handleSort(col.key)}
                  style={{
                    textAlign: 'left', padding: '14px 16px', color: 'var(--text-dim)',
                    fontWeight: 700, fontSize: 11, textTransform: 'uppercase', letterSpacing: '0.05em',
                    cursor: 'pointer', whiteSpace: 'nowrap', userSelect: 'none',
                  }}
                >
                  {col.label}
                  {sortKey === col.key && (
                    <span style={{ marginLeft: 4, fontSize: 10 }}>{sortDir === 'asc' ? '\u25B2' : '\u25BC'}</span>
                  )}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {sorted.length === 0 ? (
              <tr>
                <td colSpan={columns.length} style={{ padding: 32, textAlign: 'center', color: 'var(--text-dim)', fontSize: 13 }}>
                  {search ? 'Keine Ergebnisse f\u00fcr diesen Filter.' : 'Keine Daten vorhanden.'}
                </td>
              </tr>
            ) : (
              sorted.map(row => (
                <tr
                  key={row.id}
                  onClick={() => onRowClick(row)}
                  style={{ borderBottom: '1px solid var(--border)', cursor: 'pointer', transition: 'background 0.15s' }}
                  className="hover:bg-app-bg-hover"
                >
                  {columns.map(col => {
                    const val = row[col.key];
                    const display = col.render ? col.render(val, row) : (val ?? '-');
                    return (
                      <td key={col.key} style={{ padding: '14px 16px', whiteSpace: 'nowrap', color: 'var(--text-main)' }}>
                        {typeof display === 'string' ? display : display}
                      </td>
                    );
                  })}
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      <div style={{ marginTop: 12, fontSize: 12, color: 'var(--text-dim)', paddingLeft: 4 }}>
        {sorted.length} von {data.length} Eintr&auml;gen
      </div>
    </div>
  );
}
