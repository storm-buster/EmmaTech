import { useEffect } from 'react';
import { CareersHero } from './CareersHero';
import { WhyEmmaTech } from './WhyEmmaTech';
import { FoundingStage } from './FoundingStage';
import { OpenRoles } from './OpenRoles';
import { OurValues, Benefits, GeneralApplicationCTA } from './ValuesBenefitsCTA';

export const CareersPage: React.FC = () => {
  useEffect(() => {
    // Update document title and meta for SEO
    document.title = 'Careers — EmmaTech';
    const metaDesc = document.querySelector('meta[name="description"]');
    if (metaDesc) {
      metaDesc.setAttribute(
        'content',
        'Join EmmaTech and help build RAPHA, an autonomous cyber-defense platform. Founding-team roles in ML, security research, engineering, product, and go-to-market.'
      );
    }
    // Scroll to top on mount
    window.scrollTo(0, 0);

    return () => {
      // Restore original meta on unmount
      document.title = 'EmmaTech™ - RAPHA: The Future of Autonomous Cyber Defense';
      if (metaDesc) {
        metaDesc.setAttribute(
          'content',
          'EmmaTech - Introducing RAPHA: The Future of Autonomous Cyber Defense. A new class of high-assurance security built on decentralized architecture.'
        );
      }
    };
  }, []);

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
