function getBackupGuidance() {
  return {
    managed: "Use Railway PostgreSQL backups for production-style recovery.",
    manual: "Run npm run backup from a machine with pg_dump available."
  };
}

module.exports = { getBackupGuidance };
