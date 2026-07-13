import { useEffect, useState } from 'react';
import { ScrollText, Trash2, ArrowDownCircle, ArrowUpCircle, RefreshCw } from 'lucide-react';
import AppLayout from '../components/AppLayout';
import { getAuditLog, getAuditLogTrash, type AuditLog } from '../api/auditLog';

type TabKey = 'aktif' | 'trash';

const methodColors: Record<string, string> = {
  GET: 'bg-slate-100 text-slate-600',
  POST: 'bg-emerald-50 text-emerald-600',
  PUT: 'bg-amber-50 text-amber-600',
  PATCH: 'bg-amber-50 text-amber-600',
  DELETE: 'bg-red-50 text-red-600',
};

function formatWaktu(iso: string): string {
  const date = new Date(iso);
  return date.toLocaleString('id-ID', {
    day: 'numeric',
    month: 'short',
    hour: '2-digit',
    minute: '2-digit',
  });
}

export default function AuditLogPage() {
  const [activeTab, setActiveTab] = useState<TabKey>('aktif');
  const [logs, setLogs] = useState<AuditLog[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const loadData = async (tab: TabKey) => {
    setLoading(true);
    setError('');
    try {
      const data = tab === 'aktif' ? await getAuditLog(100) : await getAuditLogTrash(100);
      setLogs(data);
    } catch (err: any) {
      if (err.response?.status === 403) {
        setError('Anda tidak punya akses ke halaman ini.');
      } else {
        setError('Gagal memuat data audit log.');
      }
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData(activeTab);
  }, [activeTab]);

  return (
    <AppLayout title="Audit Log">
      <div className="flex items-center justify-between mb-2">
        <p className="text-sm text-slate-500">
          Riwayat aktivitas pengguna sistem. Log otomatis pindah ke trash setelah 24 jam, dan
          terhapus permanen setelah 7 hari di trash.
        </p>
        <button
          onClick={() => loadData(activeTab)}
          className="flex items-center gap-2 bg-slate-100 text-slate-600 text-sm font-medium px-3 py-2 rounded-lg hover:bg-slate-200 transition"
        >
          <RefreshCw size={14} />
          Refresh
        </button>
      </div>

      <nav className="mb-6 mt-4">
        <ul className="flex items-center gap-6 border-b border-slate-200">
          <li>
            <button
              onClick={() => setActiveTab('aktif')}
              className={`flex items-center gap-2 pb-3 text-sm whitespace-nowrap border-b-2 -mb-px transition-colors ${
                activeTab === 'aktif'
                  ? 'border-slate-900 text-slate-900 font-medium'
                  : 'border-transparent text-slate-500 hover:text-slate-700'
              }`}
            >
              <ScrollText size={16} />
              Log Aktif
            </button>
          </li>
          <li>
            <button
              onClick={() => setActiveTab('trash')}
              className={`flex items-center gap-2 pb-3 text-sm whitespace-nowrap border-b-2 -mb-px transition-colors ${
                activeTab === 'trash'
                  ? 'border-slate-900 text-slate-900 font-medium'
                  : 'border-transparent text-slate-500 hover:text-slate-700'
              }`}
            >
              <Trash2 size={16} />
              Trash
            </button>
          </li>
        </ul>
      </nav>

      <div className="bg-white rounded-xl p-6 shadow-sm border border-slate-200">
        {loading && <p className="text-sm text-slate-400 text-center py-8">Memuat data...</p>}

        {!loading && error && <p className="text-sm text-red-500 text-center py-8">{error}</p>}

        {!loading && !error && logs.length === 0 && (
          <p className="text-sm text-slate-400 text-center py-8">
            {activeTab === 'aktif' ? 'Belum ada aktivitas.' : 'Trash kosong.'}
          </p>
        )}

        {!loading && !error && logs.length > 0 && (
          <div className="flex flex-col gap-1">
            {logs.map((log) => (
              <div
                key={log.id}
                className="flex items-center justify-between py-2.5 border-b border-slate-100 last:border-0"
              >
                <div className="flex items-center gap-3 min-w-0">
                  <span
                    className={`text-[10px] font-semibold px-2 py-1 rounded-full flex-shrink-0 ${
                      methodColors[log.method] || 'bg-slate-100 text-slate-600'
                    }`}
                  >
                    {log.method}
                  </span>
                  <div className="min-w-0">
                    <p className="text-sm text-slate-800 truncate">{log.deskripsi}</p>
                    <p className="text-xs text-slate-400">
                      {log.user?.name ?? 'Guest'} · /{log.endpoint} · {log.ip_address ?? '-'}
                    </p>
                  </div>
                </div>
                <div className="flex items-center gap-2 flex-shrink-0 ml-3">
                  {activeTab === 'aktif' ? (
                    <ArrowDownCircle size={14} className="text-slate-300" />
                  ) : (
                    <ArrowUpCircle size={14} className="text-slate-300" />
                  )}
                  <span className="text-xs text-slate-400">
                    {formatWaktu(activeTab === 'trash' ? log.deleted_at ?? log.created_at : log.created_at)}
                  </span>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </AppLayout>
  );
}