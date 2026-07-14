import { useEffect, useState } from 'react';
import {
    ResponsiveContainer,
    LineChart,
    Line,
    AreaChart,
    Area,
    BarChart,
    Bar,
    PieChart,
    Pie,
    Cell,
    XAxis,
    YAxis,
    CartesianGrid,
    Tooltip,
    Legend,
} from 'recharts';
import api from '../api/axios';
import AppLayout from '../components/AppLayout';

type Role = 'admin' | 'hr' | 'manajer' | 'karyawan';

/* =========================================================================
 * DUMMY DATA
 * TODO(backend): ganti seluruh blok ini dengan hasil fetch dari API, misal:
 *   GET /dashboard/cuti-summary
 *   GET /dashboard/cuti-tren
 *   GET /dashboard/barang-summary
 *   GET /dashboard/keuangan-summary
 * Bentuk data di bawah ini sengaja dibuat menyerupai kira-kira response
 * yang dibutuhkan, supaya nanti tinggal swap sumbernya tanpa ubah JSX.
 * =======================================================================*/


const dummyJenisCuti = [
    { jenis: 'Tahunan', jumlah: 38 },
    { jenis: 'Sakit', jumlah: 24 },
    { jenis: 'Izin', jumlah: 16 },
    { jenis: 'Lainnya', jumlah: 6 },
];

const jenisCutiColors: Record<string, string> = {
    Tahunan: '#111827',
    Sakit: '#EF4444',
    Izin: '#F59E0B',
    Lainnya: '#9CA3AF',
};

interface TopKaryawan {
    nama: string;
    jumlah: number;
}

const dummyTrenBulanan = [
    { bulan: 'Feb', pengajuan: 9 },
    { bulan: 'Mar', pengajuan: 14 },
    { bulan: 'Apr', pengajuan: 11 },
    { bulan: 'Mei', pengajuan: 17 },
    { bulan: 'Jun', pengajuan: 13 },
    { bulan: 'Jul', pengajuan: 20 },
];

const dummyRingkasanBarang = {
    totalMasuk: 1240,
    totalKeluar: 980,
};

const dummyBarangBulanan = [
    { bulan: 'Feb', masuk: 180, keluar: 140 },
    { bulan: 'Mar', masuk: 210, keluar: 160 },
    { bulan: 'Apr', masuk: 190, keluar: 155 },
    { bulan: 'Mei', masuk: 230, keluar: 175 },
    { bulan: 'Jun', masuk: 205, keluar: 168 },
    { bulan: 'Jul', masuk: 225, keluar: 182 },
];

const dummyRingkasanKeuangan = {
    pemasukan: 186_500_000,
    pengeluaran: 132_800_000,
};

const dummyKeuanganBulanan = [
    { bulan: 'Feb', pemasukan: 24_000_000, pengeluaran: 18_500_000 },
    { bulan: 'Mar', pemasukan: 27_500_000, pengeluaran: 20_100_000 },
    { bulan: 'Apr', pemasukan: 26_000_000, pengeluaran: 19_400_000 },
    { bulan: 'Mei', pemasukan: 31_200_000, pengeluaran: 23_800_000 },
    { bulan: 'Jun', pemasukan: 33_400_000, pengeluaran: 24_600_000 },
    { bulan: 'Jul', pemasukan: 34_400_000, pengeluaran: 26_400_000 },
];

/* ========================================================================= */

function formatRupiah(value: number): string {
    return new Intl.NumberFormat('id-ID', {
        style: 'currency',
        currency: 'IDR',
        maximumFractionDigits: 0,
    }).format(value);
}

function formatRupiahSingkat(value: number): string {
    if (value >= 1_000_000_000) return `${(value / 1_000_000_000).toFixed(1)}M`;
    if (value >= 1_000_000) return `${(value / 1_000_000).toFixed(0)}jt`;
    if (value >= 1_000) return `${(value / 1_000).toFixed(0)}rb`;
    return `${value}`;
}

interface StatCardProps {
    label: string;
    value: string;
    hint?: string;
    accent?: 'default' | 'green' | 'red' | 'yellow';
}

interface mutasiBarang {
    bulan: string;
    jumlah_masuk: number;
    jumlah_keluar: number;
}

const accentStyles: Record<NonNullable<StatCardProps['accent']>, string> = {
    default: 'text-gray-900',
    green: 'text-green-600',
    red: 'text-red-600',
    yellow: 'text-yellow-600',
};

function StatCard({ label, value, hint, accent = 'default' }: StatCardProps) {
    return (
        <div className="bg-white border border-gray-200 rounded-xl p-4">
            <p className="text-xs text-gray-500">{label}</p>
            <p className={`text-2xl font-bold mt-1 ${accentStyles[accent]}`}>{value}</p>
            {hint && <p className="text-xs text-gray-400 mt-1">{hint}</p>}
        </div>
    );
}

interface SectionProps {
    title: string;
    description?: string;
    children: React.ReactNode;
}

function Section({ title, description, children }: SectionProps) {
    return (
        <div className="mb-8">
            <div className="mb-3">
                <h2 className="text-sm font-semibold text-gray-900">{title}</h2>
                {description && <p className="text-xs text-gray-500 mt-0.5">{description}</p>}
            </div>
            {children}
        </div>
    );
}

const chartTooltipStyle = {
    fontSize: 12,
    borderRadius: 8,
    border: '1px solid #E5E7EB',
};

export default function DashboardAnalyticsPage() {
    const [currentRole, setCurrentRole] = useState<Role | null>(null);
    const [checkingAccess, setCheckingAccess] = useState<boolean>(true);
    const [mutasi, setMutasi] = useState<mutasiBarang[]>([])
    const [ringkasanCuti, setRingkasanCuti] = useState({
        total: 0,
        pending: 0,
        disetujui: 0,
        ditolak: 0,
    });
    const [topKaryawan, setTopKaryawan] = useState<TopKaryawan[]>([]);

    useEffect(() => {
        api.get('/dashboard-analytics/top-karyawan')
           .then((res) => setTopKaryawan(res.data))
           .catch((err) => {
            console.error(err)
           });
        api.get('/dashboard-analytics/analisis-cuti')
           .then((res) => {
            setRingkasanCuti(res.data);
           })
           .catch((err) => {
                console.error(err);
           })
        api.get('/dashboard-analytics/mutasi-barang')
           .then((res) => {
            setMutasi([
                {
                    bulan: res.data.bulan,
                    jumlah_masuk: res.data.jumlah_masuk,
                    jumlah_keluar: res.data.jumlah_keluar,
                },
            ]);
           })
           .catch((err) => {
            console.error(err)
           })
        api
            .get<{ role: Role }>('/user')
            .then((res) => setCurrentRole(res.data.role))
            .catch(() => setCurrentRole(null))
            .finally(() => setCheckingAccess(false));
    }, []);

    const isApprover = currentRole === 'admin' || currentRole === 'hr' || currentRole === 'manajer';

    if (checkingAccess) {
        return (
            <AppLayout title="Dashboard Analytics">
                <p className="text-center text-sm text-gray-400 py-16">Memuat...</p>
            </AppLayout>
        );
    }

    if (!isApprover) {
        return (
            <AppLayout title="Dashboard Analytics">
                <div className="max-w-md mx-auto text-center py-16">
                    <h1 className="text-base font-semibold text-gray-900 mb-1">Akses terbatas</h1>
                    <p className="text-sm text-gray-500">
                        Halaman ini hanya bisa diakses oleh admin, HR, atau manajer.
                    </p>
                </div>
            </AppLayout>
        );
    }

    const saldoBersih = dummyRingkasanKeuangan.pemasukan - dummyRingkasanKeuangan.pengeluaran;

    return (
        <AppLayout title="Dashboard Analytics">
            <div className="max-w-6xl mx-auto">
                <div className="mb-6">
                    <h1 className="text-xl font-bold text-gray-900">Dashboard Analytics</h1>
                    <p className="text-sm text-gray-500 mt-1">Ringkasan cuti, inventaris, dan keuangan perusahaan.</p>
                </div>

                {/* Ringkasan Cuti */}
                <Section title="Ringkasan Cuti">
                    <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                        <StatCard label="Total Pengajuan" value={`${ringkasanCuti.total}`} />
                        <StatCard label="Menunggu" value={`${ringkasanCuti.pending}`} accent="yellow" />
                        <StatCard label="Disetujui" value={`${ringkasanCuti.disetujui}`} accent="green" />
                        <StatCard label="Ditolak" value={`${ringkasanCuti.ditolak}`} accent="red" />
                    </div>
                </Section>

                {/* Ringkasan Barang */}
                <Section title="Ringkasan Inventaris">
                    <div className="grid grid-cols-2 gap-3">
                        <StatCard label="Total Barang Masuk" value={`${dummyRingkasanBarang.totalMasuk.toLocaleString('id-ID')}`} hint="6 bulan terakhir" accent="green" />
                        <StatCard label="Total Barang Keluar" value={`${dummyRingkasanBarang.totalKeluar.toLocaleString('id-ID')}`} hint="6 bulan terakhir" accent="red" />
                    </div>
                </Section>

                {/* Ringkasan Keuangan */}
                <Section title="Ringkasan Keuangan">
                    <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                        <StatCard label="Total Pemasukan" value={formatRupiah(dummyRingkasanKeuangan.pemasukan)} hint="6 bulan terakhir" accent="green" />
                        <StatCard label="Total Pengeluaran" value={formatRupiah(dummyRingkasanKeuangan.pengeluaran)} hint="6 bulan terakhir" accent="red" />
                        <StatCard
                            label="Saldo Bersih"
                            value={formatRupiah(saldoBersih)}
                            hint="6 bulan terakhir"
                            accent={saldoBersih >= 0 ? 'green' : 'red'}
                        />
                    </div>
                </Section>

                {/* Tren Pengajuan Cuti per Bulan */}
                <Section title="Tren Pengajuan Cuti" description="Jumlah pengajuan cuti per bulan, 6 bulan terakhir.">
                    <div className="bg-white border border-gray-200 rounded-xl p-4">
                        <ResponsiveContainer width="100%" height={260}>
                            <AreaChart data={dummyTrenBulanan} margin={{ top: 8, right: 16, left: -16, bottom: 0 }}>
                                <defs>
                                    <linearGradient id="pengajuanGradient" x1="0" y1="0" x2="0" y2="1">
                                        <stop offset="0%" stopColor="#111827" stopOpacity={0.18} />
                                        <stop offset="100%" stopColor="#111827" stopOpacity={0} />
                                    </linearGradient>
                                </defs>
                                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#F3F4F6" />
                                <XAxis dataKey="bulan" tick={{ fontSize: 12, fill: '#6B7280' }} axisLine={false} tickLine={false} />
                                <YAxis tick={{ fontSize: 12, fill: '#6B7280' }} axisLine={false} tickLine={false} allowDecimals={false} />
                                <Tooltip contentStyle={chartTooltipStyle} />
                                <Area type="monotone" dataKey="pengajuan" name="Pengajuan" stroke="#111827" strokeWidth={2} fill="url(#pengajuanGradient)" />
                            </AreaChart>
                        </ResponsiveContainer>
                    </div>
                </Section>

                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
                    {/* Breakdown Jenis Cuti */}
                    <div>
                        <div className="mb-3">
                            <h2 className="text-sm font-semibold text-gray-900">Breakdown Jenis Cuti</h2>
                            <p className="text-xs text-gray-500 mt-0.5">Proporsi tipe cuti yang diajukan.</p>
                        </div>
                        <div className="bg-white border border-gray-200 rounded-xl p-4">
                            <ResponsiveContainer width="100%" height={240}>
                                <PieChart>
                                    <Pie
                                        data={dummyJenisCuti}
                                        dataKey="jumlah"
                                        nameKey="jenis"
                                        innerRadius={55}
                                        outerRadius={85}
                                        paddingAngle={2}
                                    >
                                        {dummyJenisCuti.map((entry) => (
                                            <Cell key={entry.jenis} fill={jenisCutiColors[entry.jenis]} />
                                        ))}
                                    </Pie>
                                    <Tooltip contentStyle={chartTooltipStyle} />
                                    <Legend
                                        verticalAlign="bottom"
                                        iconType="circle"
                                        wrapperStyle={{ fontSize: 12, color: '#6B7280' }}
                                    />
                                </PieChart>
                            </ResponsiveContainer>
                        </div>
                    </div>

                    {/* Top Karyawan Pengajuan Cuti */}
                    <div>
                        <div className="mb-3">
                            <h2 className="text-sm font-semibold text-gray-900">Karyawan Pengajuan Cuti Terbanyak</h2>
                            <p className="text-xs text-gray-500 mt-0.5">Top 5 karyawan berdasarkan jumlah pengajuan.</p>
                        </div>
                        <div className="bg-white border border-gray-200 rounded-xl p-4">
                            <ResponsiveContainer width="100%" height={240}>
                                <BarChart
                                    data={topKaryawan}
                                    layout="vertical"
                                    margin={{ top: 0, right: 16, left: 0, bottom: 0 }}
                                >
                                    <CartesianGrid strokeDasharray="3 3" horizontal={false} stroke="#F3F4F6" />
                                    <XAxis type="number" tick={{ fontSize: 12, fill: '#6B7280' }} axisLine={false} tickLine={false} allowDecimals={false} />
                                    <YAxis
                                        type="category"
                                        dataKey="nama"
                                        tick={{ fontSize: 12, fill: '#374151' }}
                                        axisLine={false}
                                        tickLine={false}
                                        width={110}
                                    />
                                    <Tooltip contentStyle={chartTooltipStyle} />
                                    <Bar dataKey="jumlah" name="Pengajuan" fill="#111827" radius={[0, 4, 4, 0]} barSize={16} />
                                </BarChart>
                            </ResponsiveContainer>
                        </div>
                    </div>
                </div>

                {/* Barang Masuk vs Keluar */}
                <Section title="Barang Masuk vs Keluar" description="Perbandingan jumlah barang masuk dan keluar per bulan.">
                    <div className="bg-white border border-gray-200 rounded-xl p-4">
                        <ResponsiveContainer width="100%" height={260}>
                            <BarChart data={mutasi} margin={{ top: 8, right: 16, left: -16, bottom: 0 }}>
                                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#F3F4F6" />
                                <XAxis dataKey="bulan" tick={{ fontSize: 12, fill: '#6B7280' }} axisLine={false} tickLine={false} />
                                <YAxis tick={{ fontSize: 12, fill: '#6B7280' }} axisLine={false} tickLine={false} allowDecimals={false} />
                                <Tooltip contentStyle={chartTooltipStyle} />
                                <Legend wrapperStyle={{ fontSize: 12 }} />
                                <Bar dataKey="jumlah_masuk" name="Barang Masuk" fill="#16A34A" radius={[4, 4, 0, 0]} barSize={18} />
                                <Bar dataKey="jumlah_keluar" name="Barang Keluar" fill="#DC2626" radius={[4, 4, 0, 0]} barSize={18} />
                            </BarChart>
                        </ResponsiveContainer>
                    </div>
                </Section>

                {/* Pemasukan vs Pengeluaran */}
                <Section title="Pemasukan vs Pengeluaran" description="Arus keuangan per bulan, 6 bulan terakhir.">
                    <div className="bg-white border border-gray-200 rounded-xl p-4">
                        <ResponsiveContainer width="100%" height={260}>
                            <LineChart data={dummyKeuanganBulanan} margin={{ top: 8, right: 16, left: 0, bottom: 0 }}>
                                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#F3F4F6" />
                                <XAxis dataKey="bulan" tick={{ fontSize: 12, fill: '#6B7280' }} axisLine={false} tickLine={false} />
                                <YAxis
                                    tick={{ fontSize: 12, fill: '#6B7280' }}
                                    axisLine={false}
                                    tickLine={false}
                                    tickFormatter={(v: number) => formatRupiahSingkat(v)}
                                    width={48}
                                />
                                <Tooltip contentStyle={chartTooltipStyle} formatter={(value) => formatRupiah(Number(value ?? 0))} />
                                <Legend wrapperStyle={{ fontSize: 12 }} />
                                <Line type="monotone" dataKey="pemasukan" name="Pemasukan" stroke="#16A34A" strokeWidth={2} dot={{ r: 3 }} />
                                <Line type="monotone" dataKey="pengeluaran" name="Pengeluaran" stroke="#DC2626" strokeWidth={2} dot={{ r: 3 }} />
                            </LineChart>
                        </ResponsiveContainer>
                    </div>
                </Section>

                <p className="text-xs text-gray-400 text-center pb-4">
                    * Data pada halaman ini masih data contoh (dummy) sambil menunggu endpoint backend siap.
                </p>
            </div>
        </AppLayout>
    );
}