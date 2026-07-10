import { useEffect, useState } from 'react';
import {
  Users,
  UserCheck,
  UserX,
  ArrowDownCircle,
  ArrowUpCircle,
  Search,
  X,
  ScanLine,
  QrCode,
  AlertCircle,
  CheckCircle2,
} from 'lucide-react';
import AppLayout from '../components/AppLayout';
import ScanQrModal from '../components/ScanQrModal';
import KaryawanQrModal from '../components/KaryawanQrModal';
import {
  getKaryawanAktif,
  getAbsensiHariIni,
  getRiwayatAbsensi,
  getKaryawanByKode,
  scanAbsenMasuk,
  scanAbsenPulang,
  type Karyawan,
  type Absensi,
} from '../api/absensi';

type TabKey = 'semua' | 'sudah_absen' | 'belum_absen';
type ModalTipe = 'masuk' | 'pulang' | 'selesai';

const roleLabels: Record<Karyawan['role'], string> = {
  admin: 'Admin',
  hr: 'HR',
  manajer: 'Manajer',
  karyawan: 'Karyawan',
};

function initials(name: string): string {
  return name
    .split(' ')
    .map((w) => w[0])
    .slice(0, 2)
    .join('')
    .toUpperCase();
}

function formatJam(iso: string | null): string {
  if (!iso) return '-';
  return new Date(iso).toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' });
}

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

export default function AbsensiPage() {
  const [karyawanList, setKaryawanList] = useState<Karyawan[]>([]);
  const [absensiHariIni, setAbsensiHariIni] = useState<Absensi[]>([]);
  const [riwayat, setRiwayat] = useState<Absensi[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [search, setSearch] = useState('');
  const [activeTab, setActiveTab] = useState<TabKey>('semua');

  // modal konfirmasi absen (dipicu dari scan ATAU dari tombol manual di daftar)
  const [modalKaryawan, setModalKaryawan] = useState<Karyawan | null>(null);
  const [modalAbsensi, setModalAbsensi] = useState<Absensi | null>(null);
  const [modalTipe, setModalTipe] = useState<ModalTipe | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [modalError, setModalError] = useState('');

  const [scannerOpen, setScannerOpen] = useState(false);
  const [scanError, setScanError] = useState('');
  const [qrKaryawan, setQrKaryawan] = useState<Karyawan | null>(null);

  const loadData = async () => {
    setLoading(true);
    setError('');
    try {
      const [karyawanData, absensiData, riwayatData] = await Promise.all([
        getKaryawanAktif(),
        getAbsensiHariIni(),
        getRiwayatAbsensi(10),
      ]);
      setKaryawanList(karyawanData);
      setAbsensiHariIni(absensiData);
      setRiwayat(riwayatData);
    } catch (err) {
      setError('Gagal memuat data absensi. Coba refresh halaman.');
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const findAbsensi = (karyawanId: number) =>
    absensiHariIni.find((a) => a.karyawan.id === karyawanId) || null;

  const filteredKaryawan = karyawanList
    .filter(
      (k) =>
        k.name.toLowerCase().includes(search.toLowerCase()) ||
        k.kode_karyawan.toLowerCase().includes(search.toLowerCase())
    )
    .filter((k) => {
      const rec = findAbsensi(k.id);
      const sudahAbsen = !!rec?.jam_masuk;
      if (activeTab === 'sudah_absen') return sudahAbsen;
      if (activeTab === 'belum_absen') return !sudahAbsen;
      return true;
    });

  const totalKaryawan = karyawanList.length;
  const sudahAbsenCount = karyawanList.filter((k) => !!findAbsensi(k.id)?.jam_masuk).length;
  const belumAbsenCount = totalKaryawan - sudahAbsenCount;

  const openModal = (item: Karyawan, tipe: ModalTipe) => {
    setModalKaryawan(item);
    setModalAbsensi(findAbsensi(item.id));
    setModalTipe(tipe);
    setModalError('');
  };

  const closeModal = () => {
    setModalKaryawan(null);
    setModalAbsensi(null);
    setModalTipe(null);
    setModalError('');
  };

  const handleScanSuccess = async (kode: string) => {
    setScannerOpen(false);
    setScanError('');
    try {
      const found = await getKaryawanByKode(kode);
      const rec = findAbsensi(found.id);

      let tipe: ModalTipe;
      if (!rec || !rec.jam_masuk) tipe = 'masuk';
      else if (!rec.jam_pulang) tipe = 'pulang';
      else tipe = 'selesai';

      setModalKaryawan(found);
      setModalAbsensi(rec);
      setModalTipe(tipe);
      setModalError('');
    } catch (err: any) {
      setScanError(
        err.response?.data?.message || `Kode "${kode}" tidak dikenali sebagai karyawan.`
      );
    }
  };

  const handleConfirmAbsen = async () => {
    if (!modalKaryawan || !modalTipe || modalTipe === 'selesai') return;

    setSubmitting(true);
    setModalError('');
    try {
      const fn = modalTipe === 'masuk' ? scanAbsenMasuk : scanAbsenPulang;
      const result = await fn(modalKaryawan.id);

      setAbsensiHariIni((prev) => {
        const exists = prev.some((a) => a.id === result.absensi.id);
        return exists
          ? prev.map((a) => (a.id === result.absensi.id ? result.absensi : a))
          : [...prev, result.absensi];
      });
      setRiwayat((prev) => [result.absensi, ...prev].slice(0, 10));

      closeModal();
    } catch (err: any) {
      setModalError(err.response?.data?.message || 'Gagal memproses absen. Coba lagi.');
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) {
    return (
      <AppLayout title="Absensi">
        <p className="text-sm text-slate-500">Memuat data absensi...</p>
      </AppLayout>
    );
  }

  return (
    <AppLayout title="Absensi">
      <div className="flex items-center justify-between mb-2">
        <p className="text-sm text-slate-500">Kelola absen masuk & pulang karyawan.</p>
        <button
          onClick={() => {
            setScanError('');
            setScannerOpen(true);
          }}
          className="flex items-center gap-2 bg-slate-900 text-white text-sm font-semibold px-4 py-2.5 rounded-lg hover:bg-slate-800 transition"
        >
          <ScanLine size={16} />
          Scan QR
        </button>
      </div>

      <nav className="mb-6">
        <ul className="flex items-center gap-6 border-b border-slate-200">
          <li>
            <button
              onClick={() => setActiveTab('semua')}
              className={`flex items-center gap-2 pb-3 text-sm whitespace-nowrap border-b-2 -mb-px transition-colors ${
                activeTab === 'semua'
                  ? 'border-slate-900 text-slate-900 font-medium'
                  : 'border-transparent text-slate-500 hover:text-slate-700'
              }`}
            >
              <Users size={16} />
              Semua Karyawan
              <span className="text-xs bg-slate-100 text-slate-600 px-1.5 py-0.5 rounded-full">
                {totalKaryawan}
              </span>
            </button>
          </li>
          <li>
            <button
              onClick={() => setActiveTab('sudah_absen')}
              className={`flex items-center gap-2 pb-3 text-sm whitespace-nowrap border-b-2 -mb-px transition-colors ${
                activeTab === 'sudah_absen'
                  ? 'border-slate-900 text-slate-900 font-medium'
                  : 'border-transparent text-slate-500 hover:text-slate-700'
              }`}
            >
              <UserCheck size={16} />
              Sudah Absen
              <span className="text-xs bg-emerald-50 text-emerald-600 px-1.5 py-0.5 rounded-full">
                {sudahAbsenCount}
              </span>
            </button>
          </li>
          <li>
            <button
              onClick={() => setActiveTab('belum_absen')}
              className={`flex items-center gap-2 pb-3 text-sm whitespace-nowrap border-b-2 -mb-px transition-colors ${
                activeTab === 'belum_absen'
                  ? 'border-slate-900 text-slate-900 font-medium'
                  : 'border-transparent text-slate-500 hover:text-slate-700'
              }`}
            >
              <UserX size={16} />
              Belum Absen
              <span className="text-xs bg-red-50 text-red-600 px-1.5 py-0.5 rounded-full">
                {belumAbsenCount}
              </span>
            </button>
          </li>
        </ul>
      </nav>

      {error && (
        <div className="mb-6 bg-red-50 border border-red-200 text-red-700 text-sm rounded-lg px-4 py-3">
          {error}
        </div>
      )}

      {scanError && (
        <div className="mb-6 flex items-center justify-between bg-amber-50 border border-amber-200 text-amber-700 text-sm rounded-lg px-4 py-3">
          <span>{scanError}</span>
          <button onClick={() => setScanError('')} className="text-amber-500 hover:text-amber-700">
            <X size={16} />
          </button>
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* DAFTAR KARYAWAN */}
        <div className="lg:col-span-2 bg-white rounded-xl p-6 shadow-sm border border-slate-200">
          <h3 className="text-base font-semibold text-slate-900 mb-4">Daftar Karyawan</h3>

          <div className="relative mb-4">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
            <input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Cari nama atau kode karyawan..."
              className="w-full pl-9 pr-4 py-2.5 bg-slate-50 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-slate-900"
            />
          </div>

          <div className="flex flex-col gap-2">
            {filteredKaryawan.map((item) => {
              const rec = findAbsensi(item.id);
              const sudahMasuk = !!rec?.jam_masuk;
              const sudahPulang = !!rec?.jam_pulang;

              return (
                <div
                  key={item.id}
                  className="flex items-center justify-between border border-slate-200 rounded-lg p-3 hover:bg-slate-50 transition"
                >
                  <div className="flex items-center gap-3 min-w-0">
                    <div className="w-9 h-9 rounded-full bg-slate-100 flex items-center justify-center text-xs font-medium text-slate-700 flex-shrink-0">
                      {initials(item.name)}
                    </div>
                    <div className="min-w-0">
                      <div className="flex items-center gap-2">
                        <p className="text-sm font-medium text-slate-800 truncate">{item.name}</p>
                        {rec?.status === 'terlambat' && (
                          <span className="text-[10px] font-semibold text-amber-600 bg-amber-50 px-2 py-0.5 rounded-full flex-shrink-0">
                            Terlambat
                          </span>
                        )}
                      </div>
                      <p className="text-xs text-slate-400">
                        {item.kode_karyawan} · {roleLabels[item.role]}
                      </p>
                    </div>
                  </div>

                  <div className="flex items-center gap-4 flex-shrink-0 ml-3">
                    <div className="text-right hidden sm:block">
                      <p className="text-xs text-slate-400">
                        Masuk <span className="font-semibold text-slate-700">{formatJam(rec?.jam_masuk ?? null)}</span>
                      </p>
                      <p className="text-xs text-slate-400">
                        Pulang <span className="font-semibold text-slate-700">{formatJam(rec?.jam_pulang ?? null)}</span>
                      </p>
                    </div>
                    <div className="flex gap-1.5">
                      <button
                        onClick={() => setQrKaryawan(item)}
                        title="Lihat / Cetak QR"
                        className="w-8 h-8 rounded-lg bg-slate-100 text-slate-600 flex items-center justify-center hover:bg-slate-200 transition"
                      >
                        <QrCode size={16} />
                      </button>
                      {!sudahMasuk && (
                        <button
                          onClick={() => openModal(item, 'masuk')}
                          title="Tandai Masuk"
                          className="w-8 h-8 rounded-lg bg-emerald-50 text-emerald-600 flex items-center justify-center hover:bg-emerald-100 transition"
                        >
                          <ArrowDownCircle size={16} />
                        </button>
                      )}
                      {sudahMasuk && !sudahPulang && (
                        <button
                          onClick={() => openModal(item, 'pulang')}
                          title="Tandai Pulang"
                          className="w-8 h-8 rounded-lg bg-red-50 text-red-600 flex items-center justify-center hover:bg-red-100 transition"
                        >
                          <ArrowUpCircle size={16} />
                        </button>
                      )}
                      {sudahMasuk && sudahPulang && (
                        <span
                          title="Absen lengkap hari ini"
                          className="w-8 h-8 rounded-lg bg-slate-50 text-slate-400 flex items-center justify-center"
                        >
                          <CheckCircle2 size={16} />
                        </span>
                      )}
                    </div>
                  </div>
                </div>
              );
            })}

            {filteredKaryawan.length === 0 && (
              <p className="text-sm text-slate-400 text-center py-8">Karyawan tidak ditemukan.</p>
            )}
          </div>
        </div>

        {/* RIWAYAT ABSENSI */}
        <div className="bg-white rounded-xl p-6 shadow-sm border border-slate-200">
          <h3 className="text-base font-semibold text-slate-900 mb-4">Riwayat Absensi</h3>
          <ul className="flex flex-col gap-4">
            {riwayat.map((r) => (
              <li key={r.id} className="flex items-start gap-3">
                <span
                  className={`w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0 ${
                    r.jam_pulang ? 'bg-red-50 text-red-600' : 'bg-emerald-50 text-emerald-600'
                  }`}
                >
                  {r.jam_pulang ? <ArrowUpCircle size={16} /> : <ArrowDownCircle size={16} />}
                </span>
                <div className="min-w-0">
                  <p className="text-sm text-slate-800">
                    <span className="font-medium">{r.karyawan.name}</span>{' '}
                    {r.jam_pulang ? 'absen pulang' : 'absen masuk'}
                  </p>
                  <p className="text-xs text-slate-400">
                    {formatJam(r.jam_pulang ?? r.jam_masuk)} · {formatWaktu(r.jam_pulang ?? r.jam_masuk ?? r.tanggal)}
                  </p>
                </div>
              </li>
            ))}

            {riwayat.length === 0 && (
              <p className="text-sm text-slate-400 text-center py-6">Belum ada riwayat absensi.</p>
            )}
          </ul>
        </div>
      </div>

      {/* MODAL KONFIRMASI ABSEN */}
      {modalKaryawan && modalTipe && (
        <div className="fixed inset-0 bg-black/40 z-50 flex items-center justify-center px-4">
          <div className="bg-white rounded-xl shadow-xl w-full max-w-sm p-6">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-base font-semibold text-slate-900">
                {modalTipe === 'masuk' && 'Absen Masuk'}
                {modalTipe === 'pulang' && 'Absen Pulang'}
                {modalTipe === 'selesai' && 'Absen Lengkap'}
              </h3>
              <button onClick={closeModal} className="text-slate-400 hover:text-slate-600">
                <X size={20} />
              </button>
            </div>

            <div className="bg-slate-50 rounded-lg p-3 mb-5">
              <p className="text-sm font-medium text-slate-800">{modalKaryawan.name}</p>
              <p className="text-xs text-slate-400">
                {modalKaryawan.kode_karyawan} · {roleLabels[modalKaryawan.role]}
              </p>
              {modalAbsensi && (
                <p className="text-xs text-slate-400 mt-1">
                  Masuk {formatJam(modalAbsensi.jam_masuk)} · Pulang {formatJam(modalAbsensi.jam_pulang)}
                </p>
              )}
            </div>

            {modalTipe === 'selesai' ? (
              <div className="flex items-start gap-2 text-sm text-slate-600 bg-slate-50 border border-slate-200 rounded-lg px-3 py-3">
                <AlertCircle size={16} className="flex-shrink-0 mt-0.5 text-slate-400" />
                <span>Karyawan ini sudah absen masuk dan pulang hari ini.</span>
              </div>
            ) : (
              <>
                {modalError && (
                  <p className="text-sm text-red-600 bg-red-50 border border-red-200 rounded-lg px-3 py-2 mb-3">
                    {modalError}
                  </p>
                )}
                <button
                  onClick={handleConfirmAbsen}
                  disabled={submitting}
                  className={`w-full text-white text-sm font-semibold py-3 rounded-lg transition disabled:opacity-40 disabled:cursor-not-allowed ${
                    modalTipe === 'masuk' ? 'bg-emerald-600 hover:bg-emerald-700' : 'bg-red-600 hover:bg-red-700'
                  }`}
                >
                  {submitting
                    ? 'Memproses...'
                    : `Konfirmasi ${modalTipe === 'masuk' ? 'Absen Masuk' : 'Absen Pulang'}`}
                </button>
              </>
            )}
          </div>
        </div>
      )}

      {scannerOpen && (
        <ScanQrModal
          onClose={() => setScannerOpen(false)}
          onScanSuccess={handleScanSuccess}
          title="Scan QR Absen"
          description="Arahkan kamera ke kartu QR milik karyawan."
        />
      )}

      {qrKaryawan && <KaryawanQrModal karyawan={qrKaryawan} onClose={() => setQrKaryawan(null)} />}
    </AppLayout>
  );
}
