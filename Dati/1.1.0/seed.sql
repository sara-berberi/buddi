-- Buddi — Seed v1.1.0
-- Safe to re-run (ON CONFLICT DO NOTHING).
-- Tirana venues, discussion topics, and the daily question pool.

-- Venues (Tirana) ----------------------------------------------------------
INSERT INTO venues (name, city, neighborhood, category, price_range, description, photo_url, featured) VALUES
  ('Komiteti Kafe Muzeum', 'Tirana', 'Blloku',      'cafe',    '$$',  'Vintage raki bar and café full of old Albanian artifacts.', NULL, TRUE),
  ('Mulliri Vjeter',       'Tirana', 'Blloku',      'cafe',    '$',   'Beloved local chain for coffee and pastries.',             NULL, FALSE),
  ('Sophie Caffe',         'Tirana', 'Pazari i Ri', 'cafe',    '$$',  'Bright corner café near the new bazaar.',                  NULL, FALSE),
  ('Era',                  'Tirana', 'Blloku',      'food',    '$$',  'Classic Albanian and Mediterranean dishes.',               NULL, TRUE),
  ('Oda',                  'Tirana', 'Qender',      'food',    '$$',  'Traditional Albanian home cooking in a cozy setting.',      NULL, FALSE),
  ('Mrizi i Zanave',       'Tirana', 'Qender',      'food',    '$$$', 'Slow-food, farm-to-table Albanian cuisine.',               NULL, TRUE),
  ('Grand Park of Tirana', 'Tirana', 'Liqeni',      'outdoor', '$',   'Lakeside park, walking trails, paddle boats.',             NULL, FALSE),
  ('Dajti Ekspres',        'Tirana', 'Dajti',       'outdoor', '$$',  'Cable car up Mount Dajti with panoramic views.',           NULL, TRUE),
  ('Pazari i Ri',          'Tirana', 'Pazari i Ri', 'outdoor', '$',   'Lively renovated market square, great for a stroll.',       NULL, FALSE),
  ('Bunk''Art 2',          'Tirana', 'Qender',      'culture', '$',   'Cold-war bunker museum in the city center.',                NULL, FALSE),
  ('National Gallery of Arts', 'Tirana', 'Qender',  'culture', '$',   'Albania''s premier collection of fine art.',               NULL, FALSE),
  ('Tirana Castle',        'Tirana', 'Qender',      'culture', '$$',  'Restored castle walls with shops and bars inside.',        NULL, FALSE)
ON CONFLICT (name, neighborhood) DO NOTHING;

-- Discussion topics --------------------------------------------------------
INSERT INTO discussion_topics (category, topic) VALUES
  ('cafe',    'What''s a small ritual that makes your week better?'),
  ('cafe',    'If you could only drink one thing for a year, what is it?'),
  ('cafe',    'What''s something you changed your mind about recently?'),
  ('food',    'What''s the best meal you''ve had this year?'),
  ('food',    'What dish reminds you of home?'),
  ('food',    'If you opened a restaurant, what would it serve?'),
  ('outdoor', 'Where would you go if you had a free week tomorrow?'),
  ('outdoor', 'What''s a place you keep meaning to visit but never do?'),
  ('outdoor', 'When did you last feel genuinely peaceful outside?'),
  ('culture', 'What''s a piece of art or music that stuck with you?'),
  ('culture', 'What''s something you want to learn before you''re 40?'),
  ('culture', 'What''s an opinion you hold that most people disagree with?'),
  ('any',     'What are you most looking forward to this month?'),
  ('any',     'What''s something good that happened to you this week?'),
  ('any',     'Who is someone you''ve been meaning to reconnect with?')
ON CONFLICT (topic) DO NOTHING;

-- Daily question pool ------------------------------------------------------
-- active_date left NULL; the backend assigns one question to "today" on demand.
INSERT INTO daily_questions (prompt) VALUES
  ('Last thing that genuinely made you laugh?'),
  ('What are you procrastinating on right now?'),
  ('One word for how this week feels?'),
  ('What did you not expect to enjoy but did?'),
  ('What''s something small that made today better?'),
  ('Who did you think about today and why?'),
  ('What''s a song stuck in your head right now?'),
  ('What''s the last thing you cooked or ate that you loved?'),
  ('If today had a title, what would it be?'),
  ('What''s something you''re grateful for that you usually overlook?'),
  ('What''s a tiny win from the last 24 hours?'),
  ('What''s on your mind that you haven''t told anyone?'),
  ('What would make tomorrow a good day?'),
  ('What''s something you''re curious about lately?'),
  ('When did you last feel proud of yourself?'),
  ('What''s a place you wish you were right now?'),
  ('What''s the most honest thing you can say about today?'),
  ('What''s something you want to do more of?'),
  ('What surprised you this week?'),
  ('What''s a small thing you''re looking forward to?'),
  ('What''s something you need to let go of?'),
  ('Who made you smile recently?'),
  ('What''s the last kind thing someone did for you?'),
  ('What''s draining your energy lately?'),
  ('What''s one thing you''d tell your past self this week?')
ON CONFLICT (prompt) DO NOTHING;
