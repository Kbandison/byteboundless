"use client";

import { useState, useEffect } from "react";
import { createClient } from "@/lib/supabase/client";

export type Plan = "free" | "pro" | "agency";

export function usePlan(): Plan {
  const [plan, setPlan] = useState<Plan>("free");

  useEffect(() => {
    async function fetch() {
      const supabase = createClient();
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;
      const { data } = await supabase.from("profiles").select("plan").eq("id", user.id).single();
      if (data) setPlan((data as { plan: Plan }).plan);
    }
    fetch();
  }, []);

  return plan;
}

export function isPaidPlan(plan: Plan): boolean {
  return plan === "pro" || plan === "agency";
}
