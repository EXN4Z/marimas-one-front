import { useEffect, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../api/axios';
import AppLayout from '../components/AppLayout';

type Role = 'admin' | 'hr' | 'manajer' | 'karyawan';
type Status = 'aktif' | 'nonaktif';

interface User {
    id: number;
    name: string;
    email: string;
    role: Role;
    status: Status;
}

const roleStyles: Record<Role, string> = {
    admin: 'bg-red-50 text-red-700',
    hr: 'bg-pink-50 text-pink-700',
    manajer: 'bg-purple-50 text-purple-700',
    karyawan: 'bg-teal-50 text-teal-700',
};

const roleLabels: Record<Role, string> = {
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

export default function KaryawanPage() {
    const navigate = useNavigate();
    const [users, setUsers] = useState<User[]>([]);
    const [loading, setLoading] = useState<boolean>(true);
    const [errorMsg, setErrorMsg] = useState<string>('');

    const [search, setSearch] = useState<string>('');
    const [role, setRole] = useState<Role | 'all'>('all');
    const [status, setStatus] = useState<Status | 'all'>('all');
    const [userToDelete, setUserToDelete] = useState<User | null>(null);
    const [deleting, setDeleting] = useState<boolean>(false);

    useEffect(() => {
        api
            .get<User[]>('/karyawan')
            .then((res) => setUsers(res.data))
            .catch((err) => {
                if (err.response?.status === 403) {
                    setErrorMsg('Anda tidak punya akses ke halaman ini.');
                } else {
                    setErrorMsg('Gagal memuat data. Coba lagi.');
                }
            })
            .finally(() => setLoading(false));
    }, []);

    const filtered = useMemo<User[]>(() => {
        const q = search.toLowerCase().trim();
        return users.filter((u) => {
            const matchSearch = u.name.toLowerCase().includes(q) || u.email.toLowerCase().includes(q);
            const matchRole = role === 'all' || u.role === role;
            const matchStatus = status === 'all' || u.status === status;
            return matchSearch && matchRole && matchStatus;
        });
    }, [users, search, role, status]);

    async function confirmDelete() {
        if (!userToDelete) return;

        setDeleting(true);
        try {
            await api.delete(`/karyawan/${userToDelete.id}`);
            setUsers((prev) => prev.filter((u) => u.id !== userToDelete.id));
            setUserToDelete(null);
        } catch (err: any) {
            if (err.response?.status === 403) {
                setErrorMsg('Anda tidak punya akses untuk menghapus karyawan ini.');
            } else {
                setErrorMsg('Gagal menghapus karyawan. Coba lagi.');
            }
            setUserToDelete(null);
        } finally {
            setDeleting(false);
        }
    }

    const stats = useMemo(
        () => ({
            total: users.length,
            karyawan: users.filter((u) => u.role === 'karyawan').length,
            manajer: users.filter((u) => u.role === 'manajer' || u.role === 'hr').length,
            admin: users.filter((u) => u.role === 'admin').length,
        }),
        [users]
    );

    return (
        <AppLayout title="Data Karyawan">
            <div className="max-w-6xl mx-auto">
                <div className="flex items-center justify-between flex-wrap gap-3 mb-6">
                    <div>
                        <h1 className="text-xl font-bold text-gray-900">Data Karyawan</h1>
                        <p className="text-sm text-gray-500 mt-1">Kelola data seluruh pengguna sistem.</p>
                    </div>
                    <button
                        onClick={() => navigate('/karyawan/create')}
                        className="flex items-center gap-2 bg-black text-white text-sm px-4 py-2 rounded-lg hover:bg-gray-800"
                    >
                        + Tambah Karyawan
                    </button>
                </div>

                <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-6">
                    <StatCard label="Total Pengguna" value={stats.total} />
                    <StatCard label="Karyawan" value={stats.karyawan} />
                    <StatCard label="Manajer / HR" value={stats.manajer} />
                    <StatCard label="Admin" value={stats.admin} />
                </div>

                <div className="bg-white border border-gray-200 rounded-xl p-4">
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
                                placeholder="Cari nama atau email..."
                                value={search}
                                onChange={(e) => setSearch(e.target.value)}
                                className="w-full pl-9 pr-3 py-2 text-sm border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-black/10"
                            />
                        </div>
                        <select
                            value={role}
                            onChange={(e) => setRole(e.target.value as Role | 'all')}
                            className="text-sm border border-gray-200 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-black/10"
                        >
                            <option value="all">Semua Role</option>
                            <option value="karyawan">Karyawan</option>
                            <option value="manajer">Manajer</option>
                            <option value="hr">HR</option>
                            <option value="admin">Admin</option>
                        </select>
                        <select
                            value={status}
                            onChange={(e) => setStatus(e.target.value as Status | 'all')}
                            className="text-sm border border-gray-200 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-black/10"
                        >
                            <option value="all">Semua Status</option>
                            <option value="aktif">Aktif</option>
                            <option value="nonaktif">Nonaktif</option>
                        </select>
                    </div>

                    {loading && <p className="text-center text-sm text-gray-400 py-8">Memuat data...</p>}

                    {!loading && errorMsg && <p className="text-center text-sm text-gray-400 py-8">{errorMsg}</p>}

                    {!loading && !errorMsg && filtered.length === 0 && (
                        <p className="text-center text-sm text-gray-400 py-8">Tidak ada karyawan yang cocok dengan filter ini.</p>
                    )}

                    {!loading && !errorMsg && filtered.length > 0 && (
                        <div className="divide-y divide-gray-100">
                            {filtered.map((user) => (
                                <UserRow
                                    key={user.id}
                                    user={user}
                                    onDelete={() => setUserToDelete(user)}
                                    onEdit={() => navigate(`/karyawan/${user.id}/edit`)}
                                />
                            ))}
                        </div>
                    )}
                </div>
            </div>

            {userToDelete && (
                <ConfirmDeleteModal
                    user={userToDelete}
                    deleting={deleting}
                    onCancel={() => setUserToDelete(null)}
                    onConfirm={confirmDelete}
                />
            )}
        </AppLayout>
    );
}

function StatCard({ label, value }: { label: string; value: number }) {
    return (
        <div className="bg-gray-50 rounded-lg p-4">
            <p className="text-xs text-gray-500 mb-1">{label}</p>
            <p className="text-2xl font-semibold text-gray-900">{value}</p>
        </div>
    );
}

interface UserRowProps {
    user: User;
    onDelete: () => void;
    onEdit: () => void;
}

function UserRow({ user, onDelete, onEdit }: UserRowProps) {
    const isAktif = user.status === 'aktif';

    return (
        <div className="flex items-center justify-between py-3">
            <div className="flex items-center gap-3">
                <div className="w-9 h-9 rounded-full bg-gray-100 flex items-center justify-center text-xs font-medium text-gray-700">
                    {initials(user.name)}
                </div>
                <div>
                    <p className="text-sm font-medium text-gray-900">{user.name}</p>
                    <p className="text-xs text-gray-500">{user.email}</p>
                </div>
            </div>
            <div className="flex items-center gap-3">
                <span className={`text-xs px-3 py-1 rounded-full ${roleStyles[user.role]}`}>
                    {roleLabels[user.role]}
                </span>
                <span className={`text-xs flex items-center gap-1 ${isAktif ? 'text-green-600' : 'text-gray-400'}`}>
                    <span className={`w-1.5 h-1.5 rounded-full ${isAktif ? 'bg-green-500' : 'bg-gray-300'}`} />
                    {isAktif ? 'Aktif' : 'Nonaktif'}
                </span>
                <button onClick={onEdit} className="text-xs text-gray-500 hover:text-black">
                    Edit
                </button>
                <button onClick={onDelete} className="text-xs text-red-600 hover:text-red-700">
                    Hapus
                </button>
            </div>
        </div>
    );
}

interface ConfirmDeleteModalProps {
    user: User;
    deleting: boolean;
    onCancel: () => void;
    onConfirm: () => void;
}

function ConfirmDeleteModal({ user, deleting, onCancel, onConfirm }: ConfirmDeleteModalProps) {
    return (
        <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50 px-4">
            <div className="bg-white rounded-xl w-full max-w-sm p-5">
                <h2 className="text-base font-semibold text-gray-900 mb-1">Hapus karyawan?</h2>
                <p className="text-sm text-gray-500 mb-5">
                    <span className="font-medium text-gray-700">{user.name}</span> akan dihapus permanen dan
                    tidak bisa dikembalikan.
                </p>
                <div className="flex justify-end gap-2">
                    <button
                        onClick={onCancel}
                        disabled={deleting}
                        className="text-sm px-4 py-2 rounded-lg border border-gray-200 hover:bg-gray-50 disabled:opacity-50"
                    >
                        Batal
                    </button>
                    <button
                        onClick={onConfirm}
                        disabled={deleting}
                        className="text-sm px-4 py-2 rounded-lg bg-red-600 text-white hover:bg-red-700 disabled:opacity-50"
                    >
                        {deleting ? 'Menghapus...' : 'Ya, hapus'}
                    </button>
                </div>
            </div>
        </div>
    );
}