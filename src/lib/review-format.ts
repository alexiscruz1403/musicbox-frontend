export function ratingColor(r: number): string {
  if (r >= 8) return "#A78BFA";
  if (r >= 5) return "#7C6CAD";
  return "#4A4265";
}

export function getInitials(name: string | null | undefined): string {
  if (!name) return "?";
  return name
    .split(" ")
    .slice(0, 2)
    .map((w) => w[0]?.toUpperCase() ?? "")
    .join("");
}

export function timeAgo(iso: string): string {
  const diff = Date.now() - new Date(iso).getTime();
  const mins = Math.floor(diff / 60000);
  if (mins < 60) return `hace ${mins}m`;
  const hours = Math.floor(mins / 60);
  if (hours < 24) return `hace ${hours}h`;
  const days = Math.floor(hours / 24);
  return `hace ${days}d`;
}

export function coverGradient(seed: string): string {
  const h = seed.split("").reduce((a, c) => a + c.charCodeAt(0), 0);
  const hues = [258, 280, 240, 300, 220];
  const hue = hues[h % hues.length];
  return `linear-gradient(135deg, hsl(${hue},60%,20%) 0%, hsl(${hue + 20},40%,12%) 100%)`;
}

export interface RankDeltaMeta {
  text: string;
  color: string;
  icon: string;
  ariaLabel: string;
}

export function rankDeltaMeta(rankChange: number | null): RankDeltaMeta {
  if (rankChange == null) {
    return { text: "Nuevo", color: "#8B56E8", icon: "✦", ariaLabel: "Nuevo ingreso al ranking" };
  }
  if (rankChange === 0) {
    return { text: "=", color: "#5C5670", icon: "", ariaLabel: "Se mantuvo en el mismo puesto" };
  }
  if (rankChange > 0) {
    return {
      text: `+${rankChange}`,
      color: "#4ADE80",
      icon: "▲",
      ariaLabel: `Subió ${rankChange} puesto${rankChange !== 1 ? "s" : ""}`,
    };
  }
  return {
    text: String(rankChange),
    color: "#F87171",
    icon: "▼",
    ariaLabel: `Bajó ${Math.abs(rankChange)} puesto${Math.abs(rankChange) !== 1 ? "s" : ""}`,
  };
}

export function formatMs(ms: number): string {
  const total = Math.round(ms / 1000);
  const m = Math.floor(total / 60);
  const s = total % 60;
  return `${m}:${s.toString().padStart(2, "0")}`;
}
