import React, { useEffect, useRef, useState } from 'react';
import {
  FileCard, Header, Group, Callout, Facts, Sparklines, Closing,
  Paragraph, Caption, FileButton,
} from './ui';

import './style.css';

/* ---------- Demo 0: voice-controlled mini deck (simulated) ---------- */
const SLIDES = [
  { kicker: 'Edge AI on a laptop', title: 'Why run models at the edge?', note: 'Privacy, latency, offline - the three reasons in one slide.' },
  { kicker: 'Multimodal inputs', title: 'Voice + vision + sensors', note: 'Three cheap sensors, one Python process.' },
  { kicker: 'The toolkit', title: 'whisper, MediaPipe, MQTT', note: 'Everything in this talk runs on this laptop.' },
];

function VoiceDeck(props: { onSlide?: (i: number) => void }) {
  const [idx, setIdx] = useState(0);
  const [heard, setHeard] = useState<string | null>(null);
  const say = (cmd: 'lanjut' | 'kembali') => {
    const next = cmd === 'lanjut' ? Math.min(idx + 1, SLIDES.length - 1) : Math.max(idx - 1, 0);
    setIdx(next);
    setHeard('"' + cmd + '"');
    props.onSlide?.(next);
  };
  const s = SLIDES[idx];
  return (
    <div>
      <div className="mini-deck">
        <div className="slide-kicker">Slide {idx + 1} of {SLIDES.length} · {s.kicker}</div>
        <div className="slide-title">{s.title}</div>
        <div className="slide-note">{s.note}</div>
      </div>
      {heard && <div className="transcript">heard: <b>{heard}</b> → slide {idx + 1}</div>}
      <div className="btn-row">
        <FileButton variant="secondary" onClick={() => say('kembali')}>Say "Kembali"</FileButton>
        <FileButton variant="primary" onClick={() => say('lanjut')}>Say "Lanjut"</FileButton>
      </div>
      <Caption>The real demo listens to the microphone: faster-whisper on the laptop, or Whisper in the browser via transformers.js on GitHub Pages.</Caption>
    </div>
  );
}

/* ---------- Demo 1: people counter (simulated) ---------- */
function PersonFigure(props: { x: number; raised: boolean }) {
  const { x, raised } = props;
  const hipY = 150, shoulderY = 108, headY = 88;
  return (
    <g>
      <line className="person-body" x1={x} y1={shoulderY} x2={x} y2={hipY} />
      <line className="person-body" x1={x} y1={hipY} x2={x - 12} y2={188} />
      <line className="person-body" x1={x} y1={hipY} x2={x + 12} y2={188} />
      {raised
        ? <line className="person-body arm-raised" x1={x} y1={shoulderY} x2={x + 16} y2={shoulderY - 34} />
        : <line className="person-body" x1={x} y1={shoulderY} x2={x + 15} y2={shoulderY + 24} />}
      <line className="person-body" x1={x} y1={shoulderY} x2={x - 15} y2={shoulderY + 24} />
      <circle className="person-head" cx={x} cy={headY} r={10} />
      <circle className="nose-dot" cx={x + 8} cy={headY - 2} r={2.4} />
    </g>
  );
}

function PeopleCounter(props: {
  people: number; hands: number;
  onChange: (people: number, hands: number) => void;
}) {
  const { people, hands } = props;
  const xs = [70, 130, 190, 250, 310, 370];
  const set = (p: number, h: number) => props.onChange(p, h);
  return (
    <div>
      <div className="scene">
        <svg viewBox="0 0 440 210">
          <line className="scene-floor" x1="10" y1="192" x2="430" y2="192" />
          {Array.from({ length: people }, (_, i) => (
            <PersonFigure key={i} x={xs[i]} raised={i < hands} />
          ))}
          {people === 0 && <text x="220" y="110" textAnchor="middle" fill="#98a2b3" fontSize="14">empty room - press "Person joins"</text>}
        </svg>
      </div>
      <div className="btn-row">
        <FileButton variant="primary" onClick={() => set(Math.min(6, people + 1), hands)}>Person joins</FileButton>
        <FileButton variant="secondary" onClick={() => { const p = Math.max(0, people - 1); set(p, Math.min(hands, p)); }}>Person leaves</FileButton>
        <FileButton variant="secondary" onClick={() => set(people, Math.min(people, hands + 1))}>Raise a hand</FileButton>
        <FileButton variant="secondary" onClick={() => set(people, Math.max(0, hands - 1))}>Lower a hand</FileButton>
      </div>
      <Caption>The real demo runs MediaPipe PoseLandmarker on the webcam. The heuristic: a wrist above the nose counts as a raised hand.</Caption>
    </div>
  );
}

/* ---------- Demo 3: sensor feed (simulated) ---------- */
function fmt(n: number) { return (n >= 0 ? '+' : '') + n.toFixed(2); }

function SensorFeed() {
  const [lines, setLines] = useState<{ t: string; text: string; spike: boolean }[]>([]);
  const [flash, setFlash] = useState(false);
  const logRef = useRef<HTMLDivElement>(null);
  const push = (text: string, spike: boolean) => {
    const t = new Date().toLocaleTimeString('en-GB', { hour12: false });
    setLines(prev => [...prev.slice(-60), { t, text, spike }]);
  };
  useEffect(() => {
    const id = setInterval(() => {
      const ax = (Math.random() - 0.5) * 0.12;
      const ay = (Math.random() - 0.5) * 0.12;
      const az = 1 + (Math.random() - 0.5) * 0.06;
      push(`imu/phone/demo  accel x=${fmt(ax)} y=${fmt(ay)} z=${fmt(az)}  idle`, false);
    }, 500);
    return () => clearInterval(id);
  }, []);
  useEffect(() => {
    if (logRef.current) logRef.current.scrollTop = logRef.current.scrollHeight;
  }, [lines]);
  const shake = () => {
    let i = 0;
    const id = setInterval(() => {
      const s = Math.sin(i * 2.4) * 8;
      push(`imu/phone/demo  accel x=${fmt(s)} y=${fmt(-s * 0.7)} z=${fmt(1 + s * 0.5)}  MAG=${Math.abs(s).toFixed(1)}g`, true);
      i++;
      if (i > 7) {
        clearInterval(id);
        setFlash(true);
        push('imu/phone/demo  SHAKE detected → publish hw/flash/on', true);
        setTimeout(() => setFlash(false), 2600);
      }
    }, 120);
  };
  return (
    <div>
      <div className="sensor-log" ref={logRef}>
        {lines.map((l, i) => <div key={i} className={l.spike ? 'spike' : ''}>[{l.t}] {l.text}</div>)}
        {lines.length === 0 && <div>starting simulated feed...</div>}
      </div>
      {flash && <div className="flash-banner">⚡ Shake detected - simulated flash event (hw/flash/on)</div>}
      <div className="btn-row">
        <FileButton variant="primary" onClick={shake}>Simulate a phone shake</FileButton>
      </div>
      <Caption>The real demo streams a phone's accelerometer over MQTT (topic imu/phone/demo) through a public broker; the laptop watches for magnitude spikes and fires the flash. A simulator covers phones without a browser sensor.</Caption>
    </div>
  );
}

/* ---------- Page ---------- */
export function App() {
  const [people, setPeople] = useState(0);
  const [hands, setHands] = useState(0);
  const [hist, setHist] = useState<{ p: number[]; h: number[] }>({ p: [], h: [] });
  useEffect(() => {
    const id = setInterval(() => {
      setHist(prev => ({ p: [...prev.p.slice(-29), people], h: [...prev.h.slice(-29), hands] }));
    }, 1000);
    return () => clearInterval(id);
  }, [people, hands]);
  const onPeople = (p: number, h: number) => { setPeople(p); setHands(h); };

  const zipHref = './naga-demo-lab-archive.zip';

  return (
    <FileCard>
      <Header
        title="Edge AI demo lab"
        intro="An interactive tour of the four live demos from my Python Indonesia talk, Edge AI & Multimodal Applications in Python. Everything below is a labeled simulation that mirrors the real behaviour; the real code is in the download at the bottom."
      />


      <Group label="Demo 0 · Voice-controlled slides (simulated)">
        <Paragraph>Whisper transcribes the command and advances the deck - the laptop never leaves the podium. Try the simulated version:</Paragraph>
        <VoiceDeck />
      </Group>

      <Group label="Demo 1 · Webcam people counter (simulated)">
        <Paragraph>MediaPipe pose tracks everyone in frame and counts raised hands. Move people in and out:</Paragraph>
        <PeopleCounter people={people} hands={hands} onChange={onPeople} />
      </Group>

      <Group label="Demo 2 · The live dashboard reads Demo 1">
        <Paragraph>The dashboard polls the counter and charts the room. This one is wired to the simulation above - raise hands there and watch them appear here:</Paragraph>
        <Facts items={[
          { label: 'People in frame', value: String(people) },
          { label: 'Hands raised', value: String(hands) },
          { label: 'Room engagement', value: people === 0 ? '—' : Math.round((hands / people) * 100) + '%' },
        ]} />
        <Sparklines
          label="Last 30 seconds"
          series={[
            { name: 'People', values: hist.p, delta: hist.p.length > 1 ? hist.p[hist.p.length - 1] - hist.p[0] : 0, highlight: true },
            { name: 'Hands', values: hist.h, delta: hist.h.length > 1 ? hist.h[hist.h.length - 1] - hist.h[0] : 0 },
          ]}
        />
        <Caption>The real dashboard is a Streamlit app (stlite in the browser edition) reading the counter over localStorage; in the talk it becomes a live vote.</Caption>
      </Group>

      <Group label="Demo 3 · Phone motion over MQTT (simulated)">
        <SensorFeed />
      </Group>

      <Group label="Get the code · Run the real demos">
        <Paragraph>The zip below is the historical demo-code snapshot, not the current repository. Python originals run on a laptop (python -m hub, pick a demo); the web/ folder holds the browser editions - historical browser variants require their external model/CDN dependencies and browser permissions. Compatibility and current deployment are not asserted by this archive.</Paragraph>
        <div className="btn-row">
          <a className="download-btn" href={zipHref} download="naga-demos.zip">Download the demo repo (.zip)</a>
        </div>
        <Callout title="What is inside" tone="note">
          hub/ launcher plus demo0 voice deck, demo1 people counter, demo2 Streamlit dashboard, demo3 MQTT motion feed - and web/ browser editions using transformers.js, MediaPipe, stlite and MQTT.js, historical browser sources.
        </Callout>
      </Group>

      <Closing>Simulations prepared for the PythonID Jakarta October Meetup, 31 October 2026. Archived simulations, not evidence of a live sensor or model running here. Current implementations are in the Naga repository.</Closing>
    </FileCard>
  );
}
