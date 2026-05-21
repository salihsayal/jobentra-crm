import { useRouter } from 'next/router';
import { useState, useRef, useCallback, useEffect } from 'react';

const STATUS_COLORS = {
  ACTIVE: 'bg-green-100 text-green-800',
  INACTIVE: 'bg-gray-100 text-gray-600',
  LEAD: 'bg-blue-100 text-blue-800',
};

export default function Dashboard({ initialCustomers, stats: initialStats, error }) {
  const router = useRouter();
  const [customers, setCustomers] = useState(initialCustomers?.content || []);
  const [page, setPage] = useState(initialCustomers?.number || 0);
  const [totalPages, setTotalPages] = useState(initialCustomers?.totalPages || 0);
  const [modalOpen, setModalOpen] = useState(false);
  const [editCustomer, setEditCustomer] = useState(null);
  const [form, setForm] = useState({
    companyName: '', contactPerson: '', email: '', phone: '', industry: '', status: 'LEAD',
  });
  const [formError, setFormError] = useState('');
  const [saving, setSaving] = useState(false);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [industryFilter, setIndustryFilter] = useState('');
  const [stats, setStats] = useState(initialStats);
  const [recentCandidates, setRecentCandidates] = useState([]);
  const debounceRef = useRef(null);

  useEffect(() => {
    async function loadExtras() {
      try {
        const [candRes] = await Promise.all([
          fetch('/api/candidates?sort=createdAt,desc&size=5', { credentials: 'include' }),
        ]);
        const recentCands = candRes.ok ? await candRes.json() : {};
        setRecentCandidates(recentCands.content || []);
      } catch (e) { /* continue without extras */ }
    }
    loadExtras();
  }, []);

  const buildUrl = useCallback((pageNum, s, st, ind) => {
    const params = new URLSearchParams();
    params.set('page', pageNum);
    params.set('size', '10');
    params.set('sort', 'companyName');
    if (s) params.set('search', s);
    if (st) params.set('status', st);
    if (ind) params.set('industry', ind);
    return '/api/customers?' + params.toString();
  }, []);

  async function fetchPage(pageNum, s = search, st = statusFilter, ind = industryFilter) {
    const url = buildUrl(pageNum, s, st, ind);
    const res = await fetch(url, { credentials: 'include' });
    if (res.ok) {
      const data = await res.json();
      setCustomers(data.content);
      setPage(data.number);
      setTotalPages(data.totalPages);
    }
  }

  function handleSearchChange(value) {
    setSearch(value);
    clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(() => {
      fetchPage(0, value, statusFilter, industryFilter);
    }, 300);
  }

  function handleStatusChange(value) {
    setStatusFilter(value);
    fetchPage(0, search, value, industryFilter);
  }

  function handleIndustryChange(value) {
    setIndustryFilter(value);
    fetchPage(0, search, statusFilter, value);
  }

  function openCreate() {
    setEditCustomer(null);
    setForm({ companyName: '', contactPerson: '', email: '', phone: '', industry: '', status: 'LEAD' });
    setFormError('');
    setModalOpen(true);
  }

  function openEdit(customer) {
    setEditCustomer(customer);
    setForm({
      companyName: customer.companyName,
      contactPerson: customer.contactPerson || '',
      email: customer.email,
      phone: customer.phone || '',
      industry: customer.industry || '',
      status: customer.status,
    });
    setFormError('');
    setModalOpen(true);
  }

  async function handleSubmit(e) {
    e.preventDefault();
    setFormError('');
    setSaving(true);

    const url = editCustomer ? `/api/customers/${editCustomer.id}` : '/api/customers';
    const method = editCustomer ? 'PUT' : 'POST';
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
    if (!confirm('Delete this customer?')) return;
    const res = await fetch(`/api/customers/${id}`, {
      method: 'DELETE',
      credentials: 'include',
    });
    if (res.ok) {
      fetchPage(page);
    } else {
      alert('Cannot delete: customer may still have linked jobs or invoices.');
    }
  }

  function updateField(field, value) {
    setForm((prev) => ({ ...prev, [field]: value }));
  }

  const industries = [...new Set(customers.map(c => c.industry).filter(Boolean))];

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
          <span className="text-sm text-gray-500">Customer Management</span>
        </div>
      </header>

      <main className="max-w-6xl mx-auto px-6 py-8">
        {stats && (
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
            <div className="bg-white rounded shadow p-4">
              <p className="text-xs text-gray-500 uppercase">Total Customers</p>
              <p className="text-2xl font-bold text-gray-800">{stats.totalCustomers}</p>
            </div>
            <div className="bg-white rounded shadow p-4">
              <p className="text-xs text-gray-500 uppercase">Total Candidates</p>
              <p className="text-2xl font-bold text-green-600">{stats.totalCandidates}</p>
            </div>
            <div className="bg-white rounded shadow p-4">
              <p className="text-xs text-gray-500 uppercase">Open Jobs</p>
              <p className="text-2xl font-bold text-blue-600">{stats.openJobs}</p>
            </div>
            <div className="bg-white rounded shadow p-4">
              <p className="text-xs text-gray-500 uppercase">Total Invoices</p>
              <p className="text-2xl font-bold text-purple-600">{stats.totalBillings}</p>
            </div>
          </div>
        )}

        {recentCandidates.length > 0 && (
          <div className="bg-white rounded shadow p-4 mb-8">
            <p className="text-xs text-gray-500 uppercase mb-3">Recent Candidates</p>
            <div className="space-y-2">
              {recentCandidates.map((c) => (
                <div key={c.id} className="flex items-center justify-between text-sm">
                  <div>
                    <span className="font-medium">
                      {c.firstName} {c.lastName}
                    </span>
                    <span className="text-gray-400 ml-2">{c.email}</span>
                  </div>
                  <span className="text-xs px-2 py-0.5 rounded-full font-medium bg-gray-100 text-gray-600">
                    {c.status}
                  </span>
                </div>
              ))}
            </div>
          </div>
        )}

        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-6">
          <h2 className="text-2xl font-semibold">Customers</h2>
          <div className="flex gap-3 w-full sm:w-auto flex-wrap">
            <input
              type="text"
              placeholder="Search company or email..."
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
              <option value="ACTIVE">Active</option>
              <option value="INACTIVE">Inactive</option>
              <option value="LEAD">Lead</option>
            </select>
            <select
              value={industryFilter}
              onChange={(e) => handleIndustryChange(e.target.value)}
              className="p-2 border rounded text-sm"
            >
              <option value="">All industries</option>
              {industries.map((ind) => (
                <option key={ind} value={ind}>{ind}</option>
              ))}
            </select>
            <button
              onClick={openCreate}
              className="bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700 text-sm font-medium whitespace-nowrap"
            >
              + New Customer
            </button>
          </div>
        </div>

        <div className="bg-white rounded shadow overflow-hidden">
          <table className="w-full">
            <thead>
              <tr className="bg-gray-50 border-b">
                <th className="p-3 text-left text-sm font-medium text-gray-600">Company</th>
                <th className="p-3 text-left text-sm font-medium text-gray-600">Contact</th>
                <th className="p-3 text-left text-sm font-medium text-gray-600">Email</th>
                <th className="p-3 text-left text-sm font-medium text-gray-600">Industry</th>
                <th className="p-3 text-left text-sm font-medium text-gray-600">Status</th>
                <th className="p-3 text-left text-sm font-medium text-gray-600">Actions</th>
              </tr>
            </thead>
            <tbody>
              {customers.length === 0 ? (
                <tr>
                  <td colSpan={6} className="p-6 text-center text-gray-400">
                    {search || statusFilter ? 'No customers match your filters.' : 'No customers found.'}
                  </td>
                </tr>
              ) : (
                customers.map((c) => (
                  <tr key={c.id} className="border-b hover:bg-gray-50">
                    <td className="p-3 text-sm font-medium">{c.companyName}</td>
                    <td className="p-3 text-sm">{c.contactPerson || '-'}</td>
                    <td className="p-3 text-sm">{c.email}</td>
                    <td className="p-3 text-sm text-gray-500">{c.industry || '-'}</td>
                    <td className="p-3">
                      <span className={`text-xs px-2 py-1 rounded-full font-medium ${STATUS_COLORS[c.status] || 'bg-gray-100 text-gray-600'}`}>
                        {c.status}
                      </span>
                    </td>
                    <td className="p-3 text-sm whitespace-nowrap">
                      <button
                        onClick={() => openEdit(c)}
                        className="text-blue-600 hover:text-blue-800 mr-3"
                      >
                        Edit
                      </button>
                      <button
                        onClick={() => handleDelete(c.id)}
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
              {editCustomer ? 'Edit Customer' : 'New Customer'}
            </h3>

            {formError && (
              <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-2 rounded mb-4 text-sm">
                {formError}
              </div>
            )}

            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="block text-sm text-gray-600 mb-1">Company Name</label>
                <input
                  type="text"
                  value={form.companyName}
                  onChange={(e) => updateField('companyName', e.target.value)}
                  className="w-full p-2 border rounded text-sm"
                  required
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm text-gray-600 mb-1">Contact Person</label>
                  <input
                    type="text"
                    value={form.contactPerson}
                    onChange={(e) => updateField('contactPerson', e.target.value)}
                    className="w-full p-2 border rounded text-sm"
                  />
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
                  <label className="block text-sm text-gray-600 mb-1">Industry</label>
                  <input
                    type="text"
                    value={form.industry}
                    onChange={(e) => updateField('industry', e.target.value)}
                    className="w-full p-2 border rounded text-sm"
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm text-gray-600 mb-1">Status</label>
                <select
                  value={form.status}
                  onChange={(e) => updateField('status', e.target.value)}
                  className="w-full p-2 border rounded text-sm"
                >
                  <option value="ACTIVE">Active</option>
                  <option value="INACTIVE">Inactive</option>
                  <option value="LEAD">Lead</option>
                </select>
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
                  {saving ? 'Saving...' : editCustomer ? 'Update' : 'Create'}
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
    const cookieHeader = req.headers.cookie || '';

    const [customersRes, statsRes] = await Promise.all([
      fetch(`${backendUrl}/api/customers?page=0&size=10&sort=companyName`, {
        headers: { Cookie: cookieHeader },
      }),
      fetch(`${backendUrl}/api/stats/overview`, {
        headers: { Cookie: cookieHeader },
      }),
    ]);

    if (!customersRes.ok) {
      return {
        props: {
          initialCustomers: null,
          stats: null,
          error: 'Please log in to access the dashboard.',
        },
      };
    }

    const initialCustomers = await customersRes.json();
    const stats = statsRes.ok ? await statsRes.json() : null;
    return { props: { initialCustomers, stats, error: null } };
  } catch (err) {
    return {
      props: {
        initialCustomers: null,
        stats: null,
        error: 'Cannot connect to backend. Is it running?',
      },
    };
  }
}
