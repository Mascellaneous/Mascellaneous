import { desc, eq } from "drizzle-orm";
import { drizzle } from "drizzle-orm/mysql2";
import {
  chatMessages,
  chatSessions,
  documentChunks,
  documents,
  type InsertUser,
  users,
} from "../drizzle/schema";
import { ENV } from "./_core/env";

let _db: ReturnType<typeof drizzle> | null = null;

export async function getDb() {
  if (!_db && process.env.DATABASE_URL) {
    try {
      _db = drizzle(process.env.DATABASE_URL);
    } catch (error) {
      console.warn("[Database] Failed to connect:", error);
      _db = null;
    }
  }
  return _db;
}

function requireDb(db: Awaited<ReturnType<typeof getDb>>) {
  if (!db) throw new Error("資料庫暫時無法使用，請稍後再試。");
  return db;
}

export async function upsertUser(user: InsertUser): Promise<void> {
  if (!user.openId) throw new Error("User openId is required for upsert");
  const db = await getDb();
  if (!db) return;

  const values: InsertUser = { openId: user.openId };
  const updateSet: Record<string, unknown> = {};
  const textFields = ["name", "email", "loginMethod"] as const;
  textFields.forEach((field) => {
    if (user[field] !== undefined) {
      values[field] = user[field] ?? null;
      updateSet[field] = user[field] ?? null;
    }
  });
  if (user.lastSignedIn !== undefined) {
    values.lastSignedIn = user.lastSignedIn;
    updateSet.lastSignedIn = user.lastSignedIn;
  }
  if (user.role !== undefined) {
    values.role = user.role;
    updateSet.role = user.role;
  } else if (user.openId === ENV.ownerOpenId) {
    values.role = "admin";
    updateSet.role = "admin";
  }
  if (!values.lastSignedIn) values.lastSignedIn = new Date();
  if (Object.keys(updateSet).length === 0) updateSet.lastSignedIn = new Date();

  await db.insert(users).values(values).onDuplicateKeyUpdate({ set: updateSet });
}

export async function getUserByOpenId(openId: string) {
  const db = await getDb();
  if (!db) return undefined;
  const result = await db.select().from(users).where(eq(users.openId, openId)).limit(1);
  return result[0];
}

export async function listDocuments() {
  const db = requireDb(await getDb());
  return db.select().from(documents).orderBy(desc(documents.createdAt));
}

export async function createDocument(input: {
  uploadedBy: number;
  fileName: string;
  storageKey: string;
  storageUrl: string;
  mimeType: string;
  fileSize: number;
  chunkCount: number;
  status?: "processing" | "ready" | "error";
  errorMessage?: string | null;
}) {
  const db = requireDb(await getDb());
  const result = await db.insert(documents).values({ ...input, status: input.status ?? "processing" });
  return Number(result[0].insertId);
}

export async function createDocumentChunks(documentId: number, chunks: string[]) {
  const db = requireDb(await getDb());
  if (chunks.length === 0) return;
  await db.insert(documentChunks).values(
    chunks.map((content, chunkIndex) => ({
      documentId,
      chunkIndex,
      content,
      charCount: content.length,
    })),
  );
}

export async function updateDocumentProcessingState(input: {
  documentId: number;
  status: "ready" | "error";
  chunkCount?: number;
  errorMessage?: string | null;
}) {
  const db = requireDb(await getDb());
  await db
    .update(documents)
    .set({
      status: input.status,
      ...(input.chunkCount === undefined ? {} : { chunkCount: input.chunkCount }),
      errorMessage: input.errorMessage ?? null,
    })
    .where(eq(documents.id, input.documentId));
}

export async function getKnowledgeChunkCandidates(limit = 500) {
  const db = requireDb(await getDb());
  return db
    .select({
      id: documentChunks.id,
      documentId: documents.id,
      documentName: documents.fileName,
      chunkIndex: documentChunks.chunkIndex,
      content: documentChunks.content,
    })
    .from(documentChunks)
    .innerJoin(documents, eq(documentChunks.documentId, documents.id))
    .where(eq(documents.status, "ready"))
    .orderBy(desc(documentChunks.createdAt))
    .limit(limit);
}

export async function getKnowledgeStats() {
  const db = requireDb(await getDb());
  const ready = await db.select().from(documents).where(eq(documents.status, "ready"));
  return {
    documentCount: ready.length,
    chunkCount: ready.reduce((sum, document) => sum + document.chunkCount, 0),
  };
}

export async function createChatSession(userId: number, title: string) {
  const db = requireDb(await getDb());
  const result = await db.insert(chatSessions).values({ userId, title });
  const id = Number(result[0].insertId);
  return { id, userId, title };
}

export async function listChatSessions(userId: number) {
  const db = requireDb(await getDb());
  return db.select().from(chatSessions).where(eq(chatSessions.userId, userId)).orderBy(desc(chatSessions.updatedAt));
}

export async function getChatSessionForUser(sessionId: number, userId: number) {
  const db = requireDb(await getDb());
  const result = await db
    .select()
    .from(chatSessions)
    .where(eq(chatSessions.id, sessionId))
    .limit(1);
  const session = result[0];
  if (!session || session.userId !== userId) return null;
  return session;
}

export async function listChatMessages(sessionId: number) {
  const db = requireDb(await getDb());
  return db.select().from(chatMessages).where(eq(chatMessages.sessionId, sessionId)).orderBy(chatMessages.createdAt);
}

export async function createChatMessage(input: {
  sessionId: number;
  role: "user" | "assistant";
  content: string;
  sources?: string;
}) {
  const db = requireDb(await getDb());
  const result = await db.insert(chatMessages).values(input);
  await db.update(chatSessions).set({ updatedAt: new Date() }).where(eq(chatSessions.id, input.sessionId));
  return Number(result[0].insertId);
}
