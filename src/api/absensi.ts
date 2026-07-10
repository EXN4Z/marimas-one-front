import api from './axios';

export type Role = 'admin' | 'hr' | 'manajer' | 'karyawan';
export type StatusKaryawan = 'aktif' | 'nonaktif';
export type StatusAbsensi = 'tepat_waktu' | 'terlambat';

export interface Karyawan {
  id: number;
  name: string;
  email: string;
  kode_karyawan: string;
  role: Role;
  status: StatusKaryawan;
}

export interface Absensi {
  id: number;
  karyawan: Karyawan;
  tanggal: string; // '2026-07-10'
  jam_masuk: string | null; // ISO datetime
  jam_pulang: string | null; // ISO datetime
  status: StatusAbsensi;
}

export interface ScanAbsensiResult {
  karyawan: Karyawan;
  absensi: Absensi;
}

// Daftar karyawan aktif (dipakai buat tau siapa aja yang harus absen hari ini)
export async function getKaryawanAktif(): Promise<Karyawan[]> {
  const res = await api.get<Karyawan[]>('/karyawan', { params: { status: 'aktif' } });
  return res.data;
}

// Semua record absensi untuk tanggal hari ini
export async function getAbsensiHariIni(): Promise<Absensi[]> {
  const res = await api.get<Absensi[]>('/absensi/hari-ini');
  return res.data;
}

// Riwayat absensi terbaru (lintas tanggal), buat panel "Riwayat Absensi"
export async function getRiwayatAbsensi(limit = 10): Promise<Absensi[]> {
  const res = await api.get<Absensi[]>('/absensi/riwayat', { params: { limit } });
  return res.data;
}

// Cari karyawan dari kode unik hasil scan QR
export async function getKaryawanByKode(kode: string): Promise<Karyawan> {
  const res = await api.get<Karyawan>(`/karyawan/kode/${kode}`);
  return res.data;
}

export async function scanAbsenMasuk(karyawanId: number): Promise<ScanAbsensiResult> {
  const res = await api.post<ScanAbsensiResult>('/absensi/masuk', { karyawan_id: karyawanId });
  return res.data;
}

export async function scanAbsenPulang(karyawanId: number): Promise<ScanAbsensiResult> {
  const res = await api.post<ScanAbsensiResult>('/absensi/pulang', { karyawan_id: karyawanId });
  return res.data;
}