-- =====================================================
-- BOTOLA D2 — Replay Summaries (Resume) Demo Data
-- إضافة ملخصات للإعادات الموجودة
-- =====================================================

USE botola_d2;

-- =====================================================
-- تحديث الإعادات الموجودة بملخصات (Highlights)
-- =====================================================

-- Replay 1: MAT vs USAT — Full + Summary
UPDATE replays
SET 
  summary_video_url = 'https://demo.botolad2.com/summaries/mat-usat-resume.m3u8',
  summary_download_url = 'https://demo.botolad2.com/downloads/mat-usat-resume.mp4',
  summary_duration = '0:08:30'
WHERE id = 1 OR title LIKE '%MAT%USAT%' OR title LIKE '%المغرب%تيزنيت%';

-- Replay 2: WST vs JSM — Full + Summary
UPDATE replays
SET 
  summary_video_url = 'https://demo.botolad2.com/summaries/wst-jsm-resume.m3u8',
  summary_download_url = 'https://demo.botolad2.com/downloads/wst-jsm-resume.mp4',
  summary_duration = '0:10:15'
WHERE id = 2 OR title LIKE '%WST%JSM%' OR title LIKE '%تمارة%المسيرة%';

-- Replay 3: JSS vs CAK — Full + Summary
UPDATE replays
SET 
  summary_video_url = 'https://demo.botolad2.com/summaries/jss-cak-resume.m3u8',
  summary_download_url = 'https://demo.botolad2.com/downloads/jss-cak-resume.mp4',
  summary_duration = '0:06:45'
WHERE id = 3 OR title LIKE '%JSS%CAK%' OR title LIKE '%السالمي%خنيفرة%';

-- Replay 4: SM vs WAF — Full + Summary
UPDATE replays
SET 
  summary_video_url = 'https://demo.botolad2.com/summaries/sm-waf-resume.m3u8',
  summary_download_url = 'https://demo.botolad2.com/downloads/sm-waf-resume.mp4',
  summary_duration = '0:07:45'
WHERE id = 4 OR title LIKE '%SM%WAF%' OR title LIKE '%سطاد%الفاسي%';

-- Replay 5: MCO vs CSBJ — Full + Summary
UPDATE replays
SET 
  summary_video_url = 'https://demo.botolad2.com/summaries/mco-csbj-resume.m3u8',
  summary_download_url = 'https://demo.botolad2.com/downloads/mco-csbj-resume.mp4',
  summary_duration = '0:09:20'
WHERE id = 5 OR title LIKE '%MCO%CSBJ%' OR title LIKE '%وجدة%بن جرير%';

-- Replay 6: MAT vs JSS — Derby — Full + Summary
UPDATE replays
SET 
  summary_video_url = 'https://demo.botolad2.com/summaries/mat-jss-resume.m3u8',
  summary_download_url = 'https://demo.botolad2.com/downloads/mat-jss-resume.mp4',
  summary_duration = '0:11:00'
WHERE id = 6 OR title LIKE '%MAT%JSS%' OR title LIKE '%ديربي%تطوان%السالمي%';

-- Replay 7: WST vs WAF — Full + Summary
UPDATE replays
SET 
  summary_video_url = 'https://demo.botolad2.com/summaries/wst-waf-resume.m3u8',
  summary_download_url = 'https://demo.botolad2.com/downloads/wst-waf-resume.mp4',
  summary_duration = '0:08:12'
WHERE id = 7 OR title LIKE '%WST%WAF%';

-- Replay 8: CAK vs MCO — Full + Summary (Free tier)
UPDATE replays
SET 
  summary_video_url = 'https://demo.botolad2.com/summaries/cak-mco-resume.m3u8',
  summary_download_url = NULL,
  summary_duration = '0:07:30'
WHERE id = 8 OR title LIKE '%CAK%MCO%';

-- =====================================================
-- إضافة إعادات جديدة (بعضها بدون ملخص)
-- =====================================================

-- بدون ملخص — لاختبار الحالة "No Resume"
INSERT INTO replays
(match_id, title, description, video_url, download_url, duration,
 replay_date, requires_subscription, views,
 summary_video_url, summary_download_url, summary_duration)
VALUES
(14, 'CAYB vs RCAZ — Full Match Replay',
     'الإعادة الكاملة — بدون ملخص',
     'https://demo.botolad2.com/replays/cayb-rcaz.m3u8',
     'https://demo.botolad2.com/downloads/cayb-rcaz.mp4',
     '1:48:20',
     DATE_SUB(CURDATE(), INTERVAL 10 DAY),
     'standard', 145,
     NULL, NULL, NULL),

(16, 'KACM vs RSB — Full Match Replay',
     'الإعادة الكاملة مع ملخص مميز',
     'https://demo.botolad2.com/replays/kacm-rsb.m3u8',
     'https://demo.botolad2.com/downloads/kacm-rsb.mp4',
     '1:52:10',
     DATE_SUB(CURDATE(), INTERVAL 12 DAY),
     'gold', 892,
     'https://demo.botolad2.com/summaries/kacm-rsb-resume.m3u8',
     'https://demo.botolad2.com/downloads/kacm-rsb-resume.mp4',
     '0:09:45'),

(17, 'HUSA vs SCCM — Full Match Replay',
     'مباراة مثيرة مع ملخص كامل',
     'https://demo.botolad2.com/replays/husa-sccm.m3u8',
     'https://demo.botolad2.com/downloads/husa-sccm.mp4',
     '1:50:05',
     DATE_SUB(CURDATE(), INTERVAL 12 DAY),
     'standard', 356,
     'https://demo.botolad2.com/summaries/husa-sccm-resume.m3u8',
     'https://demo.botolad2.com/downloads/husa-sccm-resume.mp4',
     '0:08:50'),

(18, 'MAS vs MCO — Full Match Replay',
     'المغرب الفاسي ضد المولودية الوجدية — ملخص رائع',
     'https://demo.botolad2.com/replays/mas-mco.m3u8',
     NULL,
     '1:44:50',
     DATE_SUB(CURDATE(), INTERVAL 11 DAY),
     'free', 1204,
     'https://demo.botolad2.com/summaries/mas-mco-resume.m3u8',
     NULL,
     '0:06:30'),

(20, 'OCS vs RCOZ — Full Match Replay',
     'أولمبيك آسفي ضد الرابيد الزموري',
     'https://demo.botolad2.com/replays/ocs-rcoz.m3u8',
     'https://demo.botolad2.com/downloads/ocs-rcoz.mp4',
     '1:49:30',
     DATE_SUB(CURDATE(), INTERVAL 10 DAY),
     'standard', 234,
     'https://demo.botolad2.com/summaries/ocs-rcoz-resume.m3u8',
     'https://demo.botolad2.com/downloads/ocs-rcoz-resume.mp4',
     '0:09:15');

-- =====================================================
-- تحديث الإعادات بدون ملخص (لإظهار الحالة بدون RESUME button)
-- =====================================================
UPDATE replays
SET 
  summary_video_url = NULL,
  summary_download_url = NULL,
  summary_duration = NULL
WHERE id IN (
  SELECT id FROM (
    SELECT id FROM replays 
    WHERE requires_subscription = 'standard' 
      AND summary_video_url IS NULL
    LIMIT 2
  ) AS t
);

-- =====================================================
-- ✅ التحقق
-- =====================================================
SELECT '✅ تم إضافة الملخصات بنجاح' AS status;

SELECT 
  COUNT(*) AS total_replays,
  SUM(CASE WHEN summary_video_url IS NOT NULL THEN 1 ELSE 0 END) AS with_summary,
  SUM(CASE WHEN summary_video_url IS NULL THEN 1 ELSE 0 END) AS without_summary
FROM replays;

SELECT 
  id,
  LEFT(title, 60) AS title,
  duration AS full_duration,
  summary_duration AS summary_duration,
  requires_subscription AS tier
FROM replays
ORDER BY id
LIMIT 20;