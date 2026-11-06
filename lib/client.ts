import type { MutationBody, MutationResult, TaskStatus } from "./types";
export const statuses: TaskStatus[] = ["todo", "progress", "review", "done"];
export const today = () =>
  new Date().toLocaleDateString("en-CA", { timeZone: "Europe/Vienna" });
export class ApiError extends Error {
  constructor(
    message: string,
    public status: number,
  ) {
    super(message);
    this.name = "ApiError";
  }
}
export const errorMessage = (error: unknown) =>
  error instanceof Error
    ? error.message
    : "Unerwarteter Fehler / Unexpected error";
export async function api<T = MutationResult>(
  path: string,
  method = "GET",
  body?: MutationBody,
): Promise<T> {
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), 20000);
  try {
    const response = await fetch(`/api/${path}`, {
      method,
      signal: controller.signal,
      headers: { "Content-Type": "application/json" },
      ...(body ? { body: JSON.stringify(body) } : {}),
    });
    let data: unknown;
    try {
      data = await response.json();
    } catch {
      throw new ApiError(
        "Ungültige Serverantwort / Invalid server response",
        response.status,
      );
    }
    if (!response.ok) {
      const error = data as { error?: string };
      throw new ApiError(
        error.error || "Anfrage fehlgeschlagen / Request failed",
        response.status,
      );
    }
    return data as T;
  } catch (error) {
    if (error instanceof ApiError) throw error;
    throw new ApiError(
      error instanceof Error && error.name === "AbortError"
        ? "Zeitüberschreitung. Bitte erneut versuchen. / Request timed out. Please try again."
        : "Verbindung fehlgeschlagen. Bitte erneut versuchen. / Connection failed. Please try again.",
      0,
    );
  } finally {
    clearTimeout(timeout);
  }
}
