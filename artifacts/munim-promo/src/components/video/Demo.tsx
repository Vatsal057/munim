import type { ReactNode } from 'react';
import { motion } from 'framer-motion';

export const EASE = [0.22, 1, 0.36, 1] as const;

export function Phone({ side, children, scale = 1 }: { side: 'left' | 'right'; children: ReactNode; scale?: number }) {
  return (
    <motion.div className="absolute" style={{ top: '5vh', height: '90vh', width: '42vh', [side === 'left' ? 'left' : 'right']: '9vw' }}
      initial={{ y: '8vh', opacity: 0, rotate: side === 'left' ? -2 : 2 }} animate={{ y: 0, opacity: 1, rotate: 0, scale }}
      transition={{ duration: 0.7, ease: EASE }}>
      <div className="w-full h-full grain relative overflow-hidden" style={{ background: 'var(--paper)', border: '1.1vmin solid #0e1130', borderRadius: '5vmin', boxShadow: '0 4vmin 8vmin -2vmin rgba(22,26,66,.45)' }}>
        <div className="absolute left-1/2" style={{ top: '1vmin', width: '10vmin', height: '2vmin', marginLeft: '-5vmin', background: '#0e1130', borderRadius: 99, zIndex: 5 }} />
        <div className="absolute inset-0 flex flex-col" style={{ padding: '5vmin 2.6vmin 2.6vmin', gap: '1.8vmin' }}>{children}</div>
      </div>
    </motion.div>
  );
}

export function Caption({ side, step, title, body, items, beat = 99 }: { side: 'left' | 'right'; step: string; title: ReactNode; body: string; items?: string[]; beat?: number }) {
  return (
    <div className="absolute" style={{ top: '16vh', width: '38vw', [side === 'left' ? 'left' : 'right']: '8vw' }}>
      <motion.div className="f-mono flex items-center" style={{ gap: '1.4vmin', fontSize: '2vmin', letterSpacing: '0.14em', color: 'var(--owe)' }}
        initial={{ opacity: 0, x: -16 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: 0.15 }}>
        <span style={{ background: 'var(--ink)', color: 'var(--haldi)', padding: '0.5vmin 1.4vmin', borderRadius: 99 }}>STEP {step}</span>
      </motion.div>
      <motion.div className="f-display" style={{ fontSize: '8.4vmin', lineHeight: 1, marginTop: '3vh', color: 'var(--ink)' }}
        initial={{ clipPath: 'inset(0 0 100% 0)', y: '3vh' }} animate={{ clipPath: 'inset(0 0 0% 0)', y: 0 }} transition={{ duration: 0.6, ease: EASE, delay: 0.3 }}>
        {title}
      </motion.div>
      <motion.div style={{ fontSize: '3.2vmin', lineHeight: 1.3, marginTop: '3vh', color: 'var(--muted)' }}
        initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.7, duration: 0.5 }}>{body}</motion.div>
      {items && (
        <div style={{ marginTop: '3vh' }}>
          {items.map((t, i) => (
            <motion.div key={t} className="flex items-center" style={{ gap: '1.6vmin', fontSize: '3vmin', fontWeight: 600, padding: '0.9vmin 0' }}
              initial={{ opacity: 0, x: -14 }} animate={beat >= i + 1 ? { opacity: 1, x: 0 } : {}} transition={{ duration: 0.4, ease: EASE }}>
              <span style={{ width: '1.2vmin', height: '1.2vmin', borderRadius: 99, background: 'var(--haldi)' }} />{t}
            </motion.div>
          ))}
        </div>
      )}
    </div>
  );
}

export function Tap({ show, x, y }: { show: boolean; x: string; y: string }) {
  return (
    <motion.div className="absolute rounded-full" style={{ left: x, top: y, width: '7vmin', height: '7vmin', marginLeft: '-3.5vmin', marginTop: '-3.5vmin', border: '0.6vmin solid var(--haldi)', background: 'rgba(242,165,26,.3)', zIndex: 20 }}
      initial={{ scale: 0.4, opacity: 0 }} animate={show ? { scale: [0.4, 1, 1.5], opacity: [0, 1, 0] } : { opacity: 0 }} transition={{ duration: 0.7 }} />
  );
}

export const Shell = ({ children, bg = 'var(--paper-2)' }: { children: ReactNode; bg?: string }) => (
  <motion.section className="absolute inset-0 overflow-hidden grain" style={{ background: bg }}
    initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0, transition: { duration: 0.35, delay: 0.2 } }} transition={{ duration: 0.35 }}>
    {children}
  </motion.section>
);

export const card = { background: '#fffaf0', border: '1px solid rgba(34,40,95,.14)', borderRadius: '2.2vmin' } as const;
