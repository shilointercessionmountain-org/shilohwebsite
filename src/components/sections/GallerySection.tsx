import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Play, ExternalLink, Video, Image } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";

export function GallerySection() {
  const { data: videos, isLoading } = useQuery({
    queryKey: ["videos"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("videos")
        .select("*")
        .order("display_order", { ascending: true })
        .limit(6);

      if (error) throw error;
      return data;
    },
  });

  const { data: churchInfo } = useQuery({
    queryKey: ["church-info"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("church_info")
        .select("youtube_channel_url")
        .maybeSingle();

      if (error) throw error;
      return data;
    },
  });

  const openVideo = (videoId: string) => {
    window.open(`https://www.youtube.com/watch?v=${videoId}`, "_blank");
  };

  return (
    <section id="gallery" className="section-padding bg-muted/30">
      <div className="container mx-auto">
        {/* Section Header */}
        <div className="text-center mb-16">
          <h2 className="font-display text-3xl md:text-5xl font-bold text-foreground mb-4">
            Video Gallery
          </h2>
          <p className="text-muted-foreground text-lg max-w-2xl mx-auto">
            Watch our latest sermons, worship sessions, and event highlights from our YouTube channel.
          </p>
        </div>

        {/* Video Grid */}
        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6">
          {isLoading ? (
            Array.from({ length: 6 }).map((_, i) => (
              <Card key={i} className="border-0 shadow-md overflow-hidden">
                <CardContent className="p-0">
                  <Skeleton className="aspect-video w-full" />
                  <div className="p-4">
                    <Skeleton className="h-5 w-3/4" />
                  </div>
                </CardContent>
              </Card>
            ))
          ) : videos && videos.length > 0 ? (
            videos.map((video) => (
              <Card
                key={video.id}
                className="border-0 shadow-md hover:shadow-xl transition-all duration-300 overflow-hidden group cursor-pointer"
                onClick={() => openVideo(video.youtube_video_id)}
              >
                <CardContent className="p-0">
                  {/* Thumbnail */}
                  <div className="relative aspect-video bg-muted overflow-hidden">
                    <img
                      src={`https://img.youtube.com/vi/${video.youtube_video_id}/maxresdefault.jpg`}
                      alt={video.title}
                      className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                      onError={(e) => {
                        (e.target as HTMLImageElement).src = `https://img.youtube.com/vi/${video.youtube_video_id}/hqdefault.jpg`;
                      }}
                    />
                    {/* Play Overlay */}
                    <div className="absolute inset-0 bg-foreground/40 opacity-0 group-hover:opacity-100 transition-opacity duration-300 flex items-center justify-center">
                      <div className="w-16 h-16 bg-primary rounded-full flex items-center justify-center shadow-lg">
                        <Play className="h-8 w-8 text-primary-foreground ml-1" />
                      </div>
                    </div>
                  </div>

                  {/* Title */}
                  <div className="p-4">
                    <h3 className="font-semibold text-foreground group-hover:text-primary transition-colors line-clamp-2">
                      {video.title}
                    </h3>
                  </div>
                </CardContent>
              </Card>
            ))
          ) : (
            <div className="col-span-3 text-center py-12">
              <Video className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
              <p className="text-muted-foreground">No videos available yet. Check back soon!</p>
            </div>
          )}
        </div>

        {/* Action Buttons */}
        <div className="flex flex-col sm:flex-row items-center justify-center gap-4 mt-10">
          <Button
            variant="outline"
            size="lg"
            className="gap-2"
            onClick={() => window.open(churchInfo?.youtube_channel_url || "https://www.youtube.com", "_blank")}
          >
            <ExternalLink className="h-4 w-4" />
            Watch More on YouTube
          </Button>
          <Button
            size="lg"
            className="gap-2"
            onClick={() => window.location.href = "/gallery"}
          >
            <Image className="h-4 w-4" />
            View Photo Gallery
          </Button>
        </div>
      </div>
    </section>
  );
}
