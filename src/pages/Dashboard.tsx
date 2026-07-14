import { useState, useEffect } from 'react';
import {
  QrCode,
  CalendarDays,
  FileText,
  Ticket,
  TrendingUp,
  Clock,
} from 'lucide-react';
import {
  AreaChart,
  Area,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  CartesianGrid,
} from 'recharts';
import { useQuery } from '@tanstack/react-query';
import { useAuth } from '../context/AuthContext';
import ChatWidget from '../components/Chatwidget';
import AppLayout from '../components/AppLayout';
import api from '../api/axios';
import type { User as UserType } from '../types/user';

// ====== PLACEHOLDER DATA (belum ada endpoint di backend) ======
const placeholderStats = [
  { label: 'Kehadiran Bulan Ini', value: '22/23', trend: '+2 dari bulan lalu', icon: QrCode },
  { label: 'Cuti Tersisa', value: '8 hari', trend: 'dari 12 hari/tahun', icon: CalendarDays },
  { label: 'Izin Pending', value: '1', trend: 'menunggu approval', icon: FileText },
  { label: 'Ticket Aktif', value: '3', trend: '1 selesai minggu ini', icon: Ticket },
];

const attendanceTrend = [
  { day: 'Sen', hadir: 42, target: 45 },
  { day: 'Sel', hadir: 44, target: 45 },
  { day: 'Rab', hadir: 40, target: 45 },
  { day: 'Kam', hadir: 43, target: 45 },
  { day: 'Jum', hadir: 45, target: 45 },
  { day: 'Sab', hadir: 12, target: 15 },
  { day: 'Min', hadir: 5, target: 10 },
];

const topDivisi = [
  { name: 'Produksi', percent: 68, color: 'bg-blue-500' },
  { name: 'Marketing', percent: 45, color: 'bg-emerald-500' },
  { name: 'Finance', percent: 30, color: 'bg-violet-500' },
  { name: 'IT', percent: 22, color: 'bg-amber-500' },
];

const notifications = [
  { text: 'Izin kamu disetujui HR', time: '10 menit lalu', unread: true },
  { text: 'Reminder: absen sebelum jam 09:00', time: '1 jam lalu', unread: true },
  { text: 'Ticket #124 dikomentari Admin', time: '3 jam lalu', unread: false },
  { text: 'Slip gaji bulan ini sudah tersedia', time: 'Kemarin', unread: false },
];

const upcomingEvents = [
  { title: 'Meeting Mingguan Divisi IT', date: 'Senin, 09:00' },
  { title: 'Batas akhir laporan absensi', date: 'Rabu, 17:00' },
  { title: 'Training AI Assistant', date: 'Jumat, 13:00' },
];
// ================================================================

interface departemenDistribusi {
  departemen: string;
  jumlah: number;
}

// UBAH: fetchUser dipindah keluar komponen, dipakai queryFn
async function fetchUser(): Promise<UserType> {
  const res = await api.get<UserType>('/user');
  return res.data;
}

export default function Dashboard() {
  const { user: cachedUser, setUser } = useAuth();
  const [departemen, setDepartemen] = useState<departemenDistribusi[]>([]);

  // UBAH: useEffect + useState(loading/error) manual dihapus total, diganti useQuery
  // staleTime 5 menit -> pindah halaman & balik lagi dalam 5 menit, ga fetch ulang
  const { data, isLoading, isError } = useQuery({
    queryKey: ['user'],
    queryFn: fetchUser,
    staleTime: 5 * 60 * 1000,
    initialData: cachedUser ?? undefined, // UBAH: pakai user dari localStorage/context dulu sambil nunggu fetch, ga nge-blank
  });

  // UBAH: sync hasil query terbaru balik ke AuthContext (dipakai AppLayout, dll)
  useEffect(() => {
    if (data) setUser(data);
  }, [data, setUser]);

  // Fetch data distribusi departemen buat chart
  useEffect(() => {
    api
      .get('/dashboard/kpd')
      .then((res) => {
        console.log('BERHASIL', res.data);
        setDepartemen(res.data);
      })
      .catch((err) => {
        console.log(err.response);
      });
  }, []);

  const loading = isLoading && !cachedUser; // UBAH: cuma tampilin loading kalau bener2 belum ada data sama sekali
  const error = isError ? 'Gagal memuat data user. Silakan login ulang.' : null; // UBAH: derived dari isError

  const getGreeting = () => {
    const hour = new Date().getHours();
    if (hour < 11) return 'Selamat pagi';
    if (hour < 15) return 'Selamat siang';
    if (hour < 18) return 'Selamat sore';
    return 'Selamat malam';
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center">
        <p className="text-slate-500 text-sm">Memuat dashboard...</p>
      </div>
    );
  }

  return (
    <AppLayout title="Dashboard">
      <DashboardContent error={error} getGreeting={getGreeting} departemen={departemen} />
      <ChatWidget />
    </AppLayout>
  );
}

function DashboardContent({
  error,
  getGreeting,
  departemen,
}: {
  error: string | null;
  getGreeting: () => string;
  departemen: departemenDistribusi[];
}) {
  const { user } = useAuth();

  return (
    <>
      <p className="text-sm text-slate-500 mb-6">
        {getGreeting()}, <span className="font-semibold text-slate-800">{user?.name}</span> 👋
      </p>

      {error && (
        <div className="mb-6 bg-red-50 border border-red-200 text-red-700 text-sm rounded-lg px-4 py-3">
          {error}
        </div>
      )}

      {/* STAT CARDS */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {placeholderStats.map((stat) => {
          const Icon = stat.icon;
          return (
            <div key={stat.label} className="bg-white rounded-xl p-4 sm:p-5 shadow-sm border border-slate-200">
              <div className="w-10 h-10 rounded-lg flex items-center justify-center bg-slate-100 text-slate-700">
                <Icon size={20} />
              </div>
              <p className="text-2xl font-bold text-slate-900 mt-3">{stat.value}</p>
              <p className="text-xs text-slate-500 mt-1">{stat.label}</p>
              <p className="text-[11px] text-slate-400 mt-1 flex items-center gap-1">
                <TrendingUp size={12} /> {stat.trend}
              </p>
            </div>
          );
        })}
      </div>

      {/* ROW: Kehadiran (Area) + Pengajuan (Line) */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mt-6">
        <div className="bg-white rounded-xl p-6 shadow-sm border border-slate-200">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-base font-semibold text-slate-900">Tren Kehadiran Mingguan</h3>
            <span className="text-xs text-slate-500 bg-slate-100 px-2 py-1 rounded-full">Contoh</span>
          </div>
          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={attendanceTrend} margin={{ top: 5, right: 10, left: -20, bottom: 0 }}>
                <defs>
                  <linearGradient id="colorHadir" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#0f172a" stopOpacity={0.4} />
                    <stop offset="95%" stopColor="#0f172a" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
                <XAxis dataKey="day" tick={{ fontSize: 12, fill: '#94a3b8' }} axisLine={false} tickLine={false} />
                <YAxis hide />
                <Tooltip contentStyle={{ borderRadius: 8, border: '1px solid #e2e8f0', fontSize: 12 }} />
                <Area type="monotone" dataKey="hadir" stroke="#0f172a" strokeWidth={2} fill="url(#colorHadir)" />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>

        <div className="bg-white rounded-xl p-6 shadow-sm border border-slate-200">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-base font-semibold text-slate-900">Distribusi Karyawan per Divisi</h3>
            <span className="text-xs text-slate-500 bg-slate-100 px-2 py-1 rounded-full">Contoh</span>
          </div>
          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={departemen} layout="vertical" margin={{ top: 5, right: 20, left: 10, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" horizontal={false} />
                <XAxis type="number" tick={{ fontSize: 12, fill: '#94a3b8' }} axisLine={false} tickLine={false} />
                <YAxis dataKey="departemen" type="category" tick={{ fontSize: 12, fill: '#475569' }} axisLine={false} tickLine={false} width={70} />
                <Tooltip contentStyle={{ borderRadius: 8, border: '1px solid #e2e8f0', fontSize: 12 }} />
                <Bar dataKey="jumlah" fill="#2563eb" radius={[0, 4, 4, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>

      {/* ROW: Top Divisi + Notifikasi + Agenda */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mt-6">
        <div className="bg-white rounded-xl p-6 shadow-sm border border-slate-200">
          <h3 className="text-base font-semibold text-slate-900 mb-4">Beban Kerja per Divisi</h3>
          <div className="flex flex-col gap-4">
            {topDivisi.map((d) => (
              <div key={d.name}>
                <div className="flex justify-between text-sm mb-1">
                  <span className="text-slate-700 font-medium">{d.name}</span>
                  <span className="text-slate-400">{d.percent}%</span>
                </div>
                <div className="w-full h-2 bg-slate-100 rounded-full overflow-hidden">
                  <div className={`h-full ${d.color}`} style={{ width: `${d.percent}%` }} />
                </div>
              </div>
            ))}
          </div>
        </div>

        <div className="bg-white rounded-xl p-6 shadow-sm border border-slate-200">
          <h3 className="text-base font-semibold text-slate-900 mb-4">Notifikasi</h3>
          <ul className="flex flex-col gap-3">
            {notifications.map((n, i) => (
              <li key={i} className="flex items-start gap-2">
                <span className={`mt-1.5 w-1.5 h-1.5 rounded-full flex-shrink-0 ${n.unread ? 'bg-slate-900' : 'bg-slate-200'}`} />
                <div>
                  <p className={`text-sm ${n.unread ? 'text-slate-800 font-medium' : 'text-slate-500'}`}>{n.text}</p>
                  <p className="text-xs text-slate-400">{n.time}</p>
                </div>
              </li>
            ))}
          </ul>
        </div>

        <div className="bg-white rounded-xl p-6 shadow-sm border border-slate-200">
          <h3 className="text-base font-semibold text-slate-900 mb-4">Agenda Mendatang</h3>
          <ul className="flex flex-col gap-3">
            {upcomingEvents.map((ev, i) => (
              <li key={i} className="flex items-start gap-2">
                <Clock size={14} className="text-slate-400 mt-0.5 flex-shrink-0" />
                <div>
                  <p className="text-sm text-slate-700">{ev.title}</p>
                  <p className="text-xs text-slate-400">{ev.date}</p>
                </div>
              </li>
            ))}
          </ul>
        </div>
      </div>
    </>
  );
}