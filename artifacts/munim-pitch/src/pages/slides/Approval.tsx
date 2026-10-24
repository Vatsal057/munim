export default function Approval() {
  return (
    <div className="w-screen h-screen overflow-hidden relative deck">
      <h2>Demo: the approval moment</h2>
      <div className="grid grid-cols-[7fr_6fr] gap-[4vw] items-start">
        <div className="phone">
          <p className="caption">Recreated app screen with illustrative sample data</p>
          <p className="owed font-bold mt-[3vh]!">Customer balance: ₹1,200 owed to the merchant</p>
          <p className="bg-bg p-[1.6vw] mt-[3vh]! rounded-[1vw]">Suggested draft: Hello, a gentle reminder about your ₹1,200 balance. Please pay when convenient. Thank you.</p>
        </div>
        <div className="rows pt-[2vh]">
          <p>Review the reason, edit the wording, approve or dismiss</p>
          <p>Approval prepares the payment link; the merchant chooses to share</p>
          <p className="font-bold text-primary">Munim never messages a customer on its own</p>
        </div>
      </div>
    </div>
  );
}
