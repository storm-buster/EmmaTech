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

const Subheading3 = styled.h3`
  font-size: 20px;
  font-weight: 600;
  color: ${({ theme }) => theme.colors.neutral.white};
  margin: ${({ theme }) => theme.spacing.lg} 0 ${({ theme }) => theme.spacing.sm};
`;

const Paragraph = styled.p`
  margin-bottom: ${({ theme }) => theme.spacing.md};
`;

const BulletList = styled.ul`
  margin: 0 0 ${({ theme }) => theme.spacing.md} ${({ theme }) => theme.spacing.lg};
  list-style: disc;
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

export const PrivacyPolicy: React.FC = () => {
  useEffect(() => {
    document.title = 'Privacy Policy — EmmaTech';
    return () => {
      document.title = 'EmmaTech™ - RAPHA: The Future of Autonomous Cyber Defense';
    };
  }, []);

  return (
    <PageContainer id="privacy">
      <ContentWrapper>
        <Heading>Privacy Policy</Heading>
        <Meta>
          <B>Effective Date:</B> August 20, 2026 &nbsp;|&nbsp; <B>Last Updated:</B> August 20, 2026 &nbsp;|&nbsp; <B>Version:</B> 2.0
        </Meta>

        <Divider />

        {/* 1. Introduction */}
        <Subheading>1. Introduction</Subheading>
        <Paragraph>
          <B>EmmaTech Private Limited</B> ("EmmaTech," "we," "us," "our"), based in Delhi, India, operates the
          <B> RAPHA</B> platform and the web application at <B>emmatech.in</B>. This Privacy Policy explains what
          information we handle when you create an account and use the Service, and how we protect it.
        </Paragraph>
        <Paragraph>
          Privacy questions: <Link href="mailto:privacy@emmatech.in">privacy@emmatech.in</Link>
        </Paragraph>

        <Divider />

        {/* 2. Scope */}
        <Subheading>2. Scope</Subheading>
        <Paragraph>This Policy covers the EmmaTech website, account sign-up and authentication, and the RAPHA Console. It does not cover third-party services you choose to integrate with; those are governed by their own policies.</Paragraph>

        <Divider />

        {/* 3. Information We Handle */}
        <Subheading>3. Information We Handle</Subheading>

        <Subheading3>3.1 Account and Organization Information</Subheading3>
        <StyledTable>
          <thead><tr><th>Data</th><th>Purpose</th></tr></thead>
          <tbody>
            <tr><td>Your name and email address (stored normalized/lowercased)</td><td>Identify your account and contact you about the Service</td></tr>
            <tr><td>Password (stored only as a scrypt hash — never in plaintext)</td><td>Authenticate email/password sign-in</td></tr>
            <tr><td>Authentication method (email/password, or Google/Microsoft)</td><td>Sign you in</td></tr>
            <tr><td>Organization name, role (owner/member), and selected plan</td><td>Organize access and determine entitlements</td></tr>
            <tr><td>Your Organization's RAPHA tenant association and provisioning status</td><td>Connect your Organization to its RAPHA tenant</td></tr>
          </tbody>
        </StyledTable>

        <Subheading3>3.2 Email Verification Information</Subheading3>
        <Paragraph>
          When you sign up with email and password, we send a 6-digit verification code to your email. We store only a
          <B> keyed cryptographic digest (HMAC) of the code — never the plaintext code</B> — together with an expiry time,
          an attempt count, and the pending signup details, so we can verify your email. The code is single-use, expires
          after a short period (about 10 minutes), and a new request supersedes the previous code. Codes are not returned
          in API responses and are not logged.
        </Paragraph>

        <Subheading3>3.3 Authentication / Session Cookie</Subheading3>
        <Paragraph>
          After you sign in, we set one <B>authentication cookie</B> (<code>et_session</code>). It is HttpOnly (not
          readable by browser scripts), SameSite=Lax, marked Secure in production, cryptographically signed, and expires
          after about 7 days. It is used solely to keep you signed in. We do not use advertising or third-party tracking
          cookies.
        </Paragraph>

        <Subheading3>3.4 Service / Console Data</Subheading3>
        <Paragraph>
          Once your Organization is provisioned, the RAPHA platform processes data associated with your tenant — such as
          sensor information, telemetry, detection alerts, and forensic records — which the RAPHA Console displays to your
          Organization. This data belongs to your Organization's tenant and is shown only to authorized members of that
          Organization.
        </Paragraph>

        <Subheading3>3.5 API Keys and Enrollment Credentials</Subheading3>
        <Paragraph>
          API keys and one-time enrollment credentials for your tenant are issued through RAPHA. Their raw secret values
          are shown to you once at creation and are <B>not stored in plaintext by EmmaTech</B>.
        </Paragraph>

        <Subheading3>3.6 Operational Logs</Subheading3>
        <Paragraph>
          We keep server and request logs (such as timestamps, request metadata, and outcomes) to operate, secure, debug,
          and rate-limit the Service. Verification codes, passwords, API keys, enrollment credentials, and other secrets
          are never written to these logs.
        </Paragraph>

        <Divider />

        {/* 4. How We Use Information */}
        <Subheading>4. How We Use Information</Subheading>
        <BulletList>
          <li>To create and authenticate your account, and to verify your email address;</li>
          <li>To create your Organization, apply your selected plan, and provision and operate your RAPHA tenant;</li>
          <li>To display your Organization's data in the RAPHA Console;</li>
          <li>To secure the Service, prevent abuse, and troubleshoot problems;</li>
          <li>To send transactional messages such as verification codes and account/service notices.</li>
        </BulletList>

        <Divider />

        {/* 5. Email Delivery Provider */}
        <Subheading>5. Email Delivery</Subheading>
        <Paragraph>
          Verification and transactional emails are sent through a third-party email delivery provider (<B>Resend</B>),
          which processes the recipient email address and message solely to deliver it on our behalf.
        </Paragraph>

        <Divider />

        {/* 6. Sharing */}
        <Subheading>6. How Information Is Shared</Subheading>
        <Paragraph>We do <B>not</B> sell your information. We share it only:</Paragraph>
        <BulletList>
          <li>With service providers that host and operate the platform (cloud hosting and database), the email delivery provider, and the RAPHA control plane — as needed to provide the Service;</li>
          <li>When required by law or valid legal process, or to protect the rights, safety, and security of EmmaTech, our users, or the public.</li>
        </BulletList>

        <Divider />

        {/* 7. Security */}
        <Subheading>7. How We Protect Information</Subheading>
        <BulletList>
          <li><B>Passwords</B> are stored as scrypt hashes, never in plaintext.</li>
          <li><B>Verification codes</B> are stored only as keyed HMAC digests, compared in constant time, single-use, and short-lived.</li>
          <li><B>Sessions</B> use a signed, HttpOnly cookie; server-side credentials for the RAPHA control plane are never sent to your browser.</li>
          <li><B>Organization isolation:</B> you can only access your own Organization; your tenant identity is derived on the server and never trusted from the browser.</li>
          <li>Traffic is encrypted in transit (HTTPS/TLS), and authentication endpoints are rate-limited.</li>
        </BulletList>
        <Paragraph>No method of transmission or storage is perfectly secure, but we work to protect your information using the measures above.</Paragraph>

        <Divider />

        {/* 8. Retention */}
        <Subheading>8. Retention</Subheading>
        <BulletList>
          <li><B>Email verification codes:</B> single-use and expire after a short period (about 10 minutes).</li>
          <li><B>Authentication sessions:</B> expire after about 7 days.</li>
          <li><B>Account and Organization records:</B> retained while your account remains active.</li>
          <li><B>RAPHA tenant data</B> (sensors, telemetry, alerts, forensics) is governed by the RAPHA platform.</li>
        </BulletList>

        <Divider />

        {/* 9. Your Choices */}
        <Subheading>9. Your Choices and Requests</Subheading>
        <Paragraph>
          You can stop using the Service at any time. To access, correct, or request deletion of your account
          information, contact us at <Link href="mailto:privacy@emmatech.in">privacy@emmatech.in</Link>. We will respond
          within a reasonable time.
        </Paragraph>

        <Divider />

        {/* 10. Children */}
        <Subheading>10. Children</Subheading>
        <Paragraph>The Service is intended for business use and is not directed to individuals under 18. We do not knowingly collect information from children.</Paragraph>

        <Divider />

        {/* 11. Changes */}
        <Subheading>11. Changes to This Policy</Subheading>
        <Paragraph>We may update this Policy from time to time. When we do, we will revise the "Last Updated" date above, and we will provide notice of material changes where appropriate.</Paragraph>

        <Divider />

        {/* 12. Contact */}
        <Subheading>12. Contact</Subheading>
        <StyledTable>
          <thead><tr><th>Purpose</th><th>Contact</th></tr></thead>
          <tbody>
            <tr><td><B>Privacy</B></td><td><Link href="mailto:privacy@emmatech.in">privacy@emmatech.in</Link></td></tr>
            <tr><td><B>Security</B></td><td><Link href="mailto:security@emmatech.in">security@emmatech.in</Link></td></tr>
            <tr><td><B>Support</B></td><td><Link href="mailto:support@emmatech.in">support@emmatech.in</Link></td></tr>
            <tr><td><B>Postal</B></td><td>EmmaTech Private Limited, Delhi, India</td></tr>
          </tbody>
        </StyledTable>

        <Divider />

        <Paragraph style={{ textAlign: 'center', fontStyle: 'italic', fontSize: '14px', color: '#888' }}>
          This Privacy Policy is part of our Terms of Service. By using RAPHA, you acknowledge this Policy.
        </Paragraph>
      </ContentWrapper>
    </PageContainer>
  );
};
