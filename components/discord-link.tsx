import { IconExternal } from "@/components/icons";
import { siteConfig } from "@/lib/site-config";

export function DiscordLink({
  className,
  label = "Discord beitreten",
}: {
  className?: string;
  label?: string;
}) {
  return (
    <a
      href={siteConfig.discordUrl}
      target="_blank"
      rel="noreferrer"
      className={className}
    >
      {label}
      <IconExternal className="h-3.5 w-3.5" />
    </a>
  );
}
