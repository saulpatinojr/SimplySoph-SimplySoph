import { fetchPublishedMediaPlacements } from "@/lib/content";
import { useQuery } from "@tanstack/react-query";
import { Image as ImageIcon, Play } from "lucide-react";

export default function PageMediaRail({ targetKey, title = "Featured media" }: { targetKey: string; title?: string }) {
  const { data: placements = [] } = useQuery({
    queryKey: ["media-placements", targetKey],
    queryFn: () => fetchPublishedMediaPlacements(targetKey),
  });

  if (!placements.length) return null;

  return <section className="container max-w-6xl py-8 md:py-12">
    <h2 className="mb-5 font-display text-2xl font-semibold">{title}</h2>
    <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
      {placements.map(item => <article key={item.id} className="overflow-hidden rounded-2xl border border-border/60 bg-card shadow-sm">
        <div className="aspect-video bg-muted">
          {item.mediaType === "image" ? <img src={item.url} alt={item.title} className="h-full w-full object-cover" /> : <VideoEmbed url={item.url} title={item.title} />}
        </div>
        <div className="flex items-center gap-2 p-4 text-sm font-medium"><ImageIcon className="h-4 w-4 text-muted-foreground" />{item.title}</div>
      </article>)}
    </div>
  </section>;
}

function VideoEmbed({ url, title }: { url: string; title: string }) {
  const youtube = url.match(/(?:youtu\.be\/|youtube\.com\/(?:watch\?v=|embed\/))([^?&/]+)/)?.[1];
  if (!youtube) return <a href={url} target="_blank" rel="noreferrer" className="flex h-full w-full items-center justify-center gap-2 text-sm font-medium text-primary"><Play className="h-5 w-5" />Watch {title}</a>;
  return <iframe className="h-full w-full border-0" src={`https://www.youtube-nocookie.com/embed/${youtube}`} title={title} allow="accelerometer; autoplay; encrypted-media; picture-in-picture" allowFullScreen />;
}
