import styled from 'styled-components';
import { Modal } from './Modal';
import { Button } from './Button';

interface InvestorModalProps {
  isOpen: boolean;
  onClose: () => void;
}

const ModalTitle = styled.h2`
  font-size: ${({ theme }) => theme.typography.fontSize.h2Mobile};
  line-height: ${({ theme }) => theme.typography.lineHeight.h2Mobile};
  font-weight: ${({ theme }) => theme.typography.fontWeight.bold};
  color: ${({ theme }) => theme.colors.neutral.darkGray};
  margin-bottom: ${({ theme }) => theme.spacing.sm};
  text-align: center;
`;

const ModalSubtitle = styled.p`
  font-size: ${({ theme }) => theme.typography.fontSize.body};
  line-height: ${({ theme }) => theme.typography.lineHeight.body};
  color: ${({ theme }) => theme.colors.neutral.mediumGray};
  margin-bottom: ${({ theme }) => theme.spacing.xl};
  text-align: center;
`;

const SectionTitle = styled.h3`
  font-size: ${({ theme }) => theme.typography.fontSize.h3};
  line-height: ${({ theme }) => theme.typography.lineHeight.h3};
  font-weight: ${({ theme }) => theme.typography.fontWeight.semibold};
  color: ${({ theme }) => theme.colors.primary.main};
  margin-bottom: ${({ theme }) => theme.spacing.md};
`;

const Description = styled.p`
  font-size: ${({ theme }) => theme.typography.fontSize.body};
  line-height: ${({ theme }) => theme.typography.lineHeight.body};
  color: ${({ theme }) => theme.colors.neutral.mediumGray};
  margin-bottom: ${({ theme }) => theme.spacing.lg};
`;

const FeatureList = styled.ul`
  list-style: none;
  margin-bottom: ${({ theme }) => theme.spacing.xl};
`;

const FeatureItem = styled.li`
  font-size: ${({ theme }) => theme.typography.fontSize.body};
  line-height: ${({ theme }) => theme.typography.lineHeight.body};
  color: ${({ theme }) => theme.colors.neutral.darkGray};
  margin-bottom: ${({ theme }) => theme.spacing.md};
  padding-left: ${({ theme }) => theme.spacing.lg};
  position: relative;

  &::before {
    content: '✓';
    position: absolute;
    left: 0;
    color: ${({ theme }) => theme.colors.semantic.success};
    font-weight: ${({ theme }) => theme.typography.fontWeight.bold};
  }
`;

const FeatureName = styled.strong`
  color: ${({ theme }) => theme.colors.neutral.darkGray};
  font-weight: ${({ theme }) => theme.typography.fontWeight.semibold};
`;

const ButtonWrapper = styled.div`
  display: flex;
  justify-content: center;
`;

const mvpFeatures = [
  {
    name: 'Decentralized Agent Network',
    description: 'A resilient P2P network that eliminates single points of failure.',
  },
  {
    name: 'ML-Driven Detection Engine',
    description: 'A production-ready model for proactive threat detection.',
  },
  {
    name: 'Dynamic Honeypot Deployment (On-Premises)',
    description: 'Full Virtual Machine decoys for deep forensic analysis.',
  },
  {
    name: 'Tamper-Proof Blockchain Ledger',
    description: 'A private, immutable blockchain for a guaranteed, verifiable audit trail.',
  },
];

export const InvestorModal: React.FC<InvestorModalProps> = ({
  isOpen,
  onClose,
}) => {
  const handleContactClick = () => {
    window.location.href =
      'mailto:investors@emmatech.com?subject=Investment Inquiry&body=Hello, I am interested in learning more about investment opportunities with EmmaTech.';
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose}>
      <ModalTitle>Become an Investor in EmmaTech</ModalTitle>
      <ModalSubtitle>
        We are creating a new category of high-assurance security. Join us in
        building the future of digital resilience.
      </ModalSubtitle>

      <SectionTitle>Our Minimum Viable Product (MVP)</SectionTitle>
      <Description>
        Our MVP is a fully operational, enterprise-ready platform designed for
        our primary target market: government and high-stakes organizations.
        This is not a demo; it is a complete high-assurance system featuring:
      </Description>

      <FeatureList>
        {mvpFeatures.map((feature, index) => (
          <FeatureItem key={index}>
            <FeatureName>{feature.name}:</FeatureName> {feature.description}
          </FeatureItem>
        ))}
      </FeatureList>

      <ButtonWrapper>
        <Button variant="primary" onClick={handleContactClick}>
          Contact Us to Invest
        </Button>
      </ButtonWrapper>
    </Modal>
  );
};
