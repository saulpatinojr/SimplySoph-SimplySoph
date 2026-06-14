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
  const [comments, setComments] = useState<Comment[]>([]);
  const [loading, setLoading] = useState(true);
  const [newComment, setNewComment] = useState('');
  const [replyTo, setReplyTo] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [guestName, setGuestName] = useState('');
  const [guestEmail, setGuestEmail] = useState('');
  const [pageSize, setPageSize] = useState(20);

  useEffect(() => {
    loadComments();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [postId, postType, pageSize]);

  async function loadComments() {
    setLoading(true);
    try {
      const data = await fetchComments(postId, postType, pageSize);
      setComments(data.comments);
    } catch (error) {
      console.error('Failed to load comments:', error);
    } finally {
      setLoading(false);
    }
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();

    if (!newComment.trim()) return;
    if (!isAuthenticated && !guestName.trim()) {
      toast.error('Please enter your name to comment');
      return;
    }

    setSubmitting(true);
    try {
      const authorId = isAuthenticated && user ? user.uid : `guest_${Date.now()}`;
      const authorName = isAuthenticated && user ? (user.displayName || 'Anonymous') : guestName.trim();
      const authorPhoto = isAuthenticated && user ? (user.photoURL ?? undefined) : undefined;

      await addComment({
        postId,
        postType,
        content: newComment.trim(),
        authorId,
        authorName,
        authorPhotoURL: authorPhoto,
        parentId: replyTo || undefined,
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

  if (loading) {
    return (
      <div className="space-y-4" aria-busy="true" aria-label="Loading comments">
        {[1, 2, 3].map((i) => (
          <div key={i} className="flex gap-3">
            <div className="skeleton h-9 w-9 flex-shrink-0 rounded-full" />
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

  const topLevelComments = comments.filter((comment) => !comment.parentId);

  return (
    <div className="space-y-8">
      <div className="flex items-center gap-3">
        <MessageCircle size={20} style={{ color: 'var(--primary)' }} />
        <h3 className="font-display text-xl font-semibold" style={{ letterSpacing: '-0.01em' }}>
          Comments
          {comments.length > 0 && (
            <span className="ml-2 text-sm font-normal" style={{ color: 'var(--muted-foreground)' }}>
              ({comments.length})
            </span>
          )}
        </h3>
      </div>

      <form onSubmit={handleSubmit} className="space-y-4 rounded-2xl border bg-card p-5" noValidate>
        {!isAuthenticated && (
          <div className="grid gap-4 md:grid-cols-2">
            <div className="flex flex-col gap-1.5">
              <label htmlFor="guest-name" className="text-sm font-medium">Name</label>
              <Input id="guest-name" value={guestName} onChange={(e) => setGuestName(e.target.value)} placeholder="Your name" />
            </div>
            <div className="flex flex-col gap-1.5">
              <label htmlFor="guest-email" className="text-sm font-medium">Email</label>
              <Input id="guest-email" type="email" value={guestEmail} onChange={(e) => setGuestEmail(e.target.value)} placeholder="you@example.com" />
            </div>
          </div>
        )}

        <div className="flex flex-col gap-1.5">
          <label htmlFor="new-comment" className="text-sm font-medium">Add a comment</label>
          <Textarea
            id="new-comment"
            value={newComment}
            onChange={(e) => setNewComment(e.target.value)}
            placeholder="Share your thoughts..."
            rows={4}
          />
        </div>

        {replyTo && <p className="text-sm text-muted-foreground">Replying to a comment.</p>}

        <div className="flex flex-wrap items-center gap-3">
          <Button type="submit" disabled={submitting}>{submitting ? 'Posting...' : 'Post comment'}</Button>
          {comments.length >= pageSize && (
            <Button type="button" variant="outline" onClick={() => setPageSize((n) => n + 20)}>Load more</Button>
          )}
        </div>
      </form>

      <div className="space-y-4">
        {topLevelComments.length === 0 ? (
          <div className="rounded-2xl border border-dashed p-8 text-center text-sm text-muted-foreground">No comments yet. Be the first to start the conversation.</div>
        ) : (
          topLevelComments.map((comment) => (
            <article key={comment.id} className="rounded-2xl border bg-card p-5">
              <div className="flex items-start justify-between gap-4">
                <div className="space-y-2">
                  <div className="flex items-center gap-2">
                    <User className="h-4 w-4" />
                    <span className="font-semibold">{comment.authorName}</span>
                    <span className="text-xs text-muted-foreground">{formatDistanceToNow(comment.createdAt.toDate(), { addSuffix: true })}</span>
                  </div>
                  <p className="text-sm leading-6 text-foreground">{comment.content}</p>
                </div>
                <div className="flex gap-2">
                  <Button type="button" variant="ghost" size="sm" onClick={() => setReplyTo(comment.id)}><Reply className="mr-2 h-4 w-4" />Reply</Button>
                  <Button type="button" variant="ghost" size="sm" onClick={() => handleDelete(comment.id)}><Trash2 className="mr-2 h-4 w-4" />Delete</Button>
                </div>
              </div>
            </article>
          ))
        )}
      </div>
    </div>
  );
}
