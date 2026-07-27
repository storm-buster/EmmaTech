import styled from 'styled-components';
import { breakpoints } from '../styles/breakpoints';
import type { Route } from '../App';
import inceptionBadge from '../assets/nvidia-inception-badge.png';

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

const InceptionBadge = styled.img`
  max-width: 160px;
  width: 100%;
  height: auto;
  margin: 0 auto;

  ${breakpoints.tablet} {
    margin: 0;
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

interface FooterProps {
  onNavigate?: (to: Route) => void;
}

const PRODUCT_LINKS: { label: string; route: Route }[] = [
  { label: 'Product', route: 'product' },
  { label: 'Pricing', route: 'pricing' },
  { label: 'Compliance', route: 'compliance' },
  { label: 'Careers', route: 'careers' },
];

const LEGAL_LINKS: { label: string; route: Route }[] = [
  { label: 'Privacy Policy', route: 'privacy' },
  { label: 'Terms of Service', route: 'terms' },
];

export const Footer: React.FC<FooterProps> = ({ onNavigate }) => {
  const handleNav = (route: Route) => (e: React.MouseEvent) => {
    if (onNavigate) {
      e.preventDefault();
      onNavigate(route);
    }
  };

  return (
    <FooterContainer>
      <FooterContent>
        <FooterSection>
          <FooterTitle>Product</FooterTitle>
          <FooterLinks>
            {PRODUCT_LINKS.map((link) => (
              <FooterLink
                key={link.route}
                href={`#/${link.route}`}
                onClick={handleNav(link.route)}
              >
                {link.label}
              </FooterLink>
            ))}
          </FooterLinks>
        </FooterSection>

        <FooterSection>
          <FooterTitle>Contact</FooterTitle>
          <ContactInfo>
            <a href="mailto:avinash@emmatech.in">avinash@emmatech.in</a>
            <br />
            <a href="https://emmatech.in" target="_blank" rel="noopener noreferrer">emmatech.in</a>
          </ContactInfo>
        </FooterSection>

        <FooterSection>
          <FooterTitle>Inception Program</FooterTitle>
          <InceptionBadge
            src={inceptionBadge}
            alt="NVIDIA Inception Program Badge"
          />
        </FooterSection>

        <FooterSection>
          <FooterTitle>Legal</FooterTitle>
          <FooterLinks>
            {LEGAL_LINKS.map((link) => (
              <FooterLink
                key={link.route}
                href={`#/${link.route}`}
                onClick={handleNav(link.route)}
              >
                {link.label}
              </FooterLink>
            ))}
          </FooterLinks>
        </FooterSection>
      </FooterContent>

      <Tagline>DETECT. DECEIVE. DEFEND.</Tagline>
      <Copyright>© 2026 EmmaTech. RAPHA by emmatech. All rights reserved.</Copyright>
    </FooterContainer>
  );
};
