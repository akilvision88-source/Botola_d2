USE botola_d2;

-- =====================================================
-- ROLES
-- =====================================================
INSERT INTO roles (id, name, slug, description, is_system) VALUES
(1, 'Super Admin', 'super_admin', 'Full system access', 1),
(2, 'Admin',      'admin',       'Manage platform content', 1),
(3, 'Editor',     'editor',      'Manage live/upcoming/replay/results', 1),
(4, 'Moderator',  'moderator',   'Manage comments and messages', 1),
(5, 'User',       'user',        'Regular platform user', 1);

-- =====================================================
-- PERMISSIONS
-- =====================================================
INSERT INTO permissions (name, module, description) VALUES
('users.view','users','View users'),
('users.create','users','Create users'),
('users.edit','users','Edit users'),
('users.delete','users','Delete users'),
('admins.view','admins','View admins'),
('admins.create','admins','Create admins'),
('admins.edit','admins','Edit admins'),
('admins.delete','admins','Delete admins'),
('matches.view','matches','View matches'),
('matches.create','matches','Create matches'),
('matches.edit','matches','Edit matches'),
('matches.delete','matches','Delete matches'),
('replay.view','replay','View replays'),
('replay.create','replay','Create replays'),
('replay.edit','replay','Edit replays'),
('replay.delete','replay','Delete replays'),
('results.view','results','View results'),
('results.create','results','Create results'),
('results.edit','results','Edit results'),
('results.delete','results','Delete results'),
('teams.view','teams','View teams'),
('teams.create','teams','Create teams'),
('teams.edit','teams','Edit teams'),
('teams.delete','teams','Delete teams'),
('stadiums.view','stadiums','View stadiums'),
('stadiums.create','stadiums','Create stadiums'),
('stadiums.edit','stadiums','Edit stadiums'),
('stadiums.delete','stadiums','Delete stadiums'),
('standings.view','standings','View standings'),
('standings.manage','standings','Manage standings manually'),
('subscriptions.view','subscriptions','View subscriptions'),
('subscriptions.create','subscriptions','Create subscriptions'),
('subscriptions.edit','subscriptions','Edit subscriptions'),
('subscriptions.delete','subscriptions','Delete subscriptions'),
('notifications.view','notifications','View notifications'),
('notifications.send','notifications','Send notifications'),
('messages.view','messages','View messages'),
('messages.edit','messages','Update messages'),
('messages.delete','messages','Delete messages'),
('settings.view','settings','View settings'),
('settings.manage','settings','Manage settings');

-- =====================================================
-- ROLE PERMISSIONS
-- =====================================================
-- Super Admin: everything
INSERT INTO role_permissions (role_id, permission_id)
SELECT 1, id FROM permissions;

-- Admin: most except admins.delete & system-critical
INSERT INTO role_permissions (role_id, permission_id)
SELECT 2, id FROM permissions
WHERE name NOT IN ('admins.delete','settings.manage');

-- Editor
INSERT INTO role_permissions (role_id, permission_id)
SELECT 3, id FROM permissions
WHERE name IN (
  'matches.view','matches.create','matches.edit',
  'replay.view','replay.create','replay.edit',
  'results.view','results.create','results.edit',
  'teams.view','stadiums.view'
);

-- Moderator
INSERT INTO role_permissions (role_id, permission_id)
SELECT 4, id FROM permissions
WHERE name IN ('messages.view','messages.edit','messages.delete','notifications.view');

-- =====================================================
-- SUBSCRIPTION PLANS
-- =====================================================
INSERT INTO subscription_plans
(id, name, slug, description, price, currency, duration_days, features, live_access, replay_access, download_access, hd_access, is_active, display_order)
VALUES
(1, 'Free', 'free', 'Access to news, results, standings and basic content',
  0.00, 'MAD', 3650,
  JSON_ARRAY('Live scores','Standings','Match results','Basic news'),
  0, 0, 0, 0, 1, 1),
(2, 'Standard', 'standard', 'Watch Live Matches, Replays in HD',
  79.00, 'MAD', 30,
  JSON_ARRAY('Live Matches','Replay Access','HD Streaming','Match Stats'),
  1, 1, 0, 1, 1, 2),
(3, 'Gold', 'gold', 'Full Premium access with downloads',
  149.00, 'MAD', 30,
  JSON_ARRAY('Live Matches','Full Replay','HD Streaming','Download Matches','Premium Content','Priority Support'),
  1, 1, 1, 1, 1, 3);

-- =====================================================
-- DEMO SUPER ADMIN  (password: Admin@123)
-- =====================================================
INSERT INTO users (full_name, email, phone, password, role_id, subscription_plan_id, subscription_status, status, email_verified)
VALUES
('Super Admin', 'superadmin@botolad2.com', '+212600000000',
 '$2a$10$N9qo8uLOickgx2ZMRZoMyeIjZAgcfl7p92ldGxad68LJZdL17lhWy',
 1, 3, 'active', 'active', 1),
('Admin Demo', 'admin@botolad2.com', '+212600000001',
 '$2a$10$N9qo8uLOickgx2ZMRZoMyeIjZAgcfl7p92ldGxad68LJZdL17lhWy',
 2, 3, 'active', 'active', 1),
('Demo User', 'user@botolad2.com', '+212600000002',
 '$2a$10$N9qo8uLOickgx2ZMRZoMyeIjZAgcfl7p92ldGxad68LJZdL17lhWy',
 5, 1, 'active', 'active', 1);

-- =====================================================
-- STADIUMS
-- =====================================================
INSERT INTO stadiums (id, name, city, capacity, address) VALUES
(1, 'Stade Mohammed V', 'Casablanca', 45000, 'Boulevard Zerktouni, Casablanca'),
(2, 'Stade Moulay Abdellah', 'Rabat', 52000, 'Avenue Ibn Sina, Rabat'),
(3, 'Grand Stade de Marrakech', 'Marrakech', 45000, 'Route de Casablanca, Marrakech'),
(4, 'Stade Adrar', 'Agadir', 45480, 'Route de Taroudant, Agadir'),
(5, 'Stade Ibn Batouta', 'Tanger', 65000, 'Route de Rabat, Tanger');

-- =====================================================
-- TEAMS
-- =====================================================
INSERT INTO teams (id, name, short_name, slug, city, stadium_id, founded_year) VALUES
(1, 'Raja Club Athletic', 'RCA', 'raja-club-athletic', 'Casablanca', 1, 1949),
(2, 'Wydad Athletic Club', 'WAC', 'wydad-athletic-club', 'Casablanca', 1, 1937),
(3, 'AS FAR', 'FAR', 'as-far', 'Rabat', 2, 1958),
(4, 'Kawkab Marrakech', 'KACM', 'kawkab-marrakech', 'Marrakech', 3, 1947),
(5, 'Hassania Agadir', 'HUSA', 'hassania-agadir', 'Agadir', 4, 1946),
(6, 'Ittihad Tanger', 'IRT', 'ittihad-tanger', 'Tanger', 5, 1981),
(7, 'Maghreb Fès', 'MAS', 'maghreb-fes', 'Fès', 2, 1946),
(8, 'Renaissance Berkane', 'RSB', 'renaissance-berkane', 'Berkane', 2, 1938);

-- =====================================================
-- DEMO MATCHES
-- =====================================================
INSERT INTO matches
(competition, team_home_id, team_away_id, score_home, score_away, match_minute, status, stadium_id, city, referee, match_date, match_time, round)
VALUES
('Botola D2', 1, 2, 2, 1, 67, 'live',     1, 'Casablanca', 'Redouane Jiyed',  CURDATE(), '20:00:00', 'Round 12'),
('Botola D2', 3, 4, 0, 0,  0, 'upcoming', 2, 'Rabat',      'Yassine Bouslim',  DATE_ADD(CURDATE(), INTERVAL 1 DAY), '18:30:00', 'Round 13'),
('Botola D2', 5, 6, 1, 1, 90, 'finished', 4, 'Agadir',     'Samir Guezzaz',   DATE_SUB(CURDATE(), INTERVAL 3 DAY), '19:00:00', 'Round 11'),
('Botola D2', 7, 8, 3, 0, 90, 'finished', 2, 'Fès',        'Hamza El Fariq',  DATE_SUB(CURDATE(), INTERVAL 5 DAY), '17:00:00', 'Round 11');

-- Demo goals
INSERT INTO match_goals (match_id, team_id, player_name, minute) VALUES
(1, 1, 'Ahmed Hamoudan', 12),
(1, 2, 'Youssef El Amloud', 44),
(1, 1, 'Karim El Berkaoui', 78),
(3, 5, 'Mehdi Ouattara', 22),
(3, 6, 'Anas El Ouazzani', 61),
(4, 7, 'Bilal El Khannouss', 14),
(4, 7, 'Sofiane Bouftini', 33),
(4, 7, 'Hamza Moussadak', 55);

-- Demo match events
INSERT INTO match_events (match_id, team_id, event_type, player_name, minute) VALUES
(1, 1, 'goal', 'Ahmed Hamoudan', 12),
(1, 1, 'yellow_card', 'Badr Boulahroud', 34),
(1, 2, 'goal', 'Youssef El Amloud', 44),
(1, 2, 'substitution', 'Anas Zniti', 65),
(1, 1, 'goal', 'Karim El Berkaoui', 78);

-- Demo stats
INSERT INTO match_statistics
(match_id, possession_home, possession_away, shots_home, shots_away,
 shots_on_target_home, shots_on_target_away, corners_home, corners_away,
 fouls_home, fouls_away)
VALUES
(1, 55, 45, 12, 8, 6, 3, 7, 4, 9, 11);

-- =====================================================
-- DEMO REPLAYS
-- =====================================================
INSERT INTO replays (match_id, title, description, video_url, duration, replay_date, requires_subscription)
VALUES
(3, 'Hassania Agadir vs Ittihad Tanger - Full Match',
 'Full replay of the Botola D2 Round 11 match between HUSA and IRT',
 'https://example.com/demo/husa-irt-replay.m3u8',
 '1:52:00', DATE_SUB(CURDATE(), INTERVAL 3 DAY), 'standard'),
(4, 'Maghreb Fès vs Renaissance Berkane - Full Match',
 'Full replay of the Botola D2 Round 11 match between MAS and RSB',
 'https://example.com/demo/mas-rsb-replay.m3u8',
 '1:48:00', DATE_SUB(CURDATE(), INTERVAL 5 DAY), 'gold');

-- =====================================================
-- SETTINGS
-- =====================================================
INSERT INTO settings (setting_key, setting_value, setting_group) VALUES
('platform_name', 'BOTOLA D2', 'general'),
('platform_tagline', 'Your Ultimate Football Streaming Experience', 'general'),
('contact_email', 'contact@botolad2.com', 'general'),
('contact_phone', '+212 600 000 000', 'general'),
('primary_color', '#A200C7', 'appearance'),
('secondary_color', '#363636', 'appearance'),
('logo_url', '/assets/images/logo.svg', 'appearance'),
('favicon_url', '/assets/images/favicon.ico', 'appearance'),
('facebook_url', 'https://facebook.com/botolad2', 'social'),
('instagram_url', 'https://instagram.com/botolad2', 'social'),
('youtube_url', 'https://youtube.com/@botolad2', 'social'),
('tiktok_url', 'https://tiktok.com/@botolad2', 'social'),
('x_url', 'https://x.com/botolad2', 'social'),
('about_text', 'BOTOLA D2 is a modern football streaming platform...', 'content'),
('footer_text', '© 2025 BOTOLA D2. All rights reserved.', 'content'),
('default_language', 'fr', 'general');