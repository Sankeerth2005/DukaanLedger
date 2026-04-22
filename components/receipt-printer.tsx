"use client";

import type { Sale } from "@/lib/types";

export function printReceipt(sale: Sale, shopName = "My Shop") {
  // Use browser print with a styled receipt template
  const receiptWindow = window.open("", "_blank", "width=400,height=600");
  if (!receiptWindow) {
    alert("Please allow popups to print receipts.");
    return;
  }

  const date = new Date(sale.createdAt).toLocaleString("en-IN", {
    dateStyle: "medium",
    timeStyle: "short",
  });

  const itemRows = sale.items
    .map(
      (item) => `
      <tr>
        <td style="padding:4px 0">${item.productName}</td>
        <td style="padding:4px 0; text-align:center">${item.quantity}</td>
        <td style="padding:4px 0; text-align:right">₹${item.sellingPrice.toFixed(2)}</td>
        <td style="padding:4px 0; text-align:center">${item.discount}%</td>
        <td style="padding:4px 0; text-align:right">₹${(item.finalPrice * item.quantity).toFixed(2)}</td>
      </tr>
    `
    )
    .join("");

  receiptWindow.document.write(`
    <!DOCTYPE html>
    <html>
    <head>
      <title>Receipt - Bill #${sale.id.slice(-6).toUpperCase()}</title>
      <style>
        * { margin: 0; padding: 0; box-sizing: border-box; }
        body {
          font-family: 'Courier New', monospace;
          max-width: 380px;
          margin: auto;
          padding: 20px;
          color: #111;
          font-size: 12px;
        }
        h1 { font-size: 18px; text-align: center; font-weight: bold; }
        .subtitle { text-align: center; color: #555; margin-bottom: 12px; }
        .divider { border-top: 1px dashed #999; margin: 10px 0; }
        table { width: 100%; border-collapse: collapse; }
        thead th { font-weight: bold; padding: 4px 0; border-bottom: 1px solid #ccc; }
        .total-section { margin-top: 10px; }
        .total-row { display: flex; justify-content: space-between; padding: 3px 0; }
        .total-row.grand { font-weight: bold; font-size: 14px; border-top: 1px dashed #999; padding-top: 6px; margin-top: 4px; }
        .footer { text-align: center; margin-top: 16px; color: #888; font-size: 11px; }
        @media print {
          body { padding: 0; }
        }
      </style>
    </head>
    <body>
      <h1>${shopName}</h1>
      <p class="subtitle">Bill #${sale.id.slice(-6).toUpperCase()} &bull; ${date}</p>
      <div class="divider"></div>
      <table>
        <thead>
          <tr>
            <th style="text-align:left">Item</th>
            <th style="text-align:center">Qty</th>
            <th style="text-align:right">Price</th>
            <th style="text-align:center">Disc</th>
            <th style="text-align:right">Total</th>
          </tr>
        </thead>
        <tbody>
          ${itemRows}
        </tbody>
      </table>
      <div class="divider"></div>
      <div class="total-section">
        <div class="total-row">
          <span>Discount</span>
          <span>- ₹${sale.totalDiscount.toFixed(2)}</span>
        </div>
        <div class="total-row grand">
          <span>Total Amount</span>
          <span>₹${sale.totalAmount.toFixed(2)}</span>
        </div>
      </div>
      <div class="footer">
        <p>Thank you for your purchase!</p>
        <p>Powered by DukaanLedger</p>
      </div>
      <script>
        window.onload = () => { window.print(); }
      </script>
    </body>
    </html>
  `);
  receiptWindow.document.close();
}
