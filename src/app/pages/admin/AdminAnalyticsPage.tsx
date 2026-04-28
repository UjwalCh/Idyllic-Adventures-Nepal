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
  Activity,
  LogOut,
  MapPin
} from "lucide-react";
import { Link } from "react-router";
import { useWebsiteAnalytics } from "../../data/useRealtimeData";
import { isSupabaseConfigured } from "../../data/supabaseData";
import { 
  Area, 
  AreaChart, 
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

  // Automatic Data Refresh
  useEffect(() => {
    const poll = setInterval(() => {
      void refresh().then(() => setLastSync(new Date()));
    }, 15000);
    return () => clearInterval(poll);
  }, [refresh]);

  // Data Filtering & Logic
  const filteredEvents = useMemo(() => {
    if (events.length === 0) return [];
    
    // Use the absolute newest event as 'now' to fix timezone sync issues
    const masterNow = new Date(events[0].createdAt).getTime();
    
    const rangeMs = {
      "24h": 24 * 60 * 60 * 1000,
      "7d": 7 * 24 * 60 * 60 * 1000,
      "30d": 30 * 24 * 60 * 60 * 1000,
    }[timeRange];
    
    return events.filter(e => {
      const age = masterNow - new Date(e.createdAt).getTime();
      const isInRange = age <= rangeMs;
      const isNotAdmin = !e.path.startsWith("/managepage");
      return isInRange && isNotAdmin;
    });
  }, [events, timeRange]);

  const stats = useMemo(() => {
    if (filteredEvents.length === 0) return { views: 0, visitors: 0, bounce: 0, duration: 0, active: 0 };

    const sessions = new Map();
    filteredEvents.forEach(e => {
      const s = sessions.get(e.sessionId) || { 
        views: 0, 
        heartbeats: 0, 
        recordedDuration: 0,
        start: new Date(e.createdAt).getTime(), 
        end: new Date(e.createdAt).getTime() 
      };
      
      if (e.eventType === "page_view") s.views++;
      if (e.eventType === "stay") {
        s.heartbeats++;
        s.recordedDuration += (e.duration || 10);
      }
      
      s.end = Math.max(s.end, new Date(e.createdAt).getTime());
      sessions.set(e.sessionId, s);
    });

    // Calculate total duration using heartbeats + baseline
    const totalDuration = Array.from(sessions.values()).reduce((acc, s: any) => {
      // Use recorded duration if we have heartbeats, otherwise use time diff (capped at 5 mins)
      const calculated = s.recordedDuration > 0 
        ? s.recordedDuration 
        : Math.min((s.end - s.start) / 1000, 300);
      
      return acc + (calculated > 0 ? calculated : 10); // 10s baseline
    }, 0);

    const returning = Array.from(sessions.values()).filter((s: any) => s.views > 1 || s.heartbeats > 5).length;
    
    // Real-time Active: 4-min window using both DB time AND client Date.now()
    // The wider window (4min) prevents devices with slightly out-of-sync clocks from being missed
    const masterNow = events.length > 0 ? new Date(events[0].createdAt).getTime() : Date.now();
    const clientNow = Date.now();
    const activeWindow = 4 * 60 * 1000;
    const active = new Set(
      events
        .filter(e => {
          const ts = new Date(e.createdAt).getTime();
          const ageFromDb = masterNow - ts;
          const ageFromClient = clientNow - ts;
          // Accept if recent relative to EITHER the DB anchor OR the local clock
          const isRecent = (ageFromDb >= 0 && ageFromDb < activeWindow) || (ageFromClient >= 0 && ageFromClient < activeWindow);
          const isNotAdmin = !e.path.startsWith("/managepage");
          return isRecent && isNotAdmin;
        })
        .map(e => e.sessionId)
    ).size;

    return {
      views: filteredEvents.filter(e => e.eventType === "page_view").length,
      visitors: sessions.size,
      bounce: Math.round((Array.from(sessions.values()).filter((s: any) => s.views <= 1 && s.heartbeats < 2).length / (sessions.size || 1)) * 100),
      loyalty: Math.round((returning / (sessions.size || 1)) * 100),
      duration: Math.round(totalDuration / (sessions.size || 1)),
      active
    };
  }, [filteredEvents, events]);

  const charts = useMemo(() => {
    // Traffic History
    const history: Record<string, any> = {};
    filteredEvents.forEach(e => {
      const date = new Date(e.createdAt).toLocaleDateString();
      if (!history[date]) history[date] = { date, views: 0, visitors: new Set() };
      history[date].views++;
      history[date].visitors.add(e.sessionId);
    });

    const traffic = Object.values(history).map(h => ({
      date: h.date,
      views: h.views,
      visitors: h.visitors.size
    })).reverse();

    // Devices, Sources & Geography
    const devices: Record<string, number> = {};
    const sources: Record<string, number> = {};
    // Key = "City, Country" for specificity
    const regions: Record<string, any> = {};

    filteredEvents.forEach(e => {
      // --- TV / Smart TV Detection ---
      const ua = e.userAgent?.toLowerCase() || "";
      let dev = "Desktop";
      if (
        ua.includes("smarttv") || ua.includes("smart-tv") ||
        ua.includes("webos") || ua.includes("tizen") ||
        ua.includes("netcast") || ua.includes("viera") ||
        ua.includes("hbbtv") || ua.includes("appletv") ||
        ua.includes("googletv") || ua.includes("androidtv") ||
        ua.includes("crkey") || // Chromecast
        (ua.includes("tv") && (ua.includes("samsung") || ua.includes("lg") || ua.includes("sony") || ua.includes("philips")))
      ) {
        dev = "Smart TV";
      } else if (ua.includes("tablet") || ua.includes("ipad")) {
        dev = "Tablet";
      } else if (ua.includes("mobile") || ua.includes("android") && !ua.includes("tablet")) {
        dev = "Mobile";
      }
      devices[dev] = (devices[dev] || 0) + 1;
      
      const src = e.referrerSource || "Direct";
      sources[src] = (sources[src] || 0) + 1;

      // Use City + Country for specific regional data
      const city = (e as any).city;
      const country = e.country || "Unknown";
      const regionKey = city && city !== "Unknown" ? `${city}, ${country}` : country;
      const tz = e.locationLabel || "UTC";
      if (!regions[regionKey]) regions[regionKey] = { name: regionKey, country, count: 0, lastVisit: e.createdAt, timezone: tz };
      regions[regionKey].count++;
      if (new Date(e.createdAt) > new Date(regions[regionKey].lastVisit)) {
        regions[regionKey].lastVisit = e.createdAt;
        regions[regionKey].timezone = tz;
      }
    });

    const getRelativeTime = (dateStr: string) => {
      const diff = Date.now() - new Date(dateStr).getTime();
      const mins = Math.floor(diff / 60000);
      if (mins < 1) return "Just now";
      if (mins < 60) return `${mins}m ago`;
      const hours = Math.floor(mins / 60);
      if (hours < 24) return `${hours}h ago`;
      return `${Math.floor(hours / 24)}d ago`;
    };

    // Format time in a given timezone (with Nepal special case)
    const formatInTimezone = (dateStr: string, timezone: string, country?: string) => {
      try {
        if (country === "Nepal" || timezone === "Asia/Kathmandu") {
          const date = new Date(dateStr);
          const npt = new Date(date.getTime() + (5.75 * 60 * 60 * 1000));
          const h = npt.getUTCHours();
          const m = npt.getUTCMinutes().toString().padStart(2, "0");
          return `${h % 12 || 12}:${m} ${h >= 12 ? "PM" : "AM"}`;
        }
        return new Intl.DateTimeFormat("en-US", {
          timeStyle: "short",
          timeZone: timezone.includes("/") ? timezone : "UTC"
        }).format(new Date(dateStr));
      } catch {
        return new Date(dateStr).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
      }
    };

    // Always format AUS time as Sydney (AEST/AEDT)
    const formatAusTime = (dateStr: string) => {
      try {
        return new Intl.DateTimeFormat("en-AU", {
          timeStyle: "short",
          timeZone: "Australia/Sydney"
        }).format(new Date(dateStr));
      } catch {
        return "—";
      }
    };

    return {
      traffic,
      devices: Object.entries(devices).map(([name, value]) => ({ name, value })),
      sources: Object.entries(sources).map(([name, value]) => ({ name, value })),
      countries: Object.values(regions)
        .map((c: any) => ({
          name: c.name,
          country: c.country,
          value: c.count,
          relativeTime: getRelativeTime(c.lastVisit),
          localTime: formatInTimezone(c.lastVisit, c.timezone, c.country),
          ausTime: formatAusTime(c.lastVisit),
        }))
        .sort((a, b) => b.value - a.value)
        .slice(0, 8)
    };
  }, [filteredEvents]);

  const topPages = useMemo(() => {
    const pages: Record<string, any> = {};
    filteredEvents.forEach(e => {
      const path = e.path || "/";
      if (!pages[path]) pages[path] = { path, views: 0, visitors: new Set() };
      pages[path].views++;
      pages[path].visitors.add(e.sessionId);
    });
    return Object.values(pages)
      .map(p => ({ ...p, unique: p.visitors.size }))
      .sort((a, b) => b.views - a.views)
      .slice(0, 5);
  }, [filteredEvents]);

  const exportPDF = async () => {
    if (!reportRef.current) return;
    const toastId = toast.loading("Generating Premium Report...");
    try {
      const canvas = await html2canvas(reportRef.current, { scale: 2, backgroundColor: "#000" });
      const img = canvas.toDataURL("image/jpeg", 1.0);
      const pdf = new jsPDF("p", "mm", "a4");
      const width = pdf.internal.pageSize.getWidth();
      const height = (canvas.height * width) / canvas.width;
      pdf.addImage(img, "JPEG", 0, 0, width, height);
      pdf.save(`Analytics-${timeRange}-${Date.now()}.pdf`);
      toast.success("Report Saved", { id: toastId });
    } catch (e) {
      toast.error("Export Failed", { id: toastId });
    }
  };

  if (loading && events.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[600px] gap-6">
        <div className="w-16 h-16 border-4 border-accent/20 border-t-accent rounded-full animate-spin" />
        <p className="text-muted-foreground font-medium animate-pulse">Synchronizing Live Intelligence...</p>
      </div>
    );
  }

  return (
    <div className="p-4 md:p-8 max-w-[1600px] mx-auto space-y-6 md:space-y-8" ref={reportRef}>
      {/* Premium Header */}
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-6">
        <div>
          <div className="flex items-center gap-2 text-muted-foreground text-xs font-bold uppercase tracking-widest mb-2">
            <Activity className="w-3 h-3" />
            Live Intelligence Hub
          </div>
          <h1 className="text-4xl font-heading text-primary">Analytics Command Center</h1>
          <p className="text-muted-foreground mt-1">Real-time visitor behavior and conversion intelligence.</p>
        </div>

        <div className="flex flex-wrap items-center gap-4">
          <div 
            onClick={() => !isSupabaseConfigured && toast.error("Supabase Keys Missing! Please add VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY to your Vercel/Netlify settings.")}
            className={`flex items-center gap-2 px-4 py-2 border rounded-2xl text-[10px] font-bold uppercase tracking-widest transition-all cursor-help ${isSupabaseConfigured ? "bg-emerald-500/5 border-emerald-500/10 text-emerald-500" : "bg-rose-500/5 border-rose-500/10 text-rose-500 animate-pulse"}`}
          >
            <div className={`w-2 h-2 rounded-full ${isSupabaseConfigured ? "bg-emerald-500" : "bg-rose-500"} ${stats.active > 0 ? "animate-pulse" : ""}`} />
            {isSupabaseConfigured ? "Intelligence Engine Online" : "Configuration Error (Click for Details)"}
          </div>
          
          <div className="flex items-center gap-2 px-4 py-2 bg-accent/5 border border-accent/10 rounded-2xl text-[10px] font-bold text-accent uppercase tracking-widest">
            <Clock className="w-3 h-3" />
            Last Sync: {lastSync.toLocaleTimeString()}
          </div>
          
          <div className="flex bg-muted/50 p-1 rounded-2xl border border-border/50">
            {(["24h", "7d", "30d"] as const).map(range => (
              <button
                key={range}
                onClick={() => setTimeRange(range)}
                className={`px-5 py-2 rounded-xl text-xs font-bold transition-all ${
                  timeRange === range ? "bg-background shadow-lg text-accent" : "text-muted-foreground hover:text-foreground"
                }`}
              >
                {range.toUpperCase()}
              </button>
            ))}
          </div>

          <button
            onClick={exportPDF}
            className="flex items-center gap-2 px-6 py-3 bg-accent text-white rounded-2xl font-bold hover:scale-105 transition-all shadow-xl shadow-accent/20"
          >
            <Download className="w-4 h-4" />
            Export Data
          </button>
        </div>
      </div>

      <div ref={reportRef} className="space-y-8">
        {/* Elite Pulse Metrics */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-6">
          <motion.div 
            key={"live-status-" + stats.active}
            initial={{ opacity: 0, y: 20 }} 
            animate={{ 
              opacity: 1, 
              y: 0,
              scale: [1, 1.02, 1],
            }} 
            transition={{ 
              scale: { duration: 0.3, times: [0, 0.5, 1] }
            }}
            className={`glass-panel p-8 border-2 transition-colors ${stats.active > 0 ? "bg-emerald-500/5 border-emerald-500/20" : "bg-accent/5 border-accent/20"}`}
          >
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-2 text-accent text-[10px] font-bold uppercase tracking-widest">
                <div className={`w-1.5 h-1.5 rounded-full animate-ping ${stats.active > 0 ? "bg-emerald-500" : "bg-accent"}`} />
                Live Status
              </div>
              {stats.active > 0 && <span className="text-[10px] bg-emerald-500 text-white px-2 py-0.5 rounded-full font-bold">ONLINE</span>}
            </div>
            <div className="text-5xl font-bold mb-2">{stats.active}</div>
            <div className="text-xs text-muted-foreground font-medium">Active sessions on site</div>
          </motion.div>

          {[
            { label: "Unique Visitors", value: stats.visitors, icon: Users, color: "text-emerald-500", bg: "bg-emerald-500/10" },
            { label: "Page Views", value: stats.views, icon: Eye, color: "text-blue-500", bg: "bg-blue-500/10" },
            { label: "Avg. Duration", value: `${stats.duration}s`, icon: Clock, color: "text-amber-500", bg: "bg-amber-500/10" },
            { label: "Loyalty Rate", value: `${stats.loyalty}%`, icon: TrendingUp, color: "text-rose-500", bg: "bg-rose-500/10" },
          ].map((item, idx) => (
            <motion.div 
              initial={{ opacity: 0, y: 20 }} 
              animate={{ 
                opacity: 1, 
                y: 0,
                scale: [1, 1.02, 1],
              }} 
              transition={{ 
                opacity: { delay: 0.1 * (idx + 1) },
                y: { delay: 0.1 * (idx + 1) },
                scale: { duration: 0.3, times: [0, 0.5, 1] }
              }}
              key={item.label + item.value} // Key change triggers re-animation
              className="glass-panel p-8"
            >
              <div className={`w-10 h-10 rounded-xl ${item.bg} flex items-center justify-center mb-6`}>
                <item.icon className={`w-5 h-5 ${item.color}`} />
              </div>
              <div className="text-3xl font-bold mb-1">{item.value}</div>
              <div className="text-xs text-muted-foreground font-bold uppercase tracking-widest">{item.label}</div>
            </motion.div>
          ))}
        </div>

        {/* Main Horizon Chart */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          <motion.div 
            initial={{ opacity: 0, scale: 0.95 }} 
            animate={{ opacity: 1, scale: 1 }}
            className="lg:col-span-2 glass-panel p-8"
          >
            <div className="flex items-center justify-between mb-10">
              <div>
                <h3 className="text-xl font-heading text-accent">Traffic Precision Horizon</h3>
                <p className="text-xs text-muted-foreground mt-1">Geometric growth analysis (Linear Mode)</p>
              </div>
              <div className="flex gap-4 text-[10px] font-bold uppercase tracking-widest">
                <div className="flex items-center gap-2"><div className="w-2 h-2 rounded-full bg-accent" /> Views</div>
                <div className="flex items-center gap-2"><div className="w-2 h-2 rounded-full bg-emerald-500" /> Visitors</div>
              </div>
            </div>
            <div className="h-[400px]">
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={charts.traffic} margin={{ top: 20, right: 30, left: 0, bottom: 0 }}>
                  <defs>
                    <linearGradient id="viewsGrad" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#f43f5e" stopOpacity={0.3}/>
                      <stop offset="95%" stopColor="#f43f5e" stopOpacity={0}/>
                    </linearGradient>
                    <linearGradient id="visitorsGrad" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#10b981" stopOpacity={0.1}/>
                      <stop offset="95%" stopColor="#10b981" stopOpacity={0}/>
                    </linearGradient>
                  </defs>
                  <CartesianGrid vertical={false} strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" />
                  <XAxis dataKey="date" axisLine={false} tickLine={false} tick={{ fontSize: 10, fill: "#888", fontWeight: 600 }} dy={15} />
                  <YAxis axisLine={false} tickLine={false} tick={{ fontSize: 10, fill: "#888", fontWeight: 600 }} />
                  <Tooltip 
                    content={({ active, payload, label }) => {
                      if (active && payload && payload.length) {
                        return (
                          <div className="glass-panel p-4 shadow-2xl border-white/10 backdrop-blur-xl">
                            <p className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest mb-2">{label}</p>
                            <div className="space-y-1">
                              <p className="text-sm font-bold text-rose-500 flex items-center gap-2">
                                <div className="w-1.5 h-1.5 rounded-full bg-rose-500" />
                                {payload[0].value} Views
                              </p>
                              <p className="text-sm font-bold text-emerald-500 flex items-center gap-2">
                                <div className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
                                {payload[1].value} Visitors
                              </p>
                            </div>
                          </div>
                        );
                      }
                      return null;
                    }}
                  />
                  <Area type="linear" dataKey="views" stroke="#f43f5e" strokeWidth={4} fill="url(#viewsGrad)" activeDot={{ r: 8, strokeWidth: 0, fill: "#f43f5e" }} />
                  <Area type="linear" dataKey="visitors" stroke="#10b981" strokeWidth={3} fill="url(#visitorsGrad)" activeDot={{ r: 6, strokeWidth: 0, fill: "#10b981" }} />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          </motion.div>

          <div className="space-y-8">
            <motion.div initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} className="glass-panel p-8">
              <h3 className="text-lg font-heading mb-6 flex items-center gap-2">
                <Monitor className="w-4 h-4 text-blue-500" />
                Device Mix
              </h3>
              <div className="h-[200px]">
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie data={charts.devices} innerRadius={60} outerRadius={80} dataKey="value">
                      {charts.devices.map((_, i) => <Cell key={i} fill={i === 0 ? "#3b82f6" : "#f43f5e"} />)}
                    </Pie>
                    <Tooltip />
                  </PieChart>
                </ResponsiveContainer>
              </div>
              <div className="flex justify-center gap-8 mt-4">
                {charts.devices.map((d, i) => (
                  <div key={d.name} className="text-center">
                    <div className={`text-xl font-bold ${i === 0 ? "text-blue-500" : "text-rose-500"}`}>{d.value}</div>
                    <div className="text-[10px] font-bold uppercase text-muted-foreground">{d.name}</div>
                  </div>
                ))}
              </div>
            </motion.div>

            <motion.div initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: 0.2 }} className="glass-panel p-8">
              <h3 className="text-lg font-heading mb-6 flex items-center gap-2">
                <Share2 className="text-emerald-500 w-4 h-4" />
                Top Sources
              </h3>
              <div className="space-y-4">
                {charts.sources.slice(0, 3).map(s => (
                  <div key={s.name} className="space-y-1">
                    <div className="flex justify-between text-xs font-bold">
                      <span>{s.name}</span>
                      <span className="text-accent">{s.value}</span>
                    </div>
                    <div className="h-1.5 bg-muted/30 rounded-full overflow-hidden">
                      <div className="h-full bg-accent" style={{ width: `${(s.value / stats.views) * 100}%` }} />
                    </div>
                  </div>
                ))}
              </div>
            </motion.div>
          </div>
        </div>

        {/* Intelligence Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="glass-panel p-8">
            <h3 className="text-xl font-heading mb-8 flex items-center gap-3">
              <Eye className="w-5 h-5 text-accent" />
              Content Preference
            </h3>
            <div className="space-y-4">
              {topPages.map((page, i) => (
                <div key={page.path} className="flex items-center justify-between p-4 rounded-2xl bg-muted/20 border border-border/50 hover:bg-muted/30 transition-all">
                  <div className="flex items-center gap-4">
                    <div className="w-8 h-8 rounded-xl bg-accent text-white flex items-center justify-center font-bold text-xs">{i + 1}</div>
                    <div>
                      <div className="text-sm font-bold truncate max-w-[150px]">{page.path}</div>
                      <div className="text-[10px] text-muted-foreground font-bold uppercase tracking-widest">{page.unique} readers</div>
                    </div>
                  </div>
                  <div className="text-xl font-bold">{page.views} <span className="text-[10px] text-muted-foreground uppercase">views</span></div>
                </div>
              ))}
            </div>
          </motion.div>

          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }} className="glass-panel p-8">
            <h3 className="text-xl font-heading mb-8 flex items-center gap-3">
              <Globe className="w-5 h-5 text-emerald-500" />
              Regional Pulse
            </h3>
            <div className="space-y-5">
              {charts.countries.map((c) => {
                const density = Math.round((c.value / (stats.views || 1)) * 100);
                return (
                  <div key={c.name} className="space-y-2">
                    <div className="flex justify-between items-start gap-2 text-xs font-bold uppercase tracking-widest">
                      <span>{c.name}</span>
                      <span className="text-emerald-400">{c.value} visitors</span>
                    </div>
                    <div className="flex flex-wrap justify-between items-center gap-1 text-[10px] text-muted-foreground font-bold uppercase tracking-tighter">
                      <div className="flex items-center gap-1.5">
                        <div className="w-1.5 h-1.5 rounded-full bg-emerald-500/50" />
                        <span>{c.relativeTime}</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <span className="text-blue-400">{c.localTime} (Local)</span>
                        <span className="opacity-40">|</span>
                        <span className="text-amber-400">{c.ausTime} (AUS)</span>
                      </div>
                    </div>
                    <div className="h-1 bg-muted/30 rounded-full overflow-hidden">
                      <motion.div initial={{ width: 0 }} animate={{ width: `${density}%` }} className="h-full bg-emerald-500" />
                    </div>
                  </div>
                );
              })}
              {charts.countries.length === 0 && <div className="text-center py-10 text-muted-foreground italic">Gathering regional data...</div>}
            </div>
          </motion.div>

          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }} className="glass-panel p-8">
            <div className="flex items-center justify-between mb-8">
              <h3 className="text-xl font-heading flex items-center gap-3">
                <Activity className="w-5 h-5 text-rose-500" />
                Public Pulse
              </h3>
              <div className={`text-[10px] font-bold uppercase tracking-widest px-3 py-1 rounded-full ${stats.active > 0 ? "bg-emerald-500/20 text-emerald-500" : "bg-muted/30 text-muted-foreground"}`}>
                {stats.active > 0 ? "Live Tracking" : "Standby"}
              </div>
            </div>
            <div className="space-y-4">
              {filteredEvents
                // Only show real navigation events — no background heartbeat spam
                .filter(e => e.eventType === "page_view" || e.eventType === "cta_click")
                // Deduplicate: skip if same session visited same page as the previous entry
                .filter((e, idx, arr) => {
                  if (idx === 0) return true;
                  const prev = arr[idx - 1];
                  return !(prev.sessionId === e.sessionId && prev.path === e.path);
                })
                .slice(0, 8)
                .map((e, i) => (
                <div key={i} className="flex items-center justify-between p-4 rounded-2xl bg-muted/10 border border-border/30 hover:border-accent/30 transition-all group">
                  <div className="flex items-center gap-4">
                    <div className={`w-2.5 h-2.5 rounded-full ${e.eventType === "page_view" ? "bg-blue-500" : "bg-amber-400"} animate-pulse`} />
                    <div>
                      <div className="text-sm font-bold truncate max-w-[140px] group-hover:text-accent transition-colors">{e.path}</div>
                      <div className="text-[10px] text-muted-foreground uppercase font-bold tracking-widest">
                        {(e as any).city && (e as any).city !== "Unknown" ? `${(e as any).city}, ` : ""}{e.country || "Global"} • {new Date(e.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                      </div>
                    </div>
                  </div>
                  <div className="text-[9px] uppercase font-bold tracking-widest text-muted-foreground/40 group-hover:text-accent/50 transition-colors">
                    {e.eventType === "cta_click" ? "CTA" : "View"}
                  </div>
                </div>
              ))}
              {filteredEvents.filter(e => e.eventType === "page_view" || e.eventType === "cta_click").length === 0 && <div className="text-center py-10 text-muted-foreground italic">Waiting for public traffic...</div>}
            </div>
          </motion.div>
        </div>

        {/* System Intelligence Logs (Diagnostics) */}
        {events.some(e => e.eventType === "debug_error") && (
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="glass-panel p-8 bg-rose-500/5 border-rose-500/20 mt-8">
            <h3 className="text-xl font-heading mb-6 flex items-center gap-3 text-rose-500">
              <Activity className="w-5 h-5" />
              System Intelligence Logs
            </h3>
            <div className="space-y-3">
              {events.filter(e => e.eventType === "debug_error").slice(0, 3).map((e, i) => (
                <div key={i} className="flex items-center justify-between p-4 rounded-2xl bg-rose-500/10 border border-rose-500/20">
                  <div className="flex items-center gap-4">
                    <div className="w-2 h-2 rounded-full bg-rose-500 animate-pulse" />
                    <div className="text-sm font-mono text-rose-200">{e.locationLabel || "Unknown Tracking Error"}</div>
                  </div>
                  <div className="text-[10px] font-bold text-rose-500/50 uppercase tracking-widest">
                    {new Date(e.createdAt).toLocaleTimeString()}
                  </div>
                </div>
              ))}
            </div>
          </motion.div>
        )}
      </div>
    </div>
  );
}
