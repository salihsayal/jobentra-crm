import { useRouter } from 'next/router';

export default function Dashboard({ customers, error }) {
  const router = useRouter();

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
        <div className="max-w-5xl mx-auto px-6 py-4 flex justify-between items-center">
          <h1 className="text-xl font-bold">Jobentra CRM</h1>
          <span className="text-sm text-gray-500">Dashboard</span>
        </div>
      </header>

      <main className="max-w-5xl mx-auto px-6 py-8">
        <h2 className="text-2xl font-semibold mb-6">Customers</h2>

        <div className="bg-white rounded shadow overflow-hidden">
          <table className="w-full">
            <thead>
              <tr className="bg-gray-50 border-b">
                <th className="p-3 text-left text-sm font-medium text-gray-600">Name</th>
                <th className="p-3 text-left text-sm font-medium text-gray-600">Email</th>
                <th className="p-3 text-left text-sm font-medium text-gray-600">Company</th>
                <th className="p-3 text-left text-sm font-medium text-gray-600">Phone</th>
              </tr>
            </thead>
            <tbody>
              {customers.map((customer) => (
                <tr key={customer.id} className="border-b hover:bg-gray-50">
                  <td className="p-3 text-sm">{customer.name}</td>
                  <td className="p-3 text-sm">{customer.email}</td>
                  <td className="p-3 text-sm">{customer.company}</td>
                  <td className="p-3 text-sm text-gray-500">{customer.phone}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </main>
    </div>
  );
}

export async function getServerSideProps({ req }) {
  try {
    const backendUrl = process.env.BACKEND_URL || 'http://backend:8080';
    const res = await fetch(`${backendUrl}/api/customers`, {
      headers: {
        Cookie: req.headers.cookie || '',
      },
    });

    if (!res.ok) {
      return {
        props: {
          customers: [],
          error: 'Please log in to access the dashboard.',
        },
      };
    }

    const customers = await res.json();
    return { props: { customers, error: null } };
  } catch (err) {
    return {
      props: {
        customers: [],
        error: 'Cannot connect to backend. Is it running?',
      },
    };
  }
}
