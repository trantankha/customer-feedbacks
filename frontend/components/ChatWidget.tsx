'use client';

import { useState, useRef, useEffect } from 'react';
import api from '@/lib/api';
import { MessageCircle, X, Send, Bot, Sparkles, ArrowRight } from 'lucide-react';
import ReactMarkdown from 'react-markdown';

// --- NGÂN HÀNG CÂU HỎI MẪU ---
const SAMPLE_QUESTIONS = [
    "Khách hàng đang phàn nàn về vấn đề gì nhiều nhất?",
    "Tóm tắt các điểm mạnh và điểm yếu của shop trong tuần qua.",
    "Có phát hiện dấu hiệu khách hàng 'bom hàng' hay lừa đảo không?",
    "So sánh thái độ khách hàng giữa Facebook và Shopee.",
    "Đề xuất 3 hành động cụ thể để cải thiện CSKH ngay lập tức.",
    "Ai là khách hàng 'fan cứng' tích cực nhất?",
    "Phân tích xu hướng cảm xúc của khách hàng theo thời gian.",
    "Viết một mẫu tin nhắn xin lỗi gửi cho các khách hàng đang tức giận."
];

export default function ChatWidget() {
    const [isOpen, setIsOpen] = useState(false);
    const [messages, setMessages] = useState<{ role: 'user' | 'bot', text: string }[]>([
        { role: 'bot', text: 'Xin chào! Tôi là trợ lý AI. Tôi đã đọc hết dữ liệu phản hồi, bạn cần tôi phân tích gì không?' }
    ]);
    const [input, setInput] = useState('');
    const [isLoading, setIsLoading] = useState(false);
    const [suggestions, setSuggestions] = useState<string[]>([]);
    const messagesEndRef = useRef<HTMLDivElement>(null);

    // Random câu hỏi mỗi khi mở Chat
    useEffect(() => {
        if (isOpen) {
            // Xáo trộn mảng và lấy 3 câu
            const shuffled = [...SAMPLE_QUESTIONS].sort(() => 0.5 - Math.random());
            setSuggestions(shuffled.slice(0, 3));
        }
    }, [isOpen]);

    // Tự động cuộn xuống
    useEffect(() => {
        messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    }, [messages, isOpen, isLoading]);

    const handleSend = async (text: string = input) => {
        if (!text.trim()) return;

        // 1. Thêm tin nhắn User
        setMessages(prev => [...prev, { role: 'user', text: text }]);
        setInput('');
        setIsLoading(true);

        // 2. Gọi API
        try {
            const res = await api.post('/chat/ask', { question: text });
            setMessages(prev => [...prev, { role: 'bot', text: res.data.answer }]);
        } catch (error) {
            setMessages(prev => [...prev, { role: 'bot', text: 'Xin lỗi, tôi đang bị quá tải. Vui lòng thử lại sau!' }]);
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <div className="fixed bottom-6 right-6 z-50 flex flex-col items-end font-sans">

            {/* CỬA SỔ CHAT */}
            {isOpen && (
                <div className="bg-white w-[380px] h-[600px] rounded-2xl shadow-2xl border border-gray-200 flex flex-col mb-4 overflow-hidden animate-in slide-in-from-bottom-5 fade-in duration-300 ring-1 ring-black/5">

                    {/* Header Gradient đẹp mắt */}
                    <div className="bg-gradient-to-r from-blue-600 via-indigo-600 to-purple-600 p-4 flex justify-between items-center text-white shadow-md">
                        <div className="flex items-center gap-2.5">
                            <div className="bg-white/20 p-1.5 rounded-lg backdrop-blur-sm">
                                <Bot size={20} className="text-white" />
                            </div>
                            <div>
                                <h3 className="font-bold text-sm">Trợ lý Phân tích AI</h3>
                                <div className="flex items-center gap-1.5">
                                    <span className="w-2 h-2 bg-green-400 rounded-full animate-pulse"></span>
                                    <span className="text-[10px] text-white/80 font-medium">Đang trực tuyến</span>
                                </div>
                            </div>
                        </div>
                        <button onClick={() => setIsOpen(false)} className="hover:bg-white/20 p-1.5 rounded-lg transition-colors cursor-pointer">
                            <X size={18} />
                        </button>
                    </div>

                    {/* Body tin nhắn */}
                    <div className="flex-1 overflow-y-auto p-4 space-y-5 bg-slate-50">
                        {messages.map((msg, idx) => (
                            <div key={idx} className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'} animate-in fade-in slide-in-from-bottom-2 duration-300`}>

                                {msg.role === 'bot' && (
                                    <div className="w-8 h-8 rounded-full bg-gradient-to-tr from-blue-500 to-purple-500 flex items-center justify-center text-white text-xs mr-2 shrink-0 shadow-sm mt-1">
                                        AI
                                    </div>
                                )}

                                <div className={`max-w-[85%] p-3.5 rounded-2xl text-sm leading-relaxed shadow-sm ${msg.role === 'user'
                                    ? 'bg-blue-600 text-white rounded-br-none'
                                    : 'bg-white border border-gray-100 text-gray-800 rounded-bl-none'
                                    }`}>
                                    {msg.role === 'bot' ? (
                                        <div className="prose prose-sm prose-p:my-1 prose-headings:my-2 max-w-none">
                                            <ReactMarkdown>{msg.text}</ReactMarkdown>
                                        </div>
                                    ) : (
                                        msg.text
                                    )}
                                </div>
                            </div>
                        ))}

                        {/* Loading Indicator */}
                        {isLoading && (
                            <div className="flex justify-start">
                                <div className="w-8 h-8 rounded-full bg-gradient-to-tr from-blue-500 to-purple-500 flex items-center justify-center text-white text-xs mr-2 shrink-0 mt-1">AI</div>
                                <div className="bg-white p-3 rounded-2xl border shadow-sm flex items-center gap-1.5">
                                    <div className="w-1.5 h-1.5 bg-blue-500 rounded-full animate-bounce" />
                                    <div className="w-1.5 h-1.5 bg-blue-500 rounded-full animate-bounce delay-75" />
                                    <div className="w-1.5 h-1.5 bg-blue-500 rounded-full animate-bounce delay-150" />
                                </div>
                            </div>
                        )}

                        <div ref={messagesEndRef} />
                    </div>

                    {/* KHU VỰC GỢI Ý (SUGGESTIONS) - Chỉ hiện khi không loading */}
                    {!isLoading && (
                        <div className="px-4 py-2 bg-slate-50 flex flex-col gap-2">
                            {suggestions.map((q, idx) => (
                                <button
                                    key={idx}
                                    onClick={() => handleSend(q)}
                                    className="text-left cursor-pointer text-xs bg-white border border-blue-100 hover:border-blue-300 hover:bg-blue-50 text-slate-700 hover:text-blue-700 py-2 px-3 rounded-xl transition-all shadow-sm flex items-center justify-between group"
                                >
                                    <span className="truncate">{q}</span>
                                    <Sparkles size={12} className="text-blue-400 opacity-0 group-hover:opacity-100 transition-opacity" />
                                </button>
                            ))}
                        </div>
                    )}

                    {/* Footer Input */}
                    <div className="p-3 bg-white border-t border-gray-100">
                        <div className="flex gap-2 bg-gray-100 p-1.5 rounded-full border border-transparent focus-within:border-blue-300 focus-within:ring-2 focus-within:ring-blue-100 transition-all">
                            <input
                                type="text"
                                value={input}
                                onChange={(e) => setInput(e.target.value)}
                                onKeyDown={(e) => e.key === 'Enter' && handleSend()}
                                placeholder="Hỏi tôi về dữ liệu..."
                                className="flex-1 bg-transparent px-3 text-sm focus:outline-none text-gray-700"
                                disabled={isLoading}
                            />
                            <button
                                onClick={() => handleSend()}
                                disabled={isLoading || !input.trim()}
                                className="bg-blue-600 text-white p-2 rounded-full hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors shadow-sm"
                            >
                                {isLoading ? <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin block"></span> : <ArrowRight size={18} />}
                            </button>
                        </div>
                        <div className="text-[10px] text-center text-gray-400 mt-2">
                            Được hỗ trợ bởi Tinmyn AI Pro
                        </div>
                    </div>
                </div>
            )}

            {/* NÚT BONG BÓNG CHAT */}
            <button
                onClick={() => setIsOpen(!isOpen)}
                className={`group cursor-pointer relative p-4 rounded-full shadow-2xl transition-all duration-300 hover:scale-105 active:scale-95 ${isOpen ? 'bg-white text-gray-600 rotate-90' : 'bg-gradient-to-br from-blue-600 to-indigo-600 text-white'
                    }`}
            >
                {isOpen ? <X size={28} /> : (
                    <>
                        <MessageCircle size={28} />
                        {/* Dấu chấm đỏ báo hiệu có thông báo (Trang trí) */}
                        <span className="absolute top-0 right-0 w-3 h-3 bg-red-500 border-2 border-white rounded-full animate-pulse"></span>
                    </>
                )}
            </button>
        </div>
    );
}