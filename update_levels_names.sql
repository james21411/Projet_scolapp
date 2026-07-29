-- Reset levels for defaults matching EXACT naming and order logic
UPDATE school_levels SET name = 'Secondaire' WHERE name LIKE 'Secondaire Général (Francophone)' OR id = 'secondaire-fr-id';
UPDATE school_levels SET name = 'Nursery' WHERE name LIKE 'Nursery (Maternelle Anglophone)' OR id = 'nursery-en-id';
UPDATE school_levels SET name = 'Primary' WHERE name LIKE 'Primary (Primaire Anglophone)' OR id = 'primary-en-id';
UPDATE school_levels SET name = 'Secondary' WHERE name LIKE 'Secondary (Secondaire Anglophone)' OR id = 'secondary-en-id';
UPDATE school_levels SET name = 'Enseignement Technique' WHERE name LIKE 'Enseignement Technique (Francophone)' OR id = 'technique-fr-id';
UPDATE school_levels SET name = 'Technical Education' WHERE name LIKE 'Technical Education (Anglophone)' OR id = 'technique-en-id';
