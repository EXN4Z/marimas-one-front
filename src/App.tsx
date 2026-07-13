import { BrowserRouter, Routes, Route } from 'react-router-dom';
import { AuthProvider } from './context/AuthContext';
import { ChatProvider } from './context/ChatContext';
import AdminRoute from './components/AdminRoute';
import Login from './pages/Login';
import Register from './pages/Register';
import VerifyOtp from './pages/VerifyOtp';
import Dashboard from './pages/Dashboard';
import Inventaris from './pages/Inventaris';
import Karyawan from './pages/Karyawan';
import KaryawanEdit from './pages/KaryawanEdit';
import KaryawanCreate from './pages/KaryawanCreate';
import Absensi from './pages/Absensi';
import PengajuanCuti from './pages/PengajuanCuti';
import CutiForm from './pages/CutiPageForm';
import AiAssistant from './pages/AiAssistant';

function App() {
  return (
    <AuthProvider>
      <BrowserRouter>
        <Routes>
          <Route path="/login" element={<Login />} />
          <Route path="/register" element={<Register />} />
          <Route path="/verify-otp" element={<VerifyOtp />} />
          <Route path="/dashboard" element={<Dashboard />} />
          <Route path="/inventaris" element={<Inventaris />} />
          <Route path="/karyawan" element={<Karyawan />} />
          <Route path="/cuti" element={<PengajuanCuti />} />
          <Route path="/cuti/create" element={<CutiForm />} />
          <Route
            path="/karyawan/:id/edit"
            element={
              <AdminRoute>
                <KaryawanEdit />
              </AdminRoute>
            }
          />
          <Route
            path="/karyawan/create"
            element={
              <AdminRoute>
                <KaryawanCreate />
              </AdminRoute>
            }
          />
          <Route path="/absensi" element={<Absensi />} />
          <Route path="/" element={<Login />} />
        </Routes>
      </BrowserRouter>
      <ChatProvider>
        <BrowserRouter>
          <Routes>
            <Route path="/login" element={<Login />} />
            <Route path="/register" element={<Register />} />
            <Route path="/verify-otp" element={<VerifyOtp />} />
            <Route path="/dashboard" element={<Dashboard />} />
            <Route path="/inventaris" element={<Inventaris />} />
            <Route path="/karyawan" element={<Karyawan />} />
            <Route
              path="/karyawan/:id/edit"
              element={
                <AdminRoute>
                  <KaryawanEdit />
                </AdminRoute>
              }
            />
            <Route
              path="/karyawan/create"
              element={
                <AdminRoute>
                  <KaryawanCreate />
                  <AuditLog />
                </AdminRoute>
              }
            />
            <Route path="/absensi" element={<Absensi />} />
            <Route path="/ticketing" element={<Ticketing />} />
            <Route path="/ai-assistant" element={<AiAssistant />} />
            <Route path="/audit-log" element={<AuditLog />} />
            <Route path="/" element={<Login />} />
          </Routes>
        </BrowserRouter>
      </ChatProvider>
    </AuthProvider>
  );
}

export default App;