export default function BusinessModel() {
  return (
    <div className="w-screen h-screen overflow-hidden relative deck">
      <h2>The business model hypothesis</h2>
      <div className="grid grid-cols-3 gap-[2.4vw] mt-[6vh]">
        <p className="rule">Proposed: free entry-level ledger and briefing</p>
        <p className="rule font-bold text-primary">Proposed: monthly merchant subscription for advanced assistance</p>
        <p className="rule">Proposed: distribution through merchant networks and payment partners</p>
      </div>
      <div className="mt-[10vh] grid grid-cols-[7fr_5fr] gap-[5vw]">
        <p>Pricing, willingness to pay and partner terms remain unvalidated</p>
        <p className="caption">No revenue, active-merchant or growth claims are made</p>
      </div>
    </div>
  );
}
