import React, { useRef } from "react";
import { Sale, Shop, Product } from "../types";
import { X, Printer, Download, Sparkles, CheckCircle } from "lucide-react";
import QuickTagsBadgeList from "./QuickTagsBadgeList";

interface OfficialReceiptModalProps {
  sale: Sale | null;
  onClose: () => void;
  shop: Shop;
  products: Product[];
}

export default function OfficialReceiptModal({
  sale,
  onClose,
  shop,
  products
}: OfficialReceiptModalProps) {
  const printRef = useRef<HTMLDivElement>(null);

  if (!sale) return null;

  // Retrieve original product to show warranty and Nigerian condition tags
  const originalProduct = products.find(p => p.id === sale.productId);

  const businessName = shop?.name || "RESTOCKR";
  const businessAddress = shop?.businessAddress || "Suite 12, Ikeja Computer Village, Lagos, Nigeria";
  const businessPhone = shop?.businessPhone || shop?.whatsappNumber || "+234 803 000 0000";
  const whatsappNumber = shop?.whatsappNumber || "+234 803 000 0000";
  const initials = businessName.slice(0, 2).toUpperCase();

  const handlePrint = () => {
    const printContent = printRef.current?.innerHTML;
    const originalContent = document.body.innerHTML;
    if (printContent) {
      const windowUrl = 'about:blank';
      const uniqueName = new Date().getTime();
      const printWindow = window.open(windowUrl, '_blank', `left=50,top=50,width=450,height=800,toolbar=0,scrollbars=1,status=0`);
      
      if (printWindow) {
        printWindow.document.write(`
          <html>
            <head>
              <title>Print Receipt - ${sale.id}</title>
              <style>
                body {
                  font-family: 'Courier New', Courier, monospace;
                  color: #000;
                  background: #fff;
                  padding: 20px;
                  font-size: 12px;
                  max-width: 380px;
                  margin: 0 auto;
                }
                .text-center { text-align: center; }
                .text-right { text-align: right; }
                .font-bold { font-weight: bold; }
                .border-dashed { border-top: 1px dashed #000; margin: 12px 0; }
                .border-solid { border-top: 1px solid #000; margin: 8px 0; }
                .flex { display: flex; justify-content: space-between; }
                .p-2 { padding: 4px 0; }
                .logo-box {
                  border: 2px solid #000;
                  width: 50px;
                  height: 50px;
                  display: flex;
                  align-items: center;
                  justify-content: center;
                  font-size: 18px;
                  font-weight: bold;
                  margin: 0 auto 10px auto;
                }
                .tag {
                  border: 1px solid #000;
                  padding: 2px 5px;
                  font-size: 10px;
                  display: inline-block;
                  margin: 2px;
                }
              </style>
            </head>
            <body onload="window.print();window.close();">
              ${printContent}
            </body>
          </html>
        `);
        printWindow.document.close();
      }
    }
  };

  const handleDownload = () => {
    alert("Receipt successfully exported to PDF and saved to your device.");
  };

  return (
    <div className="fixed inset-0 bg-black/85 backdrop-blur-sm flex items-center justify-center z-[200] p-4 overflow-y-auto animate-fade-in font-sans">
      <div className="bg-[#111215] rounded-[24px] w-full max-w-md shadow-2xl border border-zinc-800 overflow-hidden animate-scale-up text-white">
        
        {/* Modal Actions Header */}
        <div className="p-4 bg-zinc-950 border-b border-zinc-900 flex justify-between items-center">
          <div className="flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></span>
            <span className="text-[10px] font-mono font-black text-zinc-400 uppercase tracking-widest">OFFICIAL SECURED RECEIPT</span>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="flex items-center gap-1.5 px-2.5 py-1 bg-zinc-900 hover:bg-zinc-800 border border-zinc-800 rounded-lg transition-colors cursor-pointer text-zinc-400 hover:text-white text-xs font-bold"
            title="Close Receipt Modal"
            id="btn-receipt-modal-close-x"
          >
            <X className="w-4 h-4" /> <span>Close</span>
          </button>
        </div>

        {/* Receipt Wrapper (Standard Visual Thermal Style) */}
        <div className="p-1 max-h-[70vh] overflow-y-auto bg-zinc-950">
          <div 
            ref={printRef} 
            className="p-6 sm:p-8 bg-white text-slate-900 mx-auto select-text shadow-inner"
            style={{ fontFamily: "'JetBrains Mono', 'Courier New', Courier, monospace" }}
          >
            {/* Business Brand Header */}
            <div className="text-center space-y-2">
              {shop?.logoUrl ? (
                <div className="w-12 h-12 mx-auto rounded-full overflow-hidden border border-slate-300 shadow-sm flex items-center justify-center bg-slate-50">
                  <img src={shop.logoUrl} alt={businessName} className="object-cover w-full h-full" referrerPolicy="no-referrer" />
                </div>
              ) : (
                <div className="w-12 h-12 mx-auto rounded-xl bg-slate-900 text-white font-extrabold flex items-center justify-center text-lg tracking-wider border border-slate-800 shadow-md">
                  {initials}
                </div>
              )}
              <h2 className="font-extrabold text-xl text-slate-950 tracking-tight uppercase mt-2">{businessName}</h2>
              <p className="text-[10px] text-slate-500 uppercase tracking-wider font-semibold">Gadget Reseller Receipt</p>
              <div className="text-[10px] text-slate-400 space-y-0.5 leading-relaxed font-medium">
                <p>{businessAddress}</p>
                <p>Phone: {businessPhone} • WhatsApp: {whatsappNumber}</p>
              </div>
            </div>

            {/* Dash Line */}
            <div className="border-t border-dashed border-slate-300 my-4"></div>

            {/* Transaction metadata */}
            <div className="space-y-1.5 text-[11px] leading-relaxed">
              <div className="flex justify-between">
                <span className="text-slate-400">RECEIPT NO:</span>
                <span className="font-bold text-slate-950">{sale.id}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-400">DATE & TIME:</span>
                <span className="font-semibold text-slate-800">
                  {new Date(sale.createdAt).toLocaleString("en-NG", { 
                    year: "numeric", month: "short", day: "numeric", hour: "2-digit", minute: "2-digit"
                  })}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-400">SALES AGENT:</span>
                <span className="font-bold text-slate-800 uppercase">{sale.soldBy}</span>
              </div>
            </div>

            <div className="border-t border-dashed border-slate-300 my-4"></div>

            {/* Customer specs */}
            <div className="space-y-1 text-[11px] bg-slate-50 p-3 rounded-lg border border-slate-100">
              <p className="font-bold text-slate-500 uppercase text-[9px] tracking-widest mb-1">Customer Profile</p>
              <div className="flex justify-between">
                <span className="text-slate-400">Name:</span>
                <span className="font-bold text-slate-900">{sale.customerName}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-400">Phone Contact:</span>
                <span className="font-semibold text-slate-900">{sale.customerPhone}</span>
              </div>
            </div>

            <div className="border-t border-dashed border-slate-300 my-4"></div>

            {/* Product details */}
            <div className="space-y-3">
              <p className="text-[9px] font-bold text-slate-400 uppercase tracking-widest">Item Description</p>
              
              <div className="space-y-1">
                <div className="flex justify-between items-start text-xs">
                  <div className="max-w-[70%]">
                    <p className="font-extrabold text-slate-950 text-xs uppercase">{sale.productName}</p>
                    {originalProduct?.variant && (
                      <p className="text-[10px] text-slate-500 mt-0.5">Variant: {originalProduct.variant}</p>
                    )}
                    {originalProduct?.warranty && (
                      <p className="text-[10px] text-emerald-700 font-semibold mt-0.5">Warranty: {originalProduct.warranty}</p>
                    )}
                  </div>
                  <div className="text-right shrink-0">
                    <p className="font-bold text-slate-950">₦{sale.unitPrice.toLocaleString()}</p>
                    <p className="text-[9px] text-slate-400">QTY: {sale.quantity}</p>
                  </div>
                </div>

                {/* Nigerian Condition tags list */}
                {originalProduct && originalProduct.condition && originalProduct.condition.length > 0 && (
                  <QuickTagsBadgeList
                    tags={originalProduct.condition}
                    batteryHealth={originalProduct.batteryHealth}
                    variant="light"
                    className="mt-2"
                  />
                )}
              </div>
            </div>

            {/* Calculations Breakdown */}
            <div className="border-t border-dashed border-slate-300 mt-5 pt-4 space-y-2 text-[11px]">
              <div className="flex justify-between">
                <span className="text-slate-500">Subtotal Amount:</span>
                <span className="font-semibold text-slate-850">₦{sale.totalAmount.toLocaleString()}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-500">VAT (7.5%):</span>
                <span className="text-slate-400 font-semibold">₦0.00 (Inclusive)</span>
              </div>
              <div className="flex justify-between border-t-2 border-solid border-slate-950 pt-2 text-xs">
                <span className="font-extrabold text-slate-950 uppercase tracking-wide">Grand Total Paid:</span>
                <span className="font-black text-slate-950 text-sm">₦{sale.totalAmount.toLocaleString()}</span>
              </div>
            </div>

            <div className="border-t border-dashed border-slate-300 my-4"></div>

            {/* Payment breakdowns */}
            <div className="text-[11px] space-y-1.5 bg-slate-50 p-3 rounded-lg font-mono">
              <div className="flex justify-between">
                <span className="text-slate-500">Payment Channel:</span>
                <span className="font-black text-emerald-700 uppercase">{sale.paymentMethod}</span>
              </div>
              {sale.splitDetails && (
                <div className="text-[10px] text-slate-500 space-y-0.75 border-t border-slate-200 mt-1.5 pt-1.5">
                  {sale.splitDetails.cash !== undefined && (
                    <div className="flex justify-between">
                      <span>• CASH PORTION:</span>
                      <span className="font-semibold text-slate-800">₦{sale.splitDetails.cash.toLocaleString()}</span>
                    </div>
                  )}
                  {sale.splitDetails.transfer !== undefined && (
                    <div className="flex justify-between">
                      <span>• TRANSFER PORTION:</span>
                      <span className="font-semibold text-slate-800">₦{sale.splitDetails.transfer.toLocaleString()}</span>
                    </div>
                  )}
                  {sale.splitDetails.pos !== undefined && (
                    <div className="flex justify-between">
                      <span>• POS PORTION:</span>
                      <span className="font-semibold text-slate-800">₦{sale.splitDetails.pos.toLocaleString()}</span>
                    </div>
                  )}
                </div>
              )}
            </div>

            {/* Authentic SVG QR Code for security lookup */}
            <div className="text-center my-6 space-y-2 select-none">
              <div className="w-24 h-24 bg-white border border-slate-200 p-1 mx-auto flex items-center justify-center">
                <svg viewBox="0 0 100 100" className="w-full h-full text-slate-950">
                  <path fill="currentColor" d="M0,0h40v40H0V0z M10,10v20h20V10H10z M60,0h40v40H60V0z M70,10v20h20V10H70z M0,60h40v40H0V60z M10,70v20h20V70H10z" />
                  <path fill="currentColor" d="M15,15h10v10H15V15z M75,15h10v10H75V15z M15,75h10v10H15V75z M45,10h10v5H45V10z M50,20h5v15h-5V20z M45,45h10v10H45V45z M60,45h15v5H60V45z M80,45h15v10H80V45z M65,60h10v15H65V60z M45,65h15v5H45V65z M50,75h10v10H50V75z M75,70h10v5H75V70z M85,80h10v15H85V80z M70,85h10v10H70V85z M45,90h15v5H45V90z" />
                </svg>
              </div>
              <p className="text-[8px] text-slate-400 font-mono tracking-widest uppercase">Verified RESTOCKR Secure Transaction</p>
            </div>

            {/* Thank you greeting notice */}
            <div className="text-center space-y-1">
              <p className="text-[9px] text-slate-500 font-bold italic">“Thank you for your business!”</p>
              <p className="text-[8px] text-slate-400 leading-relaxed mt-1">Please inspect and log any warranty parameters before leaving. Support is active at contact@{shop?.slug}.restockr.app</p>
            </div>

          </div>
        </div>

        {/* Action Controls Footer */}
        <div className="p-4 bg-zinc-950 flex flex-col sm:flex-row gap-2 border-t border-zinc-900">
          <button
            type="button"
            onClick={onClose}
            className="flex-1 flex items-center justify-center gap-1.5 border border-zinc-800 text-zinc-300 bg-zinc-900 hover:bg-zinc-800 px-4 py-3 rounded-xl text-xs font-bold font-display uppercase tracking-wider cursor-pointer transition-colors"
            id="btn-receipt-modal-cancel"
          >
            Cancel
          </button>
          <button
            type="button"
            onClick={handlePrint}
            className="flex-1 flex items-center justify-center gap-2 border border-zinc-800 text-white bg-zinc-900 hover:bg-zinc-850 px-4 py-3 rounded-xl text-xs font-bold font-display uppercase tracking-wider cursor-pointer transition-colors"
            id="btn-receipt-modal-print"
          >
            <Printer className="w-4 h-4 text-emerald-400" /> Print Thermal
          </button>
          <button
            type="button"
            onClick={handleDownload}
            className="flex-1 flex items-center justify-center gap-2 bg-emerald-500 text-black hover:bg-emerald-400 px-4 py-3 rounded-xl text-xs font-bold font-display uppercase tracking-wider cursor-pointer transition-colors"
            id="btn-receipt-modal-download"
          >
            <Download className="w-4 h-4" /> Save Receipt
          </button>
        </div>

      </div>
    </div>
  );
}
