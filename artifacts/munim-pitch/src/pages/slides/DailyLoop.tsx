export default function DailyLoop() {
  return (
    <div className="w-screen h-screen overflow-hidden relative deck">
      <h2>The daily Munim loop</h2>
      <div className="grid grid-cols-[4vw_1fr] gap-x-[3vw] gap-y-[2vh]">
        <span className="font-display text-[3vw] text-muted">1</span><p className="rule">Tell: capture a sale, a payment or a supplier bill</p>
        <span className="font-display text-[3vw] text-muted">2</span><p className="rule">Forecast: estimate what is likely to arrive before dues fall</p>
        <span className="font-display text-[3vw] text-muted">3</span><p className="rule">Draft: recommend customers and polite reminders</p>
        <span className="font-display text-[3vw] text-primary">4</span><p className="bg-accent px-[1.6vw] py-[2vh] font-bold">Approve: the merchant reviews, edits or dismisses</p>
        <span className="font-display text-[3vw] text-muted">5</span><p className="rule">Collect: share the link, confirm payment and update the ledger</p>
      </div>
    </div>
  );
}
