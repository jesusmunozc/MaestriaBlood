import { Droplets } from "lucide-react";

interface Props {
  size?: number;
  animate?: boolean;
  className?: string;
}

// ─── BloodDropIcon — SRP: only renders the animated blood drop ─────────────────
export default function BloodDropIcon({
  size = 48,
  animate = false,
  className = "",
}: Props) {
  return (
    <div
      className={`inline-flex items-center justify-center ${
        animate ? "blood-drop-animate" : ""
      } ${className}`}
    >
      <Droplets
        style={{ width: size, height: size }}
        className="text-blood-500 drop-shadow-[0_0_8px_rgba(244,63,94,0.6)]"
      />
    </div>
  );
}
