const express    = require('express');
const nodemailer = require('nodemailer');
const Contact    = require('../models/Contact');

const router = express.Router();

/* ── Brevo SMTP transporter ── */
const transporter = nodemailer.createTransport({
  host: 'smtp-relay.brevo.com',
  port: 587,
  secure: false,
  auth: {
    user: process.env.BREVO_USER,
    pass: process.env.BREVO_PASS
  }
});

/* ── Shared brand colours ── */
const C = {
  plum:   '#2A1B4E',
  plumMd: '#3D2B6B',
  lav:    '#A891D4',
  lavLt:  '#D0BFF0',
  white:  '#FAFAF8',
  muted:  '#9e94b4'
};

/* ── Helper fragments (UNCHANGED) ── */
function detailRow(label, value) {
  return `
    <table width="100%" cellpadding="0" cellspacing="0" style="margin-bottom:12px;">
      <tr>
        <td width="110" style="padding:10px 0;">
          <p style="margin:0;font-size:11px;color:${C.muted};">${label}</p>
        </td>
        <td style="padding:10px 0;border-bottom:1px solid rgba(168,145,212,0.1);">
          <p style="margin:0;font-size:15px;color:${C.white};">${value}</p>
        </td>
      </tr>
    </table>`;
}

function stepRow(num, title, desc) {
  return `
    <table width="100%" style="margin-bottom:18px;">
      <tr>
        <td width="40"><p style="color:${C.lav};">${num}</p></td>
        <td>
          <p style="color:${C.white};">${title}</p>
          <p style="color:#aaa;">${desc}</p>
        </td>
      </tr>
    </table>`;
}

/* ── EMAIL TEMPLATES (UNCHANGED) ── */
function adminEmail(data) { return `<p>New enquiry from ${data.name}</p>`; }
function autoReplyEmail(data) { return `<p>Thanks ${data.name}</p>`; }

/* ── SANITISER ── */
function sanitise(str) {
  return String(str || '').replace(/<[^>]*>/g, '').trim();
}

/* ── SEND EMAIL HELPER ── */
async function sendEmail(label, payload) {
  try {
    const info = await transporter.sendMail(payload);
    console.log(`✅ [${label}] Sent:`, info.messageId);
    return true;
  } catch (err) {
    console.error(`❌ [${label}] Error:`, err.message);
    return false;
  }
}

/* ── ROUTE ── */
router.post('/', async (req, res) => {
  try {
    const name    = sanitise(req.body.name);
    const email   = sanitise(req.body.email);
    const brand   = sanitise(req.body.brand);
    const message = sanitise(req.body.message);

    const contact = await Contact.create({ name, email, brand, message });

    const submittedAt = new Date(contact.createdAt).toLocaleString();

    /* 🔥 BOTH EMAILS */
    await Promise.allSettled([

      sendEmail('ADMIN', {
        from: `"VELORA" <${process.env.BREVO_USER}>`,
        to: "veloradigital07@gmail.com",
        subject: `New Enquiry from ${name}`,
        html: adminEmail({ name, email, brand, message, submittedAt })
      }),

      sendEmail('USER', {
        from: `"VELORA" <${process.env.BREVO_USER}>`,
        to: email,
        subject: `We received your message`,
        html: autoReplyEmail({ name })
      })

    ]);

    return res.json({ success: true });

  } catch (err) {
    console.error(err);
    return res.status(500).json({ success: false });
  }
});

module.exports = router;
