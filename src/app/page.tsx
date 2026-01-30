import { auth, signIn, signOut } from "@/auth";
import { Dashboard } from "@/components/Dashboard";
import { Calendar, LogOut, LogIn, Bug } from "lucide-react";
import { APP_CONFIG } from "@/lib/config";

export default async function Home() {
  const session = await auth();
  const showDashboard = !!session || APP_CONFIG.isDebug;

  return (
    <div className="fixed inset-0 bg-gray-50 flex flex-col overflow-hidden">
      {/* Header */}
      <header className="bg-white border-b flex-none z-50">
        <div className="max-w-7xl mx-auto px-4 h-16 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="bg-blue-600 p-2 rounded-lg">
              <Calendar className="w-6 h-6 text-white" />
            </div>
            <h1 className="text-xl font-bold text-gray-900">Occupancy Dashboard</h1>
            {APP_CONFIG.isDebug && (
              <span className="flex items-center gap-1 bg-amber-100 text-amber-700 text-xs font-bold px-2 py-1 rounded border border-amber-200 ml-2">
                <Bug className="w-3 h-3" />
                DEBUG MODE
              </span>
            )}
          </div>
          
          <div className="flex items-center gap-4">
            {session ? (
              <>
                <div className="flex items-center gap-3">
                  {session.user?.image && (
                    <img src={session.user.image} alt={session.user.name || ""} className="w-8 h-8 rounded-full border" />
                  )}
                  <div className="hidden sm:block text-right">
                    <p className="text-sm font-medium text-gray-900 leading-none">{session.user?.name}</p>
                    <p className="text-xs text-gray-500">{session.user?.email}</p>
                  </div>
                </div>
                <form action={async () => {
                  "use server";
                  await signOut();
                }}>
                  <button className="p-2 hover:bg-gray-100 rounded-full transition-colors text-gray-600" title="Logout">
                    <LogOut className="w-5 h-5" />
                  </button>
                </form>
              </>
            ) : (
              <form action={async () => {
                "use server";
                await signIn("google");
              }}>
                <button className="flex items-center gap-2 bg-white border border-gray-300 px-4 py-2 rounded-md text-sm font-medium text-gray-700 hover:bg-gray-50 transition-colors">
                  <LogIn className="w-4 h-4" />
                  Sign in with Google
                </button>
              </form>
            )}
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="flex-1 relative">
        {showDashboard ? (
          <div className="absolute inset-0">
            <Dashboard />
          </div>
        ) : (
          <div className="max-w-4xl mx-auto py-20 px-4 text-center">
            <h2 className="text-4xl font-extrabold text-gray-900 mb-6">
              Track your daily calendar occupancy effortlessly.
            </h2>
            <p className="text-xl text-gray-600 mb-10 max-w-2xl mx-auto">
              Connect your Google Calendar to visualize how much of your day is spent in meetings.
              Distinguish between business and off-hours at a glance.
            </p>
            <form action={async () => {
              "use server";
              await signIn("google");
            }}>
              <button className="inline-flex items-center gap-2 bg-blue-600 text-white px-8 py-4 rounded-xl text-lg font-semibold hover:bg-blue-700 transition-all shadow-lg shadow-blue-200">
                <LogIn className="w-5 h-5" />
                Get Started with Google
              </button>
            </form>
          </div>
        )}
      </main>

      {/* Footer */}
      <footer className="bg-white border-t py-8 px-4 flex-none">
        <div className="max-w-7xl mx-auto text-center text-gray-500 text-sm">
          <p>© 2026 Occupancy Dashboard. Powered by Next.js & Google Calendar API.</p>
        </div>
      </footer>
    </div>
  );
}
