import { useState } from 'react';
import { motion } from 'framer-motion';
import { useSceneTimer } from '@/lib/video';
import { Phone, Caption, Shell, card } from '../Demo';

const S = [18400, 15000, 11200, 6800, 2900, 0];
export function Scene5() {
  const [i, setI] = useState(0);
  useSceneTimer(S.map((_, k) => ({ time: 600 + k * 500, callback: () => setI(k) })));
  const done = i === S.length - 1;
  return (
    <Shell bg="var(--owed-soft)">
      <Phone side="left">
        <div className="flex justify-between items-center">
          <span className="f-mono" style={{ fontSize: '1.6vmin', color: 'var(--muted)' }}>THIS WEEK</span>
          <span className="f-mono" style={{ fontSize: '1.6vmin', fontWeight: 700, padding: '0.5vmin 1.4vmin', borderRadius: 99, background: done ? 'var(--owed-soft)' : 'var(--owe-soft)', color: done ? 'var(--owed)' : 'var(--owe)' }}>{done ? 'Covered this week' : `Likely short ₹${S[i].toLocaleString('en-IN')}`}</span>
        </div>
        <div style={{ ...card, padding: '2.4vmin' }}>
          <div className="f-display" style={{ fontSize: '3vmin', lineHeight: 1.25 }}>{done ? 'You’re covered for Sharma Wholesale on Friday. Nothing to chase today.' : 'Payments are coming in.'}</div>
        </div>
        <div style={{ ...card, padding: '1.6vmin 2vmin' }}>
          <div className="flex justify-between items-center" style={{ padding: '1.2vmin 0' }}><span style={{ fontSize: '2vmin', fontWeight: 600 }}>They owe me</span><span className="f-mono" style={{ fontSize: '3vmin', fontWeight: 700, color: 'var(--owed)' }}>₹{(4725 - Math.min(i, 3) * 1000).toLocaleString('en-IN')}</span></div>
          <div className="flex justify-between items-center" style={{ padding: '1.2vmin 0' }}><span style={{ fontSize: '2vmin', fontWeight: 600 }}>I owe</span><span className="f-mono" style={{ fontSize: '3vmin', fontWeight: 700, color: 'var(--owe)' }}>₹18,400</span></div>
        </div>
        <motion.div className="f-mono" style={{ fontSize: '1.6vmin', color: 'var(--muted)' }} initial={{ opacity: 0 }} animate={{ opacity: i >= 2 ? 1 : 0 }}>ACTIVITY · Ramesh paid ₹1,240 · Lakshmi paid ₹860</motion.div>
      </Phone>
      <Caption side="right" step="05 / 05" title={<>The gap <em style={{ color: 'var(--owed)' }}>closes.</em></>} body="Paid before the supplier is due. Balances update themselves and every action lands in the activity log." />
    </Shell>
  );
}
