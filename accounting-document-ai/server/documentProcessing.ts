import mammoth from "mammoth";
import { PDFParse } from "pdf-parse";

export const MAX_DOCUMENT_SIZE_BYTES = 12 * 1024 * 1024;

export type SupportedDocumentKind = "pdf" | "docx" | "txt";

export function getSupportedDocumentKind(fileName: string): SupportedDocumentKind | null {
  const lower = fileName.toLowerCase();
  if (lower.endsWith(".pdf")) return "pdf";
  if (lower.endsWith(".docx")) return "docx";
  if (lower.endsWith(".txt")) return "txt";
  return null;
}

export async function extractDocumentText(buffer: Buffer, fileName: string): Promise<string> {
  const kind = getSupportedDocumentKind(fileName);
  if (!kind) throw new Error("目前支援 PDF、Word（.docx）與 TXT 檔案。");

  if (kind === "txt") {
    return buffer.toString("utf8").replace(/^\uFEFF/, "");
  }

  if (kind === "docx") {
    const result = await mammoth.extractRawText({ buffer });
    return result.value;
  }

  const parser = new PDFParse({ data: buffer });
  try {
    const result = await parser.getText();
    return result.text;
  } finally {
    await parser.destroy();
  }
}

export function splitTextIntoChunks(text: string, maxCharacters = 1_200): string[] {
  const normalized = text
    .replace(/\r\n/g, "\n")
    .replace(/[ \t]+\n/g, "\n")
    .replace(/\n{3,}/g, "\n\n")
    .trim();
  if (normalized.length < 20) throw new Error("未能從檔案擷取足夠的文字；請確認檔案不是掃描影像或受密碼保護。");

  const paragraphs = normalized.split(/\n{2,}/).map((item) => item.trim()).filter(Boolean);
  const chunks: string[] = [];
  let current = "";

  const pushCurrent = () => {
    const value = current.trim();
    if (value) chunks.push(value);
    current = "";
  };

  for (const paragraph of paragraphs) {
    if (paragraph.length > maxCharacters) {
      pushCurrent();
      const sentences = paragraph.split(/(?<=[。！？.!?])\s*/);
      let longChunk = "";
      for (const sentence of sentences) {
        if ((longChunk + " " + sentence).length > maxCharacters && longChunk) {
          chunks.push(longChunk.trim());
          longChunk = sentence;
        } else {
          longChunk = `${longChunk} ${sentence}`.trim();
        }
      }
      if (longChunk) chunks.push(longChunk.trim());
      continue;
    }

    if ((current + "\n\n" + paragraph).length > maxCharacters && current) pushCurrent();
    current = `${current}${current ? "\n\n" : ""}${paragraph}`;
  }
  pushCurrent();

  return chunks.filter((chunk) => chunk.length >= 20).slice(0, 600);
}
