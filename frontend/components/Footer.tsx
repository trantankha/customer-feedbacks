'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { LayoutDashboard, Users, Mail, Phone, MapPin } from 'lucide-react';

interface FooterProps {
    theme?: 'dark' | 'light';
}

export default function Footer({ theme = 'light' }: FooterProps) {
    const pathname = usePathname();
    const isDark = theme === 'dark';

    return (
        <footer className={`border-t ${isDark ? 'border-gray-800 bg-[#16181d]/90 backdrop-blur-md' : 'border-gray-200 bg-white/95 backdrop-blur-md shadow-lg'} mt-auto transition-all duration-300 ease-in-out`}>
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
                <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
                    {/* Brand Section */}
                    <div className="flex flex-col items-center md:items-start">
                        <div className={`p-3 ${isDark ? 'bg-gradient-to-br from-purple-500 to-purple-700' : 'bg-gradient-to-br from-blue-500 to-blue-700'} rounded-xl shadow-xl ${isDark ? 'shadow-purple-900/60' : 'shadow-blue-900/60'} transition-transform duration-200 hover:scale-105 mb-4`}>
                            {isDark ? (
                                <LayoutDashboard size={22} className="text-white drop-shadow-sm" />
                            ) : (
                                <Users size={22} className="text-white drop-shadow-sm" />
                            )}
                        </div>
                        <h2 className={`text-xl font-bold tracking-tight ${isDark ? 'text-white' : 'text-gray-900'} transition-colors duration-200`}>FeedbackPro AI</h2>
                        <p className={`text-sm ${isDark ? 'text-gray-400' : 'text-gray-600'} mt-2 text-center md:text-left`}>
                            Hệ thống quản lý phản hồi khách hàng thông minh
                        </p>
                    </div>

                    {/* Navigation Links */}
                    <div className="flex flex-col items-center md:items-start">
                        <h3 className={`text-lg font-semibold mb-4 ${isDark ? 'text-white' : 'text-gray-900'}`}>Điều hướng</h3>
                        <nav className="flex flex-col gap-2">
                            <Link
                                href="/"
                                className={`flex items-center gap-2 text-sm font-medium transition-all duration-200 hover:scale-105 ${pathname === '/' ? (isDark ? 'text-purple-300' : 'text-blue-600') : (isDark ? 'text-gray-400 hover:text-white' : 'text-gray-600 hover:text-gray-900')}`}
                            >
                                <LayoutDashboard size={16} /> Dashboard
                            </Link>
                            <Link
                                href="/customers"
                                className={`flex items-center gap-2 text-sm font-medium transition-all duration-200 hover:scale-105 ${pathname === '/customers' ? (isDark ? 'text-purple-300' : 'text-blue-600') : (isDark ? 'text-gray-400 hover:text-white' : 'text-gray-600 hover:text-gray-900')}`}
                            >
                                <Users size={16} /> Khách hàng (CRM)
                            </Link>
                        </nav>
                    </div>

                    {/* Contact Info */}
                    <div className="flex flex-col items-center md:items-start">
                        <h3 className={`text-lg font-semibold mb-4 ${isDark ? 'text-white' : 'text-gray-900'}`}>Liên hệ</h3>
                        <div className="flex flex-col gap-2">
                            <div className={`flex items-center gap-2 text-sm ${isDark ? 'text-gray-400' : 'text-gray-600'}`}>
                                <Mail size={16} />
                                <span>support@feedbackpro.ai</span>
                            </div>
                            <div className={`flex items-center gap-2 text-sm ${isDark ? 'text-gray-400' : 'text-gray-600'}`}>
                                <Phone size={16} />
                                <span>+84 123 456 789</span>
                            </div>
                            <div className={`flex items-center gap-2 text-sm ${isDark ? 'text-gray-400' : 'text-gray-600'}`}>
                                <MapPin size={16} />
                                <span>Hà Nội, Việt Nam</span>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Copyright */}
                <div className={`border-t ${isDark ? 'border-gray-700' : 'border-gray-300'} mt-8 pt-6 text-center`}>
                    <p className={`text-sm ${isDark ? 'text-gray-400' : 'text-gray-600'}`}>
                        © 2024 FeedbackPro AI. Tất cả quyền được bảo lưu.
                    </p>
                </div>
            </div>
        </footer>
    );
}
