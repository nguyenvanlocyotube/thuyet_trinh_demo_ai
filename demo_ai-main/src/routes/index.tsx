import { useQuery, useQueryClient } from "@tanstack/react-query";
import { createFileRoute } from "@tanstack/react-router";
import { useServerFn } from "@tanstack/react-start";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import {
  Camera,
  Mic,
  Volume2,
  UploadCloud,
  FileAudio,
  FileText,
  Sparkles,
  Copy,
  Check,
  Trash2,
  ZoomIn,
  RefreshCw,
  Play,
  Square,
  Download,
  Search,
  Filter,
  ArrowRight,
  ChevronRight,
  Menu,
  X,
  Activity,
  HardDrive,
  Database,
  Cpu,
  ShieldCheck,
  Clock,
  Zap,
  ArrowUp,
  User as UserIcon,
  Crown,
  Lock,
} from "lucide-react";
import { toast } from "sonner";

import {
  fetchHistory,
  fetchStats,
  deleteHistoryItem,
  formatBytes,
  formatTime,
  saveRecognition,
  uploadImage,
  type HistoryItem,
  type Stats,
} from "@/lib/history";
import {
  analyzeImage,
  getGroqRateLimit,
  transcribeAudio,
  type ImageResult,
  type GroqRateLimit,
} from "@/lib/recognition.functions";
import { Pricing, Reviews, Sponsors, FAQ } from "@/components/Marketing";
import { prepareImage } from "@/lib/image";
import { startWavRecording, type WavRecorder } from "@/lib/wav-recorder";
import {
  AuthModal,
  ProfileModal,
  AvatarModal,
  TrialLimitModal,
  ChangePasswordModal,
  GoogleAccountSelectModal,
} from "@/components/AuthModals";
import { AdminPanelModal } from "@/components/AdminPanelModal";
import { useAuth } from "@/lib/auth";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "AI Video&Text — Nền tảng Nhận dạng Hình ảnh & Giọng nói AI" },
      {
        name: "description",
        content:
          "Nền tảng trí tuệ nhân tạo đa phương thức: Phân tích hình ảnh, OCR trích xuất chữ tiếng Việt, chuyển giọng nói thành văn bản siêu tốc và lưu trữ dữ liệu an toàn.",
      },
      { property: "og:title", content: "AI Video&Text — AI Vision & Speech Studio" },
      {
        property: "og:description",
        content:
          "Phân tích thị giác, nhận diện chữ viết OCR, chuyển đổi giọng nói thời gian thực và quản lý kho dữ liệu thông minh.",
      },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: Index,
});

const STORAGE_QUOTA = 1024 * 1024 * 1024; // 1 GB quota

function pct(value: number, max: number) {
  if (max <= 0) return 0;
  return Math.max(2, Math.min(100, Math.round((value / max) * 100)));
}

function num(n: number) {
  return n.toLocaleString("vi-VN");
}

const GROQ_USAGE_HISTORY_KEY = "groq-image-token-usage-qwen3.6-27b";
const DEFAULT_TOKENS_PER_IMAGE = 2500;
const MAX_USAGE_SAMPLES = 12;
const GROQ_RATE_LIMIT_STORAGE_KEY = "groq-rate-limit-qwen3.6-27b";

function loadTokenUsageSamples(): number[] {
  try {
    const raw = window.localStorage.getItem(GROQ_USAGE_HISTORY_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw);
    if (!Array.isArray(parsed)) return [];
    return parsed
      .filter(
        (value): value is number =>
          typeof value === "number" && Number.isFinite(value) && value > 0,
      )
      .slice(-MAX_USAGE_SAMPLES);
  } catch {
    return [];
  }
}

function saveTokenUsageSample(totalTokens: number) {
  if (!Number.isFinite(totalTokens) || totalTokens <= 0) return;
  const samples = [...loadTokenUsageSamples(), Math.ceil(totalTokens)].slice(-MAX_USAGE_SAMPLES);
  try {
    window.localStorage.setItem(GROQ_USAGE_HISTORY_KEY, JSON.stringify(samples));
  } catch {
    // Ignore storage errors
  }
}

function averageTokensPerImage(samples: number[]) {
  if (!samples.length) return DEFAULT_TOKENS_PER_IMAGE;
  return Math.max(1, Math.round(samples.reduce((sum, value) => sum + value, 0) / samples.length));
}

function Index() {
  const runAnalyzeImage = useServerFn(analyzeImage);
  const runGetGroqRateLimit = useServerFn(getGroqRateLimit);
  const runTranscribe = useServerFn(transcribeAudio);
  const queryClient = useQueryClient();

  // Auth context
  const {
    user,
    isAdmin,
    setIsLoginModalOpen,
    setIsProfileModalOpen,
    setIsAdminModalOpen,
    switchRoleToAdmin,
    checkCanUseFeature,
    consumeTrial,
  } = useAuth();

  const [isTrialModalOpen, setIsTrialModalOpen] = useState(false);

  const statsQuery = useQuery<Stats>({
    queryKey: ["stats"],
    queryFn: fetchStats,
    refetchInterval: 20000,
  });

  const historyQuery = useQuery<HistoryItem[]>({
    queryKey: ["history"],
    queryFn: () => fetchHistory(),
    refetchInterval: 60000,
  });

  const stats = statsQuery.data;

  const refresh = useCallback(() => {
    void queryClient.invalidateQueries({ queryKey: ["stats"] });
    void queryClient.invalidateQueries({ queryKey: ["history"] });
  }, [queryClient]);

  // Mode state: image | audio | tts
  const [activeStudioTab, setActiveStudioTab] = useState<"image" | "audio" | "tts">("image");

  // Mobile menu & scroll to top state
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [showScrollTop, setShowScrollTop] = useState(false);

  // File input & Drag state
  const fileInput = useRef<HTMLInputElement>(null);
  const audioFileInput = useRef<HTMLInputElement>(null);
  const txtFileInput = useRef<HTMLInputElement>(null);
  const [isDragOver, setIsDragOver] = useState(false);

  // Image states
  const [imageFiles, setImageFiles] = useState<
    { name: string; size: number; url: string; originalFile: File }[]
  >([]);
  const [imageBusy, setImageBusy] = useState(false);
  const [imageResult, setImageResult] = useState<ImageResult | null>(null);
  const [imageError, setImageError] = useState<string | null>(null);
  const [imageBatchProgress, setImageBatchProgress] = useState({
    done: 0,
    total: 0,
    status: "",
  });

  // Groq rate limit states
  const [groqRateLimit, setGroqRateLimit] = useState<GroqRateLimit | null>(null);
  const [groqResetSeconds, setGroqResetSeconds] = useState(0);
  const [groqResetAt, setGroqResetAt] = useState<number | null>(null);
  const [groqProbeLoading, setGroqProbeLoading] = useState(true);
  const [tokenUsageSamples, setTokenUsageSamples] = useState<number[]>([]);

  // History filtering & Lightbox
  const [historyFilter, setHistoryFilter] = useState<"all" | "image" | "audio">("all");
  const [historySearch, setHistorySearch] = useState("");
  const [selectedImage, setSelectedImage] = useState<HistoryItem | null>(null);

  // Audio recording states
  const recorderRef = useRef<WavRecorder | null>(null);
  const [recording, setRecording] = useState(false);
  const [recordingSeconds, setRecordingSeconds] = useState(0);
  const [levels, setLevels] = useState<number[]>(new Array(24).fill(0.25));
  const [audioBusy, setAudioBusy] = useState(false);
  const [transcript, setTranscript] = useState<{ text: string; durationMs: number } | null>(null);
  const [audioError, setAudioError] = useState<string | null>(null);

  // TTS states
  const [ttsText, setTtsText] = useState("");
  const [ttsSpeaking, setTtsSpeaking] = useState(false);
  const [ttsSpeed, setTtsSpeed] = useState<number>(1.0);
  const [textFile, setTextFile] = useState<{ name: string; text: string } | null>(null);

  // Policy modal
  const [activePolicy, setActivePolicy] = useState<
    "dieu-khoan" | "bao-mat" | "thanh-toan" | "hoan-tien" | "lien-he" | null
  >(null);

  // Mouse Aurora Glow Effect
  const cursorGlowRef = useRef<HTMLDivElement>(null);
  const cursorGlowSecondaryRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleScroll = () => {
      setShowScrollTop(window.scrollY > 400);
    };
    window.addEventListener("scroll", handleScroll, { passive: true });
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  useEffect(() => {
    const primary = cursorGlowRef.current;
    const secondary = cursorGlowSecondaryRef.current;
    if (!primary || !secondary) return;

    let targetX = window.innerWidth / 2;
    let targetY = window.innerHeight / 2;
    let currentX = targetX;
    let currentY = targetY;
    let frame = 0;

    const move = (event: MouseEvent) => {
      targetX = event.clientX;
      targetY = event.clientY;
    };

    const animate = () => {
      currentX += (targetX - currentX) * 0.08;
      currentY += (targetY - currentY) * 0.08;

      primary.style.transform = `translate3d(${currentX - 210}px, ${currentY - 210}px, 0)`;
      secondary.style.transform = `translate3d(${currentX - 145}px, ${currentY - 145}px, 0)`;

      frame = requestAnimationFrame(animate);
    };

    window.addEventListener("mousemove", move, { passive: true });
    frame = requestAnimationFrame(animate);

    return () => {
      window.removeEventListener("mousemove", move);
      cancelAnimationFrame(frame);
    };
  }, []);

  // Close modals on Escape key
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        if (selectedImage) setSelectedImage(null);
        if (activePolicy) setActivePolicy(null);
        if (mobileMenuOpen) setMobileMenuOpen(false);
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [selectedImage, activePolicy, mobileMenuOpen]);

  // Recording timer
  useEffect(() => {
    let interval: number | undefined;
    if (recording) {
      interval = window.setInterval(() => {
        setRecordingSeconds((prev) => prev + 1);
      }, 1000);
    } else {
      setRecordingSeconds(0);
    }
    return () => {
      if (interval) clearInterval(interval);
    };
  }, [recording]);

  // Groq Rate limit countdown
  useEffect(() => {
    if (!groqResetAt) {
      setGroqResetSeconds(0);
      return;
    }

    const updateCountdown = () => {
      const remainingMs = Math.max(0, groqResetAt - Date.now());
      const seconds = Math.ceil(remainingMs / 1000);
      setGroqResetSeconds(seconds);

      if (seconds <= 0) {
        setGroqRateLimit((current) => {
          if (!current) return current;
          const resetLimit = {
            ...current,
            remainingTokens: current.limitTokens,
          };
          try {
            window.localStorage.setItem(
              GROQ_RATE_LIMIT_STORAGE_KEY,
              JSON.stringify({ ...resetLimit, resetAt: Date.now() }),
            );
          } catch {
            // Ignore
          }
          return resetLimit;
        });
      }
    };

    updateCountdown();
    const timer = window.setInterval(updateCountdown, 1000);
    return () => window.clearInterval(timer);
  }, [groqResetAt]);

  // Initial Groq Rate limit check
  useEffect(() => {
    let cachedResetAt: number | null = null;
    let hasValidCache = false;

    try {
      const cached = window.localStorage.getItem(GROQ_RATE_LIMIT_STORAGE_KEY);
      if (cached) {
        const parsed = JSON.parse(cached) as GroqRateLimit & { resetAt?: number };
        if (Number.isFinite(parsed.limitTokens) && Number.isFinite(parsed.remainingTokens)) {
          setGroqRateLimit(parsed);
          cachedResetAt = Number(parsed.resetAt);
          if (Number.isFinite(cachedResetAt) && cachedResetAt > Date.now()) {
            setGroqResetAt(cachedResetAt);
            hasValidCache = true;
          }
        }
      }
    } catch {
      // Ignore
    }

    setTokenUsageSamples(loadTokenUsageSamples());

    if (hasValidCache) return;

    let cancelled = false;

    const probe = async () => {
      setGroqProbeLoading(true);
      try {
        const rateLimit = await runGetGroqRateLimit();
        if (cancelled) return;

        setGroqRateLimit(rateLimit);
        const resetAt = Date.now() + Math.max(0, rateLimit.resetTokensSeconds) * 1000;
        setGroqResetAt(resetAt);
        window.localStorage.setItem(
          GROQ_RATE_LIMIT_STORAGE_KEY,
          JSON.stringify({ ...rateLimit, resetAt }),
        );
      } catch (error) {
        console.error("Không kiểm tra được Token Groq:", error);
      } finally {
        if (!cancelled) setGroqProbeLoading(false);
      }
    };

    void probe();

    return () => {
      cancelled = true;
    };
  }, [runGetGroqRateLimit]);

  // Handle image files selection
  const handleSelectFiles = useCallback(async (files: File[]) => {
    const validImages = files.filter((f) => f.type.startsWith("image/"));
    if (!validImages.length) {
      toast.error("Vui lòng chọn tệp hình ảnh hợp lệ (PNG, JPG, WEBP, JPEG)");
      return;
    }

    try {
      const previews = await Promise.all(
        validImages.map(async (file) => ({
          name: file.name,
          size: file.size,
          url: await prepareImage(file),
          originalFile: file,
        })),
      );
      setImageFiles((prev) => [...prev, ...previews]);
      toast.success(`Đã thêm ${validImages.length} ảnh vào danh sách`);
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Không thể đọc tệp hình ảnh.");
    }
  }, []);

  // Remove single image from queue
  const removeImage = useCallback((index: number) => {
    setImageFiles((prev) => prev.filter((_, i) => i !== index));
  }, []);

  // Run AI Vision analysis
  const executeImageAnalysis = useCallback(async () => {
    if (!imageFiles.length) {
      toast.error("Vui lòng tải lên ít nhất một ảnh để phân tích.");
      return;
    }

    // KIỂM TRA HẠN MỨC GÓI FREE: CHỈ 1 LƯỢT MIỄN PHÍ
    const permission = checkCanUseFeature();
    if (!permission.allowed) {
      setIsTrialModalOpen(true);
      return;
    }

    setImageError(null);
    setImageResult(null);
    setImageBusy(true);
    setImageBatchProgress({
      done: 0,
      total: imageFiles.length,
      status: "Khởi tạo tiến trình phân tích...",
    });

    const results: ImageResult[] = [];
    const errors: string[] = [];

    try {
      for (let index = 0; index < imageFiles.length; index += 1) {
        const item = imageFiles[index];
        if (!item) continue;
        const dataUrl = item.url;
        const started = Date.now();

        try {
          let result: ImageResult | null = null;

          for (let attempt = 0; attempt < 8; attempt += 1) {
            try {
              result = await runAnalyzeImage({ data: { dataUrl } });

              if (result.rateLimit) {
                setGroqRateLimit(result.rateLimit);
                const resetAt =
                  Date.now() + Math.max(0, result.rateLimit.resetTokensSeconds) * 1000;
                setGroqResetAt(resetAt);
                window.localStorage.setItem(
                  GROQ_RATE_LIMIT_STORAGE_KEY,
                  JSON.stringify({ ...result.rateLimit, resetAt }),
                );
              }

              if (result.usage?.totalTokens) {
                const usage = Math.ceil(result.usage.totalTokens);
                saveTokenUsageSample(usage);
                setTokenUsageSamples(loadTokenUsageSamples());
              }

              break;
            } catch (error) {
              const message = error instanceof Error ? error.message : String(error);

              if (!message.startsWith("__GROQ_RATE_LIMIT__")) {
                throw error;
              }

              let rateLimit: GroqRateLimit | undefined;
              try {
                const payload = JSON.parse(message.replace("__GROQ_RATE_LIMIT__", "")) as {
                  rateLimit?: GroqRateLimit;
                };
                rateLimit = payload.rateLimit;
              } catch {
                // Fallback
              }

              if (rateLimit) {
                setGroqRateLimit(rateLimit);
                const reset = Math.max(1, Math.ceil(rateLimit.resetTokensSeconds));
                const resetAt = Date.now() + reset * 1000;
                setGroqResetAt(resetAt);
                window.localStorage.setItem(
                  GROQ_RATE_LIMIT_STORAGE_KEY,
                  JSON.stringify({ ...rateLimit, resetAt }),
                );
                setImageBatchProgress((current) => ({
                  ...current,
                  status: `Hạn ngạch token đạt mức giới hạn — chờ ${reset}s rồi tự động tiếp tục...`,
                }));

                await new Promise((resolve) => setTimeout(resolve, reset * 1000 + 300));
                continue;
              }

              const waitMs = Math.min(60000, 5000 * 2 ** attempt);
              setGroqResetAt(Date.now() + waitMs);
              setImageBatchProgress((current) => ({
                ...current,
                status: `Đang chờ hạn mức API... ${Math.ceil(waitMs / 1000)}s`,
              }));

              await new Promise((resolve) => setTimeout(resolve, waitMs));
            }
          }

          if (!result) {
            throw new Error("Mô hình AI đang bận hoặc quá tải rate limit. Vui lòng thử lại sau.");
          }

          const path = await uploadImage(item.originalFile);
          results.push(result);

          await saveRecognition({
            kind: "image",
            file_name: item.name,
            image_path: path,
            bytes: item.size,
            labels: result.labels,
            summary: result.summary,
            ocr_text: result.text,
            latency_ms: Date.now() - started,
          });
        } catch (err) {
          errors.push(
            `${item.name}: ${err instanceof Error ? err.message : "Lỗi không xác định."}`,
          );
        } finally {
          setImageBatchProgress((current) => ({
            ...current,
            done: current.done + 1,
            status: "",
          }));
        }
      }

      if (results.length) {
        const allLabels = results.flatMap((r) => r.labels);
        const allSummaries = results.map((r) => r.summary?.trim()).filter(Boolean);
        const allTexts = results.map((r) => r.text?.trim()).filter(Boolean);

        setImageResult({
          labels: allLabels,
          summary: allSummaries.join("\n\n"),
          text: allTexts.length ? allTexts.join("\n---\n") : null,
        });

        // Ghi nhận lượt trial của tài khoản free
        consumeTrial();
        toast.success(`Đã hoàn tất phân tích ${results.length} hình ảnh!`);
      }

      if (errors.length) {
        const errorText = `${errors.length}/${imageFiles.length} ảnh gặp lỗi khi xử lý.`;
        setImageError(errorText);
        toast.error(errorText);
      }

      refresh();
    } finally {
      setImageBusy(false);
    }
  }, [imageFiles, checkCanUseFeature, consumeTrial, runAnalyzeImage, refresh]);

  // Audio recording toggle
  const toggleRecording = useCallback(async () => {
    setAudioError(null);
    if (recording) {
      const recorder = recorderRef.current;
      recorderRef.current = null;
      setRecording(false);
      if (!recorder) return;
      setAudioBusy(true);
      const started = Date.now();
      try {
        const { dataUrl, durationMs } = await recorder.stop();
        toast.info("Đang chuyển đổi giọng nói thành văn bản...");
        const { text } = await runTranscribe({ data: { dataUrl, durationMs } });
        setTranscript({ text: text || "(không nhận dạng được nội dung giọng nói)", durationMs });
        await saveRecognition({
          kind: "audio",
          file_name: `Ghi âm trực tiếp (${Math.round(durationMs / 1000)}s)`,
          bytes: Math.round((dataUrl.length * 3) / 4),
          transcript: text,
          duration_ms: Math.round(durationMs),
          latency_ms: Date.now() - started,
        });
        consumeTrial();
        toast.success("Trích xuất giọng nói hoàn tất!");
        refresh();
      } catch (err) {
        const msg = err instanceof Error ? err.message : "Không trích xuất được âm thanh.";
        setAudioError(msg);
        toast.error(msg);
      } finally {
        setAudioBusy(false);
      }
      return;
    }

    // KIỂM TRA HẠN MỨC GÓI FREE TRƯỚC KHI BẮT ĐẦU GHI ÂM
    const permission = checkCanUseFeature();
    if (!permission.allowed) {
      setIsTrialModalOpen(true);
      return;
    }

    try {
      setTranscript(null);
      recorderRef.current = await startWavRecording(setLevels);
      setRecording(true);
      toast.info("Đang bắt đầu ghi âm. Hãy nói vào micro...");
    } catch {
      const msg = "Không thể truy cập microphone. Vui lòng cấp quyền trong trình duyệt.";
      setAudioError(msg);
      toast.error(msg);
    }
  }, [recording, checkCanUseFeature, consumeTrial, runTranscribe, refresh]);

  // Audio file upload
  const handleAudioFileUpload = useCallback(
    async (file: File) => {
      // KIỂM TRA HẠN MỨC GÓI FREE
      const permission = checkCanUseFeature();
      if (!permission.allowed) {
        setIsTrialModalOpen(true);
        return;
      }

      setAudioError(null);
      setTranscript(null);
      setAudioBusy(true);
      const started = Date.now();

      try {
        toast.info(`Đang xử lý tệp ${file.name}...`);
        const dataUrl = await new Promise<string>((resolve, reject) => {
          const reader = new FileReader();
          reader.onload = () => {
            if (typeof reader.result === "string") resolve(reader.result);
            else reject(new Error("Không đọc được dữ liệu tệp âm thanh."));
          };
          reader.onerror = () => reject(new Error("Không thể đọc tệp âm thanh."));
          reader.readAsDataURL(file);
        });

        const { text } = await runTranscribe({ data: { dataUrl, durationMs: 0 } });
        setTranscript({ text: text || "(không nhận dạng được nội dung)", durationMs: 0 });
        await saveRecognition({
          kind: "audio",
          file_name: file.name,
          bytes: file.size,
          transcript: text,
          duration_ms: 0,
          latency_ms: Date.now() - started,
        });
        consumeTrial();
        toast.success("Trích xuất âm thanh thành công!");
        refresh();
      } catch (error) {
        const msg = error instanceof Error ? error.message : "Không thể xử lý tệp âm thanh.";
        setAudioError(msg);
        toast.error(msg);
      } finally {
        setAudioBusy(false);
      }
    },
    [checkCanUseFeature, consumeTrial, runTranscribe, refresh],
  );

  // Text-To-Speech controls
  const stopTextToSpeech = useCallback(() => {
    if (typeof window === "undefined" || !("speechSynthesis" in window)) return;
    window.speechSynthesis.cancel();
    setTtsSpeaking(false);
  }, []);

  const speakText = useCallback(
    (textToSpeak: string) => {
      if (typeof window === "undefined" || !("speechSynthesis" in window)) {
        toast.error("Trình duyệt không hỗ trợ tổng hợp giọng nói (Web Speech API).");
        return;
      }

      const cleanText = textToSpeak.trim();
      if (!cleanText) {
        toast.error("Vui lòng nhập văn bản cần đọc.");
        return;
      }

      // KIỂM TRA HẠN MỨC GÓI FREE
      const permission = checkCanUseFeature();
      if (!permission.allowed) {
        setIsTrialModalOpen(true);
        return;
      }

      window.speechSynthesis.cancel();
      const utterance = new SpeechSynthesisUtterance(cleanText);
      utterance.lang = "vi-VN";
      utterance.rate = ttsSpeed;
      utterance.pitch = 1;
      utterance.volume = 1;

      const voices = window.speechSynthesis.getVoices();
      const vietnameseVoice = voices.find((v) =>
        v.lang.toLowerCase().replace("_", "-").startsWith("vi"),
      );
      if (vietnameseVoice) utterance.voice = vietnameseVoice;

      utterance.onstart = () => {
        setTtsSpeaking(true);
        consumeTrial();
      };
      utterance.onend = () => setTtsSpeaking(false);
      utterance.onerror = () => {
        setTtsSpeaking(false);
        toast.error("Không thể phát âm thanh.");
      };

      setTtsSpeaking(true);
      window.speechSynthesis.speak(utterance);
      toast.info("Đang phát giọng đọc tiếng Việt...");
    },
    [checkCanUseFeature, consumeTrial, ttsSpeed],
  );

  // Copy helper
  const copyToClipboard = (text: string, label: string) => {
    void navigator.clipboard.writeText(text);
    toast.success(`Đã sao chép ${label} vào bộ nhớ tạm!`);
  };

  // Download text helper
  const downloadTextFile = (content: string, filename: string) => {
    const blob = new Blob([content], { type: "text/plain;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = filename;
    link.click();
    URL.revokeObjectURL(url);
    toast.success(`Đã tải về tệp ${filename}!`);
  };

  // Filtered History Items
  const filteredHistory = useMemo(() => {
    if (!historyQuery.data) return [];
    return historyQuery.data.filter((item) => {
      // Type match
      if (historyFilter === "image" && item.kind !== "image") return false;
      if (historyFilter === "audio" && item.kind !== "audio") return false;

      // Search match
      if (!historySearch.trim()) return true;
      const q = historySearch.toLowerCase();
      const nameMatch = item.file_name?.toLowerCase().includes(q);
      const summaryMatch = item.summary?.toLowerCase().includes(q);
      const textMatch = item.ocr_text?.toLowerCase().includes(q);
      const transcriptMatch = item.transcript?.toLowerCase().includes(q);
      const labelMatch = item.labels.some((l) => l.label.toLowerCase().includes(q));

      return Boolean(nameMatch || summaryMatch || textMatch || transcriptMatch || labelMatch);
    });
  }, [historyQuery.data, historyFilter, historySearch]);

  const estimatedTokensPerImage = averageTokensPerImage(tokenUsageSamples);
  const estimatedImagesAvailable = groqRateLimit
    ? Math.max(0, Math.floor(groqRateLimit.remainingTokens / Math.max(1, estimatedTokensPerImage)))
    : 0;

  // Cloud Resource status items
  const resources = [
    {
      name: "Hệ thống AI Groq Vision",
      value: stats ? num(stats.total) : "—",
      meta: stats ? `${num(stats.images)} ảnh · ${num(stats.audios)} âm thanh` : "Đang kết nối...",
      status: stats && stats.last_hour > 0 ? "Đang xử lý" : "Sẵn sàng",
      state: "ok",
      icon: Cpu,
    },
    {
      name: "Cơ sở dữ liệu Supabase",
      value: stats ? num(stats.labels) : "—",
      meta: stats
        ? `${num(stats.labels)} nhãn phân loại · ${num(stats.active_days)} ngày vận hành`
        : "Đang kết nối...",
      status: "Trực tuyến",
      state: "ok",
      icon: Database,
    },
    {
      name: "Kho lưu trữ Media Storage",
      value: stats ? formatBytes(stats.bytes) : "—",
      meta: stats
        ? `${num(stats.images)} tệp · ${pct(stats.bytes, STORAGE_QUOTA)}% của 1 GB`
        : "Đang kiểm tra...",
      status: stats && stats.bytes > STORAGE_QUOTA * 0.8 ? "Cảnh báo 80%" : "Còn trống",
      state: stats && stats.bytes > STORAGE_QUOTA * 0.8 ? "warn" : "ok",
      icon: HardDrive,
    },
    {
      name: "Token Groq khả dụng",
      value: groqRateLimit ? groqRateLimit.remainingTokens.toLocaleString("vi-VN") : "—",
      meta: groqRateLimit
        ? `/${groqRateLimit.limitTokens.toLocaleString("vi-VN")} TPM · ~${num(estimatedImagesAvailable)} ảnh`
        : groqProbeLoading
          ? "Đang xác thực..."
          : "Chưa có thông tin",
      status:
        groqRateLimit &&
        groqRateLimit.remainingTokens / Math.max(1, groqRateLimit.limitTokens) <= 0.15
          ? "Sắp hết"
          : "Đầy đủ",
      state:
        groqRateLimit &&
        groqRateLimit.remainingTokens / Math.max(1, groqRateLimit.limitTokens) <= 0.15
          ? "warn"
          : "ok",
      icon: Zap,
    },
  ];

  const metrics = [
    {
      label: "Tổng lượt nhận dạng",
      value: stats ? num(stats.total) : "—",
      sub: stats ? `${num(stats.last_24h)} lượt trong 24 giờ` : "—",
      pct: stats ? pct(stats.last_24h, Math.max(stats.total, 1)) : 0,
      color: "bg-primary",
    },
    {
      label: "Dung lượng kho ảnh",
      value: stats ? formatBytes(stats.bytes) : "—",
      sub: `${pct(stats?.bytes ?? 0, STORAGE_QUOTA)}% của gói 1 GB`,
      pct: stats ? pct(stats.bytes, STORAGE_QUOTA) : 0,
      color: "bg-amber-400",
    },
    {
      label: "Độ trễ trung bình",
      value: stats ? `${num(stats.avg_latency_ms)}ms` : "—",
      sub: "Tốc độ xử lý qua Groq LPU",
      pct: stats ? Math.min(100, Math.round((stats.avg_latency_ms / 4000) * 100)) : 0,
      color: "bg-emerald-400",
    },
    {
      label: "Thời lượng âm thanh",
      value: stats ? `${num(stats.audio_seconds)}s` : "—",
      sub: "Whisper Turbo trích xuất",
      pct: stats ? pct(stats.audio_seconds, 600) : 0,
      color: "bg-cyan-400",
    },
  ];

  const policyContent = {
    "dieu-khoan": {
      icon: "📜",
      title: "Điều khoản sử dụng",
      sections: [
        [
          "1. Phạm vi dịch vụ",
          "Website cung cấp các công cụ AI để nhận dạng và phân tích hình ảnh, OCR, chuyển giọng nói thành văn bản và các tính năng xử lý dữ liệu khác. Tính năng, giới hạn và giá dịch vụ có thể được điều chỉnh để phù hợp với hoạt động của hệ thống.",
        ],
        [
          "2. Trách nhiệm người dùng",
          "Bạn chịu trách nhiệm về dữ liệu tải lên, quyền sở hữu dữ liệu và mục đích sử dụng kết quả. Nghiêm cấm sử dụng hệ thống để phát tán nội dung độc hại, xâm phạm quyền riêng tư hoặc vi phạm quy định pháp luật.",
        ],
        [
          "3. Kết quả AI",
          "Kết quả do AI tạo ra mang tính chất tham khảo với độ chính xác cao. Người dùng cần kiểm tra lại trước khi áp dụng cho các quyết định chuyên môn quan trọng như pháp lý, tài chính hoặc y tế.",
        ],
        [
          "4. Tài khoản và bảo mật",
          "Chúng tôi bảo vệ quyền riêng tư người dùng. Hệ thống có quyền tạm ngưng cung cấp dịch vụ nếu phát hiện các hành vi gian lận hoặc lạm dụng tài nguyên mạng.",
        ],
        [
          "5. Thay đổi điều khoản",
          "Bản cập nhật Điều khoản mới nhất sẽ luôn được công bố trên Website. Việc tiếp tục sử dụng dịch vụ đồng nghĩa với việc bạn đồng ý với các cập nhật này.",
        ],
      ],
    },
    "bao-mat": {
      icon: "🔒",
      title: "Chính sách bảo mật",
      sections: [
        [
          "1. Dữ liệu được xử lý",
          "Hệ thống chỉ xử lý hình ảnh, tệp âm thanh và văn bản bạn chủ động tải lên để thực hiện tác vụ phân tích AI tương ứng.",
        ],
        [
          "2. Lưu trữ an toàn",
          "Dữ liệu được lưu trữ mã hóa trên Supabase Storage với cơ chế kiểm soát truy cập phân quyền nghiêm ngặt. Người dùng có quyền xóa vĩnh viễn dữ liệu bất kỳ lúc nào.",
        ],
        [
          "3. Nhà cung cấp bên thứ ba",
          "Một phần dữ liệu xử lý có thể được gửi tới API Groq LPU hoặc OpenAI Whisper để nhận dạng. Các đơn vị này tuân thủ tiêu chuẩn bảo mật dữ liệu doanh nghiệp không dùng dữ liệu người dùng để huấn luyện.",
        ],
        [
          "4. Quyền riêng tư",
          "Chúng tôi cam kết không mua bán, trao đổi hoặc chia sẻ thông tin cá nhân của bạn với bất kỳ bên thứ ba nào vì mục đích thương mại.",
        ],
        [
          "5. Liên hệ quyền dữ liệu",
          "Mọi yêu cầu xuất hoặc xóa toàn bộ dữ liệu có thể liên hệ trực tiếp với bộ phận hỗ trợ kỹ thuật.",
        ],
      ],
    },
    "thanh-toan": {
      icon: "💳",
      title: "Chính sách thanh toán",
      sections: [
        [
          "1. Phương thức thanh toán",
          "Hỗ trợ thanh toán bằng hình thức chuyển khoản qua mã VietQR / Napas247 tương thích với toàn bộ 50+ ngân hàng tại Việt Nam và các ví MoMo, ViettelPay, ZaloPay.",
        ],
        [
          "2. Kích hoạt tự động",
          "Cổng SePay tự động quét sao kê ngân hàng và kích hoạt gói cước trong vòng 3 đến 10 giây ngay sau khi tiền về tài khoản với đúng mã nội dung đơn.",
        ],
        [
          "3. Nội dung chuyển khoản",
          "Khách hàng cần giữ nguyên mã đơn hàng trong nội dung chuyển khoản để hệ thống đối soát chính xác.",
        ],
        [
          "4. Xử lý sai sót",
          "Nếu bạn chuyển thiếu tiền hoặc quên ghi mã đơn hàng, vui lòng chụp ảnh biên lai chuyển tiền và liên hệ hotline Telegram để được hỗ trợ thủ công trong 5 phút.",
        ],
        ["5. Xuất hóa đơn", "Dịch vụ hỗ trợ xác nhận đơn hàng điện tử gửi qua email đăng ký."],
      ],
    },
    "hoan-tien": {
      icon: "↩️",
      title: "Chính sách hoàn tiền",
      sections: [
        [
          "1. Điều kiện hoàn tiền",
          "Khách hàng được hoàn tiền 100% trong vòng 24 giờ kể từ thời điểm thanh toán nếu hệ thống gặp sự cố không thể cung cấp dịch vụ như cam kết.",
        ],
        [
          "2. Trường hợp không hoàn tiền",
          "Các gói cước đã kích hoạt thành công và đã sử dụng trên 30% hạn mức sẽ không thuộc diện hoàn tiền tự nguyện.",
        ],
        [
          "3. Thời gian xử lý",
          "Tiền sẽ được hoàn trả về tài khoản ngân hàng gốc của bạn trong vòng 24 đến 48 giờ làm việc sau khi yêu cầu được duyệt.",
        ],
        [
          "4. Cách gửi yêu cầu",
          "Nhắn tin qua Telegram @M_vuongQuyen123 hoặc gửi email tới nguyenlocdz2k7@gmail.com kèm mã đơn hàng và số tài khoản nhận hoàn.",
        ],
        [
          "5. Minh bạch giao dịch",
          "Mọi giao dịch hoàn tiền đều có biên lai xác nhận rõ ràng từ hệ thống.",
        ],
      ],
    },
    "lien-he": {
      icon: "📞",
      title: "Liên hệ hỗ trợ 24/7",
      sections: [
        [
          "1. Kênh hỗ trợ trực tiếp",
          "Telegram hỗ trợ kỹ thuật & thanh toán: @M_vuongQuyen123 (Phản hồi trong 5 phút).",
        ],
        ["2. Email hỗ trợ", "Hòm thư quản trị: nguyenlocdz2k7@gmail.com."],
        [
          "3. Giờ làm việc",
          "Hệ thống AI và cổng thanh toán vận hành tự động 24/7/365. Đội ngũ kỹ thuật trực hỗ trợ từ 08:00 - 23:00 hàng ngày.",
        ],
        [
          "4. Đóng góp ý kiến",
          "Chúng tôi luôn lắng nghe phản hồi của người dùng để nâng cấp chất lượng mô hình AI và tính năng mới.",
        ],
        [
          "5. Hợp tác & Tích hợp",
          "Liên hệ để đăng ký giải pháp API AI số lượng lớn cho doanh nghiệp.",
        ],
      ],
    },
  } as const;

  return (
    <div className="relative min-h-screen overflow-x-hidden bg-background font-body text-foreground antialiased selection:bg-primary/30">
      {/* Interactive Cursor Glow Effects */}
      <div
        ref={cursorGlowRef}
        className="pointer-events-none fixed left-0 top-0 z-0 hidden size-[420px] rounded-full bg-[#6366F1]/15 blur-[90px] will-change-transform sm:block"
        aria-hidden="true"
      />
      <div
        ref={cursorGlowSecondaryRef}
        className="pointer-events-none fixed left-0 top-0 z-0 hidden size-[290px] rounded-full bg-[#06B6D4]/12 blur-[80px] will-change-transform sm:block"
        aria-hidden="true"
      />

      {/* Atmospheric Aurora Lighting */}
      <div className="pointer-events-none absolute inset-0 overflow-hidden">
        <div
          className="absolute -top-40 -left-32 h-[560px] w-[560px] rounded-full bg-[#6366F1]/30 blur-[90px]"
          style={{ animation: "auroraShift 22s ease-in-out infinite" }}
        />
        <div
          className="absolute top-1/3 -right-24 h-[500px] w-[500px] rounded-full bg-[#8B5CF6]/25 blur-[90px]"
          style={{ animation: "auroraShift2 26s ease-in-out infinite" }}
        />
        <div
          className="absolute bottom-10 left-1/4 h-[440px] w-[640px] rounded-full bg-[#06B6D4]/20 blur-[90px]"
          style={{ animation: "auroraShift 30s ease-in-out infinite" }}
        />
      </div>

      <div className="relative z-10">
        {/* =========================================================
            HEADER & NAVBAR VỚI THÔNG TIN PROFILE / ĐĂNG NHẬP
        ========================================================= */}
        <header className="fixed inset-x-0 top-0 z-50 border-b border-line/40 bg-background/80 backdrop-blur-xl">
          <div className="mx-auto flex h-16 w-full max-w-[1400px] items-center justify-between px-4 sm:px-6">
            {/* Brand Logo */}
            <a
              href="#"
              className="group flex items-center gap-2.5 outline-none transition hover:opacity-95"
              aria-label="AI Video&Text Trang chủ"
            >
              <img
                src="/logo.png"
                alt="AI Video&amp;Text Logo"
                className="size-10 rounded-xl object-cover shadow-lg shadow-blue-500/25 transition-transform duration-300 group-hover:scale-105"
              />
              <div className="flex flex-col">
                <span className="font-display text-base font-bold tracking-tight sm:text-lg">
                  AI Video&amp;Text
                </span>
                <span className="font-mono text-[9px] uppercase tracking-wider text-muted-foreground">
                  Multimodal AI Studio
                </span>
              </div>
            </a>

            {/* Desktop Navigation Links */}
            <nav className="hidden items-center gap-1 md:flex">
              <a
                href="#studio"
                className="rounded-lg px-3 py-2 text-sm font-medium text-foreground transition hover:bg-panel"
              >
                AI Studio
              </a>
              <a
                href="#kho-luu-tru"
                className="rounded-lg px-3 py-2 text-sm font-medium text-muted-foreground transition hover:bg-panel hover:text-foreground"
              >
                Kho lưu trữ
              </a>
              <a
                href="#tai-nguyen"
                className="rounded-lg px-3 py-2 text-sm font-medium text-muted-foreground transition hover:bg-panel hover:text-foreground"
              >
                Hạ tầng
              </a>
              <a
                href="#bang-gia"
                className="rounded-lg px-3 py-2 text-sm font-medium text-muted-foreground transition hover:bg-panel hover:text-foreground"
              >
                Gói cước
              </a>
              <a
                href="#danh-gia"
                className="rounded-lg px-3 py-2 text-sm font-medium text-muted-foreground transition hover:bg-panel hover:text-foreground"
              >
                Đánh giá
              </a>
              <a
                href="#faq"
                className="rounded-lg px-3 py-2 text-sm font-medium text-muted-foreground transition hover:bg-panel hover:text-foreground"
              >
                FAQ
              </a>
            </nav>

            {/* Header Right Actions: User Profile or Login */}
            <div className="flex items-center gap-3">
              {/* Nút Admin Portal - CHỈ HIỆN KHI ĐĂNG NHẬP VỚI TÀI KHOẢN ADMIN */}
              {isAdmin && (
                <button
                  type="button"
                  onClick={() => setIsAdminModalOpen(true)}
                  className="inline-flex items-center gap-1.5 rounded-xl border border-amber-500/40 bg-gradient-to-r from-amber-500/20 to-primary/20 px-3.5 py-1.5 text-xs font-bold text-amber-300 shadow-md shadow-amber-500/10 hover:border-amber-400 hover:from-amber-500/30 hover:to-primary/30 transition active:scale-95"
                  title="Mở Bảng Quản Trị Hệ Thống"
                >
                  <Crown className="size-3.5 text-amber-400" />
                  <span>Quản trị Admin</span>
                </button>
              )}

              {/* Nút đăng nhập / Avatar cá nhân */}
              {user ? (
                <button
                  type="button"
                  onClick={() => setIsProfileModalOpen(true)}
                  className="flex items-center gap-2.5 rounded-full border border-white/15 bg-panel/80 py-1 pl-1 pr-3 text-left transition hover:border-primary/50 hover:bg-panel"
                >
                  <img
                    src={user.avatar}
                    alt={user.name}
                    className="size-7 rounded-full bg-white/10 object-contain p-0.5"
                  />
                  <div className="hidden flex-col sm:flex">
                    <span className="line-clamp-1 font-display text-xs font-semibold text-white">
                      {user.name}
                    </span>
                    <span
                      className={`font-mono text-[9px] uppercase font-bold ${
                        user.plan !== "free" ? "text-primary" : "text-muted-foreground"
                      }`}
                    >
                      {user.plan === "free" ? "Gói Free" : `Gói ${user.plan.toUpperCase()}`}
                    </span>
                  </div>
                </button>
              ) : (
                <button
                  type="button"
                  onClick={() => setIsLoginModalOpen(true)}
                  className="inline-flex items-center gap-1.5 rounded-xl border border-white/15 bg-panel/70 px-3.5 py-1.5 text-xs font-semibold text-white transition hover:border-primary/40 hover:bg-panel"
                >
                  <UserIcon className="size-3.5" />
                  <span>Đăng nhập</span>
                </button>
              )}

              <a
                href="#studio"
                className="btn-glow hidden items-center gap-1.5 rounded-xl px-3.5 py-1.5 text-xs font-semibold shadow-md sm:inline-flex"
              >
                <Zap className="size-3.5" />
                Trải nghiệm
              </a>

              {/* Mobile Hamburger Button */}
              <button
                type="button"
                onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
                className="grid size-10 place-items-center rounded-xl border border-line bg-panel/60 text-foreground transition hover:bg-panel md:hidden"
                aria-label="Mở menu"
              >
                {mobileMenuOpen ? <X className="size-5" /> : <Menu className="size-5" />}
              </button>
            </div>
          </div>

          {/* Mobile Sliding Drawer Navigation */}
          {mobileMenuOpen ? (
            <div className="border-b border-line bg-background/95 px-5 py-5 shadow-2xl backdrop-blur-2xl md:hidden">
              {/* User bar in mobile */}
              <div className="mb-4 pb-3 border-b border-line/40">
                {user ? (
                  <>
                    <div
                      onClick={() => {
                        setMobileMenuOpen(false);
                        setIsProfileModalOpen(true);
                      }}
                      className="flex cursor-pointer items-center justify-between"
                    >
                      <div className="flex items-center gap-3">
                        <img
                          src={user.avatar}
                          alt={user.name}
                          className="size-9 rounded-full bg-white/10 object-contain p-0.5"
                        />
                        <div>
                          <div className="font-display text-sm font-bold text-white">{user.name}</div>
                          <div className="font-mono text-xs text-primary font-semibold">
                            {user.plan === "free"
                              ? "Gói Free (Dùng thử)"
                              : `Gói ${user.plan.toUpperCase()} ✨`}
                          </div>
                        </div>
                      </div>
                      <span className="text-xs text-muted-foreground">Hồ sơ →</span>
                    </div>

                    {/* CHỈ HIỂN THỊ KHI TÀI KHOẢN CÓ QUYỀN ADMIN */}
                    {isAdmin && (
                      <button
                        type="button"
                        onClick={() => {
                          setMobileMenuOpen(false);
                          setIsAdminModalOpen(true);
                        }}
                        className="mt-3 flex w-full items-center justify-center gap-1.5 rounded-xl border border-amber-500/40 bg-gradient-to-r from-amber-500/20 to-primary/20 py-2 text-xs font-bold text-amber-300"
                      >
                        <Crown className="size-3.5 text-amber-400" />
                        <span>👑 Mở Bảng Quản Trị Admin</span>
                      </button>
                    )}
                  </>
                ) : (
                  <button
                    type="button"
                    onClick={() => {
                      setMobileMenuOpen(false);
                      setIsLoginModalOpen(true);
                    }}
                    className="flex w-full items-center justify-center gap-2 rounded-xl bg-white/10 py-2.5 text-xs font-semibold text-white"
                  >
                    <UserIcon className="size-4" />
                    <span>Đăng nhập / Đăng ký tài khoản</span>
                  </button>
                )}
              </div>

              <nav className="flex flex-col gap-1.5">
                <a
                  href="#studio"
                  onClick={() => setMobileMenuOpen(false)}
                  className="flex items-center justify-between rounded-lg px-3.5 py-2.5 text-sm font-medium text-foreground hover:bg-panel"
                >
                  <span>AI Studio</span>
                  <ChevronRight className="size-4 text-muted-foreground" />
                </a>
                <a
                  href="#kho-luu-tru"
                  onClick={() => setMobileMenuOpen(false)}
                  className="flex items-center justify-between rounded-lg px-3.5 py-2.5 text-sm font-medium text-foreground hover:bg-panel"
                >
                  <span>Kho lưu trữ</span>
                  <ChevronRight className="size-4 text-muted-foreground" />
                </a>
                <a
                  href="#tai-nguyen"
                  onClick={() => setMobileMenuOpen(false)}
                  className="flex items-center justify-between rounded-lg px-3.5 py-2.5 text-sm font-medium text-foreground hover:bg-panel"
                >
                  <span>Hạ tầng &amp; Quota</span>
                  <ChevronRight className="size-4 text-muted-foreground" />
                </a>
                <a
                  href="#bang-gia"
                  onClick={() => setMobileMenuOpen(false)}
                  className="flex items-center justify-between rounded-lg px-3.5 py-2.5 text-sm font-medium text-foreground hover:bg-panel"
                >
                  <span>Bảng giá &amp; Gói cước</span>
                  <ChevronRight className="size-4 text-muted-foreground" />
                </a>
                <a
                  href="#danh-gia"
                  onClick={() => setMobileMenuOpen(false)}
                  className="flex items-center justify-between rounded-lg px-3.5 py-2.5 text-sm font-medium text-foreground hover:bg-panel"
                >
                  <span>Đánh giá người dùng</span>
                  <ChevronRight className="size-4 text-muted-foreground" />
                </a>
                <a
                  href="#faq"
                  onClick={() => setMobileMenuOpen(false)}
                  className="flex items-center justify-between rounded-lg px-3.5 py-2.5 text-sm font-medium text-foreground hover:bg-panel"
                >
                  <span>Câu hỏi thường gặp</span>
                  <ChevronRight className="size-4 text-muted-foreground" />
                </a>
              </nav>
            </div>
          ) : null}
        </header>

        {/* =========================================================
            HERO SECTION
        ========================================================= */}
        <section className="mx-auto w-full max-w-[1400px] px-4 pt-28 pb-14 sm:px-6 sm:pt-36 sm:pb-20">
          <div className="flex flex-col items-center text-center">
            {/* Tag Badge */}
            <div className="rise-in mb-5 inline-flex items-center gap-2 rounded-full border border-primary/30 bg-primary/10 px-4 py-1.5 font-mono text-xs font-semibold uppercase tracking-[0.16em] text-primary shadow-sm">
              <Sparkles className="size-3.5" />
              Nền tảng Trí tuệ Nhân tạo Đa Phương thức
            </div>

            {/* Main Headline */}
            <h1 className="rise-in font-display text-[clamp(2.2rem,6vw,4.5rem)] font-bold leading-[1.08] tracking-tight text-foreground sm:max-w-4xl">
              Phân tích Thị giác &amp; Chuyển đổi{" "}
              <span className="gradient-text">Giọng Nói Sang Văn Bản</span>
            </h1>

            {/* Subtitle */}
            <p className="rise-in mt-5 max-w-2xl text-pretty text-base leading-relaxed text-muted-foreground sm:text-lg">
              Giải pháp AI hiệu năng cao: Nhận diện đối tượng, bóc tách chữ OCR tiếng Việt từ ảnh và
              phiên âm giọng nói chuẩn xác bằng Groq LPU &amp; Whisper Turbo.
            </p>

            {/* CTAs */}
            <div className="rise-in mt-8 flex flex-wrap items-center justify-center gap-4">
              <a
                href="#studio"
                className="btn-glow inline-flex items-center gap-2 rounded-xl px-6 py-3.5 font-display text-sm font-semibold shadow-lg hover:scale-[1.02] active:scale-95"
              >
                <span>Bắt đầu khám phá AI Studio</span>
                <ArrowRight className="size-4" />
              </a>
              <a
                href="#bang-gia"
                className="inline-flex items-center gap-2 rounded-xl border border-line bg-panel/70 px-6 py-3.5 font-display text-sm font-semibold text-foreground transition hover:border-primary/40 hover:bg-panel"
              >
                <span>Bảng giá &amp; Gói cước</span>
                <ChevronRight className="size-4 text-muted-foreground" />
              </a>
            </div>

            {/* Trust highlights banner */}
            <div className="rise-in mt-14 grid w-full max-w-4xl grid-cols-2 gap-4 rounded-2xl border border-line/60 bg-panel/30 p-4 sm:grid-cols-4 sm:p-6 backdrop-blur-sm">
              <div className="flex flex-col items-center justify-center p-2 text-center">
                <span className="font-display text-2xl font-bold text-foreground sm:text-3xl">
                  {stats ? num(stats.total) : "1,200+"}
                </span>
                <span className="mt-1 font-mono text-xs text-muted-foreground">
                  Lượt nhận dạng AI
                </span>
              </div>
              <div className="flex flex-col items-center justify-center p-2 text-center border-l border-line/40">
                <span className="font-display text-2xl font-bold text-primary sm:text-3xl">
                  {stats ? `${num(stats.avg_latency_ms)}ms` : "< 1.2s"}
                </span>
                <span className="mt-1 font-mono text-xs text-muted-foreground">
                  Độ trễ trung bình
                </span>
              </div>
              <div className="flex flex-col items-center justify-center p-2 text-center border-l border-line/40">
                <span className="font-display text-2xl font-bold text-emerald-400 sm:text-3xl">
                  99.2%
                </span>
                <span className="mt-1 font-mono text-xs text-muted-foreground">
                  Chuẩn tiếng Việt
                </span>
              </div>
              <div className="flex flex-col items-center justify-center p-2 text-center border-l border-line/40">
                <span className="font-display text-2xl font-bold text-cyan-400 sm:text-3xl">
                  100%
                </span>
                <span className="mt-1 font-mono text-xs text-muted-foreground">
                  Bảo mật dữ liệu
                </span>
              </div>
            </div>
          </div>
        </section>

        {/* =========================================================
            CORE AI STUDIO & WORKSPACE (#studio)
        ========================================================= */}
        <section id="studio" className="mx-auto w-full max-w-[1400px] px-4 py-8 sm:px-6 sm:py-12">
          {/* Studio Header & Segmented Tab Controls */}
          <div className="mb-6 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <div className="inline-flex items-center gap-1.5 font-mono text-xs font-semibold uppercase tracking-wider text-primary">
                <Zap className="size-3.5" />
                Trung tâm xử lý AI
              </div>
              <h2 className="mt-1 font-display text-2xl font-bold tracking-tight text-foreground sm:text-3xl">
                Không gian làm việc Đa Phương thức
              </h2>
            </div>

            {/* Segmented Mode Selector Tabs */}
            <div className="flex items-center rounded-xl border border-line bg-panel/70 p-1.5 backdrop-blur-md">
              <button
                type="button"
                onClick={() => setActiveStudioTab("image")}
                className={`flex items-center gap-2 rounded-lg px-4 py-2 font-display text-xs font-semibold transition-all sm:text-sm ${
                  activeStudioTab === "image"
                    ? "bg-primary text-white shadow-md shadow-primary/30"
                    : "text-muted-foreground hover:text-foreground"
                }`}
              >
                <Camera className="size-4" />
                <span>Thị giác &amp; OCR</span>
              </button>

              <button
                type="button"
                onClick={() => setActiveStudioTab("audio")}
                className={`flex items-center gap-2 rounded-lg px-4 py-2 font-display text-xs font-semibold transition-all sm:text-sm ${
                  activeStudioTab === "audio"
                    ? "bg-primary text-white shadow-md shadow-primary/30"
                    : "text-muted-foreground hover:text-foreground"
                }`}
              >
                <Mic className="size-4" />
                <span>Giọng nói sang Văn bản</span>
              </button>

              <button
                type="button"
                onClick={() => setActiveStudioTab("tts")}
                className={`flex items-center gap-2 rounded-lg px-4 py-2 font-display text-xs font-semibold transition-all sm:text-sm ${
                  activeStudioTab === "tts"
                    ? "bg-primary text-white shadow-md shadow-primary/30"
                    : "text-muted-foreground hover:text-foreground"
                }`}
              >
                <Volume2 className="size-4" />
                <span>Đọc Văn bản (TTS)</span>
              </button>
            </div>
          </div>

          {/* Studio Main Workspace Grid */}
          <div className="grid gap-6 lg:grid-cols-12 lg:gap-8">
            {/* ----------------- LEFT: INPUT & CONTROLS (7 Cols) ----------------- */}
            <div className="lg:col-span-7">
              <div className="glass-card flex min-h-[520px] flex-col justify-between rounded-2xl p-5 sm:p-7">
                {/* TAB 1: THỊ GIÁC AI & OCR */}
                {activeStudioTab === "image" ? (
                  <div>
                    <div className="mb-4 flex items-center justify-between border-b border-line/40 pb-3">
                      <div className="flex items-center gap-2">
                        <Camera className="size-5 text-primary" />
                        <h3 className="font-display text-base font-semibold text-foreground sm:text-lg">
                          Phân tích hình ảnh &amp; Trích xuất OCR
                        </h3>
                      </div>
                      <span className="font-mono text-xs text-muted-foreground">
                        Qwen Vision 27B LPU
                      </span>
                    </div>

                    {/* Hidden input */}
                    <input
                      ref={fileInput}
                      type="file"
                      accept="image/png,image/jpeg,image/webp,image/jpg"
                      multiple
                      className="hidden"
                      onChange={(e) => {
                        const files = Array.from(e.target.files ?? []);
                        if (files.length) void handleSelectFiles(files);
                        e.target.value = "";
                      }}
                    />

                    {/* Drag and drop zone */}
                    <div
                      onDragOver={(e) => {
                        e.preventDefault();
                        setIsDragOver(true);
                      }}
                      onDragLeave={() => setIsDragOver(false)}
                      onDrop={(e) => {
                        e.preventDefault();
                        setIsDragOver(false);
                        const files = Array.from(e.dataTransfer.files ?? []);
                        if (files.length) void handleSelectFiles(files);
                      }}
                      onClick={() => fileInput.current?.click()}
                      className={`group relative flex cursor-pointer flex-col items-center justify-center rounded-2xl border-2 border-dashed p-8 text-center transition-all ${
                        isDragOver
                          ? "border-primary bg-primary/10 shadow-lg shadow-primary/20"
                          : "border-line/70 bg-panel/30 hover:border-primary/50 hover:bg-panel/50"
                      }`}
                    >
                      <div className="grid size-14 place-items-center rounded-2xl bg-primary/10 text-primary transition group-hover:scale-110 group-hover:bg-primary group-hover:text-white">
                        <UploadCloud className="size-7" />
                      </div>
                      <h4 className="mt-3 font-display text-base font-semibold text-foreground">
                        Kéo thả ảnh vào đây hoặc nhấp để chọn tệp
                      </h4>
                      <p className="mt-1 text-xs text-muted-foreground">
                        Hỗ trợ PNG, JPG, JPEG, WEBP · Có thể chọn tải lên nhiều ảnh cùng lúc
                      </p>
                      <div className="mt-3 flex gap-2 font-mono text-[10px] text-muted-foreground">
                        <span className="rounded-md border border-line px-2 py-0.5">PNG</span>
                        <span className="rounded-md border border-line px-2 py-0.5">JPG</span>
                        <span className="rounded-md border border-line px-2 py-0.5">WEBP</span>
                        <span className="rounded-md border border-line px-2 py-0.5">
                          Tối đa 10MB
                        </span>
                      </div>
                    </div>

                    {/* Image thumbnails list if uploaded */}
                    {imageFiles.length ? (
                      <div className="mt-4">
                        <div className="mb-2 flex items-center justify-between">
                          <span className="font-mono text-xs font-semibold text-foreground">
                            Đã chọn {imageFiles.length} tệp hình ảnh:
                          </span>
                          <button
                            type="button"
                            onClick={() => {
                              setImageFiles([]);
                              setImageResult(null);
                              setImageError(null);
                            }}
                            className="font-mono text-xs text-rose-400 hover:underline"
                          >
                            Xóa tất cả
                          </button>
                        </div>
                        <div className="grid grid-cols-3 gap-2.5 sm:grid-cols-4 sm:gap-3">
                          {imageFiles.map((file, idx) => (
                            <div
                              key={`${file.name}-${idx}`}
                              className="group relative aspect-square overflow-hidden rounded-xl border border-line bg-background/60"
                            >
                              <img
                                src={file.url}
                                alt={file.name}
                                className="size-full object-cover transition group-hover:scale-105"
                              />
                              <button
                                type="button"
                                onClick={(e) => {
                                  e.stopPropagation();
                                  removeImage(idx);
                                }}
                                className="absolute right-1.5 top-1.5 grid size-6 place-items-center rounded-full bg-black/70 text-white opacity-0 transition group-hover:opacity-100 hover:bg-rose-600"
                                title="Xóa ảnh này"
                              >
                                <X className="size-3.5" />
                              </button>
                              <div className="absolute inset-x-0 bottom-0 truncate bg-black/60 px-2 py-1 font-mono text-[10px] text-white backdrop-blur-sm">
                                {file.name}
                              </div>
                            </div>
                          ))}
                        </div>
                      </div>
                    ) : null}

                    {/* Groq Token Quota Status */}
                    {groqRateLimit ? (
                      <div className="mt-4 rounded-xl border border-line/60 bg-panel/40 p-3.5">
                        <div className="flex flex-wrap items-center justify-between gap-2 font-mono text-xs">
                          <span className="text-muted-foreground">
                            Hạn ngạch Token Groq Vision:
                          </span>
                          <span className="font-semibold text-foreground">
                            {groqRateLimit.remainingTokens.toLocaleString("vi-VN")} /{" "}
                            {groqRateLimit.limitTokens.toLocaleString("vi-VN")} tokens
                          </span>
                        </div>
                        <div className="mt-2 h-1.5 overflow-hidden rounded-full bg-background/60">
                          <div
                            className={`h-full rounded-full transition-all duration-500 ${
                              groqRateLimit.remainingTokens / groqRateLimit.limitTokens < 0.15
                                ? "bg-rose-500"
                                : "bg-primary"
                            }`}
                            style={{
                              width: `${Math.round(
                                (groqRateLimit.remainingTokens / groqRateLimit.limitTokens) * 100,
                              )}%`,
                            }}
                          />
                        </div>
                        <div className="mt-2 flex items-center justify-between font-mono text-[10px] text-muted-foreground">
                          <span>~{num(estimatedImagesAvailable)} ảnh còn lại trong chu kỳ</span>
                          <span>
                            Làm mới sau:{" "}
                            <b className="text-foreground">
                              {groqResetSeconds > 0 ? `${groqResetSeconds}s` : "Sẵn sàng"}
                            </b>
                          </span>
                        </div>
                      </div>
                    ) : null}

                    {/* Action buttons */}
                    <div className="mt-5 flex flex-wrap items-center gap-3">
                      <button
                        type="button"
                        onClick={() => void executeImageAnalysis()}
                        disabled={imageBusy || !imageFiles.length}
                        className="btn-glow inline-flex items-center gap-2 rounded-xl px-6 py-3 font-display text-sm font-semibold shadow-md disabled:cursor-not-allowed disabled:opacity-50"
                      >
                        {imageBusy ? (
                          <>
                            <RefreshCw className="size-4 animate-spin" />
                            <span>
                              {imageBatchProgress.total > 1
                                ? `Đang phân tích (${imageBatchProgress.done}/${imageBatchProgress.total})...`
                                : "Đang xử lý hình ảnh..."}
                            </span>
                          </>
                        ) : (
                          <>
                            <Sparkles className="size-4" />
                            <span>Bắt đầu phân tích AI ({imageFiles.length} ảnh)</span>
                          </>
                        )}
                      </button>

                      <button
                        type="button"
                        onClick={() => fileInput.current?.click()}
                        disabled={imageBusy}
                        className="rounded-xl border border-line bg-panel/50 px-4 py-3 text-sm font-medium text-foreground transition hover:bg-panel disabled:opacity-50"
                      >
                        Thêm ảnh khác
                      </button>
                    </div>

                    {imageBatchProgress.status ? (
                      <p className="mt-3 font-mono text-xs text-amber-400">
                        {imageBatchProgress.status}
                      </p>
                    ) : null}
                    {imageError ? (
                      <p className="mt-3 font-mono text-xs text-rose-400">{imageError}</p>
                    ) : null}
                  </div>
                ) : null}

                {/* TAB 2: GIỌNG NÓI SANG VĂN BẢN (STT) */}
                {activeStudioTab === "audio" ? (
                  <div>
                    <div className="mb-4 flex items-center justify-between border-b border-line/40 pb-3">
                      <div className="flex items-center gap-2">
                        <Mic className="size-5 text-amber-400" />
                        <h3 className="font-display text-base font-semibold text-foreground sm:text-lg">
                          Ghi âm giọng nói &amp; Phiên âm Whisper
                        </h3>
                      </div>
                      <span className="font-mono text-xs text-muted-foreground">
                        Whisper Large v3 Turbo
                      </span>
                    </div>

                    {/* Interactive Recording Panel */}
                    <div className="flex flex-col items-center justify-center rounded-2xl border border-line/60 bg-panel/30 p-8 text-center">
                      {/* Big Glowing Mic Button */}
                      <button
                        type="button"
                        onClick={() => void toggleRecording()}
                        disabled={audioBusy}
                        className={`relative grid size-24 place-items-center rounded-full transition-all duration-300 disabled:opacity-50 ${
                          recording
                            ? "bg-rose-500 text-white shadow-[0_0_40px_rgba(244,63,94,0.6)] animate-pulse"
                            : "bg-amber-400/20 text-amber-400 hover:scale-105 hover:bg-amber-400 hover:text-black shadow-lg"
                        }`}
                        title={recording ? "Nhấp để dừng ghi âm" : "Nhấp để bắt đầu ghi âm"}
                      >
                        {recording ? (
                          <Square className="size-9 fill-current" />
                        ) : (
                          <Mic className="size-9" />
                        )}
                      </button>

                      {/* Timer & Status */}
                      <div className="mt-5 text-center">
                        {recording ? (
                          <div className="flex items-center gap-2 text-rose-400 font-mono text-lg font-bold">
                            <span className="size-2 rounded-full bg-rose-500 animate-ping" />
                            Đang thu âm: {Math.floor(recordingSeconds / 60)}:
                            {(recordingSeconds % 60).toString().padStart(2, "0")}
                          </div>
                        ) : audioBusy ? (
                          <div className="flex items-center gap-2 text-primary font-mono text-sm">
                            <RefreshCw className="size-4 animate-spin" />
                            Đang phiên âm giọng nói bằng Whisper...
                          </div>
                        ) : (
                          <div>
                            <h4 className="font-display text-base font-semibold text-foreground">
                              Nhấp vào micro để bắt đầu thu âm
                            </h4>
                            <p className="mt-1 text-xs text-muted-foreground">
                              Hoặc bạn có thể tải lên tệp âm thanh có sẵn bên dưới
                            </p>
                          </div>
                        )}
                      </div>

                      {/* Dynamic Audio Visualizer wave */}
                      <div className="mt-6 flex h-12 w-full max-w-xs items-center justify-center gap-1.5">
                        {levels.slice(-20).map((lvl, idx) => (
                          <span
                            key={idx}
                            className={`w-1 rounded-full transition-all duration-100 ${
                              recording ? "bg-amber-400" : "bg-panel-2"
                            }`}
                            style={{
                              height: recording
                                ? `${Math.max(15, lvl * 100)}%`
                                : `${15 + (idx % 4) * 6}%`,
                            }}
                          />
                        ))}
                      </div>
                    </div>

                    {/* Or upload audio file alternative */}
                    <div className="mt-6 border-t border-line/40 pt-4">
                      <div className="flex flex-wrap items-center justify-between gap-3">
                        <span className="font-mono text-xs text-muted-foreground">
                          Hoặc tải file từ thiết bị (MP3, WAV, M4A, WebM):
                        </span>

                        <input
                          ref={audioFileInput}
                          type="file"
                          accept="audio/*,.mp3,.wav,.m4a,.webm,.ogg"
                          className="hidden"
                          onChange={(e) => {
                            const file = e.target.files?.[0];
                            if (file) void handleAudioFileUpload(file);
                            e.target.value = "";
                          }}
                        />

                        <button
                          type="button"
                          onClick={() => audioFileInput.current?.click()}
                          disabled={recording || audioBusy}
                          className="inline-flex items-center gap-2 rounded-xl border border-line bg-panel/60 px-4 py-2.5 text-xs font-semibold text-foreground transition hover:border-primary/40 hover:bg-panel disabled:opacity-50"
                        >
                          <FileAudio className="size-4 text-primary" />
                          <span>Tải tệp âm thanh</span>
                        </button>
                      </div>

                      {audioError ? (
                        <p className="mt-3 font-mono text-xs text-rose-400">{audioError}</p>
                      ) : null}
                    </div>
                  </div>
                ) : null}

                {/* TAB 3: ĐỌC VĂN BẢN (TTS) */}
                {activeStudioTab === "tts" ? (
                  <div>
                    <div className="mb-4 flex items-center justify-between border-b border-line/40 pb-3">
                      <div className="flex items-center gap-2">
                        <Volume2 className="size-5 text-cyan-400" />
                        <h3 className="font-display text-base font-semibold text-foreground sm:text-lg">
                          Chuyển đổi Văn bản thành Giọng nói (TTS)
                        </h3>
                      </div>
                      <span className="font-mono text-xs text-muted-foreground">
                        SpeechSynthesis vi-VN
                      </span>
                    </div>

                    {/* Text input area */}
                    <div className="space-y-3">
                      <div className="flex items-center justify-between">
                        <label
                          htmlFor="tts-textarea"
                          className="font-mono text-xs text-muted-foreground"
                        >
                          Nhập văn bản cần phát âm tiếng Việt:
                        </label>
                        <span className="font-mono text-xs text-muted-foreground">
                          {ttsText.length} ký tự
                        </span>
                      </div>

                      <textarea
                        id="tts-textarea"
                        rows={6}
                        value={ttsText}
                        onChange={(e) => setTtsText(e.target.value)}
                        placeholder="Nhập bất kỳ đoạn văn bản tiếng Việt nào vào đây để nghe giọng đọc tự nhiên, hoặc tải lên tệp .txt từ máy..."
                        className="w-full resize-none rounded-xl border border-line bg-background/50 p-4 text-sm leading-relaxed text-foreground placeholder:text-muted-foreground/50 focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary"
                      />
                    </div>

                    {/* File upload for txt & Speed selector */}
                    <div className="mt-4 flex flex-wrap items-center justify-between gap-3">
                      <input
                        ref={txtFileInput}
                        type="file"
                        accept=".txt,text/plain"
                        className="hidden"
                        onChange={async (e) => {
                          const file = e.target.files?.[0];
                          if (!file) return;
                          try {
                            const text = await file.text();
                            setTextFile({ name: file.name, text });
                            setTtsText(text);
                            toast.success(`Đã nạp văn bản từ tệp ${file.name}`);
                          } catch {
                            toast.error("Không đọc được tệp .txt");
                          }
                          e.target.value = "";
                        }}
                      />

                      <div className="flex items-center gap-2">
                        <button
                          type="button"
                          onClick={() => txtFileInput.current?.click()}
                          className="inline-flex items-center gap-1.5 rounded-lg border border-line bg-panel/50 px-3 py-1.5 font-mono text-xs text-muted-foreground transition hover:text-foreground"
                        >
                          <FileText className="size-3.5 text-primary" />
                          <span>Tải file .txt</span>
                        </button>
                        {textFile ? (
                          <span className="truncate max-w-[140px] font-mono text-[11px] text-foreground">
                            {textFile.name}
                          </span>
                        ) : null}
                      </div>

                      {/* Speed selector */}
                      <div className="flex items-center gap-1.5 font-mono text-xs">
                        <span className="text-muted-foreground">Tốc độ:</span>
                        {[0.8, 1.0, 1.2].map((speed) => (
                          <button
                            key={speed}
                            type="button"
                            onClick={() => setTtsSpeed(speed)}
                            className={`rounded-md px-2 py-0.5 transition ${
                              ttsSpeed === speed
                                ? "bg-primary text-white font-bold"
                                : "bg-panel text-muted-foreground hover:text-foreground"
                            }`}
                          >
                            {speed}x
                          </button>
                        ))}
                      </div>
                    </div>

                    {/* Action buttons */}
                    <div className="mt-6 flex flex-wrap items-center gap-3">
                      <button
                        type="button"
                        onClick={() => speakText(ttsText)}
                        disabled={ttsSpeaking || !ttsText.trim()}
                        className="btn-glow inline-flex items-center gap-2 rounded-xl px-6 py-3 font-display text-sm font-semibold shadow-md disabled:opacity-50"
                      >
                        <Play className="size-4" />
                        <span>Phát giọng đọc</span>
                      </button>

                      {ttsSpeaking ? (
                        <button
                          type="button"
                          onClick={stopTextToSpeech}
                          className="inline-flex items-center gap-2 rounded-xl border border-rose-500/40 bg-rose-500/10 px-5 py-3 text-sm font-semibold text-rose-400 transition hover:bg-rose-500/20"
                        >
                          <Square className="size-4 fill-current" />
                          <span>Dừng đọc</span>
                        </button>
                      ) : null}

                      <button
                        type="button"
                        onClick={() => {
                          setTtsText("");
                          setTextFile(null);
                          stopTextToSpeech();
                        }}
                        className="rounded-xl border border-line bg-panel/50 px-4 py-3 text-sm font-medium text-muted-foreground transition hover:text-foreground"
                      >
                        Xóa nội dung
                      </button>
                    </div>
                  </div>
                ) : null}

                {/* Footer notes */}
                <div className="mt-6 border-t border-line/40 pt-3 text-xs text-muted-foreground flex items-center justify-between">
                  <span className="flex items-center gap-1.5">
                    <ShieldCheck className="size-3.5 text-emerald-400" />
                    Bảo mật mã hóa đầu cuối 100%
                  </span>
                  <span className="font-mono text-[11px]">Groq Vision &amp; Whisper Turbo</span>
                </div>
              </div>
            </div>

            {/* ----------------- RIGHT: RESULTS PANEL (5 Cols) ----------------- */}
            <div className="lg:col-span-5">
              <div className="glass-card flex min-h-[520px] flex-col justify-between rounded-2xl p-5 sm:p-7">
                <div>
                  <div className="mb-4 flex items-center justify-between border-b border-line/40 pb-3">
                    <div className="flex items-center gap-2">
                      <Sparkles className="size-5 text-primary" />
                      <h3 className="font-display text-base font-semibold text-foreground sm:text-lg">
                        Bảng Kết Quả AI
                      </h3>
                    </div>

                    {/* Quick copy / download toolbar */}
                    {(imageResult || transcript || ttsText) && (
                      <div className="flex items-center gap-1.5">
                        <button
                          type="button"
                          onClick={() => {
                            const payload =
                              activeStudioTab === "image"
                                ? `${imageResult?.summary ?? ""}\n\n[OCR]:\n${imageResult?.text ?? ""}`
                                : activeStudioTab === "audio"
                                  ? (transcript?.text ?? "")
                                  : ttsText;
                            copyToClipboard(payload, "toàn bộ kết quả");
                          }}
                          className="flex size-8 items-center justify-center rounded-lg border border-line bg-panel text-muted-foreground transition hover:text-primary"
                          title="Sao chép kết quả"
                        >
                          <Copy className="size-4" />
                        </button>

                        <button
                          type="button"
                          onClick={() => {
                            const content =
                              activeStudioTab === "image"
                                ? `TÓM TẮT HÌNH ẢNH:\n${imageResult?.summary ?? ""}\n\nVĂN BẢN TRÍCH XUẤT (OCR):\n${imageResult?.text ?? ""}\n\nNHÃN ĐỐI TƯỢNG:\n${imageResult?.labels.map((l) => `${l.label} (${l.confidence}%)`).join(", ") ?? ""}`
                                : (transcript?.text ?? ttsText);
                            downloadTextFile(content, `ket-qua-ai-${Date.now()}.txt`);
                          }}
                          className="flex size-8 items-center justify-center rounded-lg border border-line bg-panel text-muted-foreground transition hover:text-primary"
                          title="Tải tệp .txt kết quả"
                        >
                          <Download className="size-4" />
                        </button>
                      </div>
                    )}
                  </div>

                  {/* DISPLAY RESULT ACCORDING TO STATE */}
                  {/* Image Result Display */}
                  {imageResult ? (
                    <div className="space-y-4">
                      {/* Summary */}
                      {imageResult.summary ? (
                        <div className="rounded-xl border border-line/60 bg-panel/30 p-4">
                          <span className="font-mono text-xs uppercase tracking-wider text-primary font-semibold">
                            Mô tả tổng quan hình ảnh:
                          </span>
                          <p className="mt-2 text-sm leading-relaxed text-foreground/90 whitespace-pre-wrap">
                            {imageResult.summary}
                          </p>
                        </div>
                      ) : null}

                      {/* OCR Text Box */}
                      {imageResult.text ? (
                        <div className="rounded-xl border border-line/60 bg-panel/30 p-4">
                          <div className="flex items-center justify-between">
                            <span className="font-mono text-xs uppercase tracking-wider text-emerald-400 font-semibold">
                              Văn bản trích xuất (OCR):
                            </span>
                            <button
                              type="button"
                              onClick={() => copyToClipboard(imageResult.text ?? "", "văn bản OCR")}
                              className="inline-flex items-center gap-1 font-mono text-[11px] text-muted-foreground hover:text-foreground"
                            >
                              <Copy className="size-3" />
                              Sao chép
                            </button>
                          </div>
                          <div className="mt-2 max-h-40 overflow-y-auto whitespace-pre-wrap rounded-lg bg-background/50 p-3 font-mono text-xs leading-relaxed text-foreground">
                            {imageResult.text}
                          </div>
                        </div>
                      ) : null}

                      {/* Detected Labels with confidence bar */}
                      {imageResult.labels.length ? (
                        <div>
                          <span className="mb-2.5 block font-mono text-xs uppercase tracking-wider text-muted-foreground">
                            Nhãn nhận diện ({imageResult.labels.length} đối tượng):
                          </span>
                          <div className="space-y-2.5">
                            {imageResult.labels.slice(0, 7).map((l, i) => (
                              <div key={`${l.label}-${i}`} className="rise-in">
                                <div className="mb-1 flex justify-between text-xs">
                                  <span className="font-medium text-foreground">{l.label}</span>
                                  <span className="font-mono text-primary font-semibold">
                                    {l.confidence.toFixed(1)}%
                                  </span>
                                </div>
                                <div className="h-1.5 overflow-hidden rounded-full bg-background/70">
                                  <div
                                    className="h-full rounded-full bg-primary transition-all duration-700"
                                    style={{ width: `${l.confidence}%` }}
                                  />
                                </div>
                              </div>
                            ))}
                          </div>
                        </div>
                      ) : null}
                    </div>
                  ) : null}

                  {/* Audio Transcript Display */}
                  {transcript ? (
                    <div className="space-y-4">
                      <div className="rounded-xl border border-line/60 bg-panel/30 p-4">
                        <div className="flex items-center justify-between">
                          <span className="font-mono text-xs uppercase tracking-wider text-amber-400 font-semibold">
                            Nội dung văn bản nhận dạng:
                          </span>
                          <span className="font-mono text-[11px] text-emerald-400">
                            ✓ Whisper Turbo
                          </span>
                        </div>
                        <blockquote className="mt-3 text-base italic leading-relaxed text-foreground/90 border-l-2 border-amber-400 pl-3">
                          “{transcript.text}”
                        </blockquote>
                        {transcript.durationMs > 0 && (
                          <div className="mt-3 font-mono text-xs text-muted-foreground">
                            Thời lượng: {(transcript.durationMs / 1000).toFixed(1)} giây
                          </div>
                        )}
                      </div>
                    </div>
                  ) : null}

                  {/* Empty state when no result yet */}
                  {!imageResult && !transcript && (
                    <div className="flex flex-col items-center justify-center py-16 text-center">
                      <div className="grid size-16 place-items-center rounded-2xl border border-line bg-panel/40 text-muted-foreground">
                        <Sparkles className="size-8" />
                      </div>
                      <h4 className="mt-4 font-display text-base font-semibold text-foreground">
                        Chưa có dữ liệu phân tích
                      </h4>
                      <p className="mt-1.5 max-w-xs text-xs leading-relaxed text-muted-foreground">
                        Tải hình ảnh lên hoặc ghi âm giọng nói ở cột bên trái để bắt đầu trải nghiệm
                        kết quả tức thì.
                      </p>
                    </div>
                  )}
                </div>

                {/* Status Bar */}
                <div className="mt-6 border-t border-line/40 pt-3">
                  <div className="flex items-center justify-between font-mono text-xs text-muted-foreground">
                    <span>Trạng thái kết quả:</span>
                    <span className="font-semibold text-emerald-400">
                      {imageResult || transcript ? "Sẵn sàng xuất tệp" : "Đang chờ thao tác"}
                    </span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* =========================================================
            MEDIA LIBRARY & STORAGE (#kho-luu-tru)
        ========================================================= */}
        <section
          id="kho-luu-tru"
          className="mx-auto w-full max-w-[1400px] px-4 py-16 sm:px-6 sm:py-24"
        >
          <div className="mb-8 flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
            <div>
              <div className="inline-flex items-center gap-1.5 font-mono text-xs font-semibold uppercase tracking-wider text-primary">
                <Database className="size-3.5" />
                Kho Dữ Liệu Đám Mây
              </div>
              <h2 className="mt-1 font-display text-2xl font-bold tracking-tight text-foreground sm:text-3xl">
                Lịch sử nhận dạng &amp; Kho lưu trữ
              </h2>
              <p className="mt-1 text-sm text-muted-foreground">
                Tất cả hình ảnh và âm thanh được lưu trữ phân tán an toàn trên Supabase Cloud
                Storage.
              </p>
            </div>

            {/* Filter tabs & Search Bar */}
            <div className="flex flex-wrap items-center gap-3">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
                <input
                  type="text"
                  value={historySearch}
                  onChange={(e) => setHistorySearch(e.target.value)}
                  placeholder="Tìm kiếm tệp..."
                  className="rounded-xl border border-line bg-panel/60 pl-9 pr-3.5 py-1.5 font-mono text-xs text-foreground placeholder:text-muted-foreground/60 focus:border-primary focus:outline-none"
                />
              </div>

              <div className="flex items-center rounded-xl border border-line bg-panel/70 p-1">
                <button
                  type="button"
                  onClick={() => setHistoryFilter("all")}
                  className={`rounded-lg px-3 py-1 font-mono text-xs transition ${
                    historyFilter === "all"
                      ? "bg-primary text-white font-semibold"
                      : "text-muted-foreground hover:text-foreground"
                  }`}
                >
                  Tất cả
                </button>
                <button
                  type="button"
                  onClick={() => setHistoryFilter("image")}
                  className={`rounded-lg px-3 py-1 font-mono text-xs transition ${
                    historyFilter === "image"
                      ? "bg-primary text-white font-semibold"
                      : "text-muted-foreground hover:text-foreground"
                  }`}
                >
                  Ảnh
                </button>
                <button
                  type="button"
                  onClick={() => setHistoryFilter("audio")}
                  className={`rounded-lg px-3 py-1 font-mono text-xs transition ${
                    historyFilter === "audio"
                      ? "bg-primary text-white font-semibold"
                      : "text-muted-foreground hover:text-foreground"
                  }`}
                >
                  Ghi âm
                </button>
              </div>
            </div>
          </div>

          {/* History Cards Grid */}
          {filteredHistory.length ? (
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3 sm:gap-6">
              {filteredHistory.map((item) => (
                <article
                  key={item.id}
                  className="glass-card flex flex-col justify-between overflow-hidden rounded-2xl transition-all duration-300 hover:border-primary/40"
                >
                  <div>
                    {/* Media Header / Image Thumbnail */}
                    <div className="relative h-44 w-full overflow-hidden bg-background/60">
                      {item.signedUrl ? (
                        <button
                          type="button"
                          onClick={() => setSelectedImage(item)}
                          className="group relative size-full cursor-zoom-in"
                          title="Nhấp để phóng to ảnh"
                        >
                          <img
                            src={item.signedUrl}
                            alt={item.file_name ?? "Ảnh đã nhận dạng"}
                            loading="lazy"
                            className="size-full object-cover transition duration-300 group-hover:scale-105"
                          />
                          <div className="absolute inset-0 flex items-center justify-center bg-black/30 opacity-0 backdrop-blur-xs transition group-hover:opacity-100">
                            <span className="inline-flex items-center gap-1.5 rounded-full border border-white/20 bg-black/60 px-3 py-1 font-mono text-xs font-semibold text-white">
                              <ZoomIn className="size-3.5" />
                              Phóng to
                            </span>
                          </div>
                        </button>
                      ) : (
                        <div className="flex size-full flex-col items-center justify-center gap-2 text-amber-400">
                          <FileAudio className="size-8" />
                          <span className="font-mono text-xs font-semibold uppercase tracking-wider">
                            Bản ghi âm giọng nói
                          </span>
                        </div>
                      )}

                      <div className="absolute left-2.5 top-2.5 flex items-center gap-1 rounded-full bg-black/60 px-2.5 py-0.5 font-mono text-[10px] text-white/90 backdrop-blur-sm">
                        <Clock className="size-3" />
                        {formatTime(item.created_at)}
                      </div>

                      <div className="absolute right-2.5 top-2.5 rounded-full bg-black/60 px-2 py-0.5 font-mono text-[10px] text-primary backdrop-blur-sm">
                        {item.latency_ms}ms
                      </div>
                    </div>

                    {/* Content Details */}
                    <div className="p-4 sm:p-5">
                      <h4 className="truncate font-mono text-xs font-semibold text-foreground">
                        {item.file_name || (item.kind === "image" ? "Ảnh nhận dạng" : "Bản ghi âm")}
                      </h4>

                      <p className="mt-2 line-clamp-3 text-xs leading-relaxed text-muted-foreground">
                        {item.kind === "image"
                          ? item.summary || item.labels[0]?.label || "Chưa có mô tả"
                          : item.transcript || "(Không có nội dung)"}
                      </p>

                      {/* Labels / Tags */}
                      {item.labels?.length ? (
                        <div className="mt-3 flex flex-wrap gap-1.5">
                          {item.labels.slice(0, 3).map((l) => (
                            <span
                              key={l.label}
                              className="rounded-full bg-primary/15 px-2.5 py-0.5 font-mono text-[10px] text-primary"
                            >
                              #{l.label}
                            </span>
                          ))}
                        </div>
                      ) : null}
                    </div>
                  </div>

                  {/* Card Action footer */}
                  <div className="border-t border-line/40 p-4 pt-3 flex items-center justify-between">
                    <span className="font-mono text-[11px] text-muted-foreground">
                      {formatBytes(item.bytes)}
                    </span>

                    <button
                      type="button"
                      onClick={async () => {
                        const confirmed = window.confirm(
                          `Bạn có chắc chắn muốn xóa "${item.file_name ?? "tệp này"}" khỏi hệ thống?`,
                        );
                        if (!confirmed) return;

                        try {
                          await deleteHistoryItem(item.id, item.image_path);
                          toast.success("Đã xóa tệp thành công!");
                          refresh();
                        } catch {
                          toast.error("Không thể xóa tệp. Vui lòng thử lại.");
                        }
                      }}
                      className="inline-flex items-center gap-1 rounded-lg px-2.5 py-1 font-mono text-xs text-rose-400 transition hover:bg-rose-500/10"
                    >
                      <Trash2 className="size-3.5" />
                      Xóa tệp
                    </button>
                  </div>
                </article>
              ))}
            </div>
          ) : (
            <div className="rounded-2xl border border-line bg-panel/30 py-16 text-center">
              <Database className="mx-auto size-10 text-muted-foreground/60" />
              <h3 className="mt-4 font-display text-base font-semibold text-foreground">
                Kho lưu trữ chưa có dữ liệu phù hợp
              </h3>
              <p className="mt-1 text-xs text-muted-foreground">
                Hãy thực hiện một tác vụ phân tích hình ảnh hoặc ghi âm để lưu vào hệ thống.
              </p>
            </div>
          )}
        </section>

        {/* =========================================================
            INFRASTRUCTURE & SYSTEM DASHBOARD (#tai-nguyen)
        ========================================================= */}
        <section
          id="tai-nguyen"
          className="mx-auto w-full max-w-[1400px] px-4 py-16 sm:px-6 sm:py-24"
        >
          <div className="mb-10 flex flex-col gap-2 sm:flex-row sm:items-end sm:justify-between">
            <div>
              <div className="inline-flex items-center gap-1.5 font-mono text-xs font-semibold uppercase tracking-wider text-primary">
                <Activity className="size-3.5" />
                Giám Sát Vận Hành &amp; Hạ Tầng
              </div>
              <h2 className="mt-1 font-display text-2xl font-bold tracking-tight text-foreground sm:text-3xl">
                Bảng điều khiển tài nguyên Cloud
              </h2>
            </div>
            <span className="font-mono text-xs text-muted-foreground">
              {stats?.last_at
                ? `Cập nhật lần cuối: ${formatTime(stats.last_at)}`
                : "Đang kết nối..."}
            </span>
          </div>

          {/* 4 Cards Grid */}
          <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-4">
            {resources.map((r) => {
              const Icon = r.icon;
              return (
                <div
                  key={r.name}
                  className="glass-card flex flex-col justify-between rounded-2xl p-5 transition-all duration-300 hover:border-primary/40"
                >
                  <div className="flex items-center justify-between">
                    <span className="font-display text-sm font-semibold text-foreground">
                      {r.name}
                    </span>
                    <span
                      className={`inline-flex items-center gap-1 rounded-full px-2 py-0.5 font-mono text-[10px] ${
                        r.state === "warn"
                          ? "bg-amber-500/10 text-amber-400"
                          : "bg-emerald-500/10 text-emerald-400"
                      }`}
                    >
                      <span
                        className={`size-1.5 rounded-full ${
                          r.state === "warn" ? "bg-amber-400" : "bg-emerald-400 animate-pulse"
                        }`}
                      />
                      {r.status}
                    </span>
                  </div>

                  <div className="my-4 flex items-center justify-between">
                    <span className="font-mono text-2xl font-bold tracking-tight text-foreground sm:text-3xl">
                      {r.value}
                    </span>
                    <div className="grid size-10 place-items-center rounded-xl bg-primary/10 text-primary">
                      <Icon className="size-5" />
                    </div>
                  </div>

                  <div className="border-t border-line/40 pt-2 font-mono text-xs text-muted-foreground">
                    {r.meta}
                  </div>
                </div>
              );
            })}
          </div>

          {/* System Metrics Progress Bars */}
          <div className="glass-card mt-8 rounded-2xl p-6 sm:p-8">
            <h3 className="mb-6 font-display text-base font-semibold text-foreground">
              Thông số hiệu năng &amp; lưu lượng thời gian thực
            </h3>
            <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
              {metrics.map((m) => (
                <div key={m.label} className="space-y-2">
                  <div className="flex justify-between font-mono text-xs">
                    <span className="text-muted-foreground">{m.label}</span>
                    <span className="font-semibold text-foreground">{m.value}</span>
                  </div>
                  <div className="h-1.5 overflow-hidden rounded-full bg-background/70">
                    <div
                      className={`h-full rounded-full transition-all duration-700 ${m.color}`}
                      style={{ width: `${m.pct}%` }}
                    />
                  </div>
                  <div className="font-mono text-[11px] text-muted-foreground">{m.sub}</div>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* =========================================================
            MARKETING SECTIONS (Sponsors, Reviews, Pricing, FAQ)
        ========================================================= */}
        <Sponsors />
        <Reviews />
        <Pricing />
        <FAQ />

        {/* =========================================================
            IMAGE LIGHTBOX MODAL
        ========================================================= */}
        {selectedImage?.signedUrl ? (
          <div
            className="fixed inset-0 z-[100] flex items-center justify-center overflow-auto bg-black/85 p-3 backdrop-blur-md sm:p-6"
            onClick={() => setSelectedImage(null)}
          >
            <div
              className="relative flex max-h-[92vh] max-w-[94vw] flex-col items-center justify-center"
              onClick={(e) => e.stopPropagation()}
            >
              <img
                src={selectedImage.signedUrl}
                alt={selectedImage.file_name ?? "Xem chi tiết ảnh"}
                className="max-h-[75vh] max-w-[90vw] rounded-2xl object-contain shadow-2xl"
              />

              {/* Watermark NHÓM 6 */}
              <div
                className="pointer-events-none absolute inset-0 flex items-center justify-center overflow-hidden rounded-2xl"
                aria-hidden="true"
              >
                <div className="select-none -rotate-[24deg] font-display text-[clamp(2.5rem,7vw,5.5rem)] font-bold uppercase tracking-[0.2em] text-white/10 drop-shadow-md">
                  NHÓM 6
                </div>
              </div>

              {/* Close Button */}
              <button
                type="button"
                onClick={() => setSelectedImage(null)}
                className="absolute right-3 top-3 grid size-10 place-items-center rounded-full border border-white/20 bg-black/70 text-xl text-white transition hover:bg-rose-600"
                aria-label="Đóng ảnh"
              >
                ×
              </button>

              {/* Description bar */}
              <div className="mt-3 w-full max-w-xl rounded-xl border border-white/15 bg-black/75 p-4 text-center backdrop-blur-md">
                <div className="font-mono text-xs font-semibold text-white">
                  {selectedImage.file_name ?? "Ảnh đã nhận dạng"}
                </div>
                {selectedImage.summary ? (
                  <p className="mt-1 text-xs leading-relaxed text-white/80">
                    {selectedImage.summary}
                  </p>
                ) : null}
              </div>
            </div>
          </div>
        ) : null}

        {/* =========================================================
            POLICY MODAL
        ========================================================= */}
        {activePolicy ? (
          <div
            className="fixed inset-0 z-[110] flex items-center justify-center bg-black/75 p-4 backdrop-blur-md"
            role="dialog"
            aria-modal="true"
            aria-labelledby="policy-title"
            onMouseDown={(event) => {
              if (event.target === event.currentTarget) setActivePolicy(null);
            }}
          >
            <div className="flex max-h-[85vh] w-full max-w-3xl flex-col overflow-hidden rounded-2xl border border-white/15 bg-[#171b35] shadow-2xl">
              <div className="flex items-center justify-between border-b border-white/10 px-6 py-4">
                <div className="flex items-center gap-3">
                  <span className="text-xl">{policyContent[activePolicy].icon}</span>
                  <h3 id="policy-title" className="font-display text-lg font-bold text-white">
                    {policyContent[activePolicy].title}
                  </h3>
                </div>
                <button
                  type="button"
                  onClick={() => setActivePolicy(null)}
                  className="grid size-9 place-items-center rounded-full border border-white/15 text-lg text-white/70 transition hover:bg-white/10 hover:text-white"
                  aria-label="Đóng chính sách"
                >
                  ×
                </button>
              </div>

              <div className="overflow-y-auto px-6 py-5 sm:px-8 sm:py-6 text-sm leading-relaxed text-white/80 space-y-6">
                <p className="font-mono text-xs text-white/40">
                  Cập nhật lần cuối: 13/10/2026 · Phiên bản chính thức
                </p>
                {policyContent[activePolicy].sections.map(([heading, body]) => (
                  <section key={heading}>
                    <h4 className="mb-1 font-display font-semibold text-white">{heading}</h4>
                    <p>{body}</p>
                  </section>
                ))}
              </div>

              <div className="border-t border-white/10 px-6 py-4 text-right">
                <button
                  type="button"
                  onClick={() => setActivePolicy(null)}
                  className="btn-glow rounded-xl px-5 py-2 text-xs font-semibold"
                >
                  Đã hiểu &amp; Xác nhận
                </button>
              </div>
            </div>
          </div>
        ) : null}

        {/* =========================================================
            CÁC MODAL HỆ THỐNG AUTH & GÓI CƯỚC
        ========================================================= */}
        <AuthModal />
        <ProfileModal />
        <AvatarModal />
        <ChangePasswordModal />
        <GoogleAccountSelectModal />
        <AdminPanelModal />
        <TrialLimitModal isOpen={isTrialModalOpen} onClose={() => setIsTrialModalOpen(false)} />

        {/* =========================================================
            FLOATING SCROLL-TO-TOP BUTTON
        ========================================================= */}
        {showScrollTop ? (
          <button
            type="button"
            onClick={() => window.scrollTo({ top: 0, behavior: "smooth" })}
            className="fixed bottom-6 right-6 z-40 grid size-11 place-items-center rounded-full border border-primary/30 bg-primary text-white shadow-xl shadow-primary/40 transition hover:scale-110 active:scale-95"
            aria-label="Lên đầu trang"
          >
            <ArrowUp className="size-5" />
          </button>
        ) : null}

        {/* =========================================================
            BỐ CỤC CHÂN TRANG (FOOTER) GỌN GÀNG, CHUYÊN NGHIỆP
        ========================================================= */}
        {/* Banner CTA trước chân trang */}
        <div className="mx-auto w-full max-w-[1400px] px-4 pt-12 pb-6 sm:px-6">
          <div className="glass-card relative overflow-hidden rounded-3xl border border-primary/30 bg-gradient-to-r from-primary/20 via-panel/60 to-[#06B6D4]/15 p-8 text-center sm:p-12">
            <div className="relative z-10 mx-auto max-w-2xl">
              <span className="inline-flex items-center gap-1.5 rounded-full border border-primary/30 bg-primary/10 px-3 py-1 font-mono text-xs font-semibold uppercase tracking-wider text-primary">
                <Sparkles className="size-3.5" />
                Trải nghiệm thế hệ AI mới
              </span>
              <h3 className="mt-3 font-display text-2xl font-bold tracking-tight text-white sm:text-3xl">
                Sẵn sàng bứt phá hiệu suất công việc ngay hôm nay?
              </h3>
              <p className="mt-2 text-sm leading-relaxed text-muted-foreground">
                Tạo tài khoản miễn phí để nhận 1 lượt trải nghiệm thị giác AI &amp; giọng nói, hoặc
                nâng cấp gói cước để mở khóa không giới hạn tài nguyên.
              </p>
              <div className="mt-6 flex flex-wrap items-center justify-center gap-3">
                <a
                  href="#studio"
                  className="btn-glow inline-flex items-center gap-2 rounded-xl px-6 py-3 font-display text-xs font-semibold shadow-lg"
                >
                  <Zap className="size-4" />
                  <span>Thử nghiệm miễn phí</span>
                </a>
                <a
                  href="#bang-gia"
                  className="inline-flex items-center gap-2 rounded-xl border border-line bg-panel/80 px-6 py-3 font-display text-xs font-semibold text-white transition hover:bg-panel hover:border-primary/40"
                >
                  <Crown className="size-4 text-amber-400" />
                  <span>Xem các gói nâng cấp</span>
                </a>
              </div>
            </div>
          </div>
        </div>

        {/* Chân trang chính thức (Footer 4 cột chuẩn SaaS) */}
        <footer className="border-t border-line/50 bg-background/95">
          <div className="mx-auto w-full max-w-[1400px] px-4 py-12 sm:px-6 sm:py-16">
            <div className="grid gap-10 sm:grid-cols-2 lg:grid-cols-5">
              {/* Cột 1: Thông tin thương hiệu (2 Cột rộng trên desktop) */}
              <div className="lg:col-span-2">
                <div className="flex items-center gap-3">
                  <img
                    src="/logo.png"
                    alt="AI Video&amp;Text Logo"
                    className="size-10 rounded-xl object-cover shadow-md shadow-blue-500/20"
                  />
                  <div>
                    <span className="font-display text-lg font-bold text-foreground">
                      AI Video&amp;Text
                    </span>
                    <span className="block font-mono text-[10px] text-muted-foreground">
                      Multimodal Vision &amp; Speech Platform
                    </span>
                  </div>
                </div>

                <p className="mt-4 max-w-sm text-xs leading-relaxed text-muted-foreground">
                  Nền tảng trí tuệ nhân tạo nhận dạng hình ảnh, trích xuất văn bản tiếng Việt OCR và
                  chuyển đổi giọng nói thời gian thực với tốc độ xử lý siêu tốc qua Groq &amp;
                  Whisper.
                </p>

                <div className="mt-4 flex items-center gap-2 font-mono text-xs text-muted-foreground">
                  <span className="pulse-glow size-2 rounded-full bg-emerald-400" />
                  <span>
                    Trạng thái máy chủ: <b>99.98% Trực tuyến</b>
                  </span>
                </div>
              </div>

              {/* Cột 2: Sản phẩm & Công nghệ */}
              <div>
                <h4 className="font-display text-xs font-bold uppercase tracking-wider text-foreground">
                  Công nghệ &amp; Tính năng
                </h4>
                <ul className="mt-4 space-y-2.5 text-xs text-muted-foreground">
                  <li>
                    <a href="#studio" className="transition hover:text-primary">
                      Thị giác AI &amp; Nhận diện nhãn
                    </a>
                  </li>
                  <li>
                    <a href="#studio" className="transition hover:text-primary">
                      Trích xuất chữ viết (OCR)
                    </a>
                  </li>
                  <li>
                    <a href="#studio" className="transition hover:text-primary">
                      Phiên âm Whisper Turbo
                    </a>
                  </li>
                  <li>
                    <a href="#studio" className="transition hover:text-primary">
                      Đọc văn bản giọng nói (TTS)
                    </a>
                  </li>
                  <li>
                    <a href="#kho-luu-tru" className="transition hover:text-primary">
                      Kho lưu trữ đám mây
                    </a>
                  </li>
                </ul>
              </div>

              {/* Cột 3: Gói cước & Dịch vụ */}
              <div>
                <h4 className="font-display text-xs font-bold uppercase tracking-wider text-foreground">
                  Gói dịch vụ
                </h4>
                <ul className="mt-4 space-y-2.5 text-xs text-muted-foreground">
                  <li>
                    <a href="#bang-gia" className="transition hover:text-primary">
                      Dùng thử Miễn phí (0đ)
                    </a>
                  </li>
                  <li>
                    <a href="#bang-gia" className="transition hover:text-primary">
                      Gói Go (49.000đ/tháng)
                    </a>
                  </li>
                  <li>
                    <a href="#bang-gia" className="transition hover:text-primary">
                      Gói Pro VIP (149.000đ/tháng)
                    </a>
                  </li>
                  <li>
                    <a href="#bang-gia" className="transition hover:text-primary">
                      Gói Promax (399.000đ/tháng)
                    </a>
                  </li>
                  <li>
                    <a href="#bang-gia" className="transition hover:text-primary">
                      Thanh toán tự động VietQR
                    </a>
                  </li>
                </ul>
              </div>

              {/* Cột 4: Chính sách & Hỗ trợ */}
              <div>
                <h4 className="font-display text-xs font-bold uppercase tracking-wider text-foreground">
                  Chính sách &amp; Hỗ trợ
                </h4>
                <ul className="mt-4 space-y-2.5 text-xs text-muted-foreground">
                  <li>
                    <button
                      type="button"
                      onClick={() => setActivePolicy("dieu-khoan")}
                      className="text-left transition hover:text-primary"
                    >
                      Điều khoản dịch vụ
                    </button>
                  </li>
                  <li>
                    <button
                      type="button"
                      onClick={() => setActivePolicy("bao-mat")}
                      className="text-left transition hover:text-primary"
                    >
                      Chính sách bảo mật
                    </button>
                  </li>
                  <li>
                    <button
                      type="button"
                      onClick={() => setActivePolicy("thanh-toan")}
                      className="text-left transition hover:text-primary"
                    >
                      Chính sách thanh toán
                    </button>
                  </li>
                  <li>
                    <button
                      type="button"
                      onClick={() => setActivePolicy("hoan-tien")}
                      className="text-left transition hover:text-primary"
                    >
                      Chính sách hoàn tiền
                    </button>
                  </li>
                  <li>
                    <button
                      type="button"
                      onClick={() => setActivePolicy("lien-he")}
                      className="text-left transition hover:text-primary"
                    >
                      Liên hệ hỗ trợ 24/7
                    </button>
                  </li>
                </ul>
              </div>
            </div>

            {/* Dòng bản quyền chân trang */}
            <div className="mt-12 flex flex-col gap-4 border-t border-line/40 pt-8 sm:flex-row sm:items-center sm:justify-between text-xs text-muted-foreground font-mono">
              <div>
                © 2026 AI Video&amp;Text · Bản quyền và mã nguồn thuộc về <b>Nhóm 6</b>.
              </div>

              <div className="flex flex-wrap items-center gap-4">
                <span>Hỗ trợ Telegram:</span>
                <a
                  href="https://t.me/M_vuongQuyen123"
                  target="_blank"
                  rel="noreferrer"
                  className="font-semibold text-primary hover:underline"
                >
                  @M_vuongQuyen123
                </a>
                <span className="hidden sm:inline">·</span>
                <a
                  href="https://cdn.phototourl.com/member/2026-10-08-11292ae3-4ad5-4afa-9ad9-dbd21e0c94fd.png"
                  target="_blank"
                  rel="noreferrer"
                  className="text-white/80 hover:text-primary"
                >
                  Community Lạc Trôi
                </a>
              </div>
            </div>
          </div>
        </footer>
      </div>
    </div>
  );
}
