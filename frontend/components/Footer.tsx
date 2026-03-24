'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { LayoutDashboard, Users, Mail, Phone, MapPin, ShieldCheck, FileText, Settings as SettingsIcon } from 'lucide-react';

export default function Footer() {
    const pathname = usePathname();

    return (
        <footer className="bg-white border-t border-gray-100 mt-auto pt-16 pb-8">
            <div className="max-w-[1600px] mx-auto px-6 md:px-8">
                <div className="grid grid-cols-1 md:grid-cols-4 gap-x-8 gap-y-12">
                    {/* Brand Section */}
                    <div className="col-span-1 md:col-span-1 flex flex-col items-start pr-4">
                        <div className="flex items-center gap-3 mb-5">
                            <div className="p-2.5 bg-blue-600 rounded-lg shadow-md shadow-blue-600/20">
                                <LayoutDashboard size={20} className="text-white drop-shadow-sm" />
                            </div>
                            <h2 className="text-xl font-bold tracking-tight text-gray-900">NovaCorp Pro</h2>
                        </div>
                        <p className="text-sm text-gray-500 leading-relaxed">
                            Giải pháp thông minh quản lý và phân tích phản hồi khách hàng toàn diện bằng sức mạnh Trí tuệ Nhân tạo.
                        </p>
                    </div>

                    {/* Navigation */}
                    <div>
                        <h3 className="text-xs font-bold tracking-widest text-gray-900 uppercase mb-6">Tính năng chính</h3>
                        <nav className="flex flex-col gap-4">
                            <Link
                                href="/dashboard"
                                className={`text-sm flex items-center gap-3 transition-colors ${pathname === '/dashboard' ? 'text-blue-600 font-medium' : 'text-gray-500 hover:text-blue-600'}`}
                            >
                                <LayoutDashboard size={16} /> Bảng điều khiển
                            </Link>
                            <Link
                                href="/customers"
                                className={`text-sm flex items-center gap-3 transition-colors ${pathname === '/customers' ? 'text-blue-600 font-medium' : 'text-gray-500 hover:text-blue-600'}`}
                            >
                                <Users size={16} /> Khách hàng CRM
                            </Link>
                            <Link
                                href="/settings"
                                className={`text-sm flex items-center gap-3 transition-colors ${pathname === '/settings' ? 'text-blue-600 font-medium' : 'text-gray-500 hover:text-blue-600'}`}
                            >
                                <SettingsIcon size={16} /> Thiết lập tài khoản
                            </Link>
                        </nav>
                    </div>

                    {/* Legal */}
                    <div>
                        <h3 className="text-xs font-bold tracking-widest text-gray-900 uppercase mb-6">Hỗ trợ & Chính sách</h3>
                        <nav className="flex flex-col gap-4">
                            <a href="#" className="text-sm flex items-center gap-3 text-gray-500 hover:text-blue-600 transition-colors">
                                <ShieldCheck size={16} /> Chính sách bảo mật
                            </a>
                            <a href="#" className="text-sm flex items-center gap-3 text-gray-500 hover:text-blue-600 transition-colors">
                                <FileText size={16} /> Điều khoản sử dụng
                            </a>
                        </nav>
                    </div>

                    {/* Contact Info */}
                    <div>
                        <h3 className="text-xs font-bold tracking-widest text-gray-900 uppercase mb-6">Liên hệ</h3>
                        <div className="flex flex-col gap-4">
                            <div className="flex items-center gap-3 text-sm text-gray-500 group">
                                <div className="w-8 h-8 rounded-full bg-blue-50 flex items-center justify-center shrink-0 group-hover:bg-blue-100 transition-colors">
                                    <Mail size={14} className="text-blue-600" />
                                </div>
                                <span className="group-hover:text-blue-600 cursor-pointer transition-colors">support@novacorp.com</span>
                            </div>
                            <div className="flex items-center gap-3 text-sm text-gray-500 group">
                                <div className="w-8 h-8 rounded-full bg-blue-50 flex items-center justify-center shrink-0 group-hover:bg-blue-100 transition-colors">
                                    <Phone size={14} className="text-blue-600" />
                                </div>
                                <span className="group-hover:text-blue-600 cursor-pointer transition-colors">+84 1900 9999</span>
                            </div>
                            <div className="flex items-center gap-3 text-sm text-gray-500 group">
                                <div className="w-8 h-8 rounded-full bg-blue-50 flex items-center justify-center shrink-0 group-hover:bg-blue-100 transition-colors">
                                    <MapPin size={14} className="text-blue-600" />
                                </div>
                                <span>Tòa nhà Lotte Center, Ba Đình, Hà Nội</span>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Copyright */}
                <div className="border-t border-gray-100 mt-12 pt-8 flex flex-col md:flex-row items-center justify-between gap-4">
                    <p className="text-sm text-gray-400">
                        &copy; 2026 NovaCorp Pro. Hệ thống phân tích AI.
                    </p>
                    <div className="flex items-center gap-4 text-sm text-gray-400 font-medium">
                        <span>Phiên bản 1.0.0</span>
                        <span className="w-1.5 h-1.5 rounded-full bg-gray-300"></span>
                        <span className="flex items-center gap-2"><span className="w-2 h-2 rounded-full bg-green-500 animate-pulse"></span> Hệ thống khả dụng</span>
                    </div>
                </div>
            </div>
        </footer>
    );
}
