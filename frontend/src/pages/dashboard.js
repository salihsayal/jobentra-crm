import { useRouter } from 'next/router';
import { useState, useRef, useCallback, useEffect } from 'react';

const STATUS_COLORS = {
  active: 'bg-green-100 text-green-800',
  inactive: 'bg-gray-100 text-gray-600',
  lead: 'bg-blue-100 text-blue-800',
};

export default function Dashboard({ initialMembers, error }) {
  const router = useRouter();
  const [members, setMembers] = useState(initialMembers?.content || []);
  const [page, setPage] = useState(initialMembers?.number || 0);
  const [totalPages, setTotalPages] = useState(initialMembers?.totalPages || 0);
  const [modalOpen, setModalOpen] = useState(false);
  const [editMember, setEditMember] = useState(null);
  const [form, setForm] = useState({
    firstName: '', lastName: '', email: '', phone: '', status: 'active', notes: '',
  });
  const [formError, setFormError] = useState('');
  const [saving, setSaving] = useState(false);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [stats, setStats] = useState(null);
  const [recentMembers, setRecentMembers] = useState([]);
  const debounceRef = useRef(null);

  useEffect(() => {
    async function loadStats() {
      try {
        const [countRes, recentRes, actRes, recentMemsRes] = await Promise.all([
          fetch('/api/stats/members/count', { credentials: 'include' }),
          fetch('/api/stats/members/recent?days=7', { credentials: 'include' }),
          fetch('/api/stats/activities/recent?days=7', { credentials: 'include' }),
          fetch('/api/members?sort=createdAt,desc&size=5', { credentials: 'include' }),
        ]);
        const counts = countRes.ok ? await countRes.json() : {};
        const recent = recentRes.ok ? await recentRes.json() : {};
        const actRecent = actRes.ok ? await actRes.json() : {};
        const recentMems = recentMemsRes.ok ? await recentMemsRes.json() : {};
        setStats({
          total: counts.total || 0,
          active: counts.active || 0,
          inactive: counts.inactive || 0,
          lead: counts.lead || 0,
          membersRecent: recent.count || 0,
          activitiesRecent: actRecent.count || 0,
        });
        setRecentMembers(recentMems.content || []);
      } catch (e) {
        // stats fetch failed, continue without stats
      }
    }
    loadStats();
  }, []);

  const buildUrl = useCallback((pageNum, s, st) => {
    const params = new URLSearchParams();
    params.set('page', pageNum);
    params.set('size', '10');
    params.set('sort', 'lastName');
    if (s) params.set('search', s);
    if (st) params.set('status', st);
    return '/api/members?' + params.toString();
  }, []);

  async function fetchPage(pageNum, s = search, st = statusFilter) {
    const url = buildUrl(pageNum, s, st);
    const res = await fetch(url, { credentials: 'include' });
    if (res.ok) {
      const data = await res.json();
      setMembers(data.content);
      setPage(data.number);
      setTotalPages(data.totalPages);
    }
  }

  function handleSearchChange(value) {
    setSearch(value);
    clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(() => {
      fetchPage(0, value, statusFilter);
    }, 300);
  }

  function handleStatusChange(value) {
    setStatusFilter(value);
    fetchPage(0, search, value);
  }

  function openCreate() {
    setEditMember(null);
    setForm({ firstName: '', lastName: '', email: '', phone: '', status: 'active', notes: '' });
    setFormError('');
    setModalOpen(true);
  }

  function openEdit(member) {
    setEditMember(member);
    setForm({
      firstName: member.firstName,
      lastName: member.lastName,
      email: member.email,
      phone: member.phone || '',
      status: member.status,
      notes: member.notes || '',
    });
    setFormError('');
    setModalOpen(true);
  }

  async function handleSubmit(e) {
    e.preventDefault();
    setFormError('');
    setSaving(true);

    const url = editMember ? `/api/members/${editMember.id}` : '/api/members';
    const method = editMember ? 'PUT' : 'POST';
    const res = await fetch(url, {
      method,
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(form),
      credentials: 'include',
    });

    if (res.ok) {
      setModalOpen(false);
      fetchPage(page);
    } else {
      const data = await res.json();
      setFormError(data.error || 'An error occurred');
    }
    setSaving(false);
  }

  async function handleDelete(id) {
    if (!confirm('Delete this member?')) return;
    const res = await fetch(`/api/members/${id}`, {
      method: 'DELETE',
      credentials: 'include',
    });
    if (res.ok) {
      fetchPage(page);
    } else if (res.status === 403) {
      alert('Only admins can delete members.');
    }
  }

  function updateField(field, value) {
    setForm((prev) => ({ ...prev, [field]: value }));
  }

  if (error) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-100">
        <div className="bg-white p-8 rounded shadow-md text-center max-w-md">
          <p className="text-red-600 mb-4">{error}</p>
          <button
            onClick={() => router.push('/')}
            className="bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700"
          >
            Go to Login
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-100">
      <header className="bg-white shadow-sm">
        <div className="max-w-6xl mx-auto px-6 py-4 flex justify-between items-center">
          <h1 className="text-xl font-bold">Jobentra CRM</h1>
          <span className="text-sm text-gray-500">Member Management</span>
        </div>
      </header>

      <main className="max-w-6xl mx-auto px-6 py-8">
        {stats && (
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
            <div className="bg-white rounded shadow p-4">
              <p className="text-xs text-gray-500 uppercase">Total Members</p>
              <p className="text-2xl font-bold text-gray-800">{stats.total}</p>
            </div>
            <div className="bg-white rounded shadow p-4">
              <p className="text-xs text-gray-500 uppercase">Active</p>
              <p className="text-2xl font-bold text-green-600">{stats.active}</p>
            </div>
            <div className="bg-white rounded shadow p-4">
              <p className="text-xs text-gray-500 uppercase">New Members (7d)</p>
              <p className="text-2xl font-bold text-blue-600">{stats.membersRecent}</p>
            </div>
            <div className="bg-white rounded shadow p-4">
              <p className="text-xs text-gray-500 uppercase">Activities (7d)</p>
              <p className="text-2xl font-bold text-purple-600">{stats.activitiesRecent}</p>
            </div>
          </div>
        )}

        {recentMembers.length > 0 && (
          <div className="bg-white rounded shadow p-4 mb-8">
            <p className="text-xs text-gray-500 uppercase mb-3">Recent Members</p>
            <div className="space-y-2">
              {recentMembers.map((m) => (
                <div key={m.id} className="flex items-center justify-between text-sm">
                  <div>
                    <button
                      onClick={() => router.push(`/members/${m.id}`)}
                      className="text-blue-600 hover:text-blue-800 font-medium"
                    >
                      {m.firstName} {m.lastName}
                    </button>
                    <span className="text-gray-400 ml-2">{m.email}</span>
                  </div>
                  <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${STATUS_COLORS[m.status] || 'bg-gray-100 text-gray-600'}`}>
                    {m.status}
                  </span>
                </div>
              ))}
            </div>
          </div>
        )}

        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-6">
          <h2 className="text-2xl font-semibold">Members</h2>
          <div className="flex gap-3 w-full sm:w-auto">
            <input
              type="text"
              placeholder="Search name or email..."
              value={search}
              onChange={(e) => handleSearchChange(e.target.value)}
              className="flex-1 sm:w-64 p-2 border rounded text-sm"
            />
            <select
              value={statusFilter}
              onChange={(e) => handleStatusChange(e.target.value)}
              className="p-2 border rounded text-sm"
            >
              <option value="">All statuses</option>
              <option value="active">Active</option>
              <option value="inactive">Inactive</option>
              <option value="lead">Lead</option>
            </select>
            <button
              onClick={openCreate}
              className="bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700 text-sm font-medium whitespace-nowrap"
            >
              + New Member
            </button>
          </div>
        </div>

        <div className="bg-white rounded shadow overflow-hidden">
          <table className="w-full">
            <thead>
              <tr className="bg-gray-50 border-b">
                <th className="p-3 text-left text-sm font-medium text-gray-600">Name</th>
                <th className="p-3 text-left text-sm font-medium text-gray-600">Email</th>
                <th className="p-3 text-left text-sm font-medium text-gray-600">Phone</th>
                <th className="p-3 text-left text-sm font-medium text-gray-600">Status</th>
                <th className="p-3 text-left text-sm font-medium text-gray-600">Actions</th>
              </tr>
            </thead>
            <tbody>
              {members.length === 0 ? (
                <tr>
                  <td colSpan={5} className="p-6 text-center text-gray-400">
                    {search || statusFilter ? 'No members match your filters.' : 'No members found.'}
                  </td>
                </tr>
              ) : (
                members.map((m) => (
                  <tr key={m.id} className="border-b hover:bg-gray-50">
                    <td className="p-3 text-sm">{m.firstName} {m.lastName}</td>
                    <td className="p-3 text-sm">{m.email}</td>
                    <td className="p-3 text-sm text-gray-500">{m.phone || '-'}</td>
                    <td className="p-3">
                      <span className={`text-xs px-2 py-1 rounded-full font-medium ${STATUS_COLORS[m.status] || 'bg-gray-100 text-gray-600'}`}>
                        {m.status}
                      </span>
                    </td>
                    <td className="p-3 text-sm whitespace-nowrap">
                      <button
                        onClick={() => router.push(`/members/${m.id}`)}
                        className="text-gray-600 hover:text-gray-800 mr-3"
                      >
                        View
                      </button>
                      <button
                        onClick={() => openEdit(m)}
                        className="text-blue-600 hover:text-blue-800 mr-3"
                      >
                        Edit
                      </button>
                      <button
                        onClick={() => handleDelete(m.id)}
                        className="text-red-600 hover:text-red-800"
                      >
                        Delete
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        {totalPages > 1 && (
          <div className="flex justify-center items-center gap-2 mt-4">
            <button
              onClick={() => fetchPage(0)}
              disabled={page === 0}
              className="px-3 py-1 rounded border text-sm disabled:opacity-30"
            >
              First
            </button>
            <button
              onClick={() => fetchPage(page - 1)}
              disabled={page === 0}
              className="px-3 py-1 rounded border text-sm disabled:opacity-30"
            >
              Prev
            </button>
            <span className="text-sm text-gray-600 px-3">
              Page {page + 1} of {totalPages}
            </span>
            <button
              onClick={() => fetchPage(page + 1)}
              disabled={page >= totalPages - 1}
              className="px-3 py-1 rounded border text-sm disabled:opacity-30"
            >
              Next
            </button>
            <button
              onClick={() => fetchPage(totalPages - 1)}
              disabled={page >= totalPages - 1}
              className="px-3 py-1 rounded border text-sm disabled:opacity-30"
            >
              Last
            </button>
          </div>
        )}
      </main>

      {modalOpen && (
        <div className="fixed inset-0 bg-black bg-opacity-40 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg shadow-lg w-full max-w-lg p-6">
            <h3 className="text-lg font-semibold mb-4">
              {editMember ? 'Edit Member' : 'New Member'}
            </h3>

            {formError && (
              <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-2 rounded mb-4 text-sm">
                {formError}
              </div>
            )}

            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm text-gray-600 mb-1">First Name</label>
                  <input
                    type="text"
                    value={form.firstName}
                    onChange={(e) => updateField('firstName', e.target.value)}
                    className="w-full p-2 border rounded text-sm"
                    required
                  />
                </div>
                <div>
                  <label className="block text-sm text-gray-600 mb-1">Last Name</label>
                  <input
                    type="text"
                    value={form.lastName}
                    onChange={(e) => updateField('lastName', e.target.value)}
                    className="w-full p-2 border rounded text-sm"
                    required
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm text-gray-600 mb-1">Email</label>
                <input
                  type="email"
                  value={form.email}
                  onChange={(e) => updateField('email', e.target.value)}
                  className="w-full p-2 border rounded text-sm"
                  required
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm text-gray-600 mb-1">Phone</label>
                  <input
                    type="text"
                    value={form.phone}
                    onChange={(e) => updateField('phone', e.target.value)}
                    className="w-full p-2 border rounded text-sm"
                  />
                </div>
                <div>
                  <label className="block text-sm text-gray-600 mb-1">Status</label>
                  <select
                    value={form.status}
                    onChange={(e) => updateField('status', e.target.value)}
                    className="w-full p-2 border rounded text-sm"
                  >
                    <option value="active">Active</option>
                    <option value="inactive">Inactive</option>
                    <option value="lead">Lead</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-sm text-gray-600 mb-1">Notes</label>
                <textarea
                  value={form.notes}
                  onChange={(e) => updateField('notes', e.target.value)}
                  className="w-full p-2 border rounded text-sm"
                  rows={3}
                />
              </div>

              <div className="flex justify-end gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => setModalOpen(false)}
                  className="px-4 py-2 border rounded text-sm text-gray-600 hover:bg-gray-50"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={saving}
                  className="px-4 py-2 bg-blue-600 text-white rounded text-sm hover:bg-blue-700 disabled:opacity-50"
                >
                  {saving ? 'Saving...' : editMember ? 'Update' : 'Create'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

export async function getServerSideProps({ req }) {
  try {
    const backendUrl = process.env.BACKEND_URL || 'http://backend:8080';
    const res = await fetch(`${backendUrl}/api/members?page=0&size=10&sort=lastName`, {
      headers: { Cookie: req.headers.cookie || '' },
    });

    if (!res.ok) {
      return {
        props: {
          initialMembers: null,
          error: 'Please log in to access the dashboard.',
        },
      };
    }

    const initialMembers = await res.json();
    return { props: { initialMembers, error: null } };
  } catch (err) {
    return {
      props: {
        initialMembers: null,
        error: 'Cannot connect to backend. Is it running?',
      },
    };
  }
}
