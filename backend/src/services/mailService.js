const nodemailer = require('nodemailer');
const { config } = require('../config/env');

let transporter = null;
function getTransporter() {
  if (!config.smtpConfigured) return null;
  if (!transporter) {
    transporter = nodemailer.createTransport({
      host: config.smtp.host,
      port: config.smtp.port,
      secure: config.smtp.secure,
      auth: config.smtp.user ? { user: config.smtp.user, pass: config.smtp.password } : undefined,
    });
  }
  return transporter;
}

async function sendMail({ to, subject, text, html }) {
  const t = getTransporter();
  if (!t) {
    console.warn(`[mail] SMTP not configured - email to ${to} not sent (subject: "${subject}")`);
    if (config.env !== 'production') console.warn(`[mail:dev] ${text}`);
    return false;
  }
  await t.sendMail({ from: config.smtp.from, to, subject, text, html });
  return true;
}

const sendResetCode = (to, name, code) =>
  sendMail({
    to,
    subject: 'Your DocuFlow password reset code',
    text: `Hi ${name},\n\nYour DocuFlow password reset code is ${code}. It expires in 15 minutes.\nIf you did not request this, you can ignore this email.\n`,
    html: `<p>Hi ${name},</p><p>Your DocuFlow password reset code is <b style="font-size:20px;letter-spacing:3px">${code}</b>.<br/>It expires in 15 minutes.</p><p>If you did not request this, you can ignore this email.</p>`,
  });

module.exports = { sendMail, sendResetCode };

const escapeHtml = (s) => String(s).replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));

const sendExpiryAlert = (user, { heading, body, action }) =>
  sendMail({
    to: user.email,
    subject: `DocuFlow: ${heading}`,
    text: `Hi ${user.name},\n\n${body}\nRecommended action: ${action}\n\nOpen DocuFlow > Renewal to see the checklist and steps.\n`,
    html: `<p>Hi ${escapeHtml(user.name)},</p><p>${escapeHtml(body)}</p><p><b>Recommended action:</b> ${escapeHtml(action)}</p><p>Open DocuFlow &rsaquo; Renewal to see the checklist and steps.</p>`,
  });

module.exports.sendExpiryAlert = sendExpiryAlert;
