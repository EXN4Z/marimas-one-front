import { useAuth } from '../context/AuthContext';

export default function Dashboard() {
  const { user, logout } = useAuth();

  return (
    <div style={{ padding: 40 }}>
      <h2>Dashboard</h2>
      <p>Halo, {user?.name} ({user?.role})</p>
      <button onClick={logout}>Logout</button>
    </div>
  );
}