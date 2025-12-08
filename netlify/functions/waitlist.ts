import { Handler, HandlerEvent } from '@netlify/functions';

interface WaitlistEntry {
  fullName: string;
  email: string;
  contactNumber?: string;
  organization: string;
  timestamp: string;
  source: string;
}

// In-memory storage for demo (replace with actual database in production)
const waitlistEntries: Map<string, WaitlistEntry> = new Map();

// Rate limiting storage (IP -> timestamps)
const rateLimitMap: Map<string, number[]> = new Map();

const RATE_LIMIT_MAX = 5;
const RATE_LIMIT_WINDOW = 60 * 60 * 1000; // 1 hour in milliseconds

function validateEmail(email: string): boolean {
  const emailRegex = /^[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}$/i;
  return emailRegex.test(email);
}

function validateInput(data: WaitlistEntry): string[] {
  const errors: string[] = [];

  if (!data.fullName || data.fullName.length < 2 || data.fullName.length > 100) {
    errors.push('Full name must be between 2 and 100 characters');
  }

  if (!data.email || !validateEmail(data.email)) {
    errors.push('Valid email address is required');
  }

  if (!data.organization || data.organization.length < 2 || data.organization.length > 200) {
    errors.push('Organization name must be between 2 and 200 characters');
  }

  return errors;
}

function checkRateLimit(ip: string): boolean {
  const now = Date.now();
  const timestamps = rateLimitMap.get(ip) || [];

  // Remove timestamps outside the window
  const recentTimestamps = timestamps.filter(
    (timestamp) => now - timestamp < RATE_LIMIT_WINDOW
  );

  if (recentTimestamps.length >= RATE_LIMIT_MAX) {
    return false;
  }

  recentTimestamps.push(now);
  rateLimitMap.set(ip, recentTimestamps);
  return true;
}

export const handler: Handler = async (
  event: HandlerEvent
) => {
  // CORS headers
  const headers = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Headers': 'Content-Type',
    'Access-Control-Allow-Methods': 'POST, OPTIONS',
  };

  // Handle OPTIONS request
  if (event.httpMethod === 'OPTIONS') {
    return {
      statusCode: 200,
      headers,
      body: '',
    };
  }

  // Only allow POST
  if (event.httpMethod !== 'POST') {
    return {
      statusCode: 405,
      headers,
      body: JSON.stringify({
        success: false,
        message: 'Method not allowed',
      }),
    };
  }

  try {
    // Get IP address for rate limiting
    const ip = event.headers['x-forwarded-for']?.split(',')[0] ||
      event.headers['client-ip'] ||
      'unknown';

    // Check rate limit
    if (!checkRateLimit(ip)) {
      return {
        statusCode: 429,
        headers,
        body: JSON.stringify({
          success: false,
          message: 'Too many requests. Please try again in a few minutes.',
        }),
      };
    }

    const data = JSON.parse(event.body || '{}') as WaitlistEntry;

    // Validate input
    const validationErrors = validateInput(data);
    if (validationErrors.length > 0) {
      return {
        statusCode: 400,
        headers,
        body: JSON.stringify({
          success: false,
          message: 'Validation failed',
          errors: validationErrors,
        }),
      };
    }

    // Check for duplicate email
    if (waitlistEntries.has(data.email.toLowerCase())) {
      return {
        statusCode: 409,
        headers,
        body: JSON.stringify({
          success: false,
          message: 'This email is already on our waitlist. We\'ll be in touch soon!',
        }),
      };
    }

    // Store the entry (in production, save to database)
    const entry: WaitlistEntry = {
      fullName: data.fullName,
      email: data.email.toLowerCase(),
      contactNumber: data.contactNumber,
      organization: data.organization,
      timestamp: data.timestamp || new Date().toISOString(),
      source: data.source || 'website',
    };

    waitlistEntries.set(entry.email, entry);

    // Log for debugging (in production, use proper logging)
    console.log('New waitlist entry:', {
      email: entry.email,
      organization: entry.organization,
      timestamp: entry.timestamp,
    });

    // Send email notifications (async, don't wait for completion)
    // Uncomment when email service is configured
    // import { sendWaitlistConfirmation, sendTeamNotification } from './email';
    // sendWaitlistConfirmation(entry.email, entry.fullName).catch(console.error);
    // sendTeamNotification(entry.fullName, entry.email, entry.organization, entry.contactNumber).catch(console.error);

    return {
      statusCode: 200,
      headers,
      body: JSON.stringify({
        success: true,
        message: 'Successfully added to waitlist',
        id: entry.email,
      }),
    };
  } catch (error) {
    console.error('Error processing waitlist submission:', error);
    return {
      statusCode: 500,
      headers,
      body: JSON.stringify({
        success: false,
        message: 'Something went wrong on our end. Please try again in a few moments.',
      }),
    };
  }
};
