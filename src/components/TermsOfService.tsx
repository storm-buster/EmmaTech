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
          <B>Last Updated:</B> July 15, 2026 &nbsp;|&nbsp; <B>Version:</B> 1.0 &nbsp;|&nbsp; <B>Effective Date:</B> July 15, 2026
        </Meta>

        <Divider />

        {/* 1. Agreement to Terms */}
        <Subheading>1. Agreement to Terms</Subheading>
        <Paragraph>
          By accessing or using the <B>RAPHA</B> cybersecurity platform ("RAPHA," "the Service," "the Platform") operated by <B>EmmaTech Private Limited</B> ("EmmaTech," "we," "our," "us"), you ("Customer," "you," "your") agree to be bound by these Terms of Service ("Terms").
        </Paragraph>
        <Paragraph>
          If you are entering into these Terms on behalf of an organization, you represent that you have authority to bind that organization to these Terms.
        </Paragraph>
        <Paragraph><B>Please read these Terms carefully.</B> If you do not agree, do not use the Service.</Paragraph>

        <Divider />

        {/* 2. Definitions */}
        <Subheading>2. Definitions</Subheading>
        <StyledTable>
          <thead><tr><th>Term</th><th>Definition</th></tr></thead>
          <tbody>
            <tr><td><B>Service</B></td><td>The RAPHA cybersecurity platform, including API, dashboard, honeypot infrastructure, and all related services</td></tr>
            <tr><td><B>Customer Data</B></td><td>All telemetry, logs, alerts, forensic chains, honeypot data, and configurations you submit</td></tr>
            <tr><td><B>Authorized Users</B></td><td>Your employees, contractors, agents authorized to use the Service</td></tr>
            <tr><td><B>API Key</B></td><td>Unique identifier for authenticating API requests</td></tr>
            <tr><td><B>Tenant</B></td><td>Your isolated environment within the multi-tenant platform</td></tr>
            <tr><td><B>Forensic Chain</B></td><td>Tamper-evident cryptographic ledger of security events</td></tr>
            <tr><td><B>Honeypot</B></td><td>Deception asset deployed to capture attacker activity</td></tr>
          </tbody>
        </StyledTable>

        <Divider />

        {/* 3. Service Description */}
        <Subheading>3. Service Description</Subheading>
        <Subheading3>3.1 What RAPHA Does</Subheading3>
        <Paragraph>RAPHA is an <B>autonomous cyber-defense platform</B> providing:</Paragraph>
        <BulletList>
          <li><B>Threat Detection:</B> Real-time network/host telemetry analysis via ML + rules</li>
          <li><B>Threat Classification:</B> 3-class output (Normal / Suspicious / Malicious) with confidence scores</li>
          <li><B>Forensic Chain:</B> Tamper-evident, cryptographically-linked audit trail of all events</li>
          <li><B>Autonomous Deception:</B> Honeypot deployment, attacker redirection, session capture</li>
          <li><B>Alert Delivery:</B> HMAC-signed webhooks to your SIEM, Slack, SOAR, email</li>
          <li><B>Multi-tenant Isolation:</B> Cryptographic tenant isolation with per-tenant forensic chains</li>
        </BulletList>

        <Subheading3>3.2 Deployment Models</Subheading3>
        <StyledTable>
          <thead><tr><th>Mode</th><th>Behavior</th></tr></thead>
          <tbody>
            <tr><td><B>Hosted Pilot</B></td><td>Cloud SaaS, detect + alert only</td></tr>
            <tr><td><B>Standalone Active</B></td><td>Self-hosted, detect + alert + deceive</td></tr>
          </tbody>
        </StyledTable>

        <Subheading3>3.3 Pilot Program Terms</Subheading3>
        <Paragraph><B>Current Phase:</B> Design-partner pilot program</Paragraph>
        <BulletList>
          <li><B>Duration:</B> 30 days (renewable by mutual agreement)</li>
          <li><B>Scope:</B> Up to 5 design partners</li>
          <li><B>Cost:</B> Free during pilot</li>
          <li><B>Support:</B> Business hours email, shared Slack channel</li>
          <li><B>SLA:</B> Best-effort (no financial SLA during pilot)</li>
        </BulletList>
        <Paragraph><B>Pilot Limitations:</B></Paragraph>
        <BulletList>
          <li>Single-instance deployment (no HA/failover)</li>
          <li>Rule-based detection primary; ML ensemble when model provided</li>
          <li>No production SLA — not for production-critical workloads</li>
          <li>No indemnification during pilot</li>
          <li>Data residency: India (Delhi) primary, EU (Frankfurt) available</li>
        </BulletList>
        <Paragraph><B>Design Partner Obligations:</B></Paragraph>
        <BulletList>
          <li>Monthly feedback (30-min call or written)</li>
          <li>Bug/incident reporting within 24 hours</li>
          <li>Quarterly product review participation</li>
          <li>Anonymized usage analytics for product improvement</li>
        </BulletList>

        <Divider />

        {/* 4. Customer Responsibilities */}
        <Subheading>4. Customer Responsibilities</Subheading>
        <Subheading3>4.1 Data &amp; Configuration</Subheading3>
        <BulletList>
          <li>Accuracy and legality of all telemetry sent to the API</li>
          <li>Securing API keys and webhook secrets (rotate regularly)</li>
          <li>Configuring webhook endpoints with HTTPS + HMAC verification</li>
          <li>Accurate tenant contact information for notifications</li>
        </BulletList>

        <Subheading3>4.2 Acceptable Use</Subheading3>
        <Paragraph><B>You shall NOT:</B></Paragraph>
        <BulletList>
          <li>Send malicious payloads designed to exploit the platform</li>
          <li>Attempt to access other tenants' data or forensic chains</li>
          <li>Reverse engineer ML models, detection rules, or deception logic</li>
          <li>Use the Service for illegal activities or attacking third parties</li>
          <li>Resell or redistribute the Service without written agreement</li>
          <li>Exceed rate limits (120 req/min per tenant IP)</li>
        </BulletList>

        <Subheading3>4.3 Compliance</Subheading3>
        <Paragraph>You are responsible for compliance with:</Paragraph>
        <BulletList>
          <li>Applicable data protection laws (GDPR, DPDP Act, CCPA)</li>
          <li>Industry regulations (PCI DSS, HIPAA, SOX where applicable)</li>
          <li>Export control and sanctions laws</li>
          <li>Your industry-specific security requirements</li>
        </BulletList>

        <Divider />

        {/* 5. Intellectual Property */}
        <Subheading>5. Intellectual Property</Subheading>
        <Subheading3>5.1 Our Rights</Subheading3>
        <Paragraph>EmmaTech retains all rights, title, and interest in:</Paragraph>
        <BulletList>
          <li>RAPHA platform, code, algorithms, models, detection rules</li>
          <li>Deception techniques, honeypot orchestration, forensic chain design</li>
          <li>Web console, API, documentation, trademarks ("RAPHA," "EmmaTech")</li>
        </BulletList>

        <Subheading3>5.2 Your Rights</Subheading3>
        <Paragraph>You retain ownership of:</Paragraph>
        <BulletList>
          <li>Your telemetry data, alerts, forensic chains (your Tenant Data)</li>
          <li>Custom detection rules you create</li>
          <li>Integration code you write for your environment</li>
        </BulletList>

        <Subheading3>5.3 License Grant</Subheading3>
        <Paragraph><B>We grant you:</B> Non-exclusive, non-transferable, revocable license to use the Service per these Terms.</Paragraph>
        <Paragraph><B>You grant us:</B> License to process your telemetry solely to provide the Service, improve detection, and generate forensic chains.</Paragraph>

        <Subheading3>5.4 Feedback License</Subheading3>
        <Paragraph>Any feedback, suggestions, or bug reports you provide are licensed to us royalty-free, perpetual, irrevocable, worldwide, for any purpose.</Paragraph>

        <Subheading3>5.5 No Reverse Engineering</Subheading3>
        <Paragraph>You may not:</Paragraph>
        <BulletList>
          <li>Reverse engineer, decompile, disassemble the Service</li>
          <li>Extract model weights, training data, or detection rules</li>
          <li>Create derivative works from the Service</li>
        </BulletList>

        <Divider />

        {/* 6. Data Protection & Privacy */}
        <Subheading>6. Data Protection &amp; Privacy</Subheading>
        <Paragraph>These Terms incorporate our <B>Privacy Policy</B> (incorporated by reference). By using the Service, you acknowledge our Privacy Policy.</Paragraph>
        <Paragraph>For EU/UK customers, our standard DPA (incorporating SCCs) applies automatically. Request our DPA at <Link href="mailto:legal@emmatech.in">legal@emmatech.in</Link>.</Paragraph>
        <Paragraph>We use subprocessors for infrastructure, email, monitoring. 30-day notice for new subprocessors.</Paragraph>

        <Subheading3>6.1 Data Residency</Subheading3>
        <BulletList>
          <li><B>Primary:</B> India (Delhi) / EU (Frankfurt)</li>
          <li><B>Backup:</B> Same region as primary</li>
          <li><B>On-prem option:</B> Available for enterprise (contact sales)</li>
        </BulletList>

        <Divider />

        {/* 7. Service Levels & Availability */}
        <Subheading>7. Service Levels &amp; Availability</Subheading>
        <Subheading3>7.1 Pilot SLA (Best Effort)</Subheading3>
        <StyledTable>
          <thead><tr><th>Metric</th><th>Target</th></tr></thead>
          <tbody>
            <tr><td>API Uptime</td><td>≥ 99.5% (best effort)</td></tr>
            <tr><td>API Latency (p99)</td><td>&lt; 2 seconds</td></tr>
            <tr><td>Alert Delivery</td><td>&lt; 30 seconds</td></tr>
            <tr><td>Honeypot Deploy</td><td>&lt; 60 seconds</td></tr>
          </tbody>
        </StyledTable>
        <Paragraph><B>No financial credits during pilot.</B> Post-pilot SLA negotiable.</Paragraph>

        <Subheading3>7.2 Maintenance &amp; Recovery</Subheading3>
        <BulletList>
          <li><B>Scheduled Maintenance:</B> Sundays 02:00–04:00 UTC (advance notice)</li>
          <li><B>RPO:</B> ≤ 1 hour (continuous WAL + volume snapshots)</li>
          <li><B>RTO:</B> ≤ 4 hours (single-instance restore)</li>
          <li><B>Backups:</B> Daily encrypted snapshots, 30-day retention</li>
        </BulletList>

        <Divider />

        {/* 8. Fees & Billing */}
        <Subheading>8. Fees &amp; Billing (Post-Pilot)</Subheading>
        <Paragraph><B>Free</B> for design partners during pilot period (30 days).</Paragraph>
        <Subheading3>8.1 Post-Pilot Pricing (Indicative)</Subheading3>
        <StyledTable>
          <thead><tr><th>Tier</th><th>Pricing</th><th>Includes</th></tr></thead>
          <tbody>
            <tr><td><B>Starter</B></td><td>₹18,000 /node/year</td><td>Up to 20 sensors, ML baseline, 30-day retention</td></tr>
            <tr><td><B>Growth</B></td><td>₹35,000 /node/year</td><td>Unlimited sensors, 8h SLA, full forensic chain</td></tr>
            <tr><td><B>Regulated</B></td><td>₹30L+ perpetual + 20% AMC</td><td>Air-gapped deploy, compliance ready, dedicated engineering</td></tr>
          </tbody>
        </StyledTable>
        <Paragraph><B>Note:</B> A node is one policy-enforced Orchestrator managing multiple sensors.</Paragraph>

        <Divider />

        {/* 9. Confidentiality */}
        <Subheading>9. Confidentiality</Subheading>
        <Paragraph>"Confidential Information" includes: API keys, detection rules, model architectures, threat intelligence, customer lists, pricing, roadmaps, and any non-public information marked or reasonably understood as confidential.</Paragraph>
        <BulletList>
          <li>Hold in strict confidence (same care as your own)</li>
          <li>Use only for performing obligations under these Terms</li>
          <li>Disclose only to Authorized Users with need-to-know</li>
          <li>Return/destroy upon termination</li>
        </BulletList>
        <Paragraph>Not confidential if: public through no fault of recipient, independently developed, received from third party without restriction, or required by law (with notice).</Paragraph>
        <Paragraph>Survives <B>3 years</B> post-termination (trade secrets: indefinite).</Paragraph>

        <Divider />

        {/* 10. Warranties & Disclaimers */}
        <Subheading>10. Warranties &amp; Disclaimers</Subheading>
        <Paragraph>EmmaTech warrants the Service will substantially conform to documentation. <B>Exclusive Remedy:</B> We will use commercially reasonable efforts to fix non-conformity.</Paragraph>
        <Disclaimer>
          THE SERVICE IS PROVIDED "AS IS" AND "AS AVAILABLE." TO THE MAXIMUM EXTENT PERMITTED BY LAW, WE DISCLAIM ALL WARRANTIES, EXPRESS OR IMPLIED, INCLUDING: MERCHANTABILITY, FITNESS FOR PARTICULAR PURPOSE, NON-INFRINGEMENT, TITLE, QUIET ENJOYMENT, ACCURACY, COMPLETENESS, RELIABILITY OF DETECTION, UNINTERRUPTED, ERROR-FREE, OR SECURE OPERATION.
        </Disclaimer>
        <Paragraph>RAPHA <B>reduces risk but does not eliminate it.</B> No security product can guarantee 100% threat prevention. You remain responsible for your overall security posture.</Paragraph>

        <Divider />

        {/* 11. Limitation of Liability */}
        <Subheading>11. Limitation of Liability</Subheading>
        <Disclaimer>
          TO THE MAXIMUM EXTENT PERMITTED BY LAW, EMMATECH'S TOTAL AGGREGATE LIABILITY SHALL NOT EXCEED THE GREATER OF: (A) FEES PAID IN THE 12 MONTHS PRECEDING THE CLAIM, OR (B) $10,000 USD.
        </Disclaimer>
        <Paragraph><B>In no event shall we be liable for:</B></Paragraph>
        <BulletList>
          <li>Indirect, incidental, special, consequential, punitive damages</li>
          <li>Loss of data, profits, revenue, business opportunity</li>
          <li>Security breaches, data breaches, or unauthorized access</li>
          <li>Failure to detect any specific threat or attack</li>
          <li>Third-party actions or equipment failures</li>
        </BulletList>
        <Paragraph>Cap does not apply to: (a) breach of confidentiality, (b) IP infringement, (c) gross negligence/willful misconduct, (d) bodily injury/death.</Paragraph>

        <Divider />

        {/* 12. Indemnification */}
        <Subheading>12. Indemnification</Subheading>
        <Subheading3>12.1 By You</Subheading3>
        <Paragraph>You indemnify us against claims arising from:</Paragraph>
        <BulletList>
          <li>Your Customer Data or use of the Service</li>
          <li>Your violation of these Terms or applicable law</li>
          <li>Your Authorized Users' actions</li>
        </BulletList>
        <Subheading3>12.2 By Us</Subheading3>
        <Paragraph>We indemnify you against third-party claims that the Service infringes IP rights, provided you: notify us promptly, grant us sole control of defense, and cooperate reasonably.</Paragraph>

        <Divider />

        {/* 13. Term & Termination */}
        <Subheading>13. Term &amp; Termination</Subheading>
        <BulletList>
          <li><B>Pilot:</B> 30 days from activation, auto-renews for successive 30-day periods</li>
          <li><B>Post-Pilot:</B> Annual or monthly per Order Form</li>
          <li><B>Termination for Convenience:</B> Either party may terminate with 30 days written notice</li>
        </BulletList>
        <Paragraph><B>Termination for Cause</B> — Immediate termination for:</Paragraph>
        <BulletList>
          <li>Material breach uncured after 15 days notice</li>
          <li>Non-payment (post-pilot) after 10 days notice</li>
          <li>Insolvency, bankruptcy, dissolution</li>
          <li>Regulatory prohibition</li>
        </BulletList>
        <Paragraph><B>Effect of Termination:</B></Paragraph>
        <BulletList>
          <li>Immediate cessation of Service access</li>
          <li>Customer Data export provided within 30 days (JSON/Parquet)</li>
          <li>Forensic chains exported in tamper-evident format</li>
          <li>All licenses revoked; return/destroy our Confidential Information</li>
          <li>Accrued fees immediately due</li>
        </BulletList>

        <Divider />

        {/* 14. General Provisions */}
        <Subheading>14. General Provisions</Subheading>
        <Paragraph><B>Governing Law:</B> Laws of India &nbsp;|&nbsp; <B>Exclusive Jurisdiction:</B> Courts of Delhi, India &nbsp;|&nbsp; <B>Language:</B> English</Paragraph>
        <Paragraph><em>For EU customers:</em> GDPR rights preserved; SCCs apply.</Paragraph>

        <Subheading3>14.1 Dispute Resolution</Subheading3>
        <OrderedList>
          <li>Good-faith negotiation (30 days)</li>
          <li>Mediation (ICC Mediation Rules, Delhi)</li>
          <li>Binding arbitration (ICC Arbitration Rules, Delhi, English, 1 arbitrator)</li>
        </OrderedList>

        <Paragraph><B>Force Majeure:</B> Neither party liable for delays due to events beyond reasonable control (natural disasters, war, strikes, government action, internet outages).</Paragraph>
        <Paragraph><B>Assignment:</B> Neither party may assign without prior written consent (not unreasonably withheld). Permitted: affiliate, acquirer of substantially all assets.</Paragraph>
        <Paragraph><B>Entire Agreement:</B> These Terms, Privacy Policy, DPA, Order Forms constitute the entire agreement. Supersedes all prior agreements.</Paragraph>
        <Paragraph><B>Amendments:</B> We may update Terms with 30 days notice. Continued use = acceptance. Material changes: email + dashboard notice.</Paragraph>
        <Paragraph><B>Severability:</B> If any provision is unenforceable, remainder remains in effect.</Paragraph>

        <Divider />

        {/* 15. Export Controls */}
        <Subheading>15. Export Controls</Subheading>
        <Paragraph>You comply with all applicable export controls (US EAR, EU Dual-Use, India SCOMET). You are not on any denied party list. The Service uses encryption (TLS 1.3, AES-256, HMAC-SHA256).</Paragraph>

        <Divider />

        {/* 16. Contact */}
        <Subheading>16. Contact</Subheading>
        <BulletList>
          <li><B>Legal:</B> <Link href="mailto:legal@emmatech.in">legal@emmatech.in</Link></li>
          <li><B>Security:</B> <Link href="mailto:security@emmatech.in">security@emmatech.in</Link></li>
          <li><B>Privacy:</B> <Link href="mailto:privacy@emmatech.in">privacy@emmatech.in</Link></li>
          <li><B>Support:</B> <Link href="mailto:support@emmatech.in">support@emmatech.in</Link></li>
        </BulletList>
        <Paragraph><B>EmmaTech Private Limited</B><br />Delhi, India</Paragraph>

        <Divider />

        <Paragraph style={{ textAlign: 'center', fontStyle: 'italic' }}>
          By using RAPHA, you acknowledge you have read, understood, and agree to these Terms of Service.
        </Paragraph>

      </ContentWrapper>
    </PageContainer>
  );
};