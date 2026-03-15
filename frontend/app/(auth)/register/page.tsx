'use client';

import { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { Eye, EyeOff, User, Lock, Mail } from 'lucide-react';

export default function RegisterPage() {
    const router = useRouter();
    const [showPassword, setShowPassword] = useState(false);
    const [showConfirm, setShowConfirm] = useState(false);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');

    const [formData, setFormData] = useState({
        username: '',
        full_name: '',
        email: '',
        password: '',
        confirm_password: '',
    });

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setError('');

        if (formData.password !== formData.confirm_password) {
            setError('Mật khẩu xác nhận không khớp');
            return;
        }

        if (formData.password.length < 6) {
            setError('Mật khẩu phải có ít nhất 6 ký tự');
            return;
        }

        setLoading(true);

        try {
            const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000'}/api/v1/auth/register`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    username: formData.username,
                    email: formData.email,
                    password: formData.password,
                    full_name: formData.full_name || undefined,
                }),
            });

            const data = await response.json();

            if (!response.ok) {
                throw new Error(data.detail || 'Đăng ký thất bại');
            }

            router.push('/login?registered=true');
        } catch (err) {
            setError(err instanceof Error ? err.message : 'Có lỗi xảy ra');
        } finally {
            setLoading(false);
        }
    };

    const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        setFormData({ ...formData, [e.target.name]: e.target.value });
    };

    return (
        <div className="flex w-full min-h-screen">
            {/* Left Side - Scrollable Form */}
            <div className="flex flex-col w-full lg:w-[48%] bg-white relative">
                {/* Header - Fixed */}
                <div className="flex items-center justify-between p-4 md:p-6 border-b border-gray-100 bg-white sticky top-0 z-10">
                    <div className="flex items-center gap-2">
                        <div className="w-8 h-8 bg-[#0000CC] rounded flex items-center justify-center text-white">
                            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="w-5 h-5">
                                <path strokeLinecap="round" strokeLinejoin="round" d="M13 10V3L4 14h7v7l9-11h-7z" />
                            </svg>
                        </div>
                        <span className="font-bold text-xl text-gray-900 tracking-tight">NovaCorp</span>
                    </div>
                    <div className="text-sm">
                        Đã có tài khoản?{' '}
                        <Link href="/login" className="font-semibold text-white bg-[#0000CC] px-4 py-2 rounded-md hover:bg-blue-800 transition-colors">
                            Đăng nhập
                        </Link>
                    </div>
                </div>

                {/* Scrollable Content */}
                <div className="flex-1 overflow-y-auto">
                    <div className="w-full max-w-md mx-auto p-4 md:p-6 pb-8">
                        <div className="mb-8">
                            <h1 className="text-3xl font-bold text-gray-900 leading-tight mb-2">Đăng ký tài khoản</h1>
                            <p className="text-gray-500">Vui lòng điền đầy đủ thông tin bên dưới</p>
                        </div>

                        {error && (
                            <div className="mb-6 p-3 bg-red-50 border border-red-200 text-red-600 rounded-lg text-sm">
                                {error}
                            </div>
                        )}

                        <form onSubmit={handleSubmit} className="space-y-5">
                            <div className="space-y-1.5">
                                <label className="text-sm font-bold text-gray-800">Tên đăng nhập <span className="text-red-500">*</span></label>
                                <div className="relative">
                                    <User className="w-5 h-5 absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
                                    <input
                                        type="text"
                                        name="username"
                                        value={formData.username}
                                        onChange={handleChange}
                                        placeholder="nguyenvana"
                                        required
                                        minLength={3}
                                        maxLength={50}
                                        pattern="^[a-zA-Z0-9_]+$"
                                        className="w-full pl-10 pr-4 py-3 bg-white border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-600 focus:border-transparent outline-none transition-all placeholder:text-gray-400"
                                    />
                                </div>
                                <p className="text-xs text-gray-500">Chỉ chứa chữ, số và dấu gạch dưới (3-50 ký tự)</p>
                            </div>

                            <div className="space-y-1.5">
                                <label className="text-sm font-bold text-gray-800">Họ và tên</label>
                                <div className="relative">
                                    <input
                                        type="text"
                                        name="full_name"
                                        value={formData.full_name}
                                        onChange={handleChange}
                                        placeholder="Nguyễn Văn A"
                                        maxLength={100}
                                        className="w-full px-4 py-3 bg-white border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-600 focus:border-transparent outline-none transition-all placeholder:text-gray-400"
                                    />
                                </div>
                            </div>

                            <div className="space-y-1.5">
                                <label className="text-sm font-bold text-gray-800">Email công việc <span className="text-red-500">*</span></label>
                                <div className="relative">
                                    <Mail className="w-5 h-5 absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
                                    <input
                                        type="email"
                                        name="email"
                                        value={formData.email}
                                        onChange={handleChange}
                                        placeholder="name@company.com"
                                        required
                                        className="w-full pl-10 pr-4 py-3 bg-white border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-600 focus:border-transparent outline-none transition-all placeholder:text-gray-400"
                                    />
                                </div>
                            </div>

                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                                <div className="space-y-1.5">
                                    <label className="text-sm font-bold text-gray-800">Mật khẩu <span className="text-red-500">*</span></label>
                                    <div className="relative">
                                        <Lock className="w-5 h-5 absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
                                        <input
                                            type={showPassword ? "text" : "password"}
                                            name="password"
                                            value={formData.password}
                                            onChange={handleChange}
                                            placeholder="••••••••"
                                            required
                                            minLength={6}
                                            maxLength={100}
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
                                <div className="space-y-1.5">
                                    <label className="text-sm font-bold text-gray-800">Xác nhận <span className="text-red-500">*</span></label>
                                    <div className="relative">
                                        <Lock className="w-5 h-5 absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
                                        <input
                                            type={showConfirm ? "text" : "password"}
                                            name="confirm_password"
                                            value={formData.confirm_password}
                                            onChange={handleChange}
                                            placeholder="••••••••"
                                            required
                                            minLength={6}
                                            maxLength={100}
                                            className="w-full pl-10 pr-10 py-3 bg-white border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-600 focus:border-transparent outline-none transition-all placeholder:text-gray-400 tracking-widest"
                                        />
                                        <button
                                            type="button"
                                            onClick={() => setShowConfirm(!showConfirm)}
                                            className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 focus:outline-none"
                                        >
                                            {showConfirm ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                                        </button>
                                    </div>
                                </div>
                            </div>

                            <div className="flex items-start gap-2 pt-2">
                                <input type="checkbox" id="terms" className="mt-1 w-4 h-4 text-blue-600 rounded border-gray-300 focus:ring-blue-600" required />
                                <label htmlFor="terms" className="text-sm text-gray-600 cursor-pointer select-none">
                                    Tôi đồng ý với <a href="#" className="text-blue-700 hover:underline font-medium">Điều khoản dịch vụ</a> và <a href="#" className="text-blue-700 hover:underline font-medium">Chính sách bảo mật</a>.
                                </label>
                            </div>

                            <button
                                type="submit"
                                disabled={loading}
                                className="w-full bg-[#0000CC] hover:bg-blue-800 disabled:bg-blue-400 text-white font-bold py-3.5 rounded-xl transition-all flex items-center justify-center gap-2 shadow-lg shadow-blue-600/20"
                            >
                                {loading ? 'Đang xử lý...' : 'Đăng ký ngay'} {!loading && <span className="text-xl leading-none">→</span>}
                            </button>
                        </form>

                        <p className="text-xs text-center text-gray-500 leading-relaxed mt-4">
                            Bằng việc đăng ký, bạn đồng ý với <strong className="text-gray-700">Điều khoản</strong> và <strong className="text-gray-700">Bảo mật</strong>.
                        </p>
                    </div>
                </div>

                {/* Footer - Fixed */}
                <div className="p-4 border-t border-gray-100 bg-white text-center text-xs text-gray-400">
                    © 2026 NovaCorp. Tất cả các quyền được bảo lưu.
                </div>
            </div>

            {/* Right Side - Branding (Fixed) */}
            <div className="hidden lg:flex flex-col w-[52%] bg-[#0000CC] text-white relative overflow-hidden items-center justify-center">
                {/* Dotted pattern overlay */}
                <div className="absolute inset-0 opacity-20" style={{ backgroundImage: 'radial-gradient(circle at 2px 2px, white 1px, transparent 0)', backgroundSize: '32px 32px' }}></div>

                {/* Gradient overlay */}
                <div className="absolute inset-0 bg-gradient-to-br from-blue-600/50 to-transparent"></div>

                <div className="relative z-10 flex flex-col items-center text-center max-w-lg px-8">
                    <div className="w-20 h-20 bg-white/10 rounded-2xl flex items-center justify-center mb-8 backdrop-blur-sm border border-white/20 shadow-xl">
                        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="w-10 h-10 text-white">
                            <polyline points="22 12 18 12 15 21 9 3 6 12 2 12"></polyline>
                        </svg>
                    </div>

                    <h1 className="text-4xl xl:text-5xl font-bold leading-tight mb-6">
                        Bắt đầu hành trình
                        <br /><span className="text-blue-200">chuyên nghiệp</span> của bạn
                    </h1>

                    <p className="text-xl text-blue-100 mb-12 font-light leading-relaxed">
                        Gia nhập cộng đồng hơn 50,000 chuyên gia<br />
                        đang phát triển sự nghiệp mỗi ngày.
                    </p>

                    <div className="grid grid-cols-3 gap-8 w-full">
                        <div className="flex flex-col items-center p-4 bg-white/5 rounded-xl backdrop-blur-sm border border-white/10">
                            <span className="text-4xl font-bold mb-1">50k+</span>
                            <span className="text-sm text-blue-200">Người dùng</span>
                        </div>
                        <div className="flex flex-col items-center p-4 bg-white/5 rounded-xl backdrop-blur-sm border border-white/10">
                            <span className="text-4xl font-bold mb-1">99%</span>
                            <span className="text-sm text-blue-200">Độ chính xác</span>
                        </div>
                        <div className="flex flex-col items-center p-4 bg-white/5 rounded-xl backdrop-blur-sm border border-white/10">
                            <span className="text-4xl font-bold mb-1">24/7</span>
                            <span className="text-sm text-blue-200">Hỗ trợ AI</span>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}
