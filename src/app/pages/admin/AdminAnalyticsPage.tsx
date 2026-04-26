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
  TrendingUp
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
import { useState, useMemo, useRef } from "react";
import { toast } from "sonner";
import jsPDF from "jspdf";
import html2canvas from "html2canvas";

export function AdminAnalyticsPage() {
  const { events, loading } = useWebsiteAnalytics(168); // Last 7 days
  const [timeRange, setTimeRange] = useState<"24h" | "7d" | "30d">("7d");
  const reportRef = useRef<HTMLDivElement>(null);

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

  // Real-time (Active in last 5 mins)
  const activeVisitors = useMemo(() => {
    const fiveMinsAgo = new Date(Date.now() - 5 * 60 * 1000).getTime();
    const recentEvents = events.filter(e => new Date(e.createdAt).getTime() >= fiveMinsAgo);
    return new Set(recentEvents.map(e => e.sessionId)).size;
  }, [events]);

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
      const dateKey = dateObj.toISOString().split('T')[0]; // YYYY-MM-DD for sorting
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

  const exportPDF = async () => {
    if (!reportRef.current) return;
    const loadingToast = toast.loading("Generating High-Fidelity Report...");
    
    try {
      // Ensure we are at the top for capture
      window.scrollTo(0, 0);
      
      const canvas = await html2canvas(reportRef.current, {
        scale: 2,
        useCORS: true,
        allowTaint: true,
        logging: false,
        backgroundColor: "#ffffff",
        windowWidth: reportRef.current.scrollWidth,
        windowHeight: reportRef.current.scrollHeight
      });
      
      const imgData = canvas.toDataURL("image/png");
      const pdf = new jsPDF({
        orientation: "p",
        unit: "mm",
        format: "a4",
        compress: true
      });

      const pdfWidth = pdf.internal.pageSize.getWidth();
      const pdfHeight = (canvas.height * pdfWidth) / canvas.width;
      
      pdf.addImage(imgData, "PNG", 0, 0, pdfWidth, pdfHeight, undefined, 'FAST');
      pdf.save(`Idyllic-Nepal-Analytics-${new Date().toISOString().split('T')[0]}.pdf`);
      toast.success("Professional Report Generated", { id: loadingToast });
    } catch (error) {
      console.error("PDF Export Error:", error);
      toast.error("Export failed. Please try again or check browser permissions.", { id: loadingToast });
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
          <p className="text-muted-foreground">Deep insights into visitor behavior and traffic sources.</p>
        </div>
        
        <div className="flex flex-wrap items-center gap-4">
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
              Real-time Active
            </div>
            <div className="text-5xl font-bold mb-2">{activeVisitors}</div>
            <div className="text-sm text-muted-foreground">Active sessions in last 5 min</div>
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
            <div className="w-10 h-10 rounded-xl bg-fuchsia-500/10 flex items-center justify-center mb-4">
              <Clock className="w-5 h-5 text-fuchsia-500" />
            </div>
            <div className="text-4xl font-bold mb-1">
              {Math.round(filteredEvents.reduce((acc, e) => acc + (e.duration || 0), 0) / (new Set(filteredEvents.map(e => e.sessionId)).size || 1))}s
            </div>
            <div className="text-sm text-muted-foreground">Avg. Session Duration</div>
          </motion.div>
        </div>

        {/* Charts Section */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          <div className="lg:col-span-2 glass-panel p-8">
            <div className="flex items-center justify-between mb-8">
              <h3 className="font-heading text-2xl">Growth & Engagement</h3>
              <div className="flex gap-4 text-xs font-bold uppercase tracking-widest">
                <div className="flex items-center gap-2"><div className="w-2 h-2 rounded-full bg-accent" /> Views</div>
                <div className="flex items-center gap-2"><div className="w-2 h-2 rounded-full bg-emerald-500" /> Visitors</div>
              </div>
            </div>
            <div className="h-[400px]">
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={growthData}>
                  <defs>
                    <linearGradient id="colorViews" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#f43f5e" stopOpacity={0.1}/>
                      <stop offset="95%" stopColor="#f43f5e" stopOpacity={0}/>
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#888" opacity={0.1} />
                  <XAxis dataKey="date" axisLine={false} tickLine={false} tick={{ fontSize: 12, fill: "#888" }} />
                  <YAxis axisLine={false} tickLine={false} tick={{ fontSize: 12, fill: "#888" }} />
                  <Tooltip 
                    contentStyle={{ borderRadius: "12px", border: "none", boxShadow: "0 10px 30px rgba(0,0,0,0.1)" }}
                  />
                  <Area type="monotone" dataKey="views" stroke="#f43f5e" strokeWidth={3} fillOpacity={1} fill="url(#colorViews)" />
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

          <div className="glass-panel p-8 relative overflow-hidden">
            <h3 className="font-heading text-2xl mb-8">Traffic Sources</h3>
            <div className="h-[300px]">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={sourceData.length > 0 ? sourceData : [{ name: "No Data", value: 1 }]}
                    innerRadius={80}
                    outerRadius={110}
                    paddingAngle={5}
                    dataKey="value"
                  >
                    {sourceData.length > 0 ? sourceData.map((_, index) => (
                      <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                    )) : <Cell fill="#f1f5f9" />}
                  </Pie>
                  <Tooltip 
                    contentStyle={{ borderRadius: "12px", border: "none", boxShadow: "0 10px 30px rgba(0,0,0,0.1)" }}
                  />
                  <Legend verticalAlign="bottom" height={36}/>
                </PieChart>
              </ResponsiveContainer>
              {sourceData.length === 0 && (
                <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none">
                   <Globe className="w-8 h-8 text-muted-foreground/10 mb-2" />
                </div>
              )}
            </div>
            <div className="mt-8 space-y-4">
              {sourceData.length > 0 ? sourceData.map((s, i) => (
                <div key={s.name} className="flex items-center justify-between p-3 rounded-xl bg-muted/20">
                  <div className="flex items-center gap-3">
                    <div className="w-3 h-3 rounded-full" style={{ backgroundColor: COLORS[i % COLORS.length] }} />
                    <span className="text-sm font-bold">{s.name}</span>
                  </div>
                  <span className="text-sm font-medium">{Math.round((s.value / (filteredEvents.length || 1)) * 100)}%</span>
                </div>
              )) : (
                <div className="text-center py-4 text-xs text-muted-foreground italic">
                  Traffic categorizing will appear here.
                </div>
              )}
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
