"use client";

import { useEffect, useState } from "react";
import ComplaintDashboardWidget from "@/components/complaint/complaint-dashboard-widget";
import type { ComplaintFiling } from "@/types";

export default function ComplaintDashboardWidgetWrapper() {
  const [filings, setFilings] = useState<ComplaintFiling[]>([]);

  useEffect(() => {
    fetch("/api/complaint/list")
      .then((res) => res.json())
      .then((data) => setFilings(data.filings || []))
      .catch(() => {});
  }, []);

  return <ComplaintDashboardWidget filings={filings} />;
}
