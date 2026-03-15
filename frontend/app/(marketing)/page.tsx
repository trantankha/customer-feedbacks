import Image from 'next/image';
import Link from 'next/link';
import { ArrowRight, BarChart3, UploadCloud, Chrome } from 'lucide-react';

export default function LandingPage() {
    return (
        <div className="min-h-screen bg-gray-50 flex flex-col font-sans">
            {/* Navigation Header */}
            <header className="flex items-center justify-between px-8 py-5 bg-white border-b border-gray-100">
                <div className="flex items-center gap-2">
                    <div className="w-8 h-8 bg-blue-600 rounded flex items-center justify-center text-white font-bold text-xl">
                        R
                    </div>
                    <span className="font-bold text-xl text-gray-900 tracking-tight">ReviewAI</span>
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
                            <div className="w-10 h-10 rounded-full bg-gray-200 border-2 border-white"></div>
                            <div className="w-10 h-10 rounded-full bg-gray-300 border-2 border-white"></div>
                            <div className="w-10 h-10 rounded-full bg-gray-400 border-2 border-white"></div>
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

            {/* CTA Footer */}
            <section className="py-24 bg-white">
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

            {/* Simple Footer */}
            <footer className="bg-gray-50 py-12 border-t border-gray-200">
                <div className="max-w-7xl mx-auto px-4 text-center text-gray-400 text-sm">
                    &copy; 2026 ReviewAI. Mọi quyền được bảo lưu.
                </div>
            </footer>
        </div>
    );
}
