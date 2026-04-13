const express    = require('express');
const { Resend } = require('resend');
const resend = new Resend(process.env.RESEND_API_KEY);
const Contact    = require('../models/Contact');

const router = express.Router();

/* ── Email transporter ── */


/* ── Shared brand colours for emails ── */
const C = {
  plum:   '#2A1B4E',
  plumMd: '#3D2B6B',
  lav:    '#A891D4',
  lavLt:  '#D0BFF0',
  white:  '#FAFAF8',
  muted:  '#9e94b4'
};

/* ────────────────────────────────────────────
   Email helper fragments
──────────────────────────────────────────── */
function detailRow(label, value) {
  return `
    <table width="100%" cellpadding="0" cellspacing="0" style="margin-bottom:12px;">
      <tr>
        <td width="110" style="padding:10px 0;vertical-align:top;">
          <p style="margin:0;font-size:11px;letter-spacing:2px;text-transform:uppercase;color:${C.muted};">${label}</p>
        </td>
        <td style="padding:10px 0;vertical-align:top;border-bottom:1px solid rgba(168,145,212,0.1);">
          <p style="margin:0;font-size:15px;color:${C.white};">${value}</p>
        </td>
      </tr>
    </table>`;
}

function stepRow(num, title, desc) {
  return `
    <table width="100%" cellpadding="0" cellspacing="0" style="margin-bottom:18px;">
      <tr>
        <td width="40" valign="top" style="padding-top:2px;">
          <p style="margin:0;font-family:Georgia,serif;font-size:13px;color:${C.lav};opacity:0.6;">${num}</p>
        </td>
        <td valign="top">
          <p style="margin:0 0 4px;font-size:14px;color:${C.white};font-weight:500;">${title}</p>
          <p style="margin:0;font-size:13px;color:rgba(255,255,255,0.5);line-height:1.6;">${desc}</p>
        </td>
      </tr>
    </table>`;
}

/* ────────────────────────────────────────────
   Admin notification email
──────────────────────────────────────────── */
function adminEmail({ name, email, brand, message, submittedAt }) {
  return `<!DOCTYPE html>
<html lang="en">
<head><meta charset="UTF-8"><meta name="viewport" content="width=device-width,initial-scale=1.0"><title>New Enquiry – VELORA</title></head>
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
          <td style="background:${C.plumMd};padding:40px;">
            <p style="margin:0 0 8px;font-size:11px;letter-spacing:3px;text-transform:uppercase;color:${C.lav};">● New Enquiry Received</p>
            <h2 style="margin:0 0 28px;font-size:24px;font-weight:300;color:${C.white};font-family:Georgia,serif;">Someone wants to grow with VELORA</h2>
            ${detailRow('Name',  name)}
            ${detailRow('Email', `<a href="mailto:${email}" style="color:${C.lavLt};text-decoration:none;">${email}</a>`)}
            ${detailRow('Brand', brand || '—')}
            <table width="100%" cellpadding="0" cellspacing="0" style="margin-top:4px;">
              <tr><td style="padding:6px 0 4px;">
                <p style="margin:0;font-size:11px;letter-spacing:2px;text-transform:uppercase;color:${C.muted};">Message</p>
              </td></tr>
              <tr><td style="background:rgba(42,27,78,0.6);border-left:2px solid ${C.lav};padding:16px 18px;border-radius:0 6px 6px 0;">
                <p style="margin:0;font-size:15px;line-height:1.75;color:${C.white};">${message.replace(/\n/g, '<br>')}</p>
              </td></tr>
            </table>
            <table width="100%" cellpadding="0" cellspacing="0" style="margin-top:32px;">
              <tr><td align="center">
                <a href="mailto:${email}?subject=Re: Your enquiry to VELORA"
                   style="display:inline-block;background:${C.lav};color:${C.plum};text-decoration:none;font-size:12px;font-weight:600;letter-spacing:2px;text-transform:uppercase;padding:14px 36px;border-radius:2px;">
                  Reply to ${name.split(' ')[0]} &rarr;
                </a>
              </td></tr>
            </table>
            <p style="margin:28px 0 0;font-size:11px;color:${C.muted};text-align:center;">Submitted on ${submittedAt}</p>
          </td>
        </tr>
        <tr>
          <td style="background:#140a2c;border-radius:0 0 12px 12px;padding:20px 40px;text-align:center;border-top:1px solid rgba(168,145,212,0.12);">
            <p style="margin:0;font-size:11px;color:${C.muted};">© 2026 VELORA Digital Marketing · Bangalore, India</p>
          </td>
        </tr>
      </table>
    </td></tr>
  </table>
</body>
</html>`;
}

/* ────────────────────────────────────────────
   User auto-reply email
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

/* ── Input sanitiser — strip HTML tags ── */
function sanitise(str) {
  return String(str || '').replace(/<[^>]*>/g, '').trim();
}

/* ────────────────────────────────────────────
   POST /api/contact
──────────────────────────────────────────── */
router.post('/', async (req, res) => {
  try {
    const name    = sanitise(req.body.name);
    const email   = sanitise(req.body.email);
    const brand   = sanitise(req.body.brand);
    const message = sanitise(req.body.message);

    /* Manual validation */
    const errors = [];
    if (!name    || name.length    < 2)    errors.push('Name must be at least 2 characters.');
    if (!email   || !/^\S+@\S+\.\S+$/.test(email)) errors.push('A valid email address is required.');
    if (!message || message.length < 10)   errors.push('Message must be at least 10 characters.');
    if (message  && message.length > 2000) errors.push('Message must be under 2000 characters.');

    if (errors.length) {
      return res.status(400).json({ success: false, message: errors.join(' ') });
    }

    /* Save to MongoDB */
    const ip = req.headers['x-forwarded-for']?.split(',')[0].trim() || req.ip || '';
    const contact = await Contact.create({ name, email, brand, message, ip });

    /* Format submission timestamp (IST) */
    const submittedAt = new Date(contact.createdAt).toLocaleString('en-IN', {
      timeZone: 'Asia/Kolkata',
      dateStyle: 'long',
      timeStyle: 'short'
    });

    /* Admin notification */
    /* Admin notification */
await resend.emails.send({
  from: "VELORA <onboarding@resend.dev>",
  to: to: "veloradigital07@gmail.com",
  subject: `New Enquiry from ${name} — VELORA`,
  html: adminEmail({ name, email, brand, message, submittedAt })
});

/* Auto-reply to user */
await resend.emails.send({
  from: "VELORA <onboarding@resend.dev>",
  to: email,
  subject: `We received your message, ${name.split(' ')[0]}`,
  html: autoReplyEmail({ name })
});

    return res.status(200).json({
      success: true,
      message: "Your message has been sent! We'll be in touch within 24–48 hours."
    });

  } catch (err) {
    console.error('Contact route error:', err);

    if (err.name === 'ValidationError') {
      const msgs = Object.values(err.errors).map(e => e.message);
      return res.status(400).json({ success: false, message: msgs.join(' ') });
    }

    return res.status(500).json({
      success: false,
      message: 'Something went wrong on our end. Please email us at veloradigital07@gmail.com'
    });
  }
});

module.exports = router;
