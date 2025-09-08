'use client';

import { useEffect, useState } from 'react';
import { useParams } from 'next/navigation';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';
import { Loader2, AlertCircle, Users, Home, Calendar, CheckCircle, XCircle } from 'lucide-react';
import { motion } from 'framer-motion';
import Link from 'next/link';
import { toast } from 'sonner';

type Student = {
  nim: string;
  name: string;
};

type Attendance = {
  nim: string;
  name: string;
  createdAt: string;
};

export default function DashboardPage() {
  const { sessionId } = useParams<{ sessionId: string }>();
  const [students, setStudents] = useState<Student[]>([]);
  const [attendances, setAttendances] = useState<Attendance[]>([]);
  const [sessionTitle, setSessionTitle] = useState<string>('');
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [createdAt, setCreatedAt] = useState<string>('');
  const [selectedNims, setSelectedNims] = useState<Set<string>>(new Set());
  const [isToggling, setIsToggling] = useState(false);

  useEffect(() => {
    const fetchData = async () => {
      setIsLoading(true);
      setError(null);

      try {
        const sessionRes = await fetch(`/api/session/${sessionId}`);
        if (!sessionRes.ok) throw new Error('Gagal mengambil detail sesi');
        const sessionData = await sessionRes.json();
        setSessionTitle(sessionData.title || 'Sesi Tidak Bernama');
        setCreatedAt(new Date(sessionData.createdAt).toLocaleString('id-ID'));

        const studentsRes = await fetch(`/api/student`);
        if (!studentsRes.ok) throw new Error('Gagal mengambil daftar mahasiswa');
        const studentsData: Student[] = await studentsRes.json();
        setStudents(studentsData);

        const attendanceRes = await fetch(`/api/session/${sessionId}/attendance`);
        if (!attendanceRes.ok) throw new Error('Gagal mengambil data absensi');
        const attendanceData: Attendance[] = await attendanceRes.json();
        if (!Array.isArray(attendanceData)) throw new Error('Format data absensi tidak valid');
        setAttendances(attendanceData);
      } catch (err) {
        console.error('Error fetching ', err);
        setError(err instanceof Error ? err.message : 'Terjadi kesalahan tidak terduga');
        setStudents([]);
        setAttendances([]);
      } finally {
        setIsLoading(false);
      }
    };

    if (sessionId) {
      fetchData();
    }
  }, [sessionId]);

  const attendanceMap = new Map<string, Attendance>();
  attendances.forEach(att => {
    attendanceMap.set(att.nim, att);
  });

  // ✅ Smart selection helpers
  const allSelectedAreAbsent = selectedNims.size > 0 && 
    Array.from(selectedNims).every(nim => !attendanceMap.has(nim));

  const allSelectedArePresent = selectedNims.size > 0 && 
    Array.from(selectedNims).every(nim => attendanceMap.has(nim));

  const toggleStudentSelection = (nim: string) => {
    const newSelected = new Set(selectedNims);
    if (newSelected.has(nim)) {
      newSelected.delete(nim);
    } else {
      newSelected.add(nim);
    }
    setSelectedNims(newSelected);
  };

  const toggleBulkAttendance = async (action: 'mark' | 'unmark') => {
    if (selectedNims.size === 0) {
      toast.error('Pilih minimal satu mahasiswa');
      return;
    }

    setIsToggling(true);

    try {
      const res = await fetch('/api/attendance/', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ sessionId, nims: Array.from(selectedNims), action }),
      });

      const data = await res.json();

      if (res.ok) {
        if (action === 'mark') {
          // Optimistically add to attendance list
          const newAttendances = Array.from(selectedNims).map(nim => ({
            nim,
            name: students.find(s => s.nim === nim)?.name || 'Unknown',
            createdAt: new Date().toISOString(),
          }));
          setAttendances(prev => [...prev, ...newAttendances]);
          toast.success(`${data.created} mahasiswa ditandai hadir`);
        } else {
          // Optimistically remove from attendance list
          setAttendances(prev => prev.filter(att => !selectedNims.has(att.nim)));
          toast.success(`${data.deleted} absensi dibatalkan`);
        }
        setSelectedNims(new Set()); // Clear selection
      } else {
        throw new Error(data.error || 'Gagal memperbarui absensi');
      }
    } catch (err) {
      toast.error(`❌ Gagal: ${err instanceof Error ? err.message : 'Unknown error'}`);
    } finally {
      setIsToggling(false);
    }
  };

  if (!sessionId) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-red-50 to-pink-100 flex items-center justify-center p-4">
        <Card className="w-full max-w-md text-center">
          <CardContent className="p-6">
            <AlertCircle className="h-10 w-10 text-red-500 mx-auto mb-3" />
            <h2 className="text-lg font-bold text-red-700 mb-2">ID Sesi Tidak Valid</h2>
            <p className="text-gray-600 mb-4 text-sm">Silakan akses dashboard melalui link yang valid.</p>
            <Button asChild className="w-full py-5 text-sm font-medium bg-blue-600 hover:bg-blue-700">
              <Link href="/">
                <Home className="mr-1.5 h-3.5 w-3.5" />
                Kembali ke Beranda
              </Link>
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 p-3 sm:p-4 md:p-6">
      <div className="max-w-4xl mx-auto w-full">

        {/* Hero Header */}
        <motion.div
          initial={{ opacity: 0, y: -15 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
          className="text-center mb-5 sm:mb-6"
        >
          <div className="w-12 h-12 sm:w-14 sm:h-14 bg-gradient-to-br from-blue-500 to-purple-600 rounded-xl flex items-center justify-center mx-auto shadow-sm mb-2 sm:mb-3">
            <Users className="h-6 w-6 sm:h-7 sm:w-7 text-white" />
          </div>
          <h1 className="text-xl sm:text-2xl font-bold text-gray-800">Dashboard Absensi</h1>
          {sessionTitle && (
            <p className="text-xs sm:text-sm font-medium text-gray-700 mt-1 px-1">“{sessionTitle}”</p>
          )}
          {createdAt && (
            <p className="text-[10px] text-gray-500 mt-1 flex items-center justify-center">
              <Calendar className="h-3 w-3 mr-1" />
              {createdAt}
            </p>
          )}
        </motion.div>

        {/* Loading & Error States */}
        {isLoading && (
          <div className="flex flex-col items-center justify-center py-8 sm:py-10">
            <Loader2 className="h-5 w-5 sm:h-6 sm:w-6 text-blue-500 animate-spin mb-2" />
            <p className="text-sm text-gray-600">Memuat data...</p>
          </div>
        )}

        {error && !isLoading && (
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            className="mb-5 sm:mb-6"
          >
            <Card className="border border-red-200 bg-red-50 rounded-xl">
              <CardContent className="p-4 text-center space-y-2">
                <AlertCircle className="h-4 w-4 sm:h-5 sm:w-5 text-red-600 mx-auto" />
                <h3 className="font-medium text-red-800 text-xs sm:text-sm">Gagal Memuat Data</h3>
                <p className="text-[10px] text-red-700 px-1">{error}</p>
                <Button 
                  onClick={() => window.location.reload()} 
                  variant="outline" 
                  size="sm"
                  className="text-xs py-1.5 mt-2 border-red-300 w-full sm:w-auto"
                >
                  Coba Lagi
                </Button>
              </CardContent>
            </Card>
          </motion.div>
        )}

        {!isLoading && !error && students.length === 0 && (
          <motion.div
            initial={{ opacity: 0, scale: 0.98 }}
            animate={{ opacity: 1, scale: 1 }}
            className="mb-6 sm:mb-8"
          >
            <Card className="border border-yellow-200 bg-yellow-50 rounded-xl">
              <CardContent className="p-4 sm:p-5 text-center space-y-2 sm:space-y-3">
                <Users className="h-7 w-7 sm:h-8 sm:w-8 text-yellow-600 mx-auto" />
                <div>
                  <h3 className="text-xs sm:text-sm font-bold text-yellow-800">Belum Ada Data Mahasiswa</h3>
                  <p className="text-[10px] text-yellow-700">Hubungi admin untuk menambahkan daftar kelas.</p>
                </div>
                <Button 
                  asChild 
                  size="sm"
                  className="text-xs sm:text-sm py-2 w-full sm:w-auto bg-blue-600 hover:bg-blue-700"
                >
                  <Link href={`/generate`}>
                    <Users className="mr-1 h-3 w-3" />
                    Buat Sesi Baru
                  </Link>
                </Button>
              </CardContent>
            </Card>
          </motion.div>
        )}

        {/* ✅ Final Table with Smart Actions */}
        {!isLoading && !error && students.length > 0 && (
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.4 }}
            className="mb-6 sm:mb-8"
          >
            <Card className="border border-gray-200 rounded-xl overflow-hidden">
              <CardHeader className="border-b border-gray-100 p-3 sm:p-4">
                <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
                  <CardTitle className="text-xs sm:text-sm font-semibold text-gray-800">
                    Daftar Mahasiswa ({students.length})
                  </CardTitle>
                  <div className="flex flex-col sm:flex-row sm:items-center gap-2 sm:gap-3">
                    <div className="flex gap-2">
                      <Button
                        size="sm"
                        disabled={!allSelectedAreAbsent || isToggling}
                        onClick={() => toggleBulkAttendance('mark')}
                        className="text-[10px] sm:text-xs py-1.5 px-3 bg-green-600 hover:bg-green-700 text-white"
                        title={!allSelectedAreAbsent ? "Hanya bisa menandai mahasiswa yang belum hadir" : ""}
                      >
                        {isToggling ? (
                          <Loader2 className="h-3 w-3 animate-spin" />
                        ) : (
                          <>
                            <CheckCircle className="h-3 w-3 mr-1" />
                            Tandai Hadir ({selectedNims.size})
                          </>
                        )}
                      </Button>
                      <Button
                        size="sm"
                        variant="outline"
                        disabled={!allSelectedArePresent || isToggling}
                        onClick={() => toggleBulkAttendance('unmark')}
                        className="text-[10px] sm:text-xs py-1.5 px-3 border-red-300 text-red-700 hover:bg-red-50"
                        title={!allSelectedArePresent ? "Hanya bisa membatalkan mahasiswa yang sudah hadir" : ""}
                      >
                        {isToggling ? (
                          <Loader2 className="h-3 w-3 animate-spin" />
                        ) : (
                          <>
                            <XCircle className="h-3 w-3 mr-1" />
                            Batalkan ({selectedNims.size})
                          </>
                        )}
                      </Button>
                    </div>
                    {selectedNims.size > 0 && !allSelectedAreAbsent && !allSelectedArePresent && (
                      <p className="text-[10px] text-yellow-700 mt-1 sm:mt-0 whitespace-nowrap">
                        ⚠️ Pilih status yang sama
                      </p>
                    )}
                  </div>
                </div>
              </CardHeader>
              <CardContent className="p-0">
                <div className="overflow-x-auto">
                  <Table>
                    <TableHeader>
                      <TableRow className="bg-gray-50">
                        <TableHead className="w-12 px-3 py-2">
                          <Checkbox
                            checked={selectedNims.size > 0 && selectedNims.size === students.length}
                            onCheckedChange={(checked) => {
                              if (checked) {
                                setSelectedNims(new Set(students.map(s => s.nim)));
                              } else {
                                setSelectedNims(new Set());
                              }
                            }}
                            className="h-4 w-4"
                          />
                        </TableHead>
                        <TableHead className="text-[10px] sm:text-xs font-medium text-gray-600 px-3 py-2">NIM</TableHead>
                        <TableHead className="text-[10px] sm:text-xs font-medium text-gray-600 px-3 py-2">Nama</TableHead>
                        <TableHead className="text-[10px] sm:text-xs font-medium text-gray-600 px-3 py-2">Status</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {students.map((student, index) => {
                        const isPresent = attendanceMap.has(student.nim);
                        const isSelected = selectedNims.has(student.nim);

                        return (
                          <TableRow 
                            key={student.nim} 
                            className={`${index % 2 === 0 ? 'bg-white' : 'bg-gray-50'} hover:bg-gray-100 ${
                              isSelected ? 'bg-blue-50' : ''
                            }`}
                          >
                            <TableCell className="px-3 py-2">
                              <Checkbox
                                checked={isSelected}
                                onCheckedChange={() => toggleStudentSelection(student.nim)}
                                className="h-4 w-4"
                              />
                            </TableCell>
                            <TableCell className="text-[10px] sm:text-sm font-mono px-3 py-2">
                              <code className="bg-gray-100 px-2 py-1 rounded text-[9px] sm:text-xs">{student.nim}</code>
                            </TableCell>
                            <TableCell className="text-[10px] sm:text-sm px-3 py-2 font-medium">
                              {student.name || '-'}
                            </TableCell>
                            <TableCell className="px-3 py-2">
                              {isPresent ? (
                                <Badge className="bg-green-100 text-green-800 text-[9px] sm:text-xs font-medium px-2 py-0.5 rounded-full">
                                  Hadir
                                </Badge>
                              ) : (
                                <Badge className="bg-red-100 text-red-800 text-[9px] sm:text-xs font-medium px-2 py-0.5 rounded-full">
                                  Tidak Hadir
                                </Badge>
                              )}
                            </TableCell>
                          </TableRow>
                        );
                      })}
                    </TableBody>
                  </Table>
                </div>
              </CardContent>
            </Card>
          </motion.div>
        )}

        {/* Action Buttons */}
        <div className="flex flex-col sm:flex-row gap-3 sm:gap-4 justify-center">
          <Button 
            asChild 
            size="sm"
            className="text-xs sm:text-sm py-2.5 w-full sm:w-auto bg-gradient-to-r from-blue-600 to-indigo-700 hover:from-blue-700 hover:to-indigo-800"
          >
            <Link href={`/generate`}>
              <Users className="mr-1.5 h-3.5 w-3.5" />
              Sesi Baru
            </Link>
          </Button>
          <Button 
            asChild 
            variant="outline" 
            size="sm"
            className="text-xs sm:text-sm py-2.5 w-full sm:w-auto border border-gray-300"
          >
            <Link href="/">
              <Home className="mr-1.5 h-3.5 w-3.5" />
              Beranda
            </Link>
          </Button>
        </div>
      </div>
    </div>
  );
}