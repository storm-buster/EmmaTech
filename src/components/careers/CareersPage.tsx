import { CareersHero } from './CareersHero';
import { WhyEmmaTech } from './WhyEmmaTech';
import { FoundingStage } from './FoundingStage';
import { OpenRoles } from './OpenRoles';
import { OurValues, Benefits, GeneralApplicationCTA } from './ValuesBenefitsCTA';

export const CareersPage: React.FC = () => {
  return (
    <>
      <CareersHero />
      <WhyEmmaTech />
      <FoundingStage />
      <OpenRoles />
      <OurValues />
      <Benefits />
      <GeneralApplicationCTA />
    </>
  );
};
