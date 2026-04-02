import { useEffect, useState } from "react";
import { animate } from "framer-motion";

export function useCountUp(
  target: number,
  duration = 1.5,
  delay = 0,
  start = 0
) {
  const [count, setCount] = useState(start);

  useEffect(() => {
    let timeoutId: NodeJS.Timeout;

    const startAnimation = () => {
      const controls = animate(start, target, {
        duration,
        ease: "easeOut",
        onUpdate(value) {
          setCount(Math.round(value));
        },
      });
      return controls.stop;
    };

    if (delay > 0) {
      timeoutId = setTimeout(() => {
        startAnimation();
      }, delay * 1000);
    } else {
      const stop = startAnimation();
      return () => stop();
    }

    return () => clearTimeout(timeoutId);
  }, [target, duration, delay, start]);

  return count;
}
