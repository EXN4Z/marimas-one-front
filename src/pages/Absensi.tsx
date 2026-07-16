import { useAuth } from '../context/AuthContext';
import AbsensiAdmin from './AbsensiPage';
import AbsensiSaya from './AbsensiSayaPage';

// Saklar: Admin dapet halaman monitoring penuh (bisa absenkan siapa aja),
// role lain (hr/manajer/karyawan) cuma dapet halaman self-service (absen diri sendiri).
export default function Absensi() {
  const { user } = useAuth();
  console.log('DEBUG role:', user?.role, user); // BARU sementara

  if (user?.role === 'admin') {
    return <AbsensiAdmin />;
  }

  return <AbsensiSaya />;
}