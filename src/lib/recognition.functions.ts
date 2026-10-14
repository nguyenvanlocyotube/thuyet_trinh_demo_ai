import { z } from "zod";
import { createServerFn } from "@tanstack/react-start";

const GROQ_API = "https://api.groq.com/openai/v1";

const imageSchema = z.object({
  dataUrl: z.string().min(32),
});

export type GroqRateLimit = {
  limitTokens: number;
  remainingTokens: number;
  resetTokensSeconds: number;
};

export type ImageResult = {
  labels: { label: string; confidence: number }[];
  summary: string;
  text: string | null;
  details?:
    | {
        scene: string;
        people: string;
        objects: string[];
        actions: string[];
        colors: string[];
        composition: string;
        visualStyle: string;
        importantDetails: string[];
      }
    | undefined;
  emotion?:
    | {
        detected: boolean;
        primary: string | null;
        confidence: number;
        evidence: string;
      }
    | undefined;
  rateLimit?: GroqRateLimit | undefined;
  usage?: { promptTokens: number; completionTokens: number; totalTokens: number } | undefined;
};

function readRateLimitHeaders(headers: Headers): GroqRateLimit | undefined {
  const limit = Number(headers.get("x-ratelimit-limit-tokens"));
  const remaining = Number(headers.get("x-ratelimit-remaining-tokens"));
  const resetRaw = headers.get("x-ratelimit-reset-tokens") ?? "";

  if (!Number.isFinite(limit) || !Number.isFinite(remaining)) {
    return undefined;
  }

  // Groq returns values such as "7.66s", "1m2.3s", or similar.
  let resetSeconds = 0;
  const minutes = resetRaw.match(/(\d+(?:\.\d+)?)m/);
  const seconds = resetRaw.match(/(\d+(?:\.\d+)?)s/);

  if (minutes) resetSeconds += Number(minutes[1]) * 60;
  if (seconds) resetSeconds += Number(seconds[1]);

  return {
    limitTokens: limit,
    remainingTokens: Math.max(0, remaining),
    resetTokensSeconds: Math.max(0, resetSeconds),
  };
}

function rateLimitErrorMessage(rateLimit: GroqRateLimit | undefined, body: string) {
  return `__GROQ_RATE_LIMIT__${JSON.stringify({
    rateLimit,
    body: body.slice(0, 500),
  })}`;
}

/* =========================
   NHẬN DẠNG HÌNH ẢNH
========================= */

export const analyzeImage = createServerFn({ method: "POST" })
  .inputValidator((data: unknown) => imageSchema.parse(data))
  .handler(async ({ data }): Promise<ImageResult> => {
    const apiKey = process.env["GROQ_API_KEY"];

    if (!apiKey) {
      throw new Error("Thiếu GROQ_API_KEY. Hãy thêm GROQ_API_KEY vào file .env.");
    }

    const res = await fetch(`${GROQ_API}/chat/completions`, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${apiKey}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "qwen/qwen3.8-27b",
        messages: [
          {
            role: "user",
            content: [
              {
                type: "text",
                text:
                  "Bạn là chuyên gia phân tích hình ảnh (vision analysis). " +
                  "Phân tích hình ảnh cực kỳ chi tiết và trả về DUY NHẤT JSON hợp lệ. " +
                  "Chỉ mô tả những gì thực sự nhìn thấy; không bịa và không suy đoán vô căn cứ. " +
                  "JSON bắt buộc có cấu trúc: " +
                  '{"labels":[{"label":"tên đối tượng bằng tiếng Việt","confidence":95}],"summary":"mô tả tổng quan chi tiết","text":"toàn bộ chữ đọc được trong ảnh hoặc null","details":{"scene":"bối cảnh/địa điểm","people":"mô tả người xuất hiện hoặc không có người","objects":["các vật thể quan trọng"],"actions":["các hành động nhìn thấy"],"colors":["các màu nổi bật"],"composition":"bố cục, vị trí và góc nhìn","visualStyle":"phong cách hình ảnh","importantDetails":["các chi tiết đáng chú ý"]},"emotion":{"detected":false,"primary":null,"confidence":0,"evidence":""}}. ' +
                  "labels có từ 5 đến 10 mục nếu ảnh đủ thông tin. " +
                  "confidence là số từ 0 đến 100. " +
                  "summary phải gồm 2 đến 4 câu mô tả tổng quan, không chỉ liệt kê đối tượng. " +
                  "scene mô tả bối cảnh. people mô tả số lượng người, vị trí và đặc điểm nhìn thấy. " +
                  "objects liệt kê vật thể quan trọng. actions chỉ mô tả hành động có thể quan sát. " +
                  "colors liệt kê màu nổi bật. composition mô tả bố cục, vị trí, góc chụp và điểm nhấn. " +
                  "visualStyle mô tả loại hình ảnh như ảnh chụp, logo, poster, tài liệu, minh họa hoặc giao diện. " +
                  "importantDetails liệt kê các chi tiết nhỏ nhưng đáng chú ý. " +
                  "text phải chứa TOÀN BỘ chữ đọc được trong ảnh, giữ nguyên ngôn ngữ và thứ tự tương đối; không có chữ thì null. " +
                  "Chỉ phân tích cảm xúc khi có người và đủ thông tin từ biểu hiện; không có người thì detected=false. " +
                  "Cảm xúc chỉ là suy luận từ biểu hiện nhìn thấy, không phải chẩn đoán tâm lý. " +
                  "Nếu không chắc chắn, ghi rõ không xác định thay vì bịa. " +
                  "Không thêm Markdown, giải thích ngoài JSON hoặc <think>.",
              },
              {
                type: "image_url",
                image_url: { url: data.dataUrl },
              },
            ],
          },
        ],
        reasoning_effort: "none",
        reasoning_format: "hidden",
        response_format: { type: "json_object" },
        temperature: 0.7,
        max_completion_tokens: 1800,
        stream: false,
      }),
    });

    const rateLimit = readRateLimitHeaders(res.headers);

    if (res.status === 429) {
      const body = await res.text().catch(() => "");
      throw new Error(rateLimitErrorMessage(rateLimit, body));
    }

    if (!res.ok) {
      const body = await res.text().catch(() => "");
      throw new Error(`Groq Vision API lỗi (${res.status}): ${body.slice(0, 500)}`);
    }

    const json = (await res.json()) as {
      choices?: {
        message?: {
          content?: string;
        };
      }[];
      usage?: {
        prompt_tokens?: number;
        completion_tokens?: number;
        total_tokens?: number;
      };
    };

    const raw = json.choices?.[0]?.message?.content?.trim() ?? "";

    if (!raw) {
      throw new Error("Groq không trả về kết quả nhận dạng hình ảnh.");
    }

    try {
      const parsed = JSON.parse(raw) as Partial<ImageResult>;

      return {
        labels: Array.isArray(parsed.labels)
          ? parsed.labels
              .filter((l) => l && typeof l.label === "string")
              .map((l) => ({
                label: String(l.label),
                confidence: Math.max(0, Math.min(100, Number(l.confidence) || 0)),
              }))
          : [],
        summary: typeof parsed.summary === "string" ? parsed.summary : "",
        text: typeof parsed.text === "string" ? parsed.text : null,
        details:
          parsed.details && typeof parsed.details === "object"
            ? {
                scene: typeof parsed.details.scene === "string" ? parsed.details.scene : "",
                people: typeof parsed.details.people === "string" ? parsed.details.people : "",
                objects: Array.isArray(parsed.details.objects)
                  ? parsed.details.objects.map(String)
                  : [],
                actions: Array.isArray(parsed.details.actions)
                  ? parsed.details.actions.map(String)
                  : [],
                colors: Array.isArray(parsed.details.colors)
                  ? parsed.details.colors.map(String)
                  : [],
                composition:
                  typeof parsed.details.composition === "string" ? parsed.details.composition : "",
                visualStyle:
                  typeof parsed.details.visualStyle === "string" ? parsed.details.visualStyle : "",
                importantDetails: Array.isArray(parsed.details.importantDetails)
                  ? parsed.details.importantDetails.map(String)
                  : [],
              }
            : undefined,
        emotion:
          parsed.emotion && typeof parsed.emotion === "object"
            ? {
                detected: Boolean(parsed.emotion.detected),
                primary: typeof parsed.emotion.primary === "string" ? parsed.emotion.primary : null,
                confidence: Math.max(0, Math.min(100, Number(parsed.emotion.confidence) || 0)),
                evidence:
                  typeof parsed.emotion.evidence === "string" ? parsed.emotion.evidence : "",
              }
            : undefined,
        rateLimit,
        usage: {
          promptTokens: Number(json.usage?.prompt_tokens) || 0,
          completionTokens: Number(json.usage?.completion_tokens) || 0,
          totalTokens: Number(json.usage?.total_tokens) || 0,
        },
      };
    } catch {
      console.error("Groq trả về JSON không hợp lệ:", raw);

      return {
        labels: [],
        summary: raw,
        text: null,
        rateLimit,
        usage: {
          promptTokens: Number(json.usage?.prompt_tokens) || 0,
          completionTokens: Number(json.usage?.completion_tokens) || 0,
          totalTokens: Number(json.usage?.total_tokens) || 0,
        },
      };
    }
  });

/* =========================
   KIỂM TRA TOKEN GROQ KHI MỞ TRANG
========================= */
export const getGroqRateLimit = createServerFn({ method: "POST" }).handler(
  async (): Promise<GroqRateLimit> => {
    const apiKey = process.env["GROQ_API_KEY"];

    if (!apiKey) {
      throw new Error("Thiếu GROQ_API_KEY. Hãy thêm GROQ_API_KEY vào file .env.");
    }

    const res = await fetch(`${GROQ_API}/chat/completions`, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${apiKey}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "qwen/qwen3.8-27b",
        messages: [{ role: "user", content: "Reply only: OK" }],
        reasoning_effort: "none",
        reasoning_format: "hidden",
        max_completion_tokens: 1,
        temperature: 0,
        stream: false,
      }),
    });

    const rateLimit = readRateLimitHeaders(res.headers);
    if (rateLimit) return rateLimit;

    const body = await res.text().catch(() => "");
    throw new Error(`Không đọc được giới hạn token Groq (${res.status}): ${body.slice(0, 300)}`);
  },
);

/* =========================
   CHUYỂN GIỌNG NÓI → VĂN BẢN
========================= */

const audioSchema = z.object({
  dataUrl: z.string().min(32),
  durationMs: z.number().nonnegative().optional(),
});

export type AudioResult = { text: string };

export const transcribeAudio = createServerFn({ method: "POST" })
  .inputValidator((data: unknown) => audioSchema.parse(data))
  .handler(async ({ data }): Promise<AudioResult> => {
    const apiKey = process.env["GROQ_API_KEY"];

    if (!apiKey) {
      throw new Error("Thiếu GROQ_API_KEY. Hãy thêm GROQ_API_KEY vào file .env.");
    }

    const base64 = data.dataUrl.split(",")[1] ?? "";
    if (!base64) {
      throw new Error("Không đọc được dữ liệu ghi âm.");
    }

    const bytes = Uint8Array.from(atob(base64), (c) => c.charCodeAt(0));

    if (bytes.byteLength < 2048) {
      throw new Error("Bản ghi quá ngắn hoặc không có âm thanh. Hãy thử ghi lại.");
    }

    const form = new FormData();
    form.append("file", new Blob([bytes], { type: "audio/wav" }), "recording.wav");
    form.append("model", "whisper-large-v3-turbo");
    form.append("language", "vi");
    form.append("response_format", "json");
    form.append("temperature", "0");

    const res = await fetch(`${GROQ_API}/audio/transcriptions`, {
      method: "POST",
      headers: { Authorization: `Bearer ${apiKey}` },
      body: form,
    });

    if (!res.ok) {
      const body = await res.text().catch(() => "");
      throw new Error(`Groq Whisper API lỗi (${res.status}): ${body.slice(0, 500)}`);
    }

    const json = (await res.json()) as { text?: string };
    return { text: json.text?.trim() ?? "" };
  });
