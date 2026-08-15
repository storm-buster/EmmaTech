import styled from 'styled-components';
import { motion } from 'framer-motion';
import { Button } from './Button';
import { breakpoints } from '../styles/breakpoints';
import { PUBLIC_PLANS, PERPETUAL_NOTICE } from '../shared/plans';

const SectionContainer = styled.section`
  padding: ${({ theme }) => theme.spacing['4xl']} ${({ theme }) => theme.spacing.lg};
  background-color: ${({ theme }) => theme.colors.background.secondary};
  color: ${({ theme }) => theme.colors.neutral.white};

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
  margin-bottom: ${({ theme }) => theme.spacing.xs};
  display: block;
  text-align: center;
`;

const SectionTitle = styled.h2`
  font-size: ${({ theme }) => theme.typography.fontSize.h2Mobile};
  line-height: ${({ theme }) => theme.typography.lineHeight.h2Mobile};
  font-weight: ${({ theme }) => theme.typography.fontWeight.bold};
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
    font-size: ${({ theme }) => theme.typography.fontSize.h2Desktop};
    line-height: ${({ theme }) => theme.typography.lineHeight.h2Desktop};
  }
`;

const SectionSubtitle = styled.div`
  text-align: center;
  margin-bottom: ${({ theme }) => theme.spacing['3xl']};
  max-width: 800px;
  margin-left: auto;
  margin-right: auto;
`;

const HighlightSub = styled.h3`
  font-size: 20px;
  color: ${({ theme }) => theme.colors.primary.main};
  margin-bottom: ${({ theme }) => theme.spacing.sm};
  font-weight: 600;
`;

const SubText = styled.p`
  font-size: ${({ theme }) => theme.typography.fontSize.bodyLarge};
  line-height: ${({ theme }) => theme.typography.lineHeight.bodyLarge};
  color: ${({ theme }) => theme.colors.neutral.mediumGray};
`;

const PricingGrid = styled.div`
  display: grid;
  grid-template-columns: 1fr;
  gap: ${({ theme }) => theme.spacing.xl};
  max-width: 1200px;
  margin: 0 auto;

  ${breakpoints.tablet} {
    grid-template-columns: repeat(3, 1fr);
  }
`;

const PricingCard = styled(motion.div)<{ $popular?: boolean }>`
  background: ${({ theme }) => theme.gradients.card};
  border: 1px solid ${({ $popular, theme }) => ($popular ? theme.colors.primary.main : theme.colors.neutral.border)};
  box-shadow: ${({ $popular, theme }) => ($popular ? `0 0 30px ${theme.colors.primary.glow}` : 'none')};
  border-radius: 16px;
  padding: ${({ theme }) => theme.spacing['2xl']};
  display: flex;
  flex-direction: column;
  justify-content: space-between;
  position: relative;
  transition: all 0.3s ease;

  &:hover {
    transform: translateY(-8px);
    border-color: ${({ theme }) => theme.colors.primary.main};
    box-shadow: 0 12px 30px rgba(0, 240, 255, 0.15);
  }
`;

const PopularBadge = styled.div`
  position: absolute;
  top: -12px;
  left: 50%;
  transform: translateX(-50%);
  background: ${({ theme }) => theme.gradients.primary};
  color: white;
  padding: 4px 12px;
  border-radius: 12px;
  font-size: 11px;
  font-weight: 700;
  text-transform: uppercase;
  letter-spacing: 0.1em;
  box-shadow: 0 0 10px ${({ theme }) => theme.colors.primary.glow};
`;

const CardTitle = styled.h3`
  font-size: 22px;
  font-weight: 600;
  color: ${({ theme }) => theme.colors.neutral.white};
  margin-bottom: 4px;
`;

const CardSubtitle = styled.div`
  font-size: 13px;
  color: ${({ theme }) => theme.colors.neutral.mediumGray};
  margin-bottom: 20px;
`;

const PriceWrapper = styled.div`
  margin-bottom: 24px;
`;

const Price = styled.span`
  font-size: 36px;
  font-weight: 700;
  color: ${({ theme }) => theme.colors.primary.main};
  text-shadow: 0 0 10px ${({ theme }) => theme.colors.primary.glow};
`;

const Period = styled.span`
  font-size: 14px;
  color: ${({ theme }) => theme.colors.neutral.mediumGray};
`;

const FeatureList = styled.ul`
  list-style: none;
  padding: 0;
  margin: 0 0 30px 0;
  flex: 1;
`;

const FeatureItem = styled.li`
  font-size: 14px;
  color: ${({ theme }) => theme.colors.neutral.lightGray};
  margin-bottom: 12px;
  display: flex;
  align-items: flex-start;
  gap: 8px;
  text-align: left;

  &::before {
    content: '✓';
    color: #3FBF7F;
    font-weight: bold;
  }
`;

const MarginMetricsGrid = styled.div`
  display: grid;
  grid-template-columns: repeat(2, 1fr);
  gap: 16px;
  max-width: 800px;
  margin: 50px auto 0;
  border-top: 1px solid ${({ theme }) => theme.colors.neutral.border};
  padding-top: 40px;

  ${breakpoints.tablet} {
    grid-template-columns: repeat(4, 1fr);
  }
`;

const MetricItem = styled.div`
  text-align: center;
`;

const MetricValue = styled.div`
  font-size: 28px;
  font-weight: 700;
  color: ${({ theme }) => theme.colors.primary.main};
  text-shadow: 0 0 8px ${({ theme }) => theme.colors.primary.glow};
  margin-bottom: 4px;
`;

const MetricLabel = styled.div`
  font-size: 11px;
  color: ${({ theme }) => theme.colors.neutral.mediumGray};
  text-transform: uppercase;
  letter-spacing: 0.05em;
`;

const metrics = [
  { value: '50%', label: 'Starter margin' },
  { value: '68%', label: 'Growth margin' },
  { value: '98%+', label: 'Regulated margin' },
  { value: '5', label: 'Nodes to breakeven' },
];

const PerpetualNotice = styled.div`
  max-width: 800px;
  margin: 48px auto 0;
  padding: ${({ theme }) => theme.spacing.xl};
  text-align: center;
  border: 1px dashed ${({ theme }) => theme.colors.neutral.border};
  border-radius: 16px;
  background: ${({ theme }) => theme.gradients.card};
`;

const NoticeHeading = styled.h3`
  font-size: 18px;
  font-weight: 600;
  color: ${({ theme }) => theme.colors.neutral.white};
  margin-bottom: ${({ theme }) => theme.spacing.sm};
`;

const NoticeBody = styled.p`
  font-size: 14px;
  line-height: 1.6;
  color: ${({ theme }) => theme.colors.neutral.mediumGray};
  margin-bottom: ${({ theme }) => theme.spacing.lg};
`;

interface CustomerSectionProps {
  onCtaClick?: () => void;
}

export const CustomerSection: React.FC<CustomerSectionProps> = ({ onCtaClick }) => {
  return (
    <SectionContainer id="pricing">
      <SectionPrefix>§04 / PRICING</SectionPrefix>
      <SectionTitle>Pricing</SectionTitle>
      <SectionSubtitle>
        <HighlightSub>Built for Indian budgets. Priced per node — not per seat.</HighlightSub>
        <SubText>
          A node is one policy-enforced Orchestrator that can manage multiple sensors. Revenue scales with protected infrastructure, not with users.
        </SubText>
      </SectionSubtitle>

      <PricingGrid>
        {PUBLIC_PLANS.map((plan, index) => (
          <PricingCard
            key={plan.id}
            $popular={plan.popular}
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, margin: '-100px' }}
            transition={{ duration: 0.5, delay: index * 0.1 }}
          >
            {plan.popular && <PopularBadge>Most popular</PopularBadge>}
            <div>
              <CardTitle>{plan.displayName}</CardTitle>
              <CardSubtitle>{plan.subtitle}</CardSubtitle>
              <PriceWrapper>
                <Price>{plan.price}</Price>
                <Period>{plan.period}</Period>
              </PriceWrapper>
              <FeatureList>
                {plan.features.map((feature, idx) => (
                  <FeatureItem key={idx}>{feature}</FeatureItem>
                ))}
              </FeatureList>
            </div>
            <Button
              variant={plan.popular ? 'primary' : 'secondary'}
              onClick={onCtaClick}
              style={{ width: '100%' }}
            >
              {plan.ctaText}
            </Button>
          </PricingCard>
        ))}
      </PricingGrid>

      <PerpetualNotice>
        <NoticeHeading>{PERPETUAL_NOTICE.heading}</NoticeHeading>
        <NoticeBody>{PERPETUAL_NOTICE.body}</NoticeBody>
        <Button variant="secondary" onClick={onCtaClick}>
          {PERPETUAL_NOTICE.ctaText}
        </Button>
      </PerpetualNotice>

      <MarginMetricsGrid>
        {metrics.map((metric, index) => (
          <MetricItem key={index}>
            <MetricValue>{metric.value}</MetricValue>
            <MetricLabel>{metric.label}</MetricLabel>
          </MetricItem>
        ))}
      </MarginMetricsGrid>
    </SectionContainer>
  );
};
