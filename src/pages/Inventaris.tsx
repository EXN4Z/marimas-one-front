import { useEffect, useState } from 'react';
import { Package, ArrowDownCircle, ArrowUpCircle, Search, X, AlertTriangle } from 'lucide-react';
import AppLayout from '../components/Applayout';
import {
  getBarang,
  getRiwayatSemua,
  scanMasuk,
  scanKeluar,
  type Barang,
  type Mutasi,
} from '../api/Barang';

function formatWaktu(iso: string): string {
  const date = new Date(iso);
  const diffMs = Date.now() - date.getTime();
  const diffMin = Math.floor(diffMs / 60000);

  if (diffMin < 1) return 'Baru saja';
  if (diffMin < 60) return `${diffMin} menit lalu`;
  const diffHour = Math.floor(diffMin / 60);
  if (diffHour < 24) return `${diffHour} jam lalu`;
  const diffDay = Math.floor(diffHour / 24);
  if (diffDay === 1) return 'Kemarin';
  return date.toLocaleDateString('id-ID', { day: 'numeric', month: 'short' });
}

export default function Inventaris() {
  const [barang, setBarang] = useState<Barang[]>([]);
  const [mutasi, setMutasi] = useState<Mutasi[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [search, setSearch] = useState('');

  const [modalBarang, setModalBarang] = useState<Barang | null>(null);
  const [modalTipe, setModalTipe] = useState<'masuk' | 'keluar'>('masuk');
  const [jumlahInput, setJumlahInput] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [modalError, setModalError] = useState('');

  const loadData = async () => {
    setLoading(true);
    setError('');
    try {
      const [barangData, mutasiData] = await Promise.all([getBarang(), getRiwayatSemua(10)]);
      setBarang(barangData);
      setMutasi(mutasiData);
    } catch (err) {
      setError('Gagal memuat data inventaris. Coba refresh halaman.');
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const filteredBarang = barang.filter(
    (b) =>
      b.nama.toLowerCase().includes(search.toLowerCase()) ||
      b.kode_barang.toLowerCase().includes(search.toLowerCase())
  );

  const totalBarang = barang.length;
  const stokMenipis = barang.filter((b) => b.stok < b.stok_minimum).length;
  const mutasiHariIni = mutasi.length;

  const openModal = (item: Barang, tipe: 'masuk' | 'keluar') => {
    setModalBarang(item);
    setModalTipe(tipe);
    setJumlahInput('');
    setModalError('');
  };

  const closeModal = () => {
    setModalBarang(null);
    setJumlahInput('');
    setModalError('');
  };

  const handleSubmitMutasi = async () => {
    if (!modalBarang || !jumlahInput || Number(jumlahInput) <= 0) return;

    setSubmitting(true);
    setModalError('');
    try {
      const jumlah = Number(jumlahInput);
      const fn = modalTipe === 'masuk' ? scanMasuk : scanKeluar;
      const result = await fn(modalBarang.id, jumlah);

      // update state lokal biar langsung kelihatan, tanpa perlu refetch semua
      setBarang((prev) => prev.map((b) => (b.id === result.barang.id ? result.barang : b)));
      setMutasi((prev) => [result.mutasi, ...prev].slice(0, 10));

      closeModal();
    } catch (err: any) {
      setModalError(err.response?.data?.message || 'Gagal memproses. Coba lagi.');
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) {
    return (
      <AppLayout title="Inventaris">
        <p className="text-sm text-slate-500">Memuat data inventaris...</p>
      </AppLayout>
    );
  }

  return (
    <AppLayout title="Inventaris">
      <div className="flex items-center justify-between mb-6">
        <p className="text-sm text-slate-500">Kelola stok barang masuk & keluar.</p>
      </div>

      {error && (
        <div className="mb-6 bg-red-50 border border-red-200 text-red-700 text-sm rounded-lg px-4 py-3">
          {error}
        </div>
      )}

      {/* STAT CARDS */}
      <div className="grid grid-cols-3 sm:grid-cols-3 gap-4">
        <div className="bg-white rounded-xl p-5 shadow-sm border border-slate-200">
          <div className="w-10 h-10 rounded-lg flex items-center justify-center bg-slate-100 text-slate-700">
            <Package size={20} />
          </div>
          <p className="text-2xl font-bold text-slate-900 mt-3">{totalBarang}</p>
          <p className="text-xs text-slate-500 mt-1">Total Jenis Barang</p>
        </div>

        <div className="bg-white rounded-xl p-5 shadow-sm border border-slate-200">
          <div className="w-10 h-10 rounded-lg flex items-center justify-center bg-red-50 text-red-600">
            <AlertTriangle size={20} />
          </div>
          <p className="text-2xl font-bold text-slate-900 mt-3">{stokMenipis}</p>
          <p className="text-xs text-slate-500 mt-1">Stok Menipis</p>
        </div>

        <div className="bg-white rounded-xl p-5 shadow-sm border border-slate-200">
          <div className="w-10 h-10 rounded-lg flex items-center justify-center bg-slate-100 text-slate-700">
            <ArrowDownCircle size={20} />
          </div>
          <p className="text-2xl font-bold text-slate-900 mt-3">{mutasiHariIni}</p>
          <p className="text-xs text-slate-500 mt-1">Mutasi Terbaru</p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mt-6">
        {/* DAFTAR BARANG */}
        <div className="lg:col-span-2 bg-white rounded-xl p-6 shadow-sm border border-slate-200">
          <h3 className="text-base font-semibold text-slate-900 mb-4">Daftar Barang</h3>

          <div className="relative mb-4">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
            <input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Cari nama atau kode barang..."
              className="w-full pl-9 pr-4 py-2.5 bg-slate-50 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-slate-900"
            />
          </div>

          <div className="flex flex-col gap-2">
            {filteredBarang.map((item) => (
              <div
                key={item.id}
                className="flex items-center justify-between border border-slate-200 rounded-lg p-3 hover:bg-slate-50 transition"
              >
                <div className="min-w-0">
                  <div className="flex items-center gap-2">
                    <p className="text-sm font-medium text-slate-800 truncate">{item.nama}</p>
                    {item.stok < item.stok_minimum && (
                      <span className="text-[10px] font-semibold text-red-600 bg-red-50 px-2 py-0.5 rounded-full flex-shrink-0">
                        Stok menipis
                      </span>
                    )}
                  </div>
                  <p className="text-xs text-slate-400">
                    {item.kode_barang} · {item.kategori || '-'}
                  </p>
                </div>

                <div className="flex items-center gap-3 flex-shrink-0 ml-3">
                  <div className="text-right">
                    <p className="text-sm font-bold text-slate-900">{item.stok}</p>
                    <p className="text-[11px] text-slate-400">{item.satuan}</p>
                  </div>
                  <div className="flex gap-1.5">
                    <button
                      onClick={() => openModal(item, 'masuk')}
                      title="Barang Masuk"
                      className="w-8 h-8 rounded-lg bg-emerald-50 text-emerald-600 flex items-center justify-center hover:bg-emerald-100 transition"
                    >
                      <ArrowDownCircle size={16} />
                    </button>
                    <button
                      onClick={() => openModal(item, 'keluar')}
                      title="Barang Keluar"
                      className="w-8 h-8 rounded-lg bg-red-50 text-red-600 flex items-center justify-center hover:bg-red-100 transition"
                    >
                      <ArrowUpCircle size={16} />
                    </button>
                  </div>
                </div>
              </div>
            ))}

            {filteredBarang.length === 0 && (
              <p className="text-sm text-slate-400 text-center py-8">Barang tidak ditemukan.</p>
            )}
          </div>
        </div>

        {/* RIWAYAT MUTASI */}
        <div className="bg-white rounded-xl p-6 shadow-sm border border-slate-200">
          <h3 className="text-base font-semibold text-slate-900 mb-4">Riwayat Mutasi</h3>
          <ul className="flex flex-col gap-4">
            {mutasi.map((m) => (
              <li key={m.id} className="flex items-start gap-3">
                <span
                  className={`w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0 ${
                    m.tipe === 'masuk' ? 'bg-emerald-50 text-emerald-600' : 'bg-red-50 text-red-600'
                  }`}
                >
                  {m.tipe === 'masuk' ? <ArrowDownCircle size={16} /> : <ArrowUpCircle size={16} />}
                </span>
                <div className="min-w-0">
                  <p className="text-sm text-slate-800">
                    <span className="font-medium">{m.barang?.nama}</span>{' '}
                    {m.tipe === 'masuk' ? 'masuk' : 'keluar'} sejumlah{' '}
                    <span className="font-medium">{m.jumlah}</span>
                  </p>
                  <p className="text-xs text-slate-400">
                    oleh {m.user?.name || '-'} · {formatWaktu(m.created_at)}
                  </p>
                </div>
              </li>
            ))}

            {mutasi.length === 0 && (
              <p className="text-sm text-slate-400 text-center py-6">Belum ada mutasi.</p>
            )}
          </ul>
        </div>
      </div>

      {/* MODAL SCAN */}
      {modalBarang && (
        <div className="fixed inset-0 bg-black/40 z-50 flex items-center justify-center px-4">
          <div className="bg-white rounded-xl shadow-xl w-full max-w-sm p-6">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-base font-semibold text-slate-900">
                {modalTipe === 'masuk' ? 'Barang Masuk' : 'Barang Keluar'}
              </h3>
              <button onClick={closeModal} className="text-slate-400 hover:text-slate-600">
                <X size={20} />
              </button>
            </div>

            <div className="bg-slate-50 rounded-lg p-3 mb-4">
              <p className="text-sm font-medium text-slate-800">{modalBarang.nama}</p>
              <p className="text-xs text-slate-400">
                {modalBarang.kode_barang} · Stok saat ini: {modalBarang.stok} {modalBarang.satuan}
              </p>
            </div>

            <label className="block text-sm font-medium text-slate-700 mb-1">
              Jumlah ({modalBarang.satuan})
            </label>
            <input
              type="number"
              value={jumlahInput}
              onChange={(e) => setJumlahInput(e.target.value)}
              placeholder="0"
              autoFocus
              className="w-full px-3 py-2.5 border border-slate-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-slate-900 mb-3"
            />

            {modalError && (
              <p className="text-sm text-red-600 bg-red-50 border border-red-200 rounded-lg px-3 py-2 mb-3">
                {modalError}
              </p>
            )}

            <button
              onClick={handleSubmitMutasi}
              disabled={!jumlahInput || Number(jumlahInput) <= 0 || submitting}
              className={`w-full text-white text-sm font-semibold py-3 rounded-lg transition disabled:opacity-40 disabled:cursor-not-allowed ${
                modalTipe === 'masuk' ? 'bg-emerald-600 hover:bg-emerald-700' : 'bg-red-600 hover:bg-red-700'
              }`}
            >
              {submitting ? 'Memproses...' : `Konfirmasi ${modalTipe === 'masuk' ? 'Barang Masuk' : 'Barang Keluar'}`}
            </button>

            <p className="text-[11px] text-slate-400 text-center mt-3">
              *Sementara input manual — fitur scan kamera QR menyusul.
            </p>
          </div>
        </div>
      )}
    </AppLayout>
  );
}
