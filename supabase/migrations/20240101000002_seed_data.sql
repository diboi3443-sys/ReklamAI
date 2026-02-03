-- Seed initial data: presets and models

-- Ensure presets table has correct structure
-- This fixes the table if it was created with wrong schema
DO $$
BEGIN
  -- Check if table exists, if not create it
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.tables 
    WHERE table_schema = 'public' 
    AND table_name = 'presets'
  ) THEN
    CREATE TABLE presets (
      id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
      type TEXT NOT NULL CHECK (type IN ('image', 'video', 'edit')),
      key TEXT UNIQUE NOT NULL,
      title_ru TEXT NOT NULL,
      title_en TEXT NOT NULL,
      description_ru TEXT,
      description_en TEXT,
      defaults JSONB DEFAULT '{}'::jsonb,
      created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL
    );
  ELSE
    -- Table exists, check and add missing columns
    -- Add 'type' column if missing
    IF NOT EXISTS (
      SELECT 1 FROM information_schema.columns 
      WHERE table_schema = 'public' 
      AND table_name = 'presets' 
      AND column_name = 'type'
    ) THEN
      ALTER TABLE presets ADD COLUMN type TEXT CHECK (type IN ('image', 'video', 'edit'));
      UPDATE presets SET type = 'image' WHERE type IS NULL;
      ALTER TABLE presets ALTER COLUMN type SET NOT NULL;
    END IF;
    
    -- Add 'key' column if missing
    IF NOT EXISTS (
      SELECT 1 FROM information_schema.columns 
      WHERE table_schema = 'public' 
      AND table_name = 'presets' 
      AND column_name = 'key'
    ) THEN
      ALTER TABLE presets ADD COLUMN key TEXT;
      -- Create unique constraint if possible
      CREATE UNIQUE INDEX IF NOT EXISTS presets_key_unique ON presets(key) WHERE key IS NOT NULL;
      ALTER TABLE presets ALTER COLUMN key SET NOT NULL;
    END IF;
    
    -- Add other missing columns
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema = 'public' AND table_name = 'presets' AND column_name = 'title_ru') THEN
      ALTER TABLE presets ADD COLUMN title_ru TEXT NOT NULL DEFAULT '';
    END IF;
    
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema = 'public' AND table_name = 'presets' AND column_name = 'title_en') THEN
      ALTER TABLE presets ADD COLUMN title_en TEXT NOT NULL DEFAULT '';
    END IF;
    
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema = 'public' AND table_name = 'presets' AND column_name = 'description_ru') THEN
      ALTER TABLE presets ADD COLUMN description_ru TEXT;
    END IF;
    
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema = 'public' AND table_name = 'presets' AND column_name = 'description_en') THEN
      ALTER TABLE presets ADD COLUMN description_en TEXT;
    END IF;
    
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema = 'public' AND table_name = 'presets' AND column_name = 'defaults') THEN
      ALTER TABLE presets ADD COLUMN defaults JSONB DEFAULT '{}'::jsonb;
    END IF;
    
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema = 'public' AND table_name = 'presets' AND column_name = 'created_at') THEN
      ALTER TABLE presets ADD COLUMN created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL;
    END IF;
  END IF;
END $$;

-- Insert presets
INSERT INTO presets (type, key, title_ru, title_en, description_ru, description_en, defaults) VALUES
('image', 'image-gen', 'Генерация изображений', 'Image Generation', 'Создание изображений из текста', 'Create images from text', '{"credits": 1, "aspect_ratios": ["1:1", "16:9", "9:16", "4:3"]}'::jsonb),
('video', 'video-gen', 'Генерация видео', 'Video Generation', 'Создание видео из текста или изображения', 'Create videos from text or image', '{"credits": 5, "aspect_ratios": ["16:9", "9:16"], "duration": 5}'::jsonb),
('edit', 'image-edit', 'Редактирование изображений', 'Image Editing', 'Редактирование существующих изображений', 'Edit existing images', '{"credits": 2, "operations": ["inpaint", "outpaint", "relight", "upscale"]}'::jsonb)
ON CONFLICT (key) DO NOTHING;

-- Insert models (KIE.ai placeholders)
INSERT INTO models (provider, key, modality, title, capabilities, price_multiplier) VALUES
('kie', 'kie-flux-pro', 'image', 'KIE FLUX Pro', '{"formats": ["png", "jpg"], "max_resolution": "1024x1024"}'::jsonb, 1.0),
('kie', 'kie-video-1', 'video', 'KIE Video Model 1', '{"formats": ["mp4"], "max_duration": 10}'::jsonb, 5.0),
('kie', 'kie-edit-1', 'edit', 'KIE Edit Model 1', '{"operations": ["inpaint", "relight"]}'::jsonb, 2.0)
ON CONFLICT (key) DO NOTHING;

-- Insert default admin settings
INSERT INTO admin_settings (id, markup_percent) VALUES (1, 0)
ON CONFLICT (id) DO NOTHING;
