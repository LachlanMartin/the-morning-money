"use client";

import { useEffect, useState } from "react";
import { useSearchParams } from "next/navigation";

export function UpgradeToast() {
  const searchParams = useSearchParams();
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    if (searchParams.get("upgraded") === "true") {
      setVisible(true);
      const timer = setTimeout(() => setVisible(false), 6000);
      return () => clearTimeout(timer);
    }
  }, [searchParams]);

  if (!visible) return null;

  return (
    <div className="fixed top-20 right-6 z-50 animate-in fade-in slide-in-from-top-2">
      <div className="bg-green-50 dark:bg-green-950 border border-green-200 dark:border-green-800 rounded-lg px-4 py-3 shadow-lg max-w-sm">
        <p className="text-sm font-medium text-green-800 dark:text-green-200">
          Welcome to Pro! Your plan has been upgraded.
        </p>
      </div>
    </div>
  );
}
