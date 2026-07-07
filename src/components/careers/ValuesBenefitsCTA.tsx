import styled from 'styled-components';
import { motion } from 'framer-motion';
import { breakpoints } from '../../styles/breakpoints';
import { values, benefits } from '../../data/careersData';

/* ── Values Section ── */
const ValuesSectionContainer = styled.section`
  padding: ${({ theme }) => theme.spacing['4xl']} ${({ theme }) => theme.spacing.lg};
  background: ${({ theme }) => theme.colors.background.secondary};
  border-top: 1px solid ${({ theme }) => theme.colors.neutral.border};

  ${breakpoints.tablet} {
    padding: ${({ theme }) => theme.spacing['4xl']} ${({ theme }) => theme.spacing['2xl']};
  }
`;

const SectionPrefix = styled.span`
  font-family: ${({ theme }) => theme.typography.fontFamily.monospace};
  font-size: 11px;
  font-weight: 700;
  color: #3FBF7F;
  text-transform: uppercase;
  letter-spacing: 0.15em;
  margin-bottom: ${({ theme }) => theme.spacing.sm};
  display: block;
  text-align: center;
`;

const SectionTitle = styled.h2`
  font-size: 36px;
  line-height: 1.2;
  font-weight: 700;
  color: ${({ theme }) => theme.colors.neutral.white};
  text-align: center;
  margin-bottom: ${({ theme }) => theme.spacing['3xl']};

  &::after {
    content: '';
    display: block;
    width: 80px;
    height: 4px;
    background: ${({ theme }) => theme.gradients.primary};
    margin: ${({ theme }) => theme.spacing.lg} auto 0;
    border-radius: 2px;
  }

  ${breakpoints.tablet} {
    font-size: 48px;
  }
`;

const ValuesGrid = styled.div`
  display: grid;
  grid-template-columns: 1fr;
  gap: ${({ theme }) => theme.spacing.md};
  max-width: 900px;
  margin: 0 auto;

  ${breakpoints.tablet} {
    grid-template-columns: repeat(2, 1fr);
  }

  ${breakpoints.desktop} {
    grid-template-columns: repeat(3, 1fr);
  }
`;

const ValueItem = styled(motion.div)`
  padding: ${({ theme }) => theme.spacing.xl};
  background: ${({ theme }) => theme.gradients.card};
  border: 1px solid ${({ theme }) => theme.colors.neutral.border};
  transition: ${({ theme }) => theme.transitions.default};

  &:hover {
    border-color: rgba(226, 232, 240, 0.12);
    transform: translateY(-2px);
  }
`;

const ValueTitle = styled.h3`
  font-size: 18px;
  font-weight: 700;
  color: ${({ theme }) => theme.colors.neutral.white};
  margin-bottom: ${({ theme }) => theme.spacing.xs};
  text-transform: none;
  letter-spacing: 0;
`;

const ValueDesc = styled.p`
  font-size: 14px;
  color: ${({ theme }) => theme.colors.neutral.mediumGray};
  line-height: 1.6;
`;

/* ── Benefits Section ── */
const BenefitsSectionContainer = styled.section`
  padding: ${({ theme }) => theme.spacing['4xl']} ${({ theme }) => theme.spacing.lg};
  background: ${({ theme }) => theme.colors.background.primary};

  ${breakpoints.tablet} {
    padding: ${({ theme }) => theme.spacing['4xl']} ${({ theme }) => theme.spacing['2xl']};
  }
`;

const BenefitsGrid = styled.div`
  display: grid;
  grid-template-columns: 1fr;
  gap: ${({ theme }) => theme.spacing.lg};
  max-width: 1000px;
  margin: 0 auto;

  ${breakpoints.tablet} {
    grid-template-columns: repeat(2, 1fr);
  }

  ${breakpoints.desktop} {
    grid-template-columns: repeat(3, 1fr);
  }
`;

const BenefitCard = styled(motion.div)`
  padding: ${({ theme }) => theme.spacing.xl};
  background: ${({ theme }) => theme.gradients.card};
  border: 1px solid ${({ theme }) => theme.colors.neutral.border};
  text-align: center;
  transition: ${({ theme }) => theme.transitions.default};

  &:hover {
    border-color: rgba(226, 232, 240, 0.12);
    transform: translateY(-2px);
  }
`;

const BenefitIcon = styled.div`
  font-size: 32px;
  margin-bottom: ${({ theme }) => theme.spacing.md};
`;

const BenefitTitle = styled.h3`
  font-size: 16px;
  font-weight: 700;
  color: ${({ theme }) => theme.colors.neutral.white};
  margin-bottom: ${({ theme }) => theme.spacing.xs};
  text-transform: none;
  letter-spacing: 0;
`;

const BenefitDesc = styled.p`
  font-size: 14px;
  color: ${({ theme }) => theme.colors.neutral.mediumGray};
  line-height: 1.5;
`;

/* ── General Application CTA ── */
const CTASectionContainer = styled.section`
  padding: ${({ theme }) => theme.spacing['4xl']} ${({ theme }) => theme.spacing.lg};
  background: ${({ theme }) => theme.colors.background.secondary};
  border-top: 1px solid ${({ theme }) => theme.colors.neutral.border};
  text-align: center;

  ${breakpoints.tablet} {
    padding: ${({ theme }) => theme.spacing['4xl']} ${({ theme }) => theme.spacing['2xl']};
  }
`;

const CTAHeadline = styled.h2`
  font-size: 32px;
  font-weight: 700;
  color: ${({ theme }) => theme.colors.neutral.white};
  margin-bottom: ${({ theme }) => theme.spacing.md};

  ${breakpoints.tablet} {
    font-size: 42px;
  }
`;

const CTASubtext = styled.p`
  font-size: 18px;
  color: ${({ theme }) => theme.colors.neutral.mediumGray};
  margin-bottom: ${({ theme }) => theme.spacing.xl};
  max-width: 600px;
  margin-left: auto;
  margin-right: auto;
`;

const CTAButton = styled.a`
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
  }
`;

const EqualOpp = styled.p`
  font-size: 13px;
  color: ${({ theme }) => theme.colors.neutral.mediumGray};
  margin-top: ${({ theme }) => theme.spacing['2xl']};
  max-width: 700px;
  margin-left: auto;
  margin-right: auto;
  line-height: 1.6;
  opacity: 0.7;
`;

/* ── Exports ── */

export const OurValues: React.FC = () => (
  <ValuesSectionContainer>
    <SectionPrefix>§04 / OUR VALUES</SectionPrefix>
    <SectionTitle>Our Values</SectionTitle>
    <ValuesGrid>
      {values.map((v, i) => (
        <ValueItem
          key={i}
          initial={{ opacity: 0, y: 15 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.4, delay: i * 0.08 }}
        >
          <ValueTitle>{v.title}</ValueTitle>
          <ValueDesc>{v.description}</ValueDesc>
        </ValueItem>
      ))}
    </ValuesGrid>
  </ValuesSectionContainer>
);

export const Benefits: React.FC = () => (
  <BenefitsSectionContainer>
    <SectionPrefix>§05 / WHAT WE OFFER</SectionPrefix>
    <SectionTitle>What We Offer</SectionTitle>
    <BenefitsGrid>
      {benefits.map((b, i) => (
        <BenefitCard
          key={i}
          initial={{ opacity: 0, y: 15 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.4, delay: i * 0.08 }}
        >
          <BenefitIcon>{b.icon}</BenefitIcon>
          <BenefitTitle>{b.title}</BenefitTitle>
          <BenefitDesc>{b.description}</BenefitDesc>
        </BenefitCard>
      ))}
    </BenefitsGrid>
  </BenefitsSectionContainer>
);

export const GeneralApplicationCTA: React.FC = () => (
  <CTASectionContainer id="general-application">
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true }}
      transition={{ duration: 0.6 }}
    >
      <SectionPrefix>§06 / JOIN US</SectionPrefix>
      <CTAHeadline>We're always looking for exceptional people. Pitch us.</CTAHeadline>
      <CTASubtext>
        Don't see the perfect role? If you're passionate about autonomous cyber-defense
        and want to build something that matters, we want to hear from you.
      </CTASubtext>
      <CTAButton href="mailto:avinash@emmatech.in?subject=General Application — EmmaTech">
        Send a General Application
      </CTAButton>
      <EqualOpp>
        EmmaTech is an equal opportunity employer. We celebrate diversity and are committed
        to creating an inclusive environment for all team members regardless of race, gender,
        sexual orientation, religion, disability, or age.
      </EqualOpp>
    </motion.div>
  </CTASectionContainer>
);
