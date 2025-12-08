import styled from 'styled-components';
import { motion } from 'framer-motion';
import { Card } from './Card';
import { breakpoints } from '../styles/breakpoints';

const SectionContainer = styled.section`
  padding: ${({ theme }) => theme.spacing['4xl']} ${({ theme }) => theme.spacing.lg};
  background: ${({ theme }) => theme.colors.background.secondary};
  position: relative;

  ${breakpoints.tablet} {
    padding: ${({ theme }) => theme.spacing['4xl']} ${({ theme }) => theme.spacing['2xl']};
  }
`;

const SectionTitle = styled.h2`
  font-size: 36px;
  line-height: 1.2;
  font-weight: 700;
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
  }

  ${breakpoints.tablet} {
    font-size: 48px;
  }
`;

const SectionSubtitle = styled.p`
  font-size: 16px;
  line-height: 1.6;
  color: ${({ theme }) => theme.colors.neutral.mediumGray};
  text-align: center;
  margin-bottom: ${({ theme }) => theme.spacing['3xl']};
  max-width: 800px;
  margin-left: auto;
  margin-right: auto;

  ${breakpoints.tablet} {
    font-size: 18px;
  }
`;

const TeamGrid = styled.div`
  display: grid;
  grid-template-columns: 1fr;
  gap: ${({ theme }) => theme.spacing.xl};
  max-width: 1200px;
  margin: 0 auto;

  ${breakpoints.tablet} {
    grid-template-columns: repeat(2, 1fr);
  }

  ${breakpoints.desktop} {
    grid-template-columns: repeat(3, 1fr);
  }
`;

const TeamCard = styled(Card)`
  text-align: center;
  height: 100%;
  transition: ${({ theme }) => theme.transitions.default};

  &:hover {
    transform: translateY(-8px);
    border-color: ${({ theme }) => theme.colors.primary.main};
    box-shadow: 0 12px 32px rgba(59, 130, 246, 0.25);
  }
`;

const Avatar = styled.div`
  width: 120px;
  height: 120px;
  border-radius: 50%;
  background: ${({ theme }) => theme.gradients.primary};
  margin: 0 auto ${({ theme }) => theme.spacing.lg};
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 48px;
  color: white;
  position: relative;

  &::after {
    content: '';
    position: absolute;
    inset: -4px;
    border-radius: 50%;
    background: ${({ theme }) => theme.gradients.primary};
    z-index: -1;
    filter: blur(12px);
    opacity: 0.6;
  }
`;

const Name = styled.h3`
  font-size: 22px;
  font-weight: 600;
  color: ${({ theme }) => theme.colors.neutral.white};
  margin-bottom: ${({ theme }) => theme.spacing.xs};

  ${breakpoints.tablet} {
    font-size: 24px;
  }
`;

const Role = styled.p`
  font-size: 14px;
  color: ${({ theme }) => theme.colors.primary.main};
  font-weight: 600;
  margin-bottom: ${({ theme }) => theme.spacing.md};
  text-transform: uppercase;
  letter-spacing: 1px;

  ${breakpoints.tablet} {
    font-size: 15px;
  }
`;

const Bio = styled.p`
  font-size: 14px;
  line-height: 1.6;
  color: ${({ theme }) => theme.colors.neutral.mediumGray};
  margin-bottom: ${({ theme }) => theme.spacing.md};

  ${breakpoints.tablet} {
    font-size: 15px;
  }
`;

const SocialLinks = styled.div`
  display: flex;
  justify-content: center;
  gap: ${({ theme }) => theme.spacing.md};
`;

const SocialLink = styled.a`
  width: 40px;
  height: 40px;
  border-radius: 50%;
  background: ${({ theme }) => theme.colors.background.tertiary};
  border: 1px solid ${({ theme }) => theme.colors.neutral.border};
  display: flex;
  align-items: center;
  justify-content: center;
  color: ${({ theme }) => theme.colors.neutral.lightGray};
  text-decoration: none;
  font-size: 18px;
  transition: ${({ theme }) => theme.transitions.default};

  &:hover {
    background: ${({ theme }) => theme.colors.primary.main};
    color: white;
    transform: translateY(-2px);
    box-shadow: 0 4px 12px ${({ theme }) => theme.colors.primary.glow};
  }
`;

const teamMembers = [
  {
    name: 'Dr. Sarah Chen',
    role: 'CEO & Co-Founder',
    bio: 'Former DARPA researcher with 15+ years in cybersecurity. PhD in Computer Science from MIT.',
    avatar: '👩‍💼',
    linkedin: '#',
    twitter: '#',
  },
  {
    name: 'Marcus Rodriguez',
    role: 'CTO & Co-Founder',
    bio: 'Ex-Google security architect. Expert in ML-driven threat detection and blockchain security.',
    avatar: '👨‍💻',
    linkedin: '#',
    twitter: '#',
  },
  {
    name: 'Dr. Aisha Patel',
    role: 'Head of Research',
    bio: 'Leading AI researcher specializing in autonomous systems and adversarial machine learning.',
    avatar: '👩‍🔬',
    linkedin: '#',
    twitter: '#',
  },
];

export const TeamSection: React.FC = () => {
  return (
    <SectionContainer id="team">
      <SectionTitle>Meet Our Team</SectionTitle>
      <SectionSubtitle>
        World-class experts in cybersecurity, AI, and blockchain technology,
        united by a mission to revolutionize digital defense.
      </SectionSubtitle>
      <TeamGrid>
        {teamMembers.map((member, index) => (
          <motion.div
            key={index}
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, margin: '-100px' }}
            transition={{ duration: 0.5, delay: index * 0.15 }}
          >
            <TeamCard>
              <Avatar>{member.avatar}</Avatar>
              <Name>{member.name}</Name>
              <Role>{member.role}</Role>
              <Bio>{member.bio}</Bio>
              <SocialLinks>
                <SocialLink href={member.linkedin} target="_blank" rel="noopener noreferrer">
                  💼
                </SocialLink>
                <SocialLink href={member.twitter} target="_blank" rel="noopener noreferrer">
                  🐦
                </SocialLink>
              </SocialLinks>
            </TeamCard>
          </motion.div>
        ))}
      </TeamGrid>
    </SectionContainer>
  );
};
