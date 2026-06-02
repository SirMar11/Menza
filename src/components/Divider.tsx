type Props = { label?: string };

export function Divider({ label }: Props) {
  return (
    <div className="flex items-center gap-3 my-1">
      <div className="flex-1 h-px bg-divider" />
      {label && <span className="text-muted text-xs">{label}</span>}
      <div className="flex-1 h-px bg-divider" />
    </div>
  );
}
