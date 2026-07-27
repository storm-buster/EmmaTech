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
          <B>Effective Date:</B> July 15, 2026 &nbsp;|&nbsp; <B>Last Updated:</B> July 15, 2026 &nbsp;|&nbsp; <B>Version:</B> 1.0
        </Meta>

        <Divider />

        {/* 1. Introduction */}
        <Subheading>1. Introduction</Subheading>
        <Paragraph>
          EmmaTech Private Limited ("EmmaTech," "we," "us," "our") operates the <B>RAPHA</B> autonomous cyber-defense platform. This Privacy Policy explains how we collect, use, disclose, and protect information when you use our services.
        </Paragraph>
        <Paragraph>
          <B>Data Controller:</B> EmmaTech Private Limited, Delhi, India<br />
          <B>Contact:</B> <Link href="mailto:privacy@emmatech.in">privacy@emmatech.in</Link>
        </Paragraph>

        <Divider />

        {/* 2. Scope */}
        <Subheading>2. Scope</Subheading>
        <Paragraph>This Policy applies to:</Paragraph>
        <BulletList>
          <li><B>RAPHA Control Plane</B> (hosted SaaS)</li>
          <li><B>RAPHA Web Console</B> (dashboard)</li>
          <li><B>RAPHA API</B> (ingestion, alerts, management)</li>
          <li><B>RAPHA SDKs/Client Libraries</B></li>
          <li><B>EmmaTech Website</B> (emmatech.in)</li>
          <li><B>Support &amp; Sales Interactions</B></li>
        </BulletList>
        <Paragraph>
          <B>Not Covered:</B> Third-party services you integrate (SIEM, Slack, SOAR). Their privacy policies apply.
        </Paragraph>

        <Divider />

        {/* 3. Information We Collect */}
        <Subheading>3. Information We Collect</Subheading>

        <Subheading3>3.1 Customer Data (Processed on Your Behalf)</Subheading3>
        <StyledTable>
          <thead><tr><th>Category</th><th>Examples</th><th>Purpose</th></tr></thead>
          <tbody>
            <tr><td><B>Telemetry Features</B></td><td>Packet counts, rates, sizes, durations, entropy, flags</td><td>Threat detection, scoring</td></tr>
            <tr><td><B>Network Flows</B></td><td>Source/dest IP, ports, protocols, timestamps</td><td>Behavioral analysis</td></tr>
            <tr><td><B>Host Metrics</B></td><td>CPU, memory, disk, process counts</td><td>Host-based detection</td></tr>
            <tr><td><B>Attack Context</B></td><td>Source IPs, attack categories, timestamps</td><td>Alerting, forensics</td></tr>
            <tr><td><B>Detection Results</B></td><td>Labels, scores, categories, confidence</td><td>Alerting, policy decisions</td></tr>
          </tbody>
        </StyledTable>
        <Paragraph><B>We do NOT collect:</B> Payload contents, file contents, credentials, PII from packet payloads, encryption keys.</Paragraph>

        <Subheading3>3.2 Account &amp; Identity Data</Subheading3>
        <StyledTable>
          <thead><tr><th>Data</th><th>Source</th><th>Purpose</th></tr></thead>
          <tbody>
            <tr><td>Tenant name, contact email</td><td>Provisioning</td><td>Account management, billing</td></tr>
            <tr><td>API keys (hashed)</td><td>Provisioning</td><td>Authentication, audit</td></tr>
            <tr><td>Webhook URLs, secrets</td><td>Configuration</td><td>Alert delivery</td></tr>
            <tr><td>Admin user emails</td><td>Provisioning</td><td>Access control, notifications</td></tr>
          </tbody>
        </StyledTable>

        <Subheading3>3.3 Usage &amp; Operational Data</Subheading3>
        <StyledTable>
          <thead><tr><th>Data</th><th>Source</th><th>Purpose</th></tr></thead>
          <tbody>
            <tr><td>API request logs (metadata)</td><td>Control plane</td><td>Rate limiting, debugging, billing</td></tr>
            <tr><td>Alert delivery logs</td><td>Alert dispatcher</td><td>Delivery confirmation, retry</td></tr>
            <tr><td>Honeypot deployment logs</td><td>Deception engine</td><td>Lifecycle management, billing</td></tr>
            <tr><td>Forensic chain operations</td><td>Integrity module</td><td>Tamper evidence, compliance</td></tr>
          </tbody>
        </StyledTable>

        <Subheading3>3.4 Automated Collection</Subheading3>
        <StyledTable>
          <thead><tr><th>Technology</th><th>Purpose</th></tr></thead>
          <tbody>
            <tr><td>TLS certificates</td><td>Secure communication</td></tr>
            <tr><td>Server logs (access, error)</td><td>Availability, debugging, security</td></tr>
            <tr><td>Docker container metrics</td><td>Resource management, scaling</td></tr>
          </tbody>
        </StyledTable>

        <Divider />

        {/* 4. How We Use Your Information */}
        <Subheading>4. How We Use Your Information</Subheading>

        <Subheading3>4.1 Core Services (Contractual Necessity)</Subheading3>
        <BulletList>
          <li><B>Threat Detection:</B> Score telemetry, detect anomalies, classify threats</li>
          <li><B>Alerting:</B> Generate HMAC-signed alerts, deliver via webhooks</li>
          <li><B>Deception:</B> Deploy honeypots, redirect attackers, capture intelligence</li>
          <li><B>Forensics:</B> Maintain tamper-evident chain, support investigations</li>
        </BulletList>

        <Subheading3>4.2 Service Improvement (Legitimate Interest)</Subheading3>
        <BulletList>
          <li><B>Model Improvement:</B> Aggregate, anonymized telemetry for ML retraining</li>
          <li><B>Rule Tuning:</B> False positive/negative analysis for rule refinement</li>
          <li><B>Performance Optimization:</B> Latency, throughput, resource optimization</li>
        </BulletList>

        <Subheading3>4.3 Compliance &amp; Security (Legal Obligation)</Subheading3>
        <BulletList>
          <li><B>Audit Trails:</B> Immutable forensic chain for compliance</li>
          <li><B>Incident Response:</B> Breach investigation, notification</li>
          <li><B>Regulatory:</B> GDPR, Indian DPDP Act, sector-specific requirements</li>
        </BulletList>

        <Subheading3>4.4 Communications (Consent / Legitimate Interest)</Subheading3>
        <BulletList>
          <li><B>Transactional:</B> Service alerts, billing, security notices</li>
          <li><B>Product Updates:</B> Feature releases, deprecations (opt-out available)</li>
          <li><B>Marketing:</B> Only with explicit opt-in (unsubscribe anytime)</li>
        </BulletList>

        <Divider />

        {/* 5. Legal Bases (GDPR / DPDP Act) */}
        <Subheading>5. Legal Bases (GDPR / DPDP Act)</Subheading>
        <StyledTable>
          <thead><tr><th>Processing</th><th>GDPR Basis</th><th>DPDP Act Basis</th></tr></thead>
          <tbody>
            <tr><td>Core detection/alerting</td><td>Contract (Art. 6.1.b)</td><td>Contract performance</td></tr>
            <tr><td>Forensic chain</td><td>Legal obligation (Art. 6.1.c)</td><td>Legal obligation</td></tr>
            <tr><td>Alert webhooks</td><td>Contract + Legitimate interest</td><td>Contract</td></tr>
            <tr><td>Model improvement</td><td>Legitimate interest (Art. 6.1.f)</td><td>Legitimate interest</td></tr>
            <tr><td>Marketing emails</td><td>Consent (Art. 6.1.a)</td><td>Consent</td></tr>
            <tr><td>Security logs</td><td>Legitimate interest</td><td>Legitimate interest</td></tr>
          </tbody>
        </StyledTable>
        <Paragraph><B>Right to Object:</B> You may object to legitimate interest processing (model improvement, security analytics) at any time.</Paragraph>

        <Divider />

        {/* 6. Data Sharing & Disclosure */}
        <Subheading>6. Data Sharing &amp; Disclosure</Subheading>
        
        <Subheading3>6.1 We Do NOT Sell Your Data</Subheading3>
        <Paragraph>We never sell Customer Data or telemetry to third parties.</Paragraph>

        <Subheading3>6.2 Service Providers (Processors)</Subheading3>
        <StyledTable>
          <thead><tr><th>Category</th><th>Providers</th><th>Safeguards</th></tr></thead>
          <tbody>
            <tr><td>Cloud Infrastructure</td><td>Hetzner, DigitalOcean, AWS, Azure</td><td>DPA, SCCs, EU/India regions</td></tr>
            <tr><td>Email/Delivery</td><td>SendGrid, AWS SES</td><td>DPA, TLS</td></tr>
            <tr><td>Monitoring</td><td>Datadog, Prometheus</td><td>DPA, data minimization</td></tr>
            <tr><td>Error Tracking</td><td>Sentry</td><td>DPA, data minimization</td></tr>
          </tbody>
        </StyledTable>
        <Paragraph><B>All processors:</B> DPA in place, EU/India data residency options, security addenda.</Paragraph>

        <Subheading3>6.3 Legal Disclosure</Subheading3>
        <Paragraph>We disclose only when legally compelled:</Paragraph>
        <BulletList>
          <li>Valid court order, subpoena, government request</li>
          <li>To protect life/safety (emergency)</li>
          <li>To enforce our rights (fraud, abuse)</li>
          <li>Corporate transaction (merger, acquisition) — with notice</li>
        </BulletList>
        <Paragraph><B>We notify you</B> unless legally prohibited (gag order).</Paragraph>

        <Divider />

        {/* 7. Data Retention & Deletion */}
        <Subheading>7. Data Retention &amp; Deletion</Subheading>
        <StyledTable>
          <thead><tr><th>Data Category</th><th>Retention</th><th>Deletion Method</th></tr></thead>
          <tbody>
            <tr><td>Telemetry/Ingestion</td><td>30 days (configurable)</td><td>Auto-purge, secure erase</td></tr>
            <tr><td>Forensic Chain</td><td>7 years (configurable)</td><td>Pruning with chain integrity</td></tr>
            <tr><td>Alerts/Logs</td><td>2 years</td><td>Auto-purge, secure erase</td></tr>
            <tr><td>API Logs</td><td>90 days</td><td>Auto-purge</td></tr>
            <tr><td>Account Data</td><td>Duration + 2 years</td><td>Secure erase on deletion</td></tr>
            <tr><td>Backups</td><td>30 days</td><td>Encrypted, geo-redundant</td></tr>
          </tbody>
        </StyledTable>
        <Paragraph><B>Deletion on Request:</B> We delete within 30 days of verified request (subject to legal hold).</Paragraph>

        <Divider />

        {/* 8. Data Security */}
        <Subheading>8. Data Security</Subheading>

        <Subheading3>Technical Measures</Subheading3>
        <BulletList>
          <li><B>Encryption in Transit:</B> TLS 1.3 (AES-256-GCM) everywhere</li>
          <li><B>Encryption at Rest:</B> AES-256 for SQLite, Parquet, backups</li>
          <li><B>API Keys:</B> SHA-256 hashed, never stored in plaintext</li>
          <li><B>Webhook Signatures:</B> HMAC-SHA256 per tenant secret</li>
          <li><B>Forensic Chain:</B> Trinity Hash (SHA-256 + SHA3-256 + BLAKE2b) + HMAC</li>
        </BulletList>

        <Subheading3>Access Controls</Subheading3>
        <BulletList>
          <li><B>Principle of Least Privilege:</B> Role-based access (Admin, Operator, Viewer)</li>
          <li><B>MFA:</B> Required for admin console</li>
          <li><B>Audit Logs:</B> All admin actions logged to forensic chain</li>
        </BulletList>

        <Subheading3>Certifications &amp; Standards</Subheading3>
        <BulletList>
          <li><B>SOC 2 Type II:</B> In progress (target Q4 2026)</li>
          <li><B>ISO 27001:</B> Target Q1 2027</li>
          <li><B>ISO 27701:</B> Privacy extension target Q2 2027</li>
          <li><B>DPDP Act:</B> Compliant by design</li>
        </BulletList>

        <Divider />

        {/* 9. Your Rights */}
        <Subheading>9. Your Rights (GDPR / DPDP Act)</Subheading>
        <StyledTable>
          <thead><tr><th>Right</th><th>Description</th><th>How to Exercise</th></tr></thead>
          <tbody>
            <tr><td><B>Access</B></td><td>Copy of your data</td><td>Dashboard → Settings → Export Data</td></tr>
            <tr><td><B>Rectification</B></td><td>Correct inaccurate data</td><td>Dashboard → Settings → Edit</td></tr>
            <tr><td><B>Erasure</B></td><td>Delete your data</td><td>Dashboard → Settings → Delete Account</td></tr>
            <tr><td><B>Restriction</B></td><td>Limit processing</td><td>privacy@emmatech.in</td></tr>
            <tr><td><B>Portability</B></td><td>Machine-readable export</td><td>Dashboard → Export (JSON/Parquet)</td></tr>
            <tr><td><B>Object</B></td><td>Stop processing</td><td>privacy@emmatech.in</td></tr>
            <tr><td><B>Withdraw Consent</B></td><td>Marketing emails</td><td>Unsubscribe link in email</td></tr>
            <tr><td><B>Complain</B></td><td>Supervisory authority</td><td>DPA (India), EDPS (EU)</td></tr>
          </tbody>
        </StyledTable>
        <Paragraph><B>Response Time:</B> 30 days (extendable to 60 for complex requests).</Paragraph>

        <Divider />

        {/* 10. International Transfers */}
        <Subheading>10. International Transfers</Subheading>
        <Paragraph><B>Default:</B> India + EU Regions</Paragraph>
        <StyledTable>
          <thead><tr><th>Mechanism</th><th>Applies To</th></tr></thead>
          <tbody>
            <tr><td><B>Adequacy</B></td><td>India (DPDP Act adequacy pending)</td></tr>
            <tr><td><B>SCCs</B></td><td>EU → non-adequate countries</td></tr>
            <tr><td><B>BCRs</B></td><td>Not applicable (no group)</td></tr>
            <tr><td><B>Derogations</B></td><td>Explicit consent, contract necessity</td></tr>
          </tbody>
        </StyledTable>
        <Paragraph><B>Your Choice:</B> Select deployment region at provisioning (EU, India, US-East, AP-South).</Paragraph>

        <Divider />

        {/* 11. Additional Provisions */}
        <Subheading>11. Children's Privacy</Subheading>
        <Paragraph>
          <B>Not for children under 18.</B> We do not knowingly collect data from minors. If discovered, we delete immediately.
        </Paragraph>

        <Subheading>12. Changes to This Policy</Subheading>
        <BulletList>
          <li><B>Material changes:</B> 30 days notice via email + dashboard banner</li>
          <li><B>Minor changes:</B> Updated in-place, "Last Updated" date revised</li>
          <li><B>Version history:</B> Available at emmatech.in/privacy/history</li>
        </BulletList>

        <Divider />

        {/* 13. Contact Us */}
        <Subheading>13. Contact Us</Subheading>
        <StyledTable>
          <thead><tr><th>Purpose</th><th>Contact</th></tr></thead>
          <tbody>
            <tr><td><B>Privacy Questions</B></td><td><Link href="mailto:privacy@emmatech.in">privacy@emmatech.in</Link></td></tr>
            <tr><td><B>Data Subject Requests</B></td><td><Link href="mailto:dsr@emmatech.in">dsr@emmatech.in</Link></td></tr>
            <tr><td><B>Security Incidents</B></td><td><Link href="mailto:security@emmatech.in">security@emmatech.in</Link></td></tr>
            <tr><td><B>DPO</B></td><td><Link href="mailto:dpo@emmatech.in">dpo@emmatech.in</Link></td></tr>
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