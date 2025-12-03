-- Create slider images table
CREATE TABLE IF NOT EXISTS slider_images (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  image_url TEXT NOT NULL,
  display_order INTEGER NOT NULL DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Create index on display_order for efficient sorting
CREATE INDEX IF NOT EXISTS idx_slider_images_display_order ON slider_images(display_order);

-- Create trigger to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_slider_images_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = CURRENT_TIMESTAMP;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER slider_images_updated_at_trigger
BEFORE UPDATE ON slider_images
FOR EACH ROW
EXECUTE FUNCTION update_slider_images_updated_at();

-- Add RLS policies if needed
ALTER TABLE slider_images ENABLE ROW LEVEL SECURITY;

-- Allow public to view slider images
CREATE POLICY "Allow public to view slider images" ON slider_images
  FOR SELECT
  TO public
  USING (true);

-- Allow authenticated admins to manage slider images
CREATE POLICY "Allow admins to manage slider images" ON slider_images
  FOR ALL
  TO authenticated
  USING (true)
  WITH CHECK (true);
