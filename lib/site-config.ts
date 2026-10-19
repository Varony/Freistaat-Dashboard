export const siteConfig = {
  name: "Freistaat",
  claim: "Demokratie-Simulation im Discord",
  description:
    "Wahlen, Bürgerbegehren und Gesetze des Freistaats an einem Ort. Der Prototyp zeigt die geplanten Bereiche mit Beispieldaten.",
  discordUrl: "#",
  nav: [
    { href: "/", label: "Übersicht" },
    { href: "/wahlen", label: "Wahlen" },
    { href: "/buergerbegehren", label: "Bürgerbegehren" },
    { href: "/gesetze", label: "Gesetze" },
    { href: "/parteien", label: "Parteien" },
  ],
} as const;
