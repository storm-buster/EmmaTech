import { useState } from 'react';
import styled from 'styled-components';
import { motion, AnimatePresence } from 'framer-motion';
import { breakpoints } from '../../styles/breakpoints';
import { roles, departments } from '../../data/careersData';
import type { Role } from '../../data/careersData';

const SectionContainer = styled.section`
  padding: ${({ theme }) => theme.spacing['4xl']} ${({ theme }) => theme.spacing.lg};
  background: ${({ theme }) => theme.colors.background.primary};
  position: relative;

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
  margin-bottom: ${({ theme }) => theme.spacing['2xl']};

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

const FilterBar = styled.div`
  display: flex;
  flex-wrap: wrap;
  gap: ${({ theme }) => theme.spacing.sm};
  justify-content: center;
  margin-bottom: ${({ theme }) => theme.spacing['2xl']};
  max-width: 1200px;
  margin-left: auto;
  margin-right: auto;
`;

const FilterButton = styled.button<{ $active: boolean }>`
  padding: 8px 20px;
  font-size: 13px;
  font-weight: 600;
  font-family: ${({ theme }) => theme.typography.fontFamily.monospace};
  letter-spacing: 0.05em;
  border: 1px solid ${({ $active }) =>
    $active ? 'rgba(63, 191, 127, 0.5)' : 'rgba(226, 232, 240, 0.1)'};
  background: ${({ $active }) =>
    $active ? 'rgba(63, 191, 127, 0.1)' : 'rgba(255, 255, 255, 0.02)'};
  color: ${({ $active, theme }) =>
    $active ? '#3FBF7F' : theme.colors.neutral.mediumGray};
  cursor: pointer;
  transition: all 0.3s ease;

  &:hover {
    border-color: rgba(63, 191, 127, 0.3);
    color: #3FBF7F;
  }
`;

const RolesGrid = styled.div`
  display: flex;
  flex-direction: column;
  gap: ${({ theme }) => theme.spacing.md};
  max-width: 1000px;
  margin: 0 auto;
`;

const DepartmentGroup = styled.div`
  margin-bottom: ${({ theme }) => theme.spacing.xl};
`;

const DepartmentLabel = styled.h3`
  font-family: ${({ theme }) => theme.typography.fontFamily.monospace};
  font-size: 12px;
  font-weight: 700;
  color: #3FBF7F;
  text-transform: uppercase;
  letter-spacing: 0.15em;
  margin-bottom: ${({ theme }) => theme.spacing.md};
  padding-bottom: ${({ theme }) => theme.spacing.sm};
  border-bottom: 1px solid rgba(63, 191, 127, 0.15);
`;

const RoleCardContainer = styled(motion.div)`
  background: ${({ theme }) => theme.gradients.card};
  border: 1px solid ${({ theme }) => theme.colors.neutral.border};
  padding: ${({ theme }) => theme.spacing.xl};
  cursor: pointer;
  transition: ${({ theme }) => theme.transitions.default};

  &:hover {
    border-color: rgba(226, 232, 240, 0.15);
    box-shadow: 0 4px 24px rgba(0, 0, 0, 0.3);
  }
`;

const RoleHeader = styled.div`
  display: flex;
  flex-direction: column;
  gap: ${({ theme }) => theme.spacing.sm};

  ${breakpoints.tablet} {
    flex-direction: row;
    align-items: center;
    justify-content: space-between;
  }
`;

const RoleTitle = styled.h4`
  font-size: 18px;
  font-weight: 600;
  color: ${({ theme }) => theme.colors.neutral.white};
  text-transform: none;
  letter-spacing: 0;
`;

const RoleMeta = styled.div`
  display: flex;
  flex-wrap: wrap;
  gap: ${({ theme }) => theme.spacing.sm};
  align-items: center;
`;

const Badge = styled.span<{ $variant?: 'type' | 'location' }>`
  display: inline-block;
  padding: 4px 12px;
  font-size: 11px;
  font-weight: 600;
  font-family: ${({ theme }) => theme.typography.fontFamily.monospace};
  text-transform: uppercase;
  letter-spacing: 0.08em;
  border: 1px solid ${({ $variant }) =>
    $variant === 'type' ? 'rgba(226, 232, 240, 0.15)' : 'rgba(63, 191, 127, 0.2)'};
  background: ${({ $variant }) =>
    $variant === 'type' ? 'rgba(226, 232, 240, 0.05)' : 'rgba(63, 191, 127, 0.08)'};
  color: ${({ $variant }) =>
    $variant === 'type' ? 'rgba(226, 232, 240, 0.7)' : '#3FBF7F'};
`;

const RoleSummary = styled.p`
  font-size: 15px;
  color: ${({ theme }) => theme.colors.neutral.mediumGray};
  margin-top: ${({ theme }) => theme.spacing.sm};
  line-height: 1.5;
`;

const ExpandedContent = styled(motion.div)`
  margin-top: ${({ theme }) => theme.spacing.lg};
  padding-top: ${({ theme }) => theme.spacing.lg};
  border-top: 1px solid ${({ theme }) => theme.colors.neutral.border};
`;

const DetailBlock = styled.div`
  margin-bottom: ${({ theme }) => theme.spacing.lg};
`;

const DetailLabel = styled.h5`
  font-family: ${({ theme }) => theme.typography.fontFamily.monospace};
  font-size: 11px;
  font-weight: 700;
  color: ${({ theme }) => theme.colors.primary.main};
  text-transform: uppercase;
  letter-spacing: 0.15em;
  margin-bottom: ${({ theme }) => theme.spacing.xs};
`;

const DetailText = styled.p`
  font-size: 15px;
  line-height: 1.7;
  color: ${({ theme }) => theme.colors.neutral.lightGray};
`;

const ApplyButton = styled.a`
  display: inline-block;
  padding: 12px 36px;
  font-size: 14px;
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
  margin-top: ${({ theme }) => theme.spacing.md};

  &:hover {
    transform: translateY(-2px);
  }
`;

const RoleCard: React.FC<{ role: Role }> = ({ role }) => {
  const [expanded, setExpanded] = useState(false);

  return (
    <RoleCardContainer
      layout
      onClick={() => setExpanded(!expanded)}
      initial={{ opacity: 0, y: 10 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true }}
      transition={{ duration: 0.3 }}
    >
      <RoleHeader>
        <div>
          <RoleTitle>{role.title}</RoleTitle>
          <RoleSummary>{role.summary}</RoleSummary>
        </div>
        <RoleMeta>
          <Badge $variant="type">{role.type}</Badge>
          <Badge $variant="location">{role.location}</Badge>
        </RoleMeta>
      </RoleHeader>

      <AnimatePresence>
        {expanded && (
          <ExpandedContent
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            transition={{ duration: 0.3 }}
          >
            <DetailBlock>
              <DetailLabel>What you'll do</DetailLabel>
              <DetailText>{role.whatYoullDo}</DetailText>
            </DetailBlock>
            <DetailBlock>
              <DetailLabel>What we're looking for</DetailLabel>
              <DetailText>{role.lookingFor}</DetailText>
            </DetailBlock>
            {role.bonus && (
              <DetailBlock>
                <DetailLabel>Bonus points</DetailLabel>
                <DetailText>{role.bonus}</DetailText>
              </DetailBlock>
            )}
            {role.whyItMatters && (
              <DetailBlock>
                <DetailLabel>Why this role matters</DetailLabel>
                <DetailText>{role.whyItMatters}</DetailText>
              </DetailBlock>
            )}
            <ApplyButton
              href={`mailto:careers@emmatech.in?subject=Application: ${encodeURIComponent(role.title)}`}
              onClick={(e) => e.stopPropagation()}
            >
              Apply for this role
            </ApplyButton>
          </ExpandedContent>
        )}
      </AnimatePresence>
    </RoleCardContainer>
  );
};

export const OpenRoles: React.FC = () => {
  const [activeFilter, setActiveFilter] = useState<string>('All');

  const filteredRoles = activeFilter === 'All'
    ? roles
    : roles.filter((r) => r.department === activeFilter);

  const groupedRoles = departments.reduce((acc, dept) => {
    const deptRoles = filteredRoles.filter((r) => r.department === dept);
    if (deptRoles.length > 0) acc.push({ department: dept, roles: deptRoles });
    return acc;
  }, [] as { department: string; roles: Role[] }[]);

  return (
    <SectionContainer id="open-roles">
      <SectionPrefix>§03 / OPEN ROLES</SectionPrefix>
      <SectionTitle>Open Roles</SectionTitle>

      <FilterBar>
        <FilterButton
          $active={activeFilter === 'All'}
          onClick={() => setActiveFilter('All')}
        >
          All ({roles.length})
        </FilterButton>
        {departments.map((dept) => {
          const count = roles.filter((r) => r.department === dept).length;
          return (
            <FilterButton
              key={dept}
              $active={activeFilter === dept}
              onClick={() => setActiveFilter(dept)}
            >
              {dept} ({count})
            </FilterButton>
          );
        })}
      </FilterBar>

      <RolesGrid>
        {groupedRoles.map((group) => (
          <DepartmentGroup key={group.department}>
            <DepartmentLabel>{group.department}</DepartmentLabel>
            {group.roles.map((role) => (
              <RoleCard key={role.id} role={role} />
            ))}
          </DepartmentGroup>
        ))}
      </RolesGrid>
    </SectionContainer>
  );
};
