import { useState, useMemo } from 'react';
import { FolderArchive, Trash2, Undo2, Check, Minus } from 'lucide-react';

function Checkbox({ checked, indeterminate, onChange, onClick }) {
  return (
    <label
      className="relative inline-flex items-center cursor-pointer"
      onClick={(e) => { if (onClick) onClick(e); }}
    >
      <input
        type="checkbox"
        checked={checked}
        onChange={onChange}
        className="sr-only"
        ref={el => { if (el && indeterminate !== undefined) el.indeterminate = indeterminate; }}
      />
      <span
        className={`inline-flex items-center justify-center w-4 h-4 rounded border transition-all duration-150 ${
          checked || indeterminate
            ? 'bg-[var(--accent)] border-[var(--accent)]'
            : 'bg-transparent border-zinc-700 hover:border-zinc-500'
        }`}
      >
        {checked && <Check size={10} strokeWidth={3} className="text-white" />}
        {!checked && indeterminate && <Minus size={10} strokeWidth={3} className="text-white" />}
      </span>
    </label>
  );
}

export default function DataTable({ data, columns, searchPlaceholder, onRowClick, headerRight, onBulkArchive, onBulkUnarchive, onBulkDelete, showArchived, totalArchived }) {
  const [search, setSearch] = useState('');
  const [sortKey, setSortKey] = useState(null);
  const [sortDir, setSortDir] = useState('asc');
  const [selectedIds, setSelectedIds] = useState(new Set());

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

  const allVisibleIds = useMemo(() => new Set(sorted.map(r => r.id)), [sorted]);

  function handleSort(key) {
    if (sortKey === key) {
      setSortDir(d => d === 'asc' ? 'desc' : 'asc');
    } else {
      setSortKey(key);
      setSortDir('asc');
    }
  }

  function toggleSelectOne(id, e) {
    e.stopPropagation();
    setSelectedIds(prev => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id); else next.add(id);
      return next;
    });
  }

  function toggleSelectAll() {
    setSelectedIds(prev => {
      const allSelected = allVisibleIds.size > 0 && [...allVisibleIds].every(id => prev.has(id));
      if (allSelected) return new Set();
      return new Set(allVisibleIds);
    });
  }

  function clearSelection() {
    setSelectedIds(new Set());
  }

  function handleArchive() {
    if (onBulkArchive) {
      onBulkArchive([...selectedIds]);
      clearSelection();
    }
  }

  function handleDelete() {
    if (onBulkDelete) {
      onBulkDelete([...selectedIds]);
      clearSelection();
    }
  }

  const allChecked = sorted.length > 0 && sorted.every(r => selectedIds.has(r.id));
  const someChecked = sorted.some(r => selectedIds.has(r.id));
  const hasSelection = selectedIds.size > 0;
  const anyArchivedSelected = hasSelection && sorted.some(r => selectedIds.has(r.id) && r.isArchived);
  const allArchivedSelected = hasSelection && sorted.filter(r => selectedIds.has(r.id)).every(r => r.isArchived);

  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16, gap: 12 }}>
        <input
          type="text"
          value={search}
          onChange={e => setSearch(e.target.value)}
          placeholder={searchPlaceholder || 'Tabelle durchsuchen...'}
          style={{
            flex: 1, maxWidth: 360, padding: '8px 14px', borderRadius: 10, fontSize: 13,
            background: 'var(--bg-input)', color: 'var(--text-main)',
            border: '1px solid var(--border)', outline: 'none',
          }}
        />
        {headerRight}
      </div>

      {hasSelection && (
        <div style={{
          display: 'flex', alignItems: 'center', justifyContent: 'space-between',
          background: 'var(--bg-card)', border: '1px solid var(--card-border)',
          borderRadius: 10, padding: '10px 16px', marginBottom: 12,
          gap: 12, flexWrap: 'wrap',
        }}>
          <span style={{ fontSize: 13, fontWeight: 600, color: 'var(--text-main)' }}>
            {selectedIds.size} ausgew&auml;hlt
          </span>
          <div style={{ display: 'flex', gap: 8 }}>
            {allArchivedSelected ? (
              <button
                onClick={() => { if (onBulkUnarchive) { onBulkUnarchive([...selectedIds]); clearSelection(); } }}
                className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-sm font-medium transition-colors"
                style={{ border: '1px solid var(--success)', color: 'var(--success)', background: 'transparent' }}
              >
                <Undo2 size={14} />
                Unarchivieren
              </button>
            ) : (
              <button
                onClick={handleArchive}
                className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-sm font-medium transition-colors"
                style={{ border: '1px solid var(--warning)', color: 'var(--warning)', background: 'transparent' }}
              >
                <FolderArchive size={14} />
                Archivieren
              </button>
            )}
            <button
              onClick={handleDelete}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-sm font-medium transition-colors"
              style={{ border: '1px solid var(--danger)', color: 'var(--danger)', background: 'transparent' }}
            >
              <Trash2 size={14} />
              Endg&uuml;ltig l&ouml;schen
            </button>
          </div>
        </div>
      )}

      <div style={{ overflowX: 'auto' }}>
        <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 13 }}>
          <thead>
            <tr style={{ borderBottom: '1px solid var(--border)' }}>
              <th style={{ padding: '14px 10px', width: 40 }}>
                <Checkbox
                  checked={allChecked}
                  indeterminate={someChecked && !allChecked}
                  onChange={toggleSelectAll}
                />
              </th>
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
                <td colSpan={columns.length + 1} style={{ padding: 32, textAlign: 'center', color: 'var(--text-dim)', fontSize: 13 }}>
                  {search ? 'Keine Ergebnisse f\u00fcr diesen Filter.' : 'Keine Daten vorhanden.'}
                </td>
              </tr>
            ) : (
              sorted.map(row => (
                <tr
                  key={row.id}
                  onClick={() => onRowClick(row)}
                  style={{
                    borderBottom: '1px solid var(--border)', cursor: 'pointer', transition: 'background 0.15s',
                    ...(row.isArchived ? { background: 'rgba(100,116,139,0.04)', color: 'var(--text-dim)' } : {}),
                  }}
                  className="hover:bg-app-bg-hover"
                >
                  <td style={{ padding: '14px 10px', width: 40 }}>
                    <Checkbox
                      checked={selectedIds.has(row.id)}
                      onChange={(e) => toggleSelectOne(row.id, e)}
                      onClick={(e) => e.stopPropagation()}
                    />
                  </td>
                  {columns.map(col => {
                    const val = row[col.key];
                    const display = col.render ? col.render(val, row) : (val ?? '-');
                    return (
                      <td key={col.key} style={{ padding: '14px 16px', whiteSpace: 'nowrap', color: row.isArchived ? 'var(--text-dim)' : 'var(--text-main)' }}>
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
        {totalArchived > 0 && !showArchived && (
          <span> ({totalArchived} archiviert)</span>
        )}
      </div>
    </div>
  );
}
