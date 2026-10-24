import { useState } from 'react';
import { motion } from 'framer-motion';
import { useSceneTimer } from '@/lib/video';

const EASE = [0.22, 1, 0.36, 1] as const;

export function Scene6() {
  const [beat, setBeat] = useState(0);
  useSceneTimer([
    { time: 150, callback: () => setBeat(1) },
    { time: 650, callback: () => setBeat(2) },
    { time: 1250, callback: () => setBeat(3) },
    { time: 1800, callback: () => setBeat(4) },
    { time: 2600, callback: () => setBeat(5) },
    { time: 3800, callback: () => setBeat(6) },
  ]);
  return (
    <motion.section className="absolute inset-0 overflow-hidden" style={{ background: 'var(--ink)' }} exit={{ opacity: 0, transition: { duration: 0.4 } }}>
      <motion.div className="absolute inset-0" animate={beat >= 6 ? { opacity: 0, scale: 0.96 } : { opacity: 1, scale: 1 }} transition={{ duration: 0.6 }}>
        <div className="absolute" style={{ left: '50%', top: '50%', width: '100vmin', height: '100vmin', marginLeft: '-50vmin', marginTop: '-50vmin', borderRadius: '50%', background: 'radial-gradient(circle, rgba(242,165,26,.14), transparent 60%)' }} />
        <div className="absolute flex items-center" style={{ left: '12vw', top: '18vh', gap: '5vmin' }}>
          <motion.div className="rounded-full flex items-center justify-center shrink-0" style={{ width: '30vmin', height: '30vmin', background: 'var(--haldi)', boxShadow: 'inset 0 0 0 1.4vmin rgba(22,26,66,.18)' }}
            initial={{ scale: 2.2, opacity: 0, rotate: -30 }} animate={beat >= 1 ? { scale: 1, opacity: 1, rotate: -8 } : {}} transition={{ type: 'spring', stiffness: 300, damping: 16 }}>
            <span style={{ fontFamily: 'Noto Sans Devanagari', fontWeight: 700, fontSize: '19vmin', color: 'var(--ink)', lineHeight: 1, marginTop: '-2vmin' }}>म</span>
          </motion.div>
          <div>
            <div className="overflow-hidden" style={{ paddingBottom: '2vmin' }}>
              <motion.div className="f-display" style={{ fontSize: '22vmin', fontWeight: 700, lineHeight: 0.9, color: 'var(--paper)' }}
                initial={{ y: '110%' }} animate={beat >= 2 ? { y: 0 } : {}} transition={{ duration: 0.7, ease: EASE }}>Munim</motion.div>
            </div>
            <svg viewBox="0 0 600 30" style={{ width: '56vmin', height: '3vmin', display: 'block' }}>
              <motion.path d="M5,18 C120,6 260,26 400,14 S560,10 595,16" fill="none" stroke="var(--haldi)" strokeWidth="6" strokeLinecap="round"
                initial={{ pathLength: 0 }} animate={{ pathLength: beat >= 3 ? 1 : 0 }} transition={{ duration: 0.7, ease: 'easeInOut' }} />
            </svg>
            <motion.div className="f-mono" style={{ fontSize: '2vmin', letterSpacing: '0.14em', color: 'rgba(247,241,230,.6)', marginTop: '2vh' }}
              initial={{ opacity: 0 }} animate={{ opacity: beat >= 3 ? 1 : 0 }}>AI MUNIM FOR SMALL BUSINESSES</motion.div>
          </div>
        </div>
        <div className="absolute" style={{ left: '12vw', bottom: '14vh', right: '8vw' }}>
          <motion.div style={{ fontSize: '4vmin', fontWeight: 600, color: 'var(--paper)', lineHeight: 1.2 }}
            initial={{ opacity: 0, y: 16 }} animate={beat >= 4 ? { opacity: 1, y: 0 } : {}} transition={{ duration: 0.5, ease: EASE }}>
            Tell it what happened. It tells you what to do.
          </motion.div>
          <motion.div className="f-display italic" style={{ fontSize: '5.6vmin', color: 'var(--haldi)', lineHeight: 1.2, marginTop: '1vh' }}
            initial={{ opacity: 0, y: 16 }} animate={beat >= 5 ? { opacity: 1, y: 0 } : {}} transition={{ duration: 0.6, ease: EASE }}>
            Get paid before you have to pay.
          </motion.div>
        </div>
      </motion.div>
    </motion.section>
  );
}
