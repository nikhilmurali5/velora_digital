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
  return `
  <table width="100%" cellpadding="0" cellspacing="0" style="background:#1a1333;padding:20px;font-family:Arial;">
    <tr>
      <td align="center">

        <table width="500" cellpadding="0" cellspacing="0" style="background:#2b1d52;border-radius:10px;padding:20px;">
          
          <!-- HEADER -->
          <tr>
            <td align="center" style="padding-bottom:20px;">
              <h1 style="color:#ffffff;letter-spacing:3px;margin:0;">VELORA</h1>
              <p style="color:#aaa;margin:5px 0 0 0;">New Enquiry Notification</p>
            </td>
          </tr>

          <!-- BODY -->
          <tr>
            <td style="background:#3a2768;padding:20px;border-radius:8px;">

              <p style="color:#aaa;font-size:12px;margin:0;">NEW ENQUIRY</p>
              <h2 style="color:#ffffff;margin:10px 0;">You've got a new message</h2>
              <p style="color:#aaa;font-size:12px;margin:0 0 15px 0;">Submitted ${submittedAt}</p>

              <hr style="border:0;border-top:1px solid #555;margin:15px 0;" />

              <!-- NAME -->
              <p style="color:#aaa;margin:0;">NAME</p>
              <p style="color:#ffffff;font-size:16px;margin:5px 0 15px 0;">${name}</p>

              <!-- EMAIL -->
              <p style="color:#aaa;margin:0;">EMAIL</p>
              <p style="color:#ffffff;font-size:16px;margin:5px 0 15px 0;word-break:break-all;">
                ${email}
              </p>

              <!-- BRAND -->
              <p style="color:#aaa;margin:0;">BRAND</p>
              <p style="color:#ffffff;font-size:16px;margin:5px 0 15px 0;">${brand}</p>

              <!-- MESSAGE -->
              <p style="color:#aaa;margin:0;">MESSAGE</p>
              <div style="background:#2b1d52;padding:12px;border-radius:6px;color:#ffffff;margin-top:5px;">
                ${message}
              </div>

              <!-- BUTTON -->
              <div style="text-align:center;margin-top:20px;">
                <a href="mailto:${email}"
                   style="background:#a891d4;color:#000000;padding:12px 20px;border-radius:6px;text-decoration:none;display:inline-block;">
                  Reply to ${name} →
                </a>
              </div>

            </td>
          </tr>

        </table>

      </td>
    </tr>
  </table>
  `;
}

/* ────────────────────────────────────────────
   AUTO-REPLY EMAIL
──────────────────────────────────────────── */
function autoReplyEmail({ name }) {
  const firstName = name.split(' ')[0];
  return `<!DOCTYPE html>
<html lang="en">
<head><meta charset="UTF-8"><meta name="viewport" content="width=device-width,initial-scale=1.0"><title>We got your message – VELORA</title></head>
<body style="margin:0;padding:0;background:#1a0e38;font-family:'Helvetica Neue',Helvetica,Arial,sans-serif;">
  <table width="100%" cellpadding="0" cellspacing="0" style="background:#1a0e38;padding:40px 20px;">
    <tr><td align="center">
      <table width="600" cellpadding="0" cellspacing="0" style="max-width:600px;width:100%;">
        <tr>
          <td style="background:${C.plum};border-radius:12px 12px 0 0;padding:36px 40px;text-align:center;border-bottom:1px solid rgba(168,145,212,0.2);">
            <p style="margin:0 0 6px;font-size:11px;letter-spacing:4px;text-transform:uppercase;color:${C.lav};">Digital Marketing Agency</p>
            <h1 style="margin:0;font-size:32px;font-weight:300;letter-spacing:6px;color:${C.white};font-family:Georgia,serif;">VELORA</h1>
          </td>
        </tr>
        <tr>
          <td style="background:${C.plumMd};padding:48px 40px 36px;text-align:center;border-bottom:1px solid rgba(168,145,212,0.1);">
            <p style="margin:0 0 12px;font-size:36px;">&#10022;</p>
            <h2 style="margin:0 0 14px;font-size:28px;font-weight:300;color:${C.white};font-family:Georgia,serif;">
              Thank you, <em style="font-style:italic;color:${C.lavLt};">${firstName}</em>.
            </h2>
            <p style="margin:0;font-size:15px;line-height:1.8;color:rgba(255,255,255,0.65);max-width:400px;display:inline-block;">
              We've received your message and our team will get back to you within
              <strong style="color:${C.lavLt};">24–48 hours</strong>.
            </p>
          </td>
        </tr>
        <tr>
          <td style="background:${C.plumMd};padding:32px 40px 40px;">
            <p style="margin:0 0 20px;font-size:11px;letter-spacing:3px;text-transform:uppercase;color:${C.lav};">What happens next</p>
            ${stepRow('01', 'We review your brief', 'Our strategists study your brand, goals, and the details you shared.')}
            ${stepRow('02', 'We craft a proposal', 'Tailored services and a growth plan built specifically for your brand.')}
            ${stepRow('03', 'We connect', 'A call or email to walk you through the strategy and answer every question.')}
            <table width="100%" cellpadding="0" cellspacing="0" style="margin-top:36px;">
              <tr><td align="center">
                <a href="mailto:veloradigital07@gmail.com"
                   style="display:inline-block;background:transparent;color:${C.lavLt};text-decoration:none;font-size:12px;letter-spacing:2px;text-transform:uppercase;padding:13px 32px;border:1px solid rgba(168,145,212,0.4);border-radius:2px;">
                  Questions? Email Us
                </a>
              </td></tr>
            </table>
          </td>
        </tr>
        <tr>
          <td style="background:#140a2c;border-radius:0 0 12px 12px;padding:20px 40px;text-align:center;border-top:1px solid rgba(168,145,212,0.12);">
            <p style="margin:0 0 4px;font-size:13px;font-family:Georgia,serif;letter-spacing:3px;color:${C.white};">VELORA</p>
            <p style="margin:0;font-size:11px;color:${C.muted};">Elevating Brands Digitally &middot; veloradigital07@gmail.com</p>
          </td>
        </tr>
      </table>
    </td></tr>
  </table>
</body>
</html>`;
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
