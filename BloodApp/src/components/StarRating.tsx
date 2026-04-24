import { useState } from "react";
import { Star } from "lucide-react";

interface Props {
  value: number;
  onChange: (stars: number) => void;
  size?: number;
}

// ─── StarRating — SRP: only handles star rating interaction ───────────────────
export default function StarRating({ value, onChange, size = 36 }: Props) {
  const [hovered, setHovered] = useState(0);

  return (
    <div className="flex items-center gap-2">
      {[1, 2, 3, 4, 5].map((star) => {
        const isFilled = star <= (hovered || value);
        return (
          <button
            key={star}
            type="button"
            className="star-btn transition-all duration-150"
            onMouseEnter={() => setHovered(star)}
            onMouseLeave={() => setHovered(0)}
            onClick={() => onChange(star)}
          >
            <Star
              style={{ width: size, height: size }}
              className={
                isFilled
                  ? "fill-amber-400 text-amber-400 scale-110"
                  : "text-white/20"
              }
            />
          </button>
        );
      })}
    </div>
  );
}
