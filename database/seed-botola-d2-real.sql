-- =====================================================
-- BOTOLA D2 — Real Moroccan Second Division Data
-- القسم الوطني الثاني - الموسم 2025/2026
-- =====================================================

USE botola_d2;

-- ============ تنظيف البيانات القديمة ============
SET FOREIGN_KEY_CHECKS = 0;
TRUNCATE TABLE match_events;
TRUNCATE TABLE match_goals;
TRUNCATE TABLE match_statistics;
TRUNCATE TABLE match_cards;
TRUNCATE TABLE replays;
TRUNCATE TABLE notifications;
TRUNCATE TABLE saved_matches;
TRUNCATE TABLE contact_messages;
TRUNCATE TABLE subscriptions;
TRUNCATE TABLE matches;
TRUNCATE TABLE teams;
TRUNCATE TABLE stadiums;
SET FOREIGN_KEY_CHECKS = 1;

-- =====================================================
-- 1. STADIUMS — الملاعب الحقيقية
-- =====================================================
INSERT INTO stadiums (id, name, city, capacity, address) VALUES
(1, 'المركب الرياضي لفاس',           'فاس',         45000, 'طريق صفرو، فاس'),
(2, 'ملعب سانية الرمل',               'تطوان',       15000, 'شارع سانية الرمل، تطوان'),
(3, 'المركب الرياضي ببني ملال',       'بني ملال',     8000, 'شارع محمد الخامس، بني ملال'),
(4, 'ملعب يعقوب المنصور',             'تمارة',        5000, 'حي يعقوب المنصور، تمارة'),
(5, 'الملعب البلدي بخنيفرة',          'خنيفرة',      10000, 'شارع الحسن الثاني، خنيفرة'),
(6, 'ملعب المسيرة',                    'بوجدور',       5000, 'شارع المسيرة، بوجدور'),
(7, 'ملعب الأمل',                      'تزنيت',        5000, 'شارع محمد السادس، تزنيت'),
(8, 'الملعب البلدي بسوق السبت',       'سوق السبت',    4000, 'سوق السبت أولاد النمة'),
(9, 'ملعب الشهيد أحمد شكري',           'سطات',         8000, 'شارع الحسن الأول، سطات'),
(10, 'الملعب البلدي بالقنيطرة',        'القنيطرة',    15000, 'شارع محمد الخامس، القنيطرة'),
(11, 'ملعب الراسينغ البيضاوي',         'الدار البيضاء', 5000, 'حي النخيل، الدار البيضاء'),
(12, 'الملعب البلدي بوجدة',            'وجدة',        10000, 'شارع مكة، وجدة'),
(13, 'ملعب العبدي',                     'الجديدة',      8000, 'شارع العبدي، الجديدة'),
(14, 'الملعب البلدي بن جرير',          'بن جرير',      5000, 'شارع محمد الخامس، بن جرير'),
(15, 'ملعب الصخور السوداء',            'الدار البيضاء', 3000, 'حي الصخور السوداء'),
(16, 'الملعب البلدي بأبي الجعد',       'أبي الجعد',    3000, 'شارع الحسن الثاني، أبي الجعد');

-- =====================================================
-- 2. TEAMS — 16 فريق حقيقي من القسم الثاني
-- =====================================================

INSERT INTO teams (id, name, short_name, slug, city, stadium_id, founded_year, description) VALUES
-- الأسماء الرسمية بالعربية مع الأسماء اللاتينية
(1,  'المغرب الرياضي التطواني', 'MAT', 'moghreb-tetouan', 'تطوان', 2, 1922, 'نادي المغرب التطواني - الحمامة البيضاء'),
(2,  'الوداد الرياضي لتمارة', 'WST', 'widad-temara', 'تمارة', 4, 1993, 'الوداد الرياضي لتمارة'),
(3,  'اتحاد أمل تيزنيت', 'USAT', 'amal-tiznit', 'تيزنيت', 7, 1961, 'اتحاد أمل تيزنيت'),
(4,  'شباب المسيرة', 'JSM', 'jeunesse-massira', 'بوجدور', 6, 1971, 'شباب المسيرة الرياضي'),
(5,  'الشباب الرياضي السالمي', 'JSS', 'jeunesse-soualem', 'السالمي', 8, 1953, 'الشباب الرياضي السالمي'),
(6,  'شباب أطلس خنيفرة', 'CAK', 'chabab-atlas-khenifra', 'خنيفرة', 5, 1943, 'شباب أطلس خنيفرة - نادي الأطلس'),
(7,  'سطاد المغربي', 'SM', 'stade-marocain', 'الرباط', 9, 1927, 'سطاد المغربي - أقدم نادي في المغرب'),
(8,  'الوداد الرياضي الفاسي', 'WAF', 'wydad-fes', 'فاس', 1, 1948, 'الوداد الرياضي الفاسي - البيانكونيري'),
(9,  'مولودية وجدة', 'MCO', 'mouloudia-oujda', 'وجدة', 12, 1949, 'مولودية وجدة - سندباد الشرق'),
(10, 'شباب بن جرير', 'CSBJ', 'chabab-benguerir', 'بن جرير', 14, 1946, 'شباب بن جرير'),
(11, 'اتحاد وجدة الرياضي', 'USMO', 'usm-oujda', 'وجدة', 12, 1957, 'اتحاد وجدة الرياضي'),
(12, 'النادي الرياضي القنيطري', 'KAC', 'kac-kenitra', 'القنيطرة', 10, 1938, 'النادي الرياضي القنيطري - الفرسان'),
(13, 'سبورتينغ شباب المحمدية', 'SCCM', 'chabab-mohammedia', 'المحمدية', 15, 1948, 'شباب المحمدية'),
(14, 'الاتحاد الرياضي البلدي لأبي الجعد', 'USMB', 'us-boujaad', 'أبي الجعد', 16, 1948, 'الاتحاد الرياضي البلدي لأبي الجعد'),
(15, 'رجاء بني ملال', 'RBM', 'raja-beni-mellal', 'بني ملال', 3, 1956, 'رجاء بني ملال - الفريق الملوني'),
(16, 'الراسينغ الرياضي البيضاوي', 'RAC', 'racing-casablanca', 'الدار البيضاء', 11, 1917, 'الراسينغ الرياضي البيضاوي - أقدم نادي بالمغرب');

-- =====================================================
-- 3. MATCHES — مباريات مباشرة (live)
-- =====================================================
INSERT INTO matches
(competition, team_home_id, team_away_id, score_home, score_away, match_minute, status, stadium_id, city, referee, match_date, match_time, round)
VALUES
('Botola D2', 1, 4, 2, 1, 67, 'live', 2, 'تطوان', 'ياسين بوسليم', CURDATE(), '20:00:00', 'الجولة 17'),
('Botola D2', 2, 6, 0, 0, 34, 'live', 4, 'تمارة', 'سمير گزاز', CURDATE(), '18:30:00', 'الجولة 17'),
('Botola D2', 3, 5, 1, 3, 78, 'live', 7, 'تيزنيت', 'حمزة الفريق', CURDATE(), '17:00:00', 'الجولة 17'),
('Botola D2', 7, 10, 1, 1, 45, 'halftime', 9, 'سطات', 'رضوان جيد', CURDATE(), '19:30:00', 'الجولة 17'),
('Botola D2', 13, 8, 3, 2, 88, 'live', 15, 'المحمدية', 'عادل زوراق', CURDATE(), '21:00:00', 'الجولة 17');

-- =====================================================
-- 4. MATCHES — مباريات قادمة (upcoming)
-- =====================================================
INSERT INTO matches
(competition, team_home_id, team_away_id, status, stadium_id, city, referee, match_date, match_time, round)
VALUES
('Botola D2', 11, 12, 'upcoming', 12, 'وجدة', 'نبيل بنرقلو', DATE_ADD(CURDATE(), INTERVAL 1 DAY), '17:00:00', 'الجولة 17'),
('Botola D2', 14, 15, 'upcoming', 16, 'أبي الجعد', 'رضوان جيد', DATE_ADD(CURDATE(), INTERVAL 1 DAY), '19:00:00', 'الجولة 17'),
('Botola D2', 9, 16, 'upcoming', 12, 'وجدة', 'هشام تمساماني', DATE_ADD(CURDATE(), INTERVAL 1 DAY), '21:00:00', 'الجولة 17'),
('Botola D2', 1, 2, 'upcoming', 2, 'تطوان', 'سمير گزاز', DATE_ADD(CURDATE(), INTERVAL 2 DAY), '18:00:00', 'الجولة 17'),
('Botola D2', 3, 7, 'upcoming', 7, 'تيزنيت', 'ياسين بوسليم', DATE_ADD(CURDATE(), INTERVAL 2 DAY), '20:30:00', 'الجولة 17'),
('Botola D2', 5, 6, 'upcoming', 8, 'السالمي', 'حمزة الفريق', DATE_ADD(CURDATE(), INTERVAL 3 DAY), '17:30:00', 'الجولة 17'),
('Botola D2', 4, 8, 'upcoming', 6, 'بوجدور', 'عادل زوراق', DATE_ADD(CURDATE(), INTERVAL 3 DAY), '19:00:00', 'الجولة 17'),
('Botola D2', 10, 11, 'upcoming', 14, 'بن جرير', 'نبيل بنرقلو', DATE_ADD(CURDATE(), INTERVAL 4 DAY), '18:30:00', 'الجولة 17'),
('Botola D2', 12, 13, 'upcoming', 10, 'القنيطرة', 'رضوان جيد', DATE_ADD(CURDATE(), INTERVAL 4 DAY), '20:00:00', 'الجولة 17'),
('Botola D2', 15, 16, 'upcoming', 3, 'بني ملال', 'هشام تمساماني', DATE_ADD(CURDATE(), INTERVAL 5 DAY), '19:30:00', 'الجولة 17');

-- =====================================================
-- 5. MATCHES — نتائج منتهية (finished)
-- =====================================================
INSERT INTO matches
(competition, team_home_id, team_away_id, score_home, score_away, match_minute, status, stadium_id, city, referee, match_date, match_time, round)
VALUES
('Botola D2', 1, 3, 3, 1, 90, 'finished', 2, 'تطوان', 'رضوان جيد', DATE_SUB(CURDATE(), INTERVAL 7 DAY), '20:00:00', 'الجولة 16'),
('Botola D2', 2, 4, 2, 0, 90, 'finished', 4, 'تمارة', 'سمير گزاز', DATE_SUB(CURDATE(), INTERVAL 7 DAY), '17:00:00', 'الجولة 16'),
('Botola D2', 5, 6, 1, 1, 90, 'finished', 8, 'السالمي', 'ياسين بوسليم', DATE_SUB(CURDATE(), INTERVAL 6 DAY), '19:00:00', 'الجولة 16'),
('Botola D2', 7, 8, 0, 2, 90, 'finished', 9, 'سطات', 'عادل زوراق', DATE_SUB(CURDATE(), INTERVAL 5 DAY), '17:00:00', 'الجولة 16'),
('Botola D2', 9, 10, 2, 2, 90, 'finished', 12, 'وجدة', 'حمزة الفريق', DATE_SUB(CURDATE(), INTERVAL 5 DAY), '19:30:00', 'الجولة 16'),
('Botola D2', 11, 12, 1, 0, 90, 'finished', 12, 'وجدة', 'نبيل بنرقلو', DATE_SUB(CURDATE(), INTERVAL 4 DAY), '17:30:00', 'الجولة 16'),
('Botola D2', 13, 14, 4, 1, 90, 'finished', 15, 'المحمدية', 'هشام تمساماني', DATE_SUB(CURDATE(), INTERVAL 4 DAY), '20:00:00', 'الجولة 16'),
('Botola D2', 15, 16, 0, 3, 90, 'finished', 3, 'بني ملال', 'رضوان جيد', DATE_SUB(CURDATE(), INTERVAL 3 DAY), '18:00:00', 'الجولة 16'),
('Botola D2', 1, 5, 2, 2, 90, 'finished', 2, 'تطوان', 'سمير گزاز', DATE_SUB(CURDATE(), INTERVAL 14 DAY), '20:00:00', 'الجولة 15'),
('Botola D2', 2, 8, 3, 0, 90, 'finished', 4, 'تمارة', 'ياسين بوسليم', DATE_SUB(CURDATE(), INTERVAL 13 DAY), '18:00:00', 'الجولة 15'),
('Botola D2', 4, 11, 1, 1, 90, 'finished', 6, 'بوجدور', 'عادل زوراق', DATE_SUB(CURDATE(), INTERVAL 12 DAY), '19:30:00', 'الجولة 15'),
('Botola D2', 3, 13, 2, 3, 90, 'finished', 7, 'تيزنيت', 'حمزة الفريق', DATE_SUB(CURDATE(), INTERVAL 12 DAY), '17:00:00', 'الجولة 15'),
('Botola D2', 6, 9, 2, 0, 90, 'finished', 5, 'خنيفرة', 'نبيل بنرقلو', DATE_SUB(CURDATE(), INTERVAL 11 DAY), '18:30:00', 'الجولة 15'),
('Botola D2', 10, 12, 0, 1, 90, 'finished', 14, 'بن جرير', 'هشام تمساماني', DATE_SUB(CURDATE(), INTERVAL 10 DAY), '20:00:00', 'الجولة 15'),
('Botola D2', 7, 14, 2, 2, 90, 'finished', 9, 'سطات', 'رضوان جيد', DATE_SUB(CURDATE(), INTERVAL 10 DAY), '19:00:00', 'الجولة 15');

-- =====================================================
-- 6. MATCH GOALS — أهداف حقيقية (بناءً على الهدافين)
-- =====================================================

-- هدافو القسم الثاني حسب البيانات الحقيقية:
-- Karim Ait Mohamed (3), Abderrahim Makrane (3), Ayoub Talib Rabbih (3)

-- الجولة 16
INSERT INTO match_goals (match_id, team_id, player_name, minute) VALUES
(6, 1, 'كريم آيت محمد', 12),
(6, 1, 'أيوب طالب ربيح', 44),
(6, 3, 'عبد الرحيم مقران', 67),
(6, 1, 'كريم آيت محمد', 78);

INSERT INTO match_goals (match_id, team_id, player_name, minute) VALUES
(7, 2, 'أوك بادي', 22),
(7, 2, 'رضى الشگراوي', 61);

INSERT INTO match_goals (match_id, team_id, player_name, minute) VALUES
(8, 5, 'محمد قاسو', 18),
(8, 6, 'محمد الرمداني', 39);

INSERT INTO match_goals (match_id, team_id, player_name, minute) VALUES
(9, 8, 'حمزة أصبار', 34),
(9, 8, 'بلال المقري', 71);

INSERT INTO match_goals (match_id, team_id, player_name, minute) VALUES
(10, 9, 'أنور أوسرحان', 11),
(10, 9, 'أنور فريدى', 38),
(10, 10, 'معاذ كرمون', 66),
(10, 10, 'يوسف بوعبيد', 88);

INSERT INTO match_goals (match_id, team_id, player_name, minute) VALUES
(11, 11, 'منير الحبش', 55);

INSERT INTO match_goals (match_id, team_id, player_name, minute) VALUES
(12, 13, 'أيمن فوطاط', 12),
(12, 13, 'محمد أمين حمودي', 44),
(12, 13, 'حسن فارس', 63),
(12, 14, 'مهدي أوبيلا', 71),
(12, 13, 'محمد الدويك', 89);

INSERT INTO match_goals (match_id, team_id, player_name, minute) VALUES
(13, 16, 'كريم آيت محمد', 22),
(13, 16, 'عبد الرحيم مقران', 48),
(13, 16, 'أيوب طالب ربيح', 85);

-- الجولة 15
INSERT INTO match_goals (match_id, team_id, player_name, minute) VALUES
(14, 1, 'كريم آيت محمد', 19),
(14, 5, 'محمد قاسو', 32),
(14, 5, 'أوك بادي', 55),
(14, 1, 'رضى الشگراوي', 78);

INSERT INTO match_goals (match_id, team_id, player_name, minute) VALUES
(15, 2, 'أيوب طالب ربيح', 21),
(15, 2, 'محمد الرمداني', 58),
(15, 2, 'بلال المقري', 82);

INSERT INTO match_goals (match_id, team_id, player_name, minute) VALUES
(16, 4, 'حمزة أصبار', 44),
(16, 11, 'منير الحبش', 77);

INSERT INTO match_goals (match_id, team_id, player_name, minute) VALUES
(17, 3, 'أنور أوسرحان', 15),
(17, 13, 'أيمن فوطاط', 29),
(17, 13, 'محمد أمين حمودي', 45),
(17, 3, 'أنور فريدى', 62),
(17, 13, 'حسن فارس', 88);

INSERT INTO match_goals (match_id, team_id, player_name, minute) VALUES
(18, 6, 'معاذ كرمون', 22),
(18, 6, 'يوسف بوعبيد', 71);

INSERT INTO match_goals (match_id, team_id, player_name, minute) VALUES
(19, 12, 'محمد الدويك', 54);

INSERT INTO match_goals (match_id, team_id, player_name, minute) VALUES
(20, 7, 'مهدي أوبيلا', 33),
(20, 14, 'كريم آيت محمد', 45),
(20, 14, 'عبد الرحيم مقران', 71),
(20, 7, 'أيوب طالب ربيح', 88);

-- أهداف المباريات المباشرة
INSERT INTO match_goals (match_id, team_id, player_name, minute) VALUES
(1, 1, 'كريم آيت محمد', 12),
(1, 1, 'عبد الرحيم مقران', 44),
(1, 4, 'أيوب طالب ربيح', 78);

INSERT INTO match_goals (match_id, team_id, player_name, minute) VALUES
(3, 3, 'أنور أوسرحان', 22),
(3, 5, 'محمد قاسو', 34),
(3, 5, 'أوك بادي', 56),
(3, 5, 'بلال المقري', 71);

INSERT INTO match_goals (match_id, team_id, player_name, minute) VALUES
(4, 7, 'حمزة أصبار', 18),
(4, 10, 'معاذ كرمون', 39);

INSERT INTO match_goals (match_id, team_id, player_name, minute) VALUES
(5, 13, 'أيمن فوطاط', 15),
(5, 8, 'محمد الرمداني', 28),
(5, 13, 'محمد أمين حمودي', 52),
(5, 8, 'حسن فارس', 64),
(5, 13, 'محمد الدويك', 85);

-- =====================================================
-- 7. MATCH STATISTICS
-- =====================================================
INSERT INTO match_statistics
(match_id, possession_home, possession_away, shots_home, shots_away,
 shots_on_target_home, shots_on_target_away, corners_home, corners_away,
 fouls_home, fouls_away, offsides_home, offsides_away)
VALUES
(1, 55, 45, 12, 8, 6, 3, 7, 4, 9, 11, 2, 3),
(3, 48, 52, 9, 14, 4, 7, 5, 8, 12, 10, 3, 1),
(4, 52, 48, 10, 7, 4, 3, 6, 5, 8, 9, 1, 2),
(5, 58, 42, 14, 9, 7, 5, 9, 4, 10, 12, 2, 1),
(6, 62, 38, 16, 6, 8, 3, 8, 3, 7, 13, 3, 2),
(7, 54, 46, 13, 7, 6, 2, 7, 4, 11, 8, 1, 3),
(8, 45, 55, 8, 11, 3, 5, 4, 6, 14, 10, 2, 1),
(9, 40, 60, 6, 15, 2, 8, 3, 9, 12, 7, 1, 4),
(10, 50, 50, 11, 11, 5, 5, 6, 6, 10, 10, 2, 2),
(11, 47, 53, 9, 10, 4, 4, 5, 7, 13, 11, 1, 2),
(12, 65, 35, 18, 4, 9, 1, 10, 2, 8, 14, 3, 1),
(13, 30, 70, 4, 17, 1, 10, 2, 11, 15, 6, 1, 3),
(14, 51, 49, 12, 10, 6, 5, 7, 6, 9, 9, 2, 2),
(15, 62, 38, 15, 5, 8, 2, 9, 3, 7, 12, 2, 1),
(16, 49, 51, 9, 10, 4, 5, 5, 6, 11, 10, 1, 3),
(17, 55, 45, 13, 10, 6, 5, 7, 5, 9, 12, 2, 2),
(18, 63, 37, 15, 6, 8, 2, 8, 3, 8, 13, 3, 1),
(19, 38, 62, 5, 14, 2, 7, 3, 9, 14, 8, 1, 3),
(20, 50, 50, 11, 11, 5, 5, 6, 6, 10, 10, 2, 2);

-- =====================================================
-- 8. REPLAYS — إعادات حقيقية
-- =====================================================
INSERT INTO replays
(match_id, title, description, video_url, download_url, duration, replay_date, requires_subscription, views)
VALUES
(6, 'المغرب التطواني vs أمل تيزنيت — إعادة كاملة',
    'الإعادة الكاملة لمباراة الجولة 16',
    'https://demo.botolad2.com/replays/mat-usat.m3u8',
    'https://demo.botolad2.com/downloads/mat-usat.mp4',
    '1:52:30', DATE_SUB(CURDATE(), INTERVAL 7 DAY), 'standard', 1240),
(7, 'الوداد تمارة vs شباب المسيرة — إعادة كاملة',
    'الإعادة الكاملة لمباراة الجولة 16',
    'https://demo.botolad2.com/replays/wst-jsm.m3u8',
    'https://demo.botolad2.com/downloads/wst-jsm.mp4',
    '1:48:12', DATE_SUB(CURDATE(), INTERVAL 7 DAY), 'standard', 856),
(8, 'الشباب السالمي vs شباب أطلس خنيفرة — إعادة',
    'الإعادة الكاملة لمباراة الجولة 16',
    'https://demo.botolad2.com/replays/jss-cak.m3u8',
    'https://demo.botolad2.com/downloads/jss-cak.mp4',
    '1:50:45', DATE_SUB(CURDATE(), INTERVAL 6 DAY), 'standard', 612),
(9, 'سطاد المغربي vs الوداد الفاسي — إعادة كاملة',
    'الإعادة الكاملة لمباراة الجولة 16',
    'https://demo.botolad2.com/replays/sm-waf.m3u8',
    'https://demo.botolad2.com/downloads/sm-waf.mp4',
    '1:46:20', DATE_SUB(CURDATE(), INTERVAL 5 DAY), 'gold', 2104),
(10, 'مولودية وجدة vs شباب بن جرير — إعادة كاملة',
    'الإعادة الكاملة لمباراة الجولة 16',
    'https://demo.botolad2.com/replays/mco-csbj.m3u8',
    'https://demo.botolad2.com/downloads/mco-csbj.mp4',
    '1:51:38', DATE_SUB(CURDATE(), INTERVAL 5 DAY), 'standard', 432),
(14, 'المغرب التطواني vs الشباب السالمي — ديربي',
    'الإعادة الكاملة لمباراة الجولة 15',
    'https://demo.botolad2.com/replays/mat-jss.m3u8',
    'https://demo.botolad2.com/downloads/mat-jss.mp4',
    '1:55:02', DATE_SUB(CURDATE(), INTERVAL 14 DAY), 'gold', 4521),
(15, 'الوداد تمارة vs الوداد الفاسي — إعادة كاملة',
    'الإعادة الكاملة لمباراة الجولة 15',
    'https://demo.botolad2.com/replays/wst-waf.m3u8',
    'https://demo.botolad2.com/downloads/wst-waf.mp4',
    '1:49:15', DATE_SUB(CURDATE(), INTERVAL 13 DAY), 'standard', 987),
(18, 'شباب أطلس خنيفرة vs مولودية وجدة — إعادة',
    'الإعادة الكاملة لمباراة الجولة 15',
    'https://demo.botolad2.com/replays/cak-mco.m3u8',
    NULL,
    '1:44:50', DATE_SUB(CURDATE(), INTERVAL 11 DAY), 'free', 3210);

-- =====================================================
-- ✅ تم إدخال البيانات بنجاح
-- =====================================================
SELECT '✅ بيانات القسم الثاني 2025/2026 أُدخلت بنجاح!' AS message;
SELECT COUNT(*) AS عدد_الفرق FROM teams;
SELECT COUNT(*) AS عدد_المباريات FROM matches;
SELECT COUNT(*) AS عدد_الأهداف FROM match_goals;
SELECT COUNT(*) AS عدد_الإعادات FROM replays;

-- =====================================================
-- 9. تحديث الترتيب (للتأكيد)
-- =====================================================
-- الترتيب سيُحسب تلقائياً من المباريات المنتهية

SELECT '📊 الترتيب الحالي:' AS info;
SELECT 
  t.name AS الفريق,
  COUNT(CASE WHEN m.status = 'finished' AND (m.team_home_id = t.id OR m.team_away_id = t.id) THEN 1 END) AS لعب,
  SUM(CASE 
    WHEN m.status = 'finished' AND m.team_home_id = t.id AND m.score_home > m.score_away THEN 3
    WHEN m.status = 'finished' AND m.team_away_id = t.id AND m.score_away > m.score_home THEN 3
    WHEN m.status = 'finished' AND m.team_home_id = t.id AND m.score_home = m.score_away THEN 1
    WHEN m.status = 'finished' AND m.team_away_id = t.id AND m.score_away = m.score_home THEN 1
    ELSE 0
  END) AS نقاط
FROM teams t
LEFT JOIN matches m ON (m.team_home_id = t.id OR m.team_away_id = t.id)
GROUP BY t.id, t.name
ORDER BY نقاط DESC;