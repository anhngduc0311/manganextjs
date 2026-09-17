/**
 * Helper to format date into Vietnamese relative time string like TruyenGG
 * e.g. "Vừa xong", "15 phút trước", "2 giờ trước", "1 ngày trước", "2 tuần trước", "1 tháng trước"
 */
export function formatTimeAgoVi(dateInput?: string | Date | number | null): string {
  if (!dateInput) return "";
  const date = typeof dateInput === "string" || typeof dateInput === "number" ? new Date(dateInput) : dateInput;
  if (!date || isNaN(date.getTime())) return "";

  const now = new Date();
  const diffMs = now.getTime() - date.getTime();
  
  if (diffMs < 0) return "Vừa xong";
  
  const diffSec = Math.floor(diffMs / 1000);
  const diffMin = Math.floor(diffSec / 60);
  const diffHour = Math.floor(diffMin / 60);
  const diffDay = Math.floor(diffHour / 24);
  const diffMonth = Math.floor(diffDay / 30);
  const diffYear = Math.floor(diffDay / 365);

  if (diffMin < 1) return "Vừa xong";
  if (diffMin < 60) return `${diffMin} phút trước`;
  if (diffHour < 24) return `${diffHour} giờ trước`;
  if (diffDay < 30) return `${diffDay} ngày trước`;
  if (diffMonth < 12) return `${diffMonth} tháng trước`;
  return `${diffYear} năm trước`;
}

