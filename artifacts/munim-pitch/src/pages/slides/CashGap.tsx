export default function CashGap() {
  return (
    <div className="w-screen h-screen overflow-hidden relative deck">
      <h2>The weekly cash gap</h2>
      <div className="grid grid-cols-[5fr_7fr] gap-[6vw] items-center h-[63vh]">
        <div className="ink-panel h-full flex items-center">
          <p className="subhead">Suppliers need payment before customers settle their dues</p>
        </div>
        <div className="rows">
          <p>A khata records balances; the owner still decides whom to call</p>
          <p>Chasing familiar customers can feel awkward</p>
          <p className="font-bold text-primary">The goal: collect in time, without aggressive reminders</p>
        </div>
      </div>
    </div>
  );
}
