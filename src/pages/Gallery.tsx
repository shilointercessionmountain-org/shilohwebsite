import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Header } from "@/components/layout/Header";
import { Footer } from "@/components/layout/Footer";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Dialog,
  DialogContent,
  DialogTitle,
} from "@/components/ui/dialog";
import { ArrowLeft, ChevronLeft, ChevronRight, X, Image } from "lucide-react";
import { Link } from "react-router-dom";
import { format } from "date-fns";

interface Album {
  id: string;
  title: string;
  description: string | null;
  cover_image_url: string | null;
  created_at: string;
}

interface GalleryImage {
  id: string;
  image_url: string;
  caption: string | null;
}

export default function Gallery() {
  const [selectedAlbum, setSelectedAlbum] = useState<Album | null>(null);
  const [lightboxIndex, setLightboxIndex] = useState<number | null>(null);

  const { data: albums, isLoading: albumsLoading } = useQuery({
    queryKey: ["public-albums"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("gallery_albums")
        .select("*")
        .order("created_at", { ascending: false });

      if (error) throw error;
      return data as Album[];
    },
  });

  const { data: albumImages, isLoading: imagesLoading } = useQuery({
    queryKey: ["public-album-images", selectedAlbum?.id],
    queryFn: async () => {
      if (!selectedAlbum) return [];
      const { data, error } = await supabase
        .from("gallery_images")
        .select("*")
        .eq("album_id", selectedAlbum.id)
        .order("display_order", { ascending: true });

      if (error) throw error;
      return data as GalleryImage[];
    },
    enabled: !!selectedAlbum,
  });

  const navigateLightbox = (direction: "prev" | "next") => {
    if (lightboxIndex === null || !albumImages) return;
    if (direction === "prev") {
      setLightboxIndex(lightboxIndex > 0 ? lightboxIndex - 1 : albumImages.length - 1);
    } else {
      setLightboxIndex(lightboxIndex < albumImages.length - 1 ? lightboxIndex + 1 : 0);
    }
  };

  return (
    <div className="min-h-screen flex flex-col">
      <Header />
      <main className="flex-1">
        <section className="section-padding bg-background">
          <div className="container mx-auto">
            {/* Header */}
            <div className="mb-8">
              {selectedAlbum ? (
                <div>
                  <Button
                    variant="ghost"
                    className="mb-4 gap-2"
                    onClick={() => setSelectedAlbum(null)}
                  >
                    <ArrowLeft className="h-4 w-4" />
                    Back to Albums
                  </Button>
                  <h1 className="font-display text-3xl md:text-5xl font-bold text-foreground mb-2">
                    {selectedAlbum.title}
                  </h1>
                  {selectedAlbum.description && (
                    <p className="text-muted-foreground text-lg">
                      {selectedAlbum.description}
                    </p>
                  )}
                  <p className="text-sm text-muted-foreground mt-2">
                    {format(new Date(selectedAlbum.created_at), "MMMM d, yyyy")}
                  </p>
                </div>
              ) : (
                <div className="text-center">
                  <Link
                    to="/#gallery"
                    className="inline-flex items-center gap-2 text-muted-foreground hover:text-foreground mb-4"
                  >
                    <ArrowLeft className="h-4 w-4" />
                    Back to Home
                  </Link>
                  <h1 className="font-display text-3xl md:text-5xl font-bold text-foreground mb-4">
                    Photo Gallery
                  </h1>
                  <p className="text-muted-foreground text-lg max-w-2xl mx-auto">
                    Browse through our collection of photos from services, events, and fellowship gatherings.
                  </p>
                </div>
              )}
            </div>

            {/* Albums Grid */}
            {!selectedAlbum && (
              <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6">
                {albumsLoading ? (
                  Array.from({ length: 6 }).map((_, i) => (
                    <Card key={i} className="overflow-hidden">
                      <CardContent className="p-0">
                        <Skeleton className="aspect-video w-full" />
                        <div className="p-4">
                          <Skeleton className="h-6 w-3/4 mb-2" />
                          <Skeleton className="h-4 w-1/2" />
                        </div>
                      </CardContent>
                    </Card>
                  ))
                ) : albums && albums.length > 0 ? (
                  albums.map((album) => (
                    <Card
                      key={album.id}
                      className="overflow-hidden cursor-pointer hover:shadow-lg transition-shadow group"
                      onClick={() => setSelectedAlbum(album)}
                    >
                      <CardContent className="p-0">
                        <div className="aspect-video bg-muted overflow-hidden">
                          {album.cover_image_url ? (
                            <img
                              src={album.cover_image_url}
                              alt={album.title}
                              className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                            />
                          ) : (
                            <div className="w-full h-full flex items-center justify-center">
                              <Image className="h-12 w-12 text-muted-foreground/50" />
                            </div>
                          )}
                        </div>
                        <div className="p-4">
                          <h3 className="font-semibold text-foreground group-hover:text-primary transition-colors">
                            {album.title}
                          </h3>
                          <p className="text-sm text-muted-foreground">
                            {format(new Date(album.created_at), "MMMM d, yyyy")}
                          </p>
                        </div>
                      </CardContent>
                    </Card>
                  ))
                ) : (
                  <div className="col-span-full text-center py-12">
                    <Image className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                    <p className="text-muted-foreground">No photo albums available yet.</p>
                  </div>
                )}
              </div>
            )}

            {/* Album Images Grid */}
            {selectedAlbum && (
              <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
                {imagesLoading ? (
                  Array.from({ length: 8 }).map((_, i) => (
                    <Skeleton key={i} className="aspect-square w-full rounded-lg" />
                  ))
                ) : albumImages && albumImages.length > 0 ? (
                  albumImages.map((image, index) => (
                    <div
                      key={image.id}
                      className="aspect-square cursor-pointer group"
                      onClick={() => setLightboxIndex(index)}
                    >
                      <img
                        src={image.image_url}
                        alt={image.caption || "Gallery photo"}
                        className="w-full h-full object-cover rounded-lg group-hover:opacity-90 transition-opacity"
                      />
                    </div>
                  ))
                ) : (
                  <div className="col-span-full text-center py-12">
                    <Image className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                    <p className="text-muted-foreground">No photos in this album yet.</p>
                  </div>
                )}
              </div>
            )}
          </div>
        </section>
      </main>
      <Footer />

      {/* Lightbox */}
      <Dialog open={lightboxIndex !== null} onOpenChange={() => setLightboxIndex(null)}>
        <DialogContent className="max-w-[95vw] max-h-[95vh] p-0 bg-black/95 border-none">
          <DialogTitle className="sr-only">Image viewer</DialogTitle>
          {lightboxIndex !== null && albumImages && albumImages[lightboxIndex] && (
            <div className="relative flex items-center justify-center h-[90vh]">
              <img
                src={albumImages[lightboxIndex].image_url}
                alt={albumImages[lightboxIndex].caption || "Gallery photo"}
                className="max-w-full max-h-full object-contain"
              />
              <Button
                variant="ghost"
                size="icon"
                className="absolute top-4 right-4 text-white hover:bg-white/20"
                onClick={() => setLightboxIndex(null)}
              >
                <X className="h-6 w-6" />
              </Button>
              <Button
                variant="ghost"
                size="icon"
                className="absolute left-4 top-1/2 -translate-y-1/2 text-white hover:bg-white/20"
                onClick={() => navigateLightbox("prev")}
              >
                <ChevronLeft className="h-8 w-8" />
              </Button>
              <Button
                variant="ghost"
                size="icon"
                className="absolute right-4 top-1/2 -translate-y-1/2 text-white hover:bg-white/20"
                onClick={() => navigateLightbox("next")}
              >
                <ChevronRight className="h-8 w-8" />
              </Button>
              <div className="absolute bottom-4 left-1/2 -translate-x-1/2 text-white text-sm">
                {lightboxIndex + 1} / {albumImages.length}
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
