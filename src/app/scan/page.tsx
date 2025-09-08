'use client';

import { useState, useEffect, useRef, useCallback } from 'react';
import QRScanner from 'qr-scanner';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent } from '@/components/ui/card';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { toast } from 'sonner';
import {
  Loader2,
  QrCode,
  MapPin,
  Smartphone,
  AlertCircle,
  Upload,
  Camera,
  ImageIcon,
} from 'lucide-react';
import { motion } from 'framer-motion';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';

// -------------------------
// Types
// -------------------------
type Session = {
  id: string;
  title: string;
  latitude: number;
  longitude: number;
  expiresAt: string;
  createdAt: string;
};

type AttendanceSubmitOk = { ok: true; message?: string };
type AttendanceSubmitErr = { ok: false; error: string };
type AttendanceSubmitResponse = AttendanceSubmitOk | AttendanceSubmitErr;

// Helper to strongly type res.json() without introducing any
async function jsonOf<T>(res: Response): Promise<T> {
  // res.json is typed as Promise<any> by lib.dom.d.ts — explicit generic narrows it
  return (await res.json()) as T;
}

export default function ScanPage() {
  const [sessionId, setSessionId] = useState<string | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [nim, setNim] = useState('');
  const [location, setLocation] = useState<{ lat: number; lng: number } | null>(null);
  const [deviceId, setDeviceId] = useState('');
  const [isScanning, setIsScanning] = useState(true);
  const [isLoading, setIsLoading] = useState(false);
  const [showDialog, setShowDialog] = useState(false);
  const [activeTab, setActiveTab] = useState<'camera' | 'upload'>('camera');

  const videoRef = useRef<HTMLVideoElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const scannerRef = useRef<QRScanner | null>(null);
  const isScannerActiveRef = useRef<boolean>(false);

  // -------------------------
  // QR Success / Error
  // -------------------------
  const onScanSuccess = useCallback(async (result: QRScanner.ScanResult) => {
    const decodedText = result.data;
    setSessionId(decodedText);
    setIsScanning(false);
    await processSession(decodedText);
  }, []);

  const onScanError = useCallback((error: unknown) => {
    // We don't want to spam toasts; keep it quiet unless needed
    // eslint-disable-next-line no-console
    console.warn('Scan Error:', error);
  }, []);

  // -------------------------
  // Init Fingerprint + Scanner mount/unmount
  // -------------------------
  useEffect(() => {
    // Device fingerprint
    (async () => {
      try {
        const FingerprintJS = await import('@fingerprintjs/fingerprintjs');
        const fp = await FingerprintJS.load();
        const result = await fp.get();
        setDeviceId(result.visitorId);
      } catch (e) {
        // eslint-disable-next-line no-console
        console.error('Fingerprint init failed:', e);
      }
    })();

    // Create scanner if camera tab is active
    if (activeTab === 'camera' && videoRef.current) {
      scannerRef.current = new QRScanner(videoRef.current, onScanSuccess, {
        onDecodeError: onScanError,
        highlightScanRegion: true,
        highlightCodeOutline: true,
      });

      scannerRef.current
        .start()
        .then(() => {
          isScannerActiveRef.current = true;
          setIsScanning(true);
        })
        .catch((e) => {
          // eslint-disable-next-line no-console
          console.error('Scanner start failed:', e);
          toast.error('Kamera tidak dapat diakses. Periksa izin kamera.');
          isScannerActiveRef.current = false;
          setIsScanning(false);
        });
    }

    // Cleanup on unmount or deps change
    return () => {
      if (scannerRef.current) {
        try {
          scannerRef.current.stop();
        } catch {
          /* noop */
        }
        scannerRef.current.destroy();
        scannerRef.current = null;
        isScannerActiveRef.current = false;
      }
    };
  }, [activeTab, onScanSuccess, onScanError]);

  // -------------------------
  // Keep scanner state in sync when switching tabs
  // -------------------------
  useEffect(() => {
    if (activeTab === 'camera') {
      if (videoRef.current && !scannerRef.current) {
        // Create if missing
        scannerRef.current = new QRScanner(videoRef.current, onScanSuccess, {
          onDecodeError: onScanError,
          highlightScanRegion: true,
          highlightCodeOutline: true,
        });
      }
      if (scannerRef.current && !isScannerActiveRef.current) {
        scannerRef.current
          .start()
          .then(() => {
            isScannerActiveRef.current = true;
            setIsScanning(true);
          })
          .catch((e) => {
            // eslint-disable-next-line no-console
            console.error('Scanner start failed:', e);
            toast.error('Kamera tidak dapat diakses. Periksa izin kamera.');
            isScannerActiveRef.current = false;
            setIsScanning(false);
          });
      }
    } else {
      if (scannerRef.current && isScannerActiveRef.current) {
        scannerRef.current.stop();
        isScannerActiveRef.current = false;
        setIsScanning(false);
      }
    }
  }, [activeTab, onScanSuccess, onScanError]);

  // -------------------------
  // Session fetch + location
  // -------------------------
  const processSession = async (id: string) => {
    try {
      const res = await fetch(`/api/session/${id}`);
      if (!res.ok) {
        const { error } = (await jsonOf<{ error?: string }>(res)) ?? {};
        toast.error(error || 'Sesi tidak valid atau telah kadaluarsa');
        if (activeTab === 'camera') setIsScanning(true);
        return;
      }

      const data = await jsonOf<Session>(res);
      setSession(data);
      getLocation();
      setShowDialog(true);
    } catch (e) {
      // eslint-disable-next-line no-console
      console.error('processSession failed', e);
      toast.error('Gagal memuat data sesi');
      if (activeTab === 'camera') setIsScanning(true);
    }
  };

  const getLocation = () => {
    if (!navigator.geolocation) {
      toast.error('Geolocation tidak didukung perangkat ini');
      return;
    }

    navigator.geolocation.getCurrentPosition(
      (pos) => {
        setLocation({
          lat: pos.coords.latitude,
          lng: pos.coords.longitude,
        });
      },
      (err) => {
        // eslint-disable-next-line no-console
        console.error('Geolocation error:', err);
        toast.error('Tidak dapat mengambil lokasi Anda');
      },
      {
        enableHighAccuracy: true,
        timeout: 5000,
        maximumAge: 0,
      }
    );
  };

  // -------------------------
  // Submit attendance
  // -------------------------
  const submitAttendance = async () => {
    if (!nim || !location || !deviceId) {
      toast.error('Data tidak lengkap. Pastikan NIM, lokasi, dan perangkat terdeteksi');
      return;
    }

    setIsLoading(true);
    try {
      const res = await fetch('/api/attendance/submit', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          sessionId,
          nim,
          latitude: location.lat,
          longitude: location.lng,
          deviceId,
        }),
      });

      const data = await jsonOf<AttendanceSubmitResponse>(res);
      setIsLoading(false);

      if (res.ok && data.ok) {
        toast.success(data.message || 'Absensi berhasil disimpan!');
        setTimeout(() => {
          window.location.href = `/history/${nim}`;
        }, 1500);
      } else {
        const errMsg =
          !res.ok
            ? (data as AttendanceSubmitErr)?.error || 'Gagal menyimpan absensi'
            : 'Gagal menyimpan absensi';
        toast.error(errMsg);
      }
    } catch (e) {
      setIsLoading(false);
      // eslint-disable-next-line no-console
      console.error('submitAttendance failed', e);
      toast.error('Terjadi kesalahan jaringan saat menyimpan absensi');
    }
  };

  // -------------------------
  // UI helpers
  // -------------------------
  const handleRescan = () => {
    setShowDialog(false);
    if (activeTab === 'camera') {
      setIsScanning(true);
      if (scannerRef.current && !isScannerActiveRef.current) {
        scannerRef.current
          .start()
          .then(() => {
            isScannerActiveRef.current = true;
          })
          .catch((e) => {
            // eslint-disable-next-line no-console
            console.error('Scanner restart failed:', e);
            toast.error('Tidak bisa memulai ulang kamera');
          });
      }
    }
  };

  const handleFileUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    try {
      const qrCodeData = (await QRScanner.scanImage(file)) as string | null;
      if (qrCodeData) {
        setSessionId(qrCodeData);
        await processSession(qrCodeData);

        if (fileInputRef.current) {
          fileInputRef.current.value = '';
        }

        toast.success('QR Code berhasil dibaca!');
      } else {
        toast.error('Tidak dapat membaca QR Code dari gambar. Pastikan gambar jelas dan fokus.');
      }
    } catch (error: unknown) {
      // eslint-disable-next-line no-console
      console.error('Error scanning image:', error);
      toast.error(
        'Gagal membaca QR Code. Pastikan format gambar didukung (JPG, PNG, GIF) dan QR Code terlihat jelas.'
      );
    }
  };

  const triggerFileInput = () => {
    fileInputRef.current?.click();
  };

  const isExpired = session?.expiresAt ? new Date() > new Date(session.expiresAt) : false;

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 p-4 md:p-6 flex items-center justify-center">
      <div className="max-w-md w-full">
        {/* Hero Header — Compact */}
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
          className="text-center mb-6"
        >
          <div className="w-20 h-20 md:w-36 md:h-36 bg-gradient-to-br from-blue-500 to-purple-600 rounded-xl flex items-center justify-center mx-auto shadow-sm mb-3">
            <QrCode className="h-12 w-12 md:w-26 md:h-26 text-white" />
          </div>
          <h1 className="text-4xl md:text-5xl font-bold text-gray-800">Absen dengan QR</h1>
          <p className="text-large md:text-xl text-gray-600 mt-2">Scan langsung atau upload gambar</p>
        </motion.div>

        {/* Tabs — Compact */}
        <Tabs value={activeTab} onValueChange={(v) => setActiveTab(v as 'camera' | 'upload')} className="mb-5">
          <TabsList className="grid w-full grid-cols-2 h-11">
            <TabsTrigger value="camera" className="text-xs font-medium">
              <Camera className="h-3.5 w-3.5 mr-1" />
              Kamera
            </TabsTrigger>
            <TabsTrigger value="upload" className="text-xs font-medium">
              <Upload className="h-3.5 w-3.5 mr-1" />
              Upload
            </TabsTrigger>
          </TabsList>

          {/* Camera Tab */}
          <TabsContent value="camera">
            {isScanning && (
              <motion.div initial={{ opacity: 0, scale: 0.98 }} animate={{ opacity: 1, scale: 1 }} className="mb-5">
                <Card className="border border-gray-200 overflow-hidden rounded-xl bg-black">
                  <CardContent className="p-0">
                    <div className="relative aspect-square">
                      <video ref={videoRef} className="w-full h-full object-cover" />
                      <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
                        <div className="border border-blue-400 border-dashed rounded-lg w-3/4 h-3/4 opacity-70" />
                      </div>
                      <div className="absolute bottom-2 left-0 right-0 text-center">
                        <p className="text-white text-[10px]">Arahkan ke QR Code</p>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </motion.div>
            )}
          </TabsContent>

          {/* Upload Tab */}
          <TabsContent value="upload">
            <Card
              className="border border-gray-200 hover:border-green-300 transition-colors rounded-xl cursor-pointer"
              onClick={triggerFileInput}
            >
              <CardContent className="p-5 text-center">
                <ImageIcon className="h-8 w-8 text-gray-400 mx-auto mb-2" />
                <h3 className="text-sm font-medium text-gray-700">Upload QR Code</h3>
                <p className="text-[10px] text-gray-500 mt-1">JPG, PNG, atau GIF</p>
                <input
                  ref={fileInputRef}
                  type="file"
                  accept="image/*"
                  onChange={handleFileUpload}
                  className="hidden"
                />
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>

        {/* Dialog */}
        <Dialog open={showDialog} onOpenChange={setShowDialog}>
          <DialogContent className="sm:max-w-md p-5">
            <DialogHeader className="mb-4">
              <DialogTitle className="text-lg font-bold flex items-center">
                <QrCode className="h-4 w-4 mr-2 text-blue-600" />
                Konfirmasi Absensi
              </DialogTitle>
            </DialogHeader>

            <div className="space-y-3">
              <div>
                <label className="text-[10px] font-medium text-gray-600 uppercase tracking-wide">Sesi</label>
                <div className="mt-1 p-2 bg-blue-50 rounded-lg">
                  <p className="text-sm font-medium text-blue-900">{session?.title}</p>
                </div>
              </div>

              <div>
                <label className="text-[10px] font-medium text-gray-600 uppercase tracking-wide flex items-center">
                  <MapPin className="h-3 w-3 mr-1" /> Lokasi
                </label>
                <div className="mt-1 p-2 bg-gray-50 rounded-lg text-[10px]">
                  <p>
                    Sesi: {session?.latitude?.toFixed(5)}, {session?.longitude?.toFixed(5)}
                  </p>
                  {location && (
                    <p className="text-gray-600 mt-0.5">
                      Anda: {location.lat.toFixed(5)}, {location.lng.toFixed(5)}
                    </p>
                  )}
                </div>
              </div>

              <div>
                <label className="text-[10px] font-medium text-gray-600 uppercase tracking-wide flex items-center">
                  <Smartphone className="h-3 w-3 mr-1" /> Perangkat
                </label>
                <div className="mt-1 p-2 bg-gray-50 rounded-lg text-[10px]">
                  <code>{deviceId ? `${deviceId.substring(0, 8)}...` : 'memuat...'}</code>
                </div>
              </div>

              {session?.expiresAt && (
                <div>
                  <label className="text-[10px] font-medium text-gray-600 uppercase tracking-wide">Batas Waktu</label>
                  <div
                    className={`mt-1 p-2 rounded-lg text-[10px] ${
                      isExpired ? 'bg-red-50 text-red-800' : 'bg-green-50 text-green-800'
                    }`}
                  >
                    {new Date(session.expiresAt).toLocaleString('id-ID')}
                    {isExpired && (
                      <span className="flex items-center mt-1">
                        <AlertCircle className="h-3 w-3 mr-1" />
                        Sesi kadaluarsa
                      </span>
                    )}
                  </div>
                </div>
              )}

              <div>
                <label
                  htmlFor="nim"
                  className="text-[10px] font-medium text-gray-600 uppercase tracking-wide"
                >
                  NIM Anda
                </label>
                <Input
                  id="nim"
                  placeholder="Contoh: 2350101"
                  value={nim}
                  onChange={(e) => setNim(e.target.value)}
                  className="w-full text-sm py-2 mt-1"
                  autoFocus
                />
              </div>
            </div>

            <div className="flex gap-2 mt-5 pt-3 border-t border-gray-100">
              <Button variant="outline" size="sm" className="flex-1 text-xs py-2" onClick={handleRescan}>
                {activeTab === 'camera' ? 'Scan Ulang' : 'Upload Ulang'}
              </Button>
              <Button
                size="sm"
                onClick={submitAttendance}
                disabled={
                  isLoading ||
                  !nim ||
                  (session?.expiresAt ? new Date() > new Date(session.expiresAt) : false)
                }
                className="flex-1 text-xs py-2 bg-blue-600 hover:bg-blue-700"
              >
                {isLoading ? (
                  <>
                    <Loader2 className="mr-1 h-3 w-3 animate-spin" />
                    Proses...
                  </>
                ) : (
                  'Submit'
                )}
              </Button>
            </div>
          </DialogContent>
        </Dialog>
      </div>
    </div>
  );
}
