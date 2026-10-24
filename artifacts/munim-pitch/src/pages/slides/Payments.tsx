export default function Payments() {
  return (
    <div className="w-screen h-screen overflow-hidden relative deck">
      <h2>The payment and ledger flow</h2>
      <div className="bg-primary text-bg px-[2.4vw] py-[3vh] mb-[4vh]">
        <p className="font-bold">Approve → payment link → merchant shares on WhatsApp</p>
      </div>
      <div className="grid grid-cols-2 gap-[5vw]">
        <div className="rows">
          <p>Customer opens the pay page and proceeds to Pine Labs checkout</p>
          <p>Provider status confirmation records the payment and clears the linked due</p>
          <p>Cash or off-platform payments can be marked paid manually</p>
        </div>
        <div className="rows">
          <p className="font-bold">Default stub mode simulates payment; live processing needs provider setup</p>
          <p className="caption">No live processing partnership or transaction volume is claimed</p>
        </div>
      </div>
    </div>
  );
}
