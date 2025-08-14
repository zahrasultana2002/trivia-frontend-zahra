import { useEffect, useMemo, useState } from "react";
import type { Difficulty, Kind, Trivia } from "./types/trivia";

const API = import.meta.env.VITE_API_BASE;
const TARGET_CORRECT = 5;

export default function App() {
  const [kind, setKind] = useState<Kind>("boolean");
  const [difficulty, setDifficulty] = useState<Difficulty>("easy");
  const [q, setQ] = useState<Trivia | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [selected, setSelected] = useState<string | null>(null);
  const [isCorrect, setIsCorrect] = useState<boolean | null>(null);
  const [correctCount, setCorrectCount] = useState(0);
  const [askedCount, setAskedCount] = useState(0);

  const won = correctCount >= TARGET_CORRECT;

  async function loadQuestion(custom?: { kind?: Kind; difficulty?: Difficulty }) {
    setLoading(true);
    setError(null);
    setSelected(null);
    setIsCorrect(null);

    const k = custom?.kind ?? kind;
    const d = custom?.difficulty ?? difficulty;

    try {
      const res = await fetch(`${API}/api/trivia?type=${k}&difficulty=${d}`);
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      const data = (await res.json()) as Trivia;
      setQ(data);
      setAskedCount((n) => n + 1);
    } catch (e: any) {
      setError(e.message ?? "Failed to fetch");
      setQ(null);
    } finally {
      setLoading(false);
    }
  }

  function handlePick(choice: string) {
    if (!q || selected) return;
    setSelected(choice);
    const ok = choice === q.correctAnswer;
    setIsCorrect(ok);
    if (ok) {
      setCorrectCount((n) => n + 1);
      setTimeout(() => loadQuestion(), 900);
    }
  }

  function resetGame() {
    setCorrectCount(0);
    setAskedCount(0);
    setSelected(null);
    setIsCorrect(null);
    setQ(null);
    loadQuestion();
  }

  useEffect(() => {
    loadQuestion();
  }, []);

  useEffect(() => {
    if (q) loadQuestion({ kind, difficulty });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [kind, difficulty]);

  const status = useMemo(() => {
    if (loading) return "Loading…";
    if (error) return `Error: ${error}`;
    return null;
  }, [loading, error]);

  return (
    <main className="max-w-4xl mx-auto p-6 space-y-6">
      <h1 className="text-4xl font-bold">Trivia</h1>

      {/* Controls */}
      <div className="flex flex-wrap gap-3 items-center">
        <Segmented
          value={kind}
          onChange={(v) => setKind(v as Kind)}
          options={[
            { value: "boolean", label: "True/False" },
            { value: "multiple", label: "Multiple choice" },
          ]}
        />
        <Segmented
          value={difficulty}
          onChange={(v) => setDifficulty(v as Difficulty)}
          options={[
            { value: "easy", label: "Easy" },
            { value: "medium", label: "Medium" },
            { value: "hard", label: "Hard" },
          ]}
        />
        <button
          onClick={() => loadQuestion()}
          disabled={loading}
          className="px-4 py-2 rounded-md bg-purple-600 text-white font-semibold"
        >
          {loading ? "Loading…" : "New Question"}
        </button>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-4 gap-4">
        <StatCard label="Score" value={correctCount * 10} icon="🏆" />
        <StatCard label="Accuracy" value={`${Math.round((correctCount / askedCount) * 100) || 0}%`} icon="🎯" />
        <StatCard label="Current Streak" value={isCorrect ? 1 : 0} icon="⚡" />
        <StatCard label="Best Streak" value={1} icon="🥇" />
      </div>

      {/* Progress */}
      <div className="text-sm text-gray-500">
        Question {askedCount} of 10 <span className="float-right capitalize">{q?.difficulty}</span>
      </div>
      <div className="w-full bg-gray-200 rounded-full h-2 mb-6">
        <div
          className="bg-purple-500 h-2 rounded-full"
          style={{ width: `${(askedCount / 10) * 100}%` }}
        ></div>
      </div>

      {/* Question */}
      {status && <p className="text-red-500">{status}</p>}
      {q && (
        <div className="bg-white rounded-xl shadow p-6 space-y-4">
          <h2 className="text-lg font-semibold">{q.question}</h2>
          <ul className="space-y-3">
            {q.choices.map((c) => {
              const chosen = selected === c;
              const correct = c === q.correctAnswer;
              const showColors = selected !== null;
              let btnClass =
                "w-full text-left p-4 border rounded-lg font-medium transition hover:bg-gray-100";
              if (showColors && correct) btnClass += " border-green-500 bg-green-50";
              if (showColors && chosen && !correct) btnClass += " border-red-500 bg-red-50";

              return (
                <li key={c}>
                  <button onClick={() => handlePick(c)} disabled={!!selected || loading} className={btnClass}>
                    {c}
                  </button>
                </li>
              );
            })}
          </ul>
          {selected && (
            <p className={`mt-4 font-semibold ${isCorrect ? "text-green-600" : "text-red-600"}`}>
              {isCorrect ? "✅ Correct!" : `❌ Incorrect. Correct answer: ${q.correctAnswer}`}
            </p>
          )}
          {selected && !isCorrect && (
            <button onClick={() => loadQuestion()} className="mt-3 px-4 py-2 bg-purple-500 text-white rounded-lg">
              Next Question
            </button>
          )}
        </div>
      )}

      {/* Win Modal */}
      {won && (
        <div style={overlay()}>
          <div style={card()}>
            <h3 className="text-2xl font-bold mb-4">🎉 Congratulations!</h3>
            <p className="mb-6">You reached {TARGET_CORRECT} correct answers.</p>
            <button onClick={resetGame} className="px-6 py-2 bg-purple-600 text-white rounded-lg">
              Play again
            </button>
          </div>
        </div>
      )}
    </main>
  );
}

function StatCard({ label, value, icon }: { label: string; value: string | number; icon: string }) {
  return (
    <div className="bg-white rounded-lg shadow p-4 text-center">
      <div className="text-3xl mb-1">{icon}</div>
      <div className="text-xl font-bold">{value}</div>
      <div className="text-gray-500 text-sm">{label}</div>
    </div>
  );
}

function overlay() {
  return {
    position: "fixed" as const,
    inset: 0,
    background: "rgba(15, 23, 42, 0.6)",
    display: "grid",
    placeItems: "center",
    zIndex: 50,
  };
}

function card() {
  return {
    background: "white",
    padding: 24,
    borderRadius: 16,
    minWidth: 320,
    textAlign: "center" as const,
  };
}

function Segmented({
  value,
  onChange,
  options,
}: {
  value: string;
  onChange: (v: string) => void;
  options: { value: string; label: string }[];
}) {
  return (
    <div className="flex border border-gray-300 rounded-lg overflow-hidden">
      {options.map((opt) => {
        const active = opt.value === value;
        return (
          <button
            key={opt.value}
            onClick={() => onChange(opt.value)}
            className={`px-4 py-2 font-medium ${
              active ? "bg-gray-900 text-white" : "bg-white text-gray-900"
            }`}
          >
            {opt.label}
          </button>
        );
      })}
    </div>
  );
}
