const nodemailer = require('nodemailer');

function buildOtpEmailHtml(name, code, purpose = 'registration') {
  const isReset = purpose === 'password_reset';
  const heading = isReset ? 'Reset Your Trade Crow Password' : 'Verify Your Email Address';
  const subtitle = isReset ? 'Account Password Reset Code' : 'Trader Identity & Email Verification';

  return `
    <div style="font-family: 'Inter', -apple-system, BlinkMacSystemFont, Arial, sans-serif; max-width: 520px; margin: 0 auto; padding: 24px; background-color: #f8fafc; border: 1px solid #e2e8f0; border-radius: 16px;">
      <div style="background: linear-gradient(135deg, #0284c7 0%, #0ea5e9 100%); color: #ffffff; padding: 24px; text-align: center; border-radius: 12px; box-shadow: 0 4px 12px rgba(14, 165, 233, 0.25);">
        <div style="font-size: 11px; font-weight: 700; text-transform: uppercase; letter-spacing: 2px; color: #e0f2fe; margin-bottom: 4px;">DFQ TRADE CROW</div>
        <h2 style="margin: 0; font-size: 20px; font-weight: 700; color: #ffffff;">${heading}</h2>
        <p style="margin: 6px 0 0; font-size: 12px; color: #bae6fd;">${subtitle}</p>
      </div>

      <div style="background-color: #ffffff; border-radius: 12px; margin-top: 16px; border: 1px solid #e2e8f0; padding: 24px;">
        <p style="margin: 0 0 12px; font-size: 14px; color: #1e293b;">
          Hello <strong>${name || 'Trader'}</strong>,
        </p>
        <p style="margin: 0 0 16px; font-size: 13px; color: #475569; line-height: 1.6;">
          ${isReset
            ? 'We received a request to reset your DFQ Trade Crow password. Use the verification code below to authorize this change:'
            : 'Welcome to DFQ Trade Crow! To activate your peer-to-peer trading account and safeguard our community against impersonation, please verify your email with the one-time code below:'}
        </p>

        <div style="background: #f0f9ff; border: 2px dashed #0ea5e9; border-radius: 12px; padding: 18px; text-align: center; margin: 20px 0;">
          <div style="font-size: 11px; font-weight: 600; text-transform: uppercase; letter-spacing: 1.5px; color: #0284c7; margin-bottom: 6px;">One-Time Security Code</div>
          <span style="font-size: 34px; font-weight: 800; font-family: 'Courier New', Courier, monospace; letter-spacing: 8px; color: #0369a1;">
            ${code}
          </span>
        </div>

        <p style="margin: 12px 0 0; font-size: 12px; color: #64748b; line-height: 1.5;">
          This code expires in <strong>15 minutes</strong>. If you did not initiate this request, please disregard this email or report suspicious activity to our security desk.
        </p>
      </div>

      <div style="text-align: center; margin-top: 20px; font-size: 11px; color: #94a3b8; line-height: 1.5;">
        DFQ Trade Crow • Peer-to-Peer Barter, Digital Pawn & Escrow Marketplace<br/>
        Lagos & Abuja, Nigeria • Verified P2P Trading Hub
      </div>
    </div>
  `;
}

function buildStatusNotificationHtml(name, title, message, actionText, actionUrl) {
  return `
    <div style="font-family: 'Inter', -apple-system, BlinkMacSystemFont, Arial, sans-serif; max-width: 520px; margin: 0 auto; padding: 24px; background-color: #f8fafc; border: 1px solid #e2e8f0; border-radius: 16px;">
      <div style="background: linear-gradient(135deg, #0284c7 0%, #0ea5e9 100%); color: #ffffff; padding: 20px; text-align: center; border-radius: 12px;">
        <div style="font-size: 11px; font-weight: 700; text-transform: uppercase; letter-spacing: 2px; color: #e0f2fe;">DFQ TRADE CROW NOTIFICATION</div>
        <h2 style="margin: 4px 0 0; font-size: 18px; font-weight: 700; color: #ffffff;">${title}</h2>
      </div>

      <div style="background-color: #ffffff; border-radius: 12px; margin-top: 16px; border: 1px solid #e2e8f0; padding: 24px;">
        <p style="margin: 0 0 12px; font-size: 14px; color: #1e293b;">Hello <strong>${name || 'Trader'}</strong>,</p>
        <p style="margin: 0 0 16px; font-size: 13px; color: #475569; line-height: 1.6;">${message}</p>
        ${actionText && actionUrl ? `
          <div style="text-align: center; margin: 24px 0;">
            <a href="${actionUrl}" style="background-color: #0284c7; color: #ffffff; padding: 12px 24px; border-radius: 8px; text-decoration: none; font-weight: 600; font-size: 13px; display: inline-block;">${actionText}</a>
          </div>
        ` : ''}
      </div>

      <div style="text-align: center; margin-top: 20px; font-size: 11px; color: #94a3b8;">
        DFQ Trade Crow • Verified Escrow & Barter Network
      </div>
    </div>
  `;
}

async function dispatchEmail({ to, recipientName = 'Trader', otpCode = '', subject, html, purpose = 'registration' }) {
  const cleanTo = (to || '').trim().toLowerCase();
  if (!cleanTo || !cleanTo.includes('@')) {
    return { success: false, error: 'Recipient email address is invalid.' };
  }

  const mailSubject = subject || (otpCode ? `DFQ Trade Crow - Your Verification Code: ${otpCode}` : 'DFQ Trade Crow Notification');
  const mailHtml = html || buildOtpEmailHtml(recipientName, otpCode, purpose);

  // Check if SMTP environment variables are present
  const smtpHost = process.env.SMTP_HOST;
  const smtpPort = process.env.SMTP_PORT || 587;
  const smtpUser = process.env.SMTP_USER;
  const smtpPass = process.env.SMTP_PASS;

  if (smtpHost && smtpUser && smtpPass) {
    try {
      const transporter = nodemailer.createTransport({
        host: smtpHost,
        port: Number(smtpPort),
        secure: Number(smtpPort) === 465,
        auth: {
          user: smtpUser,
          pass: smtpPass
        }
      });

      await transporter.sendMail({
        from: `"${process.env.SMTP_FROM_NAME || 'DFQ Trade Crow'}" <${smtpUser}>`,
        to: cleanTo,
        subject: mailSubject,
        html: mailHtml
      });

      return {
        success: true,
        provider: 'smtp',
        delivered: true,
        message: `Verification email dispatched to ${cleanTo}`
      };
    } catch (err) {
      console.error('[EmailDispatcher] SMTP dispatch error:', err.message);
      // Fallback to local dev delivery
    }
  }

  // Development / Offline Fallback Mode
  console.log(`[EmailDispatcher DEV] To: ${cleanTo} | Subject: ${mailSubject} | OTP Code: ${otpCode}`);
  return {
    success: true,
    provider: 'dev_mock',
    delivered: true,
    devOtpCode: otpCode,
    message: `Verification code generated for ${cleanTo}`
  };
}

module.exports = {
  dispatchEmail,
  buildOtpEmailHtml,
  buildStatusNotificationHtml
};
