const express    = require('express');
const nodemailer = require('nodemailer');
const Contact    = require('../models/Contact');

const router = express.Router();

/* ────────────────────────────────────────────
   TRANSPORTER  — module-level singleton
   pool:true  → reuses SMTP connection across emails
   so no repeated TLS handshakes in production
──────────────────────────────────────────── */
const transporter = nodemailer.createTransport({
  host:   'smtp-relay.brevo.com',
  port:   587,
  secure: false,          // STARTTLS on 587
  pool:   true,           // connection pooling ✅
  maxConnections: 5,
  maxMessages:    100,
  auth: {
    user: process.env.BREVO_USER,
    pass: process.env.BREVO_PASS
  },
  tls: {
    rejectUnauthorized: true  // enforce cert validation in prod
  }
});

/* verify transporter once at startup — logs clearly if creds are wrong */
transporter.verify((err) => {
  if (err) {
    console.error('❌ [SMTP] Transporter verify failed:', err.message);
  } else {
    console.log('✅ [SMTP] Transporter ready');
  }
});

/* ── Brand colours ── */
const C = {
  plum:   '#2A1B4E',
  plumMd: '#3D2B6B',
  lav:    '#A891D4',
  lavLt:  '#D0BFF0',
  white:  '#FAFAF8',
  muted:  '#9e94b4'
};

/* ── Reusable HTML shell ── */
function emailShell(title, bodyHtml) {
  return `
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8"/>
  <meta name="viewport" content="width=device-width,initial-scale=1"/>
  <title>${title}</title>
</head>
<body style="margin:0;padding:0;background:#1a1a2e;font-family:'Segoe UI',Arial,sans-serif;">
  <table width="100%" cellpadding="0" cellspacing="0"
         style="background:#1a1a2e;padding:40px 0;">
    <tr>
      <td align="center">
        <table width="600" cellpadding="0" cellspacing="0"
               style="max-width:600px;width:100%;background:${C.plum};
                      border-radius:16px;overflow:hidden;
                      border:1px solid rgba(168,145,212,0.2);">

          <!-- Header -->
          <tr>
            <td style="background:linear-gradient(135deg,${C.plumMd},${C.plum});
                       padding:32px 40px;text-align:center;
                       border-bottom:1px solid rgba(168,145,212,0.2);">
              <h1 style="margin:0;font-size:26px;font-weight:700;
                         letter-spacing:3px;color:${C.lavLt};">VELORA</h1>
              <p style="margin:6px 0 0;font-size:12px;
                        color:${C.muted};letter-spacing:1px;">${title}</p>
            </td>
          </tr>

          <!-- Body -->
          <tr>
            <td style="padding:36px 40px;">
              ${bodyHtml}
            </td>
          </tr>

          <!-- Footer -->
          <tr>
            <td style="padding:20px 40px;text-align:center;
                       border-top:1px solid rgba(168,145,212,0.15);">
              <p style="margin:0;font-size:11px;color:${C.muted};">
                © ${new Date().getFullYear()} Velora Digital. All rights reserved.
              </p>
            </td>
          </tr>

        </table>
      </td>
    </tr>
  </table>
</body>
</html>`;
}

/* ── Helper fragments ── */
function detailRow(label, value) {
  return `
  <table width="100%" cellpadding="0" cellspacing="0" style="margin-bottom:4px;">
    <tr>
      <td width="120" style="padding:10px 0 10px 0;vertical-align:top;">
        <p style="margin:0;font-size:11px;color:${C.muted};
                  text-transform:uppercase;letter-spacing:0.5px;">${label}</p>
      </td>
      <td style="padding:10px 0;border-bottom:1px solid rgba(168,145,212,0.12);">
        <p style="margin:0;font-size:14px;color:${C.white};
                  word-break:break-word;">${value}</p>
      </td>
    </tr>
  </table>`;
}

function stepRow(num, title, desc) {
  return `
  <table width="100%" cellpadding="0" cellspacing="0" style="margin-bottom:20px;">
    <tr>
      <td width="44" style="vertical-align:top;padding-top:2px;">
        <div style="width:28px;height:28px;border-radius:50%;
                    background:rgba(168,145,212,0.15);
                    border:1px solid ${C.lav};text-align:center;line-height:28px;">
          <span style="font-size:13px;font-weight:700;color:${C.lav};">${num}</span>
        </div>
      </td>
      <td style="vertical-align:top;">
        <p style="margin:0 0 4px;font-size:14px;font-weight:600;
                  color:${C.white};">${title}</p>
        <p style="margin:0;font-size:13px;color:${C.muted};">${desc}</p>
      </td>
    </tr>
  </table>`;
}

/* ────────────────────────────────────────────
   ADMIN EMAIL  — full enquiry details
──────────────────────────────────────────── */
function adminEmail({ name, email, brand, message, submittedAt }) {
  const body = `
    <!-- Alert pill -->
    <div style="display:inline-block;background:rgba(168,145,212,0.15);
                border:1px solid rgba(168,145,212,0.3);border-radius:20px;
                padding:4px 14px;margin-bottom:24px;">
      <p style="margin:0;font-size:11px;color:${C.lav};
                letter-spacing:1px;text-transform:uppercase;">New Enquiry</p>
    </div>

    <h2 style="margin:0 0 6px;font-size:20px;color:${C.white};">
      You've got a new message
    </h2>
    <p style="margin:0 0 28px;font-size:14px;color:${C.muted};">
      Submitted ${submittedAt}
    </p>

    <!-- Details card -->
    <div style="background:rgba(0,0,0,0.2);border-radius:12px;
                padding:20px 24px;margin-bottom:28px;
                border:1px solid rgba(168,145,212,0.1);">
      ${detailRow('Name',    name)}
      ${detailRow('Email',   `<a href="mailto:${email}"
                                style="color:${C.lav};text-decoration:none;">${email}</a>`)}
      ${detailRow('Brand',   brand   || '<em style="color:${C.muted};">Not provided</em>')}
      ${detailRow('Message', message || '<em style="color:${C.muted};">No message</em>')}
    </div>

    <!-- CTA -->
    <table cellpadding="0" cellspacing="0" style="margin-bottom:8px;">
      <tr>
        <td style="border-radius:8px;background:${C.lav};">
          <a href="mailto:${email}"
             style="display:inline-block;padding:12px 28px;font-size:14px;
                    font-weight:600;color:${C.plum};text-decoration:none;">
            Reply to ${name} →
          </a>
        </td>
      </tr>
    </table>`;

  return emailShell('New Enquiry Notification', body);
}

/* ────────────────────────────────────────────
   AUTO-REPLY EMAIL  — sent to the user
──────────────────────────────────────────── */
function autoReplyEmail({ name }) {
  const body = `
    <h2 style="margin:0 0 8px;font-size:22px;color:${C.white};">
      Thanks, ${name}! 🎉
    </h2>
    <p style="margin:0 0 28px;font-size:15px;color:${C.muted};line-height:1.6;">
      We've received your enquiry and our team will review it shortly.
      Here's what happens next:
    </p>

    ${stepRow(1, 'We review your brief',
                 'Our team reads every enquiry carefully — usually within a few hours.')}
    ${stepRow(2, 'We reach out',
                 'We\'ll reply to this email address within 1–2 business days.')}
    ${stepRow(3, 'We get to work',
                 'Once aligned, we kick off your project with a clear action plan.')}

    <!-- Divider -->
    <div style="height:1px;background:rgba(168,145,212,0.15);margin:28px 0;"></div>

    <p style="margin:0;font-size:13px;color:${C.muted};line-height:1.6;">
      In the meantime, feel free to reply to this email if you have anything
      to add. We look forward to working with you.
    </p>

    <p style="margin:24px 0 0;font-size:14px;color:${C.lavLt};font-weight:600;">
      — The Velora Team
    </p>`;

  return emailShell('We received your message', body);
}

/* ── Sanitiser ── */
function sanitise(str) {
  return String(str || '').replace(/<[^>]*>/g, '').trim();
}

/* ────────────────────────────────────────────
   SEND HELPER  — never throws, always logs
──────────────────────────────────────────── */
async function sendEmail(label, payload) {
  try {
    const info = await transporter.sendMail(payload);
    console.log(`✅ [${label}] Sent — messageId: ${info.messageId}`);
    return true;
  } catch (err) {
    console.error(`❌ [${label}] Failed — ${err.message}`);
    return false;
  }
}

/* ── Input validation ── */
function isValidEmail(str) {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(str);
}

/* ────────────────────────────────────────────
   ROUTE  POST /api/contact
──────────────────────────────────────────── */
router.post('/', async (req, res) => {
  /* 1 ── Sanitise & validate */
  const name    = sanitise(req.body.name);
  const email   = sanitise(req.body.email);
  const brand   = sanitise(req.body.brand);
  const message = sanitise(req.body.message);

  if (!name || !email || !message) {
    return res.status(400).json({
      success: false,
      message: 'Name, email, and message are required.'
    });
  }

  if (!isValidEmail(email)) {
    return res.status(400).json({
      success: false,
      message: 'Please provide a valid email address.'
    });
  }

  /* 2 ── Save to DB */
  let submittedAt = new Date().toLocaleString('en-IN', { timeZone: 'Asia/Kolkata' });
  try {
    const contact = await Contact.create({ name, email, brand, message });
    submittedAt   = new Date(contact.createdAt)
                      .toLocaleString('en-IN', { timeZone: 'Asia/Kolkata' });
  } catch (dbErr) {
    /* DB failure is logged but must NOT block the email response */
    console.error('❌ [DB] Save failed:', dbErr.message);
  }

  /* 3 ── Respond to frontend IMMEDIATELY */
  res.json({ success: true });

  /* 4 ── Fire both emails in the background (after response is sent) */
  const FROM = `"VELORA" <${process.env.BREVO_USER}>`;

  Promise.allSettled([
    sendEmail('ADMIN', {
      from:    FROM,
      to:      'veloradigital07@gmail.com',
      subject: `✉️ New Enquiry from ${name}`,
      html:    adminEmail({ name, email, brand, message, submittedAt })
    }),
    sendEmail('USER', {
      from:    FROM,
      to:      email,
      subject: `We received your message — Velora`,
      html:    autoReplyEmail({ name })
    })
  ]).then(results => {
    const [admin, user] = results;
    if (admin.status === 'rejected')
      console.error('❌ [ADMIN] Promise rejected:', admin.reason);
    if (user.status  === 'rejected')
      console.error('❌ [USER]  Promise rejected:', user.reason);
  });
});

module.exports = router;
