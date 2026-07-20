const nodemailer = require('nodemailer');

let transporter = null;

const getTransporter = () => {
  if (transporter) return transporter;
  if (!process.env.SMTP_USER || process.env.SMTP_USER === 'your_email@gmail.com') {
    return null;
  }
  transporter = nodemailer.createTransport({
    host: process.env.SMTP_HOST,
    port: parseInt(process.env.SMTP_PORT || '587'),
    secure: false,
    auth: {
      user: process.env.SMTP_USER,
      pass: process.env.SMTP_PASS,
    },
  });
  return transporter;
};

const sendEmail = async (to, subject, html) => {
  const transport = getTransporter();
  if (!transport) {
    console.log(`[Email skipped] To: ${to} | Subject: ${subject}`);
    return false;
  }
  try {
    await transport.sendMail({
      from: process.env.EMAIL_FROM || 'Szabist Library <library@szabist.edu.pk>',
      to,
      subject,
      html,
    });
    return true;
  } catch (err) {
    console.error('Email error:', err.message);
    return false;
  }
};

module.exports = { sendEmail };
