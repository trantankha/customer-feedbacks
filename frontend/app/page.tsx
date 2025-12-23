'use client';

import { useState } from 'react';
import DashboardStats from '@/components/DashboardStats';
import FeedbackList from '@/components/FeedbackList';
import UploadArea from '@/components/UploadArea';
import WordCloudChart from '@/components/WordCloudChart';
import ChatWidget from '@/components/ChatWidget';
import { Download } from 'lucide-react';
import api from '@/lib/api';

export default function Home() {
  const [refreshKey, setRefreshKey] = useState(0);

  const handleRefresh = () => {
    setRefreshKey(prev => prev + 1);
  };

  const handleExport = async () => {
    try {
      const response = await api.get('/feedbacks/export', {
        responseType: 'blob', // Quan trọng: Báo cho axios biết đây là file binary
      });

      // Tạo link ảo để trình duyệt tự tải về
      const url = window.URL.createObjectURL(new Blob([response.data]));
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', `Bao_cao_phan_tich_${new Date().toISOString().slice(0, 10)}.xlsx`);
      document.body.appendChild(link);
      link.click();
      link.remove();
    } catch (error) {
      console.error("Lỗi download:", error);
      alert("Không thể xuất file báo cáo!");
    }
  };

  return (
    <main className="min-h-screen bg-gray-50 p-6 md:p-8">
      <div className="max-w-7xl mx-auto space-y-8">

        {/* Header */}
        <div className="flex justify-between items-end">
          <div>
            <h1 className="text-3xl font-bold text-gray-800">Analytics Dashboard</h1>
            <p className="text-gray-500 mt-1">Hệ thống phân tích phản hồi khách hàng thông minh</p>
          </div>

          <div className="flex gap-3">
            {/* Nút Refresh cũ */}
            <button onClick={handleRefresh} className="text-sm font-medium text-blue-600 hover:text-blue-800 px-3 py-2">
              Làm mới
            </button>

            {/* Nút Export Mới */}
            <button
              onClick={handleExport}
              className="flex cursor-pointer items-center gap-2 bg-green-600 hover:bg-green-700 text-white px-4 py-2 rounded-lg text-sm font-medium transition-colors shadow-sm"
            >
              <Download size={16} />
              Xuất Excel
            </button>
          </div>
        </div>

        {/* 1. Khu vực Upload */}
        <UploadArea onUploadSuccess={handleRefresh} />

        {/* 2. Khu vực Thống kê số liệu (Cards) & Biểu đồ */}
        <DashboardStats key={`stats-${refreshKey}`} />

        {/* 3. Khu vực Word Cloud & Danh sách (Layout mới 2 cột) */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">

          {/* Cột Trái: Word Cloud (Chiếm 1 phần) */}
          <div className="lg:col-span-1 h-full">
            <WordCloudChart key={`cloud-${refreshKey}`} />
          </div>

          {/* Cột Phải: Danh sách phản hồi (Chiếm 2 phần cho dễ đọc) */}
          <div className="lg:col-span-2">
            <FeedbackList key={`list-${refreshKey}`} />
          </div>
        </div>
      </div>
    </main>
  );
}