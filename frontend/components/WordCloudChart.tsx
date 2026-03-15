'use client';

import { useEffect, useState } from 'react';
import api from '@/lib/api';
import { TagCloud } from 'react-tagcloud';
import { Loader2, Cloud } from 'lucide-react';

export default function WordCloudChart() {
    const [data, setData] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        // Thêm timestamp để tránh cache
        api.get(`/dashboard/keywords?_t=${new Date().getTime()}`)
            .then((res) => {
                setData(res.data);
                setLoading(false);
            })
            .catch((err) => {
                console.error(err);
                setLoading(false);
            });
    }, []);

    if (loading) return (
        <div className="flex justify-center items-center h-full min-h-[200px]">
            <Loader2 className="animate-spin text-blue-500 w-8 h-8" />
        </div>
    );

    return (
        <div className="flex flex-col h-full">
            {data.length === 0 ? (
                <div className="h-full min-h-[200px] flex flex-col justify-center items-center text-gray-400 bg-gray-50/50 rounded-lg border border-dashed border-gray-200">
                    <Cloud size={48} className="text-gray-300 mb-2" />
                    <p className="text-sm">Chưa có đủ dữ liệu</p>
                </div>
            ) : (
                // Set chiều cao cố định cho vùng cloud để không bị vỡ layout
                <div className="min-h-[300px] flex items-center justify-center cursor-pointer select-none">
                    <TagCloud
                        minSize={12}
                        maxSize={35}
                        tags={data}
                        className="font-bold text-center leading-loose" // leading-loose giúp các từ thoáng hơn
                        onClick={(tag: any) => alert(`Từ khóa: "${tag.value}" xuất hiện ${tag.count} lần`)}
                        renderer={(tag: any, size: number, color: string) => (
                            <span
                                key={tag.value}
                                style={{
                                    fontSize: size,
                                    color: color === 'blue' ? '#2563eb' : color, // Ép màu nếu cần
                                    margin: '4px',
                                    padding: '4px 8px',
                                    display: 'inline-block',
                                }}
                                className="hover:bg-gray-100 rounded-md transition-colors duration-200"
                            >
                                {tag.value}
                            </span>
                        )}
                    />
                </div>
            )}
        </div>
    );
}