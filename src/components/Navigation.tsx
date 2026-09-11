import { useState, useEffect } from 'react';
import styled from 'styled-components';
import { breakpoints } from '../styles/breakpoints';
import { LogoIcon } from './LogoIcon';
import { useAuth } from '../auth/AuthContext';
import { trackEvent } from '../analytics/events';

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
  gap: ${({ theme }) => theme.spacing.md};
  max-width: 1400px;
  margin: 0 auto;

  /* Desktop: three in-flow tracks — logo | centered links | right cluster.
     Using a grid (not absolute positioning) guarantees the nav links and the
     right-hand CTAs have independent, non-overlapping hit areas. */
  ${breakpoints.desktop} {
    display: grid;
    grid-template-columns: auto 1fr auto;
  }
`;

const Logo = styled.div`
  cursor: pointer;
  transition: ${({ theme }) => theme.transitions.default};
  display: flex;
  align-items: center;
  gap: 10px;

  &:hover {
    transform: scale(1.03);
  }
`;

// Company wordmark — the primary brand identity in the header.
const BrandName = styled.span`
  font-family: ${({ theme }) => theme.typography.fontFamily.display};
  font-size: 22px;
  font-weight: 700;
  color: ${({ theme }) => theme.colors.neutral.white};
  letter-spacing: -0.2px;
`;

// Subordinate product tag — communicates "RAPHA is a product by EmmaTech".
const ProductTag = styled.span`
  font-family: ${({ theme }) => theme.typography.fontFamily.monospace};
  font-size: 10px;
  font-weight: 700;
  color: ${({ theme }) => theme.colors.primary.main};
  text-transform: uppercase;
  letter-spacing: 0.12em;
  border: 1px solid ${({ theme }) => theme.colors.neutral.border};
  border-radius: 6px;
  padding: 2px 6px;
`;

const NavLinks = styled.div`
  display: none;

  ${breakpoints.desktop} {
    display: flex;
    justify-content: center;
    gap: ${({ theme }) => theme.spacing.xl};
    min-width: 0;
  }
`;

/** Right-hand cluster: auth/console CTAs (desktop) + mobile menu button.
    Kept in normal flow so it never overlaps the centered nav links. */
const RightCluster = styled.div`
  display: flex;
  align-items: center;
  gap: ${({ theme }) => theme.spacing.sm};

  ${breakpoints.desktop} {
    justify-self: end;
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
  white-space: nowrap;
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

  ${breakpoints.desktop} {
    display: none;
  }
`;

const PrimaryCta = styled.a`
  display: none;
  color: ${({ theme }) => theme.colors.primary.main};
  background: rgba(0, 240, 255, 0.06);
  border: 1px solid ${({ theme }) => theme.colors.primary.main};
  border-radius: 8px;
  padding: 9px 18px;
  font-size: 13px;
  font-weight: 600;
  letter-spacing: 0.04em;
  cursor: pointer;
  text-decoration: none;
  white-space: nowrap;
  transition: ${({ theme }) => theme.transitions.default};

  &:hover {
    background: rgba(0, 240, 255, 0.14);
    color: ${({ theme }) => theme.colors.neutral.white};
  }

  ${breakpoints.desktop} {
    display: inline-block;
  }
`;

const MobilePrimaryCta = styled.a`
  color: ${({ theme }) => theme.colors.primary.main};
  background: rgba(0, 240, 255, 0.06);
  border: 1px solid ${({ theme }) => theme.colors.primary.main};
  border-radius: 8px;
  padding: ${({ theme }) => theme.spacing.sm} ${({ theme }) => theme.spacing.md};
  font-weight: 600;
  font-size: 15px;
  letter-spacing: 0.04em;
  text-align: center;
  text-decoration: none;
  cursor: pointer;
`;

const AuthCta = styled.a`
  display: none;
  color: ${({ theme }) => theme.colors.primary.main};
  border: 1px solid ${({ theme }) => theme.colors.neutral.border};
  border-radius: 8px;
  padding: 8px 16px;
  font-size: 14px;
  font-weight: 600;
  cursor: pointer;
  text-decoration: none;
  white-space: nowrap;
  transition: ${({ theme }) => theme.transitions.default};

  &:hover {
    border-color: ${({ theme }) => theme.colors.primary.main};
    text-shadow: 0 0 8px ${({ theme }) => theme.colors.primary.glow};
  }

  ${breakpoints.desktop} {
    display: inline-block;
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

  ${breakpoints.desktop} {
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
  { label: 'RAPHA', route: 'product' },
  { label: 'Compliance', route: 'compliance' },
  { label: 'Docs', route: 'docs' },
  { label: 'Careers', route: 'careers' },
  { label: 'Contact', route: 'contact' },
];

export const Navigation: React.FC<NavigationProps> = ({
  currentRoute,
  onNavigate,
}) => {
  const [isScrolled, setIsScrolled] = useState(false);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const { account } = useAuth();
  const authRoute: Route = account ? 'account' : 'login';
  const authLabel = account ? 'Account' : 'Sign in';

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
          <Logo onClick={handleLogoClick} aria-label="EmmaTech — home">
            <LogoIcon />
            <BrandName>EmmaTech</BrandName>
            <ProductTag>RAPHA</ProductTag>
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
          <RightCluster>
            <PrimaryCta
              onClick={() => {
                trackEvent('request_access_click', { source: 'nav' });
                go('request-access');
              }}
              aria-label="Request private access to RAPHA"
            >
              Request Private Access
            </PrimaryCta>
            <AuthCta
              onClick={() => {
                if (!account) trackEvent('sign_in_click', { source: 'nav' });
                go(authRoute);
              }}
            >
              {authLabel}
            </AuthCta>
            {account && (
              <AuthCta onClick={() => go('console')} aria-label="Open RAPHA console">
                Console
              </AuthCta>
            )}
            <MobileMenuButton
              onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
              aria-label="Toggle navigation menu"
              aria-expanded={isMobileMenuOpen}
              aria-controls="mobile-menu"
            >
              <span />
              <span />
              <span />
            </MobileMenuButton>
          </RightCluster>
        </NavContainer>
      </Nav>
      <MobileMenu id="mobile-menu" $isOpen={isMobileMenuOpen}>
        {NAV_ITEMS.map((item) => (
          <MobileNavLink key={item.route} onClick={() => go(item.route)}>
            {item.label}
          </MobileNavLink>
        ))}
        <MobilePrimaryCta
          onClick={() => {
            trackEvent('request_access_click', { source: 'nav_mobile' });
            go('request-access');
          }}
          aria-label="Request private access to RAPHA"
        >
          Request Private Access
        </MobilePrimaryCta>
        <MobileNavLink
          onClick={() => {
            if (!account) trackEvent('sign_in_click', { source: 'nav_mobile' });
            go(authRoute);
          }}
        >
          {authLabel}
        </MobileNavLink>
        {account && <MobileNavLink onClick={() => go('console')}>Console</MobileNavLink>}
      </MobileMenu>
    </>
  );
};
