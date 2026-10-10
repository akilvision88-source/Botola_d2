-- =====================================================
-- BOTOLA D2 — Replays Seed
-- 15 إعادة تجريبية مع ملخصات
-- =====================================================

USE botola_d2;

-- =====================================================
-- 1. تحقق من الفرق والمباريات
-- =====================================================
SELECT '═══════════════════════════════' AS '';
SELECT '📋 Teams:' AS '';
SELECT '═══════════════════════════════' AS '';
SELECT id, name, short_name FROM teams ORDER BY id LIMIT 20;

SELECT '═══════════════════════════════' AS '';
SELECT '📋 Finished Matches:' AS '';
SELECT '═══════════════════════════════' AS '';
SELECT 
  m.id,
  ht.short_name AS home,
  at.short_name AS away,
  m.score_home,
  m.score_away,
  m.match_date
FROM matches m
LEFT JOIN teams ht ON m.team_home_id = ht.id
LEFT JOIN teams at ON m.team_away_id = at.id
WHERE m.status = 'finished'
ORDER BY m.match_date DESC
LIMIT 10;

SELECT '═══════════════════════════════' AS '';

-- =====================================================
-- 2. احذف الإعادات القديمة (اختياري)
-- =====================================================
-- ⚠️ علّق هذا السطر إذا كنت تريد الاحتفاظ بالموجود
DELETE FROM replays;

-- =====================================================
-- 3. أضف الإعادات (بدون match_id لتفادي FK)
-- =====================================================
-- ⚠️ إذا أردت ربطها بمباريات، أضف match_id بدلاً من NULL

INSERT INTO replays
(match_id, title, description, thumbnail, video_url, download_url, duration,
 replay_date, requires_subscription, views,
 summary_video_url, summary_download_url, summary_duration)
VALUES

-- ============ الإعادة 1 — Gold ============
(NULL,
 'CAK vs IZK — Full Match Replay',
 'المباراة الكاملة بين شباب أطلس خنيفرة وإتحاد الزموري للخميسات من الجولة الأخيرة.',
 'https://images.unsplash.com/photo-1522778119026-d647f0596c20?w=800&q=80',
 'https://demo.botolad2.com/replays/cak-izk.m3u8',
 'https://demo.botolad2.com/downloads/cak-izk.mp4',
 '1:52:30',
 DATE_SUB(CURDATE(), INTERVAL 3 DAY),
 'gold', 1520,
 'https://demo.botolad2.com/summaries/cak-izk-resume.m3u8',
 'https://demo.botolad2.com/downloads/cak-izk-resume.mp4',
 '0:08:30'),

-- ============ الإعادة 2 — Standard ============
(NULL,
 'KAC vs WAF — Full Match Replay',
 'المباراة الكاملة — النادي القنيطري ضد الوداد الفاسي.',
 'https://images.unsplash.com/photo-1579952363873-27f3bade9f55?w=800&q=80',
 'https://demo.botolad2.com/replays/kac-waf.m3u8',
 'https://demo.botolad2.com/downloads/kac-waf.mp4',
 '1:48:12',
 DATE_SUB(CURDATE(), INTERVAL 4 DAY),
 'standard', 856,
 'https://demo.botolad2.com/summaries/kac-waf-resume.m3u8',
 'https://demo.botolad2.com/downloads/kac-waf-resume.mp4',
 '0:10:15'),

-- ============ الإعادة 3 — Free ============
(NULL,
 'USB vs OCS — Full Match Replay',
 'الاتحاد الرياضي البلدي ضد أولمبيك آسفي — إعادة مجانية.',
 'https://images.unsplash.com/photo-1489944440615-453fc2b6a9a9?w=800&q=80',
 'https://demo.botolad2.com/replays/usb-ocs.m3u8',
 NULL,
 '1:50:45',
 DATE_SUB(CURDATE(), INTERVAL 5 DAY),
 'free', 3210,
 'https://demo.botolad2.com/summaries/usb-ocs-resume.m3u8',
 NULL,
 '0:06:45'),

-- ============ الإعادة 4 — Gold ============
(NULL,
 'USYM vs SCCM — Full Match Replay',
 'الإتحاد الرياضي اليعقوبي ضد سبورتينغ شباب المحمدية.',
 'https://images.unsplash.com/photo-1431324155629-1a6deb1dec8d?w=800&q=80',
 'https://demo.botolad2.com/replays/usym-sccm.m3u8',
 'https://demo.botolad2.com/downloads/usym-sccm.mp4',
 '1:46:20',
 DATE_SUB(CURDATE(), INTERVAL 6 DAY),
 'gold', 2104,
 'https://demo.botolad2.com/summaries/usym-sccm-resume.m3u8',
 'https://demo.botolad2.com/downloads/usym-sccm-resume.mp4',
 '0:07:45'),

-- ============ الإعادة 5 — Standard ============
(NULL,
 'OD vs OCK — Full Match Replay',
 'أولمبيك الدشيرة ضد أولمبيك خريبكة — ديربي مثير.',
 'https://images.unsplash.com/photo-1517649763962-0c623066013b?w=800&q=80',
 'https://demo.botolad2.com/replays/od-ock.m3u8',
 'https://demo.botolad2.com/downloads/od-ock.mp4',
 '1:51:38',
 DATE_SUB(CURDATE(), INTERVAL 7 DAY),
 'standard', 432,
 'https://demo.botolad2.com/summaries/od-ock-resume.m3u8',
 'https://demo.botolad2.com/downloads/od-ock-resume.mp4',
 '0:09:20'),

-- ============ الإعادة 6 — Standard ============
(NULL,
 'JSM vs SM — Full Match Replay',
 'شباب المسيرة ضد سطاد المغربي — إعادة كاملة.',
 'https://images.unsplash.com/photo-1508098682722-e99c43a406b2?w=800&q=80',
 'https://demo.botolad2.com/replays/jsm-sm.m3u8',
 'https://demo.botolad2.com/downloads/jsm-sm.mp4',
 '1:49:15',
 DATE_SUB(CURDATE(), INTERVAL 8 DAY),
 'standard', 987,
 'https://demo.botolad2.com/summaries/jsm-sm-resume.m3u8',
 'https://demo.botolad2.com/downloads/jsm-sm-resume.mp4',
 '0:08:12'),

-- ============ الإعادة 7 — Gold ============
(NULL,
 'USMO vs MCO — Derby Replay',
 'اتحاد وجدة ضد مولودية وجدة — ديربي الشرق المثير.',
 'https://images.unsplash.com/photo-1551958219-acbc608c6377?w=800&q=80',
 'https://demo.botolad2.com/replays/usmo-mco.m3u8',
 'https://demo.botolad2.com/downloads/usmo-mco.mp4',
 '1:55:02',
 DATE_SUB(CURDATE(), INTERVAL 9 DAY),
 'gold', 4521,
 'https://demo.botolad2.com/summaries/usmo-mco-resume.m3u8',
 'https://demo.botolad2.com/downloads/usmo-mco-resume.mp4',
 '0:11:00'),

-- ============ الإعادة 8 — Free ============
(NULL,
 'CJBG vs JSS — Full Match Replay',
 'شباب بن جرير الرياضي ضد الشباب الرياضي السالمي.',
 'https://images.unsplash.com/photo-1543326727-cf6c39e8f84c?w=800&q=80',
 'https://demo.botolad2.com/replays/cjbg-jss.m3u8',
 NULL,
 '1:44:50',
 DATE_SUB(CURDATE(), INTERVAL 10 DAY),
 'free', 1204,
 'https://demo.botolad2.com/summaries/cjbg-jss-resume.m3u8',
 NULL,
 '0:06:30'),

-- ============ الإعادة 9 — Standard ============
(NULL,
 'IZK vs KAC — Full Match Replay',
 'إتحاد الزموري للخميسات ضد النادي القنيطري.',
 'https://images.unsplash.com/photo-1553778263-73a83bab9b0c?w=800&q=80',
 'https://demo.botolad2.com/replays/izk-kac.m3u8',
 'https://demo.botolad2.com/downloads/izk-kac.mp4',
 '1:47:30',
 DATE_SUB(CURDATE(), INTERVAL 11 DAY),
 'standard', 356,
 'https://demo.botolad2.com/summaries/izk-kac-resume.m3u8',
 'https://demo.botolad2.com/downloads/izk-kac-resume.mp4',
 '0:08:50'),

-- ============ الإعادة 10 — Gold ============
(NULL,
 'WAF vs USB — Full Match Replay',
 'الوداد الفاسي ضد الاتحاد الرياضي البلدي — مباراة قوية.',
 'https://images.unsplash.com/photo-1574629810360-7efbbe195018?w=800&q=80',
 'https://demo.botolad2.com/replays/waf-usb.m3u8',
 'https://demo.botolad2.com/downloads/waf-usb.mp4',
 '1:53:10',
 DATE_SUB(CURDATE(), INTERVAL 12 DAY),
 'gold', 1892,
 'https://demo.botolad2.com/summaries/waf-usb-resume.m3u8',
 'https://demo.botolad2.com/downloads/waf-usb-resume.mp4',
 '0:09:45'),

-- ============ الإعادة 11 — Standard ============
(NULL,
 'OCS vs USYM — Full Match Replay',
 'أولمبيك آسفي ضد الإتحاد الرياضي اليعقوبي.',
 'https://images.unsplash.com/photo-1518091043644-c1d4457512c6?w=800&q=80',
 'https://demo.botolad2.com/replays/ocs-usym.m3u8',
 'https://demo.botolad2.com/downloads/ocs-usym.mp4',
 '1:50:05',
 DATE_SUB(CURDATE(), INTERVAL 13 DAY),
 'standard', 623,
 'https://demo.botolad2.com/summaries/ocs-usym-resume.m3u8',
 'https://demo.botolad2.com/downloads/ocs-usym-resume.mp4',
 '0:08:00'),

-- ============ الإعادة 12 — Free ============
(NULL,
 'SCCM vs OD — Full Match Replay',
 'سبورتينغ شباب المحمدية ضد أولمبيك الدشيرة — مجاني.',
 'https://images.unsplash.com/photo-1522778119026-d647f0596c20?w=800&q=80',
 'https://demo.botolad2.com/replays/sccm-od.m3u8',
 NULL,
 '1:46:45',
 DATE_SUB(CURDATE(), INTERVAL 14 DAY),
 'free', 2145,
 'https://demo.botolad2.com/summaries/sccm-od-resume.m3u8',
 NULL,
 '0:07:20'),

-- ============ الإعادة 13 — Standard ============
(NULL,
 'OCK vs JSM — Full Match Replay',
 'أولمبيك خريبكة ضد شباب المسيرة.',
 'https://images.unsplash.com/photo-1543326727-cf6c39e8f84c?w=800&q=80',
 'https://demo.botolad2.com/replays/ock-jsm.m3u8',
 'https://demo.botolad2.com/downloads/ock-jsm.mp4',
 '1:48:55',
 DATE_SUB(CURDATE(), INTERVAL 15 DAY),
 'standard', 512,
 'https://demo.botolad2.com/summaries/ock-jsm-resume.m3u8',
 'https://demo.botolad2.com/downloads/ock-jsm-resume.mp4',
 '0:09:10'),

-- ============ الإعادة 14 — Gold ============
(NULL,
 'SM vs USMO — Full Match Replay',
 'سطاد المغربي ضد اتحاد وجدة الرياضي.',
 'https://images.unsplash.com/photo-1489944440615-453fc2b6a9a9?w=800&q=80',
 'https://demo.botolad2.com/replays/sm-usmo.m3u8',
 'https://demo.botolad2.com/downloads/sm-usmo.mp4',
 '1:51:20',
 DATE_SUB(CURDATE(), INTERVAL 16 DAY),
 'gold', 1456,
 'https://demo.botolad2.com/summaries/sm-usmo-resume.m3u8',
 'https://demo.botolad2.com/downloads/sm-usmo-resume.mp4',
 '0:10:45'),

-- ============ الإعادة 15 — Standard ============
(NULL,
 'MCO vs CJBG — Full Match Replay',
 'مولودية وجدة ضد شباب بن جرير الرياضي.',
 'https://images.unsplash.com/photo-1431324155629-1a6deb1dec8d?w=800&q=80',
 'https://demo.botolad2.com/replays/mco-cjbg.m3u8',
 'https://demo.botolad2.com/downloads/mco-cjbg.mp4',
 '1:49:30',
 DATE_SUB(CURDATE(), INTERVAL 17 DAY),
 'standard', 789,
 'https://demo.botolad2.com/summaries/mco-cjbg-resume.m3u8',
 'https://demo.botolad2.com/downloads/mco-cjbg-resume.mp4',
 '0:08:15');

-- =====================================================
-- 4. عرض النتيجة
-- =====================================================
SELECT '═══════════════════════════════' AS '';
SELECT '✅ Replays Seeded!' AS message;
SELECT '═══════════════════════════════' AS '';

SELECT 
  COUNT(*) AS total_replays,
  SUM(CASE WHEN summary_video_url IS NOT NULL THEN 1 ELSE 0 END) AS with_summary,
  SUM(CASE WHEN requires_subscription = 'free' THEN 1 ELSE 0 END) AS free_count,
  SUM(CASE WHEN requires_subscription = 'standard' THEN 1 ELSE 0 END) AS standard_count,
  SUM(CASE WHEN requires_subscription = 'gold' THEN 1 ELSE 0 END) AS gold_count
FROM replays;

SELECT '═══════════════════════════════' AS '';

SELECT 
  id,
  LEFT(title, 55) AS title,
  duration,
  summary_duration,
  requires_subscription AS tier,
  views
FROM replays
ORDER BY id;

SELECT '═══════════════════════════════' AS '';