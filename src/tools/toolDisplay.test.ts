// Friendly tool-name + arg display. Locks in the behavior the transcript
// and permission prompt depend on.

import { describe, expect, it } from 'vitest';
import { displayToolName, formatToolResult, primaryToolArg } from './toolDisplay.js';

describe('displayToolName', () => {
  it('maps the browser navigate tool to "Browser"', () => {
    expect(displayToolName('mcp_browser_browser_navigate')).toBe('Browser');
  });
  it('maps load_skill to "Skill"', () => {
    expect(displayToolName('load_skill')).toBe('Skill');
  });
  it('passes unknown tools through unchanged', () => {
    expect(displayToolName('shell')).toBe('shell');
    expect(displayToolName('confirm_finding')).toBe('confirm_finding');
  });
});

describe('primaryToolArg', () => {
  it('extracts the browser url', () => {
    expect(primaryToolArg('mcp_browser_browser_navigate', { url: 'https://x.test' })).toBe(
      'https://x.test',
    );
  });
  it('extracts the shell/bash command', () => {
    expect(primaryToolArg('shell', { command: 'id' })).toBe('id');
    expect(primaryToolArg('bash', { command: 'ls -la' })).toBe('ls -la');
    expect(primaryToolArg('BashTool', { command: 'whoami' })).toBe('whoami');
  });
  it('formats confirm_finding as (severity) title, or title alone', () => {
    expect(primaryToolArg('confirm_finding', { severity: 'high', title: 'XSS' })).toBe(
      '(high) XSS',
    );
    expect(primaryToolArg('confirm_finding', { title: 'XSS' })).toBe('XSS');
  });
  it('extracts the skill name for load_skill', () => {
    expect(primaryToolArg('load_skill', { name: 'webvuln' })).toBe('webvuln');
  });
  it('returns null for unknown tools or missing/empty fields', () => {
    expect(primaryToolArg('http', { url: 'x' })).toBeNull();
    expect(primaryToolArg('shell', {})).toBeNull();
    expect(primaryToolArg('mcp_browser_browser_navigate', { url: '' })).toBeNull();
    expect(primaryToolArg('confirm_finding', {})).toBeNull();
  });
});

describe('formatToolResult', () => {
  it('renders browser_capture_status as a compact one-liner', () => {
    const json = JSON.stringify({
      requests: 0,
      endpoints: 0,
      snapshots: 0,
      lastActivityAt: 'never',
    });
    expect(formatToolResult('browser_capture_status', json)).toBe(
      'requests: 0 · endpoints: 0 · snapshots: 0 · last activity: never',
    );
  });
  it('renders load_skill as a compact skill summary', () => {
    const skillBody = [
      '# Skill: webvuln',
      '',
      '# Web vuln hunting playbook',
      '',
      'Full model-facing body.',
      '',
      '## 1. Triage the target',
      '## 2. Known-CVE pass',
    ].join('\n');
    expect(formatToolResult('load_skill', skillBody)).toBe(
      [
        'loaded skill: webvuln',
        'playbook: Web vuln hunting playbook',
        'sections: 1. Triage the target · 2. Known-CVE pass',
      ].join('\n'),
    );
  });
  it('falls back (null) for other tools or malformed JSON', () => {
    expect(formatToolResult('shell', '{}')).toBeNull();
    expect(formatToolResult('browser_capture_status', 'not json')).toBeNull();
    expect(formatToolResult('load_skill', '# Missing skill heading')).toBeNull();
  });
});
