import { useState, type FormEvent } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../api/axios';
import AppLayout from '../components/AppLayout';

type Role = 'admin' | 'hr' | 'manajer' | 'karyawan';
type Status = 'aktif' | 'nonaktif';

interface FormState {
    name: string;
    email: string;
    phone: string;
    role: Role;
    status: Status;
    password: string;
    password_confirmation: string;
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
    password_confirmation: '',
};

export default function CreateKaryawanPage() {
    const navigate = useNavigate();

    const [form, setForm] = useState<FormState>(initialForm);
    const [saving, setSaving] = useState<boolean>(false);
    const [errors, setErrors] = useState<FieldErrors>({});
    const [errorMsg, setErrorMsg] = useState<string>('');

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

        try {
            await api.post('/karyawan', form);
            navigate('/karyawan');
        } catch (err: any) {
            if (err.response?.status === 422) {
                setErrors(err.response.data.errors ?? {});
            } else if (err.response?.status === 403) {
                setErrorMsg('Anda tidak punya akses untuk menambah karyawan.');
            } else {
                setErrorMsg('Gagal menyimpan karyawan. Coba lagi.');
            }
        } finally {
            setSaving(false);
        }
    }

    return (
        <AppLayout title="Tambah Karyawan">
            <div className="max-w-xl mx-auto">
                <div className="flex items-center justify-between mb-6">
                    <div>
                        <h1 className="text-xl font-bold text-gray-900">Tambah Karyawan</h1>
                        <p className="text-sm text-gray-500 mt-1">Buat akun pengguna baru untuk sistem.</p>
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

                    <Field label="Password" error={errors.password?.[0]}>
                        <input
                            type="password"
                            value={form.password}
                            onChange={(e) => handleChange('password', e.target.value)}
                            className="w-full text-sm border border-gray-200 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-black/10"
                            required
                        />
                    </Field>

                    <Field label="Konfirmasi Password" error={errors.password_confirmation?.[0]}>
                        <input
                            type="password"
                            value={form.password_confirmation}
                            onChange={(e) => handleChange('password_confirmation', e.target.value)}
                            className="w-full text-sm border border-gray-200 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-black/10"
                            required
                        />
                    </Field>

                    <div className="flex justify-end gap-2 pt-2">
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
                            {saving ? 'Menyimpan...' : 'Simpan Karyawan'}
                        </button>
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