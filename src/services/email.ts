import emailjs from '@emailjs/browser';
import type { WaitlistFormData } from '../types/forms';

const SERVICE_ID = 'service_dkbveem';
const TEMPLATE_ID = 'template_of5v0lp';
const CONTACT_TEMPLATE_ID = 'template_hh0iedo';
const PUBLIC_KEY = 'ZKfupZlyserKaKOKN';

export interface ContactFormData {
    name: string;
    email: string;
    company?: string;
    message: string;
}

export const sendWaitlistEmail = async (data: WaitlistFormData): Promise<void> => {
    try {
        const templateParams = {
            fullName: data.fullName,
            email: data.email,
            organization: data.organization,
            contactNumber: data.contactNumber || 'Not provided',
        };

        await emailjs.send(
            SERVICE_ID,
            TEMPLATE_ID,
            templateParams,
            PUBLIC_KEY
        );
    } catch (error) {
        console.error('Failed to send email:', error);
        throw error;
    }
};

export const sendContactEmail = async (data: ContactFormData): Promise<void> => {
    try {
        const templateParams = {
            name: data.name,
            email: data.email,
            company: data.company || 'Not provided',
            message: data.message,
        };

        await emailjs.send(
            SERVICE_ID,
            CONTACT_TEMPLATE_ID,
            templateParams,
            PUBLIC_KEY
        );
    } catch (error) {
        console.error('Failed to send contact email:', error);
        throw error;
    }
};
