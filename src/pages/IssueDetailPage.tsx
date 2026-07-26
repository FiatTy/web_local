import { useMemo, useState } from 'react';
import { useNavigate, useParams } from 'react-router';
import { useTranslation } from 'react-i18next';
import {
  ArrowLeft,
  Check,
  Copy,
  CornerDownRight,
  Download,
  Loader2,
  MessageSquare,
  Send,
  Sparkles,
  TriangleAlert,
  UserPlus,
  type LucideIcon,
} from 'lucide-react';
import { useAuth } from '@/lib/auth/auth-context';
import { useToast } from '@/lib/toast/toast-context';
import { AssignIssueModal } from '@/features/issue/components/AssignIssueModal';
import {
  useAddIssueComment,
  useIssue,
  useIssueAnalysis,
  useTriggerAiFix,
} from '@/features/issue/hooks/useIssue';
import { useIssueCommentStream } from '@/features/issue/hooks/useIssueCommentStream';
import type { IssueComment } from '@/features/issue/types';

const SEVERITY_BADGE: Record<string, string> = {
  BLOCKER: 'bg-blocker/12 text-blocker',
  CRITICAL: 'bg-critical/12 text-critical',
  MAJOR: 'bg-major/12 text-major',
  MINOR: 'bg-minor/12 text-minor',
  INFO: 'bg-info/12 text-info',
};

const STATUS_BADGE: Record<string, string> = {
  OPEN: 'bg-warning/12 text-warning',
  IN_PROGRESS: 'bg-primary-subtle text-primary',
  CLOSED: 'bg-surface-2 text-muted',
  DONE: 'bg-success/12 text-success',
  RESOLVED: 'bg-success/12 text-success',
};

function formatDateTime(value?: string): string {
  if (!value) return '—';
  const date = new Date(value);
  return Number.isNaN(date.getTime())
    ? '—'
    : date.toLocaleString(undefined, {
        year: 'numeric',
        month: 'short',
        day: '2-digit',
        hour: '2-digit',
        minute: '2-digit',
      });
}

function InfoRow({ label, value, mono }: { label: string; value: string; mono?: boolean }) {
  return (
    <div className="flex items-baseline justify-between gap-4 border-b border-border py-2.5 last:border-0">
      <span className="shrink-0 font-mono text-[10px] font-semibold uppercase tracking-[0.14em] text-faint">
        {label}
      </span>
      <span
        className={`min-w-0 truncate text-right text-sm text-fg ${mono ? 'font-mono text-xs' : ''}`}
      >
        {value}
      </span>
    </div>
  );
}

function CodeBlock({
  title,
  icon: Icon,
  content,
  onCopy,
  copied,
  copyLabel,
}: {
  title: string;
  icon: LucideIcon;
  content: string;
  onCopy?: () => void;
  copied?: boolean;
  copyLabel?: string;
}) {
  return (
    <div className="overflow-hidden rounded-lg border border-border">
      <div className="flex items-center justify-between gap-2 border-b border-border bg-surface-2/50 px-4 py-2.5">
        <span className="flex items-center gap-2 text-xs font-semibold text-fg">
          <Icon size={14} className="text-muted" />
          {title}
        </span>
        {onCopy ? (
          <button
            type="button"
            onClick={onCopy}
            aria-label={copyLabel}
            title={copyLabel}
            className="inline-flex h-7 w-7 items-center justify-center rounded-md text-faint transition-colors hover:bg-surface-2 hover:text-fg"
          >
            {copied ? <Check size={14} className="text-success" /> : <Copy size={14} />}
          </button>
        ) : null}
      </div>
      <pre className="max-h-96 overflow-auto whitespace-pre-wrap break-words bg-surface px-4 py-3 font-mono text-xs leading-relaxed text-fg">
        {content}
      </pre>
    </div>
  );
}

function CommentItem({
  comment,
  replies,
  onReply,
}: {
  comment: IssueComment;
  replies: IssueComment[];
  onReply: (comment: IssueComment) => void;
}) {
  const { t } = useTranslation();
  const initial = comment.username?.charAt(0).toUpperCase() || '?';
  return (
    <li className="px-5 py-4">
      <div className="flex gap-3">
        <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-primary-subtle text-xs font-semibold text-primary">
          {initial}
        </span>
        <div className="min-w-0 flex-1">
          <div className="flex flex-wrap items-baseline gap-2">
            <span className="text-sm font-medium text-fg">{comment.username || '—'}</span>
            <span className="font-mono text-[11px] text-faint">
              {formatDateTime(comment.createdAt)}
            </span>
            <button
              type="button"
              onClick={() => onReply(comment)}
              className="ml-auto inline-flex items-center gap-1 text-[11px] font-medium text-primary transition-opacity hover:underline"
            >
              <CornerDownRight size={11} />
              {t('ISSUE_DETAIL.REPLY')}
            </button>
          </div>
          <p className="mt-1 whitespace-pre-wrap break-words text-sm text-muted">
            {comment.comment}
          </p>
        </div>
      </div>
      {replies.length > 0 ? (
        <ul className="mt-3 space-y-3 border-l border-border pl-4 sm:ml-11">
          {replies.map((reply) => (
            <li key={reply.id} className="flex gap-3">
              <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-surface-2 text-[11px] font-semibold text-muted">
                {reply.username?.charAt(0).toUpperCase() || '?'}
              </span>
              <div className="min-w-0 flex-1">
                <div className="flex flex-wrap items-baseline gap-2">
                  <span className="text-sm font-medium text-fg">{reply.username || '—'}</span>
                  <span className="font-mono text-[11px] text-faint">
                    {formatDateTime(reply.createdAt)}
                  </span>
                </div>
                <p className="mt-1 whitespace-pre-wrap break-words text-sm text-muted">
                  {reply.comment}
                </p>
              </div>
            </li>
          ))}
        </ul>
      ) : null}
    </li>
  );
}

export function IssueDetailPage() {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const { issuesId } = useParams<{ issuesId: string }>();
  const { user } = useAuth();
  const { showToast } = useToast();

  const issueQuery = useIssue(issuesId);
  const analysisQuery = useIssueAnalysis(issuesId);
  useIssueCommentStream(issuesId);
  const addComment = useAddIssueComment();
  const triggerAiFix = useTriggerAiFix();

  const [modalMode, setModalMode] = useState<'assign' | 'status' | null>(null);
  const [commentText, setCommentText] = useState('');
  const [replyTo, setReplyTo] = useState<{
    id: string;
    username: string;
  } | null>(null);
  const [copied, setCopied] = useState(false);

  const issue = issueQuery.data;
  const analysis = analysisQuery.data;
  const aiPending = triggerAiFix.isPending || analysis?.status === 'PENDING';

  const { roots, repliesByParent } = useMemo(() => {
    const all = issue?.comments ?? [];
    const map = new Map<string, IssueComment[]>();
    const top: IssueComment[] = [];
    for (const comment of all) {
      if (comment.parentCommentId) {
        const list = map.get(comment.parentCommentId) ?? [];
        list.push(comment);
        map.set(comment.parentCommentId, list);
      } else {
        top.push(comment);
      }
    }
    return { roots: top, repliesByParent: map };
  }, [issue]);

  async function handleCopyCode() {
    if (!analysis?.vulnerableCode) {
      return;
    }
    try {
      await navigator.clipboard.writeText(analysis.vulnerableCode);
      setCopied(true);
      window.setTimeout(() => setCopied(false), 1600);
    } catch {
      showToast({ tone: 'error', title: t('COMMON.ERROR') });
    }
  }

  function handleDownloadFix() {
    if (!analysis || !issue) {
      return;
    }
    const content = `# ${issue.message}\n\n## Description\n${analysis.description ?? '-'}\n\n## Vulnerable Code\n\`\`\`\n${analysis.vulnerableCode ?? '-'}\n\`\`\`\n\n## Recommendation\n${analysis.recommendedFixByAi || analysis.recommendedFix || '-'}\n`;
    const blob = new Blob([content], { type: 'text/markdown' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `issue_${issue.issueKey || issue.id}.md`;
    link.click();
    URL.revokeObjectURL(url);
  }

  async function handleGenerateAiFix() {
    if (!issue?.projectId || !issue.id) {
      return;
    }
    try {
      await triggerAiFix.mutateAsync({
        projectId: issue.projectId,
        issueId: issue.id,
      });
    } catch {
      showToast({ tone: 'error', title: t('COMMON.ERROR') });
    }
  }

  async function handlePostComment() {
    const text = commentText.trim();
    if (!text || !issue || !user?.id) {
      return;
    }
    try {
      await addComment.mutateAsync({
        issueId: issue.id,
        userId: user.id,
        comment: text,
        parentCommentId: replyTo?.id,
      });
      setCommentText('');
      setReplyTo(null);
    } catch {
      showToast({ tone: 'error', title: t('COMMON.ERROR') });
    }
  }

  function startReply(comment: IssueComment) {
    setReplyTo({
      id: comment.parentCommentId || comment.id,
      username: comment.username,
    });
    setCommentText(comment.username ? `@${comment.username} ` : '');
    document.getElementById('newComment')?.focus();
  }

  if (issueQuery.isLoading) {
    return (
      <div className="flex items-center justify-center gap-2 py-24 text-sm text-muted">
        <Loader2 size={16} className="animate-spin" />
        {t('COMMON.LOADING')}
      </div>
    );
  }

  if (issueQuery.isError || !issue) {
    return (
      <div className="flex items-start gap-2.5 rounded-xl border border-danger/30 bg-danger/10 px-5 py-4 text-sm text-danger">
        <TriangleAlert size={16} className="mt-0.5 shrink-0" />
        <p>{t('COMMON.ERROR')}</p>
      </div>
    );
  }

  const recommendation = analysis?.recommendedFixByAi || analysis?.recommendedFix || '';
  const isAiRecommendation = Boolean(analysis?.recommendedFixByAi);

  return (
    <div>
      <div className="mb-6">
        <button
          type="button"
          onClick={() => navigate(-1)}
          className="inline-flex items-center gap-1.5 text-xs font-medium text-muted transition-colors hover:text-primary"
        >
          <ArrowLeft size={14} />
          {t('ISSUE_DETAIL.BACK_TO_ISSUE')}
        </button>
        <h1 className="mt-2 text-2xl font-semibold leading-snug tracking-tight text-fg">
          {issue.message}
        </h1>
        <div className="mt-3 flex flex-wrap items-center gap-2">
          <span className="rounded-md bg-surface-2 px-2 py-0.5 font-mono text-[10px] uppercase tracking-wide text-muted">
            {issue.type.replace(/_/g, ' ')}
          </span>
          <span
            className={`rounded-full px-2.5 py-0.5 text-[11px] font-medium ${
              SEVERITY_BADGE[issue.severity] ?? 'bg-surface-2 text-muted'
            }`}
          >
            {issue.severity}
          </span>
          <span
            className={`rounded-full px-2.5 py-0.5 text-[11px] font-medium ${
              STATUS_BADGE[issue.status] ?? 'bg-surface-2 text-muted'
            }`}
          >
            {issue.status.replace(/_/g, ' ')}
          </span>
          <span className="font-mono text-xs text-faint">{issue.projectName}</span>
        </div>
      </div>

      <div className="grid items-start gap-4 lg:grid-cols-3">
        <div className="space-y-4 lg:col-span-2">
          <section className="rounded-xl border border-border bg-surface">
            <div className="border-b border-border px-5 py-4">
              <h2 className="text-sm font-semibold text-fg">{t('ISSUE_DETAIL.DESC_ANALYSIS')}</h2>
            </div>
            <div className="space-y-4 px-5 py-5">
              {analysisQuery.isLoading ? (
                <div className="flex items-center justify-center gap-2 py-8 text-sm text-muted">
                  <Loader2 size={15} className="animate-spin" />
                  {t('COMMON.LOADING')}
                </div>
              ) : (
                <>
                  {analysis?.description ? (
                    <p className="whitespace-pre-wrap text-sm leading-relaxed text-muted">
                      {analysis.description}
                    </p>
                  ) : null}

                  {analysis?.vulnerableCode ? (
                    <CodeBlock
                      title={t('ISSUE_DETAIL.VULNERABLE_CODE')}
                      icon={TriangleAlert}
                      content={analysis.vulnerableCode}
                      onCopy={() => void handleCopyCode()}
                      copied={copied}
                      copyLabel={t('ISSUE_DETAIL.COPY_CODE_TOOLTIP')}
                    />
                  ) : null}

                  <div>
                    <div className="mb-2 flex flex-wrap items-center justify-between gap-2">
                      <span className="flex items-center gap-2 text-xs font-semibold text-fg">
                        {t('ISSUE_DETAIL.RECOMMENDATION')}
                        {isAiRecommendation ? (
                          <span className="inline-flex items-center gap-1 rounded-full bg-primary-subtle px-2 py-0.5 text-[10px] font-medium text-primary">
                            <Sparkles size={11} />
                            {t('ISSUE_DETAIL.AI_OPTIMIZED')}
                          </span>
                        ) : null}
                      </span>
                      <div className="flex items-center gap-2">
                        {recommendation ? (
                          <button
                            type="button"
                            onClick={handleDownloadFix}
                            className="inline-flex h-8 items-center gap-1.5 rounded-md border border-border px-3 text-xs font-medium text-fg transition-colors hover:bg-surface-2"
                          >
                            <Download size={13} />
                            {t('ISSUE_DETAIL.DOWNLOAD_MD')}
                          </button>
                        ) : null}
                        <button
                          type="button"
                          onClick={() => void handleGenerateAiFix()}
                          disabled={aiPending || !issue.projectId}
                          className="inline-flex h-8 items-center gap-1.5 rounded-md bg-primary-subtle px-3 text-xs font-medium text-primary transition-colors hover:bg-primary hover:text-primary-fg disabled:cursor-not-allowed disabled:opacity-60"
                        >
                          {aiPending ? (
                            <Loader2 size={13} className="animate-spin" />
                          ) : (
                            <Sparkles size={13} />
                          )}
                          {t(
                            aiPending
                              ? 'ISSUE_DETAIL.GENERATING_AI_FIX'
                              : 'ISSUE_DETAIL.GENERATE_AI_FIX',
                          )}
                        </button>
                      </div>
                    </div>
                    {recommendation ? (
                      <div className="overflow-hidden rounded-lg border border-border">
                        <pre className="max-h-[28rem] overflow-auto whitespace-pre-wrap break-words bg-surface-2/40 px-4 py-3 font-mono text-xs leading-relaxed text-fg">
                          {recommendation}
                        </pre>
                      </div>
                    ) : (
                      <p className="rounded-lg border border-border bg-surface-2/40 px-4 py-6 text-center text-sm text-muted">
                        {t('ISSUE_DETAIL.SUGGESTED_SOLUTION')}
                      </p>
                    )}
                  </div>
                </>
              )}
            </div>
          </section>

          <section className="rounded-xl border border-border bg-surface">
            <div className="flex items-center gap-2 border-b border-border px-5 py-4">
              <MessageSquare size={15} className="text-primary" />
              <h2 className="text-sm font-semibold text-fg">{t('ISSUE_DETAIL.COMMENTS')}</h2>
              <span className="font-mono text-[11px] text-faint">{issue.comments.length}</span>
            </div>

            {roots.length === 0 ? (
              <p className="px-5 py-10 text-center text-sm text-muted">
                {t('ISSUE_DETAIL.NO_COMMENTS_YET')}
              </p>
            ) : (
              <ul className="divide-y divide-border">
                {roots.map((comment) => (
                  <CommentItem
                    key={comment.id}
                    comment={comment}
                    replies={repliesByParent.get(comment.id) ?? []}
                    onReply={startReply}
                  />
                ))}
              </ul>
            )}

            <div className="border-t border-border px-5 py-4">
              <label htmlFor="newComment" className="sr-only">
                {t('ISSUE_DETAIL.WRITE_COMMENT_TOOLTIP')}
              </label>
              {replyTo ? (
                <div className="mb-2 flex items-center gap-2 rounded-lg bg-primary-subtle px-3 py-1.5">
                  <CornerDownRight size={12} className="text-primary" />
                  <span className="flex-1 truncate text-xs text-primary">
                    {t('ISSUE_DETAIL.REPLYING_TO', {
                      name: replyTo.username || '—',
                    })}
                  </span>
                  <button
                    type="button"
                    onClick={() => {
                      setReplyTo(null);
                      setCommentText('');
                    }}
                    className="text-xs font-medium text-primary hover:underline"
                  >
                    {t('ISSUE_DETAIL.CANCEL_REPLY')}
                  </button>
                </div>
              ) : null}
              <div className="flex items-end gap-2">
                <textarea
                  id="newComment"
                  rows={2}
                  className="min-h-[2.75rem] w-full resize-y rounded-lg border border-border bg-surface px-3 py-2 text-sm text-fg outline-none transition placeholder:text-faint focus:border-primary focus:ring-2 focus:ring-primary/25"
                  placeholder={t('ISSUE_DETAIL.WRITE_COMMENT_PLACEHOLDER')}
                  value={commentText}
                  onChange={(event) => setCommentText(event.target.value)}
                  onKeyDown={(event) => {
                    if (event.key === 'Enter' && !event.shiftKey) {
                      event.preventDefault();
                      void handlePostComment();
                    }
                  }}
                />
                <button
                  type="button"
                  onClick={() => void handlePostComment()}
                  disabled={!commentText.trim() || addComment.isPending}
                  aria-label={t('ISSUE_DETAIL.POST_COMMENT_TOOLTIP')}
                  title={t('ISSUE_DETAIL.POST_COMMENT_TOOLTIP')}
                  className="inline-flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-primary text-primary-fg transition hover:bg-primary-hover active:scale-95 disabled:cursor-not-allowed disabled:opacity-50"
                >
                  {addComment.isPending ? (
                    <Loader2 size={15} className="animate-spin" />
                  ) : (
                    <Send size={15} />
                  )}
                </button>
              </div>
            </div>
          </section>
        </div>

        <aside className="space-y-4 lg:sticky lg:top-20">
          <div className="rounded-xl border border-border bg-surface px-5 py-4">
            <p className="font-mono text-[10px] font-semibold uppercase tracking-[0.15em] text-faint">
              {t('ISSUE_DETAIL.BASIC_INFO')}
            </p>
            <div className="mt-2">
              <InfoRow label={t('ISSUE_DETAIL.ID')} value={issue.issueKey || issue.id} mono />
              <InfoRow label={t('ISSUE_DETAIL.TYPE')} value={issue.type.replace(/_/g, ' ')} />
              <InfoRow label={t('ISSUE_DETAIL.FILE')} value={issue.component || '—'} mono />
              <InfoRow
                label={t('ISSUE_DETAIL.LINE')}
                value={issue.line != null ? String(issue.line) : '—'}
              />
              <InfoRow label={t('ISSUE_DETAIL.CREATED')} value={formatDateTime(issue.createdAt)} />
            </div>
          </div>

          <div className="rounded-xl border border-border bg-surface px-5 py-4">
            <p className="font-mono text-[10px] font-semibold uppercase tracking-[0.15em] text-faint">
              {t('ISSUE_DETAIL.ASSIGNMENT')}
            </p>
            <div className="mt-3 flex items-center gap-3">
              <span className="flex h-9 w-9 items-center justify-center rounded-full bg-primary-subtle text-sm font-semibold text-primary">
                {issue.assignedName?.charAt(0).toUpperCase() ?? '?'}
              </span>
              <div className="min-w-0">
                <p className="truncate text-sm font-medium text-fg">
                  {issue.assignedName || t('ISSUE_DETAIL.NO_ASSIGNEE')}
                </p>
                <p className="text-xs text-faint">{t('ISSUE_DETAIL.ASSIGNED_TO')}</p>
              </div>
            </div>
            <button
              type="button"
              onClick={() => setModalMode('assign')}
              className="mt-4 inline-flex h-9 w-full items-center justify-center gap-2 rounded-lg border border-border px-4 text-sm font-medium text-fg transition-colors hover:bg-surface-2"
            >
              <UserPlus size={15} />
              {t('ISSUE_DETAIL.ASSIGN_UPDATE')}
            </button>
          </div>

          <div className="rounded-xl border border-border bg-surface px-5 py-4">
            <p className="font-mono text-[10px] font-semibold uppercase tracking-[0.15em] text-faint">
              {t('ISSUE_DETAIL.STATUS_PRIORITY')}
            </p>
            <div className="mt-2">
              <InfoRow label={t('ISSUE_DETAIL.SEVERITY')} value={issue.severity || '—'} />
              <InfoRow label={t('ISSUE_DETAIL.STATUS')} value={issue.status.replace(/_/g, ' ')} />
            </div>
            <button
              type="button"
              onClick={() => setModalMode('status')}
              className="mt-4 inline-flex h-9 w-full items-center justify-center gap-2 rounded-lg border border-border px-4 text-sm font-medium text-fg transition-colors hover:bg-surface-2"
            >
              {t('ISSUE_DETAIL.ADD_STATUS_TOOLTIP')}
            </button>
          </div>
        </aside>
      </div>

      {modalMode ? (
        <AssignIssueModal issue={issue} mode={modalMode} onClose={() => setModalMode(null)} />
      ) : null}
    </div>
  );
}
