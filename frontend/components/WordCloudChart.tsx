'use client';

import { useEffect, useState } from 'react';
import api from '@/lib/api';
import { TagCloud } from 'react-tagcloud';
import { Loader2 } from 'lucide-react';

export default function WordCloudChart() {
    const [data, setData] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        api.get('/dashboard/keywords')
            .then((res) => {
                setData(res.data);
                setLoading(false);
            })
            .catch((err) => {
                console.error(err);
                setLoading(false);
            });
    }, []);

    // Cấu hình màu sắc ngẫu nhiên cho từ khóa
    const options = {
        luminosity: 'dark',
        hue: 'blue',
    };

    if (loading) return (
        <div className="flex justify-center items-center h-64">
            <Loader2 className="animate-spin text-blue-500" />
        </div>
    );

    if (data.length === 0) return (
        <div className="flex justify-center items-center h-64 text-gray-400">
            Chưa có đủ dữ liệu từ khóa
        </div>
    );

    return (
        <div className="bg-white p-6 rounded-lg shadow-sm border h-full">
            <h3 className="font-semibold mb-6 text-gray-700">Đám mây Từ khóa (Hot Topics)</h3>

            <div className="flex justify-center items-center h-64 cursor-pointer">
                <TagCloud
                    minSize={14} // Cỡ chữ nhỏ nhất
                    maxSize={40} // Cỡ chữ to nhất
                    tags={data}
                    className="font-bold text-center"
                    onClick={(tag: any) => alert(`Từ khóa: "${tag.value}" xuất hiện ${tag.count} lần`)}
                    renderer={(tag: any, size: number, color: string) => (
                        <span
                            key={tag.value}
                            style={{
                                fontSize: size,
                                color: color, // Màu ngẫu nhiên
                                margin: '3px',
                                padding: '3px',
                                display: 'inline-block',
                                cursor: 'pointer',
                            }}
                            className="hover:opacity-70 transition-opacity"
                        >
                            {tag.value}
                        </span>
                    )}
                />
            </div>
        </div>
    );
}