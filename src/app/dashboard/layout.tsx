import { redirect } from "next/navigation";
import { getSession } from "@/lib/auth";
import { DashboardShell } from "@/components/layout/DashboardShell";
import { prisma } from "@/lib/prisma";

export default async function DashboardLayout({ children }: { children: React.ReactNode }) {
  const session = await getSession();
  if (!session) redirect("/login");
  if (session.role === "admin") redirect("/admin");

  const user = await prisma.user.findUnique({ where: { id: session.userId } });
  if (!user) redirect("/login");

  if (user.status === "banned") {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center p-8 bg-white rounded-xl shadow border border-gray-200 max-w-md">
          <div className="text-red-500 text-4xl mb-4">🚫</div>
          <h2 className="text-xl font-bold text-gray-900 mb-2">Account Suspended</h2>
          <p className="text-gray-500">Your account has been suspended. Please contact support@yieldprosper.com</p>
        </div>
      </div>
    );
  }

  if (user.status === "pending") {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center p-8 bg-white rounded-xl shadow border border-gray-200 max-w-md">
          <div className="text-yellow-500 text-4xl mb-4">⏳</div>
          <h2 className="text-xl font-bold text-gray-900 mb-2">Account Pending Review</h2>
          <p className="text-gray-500">Your publisher application is under review. We&apos;ll notify you once approved.</p>
        </div>
      </div>
    );
  }

  return (
    <DashboardShell role="publisher" userName={user.name}>
      {children}
    </DashboardShell>
  );
}
