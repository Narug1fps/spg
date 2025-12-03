-- Create hero slider images table
CREATE TABLE IF NOT EXISTS hero_slider_images (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  image_url TEXT NOT NULL,
  display_order INTEGER NOT NULL DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Create index on display_order for efficient sorting
CREATE INDEX IF NOT EXISTS idx_hero_slider_display_order ON hero_slider_images(display_order);

-- Create trigger to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_hero_slider_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = CURRENT_TIMESTAMP;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER hero_slider_updated_at_trigger
BEFORE UPDATE ON hero_slider_images
FOR EACH ROW
EXECUTE FUNCTION update_hero_slider_updated_at();

-- Add RLS policies
ALTER TABLE hero_slider_images ENABLE ROW LEVEL SECURITY;

-- Allow public to view hero slider images
CREATE POLICY "Allow public to view hero slider images" ON hero_slider_images
  FOR SELECT
  TO public
  USING (true);

-- Allow authenticated admins to manage hero slider images
CREATE POLICY "Allow admins to manage hero slider images" ON hero_slider_images
  FOR ALL
  TO authenticated
  USING (true)
  WITH CHECK (true);
