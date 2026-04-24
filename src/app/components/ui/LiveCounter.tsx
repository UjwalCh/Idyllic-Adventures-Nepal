import { useEffect, useState, useRef } from "react";
import { useInView } from "motion/react";

export function LiveCounter({ targetValue, suffix = "" }: { targetValue: string, suffix?: string }) {
  const [count, setCount] = useState(0);
  const ref = useRef(null);
  const isInView = useInView(ref, { once: true, margin: "-50px" });

  const numValue = parseInt(targetValue.replace(/[^0-9]/g, ""), 10) || 0;
  const targetSuffix = targetValue.replace(/[0-9]/g, "") || suffix;

  useEffect(() => {
    if (isInView && numValue > 0) {
      let startTimestamp: number | null = null;
      const duration = 2000; // 2 seconds

      const step = (timestamp: number) => {
        if (!startTimestamp) startTimestamp = timestamp;
        const progress = Math.min((timestamp - startTimestamp) / duration, 1);
        
        // easeOutQuart
        const easeProgress = 1 - Math.pow(1 - progress, 4);
        
        setCount(Math.floor(easeProgress * numValue));

        if (progress < 1) {
          window.requestAnimationFrame(step);
        }
      };

      window.requestAnimationFrame(step);
    }
  }, [isInView, numValue]);

  return <span ref={ref}>{isInView ? count : 0}{targetSuffix}</span>;
}