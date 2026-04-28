import { motion } from "motion/react";
import { Mountain, Image, Bell, Users, TrendingUp, Sparkles, ShieldCheck, ArrowRight, Settings, BookOpen, Camera, MousePointer2, Search, Globe, Link as LinkIcon, Share2, Monitor, MessageSquare, Clock } from "lucide-react";
import { Link } from "react-router";
import { useInquiries, useNotices, useTreks, useWebsiteAnalytics, useJournal, useGallery } from "../../data/useRealtimeData";
import { isSupabaseConfigured, checkAndSetupStorage } from "../../data/supabaseData";
import { useEffect, useState, useMemo } from "react";
import { ChartContainer, ChartTooltip, ChartTooltipContent } from "../../components/ui/chart";
import { Bar, BarChart, CartesianGrid, Cell, Pie, PieChart, XAxis, YAxis, Area, AreaChart, ResponsiveContainer, Tooltip } from "recharts";

export function AdminDashboardPage() {
  const { treks } = useTreks();
  const { notices } = useNotices();
  const { inquiries } = useInquiries();
  const { entries } = useJournal(false);
  const { images } = useGallery();
  const { events, error } = useWebsiteAnalytics(24);
  
  // Memoize analytics calculations for "butter smooth" performance
  const pageViews = useMemo(() => events.filter((event) => event.eventType === "page_view"), [events]);
  const activeSessions = useMemo(() => new Set(pageViews.map((event) => event.sessionId)).size, [pageViews]);
  const conversionRate = useMemo(() => activeSessions > 0 ? ((inquiries.length / activeSessions) * 100).toFixed(1) : "0", [activeSessions, inquiries.length]);

  const deviceData = useMemo(() => {
    const stats = pageViews.reduce((acc, event) => {
      const ua = event.userAgent?.toLowerCase() || "";
      let device = "Desktop";
      if (ua.includes("mobi")) device = "Mobile";
      else if (ua.includes("tablet") || ua.includes("ipad")) device = "Tablet";
      acc[device] = (acc[device] || 0) + 1;
      return acc;
    }, {} as Record<string, number>);
    return Object.entries(stats).map(([name, value]) => ({ name, value }));
  }, [pageViews]);

  const topPages = useMemo(() => {
    const stats = pageViews.reduce((acc, event) => {
      const path = event.path || "/";
      acc[path] = (acc[path] || 0) + 1;
      return acc;
    }, {} as Record<string, number>);
    return Object.entries(stats)
      .map(([path, views]) => ({ path, views }))
      .sort((a, b) => b.views - a.views)
      .slice(0, 5);
  }, [pageViews]);

  const sourceData = useMemo(() => {
    const stats = pageViews.reduce((acc, event) => {
      const src = event.referrerSource || "Direct";
      acc[src] = (acc[src] || 0) + 1;
      return acc;
    }, {} as Record<string, number>);
    return Object.entries(stats).map(([name, value]) => ({ name, value }));
  }, [pageViews]);

  const countryRows = useMemo(() => {
    const totals = pageViews.reduce<Record<string, number>>((acc, event) => {
      const country = event.country || "Unknown";
      acc[country] = (acc[country] ?? 0) + 1;
      return acc;
    }, {});
    return Object.entries(totals)
      .map(([country, visits]) => ({ country, visits }))
      .sort((a, b) => b.visits - a.visits)
      .slice(0, 5);
  }, [pageViews]);

  const hourlyViewData = useMemo(() => {
    return Array.from({ length: 12 }, (_, index) => {
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
  }, [pageViews]);

  // Restore missing dashboard data
  const recentTreks = useMemo(() => treks.slice(0, 5), [treks]);
  const recentInquiries = useMemo(() => inquiries.slice(0, 6), [inquiries]);

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
    <div className="p-4 md:p-8 space-y-6 md:space-y-8">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="flex flex-col md:flex-row md:items-center justify-between gap-4"
      >
        <div>
          <h1 className="font-heading text-4xl text-primary">Namaste, Admin</h1>
          <p className="text-muted-foreground">Here is what is happening on Idyllic Adventures today.</p>
        </div>
        
        {error && (
          <div className="flex-1 max-w-xl p-3 bg-red-500/10 border border-red-500/20 rounded-xl flex items-center gap-3 text-red-600 dark:text-red-400">
             <div className="w-8 h-8 rounded-full bg-red-500/20 flex items-center justify-center shrink-0 font-bold text-sm italic">!</div>
             <p className="text-xs font-medium truncate">{error}</p>
          </div>
        )}
        
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

      <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
        {/* Recent Treks */}
        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="lg:col-span-4 glass-panel p-8"
        >
          <div className="flex items-center justify-between mb-8">
            <h2 className="font-heading text-2xl">Recent Treks</h2>
            <Link to="/managepage/dashboard/treks" className="text-accent hover:underline text-sm font-bold flex items-center gap-2">
              All Treks <ArrowRight className="w-4 h-4" />
            </Link>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4">
            {recentTreks.map((trek: any) => (
              <div key={trek.id} className="flex items-center gap-4 p-3 rounded-2xl bg-white/5 border border-white/10 hover:bg-white/10 transition-all">
                <div className="w-12 h-12 rounded-xl overflow-hidden bg-muted flex items-center justify-center shrink-0">
                  {trek.main_image ? (
                    <img 
                      src={trek.main_image.startsWith('http') ? trek.main_image : `${import.meta.env.VITE_SUPABASE_URL}/storage/v1/object/public/trek-images/${trek.main_image}`} 
                      alt={trek.title} 
                      className="w-full h-full object-cover" 
                    />
                  ) : (
                    <Mountain className="w-6 h-6 text-muted-foreground/40" />
                  )}
                </div>
                <div>
                  <div className="font-bold text-sm text-foreground">{trek.title}</div>
                  <div className="text-[10px] text-muted-foreground uppercase tracking-widest">{trek.difficulty} • {trek.duration}</div>
                </div>
              </div>
            ))}
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
            {recentInquiries.map((inquiry: any) => (
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
