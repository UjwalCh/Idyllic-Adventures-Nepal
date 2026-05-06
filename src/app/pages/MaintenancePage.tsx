import { motion } from "motion/react";
import { Mountain, Construction, Settings, Hammer, Clock } from "lucide-react";
import { useBranding } from "../data/useBranding";

export function MaintenancePage() {
  const { settings } = useBranding();

  return (
    <div className="min-h-screen bg-background flex flex-col items-center justify-center p-6 text-center">
      <motion.div
        initial={{ opacity: 0, scale: 0.9 }}
        animate={{ opacity: 1, scale: 1 }}
        className="max-w-2xl"
      >
        <div className="relative mb-12">
          <motion.div
            animate={{ rotate: 360 }}
            transition={{ duration: 10, repeat: Infinity, ease: "linear" }}
            className="absolute -top-8 -left-8 text-accent/10"
          >
            <Settings className="w-32 h-32" />
          </motion.div>
          <motion.div
            animate={{ rotate: -360 }}
            transition={{ duration: 15, repeat: Infinity, ease: "linear" }}
            className="absolute -bottom-8 -right-8 text-primary/10"
          >
            <Construction className="w-40 h-40" />
          </motion.div>
          
          <div className="relative z-10 w-48 h-48 bg-white rounded-[2.5rem] flex items-center justify-center mx-auto shadow-2xl shadow-primary/10 overflow-hidden border border-border">
            {settings.site_logo ? (
              <img src={settings.site_logo} alt="Site Logo" className="w-full h-full object-contain p-4" />
            ) : (
              <Mountain className="w-20 h-20 text-primary" />
            )}
          </div>
        </div>

        <h1 className="font-heading text-6xl text-primary mb-6">Summit in Progress</h1>
        <p className="text-xl text-muted-foreground leading-relaxed mb-10 max-w-lg mx-auto">
          We're currently updating our base camp to bring you a better Himalayan experience. We'll be back on the trail very soon.
        </p>

        <div className="flex flex-wrap items-center justify-center gap-6">
          <div className="flex items-center gap-3 px-6 py-3 bg-muted rounded-2xl border border-border">
            <Hammer className="w-5 h-5 text-accent" />
            <span className="text-sm font-bold uppercase tracking-widest text-primary">Upgrading Systems</span>
          </div>
          <div className="flex items-center gap-3 px-6 py-3 bg-muted rounded-2xl border border-border">
            <Clock className="w-5 h-5 text-accent" />
            <span className="text-sm font-bold uppercase tracking-widest text-primary">Returning Soon</span>
          </div>
        </div>

        <div className="mt-20 pt-10 border-t border-border">
          <p className="text-xs font-bold uppercase tracking-[0.3em] text-muted-foreground/40">Idyllic Adventures Nepal</p>
        </div>
      </motion.div>
    </div>
  );
}
