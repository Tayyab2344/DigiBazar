/**
 * Format integer cents to currency string.
 * e.g., 1249900 → "Rs 12,499.00" (PKR) or "$12,499.00" (USD)
 */
export function formatCents(
  amount: number,
  currency: string = "PKR"
): string {
  const value = amount / 100;
  const prefix = currency === "PKR" ? "Rs " : "$";

  return (
    prefix +
    value.toLocaleString("en-US", {
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    })
  );
}

/**
 * Format cents compactly for metrics.
 * e.g., 12499900 → "Rs 124.9K"
 */
export function formatCentsCompact(
  amount: number,
  currency: string = "PKR"
): string {
  const value = amount / 100;
  const prefix = currency === "PKR" ? "Rs " : "$";

  if (value >= 1_000_000) {
    return prefix + (value / 1_000_000).toFixed(1).replace(/\.0$/, "") + "M";
  }
  if (value >= 1_000) {
    return prefix + (value / 1_000).toFixed(1).replace(/\.0$/, "") + "K";
  }
  return prefix + value.toLocaleString("en-US", { maximumFractionDigits: 0 });
}

/**
 * Format a date string to a readable format.
 * e.g., "2026-08-22T10:30:00" → "Aug 22, 2026"
 */
export function formatDate(dateStr: string): string {
  const date = new Date(dateStr);
  return date.toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
  });
}

/**
 * Format a date string to include time.
 * e.g., "2026-08-22T10:30:00" → "Aug 22, 2026 10:30 AM"
 */
export function formatDateTime(dateStr: string): string {
  const date = new Date(dateStr);
  return date.toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
    hour: "numeric",
    minute: "2-digit",
    hour12: true,
  });
}

/**
 * Format relative time.
 * e.g., "2 hours ago", "3 days ago", "just now"
 */
export function formatRelativeTime(dateStr: string): string {
  const now = Date.now();
  const date = new Date(dateStr).getTime();
  const diff = now - date;

  const seconds = Math.floor(diff / 1000);
  const minutes = Math.floor(seconds / 60);
  const hours = Math.floor(minutes / 60);
  const days = Math.floor(hours / 24);

  if (seconds < 60) return "just now";
  if (minutes < 60) return `${minutes}m ago`;
  if (hours < 24) return `${hours}h ago`;
  if (days < 7) return `${days}d ago`;
  if (days < 30) return `${Math.floor(days / 7)}w ago`;

  return formatDate(dateStr);
}

/**
 * Format a number with locale separators.
 * e.g., 2431 → "2,431"
 */
export function formatNumber(n: number): string {
  return n.toLocaleString("en-US");
}

/**
 * Format a compact number.
 * e.g., 124800 → "124.8K"
 */
export function formatNumberCompact(n: number): string {
  if (n >= 1_000_000) {
    return (n / 1_000_000).toFixed(1).replace(/\.0$/, "") + "M";
  }
  if (n >= 1_000) {
    return (n / 1_000).toFixed(1).replace(/\.0$/, "") + "K";
  }
  return n.toString();
}

/**
 * Calculate and format percent change between two values.
 * Returns e.g., "+12.4%" or "-3.1%"
 */
export function formatPercentChange(
  current: number,
  previous: number
): { text: string; isPositive: boolean; isZero: boolean } {
  if (previous === 0) {
    if (current === 0) return { text: "0%", isPositive: false, isZero: true };
    return { text: "+100%", isPositive: true, isZero: false };
  }

  const change = ((current - previous) / previous) * 100;
  const isPositive = change > 0;
  const isZero = change === 0;
  const prefix = isPositive ? "+" : "";

  return {
    text: `${prefix}${change.toFixed(1)}%`,
    isPositive,
    isZero,
  };
}

/**
 * Truncate a string with ellipsis.
 */
export function truncate(str: string, length: number): string {
  if (str.length <= length) return str;
  return str.slice(0, length) + "…";
}

/**
 * Generate initials from a name.
 * e.g., "John Smith" → "JS"
 */
export function getInitials(name: string): string {
  return name
    .split(" ")
    .map((n) => n[0])
    .filter(Boolean)
    .slice(0, 2)
    .join("")
    .toUpperCase();
}

/**
 * Debounce a function call.
 */
export function debounce<T extends (...args: unknown[]) => unknown>(
  fn: T,
  delay: number
): (...args: Parameters<T>) => void {
  let timer: ReturnType<typeof setTimeout>;
  return (...args: Parameters<T>) => {
    clearTimeout(timer);
    timer = setTimeout(() => fn(...args), delay);
  };
}

/**
 * Generate an order display ID from a UUID.
 * e.g., "abc123..." → "#CH-ABC12"
 */
export function formatOrderId(id: string): string {
  return "#CH-" + id.slice(0, 5).toUpperCase();
}

/**
 * Classify a status for visual styling.
 */
export function getStatusVariant(
  status: string
): "success" | "warning" | "danger" | "info" | "neutral" {
  const s = status.toLowerCase();
  if (["active", "paid", "delivered", "approved", "published", "sent", "resolved"].includes(s))
    return "success";
  if (["pending", "processing", "under_review", "draft", "paused"].includes(s))
    return "warning";
  if (["failed", "rejected", "blocked", "cancelled", "refunded", "suspended", "disabled"].includes(s))
    return "danger";
  if (["confirmed", "shipped"].includes(s)) return "info";
  return "neutral";
}
