import styled from 'styled-components';
import { CustomerSegment } from './CustomerSegment';
import { breakpoints } from '../styles/breakpoints';

const SectionContainer = styled.section`
  padding: ${({ theme }) => theme.spacing['4xl']} ${({ theme }) =>
  theme.spacing.lg};
  background-color: ${({ theme }) => theme.colors.neutral.lightGray};

  ${breakpoints.tablet} {
    padding: ${({ theme }) => theme.spacing['4xl']} ${({ theme }) =>
  theme.spacing['2xl']};
  }
`;

const SectionTitle = styled.h2`
  font-size: ${({ theme }) => theme.typography.fontSize.h2Mobile};
  line-height: ${({ theme }) => theme.typography.lineHeight.h2Mobile};
  font-weight: ${({ theme }) => theme.typography.fontWeight.bold};
  color: ${({ theme }) => theme.colors.neutral.darkGray};
  text-align: center;
  margin-bottom: ${({ theme }) => theme.spacing.md};

  ${breakpoints.tablet} {
    font-size: ${({ theme }) => theme.typography.fontSize.h2Desktop};
    line-height: ${({ theme }) => theme.typography.lineHeight.h2Desktop};
  }
`;

const SectionSubtitle = styled.p`
  font-size: ${({ theme }) => theme.typography.fontSize.bodyLarge};
  line-height: ${({ theme }) => theme.typography.lineHeight.bodyLarge};
  color: ${({ theme }) => theme.colors.neutral.mediumGray};
  text-align: center;
  margin-bottom: ${({ theme }) => theme.spacing['3xl']};
  max-width: 800px;
  margin-left: auto;
  margin-right: auto;
`;

const CustomersGrid = styled.div`
  display: grid;
  grid-template-columns: 1fr;
  gap: ${({ theme }) => theme.spacing.lg};
  max-width: 1200px;
  margin: 0 auto;

  ${breakpoints.tablet} {
    grid-template-columns: repeat(3, 1fr);
    gap: ${({ theme }) => theme.spacing.xl};
  }
`;

const customers = [
  {
    title: 'The Individual (Developers & Researchers)',
    description:
      'A lightweight, personal version of RAPHA with a smaller, efficient ML model and simple Docker image decoys, designed for low-overhead research and development.',
    icon: '👨‍💻',
  },
  {
    title: 'Government & Defense (High-Assurance)',
    description:
      'Our flagship platform for mission-critical environments, featuring our most advanced intrusion detection models and full Virtual Machine decoys in a fully on-premises deployment for maximum security and control.',
    icon: '🏛️',
  },
  {
    title: 'Large Enterprises (Scalable Cloud)',
    description:
      'An enterprise-grade platform in a secure cloud, with advanced ML models and a flexible choice of Docker or Virtual Machine decoys to match specific security needs.',
    icon: '🏢',
  },
];

export const CustomerSection: React.FC = () => {
  return (
    <SectionContainer>
      <SectionTitle>Tailored Solutions for a Diverse Security Market</SectionTitle>
      <SectionSubtitle>
        We serve three distinct customer segments, from individual developers
        to nation-states, with a solution designed for their specific needs.
      </SectionSubtitle>
      <CustomersGrid>
        {customers.map((customer, index) => (
          <CustomerSegment
            key={index}
            title={customer.title}
            description={customer.description}
            icon={customer.icon}
          />
        ))}
      </CustomersGrid>
    </SectionContainer>
  );
};
