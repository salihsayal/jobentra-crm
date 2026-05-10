export default async function handler(req, res) {
  const backendUrl = process.env.BACKEND_URL || 'http://backend:8080';
  const path = req.query.path.join('/');
  const url = `${backendUrl}/api/${path}`;

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

    if (req.method !== 'GET' && req.body) {
      fetchOptions.body = JSON.stringify(req.body);
    }

    const backendResponse = await fetch(url, fetchOptions);
    const setCookie = backendResponse.headers.get('set-cookie');

    if (setCookie) {
      res.setHeader('Set-Cookie', setCookie);
    }

    const data = await backendResponse.json();
    res.status(backendResponse.status).json(data);
  } catch (err) {
    res.status(502).json({ error: 'Backend unreachable' });
  }
}
