import { Outlet, Link, useLocation, useNavigate } from "react-router";
import { LayoutDashboard, Mountain, Image, Bell, LogOut, MessageSquareText, Settings } from "lucide-react";
import { useEffect, useState } from "react";
import { getCurrentSession, signOutAdmin, subscribeToAuthChanges } from "../../data/auth";

export function AdminLayout() {
  const location = useLocation();
  const navigate = useNavigate();
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [checkingAuth, setCheckingAuth] = useState(true);

  useEffect(() => {
    let mounted = true;

    async function checkSession() {
      try {
        const session = await getCurrentSession();
        if (!mounted) return;

        if (!session) {
          setIsAuthenticated(false);
          navigate("/admin");
        } else {
          setIsAuthenticated(true);
        }
      } catch {
        if (!mounted) return;
        setIsAuthenticated(false);
        navigate("/admin");
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
    navigate("/admin");
  };

  if (checkingAuth || !isAuthenticated) {
    return null;
  }

  const navItems = [
    { path: "/admin/dashboard", icon: LayoutDashboard, label: "Dashboard" },
    { path: "/admin/dashboard/treks", icon: Mountain, label: "Treks" },
    { path: "/admin/dashboard/images", icon: Image, label: "Images" },
    { path: "/admin/dashboard/notices", icon: Bell, label: "Notices" },
    { path: "/admin/dashboard/inquiries", icon: MessageSquareText, label: "Inquiries" },
    { path: "/admin/dashboard/settings", icon: Settings, label: "Settings" },
  ];

  return (
    <div className="min-h-screen bg-sidebar flex">
      <aside className="w-64 bg-sidebar text-sidebar-foreground border-r border-sidebar-border flex flex-col">
        <div className="p-6">
          <h1 className="text-2xl text-sidebar-primary">Idyllic Adventures</h1>
          <a href="/" target="_blank" rel="noopener noreferrer" className="inline-block mt-2 text-sm text-sidebar-primary/80 border border-sidebar-primary/30 rounded px-2 py-1 hover:bg-sidebar-primary/10 transition-colors">
            Visit Site ↗
          </a>
          <p className="text-sm text-sidebar-foreground/60 mt-2">Admin Panel</p>
        </div>

        <nav className="flex-1 px-3">
          {navItems.map((item) => {
            const Icon = item.icon;
            const isActive = location.pathname === item.path;
            return (
              <Link
                key={item.path}
                to={item.path}
                className={`flex items-center gap-3 px-3 py-2.5 rounded-lg mb-1 transition-colors ${
                  isActive
                    ? "bg-sidebar-accent text-sidebar-accent-foreground"
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
