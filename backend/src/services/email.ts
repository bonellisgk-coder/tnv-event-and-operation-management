import * as nodemailer from 'nodemailer';
import * as path from 'path';
import * as fs from 'fs';

const SMTP_HOST = process.env.SMTP_HOST || 'smtp.ethereal.email';
const SMTP_PORT = parseInt(process.env.SMTP_PORT || '587', 10);
const SMTP_USER = process.env.SMTP_USER || '';
const SMTP_PASS = process.env.SMTP_PASS || '';
const SMTP_FROM = process.env.SMTP_FROM || '"TN Volunteer Platform" <no-reply@volunteer.tn.gov.in>';

// Create local folder for fallback email logging
const SENT_EMAILS_DIR = path.join(__dirname, '../../sent_emails');
if (!fs.existsSync(SENT_EMAILS_DIR)) {
  fs.mkdirSync(SENT_EMAILS_DIR, { recursive: true });
}

// Logo path
const LOGO_PATH = path.join(__dirname, '../../assets/logo.png');
// Create assets dir if not exists
const ASSETS_DIR = path.join(__dirname, '../../assets');
if (!fs.existsSync(ASSETS_DIR)) {
  fs.mkdirSync(ASSETS_DIR, { recursive: true });
}

// Create a dummy transparent pixel logo if not exists
if (!fs.existsSync(LOGO_PATH)) {
  const dummyPngBase64 = 'iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mNkYAAAAAYAAjCB0C8AAAAASUVORK5CYII=';
  fs.writeFileSync(LOGO_PATH, Buffer.from(dummyPngBase64, 'base64'));
}

let transporter: nodemailer.Transporter;

if (SMTP_USER && SMTP_PASS) {
  transporter = nodemailer.createTransport({
    host: SMTP_HOST,
    port: SMTP_PORT,
    secure: SMTP_PORT === 465,
    auth: {
      user: SMTP_USER,
      pass: SMTP_PASS,
    },
  });
} else {
  // Fallback Ethereal or Mock
  transporter = nodemailer.createTransport({
    host: 'smtp.ethereal.email',
    port: 587,
    auth: {
      user: 'mock.user@ethereal.email',
      pass: 'mock.pass',
    },
  });
}

function getBaseTemplate(title: string, bodyContent: string): string {
  return `
  <!DOCTYPE html>
  <html>
    <head>
      <meta charset="utf-8">
      <title>${title}</title>
      <style>
        body {
          font-family: 'Inter', 'Helvetica Neue', Helvetica, Arial, sans-serif;
          background-color: #FDF6E3;
          margin: 0;
          padding: 20px;
          color: #333333;
        }
        .container {
          max-width: 600px;
          margin: 0 auto;
          background-color: #ffffff;
          border-radius: 12px;
          overflow: hidden;
          box-shadow: 0 4px 10px rgba(0, 0, 0, 0.05);
          border: 1px solid #EFEAE0;
        }
        .header {
          background-color: #7A1F2B;
          padding: 30px;
          text-align: center;
          border-bottom: 4px solid #D4A017;
        }
        .header img {
          height: 60px;
          margin-bottom: 10px;
        }
        .header h1 {
          color: #FDF6E3;
          margin: 0;
          font-family: 'Merriweather', Georgia, serif;
          font-size: 24px;
          letter-spacing: 0.5px;
        }
        .content {
          padding: 30px;
          line-height: 1.6;
        }
        .button-container {
          text-align: center;
          margin: 30px 0;
        }
        .btn {
          background-color: #7A1F2B;
          color: #FDF6E3 !important;
          padding: 12px 24px;
          text-decoration: none;
          font-weight: bold;
          border-radius: 6px;
          border-bottom: 2px solid #D4A017;
          display: inline-block;
        }
        .footer {
          background-color: #F8F4EA;
          padding: 20px;
          text-align: center;
          font-size: 12px;
          color: #666666;
          border-top: 1px solid #EFEAE0;
        }
        .highlight {
          color: #7A1F2B;
          font-weight: bold;
        }
      </style>
    </head>
    <body>
      <div class="container">
        <div class="header">
          <img src="cid:logo" alt="TN Govt Logo" />
          <h1>தமிழ்நாடு தன்னார்வலர்கள்</h1>
          <div style="color: #D4A017; font-size: 12px; margin-top: 5px; font-weight: bold; text-transform: uppercase; letter-spacing: 1px;">Volunteer Management Platform</div>
        </div>
        <div class="content">
          ${bodyContent}
        </div>
        <div class="footer">
          © 2026 Government of Tamil Nadu. All Rights Reserved.<br>
          This is an automated email. Please do not reply directly.
        </div>
      </div>
    </body>
  </html>
  `;
}

interface EmailOptions {
  to: string;
  subject: string;
  html: string;
}

export async function sendEmail({ to, subject, html }: EmailOptions): Promise<void> {
  const mailOptions = {
    from: SMTP_FROM,
    to,
    subject,
    html,
    attachments: [
      {
        filename: 'logo.png',
        path: LOGO_PATH,
        cid: 'logo', // same as in src="cid:logo"
      },
    ],
  };

  try {
    // If Ethereal mock or SMTP is configured
    if (SMTP_USER && SMTP_PASS) {
      await transporter.sendMail(mailOptions);
      console.log(`Email successfully sent to ${to}`);
    } else {
      // Offline/dev fallback: Save email content to a file for previewing
      const filename = `${Date.now()}-${to.replace(/[^a-zA-Z0-9]/g, '_')}.html`;
      const filePath = path.join(SENT_EMAILS_DIR, filename);
      fs.writeFileSync(filePath, html);
      console.log(`[Email Mocked] Saved email to ${filePath}`);
    }
  } catch (error) {
    console.error('Error sending email, saving to fallback local folder:', error);
    try {
      const filename = `error-${Date.now()}-${to.replace(/[^a-zA-Z0-9]/g, '_')}.html`;
      const filePath = path.join(SENT_EMAILS_DIR, filename);
      fs.writeFileSync(filePath, html);
    } catch (fsErr) {
      console.error('Failed to write fallback email file:', fsErr);
    }
  }
}

// 1. Registration Confirmation Template
export function sendRegistrationConfirmation(
  to: string,
  name: string,
  eventTitle: string,
  eventDate: string,
  eventVenue: string,
  editLink: string
) {
  const html = getBaseTemplate(
    'Registration Confirmed',
    `
    <h2>Vanakkam ${name},</h2>
    <p>Your registration for the event <span class="highlight">${eventTitle}</span> has been successfully confirmed.</p>
    <p><strong>Event Details:</strong></p>
    <ul>
      <li><strong>Date:</strong> ${eventDate}</li>
      <li><strong>Venue:</strong> ${eventVenue}</li>
    </ul>
    <p>Please make sure to arrive at the venue 15 minutes before the start time. A QR code for your check-in will be available at the reception, or you can self-check-in by scanning the event's coordinator QR code.</p>
    <p>If you need to update your details or cancel your registration, you can use the secure link below:</p>
    <div class="button-container">
      <a href="${editLink}" class="btn">Edit/Manage Registration</a>
    </div>
    <p>Thank you for volunteering and contributing to the community!</p>
    `
  );
  return sendEmail({ to, subject: `Registration Confirmed: ${eventTitle}`, html });
}

// 2. Member Invitation Template
export function sendMemberInvitation(
  to: string,
  mainParticipantName: string,
  memberName: string,
  eventTitle: string,
  eventDate: string,
  eventVenue: string,
  editLink: string
) {
  const html = getBaseTemplate(
    'Event Invitation',
    `
    <h2>Vanakkam ${memberName},</h2>
    <p><span class="highlight">${mainParticipantName}</span> has registered you as an additional team member for the upcoming event <span class="highlight">${eventTitle}</span>.</p>
    <p><strong>Event Details:</strong></p>
    <ul>
      <li><strong>Date:</strong> ${eventDate}</li>
      <li><strong>Venue:</strong> ${eventVenue}</li>
    </ul>
    <p>We are excited to have you join our volunteer team! If you need to manage your personal details or opt out, please use the link below:</p>
    <div class="button-container">
      <a href="${editLink}" class="btn">View & Manage Invitation</a>
    </div>
    <p>See you at the event!</p>
    `
  );
  return sendEmail({ to, subject: `Invitation: ${eventTitle} (Volunteer Drive)`, html });
}

// 3. Task Assignment Template
export function sendTaskAssignment(
  to: string,
  volunteerName: string,
  taskTitle: string,
  taskDescription: string,
  priority: string,
  deadline: string
) {
  const html = getBaseTemplate(
    'Task Assigned',
    `
    <h2>Vanakkam ${volunteerName},</h2>
    <p>You have been assigned a new coordinator task for an upcoming event.</p>
    <div style="background-color: #F8F4EA; border-left: 4px solid #7A1F2B; padding: 15px; margin: 20px 0;">
      <h3 style="margin-top: 0; color: #7A1F2B;">${taskTitle}</h3>
      <p style="margin-bottom: 5px;"><strong>Description:</strong> ${taskDescription}</p>
      <p style="margin-bottom: 5px;"><strong>Priority:</strong> <span class="highlight">${priority}</span></p>
      <p style="margin-bottom: 0;"><strong>Deadline:</strong> ${deadline}</p>
    </div>
    <p>Please log in to the Volunteer Portal dashboard to view task details and update its completion progress status.</p>
    <div class="button-container">
      <a href="${process.env.APP_URL || 'http://localhost:5173'}/dashboard/tasks" class="btn">View My Tasks</a>
    </div>
    <p>Your leadership makes these events possible. Thank you!</p>
    `
  );
  return sendEmail({ to, subject: `Task Assigned: ${taskTitle}`, html });
}

// 4. Absence Notice Template
export function sendAbsenceNotice(
  to: string,
  name: string,
  eventTitle: string,
  eventDate: string
) {
  const html = getBaseTemplate(
    'Absence Notice',
    `
    <h2>Vanakkam ${name},</h2>
    <p>We missed you at the event <span class="highlight">${eventTitle}</span> held on ${eventDate}.</p>
    <p>As a public service initiative, we highly value the commitment of our volunteers. We understand that plans can change. If you were unable to attend due to unforeseen circumstances, we hope to see you in our next volunteer activity!</p>
    <p>You can check the volunteer dashboard for future events and volunteer drives in your area.</p>
    <div class="button-container">
      <a href="${process.env.APP_URL || 'http://localhost:5173'}" class="btn">Browse Future Events</a>
    </div>
    <p>Best regards,<br>Youth Welfare & Sports Development Dept, Tamil Nadu</p>
    `
  );
  return sendEmail({ to, subject: `We missed you at ${eventTitle}`, html });
}

// 5. Password Reset Template
export function sendPasswordReset(
  to: string,
  name: string,
  resetLink: string
) {
  const html = getBaseTemplate(
    'Reset Password Request',
    `
    <h2>Vanakkam ${name},</h2>
    <p>We received a request to reset your password for your Tamil Nadu Volunteer Platform account.</p>
    <p>Click the button below to set a new password. This link is valid for <span class="highlight">exactly 1 hour</span> and can only be used once.</p>
    <div class="button-container">
      <a href="${resetLink}" class="btn">Reset Password</a>
    </div>
    <p>If you did not make this request, you can safely ignore this email. Your password will remain unchanged.</p>
    `
  );
  return sendEmail({ to, subject: 'Reset Password Request', html });
}
