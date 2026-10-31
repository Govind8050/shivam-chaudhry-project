// utils/mailer.js
// Order place hone par customer ko confirmation aur admin ko new-order mail bhejta hai.
// Mail fail ho jaye to bhi order save rehta hai (sirf log me error aata hai).
const nodemailer = require("nodemailer");

let transporter = null;

function getTransporter() {
  if (!process.env.EMAIL_USER || !process.env.EMAIL_PASS) return null;

  if (!transporter) {
    transporter = nodemailer.createTransport({
      service: "gmail",
      auth: {
        user: process.env.EMAIL_USER,
        pass: process.env.EMAIL_PASS
      }
    });
  }
  return transporter;
}

function esc(v) {
  return String(v ?? "").replace(/[&<>"']/g, ch => ({
    "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;"
  }[ch]));
}

function money(n) {
  return "₹" + Number(n || 0).toLocaleString("en-IN");
}

function buildHtml(order, heading, intro) {

  const rows = (order.items || []).map(i => `
    <tr>
      <td style="padding:8px 10px;border-bottom:1px solid #e5e9f0;">${esc(i.name)}</td>
      <td style="padding:8px 10px;border-bottom:1px solid #e5e9f0;text-align:center;">${esc(i.qty)}</td>
      <td style="padding:8px 10px;border-bottom:1px solid #e5e9f0;text-align:right;">${money(i.price * i.qty)}</td>
    </tr>`).join("");

  const payText = order.paymentMethod === "online"
    ? `Paid online (${esc(order.paymentStatus)})`
    : "Cash on Delivery";

  return `
  <div style="font-family:Arial,Helvetica,sans-serif;max-width:600px;margin:auto;border:1px solid #dde3ec;border-radius:12px;overflow:hidden;">
    <div style="background:#061a32;color:#00d9ff;padding:18px 22px;font-size:18px;font-weight:bold;">
      ANASTIK MANUFACTURING PVT LTD
    </div>
    <div style="padding:22px;color:#1c2733;">
      <h2 style="margin:0 0 8px;color:#16a34a;">${esc(heading)}</h2>
      <p style="margin:0 0 18px;">${intro}</p>

      <p style="margin:0 0 6px;"><b>Order ID:</b> #${esc(order.id)}</p>
      <p style="margin:0 0 6px;"><b>Payment:</b> ${payText}</p>

      <table style="width:100%;border-collapse:collapse;margin:16px 0;font-size:14px;">
        <thead>
          <tr style="background:#f3f6fa;">
            <th style="padding:8px 10px;text-align:left;">Item</th>
            <th style="padding:8px 10px;">Qty</th>
            <th style="padding:8px 10px;text-align:right;">Amount</th>
          </tr>
        </thead>
        <tbody>${rows}</tbody>
        <tfoot>
          <tr>
            <td colspan="2" style="padding:10px;text-align:right;"><b>Total</b></td>
            <td style="padding:10px;text-align:right;"><b>${money(order.totalAmount)}</b></td>
          </tr>
        </tfoot>
      </table>

      <p style="margin:0 0 4px;"><b>Delivery address</b></p>
      <p style="margin:0 0 14px;color:#445;">
        ${esc(order.customerName)} · ${esc(order.phone)}<br>${esc(order.address)}
      </p>

      <p style="margin:0;color:#667;font-size:13px;">
        Customer: ${esc(order.customerName)} (${esc(order.customerEmail)})
      </p>
    </div>
  </div>`;
}

// order = Order.toJSON(), customerEmail = jis customer ne order kiya
async function sendOrderEmails(order, customerEmail) {

  const t = getTransporter();

  if (!t) {
    console.log("⚠️ EMAIL_USER / EMAIL_PASS not set, order emails skipped");
    return;
  }

  const from = `"Anastik Manufacturing" <${process.env.EMAIL_USER}>`;
  const adminTo = process.env.ADMIN_NOTIFY_EMAIL || process.env.ADMIN_EMAIL || process.env.EMAIL_USER;

  const jobs = [];

  if (customerEmail) {
    jobs.push(t.sendMail({
      from,
      to: customerEmail,
      subject: `Order #${order.id} placed successfully - Anastik Manufacturing`,
      html: buildHtml(
        order,
        "Order Placed Successfully!",
        "Thank you for your order. Our team will process and dispatch it soon. Delivery usually takes 3-5 days."
      )
    }));
  }

  if (adminTo) {
    jobs.push(t.sendMail({
      from,
      to: adminTo,
      subject: `🛒 New order #${order.id} from ${order.customerName} (${money(order.totalAmount)})`,
      html: buildHtml(
        order,
        "New Order Received",
        "A customer has just placed a new order on the website."
      )
    }));
  }

  const results = await Promise.allSettled(jobs);

  results.forEach(r => {
    if (r.status === "rejected") {
      console.log("❌ Order email error:", r.reason && r.reason.message ? r.reason.message : r.reason);
    }
  });
}

module.exports = { sendOrderEmails };