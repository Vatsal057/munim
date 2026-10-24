import { useState } from 'react';
import { motion } from 'framer-motion';
import { useSceneTimer } from '@/lib/video';
import { Phone, Caption, Tap, Shell, card } from '../Demo';

const D = [['Ramesh', '₹1,240', 'Namaste Ramesh ji, chawal ke ₹1,240 baaki hain. Jab sahi lage, is link se de dijiye.'], ['Lakshmi Tiffin', '₹860', 'Lakshmi avare, ₹860 baaki ide. Dhanyavaada!'], ['Pooja Tailors', '₹2,150', 'Pooja ji, a gentle reminder for ₹2,150. No rush.']];
export function Scene3() {
  const [b, setB] = useState(0);
  useSceneTimer([{ time: 600, callback: () => setB(1) }, { time: 1300, callback: () => setB(2) }, { time: 2000, callback: () => setB(3) }, { time: 3300, callback: () => setB(4) }, { time: 4600, callback: () => setB(5) }, { time: 5600, callback: () => setB(6) }]);
  return (
    <Shell>
      <Phone side="left">
        <div className="f-display" style={{ fontSize: '3.4vmin' }}>Reminders <span className="f-mono" style={{ fontSize: '1.6vmin', background: 'var(--haldi)', padding: '0.4vmin 1.2vmin', borderRadius: 99 }}>3 drafts</span></div>
        {D.map(([n, a, m], i) => (
          <motion.div key={n} style={{ ...card, padding: '1.8vmin' }} initial={{ opacity: 0, y: 16 }} animate={b >= i + 1 ? { opacity: 1, y: 0 } : {}}>
            <div className="flex justify-between"><span style={{ fontSize: '2.1vmin', fontWeight: 700 }}>{n}</span><span className="f-mono" style={{ fontSize: '2.1vmin', fontWeight: 700, color: 'var(--owed)' }}>{a}</span></div>
            <div style={{ fontSize: '1.7vmin', color: 'var(--muted)', margin: '0.8vmin 0 1.2vmin', lineHeight: 1.3 }}>{m}</div>
            <div className="flex justify-between items-center"><span className="f-mono" style={{ fontSize: '1.3vmin', background: 'var(--haldi-soft)', padding: '0.3vmin 1vmin', borderRadius: 99 }}>WhatsApp draft + QR</span>
              <motion.span style={{ fontSize: '1.7vmin', fontWeight: 700, padding: '0.7vmin 1.8vmin', borderRadius: 99 }} animate={b >= 5 ? { background: '#1c6e48', color: '#f7f1e6' } : { background: '#22285f', color: '#f7f1e6' }} transition={{ delay: i * 0.15 }}>{b >= 5 ? 'Approved' : 'Approve & send'}</motion.span></div>
          </motion.div>))}
        <div className="relative"><Tap show={b >= 4 && b < 5} x="75%" y="-6vmin" /></div>
      </Phone>
      <Caption side="right" step="03 / 05" title={<>You <em style={{ color: 'var(--owed)' }}>approve</em> every message.</>} body="The agent picks who to remind and drafts polite words in their language. Nothing is sent until you tap." items={['Likely-to-pay ranking', 'Respectful drafts, never threatening', 'Human approves each one']} beat={b >= 3 ? b - 2 : 0} />
      <motion.div className="absolute f-display" style={{ right: '9vw', bottom: '9vh', fontSize: '5vmin', fontWeight: 700, color: 'var(--owed)', border: '0.7vmin solid var(--owed)', padding: '0.6vmin 2.4vmin', borderRadius: '1.2vmin', background: 'rgba(220,239,227,.9)' }}
        initial={{ scale: 1.8, opacity: 0, rotate: -14 }} animate={b >= 5 ? { scale: 1, opacity: 1, rotate: -6 } : {}} transition={{ type: 'spring', stiffness: 380, damping: 17 }}>Approved by you</motion.div>
    </Shell>
  );
}
