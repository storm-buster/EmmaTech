import styled from 'styled-components';
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
  margin-bottom: ${({ theme }) => theme.spacing['3xl']};
  max-width: 1200px;
  margin-left: auto;
  margin-right: auto;
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
  display: block;
`;

const TitleHighlight = styled.h2`
  font-size: 32px;
  font-weight: 800;
  color: ${({ theme }) => theme.colors.neutral.white};
  line-height: 1.15;
  letter-spacing: -1px;

  em {
    font-style: italic;
    font-weight: 500;
    color: rgba(255, 255, 255, 0.4);
  }

  span.highlight {
    color: #3FBF7F;
  }

  ${breakpoints.tablet} {
    font-size: 52px;
  }
`;

const TableWrapper = styled.div`
  max-width: 1200px;
  margin: 0 auto;
  overflow-x: auto;
  border: 1px solid rgba(255, 255, 255, 0.05);
  background: rgba(255, 255, 255, 0.01);
  border-radius: 8px;
  backdrop-filter: blur(10px);

  &::-webkit-scrollbar {
    height: 6px;
  }
  &::-webkit-scrollbar-track {
    background: rgba(0, 0, 0, 0.1);
  }
  &::-webkit-scrollbar-thumb {
    background: rgba(255, 255, 255, 0.1);
    border-radius: 3px;
  }
`;

const Table = styled.table`
  width: 100%;
  border-collapse: collapse;
  text-align: left;
  min-width: 800px;
`;

const TableHeader = styled.th`
  font-family: ${({ theme }) => theme.typography.fontFamily.monospace};
  font-size: 11px;
  font-weight: 700;
  color: rgba(255, 255, 255, 0.4);
  text-transform: uppercase;
  letter-spacing: 0.1em;
  padding: 20px 24px;
  border-bottom: 1px solid rgba(255, 255, 255, 0.1);

  &.rapha-header {
    color: #3FBF7F;
  }
`;

const TableRow = styled.tr`
  border-bottom: 1px solid rgba(255, 255, 255, 0.05);
  transition: background-color 0.2s ease;

  &:last-child {
    border-bottom: none;
  }

  &:hover {
    background-color: rgba(255, 255, 255, 0.01);
  }
`;

const TableCell = styled.td`
  font-size: 14px;
  line-height: 1.5;
  padding: 20px 24px;
  vertical-align: middle;
  color: ${({ theme }) => theme.colors.neutral.lightGray};

  &.dimension-cell {
    font-weight: 600;
    color: ${({ theme }) => theme.colors.neutral.white};
  }

  &.legacy-cell {
    color: rgba(255, 255, 255, 0.35);
  }

  &.rapha-cell {
    font-weight: 500;
    color: ${({ theme }) => theme.colors.neutral.white};
  }
`;

const CrossIcon = styled.span`
  color: rgba(255, 255, 255, 0.3);
  margin-right: 12px;
  font-family: system-ui, -apple-system, sans-serif;
`;

const CheckIcon = styled.span`
  color: #3fbf7f;
  margin-right: 12px;
  font-weight: bold;
  font-family: system-ui, -apple-system, sans-serif;
`;

const comparisonData = [
  {
    dimension: 'Detection method',
    legacy: 'Signature-based',
    rapha: 'Behavioral baseline',
  },
  {
    dimension: 'Zero-day coverage',
    legacy: 'Misses',
    rapha: 'Catches by design',
  },
  {
    dimension: 'Output',
    legacy: 'Alerts a human',
    rapha: 'Decides and acts',
  },
  {
    dimension: 'Response to attacker',
    legacy: 'Blocks',
    rapha: 'Redirects into honeypot',
  },
  {
    dimension: 'Intelligence gathered',
    legacy: 'None',
    rapha: 'Full session, hash-chained',
  },
  {
    dimension: 'Operating cost (Indian SME)',
    legacy: 'Rs. 10L+/year',
    rapha: 'Rs. 12K/node/year',
  },
  {
    dimension: 'Setup',
    legacy: 'Weeks',
    rapha: 'Single binary, minutes',
  },
];

export const WhyRaphaSection: React.FC = () => {
  return (
    <SectionContainer id="why-rapha">
      <HeaderGrid>
        <SectionPrefix>§02 / WHY RAPHA</SectionPrefix>
        <TitleHighlight>
          Legacy IDS asks <em>"have I seen this before?"</em>
          <br />
          RAPHA asks <span className="highlight">"is anything off?"</span>
        </TitleHighlight>
      </HeaderGrid>

      <TableWrapper>
        <Table>
          <thead>
            <tr>
              <TableHeader style={{ width: '34%' }}>Dimension</TableHeader>
              <TableHeader style={{ width: '33%' }}>Traditional IDS / IPS</TableHeader>
              <TableHeader className="rapha-header" style={{ width: '33%' }}>RAPHA</TableHeader>
            </tr>
          </thead>
          <tbody>
            {comparisonData.map((row, index) => (
              <TableRow key={index}>
                <TableCell className="dimension-cell">{row.dimension}</TableCell>
                <TableCell className="legacy-cell">
                  <CrossIcon>✕</CrossIcon> {row.legacy}
                </TableCell>
                <TableCell className="rapha-cell">
                  <CheckIcon>✓</CheckIcon> {row.rapha}
                </TableCell>
              </TableRow>
            ))}
          </tbody>
        </Table>
      </TableWrapper>
    </SectionContainer>
  );
};
