export default function Briefing() {
  return (
    <div className="w-screen h-screen overflow-hidden relative deck">
      <h2>Demo: the Friday briefing</h2>
      <div className="grid grid-cols-[7fr_5fr] gap-[5vw] items-center">
        <div className="paper ledger">
          <p className="caption">Illustrative sample from the app’s landing preview</p>
          <p className="mt-[5vh]!">Supplier due Friday: ₹8,000</p>
          <p className="owed mt-[3vh]!">Likely collections by then: ₹5,500</p>
          <div className="mt-[5vh] bg-primary text-bg p-[2vw] rounded-[1vw]">
            <p>Next action: review reminders for four customers</p>
          </div>
        </div>
        <div>
          <p className="owe subhead">Likely shortfall:</p>
          <p className="font-display text-[8vw]! leading-none! owe mt-[2vh]!">₹2,500</p>
          <p className="caption mt-[6vh]!">Forecasts are estimates, not guaranteed collections</p>
        </div>
      </div>
    </div>
  );
}
