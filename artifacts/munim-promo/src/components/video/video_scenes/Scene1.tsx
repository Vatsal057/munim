import { useState } from 'react';
import { motion } from 'framer-motion';
import { Mic, ArrowRight, Sun } from 'lucide-react';
import { useSceneTimer } from '@/lib/video';
import { Phone, Caption, Tap, Shell, card } from '../Demo';

export function Scene1() {
  const [b, setB] = useState(0);
  useSceneTimer([{ time: 1400, callback: () => setB(1) }, { time: 2200, callback: () => setB(2) }, { time: 3000, callback: () => setB(3) }, { time: 4500, callback: () => setB(4) }]);
  return (
    <Shell>
      <Phone side="left">
        <div className="flex justify-between items-center">
          <span className="f-mono flex items-center" style={{ fontSize: '1.6vmin', gap: '0.8vmin', color: 'var(--muted)' }}><Sun style={{ width: '2vmin', color: 'var(--haldi)' }} />GOOD EVENING</span>
          <motion.span className="f-mono" style={{ fontSize: '1.6vmin', fontWeight: 700, background: 'var(--owe-soft)', color: 'var(--owe)', padding: '0.5vmin 1.4vmin', borderRadius: 99 }}
            initial={{ opacity: 0, scale: 0.7 }} animate={b >= 1 ? { opacity: 1, scale: 1 } : {}}>Likely short ₹18,400</motion.span>
        </div>
        <div style={{ ...card, padding: '2.4vmin', position: 'relative' }}>
          <div className="f-display" style={{ fontSize: '3vmin', lineHeight: 1.25 }}>Sharma Wholesale is due Friday. You’ll likely be short. 3 customers can cover it.</div>
          <div className="flex items-center justify-center" style={{ marginTop: '2.4vmin', height: '7vmin', borderRadius: '2vmin', background: 'var(--ink)', color: 'var(--paper)', fontSize: '2.2vmin', fontWeight: 600, gap: '1vmin' }}>
            Review & send reminders <ArrowRight style={{ width: '2.4vmin', color: 'var(--haldi)' }} />
          </div>
          <Tap show={b >= 4} x="70%" y="82%" />
        </div>
        <div className="grid grid-cols-2" style={{ gap: '1.6vmin' }}>
          <div style={{ background: 'var(--ink)', borderRadius: '2.4vmin', padding: '2vmin', height: '15vmin', color: 'var(--paper)' }} className="flex flex-col justify-between">
            <Mic style={{ width: '4vmin', color: 'var(--haldi)' }} /><div style={{ fontSize: '2.2vmin', fontWeight: 700 }}>Tell Munim</div></div>
          <div style={{ ...card, padding: '2vmin', height: '15vmin' }} className="flex flex-col justify-between">
            <span className="f-mono self-end" style={{ fontSize: '1.4vmin', background: 'var(--haldi)', padding: '0.3vmin 1.2vmin', borderRadius: 99, fontWeight: 700 }}>3 ready</span>
            <div style={{ fontSize: '2.2vmin', fontWeight: 700 }}>Reminders</div></div>
        </div>
        <motion.div style={{ ...card, padding: '1.6vmin 2vmin' }} initial={{ opacity: 0 }} animate={b >= 2 ? { opacity: 1 } : {}}>
          {[['They owe me', '₹4,725', 'var(--owed)'], ['I owe', '₹18,400', 'var(--owe)']].map(([l, a, c]) => (
            <div key={l} className="flex justify-between items-center" style={{ padding: '1.2vmin 0' }}>
              <span style={{ fontSize: '2vmin', fontWeight: 600 }}>{l}</span><span className="f-mono" style={{ fontSize: '3vmin', fontWeight: 700, color: c }}>{a}</span></div>))}
        </motion.div>
      </Phone>
      <Caption side="right" step="01 / 05" title={<>Today’s <em style={{ color: 'var(--owe)' }}>briefing.</em></>} body="One answer per screen. Munim forecasts the week and says what to do next." items={['Forecast says “likely”, not “certain”', 'Green = owed to you. Red = you owe.', 'One thumb-sized next action']} beat={b} />
    </Shell>
  );
}
