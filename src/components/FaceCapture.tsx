import { useEffect, useRef, useState } from 'react';
import { Camera, RotateCcw } from 'lucide-react';
import { loadFaceModels, getFaceDescriptor, euclideanDistance, FACE_MATCH_THRESHOLD } from '../lib/faceApi';

type Props = {
  referenceDescriptor: number[] | null; // BARU: descriptor wajah terdaftar milik karyawan ini
  onCapture: (photo: Blob, lat: number, lng: number, faceVerified: boolean, matchDistance: number) => void;
  onReset?: () => void;
};

export default function FaceCapture({ referenceDescriptor, onCapture, onReset }: Props) {
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const streamRef = useRef<MediaStream | null>(null);

  const [modelsReady, setModelsReady] = useState(false);
  const [captured, setCaptured] = useState<string | null>(null);
  const [error, setError] = useState('');
  const [processing, setProcessing] = useState(false);
  const [locating, setLocating] = useState(false);

  useEffect(() => {
    loadFaceModels()
      .then(() => setModelsReady(true))
      .catch(() => setError('Gagal memuat model deteksi wajah.'));

    navigator.mediaDevices
      .getUserMedia({ video: { facingMode: 'user' } })
      .then((stream) => {
        streamRef.current = stream;
        if (videoRef.current) videoRef.current.srcObject = stream;
      })
      .catch(() => setError('Tidak bisa mengakses kamera. Izinkan akses kamera di browser.'));

    return () => {
      streamRef.current?.getTracks().forEach((t) => t.stop());
    };
  }, []);

  const ambilFoto = async () => {
    if (!videoRef.current || !canvasRef.current || !modelsReady || !referenceDescriptor) return;
    setError('');
    setProcessing(true);

    const ctx = canvasRef.current.getContext('2d');
    if (!ctx) return;
    ctx.drawImage(videoRef.current, 0, 0, 320, 240);

    try {
      const descriptor = await getFaceDescriptor(canvasRef.current);
      if (!descriptor) {
        setError('Wajah tidak terdeteksi. Pastikan wajah terlihat jelas dan pencahayaan cukup.');
        setProcessing(false);
        return;
      }

      const distance = euclideanDistance(descriptor, referenceDescriptor);
      const verified = distance <= FACE_MATCH_THRESHOLD;

      if (!verified) {
        setError(`Wajah tidak cocok dengan data terdaftar. Coba lagi dengan pencahayaan lebih baik.`);
        setProcessing(false);
        return;
      }

      setCaptured(canvasRef.current.toDataURL('image/jpeg', 0.9));
      setLocating(true);

      navigator.geolocation.getCurrentPosition(
        (pos) => {
          canvasRef.current!.toBlob(
            (blob) => {
              if (blob) {
                onCapture(blob, pos.coords.latitude, pos.coords.longitude, verified, distance);
              } else {
                setError('Gagal memproses foto. Coba lagi.');
                setCaptured(null);
              }
              setLocating(false);
              setProcessing(false);
            },
            'image/jpeg',
            0.9
          );
        },
        () => {
          setError('Gagal mengambil lokasi GPS. Aktifkan izin lokasi di browser.');
          setLocating(false);
          setProcessing(false);
          setCaptured(null);
        },
        { enableHighAccuracy: true, timeout: 10000 }
      );
    } catch {
      setError('Gagal memproses deteksi wajah. Coba lagi.');
      setProcessing(false);
    }
  };

  const ulangi = () => {
    setCaptured(null);
    setError('');
    onReset?.();
  };

  if (!referenceDescriptor) {
    return (
      <p className="text-sm text-amber-700 bg-amber-50 border border-amber-200 rounded-lg px-3 py-3 text-center">
        Karyawan ini belum mendaftarkan wajah. Daftarkan wajah dulu sebelum bisa absen.
      </p>
    );
  }

  return (
    <div className="flex flex-col items-center gap-3 w-full">
      <div className="relative w-full rounded-lg overflow-hidden bg-slate-900" style={{ aspectRatio: '4/3' }}>
        <video
          ref={videoRef}
          autoPlay
          playsInline
          muted
          className={`w-full h-full object-cover ${captured ? 'hidden' : ''}`}
        />
        {captured && <img src={captured} alt="Foto absen" className="w-full h-full object-cover" />}
      </div>
      <canvas ref={canvasRef} width={320} height={240} className="hidden" />

      {error && (
        <p className="text-xs text-red-600 bg-red-50 border border-red-200 rounded-lg px-3 py-2 w-full text-center">
          {error}
        </p>
      )}

      {!captured ? (
        <button
          onClick={ambilFoto}
          type="button"
          disabled={!modelsReady || processing}
          className="flex items-center gap-2 bg-slate-900 text-white text-sm font-semibold px-4 py-2.5 rounded-lg hover:bg-slate-800 transition w-full justify-center disabled:opacity-40"
        >
          <Camera size={16} />
          {processing ? 'Memverifikasi wajah...' : modelsReady ? 'Ambil Foto' : 'Memuat model...'}
        </button>
      ) : (
        <button
          onClick={ulangi}
          type="button"
          disabled={locating}
          className="flex items-center gap-2 text-slate-600 text-sm px-4 py-2 hover:text-slate-800 transition disabled:opacity-50"
        >
          <RotateCcw size={14} />
          {locating ? 'Memproses lokasi...' : 'Ambil ulang'}
        </button>
      )}
    </div>
  );
}