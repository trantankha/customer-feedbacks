'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { LayoutDashboard, Users, Mail, Phone, MapPin, ShieldCheck, FileText, Settings as SettingsIcon, Facebook, Youtube, Linkedin } from 'lucide-react';

export default function Footer() {
    const pathname = usePathname();

    return (
        <footer className="bg-gray-900 text-gray-300">
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-12">
                    {/* Brand Column */}
                    <div className="lg:col-span-2">
                        <div className="flex items-center gap-2 mb-4">
                            <div className="w-8 h-8 bg-blue-600 rounded flex items-center justify-center text-white">
                                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="w-5 h-5">
                                    <path strokeLinecap="round" strokeLinejoin="round" d="M13 10V3L4 14h7v7l9-11h-7z" />
                                </svg>
                            </div>
                            <span className="font-bold text-xl text-white tracking-tight">NovaCorp Pro</span>
                        </div>
                        <p className="text-gray-400 text-sm leading-relaxed mb-6 max-w-xs">
                            Nền tảng AI phân tích đánh giá khách hàng từ Facebook & Shopee. Giúp bạn thấu hiểu khách hàng và tăng trưởng doanh thu.
                        </p>
                        <div className="flex items-center gap-3">
                            <a href="#" className="w-10 h-10 rounded-lg bg-gray-800 flex items-center justify-center hover:bg-blue-600 transition-colors">
                                <Facebook className="w-5 h-5" />
                            </a>
                            <a href="#" className="w-10 h-10 rounded-lg bg-gray-800 flex items-center justify-center hover:bg-red-600 transition-colors">
                                <Youtube className="w-5 h-5" />
                            </a>
                            <a href="#" className="w-10 h-10 rounded-lg bg-gray-800 flex items-center justify-center hover:bg-blue-700 transition-colors">
                                <Linkedin className="w-5 h-5" />
                            </a>
                        </div>
                    </div>

                    {/* Product Column */}
                    <div>
                        <h4 className="text-white font-semibold mb-4">Sản phẩm</h4>
                        <ul className="space-y-3">
                            <li>
                                <Link
                                    href="/dashboard"
                                    className={`text-sm transition-colors ${pathname === '/dashboard' ? 'text-blue-400 font-medium' : 'text-gray-400 hover:text-white'}`}
                                >
                                    Bảng điều khiển
                                </Link>
                            </li>
                            <li>
                                <Link
                                    href="/customers"
                                    className={`text-sm transition-colors ${pathname === '/customers' ? 'text-blue-400 font-medium' : 'text-gray-400 hover:text-white'}`}
                                >
                                    Khách hàng CRM
                                </Link>
                            </li>
                            <li>
                                <Link
                                    href="/settings"
                                    className={`text-sm transition-colors ${pathname === '/settings' ? 'text-blue-400 font-medium' : 'text-gray-400 hover:text-white'}`}
                                >
                                    Thiết lập tài khoản
                                </Link>
                            </li>
                            <li><Link href="#" className="text-gray-400 hover:text-white transition-colors text-sm">Extension Chrome</Link></li>
                        </ul>
                    </div>

                    {/* Support Column */}
                    <div>
                        <h4 className="text-white font-semibold mb-4">Hỗ trợ</h4>
                        <ul className="space-y-3">
                            <li><Link href="#" className="text-gray-400 hover:text-white transition-colors text-sm">Trung tâm trợ giúp</Link></li>
                            <li><Link href="#" className="text-gray-400 hover:text-white transition-colors text-sm">Hướng dẫn sử dụng</Link></li>
                            <li><Link href="#" className="text-gray-400 hover:text-white transition-colors text-sm">FAQ</Link></li>
                            <li><Link href="#" className="text-gray-400 hover:text-white transition-colors text-sm">Liên hệ hỗ trợ</Link></li>
                        </ul>
                    </div>

                    {/* Contact Column */}
                    <div>
                        <h4 className="text-white font-semibold mb-4">Liên hệ</h4>
                        <ul className="space-y-3">
                            <li className="flex items-start gap-2 text-sm text-gray-400">
                                <Mail className="w-4 h-4 mt-0.5 flex-shrink-0" />
                                <span className="hover:text-white cursor-pointer transition-colors">support@novacorp.vn</span>
                            </li>
                            <li className="flex items-start gap-2 text-sm text-gray-400">
                                <Phone className="w-4 h-4 mt-0.5 flex-shrink-0" />
                                <span className="hover:text-white cursor-pointer transition-colors">1900 xxxx</span>
                            </li>
                            <li className="flex items-start gap-2 text-sm text-gray-400">
                                <MapPin className="w-4 h-4 mt-0.5 flex-shrink-0" />
                                <span>TP. Hà Nội, Việt Nam</span>
                            </li>
                        </ul>
                    </div>
                </div>
            </div>

            {/* Bottom Bar */}
            <div className="border-t border-gray-800">
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 flex flex-col sm:flex-row items-center justify-between gap-4">
                    <p className="text-gray-500 text-sm">
                        &copy; 2026 NovaCorp Pro. Mọi quyền được bảo lưu.
                    </p>
                    <div className="flex items-center gap-6">
                        <Link href="#" className="text-gray-500 hover:text-gray-300 text-sm transition-colors">
                            Điều khoản sử dụng
                        </Link>
                        <Link href="#" className="text-gray-500 hover:text-gray-300 text-sm transition-colors">
                            Chính sách bảo mật
                        </Link>
                    </div>
                </div>
            </div>
        </footer>
    );
}
