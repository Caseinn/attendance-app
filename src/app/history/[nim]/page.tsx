'use client';

import { useEffect, useState } from 'react';
import { useParams } from 'next/navigation';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Loader2, AlertCircle, Calendar, QrCode, ArrowLeft } from 'lucide-react';
import Link from 'next/link';
import { motion } from 'framer-motion';

// 👇 Define the shape of each attendance record
interface AttendanceHistoryItem {
  sessionId: string;
  title: string;
  createdAt: string;
  // location?: string;
  // deviceId?: string;
  // status?: 'present' | 'late' | 'absent';
}

export default function HistoryPage() {
  const { nim } = useParams<{ nim: string }>();
  const [history, setHistory] = useState<AttendanceHistoryItem[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchHistory = async () => {
      setIsLoading(true);
      setError(null);

      try {
        const res = await fetch(`/api/student/history/${nim}`);

        if (!res.ok) {
          throw new Error(`HTTP ${res.status}: ${res.statusText}`);
        }

        const data: AttendanceHistoryItem[] = await res.json();

        if (!Array.isArray(data)) {
          throw new Error('Invalid response format: expected array');
        }

        setHistory(data);
      } catch (err) {
        console.error('Fetch error:', err);
        setError(err instanceof Error ? err.message : 'Failed to load attendance history');
        setHistory([]);
      } finally {
        setIsLoading(false);
      }
    };

    if (nim) {
      fetchHistory();
    }
  }, [nim]);

  // Handle missing NIM
  if (!nim) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-red-50 to-pink-100 flex items-center justify-center p-4">
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          className="w-full max-w-md"
        >
          <Card className="border-2 border-red-200 bg-white shadow-xl">
            <CardContent className="p-8 text-center space-y-6">
              <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mx-auto">
                <AlertCircle className="h-8 w-8 text-red-600" />
              </div>
              <div className="space-y-2">
                <h2 className="text-2xl font-bold text-red-700">NIM Tidak Ditemukan</h2>
                <p className="text-gray-600">Silakan scan QR Code terlebih dahulu untuk melihat riwayat absensi.</p>
              </div>
              <Button asChild className="w-full bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white">
                <Link href="/scan">
                  <ArrowLeft className="mr-2 h-4 w-4" />
                  Kembali ke Scan QR
                </Link>
              </Button>
            </CardContent>
          </Card>
        </motion.div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 p-4 md:p-8 flex items-center justify-center">
      <div className="max-w-4xl w-full">

        {/* Header Section */}
        <motion.div
          initial={{ opacity: 0, y: -30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8 }}
          className="text-center mb-10 md:mb-14"
        >
          <div className="w-20 h-20 md:w-36 md:h-36 bg-gradient-to-br from-blue-500 to-purple-600 rounded-3xl flex items-center justify-center mx-auto shadow-lg mb-6">
            <Calendar className="h-12 w-12 md:w-26 md:h-36 text-white" />
          </div>
          <h1 className="text-4xl md:text-5xl font-extrabold text-gray-800 leading-tight">
            Riwayat Absensi
          </h1>
          <p className="text-lg md:text-xl text-gray-600 mt-4">
            NIM: <code className="bg-gray-100 px-3 py-1.5 rounded-lg text-gray-800 font-mono font-medium">{nim}</code>
          </p>
        </motion.div>

        {/* Loading State */}
        {isLoading && (
          <div className="flex flex-col items-center justify-center py-16">
            <motion.div
              animate={{ rotate: 360 }}
              transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
              className="mb-6"
            >
              <Loader2 className="h-12 w-12 text-blue-600" />
            </motion.div>
            <p className="text-gray-600 text-lg">Memuat riwayat absensi kamu...</p>
          </div>
        )}

        {/* Error State */}
        {error && !isLoading && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="mb-10"
          >
            <Card className="border-2 border-red-200 bg-red-50 shadow-lg">
              <CardContent className="p-6 md:p-8 text-center space-y-4">
                <AlertCircle className="h-8 w-8 text-red-600 mx-auto" />
                <h3 className="font-bold text-red-800 text-xl">Gagal Memuat Data</h3>
                <p className="text-red-700">{error}</p>
                <Button
                  onClick={() => window.location.reload()}
                  variant="outline"
                  className="border-red-300 hover:bg-red-50 mt-2"
                >
                  Coba Lagi
                </Button>
              </CardContent>
            </Card>
          </motion.div>
        )}

        {/* Empty State */}
        {!isLoading && !error && history.length === 0 && (
          <motion.div
            initial={{ opacity: 0, scale: 0.98 }}
            animate={{ opacity: 1, scale: 1 }}
            className="mb-12"
          >
            <Card className="border-2 border-yellow-200 bg-yellow-50 shadow-lg">
              <CardContent className="p-8 md:p-12 text-center space-y-6">
                <div className="w-20 h-20 bg-yellow-200 rounded-full flex items-center justify-center mx-auto">
                  <QrCode className="h-10 w-10 text-yellow-700" />
                </div>
                <div className="space-y-3">
                  <h3 className="text-2xl font-bold text-yellow-800">Belum Ada Absensi</h3>
                  <p className="text-yellow-700 text-lg">Kamu belum mengikuti sesi absensi apapun.</p>
                </div>
                <Button
                  asChild
                  className="w-full sm:w-auto bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white px-8 py-6 text-lg"
                >
                  <Link href="/scan">
                    <QrCode className="mr-2 h-5 w-5" />
                    Scan QR Code Sekarang
                  </Link>
                </Button>
              </CardContent>
            </Card>
          </motion.div>
        )}

        {/* Success State — Attendance List */}
        {!isLoading && !error && history.length > 0 && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.6 }}
            className="space-y-3 mb-12"
          >
            {history.map((item, index) => (
              <motion.div
                key={item.sessionId}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.08, ease: "easeOut" }}
                whileHover={{ y: -2, boxShadow: "0 4px 16px -4px rgba(0,0,0,0.06)" }}
                className="group"
              >
                <Card className="border border-gray-200 hover:border-blue-200 transition-all duration-300 p-0 md:p-3 hover:shadow-sm bg-white rounded-xl overflow-hidden">
                  <div className="relative">
                    <Badge
                      className="absolute top-5 right-5 bg-green-100 text-green-700 border border-green-200 px-2 py-1 text-xs font-medium rounded-full shadow-sm"
                      style={{
                        zIndex: 10,
                      }}
                    >
                      <svg className="w-3 h-3 mr-1 inline" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7" />
                      </svg>
                      Hadir
                    </Badge>

                    <CardContent className="p-4 pt-5 pb-4 pr-6 pl-4">
                      <h3 className="text-base font-semibold text-gray-800 mb-1">{item.title}</h3>
                      <div className="flex items-center space-x-1 text-xs text-gray-500">
                        <Calendar className="h-3 w-3 flex-shrink-0" />
                        <span>
                          {new Date(item.createdAt).toLocaleString('id-ID', {
                            weekday: 'short',
                            day: 'numeric',
                            month: 'short',
                            year: 'numeric',
                            hour: '2-digit',
                            minute: '2-digit',
                          })}
                        </span>
                      </div>
                    </CardContent>
                  </div>
                </Card>
              </motion.div>
            ))}
          </motion.div>
        )}

        {/* Action Button — Fixed on Mobile, Inline on Desktop */}
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          className="text-center sticky md:static bottom-6 md:bottom-auto left-0 right-0"
        >
          <Button
            asChild
            className="w-full sm:w-64 h-14 text-lg font-semibold bg-gradient-to-r from-blue-600 to-indigo-700 hover:from-blue-700 hover:to-indigo-800 shadow-lg"
          >
            <Link href="/scan">
              <QrCode className="mr-3 h-5 w-5" />
              Absen di Sesi Baru
            </Link>
          </Button>
        </motion.div>
      </div>
    </div>
  );
}