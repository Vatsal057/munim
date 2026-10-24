import { useState } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import { useSceneTimer } from '@/lib/video';

const EASE = [0.22, 1, 0.36, 1] as const;
const STAMP = { type: 'spring', stiffness: 320, damping: 18 } as const;

export function Scene1() {
  const [beat, setBeat] = useState(0);
  useSceneTimer([
    { time: 450, callback: () => setBeat(1) },
    { time: 900, callback: () => setBeat(2) },
    { time: 1500, callback: () => setBeat(3) },
    { time: 2650, callback: () => setBeat(4) },
    { time: 3300, callback: () => setBeat(5) },
    { time: 4550, callback: () => setBeat(6) },
  ]);
  return (
    <motion.section className="absolute inset-0 overflow-hidden" style={{ background: 'var(--ink-deep)' }}
      initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0, transition: { duration: 0.4, delay: 0.3 } }}
      transition={{ duration: 0.35 }}>
      <motion.img src={`${import.meta.env.BASE_URL}images/counter.jpg`} alt=""
        className="absolute inset-0 w-full h-full object-cover"
        initial={{ scale: 1.22, x: '2%' }} animate={{ scale: beat >= 4 ? 1.16 : 1.08, x: beat >= 4 ? '-3%' : '0%' }}
        transition={{ duration: beat >= 4 ? 2.4 : 2.6, ease: EASE }} />
      <div className="absolute inset-0" style={{ background: 'linear-gradient(90deg, rgba(22,26,66,.92) 0%, rgba(22,26,66,.72) 48%, rgba(22,26,66,.15) 100%)' }} />
      <div className="absolute" style={{ left: '7vw', top: '12vh', right: '30vw' }}>
        <motion.div className="f-mono" style={{ fontSize: '2vmin', color: 'var(--haldi)', letterSpacing: '0.12em' }}
          initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.12, duration: 0.4 }}>
          MONDAY · 8:40 PM · SHIVAJI NAGAR
        </motion.div>
        <div className="relative" style={{ height: '50vh', marginTop: '4vh' }}>
          <AnimatePresence>
            {beat < 4 && (
              <motion.div key="a" className="absolute inset-0" exit={{ y: '-8vh', opacity: 0, filter: 'blur(8px)' }} transition={{ duration: 0.35 }}>
                <motion.div className="f-display" style={{ fontSize: '7.5vmin', color: 'var(--paper)', lineHeight: 1 }}
                  initial={{ y: '4vh', opacity: 0 }} animate={beat >= 1 ? { y: 0, opacity: 1 } : {}} transition={{ duration: 0.5, ease: EASE }}>
                  Supplier wants
                </motion.div>
                <motion.div className="f-mono" style={{ fontSize: '19vmin', fontWeight: 700, color: '#ff6b6b', lineHeight: 1, marginTop: '1vh', transformOrigin: 'left center' }}
                  initial={{ scale: 1.6, opacity: 0, rotate: -4 }} animate={beat >= 2 ? { scale: 1, opacity: 1, rotate: 0 } : {}} transition={STAMP}>
                  ₹18,400
                </motion.div>
                <motion.div className="f-display italic" style={{ fontSize: '7.5vmin', color: 'var(--paper)', lineHeight: 1.1 }}
                  initial={{ y: '4vh', opacity: 0 }} animate={beat >= 3 ? { y: 0, opacity: 1 } : {}} transition={{ duration: 0.5, ease: EASE }}>
                  on Friday.
                </motion.div>
              </motion.div>
            )}
            {beat >= 4 && (
              <motion.div key="b" className="absolute inset-0" initial={{ y: '6vh', opacity: 0 }} animate={{ y: 0, opacity: 1 }} transition={{ duration: 0.5, ease: EASE }}>
                <div className="f-display" style={{ fontSize: '9vmin', color: 'var(--paper)', lineHeight: 1 }}>Customers pay…</div>
                <motion.div className="f-display italic" style={{ fontSize: '21vmin', color: 'var(--haldi)', lineHeight: 1, marginTop: '1vh' }}
                  initial={{ opacity: 0, letterSpacing: '0.2em' }} animate={beat >= 5 ? { opacity: 1, letterSpacing: '-0.02em' } : {}} transition={{ duration: 0.9, ease: EASE }}>
                  someday.
                </motion.div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </div>
      <motion.div className="absolute inset-x-0 bottom-0 paper" style={{ height: '100%', transformOrigin: 'bottom' }}
        initial={{ scaleY: 0 }} animate={{ scaleY: beat >= 6 ? 1 : 0 }} transition={{ duration: 0.65, ease: [0.7, 0, 0.2, 1] }}>
        <div style={{ height: '1.2vh', background: 'var(--haldi)' }} />
      </motion.div>
    </motion.section>
  );
}
