// --- Funções de Configuração ---

/**
 * Normaliza a URL base, removendo a barra final se existir.
 * @param {string} url - A URL de entrada.
 * @returns {string|null} A URL normalizada ou null.
 */
function normalizeBaseUrl(url) {
  if (!url) return null;
  return url.endsWith("/") ? url.slice(0, -1) : url;
}

/**
 * Resolve as configurações de conexão com o uploader a partir das variáveis de ambiente.
 * @param {object} env - O objeto de ambiente do Worker.
 * @returns {{baseUrl: string, adminUser: string, adminPassword: string}}
 */
function resolveUploaderConfig(env = {}) {
  const baseUrl = normalizeBaseUrl(env.PAVE_UPLOADER_BASE_URL);
  const adminPassword = env.PAVE_UPLOADER_ADMIN_PASSWORD;
  const adminUser = env.PAVE_UPLOADER_ADMIN_USER;
  return { baseUrl, adminPassword, adminUser };
}

/**
 * Cria o cabeçalho de autorização "Basic Auth".
 * @param {string} user - O nome de usuário.
 * @param {string} password - A senha.
 * @returns {string} O valor do cabeçalho de autorização.
 */
function createBasicAuthHeader(user, password) {
  const credentials = `${user}:${password}`;
  return `Basic ${btoa(credentials)}`; // btoa está disponível no ambiente de Workers.
}

// --- Funções de Requisição ---

/**
 * Faz uma requisição GET para o worker "pave-uploader".
 * @param {string} path - O caminho da API a ser chamado (ex: '/admin/provas').
 * @param {object} env - O objeto de ambiente do Worker.
 * @returns {Promise<Response>} A resposta da requisição.
 */
async function fetchFromUploader(path, env) {
  const { baseUrl, adminPassword, adminUser } = resolveUploaderConfig(env);

  if (!baseUrl || !adminPassword || !adminUser) {
    throw new Error("Configuração do uploader ausente. Verifique as variáveis de ambiente.");
  }

  const headers = new Headers({
    Authorization: createBasicAuthHeader(adminUser, adminPassword),
    "Content-Type": "application/json",
  });

  const fullUrl = `${baseUrl}${path}`;
  console.log(`[UploaderUtil] Buscando de: ${fullUrl}`);

  return fetch(fullUrl, { method: "GET", headers });
}

// --- Funções de Alto Nível ---

/**
 * Busca todas as questões de todas as provas disponíveis no uploader.
 * Este método é ideal para criar índices de busca ou obter dados para filtros.
 * @param {object} env - O objeto de ambiente do Worker.
 * @returns {Promise<Array<object>>} Uma promessa que resolve para um array com todas as questões.
 */
export async function fetchAllQuestions(env) {
  // 1. Lista todas as provas disponíveis.
  const listResponse = await fetchFromUploader("/admin/provas", env);
  if (!listResponse.ok) {
    console.error("[UploaderUtil] Falha ao listar provas.");
    return [];
  }
  const listData = await listResponse.json();
  const provaNames = listData.provas?.map(p => p.name) || [];

  if (provaNames.length === 0) {
    console.warn("[UploaderUtil] Nenhuma prova encontrada no uploader.");
    return [];
  }

  // 2. Busca o conteúdo de todas as provas em paralelo para maior eficiência.
  const allQuestionPromises = provaNames.map(name =>
    fetchFromUploader(`/admin/prova/${encodeURIComponent(name)}`, env)
      .then(res => res.ok ? res.json() : []) // Retorna um array vazio se a busca falhar.
      .catch(err => {
        console.error(`[UploaderUtil] Erro ao buscar a prova ${name}:`, err);
        return [];
      })
  );

  const allProofsData = await Promise.all(allQuestionPromises);

  // 3. Extrai as questões de cada prova e as junta em um único array.
  return allProofsData.flatMap(proof => proof.questoes || []);
}
