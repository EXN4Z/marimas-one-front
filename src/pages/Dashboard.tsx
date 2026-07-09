import { useAuth } from '../context/AuthContext';
import ChatWidget from '../components/ChatWidget';

export default function Dashboard() {
  const { user, logout } = useAuth();

  return (
    <div className="min-h-screen bg-slate-50 p-10">
      <h2 className="text-2xl font-bold text-slate-900">Dashboard</h2>
      <p className="text-slate-600 mt-2">
        Halo, {user?.name} ({user?.role})
      </p>
      <button
        onClick={logout}
        className="mt-4 bg-slate-900 text-white text-sm px-4 py-2 rounded-lg hover:bg-slate-800"
      >
        Logout
      </button>

      <ChatWidget />
    </div>
  );
}
