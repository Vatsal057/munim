import { useState } from 'react';
import { motion } from 'framer-motion';
import { ShieldCheck, Check } from 'lucide-react';
import { useSceneTimer } from '@/lib/video';
import { Phone, Caption, Tap, Shell } from '../Demo';

export function Scene4() {
  const [b, setB] = useState(0);
  useSceneTimer([{ time: 800, callback: () => setB(1) }, { time: 1500, callback: () => setB(2) }, { time: 2200, callback: () => setB(3) }, { time: 3600, callback: () => setB(4) }, { time: 4400, callback: () => setB(5) }]);
  const paid = b >= 4;
  return (
    <Shell>
      <Caption side="left" step="04 / 05" title={<>Customers <em style={{ color: 'var(--owed)' }}>pay by link.</em></>} body="The customer opens the link on any phone and pays with UPI through Pine Labs. No app to install." items={['Works on any phone', 'Pine Labs payment link', 'Marked paid automatically']} beat={b} />
      <Phone side="right">
        <div className="flex-1 flex flex-col items-center" style={{ paddingTop: '4vmin', gap: '1.4vmin' }}>
          <div className="f-mono" style={{ fontSize: '1.5vmin', letterSpacing: '0.16em', color: 'var(--muted)' }}>PAYMENT TO</div>
          <div style={{ fontSize: '3vmin', fontWeight: 700 }}>Anita Kirana Store</div>
          <div className="f-mono" style={{ fontSize: '9vmin', fontWeight: 700, lineHeight: 1 }}>₹1,240</div>
          <div style={{ fontSize: '1.9vmin', color: 'var(--muted)' }}>2 bori chawal · khata balance</div>
          <div className="f-mono" style={{ fontSize: '1.4vmin', background: 'var(--haldi-soft)', padding: '0.5vmin 1.6vmin', borderRadius: 99, fontWeight: 700 }}>TEST MODE · NO REAL MONEY</div>
          <div className="relative flex items-center justify-center" style={{ marginTop: 'auto', marginBottom: '2vmin', width: '100%' }}>
            <motion.div className="flex items-center justify-center" style={{ width: '100%', height: '8vmin', borderRadius: '2.4vmin', fontSize: '2.6vmin', fontWeight: 700, color: 'var(--paper)', gap: '1vmin' }}
              animate={{ background: paid ? '#1c6e48' : '#22285f' }}>
              {paid ? <><Check style={{ width: '3vmin' }} />Paid</> : <><ShieldCheck style={{ width: '3vmin', color: 'var(--haldi)' }} />Pay ₹1,240 via UPI</>}
            </motion.div>
            <Tap show={b >= 3 && b < 4} x="60%" y="50%" />
          </div>
        </div>
        <motion.div className="absolute inset-x-0 flex flex-col items-center justify-center" style={{ top: 0, bottom: 0, background: 'var(--owed-soft)', gap: '1.6vmin' }}
          initial={{ opacity: 0 }} animate={{ opacity: b >= 5 ? 1 : 0 }}>
          <div className="rounded-full flex items-center justify-center" style={{ width: '14vmin', height: '14vmin', background: 'var(--owed)' }}><Check color="#f7f1e6" style={{ width: '8vmin', height: '8vmin' }} strokeWidth={3} /></div>
          <div className="f-display" style={{ fontSize: '4.4vmin', fontWeight: 700, color: 'var(--owed)' }}>Paid. Thank you.</div>
          <div style={{ fontSize: '1.8vmin', color: 'var(--muted)' }}>Nothing more is due on this link.</div>
        </motion.div>
      </Phone>
    </Shell>
  );
}
