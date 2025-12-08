// Email notification service for Netlify Functions
// In production, integrate with AWS SES, SendGrid, or similar service

interface EmailData {
  to: string;
  subject: string;
  body: string;
}

export async function sendEmail(data: EmailData): Promise<boolean> {
  // TODO: Integrate with actual email service (AWS SES, SendGrid, etc.)
  // For now, just log the email that would be sent
  
  console.log('Email would be sent:', {
    to: data.to,
    subject: data.subject,
    body: data.body,
  });

  // Simulate successful email send
  return true;
}

export async function sendWaitlistConfirmation(
  email: string,
  fullName: string
): Promise<boolean> {
  const emailData: EmailData = {
    to: email,
    subject: 'Welcome to the RAPHA Waitlist',
    body: `
      Hi ${fullName},

      Thank you for joining the RAPHA waitlist!

      We're excited to have you on board. You'll be among the first to know when RAPHA becomes available.

      In the meantime, stay tuned for updates about our revolutionary autonomous cyber defense platform.

      Best regards,
      The EmmaTech Team

      ---
      DETECT. DECEIVE. DEFEND.
    `,
  };

  return sendEmail(emailData);
}

export async function sendTeamNotification(
  fullName: string,
  email: string,
  organization: string,
  contactNumber?: string
): Promise<boolean> {
  const emailData: EmailData = {
    to: 'team@emmatech.com',
    subject: 'New Waitlist Signup',
    body: `
      New waitlist signup:

      Name: ${fullName}
      Email: ${email}
      Organization: ${organization}
      Contact Number: ${contactNumber || 'Not provided'}
      Timestamp: ${new Date().toISOString()}
    `,
  };

  return sendEmail(emailData);
}
