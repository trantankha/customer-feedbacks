'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import api from '@/lib/api';
import { User, ShoppingBag, Facebook, Star, X, Sparkles, Loader2, Globe, LayoutDashboard, Users, Music, Activity } from 'lucide-react';
import ReactMarkdown from 'react-markdown';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip as RechartsTooltip, ResponsiveContainer } from 'recharts';

export default function CustomersPage() {
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
    const [sources, setSources] = useState<any[]>([]);

    // Đệm (Cache) kết quả AI để lưu trữ dữ liệu tại Frontend State
    const [analysisCache, setAnalysisCache] = useState<Record<string, { insight: string, probability: number, action_plan: string }>>({});

    // State mới cho Tabs và Journey Data
    const [activeTab, setActiveTab] = useState<'analysis' | 'journey'>('analysis');
    const [journeyData, setJourneyData] = useState<any[]>([]);
    const [isLoadingJourney, setIsLoadingJourney] = useState(false);
    
    // State cho Churn Prediction (cập nhật tự động từ kết quả gốc)
    const [churnResult, setChurnResult] = useState<{probability: number, action_plan: string} | null>(null);

    useEffect(() => {
        fetchCustomers(currentPage);
        api.get('/sources').then(res => setSources(res.data)).catch(err => console.error(err));
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

    const fetchJourneyData = async (name: string) => {
        setIsLoadingJourney(true);
        try {
            const res = await api.get(`/customers/journey/${name}`);
            setJourneyData(res.data.journey || []);
        } catch (err) {
            console.error("Lỗi lấy journey:", err);
        } finally {
            setIsLoadingJourney(false);
        }
    };

    // Hàm xử lý khi bấm vào khách hàng
    const handleAnalyzeClick = async (name: string) => {
        setSelectedCustomer(name);
        setActiveTab('analysis'); // Reset tab về Analysis
        
        // Kiểm tra xem đã có kết quả phân tích trong Cache chưa
        if (analysisCache[name]) {
            setAnalysisResult(analysisCache[name].insight);
            setChurnResult({
                probability: analysisCache[name].probability,
                action_plan: analysisCache[name].action_plan
            });
            return;
        }

        setAnalysisResult(""); // Reset kết quả cũ
        setChurnResult(null); // Reset churn
        setIsAnalyzing(true); // Bật loading

        try {
            const res = await api.post('/customers/analyze-profile', { name });
            const insight = res.data.insight;
            const probability = res.data.probability;
            const action_plan = res.data.action_plan;
            
            setAnalysisResult(insight);
            setChurnResult({ probability, action_plan });
            
            // Xử lý ngoại lệ: Chỉ cache nếu không phải là lỗi hoặc quá tải API
            const isRateLimitError = insight.includes("đang quá tải") || insight.includes("Hết hạn mức") || insight.includes("Lỗi");
            if (!isRateLimitError) {
                setAnalysisCache(prev => ({
                    ...prev,
                    [name]: { insight, probability, action_plan }
                }));
            }
        } catch (error) {
            setAnalysisResult("❌ Lỗi: Không thể phân tích khách hàng này lúc này.");
            setChurnResult({ probability: 0, action_plan: "❌ Lỗi: Không thể xử lý dự đoán rời bỏ."});
        } finally {
            setIsAnalyzing(false);
        }
    };

    const handleTabChange = (tab: 'analysis' | 'journey') => {
        setActiveTab(tab);
        if (tab === 'journey' && selectedCustomer) {
            fetchJourneyData(selectedCustomer);
        }
    };

    const closeModal = () => {
        setSelectedCustomer(null);
        setAnalysisResult("");
        setJourneyData([]);
        setChurnResult(null);
    };

    const getPlatformInfo = (sourceId: string | undefined | null) => {
        if (!sourceId) return { name: 'Khác', bg: 'text-gray-700 bg-gray-100 border-gray-200', icon: <Globe size={12} /> };
        const source = sources.find(s => s.id === sourceId);
        if (!source) return { name: 'Khác', bg: 'text-gray-700 bg-gray-100 border-gray-200', icon: <Globe size={12} /> };

        const platform = source.platform?.toUpperCase();
        if (platform === 'FACEBOOK') return { name: 'Facebook', bg: 'text-blue-700 bg-blue-50 border-blue-100', icon: <Facebook size={12} /> };
        if (platform === 'SHOPEE') return { name: 'Shopee', bg: 'text-orange-700 bg-orange-50 border-orange-100', icon: <ShoppingBag size={12} /> };
        if (platform === 'TIKTOK') return { name: 'TikTok', bg: 'text-white bg-gray-900 border-gray-800', icon: <Music size={12} /> };
        return { name: source.name, bg: 'text-gray-700 bg-gray-100 border-gray-200', icon: <Globe size={12} /> };
    };

    return (
        <main className="min-h-screen bg-gray-50 text-gray-900 font-sans">
            <div className="max-w-7xl mx-auto p-8">
                <h1 className="text-3xl font-bold text-gray-900 mb-2 flex items-center gap-2">
                    <User className="text-blue-600" />
                    Hồ sơ Khách hàng (CRM)
                </h1>
                <p className="mb-6 text-gray-500">Bấm vào hành động để xem phân tích chuyên sâu từ AI.</p>

                {/* Bảng dữ liệu */}
                <div className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden">
                    <table className="w-full text-left text-sm text-gray-700">
                        <thead className="bg-gray-50 text-gray-700 uppercase font-semibold border-b border-gray-200">
                            <tr>
                                <th className="p-4">Khách hàng</th>
                                <th className="p-4">Nguồn</th>
                                <th className="p-4 text-center">Số lượng</th>
                                <th className="p-4 text-center">Điểm uy tín</th>
                                <th className="p-4">Phân loại</th>
                                <th className="p-4 text-center">Hành động</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-100">
                            {customers.length === 0 && !loading ? (
                                <tr>
                                    <td colSpan={6} className="p-12 text-center bg-white">
                                        <div className="flex flex-col items-center justify-center space-y-4">
                                            <Users size={64} className="text-gray-300" />
                                            <h3 className="text-lg font-semibold text-gray-800">Chưa có dữ liệu khách hàng</h3>
                                            <p className="text-gray-500 max-w-md">
                                                Bắt đầu bằng cách tải lên dữ liệu phản hồi từ khách hàng để phân tích và quản lý hồ sơ CRM chuyên nghiệp.
                                            </p>
                                            <Link
                                                href="/dashboard"
                                                className="inline-flex items-center gap-2 bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors shadow-sm"
                                            >
                                                <LayoutDashboard size={16} />
                                                Quay về Trang chủ
                                            </Link>
                                        </div>
                                    </td>
                                </tr>
                            ) : (
                                customers.map((c, idx) => (
                                    <tr key={idx} className="hover:bg-gray-50/80 transition-colors group bg-white">
                                        <td className="p-4 font-medium text-gray-900 flex items-center gap-3">
                                            <div className="w-8 h-8 rounded-full bg-gradient-to-tr from-blue-400 to-purple-500 flex items-center justify-center text-white font-bold shadow-sm">
                                                {c.name.charAt(0).toUpperCase()}
                                            </div>
                                            {c.name}
                                        </td>
                                        <td className="p-4">
                                            <span className={`flex items-center gap-1 px-2 py-1 rounded text-xs w-fit font-medium border ${getPlatformInfo(c.source_id).bg}`}>
                                                {getPlatformInfo(c.source_id).icon} {getPlatformInfo(c.source_id).name}
                                            </span>
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
                                            {c.is_churn_warning && (
                                                <span title="Phát hiện 2 tương tác lập tức gần nhất là Tiêu cực" className="ml-2 inline-flex items-center px-2 py-1 rounded-full text-[10px] font-bold bg-red-100 text-red-600 animate-pulse border border-red-200 shadow-sm cursor-help">
                                                    🚨 Rủi ro Rời bỏ
                                                </span>
                                            )}
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

                    {loading && <div className="p-8 text-center text-gray-500 bg-white">Đang tải hồ sơ...</div>}
                </div>

                {/* Pagination Controls */}
                {totalPages > 1 && (
                    <div className="mt-6 flex items-center justify-between">
                        <div className="text-sm text-gray-500">
                            Hiển thị {((currentPage - 1) * perPage) + 1} đến {Math.min(currentPage * perPage, totalCount)} của <span className="font-semibold text-gray-700">{totalCount}</span> khách hàng
                        </div>
                        <div className="flex items-center space-x-2">
                            <button
                                onClick={() => setCurrentPage(prev => Math.max(prev - 1, 1))}
                                disabled={currentPage === 1}
                                className="px-3 cursor-pointer text-gray-700 bg-white py-1 text-sm border border-gray-300 rounded-md hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed shadow-sm"
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
                                        className={`px-3 cursor-pointer py-1 text-sm rounded-md shadow-sm transition-colors ${currentPage === pageNum
                                            ? 'bg-blue-600 text-white border border-blue-600 font-medium'
                                            : 'bg-white text-gray-700 border border-gray-300 hover:bg-gray-50'
                                            }`}
                                    >
                                        {pageNum}
                                    </button>
                                );
                            })}

                            <button
                                onClick={() => setCurrentPage(prev => Math.min(prev + 1, totalPages))}
                                disabled={currentPage === totalPages}
                                className="px-3 cursor-pointer py-1 text-gray-700 bg-white text-sm border border-gray-300 rounded-md hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed shadow-sm"
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
                        <div className="bg-gradient-to-r from-purple-600 to-blue-600 p-6 pb-2 text-white flex justify-between items-start">
                            <div className="w-full">
                                <div className="flex justify-between items-start">
                                    <div>
                                        <h2 className="text-xl font-bold flex items-center gap-2">
                                            <Sparkles className="text-yellow-300" />
                                            Hồ sơ Điệp viên AI & Hành trình
                                        </h2>
                                        <p className="text-white/80 text-sm mt-1 mb-4">Đối tượng: <span className="font-bold text-white">{selectedCustomer}</span></p>
                                    </div>
                                    <button onClick={closeModal} className="text-white/70 hover:text-white bg-white/10 hover:bg-white/20 p-2 rounded-full transition-colors">
                                        <X size={20} />
                                    </button>
                                </div>
                                {/* Tabs */}
                                <div className="flex w-full gap-2 mt-2">
                                    <button 
                                        onClick={() => handleTabChange('analysis')}
                                        className={`px-4 py-2 text-sm font-medium rounded-t-lg transition-colors flex items-center gap-2 ${activeTab === 'analysis' ? 'bg-white text-blue-700 shadow-sm' : 'bg-white/20 text-white hover:bg-white/30'}`}
                                    >
                                        <Sparkles size={16} /> Phân tích Nhận diện (Insight)
                                    </button>
                                    <button 
                                        onClick={() => handleTabChange('journey')}
                                        className={`px-4 py-2 text-sm font-medium rounded-t-lg transition-colors flex items-center gap-2 ${activeTab === 'journey' ? 'bg-white text-purple-700 shadow-sm' : 'bg-white/20 text-white hover:bg-white/30'}`}
                                    >
                                        <Activity size={16} /> Hành trình Cảm xúc
                                    </button>
                                </div>
                            </div>
                        </div>

                        {/* Body Modal */}
                        <div className="p-6 overflow-y-auto bg-white flex-1 min-h-[300px]">
                            {activeTab === 'analysis' && (
                                isAnalyzing ? (
                                    <div className="flex flex-col items-center justify-center py-12 space-y-4">
                                        <Loader2 className="w-12 h-12 text-blue-500 animate-spin" />
                                        <p className="text-gray-600 font-medium animate-pulse">Đang yêu cầu Gemini đóng vai Điệp viên trích xuất Insight...</p>
                                        <p className="text-xs text-gray-400">Điều này có thể mất vài giây</p>
                                    </div>
                                ) : (
                                    <div className="prose prose-sm max-w-none text-gray-800">
                                        {/* Hiển thị Markdown kết quả */}
                                        <ReactMarkdown>{analysisResult}</ReactMarkdown>
                                    </div>
                                )
                            )}

                            {activeTab === 'journey' && (
                                isLoadingJourney ? (
                                    <div className="flex flex-col items-center justify-center py-12 space-y-4">
                                        <Loader2 className="w-8 h-8 text-purple-500 animate-spin" />
                                        <p className="text-gray-500 text-sm">Đang tải lịch sử hành trình...</p>
                                    </div>
                                ) : journeyData.length === 0 ? (
                                    <div className="flex items-center justify-center py-12 text-gray-500">
                                        Khách hàng này chưa có dữ liệu hành trình cảm xúc hoặc chỉ có 1 điểm chạm đầu tiên!
                                    </div>
                                ) : (
                                    <div className="w-full h-full flex flex-col">
                                        <h3 className="text-sm font-bold text-gray-700 mb-6 flex items-center justify-between">
                                            Biểu đồ Xu hướng Chỉ số Cảm xúc
                                            <span className="text-xs font-normal text-purple-600 bg-purple-50 px-2 py-1 rounded">Score -1 (Cực Đoan) 👉 1 (Tuyệt Vời)</span>
                                        </h3>
                                        <div className="h-[250px] w-full">
                                            <ResponsiveContainer width="100%" height="100%">
                                                <LineChart data={journeyData} margin={{ top: 10, right: 30, left: 0, bottom: 0 }}>
                                                    <CartesianGrid strokeDasharray="3 3" vertical={false} />
                                                    <XAxis dataKey="date" tick={{fontSize: 10}} tickMargin={10} minTickGap={30} />
                                                    <YAxis domain={[-1, 1]} ticks={[-1, -0.5, 0, 0.5, 1]} tick={{fontSize: 10}} />
                                                    <RechartsTooltip 
                                                        contentStyle={{ borderRadius: '8px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }}
                                                    />
                                                    <Line 
                                                        type="monotone" 
                                                        dataKey="score" 
                                                        name="Điểm Cảm xúc" 
                                                        stroke="#8b5cf6" 
                                                        strokeWidth={3} 
                                                        dot={{r: 4, strokeWidth: 2, fill: "white", stroke: "#8b5cf6"}} 
                                                        activeDot={{r: 6, fill: "#8b5cf6"}} 
                                                        animationDuration={1500}
                                                    />
                                                </LineChart>
                                            </ResponsiveContainer>
                                        </div>

                                        {/* Khối Dự đoán Rời bỏ */}
                                        <div className="mt-8 pt-6 border-t border-gray-100">
                                            <div className="flex justify-between items-center mb-4">
                                                <h3 className="text-md font-bold text-gray-800 flex items-center gap-2">
                                                    <Sparkles className="text-amber-500" size={18} /> Chỉ số Phân tích Rời bỏ (AI Prediction)
                                                </h3>
                                            </div>
                                            
                                            {churnResult && (
                                                <div className="bg-gradient-to-br from-gray-50 to-white border border-gray-200 rounded-xl p-5 shadow-sm animate-in fade-in slide-in-from-bottom-2">
                                                    <div className="mb-5">
                                                        <div className="flex justify-between text-sm mb-1">
                                                            <span className="font-semibold text-gray-600">Xác suất rời bỏ / Ngừng sử dụng</span>
                                                            <span className="font-bold text-gray-800">{churnResult.probability}%</span>
                                                        </div>
                                                        <div className="w-full bg-gray-200 rounded-full h-2.5">
                                                            <div className={`h-2.5 rounded-full transition-all duration-1000 ${churnResult.probability > 70 ? 'bg-red-500 animate-pulse' : churnResult.probability > 30 ? 'bg-amber-400' : 'bg-green-500'}`} style={{ width: `${churnResult.probability}%` }}></div>
                                                        </div>
                                                        <p className="text-xs text-gray-500 mt-2 italic">
                                                            * Điểm số lấy từ mô hình Gemini Generative AI dựa trên tính thường xuyên và độ cực đoan của phản hồi.
                                                        </p>
                                                    </div>
                                                    <div>
                                                        <h4 className="text-sm font-semibold text-gray-800 mb-2 mt-4 flex items-center gap-1">
                                                            💡 Kịch bản CSKH Đề xuất:
                                                        </h4>
                                                        <div className="prose prose-sm max-w-none text-gray-700 bg-gray-50 p-4 rounded-lg shadow-inner border border-gray-100">
                                                            <ReactMarkdown>{churnResult.action_plan}</ReactMarkdown>
                                                        </div>
                                                    </div>
                                                </div>
                                            )}
                                        </div>
                                    </div>
                                )
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