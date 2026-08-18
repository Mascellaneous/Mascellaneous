import { z } from "zod";
import { COOKIE_NAME } from "@shared/const";
import { getSessionCookieOptions } from "./_core/cookies";
import { systemRouter } from "./_core/systemRouter";
import { adminProcedure, protectedProcedure, publicProcedure, router } from "./_core/trpc";
import { answerFromKnowledge, type SourceCitation } from "./knowledge";
import {
  createChatMessage,
  createChatSession,
  createDocument,
  createDocumentChunks,
  getChatSessionForUser,
  getKnowledgeStats,
  listChatMessages,
  listChatSessions,
  listDocuments,
  updateDocumentProcessingState,
} from "./db";
import {
  extractDocumentText,
  getSupportedDocumentKind,
  MAX_DOCUMENT_SIZE_BYTES,
  splitTextIntoChunks,
} from "./documentProcessing";
import { storagePut } from "./storage";

function parseSources(value: string | null): SourceCitation[] {
  if (!value) return [];
  try {
    const parsed = JSON.parse(value);
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

const fileInput = z.object({
  fileName: z.string().min(1).max(512),
  mimeType: z.string().min(1).max(255),
  contentBase64: z.string().min(1),
});

export const appRouter = router({
  system: systemRouter,
  auth: router({
    me: publicProcedure.query((opts) => opts.ctx.user),
    logout: publicProcedure.mutation(({ ctx }) => {
      const cookieOptions = getSessionCookieOptions(ctx.req);
      ctx.res.clearCookie(COOKIE_NAME, { ...cookieOptions, maxAge: -1 });
      return { success: true } as const;
    }),
  }),

  documents: router({
    list: adminProcedure.query(async () => listDocuments()),
    upload: adminProcedure.input(fileInput).mutation(async ({ ctx, input }) => {
      if (!getSupportedDocumentKind(input.fileName)) {
        throw new Error("目前支援 PDF、Word（.docx）與 TXT 檔案。");
      }
      const buffer = Buffer.from(input.contentBase64, "base64");
      if (buffer.length === 0 || buffer.length > MAX_DOCUMENT_SIZE_BYTES) {
        throw new Error("每個檔案最大為 12 MB。請縮小檔案後再試。 ");
      }

      const safeName = input.fileName.replace(/[^a-zA-Z0-9._-]+/g, "-");
      const { key, url } = await storagePut(
        `knowledge-base/${ctx.user.id}/${Date.now()}-${safeName}`,
        buffer,
        input.mimeType,
      );
      const documentId = await createDocument({
        uploadedBy: ctx.user.id,
        fileName: input.fileName,
        storageKey: key,
        storageUrl: url,
        mimeType: input.mimeType,
        fileSize: buffer.length,
        chunkCount: 0,
        status: "processing",
      });
      try {
        const text = await extractDocumentText(buffer, input.fileName);
        const chunks = splitTextIntoChunks(text);
        await createDocumentChunks(documentId, chunks);
        await updateDocumentProcessingState({ documentId, status: "ready", chunkCount: chunks.length });
        return { id: documentId, fileName: input.fileName, chunkCount: chunks.length, status: "ready" as const };
      } catch (error) {
        const message = error instanceof Error ? error.message : "文件解析失敗，請確認檔案格式。";
        await updateDocumentProcessingState({ documentId, status: "error", errorMessage: message });
        throw new Error(message);
      }
    }),
  }),

  knowledge: router({
    stats: protectedProcedure.query(async () => getKnowledgeStats()),
    sessions: protectedProcedure.query(async ({ ctx }) => listChatSessions(ctx.user.id)),
    history: protectedProcedure
      .input(z.object({ sessionId: z.number().int().positive().optional() }))
      .query(async ({ ctx, input }) => {
        if (!input.sessionId) return [];
        const session = await getChatSessionForUser(input.sessionId, ctx.user.id);
        if (!session) throw new Error("找不到此問答紀錄。");
        const messages = await listChatMessages(session.id);
        return messages.map((message) => ({ ...message, sources: parseSources(message.sources) }));
      }),
    ask: protectedProcedure
      .input(z.object({ question: z.string().trim().min(2).max(2_000), sessionId: z.number().int().positive().optional() }))
      .mutation(async ({ ctx, input }) => {
        const existing = input.sessionId
          ? await getChatSessionForUser(input.sessionId, ctx.user.id)
          : null;
        if (input.sessionId && !existing) throw new Error("找不到此問答紀錄。");
        const session = existing ?? await createChatSession(ctx.user.id, input.question.slice(0, 60));

        await createChatMessage({ sessionId: session.id, role: "user", content: input.question });
        const result = await answerFromKnowledge(input.question);
        const messageId = await createChatMessage({
          sessionId: session.id,
          role: "assistant",
          content: result.answer,
          sources: JSON.stringify(result.sources),
        });
        return { sessionId: session.id, messageId, ...result };
      }),
  }),
});

export type AppRouter = typeof appRouter;
