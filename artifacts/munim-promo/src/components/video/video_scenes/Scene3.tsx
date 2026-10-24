import { useState, type ReactNode } from 'react';
import { motion } from 'framer-motion';
import { Mic, Camera, MessageSquareText } from 'lucide-react';
import { useSceneTimer } from '@/lib/video';

const EASE = [0.22, 1, 0.36, 1] as const;

function Card({ show, fold, i, children }: { show: boolean; fold: boolean; i: number; children: ReactNode }) {
  const rot = [-3, 1.5, -1][i];
  return (
    <motion.div className="relative rounded-[2.4vmin] grain overflow-hidden"
      style={{ width: '27vw', height: '50vh', background: '#fffaf0', boxShadow: '0 2vmin 5vmin -2vmin rgba(22,26,66,.35)', border: '1px solid rgba(34,40,95,.12)' }}
      initial={{ y: '40vh', rotate: rot * 3, opacity: 0 }}
      animate={fold ? { x: `${(1 - i) * 28}vw`, y: '-4vh', scale: 0.4, opacity: 0, rotate: 0 } : show ? { y: 0, rotate: rot, opacity: 1 } : {}}
      transition={fold ? { duration: 0.6, ease: [0.7, 0, 0.3, 1], delay: i * 0.06 } : { type: 'spring', stiffness: 240, damping: 22 }}>
      {children}
    </motion.div>
  );
}

export function Scene3() {
  const [beat, setBeat] = useState(0);
  useSceneTimer([
    { time: 300, callback: () => setBeat(1) },
    { time: 900, callback: () => setBeat(2) },
    { time: 1700, callback: () => setBeat(3) },
    { time: 2500, callback: () => setBeat(4) },
    { time: 3300, callback: () => setBeat(5) },
    { time: 4550, callback: () => setBeat(6) },
  ]);
  const label = { fontSize: '1.9vmin', letterSpacing: '0.14em', color: 'var(--muted)' } as const;
  return (
    <motion.section className="absolute inset-0 overflow-hidden" style={{ background: 'var(--paper-2)' }}
      initial={{ clipPath: 'circle(0% at 44% 92%)' }} animate={{ clipPath: 'circle(150% at 44% 92%)' }}
      exit={{ opacity: 0, transition: { duration: 0.35, delay: 0.25 } }} transition={{ duration: 0.7, ease: EASE }}>
      <motion.h2 className="absolute f-display m-0" style={{ left: '6vw', top: '7vh', fontSize: '8.5vmin', lineHeight: 1, color: 'var(--ink)' }}
        initial={{ opacity: 0, y: '3vh' }} animate={beat >= 1 && beat < 6 ? { opacity: 1, y: 0 } : { opacity: 0, y: beat >= 6 ? '-3vh' : '3vh' }} transition={{ duration: 0.5, ease: EASE }}>
        Tell it <em>what happened.</em>
      </motion.h2>
      <motion.div className="absolute f-mono" style={{ right: '6vw', top: '10vh', fontSize: '2vmin', letterSpacing: '0.12em', color: 'var(--owe)' }}
        initial={{ opacity: 0 }} animate={{ opacity: beat >= 1 && beat < 6 ? 1 : 0 }}>VOICE · PHOTO · TEXT</motion.div>
      <div className="absolute flex justify-center" style={{ left: 0, right: 0, top: '28vh', gap: '3vw' }}>
        <Card i={0} show={beat >= 2} fold={beat >= 6}>
          <div className="flex flex-col items-center h-full" style={{ padding: '3.5vmin' }}>
            <div className="f-mono self-start" style={label}>VOICE · हिंदी</div>
            <div className="relative flex items-center justify-center" style={{ marginTop: '4vh', width: '14vmin', height: '14vmin' }}>
              {[0, 1].map((k) => (
                <motion.div key={k} className="absolute inset-0 rounded-full" style={{ background: 'var(--owe)' }}
                  animate={{ scale: [1, 1.8], opacity: [0.45, 0] }} transition={{ duration: 1.4, repeat: Infinity, delay: k * 0.7 }} />
              ))}
              <div className="relative rounded-full flex items-center justify-center" style={{ width: '14vmin', height: '14vmin', background: 'var(--owe)' }}>
                <Mic color="#fff" style={{ width: '6vmin', height: '6vmin' }} />
              </div>
            </div>
            <div className="flex items-end" style={{ gap: '0.6vmin', height: '5vh', marginTop: '3vh' }}>
              {Array.from({ length: 18 }).map((_, k) => (
                <motion.div key={k} style={{ width: '0.7vmin', background: 'var(--ink)', borderRadius: 4 }}
                  animate={{ height: [`${1 + (k % 5)}vh`, `${4 - (k % 3)}vh`, `${1 + (k % 4)}vh`] }} transition={{ duration: 0.6, repeat: Infinity, delay: k * 0.04 }} />
              ))}
            </div>
            <div style={{ fontSize: '3vmin', fontWeight: 600, lineHeight: 1.25, marginTop: '2vh', textAlign: 'center' }}>
              “Ramesh ne 2 bori chawal liye, <span className="f-mono" style={{ color: 'var(--owed)' }}>₹1,240</span> baaki.”
            </div>
          </div>
        </Card>
        <Card i={1} show={beat >= 3} fold={beat >= 6}>
          <div className="h-full flex flex-col" style={{ padding: '3.5vmin' }}>
            <div className="f-mono flex items-center" style={{ ...label, gap: '1vmin' }}><Camera style={{ width: '2.4vmin', height: '2.4vmin' }} />PHOTO OF KHATA</div>
            <div className="relative flex-1 overflow-hidden rounded-[1.5vmin] ledger" style={{ marginTop: '2vh', background: '#f4e7c8', padding: '2vmin 2vmin 0 11vmin', transform: 'rotate(-1.5deg)' }}>
              {[['Pooja Tailors', '2,150'], ['Anand (cart)', '640'], ['Sunita', '1,075'], ['Lakshmi', '860']].map(([n, a]) => (
                <div key={n} className="flex justify-between" style={{ height: '6vmin', alignItems: 'flex-end', fontFamily: 'Caveat, cursive', fontSize: '3.2vmin', color: '#2a3a8f', fontStyle: 'italic' }}>
                  <span>{n}</span><span className="f-mono" style={{ fontStyle: 'normal', fontSize: '2.6vmin' }}>{a}</span>
                </div>
              ))}
              <motion.div className="absolute inset-x-0" style={{ height: '0.6vmin', background: 'var(--haldi)', boxShadow: '0 0 0 1vmin rgba(242,165,26,.25)' }}
                initial={{ top: '0%' }} animate={beat >= 3 ? { top: ['0%', '100%', '0%'] } : {}} transition={{ duration: 1.8, repeat: Infinity, ease: 'easeInOut' }} />
            </div>
            <motion.div className="f-mono" style={{ fontSize: '2.4vmin', fontWeight: 700, color: 'var(--owed)', marginTop: '1.6vh' }}
              initial={{ opacity: 0 }} animate={{ opacity: beat >= 4 ? 1 : 0 }}>4 entries read · ₹4,725 owed</motion.div>
          </div>
        </Card>
        <Card i={2} show={beat >= 4} fold={beat >= 6}>
          <div className="h-full flex flex-col" style={{ padding: '3.5vmin' }}>
            <div className="f-mono flex items-center" style={{ ...label, gap: '1vmin' }}><MessageSquareText style={{ width: '2.4vmin', height: '2.4vmin' }} />TEXT · ಕನ್ನಡ</div>
            <motion.div className="f-kn self-end" style={{ marginTop: '5vh', background: 'var(--ink)', color: 'var(--paper)', padding: '2vmin 2.6vmin', borderRadius: '2.4vmin 2.4vmin 0.6vmin 2.4vmin', fontSize: '3.2vmin', fontWeight: 600, lineHeight: 1.35 }}
              initial={{ scale: 0.6, opacity: 0 }} animate={beat >= 4 ? { scale: 1, opacity: 1 } : {}} transition={{ type: 'spring', stiffness: 300, damping: 20, delay: 0.25 }}>
              ಲಕ್ಷ್ಮಿ ಟಿಫಿನ್ — <span className="f-mono">₹860</span> ಬಾಕಿ
            </motion.div>
            <motion.div className="self-start" style={{ marginTop: '3vh', background: 'var(--haldi-soft)', padding: '1.8vmin 2.4vmin', borderRadius: '2.4vmin 2.4vmin 2.4vmin 0.6vmin', fontSize: '2.8vmin', fontWeight: 600, lineHeight: 1.3 }}
              initial={{ scale: 0.6, opacity: 0 }} animate={beat >= 5 ? { scale: 1, opacity: 1 } : {}} transition={{ type: 'spring', stiffness: 300, damping: 20 }}>
              Noted. Lakshmi usually pays by Wednesday.
            </motion.div>
          </div>
        </Card>
      </div>
    </motion.section>
  );
}
