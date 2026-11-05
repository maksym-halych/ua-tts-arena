"use client";

import { useRouter } from "next/navigation";
import { useCallback, useEffect, useRef, useState } from "react";
import { MIN_LISTEN_MS } from "@/lib/listening";
import type { Strings } from "@/lib/i18n";
import { WaveformPlayer, type WaveformHandle } from "./waveform-player";

type Side = "a" | "b";
type RoundData = { id: string; text: string };
type RevealedModels = Record<Side, string> | null;

type State =
  | { phase: "loading" }
  | { phase: "signedOut" }
  | { phase: "failed" }
  | { phase: "done" }
  | { phase: "unavailable" }
  | { phase: "listen"; round: RoundData }
  | { phase: "voted"; round: RoundData; chosen: Side; models: RevealedModels };

async function requestRound(skippedRound?: string): Promise<State> {
  const response = await fetch(skippedRound ? `/api/rounds/${skippedRound}/skip` : "/api/rounds", { method: "POST" });
  // Another tab already finished the skipped round. Get the current one.
  if (skippedRound && response.status === 404) return requestRound();
  if (response.status === 401) return { phase: "signedOut" };
  if (!response.ok) return { phase: "failed" };
  const body = (await response.json()) as { status: "ready"; round: RoundData } | { status: "done" | "unavailable" };
  return body.status === "ready" ? { phase: "listen", round: body.round } : { phase: body.status };
}

export function Arena({ t }: { t: Strings["arena"] }) {
  const router = useRouter();
  const [state, setState] = useState<State>({ phase: "loading" });

  const nextRound = useCallback((skippedRound?: string) => {
    setState({ phase: "loading" });
    requestRound(skippedRound)
      .then(setState)
      .catch(() => setState({ phase: "failed" }));
  }, []);

  useEffect(() => {
    let current = true;
    requestRound()
      .then((result) => {
        if (current) setState(result);
      })
      .catch(() => {
        if (current) setState({ phase: "failed" });
      });
    return () => {
      current = false;
    };
  }, []);

  useEffect(() => {
    if (state.phase === "signedOut") router.push("/sign-in");
  }, [state.phase, router]);

  if (state.phase === "loading" || state.phase === "signedOut") {
    return <p className="py-16 text-center text-ink-2">{t.loading}</p>;
  }
  if (state.phase === "failed") {
    return <Message title={t.error} actionLabel={t.retry} onAction={() => nextRound()} />;
  }
  if (state.phase === "done") return <Message title={t.doneTitle} body={t.doneBody} />;
  if (state.phase === "unavailable") return <Message title={t.unavailableTitle} body={t.unavailableBody} />;

  return (
    <Round
      key={state.round.id}
      t={t}
      round={state.round}
      voted={state.phase === "voted" ? state : null}
      onVoted={(chosen, models) => setState({ phase: "voted", round: state.round, chosen, models })}
      onRoundGone={() => nextRound()}
      onNext={() => nextRound()}
      onSkip={() => nextRound(state.round.id)}
    />
  );
}

function Message({
  title,
  body,
  actionLabel,
  onAction,
}: {
  title: string;
  body?: string;
  actionLabel?: string;
  onAction?: () => void;
}) {
  return (
    <div className="card mx-auto flex max-w-lg flex-col items-center gap-3 p-8 text-center">
      <p className="text-lg font-semibold">{title}</p>
      {body && <p className="text-sm text-ink-2">{body}</p>}
      {actionLabel && (
        <button onClick={onAction} className="btn">
          {actionLabel}
        </button>
      )}
    </div>
  );
}

function Round({
  t,
  round,
  voted,
  onVoted,
  onRoundGone,
  onNext,
  onSkip,
}: {
  t: Strings["arena"];
  round: RoundData;
  voted: { chosen: Side; models: RevealedModels } | null;
  onVoted: (chosen: Side, models: RevealedModels) => void;
  onRoundGone: () => void;
  onNext: () => void;
  onSkip: () => void;
}) {
  const router = useRouter();
  const players = { a: useRef<WaveformHandle>(null), b: useRef<WaveformHandle>(null) };
  const required = useRef<Record<Side, number>>({ a: MIN_LISTEN_MS / 1000, b: MIN_LISTEN_MS / 1000 });
  // After A ends, B starts by itself the first time only.
  const playBAfterA = useRef(true);
  const [heard, setHeard] = useState<Record<Side, boolean>>({ a: false, b: false });
  const [sending, setSending] = useState(false);
  const [notice, setNotice] = useState<string | null>(null);
  const [audioFailed, setAudioFailed] = useState(false);

  const markHeard = (side: Side) => setHeard((previous) => (previous[side] ? previous : { ...previous, [side]: true }));

  async function vote(side: Side) {
    setSending(true);
    setNotice(null);
    try {
      const response = await fetch(`/api/rounds/${round.id}/vote`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ chosen: side }),
      });
      if (response.ok) {
        players.a.current?.pause();
        players.b.current?.pause();
        const body = (await response.json()) as { models: RevealedModels };
        onVoted(side, body.models);
        return;
      }
      const { error } = (await response.json()) as { error?: string };
      if (error === "listen_more") setNotice(t.listenMore);
      else if (error === "too_many_votes") setNotice(t.tooMany);
      else if (response.status === 401) router.push("/sign-in");
      else if (response.status === 404 || response.status === 409 || response.status === 410) onRoundGone();
      else setNotice(t.error);
    } catch {
      setNotice(t.error);
    } finally {
      setSending(false);
    }
  }

  const canVote = heard.a && heard.b;

  return (
    <div className="flex flex-col gap-5">
      <h1 className="text-center text-2xl font-semibold tracking-tight sm:text-3xl">{t.question}</h1>

      <div className="card p-5">
        <p className="tag mb-2">{t.sentence}</p>
        <p lang="uk" className="text-lg leading-relaxed">
          {round.text}
        </p>
      </div>

      <div className="grid gap-4 sm:grid-cols-2">
        {(["a", "b"] as const).map((side) => {
          const other = side === "a" ? "b" : "a";
          const label = side === "a" ? t.sideA : t.sideB;
          const picked = voted?.chosen === side;
          return (
            <section
              key={side}
              aria-label={`${t.sample} ${label}`}
              className={`card flex flex-col gap-4 p-5 ${picked ? "ring-2 ring-accent" : ""}`}
            >
              <div className="flex min-h-7 items-center justify-between gap-2">
                <div className="flex min-w-0 items-center gap-2.5">
                  <span className="grid h-7 w-7 shrink-0 place-items-center rounded-lg bg-fill text-sm font-semibold">{label}</span>
                  <span className="truncate text-sm font-medium">{voted?.models ? voted.models[side] : `${t.sample} ${label}`}</span>
                </div>
                {picked ? (
                  <span className="rounded-full bg-accent-soft px-2.5 py-1 text-xs font-medium whitespace-nowrap text-accent">
                    {t.yourPick}
                  </span>
                ) : (
                  !voted && heard[side] && <span className="tag">{t.heard}</span>
                )}
              </div>

              <WaveformPlayer
                ref={players[side]}
                src={`/api/rounds/${round.id}/audio/${side}`}
                labels={{ play: t.play, pause: t.pause }}
                onReady={(duration) => {
                  required.current[side] = Math.min(MIN_LISTEN_MS / 1000, duration);
                  if (side === "a" && !voted) players.a.current?.play();
                }}
                onPlay={() => players[other].current?.pause()}
                onProgress={(time) => {
                  if (time >= required.current[side]) markHeard(side);
                }}
                onEnded={() => {
                  markHeard(side);
                  if (side === "a" && playBAfterA.current && !voted) {
                    playBAfterA.current = false;
                    players.b.current?.play();
                  }
                }}
                onError={() => setAudioFailed(true)}
              />

              {!voted && (
                <button onClick={() => vote(side)} disabled={!canVote || sending} className="btn btn-primary py-2.5">
                  {canVote ? `${t.vote}: ${label}` : t.listenFirst}
                </button>
              )}
            </section>
          );
        })}
      </div>

      {!voted && (
        <div className="flex justify-center">
          <button onClick={onSkip} disabled={sending} className="btn px-4 py-2">
            {t.skip}
          </button>
        </div>
      )}

      {notice && (
        <p role="alert" className="text-center text-sm text-danger">
          {notice}
        </p>
      )}

      {audioFailed && !voted && (
        <div role="alert" className="flex flex-col items-center gap-3 text-center">
          <p className="text-sm text-danger">{t.audioError}</p>
          <button onClick={onRoundGone} className="btn">
            {t.retry}
          </button>
        </div>
      )}

      {voted && (
        <div className="card flex flex-col items-center gap-3 p-5 text-center">
          <p className="font-medium" role="status">
            {t.recorded}
            {!voted.models && ` ${t.hidden}`}
          </p>
          <button onClick={onNext} className="btn btn-primary px-4 py-2">
            {t.next}
          </button>
        </div>
      )}
    </div>
  );
}
