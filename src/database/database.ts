import * as SQLite from "expo-sqlite";

const DATABASE_NAME = "sklocal.db";

let databasePromise:
  | Promise<SQLite.SQLiteDatabase>
  | null = null;

let initializationPromise:
  | Promise<SQLite.SQLiteDatabase>
  | null = null;

export function getDatabase() {
  if (!databasePromise) {
    databasePromise =
      SQLite.openDatabaseAsync(DATABASE_NAME);
  }

  return databasePromise;
}

async function addColumnIfMissing(
  db: SQLite.SQLiteDatabase,
  tableName: string,
  columnName: string,
  columnDefinition: string
) {
  const columns =
    await db.getAllAsync<{ name: string }>(
      `PRAGMA table_info(${tableName})`
    );

  const exists = columns.some(
    (column) => column.name === columnName
  );

  if (exists) {
    return;
  }

  try {
    await db.execAsync(
      `ALTER TABLE ${tableName} ADD COLUMN ${columnDefinition};`
    );
  } catch (error) {
    const message = String(error);

    if (
      message.toLowerCase().includes(
        "duplicate column name"
      )
    ) {
      return;
    }

    throw error;
  }
}

async function runDatabaseInitialization() {
  const db = await getDatabase();

  await db.execAsync(`
    PRAGMA journal_mode = WAL;
    PRAGMA foreign_keys = ON;

    CREATE TABLE IF NOT EXISTS app_metadata (
      id INTEGER PRIMARY KEY NOT NULL,
      key TEXT NOT NULL UNIQUE,
      value TEXT,
      created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
      updated_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
    );

    CREATE TABLE IF NOT EXISTS users (
      id TEXT PRIMARY KEY NOT NULL,
      username TEXT NOT NULL COLLATE NOCASE UNIQUE,
      password_hash TEXT NOT NULL,
      password_salt TEXT NOT NULL,
      full_name TEXT,
      role TEXT,
      authorization_level TEXT NOT NULL DEFAULT 'unverified',
      authorized_by TEXT,
      authorized_at TEXT,
      recovery_question TEXT,
      recovery_answer_hash TEXT,
      recovery_answer_salt TEXT,
      is_active INTEGER NOT NULL DEFAULT 1,
      created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
      updated_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
    );

    CREATE TABLE IF NOT EXISTS app_session (
      id INTEGER PRIMARY KEY NOT NULL CHECK (id = 1),
      user_id TEXT NOT NULL,
      created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
      updated_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,

      FOREIGN KEY (user_id)
        REFERENCES users(id)
        ON DELETE CASCADE
    );


    CREATE TABLE IF NOT EXISTS sk_organization (
      id TEXT PRIMARY KEY NOT NULL,
      name TEXT NOT NULL,
      public_signing_key TEXT NOT NULL,
      private_signing_key TEXT,
      official_data_key TEXT NOT NULL,
      certificate_payload TEXT NOT NULL,
      certificate_signature TEXT NOT NULL,
      bootstrap_id TEXT,
      established_by TEXT,
      created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
      updated_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,

      FOREIGN KEY (established_by)
        REFERENCES users(id)
        ON DELETE SET NULL
    );

    CREATE TABLE IF NOT EXISTS used_official_invites (
      invite_id TEXT PRIMARY KEY NOT NULL,
      user_id TEXT NOT NULL,
      used_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,

      FOREIGN KEY (user_id)
        REFERENCES users(id)
        ON DELETE CASCADE
    );

    CREATE TABLE IF NOT EXISTS projects (
      id TEXT PRIMARY KEY NOT NULL,
      title TEXT NOT NULL,
      description TEXT,
      status TEXT NOT NULL DEFAULT 'Planned',
      budget REAL NOT NULL DEFAULT 0,
      start_date TEXT,
      end_date TEXT,
      created_by TEXT,
      is_archived INTEGER NOT NULL DEFAULT 0,
      archived_at TEXT,
      is_youth_visible INTEGER NOT NULL DEFAULT 0,
      created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
      updated_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,

      FOREIGN KEY (created_by)
        REFERENCES users(id)
        ON DELETE SET NULL
    );

    CREATE TABLE IF NOT EXISTS project_expenses (
      id TEXT PRIMARY KEY NOT NULL,
      project_id TEXT NOT NULL,
      title TEXT NOT NULL,
      amount REAL NOT NULL DEFAULT 0,
      expense_date TEXT,
      notes TEXT,
      created_by TEXT,
      created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
      updated_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,

      FOREIGN KEY (project_id)
        REFERENCES projects(id)
        ON DELETE CASCADE,

      FOREIGN KEY (created_by)
        REFERENCES users(id)
        ON DELETE SET NULL
    );



    CREATE TABLE IF NOT EXISTS budget_categories (
      id TEXT PRIMARY KEY NOT NULL,
      name TEXT NOT NULL COLLATE NOCASE UNIQUE,
      description TEXT,
      created_by TEXT,
      created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
      updated_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,

      FOREIGN KEY (created_by)
        REFERENCES users(id)
        ON DELETE SET NULL
    );

    CREATE TABLE IF NOT EXISTS budget_allocations (
      id TEXT PRIMARY KEY NOT NULL,
      category_id TEXT,
      project_id TEXT,
      title TEXT NOT NULL,
      amount REAL NOT NULL DEFAULT 0,
      fiscal_year INTEGER,
      notes TEXT,
      is_youth_visible INTEGER NOT NULL DEFAULT 0,
      created_by TEXT,
      created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
      updated_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,

      FOREIGN KEY (category_id)
        REFERENCES budget_categories(id)
        ON DELETE SET NULL,

      FOREIGN KEY (project_id)
        REFERENCES projects(id)
        ON DELETE SET NULL,

      FOREIGN KEY (created_by)
        REFERENCES users(id)
        ON DELETE SET NULL
    );

    CREATE TABLE IF NOT EXISTS expenses (
      id TEXT PRIMARY KEY NOT NULL,
      title TEXT NOT NULL,
      amount REAL NOT NULL DEFAULT 0,
      expense_date TEXT,
      category_id TEXT,
      project_id TEXT,
      notes TEXT,
      receipt_uri TEXT,
      is_youth_visible INTEGER NOT NULL DEFAULT 0,
      created_by TEXT,
      created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
      updated_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,

      FOREIGN KEY (category_id)
        REFERENCES budget_categories(id)
        ON DELETE SET NULL,

      FOREIGN KEY (project_id)
        REFERENCES projects(id)
        ON DELETE SET NULL,

      FOREIGN KEY (created_by)
        REFERENCES users(id)
        ON DELETE SET NULL
    );

    CREATE TABLE IF NOT EXISTS youth (
      id TEXT PRIMARY KEY NOT NULL,
      profile_id TEXT,
      full_name TEXT NOT NULL,
      birthday TEXT,
      sex TEXT,
      purok_sitio TEXT,
      contact_number TEXT,
      education TEXT,
      employment_status TEXT,
      youth_classification TEXT,
      created_by TEXT,
      created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
      updated_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,

      FOREIGN KEY (created_by)
        REFERENCES users(id)
        ON DELETE SET NULL
    );

    CREATE INDEX IF NOT EXISTS idx_youth_full_name
      ON youth(full_name COLLATE NOCASE);

    CREATE INDEX IF NOT EXISTS idx_youth_purok_sitio
      ON youth(purok_sitio COLLATE NOCASE);

    CREATE TABLE IF NOT EXISTS meetings (
      id TEXT PRIMARY KEY NOT NULL,
      title TEXT NOT NULL,
      meeting_date TEXT NOT NULL,
      meeting_time TEXT,
      location TEXT,
      status TEXT NOT NULL DEFAULT 'Scheduled',
      agenda TEXT,
      minutes TEXT,
      created_by TEXT,
      created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
      updated_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,

      FOREIGN KEY (created_by)
        REFERENCES users(id)
        ON DELETE SET NULL
    );

    CREATE INDEX IF NOT EXISTS idx_meetings_date
      ON meetings(meeting_date);

    CREATE INDEX IF NOT EXISTS idx_meetings_status
      ON meetings(status COLLATE NOCASE);

    CREATE TABLE IF NOT EXISTS meeting_attendance (
      id TEXT PRIMARY KEY NOT NULL,
      meeting_id TEXT NOT NULL,
      youth_id TEXT,
      attendee_name TEXT NOT NULL,
      attendee_role TEXT,
      attendance_status TEXT NOT NULL DEFAULT 'Present',
      created_by TEXT,
      created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
      updated_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,

      FOREIGN KEY (meeting_id)
        REFERENCES meetings(id)
        ON DELETE CASCADE,

      FOREIGN KEY (youth_id)
        REFERENCES youth(id)
        ON DELETE SET NULL,

      FOREIGN KEY (created_by)
        REFERENCES users(id)
        ON DELETE SET NULL
    );

    CREATE INDEX IF NOT EXISTS idx_meeting_attendance_meeting
      ON meeting_attendance(meeting_id);

    CREATE TABLE IF NOT EXISTS meeting_resolutions (
      id TEXT PRIMARY KEY NOT NULL,
      meeting_id TEXT NOT NULL,
      resolution_number TEXT,
      title TEXT NOT NULL,
      details TEXT,
      status TEXT NOT NULL DEFAULT 'Draft',
      created_by TEXT,
      created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
      updated_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,

      FOREIGN KEY (meeting_id)
        REFERENCES meetings(id)
        ON DELETE CASCADE,

      FOREIGN KEY (youth_id)
        REFERENCES youth(id)
        ON DELETE SET NULL,

      FOREIGN KEY (created_by)
        REFERENCES users(id)
        ON DELETE SET NULL
    );

    CREATE INDEX IF NOT EXISTS idx_meeting_resolutions_meeting
      ON meeting_resolutions(meeting_id);

    CREATE TABLE IF NOT EXISTS activities (
      id TEXT PRIMARY KEY NOT NULL,
      title TEXT NOT NULL,
      activity_date TEXT NOT NULL,
      activity_time TEXT,
      location TEXT,
      status TEXT NOT NULL DEFAULT 'Planned',
      description TEXT,
      created_by TEXT,
      created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
      updated_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,

      FOREIGN KEY (created_by)
        REFERENCES users(id)
        ON DELETE SET NULL
    );

    CREATE INDEX IF NOT EXISTS idx_activities_date
      ON activities(activity_date);

    CREATE INDEX IF NOT EXISTS idx_activities_status
      ON activities(status COLLATE NOCASE);

    CREATE TABLE IF NOT EXISTS activity_participants (
      id TEXT PRIMARY KEY NOT NULL,
      activity_id TEXT NOT NULL,
      youth_id TEXT,
      participant_name TEXT NOT NULL,
      contact_number TEXT,
      notes TEXT,
      attendance_status TEXT NOT NULL DEFAULT 'Not Marked',
      created_by TEXT,
      created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
      updated_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,

      FOREIGN KEY (activity_id)
        REFERENCES activities(id)
        ON DELETE CASCADE,

      FOREIGN KEY (youth_id)
        REFERENCES youth(id)
        ON DELETE SET NULL,

      FOREIGN KEY (created_by)
        REFERENCES users(id)
        ON DELETE SET NULL
    );

    CREATE INDEX IF NOT EXISTS idx_activity_participants_activity
      ON activity_participants(activity_id);

    CREATE INDEX IF NOT EXISTS idx_activity_participants_name
      ON activity_participants(participant_name COLLATE NOCASE);

    CREATE TABLE IF NOT EXISTS inventory_items (
      id TEXT PRIMARY KEY NOT NULL,
      item_name TEXT NOT NULL,
      description TEXT,
      quantity INTEGER NOT NULL DEFAULT 1,
      available_quantity INTEGER NOT NULL DEFAULT 1,
      condition TEXT NOT NULL DEFAULT 'Good',
      status TEXT NOT NULL DEFAULT 'Available',
      notes TEXT,
      created_by TEXT,
      created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
      updated_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,

      FOREIGN KEY (created_by)
        REFERENCES users(id)
        ON DELETE SET NULL
    );

    CREATE INDEX IF NOT EXISTS idx_inventory_item_name
      ON inventory_items(item_name COLLATE NOCASE);

    CREATE INDEX IF NOT EXISTS idx_inventory_status
      ON inventory_items(status COLLATE NOCASE);

    CREATE INDEX IF NOT EXISTS idx_inventory_condition
      ON inventory_items(condition COLLATE NOCASE);

    CREATE TABLE IF NOT EXISTS inventory_history (
      id TEXT PRIMARY KEY NOT NULL,
      item_id TEXT NOT NULL,
      action_type TEXT NOT NULL,
      quantity INTEGER,
      borrower_name TEXT,
      contact_number TEXT,
      due_date TEXT,
      related_history_id TEXT,
      details TEXT,
      returned_quantity INTEGER NOT NULL DEFAULT 0,
      created_by TEXT,
      created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,

      FOREIGN KEY (item_id)
        REFERENCES inventory_items(id)
        ON DELETE CASCADE,

      FOREIGN KEY (related_history_id)
        REFERENCES inventory_history(id)
        ON DELETE SET NULL,

      FOREIGN KEY (created_by)
        REFERENCES users(id)
        ON DELETE SET NULL
    );

    CREATE INDEX IF NOT EXISTS idx_inventory_history_item
      ON inventory_history(item_id);

    CREATE INDEX IF NOT EXISTS idx_inventory_history_action
      ON inventory_history(action_type COLLATE NOCASE);

    CREATE TABLE IF NOT EXISTS documents (
      id TEXT PRIMARY KEY NOT NULL,
      document_type TEXT NOT NULL DEFAULT 'Other SK Document',
      document_number TEXT,
      document_date TEXT NOT NULL,
      title TEXT NOT NULL,
      description TEXT,
      status TEXT NOT NULL DEFAULT 'Draft',
      related_project_id TEXT,
      attachment_uri TEXT,
      attachment_name TEXT,
      attachment_mime_type TEXT,
      created_by TEXT,
      created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
      updated_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,

      FOREIGN KEY (related_project_id)
        REFERENCES projects(id)
        ON DELETE SET NULL,

      FOREIGN KEY (created_by)
        REFERENCES users(id)
        ON DELETE SET NULL
    );

    CREATE INDEX IF NOT EXISTS idx_documents_date
      ON documents(document_date);

    CREATE INDEX IF NOT EXISTS idx_documents_type
      ON documents(document_type COLLATE NOCASE);

    CREATE INDEX IF NOT EXISTS idx_documents_status
      ON documents(status COLLATE NOCASE);

    CREATE INDEX IF NOT EXISTS idx_documents_project
      ON documents(related_project_id);

    CREATE TABLE IF NOT EXISTS app_activity (
      id TEXT PRIMARY KEY NOT NULL,
      action_type TEXT NOT NULL,
      entity_type TEXT NOT NULL,
      entity_id TEXT,
      subject TEXT NOT NULL,
      detail TEXT,
      user_id TEXT,
      created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,

      FOREIGN KEY (user_id)
        REFERENCES users(id)
        ON DELETE SET NULL
    );

    CREATE TABLE IF NOT EXISTS data_transfer_history (
      id TEXT PRIMARY KEY NOT NULL,
      transfer_type TEXT NOT NULL,
      direction TEXT NOT NULL,
      channel TEXT NOT NULL,
      status TEXT NOT NULL,
      audience TEXT,
      package_id TEXT,
      record_count INTEGER NOT NULL DEFAULT 0,
      detail TEXT,
      user_id TEXT,
      created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,

      FOREIGN KEY (user_id)
        REFERENCES users(id)
        ON DELETE SET NULL
    );

    CREATE INDEX IF NOT EXISTS idx_data_transfer_history_created
      ON data_transfer_history(created_at DESC);

    CREATE INDEX IF NOT EXISTS idx_data_transfer_history_direction
      ON data_transfer_history(direction COLLATE NOCASE);

    CREATE INDEX IF NOT EXISTS idx_data_transfer_history_type
      ON data_transfer_history(transfer_type COLLATE NOCASE);

    CREATE TABLE IF NOT EXISTS project_participants (
      id TEXT PRIMARY KEY NOT NULL,
      project_id TEXT NOT NULL,
      youth_id TEXT,
      participant_name TEXT NOT NULL,
      participant_role TEXT,
      contact_number TEXT,
      notes TEXT,
      created_by TEXT,
      created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
      updated_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,

      FOREIGN KEY (project_id)
        REFERENCES projects(id)
        ON DELETE CASCADE,

      FOREIGN KEY (created_by)
        REFERENCES users(id)
        ON DELETE SET NULL
    );
  `);

  await addColumnIfMissing(
    db,
    "projects",
    "is_archived",
    "is_archived INTEGER NOT NULL DEFAULT 0"
  );

  await addColumnIfMissing(
    db,
    "projects",
    "archived_at",
    "archived_at TEXT"
  );

  // Youth/public visibility fields. Existing records default to private.
  await addColumnIfMissing(
    db,
    "projects",
    "is_youth_visible",
    "is_youth_visible INTEGER NOT NULL DEFAULT 0"
  );

  await addColumnIfMissing(
    db,
    "budget_allocations",
    "is_youth_visible",
    "is_youth_visible INTEGER NOT NULL DEFAULT 0"
  );

  await addColumnIfMissing(
    db,
    "expenses",
    "is_youth_visible",
    "is_youth_visible INTEGER NOT NULL DEFAULT 0"
  );

  await addColumnIfMissing(
    db,
    "users",
    "authorization_level",
    "authorization_level TEXT NOT NULL DEFAULT 'unverified'"
  );

  await addColumnIfMissing(
    db,
    "users",
    "authorized_by",
    "authorized_by TEXT"
  );

  await addColumnIfMissing(
    db,
    "users",
    "authorized_at",
    "authorized_at TEXT"
  );

  await db.execAsync(`
    UPDATE users
    SET authorization_level = 'public'
    WHERE role = 'SK Youth Member'
      AND authorization_level <> 'verified_official';
  `);

  await addColumnIfMissing(
    db,
    "documents",
    "attachment_name",
    "attachment_name TEXT"
  );

  await addColumnIfMissing(
    db,
    "documents",
    "attachment_mime_type",
    "attachment_mime_type TEXT"
  );

  await addColumnIfMissing(
    db,
    "inventory_items",
    "available_quantity",
    "available_quantity INTEGER"
  );

  await db.execAsync(`
    UPDATE inventory_items
    SET available_quantity = quantity
    WHERE available_quantity IS NULL;
  `);

  await addColumnIfMissing(
    db,
    "youth",
    "profile_id",
    "profile_id TEXT"
  );

  await db.execAsync(`
    CREATE UNIQUE INDEX IF NOT EXISTS idx_youth_profile_id
      ON youth(profile_id)
      WHERE profile_id IS NOT NULL AND profile_id <> '';
  `);

  await addColumnIfMissing(
    db,
    "meeting_attendance",
    "youth_id",
    "youth_id TEXT"
  );

  await db.execAsync(`
    CREATE UNIQUE INDEX IF NOT EXISTS idx_meeting_attendance_youth
      ON meeting_attendance(meeting_id, youth_id)
      WHERE youth_id IS NOT NULL AND youth_id <> '';
  `);

  await addColumnIfMissing(
    db,
    "expenses",
    "activity_id",
    "activity_id TEXT"
  );

  await db.execAsync(`
    CREATE INDEX IF NOT EXISTS idx_expenses_activity
      ON expenses(activity_id);
  `);



  // Phase 5 Finance becomes the source of truth for expenses.
  // Existing Phase 4 project expenses are migrated once by reusing their IDs.
  await db.execAsync(`
    INSERT OR IGNORE INTO expenses (
      id,
      title,
      amount,
      expense_date,
      category_id,
      project_id,
      notes,
      receipt_uri,
      created_by,
      created_at,
      updated_at
    )
    SELECT
      id,
      title,
      amount,
      expense_date,
      NULL,
      project_id,
      notes,
      NULL,
      created_by,
      created_at,
      updated_at
    FROM project_expenses;
  `);

  // Give the new Recent Activity feed useful history immediately.
  // INSERT OR IGNORE prevents duplicate backfill entries.
  await db.execAsync(`
    INSERT OR IGNORE INTO app_activity (
      id,
      action_type,
      entity_type,
      entity_id,
      subject,
      detail,
      user_id,
      created_at
    )
    SELECT
      'legacy-project-created-' || id,
      'project_created',
      'project',
      id,
      title,
      'Project created',
      created_by,
      created_at
    FROM projects;

    INSERT OR IGNORE INTO app_activity (
      id,
      action_type,
      entity_type,
      entity_id,
      subject,
      detail,
      user_id,
      created_at
    )
    SELECT
      'legacy-expense-created-' || id,
      'project_expense_added',
      'project_expense',
      id,
      title,
      'Project expense recorded',
      created_by,
      created_at
    FROM project_expenses;

    INSERT OR IGNORE INTO app_activity (
      id, action_type, entity_type, entity_id, subject, detail, user_id, created_at
    )
    SELECT
      'legacy-participant-added-' || id,
      'project_participant_added',
      'project_participant',
      id,
      participant_name,
      'Added to project participants',
      created_by,
      created_at
    FROM project_participants;
  `);

  await db.runAsync(
    `
      INSERT INTO app_metadata (
        key,
        value
      )
      VALUES (?, ?)

      ON CONFLICT(key)
      DO UPDATE SET
        value = excluded.value,
        updated_at = CURRENT_TIMESTAMP
    `,
    "schema_version",
    "22"
  );

  console.log(
    "SK Local database initialized successfully."
  );

  return db;
}

export async function initializeDatabase() {
  if (!initializationPromise) {
    initializationPromise =
      runDatabaseInitialization().catch(
        (error) => {
          initializationPromise = null;
          throw error;
        }
      );
  }

  return initializationPromise;
}
