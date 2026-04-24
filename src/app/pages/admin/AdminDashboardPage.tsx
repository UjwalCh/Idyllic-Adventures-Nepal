import { motion } from "motion/react";
import { Mountain, Image, Bell, Users, TrendingUp, Sparkles, ShieldCheck, ArrowRight, Settings } from "lucide-react";
import { Link } from "react-router";
import { useInquiries, useNotices, useTreks, useWebsiteAnalytics } from "../../data/useRealtimeData";
import { isSupabaseConfigured } from "../../data/supabaseData";
import { ChartContainer, ChartTooltip, ChartTooltipContent } from "../../components/ui/chart";
import { Bar, BarChart, CartesianGrid, Cell, Pie, PieChart, XAxis, YAxis } from "recharts";

export function AdminDashboardPage() {
  const { treks } = useTreks();
  const { notices } = useNotices();
  const { inquiries } = useInquiries();
  const { events } = useWebsiteAnalytics(24);
  const recentTreks = treks.slice(0, 5);
  const recentInquiries = inquiries.slice(0, 6);
  const featuredTreks = treks.filter((t) => t.featured).length;
  const bookingLeads = inquiries.filter((item) => item.inquiryType === "booking").length;
  const openLeads = inquiries.filter((item) => item.status !== "closed").length;
  const pageViews = events.filter((event) => event.eventType === "page_view");
  const viewsLastHour = pageViews.filter(
    (event) => Date.now() - new Date(event.createdAt).getTime() <= 60 * 60 * 1000
  ).length;
  const activeSessions = new Set(pageViews.map((event) => event.sessionId)).size;

  const getVisitorLocationLabel = (event: (typeof pageViews)[number]) => {
    const fallbackLabel = [event.city, event.region, event.country].filter(Boolean).join(", ");
    return event.locationLabel ?? (fallbackLabel || "Unknown");
  };

  const getCountryLabel = (event: (typeof pageViews)[number]) => {
    if (event.country) {
      return event.country;
    }

    const locationParts = event.locationLabel?.split(",").map((part) => part.trim()).filter(Boolean) ?? [];
    return locationParts[locationParts.length - 1] ?? "Unknown";
  };

  const countryTotals = pageViews.reduce<Record<string, number>>((acc, event) => {
    const country = getCountryLabel(event);
    acc[country] = (acc[country] ?? 0) + 1;
    return acc;
  }, {});

  const locationTotals = pageViews.reduce<Record<string, number>>((acc, event) => {
    const label = getVisitorLocationLabel(event);
    acc[label] = (acc[label] ?? 0) + 1;
    return acc;
  }, {});

  const countryRows = Object.entries(countryTotals)
    .map(([country, visits]) => ({ country, visits }))
    .sort((a, b) => b.visits - a.visits)
    .slice(0, 5);

  const locationRows = Object.entries(locationTotals)
    .map(([location, visits]) => ({ location, visits }))
    .sort((a, b) => b.visits - a.visits)
    .slice(0, 5);

  const countryCount = new Set(pageViews.map((event) => event.country).filter(Boolean)).size;
  const topCountry = countryRows[0]?.country ?? "Unknown";
  const topLocation = locationRows[0]?.location ?? "Unknown";

  const topPages = pageViews.reduce<Record<string, number>>((acc, event) => {
    acc[event.path] = (acc[event.path] ?? 0) + 1;
    return acc;
  }, {});

  const topPageRows = Object.entries(topPages)
    .map(([path, count]) => ({ path, count }))
    .sort((a, b) => b.count - a.count)
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

  const trafficChartConfig = {
    views: {
      label: "Page views",
      color: "hsl(var(--secondary))",
    },
  };

  const geoChartConfig = {
    visits: {
      label: "Visits",
      color: "hsl(var(--accent))",
    },
  };

  const extractPriceValue = (priceText: string) => {
    const normalized = priceText.replace(/,/g, "");
    const match = normalized.match(/\d+(?:\.\d+)?/);
    return match ? Number(match[0]) : null;
  };

  const pricedTreks = treks
    .map((t) => extractPriceValue(t.price))
    .filter((value): value is number => typeof value === "number" && Number.isFinite(value));

  const averagePrice = pricedTreks.length
    ? Math.round(pricedTreks.reduce((sum, value) => sum + value, 0) / pricedTreks.length)
    : 0;

  const difficultyData = ["Easy", "Moderate", "Challenging", "Strenuous"].map((difficulty) => ({
    level: difficulty,
    total: treks.filter((trek) => trek.difficulty === difficulty).length,
  }));

  const noticeTypeData = ["info", "warning", "success"].map((type) => ({
    name: type,
    value: notices.filter((notice) => notice.type === type).length,
    fill:
      type === "info"
        ? "#3b82f6"
        : type === "warning"
        ? "#f59e0b"
        : "#10b981",
  }));

  const totalHighlights = treks.reduce((sum, trek) => sum + trek.highlights.length, 0);
  const featuredRatio = treks.length ? Math.round((featuredTreks / treks.length) * 100) : 0;

  const difficultyChartConfig = {
    total: {
      label: "Treks",
      color: "hsl(var(--accent))",
    },
  };

  const noticeChartConfig = {
    info: {
      label: "Info",
      color: "#3b82f6",
    },
    warning: {
      label: "Warning",
      color: "#f59e0b",
    },
    success: {
      label: "Success",
      color: "#10b981",
    },
  };

  const adminHealth = [
    {
      label: "Supabase",
      value: isSupabaseConfigured ? "Connected" : "Not configured",
      tone: isSupabaseConfigured ? "text-emerald-600" : "text-amber-600",
      bg: isSupabaseConfigured ? "bg-emerald-50" : "bg-amber-50",
    },
    {
      label: "Realtime",
      value: "Active",
      tone: "text-accent",
      bg: "bg-accent/10",
    },
    {
      label: "Admin access",
      value: "Protected",
      tone: "text-secondary",
      bg: "bg-secondary/10",
    },
  ];

  const stats = [
    {
      label: "Total Treks",
      value: treks.length,
      icon: Mountain,
      color: "text-accent",
      bgColor: "bg-accent/10",
    },
    {
      label: "Featured Treks",
      value: featuredTreks,
      icon: TrendingUp,
      color: "text-secondary",
      bgColor: "bg-secondary/10",
    },
    {
      label: "Active Notices",
      value: notices.length,
      icon: Bell,
      color: "text-yellow-600",
      bgColor: "bg-yellow-100",
    },
    {
      label: "Booking Leads",
      value: bookingLeads,
      icon: Users,
      color: "text-green-600",
      bgColor: "bg-green-100",
    },
  ];

  const quickLinks = [
    {
      title: "Manage Treks",
      description: "Add, edit, or remove trek packages",
      link: "/admin/dashboard/treks",
      icon: Mountain,
    },
    {
      title: "Manage Images",
      description: "Upload and organize trek images",
      link: "/admin/dashboard/images",
      icon: Image,
    },
    {
      title: "Manage Notices",
      description: "Create and update site notices",
      link: "/admin/dashboard/notices",
      icon: Bell,
    },
    {
      title: "Manage Inquiries",
      description: "Review booking and inquiry submissions",
      link: "/admin/dashboard/inquiries",
      icon: Users,
    },
    {
      title: "Site Settings",
      description: "Edit page content, WhatsApp, and anti-spam rules",
      link: "/admin/dashboard/settings",
      icon: Settings,
    },
  ];

  return (
    <div className="p-8">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
      >
        <section className="mb-8 overflow-hidden rounded-3xl border border-border bg-gradient-to-br from-primary via-primary to-accent p-8 text-primary-foreground shadow-xl">
          <div className="relative z-10 grid gap-6 lg:grid-cols-[1.4fr_0.8fr] lg:items-end">
            <div>
              <div className="mb-4 inline-flex items-center gap-2 rounded-full bg-white/10 px-3 py-1 text-xs uppercase tracking-[0.25em]">
                <Sparkles className="h-3.5 w-3.5" />
                Launch Dashboard
              </div>
              <h1 className="font-heading text-4xl md:text-5xl mb-4">Control your live trek site</h1>
              <p className="max-w-2xl text-primary-foreground/85 text-lg">
                Manage treks, notices, and image updates from one place. Every change flows through Supabase and shows up on the public site in realtime.
              </p>
            </div>
            <div className="grid gap-3 rounded-2xl bg-white/10 p-4 backdrop-blur-sm">
              {adminHealth.map((item) => (
                <div key={item.label} className={`rounded-xl ${item.bg} p-3`}>
                  <div className="text-xs uppercase tracking-[0.2em] text-primary-foreground/70">{item.label}</div>
                  <div className={`mt-1 text-sm font-semibold ${item.tone}`}>{item.value}</div>
                </div>
              ))}
            </div>
          </div>
        </section>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          {stats.map((stat, index) => (
            <motion.div
              key={stat.label}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: index * 0.1 }}
              className="bg-card rounded-2xl p-6 border border-border shadow-sm"
            >
              <div className="flex items-center justify-between mb-4">
                <div className={`p-3 rounded-lg ${stat.bgColor}`}>
                  <stat.icon className={`w-6 h-6 ${stat.color}`} />
                </div>
              </div>
              <div className="text-3xl mb-1">{stat.value}</div>
              <div className="text-sm text-muted-foreground">{stat.label}</div>
            </motion.div>
          ))}
        </div>

        <div className="grid grid-cols-1 xl:grid-cols-3 gap-6 mb-8">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.45, delay: 0.55 }}
            className="rounded-2xl border border-border bg-card p-6 shadow-sm"
          >
            <h2 className="font-heading text-xl mb-1">Difficulty Split</h2>
            <p className="text-sm text-muted-foreground mb-4">Distribution of live trek packages by level.</p>
            <ChartContainer config={difficultyChartConfig} className="h-[230px] w-full">
              <BarChart data={difficultyData} margin={{ left: 8, right: 8, top: 8 }}>
                <CartesianGrid vertical={false} />
                <XAxis dataKey="level" tickLine={false} axisLine={false} />
                <ChartTooltip cursor={false} content={<ChartTooltipContent />} />
                <Bar dataKey="total" radius={8} fill="var(--color-total)" />
              </BarChart>
            </ChartContainer>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.45, delay: 0.65 }}
            className="rounded-2xl border border-border bg-card p-6 shadow-sm"
          >
            <h2 className="font-heading text-xl mb-1">Notice Types</h2>
            <p className="text-sm text-muted-foreground mb-4">Current notice mix by message category.</p>
            <ChartContainer config={noticeChartConfig} className="h-[230px] w-full">
              <PieChart>
                <ChartTooltip cursor={false} content={<ChartTooltipContent nameKey="name" />} />
                <Pie data={noticeTypeData} dataKey="value" nameKey="name" innerRadius={50} outerRadius={82}>
                  {noticeTypeData.map((item) => (
                    <Cell key={item.name} fill={item.fill} />
                  ))}
                </Pie>
              </PieChart>
            </ChartContainer>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.45, delay: 0.75 }}
            className="rounded-2xl border border-border bg-card p-6 shadow-sm"
          >
            <h2 className="font-heading text-xl mb-4">Key Metrics</h2>
            <div className="space-y-3">
              <div className="flex items-center justify-between rounded-xl bg-muted/20 px-4 py-3">
                <span className="text-sm text-muted-foreground">Featured ratio</span>
                <span className="text-sm font-semibold">{featuredRatio}%</span>
              </div>
              <div className="flex items-center justify-between rounded-xl bg-muted/20 px-4 py-3">
                <span className="text-sm text-muted-foreground">Average trek price</span>
                <span className="text-sm font-semibold">${averagePrice.toLocaleString()}</span>
              </div>
              <div className="flex items-center justify-between rounded-xl bg-muted/20 px-4 py-3">
                <span className="text-sm text-muted-foreground">Total highlights</span>
                <span className="text-sm font-semibold">{totalHighlights}</span>
              </div>
            </div>
          </motion.div>
        </div>

        <div className="grid grid-cols-1 xl:grid-cols-[1.15fr_0.85fr] gap-6 mb-8">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.45, delay: 0.82 }}
            className="rounded-2xl border border-border bg-card p-6 shadow-sm"
          >
            <div className="mb-4 flex items-center justify-between gap-3">
              <div>
                <h2 className="font-heading text-xl mb-1">Realtime Website Analytics</h2>
                <p className="text-sm text-muted-foreground">Live page-views from your public website (last 24h).</p>
              </div>
              <span className="rounded-full bg-emerald-100 px-3 py-1 text-xs font-medium text-emerald-700">Live</span>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 mb-4">
              <div className="rounded-xl bg-muted/20 px-4 py-3">
                <div className="text-xs uppercase tracking-wide text-muted-foreground">Views (24h)</div>
                <div className="text-2xl font-semibold">{pageViews.length}</div>
              </div>
              <div className="rounded-xl bg-muted/20 px-4 py-3">
                <div className="text-xs uppercase tracking-wide text-muted-foreground">Last Hour</div>
                <div className="text-2xl font-semibold">{viewsLastHour}</div>
              </div>
              <div className="rounded-xl bg-muted/20 px-4 py-3">
                <div className="text-xs uppercase tracking-wide text-muted-foreground">Unique Visitors</div>
                <div className="text-2xl font-semibold">{activeSessions}</div>
              </div>
            </div>

            <ChartContainer config={trafficChartConfig} className="h-[220px] w-full">
              <BarChart data={hourlyViewData} margin={{ left: 6, right: 6, top: 8 }}>
                <CartesianGrid vertical={false} />
                <XAxis dataKey="hour" tickLine={false} axisLine={false} />
                <ChartTooltip cursor={false} content={<ChartTooltipContent />} />
                <Bar dataKey="views" fill="var(--color-views)" radius={7} />
              </BarChart>
            </ChartContainer>
          </motion.div>

          <div className="space-y-6">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.45, delay: 0.9 }}
              className="rounded-2xl border border-border bg-card p-6 shadow-sm"
            >
              <h2 className="font-heading text-xl mb-1">Visitor Geography</h2>
              <p className="text-sm text-muted-foreground mb-4">Where public page visitors are coming from.</p>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mb-4">
                <div className="rounded-xl bg-muted/20 px-4 py-3">
                  <div className="text-xs uppercase tracking-wide text-muted-foreground">Countries</div>
                  <div className="text-2xl font-semibold">{countryCount}</div>
                </div>
                <div className="rounded-xl bg-muted/20 px-4 py-3">
                  <div className="text-xs uppercase tracking-wide text-muted-foreground">Top Country</div>
                  <div className="text-lg font-semibold line-clamp-1">{topCountry}</div>
                </div>
                <div className="rounded-xl bg-muted/20 px-4 py-3">
                  <div className="text-xs uppercase tracking-wide text-muted-foreground">Top Location</div>
                  <div className="text-lg font-semibold line-clamp-1">{topLocation}</div>
                </div>
                <div className="rounded-xl bg-muted/20 px-4 py-3">
                  <div className="text-xs uppercase tracking-wide text-muted-foreground">Geo-tagged Views</div>
                  <div className="text-2xl font-semibold">{pageViews.filter((event) => event.locationLabel || event.country || event.city).length}</div>
                </div>
              </div>

              <ChartContainer config={geoChartConfig} className="h-[250px] w-full">
                <BarChart data={locationRows} layout="vertical" margin={{ left: 8, right: 8, top: 8 }}>
                  <CartesianGrid horizontal={false} />
                  <XAxis type="number" tickLine={false} axisLine={false} />
                  <YAxis dataKey="location" type="category" tickLine={false} axisLine={false} width={92} />
                  <ChartTooltip cursor={false} content={<ChartTooltipContent />} />
                  <Bar dataKey="visits" fill="var(--color-visits)" radius={7} />
                </BarChart>
              </ChartContainer>
            </motion.div>

            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.45, delay: 0.98 }}
              className="rounded-2xl border border-border bg-card p-6 shadow-sm"
            >
              <h2 className="font-heading text-xl mb-1">Top Pages</h2>
              <p className="text-sm text-muted-foreground mb-4">Most visited routes from the past 24 hours.</p>

              {topPageRows.length ? (
                <div className="space-y-3">
                  {topPageRows.map((item) => (
                    <div key={item.path} className="flex items-center justify-between rounded-xl bg-muted/20 px-4 py-3 gap-3">
                      <span className="text-sm truncate">{item.path}</span>
                      <span className="text-sm font-semibold">{item.count}</span>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="rounded-xl bg-muted/20 px-4 py-6 text-sm text-muted-foreground">
                  No public page views tracked yet. Open your public pages to start seeing live analytics.
                </div>
              )}
            </motion.div>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-6 mb-8">
          {quickLinks.map((link, index) => (
            <motion.div
              key={link.title}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: 0.4 + index * 0.1 }}
            >
              <Link
                to={link.link}
                className="block bg-card rounded-2xl p-6 border border-border hover:border-accent hover:shadow-lg transition-all group"
              >
                <div className="flex items-center gap-4 mb-4">
                  <div className="p-3 bg-accent/10 rounded-lg group-hover:bg-accent/20 transition-colors">
                    <link.icon className="w-6 h-6 text-accent" />
                  </div>
                  <h3 className="font-heading text-lg">{link.title}</h3>
                </div>
                <p className="text-sm text-muted-foreground">{link.description}</p>
              </Link>
            </motion.div>
          ))}
        </div>

        <div className="grid gap-6 lg:grid-cols-[1.15fr_0.85fr]">
          <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.7 }}
          className="bg-card rounded-2xl p-6 border border-border shadow-sm"
        >
          <div className="mb-4 flex items-center justify-between gap-4">
            <div>
              <h2 className="font-heading text-xl mb-1">Recent Treks</h2>
              <p className="text-sm text-muted-foreground">Fast access to your newest or featured packages.</p>
            </div>
            <Link to="/admin/dashboard/treks" className="inline-flex items-center gap-2 text-sm text-accent hover:underline">
              Manage all
              <ArrowRight className="h-4 w-4" />
            </Link>
          </div>
          <div className="space-y-3">
            {recentTreks.map((trek) => (
              <div
                key={trek.id}
                className="flex items-center justify-between gap-4 rounded-xl border border-border bg-muted/20 p-3"
              >
                <div className="flex items-center gap-4 min-w-0">
                  <div className="w-14 h-14 bg-muted rounded-lg overflow-hidden flex-shrink-0">
                    <img
                      src={trek.image}
                      alt={trek.title}
                      className="w-full h-full object-cover"
                    />
                  </div>
                  <div className="min-w-0">
                    <div className="text-sm font-medium line-clamp-1">{trek.title}</div>
                    <div className="text-xs text-muted-foreground">
                      {trek.duration} • {trek.difficulty}
                    </div>
                  </div>
                </div>
                <div className="flex items-center gap-2 flex-shrink-0">
                  {trek.featured && (
                    <span className="px-2 py-1 bg-accent/10 text-accent text-xs rounded-full flex items-center gap-1">
                      <ShieldCheck className="h-3 w-3" />
                      Featured
                    </span>
                  )}
                </div>
              </div>
            ))}
          </div>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.85 }}
          className="rounded-2xl border border-border bg-card p-6 shadow-sm"
        >
          <div className="mb-4 flex items-center justify-between gap-4">
            <div>
              <h2 className="font-heading text-xl mb-1">Activity Snapshot</h2>
              <p className="text-sm text-muted-foreground">A quick read on what is live right now.</p>
            </div>
          </div>
          <div className="space-y-4">
            <div className="flex items-center justify-between rounded-xl bg-muted/20 px-4 py-3">
              <span className="text-sm text-muted-foreground">Current notices</span>
              <span className="text-sm font-semibold">{notices.length}</span>
            </div>
            <div className="flex items-center justify-between rounded-xl bg-muted/20 px-4 py-3">
              <span className="text-sm text-muted-foreground">Open inquiries</span>
              <span className="text-sm font-semibold">{openLeads}</span>
            </div>
            <div className="flex items-center justify-between rounded-xl bg-muted/20 px-4 py-3">
              <span className="text-sm text-muted-foreground">Featured packages</span>
              <span className="text-sm font-semibold">{treks.filter((t) => t.featured).length}</span>
            </div>
            <div className="flex items-center justify-between rounded-xl bg-muted/20 px-4 py-3">
              <span className="text-sm text-muted-foreground">Live sync</span>
              <span className="text-sm font-semibold text-emerald-600">Realtime enabled</span>
            </div>
          </div>
        </motion.div>
        </div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 1 }}
          className="mt-8 rounded-2xl border border-border bg-card p-6 shadow-sm"
        >
          <div className="mb-4 flex items-center justify-between gap-4">
            <div>
              <h2 className="font-heading text-xl mb-1">Recent Leads</h2>
              <p className="text-sm text-muted-foreground">Latest booking, contact, and inquiry submissions.</p>
            </div>
            <Link to="/admin/dashboard/inquiries" className="inline-flex items-center gap-2 text-sm text-accent hover:underline">
              Open inquiries
              <ArrowRight className="h-4 w-4" />
            </Link>
          </div>

          {recentInquiries.length ? (
            <div className="space-y-3">
              {recentInquiries.map((item) => (
                <div key={item.id} className="flex flex-col gap-2 rounded-xl bg-muted/20 px-4 py-3 md:flex-row md:items-center md:justify-between">
                  <div className="min-w-0">
                    <div className="text-sm font-medium line-clamp-1">{item.name} • {item.email}</div>
                    <div className="text-xs text-muted-foreground line-clamp-1">{item.trek || "General inquiry"}</div>
                  </div>
                  <div className="flex items-center gap-2 text-xs">
                    <span className="rounded-full bg-accent/10 px-2 py-1 text-accent">{item.inquiryType}</span>
                    <span className="rounded-full bg-muted px-2 py-1 text-muted-foreground">{item.status}</span>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="rounded-xl bg-muted/20 px-4 py-8 text-sm text-muted-foreground">
              No leads submitted yet.
            </div>
          )}
        </motion.div>
      </motion.div>
    </div>
  );
}
