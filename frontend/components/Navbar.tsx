'use client';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { LayoutDashboard, Users } from 'lucide-react';

export default function Navbar() {
    const pathname = usePathname();

    return (
        <nav className="bg-white border-b px-8 py-4 flex items-center gap-8 shadow-sm sticky top-0 z-40">
            <div className="font-bold text-xl text-blue-600 mr-4">FeedbackPro</div>

            <Link href="/" className={`flex items-center gap-2 text-sm font-medium transition-colors ${pathname === '/' ? 'text-blue-600' : 'text-gray-500 hover:text-gray-800'
                }`}>
                <LayoutDashboard size={18} /> Dashboard
            </Link>

            <Link href="/customers" className={`flex items-center gap-2 text-sm font-medium transition-colors ${pathname === '/customers' ? 'text-blue-600' : 'text-gray-500 hover:text-gray-800'
                }`}>
                <Users size={18} /> Khách hàng (CRM)
            </Link>
        </nav>
    );
}