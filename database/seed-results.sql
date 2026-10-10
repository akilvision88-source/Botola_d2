-- =====================================================
-- BOTOLA D2 — Results Seed
-- 20 مباراة منتهية + أهداف + بطاقات + إحصائيات
-- ⚠️ لا يوجد USE — يُنفَّذ في القاعدة المختارة
-- =====================================================

-- احذف النتائج القديمة
DELETE FROM match_goals WHERE match_id IN (SELECT id FROM matches WHERE status='finished');
DELETE FROM match_cards WHERE match_id IN (SELECT id FROM matches WHERE status='finished');
DELETE FROM match_events WHERE match_id IN (SELECT id FROM matches WHERE status='finished');
DELETE FROM match_statistics WHERE match_id IN (SELECT id FROM matches WHERE status='finished');
DELETE FROM matches WHERE status = 'finished';

-- =====================================================
-- 1. المباريات المنتهية (20 مباراة)
-- =====================================================

INSERT INTO matches
(competition, team_home_id, team_away_id, score_home, score_away, match_minute,
 status, city, referee, match_date, match_time, round)
VALUES

-- ============ الجولة 13 ============
('Botola D2', 1, 2, 3, 1, 90, 'finished', 'خنيفرة', 'ياسين بوسليم',
  DATE_SUB(CURDATE(), INTERVAL 30 DAY), '17:00:00', 'الجولة 13'),

('Botola D2', 3, 4, 2, 2, 90, 'finished', 'القنيطرة', 'سمير گزاز',
  DATE_SUB(CURDATE(), INTERVAL 30 DAY), '19:00:00', 'الجولة 13'),

('Botola D2', 5, 6, 0, 2, 90, 'finished', 'أبي الجعد', 'حمزة الفريق',
  DATE_SUB(CURDATE(), INTERVAL 29 DAY), '21:00:00', 'الجولة 13'),

('Botola D2', 7, 8, 1, 0, 90, 'finished', 'الرباط', 'رضوان جيد',
  DATE_SUB(CURDATE(), INTERVAL 29 DAY), '18:00:00', 'الجولة 13'),

-- ============ الجولة 14 ============
('Botola D2', 9, 10, 4, 1, 90, 'finished', 'المحمدية', 'عادل زوراق',
  DATE_SUB(CURDATE(), INTERVAL 22 DAY), '17:30:00', 'الجولة 14'),

('Botola D2', 11, 12, 1, 1, 90, 'finished', 'الدشيرة', 'نبيل بنرقلو',
  DATE_SUB(CURDATE(), INTERVAL 22 DAY), '19:30:00', 'الجولة 14'),

('Botola D2', 13, 14, 3, 0, 90, 'finished', 'خريبكة', 'هشام تمساماني',
  DATE_SUB(CURDATE(), INTERVAL 21 DAY), '21:00:00', 'الجولة 14'),

('Botola D2', 15, 16, 0, 0, 90, 'finished', 'بوجدور', 'مراد الجراري',
  DATE_SUB(CURDATE(), INTERVAL 21 DAY), '17:00:00', 'الجولة 14'),

-- ============ الجولة 15 ============
('Botola D2', 2, 5, 2, 0, 90, 'finished', 'القنيطرة', 'ياسين بوسليم',
  DATE_SUB(CURDATE(), INTERVAL 15 DAY), '18:00:00', 'الجولة 15'),

('Botola D2', 4, 7, 1, 3, 90, 'finished', 'أبي الجعد', 'سمير گزاز',
  DATE_SUB(CURDATE(), INTERVAL 15 DAY), '20:00:00', 'الجولة 15'),

('Botola D2', 6, 9, 2, 1, 90, 'finished', 'الرباط', 'حمزة الفريق',
  DATE_SUB(CURDATE(), INTERVAL 14 DAY), '17:00:00', 'الجولة 15'),

('Botola D2', 8, 11, 0, 1, 90, 'finished', 'المحمدية', 'رضوان جيد',
  DATE_SUB(CURDATE(), INTERVAL 14 DAY), '19:00:00', 'الجولة 15'),

-- ============ الجولة 16 ============
('Botola D2', 10, 13, 2, 2, 90, 'finished', 'الدشيرة', 'عادل زوراق',
  DATE_SUB(CURDATE(), INTERVAL 8 DAY), '21:00:00', 'الجولة 16'),

('Botola D2', 12, 15, 3, 2, 90, 'finished', 'خريبكة', 'نبيل بنرقلو',
  DATE_SUB(CURDATE(), INTERVAL 8 DAY), '17:30:00', 'الجولة 16'),

('Botola D2', 14, 16, 1, 0, 90, 'finished', 'بوجدور', 'هشام تمساماني',
  DATE_SUB(CURDATE(), INTERVAL 7 DAY), '19:30:00', 'الجولة 16'),

('Botola D2', 1, 5, 2, 3, 90, 'finished', 'خنيفرة', 'مراد الجراري',
  DATE_SUB(CURDATE(), INTERVAL 7 DAY), '21:00:00', 'الجولة 16'),

-- ============ الجولة 17 ============
('Botola D2', 3, 7, 1, 2, 90, 'finished', 'القنيطرة', 'ياسين بوسليم',
  DATE_SUB(CURDATE(), INTERVAL 4 DAY), '18:00:00', 'الجولة 17'),

('Botola D2', 4, 9, 0, 3, 90, 'finished', 'أبي الجعد', 'سمير گزاز',
  DATE_SUB(CURDATE(), INTERVAL 4 DAY), '20:00:00', 'الجولة 17'),

('Botola D2', 8, 13, 2, 1, 90, 'finished', 'المحمدية', 'حمزة الفريق',
  DATE_SUB(CURDATE(), INTERVAL 3 DAY), '17:00:00', 'الجولة 17'),

('Botola D2', 12, 16, 4, 2, 90, 'finished', 'خريبكة', 'رضوان جيد',
  DATE_SUB(CURDATE(), INTERVAL 3 DAY), '19:00:00', 'الجولة 17');

-- =====================================================
-- 2. الأهداف (لأول 10 مباريات)
-- =====================================================
-- ⚠️ يحتاج match_id الفعلي. استخدم استعلام فرعي.

INSERT INTO match_goals (match_id, team_id, player_name, minute, is_penalty, is_own_goal)
SELECT m.id, m.team_home_id, 'أحمد حمدان', 12, 0, 0
FROM matches m WHERE m.status='finished' AND m.round='الجولة 13' AND m.team_home_id=1 LIMIT 1;

INSERT INTO match_goals (match_id, team_id, player_name, minute)
SELECT m.id, m.team_home_id, 'يوسف الأمرابط', 34, 0, 0
FROM matches m WHERE m.status='finished' AND m.round='الجولة 13' AND m.team_home_id=1 LIMIT 1;

INSERT INTO match_goals (match_id, team_id, player_name, minute)
SELECT m.id, m.team_home_id, 'كريم البركاوي', 78, 0, 0
FROM matches m WHERE m.status='finished' AND m.round='الجولة 13' AND m.team_home_id=1 LIMIT 1;

INSERT INTO match_goals (match_id, team_id, player_name, minute)
SELECT m.id, m.team_away_id, 'سفيان بوفتيني', 55, 0, 0
FROM matches m WHERE m.status='finished' AND m.round='الجولة 13' AND m.team_home_id=1 LIMIT 1;

-- أهداف المباراة 2
INSERT INTO match_goals (match_id, team_id, player_name, minute)
SELECT m.id, m.team_home_id, 'حمزة الموسادق', 22, 0, 0
FROM matches m WHERE m.status='finished' AND m.round='الجولة 13' AND m.team_home_id=3 LIMIT 1;

INSERT INTO match_goals (match_id, team_id, player_name, minute)
SELECT m.id, m.team_home_id, 'أنس الزنيتي', 67, 0, 0
FROM matches m WHERE m.status='finished' AND m.round='الجولة 13' AND m.team_home_id=3 LIMIT 1;

INSERT INTO match_goals (match_id, team_id, player_name, minute)
SELECT m.id, m.team_away_id, 'بلال الخنوس', 45, 0, 0
FROM matches m WHERE m.status='finished' AND m.round='الجولة 13' AND m.team_home_id=3 LIMIT 1;

INSERT INTO match_goals (match_id, team_id, player_name, minute)
SELECT m.id, m.team_away_id, 'معاذ كرمون', 88, 1, 0
FROM matches m WHERE m.status='finished' AND m.round='الجولة 13' AND m.team_home_id=3 LIMIT 1;

-- أهداف المباراة 3 (0-2)
INSERT INTO match_goals (match_id, team_id, player_name, minute)
SELECT m.id, m.team_away_id, 'يوسف بوعبيد', 33, 0, 0
FROM matches m WHERE m.status='finished' AND m.round='الجولة 13' AND m.team_home_id=5 LIMIT 1;

INSERT INTO match_goals (match_id, team_id, player_name, minute)
SELECT m.id, m.team_away_id, 'منير الحبش', 71, 0, 0
FROM matches m WHERE m.status='finished' AND m.round='الجولة 13' AND m.team_home_id=5 LIMIT 1;

-- أهداف المباراة 4 (1-0)
INSERT INTO match_goals (match_id, team_id, player_name, minute)
SELECT m.id, m.team_home_id, 'أوك بادي', 82, 0, 0
FROM matches m WHERE m.status='finished' AND m.round='الجولة 13' AND m.team_home_id=7 LIMIT 1;

-- أهداف المباراة 5 (4-1)
INSERT INTO match_goals (match_id, team_id, player_name, minute)
SELECT m.id, m.team_home_id, 'محمد الرمداني', 15, 0, 0
FROM matches m WHERE m.status='finished' AND m.round='الجولة 14' AND m.team_home_id=9 LIMIT 1;

INSERT INTO match_goals (match_id, team_id, player_name, minute)
SELECT m.id, m.team_home_id, 'حمزة أصبار', 28, 0, 0
FROM matches m WHERE m.status='finished' AND m.round='الجولة 14' AND m.team_home_id=9 LIMIT 1;

INSERT INTO match_goals (match_id, team_id, player_name, minute)
SELECT m.id, m.team_home_id, 'مهدي أوبيلا', 55, 0, 0
FROM matches m WHERE m.status='finished' AND m.round='الجولة 14' AND m.team_home_id=9 LIMIT 1;

INSERT INTO match_goals (match_id, team_id, player_name, minute)
SELECT m.id, m.team_home_id, 'أنور فريدى', 80, 0, 0
FROM matches m WHERE m.status='finished' AND m.round='الجولة 14' AND m.team_home_id=9 LIMIT 1;

INSERT INTO match_goals (match_id, team_id, player_name, minute)
SELECT m.id, m.team_away_id, 'كريم آيت محمد', 62, 0, 0
FROM matches m WHERE m.status='finished' AND m.round='الجولة 14' AND m.team_home_id=9 LIMIT 1;

-- أهداف المباراة 6 (1-1)
INSERT INTO match_goals (match_id, team_id, player_name, minute)
SELECT m.id, m.team_home_id, 'أيوب طالب ربيح', 44, 0, 0
FROM matches m WHERE m.status='finished' AND m.round='الجولة 14' AND m.team_home_id=11 LIMIT 1;

INSERT INTO match_goals (match_id, team_id, player_name, minute)
SELECT m.id, m.team_away_id, 'عبد الرحيم مقران', 73, 0, 0
FROM matches m WHERE m.status='finished' AND m.round='الجولة 14' AND m.team_home_id=11 LIMIT 1;

-- أهداف المباراة 7 (3-0)
INSERT INTO match_goals (match_id, team_id, player_name, minute)
SELECT m.id, m.team_home_id, 'محمد قاسو', 20, 0, 0
FROM matches m WHERE m.status='finished' AND m.round='الجولة 14' AND m.team_home_id=13 LIMIT 1;

INSERT INTO match_goals (match_id, team_id, player_name, minute)
SELECT m.id, m.team_home_id, 'أيمن فوطاط', 51, 0, 0
FROM matches m WHERE m.status='finished' AND m.round='الجولة 14' AND m.team_home_id=13 LIMIT 1;

INSERT INTO match_goals (match_id, team_id, player_name, minute)
SELECT m.id, m.team_home_id, 'محمد أمين حمودي', 88, 0, 0
FROM matches m WHERE m.status='finished' AND m.round='الجولة 14' AND m.team_home_id=13 LIMIT 1;

-- أهداف المباراة 9 (2-0)
INSERT INTO match_goals (match_id, team_id, player_name, minute)
SELECT m.id, m.team_home_id, 'أوك بادي', 55, 0, 0
FROM matches m WHERE m.status='finished' AND m.round='الجولة 15' AND m.team_home_id=2 LIMIT 1;

INSERT INTO match_goals (match_id, team_id, player_name, minute)
SELECT m.id, m.team_home_id, 'منير الحبش', 72, 0, 0
FROM matches m WHERE m.status='finished' AND m.round='الجولة 15' AND m.team_home_id=2 LIMIT 1;

-- أهداف المباراة 10 (1-3)
INSERT INTO match_goals (match_id, team_id, player_name, minute)
SELECT m.id, m.team_home_id, 'حمزة أصبار', 18, 0, 0
FROM matches m WHERE m.status='finished' AND m.round='الجولة 15' AND m.team_home_id=4 LIMIT 1;

INSERT INTO match_goals (match_id, team_id, player_name, minute)
SELECT m.id, m.team_away_id, 'محمد قاسو', 42, 0, 0
FROM matches m WHERE m.status='finished' AND m.round='الجولة 15' AND m.team_home_id=4 LIMIT 1;

INSERT INTO match_goals (match_id, team_id, player_name, minute)
SELECT m.id, m.team_away_id, 'أيوب طالب ربيح', 65, 0, 0
FROM matches m WHERE m.status='finished' AND m.round='الجولة 15' AND m.team_home_id=4 LIMIT 1;

INSERT INTO match_goals (match_id, team_id, player_name, minute)
SELECT m.id, m.team_away_id, 'كريم آيت محمد', 89, 1, 0
FROM matches m WHERE m.status='finished' AND m.round='الجولة 15' AND m.team_home_id=4 LIMIT 1;

-- =====================================================
-- 3. البطاقات (لأول 8 مباريات)
-- =====================================================

INSERT INTO match_cards (match_id, team_id, player_name, card_type, minute)
SELECT m.id, m.team_home_id, 'سفيان بوفتيني', 'yellow', 34
FROM matches m WHERE m.status='finished' AND m.round='الجولة 13' AND m.team_home_id=1 LIMIT 1;

INSERT INTO match_cards (match_id, team_id, player_name, card_type, minute)
SELECT m.id, m.team_away_id, 'يوسف الأمرابط', 'yellow', 52
FROM matches m WHERE m.status='finished' AND m.round='الجولة 13' AND m.team_home_id=1 LIMIT 1;

INSERT INTO match_cards (match_id, team_id, player_name, card_type, minute)
SELECT m.id, m.team_away_id, 'كريم البركاوي', 'red', 88
FROM matches m WHERE m.status='finished' AND m.round='الجولة 13' AND m.team_home_id=1 LIMIT 1;

INSERT INTO match_cards (match_id, team_id, player_name, card_type, minute)
SELECT m.id, m.team_home_id, 'أنس الزنيتي', 'yellow', 45
FROM matches m WHERE m.status='finished' AND m.round='الجولة 13' AND m.team_home_id=3 LIMIT 1;

INSERT INTO match_cards (match_id, team_id, player_name, card_type, minute)
SELECT m.id, m.team_home_id, 'بلال الخنوس', 'yellow', 67
FROM matches m WHERE m.status='finished' AND m.round='الجولة 13' AND m.team_home_id=3 LIMIT 1;

INSERT INTO match_cards (match_id, team_id, player_name, card_type, minute)
SELECT m.id, m.team_away_id, 'حمزة الموسادق', 'yellow', 23
FROM matches m WHERE m.status='finished' AND m.round='الجولة 13' AND m.team_home_id=3 LIMIT 1;

INSERT INTO match_cards (match_id, team_id, player_name, card_type, minute)
SELECT m.id, m.team_away_id, 'منير الحبش', 'yellow', 56
FROM matches m WHERE m.status='finished' AND m.round='الجولة 13' AND m.team_home_id=5 LIMIT 1;

INSERT INTO match_cards (match_id, team_id, player_name, card_type, minute)
SELECT m.id, m.team_home_id, 'يوسف بوعبيد', 'yellow', 78
FROM matches m WHERE m.status='finished' AND m.round='الجولة 13' AND m.team_home_id=5 LIMIT 1;

-- =====================================================
-- 4. الإحصائيات (لأول 10 مباريات)
-- =====================================================

INSERT INTO match_statistics
(match_id, possession_home, possession_away, shots_home, shots_away,
 shots_on_target_home, shots_on_target_away, corners_home, corners_away,
 fouls_home, fouls_away, offsides_home, offsides_away)
SELECT m.id, 55, 45, 14, 8, 7, 3, 8, 4, 10, 12, 2, 1
FROM matches m WHERE m.status='finished' AND m.round='الجولة 13' AND m.team_home_id=1 LIMIT 1;

INSERT INTO match_statistics
(match_id, possession_home, possession_away, shots_home, shots_away,
 shots_on_target_home, shots_on_target_away, corners_home, corners_away,
 fouls_home, fouls_away, offsides_home, offsides_away)
SELECT m.id, 48, 52, 10, 12, 4, 5, 5, 7, 12, 10, 3, 2
FROM matches m WHERE m.status='finished' AND m.round='الجولة 13' AND m.team_home_id=3 LIMIT 1;

INSERT INTO match_statistics
(match_id, possession_home, possession_away, shots_home, shots_away,
 shots_on_target_home, shots_on_target_away, corners_home, corners_away,
 fouls_home, fouls_away, offsides_home, offsides_away)
SELECT m.id, 42, 58, 6, 15, 2, 8, 3, 9, 13, 8, 1, 3
FROM matches m WHERE m.status='finished' AND m.round='الجولة 13' AND m.team_home_id=5 LIMIT 1;

INSERT INTO match_statistics
(match_id, possession_home, possession_away, shots_home, shots_away,
 shots_on_target_home, shots_on_target_away, corners_home, corners_away,
 fouls_home, fouls_away, offsides_home, offsides_away)
SELECT m.id, 52, 48, 11, 9, 5, 4, 6, 5, 9, 11, 2, 1
FROM matches m WHERE m.status='finished' AND m.round='الجولة 13' AND m.team_home_id=7 LIMIT 1;

INSERT INTO match_statistics
(match_id, possession_home, possession_away, shots_home, shots_away,
 shots_on_target_home, shots_on_target_away, corners_home, corners_away,
 fouls_home, fouls_away, offsides_home, offsides_away)
SELECT m.id, 62, 38, 16, 6, 8, 2, 9, 3, 8, 14, 3, 1
FROM matches m WHERE m.status='finished' AND m.round='الجولة 14' AND m.team_home_id=9 LIMIT 1;

INSERT INTO match_statistics
(match_id, possession_home, possession_away, shots_home, shots_away,
 shots_on_target_home, shots_on_target_away, corners_home, corners_away,
 fouls_home, fouls_away, offsides_home, offsides_away)
SELECT m.id, 50, 50, 11, 11, 5, 5, 6, 6, 10, 10, 2, 2
FROM matches m WHERE m.status='finished' AND m.round='الجولة 14' AND m.team_home_id=11 LIMIT 1;

INSERT INTO match_statistics
(match_id, possession_home, possession_away, shots_home, shots_away,
 shots_on_target_home, shots_on_target_away, corners_home, corners_away,
 fouls_home, fouls_away, offsides_home, offsides_away)
SELECT m.id, 60, 40, 15, 5, 8, 1, 10, 2, 7, 13, 3, 0
FROM matches m WHERE m.status='finished' AND m.round='الجولة 14' AND m.team_home_id=13 LIMIT 1;

INSERT INTO match_statistics
(match_id, possession_home, possession_away, shots_home, shots_away,
 shots_on_target_home, shots_on_target_away, corners_home, corners_away,
 fouls_home, fouls_away, offsides_home, offsides_away)
SELECT m.id, 48, 52, 8, 10, 3, 4, 5, 6, 11, 9, 2, 3
FROM matches m WHERE m.status='finished' AND m.round='الجولة 14' AND m.team_home_id=15 LIMIT 1;

INSERT INTO match_statistics
(match_id, possession_home, possession_away, shots_home, shots_away,
 shots_on_target_home, shots_on_target_away, corners_home, corners_away,
 fouls_home, fouls_away, offsides_home, offsides_away)
SELECT m.id, 55, 45, 12, 7, 6, 2, 7, 4, 9, 11, 2, 2
FROM matches m WHERE m.status='finished' AND m.round='الجولة 15' AND m.team_home_id=2 LIMIT 1;

INSERT INTO match_statistics
(match_id, possession_home, possession_away, shots_home, shots_away,
 shots_on_target_home, shots_on_target_away, corners_home, corners_away,
 fouls_home, fouls_away, offsides_home, offsides_away)
SELECT m.id, 45, 55, 9, 13, 3, 7, 4, 8, 13, 8, 2, 1
FROM matches m WHERE m.status='finished' AND m.round='الجولة 15' AND m.team_home_id=4 LIMIT 1;

-- =====================================================
-- 5. عرض النتائج
-- =====================================================

SELECT '═══════════════════════════════' AS '';
SELECT '✅ Results Seeded!' AS message;
SELECT '═══════════════════════════════' AS '';

SELECT 
  COUNT(*) AS total_finished,
  (SELECT COUNT(*) FROM match_goals) AS total_goals,
  (SELECT COUNT(*) FROM match_cards) AS total_cards,
  (SELECT COUNT(*) FROM match_statistics) AS total_stats
FROM matches WHERE status = 'finished';

SELECT '═══════════════════════════════' AS '';

SELECT 
  m.id,
  ht.short_name AS home,
  at.short_name AS away,
  CONCAT(m.score_home, ' - ', m.score_away) AS score,
  m.match_date,
  m.round
FROM matches m
LEFT JOIN teams ht ON m.team_home_id = ht.id
LEFT JOIN teams at ON m.team_away_id = at.id
WHERE m.status='finished'
ORDER BY m.match_date DESC
LIMIT 25;

SELECT '═══════════════════════════════' AS '';