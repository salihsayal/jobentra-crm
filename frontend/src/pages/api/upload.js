export default async function handler(req, res) {
  const backendUrl = process.env.BACKEND_URL || 'http://backend:8080';
  const candidateId = req.query.candidateId;

  if (req.method !== 'POST') {
    res.status(405).json({ error: 'Method not allowed' });
    return;
  }

  try {
    const chunks = [];
    for await (const chunk of req) {
      chunks.push(typeof chunk === 'string' ? Buffer.from(chunk) : chunk);
    }
    const rawBody = Buffer.concat(chunks);

    const fetchOptions = {
      method: 'POST',
      headers: {},
      body: rawBody,
    };

    fetchOptions.headers['Content-Type'] = req.headers['content-type'];

    if (req.headers.cookie) {
      fetchOptions.headers['Cookie'] = req.headers.cookie;
    }

    const backendResponse = await fetch(
      `${backendUrl}/api/candidates/${candidateId}/documents`,
      fetchOptions
    );

    const setCookie = backendResponse.headers.get('set-cookie');
    if (setCookie) {
      res.setHeader('Set-Cookie', setCookie);
    }

    const text = await backendResponse.text();
    if (backendResponse.status === 204) {
      res.status(204).end();
      return;
    }
    if (!text) {
      res.status(backendResponse.status || 502).end();
      return;
    }
    try {
      const data = JSON.parse(text);
      res.status(backendResponse.status).json(data);
    } catch {
      res.status(502).json({ error: 'Invalid response from backend' });
    }
  } catch (err) {
    console.error('Upload proxy error:', err.message || err);
    res.status(502).json({ error: 'Backend unreachable' });
  }
}

export const config = {
  api: {
    bodyParser: false,
    responseLimit: '12mb',
  },
};
