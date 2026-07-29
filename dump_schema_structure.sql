-- Commande mysqldump pour exporter uniquement la structure de la base de données
-- Cette commande ne récupère que les CREATE TABLE, pas les données

-- Pour exécuter cette commande, utilisez :
-- mysqldump -u [votre_utilisateur] -p --no-data --routines --triggers [nom_de_votre_base] > schema_structure.sql

-- Exemple avec les paramètres typiques :
-- mysqldump -u root -p --no-data --routines --triggers fosilamaster > schema_structure.sql

-- Si vous avez un fichier .env avec les credentials, vous pouvez utiliser :
-- mysqldump --defaults-extra-file=/chemin/vers/votre/.my.cnf --no-data --routines --triggers fosilamaster > schema_structure.sql

-- Pour une version plus légère (uniquement les tables) :
-- mysqldump -u root -p --no-data fosilamaster > schema_tables_only.sql

-- Pour inclure les commentaires et les contraintes :
-- mysqldump -u root -p --no-data --add-drop-table --comments fosilamaster > schema_with_comments.sql

-- Commande complète recommandée :
mysqldump -u root -p \
  --no-data \
  --routines \
  --triggers \
  --add-drop-table \
  --comments \
  --complete-insert \
  fosilamaster > schema_complete.sql

   mysqldump -u [Nexus] -p --no-data --routines --triggers [fosilamaster] > schema_structure.sql
