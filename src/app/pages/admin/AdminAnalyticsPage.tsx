import { motion } from "motion/react";
import { 
  Users, 
  Search, 
  Link as LinkIcon, 
  Share2, 
  Download, 
  Clock, 
  Eye, 
  ArrowLeft,
  ChevronRight,
  Globe,
  Monitor,
  TrendingUp,
  MessageSquare,
  LogOut
} from "lucide-react";
import { Link } from "react-router";
import { useWebsiteAnalytics } from "../../data/useRealtimeData";
import { 
  Area, 
  AreaChart, 
  Bar, 
  BarChart, 
  CartesianGrid, 
  Cell, 
  Pie, 
  PieChart, 
  ResponsiveContainer, 
  Tooltip, 
  XAxis, 
  YAxis,
  Legend
} from "recharts";
import { useState, useMemo, useRef, useEffect } from "react";
import { toast } from "sonner";
import jsPDF from "jspdf";
import html2canvas from "html2canvas";

export function AdminAnalyticsPage() {
  const [timeRange, setTimeRange] = useState<"24h" | "7d" | "30d">("7d");
  const { events, loading, error, refresh } = useWebsiteAnalytics(timeRange === "24h" ? 24 : timeRange === "7d" ? 24 * 7 : 24 * 30);
  const reportRef = useRef<HTMLDivElement>(null);
  const [lastSync, setLastSync] = useState<Date>(new Date());

  // High-frequency polling (Turbo Refresh) to ensure live data even if Realtime is off
  useEffect(() => {
    const pollInterval = setInterval(() => {
      void refresh().then(() => setLastSync(new Date()));
    }, 10000); // 10s interval for responsive live testing
    return () => clearInterval(pollInterval);
  }, [refresh]);

  // Filter events based on timeRange
  const filteredEvents = useMemo(() => {
    const now = new Date().getTime();
    const rangeMs = {
      "24h": 24 * 60 * 60 * 1000,
      "7d": 7 * 24 * 60 * 60 * 1000,
      "30d": 30 * 24 * 60 * 60 * 1000,
    }[timeRange];
    
    return events.filter(e => (now - new Date(e.createdAt).getTime()) <= rangeMs);
  }, [events, timeRange]);

  // Enhanced Real-time Tracking
  const liveStats = useMemo(() => {
    const now = Date.now();
    const oneMinAgo = now - 60 * 1000;
    const fiveMinAgo = now - 5 * 60 * 1000;

    const liveNow = new Set(
      events.filter(e => new Date(e.createdAt).getTime() >= oneMinAgo).map(e => e.sessionId)
    ).size;

    const activeRecent = new Set(
      events.filter(e => new Date(e.createdAt).getTime() >= fiveMinAgo).map(e => e.sessionId)
    ).size;

    return { liveNow, activeRecent };
  }, [events]);

  // Feature 2: Top Exit Pages
  const exitPages = useMemo(() => {
    const sessions = filteredEvents.reduce((acc, e) => {
      if (!acc[e.sessionId]) acc[e.sessionId] = e;
      else if (new Date(e.createdAt) > new Date(acc[e.sessionId].createdAt)) {
        acc[e.sessionId] = e;
      }
      return acc;
    }, {} as Record<string, WebsiteEvent>);

    const exitCounts = Object.values(sessions).reduce((acc, e) => {
      acc[e.path || "/"] = (acc[e.path || "/"] || 0) + 1;
      return acc;
    }, {} as Record<string, number>);

    return Object.entries(exitCounts)
      .map(([path, count]) => ({ path, count }))
      .sort((a, b) => b.count - a.count)
      .slice(0, 5);
  }, [filteredEvents]);

  // Traffic Sources
  const sourceData = useMemo(() => {
    const counts = filteredEvents.reduce((acc, e) => {
      acc[e.referrerSource] = (acc[e.referrerSource] || 0) + 1;
      return acc;
    }, {} as Record<string, number>);
    
    return Object.entries(counts).map(([name, value]) => ({ name, value }));
  }, [filteredEvents]);

  // Page Performance
  const pageStats = useMemo(() => {
    const stats = filteredEvents.reduce((acc, e) => {
      const path = e.path || "/";
      if (!acc[path]) acc[path] = { views: 0, duration: 0, sessions: new Set() };
      
      if (e.eventType === "page_view") acc[path].views++;
      if (e.eventType === "stay" && e.duration) acc[path].duration += e.duration;
      acc[path].sessions.add(e.sessionId);
      
      return acc;
    }, {} as Record<string, { views: number; duration: number; sessions: Set<string> }>);

    return Object.entries(stats)
      .map(([path, data]) => ({
        path,
        views: data.views,
        avgDuration: data.views > 0 ? Math.round(data.duration / data.views) : 0,
        uniqueVisitors: data.sessions.size
      }))
      .sort((a, b) => b.views - a.views);
  }, [filteredEvents]);

  // Growth Data (Daily) - Chronological
  const growthData = useMemo(() => {
    const daily = filteredEvents.reduce((acc, e) => {
      const dateObj = new Date(e.createdAt);
      const dateKey = dateObj.toISOString().split('T')[0];
      const label = dateObj.toLocaleDateString([], { month: "short", day: "numeric" });
      
      if (!acc[dateKey]) acc[dateKey] = { dateKey, label, views: 0, visitors: new Set() };
      if (e.eventType === "page_view") acc[dateKey].views++;
      acc[dateKey].visitors.add(e.sessionId);
      return acc;
    }, {} as Record<string, { dateKey: string, label: string, views: number, visitors: Set<string> }>);

    return Object.values(daily)
      .sort((a, b) => a.dateKey.localeCompare(b.dateKey))
      .map(d => ({
        date: d.label,
        views: d.views,
        visitors: d.visitors.size
      }));
  }, [filteredEvents]);

  // NEW: Technology & Visitor Categorization
  const techStats = useMemo(() => {
    const devices: Record<string, number> = { Mobile: 0, Desktop: 0, Tablet: 0 };
    const browsers: Record<string, number> = { Chrome: 0, Safari: 0, Edge: 0, Other: 0 };
    const visitorSessions = new Map<string, { views: number, firstSeen: number }>();

    filteredEvents.forEach(e => {
      // Device detection
      const ua = e.userAgent?.toLowerCase() || "";
      if (ua.includes("mobi")) devices.Mobile++;
      else if (ua.includes("tablet") || ua.includes("ipad")) devices.Tablet++;
      else devices.Desktop++;

      // Browser detection
      if (ua.includes("edg")) browsers.Edge++;
      else if (ua.includes("chrome")) browsers.Chrome++;
      else if (ua.includes("safari") && !ua.includes("chrome")) browsers.Safari++;
      else browsers.Other++;

      // Session pathing
      const sess = visitorSessions.get(e.sessionId) || { views: 0, firstSeen: new Date(e.createdAt).getTime() };
      sess.views++;
      visitorSessions.set(e.sessionId, sess);
    });

    const uniqueSessions = Array.from(visitorSessions.values());
    const bounceRate = uniqueSessions.length > 0 
      ? Math.round((uniqueSessions.filter(s => s.views === 1).length / uniqueSessions.length) * 100) 
      : 0;

    return {
      devices: Object.entries(devices).map(([name, value]) => ({ name, value })),
      browsers: Object.entries(browsers).map(([name, value]) => ({ name, value })),
      bounceRate,
      avgPages: uniqueSessions.length > 0 
        ? (uniqueSessions.reduce((acc, s) => acc + s.views, 0) / uniqueSessions.length).toFixed(1) 
        : "0"
    };
  }, [filteredEvents]);

  // NEW: Visitor Types (New vs Returning)
  const visitorTypeData = useMemo(() => {
    const sessionStarts = filteredEvents.reduce((acc, e) => {
      if (!acc[e.sessionId]) acc[e.sessionId] = new Date(e.createdAt).getTime();
      else acc[e.sessionId] = Math.min(acc[e.sessionId], new Date(e.createdAt).getTime());
      return acc;
    }, {} as Record<string, number>);

    // Simple heuristic: If we have multiple sessions for a user, they are returning.
    // In a real app we'd check a "visitor_id" in the DB.
    // For now, we'll label users with > 10 events as "Highly Engaged/Returning"
    const engagedCount = Object.values(filteredEvents.reduce((acc, e) => {
      acc[e.sessionId] = (acc[e.sessionId] || 0) + 1;
      return acc;
    }, {} as Record<string, number>)).filter(count => count > 5).length;

    const totalUnique = new Set(filteredEvents.map(e => e.sessionId)).size;
    
    return [
      { name: "New Visitors", value: Math.max(0, totalUnique - engagedCount) },
      { name: "Returning", value: engagedCount }
    ];
  }, [filteredEvents]);

  // NEW: Popular Pages & Countries
  const contentStats = useMemo(() => {
    const pages = filteredEvents.reduce((acc, e) => {
      const path = e.path || "/";
      acc[path] = (acc[path] || 0) + 1;
      return acc;
    }, {} as Record<string, number>);

    const countries = filteredEvents.reduce((acc, e) => {
      const country = e.country || "Unknown";
      acc[country] = (acc[country] || 0) + 1;
      return acc;
    }, {} as Record<string, number>);

    const sources = filteredEvents.reduce((acc, e) => {
      const src = e.referrerSource || "Direct";
      acc[src] = (acc[src] || 0) + 1;
      return acc;
    }, {} as Record<string, number>);

  return {
    pages: Object.entries(pages)
      .map(([path, views]) => ({ path, views }))
      .sort((a, b) => b.views - a.views)
      .slice(0, 8),
    countries: Object.entries(countries)
      .map(([country, visits]) => ({ country, visits }))
      .sort((a, b) => b.visits - a.visits)
      .slice(0, 8),
    sources: [
      { name: "Direct", value: sources["Direct"] || 0, icon: Globe, color: "#94a3b8" },
      { name: "Search", value: (sources["Search"] || 0) + (sources["Organic"] || 0), icon: Search, color: "#3b82f6" },
      { name: "Social", value: sources["Social"] || 0, icon: Share2, color: "#f43f5e" },
      { name: "Referral", value: sources["Referral"] || 0, icon: LinkIcon, color: "#10b981" },
      { name: "Email", value: sources["Email"] || 0, icon: MessageSquare, color: "#f97316" }
    ]
  };
}, [filteredEvents]);

const countryData = useMemo(() => {
  const counts = filteredEvents.reduce((acc, e) => {
    const country = e.country || "Unknown";
    acc[country] = (acc[country] || 0) + 1;
    return acc;
  }, {} as Record<string, number>);

  return Object.entries(counts)
    .map(([name, value]) => ({ name, value }))
    .sort((a, b) => b.value - a.value)
    .slice(0, 8);
}, [filteredEvents]);

// NEW: Hourly Traffic Overview for Analytics
const hourlyTraffic = useMemo(() => {
  return Array.from({ length: 24 }, (_, index) => {
    const slotStart = new Date();
    slotStart.setMinutes(0, 0, 0);
    slotStart.setHours(slotStart.getHours() - (23 - index));
    const slotEnd = new Date(slotStart.getTime() + 60 * 60 * 1000);

    const count = filteredEvents.filter((event) => {
      const timestamp = new Date(event.createdAt).getTime();
      return timestamp >= slotStart.getTime() && timestamp < slotEnd.getTime();
    }).length;

    return {
      hour: slotStart.getHours() + ":00",
      views: count,
    };
  });
}, [filteredEvents]);

  const exportPDF = async () => {
    if (!reportRef.current) return;
    const loadingToast = toast.loading("Finalizing Report...");
    
    try {
      // Hardware-accelerated lightweight capture
      const canvas = await html2canvas(reportRef.current, {
        scale: 1, // Standard resolution for maximum stability
        useCORS: true,
        logging: false,
        backgroundColor: "#ffffff",
        removeContainer: true,
      });
      
      const imgData = canvas.toDataURL("image/jpeg", 0.6);
      const pdf = new jsPDF("p", "mm", "a4");
      const pdfWidth = pdf.internal.pageSize.getWidth();
      const pdfHeight = (canvas.height * pdfWidth) / canvas.width;
      
      pdf.addImage(imgData, "JPEG", 0, 0, pdfWidth, Math.min(pdfHeight, 280));
      
      pdf.setFontSize(7);
      pdf.setTextColor(180);
      pdf.text(`© ${new Date().getFullYear()} Idyllic Adventures Nepal | Secure Analytics Report`, 10, 285);
      
      pdf.save(`Analytics-${Date.now()}.pdf`);
      toast.success("Ready for Download", { id: loadingToast });
    } catch (error) {
      console.error("Export Fail:", error);
      toast.error("Low memory. Close other tabs and try again.", { id: loadingToast });
    }
  };

  const COLORS = ["#f43f5e", "#10b981", "#3b82f6", "#f97316"];

  if (loading && events.length === 0) {
    return (
      <div className="p-8 flex items-center justify-center min-h-[400px]">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-accent" />
      </div>
    );
  }

  return (
    <div className="p-8 space-y-8">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
        <div>
          <div className="flex items-center gap-2 text-muted-foreground mb-2">
            <Link to="/managepage/dashboard" className="hover:text-accent transition-colors">Dashboard</Link>
            <ChevronRight className="w-4 h-4" />
            <span className="text-foreground font-medium">Analytics</span>
          </div>
          <h1 className="font-heading text-4xl text-primary">Website Analytics</h1>
          <p className="text-muted-foreground flex items-center gap-2">
            Deep insights into visitor behavior.
            <button 
              onClick={async () => {
                const toastId = toast.loading("Checking Data Pipeline...");
                try {
                  const result = await refresh();
                  const now = Date.now();
                  const isHealthy = result && result.events && result.events.length > 0;
                  if (isHealthy) {
                    toast.success("Pipeline Healthy! Data is flowing.", { id: toastId });
                  } else {
                    toast.warning("Pipeline Empty. Check RLS Policies in Supabase.", { id: toastId });
                  }
                } catch (e) {
                  const errMsg = e instanceof Error ? e.message : String(e);
                  toast.error(`Blocked: ${errMsg}`, { id: toastId, duration: 5000 });
                }
              }}
              className="text-[10px] uppercase tracking-widest font-bold text-accent hover:underline ml-2"
            >
              [ Troubleshoot System Health ]
            </button>
          </p>
        </div>

        {/* Error Alert */}
        {error && (
          <div className="w-full max-w-4xl p-4 bg-red-500/10 border border-red-500/20 rounded-2xl flex items-center gap-4 text-red-600 dark:text-red-400">
             <div className="w-10 h-10 rounded-full bg-red-500/20 flex items-center justify-center shrink-0">
               <span className="font-bold">!</span>
             </div>
             <div>
               <p className="font-bold text-sm">Database Sync Issue</p>
               <p className="text-xs opacity-80">{error}</p>
             </div>
          </div>
        )}
        
        <div className="flex flex-wrap items-center gap-4">
          <div className="flex items-center gap-2 px-3 py-1.5 bg-accent/5 border border-accent/10 rounded-full text-[10px] font-bold text-accent uppercase tracking-widest">
            <div className="w-1.5 h-1.5 rounded-full bg-accent animate-pulse" />
            Last Sync: {lastSync.toLocaleTimeString()}
          </div>
          <div className="flex bg-muted p-1 rounded-xl">
            {(["24h", "7d", "30d"] as const).map((range) => (
              <button
                key={range}
                onClick={() => setTimeRange(range)}
                className={`px-4 py-2 rounded-lg text-xs font-bold uppercase tracking-widest transition-all ${
                  timeRange === range ? "bg-background shadow-sm text-accent" : "text-muted-foreground hover:text-foreground"
                }`}
              >
                {range}
              </button>
            ))}
          </div>
          <button
            onClick={exportPDF}
            className="flex items-center gap-2 px-6 py-3 bg-accent text-white rounded-xl font-bold hover:scale-105 transition-transform shadow-lg shadow-accent/20"
          >
            <Download className="w-4 h-4" />
            Export Report
          </button>
        </div>
      </div>

      <div ref={reportRef} className="space-y-8 p-1 bg-transparent">
        {/* Top Overview Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="glass-panel p-8">
            <div className="flex items-center gap-3 text-emerald-500 mb-4 font-bold text-xs uppercase tracking-widest">
              <span className="relative flex h-3 w-3">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                <span className="relative inline-flex rounded-full h-3 w-3 bg-emerald-500"></span>
              </span>
              Live Activity
            </div>
            <div className="flex items-end gap-4 mb-2">
              <div className="text-5xl font-bold">{liveStats.liveNow}</div>
              <div className="text-sm font-bold text-emerald-500 mb-1 flex items-center gap-1">
                <div className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
                Live Now
              </div>
            </div>
            <div className="text-sm text-muted-foreground flex items-center gap-2">
              <span className="font-bold text-primary">{liveStats.activeRecent}</span>
              <span>active in last 5 min</span>
            </div>
          </motion.div>

          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }} className="glass-panel p-8">
            <div className="w-10 h-10 rounded-xl bg-blue-500/10 flex items-center justify-center mb-4">
              <Eye className="w-5 h-5 text-blue-500" />
            </div>
            <div className="text-4xl font-bold mb-1">{filteredEvents.filter(e => e.eventType === "page_view").length}</div>
            <div className="text-sm text-muted-foreground">Total Page Views</div>
          </motion.div>

          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }} className="glass-panel p-8">
            <div className="w-10 h-10 rounded-xl bg-accent/10 flex items-center justify-center mb-4">
              <Users className="w-5 h-5 text-accent" />
            </div>
            <div className="text-4xl font-bold mb-1">{new Set(filteredEvents.map(e => e.sessionId)).size}</div>
            <div className="text-sm text-muted-foreground">Unique Visitors</div>
          </motion.div>
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.3 }} className="glass-panel p-8">
            <div className="w-10 h-10 rounded-xl bg-orange-500/10 flex items-center justify-center mb-4">
              <TrendingUp className="w-5 h-5 text-orange-500" />
            </div>
            <div className="text-4xl font-bold mb-1">{techStats.bounceRate}%</div>
            <div className="text-sm text-muted-foreground">Estimated Bounce Rate</div>
          </motion.div>
        </div>

        {/* Hourly Pulse Chart */}
        <div className="glass-panel p-8">
          <div className="flex items-center justify-between mb-8">
            <div>
              <h3 className="font-heading text-2xl">Hourly Traffic Pulse</h3>
              <p className="text-xs text-muted-foreground">Monitoring live views over the last 24 hours</p>
            </div>
            <div className="p-3 bg-accent/5 rounded-xl border border-accent/10">
              <Clock className="w-5 h-5 text-accent" />
            </div>
          </div>
          <div className="h-[300px]">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={hourlyTraffic}>
                <defs>
                  <linearGradient id="pulseViews" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#f43f5e" stopOpacity={0.2}/>
                    <stop offset="95%" stopColor="#f43f5e" stopOpacity={0}/>
                  </linearGradient>
                </defs>
                <CartesianGrid vertical={false} strokeDasharray="3 3" opacity={0.05} />
                <XAxis dataKey="hour" axisLine={false} tickLine={false} tick={{ fontSize: 10, fill: "#888" }} />
                <Tooltip contentStyle={{ borderRadius: "16px", border: "none" }} />
                <Area type="monotone" dataKey="views" stroke="#f43f5e" strokeWidth={3} fill="url(#pulseViews)" />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Charts Section */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Main Growth Chart */}
          <div className="lg:col-span-2 glass-panel p-8">
            <div className="flex items-center justify-between mb-8">
              <div>
                <h3 className="font-heading text-2xl">Growth & Engagement</h3>
                <p className="text-xs text-muted-foreground">Daily traffic trends and visitor acquisition</p>
              </div>
              <div className="flex gap-4 text-xs font-bold uppercase tracking-widest">
                <div className="flex items-center gap-2"><div className="w-2 h-2 rounded-full bg-accent" /> Views</div>
                <div className="flex items-center gap-2"><div className="w-2 h-2 rounded-full bg-emerald-500" /> Visitors</div>
              </div>
            </div>
            <div className="h-[400px] relative">
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={growthData}>
                  <defs>
                    <linearGradient id="colorViews" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#f43f5e" stopOpacity={0.1}/>
                      <stop offset="95%" stopColor="#f43f5e" stopOpacity={0}/>
                    </linearGradient>
                  </defs>
                  <CartesianGrid vertical={false} strokeDasharray="3 3" opacity={0.1} />
                  <XAxis 
                    dataKey="date" 
                    axisLine={false} 
                    tickLine={false} 
                    tick={{ fontSize: 10, fontWeight: 600, fill: "#888" }} 
                  />
                  <YAxis 
                    axisLine={false} 
                    tickLine={false} 
                    tick={{ fontSize: 10, fontWeight: 600, fill: "#888" }} 
                  />
                  <Tooltip 
                    contentStyle={{ borderRadius: "16px", border: "none", boxShadow: "0 20px 40px rgba(0,0,0,0.1)" }}
                  />
                  <Area type="monotone" dataKey="views" stroke="#f43f5e" strokeWidth={4} fill="url(#colorViews)" />
                  <Area type="monotone" dataKey="visitors" stroke="#10b981" strokeWidth={3} fill="none" />
                </AreaChart>
              </ResponsiveContainer>
              {growthData.length === 0 && (
                <div className="absolute inset-0 flex flex-col items-center justify-center bg-background/50 backdrop-blur-[2px] rounded-2xl">
                  <TrendingUp className="w-12 h-12 text-muted-foreground/20 mb-4" />
                  <p className="text-muted-foreground font-medium">Waiting for visitor growth data...</p>
                </div>
              )}
            </div>
          </div>

          {/* Traffic Sources Expanded */}
          <div className="glass-panel p-8 relative overflow-hidden">
            <h3 className="font-heading text-2xl mb-8">Traffic Sources</h3>
            <div className="space-y-6">
              {contentStats.sources.map((s) => {
                const percentage = Math.round((s.value / (filteredEvents.length || 1)) * 100);
                return (
                  <div key={s.name} className="space-y-2 group cursor-default">
                    <div className="flex justify-between items-center text-sm font-bold">
                      <div className="flex items-center gap-3">
                        <div className="w-8 h-8 rounded-lg flex items-center justify-center" style={{ backgroundColor: `${s.color}15` }}>
                          <s.icon className="w-4 h-4" style={{ color: s.color }} />
                        </div>
                        <span>{s.name}</span>
                      </div>
                      <span className="text-accent">{percentage}%</span>
                    </div>
                    <div className="h-1.5 bg-muted/30 rounded-full overflow-hidden">
                      <motion.div
                        initial={{ width: 0 }}
                        animate={{ width: `${percentage}%` }}
                        className="h-full"
                        style={{ backgroundColor: s.color }}
                      />
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Device & Browser Row */}
          <div className="lg:col-span-3 grid grid-cols-1 md:grid-cols-2 gap-8">
            {/* Device Chart */}
            <div className="glass-panel p-8">
              <h3 className="font-heading text-xl mb-6">Device Usage</h3>
              <div className="h-[250px]">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={techStats.devices}>
                    <XAxis dataKey="name" axisLine={false} tickLine={false} />
                    <Tooltip contentStyle={{ borderRadius: "12px", border: "none" }} />
                    <Bar dataKey="value" radius={[10, 10, 0, 0]}>
                      {techStats.devices.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={["#3b82f6", "#10b981", "#f97316"][index % 3]} />
                      ))}
                    </Bar>
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </div>

            {/* Browser Chart */}
            <div className="glass-panel p-8">
              <h3 className="font-heading text-xl mb-6">Browsers</h3>
              <div className="h-[250px]">
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie
                      data={techStats.browsers}
                      innerRadius={60}
                      outerRadius={80}
                      dataKey="value"
                    >
                      {techStats.browsers.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={["#f43f5e", "#10b981", "#3b82f6", "#f97316"][index % 4]} />
                      ))}
                    </Pie>
                    <Tooltip contentStyle={{ borderRadius: "12px", border: "none" }} />
                    <Legend />
                  </PieChart>
                </ResponsiveContainer>
              </div>
            </div>
          </div>
          
          {/* Geographic Distribution Row */}
          <div className="lg:col-span-3 glass-panel p-8">
            <div className="flex items-center justify-between mb-8">
              <div>
                <h3 className="font-heading text-2xl">Global Reach</h3>
                <p className="text-xs text-muted-foreground mt-1">Geographic distribution of your audience</p>
              </div>
              <div className="flex items-center gap-3">
                <div className="hidden sm:flex px-4 py-2 rounded-xl bg-blue-500/10 border border-blue-500/20 text-blue-500 font-bold text-sm items-center gap-2">
                  <div className="w-1.5 h-1.5 rounded-full bg-blue-500 animate-pulse" />
                  {filteredEvents.length} Total Traffic
                </div>
                <div className="px-4 py-2 rounded-xl bg-accent/10 border border-accent/20 text-accent font-bold text-sm items-center gap-2 flex">
                  <div className="w-1.5 h-1.5 rounded-full bg-accent" />
                  {new Set(filteredEvents.map(e => e.sessionId)).size} Unique Visitors
                </div>
                <Globe className="w-5 h-5 text-emerald-500/50" />
              </div>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
              {countryData.map((row) => (
                <div key={row.name} className="space-y-2 p-4 rounded-2xl bg-muted/20 border border-border/50">
                  <div className="flex justify-between items-center text-sm font-bold">
                    <div className="flex items-center gap-2">
                      <span className="text-lg">📍</span>
                      <span className="truncate max-w-[100px]">{row.name}</span>
                    </div>
                    <span className="text-accent">{row.value}</span>
                  </div>
                  <div className="h-1.5 bg-muted/30 rounded-full overflow-hidden">
                    <motion.div
                      initial={{ width: 0 }}
                      animate={{ width: `${(row.value / (filteredEvents.length || 1)) * 100}%` }}
                      className="h-full bg-accent"
                    />
                  </div>
                  <div className="text-[10px] text-muted-foreground font-bold uppercase tracking-tighter">
                    {Math.round((row.value / (filteredEvents.length || 1)) * 100)}% density
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Top Exit Pages Card */}
          <div className="lg:col-span-3 glass-panel p-8">
            <div className="flex items-center gap-3 mb-6">
              <div className="w-10 h-10 rounded-xl bg-red-500/10 flex items-center justify-center">
                <LogOut className="w-5 h-5 text-red-500" />
              </div>
              <div>
                <h3 className="font-heading text-xl">Top Exit Pages</h3>
                <p className="text-xs text-muted-foreground">Where visitors end their journey</p>
              </div>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
              {exitPages.map((page, idx) => (
                <div key={idx} className="p-4 rounded-2xl bg-red-500/5 border border-red-500/10 hover:border-red-500/30 transition-colors">
                  <div className="text-xs font-bold text-red-500 mb-1 truncate">{page.path}</div>
                  <div className="text-2xl font-bold">{page.count}</div>
                  <div className="text-[10px] text-muted-foreground uppercase font-bold tracking-widest mt-1">Exit Events</div>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Detailed Table */}
        <div className="glass-panel overflow-hidden">
          <div className="p-8 border-b border-border/50 bg-muted/10">
            <h3 className="font-heading text-2xl">Page Performance</h3>
            <p className="text-sm text-muted-foreground">Views and engagement metrics per page</p>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-left">
              <thead>
                <tr className="text-xs uppercase tracking-widest font-bold text-muted-foreground border-b border-border/30">
                  <th className="px-8 py-5">Page Path</th>
                  <th className="px-8 py-5">Views</th>
                  <th className="px-8 py-5">Unique Visitors</th>
                  <th className="px-8 py-5">Avg. Duration</th>
                  <th className="px-8 py-5">Score</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border/20">
                {pageStats.length > 0 ? pageStats.map((page) => (
                  <tr key={page.path} className="hover:bg-muted/10 transition-colors">
                    <td className="px-8 py-5">
                      <div className="flex items-center gap-3 font-bold text-sm">
                        <Monitor className="w-4 h-4 text-accent" />
                        {page.path}
                      </div>
                    </td>
                    <td className="px-8 py-5 font-medium">{page.views}</td>
                    <td className="px-8 py-5 text-muted-foreground">{page.uniqueVisitors}</td>
                    <td className="px-8 py-5">
                      <div className="flex items-center gap-2">
                        <Clock className="w-4 h-4 text-fuchsia-500" />
                        {page.avgDuration}s
                      </div>
                    </td>
                    <td className="px-8 py-5">
                      <div className={`text-xs px-2 py-1 rounded-full inline-block font-bold ${
                        page.avgDuration > 60 ? "bg-emerald-500/10 text-emerald-500" : "bg-accent/10 text-accent"
                      }`}>
                        {page.avgDuration > 60 ? "High Engagement" : "Standard"}
                      </div>
                    </td>
                  </tr>
                )) : (
                  <tr>
                    <td colSpan={5} className="px-8 py-20 text-center text-muted-foreground">
                       <Monitor className="w-8 h-8 mx-auto mb-4 opacity-10" />
                       No page visits recorded in this time range.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  );
}
