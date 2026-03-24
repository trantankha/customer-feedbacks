'use client';

import { useState, useEffect, useRef } from 'react';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { LayoutDashboard, Users, Settings as SettingsIcon, LogOut, ChevronDown } from 'lucide-react';
import api from '@/lib/api';

interface HeaderProps {
    theme?: 'dark' | 'light';
    subtitle?: string;
    actions?: React.ReactNode;
}

export default function Header({ theme = 'light', subtitle = '', actions }: HeaderProps) {
    const pathname = usePathname();
    const router = useRouter();

    const [dropdownOpen, setDropdownOpen] = useState(false);
    const [user, setUser] = useState<{ full_name: string; email: string; is_superuser?: boolean } | null>(null);
    const dropdownRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        // Lấy thông tin người dùng từ Backend (Token tự kèm qua interceptor)
        const fetchUser = async () => {
            try {
                const res = await api.get('/auth/me');
                if (res.data) {
                    setUser({
                        full_name: res.data.full_name || 'Người dùng mới',
                        email: res.data.email || '',
                        is_superuser: res.data.is_superuser
                    });
                }
            } catch (err) {
                console.error("Lỗi tải thông tin Header", err);
            }
        };
        fetchUser();

        // Xử lý click ra ngoài để đóng Dropdown
        const handleClickOutside = (event: MouseEvent) => {
            if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
                setDropdownOpen(false);
            }
        };
        document.addEventListener("mousedown", handleClickOutside);
        return () => document.removeEventListener("mousedown", handleClickOutside);
    }, []);

    const handleLogout = () => {
        if (typeof window !== 'undefined') {
            localStorage.removeItem('access_token');
            localStorage.removeItem('refresh_token');
            router.push('/login');
        }
    };

    const isDark = theme === 'dark';

    return (
        <div className={`border-b border-gray-200 bg-white/90 backdrop-blur-md shadow-sm sticky top-0 z-30 transition-all duration-300 ease-in-out py-1`}>
            <div className={`max-w-[1600px] mx-auto px-6 md:px-8 h-16 flex items-center justify-between`}>
                <div className="flex items-center gap-6">
                    {/* Logo Area */}
                    <div className="flex items-center gap-3">
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

                    {/* Desktop Navigation Links */}
                    <nav className="hidden md:flex gap-6 ml-6 pl-6 border-l border-gray-200 h-8 items-center">
                        <Link
                            href="/dashboard"
                            className={`flex items-center gap-2 text-sm font-semibold transition-all duration-200 hover:scale-105 ${pathname === '/dashboard' ? 'text-blue-600' : 'text-gray-500 hover:text-gray-900'
                                }`}
                        >
                            <LayoutDashboard size={18} /> Dashboard
                        </Link>
                        <Link
                            href="/customers"
                            className={`flex items-center gap-2 text-sm font-semibold transition-all duration-200 hover:scale-105 ${pathname === '/customers' ? 'text-blue-600' : 'text-gray-500 hover:text-gray-900'
                                }`}
                        >
                            <Users size={18} /> Khách hàng
                        </Link>
                    </nav>
                </div>

                <div className="flex items-center gap-3">
                    {/* Mobile Navigation */}
                    <div className="md:hidden flex gap-2 mr-2">
                        <Link
                            href="/dashboard"
                            className={`p-2 rounded-lg transition-all duration-200 ${pathname === '/dashboard' ? 'bg-blue-600 text-white shadow-sm' : 'text-gray-500 hover:bg-gray-100'
                                }`}
                        >
                            <LayoutDashboard size={20} />
                        </Link>
                        <Link
                            href="/customers"
                            className={`p-2 rounded-lg transition-all duration-200 ${pathname === '/customers' ? 'bg-blue-600 text-white shadow-sm' : 'text-gray-500 hover:bg-gray-100'
                                }`}
                        >
                            <Users size={20} />
                        </Link>
                    </div>

                    {actions && (
                        <div className="flex gap-3 mr-4 pr-4 border-r border-gray-200">
                            {actions}
                        </div>
                    )}

                    {/* User Dropdown */}
                    <div className="relative" ref={dropdownRef}>
                        <button
                            onClick={() => setDropdownOpen(!dropdownOpen)}
                            className="flex items-center cursor-pointer gap-3 p-1.5 rounded-full md:rounded-xl hover:bg-gray-50 transition-colors focus:outline-none focus:ring-2 focus:ring-blue-100"
                        >
                            <div className="w-9 h-9 rounded-full bg-gradient-to-tr from-blue-600 to-blue-400 text-white font-bold text-sm flex items-center justify-center shadow-sm">
                                {user ? (user.full_name || user.email || 'U').charAt(0).toUpperCase() : '?'}
                            </div>
                            <div className="hidden md:flex flex-col items-start pr-1">
                                <span className="text-sm font-semibold text-gray-800 line-clamp-1 max-w-[120px]">
                                    {user?.full_name || 'Đang tải...'}
                                </span>
                                <span className="text-xs text-gray-500 font-medium tracking-wide">
                                    {user?.is_superuser ? 'Quản trị viên' : 'Người dùng'}
                                </span>
                            </div>
                            <ChevronDown size={16} className={`hidden md:block text-gray-400 transition-transform duration-200 ${dropdownOpen ? 'rotate-180' : ''}`} />
                        </button>

                        {/* Dropdown Menu Overlay */}
                        {dropdownOpen && (
                            <div className="absolute right-0 top-full mt-2 w-64 bg-white rounded-2xl shadow-xl border border-gray-100 overflow-hidden transform opacity-100 scale-100 transition-all duration-200 origin-top-right animate-in fade-in zoom-in-95">
                                <div className="p-4 border-b border-gray-50 bg-gray-50/50">
                                    <p className="text-sm font-bold text-gray-900 truncate">{user?.full_name}</p>
                                    <p className="text-xs text-gray-500 truncate mt-0.5">{user?.email}</p>
                                </div>
                                <div className="p-2">
                                    <Link
                                        href="/settings"
                                        onClick={() => setDropdownOpen(false)}
                                        className="flex items-center gap-3 px-3 py-2.5 text-sm font-medium text-gray-700 rounded-xl hover:bg-blue-50 hover:text-blue-700 transition-colors"
                                    >
                                        <SettingsIcon size={16} />
                                        Hồ sơ & Cài đặt
                                    </Link>
                                    <button
                                        onClick={handleLogout}
                                        className="w-full flex items-center gap-3 px-3 py-2.5 text-sm font-medium text-red-600 rounded-xl hover:bg-red-50 transition-colors mt-1 focus:outline-none"
                                    >
                                        <LogOut size={16} />
                                        Đăng xuất
                                    </button>
                                </div>
                            </div>
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
}
