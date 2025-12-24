'use client';

import { useEffect, useState } from 'react';
import api from '@/lib/api';
import {
    Chart as ChartJS, CategoryScale, LinearScale, PointElement, LineElement, Title, Tooltip, Legend, ArcElement, Filler
} from 'chart.js';
import { Line, Doughnut } from 'react-chartjs-2';
import { TrendingUp, PieChart, Calendar, FilterX } from 'lucide-react';

ChartJS.register(CategoryScale, LinearScale, PointElement, LineElement, Title, Tooltip, Legend, ArcElement, Filler);

export default function AnalyticsCharts() {
    const [trendData, setTrendData] = useState<any>(null);
    const [loading, setLoading] = useState(true);
    // State quản lý khoảng thời gian (Mặc định 7 ngày)
    const [days, setDays] = useState(7);

    useEffect(() => {
        setLoading(true);
        // Thêm _t để chống cache trình duyệt
        api.get(`/dashboard/trend?days=${days}&_t=${new Date().getTime()}`)
            .then(res => {
                setTrendData(res.data);
                setLoading(false);
            })
            .catch(err => {
                console.error(err);
                setLoading(false);
            });
    }, [days]); // Khi 'days' thay đổi, useEffect sẽ chạy lại

    // --- CẤU HÌNH BIỂU ĐỒ ĐƯỜNG ---
    const lineChartData = trendData ? {
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
    } : { labels: [], datasets: [] };

    const lineOptions: any = {
        responsive: true,
        maintainAspectRatio: false,
        plugins: {
            legend: { position: 'top', labels: { color: '#9ca3af', usePointStyle: true, boxWidth: 8 } },
            tooltip: { mode: 'index', intersect: false, backgroundColor: 'rgba(17, 24, 39, 0.9)', titleColor: '#fff', bodyColor: '#fff', borderColor: '#374151', borderWidth: 1 }
        },
        scales: {
            y: { beginAtZero: true, ticks: { color: '#6b7280', precision: 0 }, grid: { color: '#374151' } },
            x: { ticks: { color: '#6b7280', maxTicksLimit: 10 }, grid: { display: false } }
        },
        interaction: { mode: 'nearest', axis: 'x', intersect: false },
    };

    // --- TÍNH TOÁN DỮ LIỆU TỔNG ---
    const totalPos = trendData?.positive?.reduce((a: any, b: any) => a + b, 0) || 0;
    const totalNeg = trendData?.negative?.reduce((a: any, b: any) => a + b, 0) || 0;
    const totalNeu = trendData?.neutral?.reduce((a: any, b: any) => a + b, 0) || 0;
    const grandTotal = totalPos + totalNeg + totalNeu;

    const doughnutData = {
        labels: ['Tích cực', 'Tiêu cực', 'Trung tính'],
        datasets: [{
            data: [totalPos, totalNeg, totalNeu],
            backgroundColor: ['#10b981', '#ef4444', '#94a3b8'],
            borderWidth: 0, hoverOffset: 10,
        }],
    };

    // --- RENDER ---
    if (loading) return (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 mb-8 animate-pulse">
            <div className="h-[400px] bg-[#1a1a1a] rounded-xl border border-gray-800"></div>
            <div className="lg:col-span-2 h-[400px] bg-[#1a1a1a] rounded-xl border border-gray-800"></div>
        </div>
    );

    // Trường hợp có dữ liệu API nhưng toàn là số 0 (GrandTotal = 0)
    const isEmpty = grandTotal === 0;

    return (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 mb-8">

            {/* === 1. BIỂU ĐỒ TRÒN === */}
            <div className="bg-[#1a1a1a] p-6 rounded-xl shadow-lg border border-gray-800 flex flex-col h-[400px]">
                {isEmpty ? (
                    <div className="flex-1 flex flex-col items-center justify-center text-gray-500">
                        <FilterX size={48} className="mb-4 opacity-50" />
                        <p>Không có dữ liệu</p>
                        <p className="text-xs mt-1">Thử chọn khoảng thời gian khác</p>
                    </div>
                ) : (
                    <>
                        <div className="mb-8 space-y-3 pl-4">
                            <div className="flex items-center gap-3"><div className="w-12 h-3 bg-[#10b981] rounded-sm shadow-sm"></div><span className="text-gray-300 font-medium">Tích cực ({Math.round(totalPos / grandTotal * 100) || 0}%)</span></div>
                            <div className="flex items-center gap-3"><div className="w-12 h-3 bg-[#ef4444] rounded-sm shadow-sm"></div><span className="text-gray-300 font-medium">Tiêu cực ({Math.round(totalNeg / grandTotal * 100) || 0}%)</span></div>
                            <div className="flex items-center gap-3"><div className="w-12 h-3 bg-[#94a3b8] rounded-sm shadow-sm"></div><span className="text-gray-300 font-medium">Trung tính ({Math.round(totalNeu / grandTotal * 100) || 0}%)</span></div>
                        </div>
                        <div className="flex-1 flex items-center justify-center relative">
                            <div className="w-56 h-56 relative">
                                <Doughnut data={doughnutData} options={{ cutout: '75%', plugins: { legend: { display: false } } }} />
                                <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none">
                                    <span className="text-5xl font-extrabold text-white leading-none drop-shadow-lg">{grandTotal}</span>
                                    <span className="text-gray-400 text-sm mt-2 font-medium uppercase tracking-wider">Phản hồi</span>
                                </div>
                            </div>
                        </div>
                    </>
                )}
            </div>

            {/* === 2. BIỂU ĐỒ ĐƯỜNG === */}
            <div className="lg:col-span-2 bg-[#1a1a1a] p-6 rounded-xl shadow-lg border border-gray-800 h-[400px] flex flex-col">
                <div className="flex items-center justify-between mb-6">
                    <div className="flex items-center gap-3">
                        <div className="p-2 bg-blue-500/20 rounded-lg text-blue-400">
                            <TrendingUp size={22} />
                        </div>
                        <div>
                            <h3 className="font-bold text-gray-100 text-lg">Xu hướng Cảm xúc</h3>
                            <p className="text-gray-500 text-sm">Biểu đồ biến động theo thời gian</p>
                        </div>
                    </div>

                    {/* SELECT BOX CHỌN NGÀY (Hoạt động thật) */}
                    <div className="flex items-center gap-2 bg-[#2d2d2d] rounded-lg px-3 py-1.5 border border-gray-700">
                        <Calendar size={14} className="text-gray-400" />
                        <select
                            value={days}
                            onChange={(e) => setDays(Number(e.target.value))}
                            className="bg-transparent text-gray-200 text-xs font-medium outline-none cursor-pointer"
                        >
                            <option value={7}>7 ngày gần nhất</option>
                            <option value={14}>14 ngày qua</option>
                            <option value={30}>30 ngày qua</option>
                            <option value={90}>90 ngày qua</option>
                            <option value={365}>1 năm qua</option>
                        </select>
                    </div>
                </div>

                <div className="flex-1 w-full min-h-0">
                    {isEmpty ? (
                        <div className="h-full flex flex-col items-center justify-center text-gray-500 border border-dashed border-gray-800 rounded-lg">
                            <p>Dữ liệu nằm ngoài khoảng thời gian này.</p>
                            <button onClick={() => setDays(90)} className="mt-2 text-blue-500 hover:underline text-sm">
                                Xem 90 ngày gần nhất
                            </button>
                        </div>
                    ) : (
                        <Line data={lineChartData} options={lineOptions} />
                    )}
                </div>
            </div>

        </div>
    );
}