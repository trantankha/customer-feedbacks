'use client';

import { useEffect, useState } from 'react';
import api from '@/lib/api';
import { Trash2, Plus, Facebook, ShoppingBag, Globe, Activity, Zap, ShieldCheck, Music } from 'lucide-react';

interface MonitorTask {
    id: number;
    url: string;
    memo: string;
    platform: string;
    created_at: string;
    is_active: boolean;
}

export default function MonitorManager() {
    const [tasks, setTasks] = useState<MonitorTask[]>([]);
    const [url, setUrl] = useState('');
    const [memo, setMemo] = useState('');
    const [loading, setLoading] = useState(false);

    const fetchTasks = () => {
        api.get('/monitor').then(res => setTasks(res.data)).catch(console.error);
    };

    useEffect(() => {
        fetchTasks();
    }, []);

    const handleAdd = async () => {
        if (!url.trim()) return;
        setLoading(true);

        // Tự động đoán Platform qua URL
        let platform = "OTHER";
        if (url.includes("facebook.com")) platform = "FACEBOOK";
        else if (url.includes("shopee.vn") || url.includes("shopee")) platform = "SHOPEE";
        else if (url.includes("tiktok.com")) platform = "TIKTOK";

        try {
            await api.post('/monitor', { url, memo, platform });
            setUrl('');
            setMemo('');
            fetchTasks();
        } catch (error) {
            alert("Lỗi khi thêm link!");
        } finally {
            setLoading(false);
        }
    };

    const handleDelete = async (id: number) => {
        if (!confirm("Dừng theo dõi link này?")) return;
        try {
            await api.delete(`/monitor/${id}`);
            setTasks(prev => prev.filter(t => t.id !== id));
        } catch (error) {
            alert("Lỗi xóa!");
        }
    };

    return (
        // Container chính: Nền sáng khớp với Dashboard mới
        <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-5 h-full flex flex-col">

            {/* Header Card */}
            <div className="flex items-center justify-between mb-5 pb-4 border-b border-gray-100">
                <div className="flex items-center gap-3">
                    <div className="p-2 bg-blue-50 text-blue-600 rounded-lg border border-blue-100">
                        <ShieldCheck size={20} />
                    </div>
                    <div>
                        <h3 className="font-bold text-gray-900 text-sm uppercase tracking-wide">Cấu hình Tuần tra</h3>
                        <p className="text-[11px] text-gray-500 mt-0.5">Bot tự động quét định kỳ 30 phút/lần</p>
                    </div>
                </div>
                <div className="flex items-center gap-1.5 px-2 py-1 bg-green-500/10 border border-green-500/20 rounded text-green-400 text-[10px] font-bold">
                    <span className="relative flex h-2 w-2">
                        <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-green-400 opacity-75"></span>
                        <span className="relative inline-flex rounded-full h-2 w-2 bg-green-500"></span>
                    </span>
                    RUNNING
                </div>
            </div>

            {/* Input Form */}
            <div className="flex flex-col gap-3 mb-5">
                <div className="relative">
                    <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                        <Activity size={14} className="text-gray-500" />
                    </div>
                    <input
                        value={url}
                        onChange={e => setUrl(e.target.value)}
                        placeholder="Dán link bài viết Facebook hoặc Shopee..."
                        className="w-full pl-9 pr-3 py-2.5 bg-gray-50 border border-gray-200 text-gray-900 text-xs rounded-lg focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500 placeholder-gray-400 transition-all"
                    />
                </div>

                <div className="flex gap-2">
                    <input
                        value={memo}
                        onChange={e => setMemo(e.target.value)}
                        placeholder="Ghi chú (VD: Chiến dịch 12.12)..."
                        className="flex-1 px-3 py-2 bg-gray-50 border border-gray-200 text-gray-900 text-xs rounded-lg focus:outline-none focus:border-blue-500 placeholder-gray-400 transition-all"
                    />
                    <button
                        onClick={handleAdd}
                        disabled={loading}
                        className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold rounded-lg shadow-sm shadow-blue-600/20 transition-all active:scale-95 disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
                    >
                        {loading ? <span className="animate-spin">⌛</span> : <Plus size={16} />}
                        THÊM
                    </button>
                </div>
            </div>

            {/* Task List */}
            <div className="flex-1 overflow-y-auto pr-1 space-y-2 custom-scrollbar">
                {tasks.length === 0 && (
                    <div className="h-24 flex flex-col items-center justify-center border border-dashed border-gray-300 bg-gray-50/50 rounded-lg text-gray-500 text-xs">
                        <Zap size={24} className="mb-2 text-gray-400" />
                        Chưa có link nào được theo dõi
                    </div>
                )}

                {tasks.map(task => (
                    <div key={task.id} className="group p-3 rounded-lg bg-white border border-gray-200 hover:border-blue-300 transition-all flex items-start gap-3 shadow-sm hover:shadow-md">
                        {/* Icon Platform */}
                        <div className={`mt-0.5 p-1.5 rounded-md shrink-0 border
                            ${task.platform === 'FACEBOOK' ? 'bg-blue-50 text-blue-600 border-blue-100' :
                                task.platform === 'SHOPEE' ? 'bg-orange-50 text-orange-600 border-orange-100' :
                                    task.platform === 'TIKTOK' ? 'bg-gray-900 text-white border-gray-800' :
                                        'bg-gray-100 text-gray-600 border-gray-200'}`}>
                            {task.platform === 'FACEBOOK' ? <Facebook size={14} /> :
                                task.platform === 'SHOPEE' ? <ShoppingBag size={14} /> :
                                    task.platform === 'TIKTOK' ? <Music size={14} /> : <Globe size={14} />}
                        </div>

                        <div className="flex-1 min-w-0">
                            <div className="flex justify-between items-start">
                                <p className="text-gray-900 text-xs font-bold truncate pr-2">
                                    {task.memo || "Không có tiêu đề"}
                                </p>
                                <button onClick={() => handleDelete(task.id)} className="text-gray-400 hover:text-red-600 transition-colors opacity-0 group-hover:opacity-100 bg-gray-50 hover:bg-red-50 p-1 rounded">
                                    <Trash2 size={12} />
                                </button>
                            </div>
                            <a href={task.url} target="_blank" rel="noreferrer" className="text-[10px] text-gray-500 hover:text-blue-600 truncate block mt-0.5 transition-colors">
                                {task.url}
                            </a>
                        </div>
                    </div>
                ))}
            </div>

            {/* Custom Scrollbar cho Light Mode */}
            <style jsx>{`
                .custom-scrollbar::-webkit-scrollbar { width: 4px; }
                .custom-scrollbar::-webkit-scrollbar-track { background: transparent; }
                .custom-scrollbar::-webkit-scrollbar-thumb { background: #cbd5e1; border-radius: 4px; }
                .custom-scrollbar::-webkit-scrollbar-thumb:hover { background: #94a3b8; }
            `}</style>
        </div>
    );
}