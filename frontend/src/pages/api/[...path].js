export default async function handler(req, res) {
  const backendUrl = process.env.BACKEND_URL || 'http://backend:8080';
  const path = req.query.path.join('/');

  const searchParams = new URLSearchParams();
  for (const [key, value] of Object.entries(req.query)) {
    if (key !== 'path') searchParams.append(key, value);
  }
  const qs = searchParams.toString();
  const url = `${backendUrl}/api/${path}${qs ? '?' + qs : ''}`;

  try {
    const fetchOptions = {
      method: req.method,
      headers: {
        'Content-Type': 'application/json',
      },
    };

    if (req.headers.cookie) {
      fetchOptions.headers['Cookie'] = req.headers.cookie;
    }

    if (req.method !== 'GET' && req.method !== 'DELETE' && req.body) {
      fetchOptions.body = JSON.stringify(req.body);
    }

    const backendResponse = await fetch(url, fetchOptions);
    const setCookie = backendResponse.headers.get('set-cookie');

    if (setCookie) {
      res.setHeader('Set-Cookie', setCookie);
    }

    const contentType = backendResponse.headers.get('content-type');

    if (contentType && contentType.includes('text/csv')) {
      res.setHeader('Content-Type', contentType);
      res.setHeader('Content-Disposition', backendResponse.headers.get('content-disposition'));
      const text = await backendResponse.text();
      return res.status(backendResponse.status).send(text);
    }

    const text = await backendResponse.text();
    if (backendResponse.status === 204) {
      return res.status(204).end();
    }
    if (!text) {
      console.error('Empty backend response for', url, 'status:', backendResponse.status);
      return res.status(backendResponse.status || 502).end();
    }
    try {
      const data = JSON.parse(text);
      res.status(backendResponse.status).json(data);
    } catch {
      res.status(502).json({ error: 'Invalid response from backend' });
    }
  } catch (err) {
    console.error('API proxy error:', url, err.message || err);
    res.status(502).json({ error: 'Backend unreachable' });
  }
}
