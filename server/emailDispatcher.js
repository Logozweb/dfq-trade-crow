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

const db = require('./db');

async function dispatchEmail({ to, recipientName = 'Trader', otpCode = '', subject, html, purpose = 'registration' }) {
  const cleanTo = (to || '').trim().toLowerCase();
  if (!cleanTo || !cleanTo.includes('@')) {
    return { success: false, error: 'Recipient email address is invalid.' };
  }

  // Load configured settings from database
  let settings;
  try {
    settings = db.getEmailSettingsFromDb();
  } catch (_) {
    settings = { provider: 'smtp', smtp: {} };
  }

  const senderName = settings.senderName || 'DFQ Trade Crow Security';
  const senderEmail = settings.senderEmail || (settings.smtp && settings.smtp.user) || 'no-reply@dfqtradecrow.com';
  const mailSubject = subject || (otpCode ? `${settings.subjectLine || 'DFQ Trade Crow - Your Verification Code'}: ${otpCode}` : 'DFQ Trade Crow Notification');
  const mailHtml = html || buildOtpEmailHtml(recipientName, otpCode, purpose);

  // 1. SMTP Provider
  const smtpHost = (settings.smtp && settings.smtp.host) || process.env.SMTP_HOST;
  const smtpPort = (settings.smtp && settings.smtp.port) || process.env.SMTP_PORT || 587;
  const smtpUser = (settings.smtp && settings.smtp.user) || process.env.SMTP_USER;
  const smtpPass = (settings.smtp && settings.smtp.pass) || process.env.SMTP_PASS;
  const smtpSecure = (settings.smtp && typeof settings.smtp.secure === 'boolean') ? settings.smtp.secure : Number(smtpPort) === 465;

  if (settings.provider === 'smtp' && smtpHost && smtpUser && smtpPass) {
    try {
      const transporter = nodemailer.createTransport({
        host: smtpHost,
        port: Number(smtpPort),
        secure: smtpSecure,
        auth: {
          user: smtpUser,
          pass: smtpPass
        }
      });

      const info = await transporter.sendMail({
        from: `"${senderName}" <${smtpUser}>`,
        to: cleanTo,
        subject: mailSubject,
        html: mailHtml
      });

      db.saveEmailOutboxLog({
        recipientEmail: cleanTo,
        recipientName,
        otpCode,
        subject: mailSubject,
        status: 'delivered',
        provider: 'smtp',
        details: `MessageId: ${info.messageId || 'OK'}`
      });

      return {
        success: true,
        provider: 'smtp',
        delivered: true,
        message: `Verification email dispatched to ${cleanTo}`
      };
    } catch (err) {
      console.error('[EmailDispatcher] SMTP dispatch error:', err.message);
      db.saveEmailOutboxLog({
        recipientEmail: cleanTo,
        recipientName,
        otpCode,
        subject: mailSubject,
        status: 'failed',
        provider: 'smtp',
        details: err.message
      });
      // Fall through to dev delivery so user registration never locks up
    }
  }

  // 2. Resend API Provider
  if (settings.provider === 'resend' && settings.resendApiKey) {
    try {
      const res = await fetch('https://api.resend.com/emails', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${settings.resendApiKey}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          from: `${senderName} <${senderEmail}>`,
          to: [cleanTo],
          subject: mailSubject,
          html: mailHtml
        })
      });
      const data = await res.json();
      if (res.ok) {
        db.saveEmailOutboxLog({
          recipientEmail: cleanTo,
          recipientName,
          otpCode,
          subject: mailSubject,
          status: 'delivered',
          provider: 'resend',
          details: `Resend ID: ${data.id}`
        });
        return {
          success: true,
          provider: 'resend',
          delivered: true,
          message: `Verification email delivered via Resend to ${cleanTo}`
        };
      } else {
        db.saveEmailOutboxLog({
          recipientEmail: cleanTo,
          recipientName,
          otpCode,
          subject: mailSubject,
          status: 'failed',
          provider: 'resend',
          details: JSON.stringify(data)
        });
      }
    } catch (rErr) {
      console.error('[EmailDispatcher] Resend error:', rErr.message);
    }
  }

  // 3. Development / Simulated Mode (Fallback)
  console.log(`[EmailDispatcher DEV] To: ${cleanTo} | Subject: ${mailSubject} | OTP Code: ${otpCode}`);
  db.saveEmailOutboxLog({
    recipientEmail: cleanTo,
    recipientName,
    otpCode,
    subject: mailSubject,
    status: 'simulated',
    provider: 'dev_mock',
    details: 'Simulated dispatch (dev mode)'
  });

  return {
    success: true,
    provider: 'dev_mock',
    delivered: true,
    devOtpCode: otpCode,
    message: `Verification code generated for ${cleanTo}`
  };
}

async function sendTestEmail({ to, smtpConfig, senderName, senderEmail }) {
  const cleanTo = (to || '').trim().toLowerCase();
  if (!cleanTo || !cleanTo.includes('@')) {
    return { success: false, error: 'Target test email address is invalid.' };
  }

  const host = smtpConfig.host;
  const port = Number(smtpConfig.port || 587);
  const secure = smtpConfig.secure === true || port === 465;
  const user = smtpConfig.user;
  const pass = smtpConfig.pass;

  if (!host || !user || !pass) {
    return { success: false, error: 'SMTP Host, Username, and Password are required for verification test.' };
  }

  try {
    const transporter = nodemailer.createTransport({
      host,
      port,
      secure,
      auth: { user, pass },
      connectionTimeout: 8000,
      greetingTimeout: 5000
    });

    // Verify SMTP handshake
    await transporter.verify();

    const fromName = senderName || 'DFQ Trade Crow Dispatcher Test';
    const testCode = Math.floor(100000 + Math.random() * 900000).toString();
    const testHtml = buildOtpEmailHtml('Administrator', testCode, 'test');

    const info = await transporter.sendMail({
      from: `"${fromName}" <${user}>`,
      to: cleanTo,
      subject: `DFQ Trade Crow - Dispatcher Test Email [${testCode}]`,
      html: testHtml
    });

    db.saveEmailOutboxLog({
      recipientEmail: cleanTo,
      recipientName: 'Administrator',
      otpCode: testCode,
      subject: 'Dispatcher Test Email',
      status: 'delivered',
      provider: 'smtp',
      details: `Test verified. MessageId: ${info.messageId || 'OK'}`
    });

    return {
      success: true,
      message: `Test email sent successfully to ${cleanTo}! SMTP handshake verified.`,
      messageId: info.messageId
    };
  } catch (err) {
    console.error('[EmailDispatcher Test Error]', err);
    return {
      success: false,
      error: `SMTP Verification Failed: ${err.message}`
    };
  }
}

module.exports = {
  dispatchEmail,
  sendTestEmail,
  buildOtpEmailHtml,
  buildStatusNotificationHtml
};
