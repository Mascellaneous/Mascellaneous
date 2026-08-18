import {
  index,
  int,
  mysqlEnum,
  mysqlTable,
  text,
  timestamp,
  varchar,
} from "drizzle-orm/mysql-core";

/** Core user table backing the Manus OAuth flow. */
export const users = mysqlTable("users", {
  id: int("id").autoincrement().primaryKey(),
  openId: varchar("openId", { length: 64 }).notNull().unique(),
  name: text("name"),
  email: varchar("email", { length: 320 }),
  loginMethod: varchar("loginMethod", { length: 64 }),
  role: mysqlEnum("role", ["user", "admin"]).default("user").notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
  lastSignedIn: timestamp("lastSignedIn").defaultNow().notNull(),
});

export const documents = mysqlTable(
  "documents",
  {
    id: int("id").autoincrement().primaryKey(),
    uploadedBy: int("uploadedBy").notNull().references(() => users.id),
    fileName: varchar("fileName", { length: 512 }).notNull(),
    storageKey: varchar("storageKey", { length: 1024 }).notNull(),
    storageUrl: text("storageUrl").notNull(),
    mimeType: varchar("mimeType", { length: 255 }).notNull(),
    fileSize: int("fileSize").notNull(),
    status: mysqlEnum("status", ["processing", "ready", "error"]).default("processing").notNull(),
    chunkCount: int("chunkCount").default(0).notNull(),
    errorMessage: text("errorMessage"),
    createdAt: timestamp("createdAt").defaultNow().notNull(),
    updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
  },
  (table) => [index("documents_uploaded_by_idx").on(table.uploadedBy), index("documents_status_idx").on(table.status)],
);

export const documentChunks = mysqlTable(
  "document_chunks",
  {
    id: int("id").autoincrement().primaryKey(),
    documentId: int("documentId").notNull().references(() => documents.id, { onDelete: "cascade" }),
    chunkIndex: int("chunkIndex").notNull(),
    content: text("content").notNull(),
    charCount: int("charCount").notNull(),
    createdAt: timestamp("createdAt").defaultNow().notNull(),
  },
  (table) => [index("document_chunks_document_idx").on(table.documentId), index("document_chunks_position_idx").on(table.documentId, table.chunkIndex)],
);

export const chatSessions = mysqlTable(
  "chat_sessions",
  {
    id: int("id").autoincrement().primaryKey(),
    userId: int("userId").notNull().references(() => users.id, { onDelete: "cascade" }),
    title: varchar("title", { length: 180 }).notNull(),
    createdAt: timestamp("createdAt").defaultNow().notNull(),
    updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
  },
  (table) => [index("chat_sessions_user_updated_idx").on(table.userId, table.updatedAt)],
);

export const chatMessages = mysqlTable(
  "chat_messages",
  {
    id: int("id").autoincrement().primaryKey(),
    sessionId: int("sessionId").notNull().references(() => chatSessions.id, { onDelete: "cascade" }),
    role: mysqlEnum("role", ["user", "assistant"]).notNull(),
    content: text("content").notNull(),
    sources: text("sources"),
    createdAt: timestamp("createdAt").defaultNow().notNull(),
  },
  (table) => [index("chat_messages_session_created_idx").on(table.sessionId, table.createdAt)],
);

export type User = typeof users.$inferSelect;
export type InsertUser = typeof users.$inferInsert;
export type Document = typeof documents.$inferSelect;
export type DocumentChunk = typeof documentChunks.$inferSelect;
export type ChatSession = typeof chatSessions.$inferSelect;
export type ChatMessage = typeof chatMessages.$inferSelect;
