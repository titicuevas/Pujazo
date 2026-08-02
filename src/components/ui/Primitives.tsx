import type { ButtonHTMLAttributes, InputHTMLAttributes, ReactNode, SelectHTMLAttributes, TextareaHTMLAttributes } from "react";

export function Button({
  variant = "primary",
  className = "",
  ...props
}: ButtonHTMLAttributes<HTMLButtonElement> & {
  variant?: "primary" | "secondary" | "ghost" | "danger";
}) {
  const variants = {
    primary:
      "bg-lime text-on-lime hover:bg-lime-dim font-semibold shadow-[0_0_0_1px_rgba(200,245,42,0.35)]",
    secondary:
      "bg-pitch-800 text-ink border border-[var(--line)] hover:bg-pitch-700",
    ghost: "bg-transparent text-foam hover:text-ink hover:bg-pitch-800/60",
    danger: "bg-coral/20 text-coral border border-coral/50 hover:bg-coral/30",
  };

  return (
    <button
      className={`inline-flex items-center justify-center gap-2 rounded-md px-4 py-2.5 text-sm transition disabled:cursor-not-allowed disabled:opacity-50 ${variants[variant]} ${className}`}
      {...props}
    />
  );
}

export function Field({
  label,
  htmlFor,
  error,
  hint,
  children,
}: {
  label: string;
  htmlFor: string;
  error?: string;
  hint?: string;
  children: ReactNode;
}) {
  return (
    <div className="flex flex-col gap-1.5">
      <label htmlFor={htmlFor} className="text-sm font-medium text-foam">
        {label}
      </label>
      {children}
      {hint && !error ? (
        <p id={`${htmlFor}-hint`} className="text-xs text-mist">
          {hint}
        </p>
      ) : null}
      {error ? (
        <p id={`${htmlFor}-error`} role="alert" className="text-xs text-coral">
          {error}
        </p>
      ) : null}
    </div>
  );
}

const controlClass =
  "w-full rounded-md border border-[var(--line)] bg-pitch-950/70 px-3 py-2.5 text-sm text-ink placeholder:text-mist/60 transition hover:border-lime/30 focus:border-lime";

export function TextInput({
  className = "",
  ...props
}: InputHTMLAttributes<HTMLInputElement>) {
  return <input className={`${controlClass} ${className}`} {...props} />;
}

export function TextSelect({
  className = "",
  children,
  ...props
}: SelectHTMLAttributes<HTMLSelectElement>) {
  return (
    <select className={`${controlClass} ${className}`} {...props}>
      {children}
    </select>
  );
}

export function TextArea({
  className = "",
  ...props
}: TextareaHTMLAttributes<HTMLTextAreaElement>) {
  return (
    <textarea className={`${controlClass} min-h-24 ${className}`} {...props} />
  );
}

export function Badge({
  children,
  tone = "neutral",
}: {
  children: ReactNode;
  tone?: "neutral" | "safe" | "balanced" | "risky" | "lime";
}) {
  const tones = {
    neutral: "bg-pitch-800 text-foam border-[var(--line)]",
    safe: "bg-safe/20 text-safe border-safe/40",
    balanced: "bg-balanced/20 text-balanced border-balanced/40",
    risky: "bg-risky/20 text-risky border-risky/40",
    lime: "bg-lime/20 text-lime border-lime/40",
  };
  return (
    <span
      className={`inline-flex items-center rounded-md border px-2 py-0.5 text-xs font-semibold ${tones[tone]}`}
    >
      {children}
    </span>
  );
}

export function Panel({
  children,
  className = "",
}: {
  children: ReactNode;
  className?: string;
}) {
  return (
    <section
      className={`rounded-xl border border-[var(--line)] bg-[color:var(--panel)] p-4 sm:p-5 ${className}`}
    >
      {children}
    </section>
  );
}

export function ProgressBar({
  value,
  max,
  label,
}: {
  value: number;
  max: number;
  label: string;
}) {
  const pct = max <= 0 ? 0 : Math.min(100, Math.round((value / max) * 100));
  const over = value > max;
  return (
    <div className="flex flex-col gap-1" aria-label={label}>
      <div className="flex justify-between text-xs text-mist">
        <span>{label}</span>
        <span className={over ? "text-coral" : ""}>
          {value}/{max}
        </span>
      </div>
      <div
        className="h-2 overflow-hidden rounded-full bg-pitch-950"
        role="progressbar"
        aria-valuenow={value}
        aria-valuemin={0}
        aria-valuemax={max}
        aria-label={label}
      >
        <div
          className={`h-full rounded-full transition-all ${over ? "bg-coral" : "bg-lime"}`}
          style={{ width: `${Math.min(pct, 100)}%` }}
        />
      </div>
    </div>
  );
}

export function RiskBadge({ level }: { level: "bajo" | "medio" | "alto" }) {
  const tone =
    level === "bajo" ? "safe" : level === "medio" ? "balanced" : "risky";
  const label =
    level === "bajo" ? "Riesgo bajo" : level === "medio" ? "Riesgo medio" : "Riesgo alto";
  return <Badge tone={tone}>{label}</Badge>;
}
