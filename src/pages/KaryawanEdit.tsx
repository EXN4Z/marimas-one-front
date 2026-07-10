import { useEffect, useState, type FormEvent } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import api from '../api/axios';
import AppLayout from '../components/AppLayout';

type Role = 'admin' | 'hr' | 'manajer' | 'karyawan';
type Status = 'aktif' | 'nonaktif';

interface User {
    id: number;
    name: string;
    email: string;
    phone: string;
    role: Role;
    status: Status;
}

interface FormState {
    name: string;
    email: string;
    phone: string;
    role: Role;
    status: Status;
    password: string;
}

interface FieldErrors {
    [key: string]: string[];
}

const initialForm: FormState = {
    name: '',
    email: '',
    phone: '',
    role: 'karyawan',
    status: 'aktif',
    password: '',
};

export default function EditKaryawanPage() {
    const { id } = useParams<{ id: string }>();
    const navigate = useNavigate();

    const [form, setForm] = useState<FormState>(initialForm);
    const [loading, setLoading] = useState<boolean>(true);
    const [saving, setSaving] = useState<boolean>(false);
    const [errors, setErrors] = useState<FieldErrors>({});
    const [errorMsg, setErrorMsg] = useState<string>('');

    useEffect(() => {
        api
            .get<User>(`/karyawan/${id}`)
            .then((res) => {
                const u = res.data;
                setForm({
                    name: u.name,
                    email: u.email,
                    phone: u.phone ?? '',
                    role: u.role,
                    status: u.status,
                    password: '',
                });
            })
            .catch(() => {
                setErrorMsg('Gagal memuat data karyawan.');
            })
            .finally(() => setLoading(false));
    }, [id]);

    function handleChange<K extends keyof FormState>(key: K, value: FormState[K]) {
        setForm((prev) => ({ ...prev, [key]: value }));
        if (errors[key]) {
            setErrors((prev) => {
                const next = { ...prev };
                delete next[key];
                return next;
            });
        }
    }

    async function handleSubmit(e: FormEvent) {
        e.preventDefault();
        setSaving(true);
        setErrorMsg('');
        setErrors({});

        const payload: Partial<FormState> = { ...form };
        if (!payload.password) {
            delete payload.password;
        }

        try {
            await api.put(`/karyawan/${id}`, payload);
            navigate('/karyawan');
        } catch (err: any) {
            if (err.response?.status === 422) {
                setErrors(err.response.data.errors ?? {});
            } else if (err.response?.status === 403) {
                setErrorMsg('Anda tidak punya akses untuk mengubah data ini.');
            } else {
                setErrorMsg('Gagal menyimpan perubahan. Coba lagi.');
            }
        } finally {
            setSaving(false);
        }
    }

    async function handleDelete() {
        if (!window.confirm('Hapus karyawan ini? Tindakan ini tidak bisa dibatalkan.')) return;

        try {
            await api.delete(`/karyawan/${id}`);
            navigate('/karyawan');
        } catch {
            setErrorMsg('Gagal menghapus karyawan.');
        }
    }

    if (loading) {
        return (
            <AppLayout title="Edit Karyawan">
                <p className="text-center text-sm text-gray-400 py-16">Memuat data...</p>
            </AppLayout>
        );
    }

    return (
        <AppLayout title="Edit Karyawan">
            <div className="max-w-xl mx-auto">
                <div className="flex items-center justify-between mb-6">
                    <div>
                        <h1 className="text-xl font-bold text-gray-900">Edit Karyawan</h1>
                        <p className="text-sm text-gray-500 mt-1">Perbarui data pengguna ini.</p>
                    </div>
                    <button
                        onClick={() => navigate('/karyawan')}
                        className="text-sm text-gray-500 hover:text-black"
                    >
                        Kembali
                    </button>
                </div>

                {errorMsg && (
                    <div className="bg-red-50 text-red-700 text-sm rounded-lg px-4 py-3 mb-4">{errorMsg}</div>
                )}

                <form onSubmit={handleSubmit} className="bg-white border border-gray-200 rounded-xl p-5 space-y-4">
                    <Field label="Nama" error={errors.name?.[0]}>
                        <input
                            type="text"
                            value={form.name}
                            onChange={(e) => handleChange('name', e.target.value)}
                            className="w-full text-sm border border-gray-200 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-black/10"
                            required
                        />
                    </Field>

                    <Field label="Email" error={errors.email?.[0]}>
                        <input
                            type="email"
                            value={form.email}
                            onChange={(e) => handleChange('email', e.target.value)}
                            className="w-full text-sm border border-gray-200 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-black/10"
                            required
                        />
                    </Field>

                    <Field label="Nomor Telepon" error={errors.phone?.[0]}>
                        <input
                            type="text"
                            value={form.phone}
                            onChange={(e) => handleChange('phone', e.target.value)}
                            className="w-full text-sm border border-gray-200 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-black/10"
                        />
                    </Field>

                    <div className="grid grid-cols-2 gap-4">
                        <Field label="Role" error={errors.role?.[0]}>
                            <select
                                value={form.role}
                                onChange={(e) => handleChange('role', e.target.value as Role)}
                                className="w-full text-sm border border-gray-200 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-black/10"
                            >
                                <option value="karyawan">Karyawan</option>
                                <option value="manajer">Manajer</option>
                                <option value="hr">HR</option>
                                <option value="admin">Admin</option>
                            </select>
                        </Field>

                        <Field label="Status" error={errors.status?.[0]}>
                            <select
                                value={form.status}
                                onChange={(e) => handleChange('status', e.target.value as Status)}
                                className="w-full text-sm border border-gray-200 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-black/10"
                            >
                                <option value="aktif">Aktif</option>
                                <option value="nonaktif">Nonaktif</option>
                            </select>
                        </Field>
                    </div>

                    <Field label="Password baru (opsional)" error={errors.password?.[0]}>
                        <input
                            type="password"
                            value={form.password}
                            onChange={(e) => handleChange('password', e.target.value)}
                            placeholder="Kosongkan jika tidak ingin mengganti"
                            className="w-full text-sm border border-gray-200 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-black/10"
                        />
                    </Field>

                    <div className="flex items-center justify-between pt-2">
                        <button
                            type="button"
                            onClick={handleDelete}
                            className="text-sm text-red-600 hover:text-red-700"
                        >
                            Hapus karyawan
                        </button>

                        <div className="flex gap-2">
                            <button
                                type="button"
                                onClick={() => navigate('/karyawan')}
                                className="text-sm px-4 py-2 rounded-lg border border-gray-200 hover:bg-gray-50"
                            >
                                Batal
                            </button>
                            <button
                                type="submit"
                                disabled={saving}
                                className="text-sm px-4 py-2 rounded-lg bg-black text-white hover:bg-gray-800 disabled:opacity-50"
                            >
                                {saving ? 'Menyimpan...' : 'Simpan Perubahan'}
                            </button>
                        </div>
                    </div>
                </form>
            </div>
        </AppLayout>
    );
}

function Field({ label, error, children }: { label: string; error?: string; children: React.ReactNode }) {
    return (
        <div>
            <label className="block text-xs font-medium text-gray-500 mb-1">{label}</label>
            {children}
            {error && <p className="text-xs text-red-600 mt-1">{error}</p>}
        </div>
    );
}