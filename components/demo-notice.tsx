import type { ReactNode } from "react";
import { Badge, Card } from "@/components/ui";
import { cn } from "@/lib/utils";

export function DemoNotice({
  title,
  children,
  action,
  className,
}: {
  title: string;
  children: ReactNode;
  action?: ReactNode;
  className?: string;
}) {
  return (
    <Card className={cn("border-dashed bg-surface/40 p-5", className)}>
      <Badge tone="warning">Demo</Badge>
      <p className="mt-3 text-sm font-medium text-text">{title}</p>
      <div className="mt-1 text-sm leading-relaxed text-muted">{children}</div>
      {action ? <div className="mt-4">{action}</div> : null}
    </Card>
  );
}
