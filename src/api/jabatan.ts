import api from './axios';

export interface Jabatan {
  id: number;
  nama: string;
}

export async function getJabatan(): Promise<Jabatan[]> {
  const res = await api.get<Jabatan[]>('/jabatan');
  return res.data;
}