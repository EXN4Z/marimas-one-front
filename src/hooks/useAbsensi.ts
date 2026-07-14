import { useQuery } from '@tanstack/react-query';
import { getKaryawanAktif, getAbsensiHariIni, getRiwayatAbsensi } from '../api/absensi';

export function useKaryawanAktif() {
  return useQuery({
    queryKey: ['karyawan-aktif'],
    queryFn: getKaryawanAktif,
  });
}

export function useAbsensiHariIni() {
  return useQuery({
    queryKey: ['absensi-hari-ini'],
    queryFn: getAbsensiHariIni,
  });
}

export function useRiwayatAbsensi(limit = 10) {
  return useQuery({
    queryKey: ['riwayat-absensi', limit],
    queryFn: () => getRiwayatAbsensi(limit),
  });
}