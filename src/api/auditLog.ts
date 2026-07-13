import api from './axios';

export interface AuditLog {
  id: number;
  user_id: number | null;
  method: string;
  endpoint: string;
  deskripsi: string;
  ip_address: string | null;
  created_at: string;
  deleted_at: string | null;
  user: { id: number; name: string } | null;
}

export async function getAuditLog(limit = 50): Promise<AuditLog[]> {
  const res = await api.get<AuditLog[]>('/audit-log', { params: { limit } });
  return res.data;
}

export async function getAuditLogTrash(limit = 50): Promise<AuditLog[]> {
  const res = await api.get<AuditLog[]>('/audit-log/trash', { params: { limit } });
  return res.data;
}