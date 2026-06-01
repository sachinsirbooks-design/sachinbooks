import React from 'react';
import { X, Printer, Download } from 'lucide-react';
import { Order } from '../types';
import { formatPrice } from '../lib/utils';

interface CourierLabelModalProps {
  order: Order | null;
  onClose: () => void;
}

export default function CourierLabelModal({ order, onClose }: CourierLabelModalProps) {
  if (!order) return null;

  // Calculate shipment weight based on items (avg 450g per book if not defined)
  const totalWeight = order.items.reduce((sum, item) => sum + ((item.weight || 450) * item.quantity), 0);

  // Trigger system print dialog tailored to the shipping label
  const handlePrint = () => {
    // We can use a clean iframe or simply trigger window.print with custom media queries.
    // Let's print the target container elegantly.
    const printContent = document.getElementById('printable-shipping-label');
    if (!printContent) return;

    const originalContent = document.body.innerHTML;
    const labelHtml = printContent.outerHTML;

    // Open a print window
    const printWindow = window.open('', '_blank', 'width=800,height=1000');
    if (printWindow) {
      printWindow.document.write(`
        <html>
          <head>
            <title>Shipping Label - Order #${order.id.slice(0, 8).toUpperCase()}</title>
            <script src="https://cdn.tailwindcss.com"></script>
            <style>
              @media print {
                body {
                  background: white;
                  color: black;
                  padding: 0;
                  margin: 0;
                }
                .no-print {
                  display: none !important;
                }
              }
              body {
                font-family: 'Inter', system-ui, sans-serif;
                background-color: #f3f4f6;
                display: flex;
                align-items: center;
                justify-content: center;
                min-height: 100vh;
                margin: 0;
                padding: 20px;
              }
              .label-card {
                background: white;
                border: 2px solid #000;
                width: 100%;
                max-width: 650px;
                padding: 1.5rem;
                box-sizing: border-box;
              }
            </style>
          </head>
          <body>
            <div class="label-card">
              ${labelHtml}
            </div>
            <script>
              window.onload = function() {
                window.print();
                setTimeout(function() { window.close(); }, 500);
              };
            </script>
          </body>
        </html>
      `);
      printWindow.document.close();
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 overflow-y-auto bg-neutral-950/80 backdrop-blur-sm">
      {/* Container */}
      <div className="relative w-full max-w-2xl bg-zinc-100 rounded-3xl p-6 shadow-2xl border border-neutral-800">
        
        {/* Floating actions bar */}
        <div className="flex items-center justify-between pb-4 mb-4 border-b border-zinc-200">
          <div>
            <h3 className="text-sm font-display font-extrabold text-zinc-900 uppercase tracking-wider">Logistics Print Terminal</h3>
            <p className="text-[10px] text-zinc-500 font-sans uppercase font-bold">Standard Indian Parcel Label (A4 Size)</p>
          </div>
          <div className="flex items-center gap-2">
            <button 
              onClick={handlePrint}
              className="flex items-center gap-1.5 px-4 py-2 bg-neutral-950 hover:bg-neutral-900 text-white font-mono font-bold text-[10px] uppercase tracking-wider rounded-xl transition-all shadow active:scale-95 cursor-pointer"
            >
              <Printer size={13} /> Print Label
            </button>
            <button 
              onClick={onClose}
              className="p-2 bg-white text-zinc-400 hover:text-zinc-900 rounded-xl border border-zinc-200 transition-all cursor-pointer"
              aria-label="Close"
            >
              <X size={16} />
            </button>
          </div>
        </div>

        {/* PRINTABLE LABEL ROOT CONTAINER CONTAINER */}
        <div className="bg-white p-1 hover:shadow-inner transition-shadow rounded-2xl border border-zinc-200 shadow-sm overflow-hidden overflow-x-auto no-scrollbar">
          <div 
            id="printable-shipping-label" 
            className="w-full min-w-[500px] max-w-[650px] mx-auto bg-white p-6 border-4 border-black text-black select-text font-sans relative"
            style={{ minHeight: '520px' }}
          >
            {/* Top segment: Grid of To Receiver details and Products */}
            <div className="grid grid-cols-12 border-b-2 border-black">
              
              {/* Left Column: To Receiver Address Box (Width 8/12) */}
              <div className="col-span-8 p-4 border-r-2 border-black space-y-4">
                <h2 className="font-display font-black text-2xl uppercase tracking-widest leading-none">To,</h2>
                
                <div className="space-y-1.5 text-sm font-sans tracking-wide">
                  <div className="flex">
                    <span className="w-20 shrink-0 text-neutral-500 font-bold">Name</span>
                    <span className="font-black text-neutral-900">: {order.address.fullName}</span>
                  </div>
                  
                  <div className="flex">
                    <span className="w-20 shrink-0 text-neutral-500 font-bold">Address</span>
                    <span className="font-medium text-neutral-800">: {order.address.addressLine}</span>
                  </div>

                  <div className="flex">
                    <span className="w-20 shrink-0 text-neutral-500 font-bold">Landmark</span>
                    <span className="font-medium text-neutral-800">: {order.address.landmark || '---'}</span>
                  </div>

                  {/* POST OFFICE / TALUKA SPECIFICS */}
                  {order.address.postOffice && (
                    <div className="flex">
                      <span className="w-20 shrink-0 text-neutral-500 font-bold">Post Office</span>
                      <span className="font-bold text-neutral-950">: {order.address.postOffice}</span>
                    </div>
                  )}

                  {order.address.taluka && (
                    <div className="flex">
                      <span className="w-20 shrink-0 text-neutral-500 font-bold">Taluka</span>
                      <span className="font-bold text-neutral-950">: {order.address.taluka}</span>
                    </div>
                  )}

                  <div className="flex">
                    <span className="w-20 shrink-0 text-neutral-500 font-bold">City</span>
                    <span className="font-black uppercase text-neutral-950">: {order.address.city.toUpperCase()}</span>
                  </div>

                  <div className="flex">
                    <span className="w-20 shrink-0 text-neutral-500 font-bold">State</span>
                    <span className="font-black uppercase text-neutral-950">: {order.address.state.toUpperCase()}</span>
                  </div>

                  <div className="flex">
                    <span className="w-20 shrink-0 text-neutral-500 font-bold">Pin Code</span>
                    <span className="font-black text-neutral-950 tracking-wider">: {order.address.pincode}</span>
                  </div>

                  <div className="flex">
                    <span className="w-20 shrink-0 text-neutral-500 font-bold">Mobile</span>
                    <span className="font-black text-neutral-950">: {order.address.phone}</span>
                  </div>

                  <div className="flex border-t border-dashed border-black/30 pt-1.5 mt-2">
                    <span className="w-28 shrink-0 text-neutral-500 font-bold">Shipment Wt.</span>
                    <span className="font-sans font-bold">: {totalWeight} g</span>
                  </div>
                </div>
              </div>

              {/* Right Column: Products List (Width 4/12) */}
              <div className="col-span-4 p-4 flex flex-col justify-between">
                <div>
                  <h3 className="font-display font-black text-sm uppercase tracking-wider mb-3 leading-none border-b border-black pb-1">Products:</h3>
                  <div className="space-y-2 max-h-56 overflow-y-auto no-scrollbar">
                    {order.items.map((item, id) => (
                      <div key={id} className="text-xs font-sans leading-snug border-b border-dashed border-neutral-100 pb-1 last:border-0">
                        <p className="font-bold text-neutral-800">{item.title}</p>
                        <p className="text-[10px] text-neutral-500 font-bold">Qty: {item.quantity} × <span className="font-bold">₹{item.finalPrice}</span></p>
                      </div>
                    ))}
                  </div>
                </div>

                <div className="pt-2 border-t border-black mt-4">
                  <div className="flex justify-between text-xs font-sans font-bold">
                    <span>Total Bill:</span>
                    <span>₹{order.total}</span>
                  </div>
                  {(order.discount || 0) > 0 && (
                    <div className="flex justify-between text-[10px] text-neutral-500 font-mono tracking-tight font-black uppercase">
                      <span>Saved Coupon:</span>
                      <span>-₹{order.discount}</span>
                    </div>
                  )}
                  <div className="text-[10px] text-neutral-400 mt-1 font-mono uppercase font-black tracking-tight leading-none text-right">
                    COD/ONLINE Verified
                  </div>
                </div>
              </div>
            </div>

            {/* Bottom segment: Sender details on left, Courier routing on right */}
            <div className="grid grid-cols-12">
              
              {/* Bottom Left: From Sender address box */}
              <div className="col-span-7 p-4 border-r-2 border-black space-y-3">
                <div className="flex items-start justify-between">
                  <h2 className="font-display font-black text-xl uppercase tracking-widest leading-none">From,</h2>
                  {/* Small black publication logo icon */}
                  <div className="w-10 h-10 bg-black rounded-lg text-white flex flex-col items-center justify-center font-bold font-sans text-xs border border-white">
                    <span className="leading-none text-[8px] tracking-tighter uppercase">Sachin</span>
                    <span className="font-black leading-none text-amber-500 text-[11px]">DP</span>
                  </div>
                </div>

                <div className="text-xs font-sans space-y-1 tracking-wide leading-relaxed">
                  <p className="font-black text-neutral-900 uppercase">Sachin Dhawale Publication Pune</p>
                  <p className="font-bold text-neutral-600">
                    152, Abhiyan Society, Chiman Bagh,<br />
                    Tilak Road, Sadashiv Peth, Pune – 411030
                  </p>
                  <div className="pt-1.5 space-y-0.5 text-neutral-500 font-bold text-[11px]">
                    <p>Email: <span className="font-semibold text-neutral-800">sachindhawalepublication@gmail.com</span></p>
                    <p>Mob: <span className="font-semibold text-neutral-800">9011194443</span></p>
                  </div>
                </div>
              </div>

              {/* Bottom Right: Courier division / BNPL details */}
              <div className="col-span-5 p-4 bg-neutral-50/50 flex flex-col justify-center space-y-1.5 text-[11px] font-mono tracking-wide leading-tight">
                <p className="font-black text-neutral-900 border-b border-black pb-1 mb-1">COURIER ROUTING:</p>
                <p className="font-black text-neutral-800">• Pune City West Division</p>
                <p className="font-bold text-neutral-600">Customer ID: <span className="font-black text-black">12515852</span></p>
                <p className="font-bold text-neutral-600">Contract ID: <span className="font-black text-black">BNP-4141717</span></p>
                <p className="font-black text-neutral-800 mt-1 border-t border-dashed border-black/30 pt-1">BNPL HUB Pune 411001</p>
              </div>

            </div>

            {/* Industrial Logistics aesthetics decoration bar */}
            <div className="absolute bottom-1 right-2 left-2 flex justify-between items-center opacity-40">
              <span className="text-[7px] font-mono select-none">SYSTEM GENERATED INVOICE/PARCEL SLIP • SAC-PUB-01</span>
              <span className="text-[7px] font-mono select-none">AUTO STAMP FOR DISPATCH</span>
            </div>
          </div>
        </div>

        {/* Tip section */}
        <div className="mt-4 text-center">
          <p className="text-[10px] text-zinc-500 font-mono uppercase tracking-widest font-black">
            💡 TIP: Selecting "Print Label" creates a monochrome print-ready layout. Perfect for sticky printers.
          </p>
        </div>

      </div>
    </div>
  );
}
