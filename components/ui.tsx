import type { ReactNode } from "react";
import { cn } from "@/lib/utils";

export function Container({
  children,
  className,
}: {
  children: ReactNode;
  className?: string;
}) {
  return (
    <div className={cn("mx-auto w-full max-w-6xl px-5 sm:px-8", className)}>
      {children}
    </div>
  );
}

export function Card({
  children,
  className,
}: {
  children: ReactNode;
  className?: string;
}) {
  return (
    <div
      className={cn(
        "rounded-card border border-border bg-surface",
        className,
      )}
    >
      {children}
    </div>
  );
}

type Tone = "default" | "success" | "warning" | "danger" | "accent";

const badgeTones: Record<Tone, string> = {
  default: "border-border bg-surface-2 text-muted",
  success: "border-success/30 bg-success/10 text-success",
  warning: "border-warning/30 bg-warning/10 text-warning",
  danger: "border-danger/30 bg-danger/10 text-danger",
  accent: "border-accent/25 bg-accent/10 text-accent",
};

export function Badge({
  children,
  tone = "default",
  className,
}: {
  children: ReactNode;
  tone?: Tone;
  className?: string;
}) {
  return (
    <span
      className={cn(
        "inline-flex items-center gap-1.5 rounded-full border px-2.5 py-1 text-[11px] font-medium tracking-wide",
        badgeTones[tone],
        className,
      )}
    >
      {children}
    </span>
  );
}

export function Progress({
  value,
  max,
  tone = "accent",
  className,
}: {
  value: number;
  max: number;
  tone?: "accent" | "success" | "danger";
  className?: string;
}) {
  const percentage = max > 0 ? Math.min(100, Math.round((value / max) * 100)) : 0;
  const tones = {
    accent: "bg-accent",
    success: "bg-success",
    danger: "bg-danger",
  };

  return (
    <div
      className={cn("h-1.5 w-full overflow-hidden rounded-full bg-surface-2", className)}
      role="progressbar"
      aria-valuenow={percentage}
      aria-valuemin={0}
      aria-valuemax={100}
    >
      <div
        className={cn("h-full rounded-full transition-[width]", tones[tone])}
        style={{ width: `${percentage}%` }}
      />
    </div>
  );
}

export function Avatar({
  initials,
  size = "md",
  className,
}: {
  initials: string;
  size?: "sm" | "md" | "lg";
  className?: string;
}) {
  const sizes = {
    sm: "h-8 w-8 text-[11px]",
    md: "h-10 w-10 text-sm",
    lg: "h-14 w-14 text-base",
  };

  return (
    <span
      className={cn(
        "inline-grid shrink-0 place-items-center rounded-full border border-border bg-surface-2 font-medium text-muted",
        sizes[size],
        className,
      )}
      aria-hidden="true"
    >
      {initials}
    </span>
  );
}

export function Stat({
  value,
  label,
  hint,
}: {
  value: ReactNode;
  label: string;
  hint?: string;
}) {
  return (
    <div className="rounded-card border border-border bg-surface p-5">
      <p className="text-2xl font-semibold tracking-tight text-text sm:text-3xl">
        {value}
      </p>
      <p className="mt-1 text-sm text-muted">{label}</p>
      {hint ? <p className="mt-1 text-xs text-faint">{hint}</p> : null}
    </div>
  );
}

export function SectionHeading({
  eyebrow,
  title,
  description,
  action,
}: {
  eyebrow?: string;
  title: string;
  description?: string;
  action?: ReactNode;
}) {
  return (
    <div className="flex flex-wrap items-end justify-between gap-4">
      <div className="max-w-2xl">
        {eyebrow ? (
          <p className="mb-2 text-[11px] font-medium uppercase tracking-[0.18em] text-faint">
            {eyebrow}
          </p>
        ) : null}
        <h2 className="text-xl font-semibold tracking-tight text-text sm:text-2xl">
          {title}
        </h2>
        {description ? (
          <p className="mt-2 text-sm leading-relaxed text-muted">{description}</p>
        ) : null}
      </div>
      {action ? <div className="shrink-0">{action}</div> : null}
    </div>
  );
}

type ButtonVariant = "primary" | "secondary" | "ghost" | "danger";
type ButtonSize = "sm" | "md" | "lg";

export function buttonClasses(
  variant: ButtonVariant = "primary",
  size: ButtonSize = "md",
  className?: string,
) {
  const base =
    "inline-flex items-center justify-center gap-2 rounded-full font-medium transition-colors disabled:pointer-events-none disabled:opacity-50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent/50 focus-visible:ring-offset-2 focus-visible:ring-offset-bg";

  const variants: Record<ButtonVariant, string> = {
    primary: "bg-accent text-accent-contrast hover:bg-accent/90",
    secondary:
      "border border-border bg-surface text-text hover:border-border hover:bg-surface-2",
    ghost: "text-muted hover:bg-surface-2 hover:text-text",
    danger: "border border-danger/30 bg-danger/10 text-danger hover:bg-danger/15",
  };

  const sizes: Record<ButtonSize, string> = {
    sm: "h-9 px-4 text-sm",
    md: "h-11 px-5 text-sm",
    lg: "h-12 px-6 text-[15px]",
  };

  return cn(base, variants[variant], sizes[size], className);
}

export function EmptyState({
  title,
  description,
}: {
  title: string;
  description: string;
}) {
  return (
    <div className="rounded-card border border-dashed border-border bg-surface/40 p-8 text-center">
      <p className="text-sm font-medium text-text">{title}</p>
      <p className="mt-1 text-sm text-muted">{description}</p>
    </div>
  );
}
