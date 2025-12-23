'use client';

import { useState } from 'react';
import DashboardStats from '@/components/DashboardStats';
import FeedbackList from '@/components/FeedbackList';
import UploadArea from '@/components/UploadArea';
import WordCloudChart from '@/components/WordCloudChart';
import AnalyticsCharts from '@/components/AnalyticsCharts';
import api from '@/lib/api';
import { Download, RefreshCw } from 'lucide-react';

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
    <main className="min-h-screen bg-slate-50/50 p-6 md:p-8"> {/* Nền màu Slate nhẹ nhàng hơn */}
      <div className="max-w-7xl mx-auto space-y-8">

        {/* --- HEADER --- */}
        <div className="flex flex-col md:flex-row justify-between items-start md:items-end gap-4">
          <div>
            <h1 className="text-3xl font-extrabold text-slate-800 tracking-tight">Analytics Dashboard</h1>
            <p className="text-slate-500 mt-1">Giám sát & Phân tích phản hồi khách hàng đa kênh</p>
          </div>

          <div className="flex gap-3">
            <button
              onClick={handleRefresh}
              className="flex items-center gap-2 px-4 py-2 bg-white border border-slate-200 text-slate-600 rounded-lg hover:bg-slate-50 hover:text-blue-600 transition-all font-medium shadow-sm"
            >
              <RefreshCw size={16} /> Làm mới
            </button>

            <button
              onClick={handleExport}
              disabled={isExporting}
              className="flex items-center gap-2 bg-gradient-to-r from-emerald-500 to-teal-600 hover:from-emerald-600 hover:to-teal-700 text-white px-5 py-2 rounded-lg font-medium shadow-md transition-all active:scale-95"
            >
              {isExporting ? 'Đang xuất...' : (
                <>
                  <Download size={18} /> Xuất Báo cáo
                </>
              )}
            </button>
          </div>
        </div>

        {/* --- KHU VỰC STATS & UPLOAD --- */}
        <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
          {/* Upload Area chiếm 1 phần hoặc để riêng tùy layout cũ của bạn */}
          <div className="lg:col-span-4">
            <UploadArea onUploadSuccess={handleRefresh} />
          </div>

          <div className="lg:col-span-4">
            <DashboardStats key={`stats-${refreshKey}`} />
          </div>

          <div className="lg:col-span-4">
            <AnalyticsCharts />
          </div>
        </div>

        {/* --- KHU VỰC CHÍNH (MAIN LAYOUT) --- */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start relative">

          {/* CỘT TRÁI: Word Cloud (Sticky) - Chiếm 4/12 phần */}
          <div className="lg:col-span-4 sticky top-24 space-y-6 z-10">
            {/* Bạn có thể thêm các Chart nhỏ khác vào đây nếu muốn */}
            <WordCloudChart key={`cloud-${refreshKey}`} />

            {/* Ví dụ: Một cái Card nhỏ quảng cáo tính năng AI */}
            <div className="bg-gradient-to-br from-blue-600 to-indigo-700 rounded-xl p-6 text-white shadow-lg">
              <h3 className="font-bold text-lg mb-2">💡 Mẹo phân tích</h3>
              <p className="text-blue-100 text-sm mb-4">Sử dụng Chatbot ở góc phải để hỏi chi tiết về các từ khóa đang nổi bật.</p>
              <div className="w-full h-1 bg-white/20 rounded-full">
                <div className="w-2/3 h-full bg-white rounded-full"></div>
              </div>
            </div>
          </div>

          {/* CỘT PHẢI: Danh sách phản hồi - Chiếm 8/12 phần */}
          <div className="lg:col-span-8 min-h-screen">
            <FeedbackList key={`list-${refreshKey}`} />
          </div>

        </div>
      </div>
    </main>
  );
}