import Footer from '@/components/Footer';

export default function MarketingLayout({
    children,
}: Readonly<{
    children: React.ReactNode;
}>) {
    return (
        <div className="flex flex-col min-h-screen">
            {children}
            <Footer />
        </div>
    );
}
