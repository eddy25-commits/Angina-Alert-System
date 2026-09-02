"use client";

import { useEffect, useRef } from "react";
import { markAlertOpened } from "./actions";

export default function MarkOpened({ alertId }: { alertId: string }) {
  const done = useRef(false);
  useEffect(() => {
    if (done.current) return;
    done.current = true;
    markAlertOpened(alertId);
  }, [alertId]);
  return null;
}
