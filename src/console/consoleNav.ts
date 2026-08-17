/**
 * RAPHA Customer Console navigation configuration (Phase 7A).
 *
 * Single source of truth for the console's sections and hash sub-routing
 * (`#/console/<id>`). Overview is real (fed by existing EmmaTech APIs); the
 * data sections are present as destinations but show honest deferred states
 * until the RAPHA customer read APIs are connected in Phase 7B.
 */

export type ConsoleSectionId = 'overview' | 'sensors' | 'telemetry' | 'alerts' | 'forensics';

export interface ConsoleNavItem {
  id: ConsoleSectionId;
  label: string;
  /** Whether the section renders real data today (Overview) vs a deferred state. */
  live: boolean;
}

export const CONSOLE_NAV: ConsoleNavItem[] = [
  { id: 'overview', label: 'Overview', live: true },
  { id: 'sensors', label: 'Sensors', live: false },
  { id: 'telemetry', label: 'Telemetry', live: false },
  { id: 'alerts', label: 'Alerts', live: false },
  { id: 'forensics', label: 'Forensics', live: false },
];

export const DEFAULT_CONSOLE_SECTION: ConsoleSectionId = 'overview';

const VALID_IDS = new Set<string>(CONSOLE_NAV.map((s) => s.id));

/** Resolve a section id, falling back to the default. */
export function resolveConsoleSection(id: string | undefined | null): ConsoleSectionId {
  return id && VALID_IDS.has(id) ? (id as ConsoleSectionId) : DEFAULT_CONSOLE_SECTION;
}

/** Build the hash for a console section (overview → `#/console`). */
export function consoleHash(id: ConsoleSectionId): string {
  return id === DEFAULT_CONSOLE_SECTION ? '#/console' : `#/console/${id}`;
}

/** Parse the active section from a hash like `#/console/telemetry`. */
export function sectionFromHash(hash: string): ConsoleSectionId {
  const match = hash.match(/^#\/console\/?([^/?#]*)/i);
  return resolveConsoleSection(match ? match[1] : DEFAULT_CONSOLE_SECTION);
}
