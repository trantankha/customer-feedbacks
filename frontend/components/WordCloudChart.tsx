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
        <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100 min-h-[300px] flex justify-center items-center">
            <Loader2 className="animate-spin text-blue-500" />
        </div>
    );

    return (
        // 👇 UI PRO: Không dùng h-full, thêm background gradient nhẹ
        <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100 flex flex-col">
            <div className="flex items-center gap-2 mb-6 pb-4 border-b border-gray-100">
                <div className="p-2 bg-blue-50 text-blue-600 rounded-lg">
                    <Cloud size={20} />
                </div>
                <div>
                    <h3 className="font-bold text-gray-800">Xu hướng Từ khóa</h3>
                    <p className="text-xs text-gray-400">Những từ xuất hiện nhiều nhất</p>
                </div>
            </div>

            {data.length === 0 ? (
                <div className="h-[250px] flex flex-col justify-center items-center text-gray-400">
                    <Cloud size={48} className="text-gray-200 mb-2" />
                    <p>Chưa có đủ dữ liệu</p>
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