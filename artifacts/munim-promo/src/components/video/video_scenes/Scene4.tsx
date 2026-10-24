import { useState } from 'react';
import { motion } from 'framer-motion';
import { useSceneTimer } from '@/lib/video';

const EASE = [0.22, 1, 0.36, 1] as const;
const MSGS = [
  { name: 'Ramesh', amt: '₹1,240', note: 'Namaste Ramesh ji, chawal ke ₹1,240 — jab sahi lage, is link se.', odds: 'likely Tue' },
  { name: 'Lakshmi Tiffin', amt: '₹860', note: 'Lakshmi avare, ₹860 baaki ide. Dhanyavaada!', odds: 'likely Wed' },
  { name: 'Pooja Tailors', amt: '₹2,150', note: 'Pooja ji, a gentle reminder for ₹2,150. No rush past Thursday.', odds: 'likely Thu' },
];

export function Scene4() {
  const [beat, setBeat] = useState(0);
  useSceneTimer([
    { time: 350, callback: () => setBeat(1) },
    { time: 1000, callback: () => setBeat(2) },
    { time: 1700, callback: () => setBeat(3) },
    { time: 2400, callback: () => setBeat(4) },
    { time: 3150, callback: () => setBeat(5) },
    { time: 4500, callback: () => setBeat(6) },
  ]);
  return (
    <motion.section className="absolute inset-0 overflow-hidden" style={{ background: 'var(--ink)' }}
      initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0, transition: { duration: 0.35, delay: 0.2 } }} transition={{ duration: 0.3 }}>
      <div className="absolute inset-0" style={{ background: 'radial-gradient(ellipse 60% 80% at 30% 50%, rgba(242,165,26,.18), transparent 70%)' }} />
      <motion.div className="absolute" style={{ left: '12vw', top: '7vh', width: '44vmin', height: '86vh' }}
        initial={{ y: '30vh', scale: 0.85, rotate: 6 }} animate={beat >= 6 ? { scale: 2.6, y: '-8vh', x: '18vw', opacity: 0 } : { y: 0, scale: 1, rotate: -2 }}
        transition={beat >= 6 ? { duration: 0.75, ease: [0.7, 0, 0.3, 1] } : { type: 'spring', stiffness: 200, damping: 24 }}>
        <div className="w-full h-full rounded-[5vmin] grain relative overflow-hidden" style={{ background: 'var(--paper)', border: '1.2vmin solid #0e1130', boxShadow: '0 4vmin 8vmin -2vmin rgba(0,0,0,.5)' }}>
          <div className="flex items-center" style={{ padding: '3vmin 3vmin 1.5vmin', gap: '1.4vmin' }}>
            <div className="rounded-full flex items-center justify-center" style={{ width: '5vmin', height: '5vmin', background: 'var(--ink)', color: 'var(--haldi)', fontFamily: 'Noto Sans Devanagari', fontWeight: 700, fontSize: '3vmin' }}>म</div>
            <div>
              <div style={{ fontSize: '2.4vmin', fontWeight: 700, lineHeight: 1 }}>Munim suggests</div>
              <div className="f-mono" style={{ fontSize: '1.5vmin', color: 'var(--muted)' }}>3 reminders · covers ₹4,250</div>
            </div>
          </div>
          <div className="flex flex-col" style={{ padding: '0 2.4vmin', gap: '1.6vmin' }}>
            {MSGS.map((m, i) => (
              <motion.div key={m.name} className="rounded-[2vmin]" style={{ background: '#fffaf0', border: '1px solid rgba(34,40,95,.14)', padding: '1.8vmin' }}
                initial={{ opacity: 0, y: 20, scale: 0.95 }} animate={beat >= i + 1 ? { opacity: 1, y: 0, scale: 1 } : {}} transition={{ duration: 0.45, ease: EASE }}>
                <div className="flex justify-between items-baseline">
                  <span style={{ fontSize: '2.3vmin', fontWeight: 700 }}>{m.name}</span>
                  <span className="f-mono" style={{ fontSize: '2.3vmin', fontWeight: 700, color: 'var(--owed)' }}>{m.amt}</span>
                </div>
                <div style={{ fontSize: '1.8vmin', lineHeight: 1.3, color: 'var(--muted)', marginTop: '0.6vmin' }}>{m.note}</div>
                <div className="flex justify-between items-center" style={{ marginTop: '1vmin' }}>
                  <span className="f-mono" style={{ fontSize: '1.4vmin', background: 'var(--haldi-soft)', padding: '0.3vmin 1vmin', borderRadius: 99 }}>{m.odds}</span>
                  <motion.span style={{ fontSize: '1.7vmin', fontWeight: 700, padding: '0.5vmin 1.6vmin', borderRadius: 99 }}
                    animate={beat >= 5 ? { background: '#1c6e48', color: '#f7f1e6' } : { background: '#e8e2d4', color: '#22285f' }} transition={{ delay: i * 0.12 }}>
                    {beat >= 5 ? 'Sent' : 'Approve'}
                  </motion.span>
                </div>
              </motion.div>
            ))}
          </div>
          <motion.div className="absolute f-display" style={{ left: '50%', top: '58%', x: '-50%', fontSize: '5vmin', fontWeight: 700, color: 'var(--owed)', border: '0.7vmin solid var(--owed)', padding: '0.6vmin 2.4vmin', borderRadius: '1.2vmin', whiteSpace: 'nowrap', background: 'rgba(220,239,227,.85)' }}
            initial={{ scale: 1.8, opacity: 0, rotate: -16 }} animate={beat >= 5 ? { scale: 1, opacity: 1, rotate: -9 } : {}} transition={{ type: 'spring', stiffness: 380, damping: 17 }}>
            Approved by you
          </motion.div>
        </div>
      </motion.div>
      <motion.div className="absolute" style={{ left: '52vw', top: '22vh', width: '40vw' }}
        animate={beat >= 6 ? { opacity: 0, x: '6vw' } : {}} transition={{ duration: 0.4 }}>
        <motion.div className="f-mono" style={{ fontSize: '2vmin', letterSpacing: '0.14em', color: 'var(--haldi)' }}
          initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.2 }}>THE AGENT PICKS WHO TO REMIND</motion.div>
        <motion.div className="f-display" style={{ fontSize: '9.5vmin', lineHeight: 0.98, color: 'var(--paper)', marginTop: '3vh' }}
          initial={{ clipPath: 'inset(0 0 100% 0)', y: '4vh' }} animate={{ clipPath: 'inset(0 0 0% 0)', y: 0 }} transition={{ duration: 0.7, ease: EASE, delay: 0.4 }}>
          It tells you <em style={{ color: 'var(--haldi)' }}>what to do.</em>
        </motion.div>
        <motion.div style={{ fontSize: '3.2vmin', color: 'rgba(247,241,230,.75)', marginTop: '4vh', lineHeight: 1.3 }}
          initial={{ opacity: 0, y: 12 }} animate={beat >= 3 ? { opacity: 1, y: 0 } : {}} transition={{ duration: 0.5 }}>
          Polite words. Your name. <br />Nothing goes out until you tap.
        </motion.div>
      </motion.div>
    </motion.section>
  );
}
