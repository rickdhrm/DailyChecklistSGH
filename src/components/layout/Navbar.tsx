'use client';

import React from 'react';
import Link from 'next/link';
import { useRouter, usePathname } from 'next/navigation';
import { User } from '@/types';
import { 
  ClipboardList, 
  Users, 
  Archive, 
  LogOut, 
  Sliders, 
  FileSpreadsheet,
  Building2
} from 'lucide-react';

interface NavbarProps {
  user: User | null;
}

export default function Navbar({ user }: NavbarProps) {
  const router = useRouter();
  const pathname = usePathname();

  const handleLogout = async () => {
    try {
      await fetch('/api/auth/logout', { method: 'POST' });
      router.push('/login');
      router.refresh();
    } catch (err) {
      console.error('Logout error:', err);
    }
  };

  if (!user) return null;

  const isAdminOrSpv = user.role === 'ADMIN' || user.role === 'SPV';

  return (
    <header className="sticky top-0 z-50 bg-white/95 backdrop-blur-md border-b border-slate-200/90 shadow-xs">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          {/* Logo & Brand */}
          <div className="flex items-center gap-3">
            <Link href="/" className="flex items-center gap-3 group">
              <div className="h-11 w-11 rounded-xl bg-slate-50 border border-amber-500/30 p-1 flex items-center justify-center shadow-xs shadow-amber-500/10 group-hover:border-amber-500/60 transition-colors">
                <img src="/logo.png" alt="SGH Tower" className="h-full w-auto object-contain" />
              </div>
              <div>
                <span className="font-extrabold text-lg tracking-tight text-slate-900 block leading-tight font-serif">
                  SGH TOWER
                </span>
                <span className="text-[10px] uppercase tracking-widest text-amber-700 font-semibold">
                  Facility Management
                </span>
              </div>
            </Link>
          </div>

          {/* Navigation Links */}
          <nav className="hidden md:flex items-center gap-1">
            {/* Technician / Field Navigation */}
            <Link
              href="/"
              className={`px-3 py-2 rounded-lg text-sm font-medium transition-colors flex items-center gap-1.5 ${
                pathname === '/' ? 'bg-amber-50 text-amber-800 border border-amber-500/35 shadow-xs font-semibold' : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
              }`}
            >
              <ClipboardList className="h-4 w-4 text-amber-600" />
              Checklists
            </Link>

            <Link
              href="/history"
              className={`px-3 py-2 rounded-lg text-sm font-medium transition-colors flex items-center gap-1.5 ${
                pathname.startsWith('/history') ? 'bg-amber-50 text-amber-800 border border-amber-500/35 shadow-xs font-semibold' : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
              }`}
            >
              <FileSpreadsheet className="h-4 w-4 text-amber-600" />
              My Submissions
            </Link>

            {/* Admin / SPV Nav Links */}
            {isAdminOrSpv && (
              <>
                <div className="h-5 w-px bg-slate-200 mx-2" />
                <Link
                  href="/admin/submissions"
                  className={`px-3 py-2 rounded-lg text-sm font-medium transition-colors flex items-center gap-1.5 ${
                    pathname.startsWith('/admin/submissions') ? 'bg-amber-50 text-amber-800 border border-amber-500/35 shadow-xs font-semibold' : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
                  }`}
                >
                  <FileSpreadsheet className="h-4 w-4 text-amber-600" />
                  Monitor Data
                </Link>

                <Link
                  href="/admin/forms"
                  className={`px-3 py-2 rounded-lg text-sm font-medium transition-colors flex items-center gap-1.5 ${
                    pathname.startsWith('/admin/forms') ? 'bg-amber-50 text-amber-800 border border-amber-500/35 shadow-xs font-semibold' : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
                  }`}
                >
                  <Sliders className="h-4 w-4 text-amber-600" />
                  Form Builder
                </Link>

                {user.role === 'ADMIN' && (
                  <Link
                    href="/admin/departments"
                    className={`px-3 py-2 rounded-lg text-sm font-medium transition-colors flex items-center gap-1.5 ${
                      pathname.startsWith('/admin/departments') ? 'bg-amber-50 text-amber-800 border border-amber-500/35 shadow-xs font-semibold' : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
                    }`}
                  >
                    <Building2 className="h-4 w-4 text-amber-600" />
                    Departments
                  </Link>
                )}

                <Link
                  href="/admin/users"
                  className={`px-3 py-2 rounded-lg text-sm font-medium transition-colors flex items-center gap-1.5 ${
                    pathname.startsWith('/admin/users') ? 'bg-amber-50 text-amber-800 border border-amber-500/35 shadow-xs font-semibold' : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
                  }`}
                >
                  <Users className="h-4 w-4 text-amber-600" />
                  Staff & Users
                </Link>

                <Link
                  href="/admin/housekeeping"
                  className={`px-3 py-2 rounded-lg text-sm font-medium transition-colors flex items-center gap-1.5 ${
                    pathname.startsWith('/admin/housekeeping') ? 'bg-amber-50 text-amber-800 border border-amber-500/35 shadow-xs font-semibold' : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
                  }`}
                >
                  <Archive className="h-4 w-4 text-amber-600" />
                  Housekeeping
                </Link>
              </>
            )}
          </nav>

          {/* User Profile & Logout */}
          <div className="flex items-center gap-3">
            <div className="text-right hidden sm:block">
              <div className="text-sm font-semibold text-slate-900 flex items-center gap-1.5 justify-end">
                <span>{user.full_name}</span>
                <span
                  className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${
                    user.role === 'ADMIN'
                      ? 'bg-rose-50 text-rose-700 border border-rose-200'
                      : user.role === 'SPV'
                      ? 'bg-amber-50 text-amber-800 border border-amber-200'
                      : 'bg-emerald-50 text-emerald-800 border border-emerald-200'
                  }`}
                >
                  {user.role}
                </span>
              </div>
              <div className="text-xs text-slate-500">
                {user.employee_code || user.username}
              </div>
            </div>

            <button
              onClick={handleLogout}
              title="Sign Out"
              className="p-2 rounded-lg text-slate-500 hover:text-rose-600 hover:bg-slate-100 transition-colors"
            >
              <LogOut className="h-5 w-5" />
            </button>
          </div>
        </div>
      </div>

      {/* Mobile Sub-Navigation Bar */}
      <div className="md:hidden flex items-center justify-around border-t border-slate-200 bg-white/95 py-2 px-1 text-xs">
        <Link
          href="/"
          className={`flex flex-col items-center gap-1 px-3 py-1 rounded-md ${
            pathname === '/' ? 'text-amber-700 font-semibold' : 'text-slate-500'
          }`}
        >
          <ClipboardList className="h-4 w-4" />
          Forms
        </Link>
        <Link
          href="/history"
          className={`flex flex-col items-center gap-1 px-3 py-1 rounded-md ${
            pathname.startsWith('/history') ? 'text-amber-700 font-semibold' : 'text-slate-500'
          }`}
        >
          <FileSpreadsheet className="h-4 w-4" />
          History
        </Link>
        {isAdminOrSpv && (
          <Link
            href="/admin/submissions"
            className={`flex flex-col items-center gap-1 px-3 py-1 rounded-md ${
              pathname.startsWith('/admin') ? 'text-amber-700 font-semibold' : 'text-slate-500'
            }`}
          >
            <Sliders className="h-4 w-4" />
            Admin Hub
          </Link>
        )}
      </div>
    </header>
  );
}
