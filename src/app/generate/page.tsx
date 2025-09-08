// app/generate/page.tsx
'use client';

import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent } from '@/components/ui/card';
import { QRCodeCanvas } from 'qrcode.react';
import { saveAs } from 'file-saver';
import { toast } from 'sonner';
import { 
  MapPin, 
  QrCode, 
  Download, 
  Loader2, 
  CheckCircle2, 
  AlertCircle 
} from 'lucide-react';
import { motion } from 'framer-motion';

export default function GeneratePage() {
  const [title, setTitle] = useState('');
  const [sessionId, setSessionId] = useState('');
  const [location, setLocation] = useState<{ lat: number; lng: number } | null>(null);
  const [isGettingLocation, setIsGettingLocation] = useState(false);
  const [isCreatingSession, setIsCreatingSession] = useState(false);

  const getLocation = () => {
    if (!navigator.geolocation) {
      toast.error('Geolocation tidak didukung perangkat ini');
      return;
    }

    setIsGettingLocation(true);
    
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        setLocation({
          lat: pos.coords.latitude,
          lng: pos.coords.longitude,
        });
        setIsGettingLocation(false);
        toast.success('Lokasi berhasil didapatkan!');
      },
      () => {
        toast.error('Gagal mendapatkan lokasi. Pastikan GPS aktif dan izinkan akses lokasi.');
        setIsGettingLocation(false);
      },
      {
        enableHighAccuracy: true,
        timeout: 10000,
        maximumAge: 0,
      }
    );
  };

  const createSession = async () => {
    if (!title) {
      toast.error('Judul sesi wajib diisi');
      return;
    }
    if (!location) {
      toast.error('Lokasi wajib diambil terlebih dahulu');
      return;
    }

    setIsCreatingSession(true);

    try {
      const res = await fetch('/api/session/create', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          title,
          latitude: location.lat,
          longitude: location.lng,
        }),
      });

      if (!res.ok) {
        const errorData = await res.json().catch(() => ({}));
        throw new Error(errorData.error || 'Gagal membuat sesi');
      }

      const data = await res.json();
      setSessionId(data.sessionId);
      toast.success('Sesi absensi berhasil dibuat!');
    } catch (error) {
      toast.error(`❌ ${error instanceof Error ? error.message : 'Gagal membuat sesi'}`);
    } finally {
      setIsCreatingSession(false);
    }
  };

  const downloadQR = () => {
    const canvas = document.getElementById('qr-code') as HTMLCanvasElement;
    if (!canvas) return;

    canvas.toBlob((blob) => {
      if (blob) {
        saveAs(blob, `absensi-${title.replace(/\s+/g, '-').toLowerCase()}-${new Date().toISOString().split('T')[0]}.png`);
        toast.success('QR Code berhasil diunduh!');
      } else {
        toast.error('Gagal mengunduh QR Code');
      }
    });
  };

  useEffect(() => {
    const input = document.getElementById('session-title');
    if (input) {
      (input as HTMLInputElement).focus();
    }
  }, []);

    return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 p-4 md:p-8 flex items-center justify-center">
        <div className="max-w-2xl w-full">

        {/* Hero Header — Compact Version */}
        <motion.div
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
            className="text-center mb-8"
        >
            <div className="w-20 h-20 md:w-36 md:h-36 bg-gradient-to-br from-blue-500 to-purple-600 rounded-3xl flex items-center justify-center mx-auto shadow-md mb-4">
            <QrCode className="h-12 w-12 md:w-26 md:h-26 text-white" />
            </div>
            <h1 className="text-4xl md:text-5xl font-extrabold text-gray-800">Buat Sesi Absensi</h1>
        </motion.div>

        <Card className="border border-gray-200 hover:border-blue-200 transition-all duration-300 bg-white rounded-xl overflow-hidden shadow-sm hover:shadow-md">
            <CardContent className="p-5">

            {/* Title Input — Compact */}
            <div className="space-y-2 mb-6">
                <label htmlFor="session-title" className="block text-xs font-medium text-gray-700 uppercase tracking-wide">
                Judul Sesi
                </label>
                <Input
                id="session-title"
                placeholder="Contoh: Pertemuan 3 - Stack"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                className="w-full text-sm py-2 px-3 border-gray-300 focus:border-blue-500 focus:ring-1 focus:ring-blue-200"
                />
                <p className="text-[10px] text-gray-500 flex items-center mt-1">
                    <AlertCircle className="h-3 w-3 mr-1 text-gray-400" />
                    Judul akan muncul di QR Code dan riwayat mahasiswa
                </p>
            </div>

            {/* Get Location Button — Smaller, Rounded */}
            <motion.div
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.1 }}
            >
                <Button
                onClick={getLocation}
                disabled={isGettingLocation}
                className="w-full py-5 text-sm font-medium bg-gradient-to-r from-green-500 to-emerald-600 hover:from-green-600 hover:to-emerald-700 text-white rounded-lg shadow-sm"
                >
                {isGettingLocation ? (
                    <>
                    <Loader2 className="mr-1.5 h-4 w-4 animate-spin" />
                    Mendapatkan Lokasi...
                    </>
                ) : (
                    <>
                    <MapPin className="mr-1.5 h-4 w-4" />
                    Dapatkan Lokasi Saya
                    </>
                )}
                </Button>
            </motion.div>

            {/* Location Success — Compact Badge Style */}
            {location && (
                <motion.div
                initial={{ opacity: 0, y: 5 }}
                animate={{ opacity: 1, y: 0 }}
                className="mt-4 p-3 bg-green-50 border border-green-200 rounded-lg"
                >
                <div className="flex items-start space-x-2">
                    <CheckCircle2 className="h-4 w-4 text-green-600 mt-0.5 flex-shrink-0" />
                    <div>
                    <p className="text-xs font-medium text-green-800">Lokasi didapatkan</p>
                    <p className="text-[10px] text-green-700 mt-0.5">
                        {location.lat.toFixed(5)}, {location.lng.toFixed(5)}
                    </p>
                    </div>
                </div>
                </motion.div>
            )}

            {/* Create Session Button — Smaller */}
            <motion.div
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.2 }}
            >
                <Button
                onClick={createSession}
                disabled={!title || !location || isCreatingSession}
                className="w-full mt-6 py-5 text-sm font-medium bg-gradient-to-r from-blue-600 to-indigo-700 hover:from-blue-700 hover:to-indigo-800 text-white rounded-lg shadow-sm"
                >
                {isCreatingSession ? (
                    <>
                    <Loader2 className="mr-1.5 h-4 w-4 animate-spin" />
                    Membuat Sesi...
                    </>
                ) : (
                    <>
                    <QrCode className="mr-1.5 h-4 w-4" />
                    Buat Sesi & Generate QR
                    </>
                )}
                </Button>
            </motion.div>

            {/* QR Code Result — Clean & Compact */}
            {sessionId && (
                <motion.div
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.3 }}
                className="pt-6 mt-6 border-t border-gray-100"
                >
                {/* QR Code — Smaller */}
                <div className="flex flex-col items-center space-y-4">
                    <div className="bg-white p-4 rounded-xl border border-gray-200 shadow-sm">
                    <QRCodeCanvas
                        id="qr-code"
                        value={sessionId}
                        size={192}
                        level="H"
                        includeMargin={true}
                        bgColor="#ffffff"
                        fgColor="#000000"
                    />
                    </div>

                    {/* Session Info — Tight Grid */}
                    <div className="w-full grid grid-cols-1 gap-2 text-xs">
                    <div className="bg-gray-50 p-2.5 rounded-lg">
                        <span className="text-gray-500 font-medium">Judul</span>
                        <p className="font-medium text-gray-800 mt-0.5">{title}</p>
                    </div>
                    <div className="bg-gray-50 p-2.5 rounded-lg">
                        <span className="text-gray-500 font-medium">ID Sesi</span>
                        <code className="block text-[10px] bg-white px-2 py-1 rounded border font-mono mt-0.5 overflow-x-auto">
                        {sessionId}
                        </code>
                    </div>
                    </div>

                    {/* Action Buttons — Compact */}
                    <div className="flex flex-col sm:flex-row gap-3 w-full">
                    <Button
                        onClick={downloadQR}
                        className="flex-1 py-4 text-sm font-medium bg-gradient-to-r from-purple-500 to-pink-600 hover:from-purple-600 hover:to-pink-700 text-white rounded-lg shadow-sm"
                    >
                        <Download className="mr-1.5 h-3.5 w-3.5" />
                        Unduh QR
                    </Button>
                    
                    <Button
                        onClick={() => {
                        setSessionId('');
                        setTitle('');
                        setLocation(null);
                        }}
                        variant="outline"
                        className="flex-1 py-4 text-sm font-medium border border-gray-300 hover:border-gray-400 rounded-lg"
                    >
                        Sesi Baru
                    </Button>
                    </div>

                    {/* Instructions — Minimalist */}
                    <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-3 w-full text-[10px] text-yellow-700">
                    <strong className="text-yellow-800 block mb-1">📌 Petunjuk</strong>
                    • QR berlaku 2 jam • Lokasi wajib sesuai • Pantau via ID Sesi
                    </div>
                </div>
                </motion.div>
            )}

            </CardContent>
        </Card>
        </div>
    </div>
    );
}