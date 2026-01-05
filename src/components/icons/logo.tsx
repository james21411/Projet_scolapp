export function Logo({ className, logoUrl }: { className?: string, logoUrl?: string | null }) {
  if (logoUrl) {
    return (
      <div className={className}>
        <img src={logoUrl} alt="Logo" className="h-8 w-8 rounded-lg object-cover" />
      </div>
    );
  }

  return (
    <div className={className}>
      <svg
        width="32"
        height="32"
        viewBox="0 0 32 32"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
        className="rounded-lg"
      >
        <rect width="32" height="32" rx="8" fill="hsl(var(--primary))" />
        <path
          d="M10 22V10L16 13L22 10V22L16 19L10 22Z"
          fill="hsl(var(--primary-foreground))"
        />
      </svg>
    </div>
  );
}
