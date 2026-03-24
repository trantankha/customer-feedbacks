'use client';

import { useState, useEffect } from 'react';
import { User, Lock, Save, Loader2, CheckCircle2 } from 'lucide-react';
import api from '@/lib/api';

export default function SettingsPage() {
    const [activeTab, setActiveTab] = useState<'profile' | 'security'>('profile');

    // Profile State
    const [profile, setProfile] = useState({ full_name: '', email: '' });
    const [profileLoading, setProfileLoading] = useState(false);
    const [profileMessage, setProfileMessage] = useState({ text: '', type: '' });

    // Security State
    const [passwords, setPasswords] = useState({ current: '', new: '', confirm: '' });
    const [securityLoading, setSecurityLoading] = useState(false);
    const [securityMessage, setSecurityMessage] = useState({ text: '', type: '' });

    useEffect(() => {
        fetchProfile();
    }, []);

    const fetchProfile = async () => {
        try {
            const res = await api.get('/auth/me');
            if (res.data) {
                setProfile({
                    full_name: res.data.full_name || '',
                    email: res.data.email || ''
                });
            }
        } catch (error) {
            console.error("Failed to fetch profile", error);
        }
    };

    const handleProfileSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setProfileLoading(true);
        setProfileMessage({ text: '', type: '' });

        try {
            await api.put('/auth/me', profile);
            setProfileMessage({ text: 'Cập nhật thông tin cá nhân thành công!', type: 'success' });
        } catch (error: any) {
            setProfileMessage({
                text: error.response?.data?.detail || 'Có lỗi xảy ra',
                type: 'error'
            });
        } finally {
            setProfileLoading(false);
        }
    };

    const handleSecuritySubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setSecurityLoading(true);
        setSecurityMessage({ text: '', type: '' });

        if (passwords.new !== passwords.confirm) {
            setSecurityMessage({ text: 'Mật khẩu xác nhận không khớp.', type: 'error' });
            setSecurityLoading(false);
            return;
        }

        if (passwords.new.length < 6) {
            setSecurityMessage({ text: 'Mật khẩu mới phải từ 6 ký tự trở lên.', type: 'error' });
            setSecurityLoading(false);
            return;
        }

        try {
            await api.post('/auth/change-password', {
                current_password: passwords.current,
                new_password: passwords.new
            });
            setSecurityMessage({ text: 'Đổi mật khẩu thành công!', type: 'success' });
            setPasswords({ current: '', new: '', confirm: '' });
        } catch (error: any) {
            setSecurityMessage({
                text: error.response?.data?.detail || 'Có lỗi xảy ra khi đổi mật khẩu',
                type: 'error'
            });
        } finally {
            setSecurityLoading(false);
        }
    };

    // Calculate password strength
    const getPwdStrength = (pwd: string) => {
        if (!pwd) return 0;
        let s = 0;
        if (pwd.length >= 8) s += 25;
        if (/[A-Z]/.test(pwd)) s += 25;
        if (/[0-9]/.test(pwd)) s += 25;
        if (/[^A-Za-z0-9]/.test(pwd)) s += 25;
        return s;
    };

    const strength = getPwdStrength(passwords.new);
    const strengthColor = strength < 50 ? 'bg-red-500' : strength < 75 ? 'bg-yellow-500' : 'bg-green-500';

    return (
        <div className="max-w-[1200px] mx-auto p-6 md:p-8">
            <div className="mb-8">
                <h1 className="text-2xl font-bold text-gray-900">Cài đặt Tài khoản</h1>
                <p className="text-gray-500 mt-1 text-sm">Quản lý thông tin cá nhân và bảo mật của bạn.</p>
            </div>

            <div className="flex flex-col md:flex-row gap-8">
                {/* Sidebar Navigation */}
                <div className="w-full md:w-64 shrink-0">
                    <nav className="flex flex-col gap-1">
                        <button
                            onClick={() => setActiveTab('profile')}
                            className={`flex items-center cursor-pointer justify-start gap-3 px-4 py-3 text-sm font-medium rounded-xl transition-colors ${activeTab === 'profile'
                                ? 'bg-blue-50 text-blue-700'
                                : 'text-gray-600 hover:bg-gray-50 hover:text-gray-900'
                                }`}
                        >
                            <User size={18} />
                            Hồ sơ cá nhân
                        </button>
                        <button
                            onClick={() => setActiveTab('security')}
                            className={`flex items-center cursor-pointer justify-start gap-3 px-4 py-3 text-sm font-medium rounded-xl transition-colors ${activeTab === 'security'
                                ? 'bg-blue-50 text-blue-700'
                                : 'text-gray-600 hover:bg-gray-50 hover:text-gray-900'
                                }`}
                        >
                            <Lock size={18} />
                            Bảo mật & Mật khẩu
                        </button>
                    </nav>
                </div>

                {/* Content Area */}
                <div className="flex-1 max-w-2xl">
                    {activeTab === 'profile' && (
                        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6 md:p-8 animate-in fade-in zoom-in duration-300">
                            <h2 className="text-xl font-semibold mb-6">Hồ sơ cá nhân</h2>

                            <div className="flex items-center gap-6 mb-8 pb-8 border-b border-gray-100">
                                <div className="w-20 h-20 rounded-full justify-center items-center flex bg-blue-100 text-blue-600 text-2xl font-bold shrink-0">
                                    {(profile.full_name || profile.email || 'A').charAt(0).toUpperCase()}
                                </div>
                                <div>
                                    <h3 className="font-medium text-gray-900 text-lg">{profile.full_name || 'Người dùng mới'}</h3>
                                    <p className="text-gray-500 text-sm mt-0.5">{profile.email}</p>
                                </div>
                            </div>

                            {profileMessage.text && (
                                <div className={`mb-6 p-4 rounded-xl text-sm flex items-center gap-2 ${profileMessage.type === 'success' ? 'bg-green-50 text-green-700 border border-green-200' : 'bg-red-50 text-red-700 border border-red-200'}`}>
                                    {profileMessage.type === 'success' ? <CheckCircle2 size={18} /> : null}
                                    {profileMessage.text}
                                </div>
                            )}

                            <form onSubmit={handleProfileSubmit} className="space-y-5">
                                <div className="space-y-1.5">
                                    <label className="text-sm font-medium text-gray-700">Tên đầy đủ</label>
                                    <input
                                        type="text"
                                        required
                                        value={profile.full_name}
                                        onChange={e => setProfile({ ...profile, full_name: e.target.value })}
                                        className="w-full px-4 py-2.5 bg-gray-50 border border-gray-200 rounded-xl focus:bg-white focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none transition-all"
                                        placeholder="Nhập tên của bạn"
                                    />
                                </div>
                                <div className="space-y-1.5">
                                    <label className="text-sm font-medium text-gray-700">Địa chỉ Email</label>
                                    <input
                                        type="email"
                                        required
                                        disabled
                                        value={profile.email}
                                        onChange={e => setProfile({ ...profile, email: e.target.value })}
                                        className="w-full px-4 py-2.5 bg-gray-100 text-gray-500 border border-gray-200 rounded-xl cursor-not-allowed outline-none transition-all"
                                        title="Email được dùng làm tài khoản nên không thể thay đổi ở đây"
                                    />
                                </div>

                                <div className="pt-4 flex justify-end">
                                    <button
                                        type="submit"
                                        disabled={profileLoading}
                                        className="bg-blue-600 cursor-pointer hover:bg-blue-700 text-white px-6 py-2.5 rounded-xl font-medium transition-colors flex items-center gap-2 disabled:opacity-70"
                                    >
                                        {profileLoading ? <Loader2 size={18} className="animate-spin" /> : <Save size={18} />}
                                        Lưu thay đổi
                                    </button>
                                </div>
                            </form>
                        </div>
                    )}

                    {activeTab === 'security' && (
                        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6 md:p-8 animate-in fade-in zoom-in duration-300">
                            <h2 className="text-xl font-semibold mb-6">Đổi mật khẩu</h2>

                            {securityMessage.text && (
                                <div className={`mb-6 p-4 rounded-xl text-sm flex items-center gap-2 ${securityMessage.type === 'success' ? 'bg-green-50 text-green-700 border border-green-200' : 'bg-red-50 text-red-700 border border-red-200'}`}>
                                    {securityMessage.type === 'success' ? <CheckCircle2 size={18} /> : null}
                                    {securityMessage.text}
                                </div>
                            )}

                            <form onSubmit={handleSecuritySubmit} className="space-y-5">
                                <div className="space-y-1.5">
                                    <label className="text-sm font-medium text-gray-700">Mật khẩu hiện tại</label>
                                    <input
                                        type="password"
                                        required
                                        value={passwords.current}
                                        onChange={e => setPasswords({ ...passwords, current: e.target.value })}
                                        className="w-full px-4 py-2.5 bg-gray-50 border border-gray-200 rounded-xl focus:bg-white focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none transition-all tracking-widest"
                                        placeholder="••••••••"
                                    />
                                </div>
                                <div className="space-y-1.5 pt-2 border-t border-gray-100">
                                    <label className="text-sm font-medium text-gray-700">Mật khẩu mới</label>
                                    <input
                                        type="password"
                                        required
                                        value={passwords.new}
                                        onChange={e => setPasswords({ ...passwords, new: e.target.value })}
                                        className="w-full px-4 py-2.5 bg-gray-50 border border-gray-200 rounded-xl focus:bg-white focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none transition-all tracking-widest"
                                        placeholder="••••••••"
                                    />
                                    {passwords.new.length > 0 && (
                                        <div className="mt-2 text-xs flex items-center gap-2">
                                            <div className="flex-1 h-1.5 bg-gray-100 rounded-full overflow-hidden">
                                                <div
                                                    className={`h-full transition-all duration-300 ${strengthColor}`}
                                                    style={{ width: `${strength}%` }}
                                                ></div>
                                            </div>
                                            <span className="text-gray-500 w-24 text-right">
                                                {strength < 50 ? 'Yếu' : strength < 75 ? 'Trung bình' : 'Mạnh'}
                                            </span>
                                        </div>
                                    )}
                                </div>
                                <div className="space-y-1.5">
                                    <label className="text-sm font-medium text-gray-700">Xác nhận mật khẩu mới</label>
                                    <input
                                        type="password"
                                        required
                                        value={passwords.confirm}
                                        onChange={e => setPasswords({ ...passwords, confirm: e.target.value })}
                                        className="w-full px-4 py-2.5 bg-gray-50 border border-gray-200 rounded-xl focus:bg-white focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none transition-all tracking-widest"
                                        placeholder="••••••••"
                                    />
                                </div>

                                <div className="pt-4 flex justify-end">
                                    <button
                                        type="submit"
                                        disabled={securityLoading}
                                        className="bg-blue-600 cursor-pointer hover:bg-blue-700 text-white px-6 py-2.5 rounded-xl font-medium transition-colors flex items-center gap-2 disabled:opacity-70"
                                    >
                                        {securityLoading ? <Loader2 size={18} className="animate-spin" /> : <Save size={18} />}
                                        Cập nhật mật khẩu
                                    </button>
                                </div>
                            </form>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}
