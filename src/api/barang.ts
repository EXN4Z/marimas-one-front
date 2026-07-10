import api from './axios';

export interface Barang {
  id: number;
  kode_barang: string;
  nama: string;
  kategori: string | null;
  satuan: string;
  stok: number;
  stok_minimum: number;
}

export interface Mutasi {
  id: number;
  barang_id: number;
  tipe: 'masuk' | 'keluar';
  jumlah: number;
  stok_sebelum: number;
  stok_sesudah: number;
  catatan: string | null;
  created_at: string;
  barang?: { id: number; nama: string; satuan: string };
  user?: { id: number; name: string };
}

export const getBarang = async (): Promise<Barang[]> => {
  const res = await api.get('/barang');
  return res.data;
};

export const getBarangById = async (id: number): Promise<Barang> => {
  const res = await api.get(`/barang/${id}`);
  return res.data;
};

export const createBarang = async (payload: {
  kode_barang: string;
  nama: string;
  kategori?: string;
  satuan?: string;
  stok?: number;
  stok_minimum?: number;
}): Promise<Barang> => {
  const res = await api.post('/barang', payload);
  return res.data;
};

export const scanMasuk = async (
  id: number,
  jumlah: number,
  catatan?: string
): Promise<{ message: string; barang: Barang; mutasi: Mutasi }> => {
  const res = await api.post(`/barang/${id}/scan-masuk`, { jumlah, catatan });
  return res.data;
};

export const scanKeluar = async (
  id: number,
  jumlah: number,
  catatan?: string
): Promise<{ message: string; barang: Barang; mutasi: Mutasi }> => {
  const res = await api.post(`/barang/${id}/scan-keluar`, { jumlah, catatan });
  return res.data;
};

export const getRiwayatBarang = async (id: number): Promise<Mutasi[]> => {
  const res = await api.get(`/barang/${id}/riwayat`);
  return res.data;
};

export const getRiwayatSemua = async (limit = 10): Promise<Mutasi[]> => {
  const res = await api.get(`/mutasi-barang?limit=${limit}`);
  return res.data;
};