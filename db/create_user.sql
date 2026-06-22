-- ============================================================
-- Script complet pour créer l'utilisateur agent
-- À exécuter dans phpMyAdmin > base "assurance_group" > onglet SQL
-- ============================================================

-- Étape 1 : Modifier la colonne mot_de_passe pour accepter du texte
ALTER TABLE `user` MODIFY `mot_de_passe` VARCHAR(255) NOT NULL;

-- Étape 2 : Insérer l'utilisateur admin
INSERT INTO `user` (`email`, `mot_de_passe`) VALUES ('admin@stipe.tn', 'admin123');

-- Étape 3 : Vérifier l'insertion
SELECT * FROM `user`;
