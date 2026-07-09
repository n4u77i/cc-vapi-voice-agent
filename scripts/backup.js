const { execFileSync } = require("child_process");
const fs = require("fs");
const path = require("path");

require("dotenv").config();

const databaseUrl = process.env.DATABASE_URL;

if (!databaseUrl) {
  throw new Error("DATABASE_URL is required.");
}

const backupsDir = path.join(process.cwd(), "backups");

if (!fs.existsSync(backupsDir)) {
  fs.mkdirSync(backupsDir);
}

const timestamp = new Date().toISOString().replace(/[:.]/g, "-");
const outputFile = path.join(backupsDir, `backup-${timestamp}.sql`);

execFileSync("pg_dump", [databaseUrl, "-f", outputFile], {
  stdio: "inherit"
});

console.log(`Backup completed: ${outputFile}`);
