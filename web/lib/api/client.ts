const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000";

export class ApiError extends Error {
  status: number;
  data: unknown;

  constructor(message: string, status: number, data?: unknown) {
    super(message);
    this.name = "ApiError";
    this.status = status;
    this.data = data;
  }
}

export async function apiClient<T>(
  endpoint: string,
  options: RequestInit = {}
): Promise<T> {
  const url = endpoint.startsWith("http")
    ? endpoint
    : `${API_BASE_URL}${endpoint.startsWith("/") ? "" : "/"}${endpoint}`;

  const isFormData = typeof FormData !== "undefined" && options.body instanceof FormData;

  const headers: Record<string, string> = {
    ...(isFormData ? {} : { "Content-Type": "application/json" }),
    ...(options.headers as Record<string, string>),
  };


  if (typeof window !== "undefined") {
    const token = localStorage.getItem("commercehub_token");
    if (token && !headers["Authorization"]) {
      headers["Authorization"] = `Bearer ${token}`;
    }
  }

  try {
    const response = await fetch(url, {
      ...options,
      headers,
    });

    let data: unknown = null;
    const contentType = response.headers.get("content-type");
    if (contentType && contentType.includes("application/json")) {
      data = await response.json();
    } else {
      const text = await response.text();
      data = text ? { detail: text } : null;
    }

    if (!response.ok) {
      let errorMessage = "An unexpected error occurred. Please try again.";

      const errorObj = data as { detail?: any } | null;
      if (errorObj && errorObj.detail) {
        if (typeof errorObj.detail === "string") {
          errorMessage = errorObj.detail;
        } else if (Array.isArray(errorObj.detail)) {
          // Handle Pydantic validation errors
          errorMessage = errorObj.detail
            .map((err) => (typeof err === "string" ? err : `${err.loc?.join(".") || "field"}: ${err.msg || err}`))
            .join("; ");
        } else if (typeof errorObj.detail === "object") {
          const detailObj = errorObj.detail as Record<string, any>;
          if (Array.isArray(detailObj.publishing_errors)) {
            errorMessage = detailObj.publishing_errors.join("; ");
          } else {
            errorMessage = Object.values(detailObj)
              .flatMap((v) => (Array.isArray(v) ? v : [v]))
              .join("; ");
          }
        }
      } else if (response.status === 401) {
        errorMessage = "Invalid credentials or token expired.";
      } else if (response.status === 403) {
        errorMessage = "You are not authorized to perform this action.";
      } else if (response.status === 404) {
        errorMessage = "Resource not found.";
      } else if (response.status >= 500) {
        errorMessage = "Server error. Please try again later.";
      }

      // If 401 Unauthorized, clear stale token
      if (response.status === 401 && typeof window !== "undefined") {
        localStorage.removeItem("commercehub_token");
      }

      throw new ApiError(errorMessage, response.status, data);
    }

    return data as T;
  } catch (error: unknown) {
    if (error instanceof ApiError) {
      throw error;
    }
    const errMessage = error instanceof Error ? error.message : "Unable to connect to the server.";
    throw new ApiError(errMessage, 0);
  }
}
