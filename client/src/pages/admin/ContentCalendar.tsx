import { useAuth } from "@/_core/hooks/useAuth";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Redirect, useLocation, Link } from "wouter";
import DashboardLayout from "@/components/DashboardLayout";
import { LOGIN_PATH } from "@/const";
import { useState } from "react";
import { DayPicker } from "react-day-picker";
import "react-day-picker/style.css";
import { format, startOfMonth, endOfMonth, isSameDay } from "date-fns";
import {
  fetchScheduledPosts,
  deleteScheduledPost,
  saveScheduledPost,
  fetchVideos,
  fetchAllBlogPosts,
  fetchPhotoAlbums,
  type ScheduledPost,
  type VideoEntry,
  type BlogPost,
  type PhotoAlbum,
  db,
} from "@/lib/content";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { doc, updateDoc } from "firebase/firestore";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { toast } from "sonner";
import { generateCaption } from "@/lib/ai";
import {
  Trash2,
  Plus,
  Calendar as CalendarIcon,
  Instagram,
  Youtube,
  Video,
  FileText,
  Image as ImageIcon,
  RefreshCcw,
  Sparkles,
} from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

export default function ContentCalendar() {
  const { user, loading: authLoading, isAuthenticated } = useAuth();
  const [selectedDate, setSelectedDate] = useState<Date | undefined>(
    new Date()
  );
  const [currentMonth, setCurrentMonth] = useState<Date>(new Date());

  // Modal state
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [isRecycleOpen, setIsRecycleOpen] = useState(false);
  const [selectedVideoToRecycle, setSelectedVideoToRecycle] =
    useState<VideoEntry | null>(null);

  const [newPostPlatform, setNewPostPlatform] =
    useState<string>("instagram_post");
  const [newPostCaption, setNewPostCaption] = useState("");
  const [newPostMediaUrl, setNewPostMediaUrl] = useState("");
  const [isGeneratingAi, setIsGeneratingAi] = useState(false);

  const queryClient = useQueryClient();

  // Queries
  const { data: scheduledPosts } = useQuery({
    queryKey: ["scheduled_posts", format(currentMonth, "yyyy-MM")],
    queryFn: () =>
      fetchScheduledPosts(startOfMonth(currentMonth), endOfMonth(currentMonth)),
    enabled: isAuthenticated && user?.role === "admin",
  });

  const { data: videos } = useQuery({
    queryKey: ["admin", "videos"],
    queryFn: () => fetchVideos(),
    enabled: isAuthenticated && user?.role === "admin",
  });

  const { data: blogs } = useQuery({
    queryKey: ["admin", "blogs"],
    queryFn: () => fetchAllBlogPosts(),
    enabled: isAuthenticated && user?.role === "admin",
  });

  const { data: albums } = useQuery({
    queryKey: ["admin", "albums"],
    queryFn: () => fetchPhotoAlbums(),
    enabled: isAuthenticated && user?.role === "admin",
  });

  const handleMonthChange = (month: Date) => {
    setCurrentMonth(month);
  };

  // Mutations
  const saveMutation = useMutation({
    mutationFn: (data: any) => saveScheduledPost(data),
    onSuccess: () => {
      toast.success("Post scheduled successfully");
      setIsDialogOpen(false);
      setIsRecycleOpen(false);
      setNewPostCaption("");
      setNewPostMediaUrl("");
      setSelectedVideoToRecycle(null);
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

  const scheduleDraftMutation = useMutation({
    mutationFn: async ({
      type,
      id,
      date,
    }: {
      type: string;
      id: string;
      date: Date;
    }) => {
      const collectionName =
        type === "blog"
          ? "blogPosts"
          : type === "video"
            ? "videos"
            : "photoAlbums";
      const ref = doc(db(), collectionName, id);
      await updateDoc(ref, { publishAt: date });
    },
    onSuccess: () => {
      toast.success("Content scheduled!");
      queryClient.invalidateQueries();
    },
  });

  if (authLoading) return <div className="p-8 text-center">Loading...</div>;
  if (!isAuthenticated || user?.role !== "admin")
    return <Redirect to={LOGIN_PATH} />;

  // Handlers
  const handleSchedulePost = (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedDate) {
      toast.error("Please select a date");
      return;
    }

    saveMutation.mutate({
      contentId: selectedVideoToRecycle?.id,
      platform: newPostPlatform,
      caption: newPostCaption,
      mediaUrl: newPostMediaUrl,
      scheduledAt: selectedDate,
      thumbnailUrl: selectedVideoToRecycle?.thumbnailUrl,
      status: "scheduled",
    });
  };

  const handleRecycleSelect = async (video: VideoEntry) => {
    setSelectedVideoToRecycle(video);
    setNewPostMediaUrl(video.videoUrl);
    setNewPostPlatform("youtube_shorts"); // Default for recycling

    setIsGeneratingAi(true);
    try {
      const caption = await generateCaption(
        "youtube_shorts",
        video.description || video.title,
        [video.title]
      );
      setNewPostCaption(caption);
    } catch {
      setNewPostCaption(video.description || video.title);
    } finally {
      setIsGeneratingAi(false);
    }

    setIsRecycleOpen(false);
    setIsDialogOpen(true);
  };

  // Helper to consolidate items for a specific day
  const getItemsForDay = (day: Date) => {
    const items: Array<{ type: string; date: Date; data: any }> = [];

    scheduledPosts?.forEach(p => {
      if (isSameDay(p.scheduledAt, day))
        items.push({ type: "scheduled", date: p.scheduledAt, data: p });
    });

    blogs?.forEach(p => {
      const date = p.publishAt || p.publishedAt || p.createdAt;
      if (date && isSameDay(date, day))
        items.push({ type: "blog", date, data: p });
    });

    videos?.forEach(p => {
      const date = p.publishAt || p.publishedAt || p.createdAt;
      if (date && isSameDay(date, day))
        items.push({ type: "video", date, data: p });
    });

    albums?.forEach(p => {
      const date = p.publishAt || p.createdAt;
      if (date && isSameDay(date, day))
        items.push({ type: "album", date, data: p });
    });

    return items;
  };

  const hasItems = (date: Date) => getItemsForDay(date).length > 0;

  const handleDropOnDate = (type: string, id: string, date: Date) => {
    scheduleDraftMutation.mutate({ type, id, date });
  };

  const drafts = [
    ...(blogs
      ?.filter(b => b.status === "draft" && !b.publishAt && !b.publishedAt)
      .map(b => ({ type: "blog", data: b })) || []),
    ...(videos
      ?.filter(v => !v.publishAt && !v.publishedAt)
      .map(v => ({ type: "video", data: v })) || []),
    ...(albums
      ?.filter(a => !a.publishAt)
      .map(a => ({ type: "album", data: a })) || []),
  ];

  return (
    <DashboardLayout>
      <div className="py-4">
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-8 gap-4">
          <div>
            <h1 className="text-3xl font-heading font-bold">Content Hub</h1>
            <p className="text-muted-foreground">
              Manage, schedule, and recycle your content
            </p>
          </div>

          <div className="flex gap-2">
            <Dialog open={isRecycleOpen} onOpenChange={setIsRecycleOpen}>
              <DialogTrigger asChild>
                <Button
                  variant="outline"
                  className="gap-2 border-purple-500 text-purple-600 hover:bg-purple-50"
                >
                  <RefreshCcw size={16} /> Recycle Content
                </Button>
              </DialogTrigger>
              <DialogContent className="max-w-2xl">
                <DialogHeader>
                  <DialogTitle>Recycle Existing Content</DialogTitle>
                </DialogHeader>
                <div className="grid grid-cols-2 gap-4 mt-4 max-h-[60vh] overflow-y-auto">
                  {videos?.map(video => (
                    <Card
                      key={video.id}
                      className="p-3 cursor-pointer hover:border-purple-500 transition-colors"
                      onClick={() => handleRecycleSelect(video)}
                    >
                      <div className="aspect-video bg-muted rounded-md mb-2 overflow-hidden">
                        {video.thumbnailUrl ? (
                          <img
                            src={video.thumbnailUrl}
                            className="w-full h-full object-cover"
                          />
                        ) : (
                          <div className="w-full h-full flex items-center justify-center">
                            <Video
                              size={24}
                              className="text-muted-foreground"
                            />
                          </div>
                        )}
                      </div>
                      <p className="font-medium text-sm line-clamp-1">
                        {video.title}
                      </p>
                      <p className="text-xs text-muted-foreground">
                        {video.publishedAt
                          ? format(video.publishedAt, "MMM d, yyyy")
                          : "Draft"}
                      </p>
                    </Card>
                  ))}
                </div>
              </DialogContent>
            </Dialog>

            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button className="gap-2">
                  <Plus size={16} /> Create Content
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                <Link href="/admin/video/new">
                  <DropdownMenuItem className="gap-2 cursor-pointer">
                    <Video size={16} /> Upload Video
                  </DropdownMenuItem>
                </Link>
                <Link href="/admin/photo/new">
                  <DropdownMenuItem className="gap-2 cursor-pointer">
                    <ImageIcon size={16} /> Create Photo Album
                  </DropdownMenuItem>
                </Link>
                <Link href="/admin/blog/new">
                  <DropdownMenuItem className="gap-2 cursor-pointer">
                    <FileText size={16} /> Write Blog Post
                  </DropdownMenuItem>
                </Link>
                <DropdownMenuItem
                  className="gap-2 cursor-pointer"
                  onClick={() => {
                    setNewPostMediaUrl("");
                    setNewPostCaption("");
                    setSelectedVideoToRecycle(null);
                    setIsDialogOpen(true);
                  }}
                >
                  <CalendarIcon size={16} /> Schedule Social Post
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </div>

        {/* Schedule Dialog (Shared) */}
        <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>
                {selectedVideoToRecycle
                  ? "Recycle Content"
                  : "Schedule New Post"}
              </DialogTitle>
            </DialogHeader>
            <form onSubmit={handleSchedulePost} className="space-y-4">
              <div className="space-y-2">
                <Label>Date</Label>
                <div className="p-2 border rounded-md bg-muted/20">
                  {selectedDate
                    ? format(selectedDate, "PPP")
                    : "Select a date on the calendar"}
                </div>
              </div>

              <div className="space-y-2">
                <Label>Platform</Label>
                <Select
                  value={newPostPlatform}
                  onValueChange={setNewPostPlatform}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="instagram_post">
                      Instagram Post
                    </SelectItem>
                    <SelectItem value="instagram_reel">
                      Instagram Reel
                    </SelectItem>
                    <SelectItem value="youtube_shorts">
                      YouTube Shorts
                    </SelectItem>
                    <SelectItem value="tiktok">TikTok</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label>Media URL</Label>
                <Input
                  value={newPostMediaUrl}
                  onChange={e => setNewPostMediaUrl(e.target.value)}
                  placeholder="https://..."
                />
              </div>

              <div className="space-y-2">
                <Label>Caption</Label>
                <div className="relative">
                  <Textarea
                    value={newPostCaption}
                    onChange={e => setNewPostCaption(e.target.value)}
                    placeholder="Enter caption..."
                    className="pr-12"
                  />
                  {isGeneratingAi && (
                    <div className="absolute top-2 right-2">
                      <Sparkles
                        size={16}
                        className="text-purple-500 animate-pulse"
                      />
                    </div>
                  )}
                </div>
              </div>

              <Button
                type="submit"
                disabled={saveMutation.isPending}
                className="w-full"
              >
                {saveMutation.isPending ? "Scheduling..." : "Schedule"}
              </Button>
            </form>
          </DialogContent>
        </Dialog>

        <div className="grid grid-cols-1 lg:grid-cols-[auto_1fr_300px] gap-8">
          <Card className="p-4 w-fit h-fit">
            <DayPicker
              mode="single"
              selected={selectedDate}
              onSelect={setSelectedDate}
              onMonthChange={handleMonthChange}
              modifiers={{ hasItem: d => hasItems(d) }}
              modifiersStyles={{
                hasItem: {
                  fontWeight: "bold",
                  color: "var(--primary)",
                  textDecoration: "underline",
                },
              }}
              styles={{ caption: { color: "inherit" } }}
              components={{
                Day: props => {
                  const { date } = props.day;
                  return (
                    <div
                      onDragOver={e => {
                        e.preventDefault();
                      }}
                      onDrop={e => {
                        e.preventDefault();
                        const itemData =
                          e.dataTransfer.getData("application/json");
                        if (itemData) {
                          const { type, id } = JSON.parse(itemData);
                          handleDropOnDate(type, id, date);
                        }
                      }}
                    >
                      <div {...props.htmlAttributes} />
                    </div>
                  );
                },
              }}
            />
          </Card>

          <div className="space-y-4">
            <h2 className="text-xl font-bold border-b pb-2">
              {selectedDate
                ? format(selectedDate, "EEEE, MMMM do, yyyy")
                : "Select a date"}
            </h2>

            {selectedDate && getItemsForDay(selectedDate).length === 0 && (
              <p className="text-muted-foreground py-8 text-center bg-muted/20 rounded-lg">
                No content scheduled or published for this day.
              </p>
            )}

            <div className="grid gap-4">
              {selectedDate &&
                getItemsForDay(selectedDate).map((item, idx) => (
                  <Card
                    key={`${item.type}-${idx}`}
                    className="p-4 flex gap-4 items-start hover:shadow-md transition-shadow"
                  >
                    {/* Thumbnail / Icon */}
                    <div className="w-24 h-24 bg-muted rounded-md overflow-hidden flex-shrink-0 flex items-center justify-center text-muted-foreground">
                      {item.type === "scheduled" && item.data.thumbnailUrl && (
                        <img
                          src={item.data.thumbnailUrl}
                          className="w-full h-full object-cover"
                        />
                      )}
                      {item.type === "blog" && item.data.coverImage && (
                        <img
                          src={item.data.coverImage}
                          className="w-full h-full object-cover"
                        />
                      )}
                      {item.type === "video" && item.data.thumbnailUrl && (
                        <img
                          src={item.data.thumbnailUrl}
                          className="w-full h-full object-cover"
                        />
                      )}
                      {item.type === "album" && item.data.coverImage && (
                        <img
                          src={item.data.coverImage}
                          className="w-full h-full object-cover"
                        />
                      )}

                      {/* Fallback Icons */}
                      {!(
                        (item.data as any).thumbnailUrl ||
                        (item.data as any).coverImage
                      ) && (
                        <>
                          {item.type === "scheduled" && (
                            <CalendarIcon size={24} />
                          )}
                          {item.type === "blog" && <FileText size={24} />}
                          {item.type === "video" && <Video size={24} />}
                          {item.type === "album" && <ImageIcon size={24} />}
                        </>
                      )}
                    </div>

                    {/* Content */}
                    <div className="flex-1 min-w-0">
                      <div className="flex justify-between items-start">
                        <div className="flex items-center gap-2 mb-1">
                          {item.type === "scheduled" ? (
                            <span className="p-1 rounded-full bg-purple-100 text-purple-700">
                              <CalendarIcon size={14} />
                            </span>
                          ) : item.type === "video" ? (
                            <span className="p-1 rounded-full bg-blue-100 text-blue-700">
                              <Video size={14} />
                            </span>
                          ) : item.type === "blog" ? (
                            <span className="p-1 rounded-full bg-green-100 text-green-700">
                              <FileText size={14} />
                            </span>
                          ) : (
                            <span className="p-1 rounded-full bg-orange-100 text-orange-700">
                              <ImageIcon size={14} />
                            </span>
                          )}

                          <span className="font-semibold capitalize text-sm">
                            {item.type === "scheduled"
                              ? item.data.platform.replace("_", " ")
                              : item.type === "photo"
                                ? "Photo Album"
                                : item.type}
                          </span>

                          {item.type === "scheduled" && (
                            <span
                              className={`text-[10px] px-2 py-0.5 rounded-full uppercase ${
                                item.data.status === "posted"
                                  ? "bg-green-100 text-green-800"
                                  : "bg-gray-100 text-gray-800"
                              }`}
                            >
                              {item.data.status}
                            </span>
                          )}
                        </div>

                        <div className="flex gap-1">
                          {item.type === "scheduled" ? (
                            <Button
                              variant="ghost"
                              size="sm"
                              className="h-8 w-8 text-destructive hover:text-destructive"
                              onClick={() => {
                                if (confirm("Delete this scheduled post?")) {
                                  deleteMutation.mutate(item.data.id);
                                }
                              }}
                            >
                              <Trash2 size={16} />
                            </Button>
                          ) : (
                            <Link
                              href={`/admin/${item.type === "album" ? "photo" : item.type}/edit/${item.data.id}`}
                            >
                              <Button
                                variant="ghost"
                                size="sm"
                                className="text-xs h-8"
                              >
                                Edit
                              </Button>
                            </Link>
                          )}
                        </div>
                      </div>

                      <h3 className="font-medium text-base truncate mb-1">
                        {item.type === "scheduled"
                          ? item.data.caption
                          : item.data.title}
                      </h3>

                      <div className="text-xs text-muted-foreground">
                        {format(item.date, "p")}
                        {item.type === "scheduled" && item.data.contentId && (
                          <span className="ml-2 flex items-center gap-1 inline-flex text-purple-600">
                            <RefreshCcw size={10} /> Repurposed
                          </span>
                        )}
                      </div>
                    </div>
                  </Card>
                ))}
            </div>
          </div>

          {/* Drafts Sidebar */}
          <div className="space-y-4">
            <h2 className="text-xl font-bold border-b pb-2">Drafts</h2>
            <p className="text-xs text-muted-foreground mb-4">
              Drag these items onto the calendar to schedule them.
            </p>
            <div className="flex flex-col gap-3">
              {drafts.length === 0 && (
                <p className="text-sm text-center text-muted-foreground py-4 bg-muted/20 rounded-md">
                  No unscheduled drafts.
                </p>
              )}
              {drafts.map((item, idx) => (
                <Card
                  key={`draft-${idx}`}
                  className="p-3 cursor-move hover:border-primary transition-colors hover:shadow-sm"
                  draggable
                  onDragStart={e => {
                    e.dataTransfer.setData(
                      "application/json",
                      JSON.stringify({ type: item.type, id: item.data.id })
                    );
                  }}
                >
                  <div className="flex items-start gap-3">
                    <div className="w-12 h-12 bg-muted rounded flex-shrink-0 flex items-center justify-center text-muted-foreground">
                      {item.type === "blog" && <FileText size={16} />}
                      {item.type === "video" && <Video size={16} />}
                      {item.type === "album" && <ImageIcon size={16} />}
                    </div>
                    <div className="min-w-0">
                      <p className="font-medium text-sm line-clamp-2">
                        {item.data.title}
                      </p>
                      <span className="text-[10px] uppercase text-muted-foreground mt-1 inline-block bg-muted px-1.5 py-0.5 rounded">
                        {item.type}
                      </span>
                    </div>
                  </div>
                </Card>
              ))}
            </div>
          </div>
        </div>
      </div>
    </DashboardLayout>
  );
}
