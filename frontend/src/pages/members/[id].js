import { useRouter } from 'next/router';
import { useState } from 'react';

const ACTIVITY_ICONS = {
  CALL: '\u{1F4DE}',
  EMAIL: '\u{2709}\u{FE0F}',
  MEETING: '\u{1F454}',
  NOTE: '\u{1F4DD}',
};

const TYPE_COLORS = {
  CALL: 'border-l-blue-500',
  EMAIL: 'border-l-green-500',
  MEETING: 'border-l-purple-500',
  NOTE: 'border-l-yellow-500',
};

export default function MemberDetail({ member, activities, error }) {
  const router = useRouter();
  const [activityList, setActivityList] = useState(activities || []);
  const [type, setType] = useState('NOTE');
  const [content, setContent] = useState('');
  const [adding, setAdding] = useState(false);
  const [addError, setAddError] = useState('');
  const [generating, setGenerating] = useState(false);
  const [pdfUrl, setPdfUrl] = useState(null);
  const [pdfError, setPdfError] = useState('');

  if (error) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-100">
        <div className="bg-white p-8 rounded shadow-md text-center max-w-md">
          <p className="text-red-600 mb-4">{error}</p>
          <button
            onClick={() => router.push('/dashboard')}
            className="bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700"
          >
            Back to Dashboard
          </button>
        </div>
      </div>
    );
  }

  async function handleGeneratePdf() {
    setPdfError('');
    setPdfUrl(null);
    setGenerating(true);
    const res = await fetch(`/api/members/${member.id}/generate-profile`, {
      method: 'POST',
      credentials: 'include',
    });
    if (res.ok) {
      const data = await res.json();
      setPdfUrl(data.pdf_url);
    } else {
      setPdfError('Failed to generate PDF');
    }
    setGenerating(false);
  }

  async function handleAdd(e) {
    e.preventDefault();
    if (!content.trim()) return;
    setAddError('');
    setAdding(true);

    const res = await fetch(`/api/members/${member.id}/activities`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ type, content }),
      credentials: 'include',
    });

    if (res.ok) {
      const newActivity = await res.json();
      setActivityList([newActivity, ...activityList]);
      setContent('');
    } else {
      const data = await res.json();
      setAddError(data.error || 'Failed to add activity');
    }
    setAdding(false);
  }

  return (
    <div className="min-h-screen bg-gray-100">
      <header className="bg-white shadow-sm">
        <div className="max-w-4xl mx-auto px-6 py-4 flex justify-between items-center">
          <div>
            <h1 className="text-xl font-bold">
              {member.firstName} {member.lastName}
            </h1>
            <span className={`inline-block mt-1 text-xs px-2 py-0.5 rounded-full font-medium ${
              member.status === 'active' ? 'bg-green-100 text-green-800' :
              member.status === 'lead' ? 'bg-blue-100 text-blue-800' :
              'bg-gray-100 text-gray-600'
            }`}>
              {member.status}
            </span>
          </div>
          <button
            onClick={() => router.push('/dashboard')}
            className="text-sm text-blue-600 hover:text-blue-800"
          >
            &larr; Back
          </button>
        </div>
      </header>

      <main className="max-w-4xl mx-auto px-6 py-8">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="md:col-span-1">
            <div className="bg-white rounded shadow p-6">
              <h2 className="text-sm font-medium text-gray-500 uppercase mb-4">Details</h2>
              <div className="space-y-3 text-sm">
                <div>
                  <span className="text-gray-500">Email</span>
                  <p className="text-gray-800">{member.email}</p>
                </div>
                <div>
                  <span className="text-gray-500">Phone</span>
                  <p className="text-gray-800">{member.phone || '-'}</p>
                </div>
                <div>
                  <span className="text-gray-500">Notes</span>
                  <p className="text-gray-800">{member.notes || 'None'}</p>
                </div>
              </div>

              <div className="mt-6 pt-4 border-t">
                <button
                  onClick={handleGeneratePdf}
                  disabled={generating}
                  className="w-full px-4 py-2 bg-purple-600 text-white rounded text-sm hover:bg-purple-700 disabled:opacity-50"
                >
                  {generating ? 'Generating...' : 'Generate Profile PDF'}
                </button>
                {pdfError && (
                  <p className="text-red-600 text-xs mt-2">{pdfError}</p>
                )}
                {pdfUrl && (
                  <a
                    href={pdfUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="block text-blue-600 text-xs mt-2 hover:underline break-all"
                  >
                    Open generated PDF &rarr;
                  </a>
                )}
              </div>
            </div>
          </div>

          <div className="md:col-span-2">
            <div className="bg-white rounded shadow p-6">
              <h2 className="text-sm font-medium text-gray-500 uppercase mb-4">
                Activity Timeline
              </h2>

              <form onSubmit={handleAdd} className="mb-6 p-4 bg-gray-50 rounded border">
                {addError && (
                  <div className="bg-red-100 border border-red-400 text-red-700 px-3 py-2 rounded mb-3 text-sm">
                    {addError}
                  </div>
                )}
                <div className="flex gap-3 mb-3">
                  <select
                    value={type}
                    onChange={(e) => setType(e.target.value)}
                    className="p-2 border rounded text-sm"
                  >
                    <option value="NOTE">Note</option>
                    <option value="CALL">Call</option>
                    <option value="EMAIL">Email</option>
                    <option value="MEETING">Meeting</option>
                  </select>
                  <button
                    type="submit"
                    disabled={adding || !content.trim()}
                    className="px-4 py-2 bg-blue-600 text-white rounded text-sm hover:bg-blue-700 disabled:opacity-50"
                  >
                    {adding ? 'Adding...' : 'Add'}
                  </button>
                </div>
                <textarea
                  value={content}
                  onChange={(e) => setContent(e.target.value)}
                  placeholder="What happened?"
                  className="w-full p-2 border rounded text-sm"
                  rows={2}
                />
              </form>

              {activityList.length === 0 ? (
                <p className="text-center text-gray-400 py-6 text-sm">
                  No activities yet. Add one above.
                </p>
              ) : (
                <div className="space-y-0">
                  {activityList.map((a) => (
                    <div
                      key={a.id}
                      className={`border-l-4 ${TYPE_COLORS[a.type] || 'border-l-gray-300'} pl-4 py-3 border-b`}
                    >
                      <div className="flex items-center gap-2 mb-1">
                        <span className="text-sm">{ACTIVITY_ICONS[a.type] || '\u{1F4CC}'}</span>
                        <span className="text-xs font-medium uppercase text-gray-500">{a.type}</span>
                        <span className="text-xs text-gray-400">
                          {new Date(a.createdAt).toLocaleString()}
                        </span>
                      </div>
                      <p className="text-sm text-gray-700">{a.content}</p>
                      <p className="text-xs text-gray-400 mt-1">
                        by {a.createdBy}
                      </p>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}

export async function getServerSideProps({ req, params }) {
  try {
    const backendUrl = process.env.BACKEND_URL || 'http://backend:8080';
    const cookieHeader = req.headers.cookie || '';

    const [memberRes, activityRes] = await Promise.all([
      fetch(`${backendUrl}/api/members/${params.id}`, {
        headers: { Cookie: cookieHeader },
      }),
      fetch(`${backendUrl}/api/members/${params.id}/activities`, {
        headers: { Cookie: cookieHeader },
      }),
    ]);

    if (!memberRes.ok) {
      return {
        props: {
          member: null,
          activities: [],
          error: 'Member not found or access denied.',
        },
      };
    }

    const member = await memberRes.json();
    const activities = activityRes.ok ? await activityRes.json() : [];
    return { props: { member, activities, error: null } };
  } catch (err) {
    return {
      props: {
        member: null,
        activities: [],
        error: 'Cannot connect to backend.',
      },
    };
  }
}
