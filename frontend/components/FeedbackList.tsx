'use client';

import { useEffect, useState } from 'react';
import api from '@/lib/api';
import { Edit2, Check, X, Clock, Music } from 'lucide-react';
import { Feedback } from '@/type';

export default function FeedbackList() {
    const [feedbacks, setFeedbacks] = useState<Feedback[]>([]);
    const [sources, setSources] = useState<any[]>([]);
    const [editingId, setEditingId] = useState<string | null>(null);
    const [tempLabel, setTempLabel] = useState<string>("");

    const isNew = (dateString: string) => {
        if (!dateString) return false;
        const date = new Date(dateString).getTime();
        const now = new Date().getTime();
        // 24 giờ * 60 phút * 60 giây * 1000 ms
        const diff = now - date;
        return diff < 86400000;
    };

    const fetchFeedbacks = () => {
        // Thêm timestamp để tránh cache trình duyệt
        api.get(`/feedbacks?limit=10&_t=${new Date().getTime()}`)
            .then((res) => setFeedbacks(res.data))
            .catch((err) => console.error(err));
    };

    useEffect(() => {
        fetchFeedbacks();
        api.get('/sources').then(res => setSources(res.data)).catch(err => console.error(err));
        // Thiết lập tự động refresh mỗi 30 giây để cập nhật dữ liệu mới cào về
        const interval = setInterval(fetchFeedbacks, 10000);
        return () => clearInterval(interval);
    }, []);

    // Hàm format thời gian đẹp mắt (VN)
    const formatTime = (isoString: string) => {
        if (!isoString) return 'N/A';
        try {
            const date = new Date(isoString);
            // Format: 14:30 22/12/2025
            return new Intl.DateTimeFormat('vi-VN', {
                hour: '2-digit',
                minute: '2-digit',
                day: '2-digit',
                month: '2-digit',
                year: 'numeric'
            }).format(date);
        } catch (e) {
            return 'Lỗi ngày';
        }
    };

    const startEdit = (item: Feedback) => {
        setEditingId(item.id);
        setTempLabel(item.analysis?.sentiment_label || "NEUTRAL");
    };

    const cancelEdit = () => {
        setEditingId(null);
    };

    const saveEdit = async (feedbackId: string) => {
        try {
            await api.put(`/feedbacks/${feedbackId}/analysis`, {
                sentiment_label: tempLabel
            });
            fetchFeedbacks();
            setEditingId(null);
        } catch (error) {
            alert("Lỗi khi cập nhật!");
        }
    };

    const getPlatformInfo = (sourceId: string | undefined | null) => {
        if (!sourceId) return { name: 'Khác', bg: 'bg-gray-400' };
        const source = sources.find(s => s.id === sourceId);
        if (!source) return { name: 'Khác', bg: 'bg-gray-400' };

        const platform = source.platform?.toUpperCase();
        if (platform === 'FACEBOOK') return { name: 'Facebook', bg: 'bg-blue-600' };
        if (platform === 'SHOPEE') return { name: 'Shopee', bg: 'bg-orange-500' };
        if (platform === 'TIKTOK') return { name: 'TikTok', bg: 'bg-gradient-to-r from-black to-gray-800 text-white', icon: <Music size={10} className="mr-0.5" /> };
        return { name: source.name, bg: 'bg-gray-500' };
    };

    return (
        <div className="bg-transparent p-6 h-full overflow-hidden flex flex-col">
            <h3 className="font-semibold mb-2 text-gray-800 flex justify-between items-center">
                Phản hồi gần đây
                <button onClick={fetchFeedbacks} className="text-xs font-medium cursor-pointer text-blue-600 hover:text-blue-700 hover:underline">Làm mới ngay</button>
            </h3>

            <div className="flex-1 overflow-y-auto pr-3 space-y-4 custom-scrollbar">
                {feedbacks.map((item) => (
                    <div key={item.id} className="bg-white border border-gray-100 shadow-[0_2px_8px_rgb(0,0,0,0.04)] pb-4 last:border-0 hover:border-blue-200 p-4 rounded-xl transition-all group">

                        <div className="flex justify-between items-start mb-2">
                            {/* --- Label & Edit --- */}
                            <div className="flex items-center gap-2">
                                {editingId === item.id ? (
                                    <div className="flex items-center gap-1 animate-in fade-in">
                                        <select
                                            value={tempLabel}
                                            onChange={(e) => setTempLabel(e.target.value)}
                                            className="text-xs border rounded p-1 bg-white focus:ring-2 focus:ring-blue-500 outline-none"
                                        >
                                            <option value="POSITIVE">TÍCH CỰC</option>
                                            <option value="NEGATIVE">TIÊU CỰC</option>
                                            <option value="NEUTRAL">TRUNG TÍNH</option>
                                        </select>
                                        <button onClick={() => saveEdit(item.id)} className="p-1 text-green-600 hover:bg-green-100 rounded cursor-pointer"><Check size={14} /></button>
                                        <button onClick={cancelEdit} className="p-1 text-red-600 hover:bg-red-100 rounded cursor-pointer"><X size={14} /></button>
                                    </div>
                                ) : (
                                    <div className="flex items-center gap-2">
                                        <span className={`text-[10px] font-bold px-2 py-1 rounded select-none border
                      ${item.analysis?.sentiment_label === 'POSITIVE' ? 'bg-green-50 text-green-700 border-green-200' :
                                                item.analysis?.sentiment_label === 'NEGATIVE' ? 'bg-red-50 text-red-700 border-red-200' : 'bg-gray-50 text-gray-700 border-gray-200'}`}>
                                            {item.analysis?.sentiment_label || 'CHƯA XỬ LÝ'}
                                        </span>
                                        <button onClick={() => startEdit(item)} className="text-gray-400 cursor-pointer hover:text-blue-600 opacity-0 group-hover:opacity-100 transition-opacity">
                                            <Edit2 size={12} />
                                        </button>
                                    </div>
                                )}
                            </div>

                            <div className="flex items-center gap-2">
                                {/* 👇 TÍNH NĂNG MỚI: Badge NEW nhấp nháy */}
                                {isNew(item.received_at) && (
                                    <span className="flex items-center gap-1 px-1.5 py-0.5 rounded bg-red-100 text-red-600 text-[10px] font-bold border border-red-200 animate-pulse">
                                        New
                                    </span>
                                )}

                                {/* Thời gian */}
                                <div className="flex items-center gap-1 text-xs text-gray-400" title="Thời gian khách comment">
                                    <Clock size={12} />
                                    <span>{formatTime(item.received_at)}</span>
                                </div>
                            </div>
                        </div>

                        {/* Content */}
                        <p className="text-gray-800 text-sm mb-2 leading-relaxed">{item.raw_content}</p>

                        {/* Metadata */}
                        {item.customer_info && (
                            <div className="flex items-center gap-3 mt-1 text-xs text-gray-500 bg-gray-50 p-1.5 rounded w-fit">
                                {item.customer_info.name && (
                                    <span className="font-semibold text-gray-700">{item.customer_info.name}</span>
                                )}
                                {item.customer_info.likes && (
                                    <span className="flex items-center gap-1">👍 {item.customer_info.likes}</span>
                                )}
                                <span className={`px-1.5 py-0.5 rounded text-[10px] font-medium text-white flex items-center gap-1 ${getPlatformInfo(item.source_id).bg}`}>
                                    {getPlatformInfo(item.source_id).icon || null}
                                    {getPlatformInfo(item.source_id).name}
                                </span>
                            </div>
                        )}
                    </div>
                ))}
            </div>

            {/* Custom Scrollbar for Feedback List */}
            <style jsx>{`
                .custom-scrollbar::-webkit-scrollbar { width: 4px; }
                .custom-scrollbar::-webkit-scrollbar-track { background: transparent; }
                .custom-scrollbar::-webkit-scrollbar-thumb { background: #cbd5e1; border-radius: 4px; }
                .custom-scrollbar::-webkit-scrollbar-thumb:hover { background: #94a3b8; }
            `}</style>
        </div>
    );
}