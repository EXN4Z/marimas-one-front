import api from './axios';

export type Role = 'admin' | 'hr' | 'manajer' | 'karyawan';

export type TicketStatus = 'pending' | 'diproses' | 'selesai' | 'ditolak';

export interface Ticket {
  id: number;
  user_id: number;
  judul: string;
  deskripsi: string;
  kategori: string | null;
  status: TicketStatus;
  catatan_admin: string | null;
  ditangani_oleh: number | null;
  selesai_at: string | null;
  created_at: string;
  updated_at: string;
  pelapor?: { id: number; name: string; role: Role };
  penanggung_jawab?: { id: number; name: string } | null;
}

export interface CreateTicketPayload {
  judul: string;
  deskripsi: string;
  kategori?: string;
}

export interface UpdateStatusPayload {
  status: TicketStatus;
  catatan_admin?: string;
}

// GET /ticketing — laporan yang masih pending/diproses.
export async function getTicketsAktif(): Promise<Ticket[]> {
  const res = await api.get<Ticket[]>('/ticketing');
  return res.data;
}

// GET /ticketing/history — laporan yang sudah selesai/ditolak.
export async function getTicketsHistory(): Promise<Ticket[]> {
  const res = await api.get<Ticket[]>('/ticketing/history');
  return res.data;
}

// GET /ticketing/{id} — detail satu laporan.
export async function getTicketDetail(id: number): Promise<Ticket> {
  const res = await api.get<Ticket>(`/ticketing/${id}`);
  return res.data;
}

// POST /ticketing — bikin laporan baru.
export async function createTicket(payload: CreateTicketPayload): Promise<Ticket> {
  const res = await api.post<Ticket>('/ticketing', payload);
  return res.data;
}

// PUT /ticketing/{id}/status — ubah status laporan (manajer/hr/admin).
export async function updateTicketStatus(
  id: number,
  payload: UpdateStatusPayload
): Promise<Ticket> {
  const res = await api.put<Ticket>(`/ticketing/${id}/status`, payload);
  return res.data;
}