import { useState, useEffect } from 'react';
import styled from 'styled-components';
import { breakpoints } from '../styles/breakpoints';

const Nav = styled.nav<{ $isScrolled: boolean }>`
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  background: ${({ $isScrolled }) =>
    $isScrolled
      ? 'rgba(10, 14, 39, 0.95)'
      : 'rgba(10, 14, 39, 0.8)'};
  backdrop-filter: blur(10px);
  border-bottom: 1px solid ${({ theme }) => theme.colors.neutral.border};
  z-index: 1000;
  padding: ${({ theme }) => theme.spacing.md} ${({ theme }) => theme.spacing.lg};
  transition: all 0.3s ease;
  box-shadow: ${({ $isScrolled }) =>
    $isScrolled ? '0 4px 20px rgba(0, 0, 0, 0.3)' : 'none'};

  ${breakpoints.tablet} {
    padding: ${({ theme }) => theme.spacing.md} ${({ theme }) => theme.spacing['2xl']};
  }
`;

const NavContainer = styled.div`
  display: flex;
  justify-content: space-between;
  align-items: center;
  max-width: 1400px;
  margin: 0 auto;
`;

import { LogoIcon } from './LogoIcon';

// ... existing imports ...

const Logo = styled.div`
  font-family: ${({ theme }) => theme.typography.fontFamily.display};
  font-size: 24px;
  font-weight: 700;
  color: ${({ theme }) => theme.colors.primary.main};
  text-shadow: 0 0 10px ${({ theme }) => theme.colors.primary.glow};
  cursor: pointer;
  transition: ${({ theme }) => theme.transitions.default};
  display: flex;
  align-items: center;
  gap: 12px;

  &:hover {
    transform: scale(1.05);
  }
`;

// ... existing code ...



const NavLinks = styled.div`
  display: none;
  gap: ${({ theme }) => theme.spacing.xl};

  ${breakpoints.tablet} {
    display: flex;
  }
`;

const NavLink = styled.a`
  color: ${({ theme }) => theme.colors.neutral.lightGray};
  text-decoration: none;
  font-weight: 500;
  font-size: 15px;
  transition: ${({ theme }) => theme.transitions.default};
  position: relative;
  cursor: pointer;

  &:hover {
    color: ${({ theme }) => theme.colors.primary.main};
    text-shadow: 0 0 8px ${({ theme }) => theme.colors.primary.glow};
  }

  &::after {
    content: '';
    position: absolute;
    bottom: -4px;
    left: 0;
    width: 0;
    height: 2px;
    background: ${({ theme }) => theme.gradients.primary};
    transition: width 0.3s ease;
  }

  &:hover::after {
    width: 100%;
  }
`;

const ContactButton = styled.button`
  display: none;
  background: ${({ theme }) => theme.gradients.primary};
  color: white;
  border: none;
  padding: 10px 24px;
  border-radius: 6px;
  font-weight: 600;
  font-size: 14px;
  cursor: pointer;
  transition: ${({ theme }) => theme.transitions.default};
  box-shadow: 0 0 10px ${({ theme }) => theme.colors.primary.glow};

  ${breakpoints.tablet} {
    display: block;
  }

  &:hover {
    transform: translateY(-2px);
    box-shadow: 0 0 20px ${({ theme }) => theme.colors.primary.glow};
  }

  &:active {
    transform: translateY(0);
  }
`;

const MobileMenuButton = styled.button`
  display: flex;
  flex-direction: column;
  gap: 4px;
  background: none;
  border: none;
  cursor: pointer;
  padding: 8px;

  ${breakpoints.tablet} {
    display: none;
  }

  span {
    width: 24px;
    height: 2px;
    background: ${({ theme }) => theme.colors.primary.main};
    transition: all 0.3s ease;
  }
`;

const MobileMenu = styled.div<{ $isOpen: boolean }>`
  position: fixed;
  top: 70px;
  left: 0;
  right: 0;
  background: rgba(10, 14, 39, 0.98);
  backdrop-filter: blur(10px);
  border-bottom: 1px solid ${({ theme }) => theme.colors.neutral.border};
  padding: ${({ theme }) => theme.spacing.lg};
  display: ${({ $isOpen }) => ($isOpen ? 'flex' : 'none')};
  flex-direction: column;
  gap: ${({ theme }) => theme.spacing.md};
  z-index: 999;

  ${breakpoints.tablet} {
    display: none;
  }
`;

const MobileNavLink = styled.a`
  color: ${({ theme }) => theme.colors.neutral.lightGray};
  text-decoration: none;
  font-weight: 500;
  font-size: 16px;
  padding: ${({ theme }) => theme.spacing.sm};
  transition: ${({ theme }) => theme.transitions.default};
  cursor: pointer;

  &:hover {
    color: ${({ theme }) => theme.colors.primary.main};
    padding-left: ${({ theme }) => theme.spacing.md};
  }
`;

const MobileContactButton = styled.button`
  display: block;
  width: 100%;
  background: ${({ theme }) => theme.gradients.primary};
  color: white;
  border: none;
  padding: 12px 24px;
  border-radius: 6px;
  font-weight: 600;
  font-size: 14px;
  cursor: pointer;
  text-align: center;
  margin-top: ${({ theme }) => theme.spacing.sm};
  box-shadow: 0 0 10px ${({ theme }) => theme.colors.primary.glow};
  transition: ${({ theme }) => theme.transitions.default};

  &:hover {
    box-shadow: 0 0 20px ${({ theme }) => theme.colors.primary.glow};
  }
`;

interface NavigationProps {
  onContactClick: () => void;
}

export const Navigation: React.FC<NavigationProps> = ({ onContactClick }) => {
  const [isScrolled, setIsScrolled] = useState(false);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  useEffect(() => {
    const handleScroll = () => {
      setIsScrolled(window.scrollY > 50);
    };

    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  const scrollToSection = (sectionId: string) => {
    const element = document.getElementById(sectionId);
    if (element) {
      const offset = 80; // Account for fixed nav height
      const elementPosition = element.getBoundingClientRect().top;
      const offsetPosition = elementPosition + window.pageYOffset - offset;

      window.scrollTo({
        top: offsetPosition,
        behavior: 'smooth',
      });
    }
    setIsMobileMenuOpen(false);
  };

  const handleLogoClick = () => {
    window.scrollTo({ top: 0, behavior: 'smooth' });
    setIsMobileMenuOpen(false);
  };

  return (
    <>
      <Nav $isScrolled={isScrolled}>
        <NavContainer>
          <Logo onClick={handleLogoClick}>
            <LogoIcon />
            EmmaTech™
          </Logo>
          <NavLinks>
            <NavLink onClick={() => scrollToSection('home')}>Home</NavLink>
            <NavLink onClick={() => scrollToSection('about')}>About</NavLink>
            <NavLink onClick={() => scrollToSection('solution')}>RAPHA</NavLink>
            <NavLink onClick={() => scrollToSection('team')}>Team</NavLink>
            <NavLink onClick={() => scrollToSection('contact')}>Contact</NavLink>
          </NavLinks>
          <ContactButton onClick={onContactClick}>Get In Touch</ContactButton>
          <MobileMenuButton onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}>
            <span />
            <span />
            <span />
          </MobileMenuButton>
        </NavContainer>
      </Nav>
      <MobileMenu $isOpen={isMobileMenuOpen}>
        <MobileNavLink onClick={() => scrollToSection('home')}>Home</MobileNavLink>
        <MobileNavLink onClick={() => scrollToSection('about')}>About</MobileNavLink>
        <MobileNavLink onClick={() => scrollToSection('solution')}>RAPHA</MobileNavLink>
        <MobileNavLink onClick={() => scrollToSection('team')}>Team</MobileNavLink>
        <MobileNavLink onClick={() => scrollToSection('contact')}>Contact</MobileNavLink>
        <MobileContactButton
          onClick={() => {
            setIsMobileMenuOpen(false);
            onContactClick();
          }}
        >
          Get In Touch
        </MobileContactButton>
      </MobileMenu>
    </>
  );
};
