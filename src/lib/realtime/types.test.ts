import { describe, expect, it } from 'vitest';
import { toScanStatusEvent, toUiScanStatus } from '@/lib/realtime/types';

describe('toUiScanStatus', () => {
  it('maps the backend PENDING state onto the SCANNING label the UI uses', () => {
    expect(toUiScanStatus('PENDING')).toBe('SCANNING');
  });

  it('passes terminal states through unchanged', () => {
    expect(toUiScanStatus('SUCCESS')).toBe('SUCCESS');
    expect(toUiScanStatus('FAILED')).toBe('FAILED');
  });
});

describe('toScanStatusEvent', () => {
  it('prefers scanId when the payload carries both identifiers', () => {
    const event = toScanStatusEvent({
      projectId: 'p1',
      scanId: 's1',
      id: 's2',
      status: 'SUCCESS',
    });
    expect(event).toEqual({ projectId: 'p1', scanId: 's1', status: 'SUCCESS' });
  });

  it('falls back to id when scanId is absent', () => {
    expect(toScanStatusEvent({ projectId: 'p1', id: 's2', status: 'PENDING' })).toEqual({
      projectId: 'p1',
      scanId: 's2',
      status: 'SCANNING',
    });
  });

  it('yields an empty scanId when neither identifier is present', () => {
    expect(toScanStatusEvent({ projectId: 'p1', status: 'FAILED' }).scanId).toBe('');
  });
});
