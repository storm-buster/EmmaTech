import { useState } from 'react';
import styled from 'styled-components';
import { motion } from 'framer-motion';
import { useForm } from 'react-hook-form';
import { Card } from './Card';
import { Button } from './Button';
import { breakpoints } from '../styles/breakpoints';

const SectionContainer = styled.section`
  padding: ${({ theme }) => theme.spacing['4xl']} ${({ theme }) => theme.spacing.lg};
  background: ${({ theme }) => theme.colors.background.primary};
  position: relative;

  ${breakpoints.tablet} {
    padding: ${({ theme }) => theme.spacing['4xl']} ${({ theme }) => theme.spacing['2xl']};
  }
`;

const SectionTitle = styled.h2`
  font-size: 36px;
  line-height: 1.2;
  font-weight: 700;
  color: ${({ theme }) => theme.colors.neutral.white};
  text-align: center;
  margin-bottom: ${({ theme }) => theme.spacing.md};
  font-family: ${({ theme }) => theme.typography.fontFamily.display};

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
  gap: ${({ theme }) => theme.spacing.xl};
  max-width: 1200px;
  margin: 0 auto;

  ${breakpoints.tablet} {
    grid-template-columns: 1fr 1fr;
  }
`;

const ContactInfo = styled(Card)`
  padding: ${({ theme }) => theme.spacing['2xl']};
  background: ${({ theme }) => theme.gradients.card};
  border: 1px solid ${({ theme }) => theme.colors.neutral.border};
`;

const ContactForm = styled(Card)`
  padding: ${({ theme }) => theme.spacing['2xl']};
  background: ${({ theme }) => theme.gradients.card};
  border: 1px solid ${({ theme }) => theme.colors.neutral.border};
`;

const InfoTitle = styled.h3`
  font-size: 24px;
  font-weight: 600;
  color: ${({ theme }) => theme.colors.primary.main};
  margin-bottom: ${({ theme }) => theme.spacing.lg};
  text-shadow: 0 0 10px ${({ theme }) => theme.colors.primary.glow};
`;

const ContactItem = styled.div`
  display: flex;
  align-items: flex-start;
  gap: ${({ theme }) => theme.spacing.md};
  margin-bottom: ${({ theme }) => theme.spacing.lg};
  padding: ${({ theme }) => theme.spacing.md};
  background: ${({ theme }) => theme.colors.background.tertiary};
  border-radius: 8px;
  border: 1px solid ${({ theme }) => theme.colors.neutral.border};
  transition: ${({ theme }) => theme.transitions.default};

  &:hover {
    border-color: ${({ theme }) => theme.colors.primary.main};
    box-shadow: 0 4px 16px rgba(0, 240, 255, 0.1);
  }
`;

const ContactIcon = styled.div`
  width: 48px;
  height: 48px;
  border-radius: 50%;
  background: ${({ theme }) => theme.gradients.primary};
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 20px;
  color: white;
  flex-shrink: 0;
  box-shadow: 0 0 10px ${({ theme }) => theme.colors.primary.glow};
`;

const ContactDetails = styled.div`
  flex: 1;
`;

const ContactLabel = styled.div`
  font-size: 14px;
  color: ${({ theme }) => theme.colors.neutral.mediumGray};
  text-transform: uppercase;
  letter-spacing: 1px;
  margin-bottom: 4px;
`;

const ContactValue = styled.div`
  font-size: 16px;
  color: ${({ theme }) => theme.colors.neutral.white};
  font-weight: 500;

  a {
    color: ${({ theme }) => theme.colors.neutral.white};
    text-decoration: none;
    transition: ${({ theme }) => theme.transitions.default};

    &:hover {
      color: ${({ theme }) => theme.colors.primary.main};
    }
  }
`;

const Form = styled.form`
  display: flex;
  flex-direction: column;
  gap: ${({ theme }) => theme.spacing.md};
`;

const FormTitle = styled.h3`
  font-size: 24px;
  font-weight: 600;
  color: ${({ theme }) => theme.colors.primary.main};
  margin-bottom: ${({ theme }) => theme.spacing.lg};
  text-shadow: 0 0 10px ${({ theme }) => theme.colors.primary.glow};
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
  text-transform: uppercase;
  letter-spacing: 1px;
`;

const Input = styled.input`
  padding: 12px 16px;
  font-size: 16px;
  background: ${({ theme }) => theme.colors.background.tertiary};
  border: 1px solid ${({ theme }) => theme.colors.neutral.border};
  border-radius: 8px;
  color: ${({ theme }) => theme.colors.neutral.white};
  transition: ${({ theme }) => theme.transitions.default};

  &:focus {
    outline: none;
    border-color: ${({ theme }) => theme.colors.primary.main};
    box-shadow: 0 0 10px ${({ theme }) => theme.colors.primary.glow};
  }

  &::placeholder {
    color: ${({ theme }) => theme.colors.neutral.mediumGray};
  }
`;

const TextArea = styled.textarea`
  padding: 12px 16px;
  font-size: 16px;
  background: ${({ theme }) => theme.colors.background.tertiary};
  border: 1px solid ${({ theme }) => theme.colors.neutral.border};
  border-radius: 8px;
  color: ${({ theme }) => theme.colors.neutral.white};
  transition: ${({ theme }) => theme.transitions.default};
  min-height: 120px;
  resize: vertical;
  font-family: inherit;

  &:focus {
    outline: none;
    border-color: ${({ theme }) => theme.colors.primary.main};
    box-shadow: 0 0 10px ${({ theme }) => theme.colors.primary.glow};
  }

  &::placeholder {
    color: ${({ theme }) => theme.colors.neutral.mediumGray};
  }
`;

const ErrorMessage = styled.span`
  font-size: 12px;
  color: ${({ theme }) => theme.colors.semantic.error};
  margin-top: 4px;
`;

const SuccessMessage = styled.div`
  padding: ${({ theme }) => theme.spacing.md};
  background: rgba(0, 245, 160, 0.1);
  border: 1px solid ${({ theme }) => theme.colors.semantic.success};
  border-radius: 8px;
  color: ${({ theme }) => theme.colors.semantic.success};
  text-align: center;
  margin-top: ${({ theme }) => theme.spacing.md};
`;

interface ContactFormData {
  name: string;
  email: string;
  company?: string;
  message: string;
}

interface ContactSectionProps {
  onWaitlistClick: () => void;
}

export const ContactSection: React.FC<ContactSectionProps> = ({ onWaitlistClick }) => {
  const [isSubmitted, setIsSubmitted] = useState(false);
  const {
    register,
    handleSubmit,
    formState: { errors },
    reset,
  } = useForm<ContactFormData>();

  const onSubmit = (data: ContactFormData) => {
    console.log('Contact form submitted:', data);
    setIsSubmitted(true);
    reset();
    setTimeout(() => setIsSubmitted(false), 5000);
  };

  return (
    <SectionContainer id="contact">
      <SectionTitle>Get In Touch</SectionTitle>
      <SectionSubtitle>
        Ready to revolutionize your cybersecurity? Contact us to learn more
        about RAPHA or discuss partnership opportunities.
      </SectionSubtitle>

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
              <ContactIcon>📧</ContactIcon>
              <ContactDetails>
                <ContactLabel>Email</ContactLabel>
                <ContactValue>
                  <a href="mailto:hello@emmatech.com">hello@emmatech.com</a>
                </ContactValue>
              </ContactDetails>
            </ContactItem>

            <ContactItem>
              <ContactIcon>📞</ContactIcon>
              <ContactDetails>
                <ContactLabel>Phone</ContactLabel>
                <ContactValue>
                  <a href="tel:+15551234567">+1 (555) 123-4567</a>
                </ContactValue>
              </ContactDetails>
            </ContactItem>

            <ContactItem>
              <ContactIcon>📍</ContactIcon>
              <ContactDetails>
                <ContactLabel>Address</ContactLabel>
                <ContactValue>
                  123 Innovation Drive<br />
                  Silicon Valley, CA 94025
                </ContactValue>
              </ContactDetails>
            </ContactItem>

            <ContactItem>
              <ContactIcon>💼</ContactIcon>
              <ContactDetails>
                <ContactLabel>Investors</ContactLabel>
                <ContactValue>
                  <a href="mailto:investors@emmatech.com">investors@emmatech.com</a>
                </ContactValue>
              </ContactDetails>
            </ContactItem>

            <div style={{ marginTop: '24px', textAlign: 'center' }}>
              <Button variant="primary" onClick={onWaitlistClick}>
                Join Waitlist
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
                <Label htmlFor="email">Email *</Label>
                <Input
                  id="email"
                  type="email"
                  placeholder="your@email.com"
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
                  placeholder="Tell us about your cybersecurity needs..."
                  {...register('message', { required: 'Message is required' })}
                />
                {errors.message && <ErrorMessage>{errors.message.message}</ErrorMessage>}
              </FormGroup>

              <Button type="submit" variant="primary">
                Send Message
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
