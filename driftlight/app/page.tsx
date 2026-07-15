'use client';
import { useEffect, useState } from 'react';

type LogEntry = {
  id: number;
  timestamp: number;
  beat: string;
  reaction: string;
  submissionCount: number;
  discoveries?: string[];
};

type WorldState = {
  title: string;
  sceneSummary: string;
  characterMood: string;
  cycle: number;
};

type LexEntry = { name: string; note: string; cycle: number; from?: [string, string] };

export default function Home() {
  const [state, setState] = useState<WorldState | null>(null);
  const [log, setLog] = useState<LogEntry[]>([]);
  const [lexicon, setLexicon] = useState<LexEntry[]>([]);
  const [pendingCount, setPendingCount] = useState(0);
  const [input, setInput] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [picked, setPicked] = useState<string[]>([]);
  const [combining, setCombining] = useState(false);
  const [discovery, setDiscovery] = useState<{ result: string; note: string; isNew: boolean } | null>(null);

  async function load() {
    const res = await fetch('/api/state', { cache: 'no-store' });
    const data = await res.json();
    setState(data.state);
    setLog(data.log || []);
    setLexicon(data.lexicon || []);
    setPendingCount(data.pendingCount || 0);
  }

  useEffect(() => {
    load();
  }, []);

  async function submit() {
    if (!input.trim()) return;
    setSubmitting(true);
    await fetch('/api/submit', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ text: input }),
    });
    setInput('');
    setSubmitting(false);
    setSubmitted(true);
    load();
    setTimeout(() => setSubmitted(false), 2500);
  }

  function pick(name: string) {
    setDiscovery(null);
    if (picked.includes(name)) {
      setPicked(picked.filter((p) => p !== name));
    } else if (picked.length < 2) {
      setPicked([...picked, name]);
    }
  }

  async function combine() {
    if (picked.length !== 2) return;
    setCombining(true);
    setDiscovery(null);
    const res = await fetch('/api/combine', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ a: picked[0], b: picked[1] }),
    });
    const data = await res.json();
    setCombining(false);
    setPicked([]);
    if (data.result) {
      setDiscovery(data);
      load();
    }
  }

  if (!state) {
    return <main style={{ padding: 48, fontFamily: 'sans-serif', color: '#888' }}>loading driftlight...</main>;
  }

  const sorted = [...lexicon].sort((a, b) => a.cycle - b.cycle || a.name.localeCompare(b.name));

  return (
    <main
      style={{
        maxWidth: 640,
        margin: '0 auto',
        padding: '48px 20px 80px',
        fontFamily: 'Georgia, serif',
        lineHeight: 1.6,
        color: '#222',
      }}
    >
      <h1 style={{ fontSize: 22, fontWeight: 500, marginBottom: 4 }}>{state.title}</h1>
      <p style={{ fontSize: 13, color: '#888', marginBottom: 24, fontFamily: 'sans-serif' }}>
        cycle {state.cycle} · wisp is feeling {state.characterMood} · {lexicon.length} things exist here
      </p>

      <p style={{ marginBottom: 32, fontStyle: 'italic' }}>{state.sceneSummary}</p>

      <div style={{ display: 'flex', flexDirection: 'column', gap: 24, marginBottom: 44 }}>
        {[...log].reverse().map((entry) => (
          <div key={entry.id} style={{ borderLeft: '2px solid #ddd', paddingLeft: 16 }}>
            <p style={{ margin: 0 }}>{entry.beat}</p>
            <p style={{ margin: '8px 0 0', color: '#555' }}>wisp: {entry.reaction}</p>
          </div>
        ))}
        {log.length === 0 && (
          <p style={{ color: '#888', fontFamily: 'sans-serif', fontSize: 14 }}>
            the story hasn&apos;t moved yet.
          </p>
        )}
      </div>

      <div style={{ fontFamily: 'sans-serif', borderTop: '1px solid #eee', paddingTop: 24, marginBottom: 40 }}>
        <p style={{ fontSize: 13, color: '#888', marginBottom: 10 }}>
          what exists in driftlight — pick two, see what they make
        </p>
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6, marginBottom: 12 }}>
          {sorted.map((e) => {
            const on = picked.includes(e.name);
            return (
              <button
                key={e.name}
                onClick={() => pick(e.name)}
                title={e.note}
                style={{
                  padding: '5px 11px',
                  fontSize: 13,
                  cursor: 'pointer',
                  border: on ? '1px solid #222' : '1px solid #ddd',
                  background: on ? '#222' : '#fff',
                  color: on ? '#fff' : '#333',
                  borderRadius: 20,
                  fontFamily: 'sans-serif',
                }}
              >
                {e.name}
              </button>
            );
          })}
        </div>
        <button
          onClick={combine}
          disabled={picked.length !== 2 || combining}
          style={{ padding: '8px 16px', fontSize: 14, cursor: picked.length === 2 ? 'pointer' : 'default' }}
        >
          {combining ? 'the fog considers it...' : picked.length === 2 ? `combine ${picked[0]} + ${picked[1]}` : 'pick two'}
        </button>

        {discovery && (
          <div
            style={{
              marginTop: 16,
              padding: 14,
              background: discovery.isNew ? '#f4f9f5' : '#f7f7f7',
              border: '1px solid #e4e4e4',
              borderRadius: 8,
            }}
          >
            <p style={{ margin: 0, fontSize: 15, fontFamily: 'Georgia, serif' }}>
              {discovery.isNew ? 'driftlight has never seen this before: ' : 'this already exists here: '}
              <strong>{discovery.result}</strong>
            </p>
            {discovery.note && (
              <p style={{ margin: '6px 0 0', fontSize: 13, color: '#666', fontStyle: 'italic' }}>
                {discovery.note}
              </p>
            )}
            {discovery.isNew && (
              <p style={{ margin: '8px 0 0', fontSize: 12, color: '#888' }}>
                wisp will encounter this in the next cycle.
              </p>
            )}
          </div>
        )}
      </div>

      <div style={{ fontFamily: 'sans-serif', borderTop: '1px solid #eee', paddingTop: 24 }}>
        <p style={{ fontSize: 13, color: '#888', marginBottom: 8 }}>
          or tell driftlight what happens next ({pendingCount} submitted this cycle)
        </p>
        <textarea
          value={input}
          onChange={(e) => setInput(e.target.value)}
          placeholder="a boat arrives that no one in driftlight recognizes..."
          rows={3}
          maxLength={280}
          style={{ width: '100%', padding: 10, fontSize: 14, fontFamily: 'sans-serif', boxSizing: 'border-box' }}
        />
        <button
          onClick={submit}
          disabled={submitting || !input.trim()}
          style={{ marginTop: 8, padding: '8px 16px', fontSize: 14, cursor: 'pointer' }}
        >
          {submitting ? 'sending...' : 'submit'}
        </button>
        {submitted && <span style={{ marginLeft: 12, fontSize: 13, color: '#2a7' }}>added to the cycle</span>}
      </div>
    </main>
  );
}
