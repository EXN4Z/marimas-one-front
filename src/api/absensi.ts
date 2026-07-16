import api from './axios';

export type Role = 'admin' | 'hr' | 'manajer' | 'karyawan';

export interface Karyawan {
  id: number; // pekerja id
  nip: string;
  face_descriptor: number[] | null;
  user: {
    id: number;
    name: string;
    role: Role;
  };
  departemen: { nama: string } | null;
  jabatan: { nama: string } | null;
}

export interface Absensi {
  id: number;
  karyawan_id: number; // pekerja id
  tanggal: string;
  jam_masuk: string | null;
  jam_pulang: string | null;
  status: 'tepat_waktu' | 'telat' | null;
  status_pulang: 'pulang_cepat' | 'pulang_normal' | null;
  pekerja?: Karyawan;
}

interface ScanResult {
  tipe: 'masuk' | 'pulang' | 'sudah_lengkap';
  pekerja: Karyawan;
  absensi: Absensi;
  message: string;
}

// ADMIN ONLY: daftar semua karyawan (dipakai AbsensiPage.tsx admin)
export async function getKaryawanAktif(): Promise<Karyawan[]> {
  const res = await api.get<Karyawan[]>('/absensi/karyawan');
  return res.data;
}

// ADMIN ONLY: absensi semua orang hari ini
export async function getAbsensiHariIni(): Promise<Absensi[]> {
  const res = await api.get<Absensi[]>('/absensi/hari-ini');
  return res.data;
}

// ADMIN ONLY: riwayat absensi semua orang
export async function getRiwayatAbsensi(limit = 10): Promise<Absensi[]> {
  const res = await api.get<Absensi[]>('/absensi/riwayat', { params: { limit } });
  return res.data;
}

// SELF-SERVICE: data absensi milik akun yang sedang login (dipakai AbsensiSayaPage.tsx)
export async function getAbsensiSaya(): Promise<{ pekerja: Karyawan; absensi_hari_ini: Absensi | null }> {
  const res = await api.get('/absensi/saya');
  return res.data;
}

// UBAH: qr_code DIHAPUS. karyawanId opsional, cuma dipakai kalau requester Admin (override absen orang lain).
// Kalau bukan admin, backend otomatis pakai akun yang sedang login, parameter ini diabaikan.
export async function scanAbsen(
  photo: Blob,
  latitude: number,
  longitude: number,
  faceVerified: boolean,
  faceMatchDistance: number,
  karyawanId?: number
): Promise<ScanResult> {
  const formData = new FormData();
  formData.append('photo', photo, 'absen.jpg');
  formData.append('latitude', String(latitude));
  formData.append('longitude', String(longitude));
  formData.append('face_verified', String(faceVerified ? '1' : '0'));
  formData.append('face_match_distance', String(faceMatchDistance));
  if (karyawanId) formData.append('karyawan_id', String(karyawanId));

  const res = await api.post<ScanResult>('/absensi/scan', formData, {
    headers: { 'Content-Type': 'multipart/form-data' },
  });
  return res.data;
}

// UBAH: kode/qr_code dihapus. karyawanId opsional (admin override), default self.
export async function daftarWajah(descriptor: number[], karyawanId?: number): Promise<Karyawan> {
  const res = await api.post('/absensi/daftar-wajah', {
    descriptor,
    ...(karyawanId ? { karyawan_id: karyawanId } : {}),
  });
  return res.data.pekerja;
}