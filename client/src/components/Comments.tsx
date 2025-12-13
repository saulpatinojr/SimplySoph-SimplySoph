import React, { useState, useEffect } from 'react';
import { useAuth } from '@/_core/hooks/useAuth';
import { fetchComments, addComment, deleteComment, type Comment } from '@/lib/comments';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { toast } from 'sonner';
import { formatDistanceToNow } from 'date-fns';

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

  useEffect(() => {
    loadComments();
  }, [postId]);

  async function loadComments() {
    try {
      const data = await fetchComments(postId, postType);
      setComments(data);
    } catch (error) {
      console.error('Failed to load comments:', error);
      toast.error('Failed to load comments');
    } finally {
      setLoading(false);
    }
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!isAuthenticated || !user) {
      toast.error('Please sign in to comment');
      return;
    }
    if (!newComment.trim()) return;

    setSubmitting(true);
    try {
      await addComment({
        postId,
        postType,
        content: newComment.trim(),
        authorId: user.uid,
        authorName: user.displayName || 'Anonymous',
        authorPhotoURL: user.photoURL || undefined,
        parentId: replyTo || undefined,
      });
      setNewComment('');
      setReplyTo(null);
      await loadComments();
      toast.success('Comment posted successfully');
    } catch (error) {
      console.error('Failed to post comment:', error);
      toast.error('Failed to post comment');
    } finally {
      setSubmitting(false);
    }
  }

  async function handleDelete(commentId: string) {
    if (!window.confirm('Delete this comment?')) return;
    try {
      await deleteComment(commentId);
      await loadComments();
      toast.success('Comment deleted');
    } catch (error) {
      console.error('Failed to delete comment:', error);
      toast.error('Failed to delete comment');
    }
  }

  if (loading) {
    return (
      <div className="space-y-4">
        <div className="h-20 bg-gray-100 animate-pulse rounded" />
        <div className="h-20 bg-gray-100 animate-pulse rounded" />
      </div>
    );
  }

  const topLevelComments = comments.filter((c) => !c.parentId);

  return (
    <div className="space-y-6">
      <h3 className="text-2xl font-bold">Comments ({comments.length})</h3>

      {/* Comment Form */}
      {isAuthenticated ? (
        <form onSubmit={handleSubmit} className="space-y-3">
          {replyTo && (
            <div className="text-sm text-gray-600">
              Replying to comment{' '}
              <button
                type="button"
                onClick={() => setReplyTo(null)}
                className="text-blue-600 hover:underline"
              >
                (cancel)
              </button>
            </div>
          )}
          <Textarea
            value={newComment}
            onChange={(e) => setNewComment(e.target.value)}
            placeholder={replyTo ? 'Write a reply...' : 'Write a comment...'}
            rows={3}
            className="w-full"
          />
          <Button type="submit" disabled={submitting || !newComment.trim()}>
            {submitting ? 'Posting...' : 'Post Comment'}
          </Button>
        </form>
      ) : (
        <p className="text-gray-600">Please sign in to comment</p>
      )}

      {/* Comments List */}
      <div className="space-y-4">
        {topLevelComments.length === 0 ? (
          <p className="text-gray-500">No comments yet. Be the first to comment!</p>
        ) : (
          topLevelComments.map((comment) => (
            <CommentItem
              key={comment.id}
              comment={comment}
              allComments={comments}
              onReply={setReplyTo}
              onDelete={handleDelete}
              currentUserId={user?.uid}
              isAdmin={user?.role === 'admin'}
            />
          ))
        )}
      </div>
    </div>
  );
}

interface CommentItemProps {
  comment: Comment;
  allComments: Comment[];
  onReply: (commentId: string) => void;
  onDelete: (commentId: string) => void;
  currentUserId?: string;
  isAdmin?: boolean;
  depth?: number;
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
  const replies = allComments.filter((c) => c.parentId === comment.id);
  const canDelete = currentUserId === comment.authorId || isAdmin;
  const maxDepth = 3;

  return (
    <div className={`${depth > 0 ? 'ml-8 border-l-2 border-gray-200 pl-4' : ''}`}>
      <div className="bg-white p-4 rounded-lg shadow-sm">
        <div className="flex items-start gap-3">
          {comment.authorPhotoURL ? (
            <img
              src={comment.authorPhotoURL}
              alt={comment.authorName}
              className="w-10 h-10 rounded-full"
            />
          ) : (
            <div className="w-10 h-10 rounded-full bg-gray-300 flex items-center justify-center text-gray-600 font-semibold">
              {comment.authorName[0]?.toUpperCase()}
            </div>
          )}
          <div className="flex-1">
            <div className="flex items-center gap-2 mb-1">
              <span className="font-semibold">{comment.authorName}</span>
              <span className="text-sm text-gray-500">
                {formatDistanceToNow(comment.createdAt.toDate(), { addSuffix: true })}
              </span>
            </div>
            <p className="text-gray-800 whitespace-pre-wrap">{comment.content}</p>
            <div className="flex items-center gap-4 mt-2">
              {depth < maxDepth && (
                <button
                  onClick={() => onReply(comment.id)}
                  className="text-sm text-blue-600 hover:underline"
                >
                  Reply
                </button>
              )}
              {canDelete && (
                <button
                  onClick={() => onDelete(comment.id)}
                  className="text-sm text-red-600 hover:underline"
                >
                  Delete
                </button>
              )}
            </div>
          </div>
        </div>
      </div>
      {replies.length > 0 && (
        <div className="mt-4 space-y-4">
          {replies.map((reply) => (
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
  );
}
