"use client";

import { useEffect, useState } from "react";
import { listMutations, MUTATION_QUEUE_CHANGED_EVENT } from "@/lib/offline/mutation-queue";

export function usePendingMutationCount(): number {
  const [count, setCount] = useState(0);

  useEffect(() => {
    function refresh() {
      void listMutations().then((items) => setCount(items.length));
    }
    refresh();
    window.addEventListener(MUTATION_QUEUE_CHANGED_EVENT, refresh);
    window.addEventListener("online", refresh);
    const interval = setInterval(refresh, 5000);
    return () => {
      window.removeEventListener(MUTATION_QUEUE_CHANGED_EVENT, refresh);
      window.removeEventListener("online", refresh);
      clearInterval(interval);
    };
  }, []);

  return count;
}
