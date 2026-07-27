import { useState, useEffect } from 'react';
import styled from 'styled-components';
import { breakpoints } from '../styles/breakpoints';
import { LogoIcon } from './LogoIcon';

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
  position: relative;
`;

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

const NavLinks = styled.div`
  display: none;
  gap: ${({ theme }) => theme.spacing.xl};

  ${breakpoints.tablet} {
    display: flex;
    /* Center the links in the bar independent of the logo's width, so they
       stay visually centered now that the right-hand CTA button is gone. */
    position: absolute;
    left: 50%;
    transform: translateX(-50%);
  }
`;

const NavLink = styled.a<{ $active?: boolean }>`
  color: ${({ $active, theme }) =>
    $active ? theme.colors.primary.main : theme.colors.neutral.lightGray};
  text-decoration: none;
  font-weight: 500;
  font-size: 15px;
  transition: ${({ theme }) => theme.transitions.default};
  position: relative;
  cursor: pointer;
  text-shadow: ${({ $active, theme }) =>
    $active ? `0 0 8px ${theme.colors.primary.glow}` : 'none'};

  &:hover {
    color: ${({ theme }) => theme.colors.primary.main};
    text-shadow: 0 0 8px ${({ theme }) => theme.colors.primary.glow};
  }

  &::after {
    content: '';
    position: absolute;
    bottom: -4px;
    left: 0;
    width: ${({ $active }) => ($active ? '100%' : '0')};
    height: 2px;
    background: ${({ theme }) => theme.gradients.primary};
    transition: width 0.3s ease;
  }

  &:hover::after {
    width: 100%;
  }
`;

const MobileMenuButton = styled.button`
  display: block;
  background: none;
  border: none;
  cursor: pointer;
  padding: 4px;
  z-index: 1000;

  span {
    display: block;
    width: 24px;
    height: 2px;
    background: ${({ theme }) => theme.colors.neutral.white};
    margin: 5px 0;
    transition: all 0.3s ease;
  }

  ${breakpoints.tablet} {
    display: none;
  }
`;

const MobileMenu = styled.div<{ $isOpen: boolean }>`
  position: fixed;
  top: 73px;
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

import type { Route } from '../App';
interface NavigationProps {
  currentRoute: Route;
  onNavigate: (to: Route) => void;
}

const NAV_ITEMS: { label: string; route: Route }[] = [
  { label: 'Home', route: 'home' },
  { label: 'Product', route: 'product' },
  { label: 'Compliance', route: 'compliance' },
  { label: 'Pricing', route: 'pricing' },
  { label: 'Careers', route: 'careers' },
  { label: 'Contact', route: 'contact' },
];

export const Navigation: React.FC<NavigationProps> = ({
  currentRoute,
  onNavigate,
}) => {
  const [isScrolled, setIsScrolled] = useState(false);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  useEffect(() => {
    const handleScroll = () => {
      setIsScrolled(window.scrollY > 50);
    };

    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  const go = (to: Route) => {
    onNavigate(to);
    setIsMobileMenuOpen(false);
  };

  const handleLogoClick = () => {
    go('home');
  };

  return (
    <>
      <Nav $isScrolled={isScrolled}>
        <NavContainer>
          <Logo onClick={handleLogoClick}>
            <LogoIcon />
            RAPHA
          </Logo>
          <NavLinks>
            {NAV_ITEMS.map((item) => (
              <NavLink
                key={item.route}
                $active={currentRoute === item.route}
                onClick={() => go(item.route)}
              >
                {item.label}
              </NavLink>
            ))}
          </NavLinks>
          <MobileMenuButton onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}>
            <span />
            <span />
            <span />
          </MobileMenuButton>
        </NavContainer>
      </Nav>
      <MobileMenu $isOpen={isMobileMenuOpen}>
        {NAV_ITEMS.map((item) => (
          <MobileNavLink key={item.route} onClick={() => go(item.route)}>
            {item.label}
          </MobileNavLink>
        ))}
      </MobileMenu>
    </>
  );
};
