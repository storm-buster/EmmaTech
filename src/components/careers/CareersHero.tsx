import styled from 'styled-components';
import { motion } from 'framer-motion';
import { breakpoints } from '../../styles/breakpoints';
import { roles } from '../../data/careersData';

const HeroContainer = styled.section`
  min-height: 70vh;
  display: flex;
  align-items: center;
  position: relative;
  overflow: hidden;
  padding: 150px ${({ theme }) => theme.spacing.lg} 80px;
  background: ${({ theme }) => theme.colors.background.primary};

  ${breakpoints.tablet} {
    padding: 170px ${({ theme }) => theme.spacing['2xl']} 100px;
  }
`;

const Content = styled(motion.div)`
  max-width: 900px;
  margin: 0 auto;
  text-align: center;
  position: relative;
  z-index: 2;
`;

const BadgeTicker = styled.div`
  display: inline-flex;
  align-items: center;
  gap: 8px;
  padding: 6px 16px;
  background: rgba(63, 191, 127, 0.1);
  border: 1px solid rgba(63, 191, 127, 0.2);
  border-radius: 20px;
  color: #3FBF7F;
  font-size: 12px;
  font-weight: 600;
  text-transform: uppercase;
  letter-spacing: 0.1em;
  margin-bottom: ${({ theme }) => theme.spacing.lg};
`;

const Headline = styled.h1`
  font-size: 42px;
  line-height: 1.1;
  font-weight: 700;
  color: ${({ theme }) => theme.colors.neutral.white};
  margin-bottom: ${({ theme }) => theme.spacing.lg};
  letter-spacing: -1px;

  ${breakpoints.tablet} {
    font-size: 64px;
  }

  ${breakpoints.desktop} {
    font-size: 72px;
  }
`;

const SubHook = styled.p`
  font-size: 18px;
  line-height: 1.6;
  color: ${({ theme }) => theme.colors.neutral.mediumGray};
  margin-bottom: ${({ theme }) => theme.spacing['2xl']};
  max-width: 650px;
  margin-left: auto;
  margin-right: auto;

  ${breakpoints.tablet} {
    font-size: 20px;
  }
`;

const CTAButtons = styled.div`
  display: flex;
  flex-direction: column;
  gap: ${({ theme }) => theme.spacing.md};
  align-items: center;

  ${breakpoints.tablet} {
    flex-direction: row;
    justify-content: center;
  }
`;

const PrimaryCTA = styled.a`
  display: inline-block;
  padding: 16px 48px;
  font-size: 16px;
  font-weight: 600;
  font-family: ${({ theme }) => theme.typography.fontFamily.primary};
  text-transform: uppercase;
  letter-spacing: 1px;
  background: ${({ theme }) => theme.gradients.primary};
  color: ${({ theme }) => theme.colors.neutral.white};
  border: 2px solid ${({ theme }) => theme.colors.primary.main};
  text-decoration: none;
  cursor: pointer;
  transition: all 0.3s ease;

  &:hover {
    transform: translateY(-2px);
    border-color: ${({ theme }) => theme.colors.primary.light};
  }
`;

const SecondaryCTA = styled.a`
  display: inline-block;
  padding: 16px 48px;
  font-size: 16px;
  font-weight: 600;
  font-family: ${({ theme }) => theme.typography.fontFamily.primary};
  text-transform: uppercase;
  letter-spacing: 1px;
  background: transparent;
  color: ${({ theme }) => theme.colors.primary.main};
  border: 2px solid ${({ theme }) => theme.colors.primary.main};
  text-decoration: none;
  cursor: pointer;
  transition: all 0.3s ease;

  &:hover {
    color: ${({ theme }) => theme.colors.background.primary};
    box-shadow: inset 0 0 0 50px ${({ theme }) => theme.colors.primary.main};
    transform: translateY(-2px);
  }
`;

const RoleCount = styled.span`
  font-family: ${({ theme }) => theme.typography.fontFamily.monospace};
  font-size: 14px;
  color: ${({ theme }) => theme.colors.neutral.mediumGray};
  margin-top: ${({ theme }) => theme.spacing.xl};
  display: block;
`;

export const CareersHero: React.FC = () => {
  // Scroll to an in-page section without mutating the URL hash — changing it
  // would drop us off the `#/careers` route handled in App.
  const scrollTo = (id: string) => (e: React.MouseEvent) => {
    e.preventDefault();
    document.getElementById(id)?.scrollIntoView({ behavior: 'smooth' });
  };

  return (
    <HeroContainer>
      <Content
        initial={{ opacity: 0, y: 30 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 1, delay: 0.2, ease: [0.2, 0.8, 0.2, 1] }}
      >
        <BadgeTicker>founding team · pre-seed · india-built</BadgeTicker>
        <Headline>Build the future of autonomous cyber-defense</Headline>
        <SubHook>
          Join the founding team at EmmaTech and help build RAPHA — an autonomous
          threat-detection platform that decides and acts in real time.
        </SubHook>
        <CTAButtons>
          <PrimaryCTA href="#open-roles" onClick={scrollTo('open-roles')}>
            View Open Roles
          </PrimaryCTA>
          <SecondaryCTA href="#general-application" onClick={scrollTo('general-application')}>
            Don't See Your Role?
          </SecondaryCTA>
        </CTAButtons>
        <RoleCount>{roles.length} open positions across {5} teams</RoleCount>
      </Content>
    </HeroContainer>
  );
};
