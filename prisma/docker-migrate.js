const { PrismaClient } = require('../src/generated/prisma');
const fs = require('fs');
const path = require('path');

const prisma = new PrismaClient();

async function main() {
  console.log('Running manual migrations...');

  // Check if tables exist - if not, reset migration tracking
  try {
    await prisma.$queryRawUnsafe('SELECT 1 FROM users LIMIT 1');
  } catch {
    console.log('  Tables missing, resetting migration tracking...');
    await prisma.$executeRawUnsafe('DROP TABLE IF EXISTS _prisma_migrations');
  }

  // Create migrations tracking table if not exists
  await prisma.$executeRawUnsafe(`
    CREATE TABLE IF NOT EXISTS _prisma_migrations (
      id VARCHAR(36) PRIMARY KEY,
      checksum VARCHAR(64) NOT NULL,
      finished_at DATETIME(3),
      migration_name VARCHAR(255) NOT NULL,
      logs TEXT,
      rolled_back_at DATETIME(3),
      started_at DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
      applied_steps_count INT UNSIGNED NOT NULL DEFAULT 0
    )
  `);

  // Get already applied migrations
  const applied = await prisma.$queryRawUnsafe(
    'SELECT migration_name FROM _prisma_migrations WHERE finished_at IS NOT NULL'
  );
  const appliedNames = new Set(applied.map(r => r.migration_name));

  // Read migration directories
  const migrationsDir = path.join(__dirname, 'migrations');
  const dirs = fs.readdirSync(migrationsDir)
    .filter(d => fs.statSync(path.join(migrationsDir, d)).isDirectory())
    .sort();

  for (const dir of dirs) {
    if (appliedNames.has(dir)) {
      console.log(`  Skip: ${dir} (already applied)`);
      continue;
    }

    const sqlFile = path.join(migrationsDir, dir, 'migration.sql');
    if (!fs.existsSync(sqlFile)) {
      console.log(`  Skip: ${dir} (no migration.sql)`);
      continue;
    }

    console.log(`  Applying: ${dir}...`);
    const sql = fs.readFileSync(sqlFile, 'utf8');

    // Split by semicolons and execute each statement
    const statements = sql
      .split(';')
      .map(s => s.trim())
      .filter(s => {
        // Remove comment-only lines and check if there's actual SQL
        const withoutComments = s.replace(/--.*$/gm, '').trim();
        return withoutComments.length > 0;
      });

    const id = require('crypto').randomUUID();
    const startedAt = new Date();

    try {
      for (const stmt of statements) {
        try {
          await prisma.$executeRawUnsafe(stmt);
        } catch (stmtErr) {
          // 1060 = ER_DUP_FIELDNAME (column already exists) - safe to ignore for idempotency
          // 1050 = ER_TABLE_EXISTS_ERROR - safe to ignore
          // 1091 = ER_CANT_DROP_FIELD_OR_KEY - can't drop non-existent key
          const ignoredCodes = [1060, 1050, 1091];
          const code = stmtErr.meta?.code ?? stmtErr.code;
          if (ignoredCodes.includes(Number(code))) {
            console.log(`    (skipped: ${stmtErr.message.split('\n')[0]})`);
          } else {
            throw stmtErr;
          }
        }
      }

      // Record migration
      await prisma.$executeRawUnsafe(
        `INSERT INTO _prisma_migrations (id, checksum, finished_at, migration_name, started_at, applied_steps_count)
         VALUES (?, ?, ?, ?, ?, ?)`,
        id,
        require('crypto').createHash('sha256').update(sql).digest('hex'),
        new Date(),
        dir,
        startedAt,
        statements.length
      );

      console.log(`  Done: ${dir} (${statements.length} statements)`);
    } catch (e) {
      console.error(`  Error in ${dir}:`, e.message);
      throw e;
    }
  }

  console.log('Migrations completed!');
}

main()
  .catch(e => { console.error('Migration error:', e.message); process.exit(1); })
  .finally(() => prisma.$disconnect());
