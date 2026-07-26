import { describe, expect, it } from 'vitest';
import {
  classifySystemNotification,
  pickSystemNotificationKind,
} from '@/features/notification/lib/classify';

describe('classifySystemNotification', () => {
  it('reads a comment from the related comment id, whatever the title says', () => {
    expect(
      classifySystemNotification({
        relatedCommentId: 'c1',
        relatedIssueId: 'i1',
      }),
    ).toBe('comment');
  });

  it('reads an assignment from an issue with no comment attached', () => {
    expect(classifySystemNotification({ relatedIssueId: 'i1' })).toBe('assignment');
  });

  it('reads a quality gate from a scan with no issue attached', () => {
    expect(
      classifySystemNotification({
        relatedScanId: 's1',
        relatedProjectId: 'p1',
      }),
    ).toBe('qualityGate');
  });

  it('falls back to generic when nothing specific is attached', () => {
    expect(classifySystemNotification({ relatedProjectId: 'p1' })).toBe('generic');
    expect(classifySystemNotification({})).toBe('generic');
  });
});

describe('pickSystemNotificationKind', () => {
  it('surfaces the quality gate ahead of everything else in a mixed batch', () => {
    expect(
      pickSystemNotificationKind([
        { relatedIssueId: 'i1' },
        { relatedScanId: 's1' },
        { relatedCommentId: 'c1' },
      ]),
    ).toBe('qualityGate');
  });

  it('prefers a comment over an assignment', () => {
    expect(pickSystemNotificationKind([{ relatedIssueId: 'i1' }, { relatedCommentId: 'c1' }])).toBe(
      'comment',
    );
  });

  it('returns generic for an empty batch', () => {
    expect(pickSystemNotificationKind([])).toBe('generic');
  });
});
