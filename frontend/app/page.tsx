'use client';

import { useState } from 'react';
import { usePathname } from 'next/navigation';
import DashboardStats from '@/components/DashboardStats';
import FeedbackList from '@/components/FeedbackList';
import UploadArea from '@/components/UploadArea';
import WordCloudChart from '@/components/WordCloudChart';
import AnalyticsCharts from '@/components/AnalyticsCharts';
import MonitorManager from '@/components/MonitorManager';
import api from '@/lib/api';
import { Download, RefreshCw, LayoutDashboard, Users } from 'lucide-react';

export default function Home() {
    const [refreshKey, setRefreshKey] = useState(0);
    const [isExporting, setIsExporting] = useState(false);

    const handleRefresh = () => {
        setRefreshKey(prev => prev + 1);
    };

    const handleExport = async () => {
        setIsExporting(true);
        try {
            const response = await api.get('/feedbacks/export', { responseType: 'blob' });
            const url = window.URL.createObjectURL(new Blob([response.data]));
            const link = document.createElement('a');
            link.href = url;
            link.setAttribute('download', `Report_${new Date().toISOString().slice(0, 10)}.xlsx`);
            document.body.appendChild(link);
            link.click();
            link.remove();
        } catch (error) {
            alert("Lỗi xuất file!");
        } finally {
            setIsExporting(false);
        }
    };

    return (
        // NỀN TỐI CHỦ ĐẠO (Dark Mode Base)
        <main className="min-h-screen bg-[#0f1115] text-gray-300 font-sans selection:bg-purple-500/30">
            <div className="max-w-[1600px] mx-auto p-6 md:p-8">
                {/* Dashboard Header */}
                <div className="bg-[#1a1a1a] rounded-xl border border-gray-800 shadow-sm p-4 mb-6 flex justify-between items-center">
                    <div>
                        <h1 className="text-2xl font-bold text-white flex items-center gap-2">
                            <LayoutDashboard className="w-6 h-6" />
                            Dashboard
                        </h1>
                        <p className="text-gray-500 text-sm">Quản lý phản hồi khách hàng</p>
                    </div>
                    <div className="flex gap-3">
                        <button
                            onClick={handleRefresh}
                            className="flex cursor-pointer items-center gap-2 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition-colors"
                        >
                            <RefreshCw className="w-4 h-4" />
                            Làm mới
                        </button>
                        <button
                            onClick={handleExport}
                            disabled={isExporting}
                            className="flex cursor-pointer items-center gap-2 px-4 py-2 bg-green-600 hover:bg-green-700 disabled:bg-gray-600 text-white rounded-lg transition-colors"
                        >
                            <Download className="w-4 h-4" />
                            {isExporting ? 'Đang xuất...' : 'Xuất Excel'}
                        </button>
                    </div>
                </div>
                <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">

                    {/* === CỘT TRÁI (STICKY): CÔNG CỤ & ĐIỀU KHIỂN (Chiếm 4/12) === */}
                    <div className="lg:col-span-4 sticky top-24 space-y-6">

                        {/* 1. Nhập liệu (Upload) - Gọn gàng hơn */}
                        <div className="bg-[#1a1a1a] rounded-xl border border-gray-800 shadow-sm overflow-hidden">
                            <div className="p-4 border-b border-gray-800 bg-[#202020] flex justify-between items-center">
                                <h3 className="font-bold text-gray-200 text-sm">📥 Nhập dữ liệu thủ công</h3>
                                <span className="text-[10px] bg-gray-700 px-2 py-0.5 rounded text-gray-300">File CSV/Excel</span>
                            </div>
                            <div className="p-4">
                                <UploadArea onUploadSuccess={handleRefresh} />
                            </div>
                        </div>

                        {/* 2. Monitor Manager (GIÁM SÁT TỰ ĐỘNG) - Vị trí "Vàng" */}
                        <div className="h-[420px]"> {/* Set chiều cao cố định cho đẹp */}
                            <MonitorManager />
                        </div>

                        {/* 3. Word Cloud - Đẩy xuống dưới cùng */}
                        <div className="bg-[#1a1a1a] rounded-xl border border-gray-800 shadow-sm p-5">
                            <h3 className="font-bold text-gray-200 text-sm mb-4">☁️ Từ khóa nổi bật</h3>
                            <div className="min-h-[200px]">
                                <WordCloudChart key={`cloud-${refreshKey}`} />
                            </div>
                        </div>

                    </div>


                    {/* === CỘT PHẢI: HIỂN THỊ DỮ LIỆU (Chiếm 8/12) === */}
                    <div className="lg:col-span-8 space-y-6">

                        {/* 1. Stats Cards (Thống kê) */}
                        <DashboardStats key={`stats-${refreshKey}`} />

                        {/* 2. Biểu đồ phân tích (Analytics Chart) */}
                        <div className="bg-[#1a1a1a] rounded-xl border border-gray-800 shadow-sm p-1">
                            <div className="px-5 py-4 border-b border-gray-800 flex justify-between items-center">
                                <div>
                                    <h3 className="font-bold text-white text-lg">Xu hướng Cảm xúc</h3>
                                    <p className="text-gray-500 text-xs">Biến động chỉ số theo thời gian thực</p>
                                </div>
                            </div>
                            <div className="p-4">
                                <AnalyticsCharts key={`list-${refreshKey}`} />
                            </div>
                        </div>

                        {/* 3. Danh sách phản hồi (Feedback List) */}
                        <div className="bg-[#1a1a1a] rounded-xl border border-gray-800 shadow-sm min-h-[600px] flex flex-col">
                            <div className="px-5 py-4 border-b border-gray-800 flex justify-between items-center sticky top-0 bg-[#1a1a1a] z-10 rounded-t-xl">
                                <div>
                                    <h3 className="font-bold text-white text-lg">Dữ liệu chi tiết</h3>
                                    <p className="text-gray-500 text-xs">Danh sách phản hồi từ Facebook & Shopee</p>
                                </div>
                            </div>
                            <div className="flex-1 p-0">
                                <FeedbackList key={`list-${refreshKey}`} />
                            </div>
                        </div>

                    </div>

                </div>
            </div>
        </main>
    );
}