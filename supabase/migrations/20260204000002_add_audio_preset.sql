-- Add audio preset for audio generation models
INSERT INTO presets (key, type, title_en, title_ru, description_en, description_ru)
VALUES (
  'audio-gen',
  'audio',
  'Audio Generation',
  'Генерация аудио',
  'Generate sound effects and audio',
  'Генерация звуковых эффектов и аудио'
)
ON CONFLICT (key) DO UPDATE SET
  type = EXCLUDED.type,
  title_en = EXCLUDED.title_en,
  title_ru = EXCLUDED.title_ru;
