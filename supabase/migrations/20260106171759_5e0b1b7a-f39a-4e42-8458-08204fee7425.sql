-- Create gallery_albums table for grouping photos
CREATE TABLE public.gallery_albums (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  title TEXT NOT NULL,
  description TEXT,
  cover_image_url TEXT,
  is_active BOOLEAN DEFAULT true,
  display_order INTEGER DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create gallery_images table for individual photos
CREATE TABLE public.gallery_images (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  album_id UUID NOT NULL REFERENCES public.gallery_albums(id) ON DELETE CASCADE,
  image_url TEXT NOT NULL,
  caption TEXT,
  display_order INTEGER DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS on both tables
ALTER TABLE public.gallery_albums ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.gallery_images ENABLE ROW LEVEL SECURITY;

-- RLS policies for gallery_albums
CREATE POLICY "Anyone can view active albums" 
  ON public.gallery_albums 
  FOR SELECT 
  USING (is_active = true);

CREATE POLICY "Admins can manage albums" 
  ON public.gallery_albums 
  FOR ALL 
  USING (has_role(auth.uid(), 'admin'::app_role))
  WITH CHECK (has_role(auth.uid(), 'admin'::app_role));

-- RLS policies for gallery_images
CREATE POLICY "Anyone can view images in active albums" 
  ON public.gallery_images 
  FOR SELECT 
  USING (
    EXISTS (
      SELECT 1 FROM public.gallery_albums 
      WHERE id = album_id AND is_active = true
    )
  );

CREATE POLICY "Admins can manage images" 
  ON public.gallery_images 
  FOR ALL 
  USING (has_role(auth.uid(), 'admin'::app_role))
  WITH CHECK (has_role(auth.uid(), 'admin'::app_role));

-- Create storage bucket for gallery images
INSERT INTO storage.buckets (id, name, public) 
VALUES ('gallery', 'gallery', true);

-- Storage policies for gallery bucket
CREATE POLICY "Anyone can view gallery images" 
  ON storage.objects 
  FOR SELECT 
  USING (bucket_id = 'gallery');

CREATE POLICY "Admins can upload gallery images" 
  ON storage.objects 
  FOR INSERT 
  WITH CHECK (bucket_id = 'gallery' AND has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "Admins can delete gallery images" 
  ON storage.objects 
  FOR DELETE 
  USING (bucket_id = 'gallery' AND has_role(auth.uid(), 'admin'::app_role));

-- Trigger for updating timestamps
CREATE TRIGGER update_gallery_albums_updated_at
  BEFORE UPDATE ON public.gallery_albums
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();