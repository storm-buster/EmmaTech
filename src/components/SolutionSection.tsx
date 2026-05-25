import styled from 'styled-components';
import { motion } from 'framer-motion';
import { breakpoints } from '../styles/breakpoints';

const SectionContainer = styled.section`
  padding: ${({ theme }) => theme.spacing['4xl']} ${({ theme }) =>
    theme.spacing.lg};
  background: ${({ theme }) => theme.colors.background.primary};
  position: relative;
  overflow: hidden;
  z-index: 2;

  ${breakpoints.tablet} {
    padding-left: ${({ theme }) => theme.spacing['2xl']};
    padding-right: ${({ theme }) => theme.spacing['2xl']};
  }
`;

const HeaderGrid = styled.div`
  display: grid;
  grid-template-columns: 1fr;
  gap: ${({ theme }) => theme.spacing.lg};
  margin-bottom: ${({ theme }) => theme.spacing['4xl']};
  max-width: 1200px;
  margin-left: auto;
  margin-right: auto;

  ${breakpoints.desktop} {
    grid-template-columns: 1.2fr 0.8fr;
    align-items: flex-end;
  }
`;

const TitleContainer = styled.div`
  display: flex;
  flex-direction: column;
  text-align: left;
`;

const SectionPrefix = styled.span`
  font-family: ${({ theme }) => theme.typography.fontFamily.monospace};
  font-size: 11px;
  font-weight: 700;
  color: #3FBF7F;
  text-transform: uppercase;
  letter-spacing: 0.15em;
  margin-bottom: ${({ theme }) => theme.spacing.sm};
`;

const TitleHighlight = styled.h2`
  font-size: 38px;
  font-weight: 800;
  color: ${({ theme }) => theme.colors.neutral.white};
  line-height: 1.1;

  ${breakpoints.tablet} {
    font-size: 54px;
  }
`;

const TitleSub = styled.span`
  font-size: 34px;
  font-weight: 700;
  color: rgba(255, 255, 255, 0.4);
  line-height: 1.1;
  display: block;

  ${breakpoints.tablet} {
    font-size: 48px;
  }
`;

const SectionDescription = styled.p`
  font-size: 15px;
  line-height: 1.7;
  color: ${({ theme }) => theme.colors.neutral.mediumGray};
  text-align: left;
  max-width: 500px;

  ${breakpoints.tablet} {
    font-size: 16px;
  }
`;

const GridContainer = styled.div`
  display: grid;
  grid-template-columns: 1fr;
  border-top: 1px solid rgba(255, 255, 255, 0.1);
  border-bottom: 1px solid rgba(255, 255, 255, 0.1);
  max-width: 1200px;
  margin: 0 auto;

  ${breakpoints.desktop} {
    grid-template-columns: repeat(5, 1fr);
  }
`;

const ColumnItem = styled(motion.div)`
  padding: ${({ theme }) => theme.spacing.xl} 0;
  display: flex;
  flex-direction: column;
  text-align: left;
  border-bottom: 1px solid rgba(255, 255, 255, 0.1);

  &:last-child {
    border-bottom: none;
  }

  ${breakpoints.desktop} {
    padding: ${({ theme }) => theme.spacing['2xl']} ${({ theme }) => theme.spacing.lg};
    border-bottom: none;
    border-right: 1px solid rgba(255, 255, 255, 0.1);

    &:first-child {
      padding-left: 0;
    }

    &:last-child {
      border-right: none;
      padding-right: 0;
    }
  }
`;

const ColumnHeader = styled.div`
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 28px;
`;

const ColumnLabel = styled.span`
  font-family: ${({ theme }) => theme.typography.fontFamily.monospace};
  font-size: 11px;
  font-weight: 600;
  color: rgba(255, 255, 255, 0.3);
  letter-spacing: 0.1em;
`;

const ColumnIcon = styled.div`
  color: rgba(255, 255, 255, 0.4);
  display: flex;
  align-items: center;
  justify-content: center;
`;

const ColumnTitle = styled.h3`
  font-size: 24px;
  font-weight: 700;
  color: ${({ theme }) => theme.colors.neutral.white};
  margin-bottom: 4px;
  letter-spacing: -0.5px;
`;

const ColumnSubtitle = styled.div`
  font-family: ${({ theme }) => theme.typography.fontFamily.monospace};
  font-size: 10px;
  font-weight: 700;
  color: rgba(255, 255, 255, 0.4);
  text-transform: uppercase;
  letter-spacing: 0.1em;
  margin-bottom: 20px;
`;

const ColumnDescription = styled.p`
  font-size: 14px;
  line-height: 1.6;
  color: ${({ theme }) => theme.colors.neutral.lightGray};
`;

const LoopTicker = styled.div`
  display: flex;
  justify-content: center;
  align-items: center;
  flex-wrap: wrap;
  gap: 12px;
  margin-top: ${({ theme }) => theme.spacing['4xl']};
  padding: ${({ theme }) => theme.spacing.md} ${({ theme }) => theme.spacing.lg};
  background: rgba(255, 255, 255, 0.02);
  border: 1px solid rgba(255, 255, 255, 0.05);
  border-radius: 30px;
  max-width: 1100px;
  margin-left: auto;
  margin-right: auto;
  box-shadow: 0 0 15px rgba(0, 240, 255, 0.03);
  backdrop-filter: blur(10px);
`;

const LoopStep = styled.span<{ $highlighted?: boolean }>`
  font-family: ${({ theme }) => theme.typography.fontFamily.monospace};
  font-size: 11px;
  font-weight: 600;
  color: ${({ $highlighted, theme }) => ($highlighted ? '#3FBF7F' : theme.colors.neutral.mediumGray)};
  text-shadow: ${({ $highlighted }) => ($highlighted ? '0 0 8px rgba(63, 191, 127, 0.4)' : 'none')};
  text-transform: uppercase;
  letter-spacing: 0.05em;

  ${breakpoints.tablet} {
    font-size: 13px;
  }
`;

const LoopArrow = styled.span`
  color: rgba(255, 255, 255, 0.2);
  font-weight: bold;
`;

const SensorIcon = () => (
  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
    <path d="M12 18h.01M17 13a7 7 0 0 0-10 0M21 8a13 13 0 0 0-18 0" />
  </svg>
);

const ChipIcon = () => (
  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
    <rect x="4" y="4" width="16" height="16" rx="2" />
    <path d="M9 9h6v6H9zM9 1v3M15 1v3M9 20v3M15 20v3M20 9h3M20 15h3M1 9h3M1 15h3" />
  </svg>
);

const LightningIcon = () => (
  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
    <path d="M13 2L3 14h9l-1 8 10-12h-9l1-8z" />
  </svg>
);

const DocumentIcon = () => (
  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
    <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
    <path d="M14 2v6h6M16 13H8M16 17H8M10 9H8" />
  </svg>
);

const GridIcon = () => (
  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
    <rect x="3" y="3" width="7" height="7" />
    <rect x="14" y="3" width="7" height="7" />
    <rect x="14" y="14" width="7" height="7" />
    <rect x="3" y="14" width="7" height="7" />
  </svg>
);

const innovations = [
  {
    num: 'LAYER 01',
    title: 'Sensors',
    subtitle: 'COLLECTION',
    description:
      'Lightweight agents stream 50+ system features every second from each protected node — CPU, memory, network, process tree, disk.',
    icon: <SensorIcon />,
  },
  {
    num: 'LAYER 02',
    title: 'Orchestrator',
    subtitle: 'DECISION',
    description:
      'Per-device Isolation Forest scores each window. Risk policy is applied locally — no cloud round-trip.',
    icon: <ChipIcon />,
  },
  {
    num: 'LAYER 03',
    title: 'Response',
    subtitle: 'ACTION',
    description:
      'iptables rules redirect the attacker into Cowrie. Decoys deploy. Target system isolated — all in milliseconds.',
    icon: <LightningIcon />,
  },
  {
    num: 'LAYER 04',
    title: 'Intelligence',
    subtitle: 'FORENSICS',
    description:
      'Full attacker session recorded. SHA-256 hash chain. Behavior profile stored. Tamper-proof audit trail.',
    icon: <DocumentIcon />,
  },
  {
    num: 'LAYER 05',
    title: 'Control Plane',
    subtitle: 'GOVERNANCE',
    description:
      'Centralised policy editor, model distribution, fleet-wide alerts and compliance reporting.',
    icon: <GridIcon />,
  },
];

export const SolutionSection: React.FC = () => {
  return (
    <SectionContainer id="solution">
      <HeaderGrid>
        <TitleContainer>
          <SectionPrefix>§01 / ARCHITECTURE</SectionPrefix>
          <TitleHighlight>Five layers.</TitleHighlight>
          <TitleSub>One autonomous loop.</TitleSub>
        </TitleContainer>
        <SectionDescription>
          Detection and response happen on the node, in milliseconds.
          Governance, policy and model updates flow from the central control plane.
          Sensors are platform-specific; the brain is platform-independent.
        </SectionDescription>
      </HeaderGrid>

      <GridContainer>
        {innovations.map((item, index) => (
          <ColumnItem
            key={index}
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, margin: '-100px' }}
            transition={{ duration: 0.6, delay: index * 0.1 }}
          >
            <ColumnHeader>
              <ColumnLabel>{item.num}</ColumnLabel>
              <ColumnIcon>{item.icon}</ColumnIcon>
            </ColumnHeader>
            <ColumnTitle>{item.title}</ColumnTitle>
            <ColumnSubtitle>{item.subtitle}</ColumnSubtitle>
            <ColumnDescription>{item.description}</ColumnDescription>
          </ColumnItem>
        ))}
      </GridContainer>

      <LoopTicker>
        <LoopStep>Sensor</LoopStep>
        <LoopArrow>→</LoopArrow>
        <LoopStep>Orchestrator</LoopStep>
        <LoopArrow>→</LoopArrow>
        <LoopStep>Risk Score</LoopStep>
        <LoopArrow>→</LoopArrow>
        <LoopStep $highlighted={true}>Honeypot Redirect</LoopStep>
        <LoopArrow>→</LoopArrow>
        <LoopStep>Forensic Hash Chain</LoopStep>
        <LoopArrow>→</LoopArrow>
        <LoopStep>Control Plane</LoopStep>
      </LoopTicker>
    </SectionContainer>
  );
};
