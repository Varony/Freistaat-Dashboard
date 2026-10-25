const siteUrl = (
  process.env.NEXT_PUBLIC_SITE_URL?.trim() ||
  "https://freistaat-dashboard.vercel.app"
).replace(/\/$/, "");

export const siteConfig = {
  name: "Freistaat",
  claim: "Demokratie-Simulation im Discord",
  description:
    "Wahlen, Bürgerbegehren und Gesetze des Freistaats an einem Ort. Der Prototyp zeigt die geplanten Bereiche mit Beispieldaten.",
  url: siteUrl,
  discordUrl: "https://discord.gg/DDXsES9DG",
  nav: [
    { href: "/", label: "Übersicht" },
    { href: "/wahlen", label: "Wahlen" },
    { href: "/buergerbegehren", label: "Bürgerbegehren" },
    { href: "/gesetze", label: "Gesetze" },
    { href: "/parteien", label: "Parteien" },
  ],
} as const;
