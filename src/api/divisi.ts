import api from './axios';

export interface Divisi {
  id: number;
  nama: string;
}

export async function getDivisi(): Promise<Divisi[]> {
  const res = await api.get<Divisi[]>('/divisi');
  return res.data;
}