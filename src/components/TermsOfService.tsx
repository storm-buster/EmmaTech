import { useEffect } from 'react';
import styled from 'styled-components';
import { breakpoints } from '../styles/breakpoints';

const PageContainer = styled.main`
  min-height: 100vh;
  padding: 120px ${({ theme }) => theme.spacing.lg} 60px;
  background: ${({ theme }) => theme.colors.background.primary};
  color: ${({ theme }) => theme.colors.neutral.lightGray};
  line-height: 1.7;

  ${breakpoints.tablet} {
    padding: 150px ${({ theme }) => theme.spacing['2xl']} 80px;
  }
`;

const ContentWrapper = styled.div`
  max-width: 800px;
  margin: 0 auto;
`;

const Heading = styled.h1`
  font-size: 36px;
  font-weight: 700;
  color: ${({ theme }) => theme.colors.neutral.white};
  margin-bottom: ${({ theme }) => theme.spacing.md};
  text-align: center;

  ${breakpoints.tablet} {
    font-size: 48px;
  }
`;

const Meta = styled.p`
  text-align: center;
  font-size: 14px;
  color: ${({ theme }) => theme.colors.neutral.mediumGray};
  margin-bottom: ${({ theme }) => theme.spacing.xl};
`;

const Subheading = styled.h2`
  font-size: 24px;
  font-weight: 600;
  color: ${({ theme }) => theme.colors.primary.main};
  margin: ${({ theme }) => theme.spacing.xl} 0 ${({ theme }) => theme.spacing.md};
  letter-spacing: 0.02em;
`;

const Paragraph = styled.p`
  margin-bottom: ${({ theme }) => theme.spacing.md};
`;

const BulletList = styled.ul`
  margin: 0 0 ${({ theme }) => theme.spacing.md} ${({ theme }) => theme.spacing.lg};
  list-style: disc;
  li { margin-bottom: ${({ theme }) => theme.spacing.xs}; }
`;

const OrderedList = styled.ol`
  margin: 0 0 ${({ theme }) => theme.spacing.md} ${({ theme }) => theme.spacing.lg};
  li { margin-bottom: ${({ theme }) => theme.spacing.xs}; }
`;

const StyledTable = styled.table`
  width: 100%;
  border-collapse: collapse;
  margin-bottom: ${({ theme }) => theme.spacing.md};
  font-size: 14px;

  th, td {
    border: 1px solid ${({ theme }) => theme.colors.neutral.border};
    padding: ${({ theme }) => theme.spacing.sm};
    text-align: left;
  }
  th {
    background: ${({ theme }) => theme.colors.background.secondary};
    color: ${({ theme }) => theme.colors.primary.main};
    font-weight: 600;
  }
`;

const Disclaimer = styled.div`
  background: ${({ theme }) => theme.colors.background.secondary};
  border-left: 3px solid ${({ theme }) => theme.colors.primary.main};
  padding: ${({ theme }) => theme.spacing.md};
  margin: ${({ theme }) => theme.spacing.md} 0;
  font-size: 14px;
  text-transform: uppercase;
  letter-spacing: 0.02em;
`;

const Divider = styled.hr`
  border: none;
  border-top: 1px solid ${({ theme }) => theme.colors.neutral.border};
  margin: ${({ theme }) => theme.spacing.xl} 0;
`;

const B = styled.strong`
  color: ${({ theme }) => theme.colors.neutral.white};
`;

const Link = styled.a`
  color: ${({ theme }) => theme.colors.primary.main};
  text-decoration: none;
  &:hover { text-decoration: underline; }
`;

export const TermsOfService: React.FC = () => {
  useEffect(() => {
    document.title = 'Terms of Service — EmmaTech';
    return () => {
      document.title = 'EmmaTech™ - RAPHA: The Future of Autonomous Cyber Defense';
    };
  }, []);

  return (
    <PageContainer id="terms">
      <ContentWrapper>
        <Heading>Terms of Service</Heading>
        <Meta>
          <B>Last Updated:</B> August 20, 2026 &nbsp;|&nbsp; <B>Version:</B> 2.0 &nbsp;|&nbsp; <B>Effective Date:</B> August 20, 2026
        </Meta>

        <Divider />

        {/* 1. Agreement */}
        <Subheading>1. Agreement to These Terms</Subheading>
        <Paragraph>
          These Terms of Service ("Terms") govern your access to and use of the <B>RAPHA</B> platform and the EmmaTech
          web application at <B>emmatech.in</B> (together, the "Service"), operated by <B>EmmaTech Private Limited</B>
          ("EmmaTech," "we," "our," "us").
        </Paragraph>
        <Paragraph>
          By creating an account or using the Service, you ("you," "your") agree to these Terms. If you create an account
          on behalf of an organization, you represent that you are authorized to bind that organization. If you do not
          agree, do not use the Service.
        </Paragraph>

        <Divider />

        {/* 2. Definitions */}
        <Subheading>2. Definitions</Subheading>
        <StyledTable>
          <thead><tr><th>Term</th><th>Meaning</th></tr></thead>
          <tbody>
            <tr><td><B>Account</B></td><td>Your individual user record (name, email, authentication method)</td></tr>
            <tr><td><B>Organization</B></td><td>The workspace your account owns or belongs to, associated with a plan and a RAPHA tenant</td></tr>
            <tr><td><B>Plan</B></td><td>The commercial tier selected for an Organization: Free, Starter, or Growth</td></tr>
            <tr><td><B>RAPHA Console</B></td><td>The in-app console that displays your Organization's RAPHA data</td></tr>
            <tr><td><B>API Key</B></td><td>A credential for programmatic access to your Organization's RAPHA tenant</td></tr>
            <tr><td><B>Enrollment Credential</B></td><td>A one-time credential used to enroll a sensor/host with your RAPHA tenant</td></tr>
            <tr><td><B>Tenant</B></td><td>Your Organization's isolated environment within RAPHA</td></tr>
          </tbody>
        </StyledTable>

        <Divider />

        {/* 3. The Service */}
        <Subheading>3. The Service</Subheading>
        <Paragraph>The Service currently provides:</Paragraph>
        <BulletList>
          <li>Account creation and authentication (email/password with email verification, or Google/Microsoft sign-in);</li>
          <li>Organization creation and selection of a plan (Free, Starter, or Growth);</li>
          <li>Provisioning of a RAPHA tenant for your Organization;</li>
          <li>A RAPHA Console that displays your Organization's sensors, telemetry, alerts, and forensic records;</li>
          <li>Management of API keys and one-time enrollment credentials for your Organization's tenant.</li>
        </BulletList>
        <Paragraph>
          RAPHA is a cyber-defense platform. It is designed to help reduce security risk but <B>cannot guarantee that all
          threats will be detected or prevented</B>. You remain responsible for your overall security posture.
        </Paragraph>

        <Divider />

        {/* 4. Accounts & Verification */}
        <Subheading>4. Accounts and Verification</Subheading>
        <OrderedList>
          <li>You must provide an accurate name, email address, and organization name when signing up.</li>
          <li>Accounts created with email and password require <B>email verification via a one-time code</B> before the account is created and usable.</li>
          <li>Accounts created with Google or Microsoft sign-in are verified through that provider and do not require a separate code.</li>
          <li>You are responsible for keeping your password and any API keys or enrollment credentials secure, and for all activity under your account.</li>
          <li>Notify us promptly at <Link href="mailto:security@emmatech.in">security@emmatech.in</Link> if you believe your account or a credential has been compromised.</li>
        </OrderedList>

        <Divider />

        {/* 5. Plans & Service Usage */}
        <Subheading>5. Plans and Service Usage</Subheading>
        <Paragraph>
          Each Organization is associated with a plan that determines its entitlements. After signup you may select an
          initial plan; the selected plan is applied by EmmaTech and used to configure your RAPHA tenant.
        </Paragraph>
        <StyledTable>
          <thead><tr><th>Plan</th><th>Entitlements</th></tr></thead>
          <tbody>
            <tr><td><B>Free</B></td><td>1 sensor; decoys not included</td></tr>
            <tr><td><B>Starter</B></td><td>Up to 20 sensors; decoys included</td></tr>
            <tr><td><B>Growth</B></td><td>Unlimited sensors; decoys included</td></tr>
          </tbody>
        </StyledTable>
        <Paragraph>
          The Growth plan is intended for organizations and requires a work (non-consumer) email address at selection.
          Prices shown on the website are indicative. Automated online payment/subscription billing is not part of the
          current Service; entitlements are granted as described above, and paid arrangements (if any) are handled
          separately by contacting EmmaTech.
        </Paragraph>

        <Divider />

        {/* 6. Acceptable Use */}
        <Subheading>6. Acceptable Use</Subheading>
        <Paragraph><B>You agree not to:</B></Paragraph>
        <BulletList>
          <li>Attempt to access another organization's account, tenant, data, or credentials;</li>
          <li>Share, misuse, or attempt to recover API keys or enrollment credentials beyond their intended one-time use;</li>
          <li>Attack, disrupt, or probe the Service, or use it to attack third parties or for unlawful activity;</li>
          <li>Reverse engineer, decompile, or attempt to extract the platform's models, detection logic, or source;</li>
          <li>Circumvent authentication, authorization, rate limits, or other technical controls;</li>
          <li>Resell or redistribute the Service without a separate written agreement.</li>
        </BulletList>
        <Paragraph>You are responsible for your own compliance with laws applicable to your use of the Service.</Paragraph>

        <Divider />

        {/* 7. Intellectual Property */}
        <Subheading>7. Intellectual Property</Subheading>
        <Paragraph>
          EmmaTech and its licensors retain all rights in the RAPHA platform, the web application, the API, and the
          "EmmaTech" and "RAPHA" names and logos. You retain rights in the data your Organization submits to or generates
          within your RAPHA tenant.
        </Paragraph>
        <Paragraph>
          We grant you a non-exclusive, non-transferable, revocable right to use the Service in accordance with these
          Terms. Any feedback you provide may be used by us to improve the Service without restriction.
        </Paragraph>

        <Divider />

        {/* 8. Confidentiality */}
        <Subheading>8. Confidentiality</Subheading>
        <Paragraph>
          Non-public information disclosed by either party (including API keys, enrollment credentials, and other
          credentials) must be protected with reasonable care and used only as needed to use or provide the Service.
        </Paragraph>

        <Divider />

        {/* 9. Availability & Disclaimers */}
        <Subheading>9. Service Availability and Disclaimers</Subheading>
        <Disclaimer>
          The Service is provided "as is" and "as available." To the maximum extent permitted by law, EmmaTech disclaims
          all warranties, express or implied, including merchantability, fitness for a particular purpose, and
          non-infringement. We do not warrant that the Service will be uninterrupted, error-free, or that it will detect
          or prevent any particular threat.
        </Disclaimer>
        <Paragraph>The Service may change, and access may be suspended for maintenance, security, or operational reasons.</Paragraph>

        <Divider />

        {/* 10. Limitation of Liability */}
        <Subheading>10. Limitation of Liability</Subheading>
        <Paragraph>
          To the maximum extent permitted by law, EmmaTech will not be liable for indirect, incidental, special,
          consequential, or punitive damages, or for lost data, profits, or revenue. Our total aggregate liability arising
          out of or relating to the Service will not exceed the amounts (if any) you paid to EmmaTech for the Service in
          the twelve (12) months preceding the event giving rise to the claim.
        </Paragraph>

        <Divider />

        {/* 11. Indemnification */}
        <Subheading>11. Indemnification</Subheading>
        <Paragraph>
          You agree to indemnify and hold EmmaTech harmless from claims arising out of your data, your use of the Service,
          your violation of these Terms, or your violation of applicable law.
        </Paragraph>

        <Divider />

        {/* 12. Term & Termination */}
        <Subheading>12. Term and Termination</Subheading>
        <BulletList>
          <li>These Terms apply while you have an account or otherwise use the Service.</li>
          <li>You may stop using the Service at any time.</li>
          <li>We may suspend or terminate access for breach of these Terms, unlawful use, or to protect the Service or other users.</li>
          <li>On termination, your right to access the Service ends. Provisions that by their nature should survive (e.g., intellectual property, confidentiality, disclaimers, limitation of liability) will survive.</li>
        </BulletList>

        <Divider />

        {/* 13. Changes */}
        <Subheading>13. Changes to These Terms</Subheading>
        <Paragraph>
          We may update these Terms from time to time. When we do, we will revise the "Last Updated" date above. Your
          continued use of the Service after an update constitutes acceptance of the revised Terms.
        </Paragraph>

        <Divider />

        {/* 14. Governing Law */}
        <Subheading>14. Governing Law</Subheading>
        <Paragraph>
          These Terms are governed by the laws of India, where EmmaTech Private Limited is established, without regard to
          conflict-of-laws rules.
        </Paragraph>

        <Divider />

        {/* 15. Contact */}
        <Subheading>15. Contact</Subheading>
        <BulletList>
          <li><B>General/Legal:</B> <Link href="mailto:legal@emmatech.in">legal@emmatech.in</Link></li>
          <li><B>Security:</B> <Link href="mailto:security@emmatech.in">security@emmatech.in</Link></li>
          <li><B>Support:</B> <Link href="mailto:support@emmatech.in">support@emmatech.in</Link></li>
        </BulletList>
        <Paragraph><B>EmmaTech Private Limited</B><br />Delhi, India</Paragraph>

        <Divider />

        <Paragraph style={{ textAlign: 'center', fontStyle: 'italic' }}>
          By using RAPHA, you acknowledge that you have read, understood, and agree to these Terms of Service.
        </Paragraph>
      </ContentWrapper>
    </PageContainer>
  );
};
