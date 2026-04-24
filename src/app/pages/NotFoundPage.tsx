import { Link } from "react-router";
import { motion } from "motion/react";
import { Home, ArrowLeft } from "lucide-react";

export function NotFoundPage() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-muted/30 to-background">
      <div className="container mx-auto px-4">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
          className="text-center max-w-2xl mx-auto"
        >
          <div className="mb-8">
            <motion.div
              initial={{ scale: 0.8 }}
              animate={{ scale: 1 }}
              transition={{
                duration: 0.5,
                type: "spring",
                stiffness: 200,
                damping: 10,
              }}
              className="font-heading text-9xl md:text-[200px] text-primary/20 mb-4"
            >
              404
            </motion.div>
            <h1 className="font-heading text-4xl md:text-5xl mb-4">
              Lost in the Mountains?
            </h1>
            <p className="text-lg text-muted-foreground mb-8">
              The page you're looking for doesn't exist. Let's get you back on track.
            </p>
          </div>

          <div className="flex flex-wrap items-center justify-center gap-4">
            <Link
              to="/"
              className="inline-flex items-center gap-2 px-6 py-3 bg-accent text-accent-foreground rounded-lg hover:bg-accent/90 transition-colors"
            >
              <Home className="w-5 h-5" />
              <span>Go Home</span>
            </Link>
            <button
              onClick={() => window.history.back()}
              className="inline-flex items-center gap-2 px-6 py-3 bg-muted text-foreground rounded-lg hover:bg-muted/80 transition-colors"
            >
              <ArrowLeft className="w-5 h-5" />
              <span>Go Back</span>
            </button>
          </div>

          <div className="mt-12">
            <p className="text-sm text-muted-foreground mb-4">
              Or explore our popular treks:
            </p>
            <div className="flex flex-wrap justify-center gap-3">
              <Link
                to="/treks/1"
                className="px-4 py-2 bg-card border border-border rounded-lg hover:border-accent transition-colors text-sm"
              >
                Everest Base Camp
              </Link>
              <Link
                to="/treks/2"
                className="px-4 py-2 bg-card border border-border rounded-lg hover:border-accent transition-colors text-sm"
              >
                Annapurna Circuit
              </Link>
              <Link
                to="/treks"
                className="px-4 py-2 bg-card border border-border rounded-lg hover:border-accent transition-colors text-sm"
              >
                View All Treks
              </Link>
            </div>
          </div>
        </motion.div>
      </div>
    </div>
  );
}
