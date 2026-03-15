'use client';

import { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { Eye, EyeOff, Mail, Lock } from 'lucide-react';
import api from '@/lib/api';

export default function LoginPage() {
    const router = useRouter();
    const [showPassword, setShowPassword] = useState(false);
    const [username, setUsername] = useState('');
    const [password, setPassword] = useState('');
    const [error, setError] = useState('');
    const [isLoading, setIsLoading] = useState(false);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setError('');
        setIsLoading(true);

        try {
            // Send JSON data as required by the backend's UserLogin schema
            const response = await api.post('/auth/login', {
                username: username,
                password: password
            });

            // Store the token
            localStorage.setItem('access_token', response.data.access_token);

            // Redirect to dashboard
            router.push('/dashboard');
        } catch (err: any) {
            setError(err.response?.data?.detail || 'Sai tài khoản hoặc mật khẩu');
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <div className="flex w-full h-full">
            {/* Left Side - Form (Mockup 3) */}
            <div className="flex flex-col w-full lg:w-[45%] p-8 md:p-12 justify-center relative bg-white">
                <div className="absolute top-8 left-8 flex items-center gap-2">
                    <div className="w-8 h-8 bg-[#0000CC] rounded flex items-center justify-center text-white">
                        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="w-5 h-5">
                            <path strokeLinecap="round" strokeLinejoin="round" d="M13 10V3L4 14h7v7l9-11h-7z" />
                        </svg>
                    </div>
                    <span className="font-bold text-xl text-gray-900 tracking-tight">NovaCorp</span>
                </div>

                <div className="absolute top-8 right-8 text-sm">
                    Chưa có tài khoản?{' '}
                    <Link href="/register" className="font-semibold text-white bg-[#0000CC] px-4 py-2 rounded-md hover:bg-blue-800 transition-colors">
                        Đăng ký ngay
                    </Link>
                </div>

                <div className="w-full max-w-sm mx-auto mt-12">
                    <h2 className="text-[2.5rem] font-bold text-gray-900 leading-tight mb-2 tracking-tight">Chào mừng quay lại</h2>
                    <p className="text-gray-500 mb-8">Vui lòng nhập thông tin đăng nhập của bạn</p>

                    <div className="grid grid-cols-2 gap-4 mb-8">
                        <button className="flex items-center justify-center gap-2 py-2.5 bg-white border border-gray-200 rounded-xl hover:bg-gray-50 transition-colors font-medium text-gray-700 shadow-sm">
                            <svg className="w-5 h-5" viewBox="0 0 24 24">
                                <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4" />
                                <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853" />
                                <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05" />
                                <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335" />
                            </svg>
                            Google
                        </button>
                        <button className="flex items-center justify-center gap-2 py-2.5 bg-white border border-gray-200 rounded-xl hover:bg-gray-50 transition-colors font-medium text-gray-700 shadow-sm">
                            <svg className="w-5 h-5" fill="#1877F2" viewBox="0 0 24 24">
                                <path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.469h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.469h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z" />
                            </svg>
                            Facebook
                        </button>
                    </div>

                    <div className="relative mb-8">
                        <div className="absolute inset-0 flex items-center">
                            <div className="w-full border-t border-gray-200"></div>
                        </div>
                        <div className="relative flex justify-center text-xs uppercase font-medium tracking-wider">
                            <span className="px-4 bg-white text-gray-400">Hoặc sử dụng Email</span>
                        </div>
                    </div>

                    {error && (
                        <div className="mb-6 p-3 bg-red-50 border border-red-200 text-red-600 rounded-lg text-sm">
                            {error}
                        </div>
                    )}

                    <form onSubmit={handleSubmit} className="space-y-5">
                        <div className="space-y-1.5">
                            <label className="text-sm font-bold text-gray-800">Tên đăng nhập</label>
                            <div className="relative">
                                <Mail className="w-5 h-5 absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
                                <input
                                    type="text"
                                    required
                                    value={username}
                                    onChange={(e) => setUsername(e.target.value)}
                                    placeholder="Tên đăng nhập"
                                    className="w-full pl-10 pr-4 py-3 bg-white border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-600 focus:border-transparent outline-none transition-all placeholder:text-gray-400"
                                />
                            </div>
                        </div>

                        <div className="space-y-1.5">
                            <div className="flex items-center justify-between">
                                <label className="text-sm font-bold text-gray-800">Mật khẩu</label>
                                <a href="#" className="text-xs font-semibold text-[#0000CC] hover:underline">Quên mật khẩu?</a>
                            </div>
                            <div className="relative">
                                <Lock className="w-5 h-5 absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
                                <input
                                    type={showPassword ? "text" : "password"}
                                    required
                                    value={password}
                                    onChange={(e) => setPassword(e.target.value)}
                                    placeholder="••••••••"
                                    className="w-full pl-10 pr-10 py-3 bg-white border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-600 focus:border-transparent outline-none transition-all placeholder:text-gray-400 tracking-widest"
                                />
                                <button
                                    type="button"
                                    onClick={() => setShowPassword(!showPassword)}
                                    className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 focus:outline-none"
                                >
                                    {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                                </button>
                            </div>
                        </div>

                        <div className="flex items-center gap-2 pt-1 pb-2">
                            <input type="checkbox" id="remember" className="w-4 h-4 text-[#0000CC] rounded border-gray-300 focus:ring-[#0000CC]" />
                            <label htmlFor="remember" className="text-sm font-medium text-gray-700 select-none cursor-pointer">
                                Ghi nhớ đăng nhập
                            </label>
                        </div>

                        <button
                            type="submit"
                            disabled={isLoading}
                            className="w-full bg-[#0000CC] hover:bg-blue-800 disabled:bg-blue-400 text-white font-bold py-3.5 rounded-xl transition-all flex items-center justify-center gap-2 shadow-lg shadow-blue-600/20"
                        >
                            {isLoading ? 'Đang xử lý...' : 'Đăng nhập'}
                        </button>

                        <p className="text-xs text-center text-gray-500 mt-6 leading-relaxed px-4">
                            Bằng việc đăng nhập, bạn đồng ý với <strong className="text-gray-700">Điều khoản</strong> và <strong className="text-gray-700">Bảo mật</strong>.
                        </p>
                    </form>
                </div>

                <div className="absolute bottom-8 left-0 right-0 text-center text-xs text-gray-400">
                    © 2026 Phân tích Phản hồi AI. Tất cả các quyền được bảo lưu.
                </div>
            </div>

            {/* Right Side - Solid Blue Card (Mockup 3) */}
            <div className="hidden lg:flex flex-col w-[55%] bg-[#0000CC] text-white p-12 relative overflow-hidden items-center justify-center">
                {/* Dotted pattern overlay */}
                <div className="absolute inset-0 opacity-20" style={{ backgroundImage: 'radial-gradient(circle at 2px 2px, white 1px, transparent 0)', backgroundSize: '32px 32px' }}></div>

                <div className="relative z-10 flex flex-col items-center text-center max-w-lg">
                    <div className="w-20 h-20 bg-white/10 rounded-2xl flex items-center justify-center mb-8 backdrop-blur-sm border border-white/20">
                        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="w-10 h-10 text-white">
                            <polyline points="22 12 18 12 15 21 9 3 6 12 2 12"></polyline>
                        </svg>
                    </div>

                    <h1 className="text-4xl font-bold leading-tight mb-6">
                        Phân tích sâu sắc hơn
                        cho quyết định tốt hơn
                    </h1>

                    <p className="text-xl text-blue-100 mb-16 font-light">
                        Nền tảng trí tuệ nhân tạo giúp bạn thấu hiểu<br />
                        khách hàng qua từng phản hồi.
                    </p>

                    <div className="grid grid-cols-3 gap-12 w-full mt-4">
                        <div className="flex flex-col items-center">
                            <span className="text-4xl font-bold mb-2">99%</span>
                            <span className="text-sm text-blue-200">Độ chính xác</span>
                        </div>
                        <div className="flex flex-col items-center">
                            <span className="text-4xl font-bold mb-2">10k+</span>
                            <span className="text-sm text-blue-200">Người dùng</span>
                        </div>
                        <div className="flex flex-col items-center">
                            <span className="text-4xl font-bold mb-2">24/7</span>
                            <span className="text-sm text-blue-200">Hỗ trợ AI</span>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}
