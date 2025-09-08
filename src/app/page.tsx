// app/page.tsx
'use client';

import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { GraduationCap, QrCode } from 'lucide-react';
import { motion } from 'framer-motion';

export default function HomePage() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 flex flex-col items-center justify-center p-4 md:p-8">
      {/* Hero Section - Centered for desktop */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.8 }}
        className="text-center space-y-8 md:space-y-10 w-full max-w-2xl"
      >
        <div className="w-20 h-20 md:w-36 md:h-36 bg-gradient-to-br from-blue-500 to-purple-600 rounded-3xl flex items-center justify-center mx-auto shadow-xl">
          <QrCode className="h-12 w-12 md:h-26 md:w-26 text-white" />
        </div>

        <div className="space-y-4">
          <h1 className="text-4xl md:text-5xl font-extrabold text-gray-900 leading-tight px-4">
            Praktikum
            <span className="bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent block md:inline">
              {' '}Algoritma Struktur Data RD
            </span>
          </h1>
          <p className="text-lg md:text-xl text-gray-600 px-4 md:px-0">
            Absen dengan QR Code, lokasi, dan perangkatmu — tanpa ribet!
          </p>
        </div>

        {/* Action Buttons - Inline for desktop, stacked for mobile */}
        <div className="flex flex-col sm:flex-row gap-4 sm:gap-6 justify-center px-4 mt-6 md:mt-8">
          <Link href="/scan" className="w-full sm:w-auto">
            <Button className="w-full sm:w-64 h-14 text-lg font-semibold bg-gradient-to-r from-green-500 to-emerald-600 hover:from-green-600 hover:to-emerald-700 text-white shadow-lg">
              <QrCode className="mr-3 h-5 w-5" />
              Scan QR
            </Button>
          </Link>

          <Link href="/generate" className="w-full sm:w-auto">
            <Button variant="outline" className="w-full sm:w-64 h-14 text-lg font-semibold border-2 border-gray-300 hover:border-gray-400 shadow-md">
              <GraduationCap className="mr-3 h-5 w-5" />
              Buat Sesi Absensi
            </Button>
          </Link>
        </div>
      </motion.div>
    </div>
  );
}