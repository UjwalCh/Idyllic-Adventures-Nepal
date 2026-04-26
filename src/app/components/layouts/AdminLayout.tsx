import { Outlet, Link, useLocation, useNavigate } from "react-router";
import { 
  LayoutDashboard, 
  Mountain, 
  Image, 
  Bell, 
  LogOut, 
  MessageSquareText, 
  Settings, 
  BookOpen,
  Moon,
  Sun,
  Monitor,
  TrendingUp
} from "lucide-react";
import { useEffect, useState } from "react";
import { getCurrentSession, signOutAdmin, subscribeToAuthChanges } from "../../data/auth";
import { useTheme, ThemeProvider } from "next-themes";
import { Toaster } from "../ui/sonner";
import { useBranding } from "../../data/useBranding";
import { WebsiteAnalyticsTracker } from "../WebsiteAnalyticsTracker";

export function AdminLayout() {
  return (
    <ThemeProvider attribute="class" defaultTheme="system" enableSystem storageKey="idyllic-admin-theme">
      <WebsiteAnalyticsTracker />
      <AdminLayoutContent />
      <Toaster position="top-right" />
    </ThemeProvider>
  );
}

function AdminLayoutContent() {
  const location = useLocation();
  const navigate = useNavigate();
  const { settings } = useBranding();
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [checkingAuth, setCheckingAuth] = useState(true);
  const { theme, setTheme } = useTheme();

  useEffect(() => {
    let mounted = true;

    async function checkSession() {
      try {
        const session = await getCurrentSession();
        if (!mounted) return;

        if (!session) {
          setIsAuthenticated(false);
          navigate("/managepage");
        } else {
          setIsAuthenticated(true);
        }
      } catch {
        if (!mounted) return;
        setIsAuthenticated(false);
        navigate("/managepage");
      }
      setCheckingAuth(false);
    }

    void checkSession();

    const unsubscribe = subscribeToAuthChanges((session) => {
      if (!mounted) return;
      if (!session) {
        setIsAuthenticated(false);
        navigate("/admin");
      } else {
        setIsAuthenticated(true);
      }
    });

    return () => {
      mounted = false;
      unsubscribe();
    };
  }, [navigate]);

  const handleLogout = async () => {
    await signOutAdmin();
    navigate("/managepage");
  };

  if (checkingAuth || !isAuthenticated) {
    return null;
  }

  const navItems = [
    { path: "/managepage/dashboard", icon: LayoutDashboard, label: "Dashboard" },
    { path: "/managepage/dashboard/treks", icon: Mountain, label: "Treks" },
    { path: "/managepage/dashboard/journal", icon: BookOpen, label: "Journal" },
    { path: "/managepage/dashboard/gallery", icon: Image, label: "Gallery" },
    { path: "/managepage/dashboard/notices", icon: Bell, label: "Notices" },
    { path: "/managepage/dashboard/inquiries", icon: MessageSquareText, label: "Inquiries" },
    { path: "/managepage/dashboard/analytics", icon: TrendingUp, label: "Analytics" },
    { path: "/managepage/dashboard/settings", icon: Settings, label: "Settings" },
  ];

  return (
    <div className="min-h-screen bg-sidebar flex">
      <aside className="w-64 bg-sidebar text-sidebar-foreground border-r border-sidebar-border flex flex-col">
        <div className="p-6">
          <div className="flex items-center gap-4 mb-8">
            <div 
              onDoubleClick={() => navigate("/managepage")}
              className="w-16 h-16 flex items-center justify-center overflow-hidden transition-transform hover:scale-110 cursor-pointer"
            >
               {settings.site_logo ? (
                 <img src={settings.site_logo} alt="Logo" className="w-full h-full object-contain" />
               ) : (
                 <Mountain className="w-10 h-10 text-accent" />
               )}
            </div>
            <div>
              <h1 className="text-xl font-heading text-sidebar-foreground tracking-tight font-bold leading-tight">Idyllic Adventures</h1>
              <p className="text-[10px] uppercase tracking-[0.3em] text-accent font-bold opacity-80">NEPAL</p>
            </div>
          </div>

          <div className="flex items-center justify-between mb-6">
            <div className="flex items-center gap-1 p-0.5 bg-white/5 rounded-lg border border-white/10">
              {[
                { id: "light", icon: Sun },
                { id: "dark", icon: Moon },
              ].map((t) => (
                <button
                  key={t.id}
                  onClick={() => setTheme(t.id)}
                  className={`p-1.5 rounded-md transition-all ${
                    theme === t.id ? "bg-accent text-white" : "text-sidebar-foreground/40 hover:text-sidebar-foreground"
                  }`}
                >
                  <t.icon className="w-3.5 h-3.5" />
                </button>
              ))}
            </div>
          </div>
          <p className="text-[10px] uppercase tracking-widest text-sidebar-foreground/40 font-bold mb-6">Admin Panel</p>
          
          <a 
            href="/" 
            target="_blank" 
            rel="noopener noreferrer" 
            className="flex items-center justify-center gap-2 w-full py-2.5 bg-accent text-white rounded-xl text-sm font-bold shadow-lg shadow-accent/20 hover:scale-[1.02] active:scale-[0.98] transition-all"
          >
            <Monitor className="w-4 h-4" />
            <span>Visit Live Site</span>
          </a>
        </div>

        <nav className="flex-1 px-3">
          {navItems.map((item) => {
            const Icon = item.icon;
            const isActive = location.pathname === item.path;
            return (
              <Link
                key={item.path}
                to={item.path}
                className={`flex items-center gap-3 px-3 py-2.5 rounded-lg mb-1 transition-all font-bold text-sm tracking-wide ${
                  isActive
                    ? "bg-sidebar-accent text-sidebar-accent-foreground shadow-lg shadow-black/10 scale-[1.02]"
                    : "text-sidebar-foreground/70 hover:bg-sidebar-accent/50 hover:text-sidebar-foreground"
                }`}
              >
                <Icon className="w-5 h-5" />
                <span>{item.label}</span>
              </Link>
            );
          })}
        </nav>


        <div className="p-3 border-t border-sidebar-border">
          <button
            onClick={handleLogout}
            className="flex items-center gap-3 px-3 py-2.5 rounded-lg text-sidebar-foreground/70 hover:bg-sidebar-accent/50 hover:text-sidebar-foreground transition-colors w-full"
          >
            <LogOut className="w-5 h-5" />
            <span>Logout</span>
          </button>
        </div>
      </aside>

      <main className="flex-1 bg-background overflow-auto">
        <Outlet />
      </main>
    </div>
  );
}

