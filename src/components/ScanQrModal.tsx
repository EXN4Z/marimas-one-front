import { useEffect, useRef, useState } from 'react';
import { Html5Qrcode } from 'html5-qrcode';
import { X, ScanLine, AlertCircle } from 'lucide-react';

interface ScanQrModalProps {
  onClose: () => void;
  onScanSuccess: (decodedText: string) => void;
}

const SCANNER_ELEMENT_ID = 'qr-scanner-region';

export default function ScanQrModal({ onClose, onScanSuccess }: ScanQrModalProps) {
  const [error, setError] = useState('');
  const html5QrCodeRef = useRef<Html5Qrcode | null>(null);
  const hasHandledScan = useRef(false);
  const isRunningRef = useRef(false); // true hanya setelah start() beneran resolve (kamera nyala)

  useEffect(() => {
    hasHandledScan.current = false;
    isRunningRef.current = false;
    let cancelled = false;

    const html5QrCode = new Html5Qrcode(SCANNER_ELEMENT_ID);
    html5QrCodeRef.current = html5QrCode;

    const stopSafely = () => {
      if (!isRunningRef.current) return;
      isRunningRef.current = false;
      try {
        html5QrCode
          .stop()
          .then(() => html5QrCode.clear())
          .catch(() => {
            // aman diabaikan
          });
      } catch (e) {
        // stop() bisa throw sinkron kalau state-nya ternyata belum/nggak scanning
      }
    };

    html5QrCode
      .start(
        { facingMode: 'environment' },
        { fps: 10, qrbox: { width: 250, height: 250 } },
        (decodedText) => {
          // Cegah callback kepanggil berkali-kali untuk 1x scan yang sama
          if (hasHandledScan.current) return;
          hasHandledScan.current = true;
          onScanSuccess(decodedText);
        },
        () => {
          // Callback ini dipanggil terus-menerus saat frame belum ketemu QR,
          // sengaja dibiarkan kosong (bukan error beneran).
        }
      )
      .then(() => {
        isRunningRef.current = true;
        if (cancelled) {
          // Komponen sudah unmount (misal React StrictMode di dev mode
          // mount->unmount->mount) sebelum kamera selesai nyala -> matiin lagi.
          stopSafely();
        }
      })
      .catch((err) => {
        if (cancelled) return;
        console.error(err);
        setError('Tidak bisa mengakses kamera. Pastikan izin kamera diizinkan.');
      });

    return () => {
      cancelled = true;
      stopSafely();
    };
  }, []);

  return (
    <div className="fixed inset-0 bg-black/60 z-50 flex items-center justify-center px-4">
      <div className="bg-white rounded-xl shadow-xl w-full max-w-sm p-6">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-base font-semibold text-slate-900 flex items-center gap-2">
            <ScanLine size={18} />
            Scan QR Barang
          </h3>
          <button onClick={onClose} className="text-slate-400 hover:text-slate-600">
            <X size={20} />
          </button>
        </div>

        <div
          id={SCANNER_ELEMENT_ID}
          className="w-full rounded-lg overflow-hidden bg-slate-900 min-h-[250px]"
        />

        {error && (
          <div className="mt-3 flex items-start gap-2 text-sm text-red-600 bg-red-50 border border-red-200 rounded-lg px-3 py-2">
            <AlertCircle size={16} className="flex-shrink-0 mt-0.5" />
            <span>{error}</span>
          </div>
        )}

        <p className="text-[11px] text-slate-400 text-center mt-3">
          Arahkan kamera ke QR code pada label barang.
        </p>
      </div>
    </div>
  );
}