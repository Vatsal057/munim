export default function Merchants() {
  return (
    <div className="w-screen h-screen overflow-hidden relative deck">
      <h2>The merchant at the counter</h2>
      <p className="subhead max-w-[78vw]">Kirana shops, tiffin services, tailors, carts and home businesses</p>
      <div className="grid grid-cols-3 gap-[4vw] mt-[10vh]">
        <section className="rule"><p>A mid-range Android phone, used one-handed between customers</p></section>
        <section className="rule"><p>Kannada, Hindi or English; voice, photo or text</p></section>
        <section className="rule"><p>Customers open a payment link on their own phone</p></section>
      </div>
      <div className="absolute bottom-[8vh] left-[6vw] right-[6vw] h-[8vh] ledger" aria-hidden="true" />
    </div>
  );
}
