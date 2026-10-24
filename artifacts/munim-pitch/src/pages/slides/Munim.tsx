export default function Munim() {
  return (
    <div className="w-screen h-screen overflow-hidden relative deck">
      <div className="grid grid-cols-[1.1fr_1fr] gap-[6vw] h-full items-center">
        <section>
          <h1 className="font-display text-primary text-[9vw] leading-none">Munim</h1>
          <p className="mt-[4vh]! subhead">Your munim, on your phone.</p>
          <p className="mt-[4vh]!">AI cash-flow assistant for small Indian businesses.</p>
          <p className="mt-[8vh]! caption">Investor &amp; partner overview</p>
        </section>
        <section className="haldi-panel rounded-[2vw] h-[76vh] flex items-center">
          <div className="paper ledger w-full py-[9vh]!">
            <p className="display text-primary">Get paid before you have to pay.</p>
          </div>
        </section>
      </div>
    </div>
  );
}
