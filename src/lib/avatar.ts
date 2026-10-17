export interface AvatarInfo {
  initials: string;
  bg: string;
  text: string;
}

export function getAvatarInfo(name?: string | null): AvatarInfo {
  if (!name || !name.trim()) {
    return { initials: "GR", bg: "bg-slate-100", text: "text-slate-700" };
  }

  const parts = name.trim().split(/\s+/);
  let initials = "";
  if (parts.length >= 2) {
    initials = (parts[0][0] + parts[1][0]).toUpperCase();
  } else if (parts.length === 1 && parts[0].length > 0) {
    initials = parts[0].slice(0, 2).toUpperCase();
  } else {
    initials = "GR";
  }

  const palette = [
    { bg: "bg-blue-100", text: "text-blue-700" },
    { bg: "bg-purple-100", text: "text-purple-700" },
    { bg: "bg-emerald-100", text: "text-emerald-700" },
    { bg: "bg-amber-100", text: "text-amber-800" },
    { bg: "bg-rose-100", text: "text-rose-700" },
    { bg: "bg-teal-100", text: "text-teal-700" },
    { bg: "bg-indigo-100", text: "text-indigo-700" },
  ];

  let hash = 0;
  for (let i = 0; i < name.length; i++) {
    hash = name.charCodeAt(i) + ((hash << 5) - hash);
  }
  const color = palette[Math.abs(hash) % palette.length];

  return { initials, ...color };
}
