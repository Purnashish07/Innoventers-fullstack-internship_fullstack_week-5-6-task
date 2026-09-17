const nodemailer = require("nodemailer");

const buildWelcomeEmail = (name) => `
  <div style="font-family:Arial,sans-serif;max-width:600px;margin:0 auto;padding:24px;background:#f8fafc;border-radius:12px;">
    <h2 style="color:#0f172a;">Welcome to ProjectHub, ${name}!</h2>
    <p style="color:#334155;">Your account is ready. Start managing projects, uploading images, and upgrading to Premium when you need advanced features.</p>
    <p style="color:#334155;">Best regards,<br/>The ProjectHub Team</p>
  </div>
`;

const buildPremiumEmail = (name, amount) => `
  <div style="font-family:Arial,sans-serif;max-width:600px;margin:0 auto;padding:24px;background:#ecfeff;border-radius:12px;">
    <h2 style="color:#0f172a;">Premium activated</h2>
    <p style="color:#334155;">Hi ${name}, your ProjectHub Premium plan has been activated successfully.</p>
    <p style="color:#334155;">Amount paid: ₹${amount}</p>
    <p style="color:#334155;">You can now enjoy premium features and an enhanced experience.</p>
  </div>
`;

const buildPaymentFailureEmail = (name, reason) => `
  <div style="font-family:Arial,sans-serif;max-width:600px;margin:0 auto;padding:24px;background:#fff7ed;border-radius:12px;">
    <h2 style="color:#0f172a;">Payment issue</h2>
    <p style="color:#334155;">Hi ${name}, your ProjectHub premium payment could not be completed.</p>
    <p style="color:#334155;">Reason: ${reason}</p>
    <p style="color:#334155;">Please try again or contact support if the issue continues.</p>
  </div>
`;

const sendEmail = async ({ to, subject, html }) => {
  if (!process.env.SMTP_HOST || !process.env.SMTP_EMAIL || !process.env.SMTP_PASSWORD) {
    console.log(`[EMAIL FALLBACK] To: ${to} | Subject: ${subject}`);
    return { sent: false, reason: "missing-config" };
  }

  try {
    const transporter = nodemailer.createTransport({
      host: process.env.SMTP_HOST,
      port: Number(process.env.SMTP_PORT || 587),
      secure: Number(process.env.SMTP_PORT || 587) === 465,
      auth: {
        user: process.env.SMTP_EMAIL,
        pass: process.env.SMTP_PASSWORD,
      },
    });

    await transporter.sendMail({
      from: `"ProjectHub" <${process.env.SMTP_EMAIL}>`,
      to,
      subject,
      html,
    });

    console.log(`[EMAIL SENT] To: ${to} | Subject: ${subject}`);
    return { sent: true };
  } catch (err) {
    console.error(`[EMAIL ERROR] ${err.message}`);
    return { sent: false, reason: err.message };
  }
};

module.exports = sendEmail;
module.exports.buildWelcomeEmail = buildWelcomeEmail;
module.exports.buildPremiumEmail = buildPremiumEmail;
module.exports.buildPaymentFailureEmail = buildPaymentFailureEmail;

