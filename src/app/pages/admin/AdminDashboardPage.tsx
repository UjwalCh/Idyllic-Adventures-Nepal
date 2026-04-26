import { motion } from "motion/react";
import { Mountain, Image, Bell, Users, TrendingUp, Sparkles, ShieldCheck, ArrowRight, Settings, BookOpen, Camera, MousePointer2, Search, Globe, Link as LinkIcon, Share2 } from "lucide-react";
import { Link } from "react-router";
import { useInquiries, useNotices, useTreks, useWebsiteAnalytics, useJournal, useGallery } from "../../data/useRealtimeData";
import { isSupabaseConfigured, checkAndSetupStorage } from "../../data/supabaseData";
import { useEffect, useState } from "react";
import { ChartContainer, ChartTooltip, ChartTooltipContent } from "../../components/ui/chart";
import { Bar, BarChart, CartesianGrid, Cell, Pie, PieChart, XAxis, YAxis, Area, AreaChart, ResponsiveContainer } from "recharts";

export function AdminDashboardPage() {
  const { treks } = useTreks();
  const { notices } = useNotices();
  const { inquiries } = useInquiries();
  const { entries } = useJournal(false);
  const { images } = useGallery();
  const { events } = useWebsiteAnalytics(24);


  const recentTreks = treks.slice(0, 5);
  const recentInquiries = inquiries.slice(0, 6);
  const featuredTreks = treks.filter((t) => t.featured).length;
  const bookingLeads = inquiries.filter((item) => item.inquiryType === "booking").length;
  const openLeads = inquiries.filter((item) => item.status !== "closed").length;
  
  const pageViews = events.filter((event) => event.eventType === "page_view");
  const activeSessions = new Set(pageViews.map((event) => event.sessionId)).size;
  
  // Calculate Conversion Rate
  const conversionRate = activeSessions > 0 ? ((inquiries.length / activeSessions) * 100).toFixed(1) : "0";

  // Device Breakdown
  const deviceStats = pageViews.reduce((acc, event) => {
    const ua = event.userAgent?.toLowerCase() || "";
    let device = "Desktop";
    if (ua.includes("mobi")) device = "Mobile";
    if (ua.includes("tablet") || ua.includes("ipad")) device = "Tablet";
    acc[device] = (acc[device] || 0) + 1;
    return acc;
  }, {} as Record<string, number>);

  const deviceData = Object.entries(deviceStats).map(([name, value]) => ({ name, value }));

  // Top Pages
  const pageStats = pageViews.reduce((acc, event) => {
    const path = event.path || "/";
    acc[path] = (acc[path] || 0) + 1;
    return acc;
  }, {} as Record<string, number>);

  const topPages = Object.entries(pageStats)
    .map(([path, views]) => ({ path, views }))
    .sort((a, b) => b.views - a.views)
    .slice(0, 5);

  const getVisitorLocationLabel = (event: (typeof pageViews)[number]) => {
    const fallbackLabel = [event.city, event.region, event.country].filter(Boolean).join(", ");
    return event.locationLabel ?? (fallbackLabel || "Unknown");
  };

  const getCountryLabel = (event: (typeof pageViews)[number]) => {
    if (event.country) return event.country;
    const locationParts = event.locationLabel?.split(",").map((part) => part.trim()).filter(Boolean) ?? [];
    return locationParts[locationParts.length - 1] ?? "Unknown";
  };

  const countryTotals = pageViews.reduce<Record<string, number>>((acc, event) => {
    const country = getCountryLabel(event);
    acc[country] = (acc[country] ?? 0) + 1;
    return acc;
  }, {});

  const countryRows = Object.entries(countryTotals)
    .map(([country, visits]) => ({ country, visits }))
    .sort((a, b) => b.visits - a.visits)
    .slice(0, 5);

  // Traffic Sources Breakdown
  const sourceStats = pageViews.reduce((acc, event) => {
    const src = event.referrerSource || "Direct";
    acc[src] = (acc[src] || 0) + 1;
    return acc;
  }, {} as Record<string, number>);

  const sourceData = Object.entries(sourceStats).map(([name, value]) => ({ name, value }));

  const hourlyViewData = Array.from({ length: 12 }, (_, index) => {
    const slotStart = new Date();
    slotStart.setMinutes(0, 0, 0);
    slotStart.setHours(slotStart.getHours() - (11 - index));
    const slotEnd = new Date(slotStart.getTime() + 60 * 60 * 1000);

    const count = pageViews.filter((event) => {
      const timestamp = new Date(event.createdAt).getTime();
      return timestamp >= slotStart.getTime() && timestamp < slotEnd.getTime();
    }).length;

    return {
      hour: slotStart.toLocaleTimeString([], { hour: "numeric" }),
      views: count,
    };
  });

  const stats = [
    { label: "Active Treks", value: treks.length, icon: Mountain, color: "text-accent", bgColor: "bg-accent/10" },
    { label: "Journal Entries", value: entries.length, icon: BookOpen, color: "text-secondary", bgColor: "bg-secondary/10" },
    { label: "Gallery Photos", value: images.length, icon: Camera, color: "text-blue-500", bgColor: "bg-blue-500/10" },
    { label: "Conversion", value: `${conversionRate}%`, icon: TrendingUp, color: "text-emerald-500", bgColor: "bg-emerald-500/10" },
  ];

  const quickLinks = [
    { title: "Manage Treks", description: "Packages & Pricing", link: "/managepage/dashboard/treks", icon: Mountain },
    { title: "Journal", description: "Blog & Stories", link: "/managepage/dashboard/journal", icon: BookOpen },
    { title: "Gallery", description: "Visual Assets", link: "/managepage/dashboard/gallery", icon: Camera },
    { title: "Inquiries", description: "Leads & Bookings", link: "/managepage/dashboard/inquiries", icon: Users },
    { title: "Detailed Analytics", description: "Traffic & Sources", link: "/managepage/dashboard/analytics", icon: TrendingUp },
  ];

  const trafficChartConfig = {
    views: {
      label: "Views",
      color: "hsl(var(--accent))",
    },
  };

  return (
    <div className="p-8 space-y-8">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="flex flex-col md:flex-row md:items-center justify-between gap-4"
      >
        <div>
          <h1 className="font-heading text-4xl text-primary">Namaste, Admin</h1>
          <p className="text-muted-foreground">Here is what is happening on Idyllic Adventures today.</p>
        </div>
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-2 px-4 py-2 bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 rounded-full text-xs font-bold uppercase tracking-widest border border-emerald-500/20">
            <span className="w-2 h-2 bg-emerald-500 rounded-full animate-pulse" />
            Live System
          </div>
          <Link to="/managepage/dashboard/settings" className="p-2 hover:bg-muted rounded-full transition-colors">
            <Settings className="w-6 h-6 text-muted-foreground" />
          </Link>
        </div>
      </motion.div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {stats.map((stat, index) => (
          <motion.div
            key={stat.label}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: index * 0.1 }}
            className="glass-card rounded-[2rem] p-8"
          >
            <div className={`w-14 h-14 rounded-2xl ${stat.bgColor} flex items-center justify-center mb-6`}>
              <stat.icon className={`w-7 h-7 ${stat.color}`} />
            </div>
            <div className="text-4xl font-bold mb-1 tracking-tight">{stat.value}</div>
            <div className="text-sm text-muted-foreground font-medium uppercase tracking-widest">{stat.label}</div>
          </motion.div>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Realtime Traffic */}
        <motion.div
          initial={{ opacity: 0, x: -20 }}
          animate={{ opacity: 1, x: 0 }}
          className="lg:col-span-2 glass-panel p-8"
        >
          <div className="flex items-center justify-between mb-8">
            <div>
              <h3 className="font-heading text-2xl">Traffic Overview</h3>
              <p className="text-sm text-muted-foreground">Live page views over the last 12 hours</p>
            </div>
            <div className="flex items-center gap-3">
              <Link to="/managepage/dashboard/analytics" className="px-4 py-2 bg-accent/10 text-accent rounded-xl text-xs font-bold uppercase tracking-widest hover:bg-accent/20 transition-all">
                Full Report
              </Link>
            </div>
          </div>

          <div className="h-[300px] w-full relative">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={hourlyViewData}>
                <defs>
                  <linearGradient id="colorViews" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#f43f5e" stopOpacity={0.3}/>
                    <stop offset="95%" stopColor="#f43f5e" stopOpacity={0}/>
                  </linearGradient>
                </defs>
                <CartesianGrid vertical={false} strokeDasharray="3 3" stroke="#888" opacity={0.1} />
                <XAxis 
                  dataKey="hour" 
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
                  contentStyle={{ borderRadius: "12px", border: "none", boxShadow: "0 10px 30px rgba(0,0,0,0.1)" }}
                />
                <Area 
                  type="monotone" 
                  dataKey="views" 
                  stroke="#f43f5e" 
                  strokeWidth={3}
                  fillOpacity={1} 
                  fill="url(#colorViews)" 
                />
              </AreaChart>
            </ResponsiveContainer>
            {hourlyViewData.every(d => d.views === 0) && (
              <div className="absolute inset-0 flex flex-col items-center justify-center bg-background/40 backdrop-blur-[1px] rounded-2xl pointer-events-none">
                <MousePointer2 className="w-8 h-8 text-accent/20 mb-2" />
                <p className="text-[10px] uppercase font-bold tracking-widest text-muted-foreground/60">Live feed waiting...</p>
              </div>
            )}
          </div>
        </motion.div>

        {/* Traffic Sources */}
        <motion.div
          initial={{ opacity: 0, x: 20 }}
          animate={{ opacity: 1, x: 0 }}
          className="glass-panel p-8"
        >
          <h2 className="font-heading text-2xl mb-6">Traffic Sources</h2>
          <div className="space-y-6">
            {(sourceData || []).map((row, i) => (
              <div key={row.name} className="space-y-2">
                <div className="flex justify-between text-sm font-medium">
                  <div className="flex items-center gap-2">
                    {row.name === "Search" && <Search className="w-3 h-3 text-blue-500" />}
                    {row.name === "Social" && <Share2 className="w-3 h-3 text-pink-500" />}
                    {row.name === "Referral" && <LinkIcon className="w-3 h-3 text-emerald-500" />}
                    {row.name === "Direct" && <Globe className="w-3 h-3 text-muted-foreground" />}
                    <span>{row.name}</span>
                  </div>
                  <span className="text-accent">{Math.round((row.value / (pageViews.length || 1)) * 100)}%</span>
                </div>
                <div className="h-2 bg-muted rounded-full overflow-hidden">
                  <motion.div
                    initial={{ width: 0 }}
                    animate={{ width: `${(row.value / (pageViews.length || 1)) * 100}%` }}
                    className="h-full bg-accent"
                  />
                </div>
              </div>
            ))}
            {(!sourceData || sourceData.length === 0) && <div className="text-center py-8 text-muted-foreground italic text-sm">Waiting for traffic data...</div>}
          </div>
        </motion.div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
        {/* Top Locations */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="lg:col-span-1 glass-panel p-8"
        >
          <h2 className="font-heading text-2xl mb-6">Top Countries</h2>
          <div className="space-y-6">
            {(countryRows || []).map((row) => (
              <div key={row.country} className="space-y-2">
                <div className="flex justify-between text-sm font-medium">
                  <span>{row.country}</span>
                  <span className="text-accent">{row.visits}</span>
                </div>
                <div className="h-2 bg-muted rounded-full overflow-hidden">
                  <motion.div
                    initial={{ width: 0 }}
                    animate={{ width: `${(row.visits / (pageViews.length || 1)) * 100}%` }}
                    className="h-full bg-accent"
                  />
                </div>
              </div>
            ))}
            {(!countryRows || countryRows.length === 0) && <div className="text-center py-8 text-muted-foreground italic text-sm">No location data yet</div>}
          </div>
        </motion.div>

        {/* Device Breakdown */}
        <motion.div className="glass-panel p-8 lg:col-span-1">
          <h2 className="font-heading text-2xl mb-8">Devices</h2>
          <div className="h-[200px]">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={deviceData}
                  innerRadius={60}
                  outerRadius={80}
                  paddingAngle={5}
                  dataKey="value"
                >
                  {(deviceData || []).map((_, index) => (
                    <Cell key={`cell-${index}`} fill={["#f97316", "#3b82f6", "#10b981"][index % 3]} />
                  ))}
                </Pie>
                <Tooltip 
                  contentStyle={{ borderRadius: "12px", border: "none", boxShadow: "0 10px 30px rgba(0,0,0,0.1)" }}
                />
              </PieChart>
            </ResponsiveContainer>
          </div>
          <div className="flex flex-wrap justify-center gap-4 mt-6">
            {(deviceData || []).map((d, i) => (
              <div key={d.name} className="flex flex-col items-center">
                <div className="flex items-center gap-2 mb-1">
                  <div className={`w-2 h-2 rounded-full`} style={{ backgroundColor: ["#f97316", "#3b82f6", "#10b981"][i % 3] }} />
                  <span className="text-[10px] font-bold uppercase tracking-tighter">{d.name}</span>
                </div>
                <div className="text-lg font-bold">{d.value}</div>
              </div>
            ))}
          </div>
        </motion.div>

        {/* Top Content */}
        <motion.div className="lg:col-span-2 glass-panel p-8">
          <h2 className="font-heading text-2xl mb-8">Popular Pages</h2>
          <div className="space-y-4">
            {(topPages || []).map((page) => (
              <div key={page.path} className="flex items-center justify-between p-4 rounded-2xl bg-muted/20 border border-border/50">
                <div className="flex items-center gap-4">
                  <div className="w-10 h-10 rounded-xl bg-accent/10 flex items-center justify-center border border-accent/20">
                    <MousePointer2 className="w-5 h-5 text-accent" />
                  </div>
                  <span className="font-bold text-sm text-foreground">{page.path}</span>
                </div>
                <div className="text-right">
                  <div className="text-lg font-bold">{page.views}</div>
                  <div className="text-[10px] uppercase font-bold text-muted-foreground">Page Views</div>
                </div>
              </div>
            ))}
            {(!topPages || topPages.length === 0) && <div className="text-center py-8 text-muted-foreground italic text-sm">No page data yet</div>}
          </div>
        </motion.div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
        {/* Quick Management */}
        <div className="lg:col-span-1 space-y-6">
          <h3 className="font-heading text-xl">Quick Access</h3>
          <div className="grid grid-cols-1 gap-4">
            {quickLinks.map((link) => (
              <Link
                key={link.title}
                to={link.link}
                className="flex items-center gap-4 p-4 glass-card hover:bg-white/40 transition-all group"
              >
                <div className="w-10 h-10 rounded-xl bg-accent/10 flex items-center justify-center group-hover:scale-110 transition-transform">
                  <link.icon className="w-5 h-5 text-accent" />
                </div>
                <div>
                  <div className="text-sm font-bold">{link.title}</div>
                  <div className="text-[10px] text-muted-foreground uppercase tracking-wider">{link.description}</div>
                </div>
              </Link>
            ))}
          </div>
        </div>

        {/* Recent Activity */}
        <div className="lg:col-span-3 glass-panel p-8">
          <div className="flex items-center justify-between mb-8">
            <h2 className="font-heading text-2xl">Recent Leads</h2>
            <Link to="/managepage/dashboard/inquiries" className="text-accent hover:underline text-sm font-bold flex items-center gap-2">
              View All <ArrowRight className="w-4 h-4" />
            </Link>
          </div>
          <div className="space-y-4">
            {recentInquiries.map((inquiry) => (
              <div key={inquiry.id} className="flex items-center justify-between p-4 rounded-2xl bg-white/5 border border-white/10 hover:bg-white/10 transition-all">
                <div className="flex items-center gap-4">
                  <div className="w-10 h-10 rounded-full bg-secondary/10 flex items-center justify-center">
                    <Users className="w-5 h-5 text-secondary" />
                  </div>
                  <div>
                    <div className="font-bold text-sm text-foreground">{inquiry.name}</div>
                    <div className="text-xs text-muted-foreground">{inquiry.email}</div>
                  </div>
                </div>
                <div className="text-right">
                  <div className="text-[10px] font-bold uppercase tracking-widest mb-1">{inquiry.inquiryType}</div>
                  <div className={`text-xs px-2 py-0.5 rounded-full inline-block ${
                    inquiry.status === "new" ? "bg-accent/10 text-accent" : "bg-muted text-muted-foreground"
                  }`}>
                    {inquiry.status}
                  </div>
                </div>
              </div>
            ))}
            {recentInquiries.length === 0 && (
              <div className="text-center py-12 text-muted-foreground">
                No inquiries received yet.
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
