import { storage } from "@/services/unstorage.js";
import { nextUsageInfo } from "./nextSummaryQuery.js";

export async function nextSummary() {
  const nextSummary = await nextUsageInfo();
  const CACHE_KEY = "next-usage";
  const cached = await storage.getItem<typeof nextSummary>(CACHE_KEY);

  if (cached) {
    return cached;
  }

  await storage.setItem<typeof nextSummary>(CACHE_KEY, nextSummary, {
    ttl: 60 * 60,
  });
  return nextSummary;
}
