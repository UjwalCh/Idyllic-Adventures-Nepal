import { motion } from "motion/react";
import { Mountain, Image, Bell, Users, TrendingUp, Sparkles, ShieldCheck, ArrowRight, Settings, BookOpen, Camera, MousePointer2 } from "lucide-react";
import { Link } from "react-router";
import { useInquiries, useNotices, useTreks, useWebsiteAnalytics, useJournal, useGallery } from "../../data/useRealtimeData";
import { isSupabaseConfigured } from "../../data/supabaseData";
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
    { label: "Gallery Photos", value: images.length, icon: Camera, color: "text-blue-500", bgColor: "bg-blue-50" },
    { label: "Conversion", value: `${conversionRate}%`, icon: TrendingUp, color: "text-emerald-600", bgColor: "bg-emerald-50" },
  ];

  const quickLinks = [
    { title: "Manage Treks", description: "Packages & Pricing", link: "/admin/dashboard/treks", icon: Mountain },
    { title: "Journal", description: "Blog & Stories", link: "/admin/dashboard/journal", icon: BookOpen },
    { title: "Gallery", description: "Visual Assets", link: "/admin/dashboard/gallery", icon: Camera },
    { title: "Inquiries", description: "Leads & Bookings", link: "/admin/dashboard/inquiries", icon: Users },
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
          <div className="flex items-center gap-2 px-4 py-2 bg-emerald-50 text-emerald-700 rounded-full text-xs font-bold uppercase tracking-widest border border-emerald-100">
            <span className="w-2 h-2 bg-emerald-500 rounded-full animate-pulse" />
            Live System
          </div>
          <Link to="/admin/dashboard/settings" className="p-2 hover:bg-muted rounded-full transition-colors">
            <Settings className="w-6 h-6 text-muted-foreground" />
          </Link>
        </div>
      </motion.div>

      {/* Hero Stats */}
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
              <h2 className="font-heading text-2xl mb-1">Traffic Overview</h2>
              <p className="text-sm text-muted-foreground">Realtime page views (last 24h)</p>
            </div>
            <div className="flex items-center gap-4 text-xs font-bold uppercase tracking-widest">
              <div className="flex items-center gap-2">
                <span className="w-3 h-3 bg-accent rounded-full" />
                Views
              </div>
            </div>
          </div>
          <div className="h-[300px] w-full">
            <ChartContainer config={trafficChartConfig}>
              <AreaChart data={hourlyViewData}>
                <defs>
                  <linearGradient id="colorViews" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="hsl(var(--accent))" stopOpacity={0.3}/>
                    <stop offset="95%" stopColor="hsl(var(--accent))" stopOpacity={0}/>
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="rgba(0,0,0,0.05)" />
                <XAxis dataKey="hour" axisLine={false} tickLine={false} tick={{ fontSize: 12, fill: "#888" }} />
                <YAxis axisLine={false} tickLine={false} tick={{ fontSize: 12, fill: "#888" }} />
                <ChartTooltip content={<ChartTooltipContent />} />
                <Area type="monotone" dataKey="views" stroke="hsl(var(--accent))" strokeWidth={3} fillOpacity={1} fill="url(#colorViews)" />
              </AreaChart>
            </ChartContainer>
          </div>
        </motion.div>

        {/* Top Locations */}
        <motion.div
          initial={{ opacity: 0, x: 20 }}
          animate={{ opacity: 1, x: 0 }}
          className="glass-panel p-8"
        >
          <h2 className="font-heading text-2xl mb-6">Top Countries</h2>
          <div className="space-y-6">
            {countryRows.map((row, i) => (
              <div key={row.country} className="space-y-2">
                <div className="flex justify-between text-sm font-medium">
                  <span>{row.country}</span>
                  <span className="text-accent">{row.visits} views</span>
                </div>
                <div className="h-2 bg-muted rounded-full overflow-hidden">
                  <motion.div
                    initial={{ width: 0 }}
                    animate={{ width: `${(row.visits / pageViews.length) * 100}%` }}
                    className="h-full bg-accent"
                  />
                </div>
              </div>
            ))}
            {countryRows.length === 0 && (
              <div className="text-center py-12 text-muted-foreground italic">
                Waiting for traffic data...
              </div>
            )}
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
            <Link to="/admin/dashboard/inquiries" className="text-accent hover:underline text-sm font-bold flex items-center gap-2">
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
                    <div className="font-bold text-sm">{inquiry.name}</div>
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
