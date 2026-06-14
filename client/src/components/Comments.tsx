import React, { useState, useEffect } from 'react';
import { useAuth } from '@/_core/hooks/useAuth';
import { fetchComments, addComment, deleteComment, type Comment } from '@/lib/comments';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Input } from '@/components/ui/input';
import { toast } from 'sonner';
import { formatDistanceToNow } from 'date-fns';
import { logCommentEvent } from '@/lib/analytics';
import { MessageCircle, Reply, Trash2, User } from 'lucide-react';

interface CommentsProps {
  postId: string;
  postType: 'blog' | 'video' | 'photo';
}

export function Comments({ postId, postType }: CommentsProps) {
  const { user, isAuthenticated } = useAuth();
  const [comments, setComments]     = useState<Comment[]>([]);
  const [loading, setLoading]       = useState(true);
  const [newComment, setNewComment] = useState('');
  const [replyTo, setReplyTo]       = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  // Guest fields (used when user is not authenticated)
  const [guestName, setGuestName]   = useState('');
  const [guestEmail, setGuestEmail] = useState('');

  useEffect(() => {
    loadComments();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [postId]);

  async function loadComments() {
    setLoading(true);
    try {
      const data = await fetchComments(postId, postType);
      setComments(data);
    } catch (error) {
      console.error('Failed to load comments:', error);
      // Don't show error toast on load — silently degrade to empty state
    } finally {
      setLoading(false);
    }
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();

    if (!newComment.trim()) return;

    // Require at least a name for guest commenters
    if (!isAuthenticated && !guestName.trim()) {
      toast.error('Please enter your name to comment');
      return;
    }

    setSubmitting(true);
    try {
      const authorId      = isAuthenticated && user ? user.id : `guest_${Date.now()}`;
      const authorName    = isAuthenticated && user
        ? (user.displayName || user.name || 'Anonymous')
        : guestName.trim();
      const authorPhoto   = isAuthenticated && user
        ? (user.photoURL || user.avatarUrl || undefined)
        : undefined;

      await addComment({
        postId,
        postType,
        content:        newComment.trim(),
        authorId,
        authorName,
        authorPhotoURL: authorPhoto,
        parentId:       replyTo || undefined,
      });

      logCommentEvent(replyTo ? 'reply' : 'create', { postType, postId });
      setNewComment('');
      setReplyTo(null);
      if (!isAuthenticated) {
        setGuestName('');
        setGuestEmail('');
      }
      await loadComments();
      toast.success('Comment posted!');
    } catch (error: any) {
      console.error('Failed to post comment:', error);
      // Surface a useful message based on Firebase error codes
      if (error?.code === 'permission-denied') {
        toast.error('Comments are currently moderated. Your comment will appear after review.');
      } else if (error?.code === 'unavailable') {
        toast.error('No internet connection. Please try again.');
      } else {
        toast.error('Failed to post comment. Please try again.');
      }
    } finally {
      setSubmitting(false);
    }
  }

  async function handleDelete(commentId: string) {
    if (!window.confirm('Delete this comment?')) return;
    try {
      await deleteComment(commentId);
      logCommentEvent('delete', { postType, postId });
      await loadComments();
      toast.success('Comment deleted');
    } catch (error) {
      console.error('Failed to delete comment:', error);
      toast.error('Failed to delete comment');
    }
  }

  // ── Loading skeleton ───────────────────────────────────────────
  if (loading) {
    return (
      <div className="space-y-4" aria-busy="true" aria-label="Loading comments">
        {[1, 2, 3].map(i => (
          <div key={i} className="flex gap-3">
            <div className="skeleton w-9 h-9 rounded-full flex-shrink-0" />
            <div className="flex-1 space-y-2">
              <div className="skeleton h-3 w-28 rounded" />
              <div className="skeleton h-4 w-full rounded" />
              <div className="skeleton h-4 w-3/4 rounded" />
            </div>
          </div>
        ))}
      </div>
    );
  }

  const topLevelComments = comments.filter(c => !c.parentId);

  return (
    <div className="space-y-8">
      {/* Section header */}
      <div className="flex items-center gap-3">
        <MessageCircle size={20} style={{ color: 'var(--primary)' }} />
        <h3 className="font-display font-semibold text-xl" style={{ letterSpacing: '-0.01em' }}>
          Comments
          {comments.length > 0 && (
            <span className="ml-2 text-sm font-sans font-normal" style={{ color: 'var(--muted-foreground)' }}>
              ({comments.length})
            </span>
          )}
        </h3>
      </div>

      {/* ── Comment form ──────────────────────────────────────── */}
      <form
        onSubmit={handleSubmit}
        className="rounded-xl border p-5 space-y-4"
        style={{
          background: 'var(--surface-1)',
          borderColor: 'oklch(from var(--foreground) l c h / 0.08)',
        }}
      >
        {/* Reply indicator */}
        {replyTo && (
          <div
            className="flex items-center justify-between text-sm rounded-lg px-3 py-2"
            style={{ background: 'oklch(from var(--primary) l c h / 0.07)', color: 'var(--primary)' }}
          >
            <span className="font-sans">Replying to a comment</span>
            <button
              type="button"
              onClick={() => setReplyTo(null)}
              className="text-xs underline opacity-70 hover:opacity-100"
            >
              Cancel
            </button>
          </div>
        )}

        {/* Guest name / email fields — only shown when not logged in */}
        {!isAuthenticated && (
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div className="flex flex-col gap-1.5">
              <label className="text-xs font-sans font-semibold uppercase tracking-widest" style={{ color: 'var(--muted-foreground)' }}>
                Name <span style={{ color: 'var(--primary)' }}>*</span>
              </label>
              <Input
                value={guestName}
                onChange={e => setGuestName(e.target.value)}
                placeholder="Your name"
                required
                className="text-sm"
              />
            </div>
            <div className="flex flex-col gap-1.5">
              <label className="text-xs font-sans font-semibold uppercase tracking-widest" style={{ color: 'var(--muted-foreground)' }}>
                Email <span className="font-normal opacity-50">(optional)</span>
              </label>
              <Input
                value={guestEmail}
                onChange={e => setGuestEmail(e.target.value)}
                placeholder="Not shown publicly"
                type="email"
                className="text-sm"
              />
            </div>
          </div>
        )}

        {/* Signed-in user indicator */}
        {isAuthenticated && user && (
          <div className="flex items-center gap-2 text-sm" style={{ color: 'var(--muted-foreground)' }}>
            {user.photoURL || user.avatarUrl ? (
              <img
                src={user.photoURL || user.avatarUrl}
                alt={user.displayName || user.name || 'You'}
                className="w-6 h-6 rounded-full object-cover"
                width={24}
                height={24}
              />
            ) : (
              <div className="w-6 h-6 rounded-full flex items-center justify-center" style={{ background: 'var(--muted)' }}>
                <User size={12} />
              </div>
            )}
            <span>Commenting as <strong>{user.displayName || user.name || 'you'}</strong></span>
          </div>
        )}

        {/* Comment textarea */}
        <Textarea
          value={newComment}
          onChange={e => setNewComment(e.target.value)}
          placeholder={replyTo ? 'Write a reply…' : 'Share your thoughts…'}
          rows={3}
          className="w-full resize-none text-sm"
        />

        <div className="flex justify-end">
          <Button
            type="submit"
            disabled={submitting || !newComment.trim() || (!isAuthenticated && !guestName.trim())}
            style={{ background: 'var(--primary)', color: 'white' }}
            className="gap-2"
          >
            {submitting ? 'Posting…' : replyTo ? 'Post reply' : 'Post comment'}
          </Button>
        </div>
      </form>

      {/* ── Comments list ──────────────────────────────────────── */}
      <div className="space-y-4">
        {topLevelComments.length === 0 ? (
          <div
            className="py-12 flex flex-col items-center gap-3 text-center rounded-xl border"
            style={{
              borderColor: 'oklch(from var(--foreground) l c h / 0.06)',
              background: 'var(--surface-1)',
            }}
          >
            <MessageCircle size={32} style={{ color: 'var(--foreground-faint)' }} />
            <p className="font-display font-semibold text-lg">No comments yet</p>
            <p className="text-sm" style={{ color: 'var(--muted-foreground)' }}>Be the first to share your thoughts!</p>
          </div>
        ) : (
          topLevelComments.map(comment => (
            <CommentItem
              key={comment.id}
              comment={comment}
              allComments={comments}
              onReply={setReplyTo}
              onDelete={handleDelete}
              currentUserId={user?.id}
              isAdmin={user?.role === 'admin'}
            />
          ))
        )}
      </div>
    </div>
  );
}

// ── CommentItem ──────────────────────────────────────────────────
interface CommentItemProps {
  comment:       Comment;
  allComments:   Comment[];
  onReply:       (id: string) => void;
  onDelete:      (id: string) => void;
  currentUserId?: string;
  isAdmin?:      boolean;
  depth?:        number;
}

function CommentItem({
  comment,
  allComments,
  onReply,
  onDelete,
  currentUserId,
  isAdmin,
  depth = 0,
}: CommentItemProps) {
  const replies = allComments.filter(c => c.parentId === comment.id);
  const canDelete = isAdmin || currentUserId === comment.authorId;

  const createdAt = comment.createdAt?.toDate?.() ?? null;
  const timeAgo = createdAt
    ? formatDistanceToNow(createdAt, { addSuffix: true })
    : 'just now';

  return (
    <div
      className="flex gap-3"
      style={{ marginLeft: depth > 0 ? `${Math.min(depth * 28, 56)}px` : 0 }}
    >
      {/* Avatar */}
      <div className="flex-shrink-0">
        {comment.authorPhotoURL ? (
          <img
            src={comment.authorPhotoURL}
            alt={comment.authorName}
            className="w-9 h-9 rounded-full object-cover"
            width={36}
            height={36}
            loading="lazy"
          />
        ) : (
          <div
            className="w-9 h-9 rounded-full flex items-center justify-center text-sm font-display font-semibold"
            style={{
              background: 'oklch(from var(--primary) l c h / 0.10)',
              color: 'var(--primary)',
            }}
          >
            {comment.authorName?.charAt(0).toUpperCase() || '?'}
          </div>
        )}
      </div>

      {/* Body */}
      <div className="flex-1 min-w-0">
        <div
          className="rounded-xl px-4 py-3"
          style={{
            background: depth > 0 ? 'var(--surface-2)' : 'var(--surface-1)',
            border: '1px solid oklch(from var(--foreground) l c h / 0.07)',
          }}
        >
          <div className="flex items-center justify-between gap-2 mb-1.5">
            <span className="text-sm font-sans font-semibold" style={{ color: 'var(--foreground)' }}>
              {comment.authorName}
            </span>
            <span className="text-xs font-sans" style={{ color: 'var(--muted-foreground)' }}>
              {timeAgo}
            </span>
          </div>
          <p className="text-sm leading-relaxed" style={{ color: 'var(--foreground)', maxWidth: '65ch' }}>
            {comment.content}
          </p>
        </div>

        {/* Actions */}
        <div className="flex items-center gap-4 mt-1.5 px-1">
          {depth < 2 && (
            <button
              onClick={() => onReply(comment.id)}
              className="flex items-center gap-1 text-xs font-sans transition-colors hover:text-primary"
              style={{ color: 'var(--muted-foreground)' }}
            >
              <Reply size={12} /> Reply
            </button>
          )}
          {canDelete && (
            <button
              onClick={() => onDelete(comment.id)}
              className="flex items-center gap-1 text-xs font-sans transition-colors"
              style={{ color: 'var(--muted-foreground)' }}
              onMouseEnter={e => (e.currentTarget as HTMLElement).style.color = 'oklch(0.577 0.245 27.325)'}
              onMouseLeave={e => (e.currentTarget as HTMLElement).style.color = 'var(--muted-foreground)'}
            >
              <Trash2 size={12} /> Delete
            </button>
          )}
        </div>

        {/* Nested replies */}
        {replies.length > 0 && (
          <div className="mt-3 space-y-3">
            {replies.map(reply => (
              <CommentItem
                key={reply.id}
                comment={reply}
                allComments={allComments}
                onReply={onReply}
                onDelete={onDelete}
                currentUserId={currentUserId}
                isAdmin={isAdmin}
                depth={depth + 1}
              />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
