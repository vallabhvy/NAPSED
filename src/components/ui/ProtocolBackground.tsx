interface ProtocolBackgroundProps {
  opacityClassName?: string;
}

/** Braun Functionalism: No decorative atmosphere. The matte cashmere surface is the background. */
export function ProtocolBackground({
  opacityClassName = "opacity-100",
}: ProtocolBackgroundProps) {
  return (
    <div
      className={`fixed inset-0 pointer-events-none overflow-hidden select-none z-0 ${opacityClassName}`}
      aria-hidden
    >
      <div className="absolute inset-0 bg-theme-base" />
      <div 
        className="absolute inset-0"
        style={{
          backgroundImage: 'radial-gradient(circle at center, var(--theme-ink) 1.5px, transparent 1.5px)',
          backgroundSize: '24px 24px',
          opacity: 0.08
        }}
      />
    </div>
  );
}
