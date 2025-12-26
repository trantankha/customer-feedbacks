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
        <div className={`border-b ${isDark ? 'border-gray-800 bg-[#16181d]/90 backdrop-blur-md' : 'border-gray-200 bg-white/95 backdrop-blur-md shadow-lg'} sticky top-0 z-30 transition-all duration-300 ease-in-out animate-fade-in`}>
            <div className={`max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between`}>
                <div className="flex items-center gap-4">
                    <div className={`p-3 ${isDark ? 'bg-gradient-to-br from-purple-500 to-purple-700' : 'bg-gradient-to-br from-blue-500 to-blue-700'} rounded-xl shadow-xl ${isDark ? 'shadow-purple-900/60' : 'shadow-blue-900/60'} transition-transform duration-200 hover:scale-105`}>
                        {isDark ? (
                            <LayoutDashboard size={22} className="text-white drop-shadow-sm" />
                        ) : (
                            <Users size={22} className="text-white drop-shadow-sm" />
                        )}
                    </div>
                    <div>
                        <h1 className={`text-2xl font-bold tracking-tight ${isDark ? 'text-white' : 'text-gray-900'} transition-colors duration-200`}>FeedbackPro AI</h1>
                        {subtitle && (
                            <p className="text-xs text-gray-500 font-semibold uppercase tracking-wider mt-0.5">{subtitle}</p>
                        )}
                    </div>
                </div>

                {/* Navigation Links */}
                <nav className="hidden md:flex gap-8">
                    <Link
                        href="/"
                        className={`flex items-center gap-2 text-sm font-semibold transition-all duration-200 hover:scale-105 ${pathname === '/' ? (isDark ? 'text-purple-300 border-b-2 border-purple-300' : 'text-blue-600 border-b-2 border-blue-600') : (isDark ? 'text-gray-400 hover:text-white hover:bg-purple-800/20 px-3 py-2 rounded-md' : 'text-gray-600 hover:text-gray-900 hover:bg-blue-50 px-3 py-2 rounded-md')
                            }`}
                    >
                        <LayoutDashboard size={18} /> Dashboard
                    </Link>
                    <Link
                        href="/customers"
                        className={`flex items-center gap-2 text-sm font-semibold transition-all duration-200 hover:scale-105 ${pathname === '/customers' ? (isDark ? 'text-purple-300 border-b-2 border-purple-300' : 'text-blue-600 border-b-2 border-blue-600') : (isDark ? 'text-gray-400 hover:text-white hover:bg-purple-800/20 px-3 py-2 rounded-md' : 'text-gray-600 hover:text-gray-900 hover:bg-blue-50 px-3 py-2 rounded-md')
                            }`}
                    >
                        <Users size={18} /> Khách hàng (CRM)
                    </Link>
                </nav>

                {/* Mobile Navigation */}
                <div className="md:hidden flex gap-4">
                    <Link
                        href="/"
                        className={`p-2 rounded-lg transition-all duration-200 ${pathname === '/' ? (isDark ? 'bg-purple-600 text-white' : 'bg-blue-600 text-white') : (isDark ? 'text-gray-400 hover:bg-purple-800/20' : 'text-gray-600 hover:bg-blue-50')
                            }`}
                    >
                        <LayoutDashboard size={20} />
                    </Link>
                    <Link
                        href="/customers"
                        className={`p-2 rounded-lg transition-all duration-200 ${pathname === '/customers' ? (isDark ? 'bg-purple-600 text-white' : 'bg-blue-600 text-white') : (isDark ? 'text-gray-400 hover:bg-purple-800/20' : 'text-gray-600 hover:bg-blue-50')
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
