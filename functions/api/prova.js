const DEFAULT_ADMIN_USER = "admin";

function normalizeBaseUrl(url) {
  if (!url) return null;
  return url.endsWith("/") ? url.slice(0, -1) : url;
}

function createBasicAuthHeader(user, password) {
  const credentials = `${user}:${password}`;
  const encoded = btoa(credentials);
  return `Basic ${encoded}`;
}

async function fetchFromUploader(path, env) {
  const baseUrl = "https://pave-uploader.pedroalexis016.workers.dev";
  const adminPassword = "admin123";
  const adminUser = "admin";

  if (!baseUrl || !adminPassword) {
    throw new Error("Configuração do uploader ausente. Verifique as variáveis de ambiente.");
  }

  const headers = new Headers({
    Authorization: createBasicAuthHeader(adminUser, adminPassword),
  });

  const response = await fetch(`${baseUrl}${path}`, {
    method: "GET",
    headers,
  });

  return response;
}

export async function onRequestGet(context) {
  const { request, env } = context;
  const url = new URL(request.url);
  const provaName = url.searchParams.get("name");

  try {
    if (!provaName) {
      const response = await fetchFromUploader("/admin/provas", env);
      if (!response.ok) {
        const message = await safeReadError(response);
        return jsonError(message, response.status || 502);
      }
      const payload = await response.json();
      return jsonResponse(payload, 200, { "Cache-Control": "s-maxage=900" });
    }

    const response = await fetchFromUploader(`/admin/prova/${encodeURIComponent(provaName)}`, env);
    if (response.status === 404) {
      return jsonError("Prova não encontrada.", 404);
    }
    if (!response.ok) {
      const message = await safeReadError(response);
      return jsonError(message, response.status || 502);
    }

    const payload = await response.json();
    return jsonResponse(payload, 200, { "Cache-Control": "s-maxage=300" });
  } catch (error) {
    console.error("[api/prova] Erro ao acessar o uploader:", error);
    return jsonError(`Falha ao buscar dados da prova: ${error.message}`, 500);
  }
}

export async function onRequest(context) {
  if (context.request.method === "GET") {
    return onRequestGet(context);
  }
  return new Response(`Método ${context.request.method} não permitido.`, {
    status: 405,
  });
}

async function safeReadError(response) {
  try {
    const data = await response.json();
    return data?.error || data?.message || response.statusText || "Erro desconhecido.";
  } catch {
    return response.statusText || "Erro ao processar a resposta do uploader.";
  }
}

function jsonResponse(body, status = 200, extraHeaders = {}) {
  return new Response(JSON.stringify(body), {
    status,
    headers: {
      "Content-Type": "application/json",
      ...extraHeaders,
    },
  });
}

function jsonError(message, status = 500) {
  return jsonResponse({ error: message }, status, { "Cache-Control": "no-store" });
}
