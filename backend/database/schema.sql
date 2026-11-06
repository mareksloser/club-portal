SET NAMES utf8mb4;
-- Club portal (rozcestník). MySQL 8 / MariaDB 10.6+
-- Who may see a link is stored with the link (access_*); users, teams and roles live in the club IdP.

CREATE TABLE `sections` (
  `id` INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  `title` VARCHAR(60) NOT NULL,
  `layout` VARCHAR(20) NOT NULL DEFAULT 'tiles' COMMENT 'tiles = icon grid, columns = bookmark lists',
  `sort_order` INT NOT NULL DEFAULT 0,
  `created_at` TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE `links` (
  `id` INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  `section_id` INT UNSIGNED NOT NULL,
  `column_name` VARCHAR(40) NULL COMMENT 'heading of the column in a columns section',
  `title` VARCHAR(80) NOT NULL,
  `subtitle` VARCHAR(120) NULL,
  `url` VARCHAR(500) NOT NULL,
  `icon` VARCHAR(310) NULL COMMENT 'lucide:<name> or url:https://…',
  `new_tab` TINYINT(1) NOT NULL DEFAULT 0,
  `sort_order` INT NOT NULL DEFAULT 0,
  `access_type` VARCHAR(20) NOT NULL DEFAULT 'members' COMMENT 'public | members | team | role | editors',
  `access_team` VARCHAR(50) NULL COMMENT 'IdP team slug, NULL = any team',
  `access_value` VARCHAR(50) NULL COMMENT 'membership (team) or role slug (role)',
  `created_by` CHAR(36) NULL COMMENT 'IdP sub',
  `created_at` TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  KEY `idx_links_section` (`section_id`, `sort_order`),
  CONSTRAINT `fk_links_section` FOREIGN KEY (`section_id`) REFERENCES `sections`(`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Club registry (also as database/migrations/002_club_registry.sql for existing databases)
CREATE TABLE `seasons` (
  `id` INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  `name` VARCHAR(20) NOT NULL COMMENT 'e.g. 2026/27',
  `starts_on` DATE NOT NULL,
  `ends_on` DATE NOT NULL,
  `created_at` TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  UNIQUE KEY `uniq_season_name` (`name`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE `teams` (
  `id` INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  `season_id` INT UNSIGNED NOT NULL,
  `name` VARCHAR(80) NOT NULL COMMENT 'e.g. Mladší přípravka',
  `category` VARCHAR(40) NULL COMMENT 'e.g. U11',
  `auth_team` VARCHAR(50) NULL COMMENT 'team slug in the club account (IdP), for access rules',
  `sort_order` INT NOT NULL DEFAULT 0,
  `created_at` TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  KEY `idx_teams_season` (`season_id`, `sort_order`),
  CONSTRAINT `fk_teams_season` FOREIGN KEY (`season_id`) REFERENCES `seasons`(`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- One row per person across seasons; teams change, the person stays.
CREATE TABLE `people` (
  `id` INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  `first_name` VARCHAR(60) NOT NULL,
  `last_name` VARCHAR(60) NOT NULL,
  `birth_date` DATE NULL,
  `facr_id` VARCHAR(20) NULL COMMENT 'FAČR registration number',
  `email` VARCHAR(150) NULL,
  `phone` VARCHAR(30) NULL,
  `note` VARCHAR(500) NULL,
  `auth_sub` VARCHAR(64) NULL COMMENT 'linked club account (IdP sub)',
  `auth_name` VARCHAR(150) NULL COMMENT 'account name and e-mail when linked, for display',
  `created_at` TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  UNIQUE KEY `uniq_people_auth` (`auth_sub`),
  KEY `idx_people_name` (`last_name`, `first_name`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE `team_members` (
  `id` INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  `team_id` INT UNSIGNED NOT NULL,
  `person_id` INT UNSIGNED NOT NULL,
  `kind` VARCHAR(10) NOT NULL COMMENT 'player | staff',
  `staff_role` VARCHAR(40) NULL COMMENT 'staff only: Hlavní trenér, Asistent trenéra, Vedoucí týmu…',
  `jersey_number` TINYINT UNSIGNED NULL COMMENT 'players only',
  UNIQUE KEY `uniq_member` (`team_id`, `person_id`, `kind`),
  KEY `idx_members_person` (`person_id`),
  CONSTRAINT `fk_members_team` FOREIGN KEY (`team_id`) REFERENCES `teams`(`id`) ON DELETE CASCADE,
  CONSTRAINT `fk_members_person` FOREIGN KEY (`person_id`) REFERENCES `people`(`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE `licences` (
  `id` INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  `person_id` INT UNSIGNED NOT NULL,
  `type` VARCHAR(60) NOT NULL COMMENT 'e.g. UEFA B',
  `number` VARCHAR(40) NULL,
  `issued_on` DATE NULL,
  `valid_until` DATE NULL COMMENT 'NULL = no expiry',
  `note` VARCHAR(255) NULL,
  `created_at` TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  KEY `idx_licences_person` (`person_id`),
  CONSTRAINT `fk_licences_person` FOREIGN KEY (`person_id`) REFERENCES `people`(`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
