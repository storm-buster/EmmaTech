import type { ReactNode } from 'react';
import {
  Callout,
  CodeBlock,
  DocH1,
  DocH2,
  DocLead,
  DocLi,
  DocOl,
  DocP,
  DocUl,
  Flow,
  InlineCode,
} from '../components/docs/docsStyles';

/**
 * RAPHA customer documentation content.
 *
 * ACCURACY RULES (Phase 3): documents ONLY the current system.
 * - Windows agent + Windows Service installer exist; Linux installer does NOT.
 * - Enrollment tokens exist; customer-facing API-key management is NOT enabled.
 * - rapha.emmatech.in is NOT yet bound — never presented as currently live.
 * - X-Service-Token is an internal EmmaTech→RAPHA credential — never a customer credential.
 * - No raw credentials appear as if real.
 */

export interface DocNavItem {
  id: string;
  label: string;
}

export interface DocNavSection {
  title: string;
  items: DocNavItem[];
}

export const DOCS_NAV: DocNavSection[] = [
  {
    title: 'Getting Started',
    items: [
      { id: 'overview', label: 'Overview' },
      { id: 'architecture', label: 'Architecture' },
      { id: 'requirements', label: 'Requirements' },
      { id: 'quick-start', label: 'Quick Start' },
    ],
  },
  {
    title: 'Installation',
    items: [
      { id: 'windows', label: 'Windows' },
      { id: 'linux', label: 'Linux' },
    ],
  },
  {
    title: 'Sensors',
    items: [
      { id: 'register-sensor', label: 'Register a Sensor' },
      { id: 'web-console', label: 'Connect to Web Console' },
    ],
  },
  {
    title: 'Integrations',
    items: [{ id: 'web-services', label: 'Web Services' }],
  },
];

export interface DocPage {
  id: string;
  /** Page <h1> title. */
  title: string;
  /** Owning nav section title (for breadcrumb). */
  section: string;
  body: ReactNode;
}

// ── Page bodies ────────────────────────────────────────────────────────────

const overview = (
  <>
    <DocH1>Overview</DocH1>
    <DocLead>
      RAPHA is an autonomous cybersecurity and deception platform. Lightweight agents (sensors)
      run on your machines, stream telemetry to the RAPHA control plane, and the platform performs
      detection, raises alerts, and records tamper-evident forensic events for your organization.
    </DocLead>

    <DocH2>How it fits together</DocH2>
    <Flow
      caption="High-level customer data path"
      steps={[
        'Customer machine',
        'RAPHA Agent / Sensor',
        'RAPHA Control Plane',
        'Detection',
        'Alerts / Forensics',
        'RAPHA Web Console',
      ]}
    />
    <DocP>
      The agent collects telemetry from the machine it runs on and sends it to the control plane.
      Detection is performed server-side in the control plane; the agent does not make autonomous
      detection decisions on its own. Results surface as alerts and forensic records that you review
      in the RAPHA Web Console.
    </DocP>

    <Callout variant="note" title="What you manage in EmmaTech">
      <p>
        You create an EmmaTech account and organization, confirm your plan, and generate an
        enrollment token to register a sensor. Your EmmaTech organization maps to a dedicated RAPHA
        tenant that isolates your data.
      </p>
    </Callout>
  </>
);

const architecture = (
  <>
    <DocH1>Architecture</DocH1>
    <DocLead>
      A conceptual view of the RAPHA components a customer interacts with. Internal infrastructure
      details are intentionally omitted.
    </DocLead>

    <DocH2>Components</DocH2>
    <DocUl>
      <DocLi><strong>RAPHA Agent</strong> — the software installed on a customer machine; on Windows it runs as a background service.</DocLi>
      <DocLi><strong>Sensor</strong> — a registered agent instance that produces telemetry for your tenant.</DocLi>
      <DocLi><strong>Enrollment</strong> — the one-time process of joining a sensor to your tenant using an enrollment token.</DocLi>
      <DocLi><strong>Control Plane</strong> — the server side that ingests telemetry, coordinates tenants, and performs detection.</DocLi>
      <DocLi><strong>Detection Engine</strong> — server-side analysis that evaluates telemetry and produces findings.</DocLi>
      <DocLi><strong>Alerts</strong> — notifications generated from detections.</DocLi>
      <DocLi><strong>Forensics</strong> — append-only records that preserve an evidentiary trail of events.</DocLi>
      <DocLi><strong>Web Console</strong> — the interface where you review sensors, alerts, and forensics.</DocLi>
      <DocLi><strong>Tenant</strong> — the isolation boundary for a single customer organization.</DocLi>
    </DocUl>

    <DocH2>Tenant isolation</DocH2>
    <DocP>
      Each EmmaTech organization has its own RAPHA tenant. Sensors, telemetry, alerts, and forensic
      records are scoped to that tenant, so one organization cannot see another organization&rsquo;s
      data. Your enrollment tokens and sensors always belong to your tenant.
    </DocP>
    <Flow
      caption="Organization-to-tenant mapping"
      steps={['EmmaTech organization', 'RAPHA tenant', 'Sensors / telemetry / alerts / forensics']}
    />

    <Callout variant="note" title="Deployment status">
      <p>
        RAPHA is under active rollout. Not every component is fully deployed in the production
        environment yet; availability of specific capabilities depends on what is enabled for your
        organization. EmmaTech will tell you what is available for your tenant.
      </p>
    </Callout>
  </>
);

const requirements = (
  <>
    <DocH1>Requirements</DocH1>
    <DocLead>What you need before installing a RAPHA sensor.</DocLead>

    <DocH2>Windows</DocH2>
    <DocUl>
      <DocLi>A supported Windows environment as specified by the RAPHA release package you receive.</DocLi>
      <DocLi>Administrator rights on the target machine (installing a Windows Service requires elevation).</DocLi>
      <DocLi>Outbound network access to your RAPHA control-plane URL over HTTPS.</DocLi>
      <DocLi>A valid RAPHA <strong>enrollment token</strong> generated from your EmmaTech account.</DocLi>
    </DocUl>
    <DocP>
      After installation the agent runs as a Windows Service, so it keeps running in the background
      and starts automatically with the machine.
    </DocP>
    <Callout variant="note" title="Supported versions">
      <p>
        Use a supported Windows environment specified by the RAPHA release package. Do not assume a
        specific Windows version beyond what your release package states.
      </p>
    </Callout>

    <DocH2>Linux</DocH2>
    <Callout variant="unavailable">
      <p>Linux agent installation is currently not generally available. Support is planned.</p>
    </Callout>
  </>
);

const quickStart = (
  <>
    <DocH1>Quick Start</DocH1>
    <DocLead>Go from a new account to a registered sensor. Windows is the supported path today.</DocLead>

    <DocOl>
      <DocLi>Create an EmmaTech account.</DocLi>
      <DocLi>Sign in.</DocLi>
      <DocLi>Open the RAPHA deployment page in the customer portal.</DocLi>
      <DocLi>Confirm your organization and plan.</DocLi>
      <DocLi>Generate an enrollment token.</DocLi>
      <DocLi>Install the RAPHA Agent on the target Windows machine.</DocLi>
      <DocLi>Provide the enrollment token to the installer.</DocLi>
      <DocLi>Verify that the RAPHA Windows Service is running.</DocLi>
      <DocLi>Open the RAPHA Web Console once your organization has access to it.</DocLi>
      <DocLi>Verify that the sensor appears.</DocLi>
    </DocOl>

    <Callout variant="warning" title="Two different credentials">
      <p>
        <strong>Enrollment token</strong> — a credential used to register a RAPHA sensor. This is
        what the installer needs.
      </p>
      <p>
        <strong>API key</strong> — a credential intended for API integrations. It is a different
        credential type. An enrollment token is <em>not</em> an API key; do not use one where the
        other is expected.
      </p>
    </Callout>
  </>
);

const windows = (
  <>
    <DocH1>Windows Installation</DocH1>
    <DocLead>
      Install the RAPHA Agent as a Windows Service using the PowerShell installer from your release
      package.
    </DocLead>

    <Callout variant="warning" title="Use your release package">
      <p>
        Command details and artifact hosting are configured per release. Always use the exact
        installer command and package provided to your organization by EmmaTech. The example below
        shows the current parameter shape, not a fixed download.
      </p>
    </Callout>

    <DocH2>1. Prerequisites</DocH2>
    <DocUl>
      <DocLi>Administrator PowerShell on a supported Windows machine.</DocLi>
      <DocLi>The RAPHA agent release package for your organization.</DocLi>
      <DocLi>Your RAPHA control-plane base URL (provided by EmmaTech).</DocLi>
    </DocUl>

    <DocH2>2. Obtain an enrollment token</DocH2>
    <DocP>
      In the EmmaTech customer portal, open the RAPHA deployment page and generate an enrollment
      token. It is shown once — copy it immediately and treat it as a sensitive credential.
    </DocP>

    <DocH2>3. Run the installer</DocH2>
    <DocP>
      From an elevated PowerShell prompt in the package directory, run the installer with your
      enrollment token and control-plane URL. <InlineCode>-SensorName</InlineCode> is optional.
    </DocP>
    <CodeBlock label="PowerShell (Administrator)">{`.\\install-rapha.ps1 \`
  -EnrollmentToken "renr_XXXXXXXXXXXX" \`
  -BaseUrl "https://rapha.emmatech.in" \`
  -SensorName "WIN-SRV-01"`}</CodeBlock>
    <Callout variant="note" title="About the values above">
      <p>
        <InlineCode>renr_XXXXXXXXXXXX</InlineCode> is a placeholder — paste your real generated
        token. <InlineCode>https://rapha.emmatech.in</InlineCode> is shown as an example production
        URL; use the exact control-plane URL EmmaTech provides for your organization.
      </p>
    </Callout>

    <DocH2>4. Registration</DocH2>
    <DocP>
      The installer uses the enrollment token to register the sensor into your tenant and stores the
      resulting machine credential locally. The token itself is not written to the command history
      argument list of the underlying process.
    </DocP>

    <DocH2>5. Service installation</DocH2>
    <DocP>
      The installer registers a Windows Service (managed via WinSW) named{' '}
      <InlineCode>RAPHAAgent</InlineCode>, installed by default under{' '}
      <InlineCode>%ProgramFiles%\\RAPHA\\Agent</InlineCode> with data under{' '}
      <InlineCode>%ProgramData%\\RAPHA</InlineCode>.
    </DocP>

    <DocH2>6. Service startup</DocH2>
    <DocP>The service is configured to start automatically and run in the background.</DocP>

    <DocH2>7. Verification</DocH2>
    <CodeBlock label="PowerShell">{`Get-Service -Name RAPHAAgent`}</CodeBlock>
    <DocP>
      A <InlineCode>Running</InlineCode> status indicates the agent service is active. You can then
      confirm the sensor appears in the Web Console once your organization has access to it.
    </DocP>

    <DocH2>8. Uninstallation</DocH2>
    <CodeBlock label="PowerShell (Administrator)">{`.\\uninstall-rapha.ps1`}</CodeBlock>
    <DocP>
      Uninstalling removes the local service and agent files. Removing the local agent does not by
      itself delete the sensor record on the server side.
    </DocP>

    <DocH2>9. Troubleshooting</DocH2>
    <DocUl>
      <DocLi>Run PowerShell as Administrator — service installation requires elevation.</DocLi>
      <DocLi>Confirm the machine can reach your control-plane URL over HTTPS.</DocLi>
      <DocLi>Ensure the enrollment token is valid and has not expired; generate a new one if needed.</DocLi>
      <DocLi>Check the agent logs under <InlineCode>%ProgramData%\\RAPHA\\logs</InlineCode>.</DocLi>
    </DocUl>
  </>
);

const linux = (
  <>
    <DocH1>Linux</DocH1>
    <DocLead>Support status for the Linux RAPHA Agent.</DocLead>
    <Callout variant="unavailable">
      <p>Linux agent installation is currently not generally available.</p>
    </Callout>
    <DocP>
      Linux support is planned. There is no supported Linux installer command at this time, so this
      page intentionally does not provide one. When Linux support becomes generally available, this
      page will document the supported installation steps.
    </DocP>
    <DocP>For now, use the Windows agent for sensor deployment.</DocP>
  </>
);

const registerSensor = (
  <>
    <DocH1>Register a Sensor</DocH1>
    <DocLead>How a sensor joins your RAPHA tenant using an enrollment token.</DocLead>

    <Flow
      caption="Enrollment model"
      steps={[
        'EmmaTech account',
        'Organization',
        'RAPHA tenant',
        'Enrollment token',
        'RAPHA Agent',
        'Sensor registration',
      ]}
    />

    <DocH2>Enrollment tokens</DocH2>
    <DocUl>
      <DocLi>Scoped to your organization&rsquo;s RAPHA tenant — a token can only register a sensor into your tenant.</DocLi>
      <DocLi>Temporary — they expire.</DocLi>
      <DocLi>One-time credentials per the RAPHA enrollment model.</DocLi>
    </DocUl>

    <Callout variant="warning" title="Treat tokens as secrets">
      <p>
        Enrollment tokens are sensitive credentials. Generate a token only when you are ready to
        install, use it immediately, and never share it or commit it to source control. If a token
        is exposed, generate a new one.
      </p>
    </Callout>

    <DocP>
      During installation you provide the token to the Windows installer (see{' '}
      <InlineCode>Windows Installation</InlineCode>). The agent exchanges it for a durable machine
      credential and the sensor becomes part of your tenant.
    </DocP>
  </>
);

const webConsole = (
  <>
    <DocH1>Connect to Web Console</DocH1>
    <DocLead>Reviewing your registered sensors in the RAPHA Web Console.</DocLead>

    <DocOl>
      <DocLi>Sign into EmmaTech.</DocLi>
      <DocLi>Complete RAPHA setup for your organization.</DocLi>
      <DocLi>Install and register the sensor on your machine.</DocLi>
      <DocLi>Open the RAPHA Web Console.</DocLi>
      <DocLi>Verify the registered sensor.</DocLi>
    </DocOl>

    <Callout variant="warning" title="Console availability">
      <p>
        The production RAPHA Web Console will be available at the organization console URL provided
        by EmmaTech. A custom domain such as <InlineCode>rapha.emmatech.in</InlineCode> is a{' '}
        <strong>planned/future production URL</strong> and is not guaranteed to be live yet — do not
        assume it currently works.
      </p>
      <p>Once your organization has access to the console, open the URL EmmaTech provides for you.</p>
    </Callout>
  </>
);

const webServices = (
  <>
    <DocH1>Web Services Integration</DocH1>
    <DocLead>
      Integrating RAPHA with external systems through its server-side API capabilities, where
      enabled for your organization.
    </DocLead>

    <DocH2>Two credential types</DocH2>
    <DocUl>
      <DocLi><strong>Enrollment token</strong> — used to register a sensor. Not for API calls.</DocLi>
      <DocLi><strong>API key</strong> — used for API authentication in integrations.</DocLi>
    </DocUl>

    <Callout variant="note" title="API-key management is live">
      <p>
        Manage API keys in the <strong>RAPHA Console → API Keys</strong> (listed directly under
        Overview). API keys are a separate credential type from enrollment tokens and authenticate
        your REST integrations.
      </p>
    </Callout>

    <DocH2>Managing API keys</DocH2>
    <DocUl>
      <DocLi><strong>Where</strong> — open the RAPHA Console and select <strong>API Keys</strong>.</DocLi>
      <DocLi><strong>Create</strong> — give the key a name; it is issued with the <code>ingest</code> scope.</DocLi>
      <DocLi><strong>Rotate</strong> — issues a new secret and stops the previous key from working immediately.</DocLi>
      <DocLi><strong>Revoke</strong> — permanently disables a key.</DocLi>
    </DocUl>

    <Callout variant="note" title="The secret is shown once">
      <p>
        The raw API key is displayed <strong>only once</strong> — immediately after create or
        rotate. Copy it then; it cannot be retrieved again. Listing your keys shows metadata only
        (name, scope, status, created time) and <strong>never</strong> returns the secret.
      </p>
    </Callout>

    <DocH2>Using an API key</DocH2>
    <DocP>
      Send the API key as the credential your integration requires (never your enrollment token,
      and never an internal service token). Store it in your own secrets manager, and rotate or
      revoke it from the Console if it is ever exposed.
    </DocP>

    <Callout variant="note" title="A note on internal credentials">
      <p>
        Service-to-service authentication between EmmaTech and RAPHA is handled internally by
        EmmaTech and is never exposed to customers. You will never need an internal service token to
        use RAPHA.
      </p>
    </Callout>
  </>
);

export const DOC_PAGES: Record<string, DocPage> = {
  overview: { id: 'overview', title: 'Overview', section: 'Getting Started', body: overview },
  architecture: { id: 'architecture', title: 'Architecture', section: 'Getting Started', body: architecture },
  requirements: { id: 'requirements', title: 'Requirements', section: 'Getting Started', body: requirements },
  'quick-start': { id: 'quick-start', title: 'Quick Start', section: 'Getting Started', body: quickStart },
  windows: { id: 'windows', title: 'Windows Installation', section: 'Installation', body: windows },
  linux: { id: 'linux', title: 'Linux', section: 'Installation', body: linux },
  'register-sensor': { id: 'register-sensor', title: 'Register a Sensor', section: 'Sensors', body: registerSensor },
  'web-console': { id: 'web-console', title: 'Connect to Web Console', section: 'Sensors', body: webConsole },
  'web-services': { id: 'web-services', title: 'Web Services', section: 'Integrations', body: webServices },
};

/** Flat page order (matches the sidebar) for prev/next navigation. */
export const DOCS_ORDER: string[] = DOCS_NAV.flatMap((s) => s.items.map((i) => i.id));

export const DEFAULT_DOC_ID = 'overview';

/** Resolve a doc id, falling back to the default. */
export function resolveDocId(id: string | undefined | null): string {
  return id && DOC_PAGES[id] ? id : DEFAULT_DOC_ID;
}
