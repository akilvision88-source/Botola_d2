-- =====================================================
-- BOTOLA D2 - Database Schema
-- MySQL 8.0+
-- =====================================================

CREATE DATABASE IF NOT EXISTS botola_d2
  CHARACTER SET utf8mb4
  COLLATE utf8mb4_unicode_ci;

USE botola_d2;

-- =====================================================
-- ROLES & PERMISSIONS
-- =====================================================

CREATE TABLE roles (
  id INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  name VARCHAR(50) NOT NULL UNIQUE,
  slug VARCHAR(50) NOT NULL UNIQUE,
  description VARCHAR(255) DEFAULT NULL,
  is_system TINYINT(1) NOT NULL DEFAULT 0,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  INDEX idx_roles_slug (slug)
) ENGINE=InnoDB;

CREATE TABLE permissions (
  id INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  name VARCHAR(100) NOT NULL UNIQUE,
  module VARCHAR(50) NOT NULL,
  description VARCHAR(255) DEFAULT NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  INDEX idx_perm_module (module)
) ENGINE=InnoDB;

CREATE TABLE role_permissions (
  id INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  role_id INT UNSIGNED NOT NULL,
  permission_id INT UNSIGNED NOT NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  UNIQUE KEY uk_role_perm (role_id, permission_id),
  FOREIGN KEY (role_id) REFERENCES roles(id) ON DELETE CASCADE,
  FOREIGN KEY (permission_id) REFERENCES permissions(id) ON DELETE CASCADE
) ENGINE=InnoDB;

-- =====================================================
-- USERS
-- =====================================================

CREATE TABLE users (
  id INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  full_name VARCHAR(120) NOT NULL,
  email VARCHAR(150) NOT NULL UNIQUE,
  phone VARCHAR(30) DEFAULT NULL,
  password VARCHAR(255) NOT NULL,
  avatar VARCHAR(255) DEFAULT NULL,
  role_id INT UNSIGNED NOT NULL,
  subscription_plan_id INT UNSIGNED DEFAULT NULL,
  subscription_start DATETIME DEFAULT NULL,
  subscription_end DATETIME DEFAULT NULL,
  subscription_status ENUM('active','expired','cancelled','pending') DEFAULT 'pending',
  status ENUM('active','suspended','inactive') NOT NULL DEFAULT 'active',
  email_verified TINYINT(1) NOT NULL DEFAULT 0,
  verification_token VARCHAR(255) DEFAULT NULL,
  reset_token VARCHAR(255) DEFAULT NULL,
  reset_token_expires DATETIME DEFAULT NULL,
  language ENUM('fr','en','ar') NOT NULL DEFAULT 'fr',
  last_login DATETIME DEFAULT NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  INDEX idx_users_email (email),
  INDEX idx_users_role (role_id),
  INDEX idx_users_status (status),
  FOREIGN KEY (role_id) REFERENCES roles(id) ON DELETE RESTRICT
) ENGINE=InnoDB;

-- =====================================================
-- TEAMS
-- =====================================================

CREATE TABLE teams (
  id INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  name VARCHAR(120) NOT NULL,
  short_name VARCHAR(20) DEFAULT NULL,
  slug VARCHAR(150) NOT NULL UNIQUE,
  logo VARCHAR(255) DEFAULT NULL,
  city VARCHAR(100) DEFAULT NULL,
  stadium_id INT UNSIGNED DEFAULT NULL,
  description TEXT DEFAULT NULL,
  founded_year SMALLINT DEFAULT NULL,
  status ENUM('active','inactive') NOT NULL DEFAULT 'active',
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  INDEX idx_teams_slug (slug),
  INDEX idx_teams_status (status)
) ENGINE=InnoDB;

-- =====================================================
-- STADIUMS
-- =====================================================

CREATE TABLE stadiums (
  id INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  name VARCHAR(150) NOT NULL,
  city VARCHAR(100) NOT NULL,
  capacity INT UNSIGNED DEFAULT NULL,
  address VARCHAR(255) DEFAULT NULL,
  image VARCHAR(255) DEFAULT NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  INDEX idx_stadiums_city (city)
) ENGINE=InnoDB;

ALTER TABLE teams
  ADD CONSTRAINT fk_teams_stadium
  FOREIGN KEY (stadium_id) REFERENCES stadiums(id) ON DELETE SET NULL;

-- =====================================================
-- MATCHES
-- =====================================================

CREATE TABLE matches (
  id INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  competition VARCHAR(120) NOT NULL DEFAULT 'Botola D2',
  team_home_id INT UNSIGNED NOT NULL,
  team_away_id INT UNSIGNED NOT NULL,
  score_home TINYINT UNSIGNED NOT NULL DEFAULT 0,
  score_away TINYINT UNSIGNED NOT NULL DEFAULT 0,
  match_minute TINYINT UNSIGNED NOT NULL DEFAULT 0,
  status ENUM('upcoming','live','halftime','finished','postponed','cancelled') NOT NULL DEFAULT 'upcoming',
  stadium_id INT UNSIGNED DEFAULT NULL,
  city VARCHAR(100) DEFAULT NULL,
  referee VARCHAR(120) DEFAULT NULL,
  match_date DATE NOT NULL,
  match_time TIME NOT NULL,
  stream_url VARCHAR(500) DEFAULT NULL,
  thumbnail VARCHAR(255) DEFAULT NULL,
  round VARCHAR(50) DEFAULT NULL,
  attendance INT UNSIGNED DEFAULT NULL,
  created_by INT UNSIGNED DEFAULT NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  INDEX idx_matches_status (status),
  INDEX idx_matches_date (match_date),
  INDEX idx_matches_teams (team_home_id, team_away_id),
  FOREIGN KEY (team_home_id) REFERENCES teams(id) ON DELETE RESTRICT,
  FOREIGN KEY (team_away_id) REFERENCES teams(id) ON DELETE RESTRICT,
  FOREIGN KEY (stadium_id) REFERENCES stadiums(id) ON DELETE SET NULL
) ENGINE=InnoDB;

-- =====================================================
-- MATCH GOALS
-- =====================================================

CREATE TABLE match_goals (
  id INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  match_id INT UNSIGNED NOT NULL,
  team_id INT UNSIGNED NOT NULL,
  player_name VARCHAR(120) NOT NULL,
  minute TINYINT UNSIGNED NOT NULL,
  is_penalty TINYINT(1) DEFAULT 0,
  is_own_goal TINYINT(1) DEFAULT 0,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  INDEX idx_goals_match (match_id),
  FOREIGN KEY (match_id) REFERENCES matches(id) ON DELETE CASCADE,
  FOREIGN KEY (team_id) REFERENCES teams(id) ON DELETE CASCADE
) ENGINE=InnoDB;

-- =====================================================
-- MATCH CARDS
-- =====================================================

CREATE TABLE match_cards (
  id INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  match_id INT UNSIGNED NOT NULL,
  team_id INT UNSIGNED NOT NULL,
  player_name VARCHAR(120) NOT NULL,
  card_type ENUM('yellow','red','second_yellow') NOT NULL,
  minute TINYINT UNSIGNED NOT NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  INDEX idx_cards_match (match_id),
  FOREIGN KEY (match_id) REFERENCES matches(id) ON DELETE CASCADE,
  FOREIGN KEY (team_id) REFERENCES teams(id) ON DELETE CASCADE
) ENGINE=InnoDB;

-- =====================================================
-- MATCH EVENTS (timeline)
-- =====================================================

CREATE TABLE match_events (
  id INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  match_id INT UNSIGNED NOT NULL,
  team_id INT UNSIGNED DEFAULT NULL,
  event_type ENUM('goal','yellow_card','red_card','substitution','penalty','own_goal','var','kickoff','halftime','fulltime') NOT NULL,
  player_name VARCHAR(120) DEFAULT NULL,
  player_secondary VARCHAR(120) DEFAULT NULL,
  minute TINYINT UNSIGNED NOT NULL,
  description VARCHAR(255) DEFAULT NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  INDEX idx_events_match (match_id),
  FOREIGN KEY (match_id) REFERENCES matches(id) ON DELETE CASCADE,
  FOREIGN KEY (team_id) REFERENCES teams(id) ON DELETE SET NULL
) ENGINE=InnoDB;

-- =====================================================
-- MATCH STATISTICS
-- =====================================================

CREATE TABLE match_statistics (
  id INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  match_id INT UNSIGNED NOT NULL UNIQUE,
  possession_home TINYINT UNSIGNED DEFAULT 0,
  possession_away TINYINT UNSIGNED DEFAULT 0,
  shots_home SMALLINT UNSIGNED DEFAULT 0,
  shots_away SMALLINT UNSIGNED DEFAULT 0,
  shots_on_target_home SMALLINT UNSIGNED DEFAULT 0,
  shots_on_target_away SMALLINT UNSIGNED DEFAULT 0,
  corners_home SMALLINT UNSIGNED DEFAULT 0,
  corners_away SMALLINT UNSIGNED DEFAULT 0,
  fouls_home SMALLINT UNSIGNED DEFAULT 0,
  fouls_away SMALLINT UNSIGNED DEFAULT 0,
  offsides_home SMALLINT UNSIGNED DEFAULT 0,
  offsides_away SMALLINT UNSIGNED DEFAULT 0,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  FOREIGN KEY (match_id) REFERENCES matches(id) ON DELETE CASCADE
) ENGINE=InnoDB;

-- =====================================================
-- REPLAYS
-- =====================================================

CREATE TABLE replays (
  id INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  match_id INT UNSIGNED DEFAULT NULL,
  title VARCHAR(200) NOT NULL,
  description TEXT DEFAULT NULL,
  thumbnail VARCHAR(255) DEFAULT NULL,
  video_url VARCHAR(500) NOT NULL,
  download_url VARCHAR(500) DEFAULT NULL,
  duration VARCHAR(20) DEFAULT NULL,
  replay_date DATE NOT NULL,
  views INT UNSIGNED DEFAULT 0,
  requires_subscription ENUM('free','standard','gold') NOT NULL DEFAULT 'standard',
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  INDEX idx_replays_date (replay_date),
  INDEX idx_replays_sub (requires_subscription),
  FOREIGN KEY (match_id) REFERENCES matches(id) ON DELETE SET NULL
) ENGINE=InnoDB;

-- =====================================================
-- SUBSCRIPTION PLANS
-- =====================================================

CREATE TABLE subscription_plans (
  id INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  name VARCHAR(60) NOT NULL,
  slug VARCHAR(60) NOT NULL UNIQUE,
  description VARCHAR(255) DEFAULT NULL,
  price DECIMAL(10,2) NOT NULL DEFAULT 0.00,
  currency VARCHAR(10) NOT NULL DEFAULT 'MAD',
  duration_days INT UNSIGNED NOT NULL DEFAULT 30,
  features JSON DEFAULT NULL,
  live_access TINYINT(1) NOT NULL DEFAULT 0,
  replay_access TINYINT(1) NOT NULL DEFAULT 0,
  download_access TINYINT(1) NOT NULL DEFAULT 0,
  hd_access TINYINT(1) NOT NULL DEFAULT 0,
  is_active TINYINT(1) NOT NULL DEFAULT 1,
  display_order TINYINT UNSIGNED NOT NULL DEFAULT 0,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  INDEX idx_plans_active (is_active)
) ENGINE=InnoDB;

ALTER TABLE users
  ADD CONSTRAINT fk_users_plan
  FOREIGN KEY (subscription_plan_id) REFERENCES subscription_plans(id) ON DELETE SET NULL;

-- =====================================================
-- SUBSCRIPTION PAYMENTS / HISTORY
-- =====================================================

CREATE TABLE subscriptions (
  id INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  user_id INT UNSIGNED NOT NULL,
  plan_id INT UNSIGNED NOT NULL,
  amount DECIMAL(10,2) NOT NULL,
  currency VARCHAR(10) NOT NULL DEFAULT 'MAD',
  payment_method VARCHAR(50) DEFAULT NULL,
  payment_reference VARCHAR(120) DEFAULT NULL,
  status ENUM('pending','active','expired','cancelled','refunded') NOT NULL DEFAULT 'pending',
  start_date DATETIME NOT NULL,
  end_date DATETIME NOT NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  INDEX idx_subs_user (user_id),
  INDEX idx_subs_status (status),
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
  FOREIGN KEY (plan_id) REFERENCES subscription_plans(id) ON DELETE RESTRICT
) ENGINE=InnoDB;

-- =====================================================
-- NOTIFICATIONS
-- =====================================================

CREATE TABLE notifications (
  id INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  user_id INT UNSIGNED DEFAULT NULL,
  match_id INT UNSIGNED DEFAULT NULL,
  type ENUM('match_reminder','subscription','system','admin_broadcast') NOT NULL DEFAULT 'system',
  title VARCHAR(180) NOT NULL,
  message TEXT NOT NULL,
  is_read TINYINT(1) NOT NULL DEFAULT 0,
  is_broadcast TINYINT(1) NOT NULL DEFAULT 0,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  INDEX idx_notif_user (user_id, is_read),
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
  FOREIGN KEY (match_id) REFERENCES matches(id) ON DELETE SET NULL
) ENGINE=InnoDB;

-- =====================================================
-- SAVED MATCHES (Notify Me)
-- =====================================================

CREATE TABLE saved_matches (
  id INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  user_id INT UNSIGNED NOT NULL,
  match_id INT UNSIGNED NOT NULL,
  notify TINYINT(1) NOT NULL DEFAULT 1,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  UNIQUE KEY uk_saved_user_match (user_id, match_id),
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
  FOREIGN KEY (match_id) REFERENCES matches(id) ON DELETE CASCADE
) ENGINE=InnoDB;

-- =====================================================
-- DOWNLOAD HISTORY
-- =====================================================

CREATE TABLE downloads (
  id INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  user_id INT UNSIGNED NOT NULL,
  replay_id INT UNSIGNED NOT NULL,
  ip_address VARCHAR(45) DEFAULT NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  INDEX idx_dl_user (user_id),
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
  FOREIGN KEY (replay_id) REFERENCES replays(id) ON DELETE CASCADE
) ENGINE=InnoDB;

-- =====================================================
-- CONTACT MESSAGES
-- =====================================================

CREATE TABLE contact_messages (
  id INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  name VARCHAR(120) NOT NULL,
  email VARCHAR(150) NOT NULL,
  phone VARCHAR(30) DEFAULT NULL,
  subject VARCHAR(200) NOT NULL,
  message TEXT NOT NULL,
  status ENUM('new','read','replied','archived') NOT NULL DEFAULT 'new',
  ip_address VARCHAR(45) DEFAULT NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  INDEX idx_msg_status (status)
) ENGINE=InnoDB;

-- =====================================================
-- SETTINGS (Key/Value)
-- =====================================================

CREATE TABLE settings (
  id INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  setting_key VARCHAR(80) NOT NULL UNIQUE,
  setting_value TEXT DEFAULT NULL,
  setting_group VARCHAR(50) DEFAULT 'general',
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  INDEX idx_settings_group (setting_group)
) ENGINE=InnoDB;