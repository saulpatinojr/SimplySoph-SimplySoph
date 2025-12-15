import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useAuth } from "@/_core/hooks/useAuth";
import { Redirect } from "wouter";
import { LOGIN_PATH } from "@/const";
import DashboardLayout from "@/components/DashboardLayout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { toast } from "sonner";
import { formatDistanceToNow } from "date-fns";
import { CheckCircle, XCircle, Flag, Trash2, MessageSquare, Filter } from "lucide-react";
import { fetchAllComments, moderateComment, deleteComment, type Comment } from "@/lib/comments";
import { logModerationEvent } from "@/lib/analytics";

type StatusFilter = "all" | "approved" | "pending" | "flagged";

export default function CommentModeration() {
  const { user, loading: authLoading, isAuthenticated } = useAuth();
  const [statusFilter, setStatusFilter] = useState<StatusFilter>("all");
  const queryClient = useQueryClient();

  const { data: allComments = [], isLoading } = useQuery({
    queryKey: ["comments", "admin", "all"],
    queryFn: fetchAllComments,
    enabled: isAuthenticated && user?.role === "admin",
  });

  const moderateMutation = useMutation({
    mutationFn: ({ commentId, status }: { commentId: string; status: "approved" | "flagged" }) =>
      moderateComment(commentId, status),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["comments", "admin", "all"] });
      toast.success("Comment status updated");
    },
    onError: () => {
      toast.error("Failed to update comment");
    },
  });

  const deleteMutation = useMutation({
    mutationFn: (commentId: string) => deleteComment(commentId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["comments", "admin", "all"] });
      toast.success("Comment deleted");
    },
    onError: () => {
      toast.error("Failed to delete comment");
    },
  });

  if (authLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">Loading...</div>
      </div>
    );
  }

  if (!isAuthenticated || user?.role !== "admin") {
    return <Redirect to={LOGIN_PATH} />;
  }

  const filteredComments = allComments.filter((comment) => {
    if (statusFilter === "all") return true;
    return comment.status === statusFilter;
  });

  const stats = {
    total: allComments.length,
    approved: allComments.filter((c) => c.status === "approved").length,
    pending: allComments.filter((c) => c.status === "pending").length,
    flagged: allComments.filter((c) => c.status === "flagged").length,
  };

  function handleApprove(commentId: string) {
    logModerationEvent('approve', { commentId });
    moderateMutation.mutate({ commentId, status: "approved" });
  }

  function handleFlag(commentId: string) {
    logModerationEvent('flag', { commentId });
    moderateMutation.mutate({ commentId, status: "flagged" });
  }

  function handleDelete(commentId: string) {
    if (confirm("Are you sure you want to delete this comment? This action cannot be undone.")) {
      logModerationEvent('delete', { commentId });
      deleteMutation.mutate(commentId);
    }
  }

  function getStatusBadge(status: Comment["status"]) {
    const variants = {
      approved: "default",
      pending: "secondary",
      flagged: "destructive",
    } as const;

    return <Badge variant={variants[status]}>{status}</Badge>;
  }

  return (
    <DashboardLayout>
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-heading font-bold">Comment Moderation</h1>
            <p className="text-muted-foreground mt-1">Manage and moderate user comments</p>
          </div>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-medium text-muted-foreground">
                Total Comments
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats.total}</div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-medium text-muted-foreground">
                Approved
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-green-600">{stats.approved}</div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-medium text-muted-foreground">
                Pending Review
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-yellow-600">{stats.pending}</div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-medium text-muted-foreground">
                Flagged
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-red-600">{stats.flagged}</div>
            </CardContent>
          </Card>
        </div>

        {/* Filter */}
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <CardTitle className="flex items-center gap-2">
                <MessageSquare size={20} />
                Comments
              </CardTitle>
              <div className="flex items-center gap-2">
                <Filter size={16} className="text-muted-foreground" />
                <Select value={statusFilter} onValueChange={(v) => setStatusFilter(v as StatusFilter)}>
                  <SelectTrigger className="w-40">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Comments</SelectItem>
                    <SelectItem value="approved">Approved</SelectItem>
                    <SelectItem value="pending">Pending</SelectItem>
                    <SelectItem value="flagged">Flagged</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
          </CardHeader>
          <CardContent>
            {isLoading ? (
              <div className="text-center py-8 text-muted-foreground">Loading comments...</div>
            ) : filteredComments.length === 0 ? (
              <div className="text-center py-8 text-muted-foreground">
                No comments found for this filter.
              </div>
            ) : (
              <div className="space-y-4">
                {filteredComments.map((comment) => (
                  <div
                    key={comment.id}
                    className="border rounded-lg p-4 hover:bg-muted/50 transition-colors"
                  >
                    <div className="flex items-start justify-between gap-4">
                      <div className="flex-1 space-y-2">
                        {/* Author Info */}
                        <div className="flex items-center gap-3">
                          {comment.authorPhotoURL && (
                            <img
                              src={comment.authorPhotoURL}
                              alt={comment.authorName}
                              className="w-8 h-8 rounded-full"
                            />
                          )}
                          <div>
                            <p className="font-medium">{comment.authorName}</p>
                            <p className="text-xs text-muted-foreground">
                              {formatDistanceToNow(
                                // comment.createdAt may be a Firestore Timestamp
                                // convert to Date if necessary
                                (comment.createdAt as any)?.toDate ? (comment.createdAt as any).toDate() : comment.createdAt,
                                { addSuffix: true }
                              )}
                            </p>
                          </div>
                          {getStatusBadge(comment.status)}
                        </div>

                        {/* Comment Content */}
                        <p className="text-sm leading-relaxed pl-11">{comment.content}</p>

                        {/* Meta Info */}
                        <div className="text-xs text-muted-foreground pl-11">
                          On: <span className="font-medium">{comment.postType}</span>
                          {comment.parentId && (
                            <span className="ml-2">• Reply to another comment</span>
                          )}
                        </div>
                      </div>

                      {/* Action Buttons */}
                      <div className="flex flex-col gap-2 shrink-0">
                        {comment.status !== "approved" && (
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => handleApprove(comment.id)}
                            disabled={moderateMutation.isPending}
                            className="gap-2"
                          >
                            <CheckCircle size={14} />
                            Approve
                          </Button>
                        )}
                        {comment.status !== "flagged" && (
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => handleFlag(comment.id)}
                            disabled={moderateMutation.isPending}
                            className="gap-2"
                          >
                            <Flag size={14} />
                            Flag
                          </Button>
                        )}
                        <Button
                          size="sm"
                          variant="destructive"
                          onClick={() => handleDelete(comment.id)}
                          disabled={deleteMutation.isPending}
                          className="gap-2"
                        >
                          <Trash2 size={14} />
                          Delete
                        </Button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </DashboardLayout>
  );
}
