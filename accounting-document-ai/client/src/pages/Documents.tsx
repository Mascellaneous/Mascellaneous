import { useAuth } from "@/_core/hooks/useAuth";
import DashboardLayout from "@/components/DashboardLayout";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { trpc } from "@/lib/trpc";
import { AlertCircle, CheckCircle2, FileText, FolderOpen, Loader2, ShieldCheck, UploadCloud } from "lucide-react";
import { ChangeEvent, useRef, useState } from "react";
import { toast } from "sonner";

const MAX_FILE_SIZE = 12 * 1024 * 1024;

function formatBytes(bytes: number) {
  if (bytes < 1024 * 1024) return `${Math.max(1, Math.round(bytes / 1024))} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

export default function Documents() {
  return <DashboardLayout><DocumentsWorkspace /></DashboardLayout>;
}

function DocumentsWorkspace() {
  const { user } = useAuth();
  const inputRef = useRef<HTMLInputElement>(null);
  const [uploadingFile, setUploadingFile] = useState<{ name: string; size: number } | null>(null);
  const utils = trpc.useUtils();
  const documentsQuery = trpc.documents.list.useQuery(undefined, { enabled: user?.role === "admin" });
  const uploadMutation = trpc.documents.upload.useMutation({
    onSuccess: async (result) => {
      setUploadingFile(null);
      toast.success(`已完成解析「${result.fileName}」，建立 ${result.chunkCount} 個可檢索段落。`);
      await Promise.all([utils.documents.list.invalidate(), utils.knowledge.stats.invalidate()]);
    },
    onError: async (error) => {
      setUploadingFile(null);
      await utils.documents.list.invalidate();
      toast.error(error.message || "文件上傳失敗，請稍後再試。");
    },
  });

  const processFile = (file: File) => {
    const extension = file.name.split(".").pop()?.toLowerCase();
    if (!extension || !["pdf", "docx", "txt"].includes(extension)) {
      toast.error("請選擇 PDF、Word（.docx）或 TXT 檔案。");
      return;
    }
    if (file.size > MAX_FILE_SIZE) {
      toast.error("每個檔案最大為 12 MB。");
      return;
    }
    setUploadingFile({ name: file.name, size: file.size });
    const reader = new FileReader();
    reader.onerror = () => {
      setUploadingFile(null);
      toast.error("無法讀取此檔案，請重新選擇。 ");
    };
    reader.onload = () => {
      const value = typeof reader.result === "string" ? reader.result.split(",")[1] : undefined;
      if (!value) {
        setUploadingFile(null);
        return toast.error("無法讀取此檔案內容。");
      }
      uploadMutation.mutate({ fileName: file.name, mimeType: file.type || "application/octet-stream", contentBase64: value });
    };
    reader.readAsDataURL(file);
  };

  const onSelectFile = (event: ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    event.target.value = "";
    if (file) processFile(file);
  };

  if (user && user.role !== "admin") {
    return <div className="min-h-[calc(100vh-2rem)] rounded-[1.5rem] border border-[#e4ded0] bg-[#fffdf7] p-8 shadow-sm"><div className="mx-auto mt-24 max-w-md text-center"><div className="mx-auto flex size-12 items-center justify-center rounded-2xl bg-[#f6ebcf] text-[#8a6b26]"><ShieldCheck className="size-5" /></div><h1 className="mt-5 font-serif text-2xl font-semibold text-[#453b25]">僅限管理員使用</h1><p className="mt-3 text-sm leading-6 text-[#746a54]">文件管理區會影響所有使用者的知識庫內容。請聯絡系統管理員取得存取權限。</p></div></div>;
  }

  return <div className="min-h-[calc(100vh-2rem)] rounded-[1.5rem] border border-[#d9ded8] bg-[#fafaf6] shadow-[0_16px_60px_rgba(39,58,45,0.08)]"><header className="border-b border-[#e1e5df] bg-[linear-gradient(115deg,#f9faf5_0%,#edf2e9_100%)] px-6 py-7 sm:px-8"><div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-end"><div><div className="mb-2 flex items-center gap-2 text-xs font-semibold tracking-[0.18em] text-[#4d7364] uppercase"><FolderOpen className="size-3.5" />Knowledge foundation</div><h1 className="font-serif text-3xl font-semibold tracking-tight text-[#183b31]">文件管理</h1><p className="mt-1 text-sm text-[#627068]">上傳後會自動抽取內容並分成可追溯的知識段落。</p></div><Button onClick={() => inputRef.current?.click()} disabled={uploadMutation.isPending} className="bg-[#225c4a] shadow-sm hover:bg-[#184738]"><UploadCloud className="mr-2 size-4" />{uploadMutation.isPending ? "解析與儲存中…" : "上傳文件"}</Button></div><input ref={inputRef} type="file" accept=".pdf,.docx,.txt,application/pdf,application/vnd.openxmlformats-officedocument.wordprocessingml.document,text/plain" onChange={onSelectFile} className="hidden" /></header>

    <div className="grid gap-6 p-6 sm:p-8 xl:grid-cols-[minmax(0,1fr)_280px]">
      <section className="overflow-hidden rounded-2xl border border-[#dfe5dd] bg-white shadow-[0_5px_20px_rgba(37,64,49,0.04)]"><div className="flex items-center justify-between border-b border-[#e8ece6] px-5 py-4"><div><h2 className="font-serif text-xl font-semibold text-[#254436]">已上傳文件</h2><p className="mt-0.5 text-sm text-[#76837b]">文件狀態會在解析完成後即時更新。</p></div><Badge variant="outline" className="border-[#cbdacd] bg-[#f9fcf8] text-[#315b49]">{(documentsQuery.data?.length ?? 0) + (uploadingFile ? 1 : 0)} 份</Badge></div>{documentsQuery.isLoading ? <div className="flex items-center gap-2 p-8 text-sm text-muted-foreground"><Loader2 className="size-4 animate-spin" />讀取文件清單中…</div> : null}{!documentsQuery.isLoading && (documentsQuery.data?.length ?? 0) === 0 && !uploadingFile ? <div className="flex min-h-72 flex-col items-center justify-center px-8 text-center"><div className="flex size-12 items-center justify-center rounded-2xl bg-[#edf4eb] text-[#4e7d66]"><FileText className="size-5" /></div><h3 className="mt-4 font-serif text-xl font-semibold text-[#365443]">從第一份文件開始</h3><p className="mt-2 max-w-sm text-sm leading-6 text-[#758278]">支援 PDF、Word（.docx）與 TXT。每份文件最多 12 MB。</p><Button variant="outline" onClick={() => inputRef.current?.click()} className="mt-5 border-[#adc4b3] text-[#245541] hover:bg-[#eff6ec]"><UploadCloud className="mr-2 size-4" />選擇檔案</Button></div> : null}<div className="divide-y divide-[#e9ede8]">{uploadingFile ? <div className="flex flex-col gap-4 bg-[#fbfdf9] px-5 py-4 sm:flex-row sm:items-center"><div className="flex size-10 shrink-0 items-center justify-center rounded-xl bg-[#fff5d8] text-[#9a772a]"><Loader2 className="size-4 animate-spin" /></div><div className="min-w-0 flex-1"><div className="flex flex-wrap items-center gap-2"><p className="truncate font-medium text-[#2c4337]">{uploadingFile.name}</p><Badge className="border border-[#ead8b3] bg-[#fffae9] text-[#876b2d] hover:bg-[#fffae9]"><Loader2 className="mr-1 size-3 animate-spin" />處理中</Badge></div><p className="mt-1 text-xs text-[#7c887f]">{formatBytes(uploadingFile.size)}　·　正在抽取內容並建立知識段落</p></div></div> : null}{documentsQuery.data?.map((document) => <div key={document.id} className="flex flex-col gap-4 px-5 py-4 transition hover:bg-[#fbfdf9] sm:flex-row sm:items-center"><div className="flex size-10 shrink-0 items-center justify-center rounded-xl bg-[#eaf2e8] text-[#3d735b]"><FileText className="size-4.5" /></div><div className="min-w-0 flex-1"><div className="flex flex-wrap items-center gap-2"><p className="truncate font-medium text-[#2c4337]">{document.fileName}</p><Badge className={document.status === "ready" ? "border border-[#c9decd] bg-[#edf7ef] text-[#2f6944] hover:bg-[#edf7ef]" : "border border-[#ead8b3] bg-[#fffae9] text-[#876b2d] hover:bg-[#fffae9]"}>{document.status === "ready" ? <CheckCircle2 className="mr-1 size-3" /> : <AlertCircle className="mr-1 size-3" />}{document.status === "ready" ? "已就緒" : document.status === "processing" ? "處理中" : "需注意"}</Badge></div><p className="mt-1 text-xs text-[#7c887f]">{formatBytes(document.fileSize)}　·　{document.chunkCount} 個知識段落　·　{new Date(document.createdAt).toLocaleString("zh-Hant")}</p></div><a href={document.storageUrl} target="_blank" rel="noreferrer" className="text-sm font-medium text-[#3d735b] hover:text-[#1f4d3b]">檢視檔案</a></div>)}</div></section>
      <aside className="space-y-4"><div className="rounded-2xl border border-[#d8e4d7] bg-[#eff6ed] p-5"><div className="flex size-9 items-center justify-center rounded-xl bg-white text-[#3d735b] shadow-sm"><ShieldCheck className="size-4" /></div><h3 className="mt-4 font-serif text-lg font-semibold text-[#31513e]">可信任的回答基礎</h3><p className="mt-2 text-sm leading-6 text-[#637467]">系統會把每份文件切分為段落；使用者提問時，會先找出相關內容，再產生附有來源的回答。</p></div><div className="rounded-2xl border border-[#e2e5dd] bg-white p-5"><p className="text-[11px] font-semibold tracking-[0.14em] text-[#728077] uppercase">上傳指引</p><p className="mt-3 text-sm leading-6 text-[#5f6d64]">請使用文字型 PDF、DOCX 或 TXT。掃描影像型 PDF 未包含可抽取文字時，系統會提示你檢查檔案。</p><p className="mt-3 text-sm leading-6 text-[#5f6d64]">文件原檔會妥善保存，資料庫僅儲存索引、段落及必要的中繼資料。</p></div></aside>
    </div></div>;
}
