import api from './axios';

export type Role = 'admin' | 'hr' | 'manajer' | 'karyawan';

export interface Karyawan {
  id: number; // pekerja id
  nip: string;
  qr_code: string;
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

export async function getKaryawanAktif(): Promise<Karyawan[]> {
  const res = await api.get<Karyawan[]>('/absensi/karyawan');
  return res.data;
}

export async function getAbsensiHariIni(): Promise<Absensi[]> {
  const res = await api.get<Absensi[]>('/absensi/hari-ini');
  return res.data;
}

export async function getRiwayatAbsensi(limit = 10): Promise<Absensi[]> {
  const res = await api.get<Absensi[]>('/absensi/riwayat', { params: { limit } });
  return res.data;
}

export async function getKaryawanByKode(
  kode: string
): Promise<{ pekerja: Karyawan; absensi_hari_ini: Absensi | null }> {
  const res = await api.get(`/karyawan/kode/${kode}`);
  return res.data;
}

// UBAH: scanAbsen sekarang wajib kirim foto wajah (Blob) + koordinat GPS,
// dikirim sebagai multipart/form-data karena ada file di dalamnya.
export async function scanAbsen(
  qr_code: string,
  photo: Blob,
  latitude: number,
  longitude: number
): Promise<ScanResult> {
  const formData = new FormData();
  formData.append('qr_code', qr_code);
  formData.append('photo', photo, 'absen.jpg');
  formData.append('latitude', String(latitude));
  formData.append('longitude', String(longitude));

  const res = await api.post<ScanResult>('/absensi/scan', formData, {
    headers: { 'Content-Type': 'multipart/form-data' },
  });
  return res.data;
}