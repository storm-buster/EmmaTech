import emailjs from '@emailjs/browser';

const SERVICE_ID = 'service_dkbveem';
const CONTACT_TEMPLATE_ID = 'template_hh0iedo';
const PUBLIC_KEY = 'ZKfupZlyserKaKOKN';

export interface ContactFormData {
    name: string;
    email: string;
    company?: string;
    message: string;
}

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
