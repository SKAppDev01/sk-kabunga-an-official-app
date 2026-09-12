import * as Crypto from "expo-crypto";

import {
  getDatabase,
  initializeDatabase,
} from "../database/database";
import {
  requireOfficialAccess,
} from "./access";
import {
  recordAppActivity,
} from "./app-activity";

export type InventoryCondition =
  | "Excellent"
  | "Good"
  | "Fair"
  | "Needs Repair"
  | "Damaged";

export type InventoryStatus =
  | "Available"
  | "Borrowed"
  | "Unavailable";

export type InventoryItem = {
  id: string;
  itemName: string;
  description: string | null;
  quantity: number;
  availableQuantity: number;
  condition: InventoryCondition;
  status: InventoryStatus;
  notes: string | null;
  createdBy: string | null;
  createdAt: string;
  updatedAt: string;
};

type InventoryItemRow = {
  id: string;
  item_name: string;
  description: string | null;
  quantity: number;
  available_quantity: number | null;
  condition: string;
  status: string;
  notes: string | null;
  created_by: string | null;
  created_at: string;
  updated_at: string;
};


export type CreateInventoryItemInput = {
  itemName: string;
  description?: string;
  quantity: number;
  condition?: InventoryCondition;
  notes?: string;
  createdBy?: string;
};

function normalizeCondition(
  value: string
): InventoryCondition {
  switch (value) {
    case "Excellent":
    case "Fair":
    case "Needs Repair":
    case "Damaged":
      return value;
    default:
      return "Good";
  }
}

function normalizeStatus(
  value: string
): InventoryStatus {
  switch (value) {
    case "Borrowed":
    case "Unavailable":
      return value;
    default:
      return "Available";
  }
}

function mapInventoryRow(
  row: InventoryItemRow
): InventoryItem {
  return {
    id: row.id,
    itemName: row.item_name,
    description: row.description,
    quantity: Number(row.quantity) || 0,
    availableQuantity:
      row.available_quantity == null
        ? Number(row.quantity) || 0
        : Number(row.available_quantity) || 0,
    condition:
      normalizeCondition(row.condition),
    status:
      normalizeStatus(row.status),
    notes: row.notes,
    createdBy: row.created_by,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}

export async function getInventoryItems() {
  await requireOfficialAccess();
  await initializeDatabase();
  const db = await getDatabase();

  const rows =
    await db.getAllAsync<InventoryItemRow>(
      `
        SELECT
          id,
          item_name,
          description,
          quantity,
          available_quantity,
          condition,
          status,
          notes,
          created_by,
          created_at,
          updated_at
        FROM inventory_items
        ORDER BY
          item_name COLLATE NOCASE ASC,
          created_at DESC
      `
    );

  return rows.map(
    mapInventoryRow
  );
}

export async function getInventoryItemById(
  itemId: string
) {
  await requireOfficialAccess();
  await initializeDatabase();
  const db = await getDatabase();

  const row =
    await db.getFirstAsync<InventoryItemRow>(
      `
        SELECT
          id,
          item_name,
          description,
          quantity,
          available_quantity,
          condition,
          status,
          notes,
          created_by,
          created_at,
          updated_at
        FROM inventory_items
        WHERE id = ?
        LIMIT 1
      `,
      itemId
    );

  return row
    ? mapInventoryRow(row)
    : null;
}

export async function createInventoryItem({
  itemName,
  description,
  quantity,
  condition = "Good",
  notes,
  createdBy,
}: CreateInventoryItemInput) {
  await requireOfficialAccess();
  await initializeDatabase();
  const db = await getDatabase();

  const cleanName =
    itemName.trim();

  if (!cleanName) {
    throw new Error(
      "ITEM_NAME_REQUIRED"
    );
  }

  if (
    !Number.isInteger(quantity) ||
    quantity < 1
  ) {
    throw new Error(
      "INVALID_QUANTITY"
    );
  }

  const id = Crypto.randomUUID();

  await db.runAsync(
    `
      INSERT INTO inventory_items (
        id,
        item_name,
        description,
        quantity,
        available_quantity,
        condition,
        status,
        notes,
        created_by
      )
      VALUES (?, ?, ?, ?, ?, ?, 'Available', ?, ?)
    `,
    id,
    cleanName,
    description?.trim() || null,
    quantity,
    quantity,
    condition,
    notes?.trim() || null,
    createdBy?.trim() || null
  );

  await recordAppActivity({
    actionType:
      "inventory_item_created",
    entityType: "inventory_item",
    entityId: id,
    subject: cleanName,
    detail:
      `Quantity: ${quantity} • ${condition}`,
    userId:
      createdBy?.trim() || null,
  });

  return id;
}

export type InventoryHistoryAction =
  | "quantity_update"
  | "condition_update"
  | "borrow"
  | "return";

export type InventoryHistoryRecord = {
  id: string;
  itemId: string;
  actionType: InventoryHistoryAction;
  quantity: number | null;
  borrowerName: string | null;
  contactNumber: string | null;
  dueDate: string | null;
  relatedHistoryId: string | null;
  details: string | null;
  returnedQuantity: number;
  createdBy: string | null;
  createdAt: string;
};

type InventoryHistoryRow = {
  id: string;
  item_id: string;
  action_type: string;
  quantity: number | null;
  borrower_name: string | null;
  contact_number: string | null;
  due_date: string | null;
  related_history_id: string | null;
  details: string | null;
  returned_quantity: number;
  created_by: string | null;
  created_at: string;
};

export type ActiveBorrowRecord = {
  id: string;
  borrowerName: string;
  contactNumber: string | null;
  dueDate: string | null;
  borrowedQuantity: number;
  returnedQuantity: number;
  remainingQuantity: number;
  notes: string | null;
  createdAt: string;
};

function normalizeHistoryAction(
  value: string
): InventoryHistoryAction {
  switch (value) {
    case "condition_update":
    case "borrow":
    case "return":
      return value;
    default:
      return "quantity_update";
  }
}

function mapHistoryRow(
  row: InventoryHistoryRow
): InventoryHistoryRecord {
  return {
    id: row.id,
    itemId: row.item_id,
    actionType:
      normalizeHistoryAction(
        row.action_type
      ),
    quantity:
      row.quantity == null
        ? null
        : Number(row.quantity),
    borrowerName:
      row.borrower_name,
    contactNumber:
      row.contact_number,
    dueDate: row.due_date,
    relatedHistoryId:
      row.related_history_id,
    details: row.details,
    returnedQuantity:
      Number(
        row.returned_quantity
      ) || 0,
    createdBy: row.created_by,
    createdAt: row.created_at,
  };
}

function validateOptionalDate(
  value?: string
) {
  const clean = value?.trim();

  if (!clean) {
    return null;
  }

  const match = clean.match(
    /^(\d{4})-(\d{2})-(\d{2})$/
  );

  if (!match) {
    throw new Error(
      "INVALID_DATE"
    );
  }

  const year = Number(match[1]);
  const month = Number(match[2]);
  const day = Number(match[3]);

  const date = new Date(
    Date.UTC(
      year,
      month - 1,
      day
    )
  );

  if (
    date.getUTCFullYear() !== year ||
    date.getUTCMonth() !== month - 1 ||
    date.getUTCDate() !== day
  ) {
    throw new Error(
      "INVALID_DATE"
    );
  }

  return clean;
}

export async function updateInventoryQuantity({
  itemId,
  quantity,
  createdBy,
}: {
  itemId: string;
  quantity: number;
  createdBy?: string;
}) {
  await requireOfficialAccess();
  await initializeDatabase();
  const db = await getDatabase();

  if (
    !Number.isInteger(quantity) ||
    quantity < 1
  ) {
    throw new Error(
      "INVALID_QUANTITY"
    );
  }

  const item =
    await getInventoryItemById(
      itemId
    );

  if (!item) {
    throw new Error(
      "ITEM_NOT_FOUND"
    );
  }

  const borrowedQuantity =
    Math.max(
      0,
      item.quantity -
        item.availableQuantity
    );

  if (
    quantity < borrowedQuantity
  ) {
    throw new Error(
      "QUANTITY_BELOW_BORROWED"
    );
  }

  const newAvailable =
    quantity -
    borrowedQuantity;

  const nextStatus =
    borrowedQuantity > 0
      ? "Borrowed"
      : "Available";

  const historyId =
    Crypto.randomUUID();

  await db.withTransactionAsync(
    async () => {
      await db.runAsync(
        `
          UPDATE inventory_items
          SET
            quantity = ?,
            available_quantity = ?,
            status = ?,
            updated_at = CURRENT_TIMESTAMP
          WHERE id = ?
        `,
        quantity,
        newAvailable,
        nextStatus,
        itemId
      );

      await db.runAsync(
        `
          INSERT INTO inventory_history (
            id,
            item_id,
            action_type,
            quantity,
            details,
            created_by
          )
          VALUES (?, ?, 'quantity_update', ?, ?, ?)
        `,
        historyId,
        itemId,
        quantity,
        `Quantity changed from ${item.quantity} to ${quantity}`,
        createdBy?.trim() || null
      );
    }
  );

  await recordAppActivity({
    actionType:
      "inventory_quantity_updated",
    entityType: "inventory_item",
    entityId: itemId,
    subject: item.itemName,
    detail:
      `Quantity: ${item.quantity} → ${quantity}`,
    userId:
      createdBy?.trim() || null,
  });
}

export async function updateInventoryCondition({
  itemId,
  condition,
  notes,
  createdBy,
}: {
  itemId: string;
  condition: InventoryCondition;
  notes?: string;
  createdBy?: string;
}) {
  await requireOfficialAccess();
  await initializeDatabase();
  const db = await getDatabase();

  const item =
    await getInventoryItemById(
      itemId
    );

  if (!item) {
    throw new Error(
      "ITEM_NOT_FOUND"
    );
  }

  const historyId =
    Crypto.randomUUID();

  const detailParts = [
    `Condition changed from ${item.condition} to ${condition}`,
  ];

  if (notes?.trim()) {
    detailParts.push(
      notes.trim()
    );
  }

  await db.withTransactionAsync(
    async () => {
      await db.runAsync(
        `
          UPDATE inventory_items
          SET
            condition = ?,
            updated_at = CURRENT_TIMESTAMP
          WHERE id = ?
        `,
        condition,
        itemId
      );

      await db.runAsync(
        `
          INSERT INTO inventory_history (
            id,
            item_id,
            action_type,
            details,
            created_by
          )
          VALUES (?, ?, 'condition_update', ?, ?)
        `,
        historyId,
        itemId,
        detailParts.join(" • "),
        createdBy?.trim() || null
      );
    }
  );

  await recordAppActivity({
    actionType:
      "inventory_condition_updated",
    entityType: "inventory_item",
    entityId: itemId,
    subject: item.itemName,
    detail:
      `${item.condition} → ${condition}`,
    userId:
      createdBy?.trim() || null,
  });
}

export async function borrowInventoryItem({
  itemId,
  borrowerName,
  contactNumber,
  quantity,
  dueDate,
  notes,
  createdBy,
}: {
  itemId: string;
  borrowerName: string;
  contactNumber?: string;
  quantity: number;
  dueDate?: string;
  notes?: string;
  createdBy?: string;
}) {
  await requireOfficialAccess();
  await initializeDatabase();
  const db = await getDatabase();

  const cleanBorrower =
    borrowerName.trim();

  if (!cleanBorrower) {
    throw new Error(
      "BORROWER_REQUIRED"
    );
  }

  if (
    !Number.isInteger(quantity) ||
    quantity < 1
  ) {
    throw new Error(
      "INVALID_QUANTITY"
    );
  }

  const item =
    await getInventoryItemById(
      itemId
    );

  if (!item) {
    throw new Error(
      "ITEM_NOT_FOUND"
    );
  }

  if (
    quantity >
    item.availableQuantity
  ) {
    throw new Error(
      "INSUFFICIENT_AVAILABLE_QUANTITY"
    );
  }

  const cleanDueDate =
    validateOptionalDate(
      dueDate
    );

  const newAvailable =
    item.availableQuantity -
    quantity;

  const historyId =
    Crypto.randomUUID();

  await db.withTransactionAsync(
    async () => {
      await db.runAsync(
        `
          UPDATE inventory_items
          SET
            available_quantity = ?,
            status = 'Borrowed',
            updated_at = CURRENT_TIMESTAMP
          WHERE id = ?
        `,
        newAvailable,
        itemId
      );

      await db.runAsync(
        `
          INSERT INTO inventory_history (
            id,
            item_id,
            action_type,
            quantity,
            borrower_name,
            contact_number,
            due_date,
            details,
            returned_quantity,
            created_by
          )
          VALUES (
            ?, ?, 'borrow', ?, ?, ?, ?, ?, 0, ?
          )
        `,
        historyId,
        itemId,
        quantity,
        cleanBorrower,
        contactNumber?.trim() || null,
        cleanDueDate,
        notes?.trim() || null,
        createdBy?.trim() || null
      );
    }
  );

  await recordAppActivity({
    actionType:
      "inventory_item_borrowed",
    entityType: "inventory_item",
    entityId: itemId,
    subject: item.itemName,
    detail:
      `${quantity} borrowed by ${cleanBorrower}`,
    userId:
      createdBy?.trim() || null,
  });

  return historyId;
}

export async function getActiveInventoryBorrows(
  itemId: string
): Promise<ActiveBorrowRecord[]> {
  await requireOfficialAccess();
  await initializeDatabase();
  const db = await getDatabase();

  const rows =
    await db.getAllAsync<InventoryHistoryRow>(
      `
        SELECT
          id,
          item_id,
          action_type,
          quantity,
          borrower_name,
          contact_number,
          due_date,
          related_history_id,
          details,
          returned_quantity,
          created_by,
          created_at
        FROM inventory_history
        WHERE item_id = ?
          AND action_type = 'borrow'
          AND COALESCE(returned_quantity, 0)
              < COALESCE(quantity, 0)
        ORDER BY created_at ASC
      `,
      itemId
    );

  return rows.map((row) => {
    const borrowed =
      Number(row.quantity) || 0;

    const returned =
      Number(
        row.returned_quantity
      ) || 0;

    return {
      id: row.id,
      borrowerName:
        row.borrower_name ||
        "Borrower",
      contactNumber:
        row.contact_number,
      dueDate: row.due_date,
      borrowedQuantity:
        borrowed,
      returnedQuantity:
        returned,
      remainingQuantity:
        Math.max(
          0,
          borrowed - returned
        ),
      notes: row.details,
      createdAt:
        row.created_at,
    };
  });
}

export async function returnInventoryItem({
  itemId,
  borrowHistoryId,
  quantity,
  notes,
  createdBy,
}: {
  itemId: string;
  borrowHistoryId: string;
  quantity: number;
  notes?: string;
  createdBy?: string;
}) {
  await requireOfficialAccess();
  await initializeDatabase();
  const db = await getDatabase();

  if (
    !Number.isInteger(quantity) ||
    quantity < 1
  ) {
    throw new Error(
      "INVALID_QUANTITY"
    );
  }

  const item =
    await getInventoryItemById(
      itemId
    );

  if (!item) {
    throw new Error(
      "ITEM_NOT_FOUND"
    );
  }

  const borrow =
    await db.getFirstAsync<InventoryHistoryRow>(
      `
        SELECT
          id,
          item_id,
          action_type,
          quantity,
          borrower_name,
          contact_number,
          due_date,
          related_history_id,
          details,
          returned_quantity,
          created_by,
          created_at
        FROM inventory_history
        WHERE id = ?
          AND item_id = ?
          AND action_type = 'borrow'
        LIMIT 1
      `,
      borrowHistoryId,
      itemId
    );

  if (!borrow) {
    throw new Error(
      "BORROW_RECORD_NOT_FOUND"
    );
  }

  const borrowedQuantity =
    Number(borrow.quantity) || 0;

  const returnedQuantity =
    Number(
      borrow.returned_quantity
    ) || 0;

  const remaining =
    borrowedQuantity -
    returnedQuantity;

  if (quantity > remaining) {
    throw new Error(
      "RETURN_EXCEEDS_OUTSTANDING"
    );
  }

  const nextReturned =
    returnedQuantity +
    quantity;

  const nextAvailable =
    Math.min(
      item.quantity,
      item.availableQuantity +
        quantity
    );

  const nextStatus =
    nextAvailable >=
    item.quantity
      ? "Available"
      : "Borrowed";

  const historyId =
    Crypto.randomUUID();

  await db.withTransactionAsync(
    async () => {
      await db.runAsync(
        `
          UPDATE inventory_history
          SET returned_quantity = ?
          WHERE id = ?
        `,
        nextReturned,
        borrowHistoryId
      );

      await db.runAsync(
        `
          UPDATE inventory_items
          SET
            available_quantity = ?,
            status = ?,
            updated_at = CURRENT_TIMESTAMP
          WHERE id = ?
        `,
        nextAvailable,
        nextStatus,
        itemId
      );

      await db.runAsync(
        `
          INSERT INTO inventory_history (
            id,
            item_id,
            action_type,
            quantity,
            borrower_name,
            contact_number,
            related_history_id,
            details,
            created_by
          )
          VALUES (
            ?, ?, 'return', ?, ?, ?, ?, ?, ?
          )
        `,
        historyId,
        itemId,
        quantity,
        borrow.borrower_name,
        borrow.contact_number,
        borrowHistoryId,
        notes?.trim() || null,
        createdBy?.trim() || null
      );
    }
  );

  await recordAppActivity({
    actionType:
      "inventory_item_returned",
    entityType: "inventory_item",
    entityId: itemId,
    subject: item.itemName,
    detail:
      `${quantity} returned` +
      (borrow.borrower_name
        ? ` • ${borrow.borrower_name}`
        : ""),
    userId:
      createdBy?.trim() || null,
  });

  return historyId;
}

export async function getInventoryHistory(
  itemId: string
) {
  await requireOfficialAccess();
  await initializeDatabase();
  const db = await getDatabase();

  const rows =
    await db.getAllAsync<InventoryHistoryRow>(
      `
        SELECT
          id,
          item_id,
          action_type,
          quantity,
          borrower_name,
          contact_number,
          due_date,
          related_history_id,
          details,
          returned_quantity,
          created_by,
          created_at
        FROM inventory_history
        WHERE item_id = ?
        ORDER BY
          created_at DESC,
          rowid DESC
      `,
      itemId
    );

  return rows.map(
    mapHistoryRow
  );
}

