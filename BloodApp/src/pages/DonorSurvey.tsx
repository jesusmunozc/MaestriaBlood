import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Heart, Check, ArrowRight } from "lucide-react";
import Button from "../components/Button";
import { saveAptitudeSurvey } from "../lib/auth";
import { evaluateAptitude } from "../lib/utils";
import { useApp } from "../contexts/AppContext";
import type { AptitudeSurveyAnswers } from "../types";

// ─── Survey questions definition ─────────────────────────────────────────────
const QUESTIONS: { key: keyof AptitudeSurveyAnswers; text: string }[] = [
  { key: "q1_age_range", text: "¿Tienes entre 18 y 65 años?" },
  { key: "q2_weight", text: "¿Pesas más de 50 kg?" },
  {
    key: "q3_recent_donation",
    text: "¿Has donado sangre en los últimos 3 meses?",
  },
  {
    key: "q4_infectious",
    text: "¿Has tenido alguna enfermedad infecciosa recientemente (hepatitis, VIH, sífilis u otras de transmisión sanguínea)?",
  },
  {
    key: "q5_medication",
    text: "¿Estás tomando algún medicamento actualmente?",
  },
  {
    key: "q6_vaccine",
    text: "¿Has recibido alguna vacuna en las últimas 4 semanas?",
  },
  {
    key: "q7_risk_behavior",
    text: "¿Has realizado alguna conducta de riesgo en los últimos 12 meses (tatuajes, piercings, transfusiones)?",
  },
  {
    key: "q8_good_health",
    text: "¿Estás en buen estado de salud general hoy?",
  },
];

// ─── DonorSurvey page ─────────────────────────────────────────────────────────
export default function DonorSurvey() {
  const navigate = useNavigate();
  const { authUser, updateLocalProfile } = useApp();

  const [answers, setAnswers] = useState<Partial<AptitudeSurveyAnswers>>({});
  const [showResult, setShowResult] = useState(false);
  const [loading, setLoading] = useState(false);

  function setAnswer(key: keyof AptitudeSurveyAnswers, value: boolean) {
    setAnswers((prev) => ({ ...prev, [key]: value }));
  }

  const allAnswered = QUESTIONS.every((q) => answers[q.key] !== undefined);

  async function handleSubmit() {
    if (!allAnswered) return;
    setLoading(true);

    const fullAnswers = answers as AptitudeSurveyAnswers;

    if (authUser) {
      const surveyResult = evaluateAptitude(fullAnswers);
      await saveAptitudeSurvey(authUser.id, fullAnswers);
      updateLocalProfile({
        survey_done: true,
        aptitude_eligible: surveyResult.isEligible,
      });
    }

    setLoading(false);
    setShowResult(true);
  }

  if (showResult) {
    const result = evaluateAptitude(answers as AptitudeSurveyAnswers);
    return (
      <div className="min-h-screen flex flex-col items-center justify-center px-8 py-10 bg-app-bg page-enter">
        <div
          className={`
            w-24 h-24 rounded-full flex items-center justify-center mb-6 float-icon
            ${result.isEligible ? "bg-blood-600/20 border border-blood-500/40" : "bg-amber-500/20 border border-amber-500/40"}
          `}
        >
          <Heart
            className={`w-12 h-12 ${result.isEligible ? "text-blood-400" : "text-amber-400"}`}
          />
        </div>

        <h2 className="text-2xl font-bold text-white text-center mb-3">
          {result.isEligible
            ? "¡Pareces ser un buen donante!"
            : "Gracias por responder"}
        </h2>
        <p className="text-app-text/50 text-center text-sm leading-relaxed mb-8">
          {result.message}
        </p>

        <div className="relative w-24 h-10 flex items-center justify-center">
          <span className="text-4xl drop-anim absolute text-blood-500">●</span>
          <span className="text-2xl drop-anim-2 absolute text-blood-400/60">
            ●
          </span>
        </div>

        <Button
          variant="primary"
          size="lg"
          fullWidth
          className="mt-8"
          onClick={() => navigate("/home", { replace: true })}
        >
          Ir al inicio
        </Button>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex flex-col bg-app-bg page-enter">
      {/* Header */}
      <div className="safe-top bg-app-bg/90 border-b border-app-border/5 px-4 py-3 flex justify-center">
        <h1 className="text-base font-semibold text-app-text">
          Encuesta de donante
        </h1>
      </div>

      <div className="flex-1 overflow-y-auto px-6 py-6">
        {/* Intro */}
        <div className="flex flex-col items-center text-center mb-8">
          <div className="w-16 h-16 rounded-full bg-blood-600/15 border border-blood-500/30 flex items-center justify-center mb-4">
            <Heart className="w-8 h-8 text-blood-400" />
          </div>
          <h2 className="text-xl font-bold text-white mb-2">
            ¿Eres apto para donar sangre?
          </h2>
          <p className="text-app-text/50 text-sm">
            Responde estas preguntas para saber si podrías ser donante. No
            afectan tu registro.
          </p>
        </div>

        {/* Questions */}
        <div className="flex flex-col gap-4">
          {QUESTIONS.map((q, i) => (
            <div
              key={q.key}
              className="bg-app-card border border-app-border/8 rounded-2xl p-4"
            >
              <p className="text-sm text-white/80 font-medium mb-3">
                {i + 1}. {q.text}
              </p>
              <div className="flex gap-3">
                {[true, false].map((val) => (
                  <button
                    key={String(val)}
                    type="button"
                    onClick={() => setAnswer(q.key, val)}
                    className={`
                      flex-1 py-2.5 rounded-xl text-sm font-semibold transition-all
                      ${
                        answers[q.key] === val
                          ? val
                            ? "bg-emerald-500/20 border border-emerald-500/50 text-emerald-400"
                            : "bg-red-500/20 border border-red-500/50 text-red-400"
                          : "bg-app-border/5 border border-app-border/10 text-app-text/50"
                      }
                    `}
                  >
                    {val ? "Sí" : "No"}
                  </button>
                ))}
              </div>
            </div>
          ))}
        </div>

        <Button
          variant="primary"
          size="lg"
          fullWidth
          loading={loading}
          disabled={!allAnswered}
          onClick={handleSubmit}
          className="mt-6"
        >
          Ver mi resultado <ArrowRight className="w-4 h-4" />
        </Button>
      </div>
    </div>
  );
}
