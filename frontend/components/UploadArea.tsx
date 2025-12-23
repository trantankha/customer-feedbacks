'use client';

import { useState } from 'react';
import api from '@/lib/api';
import { UploadCloud, CheckCircle, AlertCircle, Loader2, FileSpreadsheet } from 'lucide-react';

export default function UploadArea({ onUploadSuccess }: { onUploadSuccess: () => void }) {
    // State quản lý trạng thái
    const [isUploading, setIsUploading] = useState(false);
    const [message, setMessage] = useState<{ type: 'success' | 'error', text: string } | null>(null);

    // State quản lý nguồn dữ liệu (Mặc định là Facebook)
    const [platform, setPlatform] = useState('FACEBOOK');

    const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
        // 1. Kiểm tra file đầu vào
        if (!e.target.files || e.target.files.length === 0) return;

        const file = e.target.files[0];

        // Kiểm tra đuôi file (chỉ chấp nhận CSV)
        if (!file.name.toLowerCase().endsWith('.csv')) {
            setMessage({ type: 'error', text: 'Vui lòng chỉ upload file có đuôi .csv' });
            return;
        }

        // 2. Chuẩn bị dữ liệu gửi đi (FormData)
        const formData = new FormData();
        formData.append('file', file);
        formData.append('platform', platform); // Gửi kèm thông tin nguồn (Facebook/Shopee)

        setIsUploading(true);
        setMessage(null);

        // 3. Gọi API
        try {
            await api.post('/feedbacks/upload-csv', formData, {
                headers: {
                    'Content-Type': 'multipart/form-data',
                },
            });

            // 4. Xử lý khi thành công
            setMessage({ type: 'success', text: `Đã tiếp nhận file ${platform}! AI đang chạy ngầm...` });

            // Đợi 2.5 giây để AI chạy được một ít rồi mới refresh dashboard
            setTimeout(() => {
                onUploadSuccess(); // Gọi hàm của cha để refresh lại list
                setIsUploading(false);
                setMessage(null); // Ẩn thông báo sau khi refresh
            }, 2500);

        } catch (error) {
            console.error(error);
            setMessage({ type: 'error', text: 'Có lỗi xảy ra khi upload file. Kiểm tra lại server.' });
            setIsUploading(false);
        }
    };

    return (
        <div className="bg-white p-6 rounded-lg shadow-sm border mb-8 transition-all duration-200">

            {/* Header: Tiêu đề & Dropdown chọn nguồn */}
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-6 gap-4">
                <div>
                    <h3 className="font-bold text-gray-800 flex items-center gap-2">
                        <FileSpreadsheet className="w-5 h-5 text-blue-600" />
                        Nhập dữ liệu khách hàng
                    </h3>
                    <p className="text-xs text-gray-500 mt-1">Hỗ trợ file CSV từ công cụ Easy Scraper</p>
                </div>

                {/* Dropdown chọn Platform */}
                <select
                    value={platform}
                    onChange={(e) => setPlatform(e.target.value)}
                    disabled={isUploading}
                    className="bg-gray-50 border border-gray-300 text-gray-900 text-sm rounded-lg focus:ring-blue-500 focus:border-blue-500 block p-2.5 w-full sm:w-auto outline-none cursor-pointer hover:bg-gray-100 transition-colors"
                >
                    <option value="FACEBOOK">Nguồn: Facebook (Comments)</option>
                    <option value="SHOPEE">Nguồn: Shopee (Ratings)</option>
                    <option value="OTHER">Khác (Tự động nhận diện)</option>
                </select>
            </div>

            {/* Khu vực Upload (Drag & Drop UI) */}
            <div className={`border-2 border-dashed rounded-xl p-10 text-center relative transition-colors ${isUploading ? 'bg-gray-50 border-gray-300' : 'border-blue-300 hover:bg-blue-50'}`}>

                {/* Input file ẩn, phủ kín thẻ div cha */}
                <input
                    type="file"
                    accept=".csv"
                    onChange={handleFileChange}
                    disabled={isUploading}
                    className="absolute inset-0 w-full h-full opacity-0 cursor-pointer disabled:cursor-not-allowed z-10"
                />

                <div className="flex flex-col items-center justify-center space-y-4">
                    {isUploading ? (
                        // Trạng thái đang tải
                        <>
                            <Loader2 className="w-12 h-12 text-blue-500 animate-spin" />
                            <div>
                                <p className="font-semibold text-gray-700">Đang tải lên & Phân tích...</p>
                                <p className="text-xs text-gray-500 mt-1">Vui lòng không tắt trình duyệt</p>
                            </div>
                        </>
                    ) : (
                        // Trạng thái chờ
                        <>
                            <div className="bg-blue-100 p-4 rounded-full">
                                <UploadCloud className="w-8 h-8 text-blue-600" />
                            </div>
                            <div>
                                <p className="text-sm text-gray-600">
                                    <span className="font-semibold text-blue-600">Click để chọn file</span> hoặc kéo thả file vào đây
                                </p>
                                <p className="text-xs text-gray-400 mt-2">Định dạng hỗ trợ: .CSV (UTF-8)</p>
                            </div>
                        </>
                    )}
                </div>
            </div>

            {/* Thông báo kết quả (Alert) */}
            {message && (
                <div className={`mt-4 p-4 rounded-lg flex items-center gap-3 text-sm animate-in fade-in slide-in-from-top-2 duration-300 ${message.type === 'success'
                    ? 'bg-green-50 text-green-700 border border-green-200'
                    : 'bg-red-50 text-red-700 border border-red-200'
                    }`}>
                    {message.type === 'success' ? <CheckCircle className="w-5 h-5 flex-shrink-0" /> : <AlertCircle className="w-5 h-5 flex-shrink-0" />}
                    <span className="font-medium">{message.text}</span>
                </div>
            )}
        </div>
    );
}