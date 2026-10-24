import { useState } from 'react';
import { motion } from 'framer-motion';
import { Mic, Camera, Type, Check } from 'lucide-react';
import { useSceneTimer } from '@/lib/video';
import { Phone, Caption, Tap, Shell, card } from '../Demo';

const ROWS = [['Ramesh', 'chawal 2 bori', '₹1,240'], ['Lakshmi Tiffin', 'tiffin', '₹860'], ['Pooja Tailors', 'blouse stitching', '₹2,150']];
export function Scene2() {
  const [b, setB] = useState(0);
  useSceneTimer([{ time: 700, callback: () => setB(1) }, { time: 2800, callback: () => setB(2) }, { time: 3500, callback: () => setB(3) }, { time: 4200, callback: () => setB(4) }, { time: 5000, callback: () => setB(5) }, { time: 6200, callback: () => setB(6) }]);
  return (
    <Shell>
      <Caption side="left" step="02 / 05" title={<>Tell Munim <em style={{ color: 'var(--owe)' }}>what happened.</em></>} body="No typing needed. Speak, snap the khata page, or text, in Hindi, Kannada or English." items={['Voice note', 'Photo of the khata page', 'Plain text']} beat={b >= 1 ? 3 : 0} />
      <Phone side="right">
        <div className="flex" style={{ gap: '1vmin' }}>
          {[[Mic, 'Voice'], [Camera, 'Photo'], [Type, 'Text']].map(([I, l], i) => { const Ic = I as typeof Mic; return (
            <div key={l as string} className="flex items-center justify-center" style={{ flex: 1, height: '6vmin', borderRadius: 99, gap: '0.8vmin', fontSize: '1.8vmin', fontWeight: 700, background: i === 0 ? 'var(--ink)' : '#e8e2d4', color: i === 0 ? 'var(--paper)' : 'var(--ink)' }}><Ic style={{ width: '2vmin' }} />{l as string}</div>); })}
        </div>
        <div className="flex flex-col items-center" style={{ marginTop: '1vmin' }}>
          <div className="relative flex items-center justify-center" style={{ width: '12vmin', height: '12vmin' }}>
            {[0, 1].map((k) => <motion.div key={k} className="absolute inset-0 rounded-full" style={{ background: 'var(--owe)' }} animate={b >= 1 && b < 3 ? { scale: [1, 1.8], opacity: [0.45, 0] } : { opacity: 0 }} transition={{ duration: 1.4, repeat: Infinity, delay: k * 0.7 }} />)}
            <div className="relative rounded-full flex items-center justify-center" style={{ width: '12vmin', height: '12vmin', background: 'var(--owe)' }}><Mic color="#fff" style={{ width: '5vmin' }} /></div>
          </div>
          <div className="f-mono" style={{ fontSize: '1.5vmin', color: 'var(--muted)', marginTop: '1vmin' }}>{b < 1 ? 'TAP TO SPEAK' : b < 3 ? 'LISTENING…' : 'UNDERSTOOD'}</div>
        </div>
        <motion.div style={{ ...card, padding: '1.8vmin', fontSize: '2.2vmin', fontWeight: 600, lineHeight: 1.3 }} initial={{ opacity: 0 }} animate={b >= 1 ? { opacity: 1 } : {}}>
          “Ramesh ne 2 bori chawal liye, ₹1,240 baaki. Lakshmi ₹860…”
        </motion.div>
        {ROWS.map(([n, w, a], i) => (
          <motion.div key={n} className="flex justify-between items-center" style={{ ...card, padding: '1.4vmin 2vmin' }} initial={{ opacity: 0, y: 14 }} animate={b >= i + 3 ? { opacity: 1, y: 0 } : {}}>
            <div><div style={{ fontSize: '2.1vmin', fontWeight: 700 }}>{n}</div><div style={{ fontSize: '1.5vmin', color: 'var(--muted)' }}>{w}</div></div>
            <span className="f-mono" style={{ fontSize: '2.2vmin', fontWeight: 700, color: 'var(--owed)' }}>{a}</span>
          </motion.div>))}
        <div className="relative flex items-center justify-center" style={{ height: '6.4vmin', borderRadius: '2vmin', fontSize: '2.1vmin', fontWeight: 700, marginTop: 'auto', background: b >= 6 ? 'var(--owed)' : 'var(--ink)', color: 'var(--paper)', gap: '1vmin' }}>
          {b >= 6 && <Check style={{ width: '2.4vmin' }} />}{b >= 6 ? 'Saved to khata' : 'Confirm 3 entries'}
          <Tap show={b >= 5} x="65%" y="50%" />
        </div>
      </Phone>
    </Shell>
  );
}
