import api from './axios';

export interface Departemen {
  id: number;
  nama: string;
}

export async function getDepartemen(): Promise<Departemen[]> {
  const res = await api.get<Departemen[]>('/departemen');
  return res.data;
}