// src/components/DashboardStats.tsx
'use client';

import { useEffect, useState } from 'react';
import api from '@/lib/api';
import { PieChart, Pie, Cell, Tooltip, ResponsiveContainer, Legend } from 'recharts';

// Định nghĩa màu sắc cho biểu đồ
const COLORS = {
    'TÍCH CỰC': '#16a34a', // Xanh lá
    'TIÊU CỰC': '#dc2626', // Đỏ
    'TRUNG LẬP': '#ca8a04',  // Vàng
    'HỖN HỢP': '#2563eb'     // Xanh dương
};

export default function DashboardStats() {
    const [stats, setStats] = useState<any>(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        // Gọi API lấy số liệu
        api.get('/dashboard/stats')
            .then((res) => {
                setStats(res.data);
                setLoading(false);
            })
            .catch((err) => {
                console.error("Lỗi tải stats:", err);
                setLoading(false);
            });
    }, []);

    if (loading) return <div className="text-gray-500">Đang tải số liệu...</div>;
    if (!stats) return <div className="text-red-500">Không có dữ liệu</div>;

    // Mapping từ tiếng Anh sang tiếng Việt
    const sentimentLabels: { [key: string]: string } = {
        POSITIVE: 'TÍCH CỰC',
        NEGATIVE: 'TIÊU CỰC',
        NEUTRAL: 'TRUNG LẬP',
        MIXED: 'HỖN HỢP'
    };

    // Chuyển đổi dữ liệu cho Recharts
    // Backend trả về: { "POSITIVE": 10, "NEGATIVE": 5 }
    // Cần đổi thành: [{ name: "Tích cực", value: 10 }, ...]
    const chartData = Object.keys(stats.sentiment_counts).map(key => ({
        name: sentimentLabels[key] || key,
        value: stats.sentiment_counts[key]
    }));

    return (
        <div>
            {/* 1. Phần thẻ số liệu */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
                <StatCard title="Tổng phản hồi" value={stats.total} color="text-gray-900" />
                <StatCard
                    title="Tích cực"
                    value={stats.sentiment_counts['POSITIVE'] || 0}
                    color="text-green-600"
                />
                <StatCard
                    title="Tiêu cực"
                    value={stats.sentiment_counts['NEGATIVE'] || 0}
                    color="text-red-600"
                />
            </div>

            {/* 2. Phần Biểu đồ */}
            <div className="bg-white p-6 rounded-lg shadow-sm border h-96">
                <h3 className="font-semibold mb-4 text-gray-700">Tỷ lệ Cảm xúc</h3>
                <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                        <Pie
                            data={chartData}
                            cx="50%"
                            cy="50%"
                            innerRadius={60}
                            outerRadius={100}
                            paddingAngle={5}
                            dataKey="value"
                        >
                            {chartData.map((entry: any, index: number) => (
                                <Cell key={`cell-${index}`} fill={(COLORS as any)[entry.name] || '#ccc'} />
                            ))}
                        </Pie>
                        <Tooltip />
                        <Legend verticalAlign="bottom" height={36} />
                    </PieChart>
                </ResponsiveContainer>
            </div>
        </div>
    );
}

// Component con hiển thị thẻ nhỏ
function StatCard({ title, value, color }: { title: string, value: number, color: string }) {
    return (
        <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-100">
            <h3 className="text-gray-500 text-sm font-medium">{title}</h3>
            <p className={`text-3xl font-bold mt-2 ${color}`}>{value}</p>
        </div>
    );
}