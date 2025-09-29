const DEFAULT_ADMIN_USER = "admin";

function normalizeBaseUrl(url) {
  if (!url) return null;
  return url.endsWith("/") ? url.slice(0, -1) : url;
}

function createBasicAuthHeader(user, password) {
  const credentials = `${user}:${password}`;
  // Workers runtime supports btoa directly
  return `Basic ${btoa(credentials)}`;
}

/**
 * Fetches data from the pave-uploader worker.
 * @param {string} path The API path to fetch (e.g., '/admin/provas').
 * @param {object} env The worker environment object.
 * @returns {Promise<Response>} The fetch response.
 */
async function fetchFromUploader(path, env) {
  // Use hardcoded values as requested
  const baseUrl = "https://pave-uploader.pedroalexis016.workers.dev";
  const adminPassword = "admin123";
  const adminUser = "admin";

  if (!baseUrl || !adminPassword) {
    throw new Error("Configuração do uploader ausente.");
  }

  const headers = new Headers({
    Authorization: createBasicAuthHeader(adminUser, adminPassword),
    "Content-Type": "application/json",
  });

  const fullUrl = `${baseUrl}${path}`;
  console.log(`[UploaderUtil] Fetching from: ${fullUrl}`);

  const response = await fetch(fullUrl, {
    method: "GET",
    headers,
  });

  return response;
}

/**
 * Fetches all questions from all available proofs.
 * @param {object} env The worker environment object.
 * @returns {Promise<Array<object>>} A promise that resolves to an array of all questions.
 */
export async function fetchAllQuestions(env) {
  // 1. List all available proofs
  const listResponse = await fetchFromUploader("/admin/provas", env);
  if (!listResponse.ok) {
    console.error("[UploaderUtil] Failed to list proofs.");
    return [];
  }
  const listData = await listResponse.json();
  const provaNames = listData.provas?.map(p => p.name) || [];

  if (provaNames.length === 0) {
    console.warn("[UploaderUtil] No proofs found in the uploader.");
    return [];
  }

  // 2. Fetch all proofs in parallel
  const allQuestionPromises = provaNames.map(name =>
    fetchFromUploader(`/admin/prova/${encodeURIComponent(name)}`, env)
      .then(res => {
        if (res.ok) return res.json();
        console.error(`[UploaderUtil] Failed to fetch proof: ${name}`);
        return []; // Return empty array on failure for this proof
      })
      .catch(err => {
        console.error(`[UploaderUtil] Error fetching proof ${name}:`, err);
        return [];
      })
  );

  const allQuestionsArrays = await Promise.all(allQuestionPromises);

  // 3. Flatten the array of arrays into a single array of questions
  return allQuestionsArrays.flat();
}
