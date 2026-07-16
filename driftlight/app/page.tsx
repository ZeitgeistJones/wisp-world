'use client';
import { useEffect, useState, useRef, useCallback } from 'react';

type LexEntry = { name: string; note: string; cycle: number; from?: [string, string] };
type LogEntry = { id: number; beat: string; murmur?: string; reaction?: string };
type WorldState = { sceneSummary: string; characterMood: string; cycle: number };

const MOOD_COLORS: Record<string, string> = {
  default: '#5DCAA5',
  uneasy: '#7BA8A0',
  watchful: '#6B9EAA',
  dread: '#8B6E6E',
  afraid: '#7A6E8B',
  curious: '#7ABBA0',
  calm: '#5DCAA5',
  agitated: '#B87A5A',
  restless: '#A89070',
  content: '#6BC4A0',
};

function getMoodColor(mood: string) {
  const lower = mood.toLowerCase();
  for (const key of Object.keys(MOOD_COLORS)) {
    if (lower.includes(key)) return MOOD_COLORS[key];
  }
  return MOOD_COLORS.default;
}

function getMoodBreathSpeed(mood: string) {
  const lower = mood.toLowerCase();
  if (lower.includes('agitated') || lower.includes('restless')) return 2.2;
  if (lower.includes('dread') || lower.includes('afraid')) return 5.5;
  if (lower.includes('calm') || lower.includes('content')) return 4.5;
  return 3.6;
}

export default function Home() {
  const [state, setState] = useState<WorldState | null>(null);
  const [log, setLog] = useState<LogEntry[]>([]);
  const [lexicon, setLexicon] = useState<LexEntry[]>([]);
  const [pendingCount, setPendingCount] = useState(0);
  const [picked, setPicked] = useState<string[]>([]);
  const [combining, setCombining] = useState(false);
  const [discovery, setDiscovery] = useState<{ result: string; note: string; isNew: boolean } | null>(null);
  const [murmur, setMurmur] = useState('');
  const [showSubmit, setShowSubmit] = useState(false);
  const [submitText, setSubmitText] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [flinch, setFlinch] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);
  const [mousePos, setMousePos] = useState({ x: 0.5, y: 0.5 });

  const load = useCallback(async () => {
    try {
      const res = await fetch('/api/state', { cache: 'no-store' });
      const data = await res.json();
      setState(data.state);
      setLog(data.log || []);
      setLexicon(data.lexicon || []);
      setPendingCount(data.pendingCount || 0);
      const latest = (data.log || [])[(data.log || []).length - 1];
      if (latest) setMurmur(latest.murmur || latest.reaction || '');
    } catch {}
  }, []);

  useEffect(() => { load(); }, [load]);

  function pick(name: string) {
    setDiscovery(null);
    if (picked.includes(name)) {
      setPicked(picked.filter((p) => p !== name));
    } else if (picked.length < 2) {
      const next = [...picked, name];
      setPicked(next);
      if (next.length === 2) {
        doCombine(next[0], next[1]);
      }
    }
  }

  async function doCombine(a: string, b: string) {
    setCombining(true);
    setDiscovery(null);
    try {
      const res = await fetch('/api/combine', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ a, b }),
      });
      const data = await res.json();
      if (data.result) {
        setDiscovery(data);
        setFlinch(true);
        setTimeout(() => setFlinch(false), 600);
        load();
      }
    } catch {}
    setCombining(false);
    setPicked([]);
  }

  async function submit() {
    if (!submitText.trim()) return;
    setSubmitting(true);
    await fetch('/api/submit', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ text: submitText }),
    });
    setSubmitText('');
    setSubmitting(false);
    setShowSubmit(false);
    load();
  }

  function handleMouseMove(e: React.MouseEvent) {
    if (!containerRef.current) return;
    const rect = containerRef.current.getBoundingClientRect();
    setMousePos({
      x: (e.clientX - rect.left) / rect.width,
      y: (e.clientY - rect.top) / rect.height,
    });
  }

  if (!state) {
    return (
      <div style={{ height: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', background: '#0a0c0f', color: '#555', fontFamily: 'Georgia, serif' }}>
        ...
      </div>
    );
  }

  const moodColor = getMoodColor(state.characterMood);
  const breathSpeed = getMoodBreathSpeed(state.characterMood);
  const eyeDx = (mousePos.x - 0.5) * 6;
  const eyeDy = (mousePos.y - 0.5) * 4;

  const sorted = [...lexicon].sort((a, b) => a.cycle - b.cycle || a.name.localeCompare(b.name));

  return (
    <div
      ref={containerRef}
      onMouseMove={handleMouseMove}
      style={{
        height: '100vh',
        width: '100vw',
        background: '#0a0c0f',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        position: 'relative',
        overflow: 'hidden',
        cursor: 'default',
      }}
    >
      <style>{`
        @keyframes breathe {
          0%, 100% { transform: scale(1) rotate(0deg); }
          50% { transform: scale(1.04) rotate(0.5deg); }
        }
        @keyframes blink {
          0%, 92%, 100% { transform: scaleY(1); }
          95% { transform: scaleY(0.1); }
        }
        @keyframes fadeIn { from { opacity: 0; } to { opacity: 1; } }
        @keyframes murmurIn {
          from { opacity: 0; transform: translateY(6px); }
          to { opacity: 1; transform: translateY(0); }
        }
        @keyframes flinchAnim {
          0% { transform: scale(1); }
          20% { transform: scale(0.92) rotate(-2deg); }
          60% { transform: scale(1.06) rotate(1deg); }
          100% { transform: scale(1); }
        }
        @keyframes drift {
          0%, 100% { transform: translateY(0px); }
          50% { transform: translateY(-3px); }
        }
        .word-btn {
          background: transparent;
          border: 1px solid #2a2c2f;
          color: #7a7868;
          padding: 5px 14px;
          border-radius: 20px;
          font-size: 13px;
          cursor: pointer;
          transition: all 0.3s ease;
          font-family: Georgia, serif;
        }
        .word-btn:hover {
          border-color: #5DCAA5;
          color: #b8b4a8;
        }
        .word-btn.selected {
          border-color: #5DCAA5;
          color: #5DCAA5;
          background: rgba(93, 202, 165, 0.08);
        }
        .word-btn.new-discovery {
          animation: fadeIn 0.8s ease;
          border-color: #5DCAA5;
          color: #5DCAA5;
        }
      `}</style>

      {/* creature */}
      <div style={{
        animation: flinch
          ? 'flinchAnim 0.5s ease'
          : `breathe ${breathSpeed}s ease-in-out infinite`,
        marginBottom: 16,
      }}>
        <svg width="160" height="160" viewBox="0 0 160 160">
          <defs>
            <radialGradient id="glow" cx="50%" cy="50%" r="50%">
              <stop offset="0%" stopColor={moodColor} stopOpacity="0.15" />
              <stop offset="100%" stopColor={moodColor} stopOpacity="0" />
            </radialGradient>
          </defs>
          <circle cx="80" cy="80" r="78" fill="url(#glow)" />
          <path
            d="M80,24 C115,24 140,52 138,82 C136,112 115,140 80,140 C45,140 22,112 24,82 C26,52 48,24 80,24 Z"
            fill={moodColor}
            opacity="0.85"
            style={{ transition: 'fill 2s ease' }}
          />
          <g style={{ animation: 'blink 4.5s ease-in-out infinite', transformOrigin: '62px 76px' }}>
            <circle cx={62 + eyeDx} cy={76 + eyeDy} r="5" fill="#0a0c0f" />
          </g>
          <g style={{ animation: 'blink 4.5s ease-in-out infinite', transformOrigin: '98px 76px' }}>
            <circle cx={98 + eyeDx} cy={76 + eyeDy} r="5" fill="#0a0c0f" />
          </g>
        </svg>
      </div>

      {/* mood + cycle */}
      <p style={{
        fontSize: 12,
        color: '#555',
        fontFamily: 'sans-serif',
        letterSpacing: '0.05em',
        marginBottom: 6,
      }}>
        {state.characterMood}
      </p>

      {/* murmur */}
      {murmur && (
        <p style={{
          fontSize: 14,
          color: '#8a8678',
          fontStyle: 'italic',
          maxWidth: 360,
          textAlign: 'center',
          lineHeight: 1.5,
          marginBottom: 28,
          animation: 'murmurIn 0.8s ease',
          minHeight: 22,
        }}>
          &ldquo;{murmur}&rdquo;
        </p>
      )}

      {/* discovery flash */}
      {discovery && (
        <div style={{
          position: 'absolute',
          top: '14%',
          textAlign: 'center',
          animation: 'murmurIn 0.6s ease',
          zIndex: 10,
        }}>
          <p style={{ fontSize: 15, color: discovery.isNew ? '#5DCAA5' : '#777', margin: 0 }}>
            {discovery.isNew ? discovery.result : `${discovery.result} already exists`}
          </p>
          {discovery.note && discovery.isNew && (
            <p style={{ fontSize: 12, color: '#666', fontStyle: 'italic', marginTop: 4 }}>
              {discovery.note}
            </p>
          )}
        </div>
      )}

      {/* lexicon constellation */}
      <div style={{
        display: 'flex',
        flexWrap: 'wrap',
        justifyContent: 'center',
        gap: 8,
        maxWidth: 500,
        padding: '0 20px',
        marginBottom: 24,
      }}>
        {sorted.map((e) => (
          <button
            key={e.name}
            onClick={() => !combining && pick(e.name)}
            title={e.note}
            className={`word-btn ${picked.includes(e.name) ? 'selected' : ''}`}
            disabled={combining}
          >
            {e.name}
          </button>
        ))}
      </div>

      {/* combine status */}
      {combining && (
        <p style={{ fontSize: 12, color: '#555', animation: 'fadeIn 0.3s ease', fontFamily: 'sans-serif' }}>
          the fog considers it...
        </p>
      )}
      {!combining && picked.length === 1 && (
        <p style={{ fontSize: 12, color: '#555', fontFamily: 'sans-serif' }}>
          {picked[0]} + ...
        </p>
      )}

      {/* bottom bar */}
      <div style={{
        position: 'absolute',
        bottom: 0,
        left: 0,
        right: 0,
        padding: '16px 20px',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        fontFamily: 'sans-serif',
        fontSize: 12,
        color: '#444',
      }}>
        <span>cycle {state.cycle} · {lexicon.length} things</span>
        <div style={{ display: 'flex', gap: 12, alignItems: 'center' }}>
          {pendingCount > 0 && <span>{pendingCount} queued</span>}
          <button
            onClick={() => setShowSubmit(!showSubmit)}
            style={{
              background: 'transparent',
              border: '1px solid #2a2c2f',
              color: '#666',
              padding: '5px 12px',
              borderRadius: 14,
              cursor: 'pointer',
              fontSize: 12,
            }}
          >
            {showSubmit ? 'close' : 'what happens next?'}
          </button>
        </div>
      </div>

      {/* submit drawer */}
      {showSubmit && (
        <div style={{
          position: 'absolute',
          bottom: 48,
          left: 0,
          right: 0,
          padding: '16px 20px',
          background: '#111318',
          borderTop: '1px solid #1a1c1f',
          animation: 'murmurIn 0.3s ease',
        }}>
          <div style={{ maxWidth: 500, margin: '0 auto', display: 'flex', gap: 8 }}>
            <input
              value={submitText}
              onChange={(e) => setSubmitText(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && submit()}
              placeholder="a stranger arrives at the harbor..."
              maxLength={280}
              style={{
                flex: 1,
                padding: '8px 12px',
                fontSize: 13,
                background: '#0a0c0f',
                border: '1px solid #2a2c2f',
                color: '#b8b4a8',
                borderRadius: 8,
                outline: 'none',
                fontFamily: 'Georgia, serif',
              }}
            />
            <button
              onClick={submit}
              disabled={submitting || !submitText.trim()}
              style={{
                padding: '8px 16px',
                fontSize: 13,
                background: submitting ? '#1a1c1f' : '#1a2a22',
                border: '1px solid #2a3c2f',
                color: '#5DCAA5',
                borderRadius: 8,
                cursor: 'pointer',
              }}
            >
              {submitting ? '...' : 'submit'}
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
