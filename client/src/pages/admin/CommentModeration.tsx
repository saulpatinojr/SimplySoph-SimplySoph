import { useMemo, useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useAuth } from "@/_core/hooks/useAuth";
import DashboardLayout from "@/components/DashboardLayout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import { toast } from "sonner";
import { formatDistanceToNow } from "date-fns";
import { CheckCircle, XCircle, Flag, Trash2, MessageSquare, Filter } from "lucide-react";
import { fetchAllComments, moderateComment, deleteComment, type Comment } from "@/lib/comments";
import { logModerationEvent } from "@/lib/analytics";

type StatusFilter = "all" | "approved" | "pending" | "flagged";

export default function CommentModeration() {
  const { user, loading: authLoading, isAuthenticated } = useAuth();
  const [statusFilter, setStatusFilter] = useState<StatusFilter>("all");
  const [search, setSearch] = useState("");
  const queryClient = useQueryClient();

  const { data: allCommentsData, isLoading } = useQuery({
    queryKey: ["comments", "admin", "all"],
    queryFn: () => fetchAllComments(),
    enabled: isAuthenticated && user?.role === "admin",
  });

  const allComments = allCommentsData?.comments ?? [];

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


  const filteredComments = useMemo(() => allComments.filter((comment) => {
    const matchesSearch = [comment.authorName, comment.content, comment.postId, comment.postType].join(" ").toLowerCase().includes(search.toLowerCase());
    if (statusFilter === "all") return matchesSearch;
    return comment.status === statusFilter && matchesSearch;
  }), [allComments, search, statusFilter]);

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
            <p className="mt-1 text-muted-foreground">Manage and moderate user comments</p>
          </div>
        </div>

        <div className="flex flex-col gap-3 rounded-2xl border bg-card p-4 md:flex-row md:items-center md:justify-between">
          <div className="flex-1">
            <label className="mb-2 block text-sm font-medium">Search comments</label>
            <Input value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Author, post ID, or comment text" />
          </div>
          <div className="w-full md:w-64">
            <label className="mb-2 block text-sm font-medium">Filter status</label>
            <Select value={statusFilter} onValueChange={(value) => setStatusFilter(value as StatusFilter)}>
              <SelectTrigger>
                <SelectValue placeholder="Filter comments" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All</SelectItem>
                <SelectItem value="approved">Approved</SelectItem>
                <SelectItem value="pending">Pending</SelectItem>
                <SelectItem value="flagged">Flagged</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 gap-4 md:grid-cols-4">
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-medium text-muted-foreground">Total Comments</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats.total}</div>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-medium text-muted-foreground">Approved</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-green-600">{stats.approved}</div>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-medium text-muted-foreground">Pending</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-amber-600">{stats.pending}</div>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-medium text-muted-foreground">Flagged</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-red-600">{stats.flagged}</div>
            </CardContent>
          </Card>
        </div>

        <Card>
          <CardHeader>
            <CardTitle>Comments</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {filteredComments.length === 0 ? (
              <p className="text-sm text-muted-foreground">No comments match the current filters.</p>
            ) : (
              filteredComments.map((comment) => (
                <div key={comment.id} className="rounded-xl border p-4">
                  <div className="flex flex-col gap-3 md:flex-row md:items-start md:justify-between">
                    <div className="space-y-2">
                      <div className="flex items-center gap-2">
                        <span className="font-semibold">{comment.authorName}</span>
                        {getStatusBadge(comment.status)}
                        <span className="text-xs text-muted-foreground">{formatDistanceToNow(comment.createdAt.toDate(), { addSuffix: true })}</span>
                      </div>
                      <p className="text-sm text-muted-foreground">{comment.content}</p>
                      <div className="text-xs text-muted-foreground">{comment.postType} · {comment.postId}</div>
                    </div>
                    <div className="flex flex-wrap gap-2">
                      <Button variant="outline" size="sm" onClick={() => handleApprove(comment.id)}><CheckCircle className="mr-2 h-4 w-4" />Approve</Button>
                      <Button variant="outline" size="sm" onClick={() => handleFlag(comment.id)}><Flag className="mr-2 h-4 w-4" />Flag</Button>
                      <Button variant="destructive" size="sm" onClick={() => handleDelete(comment.id)}><Trash2 className="mr-2 h-4 w-4" />Delete</Button>
                    </div>
                  </div>
                </div>
              ))
            )}
          </CardContent>
        </Card>
      </div>
    </DashboardLayout>
  );
}
