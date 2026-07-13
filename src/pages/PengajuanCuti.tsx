import { useEffect, useMemo, useState, type JSX } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../api/axios';
import AppLayout from '../components/AppLayout';

type Role = 'admin' | 'hr' | 'manajer' | 'karyawan';
type Status = 'menunggu' | 'disetujui' | 'ditolak';
type TabKey = 'semua' | 'menunggu' | 'disetujui' | 'ditolak';
type JenisCuti = 'tahunan' | 'sakit' | 'izin' | 'lainnya';

interface Pemohon {
    id: number;
    name: string;
    email: string;
}

interface Cuti {
    id: number;
    user: Pemohon;
    jenis_cuti: JenisCuti;
    tanggal_mulai: string;
    tanggal_selesai: string;
    jumlah_hari: number;
    alasan: string;
    status: Status;
}

const statusStyles: Record<Status, string> = {
    menunggu: 'bg-yellow-50 text-yellow-700',
    disetujui: 'bg-green-50 text-green-700',
    ditolak: 'bg-red-50 text-red-700',
};

const statusLabels: Record<Status, string> = {
    menunggu: 'Menunggu',
    disetujui: 'Disetujui',
    ditolak: 'Ditolak',
};

const jenisLabels: Record<JenisCuti, string> = {
    tahunan: 'Cuti Tahunan',
    sakit: 'Cuti Sakit',
    izin: 'Izin',
    lainnya: 'Lainnya',
};

const tabs: { key: TabKey; label: string; icon: JSX.Element }[] = [
    {
        key: 'semua',
        label: 'Semua Pengajuan',
        icon: (
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
            </svg>
        ),
    },
    {
        key: 'menunggu',
        label: 'Menunggu',
        icon: (
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
        ),
    },
    {
        key: 'disetujui',
        label: 'Disetujui',
        icon: (
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
        ),
    },
    {
        key: 'ditolak',
        label: 'Ditolak',
        icon: (
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
        ),
    },
];

function initials(name: string): string {
    return name
        .split(' ')
        .map((w) => w[0])
        .slice(0, 2)
        .join('')
        .toUpperCase();
}

function formatTanggal(tanggal: string): string {
    return new Date(tanggal).toLocaleDateString('id-ID', {
        day: 'numeric',
        month: 'short',
        year: 'numeric',
    });
}

export default function CutiPage() {
    const navigate = useNavigate();
    const [cutiList, setCutiList] = useState<Cuti[]>([]);
    const [loading, setLoading] = useState<boolean>(true);
    const [errorMsg, setErrorMsg] = useState<string>('');
    const [currentRole, setCurrentRole] = useState<Role | null>(null);
    const [currentUserId, setCurrentUserId] = useState<number | null>(null);

    const [search, setSearch] = useState<string>('');
    const [activeTab, setActiveTab] = useState<TabKey>('semua');
    const [selectedCuti, setSelectedCuti] = useState<Cuti | null>(null);
    const [modalAction, setModalAction] = useState<'setujui' | 'tolak' | 'batalkan' | null>(null);
    const [processing, setProcessing] = useState<boolean>(false);

    // Detail view state (menampilkan kolom 'alasan' beserta tombol update)
    const [detailCuti, setDetailCuti] = useState<Cuti | null>(null);

    useEffect(() => {
        api
            .get<{ id: number; role: Role }>('/user')
            .then((res) => {
                setCurrentRole(res.data.role);
                setCurrentUserId(res.data.id);
            })
            .catch(() => {});

        api
            .get<Cuti[]>('/cuti')
            .then((res) => setCutiList(res.data))
            .catch((err) => {
                if (err.response?.status === 403) {
                    setErrorMsg('Anda tidak punya akses ke halaman ini.');
                } else {
                    setErrorMsg('Gagal memuat data. Coba lagi.');
                }
            })
            .finally(() => setLoading(false));
    }, []);

    const isApprover = currentRole === 'admin' || currentRole === 'hr' || currentRole === 'manajer';

    const filtered = useMemo<Cuti[]>(() => {
        const q = search.toLowerCase().trim();
        return cutiList.filter((c) => {
            const matchSearch =
                (c.user.name ?? '').toLowerCase().includes(q) || c.alasan.toLowerCase().includes(q);
            const matchTab = activeTab === 'semua' || c.status === activeTab;
            return matchSearch && matchTab;
        });
    }, [cutiList, search, activeTab]);

    function openModal(cuti: Cuti, action: 'setujui' | 'tolak' | 'batalkan') {
        setSelectedCuti(cuti);
        setModalAction(action);
    }

    // Dipanggil dari dalam modal detail: tutup detail lalu buka konfirmasi update
    function handleActionFromDetail(cuti: Cuti, action: 'setujui' | 'tolak' | 'batalkan') {
        setDetailCuti(null);
        openModal(cuti, action);
    }

    async function confirmAction() {
        if (!selectedCuti || !modalAction) return;

        setProcessing(true);
        try {
            if (modalAction === 'batalkan') {
                await api.delete(`/cuti/${selectedCuti.id}`);
                setCutiList((prev) => prev.filter((c) => c.id !== selectedCuti.id));
            } else {
                const newStatus: Status = modalAction === 'setujui' ? 'disetujui' : 'ditolak';
                await api.patch(`/cuti/${selectedCuti.id}`, { status: newStatus });
                setCutiList((prev) =>
                    prev.map((c) => (c.id === selectedCuti.id ? { ...c, status: newStatus } : c))
                );
            }
            setSelectedCuti(null);
            setModalAction(null);
        } catch (err: any) {
            if (err.response?.status === 403) {
                setErrorMsg('Anda tidak punya akses untuk melakukan aksi ini.');
            } else {
                setErrorMsg('Gagal memproses pengajuan. Coba lagi.');
            }
            setSelectedCuti(null);
            setModalAction(null);
        } finally {
            setProcessing(false);
        }
    }

    const activeTabLabel = tabs.find((t) => t.key === activeTab)?.label ?? 'Pengajuan';

    return (
        <AppLayout title="Pengajuan Cuti">
            <div className="max-w-6xl mx-auto">
                <div className="mb-6">
                    <h1 className="text-xl font-bold text-gray-900">Pengajuan Cuti</h1>
                    <p className="text-sm text-gray-500 mt-1">Kelola dan pantau seluruh pengajuan cuti karyawan.</p>
                </div>

                <div className="bg-white border border-gray-200 rounded-xl p-4">
                    <nav className="mb-4">
                        <ul className="flex items-center gap-6 border-b border-gray-200 overflow-x-auto">
                            {tabs.map((tab) => (
                                <li key={tab.key}>
                                    <button
                                        onClick={() => setActiveTab(tab.key)}
                                        className={`flex items-center gap-2 pb-3 text-sm whitespace-nowrap border-b-2 -mb-px transition-colors ${
                                            activeTab === tab.key
                                                ? 'border-black text-black font-medium'
                                                : 'border-transparent text-gray-500 hover:text-gray-700'
                                        }`}
                                    >
                                        {tab.icon}
                                        {tab.label}
                                    </button>
                                </li>
                            ))}
                        </ul>
                    </nav>

                    <div className="flex flex-col sm:flex-row gap-2 mb-4">
                        <div className="relative flex-1">
                            <svg
                                className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-gray-400"
                                fill="none"
                                stroke="currentColor"
                                viewBox="0 0 24 24"
                            >
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-4.35-4.35M11 19a8 8 0 100-16 8 8 0 000 16z" />
                            </svg>
                            <input
                                type="text"
                                placeholder="Cari nama atau alasan..."
                                value={search}
                                onChange={(e) => setSearch(e.target.value)}
                                className="w-full pl-9 pr-3 py-2 text-sm border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-black/10"
                            />
                        </div>
                        <button
                            onClick={() => navigate('/cuti/create')}
                            className="flex items-center justify-center gap-2 bg-black text-white text-sm px-4 py-2 rounded-lg hover:bg-gray-800 whitespace-nowrap"
                        >
                            + Ajukan Cuti
                        </button>
                    </div>

                    <p className="text-sm text-gray-500 mb-4">
                        Total {activeTabLabel} ada <span className="font-semibold text-gray-900">{filtered.length}</span>
                    </p>

                    {loading && <p className="text-center text-sm text-gray-400 py-8">Memuat data...</p>}

                    {!loading && errorMsg && <p className="text-center text-sm text-gray-400 py-8">{errorMsg}</p>}

                    {!loading && !errorMsg && filtered.length === 0 && (
                        <p className="text-center text-sm text-gray-400 py-8">Tidak ada pengajuan yang cocok dengan filter ini.</p>
                    )}

                    {!loading && !errorMsg && filtered.length > 0 && (
                        <div className="divide-y divide-gray-100">
                            {filtered.map((cuti) => (
                                <CutiRow
                                    key={cuti.id}
                                    cuti={cuti}
                                    isApprover={isApprover}
                                    isOwner={cuti.user.id === currentUserId}
                                    onDetail={() => setDetailCuti(cuti)}
                                    onSetujui={() => openModal(cuti, 'setujui')}
                                    onTolak={() => openModal(cuti, 'tolak')}
                                    onBatalkan={() => openModal(cuti, 'batalkan')}
                                />
                            ))}
                        </div>
                    )}
                </div>
            </div>

            {detailCuti && (
                <DetailModal
                    cuti={detailCuti}
                    isApprover={isApprover}
                    isOwner={detailCuti.user.id === currentUserId}
                    onClose={() => setDetailCuti(null)}
                    onSetujui={() => handleActionFromDetail(detailCuti, 'setujui')}
                    onTolak={() => handleActionFromDetail(detailCuti, 'tolak')}
                    onBatalkan={() => handleActionFromDetail(detailCuti, 'batalkan')}
                />
            )}

            {selectedCuti && modalAction && (
                <ConfirmActionModal
                    cuti={selectedCuti}
                    action={modalAction}
                    processing={processing}
                    onCancel={() => {
                        setSelectedCuti(null);
                        setModalAction(null);
                    }}
                    onConfirm={confirmAction}
                />
            )}
        </AppLayout>
    );
}

interface CutiRowProps {
    cuti: Cuti;
    isApprover: boolean;
    isOwner: boolean;
    onDetail: () => void;
    onSetujui: () => void;
    onTolak: () => void;
    onBatalkan: () => void;
}

function CutiRow({ cuti, isApprover, isOwner, onDetail, onSetujui, onTolak, onBatalkan }: CutiRowProps) {
    const bisaDiproses = isApprover && cuti.status === 'menunggu';
    const bisaDibatalkan = isOwner && cuti.status === 'menunggu';

    return (
        <div className="flex items-center justify-between py-3">
            <div className="flex items-center gap-3">
                <div className="w-9 h-9 rounded-full bg-gray-100 flex items-center justify-center text-xs font-medium text-gray-700">
                    {initials(cuti.user.name)}
                </div>
                <div>
                    <p className="text-sm font-medium text-gray-900">{cuti.user.name}</p>
                    <p className="text-xs text-gray-500">
                        {formatTanggal(cuti.tanggal_mulai)} - {formatTanggal(cuti.tanggal_selesai)}
                    </p>
                </div>
            </div>
            <div className="flex items-center gap-3">
                <span className="text-xs text-gray-500 hidden sm:inline">{jenisLabels[cuti.jenis_cuti]}</span>
                <span className={`text-xs px-3 py-1 rounded-full ${statusStyles[cuti.status]}`}>
                    {statusLabels[cuti.status]}
                </span>
                <button
                    onClick={onDetail}
                    className="text-xs text-gray-600 hover:text-black border border-gray-200 rounded-lg px-3 py-1"
                >
                    Detail
                </button>
                {bisaDiproses && (
                    <>
                        <button onClick={onSetujui} className="text-xs text-green-600 hover:text-green-700">
                            Setujui
                        </button>
                        <button onClick={onTolak} className="text-xs text-red-600 hover:text-red-700">
                            Tolak
                        </button>
                    </>
                )}
                {bisaDibatalkan && (
                    <button onClick={onBatalkan} className="text-xs text-gray-500 hover:text-black">
                        Batalkan
                    </button>
                )}
            </div>
        </div>
    );
}

interface DetailModalProps {
    cuti: Cuti;
    isApprover: boolean;
    isOwner: boolean;
    onClose: () => void;
    onSetujui: () => void;
    onTolak: () => void;
    onBatalkan: () => void;
}

function DetailModal({ cuti, isApprover, isOwner, onClose, onSetujui, onTolak, onBatalkan }: DetailModalProps) {
    const bisaDiproses = isApprover && cuti.status === 'menunggu';
    const bisaDibatalkan = isOwner && cuti.status === 'menunggu';

    return (
        <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50 px-4">
            <div className="bg-white rounded-xl w-full max-w-md p-5">
                <div className="flex items-start justify-between mb-4">
                    <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-full bg-gray-100 flex items-center justify-center text-xs font-medium text-gray-700">
                            {initials(cuti.user.name)}
                        </div>
                        <div>
                            <p className="text-sm font-medium text-gray-900">{cuti.user.name}</p>
                            <p className="text-xs text-gray-500">{cuti.user.email}</p>
                        </div>
                    </div>
                    <button onClick={onClose} className="text-gray-400 hover:text-gray-600">
                        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                        </svg>
                    </button>
                </div>

                <div className="space-y-3 mb-5">
                    <div className="flex items-center justify-between">
                        <span className="text-xs text-gray-500">Status</span>
                        <span className={`text-xs px-3 py-1 rounded-full ${statusStyles[cuti.status]}`}>
                            {statusLabels[cuti.status]}
                        </span>
                    </div>
                    <div className="flex items-center justify-between">
                        <span className="text-xs text-gray-500">Jenis Cuti</span>
                        <span className="text-sm text-gray-900">{jenisLabels[cuti.jenis_cuti]}</span>
                    </div>
                    <div className="flex items-center justify-between">
                        <span className="text-xs text-gray-500">Tanggal</span>
                        <span className="text-sm text-gray-900">
                            {formatTanggal(cuti.tanggal_mulai)} - {formatTanggal(cuti.tanggal_selesai)}
                        </span>
                    </div>
                    <div className="flex items-center justify-between">
                        <span className="text-xs text-gray-500">Jumlah Hari</span>
                        <span className="text-sm text-gray-900">{cuti.jumlah_hari} hari</span>
                    </div>
                    <div>
                        <span className="text-xs text-gray-500">Alasan</span>
                        <p className="text-sm text-gray-900 mt-1 whitespace-pre-wrap bg-gray-50 border border-gray-100 rounded-lg p-3">
                            {cuti.alasan}
                        </p>
                    </div>
                </div>

                <div className="flex justify-end gap-2">
                    <button
                        onClick={onClose}
                        className="text-sm px-4 py-2 rounded-lg border border-gray-200 hover:bg-gray-50"
                    >
                        Tutup
                    </button>
                    {bisaDibatalkan && (
                        <button
                            onClick={onBatalkan}
                            className="text-sm px-4 py-2 rounded-lg border border-gray-200 text-gray-600 hover:bg-gray-50"
                        >
                            Batalkan
                        </button>
                    )}
                    {bisaDiproses && (
                        <>
                            <button
                                onClick={onTolak}
                                className="text-sm px-4 py-2 rounded-lg text-white bg-red-600 hover:bg-red-700"
                            >
                                Tolak
                            </button>
                            <button
                                onClick={onSetujui}
                                className="text-sm px-4 py-2 rounded-lg text-white bg-green-600 hover:bg-green-700"
                            >
                                Setujui
                            </button>
                        </>
                    )}
                </div>
            </div>
        </div>
    );
}

interface ConfirmActionModalProps {
    cuti: Cuti;
    action: 'setujui' | 'tolak' | 'batalkan';
    processing: boolean;
    onCancel: () => void;
    onConfirm: () => void;
}

const modalCopy: Record<'setujui' | 'tolak' | 'batalkan', { title: string; body: string; confirmLabel: string; confirmClass: string }> = {
    setujui: {
        title: 'Setujui pengajuan cuti?',
        body: 'akan disetujui dan karyawan akan diberitahu.',
        confirmLabel: 'Ya, setujui',
        confirmClass: 'bg-green-600 hover:bg-green-700',
    },
    tolak: {
        title: 'Tolak pengajuan cuti?',
        body: 'akan ditolak dan karyawan akan diberitahu.',
        confirmLabel: 'Ya, tolak',
        confirmClass: 'bg-red-600 hover:bg-red-700',
    },
    batalkan: {
        title: 'Batalkan pengajuan cuti?',
        body: 'akan dibatalkan dan tidak bisa dikembalikan.',
        confirmLabel: 'Ya, batalkan',
        confirmClass: 'bg-red-600 hover:bg-red-700',
    },
};

function ConfirmActionModal({ cuti, action, processing, onCancel, onConfirm }: ConfirmActionModalProps) {
    const copy = modalCopy[action];

    return (
        <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50 px-4">
            <div className="bg-white rounded-xl w-full max-w-sm p-5">
                <h2 className="text-base font-semibold text-gray-900 mb-1">{copy.title}</h2>
                <p className="text-sm text-gray-500 mb-5">
                    Pengajuan cuti <span className="font-medium text-gray-700">{cuti.user.name}</span> {copy.body}
                </p>
                <div className="flex justify-end gap-2">
                    <button
                        onClick={onCancel}
                        disabled={processing}
                        className="text-sm px-4 py-2 rounded-lg border border-gray-200 hover:bg-gray-50 disabled:opacity-50"
                    >
                        Batal
                    </button>
                    <button
                        onClick={onConfirm}
                        disabled={processing}
                        className={`text-sm px-4 py-2 rounded-lg text-white disabled:opacity-50 ${copy.confirmClass}`}
                    >
                        {processing ? 'Memproses...' : copy.confirmLabel}
                    </button>
                </div>
            </div>
        </div>
    );
}