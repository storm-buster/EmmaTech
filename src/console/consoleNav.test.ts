import { describe, it, expect } from 'vitest';
import { CONSOLE_NAV, consoleHash, sectionFromHash } from './consoleNav';

describe('console navigation', () => {
  it('lists API Keys directly below Overview and above Sensors', () => {
    const ids = CONSOLE_NAV.map((s) => s.id);
    expect(ids[0]).toBe('overview');
    expect(ids[1]).toBe('api-keys');
    expect(ids[2]).toBe('sensors');
    expect(CONSOLE_NAV.find((s) => s.id === 'api-keys')?.label).toBe('API Keys');
  });

  it('routes the api-keys hash', () => {
    expect(sectionFromHash('#/console/api-keys')).toBe('api-keys');
    expect(consoleHash('api-keys')).toBe('#/console/api-keys');
  });
});
