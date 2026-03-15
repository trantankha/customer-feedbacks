export default function AuthLayout({
    children,
}: Readonly<{
    children: React.ReactNode;
}>) {
    return (
        <div className="flex h-screen w-full bg-white font-sans text-gray-900">
            {children}
        </div>
    );
}
