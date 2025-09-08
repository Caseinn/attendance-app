// app/dashboard/page.tsx
'use client';

import { useEffect, useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Calendar, Users, Clock, AlertCircle, Download } from 'lucide-react';
import { motion } from 'framer-motion';
import Link from 'next/link';
import { Loader2 } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { toast } from 'sonner'; 

type Session = {
  id: string;
  title: string;
  createdAt: string;
  expiresAt: string;
};

export default function DashboardOverviewPage() {
  const [sessions, setSessions] = useState<Session[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchSessions = async () => {
      setIsLoading(true);
      try {
        const res = await fetch('/api/session/list');
        if (!res.ok) throw new Error('Gagal mengambil daftar sesi');
        const data: Session[] = await res.json(); // ✅ Fixed: valid TypeScript syntax
        setSessions(data);
      } catch (err) {
        console.error('Error fetching sessions:', err);
        setError(err instanceof Error ? err.message : 'Terjadi kesalahan tidak terduga');
      } finally {
        setIsLoading(false);
      }
    };

    fetchSessions();
  }, []);

  // Helper to format date
  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('id-ID', {
      weekday: 'short',
      day: 'numeric',
      month: 'short',
      year: 'numeric',
    });
  };

  // Helper to check if session is expired
  const isExpired = (expiresAt: string) => {
    return new Date() > new Date(expiresAt);
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 p-4 md:p-6">
      <div className="max-w-6xl mx-auto">

        {/* Hero Header */}
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
          className="text-center mb-8"
        >
          <div className="w-16 h-16 bg-gradient-to-br from-blue-500 to-purple-600 rounded-2xl flex items-center justify-center mx-auto shadow-lg mb-4">
            <Users className="h-8 w-8 text-white" />
          </div>
          <h1 className="text-3xl md:text-4xl font-extrabold text-gray-800">Dashboard Absensi</h1>
          <p className="text-lg text-gray-600 mt-2">Pilih sesi untuk melihat atau kelola kehadiran mahasiswa</p>
        </motion.div>

        {/* Loading State */}
        {isLoading && (
          <div className="flex flex-col items-center justify-center py-16">
            <Loader2 className="h-8 w-8 text-blue-500 animate-spin mb-4" />
            <p className="text-gray-600">Memuat daftar sesi...</p>
          </div>
        )}

        <div className="flex justify-end mb-6">
        <Button
            onClick={async () => {
            try {
                const res = await fetch('/api/dashboard/export');
                if (!res.ok) throw new Error('Gagal mengekspor data');
                
                // Create blob and trigger download
                const blob = await res.blob();
                const url = window.URL.createObjectURL(blob);
                const a = document.createElement('a');
                a.href = url;
                a.download = `absensi-${new Date().toISOString().split('T')[0]}.csv`;
                document.body.appendChild(a);
                a.click();
                window.URL.revokeObjectURL(url);
                document.body.removeChild(a);
                
                toast.success('Data absensi berhasil diunduh!');
            } catch (err) {
                toast.error('Gagal mengunduh data');
                console.error(err);
            }
            }}
            className="bg-gradient-to-r from-green-600 to-emerald-700 hover:from-green-700 hover:to-emerald-800 text-white"
        >
            <Download className="mr-2 h-4 w-4" />
            Export ke Excel
        </Button>
        </div>

        {/* Error State */}
        {error && !isLoading && (
          <div className="mb-8">
            <Card className="border-2 border-red-200 bg-red-50">
              <CardContent className="p-6 text-center">
                <AlertCircle className="h-6 w-6 text-red-600 mx-auto mb-3" />
                <h3 className="font-semibold text-red-800 mb-2">Gagal Memuat Data</h3>
                <p className="text-red-700 text-sm mb-4">{error}</p>
                <Button onClick={() => window.location.reload()} variant="outline" className="border-red-300">
                  Coba Lagi
                </Button>
              </CardContent>
            </Card>
          </div>
        )}

        {/* Empty State */}
        {!isLoading && !error && sessions.length === 0 && (
          <motion.div
            initial={{ opacity: 0, scale: 0.98 }}
            animate={{ opacity: 1, scale: 1 }}
            className="mb-12"
          >
            <Card className="border-2 border-yellow-200 bg-yellow-50">
              <CardContent className="p-8 md:p-12 text-center space-y-6">
                <div className="w-20 h-20 bg-yellow-200 rounded-full flex items-center justify-center mx-auto">
                  <Calendar className="h-10 w-10 text-yellow-700" />
                </div>
                <div className="space-y-3">
                  <h3 className="text-2xl font-bold text-yellow-800">Belum Ada Sesi Absensi</h3>
                  <p className="text-yellow-700 text-lg">Buat sesi pertama Anda untuk memulai absensi.</p>
                </div>
                <Button
                  asChild
                  className="w-full sm:w-auto bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white px-8 py-6 text-lg"
                >
                  <Link href="/generate">
                    <Calendar className="mr-2 h-5 w-5" />
                    Buat Sesi Baru
                  </Link>
                </Button>
              </CardContent>
            </Card>
          </motion.div>
        )}

        {/* Session Grid */}
        {!isLoading && !error && sessions.length > 0 && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.5 }}
            className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6 mb-12"
          >
            {sessions.map((session, index) => (
              <motion.div
                key={session.id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.1 }}
                whileHover={{ y: -4, boxShadow: "0 10px 25px -5px rgba(0,0,0,0.1)" }}
              >
                <Card className={`border-2 ${
                  isExpired(session.expiresAt) 
                    ? 'border-red-200 bg-red-50 hover:border-red-300' 
                    : 'border-blue-200 bg-white hover:border-blue-300'
                } rounded-2xl overflow-hidden transition-all duration-300`}>
                  <Link href={`/dashboard/${session.id}`} className="block">
                    <CardHeader className="pb-3">
                      <CardTitle className="text-lg font-bold text-gray-800 line-clamp-2">
                        {session.title}
                      </CardTitle>
                    </CardHeader>
                    <CardContent className="pt-3">
                      <div className="space-y-3">
                        <div className="flex items-center space-x-2 text-sm text-gray-600">
                          <Calendar className="h-4 w-4" />
                          <span>{formatDate(session.createdAt)}</span>
                        </div>
                        <div className="flex items-center space-x-2 text-sm text-gray-600">
                          <Clock className="h-4 w-4" />
                          <span>Berakhir: {new Date(session.expiresAt).toLocaleTimeString('id-ID')}</span>
                        </div>
                        {isExpired(session.expiresAt) ? (
                          <Badge variant="destructive" className="w-full justify-center">
                            ⏳ Sesi Kadaluarsa
                          </Badge>
                        ) : (
                          <Badge variant="default" className="w-full justify-center bg-green-100 text-green-800 border-green-200">
                            ✅ Aktif
                          </Badge>
                        )}
                      </div>
                    </CardContent>
                  </Link>
                </Card>
              </motion.div>
            ))}
          </motion.div>
        )}

        {/* Action Button */}
        <div className="text-center">
          <Button
            asChild
            className="bg-gradient-to-r from-blue-600 to-indigo-700 hover:from-blue-700 hover:to-indigo-800 text-white px-8 py-6 text-lg font-semibold shadow-lg"
          >
            <Link href="/generate">
              <Calendar className="mr-2 h-5 w-5" />
              Buat Sesi Absensi Baru
            </Link>
          </Button>
        </div>

        {/* Footer */}
        <div className="text-center mt-12 text-sm text-gray-500">
          <p>Kelola absensi untuk setiap pertemuan secara terpisah</p>
          <p className="mt-1">© 2025 Sistem Absensi Cerdas</p>
        </div>

      </div>
    </div>
  );
}