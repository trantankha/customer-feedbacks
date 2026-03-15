'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { LayoutDashboard, Users } from 'lucide-react';

interface HeaderProps {
    theme?: 'dark' | 'light';
    subtitle?: string;
    actions?: React.ReactNode;
}

export default function Header({ theme = 'light', subtitle = '', actions }: HeaderProps) {
    const pathname = usePathname();

    const isDark = theme === 'dark';

    return (
        <div className={`border-b border-gray-200 bg-white/95 backdrop-blur-md shadow-sm sticky top-0 z-30 transition-all duration-300 ease-in-out py-1`}>
            <div className={`max-w-[1600px] mx-auto px-6 md:px-8 h-16 flex items-center justify-between`}>
                <div className="flex items-center gap-4">
                    <div className="p-2.5 bg-blue-600 rounded-lg shadow-md shadow-blue-600/20 transition-transform duration-200 hover:scale-105">
                        <LayoutDashboard size={20} className="text-white drop-shadow-sm" />
                    </div>
                    <div>
                        <h1 className="text-xl font-bold tracking-tight text-gray-900 transition-colors duration-200">NovaCorp Pro</h1>
                        {subtitle && (
                            <p className="text-[10px] text-gray-500 font-semibold uppercase tracking-wider mt-0.5">{subtitle}</p>
                        )}
                    </div>
                </div>

                {/* Navigation Links */}
                <nav className="hidden md:flex gap-8">
                    <Link
                        href="/dashboard"
                        className={`flex items-center gap-2 text-sm font-semibold transition-all duration-200 hover:scale-105 ${pathname === '/dashboard' ? 'text-blue-600 border-b-2 border-blue-600 py-5' : 'text-gray-600 hover:text-gray-900 py-5 hover:bg-gray-50/50'
                            }`}
                    >
                        <LayoutDashboard size={18} /> Dashboard
                    </Link>
                    <Link
                        href="/customers"
                        className={`flex items-center gap-2 text-sm font-semibold transition-all duration-200 hover:scale-105 ${pathname === '/customers' ? 'text-blue-600 border-b-2 border-blue-600 py-5' : 'text-gray-600 hover:text-gray-900 py-5 hover:bg-gray-50/50'
                            }`}
                    >
                        <Users size={18} /> Khách hàng (CRM)
                    </Link>
                </nav>

                {/* Mobile Navigation */}
                <div className="md:hidden flex gap-4">
                    <Link
                        href="/dashboard"
                        className={`p-2 rounded-lg transition-all duration-200 ${pathname === '/dashboard' ? 'bg-blue-600 text-white shadow-sm' : 'text-gray-600 hover:bg-blue-50'
                            }`}
                    >
                        <LayoutDashboard size={20} />
                    </Link>
                    <Link
                        href="/customers"
                        className={`p-2 rounded-lg transition-all duration-200 ${pathname === '/customers' ? 'bg-blue-600 text-white shadow-sm' : 'text-gray-600 hover:bg-blue-50'
                            }`}
                    >
                        <Users size={20} />
                    </Link>
                </div>

                {actions && (
                    <div className="flex gap-3 ml-4">
                        {actions}
                    </div>
                )}
            </div>
        </div>
    );
}
