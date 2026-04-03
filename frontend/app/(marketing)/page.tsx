'use client';

import Link from 'next/link';
import { ArrowRight, BarChart3, UploadCloud, Chrome, Check, Star } from 'lucide-react';
import { useState } from 'react';

export default function LandingPage() {
    const [isAnnual, setIsAnnual] = useState(false);

    return (
        <div className="min-h-screen bg-gray-50 flex flex-col font-sans">
            {/* Navigation Header */}
            <header className="flex items-center justify-between px-8 py-5 bg-white border-b border-gray-100">
                <div className="flex items-center gap-2">
                    <div className="w-8 h-8 bg-[#0000CC] rounded flex items-center justify-center text-white">
                        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="w-5 h-5">
                            <path strokeLinecap="round" strokeLinejoin="round" d="M13 10V3L4 14h7v7l9-11h-7z" />
                        </svg>
                    </div>
                    <span className="font-bold text-xl text-gray-900 tracking-tight">NovaCorp Pro</span>
                </div>

                <nav className="hidden md:flex items-center gap-8 text-sm font-medium text-gray-600">
                    <button className="hover:text-blue-600 transition-colors">Tính năng</button>
                    <button className="hover:text-blue-600 transition-colors">Bảng giá</button>
                    <button className="hover:text-blue-600 transition-colors">Tiện ích</button>
                    <button className="hover:text-blue-600 transition-colors">Liên hệ</button>
                </nav>

                <div className="flex items-center gap-4">
                    <Link href="/login" className="text-sm font-medium text-gray-600 hover:text-blue-600 transition-colors">
                        Đăng nhập
                    </Link>
                    <Link href="/register" className="text-sm font-medium bg-blue-600 text-white px-5 py-2 rounded-md hover:bg-blue-700 transition-colors">
                        Dùng thử miễn phí
                    </Link>
                </div>
            </header>

            {/* Hero Section */}
            <section className="flex-1 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-20 flex flex-col md:flex-row items-center justify-between gap-12">
                <div className="flex-1 max-w-4xl">
                    <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-blue-50 text-blue-600 text-xs font-semibold uppercase tracking-wider mb-6">
                        <span className="w-2 h-2 rounded-full bg-blue-600"></span>
                        Công nghệ AI mới nhất
                    </div>
                    <h1 className="text-5xl md:text-6xl font-extrabold text-gray-900 leading-tight mb-6">
                        Phân tích đánh giá
                        <span className="text-blue-600"> Facebook & Shopee</span> tự động
                    </h1>
                    <p className="text-lg text-gray-600 mb-8 leading-relaxed max-w-xl">
                        Hiểu rõ tâm lý khách hàng chỉ trong vài giây. Tối ưu hóa phản hồi và cải thiện dịch vụ của bạn dựa trên dữ liệu thực tế từ mạng xã hội và sàn TMĐT.
                    </p>

                    <div className="flex items-center gap-4">
                        <Link href="/register" className="flex items-center gap-2 bg-blue-700 text-white font-medium px-8 py-3.5 rounded-lg hover:bg-blue-800 transition-all shadow-lg shadow-blue-600/20">
                            Bắt đầu ngay <ArrowRight className="w-5 h-5" />
                        </Link>
                        <button className="flex items-center gap-2 bg-white text-gray-700 font-medium px-8 py-3.5 rounded-lg border border-gray-200 hover:bg-gray-50 transition-colors">
                            Xem bản demo
                        </button>
                    </div>

                    <div className="mt-10 flex items-center gap-4">
                        <div className="flex -space-x-3">
                            <img
                                src="https://api.dicebear.com/9.x/avataaars/svg?seed=customer1&backgroundColor=b6e3f4"
                                alt="Customer"
                                className="w-10 h-10 rounded-full border-2 border-white object-cover"
                            />
                            <img
                                src="https://api.dicebear.com/9.x/avataaars/svg?seed=customer2&backgroundColor=c0aede"
                                alt="Customer"
                                className="w-10 h-10 rounded-full border-2 border-white object-cover"
                            />
                            <img
                                src="https://api.dicebear.com/9.x/avataaars/svg?seed=customer3&backgroundColor=ffd5dc"
                                alt="Customer"
                                className="w-10 h-10 rounded-full border-2 border-white object-cover"
                            />
                        </div>
                        <p className="text-sm text-gray-500 font-medium">Hơn 2,000+ chủ shop tin dùng</p>
                    </div>
                </div>

                <div className="flex-1 relative">
                    <div className="absolute inset-0 bg-gradient-to-tr from-blue-100 to-transparent rounded-3xl blur-3xl opacity-50"></div>
                    <div className="relative bg-white p-8 rounded-3xl shadow-2xl border border-gray-100 aspect-square max-w-md mx-auto flex items-center justify-center overflow-hidden">
                        {/* Thay bằng ảnh thật từ mockup khi có */}
                        <div className="w-full h-full bg-gray-100 rounded-2xl flex items-center justify-center overflow-hidden relative group">
                            <div className="absolute inset-0 bg-blue-600/5 group-hover:bg-transparent transition-colors z-10"></div>
                            <img
                                src="/images/hero-img.png"
                                alt="AI Analysis Assistant"
                                className="w-4/5 h-4/5 object-cover opacity-90 transition-transform duration-700 group-hover:scale-105"
                            />
                        </div>
                    </div>
                </div>
            </section>

            {/* Stats Bar */}
            <section className="bg-blue-700 text-white py-12">
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-8 text-center divide-x divide-blue-600/50">
                        <div>
                            <div className="text-4xl font-bold mb-2">10M+</div>
                            <div className="text-blue-100 text-sm font-medium">Đánh giá đã phân tích</div>
                        </div>
                        <div>
                            <div className="text-4xl font-bold mb-2">98%</div>
                            <div className="text-blue-100 text-sm font-medium">Độ chính xác AI</div>
                        </div>
                        <div>
                            <div className="text-4xl font-bold mb-2">85%</div>
                            <div className="text-blue-100 text-sm font-medium">Tiết kiệm thời gian</div>
                        </div>
                        <div>
                            <div className="text-4xl font-bold mb-2">24/7</div>
                            <div className="text-blue-100 text-sm font-medium">Hoạt động liên tục</div>
                        </div>
                    </div>
                </div>
            </section>

            {/* Features Section */}
            <section className="py-24 bg-gray-50">
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
                    <h2 className="text-3xl font-bold text-gray-900 mb-4">Giải pháp phân tích toàn diện</h2>
                    <p className="text-gray-600 mb-16 max-w-2xl mx-auto">
                        Công cụ giúp bạn nắm bắt tâm lý khách hàng và cải thiện chất lượng dịch vụ nhanh chóng.
                    </p>

                    <div className="grid grid-cols-1 md:grid-cols-3 gap-8 text-left">
                        {/* Callout Card 1 */}
                        <div className="bg-white p-8 rounded-2xl shadow-sm border border-gray-100 hover:shadow-md transition-shadow">
                            <div className="w-12 h-12 bg-blue-50 text-blue-600 rounded-xl flex items-center justify-center mb-6">
                                <BarChart3 className="w-6 h-6" />
                            </div>
                            <h3 className="text-xl font-bold text-gray-900 mb-3">Phân tích cảm xúc AI</h3>
                            <p className="text-gray-600 leading-relaxed">
                                Sử dụng mô hình NLP tiên tiến để tự động nhận diện thái độ: tích cực, tiêu cực hoặc trung tính từ hàng ngàn bình luận mỗi phút.
                            </p>
                        </div>
                        {/* Callout Card 2 */}
                        <div className="bg-white p-8 rounded-2xl shadow-sm border border-gray-100 hover:shadow-md transition-shadow">
                            <div className="w-12 h-12 bg-blue-50 text-blue-600 rounded-xl flex items-center justify-center mb-6">
                                <Chrome className="w-6 h-6" />
                            </div>
                            <h3 className="text-xl font-bold text-gray-900 mb-3">Tiện ích thu thập dữ liệu</h3>
                            <p className="text-gray-600 leading-relaxed">
                                Cài đặt Extension trình duyệt để trích xuất dữ liệu trực tiếp từ các bài đăng Facebook và sản phẩm Shopee chỉ với một click.
                            </p>
                        </div>
                        {/* Callout Card 3 */}
                        <div className="bg-white p-8 rounded-2xl shadow-sm border border-gray-100 hover:shadow-md transition-shadow">
                            <div className="w-12 h-12 bg-blue-50 text-blue-600 rounded-xl flex items-center justify-center mb-6">
                                <UploadCloud className="w-6 h-6" />
                            </div>
                            <h3 className="text-xl font-bold text-gray-900 mb-3">Tải lên tệp CSV</h3>
                            <p className="text-gray-600 leading-relaxed">
                                Hỗ trợ nhập dữ liệu hàng loạt từ các nguồn khác nhau. Hệ thống tự động làm sạch và phân tích các tệp dữ liệu lớn của bạn.
                            </p>
                        </div>
                    </div>
                </div>
            </section>

            {/* Pricing Section */}
            <section className="py-12 bg-gray-50">
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                    <div className="text-center mb-16">
                        <h2 className="text-3xl font-bold text-gray-900 mb-4">Bảng giá linh hoạt</h2>
                        <p className="text-gray-600 mb-8 max-w-2xl mx-auto">
                            Chọn gói phù hợp với nhu cầu kinh doanh của bạn. Nâng cấp hoặc hạ cấp bất cứ lúc nào.
                        </p>

                        {/* Billing Toggle */}
                        <div className="flex items-center justify-center gap-4">
                            <span className={`text-sm font-medium ${!isAnnual ? 'text-gray-900' : 'text-gray-500'}`}>
                                Thanh toán tháng
                            </span>
                            <button
                                onClick={() => setIsAnnual(!isAnnual)}
                                className={`relative w-14 h-7 rounded-full transition-colors ${isAnnual ? 'bg-blue-600' : 'bg-gray-300'}`}
                            >
                                <div
                                    className={`absolute top-0.5 left-0.5 w-6 h-6 bg-white rounded-full shadow-sm transition-transform ${isAnnual ? 'translate-x-7' : 'translate-x-0'}`}
                                ></div>
                            </button>
                            <span className={`text-sm font-medium ${isAnnual ? 'text-gray-900' : 'text-gray-500'}`}>
                                Thanh toán năm
                            </span>
                            <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-green-50 text-green-600 text-xs font-semibold">
                                Tiết kiệm 20%
                            </span>
                        </div>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-3 gap-8 items-start">
                        {/* Basic Plan */}
                        <div className="bg-white p-8 rounded-2xl border border-gray-200 hover:shadow-lg transition-shadow">
                            <h3 className="text-xl font-bold text-gray-900 mb-2">Cơ Bản</h3>
                            <p className="text-gray-500 text-sm mb-6">Dành cho người mới bắt đầu</p>
                            <div className="mb-6">
                                <span className="text-4xl font-bold text-gray-900">
                                    {isAnnual ? '79k' : '99k'}
                                </span>
                                <span className="text-gray-500 text-sm">/tháng</span>
                            </div>
                            <Link
                                href="/register"
                                className="block w-full py-3 rounded-lg border-2 border-gray-200 text-gray-700 font-medium text-center hover:border-blue-600 hover:text-blue-600 transition-colors"
                            >
                                Bắt đầu miễn phí
                            </Link>
                            <ul className="mt-8 space-y-4">
                                <li className="flex items-start gap-3">
                                    <Check className="w-5 h-5 text-green-500 mt-0.5 flex-shrink-0" />
                                    <span className="text-gray-600 text-sm">500 đánh giá/tháng</span>
                                </li>
                                <li className="flex items-start gap-3">
                                    <Check className="w-5 h-5 text-green-500 mt-0.5 flex-shrink-0" />
                                    <span className="text-gray-600 text-sm">Phân tích cảm xúc cơ bản</span>
                                </li>
                                <li className="flex items-start gap-3">
                                    <Check className="w-5 h-5 text-green-500 mt-0.5 flex-shrink-0" />
                                    <span className="text-gray-600 text-sm">Xuất báo cáo CSV</span>
                                </li>
                                <li className="flex items-start gap-3">
                                    <Check className="w-5 h-5 text-green-500 mt-0.5 flex-shrink-0" />
                                    <span className="text-gray-600 text-sm">Hỗ trợ qua email</span>
                                </li>
                            </ul>
                        </div>

                        {/* Professional Plan - Popular */}
                        <div className="relative bg-white p-8 rounded-2xl border-2 border-blue-600 shadow-xl scale-105 z-10">
                            <div className="absolute -top-4 left-1/2 -translate-x-1/2 px-4 py-1 bg-blue-600 text-white text-xs font-semibold rounded-full flex items-center gap-1">
                                <Star className="w-3 h-3" />
                                Phổ biến nhất
                            </div>
                            <h3 className="text-xl font-bold text-gray-900 mb-2">Chuyên Nghiệp</h3>
                            <p className="text-gray-500 text-sm mb-6">Dành cho shop đang phát triển</p>
                            <div className="mb-6">
                                <span className="text-4xl font-bold text-gray-900">
                                    {isAnnual ? '239k' : '299k'}
                                </span>
                                <span className="text-gray-500 text-sm">/tháng</span>
                            </div>
                            <Link
                                href="/register"
                                className="block w-full py-3 rounded-lg bg-blue-600 text-white font-medium text-center hover:bg-blue-700 transition-colors shadow-lg shadow-blue-600/20"
                            >
                                Dùng thử 7 ngày miễn phí
                            </Link>
                            <ul className="mt-8 space-y-4">
                                <li className="flex items-start gap-3">
                                    <Check className="w-5 h-5 text-green-500 mt-0.5 flex-shrink-0" />
                                    <span className="text-gray-600 text-sm">5,000 đánh giá/tháng</span>
                                </li>
                                <li className="flex items-start gap-3">
                                    <Check className="w-5 h-5 text-green-500 mt-0.5 flex-shrink-0" />
                                    <span className="text-gray-600 text-sm">Extension Chrome tự động</span>
                                </li>
                                <li className="flex items-start gap-3">
                                    <Check className="w-5 h-5 text-green-500 mt-0.5 flex-shrink-0" />
                                    <span className="text-gray-600 text-sm">Báo cáo chi tiết + biểu đồ</span>
                                </li>
                                <li className="flex items-start gap-3">
                                    <Check className="w-5 h-5 text-green-500 mt-0.5 flex-shrink-0" />
                                    <span className="text-gray-600 text-sm">Phân tích Facebook & Shopee</span>
                                </li>
                                <li className="flex items-start gap-3">
                                    <Check className="w-5 h-5 text-green-500 mt-0.5 flex-shrink-0" />
                                    <span className="text-gray-600 text-sm">Hỗ trợ ưu tiên</span>
                                </li>
                            </ul>
                        </div>

                        {/* Enterprise Plan */}
                        <div className="bg-white p-8 rounded-2xl border border-gray-200 hover:shadow-lg transition-shadow">
                            <h3 className="text-xl font-bold text-gray-900 mb-2">Doanh Nghiệp</h3>
                            <p className="text-gray-500 text-sm mb-6">Cho team & doanh nghiệp lớn</p>
                            <div className="mb-6">
                                <span className="text-4xl font-bold text-gray-900">Liên hệ</span>
                            </div>
                            <Link
                                href="/contact"
                                className="block w-full py-3 rounded-lg border-2 border-gray-200 text-gray-700 font-medium text-center hover:border-blue-600 hover:text-blue-600 transition-colors"
                            >
                                Liên hệ tư vấn
                            </Link>
                            <ul className="mt-8 space-y-4">
                                <li className="flex items-start gap-3">
                                    <Check className="w-5 h-5 text-green-500 mt-0.5 flex-shrink-0" />
                                    <span className="text-gray-600 text-sm">Không giới hạn đánh giá</span>
                                </li>
                                <li className="flex items-start gap-3">
                                    <Check className="w-5 h-5 text-green-500 mt-0.5 flex-shrink-0" />
                                    <span className="text-gray-600 text-sm">API access</span>
                                </li>
                                <li className="flex items-start gap-3">
                                    <Check className="w-5 h-5 text-green-500 mt-0.5 flex-shrink-0" />
                                    <span className="text-gray-600 text-sm">Multi-user & phân quyền</span>
                                </li>
                                <li className="flex items-start gap-3">
                                    <Check className="w-5 h-5 text-green-500 mt-0.5 flex-shrink-0" />
                                    <span className="text-gray-600 text-sm">Hỗ trợ riêng & SLA</span>
                                </li>
                                <li className="flex items-start gap-3">
                                    <Check className="w-5 h-5 text-green-500 mt-0.5 flex-shrink-0" />
                                    <span className="text-gray-600 text-sm">Tùy chỉnh theo yêu cầu</span>
                                </li>
                            </ul>
                        </div>
                    </div>
                </div>
            </section>

            {/* CTA Footer */}
            <section className="py-24 bg-gray-50">
                <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 text-center bg-blue-700 text-white p-16 rounded-[2.5rem] shadow-2xl shadow-blue-600/20">
                    <h2 className="text-4xl font-bold mb-6">Sẵn sàng thấu hiểu khách hàng của bạn?</h2>
                    <p className="text-blue-100 text-lg mb-10 max-w-2xl mx-auto">
                        Bắt đầu miễn phí ngay hôm nay và xem cách AI thay đổi cách bạn kinh doanh.
                    </p>
                    <div className="flex justify-center gap-4">
                        <Link href="/register" className="bg-white text-blue-700 font-bold px-8 py-3.5 rounded-lg hover:bg-gray-50 transition-colors">
                            Dùng thử ngay
                        </Link>
                        <button className="bg-blue-800 text-white font-medium px-8 py-3.5 rounded-lg hover:bg-blue-900 transition-colors border border-blue-600">
                            Nói chuyện với chuyên gia
                        </button>
                    </div>
                </div>
            </section>
        </div>
    );
}
