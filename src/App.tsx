import { BrowserRouter, Routes, Route } from 'react-router-dom';
import { AuthProvider } from './context/AuthContext';
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
<<<<<<< HEAD
import AiAssistant from './pages/AiAssistant';
=======
>>>>>>> ba78c7acb647a89d11ac381741e493d3bb49f280

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
<<<<<<< HEAD
          <Route path="/ai-assistant" element={<AiAssistant />} />
=======
>>>>>>> ba78c7acb647a89d11ac381741e493d3bb49f280
          <Route path="/" element={<Login />} />
        </Routes>
      </BrowserRouter>
    </AuthProvider>
  );
}

export default App;