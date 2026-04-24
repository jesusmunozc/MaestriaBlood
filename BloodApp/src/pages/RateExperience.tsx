import { useState, useEffect } from "react";
import { useNavigate, useParams, useSearchParams } from "react-router-dom";
import { Shield } from "lucide-react";
import PageHeader from "../components/PageHeader";
import StarRating from "../components/StarRating";
import Button from "../components/Button";
import { submitRating } from "../lib/ratings";
import { getProfileById } from "../lib/profiles";
import { useApp } from "../contexts/AppContext";
import type { Profile } from "../types";

// ─── RateExperience ────────────────────────────────────────────────────────────
export default function RateExperience() {
  const { userId } = useParams<{ userId: string }>();
  const [searchParams] = useSearchParams();
  const donationId = searchParams.get("donationId") ?? "";
  const navigate = useNavigate();
  const { authUser } = useApp();
  const [ratedUser, setRatedUser] = useState<Profile | null>(null);
  const [stars, setStars] = useState(0);
  const [comment, setComment] = useState("");
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    if (!userId) return;
    getProfileById(userId).then(({ data }) => setRatedUser(data));
  }, [userId]);

  async function handleSubmit() {
    if (!authUser?.id || !userId || stars === 0) return;
    setSubmitting(true);
    await submitRating({
      rater_id: authUser.id,
      rated_id: userId,
      donation_id: donationId ? donationId : undefined,
      stars,
      comment,
    });
    setSubmitting(false);
    navigate("/home");
  }

  return (
    <div className="min-h-screen bg-[#0f0f0f] flex flex-col pb-28 page-enter">
      <PageHeader title="Calificar experiencia" onBack={() => navigate(-1)} />

      <div className="flex-1 flex flex-col items-center px-6 pt-6">
        {/* Rated user */}
        <div className="w-20 h-20 rounded-2xl bg-[#1a1a2e] border border-white/10 flex items-center justify-center text-3xl font-extrabold text-white mb-3">
          {ratedUser?.full_name?.charAt(0) ?? "?"}
        </div>
        <p className="text-white font-bold text-lg">
          {ratedUser?.full_name ?? "Usuario"}
        </p>
        <p className="text-white/40 text-sm mb-6">
          @{ratedUser?.username ?? "..."}
        </p>

        {/* Impartiality notice */}
        <div className="w-full bg-[#1a1a2e] border border-white/8 rounded-2xl p-4 mb-6 flex items-start gap-3">
          <div className="w-8 h-8 rounded-xl bg-blood-900/40 flex items-center justify-center shrink-0">
            <Shield className="w-4 h-4 text-blood-400" />
          </div>
          <p className="text-white/50 text-xs leading-relaxed">
            Tu calificación es{" "}
            <span className="text-white font-semibold">
              anónima e imparcial
            </span>
            . Ayuda a construir una comunidad de confianza. Sé honesto/a con tu
            experiencia.
          </p>
        </div>

        {/* Stars */}
        <p className="text-white/40 text-sm mb-3">¿Cómo fue tu experiencia?</p>
        <StarRating value={stars} onChange={setStars} size={36} />

        {/* Comment */}
        <div className="w-full mt-6">
          <textarea
            value={comment}
            onChange={(e) => setComment(e.target.value)}
            placeholder="Comentario opcional..."
            rows={4}
            className="w-full bg-[#1a1a2e] border border-white/10 rounded-2xl px-4 py-3 text-white text-sm placeholder-white/25 resize-none focus:outline-none focus:border-blood-600/50 transition-colors"
          />
        </div>
      </div>

      <div className="fixed bottom-0 left-0 right-0 px-5 py-4 flex flex-col gap-2 bg-[#0f0f0f]/95 backdrop-blur-xl border-t border-white/8">
        <Button
          variant="primary"
          size="lg"
          fullWidth
          disabled={stars === 0}
          loading={submitting}
          onClick={handleSubmit}
        >
          Enviar calificación
        </Button>
        <Button
          variant="ghost"
          size="md"
          fullWidth
          onClick={() => navigate("/home")}
        >
          Omitir
        </Button>
      </div>
    </div>
  );
}
