import Sidebar from '@/components/layout/Sidebar';
import TopBar from '@/components/layout/TopBar';

export default function DashboardLayout({
    children,
}: {
    children: React.ReactNode;
}) {
    return (
        <div className="min-h-screen bg-black">
            <Sidebar />
            <TopBar role="SME" />

            <main className="ml-20 pt-16">
                <div className="p-8">
                    {children}
                </div>
            </main>
        </div>
    );
}
