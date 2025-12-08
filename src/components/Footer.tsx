import styled from 'styled-components';
import { breakpoints } from '../styles/breakpoints';

const FooterContainer = styled.footer`
  background: ${({ theme }) => theme.colors.background.secondary};
  border-top: 1px solid ${({ theme }) => theme.colors.neutral.border};
  color: ${({ theme }) => theme.colors.neutral.lightGray};
  padding: ${({ theme }) => theme.spacing['2xl']} ${({ theme }) =>
    theme.spacing.lg};
  position: relative;

  &::before {
    content: '';
    position: absolute;
    top: 0;
    left: 0;
    right: 0;
    height: 1px;
    background: ${({ theme }) => theme.gradients.primary};
    opacity: 0.5;
  }

  ${breakpoints.tablet} {
    padding: ${({ theme }) => theme.spacing['2xl']} ${({ theme }) =>
    theme.spacing['2xl']};
  }
`;

const FooterContent = styled.div`
  max-width: 1200px;
  margin: 0 auto;
  display: grid;
  grid-template-columns: 1fr;
  gap: ${({ theme }) => theme.spacing.xl};
  text-align: center;

  ${breakpoints.tablet} {
    grid-template-columns: repeat(3, 1fr);
    text-align: left;
  }
`;

const FooterSection = styled.div`
  display: flex;
  flex-direction: column;
  gap: ${({ theme }) => theme.spacing.md};
`;

const FooterTitle = styled.h4`
  font-size: 16px;
  font-weight: 600;
  color: ${({ theme }) => theme.colors.primary.main};
  text-transform: uppercase;
  letter-spacing: 1px;
  margin-bottom: ${({ theme }) => theme.spacing.xs};
`;

const FooterLinks = styled.div`
  display: flex;
  flex-direction: column;
  gap: ${({ theme }) => theme.spacing.sm};
`;

const FooterLink = styled.a`
  font-size: 14px;
  color: ${({ theme }) => theme.colors.neutral.mediumGray};
  text-decoration: none;
  transition: ${({ theme }) => theme.transitions.default};

  &:hover {
    color: ${({ theme }) => theme.colors.primary.main};
  }
`;

const SocialLinks = styled.div`
  display: flex;
  gap: ${({ theme }) => theme.spacing.md};
  justify-content: center;

  ${breakpoints.tablet} {
    justify-content: flex-start;
  }
`;

const SocialLink = styled.a`
  width: 40px;
  height: 40px;
  border-radius: 50%;
  background: ${({ theme }) => theme.colors.background.tertiary};
  border: 1px solid ${({ theme }) => theme.colors.neutral.border};
  display: flex;
  align-items: center;
  justify-content: center;
  color: ${({ theme }) => theme.colors.neutral.lightGray};
  text-decoration: none;
  transition: ${({ theme }) => theme.transitions.default};
  font-size: 20px;

  &:hover {
    background: ${({ theme }) => theme.colors.primary.main};
    color: white;
    transform: translateY(-2px);
    box-shadow: 0 0 10px ${({ theme }) => theme.colors.primary.glow};
  }
`;

const ContactInfo = styled.div`
  font-size: 14px;
  color: ${({ theme }) => theme.colors.neutral.mediumGray};
  line-height: 1.6;

  a {
    color: ${({ theme }) => theme.colors.neutral.mediumGray};
    text-decoration: none;
    transition: ${({ theme }) => theme.transitions.default};

    &:hover {
      color: ${({ theme }) => theme.colors.primary.main};
    }
  }
`;

const Tagline = styled.p`
  font-family: ${({ theme }) => theme.typography.fontFamily.monospace};
  font-size: 20px;
  font-weight: 600;
  letter-spacing: 4px;
  margin-top: ${({ theme }) => theme.spacing.xl};
  padding-top: ${({ theme }) => theme.spacing.xl};
  border-top: 1px solid ${({ theme }) => theme.colors.neutral.border};
  color: ${({ theme }) => theme.colors.primary.main};
  text-shadow: 0 0 10px ${({ theme }) => theme.colors.primary.glow};
  text-align: center;
`;

const Copyright = styled.p`
  font-size: 14px;
  color: ${({ theme }) => theme.colors.neutral.mediumGray};
  text-align: center;
  margin-top: ${({ theme }) => theme.spacing.md};
`;

export const Footer: React.FC = () => {
  return (
    <FooterContainer>
      <FooterContent>
        <FooterSection>
          <FooterTitle>Company</FooterTitle>
          <FooterLinks>
            <FooterLink href="#about">About Us</FooterLink>
            <FooterLink href="#team">Team</FooterLink>
            <FooterLink href="#contact">Contact</FooterLink>
            <FooterLink href="#privacy">Privacy Policy</FooterLink>
            <FooterLink href="#terms">Terms of Service</FooterLink>
          </FooterLinks>
        </FooterSection>

        <FooterSection>
          <FooterTitle>Contact</FooterTitle>
          <ContactInfo>
            <a href="mailto:adamas.avinash@gmail.com">adamas.avinash@gmail.com</a>
            <br />
            <a href="tel:+918860263015">+91 88602 63015</a>
            <br />
            <br />
            Global Operations
            <br />
            Digital First
          </ContactInfo>
        </FooterSection>

        <FooterSection>
          <FooterTitle>Follow Us</FooterTitle>
          <SocialLinks>
            <SocialLink href="#" target="_blank" rel="noopener noreferrer" aria-label="LinkedIn">
              💼
            </SocialLink>
            <SocialLink href="#" target="_blank" rel="noopener noreferrer" aria-label="Twitter">
              🐦
            </SocialLink>
            <SocialLink href="#" target="_blank" rel="noopener noreferrer" aria-label="GitHub">
              💻
            </SocialLink>
          </SocialLinks>
        </FooterSection>
      </FooterContent>

      <Tagline>DETECT. DECEIVE. DEFEND.</Tagline>
      <Copyright>© 2025 EmmaTech. All rights reserved.</Copyright>
    </FooterContainer>
  );
};
