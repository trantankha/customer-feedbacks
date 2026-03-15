import ChatWidget from "@/components/ChatWidget";
import Header from "@/components/Header";
import Footer from "@/components/Footer";

export default function DashboardLayout({
    children,
}: Readonly<{
    children: React.ReactNode;
}>) {
    return (
        <div className="flex flex-col min-h-screen">
            <Header />
            <div className="flex-grow">
                {children}
            </div>
            <Footer />
            <ChatWidget />
        </div>
    );
}
