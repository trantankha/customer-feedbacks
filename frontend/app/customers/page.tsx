'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import api from '@/lib/api';
import { User, ShoppingBag, Facebook, Star, X, Sparkles, Loader2, Globe, LayoutDashboard, Users } from 'lucide-react';
import ReactMarkdown from 'react-markdown';

export default function CustomersPage() {
    const pathname = usePathname();
    const [customers, setCustomers] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [currentPage, setCurrentPage] = useState(1);
    const [totalPages, setTotalPages] = useState(1);
    const [totalCount, setTotalCount] = useState(0);
    const perPage = 10;

    // State cho Modal phân tích
    const [selectedCustomer, setSelectedCustomer] = useState<string | null>(null);
    const [analysisResult, setAnalysisResult] = useState<string>("");
    const [isAnalyzing, setIsAnalyzing] = useState(false);

    useEffect(() => {
        fetchCustomers(currentPage);
    }, [currentPage]);

    const fetchCustomers = (page: number = 1) => {
        setLoading(true);
        api.get(`/customers?page=${page}&per_page=${perPage}`)
            .then(res => {
                setCustomers(res.data.customers);
                setTotalPages(res.data.total_pages);
                setTotalCount(res.data.total_count);
                setLoading(false);
            })
            .catch(err => {
                console.error(err);
                setLoading(false);
            });
    };

    // Hàm xử lý khi bấm vào khách hàng
    const handleAnalyzeClick = async (name: string) => {
        setSelectedCustomer(name);
        setAnalysisResult(""); // Reset kết quả cũ
        setIsAnalyzing(true); // Bật loading

        try {
            const res = await api.post('/customers/analyze-profile', { name });
            setAnalysisResult(res.data.insight);
        } catch (error) {
            setAnalysisResult("❌ Lỗi: Không thể phân tích khách hàng này lúc này.");
        } finally {
            setIsAnalyzing(false);
        }
    };

    const closeModal = () => {
        setSelectedCustomer(null);
        setAnalysisResult("");
    };

    return (
        <main className="min-h-screen bg-[#0f1115] text-gray-300 font-sans">
            <div className="max-w-7xl mx-auto p-8">
                <h1 className="text-3xl font-bold text-white mb-2 flex items-center gap-2">
                    <User className="text-blue-600" />
                    Hồ sơ Khách hàng (CRM)
                </h1>
                <p className="mb-6 text-gray-500">Bấm vào hành động để xem phân tích chuyên sâu từ AI.</p>

                {/* Bảng dữ liệu */}
                <div className="bg-[#1a1a1a] rounded-xl border border-gray-800 shadow-sm overflow-hidden">
                    <table className="w-full text-left text-sm text-gray-300">
                        <thead className="bg-[#202020] text-gray-200 uppercase font-semibold">
                            <tr>
                                <th className="p-4">Khách hàng</th>
                                <th className="p-4">Nguồn</th>
                                <th className="p-4 text-center">Số lượng</th>
                                <th className="p-4 text-center">Điểm uy tín</th>
                                <th className="p-4">Phân loại</th>
                                <th className="p-4 text-center">Hành động</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-200">
                            {customers.length === 0 && !loading ? (
                                <tr>
                                    <td colSpan={6} className="p-12 text-center">
                                        <div className="flex flex-col items-center justify-center space-y-4">
                                            <Users size={64} className="text-gray-400" />
                                            <h3 className="text-lg font-semibold text-gray-200">Chưa có dữ liệu khách hàng</h3>
                                            <p className="text-gray-500 max-w-md">
                                                Bắt đầu bằng cách tải lên dữ liệu phản hồi từ khách hàng để phân tích và quản lý hồ sơ CRM chuyên nghiệp.
                                            </p>
                                            <Link
                                                href="/"
                                                className="inline-flex items-center gap-2 bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors"
                                            >
                                                <LayoutDashboard size={16} />
                                                Quay về Trang chủ
                                            </Link>
                                        </div>
                                    </td>
                                </tr>
                            ) : (
                                customers.map((c, idx) => (
                                    <tr key={idx} className="hover:bg-[#252525] transition-colors group">
                                        <td className="p-4 font-medium text-gray-200 flex items-center gap-3">
                                            <div className="w-8 h-8 rounded-full bg-gradient-to-tr from-blue-400 to-purple-500 flex items-center justify-center text-white font-bold shadow-sm">
                                                {c.name.charAt(0).toUpperCase()}
                                            </div>
                                            {c.name}
                                        </td>
                                        <td className="p-4">
                                            {c.source_id === 1 ? (
                                                <span className="flex items-center gap-1 text-blue-700 bg-blue-100 px-2 py-1 rounded text-xs w-fit">
                                                    <Facebook size={12} /> Facebook
                                                </span>
                                            ) : c.source_id === 2 ? (
                                                <span className="flex items-center gap-1 text-orange-700 bg-orange-100 px-2 py-1 rounded text-xs w-fit">
                                                    <ShoppingBag size={12} /> Shopee
                                                </span>
                                            ) : (
                                                <span className="flex items-center gap-1 text-gray-700 bg-gray-100 px-2 py-1 rounded text-xs w-fit">
                                                    <Globe size={12} /> Khác
                                                </span>
                                            )}
                                        </td>
                                        <td className="p-4 text-center font-bold">{c.total_comments}</td>
                                        <td className="p-4 text-center">
                                            <div className="flex items-center justify-center gap-1">
                                                <Star size={14} className={c.avg_score > 0 ? "text-yellow-500 fill-yellow-500" : "text-gray-300"} />
                                                {c.avg_score}
                                            </div>
                                        </td>
                                        <td className="p-4">
                                            <span className={`px-2 py-1 rounded-full text-xs font-bold ${c.sentiment_trend === 'Fan cứng' ? 'bg-green-100 text-green-700' :
                                                c.sentiment_trend === 'Khó tính' ? 'bg-red-100 text-red-700' :
                                                    'bg-gray-100 text-gray-600'
                                                }`}>
                                                {c.sentiment_trend}
                                            </span>
                                        </td>
                                        <td className="p-4 text-center">
                                            <button
                                                onClick={() => handleAnalyzeClick(c.name)}
                                                className="bg-white cursor-pointer border border-blue-200 text-blue-600 hover:bg-blue-600 hover:text-white px-3 py-1.5 rounded-lg text-xs font-medium transition-all shadow-sm flex items-center gap-1 mx-auto"
                                            >
                                                <Sparkles size={14} /> AI Soi
                                            </button>
                                        </td>
                                    </tr>
                                ))
                            )}
                        </tbody>
                    </table>

                    {loading && <div className="p-8 text-center text-gray-400">Đang tải hồ sơ...</div>}
                </div>

                {/* Pagination Controls */}
                {totalPages > 1 && (
                    <div className="mt-6 flex items-center justify-between">
                        <div className="text-sm text-gray-500">
                            Hiển thị {((currentPage - 1) * perPage) + 1} đến {Math.min(currentPage * perPage, totalCount)} của {totalCount} khách hàng
                        </div>
                        <div className="flex items-center space-x-2">
                            <button
                                onClick={() => setCurrentPage(prev => Math.max(prev - 1, 1))}
                                disabled={currentPage === 1}
                                className="px-3 cursor-pointer text-gray-200 py-1 text-sm border border-gray-600 rounded-md hover:bg-gray-700 disabled:opacity-50 disabled:cursor-not-allowed"
                            >
                                Trước
                            </button>

                            {/* Page Numbers */}
                            {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
                                const pageNum = Math.max(1, Math.min(totalPages - 4, currentPage - 2)) + i;
                                return (
                                    <button
                                        key={pageNum}
                                        onClick={() => setCurrentPage(pageNum)}
                                        className={`px-3 cursor-pointer py-1 text-sm border rounded-md text-gray-200 ${currentPage === pageNum
                                            ? 'bg-blue-600 border-blue-500'
                                            : 'border-gray-600 hover:bg-gray-700'
                                            }`}
                                    >
                                        {pageNum}
                                    </button>
                                );
                            })}

                            <button
                                onClick={() => setCurrentPage(prev => Math.min(prev + 1, totalPages))}
                                disabled={currentPage === totalPages}
                                className="px-3 cursor-pointer py-1 text-gray-200 text-sm border border-gray-600 rounded-md hover:bg-gray-700 disabled:opacity-50 disabled:cursor-not-allowed"
                            >
                                Tiếp
                            </button>
                        </div>
                    </div>
                )}
            </div>

            {/* --- MODAL PHÂN TÍCH AI (POPUP) --- */}
            {selectedCustomer && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm animate-in fade-in duration-200">
                    <div className="bg-white w-full max-w-2xl rounded-2xl shadow-2xl overflow-hidden m-4 flex flex-col max-h-[90vh]">

                        {/* Header Modal */}
                        <div className="bg-gradient-to-r from-purple-600 to-blue-600 p-6 text-white flex justify-between items-start">
                            <div>
                                <h2 className="text-xl font-bold flex items-center gap-2">
                                    <Sparkles className="text-yellow-300" />
                                    Hồ sơ Điệp viên AI
                                </h2>
                                <p className="text-white/80 text-sm mt-1">Đối tượng: <span className="font-bold text-white">{selectedCustomer}</span></p>
                            </div>
                            <button onClick={closeModal} className="text-white/70 hover:text-white bg-white/10 hover:bg-white/20 p-2 rounded-full transition-colors">
                                <X size={20} />
                            </button>
                        </div>

                        {/* Body Modal */}
                        <div className="p-6 overflow-y-auto bg-gray-50 flex-1">
                            {isAnalyzing ? (
                                <div className="flex flex-col items-center justify-center py-12 space-y-4">
                                    <Loader2 className="w-12 h-12 text-blue-500 animate-spin" />
                                    <p className="text-gray-600 font-medium animate-pulse">Đang đọc lén lịch sử comment...</p>
                                    <p className="text-xs text-gray-400">Gemini đang suy nghĩ</p>
                                </div>
                            ) : (
                                <div className="prose prose-sm max-w-none text-gray-800">
                                    {/* Hiển thị Markdown kết quả */}
                                    <ReactMarkdown>{analysisResult}</ReactMarkdown>
                                </div>
                            )}
                        </div>

                        {/* Footer Modal */}
                        <div className="p-4 border-t bg-white text-right">
                            <button
                                onClick={closeModal}
                                className="px-4 cursor-pointer py-2 bg-gray-100 hover:bg-gray-200 text-gray-700 rounded-lg text-sm font-medium transition-colors"
                            >
                                Đóng hồ sơ
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </main>
    );
}