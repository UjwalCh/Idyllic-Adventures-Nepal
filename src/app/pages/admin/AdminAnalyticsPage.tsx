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
    const now = Date.now();
    const rangeMs = {
      "24h": 24 * 60 * 60 * 1000,
      "7d": 7 * 24 * 60 * 60 * 1000,
      "30d": 30 * 24 * 60 * 60 * 1000,
    }[timeRange];
    
    return events.filter(e => (now - new Date(e.createdAt).getTime()) <= rangeMs);
  }, [events, timeRange]);

  const stats = useMemo(() => {
    if (filteredEvents.length === 0) return { views: 0, visitors: 0, bounce: 0, duration: 0, active: 0 };

    const sessions = new Map();
    filteredEvents.forEach(e => {
      const s = sessions.get(e.sessionId) || { views: 0, start: new Date(e.createdAt).getTime(), end: new Date(e.createdAt).getTime() };
      s.views++;
      s.end = Math.max(s.end, new Date(e.createdAt).getTime());
      sessions.set(e.sessionId, s);
    });

    const totalDuration = Array.from(sessions.values()).reduce((acc, s) => acc + (s.end - s.start), 0) / 1000;
    const bounces = Array.from(sessions.values()).filter((s: any) => s.views === 1).length;
    
    // Real-time Active (5-min window)
    const fiveMinAgo = Date.now() - 5 * 60 * 1000;
    const active = new Set(events.filter(e => new Date(e.createdAt).getTime() > fiveMinAgo).map(e => e.sessionId)).size;

    return {
      views: filteredEvents.length,
      visitors: sessions.size,
      bounce: Math.round((bounces / (sessions.size || 1)) * 100),
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

    // Devices, Browsers & Countries
    const devices: Record<string, number> = {};
    const sources: Record<string, number> = {};
    const countries: Record<string, number> = {};

    filteredEvents.forEach(e => {
      const dev = e.userAgent?.includes("Mobile") ? "Mobile" : "Desktop";
      devices[dev] = (devices[dev] || 0) + 1;
      
      const src = e.referrerSource || "Direct";
      sources[src] = (sources[src] || 0) + 1;

      const country = e.country || "Unknown";
      countries[country] = (countries[country] || 0) + 1;
    });

    return {
      traffic,
      devices: Object.entries(devices).map(([name, value]) => ({ name, value })),
      sources: Object.entries(sources).map(([name, value]) => ({ name, value })),
      countries: Object.entries(countries)
        .map(([name, value]) => {
          const lastEvent = filteredEvents.find(e => (e.country || "Unknown") === name);
          return { 
            name, 
            value, 
            lastVisit: lastEvent ? new Date(lastEvent.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : "N/A"
          };
        })
        .sort((a, b) => b.value - a.value)
        .slice(0, 6)
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

  const seoScore = useMemo(() => {
    // In a real app, this would fetch trek metadata. 
    // Here we simulate a check on the currently tracked pages.
    const uniquePages = new Set(filteredEvents.map(e => e.path));
    const completed = Array.from(uniquePages).filter(p => p.length > 5); // Simple proxy
    const ratio = completed.length / (uniquePages.size || 1);
    
    return {
      grade: ratio > 0.8 ? "A" : ratio > 0.5 ? "B" : "C",
      percent: Math.round(ratio * 100),
      missing: Math.max(0, uniquePages.size - completed.length)
    };
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
    <div className="p-8 max-w-[1600px] mx-auto space-y-8">
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
          <div className="flex items-center gap-2 px-4 py-2 bg-accent/5 border border-accent/10 rounded-2xl text-[10px] font-bold text-accent uppercase tracking-widest">
            <div className="w-2 h-2 rounded-full bg-accent animate-pulse" />
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
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="glass-panel p-8 bg-accent/5 border-accent/20">
            <div className="flex items-center gap-2 text-accent text-[10px] font-bold uppercase tracking-widest mb-4">
              <div className="w-1.5 h-1.5 rounded-full bg-accent animate-ping" />
              Live Now
            </div>
            <div className="text-5xl font-bold mb-2">{stats.active}</div>
            <div className="text-xs text-muted-foreground font-medium">Active sessions on site</div>
          </motion.div>

          {[
            { label: "Unique Visitors", value: stats.visitors, icon: Users, color: "text-emerald-500", bg: "bg-emerald-500/10" },
            { label: "Page Views", value: stats.views, icon: Eye, color: "text-blue-500", bg: "bg-blue-500/10" },
            { label: "Avg. Duration", value: `${stats.duration}s`, icon: Clock, color: "text-amber-500", bg: "bg-amber-500/10" },
            { label: "Bounce Rate", value: `${stats.bounce}%`, icon: TrendingUp, color: "text-rose-500", bg: "bg-rose-500/10" },
          ].map((item, idx) => (
            <motion.div 
              key={item.label}
              initial={{ opacity: 0, y: 20 }} 
              animate={{ opacity: 1, y: 0 }} 
              transition={{ delay: 0.1 * (idx + 1) }}
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
                  <XAxis 
                    dataKey="date" 
                    axisLine={false} 
                    tickLine={false} 
                    tick={{ fontSize: 10, fill: "#888", fontWeight: 600 }} 
                    dy={15}
                  />
                  <YAxis 
                    axisLine={false} 
                    tickLine={false} 
                    tick={{ fontSize: 10, fill: "#888", fontWeight: 600 }} 
                  />
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
                  <Area 
                    type="linear" 
                    dataKey="views" 
                    stroke="#f43f5e" 
                    strokeWidth={4} 
                    fill="url(#viewsGrad)" 
                    activeDot={{ r: 8, strokeWidth: 0, fill: "#f43f5e" }}
                  />
                  <Area 
                    type="linear" 
                    dataKey="visitors" 
                    stroke="#10b981" 
                    strokeWidth={3} 
                    fill="url(#visitorsGrad)" 
                    activeDot={{ r: 6, strokeWidth: 0, fill: "#10b981" }}
                  />
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
              Content Performance
            </h3>
            <div className="space-y-4">
              {topPages.map((page, i) => (
                <div key={page.path} className="flex items-center justify-between p-4 rounded-2xl bg-muted/20 border border-border/50 hover:bg-muted/30 transition-all">
                  <div className="flex items-center gap-4">
                    <div className="w-8 h-8 rounded-xl bg-accent text-white flex items-center justify-center font-bold text-xs">{i + 1}</div>
                    <div>
                      <div className="text-sm font-bold truncate max-w-[150px]">{page.path}</div>
                      <div className="text-[10px] text-muted-foreground font-bold uppercase tracking-widest">{page.unique} visitors</div>
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
                    <div className="flex justify-between items-center text-xs font-bold uppercase tracking-widest">
                      <span className="truncate max-w-[120px]">{c.name}</span>
                      <span className="text-emerald-500">{c.value} visitors</span>
                    </div>
                    <div className="flex justify-between items-center text-[10px] text-muted-foreground font-bold uppercase tracking-tighter">
                      <span>Last seen: {c.lastVisit}</span>
                      <span>{density}% share</span>
                    </div>
                    <div className="h-1.5 bg-muted/30 rounded-full overflow-hidden">
                      <motion.div
                        initial={{ width: 0 }}
                        animate={{ width: `${density}%` }}
                        className="h-full bg-emerald-500"
                      />
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
                Live Pulse
              </h3>
              <div className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest bg-muted/30 px-3 py-1 rounded-full">
                {stats.active} Active
              </div>
            </div>
            <div className="space-y-4">
              {events.slice(0, 6).map((e, i) => (
                <div key={i} className="flex items-center justify-between p-4 rounded-2xl bg-muted/10 border border-border/30 hover:border-accent/30 transition-all group">
                  <div className="flex items-center gap-4">
                    <div className={`w-2.5 h-2.5 rounded-full ${e.eventType === "page_view" ? "bg-blue-500" : "bg-emerald-500"} animate-pulse`} />
                    <div>
                      <div className="text-sm font-bold truncate max-w-[120px] group-hover:text-accent transition-colors">{e.path}</div>
                      <div className="text-[10px] text-muted-foreground uppercase font-bold tracking-widest">
                        {e.country || "Global"} • {new Date(e.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                      </div>
                    </div>
                  </div>
                  <Globe className="w-4 h-4 text-muted-foreground/20 group-hover:text-accent/50 transition-colors" />
                </div>
              ))}
              {events.length === 0 && <div className="text-center py-10 text-muted-foreground italic">Waiting for pulse...</div>}
            </div>
          </motion.div>
        </div>
      </div>
    </div>
  );
}
