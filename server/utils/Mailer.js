
const nodemailer = require("nodemailer");

let transporter = null;

function getTransporter() {
  if (!process.env.EMAIL_USER || !process.env.EMAIL_PASS) return null;

  if (!transporter) {
    transporter = nodemailer.createTransport({
      service: "gmail",
      auth: {
        user: process.env.EMAIL_USER,
        // app password me spaces ho to hata deta hai
        pass: String(process.env.EMAIL_PASS).replace(/\s+/g, "")
      },
      connectionTimeout: 15000,
      greetingTimeout: 15000,
      socketTimeout: 20000
    });
  }
  return transporter;
}

/* ================= SEND (Brevo API ya Gmail SMTP) ================= */

// Ek mail bhejta hai. { to, subject, html, text } do. Fail ho to error throw karta hai
async function sendMail({ to, subject, html, text }) {

  const fromEmail = process.env.MAIL_FROM_EMAIL || process.env.EMAIL_USER;
  const fromName = "Anastik Manufacturing";

  /* 1) Brevo HTTPS API */
  if (process.env.BREVO_API_KEY) {

    const body = {
      sender: { name: fromName, email: fromEmail },
      to: [{ email: to }],
      subject
    };

    if (html) body.htmlContent = html;
    if (text) body.textContent = text;

    const res = await fetch("https://api.brevo.com/v3/smtp/email", {
      method: "POST",
      headers: {
        "api-key": process.env.BREVO_API_KEY,
        "content-type": "application/json",
        accept: "application/json"
      },
      body: JSON.stringify(body)
    });

    if (!res.ok) {
      throw new Error("Brevo " + res.status + ": " + (await res.text()));
    }

    return;
  }

  /* 2) Gmail SMTP */
  const t = getTransporter();

  if (!t) {
    throw new Error("Email not configured: set BREVO_API_KEY or EMAIL_USER + EMAIL_PASS");
  }

  await t.sendMail({
    from: `"${fromName}" <${process.env.EMAIL_USER}>`,
    to,
    subject,
    html,
    text
  });
}

/* ================= HTML TEMPLATE ================= */

function esc(v) {
  return String(v ?? "").replace(/[&<>"']/g, ch => ({
    "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;"
  }[ch]));
}

function money(n) {
  return "₹" + Number(n || 0).toLocaleString("en-IN");
}

function buildHtml(order, heading, intro, color) {

  color = color || "#16a34a";

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
      <h2 style="margin:0 0 8px;color:${color};">${esc(heading)}</h2>
      <p style="margin:0 0 18px;">${intro}</p>

      <p style="margin:0 0 6px;"><b>Order ID:</b> #${esc(order.id)}</p>
      <p style="margin:0 0 6px;"><b>Payment:</b> ${payText}</p>
      ${order.status === "cancelled" && order.cancelReason
        ? `<p style="margin:0 0 6px;"><b>Cancellation reason:</b> ${esc(order.cancelReason)}</p>` : ""}

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

/* ================= ORDER EMAILS ================= */

// order = Order.toJSON(), customerEmail = jis customer ne order kiya
async function sendOrderEmails(order, customerEmail) {

  const adminTo = process.env.ADMIN_NOTIFY_EMAIL || process.env.ADMIN_EMAIL || process.env.EMAIL_USER;

  const jobs = [];

  if (customerEmail) {
    jobs.push(sendMail({
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
    jobs.push(sendMail({
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
    } else {
      console.log("✅ Order email sent");
    }
  });
}

// Order cancel hone par mail: customer ko hamesha, admin ko tab jab customer ne cancel kiya ho
async function sendCancelEmails(order, cancelledBy) {

  const adminTo = process.env.ADMIN_NOTIFY_EMAIL || process.env.ADMIN_EMAIL || process.env.EMAIL_USER;

  const refundNote =
    order.paymentMethod === "online" && order.paymentStatus === "refunded"
      ? " Your payment will be refunded to the original payment method in 5-7 working days."
      : order.paymentMethod === "online" && order.paymentStatus === "refund_pending"
        ? " Our team will process your refund shortly."
        : "";

  const jobs = [];

  if (order.customerEmail) {
    jobs.push(sendMail({
      to: order.customerEmail,
      subject: `Order #${order.id} cancelled - Anastik Manufacturing`,
      html: buildHtml(
        order,
        "Order Cancelled",
        (cancelledBy === "admin"
          ? "We are sorry, your order had to be cancelled by our team."
          : "As requested, your order has been cancelled.") + refundNote,
        "#dc2626"
      )
    }));
  }

  if (cancelledBy === "customer" && adminTo) {
    jobs.push(sendMail({
      to: adminTo,
      subject: `❌ Order #${order.id} cancelled by ${order.customerName}`,
      html: buildHtml(
        order,
        "Order Cancelled by Customer",
        "The customer has cancelled this order." + (refundNote ? " Refund: " + order.paymentStatus + "." : ""),
        "#dc2626"
      )
    }));
  }

  const results = await Promise.allSettled(jobs);

  results.forEach(r => {
    if (r.status === "rejected") {
      console.log("❌ Cancel email error:", r.reason && r.reason.message ? r.reason.message : r.reason);
    } else {
      console.log("✅ Cancel email sent");
    }
  });
}

module.exports = { sendOrderEmails, sendCancelEmails, sendMail };