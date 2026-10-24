export default function Pilot() {
  return (
    <div className="w-screen h-screen overflow-hidden relative deck">
      <h2>The pilot opportunity</h2>
      <div className="grid grid-cols-[7fr_5fr] gap-[5vw]">
        <div className="rows">
          <p className="font-bold">Seeking merchant-pilot and distribution conversations</p>
          <p>Start with one merchant segment and one local network</p>
          <p>Measure activation, repeat weekly use and collections before supplier dues</p>
          <p>Validate language quality, reminder comfort and willingness to pay</p>
          <p>Expand only after evidence of repeatable merchant value</p>
        </div>
        <div className="haldi-panel flex items-center">
          <p className="font-display text-primary text-[4vw]! leading-[1.15]!">Get paid before you have to pay.</p>
        </div>
      </div>
    </div>
  );
}
