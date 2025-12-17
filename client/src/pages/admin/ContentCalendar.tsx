import { useAuth } from "@/_core/hooks/useAuth";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Redirect, useLocation } from "wouter";
import { LOGIN_PATH } from "@/const";
import { useState } from "react";
import { DayPicker } from "react-day-picker";
import "react-day-picker/style.css";
import { format, startOfMonth, endOfMonth } from "date-fns";
import {
  fetchScheduledPosts,
  deleteScheduledPost,
  type ScheduledPost
} from "@/lib/content";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { toast } from "sonner";
import { saveScheduledPost } from "@/lib/content";
import { Trash2, Plus, Calendar as CalendarIcon, Instagram, Youtube, Video } from "lucide-react";

export default function ContentCalendar() {
  const { user, loading: authLoading, isAuthenticated } = useAuth();
  const [selectedDate, setSelectedDate] = useState<Date | undefined>(new Date());
  const [currentMonth, setCurrentMonth] = useState<Date>(new Date());

  // Modal state
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [newPostPlatform, setNewPostPlatform] = useState<string>("instagram_post");
  const [newPostCaption, setNewPostCaption] = useState("");
  const [newPostMediaUrl, setNewPostMediaUrl] = useState("");

  const queryClient = useQueryClient();

  // Fetch posts for the current month view
  const { data: posts, isLoading } = useQuery({
    queryKey: ["scheduled_posts", format(currentMonth, "yyyy-MM")],
    queryFn: () => fetchScheduledPosts(startOfMonth(currentMonth), endOfMonth(currentMonth)),
    enabled: isAuthenticated && user?.role === "admin",
  });

  const saveMutation = useMutation({
    mutationFn: (data: any) => saveScheduledPost(data),
    onSuccess: () => {
      toast.success("Post scheduled successfully");
      setIsDialogOpen(false);
      // Reset form
      setNewPostCaption("");
      setNewPostMediaUrl("");
      queryClient.invalidateQueries({ queryKey: ["scheduled_posts"] });
    },
    onError: () => toast.error("Failed to schedule post"),
  });

  const deleteMutation = useMutation({
    mutationFn: (id: string) => deleteScheduledPost(id),
    onSuccess: () => {
      toast.success("Post deleted");
      queryClient.invalidateQueries({ queryKey: ["scheduled_posts"] });
    },
  });

  if (authLoading) return <div className="p-8 text-center">Loading...</div>;
  if (!isAuthenticated || user?.role !== 'admin') return <Redirect to={LOGIN_PATH} />;

  const handleMonthChange = (month: Date) => {
    setCurrentMonth(month);
  };

  const handleSchedulePost = (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedDate) {
      toast.error("Please select a date");
      return;
    }

    saveMutation.mutate({
      platform: newPostPlatform,
      caption: newPostCaption,
      mediaUrl: newPostMediaUrl,
      scheduledAt: selectedDate,
      status: 'scheduled',
    });
  };

  // Helper to get posts for a specific day
  const getPostsForDay = (day: Date) => {
    return posts?.filter(p =>
      format(p.scheduledAt, "yyyy-MM-dd") === format(day, "yyyy-MM-dd")
    ) || [];
  };

  // Custom Day render to show dots/indicators
  const modifiers = {
    hasPost: (date: Date) => getPostsForDay(date).length > 0
  };

  const modifiersStyles = {
    hasPost: {
      fontWeight: 'bold',
      textDecoration: 'underline',
      color: 'var(--primary)'
    }
  };

  const getPlatformIcon = (platform: string) => {
    switch(platform) {
      case 'instagram_post':
      case 'instagram_reel': return <Instagram size={14} />;
      case 'youtube_shorts': return <Youtube size={14} />;
      case 'tiktok': return <Video size={14} />;
      default: return <CalendarIcon size={14} />;
    }
  };

  return (
    <div className="container py-8 min-h-screen">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-3xl font-heading font-bold">Content Calendar</h1>
        <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
          <DialogTrigger asChild>
            <Button className="gap-2">
              <Plus size={16} /> Schedule Post
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Schedule New Post</DialogTitle>
            </DialogHeader>
            <form onSubmit={handleSchedulePost} className="space-y-4">
              <div className="space-y-2">
                <Label>Date</Label>
                <div className="p-2 border rounded-md bg-muted/20">
                  {selectedDate ? format(selectedDate, "PPP") : "Select a date on the calendar"}
                </div>
              </div>

              <div className="space-y-2">
                <Label>Platform</Label>
                <Select value={newPostPlatform} onValueChange={setNewPostPlatform}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="instagram_post">Instagram Post</SelectItem>
                    <SelectItem value="instagram_reel">Instagram Reel</SelectItem>
                    <SelectItem value="youtube_shorts">YouTube Shorts</SelectItem>
                    <SelectItem value="tiktok">TikTok</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label>Media URL</Label>
                <Input
                  value={newPostMediaUrl}
                  onChange={(e) => setNewPostMediaUrl(e.target.value)}
                  placeholder="https://..."
                />
              </div>

              <div className="space-y-2">
                <Label>Caption</Label>
                <Textarea
                  value={newPostCaption}
                  onChange={(e) => setNewPostCaption(e.target.value)}
                  placeholder="Enter caption..."
                />
              </div>

              <Button type="submit" disabled={saveMutation.isPending} className="w-full">
                {saveMutation.isPending ? "Scheduling..." : "Schedule"}
              </Button>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-[auto_1fr] gap-8">
        <Card className="p-4 w-fit h-fit">
          <DayPicker
            mode="single"
            selected={selectedDate}
            onSelect={setSelectedDate}
            onMonthChange={handleMonthChange}
            modifiers={modifiers}
            modifiersStyles={modifiersStyles}
            styles={{
              caption: { color: 'inherit' }
            }}
          />
        </Card>

        <div className="space-y-4">
          <h2 className="text-xl font-bold">
            {selectedDate ? format(selectedDate, "EEEE, MMMM do, yyyy") : "Select a date"}
          </h2>

          {selectedDate && getPostsForDay(selectedDate).length === 0 && (
            <p className="text-muted-foreground">No posts scheduled for this day.</p>
          )}

          <div className="grid gap-4">
            {selectedDate && getPostsForDay(selectedDate).map(post => (
              <Card key={post.id} className="p-4 flex gap-4 items-start">
                <div className="w-24 h-24 bg-muted rounded-md overflow-hidden flex-shrink-0">
                  {post.thumbnailUrl ? (
                    <img src={post.thumbnailUrl} alt="Thumbnail" className="w-full h-full object-cover" />
                  ) : post.mediaUrl && (post.mediaUrl.endsWith('.jpg') || post.mediaUrl.endsWith('.png')) ? (
                    <img src={post.mediaUrl} alt="Thumbnail" className="w-full h-full object-cover" />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center text-muted-foreground">
                      {getPlatformIcon(post.platform)}
                    </div>
                  )}
                </div>
                <div className="flex-1">
                  <div className="flex justify-between items-start">
                    <div className="flex items-center gap-2 mb-1">
                      <span className="p-1 rounded-full bg-secondary">
                        {getPlatformIcon(post.platform)}
                      </span>
                      <span className="font-semibold capitalize">
                        {post.platform.replace('_', ' ')}
                      </span>
                      <span className={`text-xs px-2 py-0.5 rounded-full ${
                        post.status === 'posted' ? 'bg-green-100 text-green-800' :
                        post.status === 'failed' ? 'bg-red-100 text-red-800' :
                        'bg-blue-100 text-blue-800'
                      }`}>
                        {post.status}
                      </span>
                    </div>
                    <Button
                      variant="ghost"
                      size="sm"
                      className="text-destructive hover:text-destructive"
                      onClick={() => {
                        if (confirm("Are you sure you want to delete this scheduled post?")) {
                          deleteMutation.mutate(post.id);
                        }
                      }}
                    >
                      <Trash2 size={16} />
                    </Button>
                  </div>
                  <p className="text-sm text-muted-foreground line-clamp-2 mb-2">
                    {post.caption}
                  </p>
                  <div className="text-xs text-muted-foreground">
                    Scheduled for {format(post.scheduledAt, "p")}
                  </div>
                </div>
              </Card>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
