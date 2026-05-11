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

    const text = await backendResponse.text();
    if (backendResponse.status === 204) {
      return res.status(204).end();
    }
    res.status(backendResponse.status).json(JSON.parse(text));
  } catch (err) {
    res.status(502).json({ error: 'Backend unreachable' });
  }
}
