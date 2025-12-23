'use client';

import { useEffect, useState } from 'react';
import api from '@/lib/api';
import {
    Chart as ChartJS, CategoryScale, LinearScale, PointElement, LineElement, Title, Tooltip, Legend, ArcElement, Filler
} from 'chart.js';
import { Line, Doughnut } from 'react-chartjs-2';
import { TrendingUp, PieChart, Loader2 } from 'lucide-react';

ChartJS.register(CategoryScale, LinearScale, PointElement, LineElement, Title, Tooltip, Legend, ArcElement, Filler);

export default function AnalyticsCharts() {
    const [trendData, setTrendData] = useState<any>(null);
    const [loading, setLoading] = useState(true);

    // Fake data để test giao diện khi chưa có API (Bạn có thể xóa khi chạy thật)
    // const trendData = {
    //       dates: ['20/12', '21/12', '22/12', '23/12', '24/12', '25/12', '26/12'],
    //       positive: [5, 8, 12, 7, 10, 15, 18],
    //       negative: [2, 3, 1, 4, 2, 1, 0],
    //       neutral: [1, 2, 3, 1, 2, 2, 1]
    // };
    // const loading = false;

    useEffect(() => {
        api.get('/dashboard/trend?days=7')
            .then(res => {
                setTrendData(res.data);
                setLoading(false);
            })
            .catch(err => {
                console.error(err);
                setLoading(false);
            });
    }, []);

    if (loading) return (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 mb-8 animate-pulse">
            <div className="h-80 bg-gray-800/50 rounded-xl border border-gray-700/50"></div>
            <div className="lg:col-span-2 h-80 bg-gray-800/50 rounded-xl border border-gray-700/50"></div>
        </div>
    );

    if (!trendData || !trendData.dates || trendData.dates.length === 0) {
        return (
            <div className="h-64 bg-gray-800/50 rounded-xl flex items-center justify-center text-gray-400 border border-dashed border-gray-700">
                Chưa có dữ liệu thống kê trong 7 ngày qua.
            </div>
        );
    }

    // --- CẤU HÌNH BIỂU ĐỒ ĐƯỜNG (LINE CHART) ---
    const lineChartData = {
        labels: trendData.dates,
        datasets: [
            {
                label: 'Tích cực',
                data: trendData.positive,
                borderColor: '#10b981',
                backgroundColor: 'rgba(16, 185, 129, 0.1)',
                tension: 0.4, fill: true, pointRadius: 3, pointHoverRadius: 6
            },
            {
                label: 'Tiêu cực',
                data: trendData.negative,
                borderColor: '#ef4444',
                backgroundColor: 'rgba(239, 68, 68, 0.1)',
                tension: 0.4, fill: true, pointRadius: 3, pointHoverRadius: 6
            },
        ],
    };

    const lineOptions: any = {
        responsive: true,
        maintainAspectRatio: false,
        plugins: {
            legend: {
                position: 'top',
                labels: { color: '#9ca3af', usePointStyle: true, boxWidth: 8 }
            },
            tooltip: {
                mode: 'index', intersect: false, backgroundColor: 'rgba(17, 24, 39, 0.9)', titleColor: '#fff', bodyColor: '#fff', borderColor: '#374151', borderWidth: 1
            }
        },
        scales: {
            y: {
                beginAtZero: true,
                ticks: { color: '#6b7280', precision: 0 },
                grid: { color: '#374151' }
            },
            x: {
                ticks: { color: '#6b7280' },
                grid: { display: false }
            }
        },
        interaction: { mode: 'nearest', axis: 'x', intersect: false },
    };

    // --- CẤU HÌNH BIỂU ĐỒ TRÒN (DOUGHNUT) ---
    const totalPos = trendData.positive.reduce((a: any, b: any) => a + b, 0);
    const totalNeg = trendData.negative.reduce((a: any, b: any) => a + b, 0);
    const totalNeu = trendData.neutral.reduce((a: any, b: any) => a + b, 0);
    const grandTotal = totalPos + totalNeg + totalNeu;

    const doughnutData = {
        labels: ['Tích cực', 'Tiêu cực', 'Trung tính'],
        datasets: [{
            data: [totalPos, totalNeg, totalNeu],
            backgroundColor: ['#10b981', '#ef4444', '#94a3b8'],
            borderWidth: 0,
            hoverOffset: 10,
        }],
    };

    return (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 mb-8">

            {/* === 1. BIỂU ĐỒ TRÒN (Tỷ lệ tổng quan) === */}
            {/* Sử dụng nền tối màu theo ảnh bạn cung cấp */}
            <div className="bg-[#1a1a1a] p-6 rounded-xl shadow-lg border border-gray-800 flex flex-col h-[400px]">

                {/* Phần Chú thích (Legend) - Đã sửa căn chỉnh */}
                <div className="mb-8 space-y-3 pl-4">
                    {/* Dòng Tích cực */}
                    <div className="flex items-center gap-3"> {/* flex + items-center giúp căn giữa theo trục dọc */}
                        <div className="w-12 h-3 bg-[#10b981] rounded-sm shadow-sm"></div>
                        <span className="text-gray-300 font-medium">Tích cực</span>
                    </div>
                    {/* Dòng Tiêu cực */}
                    <div className="flex items-center gap-3">
                        <div className="w-12 h-3 bg-[#ef4444] rounded-sm shadow-sm"></div>
                        <span className="text-gray-300 font-medium">Tiêu cực</span>
                    </div>
                    {/* Dòng Trung tính */}
                    <div className="flex items-center gap-3">
                        <div className="w-12 h-3 bg-[#94a3b8] rounded-sm shadow-sm"></div>
                        <span className="text-gray-300 font-medium">Trung tính</span>
                    </div>
                </div>

                {/* Phần Biểu đồ và Số tổng - Đã sửa căn giữa */}
                <div className="flex-1 flex items-center justify-center relative">
                    {/* Container cho biểu đồ, đặt kích thước cố định */}
                    <div className="w-56 h-56 relative">
                        <Doughnut data={doughnutData} options={{ cutout: '75%', plugins: { legend: { display: false } } }} />

                        {/* Số tổng ở giữa - Sử dụng flex center tuyệt đối */}
                        <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none">
                            {/* leading-none rất quan trọng để số không bị đẩy lên cao */}
                            <span className="text-5xl font-extrabold text-white leading-none drop-shadow-lg">
                                {grandTotal}
                            </span>
                            <span className="text-gray-400 text-sm mt-2 font-medium uppercase tracking-wider">Phản hồi</span>
                        </div>
                    </div>
                </div>
            </div>

            {/* === 2. BIỂU ĐỒ ĐƯỜNG (Xu hướng) === */}
            <div className="lg:col-span-2 bg-[#1a1a1a] p-6 rounded-xl shadow-lg border border-gray-800 h-[400px] flex flex-col">
                <div className="flex items-center justify-between mb-6">
                    <div className="flex items-center gap-3">
                        <div className="p-2 bg-blue-500/20 rounded-lg text-blue-400">
                            <TrendingUp size={22} />
                        </div>
                        <div>
                            <h3 className="font-bold text-gray-100 text-lg">Xu hướng Cảm xúc</h3>
                            <p className="text-gray-500 text-sm">Diễn biến trong 7 ngày qua</p>
                        </div>
                    </div>
                </div>
                <div className="flex-1 w-full min-h-0">
                    <Line data={lineChartData} options={lineOptions} />
                </div>
            </div>
        </div>
    );
}