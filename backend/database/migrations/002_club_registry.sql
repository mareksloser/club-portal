SET NAMES utf8mb4;
-- Club registry: seasons, their teams, people (players and staff) and coaching licences.
-- For an existing database; fresh installs get the same tables from schema.sql.

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
