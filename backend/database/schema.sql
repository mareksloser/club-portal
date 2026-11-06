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
