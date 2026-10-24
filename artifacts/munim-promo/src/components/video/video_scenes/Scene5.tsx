import { useState } from 'react';
import { motion } from 'framer-motion';
import { Check } from 'lucide-react';
import { useSceneTimer } from '@/lib/video';

const EASE = [0.22, 1, 0.36, 1] as const;
const STEPS = Array.from({ length: 31 }, (_, i) => Math.round(18400 * Math.pow(1 - i / 30, 1.6)));
const TOASTS = [['Ramesh', '₹1,240'], ['Lakshmi Tiffin', '₹860'], ['Pooja Tailors', '₹2,150'], ['Anand (cart)', '₹640']];

export function Scene5() {
  const [beat, setBeat] = useState(0);
  const [step, setStep] = useState(0);
  useSceneTimer([
    { time: 250, callback: () => setBeat(1) },
    ...STEPS.map((_, i) => ({ time: 500 + i * 70, callback: () => setStep(i) })),
    { time: 700, callback: () => setBeat(2) },
    { time: 1250, callback: () => setBeat(3) },
    { time: 1800, callback: () => setBeat(4) },
    { time: 2350, callback: () => setBeat(5) },
    { time: 2750, callback: () => setBeat(6) },
    { time: 4150, callback: () => setBeat(7) },
  ]);
  const covered = step >= STEPS.length - 1;
  return (
    <motion.section className="absolute inset-0 overflow-hidden grain" style={{ background: 'var(--owed-soft)' }}
      initial={{ clipPath: 'inset(0 0 0 100%)' }} animate={{ clipPath: 'inset(0 0 0 0%)' }} exit={{ opacity: 0, transition: { duration: 0.3, delay: 0.3 } }}
      transition={{ duration: 0.55, ease: [0.7, 0, 0.2, 1] }}>
      <svg viewBox="0 0 1000 300" preserveAspectRatio="none" className="absolute" style={{ left: 0, bottom: 0, width: '100%', height: '38vh' }}>
        <line x1="0" x2="1000" y1="200" y2="200" stroke="var(--owed)" strokeOpacity=".4" strokeWidth="2" strokeDasharray="8 10" />
        <motion.path d="M0,150 C150,160 250,190 380,280 C470,240 520,150 640,110 C760,80 880,60 1000,40" fill="none" stroke="var(--owed)" strokeWidth="6" strokeLinecap="round"
          initial={{ pathLength: 0 }} animate={{ pathLength: beat >= 1 ? 1 : 0 }} transition={{ duration: 3, ease: 'easeInOut' }} />
      </svg>
      <div className="absolute" style={{ left: '7vw', top: '10vh' }}>
        <motion.div className="f-mono" style={{ fontSize: '2.1vmin', letterSpacing: '0.14em', color: covered ? 'var(--owed)' : 'var(--owe)' }}
          initial={{ opacity: 0 }} animate={{ opacity: 1 }}>{covered ? 'THURSDAY · COVERED' : 'THURSDAY · SHORT BY'}</motion.div>
        <div className="f-mono" style={{ fontSize: '20vmin', fontWeight: 700, lineHeight: 1, color: covered ? 'var(--owed)' : 'var(--owe)', transition: 'color .3s' }}>
          ₹{STEPS[step].toLocaleString('en-IN')}
        </div>
        <motion.div className="f-display" style={{ fontSize: '9vmin', lineHeight: 1, color: 'var(--ink)', marginTop: '3vh' }}
          initial={{ clipPath: 'inset(0 0 100% 0)', y: '3vh' }} animate={beat >= 6 ? { clipPath: 'inset(0 0 0% 0)', y: 0 } : {}} transition={{ duration: 0.6, ease: EASE }}>
          Paid <em style={{ color: 'var(--owed)' }}>before Friday.</em>
        </motion.div>
      </div>
      <div className="absolute flex flex-col" style={{ right: '6vw', top: '12vh', gap: '1.8vh', width: '34vw' }}>
        {TOASTS.map(([n, a], i) => (
          <motion.div key={n} className="flex items-center rounded-[2vmin]" style={{ background: '#fffaf0', padding: '2vmin 2.4vmin', gap: '2vmin', boxShadow: '0 1.4vmin 3vmin -1.4vmin rgba(28,110,72,.4)' }}
            initial={{ x: '40vw', opacity: 0 }} animate={beat >= i + 2 ? { x: 0, opacity: 1 } : {}} transition={{ type: 'spring', stiffness: 260, damping: 24 }}>
            <div className="rounded-full flex items-center justify-center shrink-0" style={{ width: '6vmin', height: '6vmin', background: 'var(--owed)' }}>
              <Check color="#f7f1e6" style={{ width: '3.4vmin', height: '3.4vmin' }} strokeWidth={3} />
            </div>
            <div className="flex-1">
              <div style={{ fontSize: '2.8vmin', fontWeight: 700, lineHeight: 1 }}>{n} paid</div>
              <div className="f-mono" style={{ fontSize: '1.6vmin', color: 'var(--muted)' }}>UPI · Pine Labs link</div>
            </div>
            <div className="f-mono" style={{ fontSize: '3.2vmin', fontWeight: 700, color: 'var(--owed)' }}>{a}</div>
          </motion.div>
        ))}
      </div>
      <motion.div className="absolute rounded-full" style={{ left: '50%', top: '50%', width: '10vmin', height: '10vmin', marginLeft: '-5vmin', marginTop: '-5vmin', background: 'var(--ink)' }}
        initial={{ scale: 0 }} animate={{ scale: beat >= 7 ? 30 : 0 }} transition={{ duration: 0.55, ease: [0.7, 0, 0.3, 1] }} />
    </motion.section>
  );
}
