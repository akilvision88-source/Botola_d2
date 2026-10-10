-- =====================================================
-- BOTOLA D2 — Upcoming Matches Seed
-- 20 مباراة قادمة تجريبية
-- =====================================================

USE botola_d2;

-- =====================================================
-- 1. تحقق من الفرق الموجودة
-- =====================================================
SELECT '═══════════════════════════════' AS '';
SELECT '📋 Available Teams:' AS message;
SELECT '═══════════════════════════════' AS '';
SELECT id, name, short_name, city FROM teams ORDER BY id;
SELECT '═══════════════════════════════' AS '';

-- =====================================================
-- 2. احذف المباريات القادمة القديمة (اختياري)
-- =====================================================
-- ⚠️ علّق هذه السطر إذا كنت تريد الاحتفاظ بالموجود
DELETE FROM matches WHERE status = 'upcoming';

-- =====================================================
-- 3. أضف المباريات القادمة (باستخدام team IDs الفعلية)
-- =====================================================
-- ⚠️ ملاحظة: هذا الملف يستخدم IDs 1-16
-- إذا كانت فرقك بأرقام مختلفة، غيّر الأرقام أدناه

INSERT INTO matches
(competition, team_home_id, team_away_id, status, stadium_id, city, referee,
 match_date, match_time, round)
VALUES

-- ============ الجولة 18 ============
('Botola D2', 1, 2, 'upcoming', NULL, 'خنيفرة', 'ياسين بوسليم',
  DATE_ADD(CURDATE(), INTERVAL 1 DAY), '17:00:00', 'الجولة 18'),

('Botola D2', 3, 4, 'upcoming', NULL, 'القنيطرة', 'سمير گزاز',
  DATE_ADD(CURDATE(), INTERVAL 1 DAY), '19:00:00', 'الجولة 18'),

('Botola D2', 5, 6, 'upcoming', NULL, 'أبي الجعد', 'حمزة الفريق',
  DATE_ADD(CURDATE(), INTERVAL 1 DAY), '21:00:00', 'الجولة 18'),

('Botola D2', 7, 8, 'upcoming', NULL, 'الرباط', 'رضوان جيد',
  DATE_ADD(CURDATE(), INTERVAL 2 DAY), '18:00:00', 'الجولة 18'),

('Botola D2', 9, 10, 'upcoming', NULL, 'المحمدية', 'عادل زوراق',
  DATE_ADD(CURDATE(), INTERVAL 2 DAY), '20:00:00', 'الجولة 18'),

-- ============ الجولة 19 ============
('Botola D2', 11, 12, 'upcoming', NULL, 'الدشيرة', 'نبيل بنرقلو',
  DATE_ADD(CURDATE(), INTERVAL 3 DAY), '17:30:00', 'الجولة 19'),

('Botola D2', 13, 14, 'upcoming', NULL, 'خريبكة', 'هشام تمساماني',
  DATE_ADD(CURDATE(), INTERVAL 3 DAY), '19:30:00', 'الجولة 19'),

('Botola D2', 15, 16, 'upcoming', NULL, 'بوجدور', 'مراد الجراري',
  DATE_ADD(CURDATE(), INTERVAL 3 DAY), '21:00:00', 'الجولة 19'),

('Botola D2', 2, 3, 'upcoming', NULL, 'القنيطرة', 'ياسين بوسليم',
  DATE_ADD(CURDATE(), INTERVAL 4 DAY), '18:00:00', 'الجولة 19'),

('Botola D2', 4, 5, 'upcoming', NULL, 'أبي الجعد', 'سمير گزاز',
  DATE_ADD(CURDATE(), INTERVAL 4 DAY), '20:30:00', 'الجولة 19'),

-- ============ الجولة 20 ============
('Botola D2', 6, 7, 'upcoming', NULL, 'الرباط', 'حمزة الفريق',
  DATE_ADD(CURDATE(), INTERVAL 5 DAY), '17:00:00', 'الجولة 20'),

('Botola D2', 8, 9, 'upcoming', NULL, 'المحمدية', 'رضوان جيد',
  DATE_ADD(CURDATE(), INTERVAL 5 DAY), '19:00:00', 'الجولة 20'),

('Botola D2', 10, 11, 'upcoming', NULL, 'الدشيرة', 'عادل زوراق',
  DATE_ADD(CURDATE(), INTERVAL 5 DAY), '21:00:00', 'الجولة 20'),

('Botola D2', 12, 13, 'upcoming', NULL, 'خريبكة', 'نبيل بنرقلو',
  DATE_ADD(CURDATE(), INTERVAL 6 DAY), '18:30:00', 'الجولة 20'),

('Botola D2', 14, 15, 'upcoming', NULL, 'بوجدور', 'هشام تمساماني',
  DATE_ADD(CURDATE(), INTERVAL 6 DAY), '20:00:00', 'الجولة 20'),

-- ============ الجولة 21 ============
('Botola D2', 16, 1, 'upcoming', NULL, 'خنيفرة', 'مراد الجراري',
  DATE_ADD(CURDATE(), INTERVAL 7 DAY), '17:00:00', 'الجولة 21'),

('Botola D2', 3, 5, 'upcoming', NULL, 'أبي الجعد', 'ياسين بوسليم',
  DATE_ADD(CURDATE(), INTERVAL 7 DAY), '19:30:00', 'الجولة 21'),

('Botola D2', 7, 9, 'upcoming', NULL, 'المحمدية', 'سمير گزاز',
  DATE_ADD(CURDATE(), INTERVAL 8 DAY), '18:00:00', 'الجولة 21'),

('Botola D2', 11, 13, 'upcoming', NULL, 'خريبكة', 'حمزة الفريق',
  DATE_ADD(CURDATE(), INTERVAL 8 DAY), '20:30:00', 'الجولة 21'),

('Botola D2', 15, 1, 'upcoming', NULL, 'خنيفرة', 'رضوان جيد',
  DATE_ADD(CURDATE(), INTERVAL 9 DAY), '21:00:00', 'الجولة 21')

ON DUPLICATE KEY UPDATE updated_at = NOW();

-- =====================================================
-- 4. عرض النتيجة
-- =====================================================
SELECT '═══════════════════════════════' AS '';
SELECT '✅ Upcoming Matches Seeded!' AS message;
SELECT '═══════════════════════════════' AS '';

SELECT COUNT(*) AS total_upcoming FROM matches WHERE status = 'upcoming';

SELECT 
  m.id,
  ht.name AS home_team,
  at.name AS away_team,
  m.match_date,
  m.match_time,
  m.round
FROM matches m
LEFT JOIN teams ht ON m.team_home_id = ht.id
LEFT JOIN teams at ON m.team_away_id = at.id
WHERE m.status = 'upcoming'
ORDER BY m.match_date, m.match_time
LIMIT 25;

SELECT '═══════════════════════════════' AS '';