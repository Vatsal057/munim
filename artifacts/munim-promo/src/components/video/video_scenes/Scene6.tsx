import { useState } from 'react';
import { motion } from 'framer-motion';
import { useSceneTimer } from '@/lib/video';
import { EASE } from '../Demo';

const STEPS = [['Tell', 'voice · photo · text'], ['Forecast', 'the weekly gap'], ['Approve', 'drafted reminders'], ['Get paid', 'Pine Labs link']];
export function Scene6() {
  const [b, setB] = useState(0);
  useSceneTimer([{ time: 200, callback: () => setB(1) }, { time: 2800, callback: () => setB(2) }]);
  return (
    <motion.section className="absolute inset-0 overflow-hidden" style={{ background: 'var(--ink)' }} initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0, transition: { duration: 0.3 } }}>
      <div className="absolute flex items-center" style={{ left: '8vw', top: '12vh', gap: '3vmin' }}>
        <div className="rounded-full flex items-center justify-center" style={{ width: '12vmin', height: '12vmin', background: 'var(--haldi)', fontFamily: 'Noto Sans Devanagari', fontWeight: 700, fontSize: '8vmin', color: 'var(--ink)' }}>म</div>
        <div className="f-display" style={{ fontSize: '11vmin', fontWeight: 700, color: 'var(--paper)' }}>Munim, end to end</div>
      </div>
      <div className="absolute flex" style={{ left: '8vw', right: '8vw', top: '40vh', gap: '2vw' }}>
        {STEPS.map(([t, s], i) => (
          <motion.div key={t} style={{ flex: 1, borderTop: '0.6vmin solid var(--haldi)', paddingTop: '2vmin' }} initial={{ opacity: 0, y: 24 }} animate={b >= 1 ? { opacity: 1, y: 0 } : {}} transition={{ delay: i * 0.35, duration: 0.5, ease: EASE }}>
            <div className="f-mono" style={{ fontSize: '2vmin', color: 'var(--haldi)' }}>0{i + 1}</div>
            <div className="f-display" style={{ fontSize: '5.6vmin', color: 'var(--paper)' }}>{t}</div>
            <div style={{ fontSize: '2.6vmin', color: 'rgba(247,241,230,.7)' }}>{s}</div>
          </motion.div>))}
      </div>
      <motion.div className="absolute" style={{ left: '8vw', bottom: '12vh', fontSize: '3.4vmin', color: 'var(--paper)', fontWeight: 600 }} initial={{ opacity: 0 }} animate={{ opacity: b >= 2 ? 1 : 0 }}>
        Honest numbers: forecasts say “likely”, and test mode says test mode.
      </motion.div>
    </motion.section>
  );
}
