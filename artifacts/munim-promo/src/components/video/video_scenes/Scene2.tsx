import { useState } from 'react';
import { motion } from 'framer-motion';
import { useSceneTimer } from '@/lib/video';

const EASE = [0.22, 1, 0.36, 1] as const;
const DAYS = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];
// chart coords in a 1000x500 viewBox; zero line at y=300
const PTS = [[40, 180], [190, 210], [340, 250], [490, 430], [640, 380], [790, 270], [940, 200]];
const PATH = 'M' + PTS.map((p) => p.join(',')).join(' L');

export function Scene2() {
  const [beat, setBeat] = useState(0);
  useSceneTimer([
    { time: 250, callback: () => setBeat(1) },
    { time: 2500, callback: () => setBeat(2) },
    { time: 3300, callback: () => setBeat(3) },
    { time: 4450, callback: () => setBeat(4) },
  ]);
  return (
    <motion.section className="absolute inset-0 overflow-hidden paper ledger grain"
      initial={{ opacity: 1 }} exit={{ opacity: 0, transition: { duration: 0.4 } }}>
      <motion.div className="absolute inset-0" animate={beat >= 4 ? { scale: 0.35, x: '-8vw', y: '14vh', opacity: 0 } : { scale: 1 }}
        transition={{ duration: 0.75, ease: [0.7, 0, 0.3, 1] }} style={{ transformOrigin: '52% 78%' }}>
        <motion.div className="absolute f-mono" style={{ left: '12vmin', top: '7vh', fontSize: '2vmin', letterSpacing: '0.14em', color: 'var(--muted)' }}
          initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }} transition={{ duration: 0.4 }}>
          THIS WEEK · CASH IN HAND
        </motion.div>
        <svg viewBox="0 0 1000 500" className="absolute" style={{ left: '24vw', top: '14vh', width: '70vw', height: '64vh', overflow: 'visible' }}>
          <line x1="0" x2="1000" y1="300" y2="300" stroke="var(--ink)" strokeOpacity=".35" strokeWidth="2" strokeDasharray="8 10" />
          <text x="1000" y="292" textAnchor="end" fill="var(--muted)" style={{ font: '600 18px JetBrains Mono' }}>₹0</text>
          <motion.path d="M340,250 L490,430 L640,380 L700,300 L280,300 Z" fill="var(--owe)" fillOpacity=".22"
            initial={{ opacity: 0 }} animate={{ opacity: beat >= 2 ? 1 : 0 }} transition={{ duration: 0.5 }} />
          <motion.path d={PATH} fill="none" stroke="var(--ink)" strokeWidth="7" strokeLinecap="round" strokeLinejoin="round"
            initial={{ pathLength: 0 }} animate={{ pathLength: beat >= 1 ? 1 : 0 }} transition={{ duration: 2.1, ease: [0.45, 0, 0.3, 1] }} />
          {PTS.map(([x], i) => (
            <motion.text key={DAYS[i]} x={x} y={490} textAnchor="middle" fill={i === 3 ? 'var(--owe)' : 'var(--ink)'}
              style={{ font: `${i === 3 ? 700 : 500} 26px Mukta` }}
              initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.3 + i * 0.28, duration: 0.3 }}>
              {DAYS[i]}
            </motion.text>
          ))}
          <motion.circle cx="490" cy="430" r="14" fill="var(--owe)"
            initial={{ scale: 0 }} animate={{ scale: beat >= 2 ? [0, 1.6, 1] : 0 }} transition={{ duration: 0.5 }} />
          <motion.circle cx="490" cy="430" r="14" fill="none" stroke="var(--owe)" strokeWidth="3"
            animate={beat >= 2 ? { scale: [1, 3.2], opacity: [0.7, 0] } : { opacity: 0 }} transition={{ duration: 1.3, repeat: Infinity }} />
        </svg>
        <motion.div className="absolute" style={{ left: '54vw', top: '73vh', transformOrigin: 'left top' }}
          initial={{ scale: 1.6, opacity: 0, rotate: -10 }} animate={beat >= 2 ? { scale: 1, opacity: 1, rotate: -4 } : {}}
          transition={{ type: 'spring', stiffness: 300, damping: 16 }}>
          <div className="f-mono" style={{ fontSize: '4.2vmin', fontWeight: 700, color: 'var(--owe)', border: '0.5vmin solid var(--owe)', padding: '0.6vmin 2vmin', borderRadius: '1vmin', background: 'var(--owe-soft)' }}>
            ₹18,400 short · Thu
          </div>
        </motion.div>
        <div className="absolute" style={{ left: '12vmin', bottom: '10vh', width: '34vw' }}>
          <motion.div className="f-display" style={{ fontSize: '9vmin', lineHeight: 0.98, color: 'var(--ink)' }}
            initial={{ clipPath: 'inset(0 0 100% 0)', y: '3vh' }} animate={beat >= 3 ? { clipPath: 'inset(0 0 0% 0)', y: 0 } : {}}
            transition={{ duration: 0.6, ease: EASE }}>
            The weekly <em style={{ color: 'var(--owe)' }}>cash gap.</em>
          </motion.div>
        </div>
      </motion.div>
    </motion.section>
  );
}
