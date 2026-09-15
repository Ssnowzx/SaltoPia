-- Prisma Migrate creates and drops a throwaway "shadow database" on every
-- `migrate dev` run to detect schema drift. The application user needs database-level
-- DDL rights for that, which MARIADB_USER does not get by default.
--
-- This grant is scoped to local development. The VPS runs `migrate deploy`, which
-- needs no shadow database, so the production user must NOT be granted this.
GRANT CREATE, ALTER, DROP, REFERENCES ON *.* TO 'serranopolis'@'%';
FLUSH PRIVILEGES;
