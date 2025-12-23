'use client';

import { useState, useRef, useEffect } from 'react';
import api from '@/lib/api';
import { MessageCircle, X, Send, Bot, User } from 'lucide-react';
import ReactMarkdown from 'react-markdown';

export default function ChatWidget() {
    const [isOpen, setIsOpen] = useState(false);
    const [messages, setMessages] = useState<{ role: 'user' | 'bot', text: string }[]>([
        { role: 'bot', text: 'Xin chào! Tôi là trợ lý AI. Tôi đã đọc các phản hồi gần đây, bạn muốn biết điều gì?' }
    ]);
    const [input, setInput] = useState('');
    const [isLoading, setIsLoading] = useState(false);
    const messagesEndRef = useRef<HTMLDivElement>(null);

    // Tự động cuộn xuống tin nhắn mới nhất
    useEffect(() => {
        messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    }, [messages, isOpen]);

    const handleSend = async () => {
        if (!input.trim()) return;

        const userQuestion = input;
        setInput('');
        // Thêm tin nhắn user vào list
        setMessages(prev => [...prev, { role: 'user', text: userQuestion }]);
        setIsLoading(true);

        try {
            const res = await api.post('/chat/ask', { question: userQuestion });
            // Thêm tin nhắn bot vào list
            setMessages(prev => [...prev, { role: 'bot', text: res.data.answer }]);
        } catch (error) {
            setMessages(prev => [...prev, { role: 'bot', text: 'Xin lỗi, hệ thống đang bận. Vui lòng thử lại sau.' }]);
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <div className="fixed bottom-6 right-6 z-50 flex flex-col items-end">
            {/* Cửa sổ Chat */}
            {isOpen && (
                <div className="bg-white w-80 md:w-96 h-[500px] rounded-2xl shadow-2xl border border-gray-200 flex flex-col mb-4 overflow-hidden animate-in slide-in-from-bottom-5 fade-in duration-300">
                    {/* Header */}
                    <div className="bg-gradient-to-r from-blue-600 to-indigo-600 p-4 flex justify-between items-center text-white">
                        <div className="flex items-center gap-2">
                            <Bot size={20} />
                            <span className="font-semibold">Trợ lý Phân tích AI</span>
                        </div>
                        <button onClick={() => setIsOpen(false)} className="hover:bg-white/20 p-1 rounded cursor-pointer">
                            <X size={18} />
                        </button>
                    </div>

                    {/* Body tin nhắn */}
                    <div className="flex-1 overflow-y-auto p-4 space-y-4 bg-gray-50">
                        {messages.map((msg, idx) => (
                            <div key={idx} className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}>
                                <div className={`max-w-[85%] p-3 rounded-2xl text-sm ${msg.role === 'user'
                                    ? 'bg-blue-600 text-white rounded-br-none'
                                    : 'bg-white border text-gray-800 rounded-bl-none shadow-sm'
                                    }`}>
                                    {msg.role === 'bot' ? (
                                        // Dùng ReactMarkdown để hiển thị in đậm, xuống dòng đẹp
                                        <ReactMarkdown>{msg.text}</ReactMarkdown>
                                    ) : (
                                        msg.text
                                    )}
                                </div>
                            </div>
                        ))}
                        {isLoading && (
                            <div className="flex justify-start">
                                <div className="bg-white p-3 rounded-2xl border shadow-sm flex items-center gap-2">
                                    <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" />
                                    <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce delay-75" />
                                    <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce delay-150" />
                                </div>
                            </div>
                        )}
                        <div ref={messagesEndRef} />
                    </div>

                    {/* Footer nhập liệu */}
                    <div className="p-3 bg-white border-t">
                        <div className="flex gap-2">
                            <input
                                type="text"
                                value={input}
                                onChange={(e) => setInput(e.target.value)}
                                onKeyDown={(e) => e.key === 'Enter' && handleSend()}
                                placeholder="Hỏi gì đó về dữ liệu..."
                                className="flex-1 border rounded-full px-4 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                            />
                            <button
                                onClick={handleSend}
                                disabled={isLoading || !input.trim()}
                                className="bg-blue-600 cursor-pointer text-white p-2 rounded-full hover:bg-blue-700 disabled:opacity-50 transition-colors"
                            >
                                <Send size={18} />
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {/* Nút Bong bóng Chat */}
            <button
                onClick={() => setIsOpen(!isOpen)}
                className={`p-4 cursor-pointer rounded-full shadow-lg transition-all duration-300 hover:scale-110 ${isOpen ? 'bg-gray-200 text-gray-600' : 'bg-blue-600 text-white'
                    }`}
            >
                {isOpen ? <X size={24} /> : <MessageCircle size={24} />}
            </button>
        </div>
    );
}