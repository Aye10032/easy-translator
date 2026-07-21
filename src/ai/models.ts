import { fetch as tauriFetch } from "@tauri-apps/plugin-http";

interface ModelListResponse {
  data?: Array<{ id?: unknown }>;
  error?: { message?: unknown };
  message?: unknown;
}

function getErrorMessage(payload: ModelListResponse | null, status: number) {
  const message = payload?.error?.message ?? payload?.message;
  return typeof message === "string" && message.trim()
    ? message
    : `模型服务返回了 HTTP ${status}`;
}

export async function listAvailableModels(baseUrl: string, apiKey: string): Promise<string[]> {
  const url = `${baseUrl.trim().replace(/\/+$/, "")}/models`;
  let response: Response;

  try {
    response = await tauriFetch(url, {
      method: "GET",
      headers: {
        Accept: "application/json",
        Authorization: `Bearer ${apiKey.trim()}`,
      },
    });
  } catch (cause) {
    const message = cause instanceof Error ? cause.message : String(cause);
    throw new Error(`无法连接模型服务：${message}`);
  }

  let payload: ModelListResponse | null = null;
  try {
    payload = await response.json() as ModelListResponse;
  } catch {
    // Preserve the HTTP status as the useful error when the body is not JSON.
  }

  if (!response.ok) throw new Error(getErrorMessage(payload, response.status));

  const models = (payload?.data ?? [])
    .map((model) => model.id)
    .filter((id): id is string => typeof id === "string" && id.trim().length > 0)
    .map((id) => id.trim());
  const uniqueModels = [...new Set(models)].sort((left, right) => left.localeCompare(right));

  if (uniqueModels.length === 0) {
    throw new Error("接口请求成功，但没有返回 OpenAI 格式的模型列表。");
  }

  return uniqueModels;
}
