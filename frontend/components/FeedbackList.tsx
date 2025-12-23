'use client';

import { useEffect, useState } from 'react';
import api from '@/lib/api';
import { Edit2, Check, X } from 'lucide-react';

export default function FeedbackList() {
    const [feedbacks, setFeedbacks] = useState<any[]>([]);
    // State lưu ID của dòng đang được sửa
    const [editingId, setEditingId] = useState<string | null>(null);
    // State lưu giá trị tạm thời khi đang chọn
    const [tempLabel, setTempLabel] = useState<string>("");

    // Hàm load dữ liệu
    const fetchFeedbacks = () => {
        api.get('/feedbacks?limit=20')
            .then((res) => setFeedbacks(res.data))
            .catch((err) => console.error(err));
    };

    useEffect(() => {
        fetchFeedbacks();
    }, []);

    // Bắt đầu sửa
    const startEdit = (item: any) => {
        setEditingId(item.id);
        setTempLabel(item.analysis?.sentiment_label || "NEUTRAL");
    };

    // Hủy sửa
    const cancelEdit = () => {
        setEditingId(null);
    };

    // Lưu lại thay đổi
    const saveEdit = async (feedbackId: string) => {
        try {
            await api.put(`/feedbacks/${feedbackId}/analysis`, {
                sentiment_label: tempLabel
            });
            // Refresh lại list sau khi lưu thành công
            fetchFeedbacks();
            setEditingId(null);
        } catch (error) {
            alert("Lỗi khi cập nhật!");
            console.error(error);
        }
    };

    return (
        <div className="bg-white p-6 rounded-lg shadow-sm border h-full overflow-hidden flex flex-col">
            <h3 className="font-semibold mb-4 text-gray-700 flex justify-between items-center">
                Phản hồi gần đây
                <button onClick={fetchFeedbacks} className="text-xs text-blue-500 hover:underline">Làm mới</button>
            </h3>

            <div className="flex-1 overflow-y-auto pr-2 space-y-4">
                {feedbacks.map((item) => (
                    <div key={item.id} className="border-b pb-4 last:border-0 last:pb-0 hover:bg-gray-50 p-2 rounded transition-colors">

                        <div className="flex justify-between items-start mb-2">
                            {/* --- KHU VỰC HIỂN THỊ NHÃN & NÚT SỬA --- */}
                            <div className="flex items-center gap-2">

                                {editingId === item.id ? (
                                    // Giao diện khi đang SỬA (Dropdown + Save/Cancel)
                                    <div className="flex items-center gap-1 animate-in fade-in">
                                        <select
                                            value={tempLabel}
                                            onChange={(e) => setTempLabel(e.target.value)}
                                            className="text-xs text-black border rounded p-1 bg-white focus:ring-2 focus:ring-blue-500 outline-none"
                                        >
                                            <option value="POSITIVE">TÍCH CỰC</option>
                                            <option value="NEGATIVE">TIÊU CỰC</option>
                                            <option value="NEUTRAL">TRUNG TÍNH</option>
                                        </select>
                                        <button onClick={() => saveEdit(item.id)} className="p-1 text-green-600 hover:bg-green-100 rounded">
                                            <Check size={14} />
                                        </button>
                                        <button onClick={cancelEdit} className="p-1 text-red-600 hover:bg-red-100 rounded">
                                            <X size={14} />
                                        </button>
                                    </div>
                                ) : (
                                    // Giao diện HIỂN THỊ bình thường
                                    <div className="flex items-center gap-2 group">
                                        <span className={`text-xs font-bold px-2 py-1 rounded select-none
                      ${item.analysis?.sentiment_label === 'POSITIVE' ? 'bg-green-100 text-green-700' :
                                                item.analysis?.sentiment_label === 'NEGATIVE' ? 'bg-red-100 text-red-700' : 'bg-gray-200 text-gray-700'}`}>
                                            {item.analysis?.sentiment_label || 'CHƯA XỬ LÝ'}
                                        </span>
                                        {/* Nút bút chì chỉ hiện khi hover chuột vào dòng này */}
                                        <button
                                            onClick={() => startEdit(item)}
                                            className="text-gray-400 hover:text-blue-600 opacity-0 group-hover:opacity-100 transition-opacity"
                                            title="Sửa nhãn thủ công"
                                        >
                                            <Edit2 size={12} />
                                        </button>
                                    </div>
                                )}

                            </div>

                            <span className="text-xs text-gray-400 whitespace-nowrap ml-2">
                                {item.customer_info.time_posted ? new Date(item.customer_info.time_posted).toLocaleDateString('vi-VN') : 'N/A'}
                            </span>
                        </div>

                        {/* Nội dung comment */}
                        <p className="text-gray-800 text-sm mb-1 line-clamp-3">{item.raw_content}</p>

                        {/* Metadata (User, Likes...) */}
                        {item.customer_info && (
                            <div className="flex items-center gap-3 mt-1 text-xs text-gray-500">
                                {item.customer_info.name && (
                                    <span className="font-medium text-blue-600">@{item.customer_info.name}</span>
                                )}
                                {item.customer_info.likes && (
                                    <span>👍 {item.customer_info.likes}</span>
                                )}
                                {/* Hiển thị nguồn */}
                                <span className="px-1.5 py-0.5 bg-gray-200 rounded text-[10px]">
                                    {item.customer_info.imported_from}
                                </span>
                            </div>
                        )}
                    </div>
                ))}
            </div>
        </div>
    );
}