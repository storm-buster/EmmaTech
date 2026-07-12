import { useState } from 'react';
import styled from 'styled-components';
import { motion } from 'framer-motion';
import { useForm } from 'react-hook-form';
import { Button } from './Button';
import { breakpoints } from '../styles/breakpoints';
import { sendContactEmail } from '../services/email';
import type { ContactFormData } from '../services/email';

const CONTACT_EMAIL = 'avinash@emmatech.in';
const CONTACT_MOBILE = '+91 76784 06830';

const SectionContainer = styled.section`
  padding: ${({ theme }) => theme.spacing['4xl']} ${({ theme }) =>
    theme.spacing.lg};
  background: ${({ theme }) => theme.colors.background.primary};
  position: relative;

  ${breakpoints.tablet} {
    padding: ${({ theme }) => theme.spacing['4xl']} ${({ theme }) =>
    theme.spacing['2xl']};
  }
`;

const SectionPrefix = styled.span`
  font-family: ${({ theme }) => theme.typography.fontFamily.monospace};
  font-size: 11px;
  font-weight: 700;
  color: #3FBF7F;
  text-transform: uppercase;
  letter-spacing: 0.15em;
  margin-bottom: ${({ theme }) => theme.spacing.xs};
  display: block;
  text-align: center;
`;

const SectionTitle = styled.h2`
  font-size: 36px;
  line-height: 1.2;
  font-weight: 700;
  color: ${({ theme }) => theme.colors.neutral.white};
  text-align: center;
  margin-bottom: ${({ theme }) => theme.spacing.md};

  &::after {
    content: '';
    display: block;
    width: 80px;
    height: 4px;
    background: ${({ theme }) => theme.gradients.primary};
    margin: ${({ theme }) => theme.spacing.lg} auto 0;
    border-radius: 2px;
    box-shadow: 0 0 10px ${({ theme }) => theme.colors.primary.glow};
  }

  ${breakpoints.tablet} {
    font-size: 48px;
  }
`;

const SectionSubtitle = styled.p`
  font-size: 18px;
  line-height: 1.6;
  color: ${({ theme }) => theme.colors.neutral.mediumGray};
  text-align: center;
  margin-bottom: ${({ theme }) => theme.spacing['3xl']};
  max-width: 800px;
  margin-left: auto;
  margin-right: auto;

  ${breakpoints.tablet} {
    font-size: 20px;
  }
`;

const ContactGrid = styled.div`
  display: grid;
  grid-template-columns: 1fr;
  gap: ${({ theme }) => theme.spacing['2xl']};
  max-width: 1200px;
  margin: 0 auto;

  ${breakpoints.tablet} {
    grid-template-columns: 1fr 1.2fr;
    gap: ${({ theme }) => theme.spacing['3xl']};
  }
`;

const ContactInfo = styled.div`
  display: flex;
  flex-direction: column;
  gap: ${({ theme }) => theme.spacing.xl};
`;

const InfoTitle = styled.h3`
  font-size: 24px;
  font-weight: 600;
  color: ${({ theme }) => theme.colors.neutral.white};
  margin-bottom: ${({ theme }) => theme.spacing.md};
`;

const ContactItem = styled.div`
  display: flex;
  gap: ${({ theme }) => theme.spacing.md};
  align-items: flex-start;
`;

const ContactIcon = styled.div`
  font-size: 24px;
  color: ${({ theme }) => theme.colors.primary.main};
  background: rgba(0, 240, 255, 0.1);
  width: 48px;
  height: 48px;
  border-radius: 12px;
  display: flex;
  align-items: center;
  justify-content: center;
  border: 1px solid rgba(0, 240, 255, 0.2);
  flex-shrink: 0;
`;

const ContactDetails = styled.div`
  display: flex;
  flex-direction: column;
  gap: 4px;
`;

const ContactLabel = styled.span`
  font-size: 12px;
  text-transform: uppercase;
  letter-spacing: 1px;
  color: ${({ theme }) => theme.colors.neutral.mediumGray};
`;

const ContactValue = styled.span`
  font-size: 16px;
  color: ${({ theme }) => theme.colors.neutral.lightGray};

  a {
    color: ${({ theme }) => theme.colors.neutral.lightGray};
    text-decoration: none;
    transition: ${({ theme }) => theme.transitions.default};

    &:hover {
      color: ${({ theme }) => theme.colors.primary.main};
    }
  }
`;

const ContactForm = styled.div`
  background: ${({ theme }) => theme.gradients.card};
  border: 1px solid ${({ theme }) => theme.colors.neutral.border};
  border-radius: 16px;
  padding: ${({ theme }) => theme.spacing.xl};
  box-shadow: 0 10px 30px rgba(0, 0, 0, 0.2);

  ${breakpoints.tablet} {
    padding: ${({ theme }) => theme.spacing['2xl']};
  }
`;

const FormTitle = styled.h3`
  font-size: 24px;
  font-weight: 600;
  color: ${({ theme }) => theme.colors.neutral.white};
  margin-bottom: ${({ theme }) => theme.spacing.lg};
`;

const Form = styled.form`
  display: flex;
  flex-direction: column;
  gap: ${({ theme }) => theme.spacing.md};
`;

const FormGroup = styled.div`
  display: flex;
  flex-direction: column;
  gap: ${({ theme }) => theme.spacing.xs};
`;

const Label = styled.label`
  font-size: 14px;
  font-weight: 500;
  color: ${({ theme }) => theme.colors.neutral.lightGray};
`;

const Input = styled.input`
  background: ${({ theme }) => theme.colors.background.tertiary};
  border: 1px solid ${({ theme }) => theme.colors.neutral.border};
  border-radius: 8px;
  padding: 12px 16px;
  color: ${({ theme }) => theme.colors.neutral.white};
  font-size: 15px;
  transition: ${({ theme }) => theme.transitions.default};

  &:focus {
    outline: none;
    border-color: ${({ theme }) => theme.colors.primary.main};
    box-shadow: 0 0 10px ${({ theme }) => theme.colors.primary.glow};
  }
`;

const TextArea = styled.textarea`
  background: ${({ theme }) => theme.colors.background.tertiary};
  border: 1px solid ${({ theme }) => theme.colors.neutral.border};
  border-radius: 8px;
  padding: 12px 16px;
  color: ${({ theme }) => theme.colors.neutral.white};
  font-size: 15px;
  min-height: 120px;
  resize: vertical;
  transition: ${({ theme }) => theme.transitions.default};

  &:focus {
    outline: none;
    border-color: ${({ theme }) => theme.colors.primary.main};
    box-shadow: 0 0 10px ${({ theme }) => theme.colors.primary.glow};
  }
`;

const ErrorMessage = styled.span`
  color: ${({ theme }) => theme.colors.semantic.error};
  font-size: 12px;
  margin-top: 2px;
`;

const SuccessMessage = styled.div`
  color: #3FBF7F;
  background: rgba(63, 191, 127, 0.1);
  border: 1px solid rgba(63, 191, 127, 0.2);
  padding: 16px;
  border-radius: 8px;
  margin-top: ${({ theme }) => theme.spacing.md};
  font-weight: 500;
  text-align: center;
`;

export const ContactSection: React.FC = () => {
  const {
    register,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm<ContactFormData>();
  const [isSubmitted, setIsSubmitted] = useState(false);

  const onSubmit = async (data: ContactFormData) => {
    try {
      await sendContactEmail(data);
      setIsSubmitted(true);
      reset();
      setTimeout(() => setIsSubmitted(false), 5000);
    } catch (error) {
      console.error(error);
    }
  };

  return (
    <SectionContainer id="contact">
      <SectionPrefix>§06 / CONTACT</SectionPrefix>
      <SectionTitle>Contact</SectionTitle>
      <SectionSubtitle>
        Run a pilot. No PoC fees.
      </SectionSubtitle>
      <div style={{ textAlign: 'center', marginBottom: '40px', color: '#c9d1d9', fontSize: '18px', maxWidth: '800px', margin: '0 auto 40px auto' }}>
        We're onboarding Startups and SMEs for free pilots. You get the agent, the dashboard, and a real audit-trail in under a week.
      </div>

      <ContactGrid>
        <motion.div
          initial={{ opacity: 0, x: -50 }}
          whileInView={{ opacity: 1, x: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6 }}
        >
          <ContactInfo>
            <InfoTitle>Contact Information</InfoTitle>

            <ContactItem>
              <ContactIcon>📱</ContactIcon>
              <ContactDetails>
                <ContactLabel>Mobile</ContactLabel>
                <ContactValue>
                  <a href={`tel:${CONTACT_MOBILE.replace(/\s+/g, '')}`}>{CONTACT_MOBILE}</a>
                </ContactValue>
              </ContactDetails>
            </ContactItem>

            <ContactItem>
              <ContactIcon>📧</ContactIcon>
              <ContactDetails>
                <ContactLabel>Email</ContactLabel>
                <ContactValue>
                  <a href={`mailto:${CONTACT_EMAIL}`}>{CONTACT_EMAIL}</a>
                </ContactValue>
              </ContactDetails>
            </ContactItem>

            <ContactItem>
              <ContactIcon>👤</ContactIcon>
              <ContactDetails>
                <ContactLabel>Founder</ContactLabel>
                <ContactValue>Avinash Yaduvanshi</ContactValue>
              </ContactDetails>
            </ContactItem>

            <div style={{ marginTop: '24px', textAlign: 'center' }}>
              <Button
                variant="primary"
                onClick={() =>
                  (window.location.href = `mailto:${CONTACT_EMAIL}?subject=${encodeURIComponent(
                    'Pilot request — RAPHA'
                  )}`)
                }
              >
                Start a Pilot
              </Button>
            </div>
          </ContactInfo>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, x: 50 }}
          whileInView={{ opacity: 1, x: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6, delay: 0.2 }}
        >
          <ContactForm>
            <FormTitle>Send us a Message</FormTitle>
            <Form onSubmit={handleSubmit(onSubmit)}>
              <FormGroup>
                <Label htmlFor="name">Name *</Label>
                <Input
                  id="name"
                  type="text"
                  placeholder="Your full name"
                  {...register('name', { required: 'Name is required' })}
                />
                {errors.name && <ErrorMessage>{errors.name.message}</ErrorMessage>}
              </FormGroup>

              <FormGroup>
                <Label htmlFor="email">Work Email *</Label>
                <Input
                  id="email"
                  type="email"
                  placeholder="your@company.com"
                  {...register('email', {
                    required: 'Email is required',
                    pattern: {
                      value: /^[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}$/i,
                      message: 'Invalid email address',
                    },
                  })}
                />
                {errors.email && <ErrorMessage>{errors.email.message}</ErrorMessage>}
              </FormGroup>

              <FormGroup>
                <Label htmlFor="company">Company</Label>
                <Input
                  id="company"
                  type="text"
                  placeholder="Your organization"
                  {...register('company')}
                />
              </FormGroup>

              <FormGroup>
                <Label htmlFor="message">Message *</Label>
                <TextArea
                  id="message"
                  placeholder="Tell us what you're protecting — fleet size, stack, compliance needs."
                  {...register('message', { required: 'Message is required' })}
                />
                {errors.message && <ErrorMessage>{errors.message.message}</ErrorMessage>}
              </FormGroup>

              <Button type="submit" variant="primary">
                Request a pilot
              </Button>

              {isSubmitted && (
                <SuccessMessage>
                  Thank you for your message! We'll get back to you soon.
                </SuccessMessage>
              )}
            </Form>
          </ContactForm>
        </motion.div>
      </ContactGrid>
    </SectionContainer>
  );
};
