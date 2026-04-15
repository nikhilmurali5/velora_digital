const express = require('express');
const https   = require('https');
const Contact = require('../models/Contact');

const router  = express.Router();

/* ── Brand colours ── */
const C = {
  plum:   '#2A1B4E',
  plumMd: '#3D2B6B',
  lav:    '#A891D4',
  lavLt:  '#D0BFF0',
  white:  '#FAFAF8',
  muted:  '#9e94b4'
};

/* ────────────────────────────────────────────
   BREVO HTTP API SENDER
   Uses port 443 — works on Render free tier
   No nodemailer, no SMTP, no port blocks
──────────────────────────────────────────── */
async function sendEmail(label, payload) {
  return new Promise((resolve) => {
    const body    = JSON.stringify(payload);
    const options = {
      hostname: 'api.brevo.com',
      path:     '/v3/smtp/email',
      method:   'POST',
      headers: {
        'Content-Type':   'application/json',
        'api-key':         process.env.BREVO_API_KEY,
        'Content-Length':  Buffer.byteLength(body)
      }
    };

    const req = https.request(options, (res) => {
      let data = '';
      res.on('data', chunk => data += chunk);
      res.on('end', () => {
        if (res.statusCode >= 200 && res.statusCode < 300) {
          console.log(`✅ [${label}] Sent — status: ${res.statusCode}`);
          resolve(true);
        } else {
          console.error(`❌ [${label}] Failed — status: ${res.statusCode} body: ${data}`);
          resolve(false);
        }
      });
    });

    req.on('error', (err) => {
      console.error(`❌ [${label}] Request error — ${err.message}`);
      resolve(false);
    });

    req.write(body);
    req.end();
  });
}

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
      <td width="120" style="padding:10px 0;vertical-align:top;">
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
      <td style="vertical-align:top;padding-left:8px;">
        <p style="margin:0 0 4px;font-size:14px;font-weight:600;
                  color:${C.white};">${title}</p>
        <p style="margin:0;font-size:13px;color:${C.muted};">${desc}</p>
      </td>
    </tr>
  </table>`;
}

/* ────────────────────────────────────────────
   ADMIN EMAIL
──────────────────────────────────────────── */
function adminEmail({ name, email, brand, message, submittedAt }) {
  const body = `
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

    <div style="background:rgba(0,0,0,0.2);border-radius:12px;
                padding:20px 24px;margin-bottom:28px;
                border:1px solid rgba(168,145,212,0.1);">
      ${detailRow('Name',    name)}
      ${detailRow('Email',   `<a href="mailto:${email}"
                                style="color:${C.lav};text-decoration:none;">${email}</a>`)}
      ${detailRow('Brand',   brand   || `<em style="color:${C.muted};">Not provided</em>`)}
      ${detailRow('Message', message || `<em style="color:${C.muted};">No message</em>`)}
    </div>

    <table cellpadding="0" cellspacing="0">
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
   AUTO-REPLY EMAIL
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
                 "We'll reply to this email address within 1–2 business days.")}
    ${stepRow(3, 'We get to work',
                 'Once aligned, we kick off your project with a clear action plan.')}

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

/* ── Email validator ── */
function isValidEmail(str) {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(str);
}

/* ────────────────────────────────────────────
   ROUTE  POST /api/contact
──────────────────────────────────────────── */
router.post('/', async (req, res) => {

  /* 1 — Sanitise & validate */
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

  /* 2 — Save to DB */
  let submittedAt = new Date().toLocaleString('en-IN', { timeZone: 'Asia/Kolkata' });
  try {
    const contact = await Contact.create({ name, email, brand, message });
    submittedAt   = new Date(contact.createdAt)
                      .toLocaleString('en-IN', { timeZone: 'Asia/Kolkata' });
  } catch (dbErr) {
    console.error('❌ [DB] Save failed:', dbErr.message);
  }

  /* 3 — Respond to frontend IMMEDIATELY */
  res.json({ success: true });

  /* 4 — Fire both emails in background after response */
  const FROM = {
    name:  'VELORA',
    email: process.env.BREVO_SENDER_EMAIL
  };

  Promise.allSettled([
    sendEmail('ADMIN', {
      sender:      FROM,
      to:          [{ email: 'veloradigital07@gmail.com', name: 'Velora Admin' }],
      subject:     `✉️ New Enquiry from ${name}`,
      htmlContent: adminEmail({ name, email, brand, message, submittedAt })
    }),
    sendEmail('USER', {
      sender:      FROM,
      to:          [{ email, name }],
      subject:     `We received your message — Velora`,
      htmlContent: autoReplyEmail({ name })
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
