import { useEffect, useState } from "react";

const KEY = "digikala-aed-rate";
const DEFAULT_RATE = 16000;

export function useAedRate() {
  const [rate, setRate] = useState<number>(DEFAULT_RATE);

  useEffect(() => {
    try {
      const raw = localStorage.getItem(KEY);
      if (raw) {
        const n = Number(raw);
        if (n > 0) setRate(n);
      }
    } catch {}
  }, []);

  const update = (n: number) => {
    setRate(n);
    try { localStorage.setItem(KEY, String(n)); } catch {}
  };

  return { rate, setRate: update };
}
