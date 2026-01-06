import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/use-toast";
import { Plus, Trash2, Image, Upload, X, Eye, EyeOff } from "lucide-react";
import { format } from "date-fns";

interface Album {
  id: string;
  title: string;
  description: string | null;
  cover_image_url: string | null;
  is_active: boolean;
  display_order: number;
  created_at: string;
}

interface GalleryImage {
  id: string;
  album_id: string;
  image_url: string;
  caption: string | null;
  display_order: number;
}

export default function Gallery() {
  const [isAlbumDialogOpen, setIsAlbumDialogOpen] = useState(false);
  const [selectedAlbum, setSelectedAlbum] = useState<Album | null>(null);
  const [newAlbum, setNewAlbum] = useState({ title: "", description: "" });
  const [uploading, setUploading] = useState(false);
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const { data: albums, isLoading } = useQuery({
    queryKey: ["admin-albums"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("gallery_albums")
        .select("*")
        .order("display_order", { ascending: true });

      if (error) throw error;
      return data as Album[];
    },
  });

  const { data: albumImages } = useQuery({
    queryKey: ["album-images", selectedAlbum?.id],
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

  const createAlbumMutation = useMutation({
    mutationFn: async (album: { title: string; description: string }) => {
      const { error } = await supabase.from("gallery_albums").insert({
        title: album.title,
        description: album.description || null,
      });
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["admin-albums"] });
      setIsAlbumDialogOpen(false);
      setNewAlbum({ title: "", description: "" });
      toast({ title: "Album created successfully" });
    },
    onError: (error: Error) => {
      toast({ title: "Error creating album", description: error.message, variant: "destructive" });
    },
  });

  const deleteAlbumMutation = useMutation({
    mutationFn: async (albumId: string) => {
      const { error } = await supabase.from("gallery_albums").delete().eq("id", albumId);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["admin-albums"] });
      setSelectedAlbum(null);
      toast({ title: "Album deleted successfully" });
    },
    onError: (error: Error) => {
      toast({ title: "Error deleting album", description: error.message, variant: "destructive" });
    },
  });

  const toggleAlbumVisibility = useMutation({
    mutationFn: async ({ albumId, isActive }: { albumId: string; isActive: boolean }) => {
      const { error } = await supabase
        .from("gallery_albums")
        .update({ is_active: isActive })
        .eq("id", albumId);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["admin-albums"] });
      toast({ title: "Album visibility updated" });
    },
  });

  const deleteImageMutation = useMutation({
    mutationFn: async (image: GalleryImage) => {
      // Delete from storage
      const fileName = image.image_url.split("/").pop();
      if (fileName) {
        await supabase.storage.from("gallery").remove([`${selectedAlbum?.id}/${fileName}`]);
      }
      // Delete from database
      const { error } = await supabase.from("gallery_images").delete().eq("id", image.id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["album-images", selectedAlbum?.id] });
      toast({ title: "Image deleted successfully" });
    },
    onError: (error: Error) => {
      toast({ title: "Error deleting image", description: error.message, variant: "destructive" });
    },
  });

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    if (!e.target.files || !selectedAlbum) return;

    setUploading(true);
    const files = Array.from(e.target.files);

    try {
      for (const file of files) {
        const fileExt = file.name.split(".").pop();
        const fileName = `${Date.now()}-${Math.random().toString(36).substring(7)}.${fileExt}`;
        const filePath = `${selectedAlbum.id}/${fileName}`;

        // Upload to storage
        const { error: uploadError } = await supabase.storage
          .from("gallery")
          .upload(filePath, file);

        if (uploadError) throw uploadError;

        // Get public URL
        const { data: urlData } = supabase.storage.from("gallery").getPublicUrl(filePath);

        // Save to database
        const { error: dbError } = await supabase.from("gallery_images").insert({
          album_id: selectedAlbum.id,
          image_url: urlData.publicUrl,
        });

        if (dbError) throw dbError;

        // Update cover image if first image
        if (!selectedAlbum.cover_image_url) {
          await supabase
            .from("gallery_albums")
            .update({ cover_image_url: urlData.publicUrl })
            .eq("id", selectedAlbum.id);
        }
      }

      queryClient.invalidateQueries({ queryKey: ["album-images", selectedAlbum.id] });
      queryClient.invalidateQueries({ queryKey: ["admin-albums"] });
      toast({ title: `${files.length} image(s) uploaded successfully` });
    } catch (error: unknown) {
      toast({
        title: "Error uploading images",
        description: error instanceof Error ? error.message : "Unknown error",
        variant: "destructive",
      });
    } finally {
      setUploading(false);
      e.target.value = "";
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-foreground">Photo Gallery</h1>
          <p className="text-muted-foreground">Manage photo albums and images</p>
        </div>
        <Dialog open={isAlbumDialogOpen} onOpenChange={setIsAlbumDialogOpen}>
          <DialogTrigger asChild>
            <Button className="gap-2">
              <Plus className="h-4 w-4" />
              New Album
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Create New Album</DialogTitle>
            </DialogHeader>
            <div className="space-y-4">
              <div>
                <Label htmlFor="title">Album Title</Label>
                <Input
                  id="title"
                  value={newAlbum.title}
                  onChange={(e) => setNewAlbum({ ...newAlbum, title: e.target.value })}
                  placeholder="e.g., Sunday 14th Service"
                />
              </div>
              <div>
                <Label htmlFor="description">Description (optional)</Label>
                <Textarea
                  id="description"
                  value={newAlbum.description}
                  onChange={(e) => setNewAlbum({ ...newAlbum, description: e.target.value })}
                  placeholder="Brief description of the album"
                />
              </div>
              <Button
                onClick={() => createAlbumMutation.mutate(newAlbum)}
                disabled={!newAlbum.title || createAlbumMutation.isPending}
                className="w-full"
              >
                Create Album
              </Button>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      <div className="grid lg:grid-cols-3 gap-6">
        {/* Albums List */}
        <div className="lg:col-span-1 space-y-4">
          <h2 className="font-semibold text-lg">Albums</h2>
          {isLoading ? (
            <p className="text-muted-foreground">Loading...</p>
          ) : albums && albums.length > 0 ? (
            <div className="space-y-2">
              {albums.map((album) => (
                <Card
                  key={album.id}
                  className={`cursor-pointer transition-colors ${
                    selectedAlbum?.id === album.id ? "border-primary" : ""
                  }`}
                  onClick={() => setSelectedAlbum(album)}
                >
                  <CardContent className="p-4">
                    <div className="flex items-start justify-between gap-2">
                      <div className="flex-1 min-w-0">
                        <h3 className="font-medium truncate">{album.title}</h3>
                        <p className="text-sm text-muted-foreground">
                          {format(new Date(album.created_at), "MMM d, yyyy")}
                        </p>
                      </div>
                      <Badge variant={album.is_active ? "default" : "secondary"}>
                        {album.is_active ? "Active" : "Hidden"}
                      </Badge>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          ) : (
            <p className="text-muted-foreground text-center py-8">No albums yet</p>
          )}
        </div>

        {/* Album Details */}
        <div className="lg:col-span-2">
          {selectedAlbum ? (
            <Card>
              <CardHeader className="flex flex-row items-center justify-between">
                <div>
                  <CardTitle>{selectedAlbum.title}</CardTitle>
                  {selectedAlbum.description && (
                    <p className="text-sm text-muted-foreground mt-1">
                      {selectedAlbum.description}
                    </p>
                  )}
                </div>
                <div className="flex items-center gap-2">
                  <Button
                    variant="outline"
                    size="icon"
                    onClick={() =>
                      toggleAlbumVisibility.mutate({
                        albumId: selectedAlbum.id,
                        isActive: !selectedAlbum.is_active,
                      })
                    }
                    title={selectedAlbum.is_active ? "Hide album" : "Show album"}
                  >
                    {selectedAlbum.is_active ? (
                      <Eye className="h-4 w-4" />
                    ) : (
                      <EyeOff className="h-4 w-4" />
                    )}
                  </Button>
                  <Button
                    variant="destructive"
                    size="icon"
                    onClick={() => deleteAlbumMutation.mutate(selectedAlbum.id)}
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
              </CardHeader>
              <CardContent className="space-y-4">
                {/* Upload Button */}
                <div className="flex items-center gap-4">
                  <Label htmlFor="file-upload" className="cursor-pointer">
                    <div className="flex items-center gap-2 px-4 py-2 border rounded-md hover:bg-muted transition-colors">
                      <Upload className="h-4 w-4" />
                      {uploading ? "Uploading..." : "Upload Images"}
                    </div>
                    <Input
                      id="file-upload"
                      type="file"
                      accept="image/*"
                      multiple
                      onChange={handleFileUpload}
                      disabled={uploading}
                      className="hidden"
                    />
                  </Label>
                </div>

                {/* Images Grid */}
                {albumImages && albumImages.length > 0 ? (
                  <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                    {albumImages.map((image) => (
                      <div key={image.id} className="relative group aspect-square">
                        <img
                          src={image.image_url}
                          alt={image.caption || "Gallery image"}
                          className="w-full h-full object-cover rounded-lg"
                        />
                        <Button
                          variant="destructive"
                          size="icon"
                          className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity h-8 w-8"
                          onClick={() => deleteImageMutation.mutate(image)}
                        >
                          <X className="h-4 w-4" />
                        </Button>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="text-center py-12 text-muted-foreground">
                    <Image className="h-12 w-12 mx-auto mb-4 opacity-50" />
                    <p>No images in this album yet</p>
                    <p className="text-sm">Upload some photos to get started</p>
                  </div>
                )}
              </CardContent>
            </Card>
          ) : (
            <Card>
              <CardContent className="text-center py-12 text-muted-foreground">
                <Image className="h-12 w-12 mx-auto mb-4 opacity-50" />
                <p>Select an album to view and manage photos</p>
              </CardContent>
            </Card>
          )}
        </div>
      </div>
    </div>
  );
}
