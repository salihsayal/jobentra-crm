const BASE = '/api';

async function request(path, options = {}) {
  const res = await fetch(`${BASE}${path}`, {
    credentials: 'include',
    headers: { 'Content-Type': 'application/json', ...options.headers },
    ...options,
  });
  if (res.status === 204) return null;
  const text = await res.text();
  if (!text) return null;
  const data = JSON.parse(text);
  if (!res.ok) throw new Error(data.error || `Failed: ${res.status}`);
  return data;
}

function withParams(path, params) {
  const q = new URLSearchParams();
  Object.entries(params || {}).forEach(([k, v]) => { if (v != null && v !== '') q.set(k, v); });
  const qs = q.toString();
  return qs ? `${path}?${qs}` : path;
}

export const api = {
  customers: {
    list(p) { return request(withParams('/customers', p)); },
    create(b) { return request('/customers', { method: 'POST', body: JSON.stringify(b) }); },
    update(id, b) { return request(`/customers/${id}`, { method: 'PUT', body: JSON.stringify(b) }); },
    delete(id) { return request(`/customers/${id}`, { method: 'DELETE' }); },
    archive(id) { return request(`/customers/${id}/archive`, { method: 'PATCH' }); },
    unarchive(id) { return request(`/customers/${id}/unarchive`, { method: 'PATCH' }); },
  },
  candidates: {
    list(p) { return request(withParams('/candidates', p)); },
    create(b) { return request('/candidates', { method: 'POST', body: JSON.stringify(b) }); },
    update(id, b) { return request(`/candidates/${id}`, { method: 'PUT', body: JSON.stringify(b) }); },
    delete(id) { return request(`/candidates/${id}`, { method: 'DELETE' }); },
    archive(id) { return request(`/candidates/${id}/archive`, { method: 'PATCH' }); },
    unarchive(id) { return request(`/candidates/${id}/unarchive`, { method: 'PATCH' }); },
    documents: {
      list(candidateId) { return request(`/candidates/${candidateId}/documents`); },
      upload(candidateId, file, category) {
        const formData = new FormData();
        formData.append('file', file);
        formData.append('category', category || 'OTHER');
        return fetch(`${BASE}/upload?candidateId=${candidateId}`, {
          method: 'POST',
          credentials: 'include',
          body: formData,
        }).then(async (res) => {
          if (res.status === 204) return null;
          const data = await res.json();
          if (!res.ok) throw new Error(data.error || `Failed: ${res.status}`);
          return data;
        });
      },
      downloadUrl(candidateId, docId) {
        return `${BASE}/candidates/${candidateId}/documents/${docId}`;
      },
      delete(candidateId, docId) {
        return request(`/candidates/${candidateId}/documents/${docId}`, { method: 'DELETE' });
      },
    },
    timeline: {
      list(candidateId) { return request(`/candidates/${candidateId}/timeline`); },
      create(candidateId, b) { return request(`/candidates/${candidateId}/timeline`, { method: 'POST', body: JSON.stringify(b) }); },
    },
  },
  jobs: {
    list(p) { return request(withParams('/jobs', p)); },
    create(b) { return request('/jobs', { method: 'POST', body: JSON.stringify(b) }); },
    update(id, b) { return request(`/jobs/${id}`, { method: 'PUT', body: JSON.stringify(b) }); },
    delete(id) { return request(`/jobs/${id}`, { method: 'DELETE' }); },
    archive(id) { return request(`/jobs/${id}/archive`, { method: 'PATCH' }); },
    unarchive(id) { return request(`/jobs/${id}/unarchive`, { method: 'PATCH' }); },
  },
  billings: {
    list(p) { return request(withParams('/billings', p)); },
    create(b) { return request('/billings', { method: 'POST', body: JSON.stringify(b) }); },
    update(id, b) { return request(`/billings/${id}`, { method: 'PUT', body: JSON.stringify(b) }); },
    delete(id) { return request(`/billings/${id}`, { method: 'DELETE' }); },
    archive(id) { return request(`/billings/${id}/archive`, { method: 'PATCH' }); },
    unarchive(id) { return request(`/billings/${id}/unarchive`, { method: 'PATCH' }); },
  },
};
