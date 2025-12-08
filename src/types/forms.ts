export interface WaitlistFormData {
  fullName: string;
  email: string;
  contactNumber?: string;
  organization: string;
  website?: string; // Honeypot field
}
