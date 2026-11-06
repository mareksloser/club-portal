SET NAMES utf8mb4;
-- Starting content; change everything in the portal's edit mode.
INSERT INTO `sections` (`id`, `title`, `layout`, `sort_order`) VALUES
  (1, 'Aplikace', 'tiles', 0),
  (2, 'Záložky', 'columns', 1);

INSERT INTO `links` (`section_id`, `column_name`, `title`, `subtitle`, `url`, `icon`, `sort_order`, `access_type`, `access_team`, `access_value`) VALUES
  (1, NULL, 'Videorozbory', 'mvr.mareksloser.cz', 'https://mvr.mareksloser.cz/login', 'lucide:clapperboard', 0, 'members', NULL, NULL),
  (1, NULL, 'Rezervace hřiště', 'pitch.mareksloser.cz', 'https://pitch.mareksloser.cz/', 'lucide:calendar-days', 1, 'team', NULL, 'coach'),
  (1, NULL, 'Klubový účet', 'Heslo, dvoufázové ověření, zařízení', 'https://auth.mareksloser.cz/', 'lucide:shield-check', 2, 'members', NULL, NULL),
  (2, 'Klub', 'Web klubu', NULL, 'https://www.banik-libusin.cz/', 'lucide:globe', 0, 'public', NULL, NULL),
  (2, 'Trenéři', 'Výsledky na FAČR', NULL, 'https://www.fotbal.cz/', 'lucide:trophy', 0, 'team', NULL, 'coach');
