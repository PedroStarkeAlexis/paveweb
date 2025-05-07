var __defProp = Object.defineProperty;
var __name = (target, value) => __defProp(target, "name", { value, configurable: true });

// .wrangler/tmp/bundle-kaBYvg/checked-fetch.js
var urls = /* @__PURE__ */ new Set();
function checkURL(request, init) {
  const url = request instanceof URL ? request : new URL(
    (typeof request === "string" ? new Request(request, init) : request).url
  );
  if (url.port && url.port !== "443" && url.protocol === "https:") {
    if (!urls.has(url.toString())) {
      urls.add(url.toString());
      console.warn(
        `WARNING: known issue with \`fetch()\` requests to custom HTTPS ports in published Workers:
 - ${url.toString()} - the custom port will be ignored when the Worker is published using the \`wrangler deploy\` command.
`
      );
    }
  }
}
__name(checkURL, "checkURL");
globalThis.fetch = new Proxy(globalThis.fetch, {
  apply(target, thisArg, argArray) {
    const [request, init] = argArray;
    checkURL(request, init);
    return Reflect.apply(target, thisArg, argArray);
  }
});

// .wrangler/tmp/pages-W7ghFQ/functionsWorker-0.26158561439965644.mjs
var __defProp2 = Object.defineProperty;
var __name2 = /* @__PURE__ */ __name((target, value) => __defProp2(target, "name", { value, configurable: true }), "__name");
var urls2 = /* @__PURE__ */ new Set();
function checkURL2(request, init) {
  const url = request instanceof URL ? request : new URL(
    (typeof request === "string" ? new Request(request, init) : request).url
  );
  if (url.port && url.port !== "443" && url.protocol === "https:") {
    if (!urls2.has(url.toString())) {
      urls2.add(url.toString());
      console.warn(
        `WARNING: known issue with \`fetch()\` requests to custom HTTPS ports in published Workers:
 - ${url.toString()} - the custom port will be ignored when the Worker is published using the \`wrangler deploy\` command.
`
      );
    }
  }
}
__name(checkURL2, "checkURL");
__name2(checkURL2, "checkURL");
globalThis.fetch = new Proxy(globalThis.fetch, {
  apply(target, thisArg, argArray) {
    const [request, init] = argArray;
    checkURL2(request, init);
    return Reflect.apply(target, thisArg, argArray);
  }
});
var SchemaType;
(function(SchemaType2) {
  SchemaType2["STRING"] = "string";
  SchemaType2["NUMBER"] = "number";
  SchemaType2["INTEGER"] = "integer";
  SchemaType2["BOOLEAN"] = "boolean";
  SchemaType2["ARRAY"] = "array";
  SchemaType2["OBJECT"] = "object";
})(SchemaType || (SchemaType = {}));
var ExecutableCodeLanguage;
(function(ExecutableCodeLanguage2) {
  ExecutableCodeLanguage2["LANGUAGE_UNSPECIFIED"] = "language_unspecified";
  ExecutableCodeLanguage2["PYTHON"] = "python";
})(ExecutableCodeLanguage || (ExecutableCodeLanguage = {}));
var Outcome;
(function(Outcome2) {
  Outcome2["OUTCOME_UNSPECIFIED"] = "outcome_unspecified";
  Outcome2["OUTCOME_OK"] = "outcome_ok";
  Outcome2["OUTCOME_FAILED"] = "outcome_failed";
  Outcome2["OUTCOME_DEADLINE_EXCEEDED"] = "outcome_deadline_exceeded";
})(Outcome || (Outcome = {}));
var POSSIBLE_ROLES = ["user", "model", "function", "system"];
var HarmCategory;
(function(HarmCategory2) {
  HarmCategory2["HARM_CATEGORY_UNSPECIFIED"] = "HARM_CATEGORY_UNSPECIFIED";
  HarmCategory2["HARM_CATEGORY_HATE_SPEECH"] = "HARM_CATEGORY_HATE_SPEECH";
  HarmCategory2["HARM_CATEGORY_SEXUALLY_EXPLICIT"] = "HARM_CATEGORY_SEXUALLY_EXPLICIT";
  HarmCategory2["HARM_CATEGORY_HARASSMENT"] = "HARM_CATEGORY_HARASSMENT";
  HarmCategory2["HARM_CATEGORY_DANGEROUS_CONTENT"] = "HARM_CATEGORY_DANGEROUS_CONTENT";
  HarmCategory2["HARM_CATEGORY_CIVIC_INTEGRITY"] = "HARM_CATEGORY_CIVIC_INTEGRITY";
})(HarmCategory || (HarmCategory = {}));
var HarmBlockThreshold;
(function(HarmBlockThreshold2) {
  HarmBlockThreshold2["HARM_BLOCK_THRESHOLD_UNSPECIFIED"] = "HARM_BLOCK_THRESHOLD_UNSPECIFIED";
  HarmBlockThreshold2["BLOCK_LOW_AND_ABOVE"] = "BLOCK_LOW_AND_ABOVE";
  HarmBlockThreshold2["BLOCK_MEDIUM_AND_ABOVE"] = "BLOCK_MEDIUM_AND_ABOVE";
  HarmBlockThreshold2["BLOCK_ONLY_HIGH"] = "BLOCK_ONLY_HIGH";
  HarmBlockThreshold2["BLOCK_NONE"] = "BLOCK_NONE";
})(HarmBlockThreshold || (HarmBlockThreshold = {}));
var HarmProbability;
(function(HarmProbability2) {
  HarmProbability2["HARM_PROBABILITY_UNSPECIFIED"] = "HARM_PROBABILITY_UNSPECIFIED";
  HarmProbability2["NEGLIGIBLE"] = "NEGLIGIBLE";
  HarmProbability2["LOW"] = "LOW";
  HarmProbability2["MEDIUM"] = "MEDIUM";
  HarmProbability2["HIGH"] = "HIGH";
})(HarmProbability || (HarmProbability = {}));
var BlockReason;
(function(BlockReason2) {
  BlockReason2["BLOCKED_REASON_UNSPECIFIED"] = "BLOCKED_REASON_UNSPECIFIED";
  BlockReason2["SAFETY"] = "SAFETY";
  BlockReason2["OTHER"] = "OTHER";
})(BlockReason || (BlockReason = {}));
var FinishReason;
(function(FinishReason2) {
  FinishReason2["FINISH_REASON_UNSPECIFIED"] = "FINISH_REASON_UNSPECIFIED";
  FinishReason2["STOP"] = "STOP";
  FinishReason2["MAX_TOKENS"] = "MAX_TOKENS";
  FinishReason2["SAFETY"] = "SAFETY";
  FinishReason2["RECITATION"] = "RECITATION";
  FinishReason2["LANGUAGE"] = "LANGUAGE";
  FinishReason2["BLOCKLIST"] = "BLOCKLIST";
  FinishReason2["PROHIBITED_CONTENT"] = "PROHIBITED_CONTENT";
  FinishReason2["SPII"] = "SPII";
  FinishReason2["MALFORMED_FUNCTION_CALL"] = "MALFORMED_FUNCTION_CALL";
  FinishReason2["OTHER"] = "OTHER";
})(FinishReason || (FinishReason = {}));
var TaskType;
(function(TaskType2) {
  TaskType2["TASK_TYPE_UNSPECIFIED"] = "TASK_TYPE_UNSPECIFIED";
  TaskType2["RETRIEVAL_QUERY"] = "RETRIEVAL_QUERY";
  TaskType2["RETRIEVAL_DOCUMENT"] = "RETRIEVAL_DOCUMENT";
  TaskType2["SEMANTIC_SIMILARITY"] = "SEMANTIC_SIMILARITY";
  TaskType2["CLASSIFICATION"] = "CLASSIFICATION";
  TaskType2["CLUSTERING"] = "CLUSTERING";
})(TaskType || (TaskType = {}));
var FunctionCallingMode;
(function(FunctionCallingMode2) {
  FunctionCallingMode2["MODE_UNSPECIFIED"] = "MODE_UNSPECIFIED";
  FunctionCallingMode2["AUTO"] = "AUTO";
  FunctionCallingMode2["ANY"] = "ANY";
  FunctionCallingMode2["NONE"] = "NONE";
})(FunctionCallingMode || (FunctionCallingMode = {}));
var DynamicRetrievalMode;
(function(DynamicRetrievalMode2) {
  DynamicRetrievalMode2["MODE_UNSPECIFIED"] = "MODE_UNSPECIFIED";
  DynamicRetrievalMode2["MODE_DYNAMIC"] = "MODE_DYNAMIC";
})(DynamicRetrievalMode || (DynamicRetrievalMode = {}));
var GoogleGenerativeAIError = class extends Error {
  static {
    __name(this, "GoogleGenerativeAIError");
  }
  static {
    __name2(this, "GoogleGenerativeAIError");
  }
  constructor(message) {
    super(`[GoogleGenerativeAI Error]: ${message}`);
  }
};
var GoogleGenerativeAIResponseError = class extends GoogleGenerativeAIError {
  static {
    __name(this, "GoogleGenerativeAIResponseError");
  }
  static {
    __name2(this, "GoogleGenerativeAIResponseError");
  }
  constructor(message, response) {
    super(message);
    this.response = response;
  }
};
var GoogleGenerativeAIFetchError = class extends GoogleGenerativeAIError {
  static {
    __name(this, "GoogleGenerativeAIFetchError");
  }
  static {
    __name2(this, "GoogleGenerativeAIFetchError");
  }
  constructor(message, status, statusText, errorDetails) {
    super(message);
    this.status = status;
    this.statusText = statusText;
    this.errorDetails = errorDetails;
  }
};
var GoogleGenerativeAIRequestInputError = class extends GoogleGenerativeAIError {
  static {
    __name(this, "GoogleGenerativeAIRequestInputError");
  }
  static {
    __name2(this, "GoogleGenerativeAIRequestInputError");
  }
};
var GoogleGenerativeAIAbortError = class extends GoogleGenerativeAIError {
  static {
    __name(this, "GoogleGenerativeAIAbortError");
  }
  static {
    __name2(this, "GoogleGenerativeAIAbortError");
  }
};
var DEFAULT_BASE_URL = "https://generativelanguage.googleapis.com";
var DEFAULT_API_VERSION = "v1beta";
var PACKAGE_VERSION = "0.24.0";
var PACKAGE_LOG_HEADER = "genai-js";
var Task;
(function(Task2) {
  Task2["GENERATE_CONTENT"] = "generateContent";
  Task2["STREAM_GENERATE_CONTENT"] = "streamGenerateContent";
  Task2["COUNT_TOKENS"] = "countTokens";
  Task2["EMBED_CONTENT"] = "embedContent";
  Task2["BATCH_EMBED_CONTENTS"] = "batchEmbedContents";
})(Task || (Task = {}));
var RequestUrl = class {
  static {
    __name(this, "RequestUrl");
  }
  static {
    __name2(this, "RequestUrl");
  }
  constructor(model, task, apiKey, stream, requestOptions) {
    this.model = model;
    this.task = task;
    this.apiKey = apiKey;
    this.stream = stream;
    this.requestOptions = requestOptions;
  }
  toString() {
    var _a, _b;
    const apiVersion = ((_a = this.requestOptions) === null || _a === void 0 ? void 0 : _a.apiVersion) || DEFAULT_API_VERSION;
    const baseUrl = ((_b = this.requestOptions) === null || _b === void 0 ? void 0 : _b.baseUrl) || DEFAULT_BASE_URL;
    let url = `${baseUrl}/${apiVersion}/${this.model}:${this.task}`;
    if (this.stream) {
      url += "?alt=sse";
    }
    return url;
  }
};
function getClientHeaders(requestOptions) {
  const clientHeaders = [];
  if (requestOptions === null || requestOptions === void 0 ? void 0 : requestOptions.apiClient) {
    clientHeaders.push(requestOptions.apiClient);
  }
  clientHeaders.push(`${PACKAGE_LOG_HEADER}/${PACKAGE_VERSION}`);
  return clientHeaders.join(" ");
}
__name(getClientHeaders, "getClientHeaders");
__name2(getClientHeaders, "getClientHeaders");
async function getHeaders(url) {
  var _a;
  const headers = new Headers();
  headers.append("Content-Type", "application/json");
  headers.append("x-goog-api-client", getClientHeaders(url.requestOptions));
  headers.append("x-goog-api-key", url.apiKey);
  let customHeaders = (_a = url.requestOptions) === null || _a === void 0 ? void 0 : _a.customHeaders;
  if (customHeaders) {
    if (!(customHeaders instanceof Headers)) {
      try {
        customHeaders = new Headers(customHeaders);
      } catch (e) {
        throw new GoogleGenerativeAIRequestInputError(`unable to convert customHeaders value ${JSON.stringify(customHeaders)} to Headers: ${e.message}`);
      }
    }
    for (const [headerName, headerValue] of customHeaders.entries()) {
      if (headerName === "x-goog-api-key") {
        throw new GoogleGenerativeAIRequestInputError(`Cannot set reserved header name ${headerName}`);
      } else if (headerName === "x-goog-api-client") {
        throw new GoogleGenerativeAIRequestInputError(`Header name ${headerName} can only be set using the apiClient field`);
      }
      headers.append(headerName, headerValue);
    }
  }
  return headers;
}
__name(getHeaders, "getHeaders");
__name2(getHeaders, "getHeaders");
async function constructModelRequest(model, task, apiKey, stream, body, requestOptions) {
  const url = new RequestUrl(model, task, apiKey, stream, requestOptions);
  return {
    url: url.toString(),
    fetchOptions: Object.assign(Object.assign({}, buildFetchOptions(requestOptions)), { method: "POST", headers: await getHeaders(url), body })
  };
}
__name(constructModelRequest, "constructModelRequest");
__name2(constructModelRequest, "constructModelRequest");
async function makeModelRequest(model, task, apiKey, stream, body, requestOptions = {}, fetchFn = fetch) {
  const { url, fetchOptions } = await constructModelRequest(model, task, apiKey, stream, body, requestOptions);
  return makeRequest(url, fetchOptions, fetchFn);
}
__name(makeModelRequest, "makeModelRequest");
__name2(makeModelRequest, "makeModelRequest");
async function makeRequest(url, fetchOptions, fetchFn = fetch) {
  let response;
  try {
    response = await fetchFn(url, fetchOptions);
  } catch (e) {
    handleResponseError(e, url);
  }
  if (!response.ok) {
    await handleResponseNotOk(response, url);
  }
  return response;
}
__name(makeRequest, "makeRequest");
__name2(makeRequest, "makeRequest");
function handleResponseError(e, url) {
  let err = e;
  if (err.name === "AbortError") {
    err = new GoogleGenerativeAIAbortError(`Request aborted when fetching ${url.toString()}: ${e.message}`);
    err.stack = e.stack;
  } else if (!(e instanceof GoogleGenerativeAIFetchError || e instanceof GoogleGenerativeAIRequestInputError)) {
    err = new GoogleGenerativeAIError(`Error fetching from ${url.toString()}: ${e.message}`);
    err.stack = e.stack;
  }
  throw err;
}
__name(handleResponseError, "handleResponseError");
__name2(handleResponseError, "handleResponseError");
async function handleResponseNotOk(response, url) {
  let message = "";
  let errorDetails;
  try {
    const json = await response.json();
    message = json.error.message;
    if (json.error.details) {
      message += ` ${JSON.stringify(json.error.details)}`;
      errorDetails = json.error.details;
    }
  } catch (e) {
  }
  throw new GoogleGenerativeAIFetchError(`Error fetching from ${url.toString()}: [${response.status} ${response.statusText}] ${message}`, response.status, response.statusText, errorDetails);
}
__name(handleResponseNotOk, "handleResponseNotOk");
__name2(handleResponseNotOk, "handleResponseNotOk");
function buildFetchOptions(requestOptions) {
  const fetchOptions = {};
  if ((requestOptions === null || requestOptions === void 0 ? void 0 : requestOptions.signal) !== void 0 || (requestOptions === null || requestOptions === void 0 ? void 0 : requestOptions.timeout) >= 0) {
    const controller = new AbortController();
    if ((requestOptions === null || requestOptions === void 0 ? void 0 : requestOptions.timeout) >= 0) {
      setTimeout(() => controller.abort(), requestOptions.timeout);
    }
    if (requestOptions === null || requestOptions === void 0 ? void 0 : requestOptions.signal) {
      requestOptions.signal.addEventListener("abort", () => {
        controller.abort();
      });
    }
    fetchOptions.signal = controller.signal;
  }
  return fetchOptions;
}
__name(buildFetchOptions, "buildFetchOptions");
__name2(buildFetchOptions, "buildFetchOptions");
function addHelpers(response) {
  response.text = () => {
    if (response.candidates && response.candidates.length > 0) {
      if (response.candidates.length > 1) {
        console.warn(`This response had ${response.candidates.length} candidates. Returning text from the first candidate only. Access response.candidates directly to use the other candidates.`);
      }
      if (hadBadFinishReason(response.candidates[0])) {
        throw new GoogleGenerativeAIResponseError(`${formatBlockErrorMessage(response)}`, response);
      }
      return getText(response);
    } else if (response.promptFeedback) {
      throw new GoogleGenerativeAIResponseError(`Text not available. ${formatBlockErrorMessage(response)}`, response);
    }
    return "";
  };
  response.functionCall = () => {
    if (response.candidates && response.candidates.length > 0) {
      if (response.candidates.length > 1) {
        console.warn(`This response had ${response.candidates.length} candidates. Returning function calls from the first candidate only. Access response.candidates directly to use the other candidates.`);
      }
      if (hadBadFinishReason(response.candidates[0])) {
        throw new GoogleGenerativeAIResponseError(`${formatBlockErrorMessage(response)}`, response);
      }
      console.warn(`response.functionCall() is deprecated. Use response.functionCalls() instead.`);
      return getFunctionCalls(response)[0];
    } else if (response.promptFeedback) {
      throw new GoogleGenerativeAIResponseError(`Function call not available. ${formatBlockErrorMessage(response)}`, response);
    }
    return void 0;
  };
  response.functionCalls = () => {
    if (response.candidates && response.candidates.length > 0) {
      if (response.candidates.length > 1) {
        console.warn(`This response had ${response.candidates.length} candidates. Returning function calls from the first candidate only. Access response.candidates directly to use the other candidates.`);
      }
      if (hadBadFinishReason(response.candidates[0])) {
        throw new GoogleGenerativeAIResponseError(`${formatBlockErrorMessage(response)}`, response);
      }
      return getFunctionCalls(response);
    } else if (response.promptFeedback) {
      throw new GoogleGenerativeAIResponseError(`Function call not available. ${formatBlockErrorMessage(response)}`, response);
    }
    return void 0;
  };
  return response;
}
__name(addHelpers, "addHelpers");
__name2(addHelpers, "addHelpers");
function getText(response) {
  var _a, _b, _c, _d;
  const textStrings = [];
  if ((_b = (_a = response.candidates) === null || _a === void 0 ? void 0 : _a[0].content) === null || _b === void 0 ? void 0 : _b.parts) {
    for (const part of (_d = (_c = response.candidates) === null || _c === void 0 ? void 0 : _c[0].content) === null || _d === void 0 ? void 0 : _d.parts) {
      if (part.text) {
        textStrings.push(part.text);
      }
      if (part.executableCode) {
        textStrings.push("\n```" + part.executableCode.language + "\n" + part.executableCode.code + "\n```\n");
      }
      if (part.codeExecutionResult) {
        textStrings.push("\n```\n" + part.codeExecutionResult.output + "\n```\n");
      }
    }
  }
  if (textStrings.length > 0) {
    return textStrings.join("");
  } else {
    return "";
  }
}
__name(getText, "getText");
__name2(getText, "getText");
function getFunctionCalls(response) {
  var _a, _b, _c, _d;
  const functionCalls = [];
  if ((_b = (_a = response.candidates) === null || _a === void 0 ? void 0 : _a[0].content) === null || _b === void 0 ? void 0 : _b.parts) {
    for (const part of (_d = (_c = response.candidates) === null || _c === void 0 ? void 0 : _c[0].content) === null || _d === void 0 ? void 0 : _d.parts) {
      if (part.functionCall) {
        functionCalls.push(part.functionCall);
      }
    }
  }
  if (functionCalls.length > 0) {
    return functionCalls;
  } else {
    return void 0;
  }
}
__name(getFunctionCalls, "getFunctionCalls");
__name2(getFunctionCalls, "getFunctionCalls");
var badFinishReasons = [
  FinishReason.RECITATION,
  FinishReason.SAFETY,
  FinishReason.LANGUAGE
];
function hadBadFinishReason(candidate) {
  return !!candidate.finishReason && badFinishReasons.includes(candidate.finishReason);
}
__name(hadBadFinishReason, "hadBadFinishReason");
__name2(hadBadFinishReason, "hadBadFinishReason");
function formatBlockErrorMessage(response) {
  var _a, _b, _c;
  let message = "";
  if ((!response.candidates || response.candidates.length === 0) && response.promptFeedback) {
    message += "Response was blocked";
    if ((_a = response.promptFeedback) === null || _a === void 0 ? void 0 : _a.blockReason) {
      message += ` due to ${response.promptFeedback.blockReason}`;
    }
    if ((_b = response.promptFeedback) === null || _b === void 0 ? void 0 : _b.blockReasonMessage) {
      message += `: ${response.promptFeedback.blockReasonMessage}`;
    }
  } else if ((_c = response.candidates) === null || _c === void 0 ? void 0 : _c[0]) {
    const firstCandidate = response.candidates[0];
    if (hadBadFinishReason(firstCandidate)) {
      message += `Candidate was blocked due to ${firstCandidate.finishReason}`;
      if (firstCandidate.finishMessage) {
        message += `: ${firstCandidate.finishMessage}`;
      }
    }
  }
  return message;
}
__name(formatBlockErrorMessage, "formatBlockErrorMessage");
__name2(formatBlockErrorMessage, "formatBlockErrorMessage");
function __await(v) {
  return this instanceof __await ? (this.v = v, this) : new __await(v);
}
__name(__await, "__await");
__name2(__await, "__await");
function __asyncGenerator(thisArg, _arguments, generator) {
  if (!Symbol.asyncIterator) throw new TypeError("Symbol.asyncIterator is not defined.");
  var g = generator.apply(thisArg, _arguments || []), i, q = [];
  return i = {}, verb("next"), verb("throw"), verb("return"), i[Symbol.asyncIterator] = function() {
    return this;
  }, i;
  function verb(n) {
    if (g[n]) i[n] = function(v) {
      return new Promise(function(a, b) {
        q.push([n, v, a, b]) > 1 || resume(n, v);
      });
    };
  }
  __name(verb, "verb");
  __name2(verb, "verb");
  function resume(n, v) {
    try {
      step(g[n](v));
    } catch (e) {
      settle(q[0][3], e);
    }
  }
  __name(resume, "resume");
  __name2(resume, "resume");
  function step(r) {
    r.value instanceof __await ? Promise.resolve(r.value.v).then(fulfill, reject) : settle(q[0][2], r);
  }
  __name(step, "step");
  __name2(step, "step");
  function fulfill(value) {
    resume("next", value);
  }
  __name(fulfill, "fulfill");
  __name2(fulfill, "fulfill");
  function reject(value) {
    resume("throw", value);
  }
  __name(reject, "reject");
  __name2(reject, "reject");
  function settle(f, v) {
    if (f(v), q.shift(), q.length) resume(q[0][0], q[0][1]);
  }
  __name(settle, "settle");
  __name2(settle, "settle");
}
__name(__asyncGenerator, "__asyncGenerator");
__name2(__asyncGenerator, "__asyncGenerator");
var responseLineRE = /^data\: (.*)(?:\n\n|\r\r|\r\n\r\n)/;
function processStream(response) {
  const inputStream = response.body.pipeThrough(new TextDecoderStream("utf8", { fatal: true }));
  const responseStream = getResponseStream(inputStream);
  const [stream1, stream2] = responseStream.tee();
  return {
    stream: generateResponseSequence(stream1),
    response: getResponsePromise(stream2)
  };
}
__name(processStream, "processStream");
__name2(processStream, "processStream");
async function getResponsePromise(stream) {
  const allResponses = [];
  const reader = stream.getReader();
  while (true) {
    const { done, value } = await reader.read();
    if (done) {
      return addHelpers(aggregateResponses(allResponses));
    }
    allResponses.push(value);
  }
}
__name(getResponsePromise, "getResponsePromise");
__name2(getResponsePromise, "getResponsePromise");
function generateResponseSequence(stream) {
  return __asyncGenerator(this, arguments, /* @__PURE__ */ __name2(/* @__PURE__ */ __name(function* generateResponseSequence_1() {
    const reader = stream.getReader();
    while (true) {
      const { value, done } = yield __await(reader.read());
      if (done) {
        break;
      }
      yield yield __await(addHelpers(value));
    }
  }, "generateResponseSequence_1"), "generateResponseSequence_1"));
}
__name(generateResponseSequence, "generateResponseSequence");
__name2(generateResponseSequence, "generateResponseSequence");
function getResponseStream(inputStream) {
  const reader = inputStream.getReader();
  const stream = new ReadableStream({
    start(controller) {
      let currentText = "";
      return pump();
      function pump() {
        return reader.read().then(({ value, done }) => {
          if (done) {
            if (currentText.trim()) {
              controller.error(new GoogleGenerativeAIError("Failed to parse stream"));
              return;
            }
            controller.close();
            return;
          }
          currentText += value;
          let match2 = currentText.match(responseLineRE);
          let parsedResponse;
          while (match2) {
            try {
              parsedResponse = JSON.parse(match2[1]);
            } catch (e) {
              controller.error(new GoogleGenerativeAIError(`Error parsing JSON response: "${match2[1]}"`));
              return;
            }
            controller.enqueue(parsedResponse);
            currentText = currentText.substring(match2[0].length);
            match2 = currentText.match(responseLineRE);
          }
          return pump();
        }).catch((e) => {
          let err = e;
          err.stack = e.stack;
          if (err.name === "AbortError") {
            err = new GoogleGenerativeAIAbortError("Request aborted when reading from the stream");
          } else {
            err = new GoogleGenerativeAIError("Error reading from the stream");
          }
          throw err;
        });
      }
      __name(pump, "pump");
      __name2(pump, "pump");
    }
  });
  return stream;
}
__name(getResponseStream, "getResponseStream");
__name2(getResponseStream, "getResponseStream");
function aggregateResponses(responses) {
  const lastResponse = responses[responses.length - 1];
  const aggregatedResponse = {
    promptFeedback: lastResponse === null || lastResponse === void 0 ? void 0 : lastResponse.promptFeedback
  };
  for (const response of responses) {
    if (response.candidates) {
      let candidateIndex = 0;
      for (const candidate of response.candidates) {
        if (!aggregatedResponse.candidates) {
          aggregatedResponse.candidates = [];
        }
        if (!aggregatedResponse.candidates[candidateIndex]) {
          aggregatedResponse.candidates[candidateIndex] = {
            index: candidateIndex
          };
        }
        aggregatedResponse.candidates[candidateIndex].citationMetadata = candidate.citationMetadata;
        aggregatedResponse.candidates[candidateIndex].groundingMetadata = candidate.groundingMetadata;
        aggregatedResponse.candidates[candidateIndex].finishReason = candidate.finishReason;
        aggregatedResponse.candidates[candidateIndex].finishMessage = candidate.finishMessage;
        aggregatedResponse.candidates[candidateIndex].safetyRatings = candidate.safetyRatings;
        if (candidate.content && candidate.content.parts) {
          if (!aggregatedResponse.candidates[candidateIndex].content) {
            aggregatedResponse.candidates[candidateIndex].content = {
              role: candidate.content.role || "user",
              parts: []
            };
          }
          const newPart = {};
          for (const part of candidate.content.parts) {
            if (part.text) {
              newPart.text = part.text;
            }
            if (part.functionCall) {
              newPart.functionCall = part.functionCall;
            }
            if (part.executableCode) {
              newPart.executableCode = part.executableCode;
            }
            if (part.codeExecutionResult) {
              newPart.codeExecutionResult = part.codeExecutionResult;
            }
            if (Object.keys(newPart).length === 0) {
              newPart.text = "";
            }
            aggregatedResponse.candidates[candidateIndex].content.parts.push(newPart);
          }
        }
      }
      candidateIndex++;
    }
    if (response.usageMetadata) {
      aggregatedResponse.usageMetadata = response.usageMetadata;
    }
  }
  return aggregatedResponse;
}
__name(aggregateResponses, "aggregateResponses");
__name2(aggregateResponses, "aggregateResponses");
async function generateContentStream(apiKey, model, params, requestOptions) {
  const response = await makeModelRequest(
    model,
    Task.STREAM_GENERATE_CONTENT,
    apiKey,
    /* stream */
    true,
    JSON.stringify(params),
    requestOptions
  );
  return processStream(response);
}
__name(generateContentStream, "generateContentStream");
__name2(generateContentStream, "generateContentStream");
async function generateContent(apiKey, model, params, requestOptions) {
  const response = await makeModelRequest(
    model,
    Task.GENERATE_CONTENT,
    apiKey,
    /* stream */
    false,
    JSON.stringify(params),
    requestOptions
  );
  const responseJson = await response.json();
  const enhancedResponse = addHelpers(responseJson);
  return {
    response: enhancedResponse
  };
}
__name(generateContent, "generateContent");
__name2(generateContent, "generateContent");
function formatSystemInstruction(input) {
  if (input == null) {
    return void 0;
  } else if (typeof input === "string") {
    return { role: "system", parts: [{ text: input }] };
  } else if (input.text) {
    return { role: "system", parts: [input] };
  } else if (input.parts) {
    if (!input.role) {
      return { role: "system", parts: input.parts };
    } else {
      return input;
    }
  }
}
__name(formatSystemInstruction, "formatSystemInstruction");
__name2(formatSystemInstruction, "formatSystemInstruction");
function formatNewContent(request) {
  let newParts = [];
  if (typeof request === "string") {
    newParts = [{ text: request }];
  } else {
    for (const partOrString of request) {
      if (typeof partOrString === "string") {
        newParts.push({ text: partOrString });
      } else {
        newParts.push(partOrString);
      }
    }
  }
  return assignRoleToPartsAndValidateSendMessageRequest(newParts);
}
__name(formatNewContent, "formatNewContent");
__name2(formatNewContent, "formatNewContent");
function assignRoleToPartsAndValidateSendMessageRequest(parts) {
  const userContent = { role: "user", parts: [] };
  const functionContent = { role: "function", parts: [] };
  let hasUserContent = false;
  let hasFunctionContent = false;
  for (const part of parts) {
    if ("functionResponse" in part) {
      functionContent.parts.push(part);
      hasFunctionContent = true;
    } else {
      userContent.parts.push(part);
      hasUserContent = true;
    }
  }
  if (hasUserContent && hasFunctionContent) {
    throw new GoogleGenerativeAIError("Within a single message, FunctionResponse cannot be mixed with other type of part in the request for sending chat message.");
  }
  if (!hasUserContent && !hasFunctionContent) {
    throw new GoogleGenerativeAIError("No content is provided for sending chat message.");
  }
  if (hasUserContent) {
    return userContent;
  }
  return functionContent;
}
__name(assignRoleToPartsAndValidateSendMessageRequest, "assignRoleToPartsAndValidateSendMessageRequest");
__name2(assignRoleToPartsAndValidateSendMessageRequest, "assignRoleToPartsAndValidateSendMessageRequest");
function formatCountTokensInput(params, modelParams) {
  var _a;
  let formattedGenerateContentRequest = {
    model: modelParams === null || modelParams === void 0 ? void 0 : modelParams.model,
    generationConfig: modelParams === null || modelParams === void 0 ? void 0 : modelParams.generationConfig,
    safetySettings: modelParams === null || modelParams === void 0 ? void 0 : modelParams.safetySettings,
    tools: modelParams === null || modelParams === void 0 ? void 0 : modelParams.tools,
    toolConfig: modelParams === null || modelParams === void 0 ? void 0 : modelParams.toolConfig,
    systemInstruction: modelParams === null || modelParams === void 0 ? void 0 : modelParams.systemInstruction,
    cachedContent: (_a = modelParams === null || modelParams === void 0 ? void 0 : modelParams.cachedContent) === null || _a === void 0 ? void 0 : _a.name,
    contents: []
  };
  const containsGenerateContentRequest = params.generateContentRequest != null;
  if (params.contents) {
    if (containsGenerateContentRequest) {
      throw new GoogleGenerativeAIRequestInputError("CountTokensRequest must have one of contents or generateContentRequest, not both.");
    }
    formattedGenerateContentRequest.contents = params.contents;
  } else if (containsGenerateContentRequest) {
    formattedGenerateContentRequest = Object.assign(Object.assign({}, formattedGenerateContentRequest), params.generateContentRequest);
  } else {
    const content = formatNewContent(params);
    formattedGenerateContentRequest.contents = [content];
  }
  return { generateContentRequest: formattedGenerateContentRequest };
}
__name(formatCountTokensInput, "formatCountTokensInput");
__name2(formatCountTokensInput, "formatCountTokensInput");
function formatGenerateContentInput(params) {
  let formattedRequest;
  if (params.contents) {
    formattedRequest = params;
  } else {
    const content = formatNewContent(params);
    formattedRequest = { contents: [content] };
  }
  if (params.systemInstruction) {
    formattedRequest.systemInstruction = formatSystemInstruction(params.systemInstruction);
  }
  return formattedRequest;
}
__name(formatGenerateContentInput, "formatGenerateContentInput");
__name2(formatGenerateContentInput, "formatGenerateContentInput");
function formatEmbedContentInput(params) {
  if (typeof params === "string" || Array.isArray(params)) {
    const content = formatNewContent(params);
    return { content };
  }
  return params;
}
__name(formatEmbedContentInput, "formatEmbedContentInput");
__name2(formatEmbedContentInput, "formatEmbedContentInput");
var VALID_PART_FIELDS = [
  "text",
  "inlineData",
  "functionCall",
  "functionResponse",
  "executableCode",
  "codeExecutionResult"
];
var VALID_PARTS_PER_ROLE = {
  user: ["text", "inlineData"],
  function: ["functionResponse"],
  model: ["text", "functionCall", "executableCode", "codeExecutionResult"],
  // System instructions shouldn't be in history anyway.
  system: ["text"]
};
function validateChatHistory(history) {
  let prevContent = false;
  for (const currContent of history) {
    const { role, parts } = currContent;
    if (!prevContent && role !== "user") {
      throw new GoogleGenerativeAIError(`First content should be with role 'user', got ${role}`);
    }
    if (!POSSIBLE_ROLES.includes(role)) {
      throw new GoogleGenerativeAIError(`Each item should include role field. Got ${role} but valid roles are: ${JSON.stringify(POSSIBLE_ROLES)}`);
    }
    if (!Array.isArray(parts)) {
      throw new GoogleGenerativeAIError("Content should have 'parts' property with an array of Parts");
    }
    if (parts.length === 0) {
      throw new GoogleGenerativeAIError("Each Content should have at least one part");
    }
    const countFields = {
      text: 0,
      inlineData: 0,
      functionCall: 0,
      functionResponse: 0,
      fileData: 0,
      executableCode: 0,
      codeExecutionResult: 0
    };
    for (const part of parts) {
      for (const key of VALID_PART_FIELDS) {
        if (key in part) {
          countFields[key] += 1;
        }
      }
    }
    const validParts = VALID_PARTS_PER_ROLE[role];
    for (const key of VALID_PART_FIELDS) {
      if (!validParts.includes(key) && countFields[key] > 0) {
        throw new GoogleGenerativeAIError(`Content with role '${role}' can't contain '${key}' part`);
      }
    }
    prevContent = true;
  }
}
__name(validateChatHistory, "validateChatHistory");
__name2(validateChatHistory, "validateChatHistory");
function isValidResponse(response) {
  var _a;
  if (response.candidates === void 0 || response.candidates.length === 0) {
    return false;
  }
  const content = (_a = response.candidates[0]) === null || _a === void 0 ? void 0 : _a.content;
  if (content === void 0) {
    return false;
  }
  if (content.parts === void 0 || content.parts.length === 0) {
    return false;
  }
  for (const part of content.parts) {
    if (part === void 0 || Object.keys(part).length === 0) {
      return false;
    }
    if (part.text !== void 0 && part.text === "") {
      return false;
    }
  }
  return true;
}
__name(isValidResponse, "isValidResponse");
__name2(isValidResponse, "isValidResponse");
var SILENT_ERROR = "SILENT_ERROR";
var ChatSession = class {
  static {
    __name(this, "ChatSession");
  }
  static {
    __name2(this, "ChatSession");
  }
  constructor(apiKey, model, params, _requestOptions = {}) {
    this.model = model;
    this.params = params;
    this._requestOptions = _requestOptions;
    this._history = [];
    this._sendPromise = Promise.resolve();
    this._apiKey = apiKey;
    if (params === null || params === void 0 ? void 0 : params.history) {
      validateChatHistory(params.history);
      this._history = params.history;
    }
  }
  /**
   * Gets the chat history so far. Blocked prompts are not added to history.
   * Blocked candidates are not added to history, nor are the prompts that
   * generated them.
   */
  async getHistory() {
    await this._sendPromise;
    return this._history;
  }
  /**
   * Sends a chat message and receives a non-streaming
   * {@link GenerateContentResult}.
   *
   * Fields set in the optional {@link SingleRequestOptions} parameter will
   * take precedence over the {@link RequestOptions} values provided to
   * {@link GoogleGenerativeAI.getGenerativeModel }.
   */
  async sendMessage(request, requestOptions = {}) {
    var _a, _b, _c, _d, _e, _f;
    await this._sendPromise;
    const newContent = formatNewContent(request);
    const generateContentRequest = {
      safetySettings: (_a = this.params) === null || _a === void 0 ? void 0 : _a.safetySettings,
      generationConfig: (_b = this.params) === null || _b === void 0 ? void 0 : _b.generationConfig,
      tools: (_c = this.params) === null || _c === void 0 ? void 0 : _c.tools,
      toolConfig: (_d = this.params) === null || _d === void 0 ? void 0 : _d.toolConfig,
      systemInstruction: (_e = this.params) === null || _e === void 0 ? void 0 : _e.systemInstruction,
      cachedContent: (_f = this.params) === null || _f === void 0 ? void 0 : _f.cachedContent,
      contents: [...this._history, newContent]
    };
    const chatSessionRequestOptions = Object.assign(Object.assign({}, this._requestOptions), requestOptions);
    let finalResult;
    this._sendPromise = this._sendPromise.then(() => generateContent(this._apiKey, this.model, generateContentRequest, chatSessionRequestOptions)).then((result) => {
      var _a2;
      if (isValidResponse(result.response)) {
        this._history.push(newContent);
        const responseContent = Object.assign({
          parts: [],
          // Response seems to come back without a role set.
          role: "model"
        }, (_a2 = result.response.candidates) === null || _a2 === void 0 ? void 0 : _a2[0].content);
        this._history.push(responseContent);
      } else {
        const blockErrorMessage = formatBlockErrorMessage(result.response);
        if (blockErrorMessage) {
          console.warn(`sendMessage() was unsuccessful. ${blockErrorMessage}. Inspect response object for details.`);
        }
      }
      finalResult = result;
    });
    await this._sendPromise;
    return finalResult;
  }
  /**
   * Sends a chat message and receives the response as a
   * {@link GenerateContentStreamResult} containing an iterable stream
   * and a response promise.
   *
   * Fields set in the optional {@link SingleRequestOptions} parameter will
   * take precedence over the {@link RequestOptions} values provided to
   * {@link GoogleGenerativeAI.getGenerativeModel }.
   */
  async sendMessageStream(request, requestOptions = {}) {
    var _a, _b, _c, _d, _e, _f;
    await this._sendPromise;
    const newContent = formatNewContent(request);
    const generateContentRequest = {
      safetySettings: (_a = this.params) === null || _a === void 0 ? void 0 : _a.safetySettings,
      generationConfig: (_b = this.params) === null || _b === void 0 ? void 0 : _b.generationConfig,
      tools: (_c = this.params) === null || _c === void 0 ? void 0 : _c.tools,
      toolConfig: (_d = this.params) === null || _d === void 0 ? void 0 : _d.toolConfig,
      systemInstruction: (_e = this.params) === null || _e === void 0 ? void 0 : _e.systemInstruction,
      cachedContent: (_f = this.params) === null || _f === void 0 ? void 0 : _f.cachedContent,
      contents: [...this._history, newContent]
    };
    const chatSessionRequestOptions = Object.assign(Object.assign({}, this._requestOptions), requestOptions);
    const streamPromise = generateContentStream(this._apiKey, this.model, generateContentRequest, chatSessionRequestOptions);
    this._sendPromise = this._sendPromise.then(() => streamPromise).catch((_ignored) => {
      throw new Error(SILENT_ERROR);
    }).then((streamResult) => streamResult.response).then((response) => {
      if (isValidResponse(response)) {
        this._history.push(newContent);
        const responseContent = Object.assign({}, response.candidates[0].content);
        if (!responseContent.role) {
          responseContent.role = "model";
        }
        this._history.push(responseContent);
      } else {
        const blockErrorMessage = formatBlockErrorMessage(response);
        if (blockErrorMessage) {
          console.warn(`sendMessageStream() was unsuccessful. ${blockErrorMessage}. Inspect response object for details.`);
        }
      }
    }).catch((e) => {
      if (e.message !== SILENT_ERROR) {
        console.error(e);
      }
    });
    return streamPromise;
  }
};
async function countTokens(apiKey, model, params, singleRequestOptions) {
  const response = await makeModelRequest(model, Task.COUNT_TOKENS, apiKey, false, JSON.stringify(params), singleRequestOptions);
  return response.json();
}
__name(countTokens, "countTokens");
__name2(countTokens, "countTokens");
async function embedContent(apiKey, model, params, requestOptions) {
  const response = await makeModelRequest(model, Task.EMBED_CONTENT, apiKey, false, JSON.stringify(params), requestOptions);
  return response.json();
}
__name(embedContent, "embedContent");
__name2(embedContent, "embedContent");
async function batchEmbedContents(apiKey, model, params, requestOptions) {
  const requestsWithModel = params.requests.map((request) => {
    return Object.assign(Object.assign({}, request), { model });
  });
  const response = await makeModelRequest(model, Task.BATCH_EMBED_CONTENTS, apiKey, false, JSON.stringify({ requests: requestsWithModel }), requestOptions);
  return response.json();
}
__name(batchEmbedContents, "batchEmbedContents");
__name2(batchEmbedContents, "batchEmbedContents");
var GenerativeModel = class {
  static {
    __name(this, "GenerativeModel");
  }
  static {
    __name2(this, "GenerativeModel");
  }
  constructor(apiKey, modelParams, _requestOptions = {}) {
    this.apiKey = apiKey;
    this._requestOptions = _requestOptions;
    if (modelParams.model.includes("/")) {
      this.model = modelParams.model;
    } else {
      this.model = `models/${modelParams.model}`;
    }
    this.generationConfig = modelParams.generationConfig || {};
    this.safetySettings = modelParams.safetySettings || [];
    this.tools = modelParams.tools;
    this.toolConfig = modelParams.toolConfig;
    this.systemInstruction = formatSystemInstruction(modelParams.systemInstruction);
    this.cachedContent = modelParams.cachedContent;
  }
  /**
   * Makes a single non-streaming call to the model
   * and returns an object containing a single {@link GenerateContentResponse}.
   *
   * Fields set in the optional {@link SingleRequestOptions} parameter will
   * take precedence over the {@link RequestOptions} values provided to
   * {@link GoogleGenerativeAI.getGenerativeModel }.
   */
  async generateContent(request, requestOptions = {}) {
    var _a;
    const formattedParams = formatGenerateContentInput(request);
    const generativeModelRequestOptions = Object.assign(Object.assign({}, this._requestOptions), requestOptions);
    return generateContent(this.apiKey, this.model, Object.assign({ generationConfig: this.generationConfig, safetySettings: this.safetySettings, tools: this.tools, toolConfig: this.toolConfig, systemInstruction: this.systemInstruction, cachedContent: (_a = this.cachedContent) === null || _a === void 0 ? void 0 : _a.name }, formattedParams), generativeModelRequestOptions);
  }
  /**
   * Makes a single streaming call to the model and returns an object
   * containing an iterable stream that iterates over all chunks in the
   * streaming response as well as a promise that returns the final
   * aggregated response.
   *
   * Fields set in the optional {@link SingleRequestOptions} parameter will
   * take precedence over the {@link RequestOptions} values provided to
   * {@link GoogleGenerativeAI.getGenerativeModel }.
   */
  async generateContentStream(request, requestOptions = {}) {
    var _a;
    const formattedParams = formatGenerateContentInput(request);
    const generativeModelRequestOptions = Object.assign(Object.assign({}, this._requestOptions), requestOptions);
    return generateContentStream(this.apiKey, this.model, Object.assign({ generationConfig: this.generationConfig, safetySettings: this.safetySettings, tools: this.tools, toolConfig: this.toolConfig, systemInstruction: this.systemInstruction, cachedContent: (_a = this.cachedContent) === null || _a === void 0 ? void 0 : _a.name }, formattedParams), generativeModelRequestOptions);
  }
  /**
   * Gets a new {@link ChatSession} instance which can be used for
   * multi-turn chats.
   */
  startChat(startChatParams) {
    var _a;
    return new ChatSession(this.apiKey, this.model, Object.assign({ generationConfig: this.generationConfig, safetySettings: this.safetySettings, tools: this.tools, toolConfig: this.toolConfig, systemInstruction: this.systemInstruction, cachedContent: (_a = this.cachedContent) === null || _a === void 0 ? void 0 : _a.name }, startChatParams), this._requestOptions);
  }
  /**
   * Counts the tokens in the provided request.
   *
   * Fields set in the optional {@link SingleRequestOptions} parameter will
   * take precedence over the {@link RequestOptions} values provided to
   * {@link GoogleGenerativeAI.getGenerativeModel }.
   */
  async countTokens(request, requestOptions = {}) {
    const formattedParams = formatCountTokensInput(request, {
      model: this.model,
      generationConfig: this.generationConfig,
      safetySettings: this.safetySettings,
      tools: this.tools,
      toolConfig: this.toolConfig,
      systemInstruction: this.systemInstruction,
      cachedContent: this.cachedContent
    });
    const generativeModelRequestOptions = Object.assign(Object.assign({}, this._requestOptions), requestOptions);
    return countTokens(this.apiKey, this.model, formattedParams, generativeModelRequestOptions);
  }
  /**
   * Embeds the provided content.
   *
   * Fields set in the optional {@link SingleRequestOptions} parameter will
   * take precedence over the {@link RequestOptions} values provided to
   * {@link GoogleGenerativeAI.getGenerativeModel }.
   */
  async embedContent(request, requestOptions = {}) {
    const formattedParams = formatEmbedContentInput(request);
    const generativeModelRequestOptions = Object.assign(Object.assign({}, this._requestOptions), requestOptions);
    return embedContent(this.apiKey, this.model, formattedParams, generativeModelRequestOptions);
  }
  /**
   * Embeds an array of {@link EmbedContentRequest}s.
   *
   * Fields set in the optional {@link SingleRequestOptions} parameter will
   * take precedence over the {@link RequestOptions} values provided to
   * {@link GoogleGenerativeAI.getGenerativeModel }.
   */
  async batchEmbedContents(batchEmbedContentRequest, requestOptions = {}) {
    const generativeModelRequestOptions = Object.assign(Object.assign({}, this._requestOptions), requestOptions);
    return batchEmbedContents(this.apiKey, this.model, batchEmbedContentRequest, generativeModelRequestOptions);
  }
};
var GoogleGenerativeAI = class {
  static {
    __name(this, "GoogleGenerativeAI");
  }
  static {
    __name2(this, "GoogleGenerativeAI");
  }
  constructor(apiKey) {
    this.apiKey = apiKey;
  }
  /**
   * Gets a {@link GenerativeModel} instance for the provided model name.
   */
  getGenerativeModel(modelParams, requestOptions) {
    if (!modelParams.model) {
      throw new GoogleGenerativeAIError(`Must provide a model name. Example: genai.getGenerativeModel({ model: 'my-model-name' })`);
    }
    return new GenerativeModel(this.apiKey, modelParams, requestOptions);
  }
  /**
   * Creates a {@link GenerativeModel} instance from provided content cache.
   */
  getGenerativeModelFromCachedContent(cachedContent, modelParams, requestOptions) {
    if (!cachedContent.name) {
      throw new GoogleGenerativeAIRequestInputError("Cached content must contain a `name` field.");
    }
    if (!cachedContent.model) {
      throw new GoogleGenerativeAIRequestInputError("Cached content must contain a `model` field.");
    }
    const disallowedDuplicates = ["model", "systemInstruction"];
    for (const key of disallowedDuplicates) {
      if ((modelParams === null || modelParams === void 0 ? void 0 : modelParams[key]) && cachedContent[key] && (modelParams === null || modelParams === void 0 ? void 0 : modelParams[key]) !== cachedContent[key]) {
        if (key === "model") {
          const modelParamsComp = modelParams.model.startsWith("models/") ? modelParams.model.replace("models/", "") : modelParams.model;
          const cachedContentComp = cachedContent.model.startsWith("models/") ? cachedContent.model.replace("models/", "") : cachedContent.model;
          if (modelParamsComp === cachedContentComp) {
            continue;
          }
        }
        throw new GoogleGenerativeAIRequestInputError(`Different value for "${key}" specified in modelParams (${modelParams[key]}) and cachedContent (${cachedContent[key]})`);
      }
    }
    const modelParamsFromCache = Object.assign(Object.assign({}, modelParams), { model: cachedContent.model, tools: cachedContent.tools, toolConfig: cachedContent.toolConfig, systemInstruction: cachedContent.systemInstruction, cachedContent });
    return new GenerativeModel(this.apiKey, modelParamsFromCache, requestOptions);
  }
};
function createAnalysisPrompt(history, userQuery) {
  const analysisPrompt = `
Voc\xEA \xE9 um assistente focado em ajudar estudantes com quest\xF5es do PAVE UFPel.
Analise a \xFAltima mensagem do usu\xE1rio neste hist\xF3rico:
${JSON.stringify(history)}

\xDAltima mensagem do usu\xE1rio: "${userQuery}"

Sua Tarefa:
1.  Determine a inten\xE7\xE3o principal: BUSCAR_QUESTAO (mostrar existente), CRIAR_QUESTAO (gerar nova), CONVERSAR (responder pergunta/coment\xE1rio), DESCONHECIDO.
1,5. Se o usario pedir por uma questao mas nao falar que quer que essa questao seja criada gerada ou algum termo do tipo NAO detecte como CRIAR_QUESTAO e sim como BUSCAR_QUESTAO
2.  Se BUSCAR_QUESTAO ou CRIAR_QUESTAO, extraia entidades: 'materia', 'topico', 'ano' (use null se n\xE3o encontrar).
3.  **SE a inten\xE7\xE3o for CRIAR_QUESTAO:**
    a.  Gere uma quest\xE3o IN\xC9DITA de m\xFAltipla escolha (A-E) sobre o t\xF3pico/descri\xE7\xE3o extra\xEDdo, no estilo PAVE.
    b.  **TENTE** formatar essa quest\xE3o GERADA como um objeto JSON dentro do campo "generated_question". A estrutura DEVE ser: { "materia": "...", "topico": "...", "texto_questao": "...", "alternativas": [ { "letra": "A", "texto": "..." }, ... ], "resposta_letra": "..." }. Use null para mat\xE9ria/t\xF3pico se n\xE3o conseguir definir.
    c.  Inclua um breve coment\xE1rio introdut\xF3rio (exemplo: "Certo, elaborei esta quest\xE3o:") no in\xEDcio do "responseText" APENAS se o "generated_question" for null.
4.  **SE a inten\xE7\xE3o for CONVERSAR:** Gere uma resposta textual apropriada e coloque-a em "responseText". O campo "generated_question" DEVE ser null.
5.  **SE a inten\xE7\xE3o for BUSCAR_QUESTAO ou DESCONHECIDO:** Os campos "generated_question" e "responseText" DEVEM ser null.
6.  Retorne ESTRITAMENTE um objeto JSON v\xE1lido com a estrutura:
    {
      "intent": "...",
      "entities": { "materia": "...", "topico": "...", "ano": ... } | null,
      "generated_question": { ... (objeto da quest\xE3o) ... } | null,
      "responseText": "..." | null
    }
`;
  return analysisPrompt;
}
__name(createAnalysisPrompt, "createAnalysisPrompt");
__name2(createAnalysisPrompt, "createAnalysisPrompt");
function removeAccents(str) {
  if (typeof str !== "string") return "";
  try {
    return str.normalize("NFD").replace(/[\u0300-\u036f]/g, "");
  } catch (e) {
    console.warn("Erro em removeAccents:", e, "Input:", str);
    return str || "";
  }
}
__name(removeAccents, "removeAccents");
__name2(removeAccents, "removeAccents");
function parseAiGeneratedQuestion(text) {
  if (typeof text !== "string" || !text) return null;
  console.log("[filter.js] Tentando parse de fallback...");
  try {
    const questaoMatch = text.match(/Enunciado:([\s\S]+)A\)([\s\S]+)B\)([\s\S]+)C\)([\s\S]+)D\)([\s\S]+)E\)([\s\S]+)(?:Resposta Correta|Gabarito):\s*\[?([A-E])\]?/im);
    if (questaoMatch) {
      const [_, enunciado, a, b, c, d, e, resp] = questaoMatch.map((s) => s?.trim());
      if (!enunciado || !a || !b || !c || !d || !e || !resp) {
        console.warn("[filter.js] Parse fallback: Faltam partes essenciais da quest\xE3o.");
        return null;
      }
      return {
        id: `gen-fallback-${Date.now()}`,
        ano: null,
        etapa: null,
        materia: "Gerada (Fallback)",
        topico: "Gerado (Fallback)",
        texto_questao: enunciado,
        referencia: "Quest\xE3o gerada por IA (fallback).",
        alternativas: [
          { letra: "A", texto: a },
          { letra: "B", texto: b },
          { letra: "C", texto: c },
          { letra: "D", texto: d },
          { letra: "E", texto: e }
        ],
        resposta_letra: resp.toUpperCase()
      };
    }
    console.warn("[filter.js] Parse fallback: Regex principal n\xE3o encontrou correspond\xEAncia.");
    return null;
  } catch (e) {
    console.error("[filter.js] Erro no parse de fallback:", e);
    return null;
  }
}
__name(parseAiGeneratedQuestion, "parseAiGeneratedQuestion");
__name2(parseAiGeneratedQuestion, "parseAiGeneratedQuestion");
function findQuestionsByEntities(entities, allQuestions) {
  if (!entities || typeof entities !== "object" || !Array.isArray(allQuestions)) {
    return [];
  }
  const { materia, ano, topico } = entities;
  let filtered = allQuestions.filter((q) => {
    if (!q || typeof q !== "object") return false;
    let match2 = true;
    if (materia && q.materia && removeAccents(q.materia.toLowerCase()) !== removeAccents(materia.toLowerCase())) {
      match2 = false;
    }
    if (ano && q.ano && q.ano !== parseInt(ano, 10)) {
      match2 = false;
    }
    if (match2 && topico) {
      const topicoQuestaoNorm = removeAccents((q.topico || "").toLowerCase());
      const enunciadoQuestaoNorm = removeAccents((q.texto_questao || "").toLowerCase());
      const palavrasTopicoFiltro = removeAccents(topico.toLowerCase()).split(/\s+/).filter((p) => p && p.length > 2);
      if (palavrasTopicoFiltro.length > 0) {
        const topicoMatchFound = palavrasTopicoFiltro.some(
          (pFiltro) => topicoQuestaoNorm.includes(pFiltro) || enunciadoQuestaoNorm.includes(pFiltro)
        );
        if (!topicoMatchFound) {
          match2 = false;
        }
      }
    }
    return match2;
  });
  console.log(`[filter.js] Encontradas ${filtered.length} quest\xF5es com entidades:`, entities);
  if (filtered.length > 1) {
    filtered.sort(() => 0.5 - Math.random());
  }
  return filtered;
}
__name(findQuestionsByEntities, "findQuestionsByEntities");
__name2(findQuestionsByEntities, "findQuestionsByEntities");
async function onRequestPost(context) {
  const functionName = "/api/ask (v4 - IA gera JSON)";
  console.log(`[LOG] ${functionName}: Iniciando POST request`);
  try {
    const { request, env } = context;
    const geminiApiKey = env.GEMINI_API_KEY;
    const r2Bucket = env.QUESTOES_PAVE_BUCKET;
    const modelName = env.MODEL_NAME || "gemini-2.0-flash";
    if (!r2Bucket) {
      throw new Error("Binding R2 [QUESTOES_PAVE_BUCKET] n\xE3o configurado.");
    }
    if (!geminiApiKey) {
      throw new Error("Vari\xE1vel de ambiente [GEMINI_API_KEY] n\xE3o configurada.");
    }
    console.log(`[LOG] ${functionName}: Configs OK. Modelo: ${modelName}`);
    let requestData;
    try {
      requestData = await request.json();
    } catch (e) {
      return new Response(JSON.stringify({ error: "Requisi\xE7\xE3o JSON inv\xE1lida." }), { status: 400 });
    }
    const history = requestData?.history;
    if (!Array.isArray(history) || history.length === 0) {
      return new Response(JSON.stringify({ error: "Hist\xF3rico inv\xE1lido ou vazio." }), { status: 400 });
    }
    const lastUserMessage = history.findLast((m) => m.role === "user");
    const userQuery = typeof lastUserMessage?.parts?.[0]?.text === "string" ? lastUserMessage.parts[0].text.trim() : null;
    if (!userQuery) {
      return new Response(JSON.stringify({ error: "Query do usu\xE1rio inv\xE1lida no hist\xF3rico." }), { status: 400 });
    }
    console.log(`[LOG] ${functionName}: Query: "${userQuery}"`);
    const analysisPrompt = createAnalysisPrompt(history, userQuery);
    console.log(`[LOG] ${functionName}: Enviando prompt de AN\xC1LISE para Gemini.`);
    const genAI = new GoogleGenerativeAI(geminiApiKey);
    const model = genAI.getGenerativeModel({ model: modelName });
    const safetySettings = [
      // Configurações de segurança
      { category: HarmCategory.HARM_CATEGORY_HARASSMENT, threshold: HarmBlockThreshold.BLOCK_MEDIUM_AND_ABOVE },
      { category: HarmCategory.HARM_CATEGORY_HATE_SPEECH, threshold: HarmBlockThreshold.BLOCK_MEDIUM_AND_ABOVE },
      { category: HarmCategory.HARM_CATEGORY_SEXUALLY_EXPLICIT, threshold: HarmBlockThreshold.BLOCK_MEDIUM_AND_ABOVE },
      { category: HarmCategory.HARM_CATEGORY_DANGEROUS_CONTENT, threshold: HarmBlockThreshold.BLOCK_MEDIUM_AND_ABOVE }
    ];
    let aiResponseText = "";
    try {
      const result = await model.generateContent({ contents: [{ role: "user", parts: [{ text: analysisPrompt }] }], safetySettings });
      const response = result.response;
      if (!response) {
        throw new Error("Resposta da API Gemini inv\xE1lida ou vazia.");
      }
      if (response.promptFeedback?.blockReason) {
        throw new Error(`Conte\xFAdo bloqueado pela IA. Raz\xE3o: ${response.promptFeedback.blockReason}`);
      }
      aiResponseText = response.text() || "";
      if (!aiResponseText) {
        throw new Error("A IA retornou uma string vazia.");
      }
    } catch (error) {
      console.error(`[ERRO] ${functionName}: Falha na chamada da API Gemini:`, error);
      return new Response(JSON.stringify({ error: `Erro ao comunicar com a IA: ${error.message}` }), { status: 503 });
    }
    let intent = "DESCONHECIDO";
    let entities = null;
    let generated_question = null;
    let responseText = null;
    let commentary = "";
    let questionsToReturn = [];
    try {
      console.log(`[LOG] ${functionName}: Parseando resposta IA: ${aiResponseText.substring(0, 100)}...`);
      const cleanedJsonString = aiResponseText.replace(/^```json\s*|```$/g, "").trim();
      const aiAnalysis = JSON.parse(cleanedJsonString);
      intent = aiAnalysis?.intent || "DESCONHECIDO";
      entities = aiAnalysis?.entities || null;
      generated_question = aiAnalysis?.generated_question || null;
      responseText = aiAnalysis?.responseText || null;
      console.log(`[LOG] ${functionName}: IA Parsed - Intent: ${intent}, Entities: ${JSON.stringify(entities)}, Question: ${generated_question ? "Sim" : "N\xE3o"}, RespText: ${responseText ? "Sim" : "N\xE3o"}`);
      if (intent === "CRIAR_QUESTAO" && !generated_question && !responseText) {
        console.warn(`[WARN] ${functionName}: Intent CRIAR, mas sem generated_question ou responseText.`);
        intent = "DESCONHECIDO";
        commentary = "Pedi para a IA criar uma quest\xE3o, mas n\xE3o recebi o conte\xFAdo.";
      }
      if (intent === "CONVERSAR" && !responseText) {
        console.warn(`[WARN] ${functionName}: Intent CONVERSAR, mas sem responseText.`);
        intent = "DESCONHECIDO";
        commentary = "N\xE3o consegui gerar uma resposta para isso.";
      }
    } catch (e) {
      console.error(`[ERRO] ${functionName}: Falha ao parsear JSON da IA. Resposta:`, aiResponseText, "Erro:", e);
      intent = "DESCONHECIDO";
      commentary = "Desculpe, tive um problema ao processar a resposta da IA.";
    }
    switch (intent) {
      case "BUSCAR_QUESTAO":
        try {
          const r2Object = await r2Bucket.get("questoes.json");
          if (!r2Object) {
            commentary = "Erro ao acessar banco de quest\xF5es.";
            break;
          }
          const allQuestionsData = await r2Object.json();
          if (!Array.isArray(allQuestionsData)) {
            commentary = "Banco de quest\xF5es inv\xE1lido.";
            break;
          }
          const foundQuestions = findQuestionsByEntities(entities, allQuestionsData);
          if (foundQuestions.length > 0) {
            commentary = `Encontrei esta quest\xE3o sobre ${entities?.topico || entities?.materia || "o que pediu"}:`;
            questionsToReturn = [foundQuestions[0]];
          } else {
            commentary = `N\xE3o encontrei quest\xF5es existentes sobre ${entities?.topico || entities?.materia || "sua busca"}. Pe\xE7a para eu criar uma!`;
          }
        } catch (r2Error) {
          console.error(`[ERRO] ${functionName}: Falha R2:`, r2Error);
          commentary = "Erro ao acessar o banco de quest\xF5es.";
        }
        break;
      case "CRIAR_QUESTAO":
        if (generated_question) {
          commentary = "Certo, elaborei esta quest\xE3o:";
          generated_question.id = generated_question.id || `gen-${Date.now()}`;
          generated_question.referencia = generated_question.referencia || "Texto gerado por IA.";
          questionsToReturn = [generated_question];
          console.log("[LOG] Usando quest\xE3o JSON gerada pela IA.");
        } else if (responseText) {
          console.warn("[WARN] IA n\xE3o gerou JSON, tentando parse de fallback no responseText...");
          const parsedFallback = parseAiGeneratedQuestion(responseText);
          if (parsedFallback) {
            commentary = "Criei esta quest\xE3o para voc\xEA (parse fallback):";
            questionsToReturn = [parsedFallback];
          } else {
            commentary = `Tentei criar a quest\xE3o, mas houve um problema no formato final:

${responseText}`;
            questionsToReturn = [];
          }
        }
        break;
      case "CONVERSAR":
        commentary = responseText;
        questionsToReturn = [];
        break;
      case "DESCONHECIDO":
      default:
        if (!commentary) {
          commentary = "N\xE3o entendi bem. Voce pode pedir que eu busque ou crie quest\xF5es do PAVE.";
        }
        questionsToReturn = [];
        break;
    }
    console.log(`[LOG] ${functionName}: Retornando final. Coment\xE1rio: ${commentary ? "Sim" : "N\xE3o"}, Quest\xF5es: ${questionsToReturn.length}`);
    return new Response(JSON.stringify({ commentary, questions: questionsToReturn }), {
      headers: { "Content-Type": "application/json" },
      status: 200
    });
  } catch (error) {
    console.error(`[ERRO] ${functionName}: Erro GERAL:`, error);
    return new Response(JSON.stringify({ error: `Erro interno: ${error.message}` }), {
      status: 500,
      headers: { "Content-Type": "application/json" }
    });
  }
}
__name(onRequestPost, "onRequestPost");
__name2(onRequestPost, "onRequestPost");
async function onRequest(context) {
  if (context.request.method === "POST") {
    return await onRequestPost(context);
  }
  return new Response(`M\xE9todo ${context.request.method} n\xE3o permitido.`, { status: 405, headers: { "Allow": "POST" } });
}
__name(onRequest, "onRequest");
__name2(onRequest, "onRequest");
async function onRequestGet(context) {
  const { env } = context;
  const r2Bucket = env.QUESTOES_PAVE_BUCKET;
  if (!r2Bucket) {
    return new Response(JSON.stringify({ error: "Configura\xE7\xE3o interna do R2 faltando." }), { status: 500, headers: { "Content-Type": "application/json" } });
  }
  try {
    const r2Object = await r2Bucket.get("questoes.json");
    if (r2Object === null) {
      return new Response(JSON.stringify({ error: "Arquivo de quest\xF5es n\xE3o encontrado." }), { status: 404, headers: { "Content-Type": "application/json" } });
    }
    const allQuestionsData = await r2Object.json();
    if (!Array.isArray(allQuestionsData)) {
      return new Response(JSON.stringify({ error: "Formato de dados inv\xE1lido." }), { status: 500, headers: { "Content-Type": "application/json" } });
    }
    const anos = /* @__PURE__ */ new Set();
    const materias = /* @__PURE__ */ new Set();
    const etapas = /* @__PURE__ */ new Set();
    allQuestionsData.forEach((q) => {
      if (q) {
        if (q.ano) anos.add(q.ano);
        if (q.materia) materias.add(q.materia);
        if (q.etapa) etapas.add(q.etapa);
      }
    });
    const responseBody = {
      anos: Array.from(anos).sort((a, b) => b - a),
      materias: Array.from(materias).sort(),
      etapas: Array.from(etapas).sort((a, b) => a - b)
    };
    return new Response(JSON.stringify(responseBody), {
      headers: {
        "Content-Type": "application/json",
        "Cache-Control": "public, max-age=3600"
      },
      status: 200
    });
  } catch (error) {
    console.error(`[ERRO] /api/questions/filters:`, error.message, error.stack);
    return new Response(JSON.stringify({ error: `Erro ao obter op\xE7\xF5es de filtro: ${error.message}` }), {
      status: 500,
      headers: { "Content-Type": "application/json" }
    });
  }
}
__name(onRequestGet, "onRequestGet");
__name2(onRequestGet, "onRequestGet");
async function onRequest2(context) {
  if (context.request.method === "GET") {
    return await onRequestGet(context);
  }
  return new Response(`M\xE9todo ${context.request.method} n\xE3o permitido. Use GET.`, { status: 405 });
}
__name(onRequest2, "onRequest2");
__name2(onRequest2, "onRequest");
var EMBEDDING_MODEL = "@cf/baai/bge-base-en-v1.5";
async function generateEmbeddingsBatch(ai, texts) {
  if (!texts || texts.length === 0) return [];
  try {
    const response = await ai.run(EMBEDDING_MODEL, { text: texts });
    return response.data || [];
  } catch (e) {
    console.error(
      `Erro ao gerar embeddings para lote: ${e.message}`,
      texts.slice(0, 2)
    );
    return texts.map(() => null);
  }
}
__name(generateEmbeddingsBatch, "generateEmbeddingsBatch");
__name2(generateEmbeddingsBatch, "generateEmbeddingsBatch");
async function onRequestPost2(context) {
  const { request, env } = context;
  const adminSecret = request.headers.get("X-Admin-Secret");
  if (adminSecret !== env.INDEXING_SECRET && env.CF_ENV !== "development") {
    return new Response("Acesso n\xE3o autorizado.", { status: 403 });
  }
  const r2Bucket = env.QUESTOES_PAVE_BUCKET;
  const vectorIndex = env.QUESTIONS_INDEX;
  const ai = env.AI;
  if (!r2Bucket || !vectorIndex || !ai) {
    return new Response(
      JSON.stringify({
        error: "Bindings R2, Vectorize ou AI n\xE3o configurados."
      }),
      { status: 500, headers: { "Content-Type": "application/json" } }
    );
  }
  try {
    console.log("Iniciando processo de indexa\xE7\xE3o...");
    const r2Object = await r2Bucket.get("questoes.json");
    if (r2Object === null) {
      return new Response(
        JSON.stringify({ error: "questoes.json n\xE3o encontrado no R2." }),
        { status: 404 }
      );
    }
    const allQuestionsData = await r2Object.json();
    if (!Array.isArray(allQuestionsData)) {
      return new Response(
        JSON.stringify({ error: "Formato de questoes.json inv\xE1lido." }),
        { status: 500 }
      );
    }
    console.log(`Total de ${allQuestionsData.length} quest\xF5es para processar.`);
    const vectorsToInsert = [];
    const textsForEmbedding = [];
    const questionMetadatas = [];
    for (const questao of allQuestionsData) {
      if (!questao || !questao.id || !questao.texto_questao) {
        console.warn("Quest\xE3o inv\xE1lida ou sem ID/texto:", questao);
        continue;
      }
      let textToEmbed = `${questao.materia || ""} ${questao.topico || ""} ${questao.texto_questao}`;
      textToEmbed = textToEmbed.replace(/\s+/g, " ").trim();
      if (textToEmbed) {
        textsForEmbedding.push(textToEmbed);
        questionMetadatas.push({
          id: questao.id.toString(),
          // ID da questão original (precisa ser string)
          // Metadados para filtragem. Vectorize aceita string, number, boolean.
          ano: questao.ano ? parseInt(questao.ano) : null,
          materia: questao.materia || "Indefinida",
          etapa: questao.etapa ? parseInt(questao.etapa) : null,
          topico: questao.topico || "Indefinido"
        });
      }
    }
    const batchSize = 50;
    let processedCount = 0;
    for (let i = 0; i < textsForEmbedding.length; i += batchSize) {
      const textBatch = textsForEmbedding.slice(i, i + batchSize);
      const metadataBatch = questionMetadatas.slice(i, i + batchSize);
      console.log(
        `Processando lote ${Math.floor(i / batchSize) + 1}... (${textBatch.length} textos)`
      );
      const embeddingVectors = await generateEmbeddingsBatch(ai, textBatch);
      const batchVectorsToInsert = [];
      for (let j = 0; j < embeddingVectors.length; j++) {
        if (embeddingVectors[j] && embeddingVectors[j].length > 0) {
          batchVectorsToInsert.push({
            id: metadataBatch[j].id,
            // ID original da questão
            values: embeddingVectors[j],
            // O vetor de embedding
            metadata: {
              // Metadados para filtragem
              ano: metadataBatch[j].ano,
              materia: metadataBatch[j].materia,
              etapa: metadataBatch[j].etapa,
              topico: metadataBatch[j].topico
            }
          });
        } else {
          console.warn(
            `Embedding n\xE3o gerado para quest\xE3o ID: ${metadataBatch[j].id}`
          );
        }
      }
      if (batchVectorsToInsert.length > 0) {
        await vectorIndex.upsert(batchVectorsToInsert);
        processedCount += batchVectorsToInsert.length;
        console.log(
          `${batchVectorsToInsert.length} vetores inseridos/atualizados no \xEDndice.`
        );
      }
    }
    return new Response(
      JSON.stringify({
        message: `Indexa\xE7\xE3o conclu\xEDda. ${processedCount} vetores processados e inseridos/atualizados.`
      }),
      { status: 200 }
    );
  } catch (error) {
    console.error("Erro durante a indexa\xE7\xE3o:", error);
    return new Response(
      JSON.stringify({ error: `Erro na indexa\xE7\xE3o: ${error.message}` }),
      { status: 500 }
    );
  }
}
__name(onRequestPost2, "onRequestPost2");
__name2(onRequestPost2, "onRequestPost");
async function onRequest3(context) {
  if (context.request.method === "POST") {
    return await onRequestPost2(context);
  }
  return new Response(
    `M\xE9todo ${context.request.method} n\xE3o permitido. Use POST para indexar.`,
    { status: 405 }
  );
}
__name(onRequest3, "onRequest3");
__name2(onRequest3, "onRequest");
var DEFAULT_LIMIT = 20;
async function onRequestGet2(context) {
  const { request, env } = context;
  const r2Bucket = env.QUESTOES_PAVE_BUCKET;
  if (!r2Bucket) {
    return new Response(
      JSON.stringify({ error: "Configura\xE7\xE3o interna do R2 faltando." }),
      { status: 500, headers: { "Content-Type": "application/json" } }
    );
  }
  try {
    const url = new URL(request.url);
    const params = url.searchParams;
    const materia = params.get("materia");
    const anoStr = params.get("ano");
    const etapaStr = params.get("etapa");
    const page = parseInt(params.get("page") || "1", 10);
    const limit = parseInt(params.get("limit") || `${DEFAULT_LIMIT}`, 10);
    const ano = anoStr ? parseInt(anoStr, 10) : null;
    const etapa = etapaStr ? parseInt(etapaStr, 10) : null;
    if (page < 1 || limit < 1) {
      return new Response(
        JSON.stringify({ error: "Par\xE2metros de pagina\xE7\xE3o inv\xE1lidos." }),
        { status: 400, headers: { "Content-Type": "application/json" } }
      );
    }
    const r2Object = await r2Bucket.get("questoes.json");
    if (r2Object === null) {
      return new Response(
        JSON.stringify({ error: "Arquivo de quest\xF5es n\xE3o encontrado." }),
        { status: 404, headers: { "Content-Type": "application/json" } }
      );
    }
    const allQuestionsData = await r2Object.json();
    if (!Array.isArray(allQuestionsData)) {
      return new Response(
        JSON.stringify({ error: "Formato de dados inv\xE1lido." }),
        { status: 500, headers: { "Content-Type": "application/json" } }
      );
    }
    const filteredQuestions = allQuestionsData.filter((q) => {
      if (!q || typeof q !== "object") return false;
      let match2 = true;
      if (materia && q.materia && removeAccents(q.materia.toLowerCase()) !== removeAccents(materia.toLowerCase())) {
        match2 = false;
      }
      if (ano && q.ano && q.ano !== ano) {
        match2 = false;
      }
      if (etapa && q.etapa && q.etapa !== etapa) {
        match2 = false;
      }
      return match2;
    });
    const totalItems = filteredQuestions.length;
    const totalPages = Math.ceil(totalItems / limit);
    const startIndex = (page - 1) * limit;
    const endIndex = startIndex + limit;
    const questionsForPage = filteredQuestions.slice(startIndex, endIndex);
    const responseBody = {
      questions: questionsForPage,
      pagination: {
        currentPage: page,
        totalPages,
        totalItems,
        limit
      }
    };
    return new Response(JSON.stringify(responseBody), {
      headers: {
        "Content-Type": "application/json",
        "Cache-Control": "no-store"
      },
      // Evitar cache na API
      status: 200
    });
  } catch (error) {
    console.error(`[ERRO] /api/questions:`, error);
    return new Response(
      JSON.stringify({ error: `Erro ao processar quest\xF5es: ${error.message}` }),
      {
        status: 500,
        headers: { "Content-Type": "application/json" }
      }
    );
  }
}
__name(onRequestGet2, "onRequestGet2");
__name2(onRequestGet2, "onRequestGet");
async function onRequest4(context) {
  if (context.request.method === "GET") {
    return await onRequestGet2(context);
  }
  return new Response(
    `M\xE9todo ${context.request.method} n\xE3o permitido. Use GET.`,
    { status: 405 }
  );
}
__name(onRequest4, "onRequest4");
__name2(onRequest4, "onRequest");
var EMBEDDING_MODEL2 = "@cf/baai/bge-base-en-v1.5";
var DEFAULT_SEARCH_LIMIT = 10;
var DEFAULT_TOP_K = 50;
async function onRequestGet3(context) {
  const { request, env } = context;
  const r2Bucket = env.QUESTOES_PAVE_BUCKET;
  const vectorIndex = env.QUESTIONS_INDEX;
  const ai = env.AI;
  if (!r2Bucket || !vectorIndex || !ai) {
    return new Response(
      JSON.stringify({
        error: "Bindings R2, Vectorize ou AI n\xE3o configurados."
      }),
      { status: 500, headers: { "Content-Type": "application/json" } }
    );
  }
  try {
    const url = new URL(request.url);
    const params = url.searchParams;
    const searchQuery = params.get("query");
    const materia = params.get("materia");
    const anoStr = params.get("ano");
    const etapaStr = params.get("etapa");
    const page = parseInt(params.get("page") || "1", 10);
    const limit = parseInt(
      params.get("limit") || `${DEFAULT_SEARCH_LIMIT}`,
      10
    );
    if ((!searchQuery || searchQuery.trim() === "") && !materia && !anoStr && !etapaStr) {
      console.log(
        "Nenhuma query de busca ou filtro fornecido para search-questions. Retornando vazio."
      );
      return new Response(
        JSON.stringify({
          questions: [],
          pagination: {
            currentPage: page,
            totalPages: 0,
            totalItems: 0,
            limit
          }
        }),
        {
          status: 200,
          headers: {
            "Content-Type": "application/json",
            "Cache-Control": "no-store"
          }
        }
      );
    }
    let matchedQuestionIds = [];
    let allQuestionsData = null;
    if (searchQuery && searchQuery.trim() !== "") {
      const embeddingResponse = await ai.run(EMBEDDING_MODEL2, {
        text: [searchQuery.trim()]
      });
      if (!embeddingResponse.data || !embeddingResponse.data[0]) {
        throw new Error(
          "N\xE3o foi poss\xEDvel gerar embedding para a query de busca."
        );
      }
      const queryVector = embeddingResponse.data[0];
      const vectorizeFilter = {};
      if (materia) vectorizeFilter.materia = materia;
      if (anoStr) vectorizeFilter.ano = parseInt(anoStr);
      if (etapaStr) vectorizeFilter.etapa = parseInt(etapaStr);
      const searchOptions = { topK: DEFAULT_TOP_K };
      if (Object.keys(vectorizeFilter).length > 0) {
        searchOptions.filter = vectorizeFilter;
      }
      console.log(
        "Consultando Vectorize com query:",
        searchQuery,
        "e filtro:",
        vectorizeFilter
      );
      const vectorMatches = await vectorIndex.query(queryVector, searchOptions);
      console.log(
        `Vectorize retornou ${vectorMatches.matches.length} correspond\xEAncias para a query: "${searchQuery}".`
      );
      if (!vectorMatches.matches || vectorMatches.matches.length === 0) {
        return new Response(
          JSON.stringify({
            questions: [],
            pagination: {
              currentPage: 1,
              totalPages: 0,
              totalItems: 0,
              limit
            }
          }),
          {
            status: 200,
            headers: {
              "Content-Type": "application/json",
              "Cache-Control": "no-store"
            }
          }
        );
      }
      matchedQuestionIds = vectorMatches.matches.map((match2) => match2.id);
    } else {
      console.log(
        "Nenhuma query de busca, aplicando apenas filtros tradicionais:",
        { materia, anoStr, etapaStr }
      );
      const r2ObjectFallback = await r2Bucket.get("questoes.json");
      if (r2ObjectFallback === null)
        throw new Error(
          "questoes.json n\xE3o encontrado no R2 para fallback de filtro."
        );
      allQuestionsData = await r2ObjectFallback.json();
      if (!Array.isArray(allQuestionsData))
        throw new Error(
          "Formato de questoes.json inv\xE1lido para fallback de filtro."
        );
      const anoNum = anoStr ? parseInt(anoStr) : null;
      const etapaNum = etapaStr ? parseInt(etapaStr) : null;
      const filteredFallback = allQuestionsData.filter((q) => {
        let match2 = true;
        if (materia && q.materia?.toLowerCase() !== materia.toLowerCase())
          match2 = false;
        if (anoNum && q.ano !== anoNum) match2 = false;
        if (etapaNum && q.etapa !== etapaNum) match2 = false;
        return match2;
      });
      matchedQuestionIds = filteredFallback.map((q) => q.id.toString());
      console.log(
        `Filtragem tradicional encontrou ${matchedQuestionIds.length} IDs.`
      );
    }
    if (!allQuestionsData) {
      const r2Object = await r2Bucket.get("questoes.json");
      if (r2Object === null)
        throw new Error("questoes.json n\xE3o encontrado no R2.");
      allQuestionsData = await r2Object.json();
      if (!Array.isArray(allQuestionsData))
        throw new Error("Formato de questoes.json inv\xE1lido.");
    }
    const relevantQuestionsFull = matchedQuestionIds.map((id) => allQuestionsData.find((q) => q.id && q.id.toString() === id)).filter(Boolean);
    const totalItems = relevantQuestionsFull.length;
    const totalPages = Math.ceil(totalItems / limit);
    const startIndex = (page - 1) * limit;
    const endIndex = startIndex + limit;
    const questionsForPage = relevantQuestionsFull.slice(startIndex, endIndex);
    const responseBody = {
      questions: questionsForPage,
      pagination: {
        currentPage: page,
        totalPages,
        totalItems,
        limit
      }
    };
    return new Response(JSON.stringify(responseBody), {
      headers: {
        "Content-Type": "application/json",
        "Cache-Control": "no-store"
      },
      status: 200
    });
  } catch (error) {
    console.error(`[ERRO] /api/search-questions:`, error.message, error.stack);
    return new Response(
      JSON.stringify({ error: `Erro na busca: ${error.message}` }),
      { status: 500, headers: { "Content-Type": "application/json" } }
    );
  }
}
__name(onRequestGet3, "onRequestGet3");
__name2(onRequestGet3, "onRequestGet");
async function onRequest5(context) {
  if (context.request.method === "GET") {
    return await onRequestGet3(context);
  }
  return new Response(`M\xE9todo ${context.request.method} n\xE3o permitido.`, {
    status: 405
  });
}
__name(onRequest5, "onRequest5");
__name2(onRequest5, "onRequest");
async function onRequestGet4(context) {
  const { env } = context;
  const results = {
    hasR2: !!env.QUESTOES_PAVE_BUCKET,
    hasVectorize: !!env.QUESTIONS_INDEX,
    hasAI: !!env.AI,
    r2BindingType: typeof env.QUESTOES_PAVE_BUCKET,
    vectorizeBindingType: typeof env.QUESTIONS_INDEX,
    aiBindingType: typeof env.AI
  };
  if (env.QUESTOES_PAVE_BUCKET) {
    try {
      results.r2GetMethodExists = typeof env.QUESTOES_PAVE_BUCKET.get === "function";
    } catch (e) {
      results.r2Error = e.message;
    }
  }
  return new Response(JSON.stringify(results), {
    headers: { "Content-Type": "application/json" }
  });
}
__name(onRequestGet4, "onRequestGet4");
__name2(onRequestGet4, "onRequestGet");
var routes = [
  {
    routePath: "/api/ask",
    mountPath: "/api",
    method: "POST",
    middlewares: [],
    modules: [onRequestPost]
  },
  {
    routePath: "/api/get-filter-options",
    mountPath: "/api",
    method: "GET",
    middlewares: [],
    modules: [onRequestGet]
  },
  {
    routePath: "/api/index-questions",
    mountPath: "/api",
    method: "POST",
    middlewares: [],
    modules: [onRequestPost2]
  },
  {
    routePath: "/api/questions",
    mountPath: "/api",
    method: "GET",
    middlewares: [],
    modules: [onRequestGet2]
  },
  {
    routePath: "/api/search-questions",
    mountPath: "/api",
    method: "GET",
    middlewares: [],
    modules: [onRequestGet3]
  },
  {
    routePath: "/api/test-bindings",
    mountPath: "/api",
    method: "GET",
    middlewares: [],
    modules: [onRequestGet4]
  },
  {
    routePath: "/api/ask",
    mountPath: "/api",
    method: "",
    middlewares: [],
    modules: [onRequest]
  },
  {
    routePath: "/api/get-filter-options",
    mountPath: "/api",
    method: "",
    middlewares: [],
    modules: [onRequest2]
  },
  {
    routePath: "/api/index-questions",
    mountPath: "/api",
    method: "",
    middlewares: [],
    modules: [onRequest3]
  },
  {
    routePath: "/api/questions",
    mountPath: "/api",
    method: "",
    middlewares: [],
    modules: [onRequest4]
  },
  {
    routePath: "/api/search-questions",
    mountPath: "/api",
    method: "",
    middlewares: [],
    modules: [onRequest5]
  }
];
function lexer(str) {
  var tokens = [];
  var i = 0;
  while (i < str.length) {
    var char = str[i];
    if (char === "*" || char === "+" || char === "?") {
      tokens.push({ type: "MODIFIER", index: i, value: str[i++] });
      continue;
    }
    if (char === "\\") {
      tokens.push({ type: "ESCAPED_CHAR", index: i++, value: str[i++] });
      continue;
    }
    if (char === "{") {
      tokens.push({ type: "OPEN", index: i, value: str[i++] });
      continue;
    }
    if (char === "}") {
      tokens.push({ type: "CLOSE", index: i, value: str[i++] });
      continue;
    }
    if (char === ":") {
      var name = "";
      var j = i + 1;
      while (j < str.length) {
        var code = str.charCodeAt(j);
        if (
          // `0-9`
          code >= 48 && code <= 57 || // `A-Z`
          code >= 65 && code <= 90 || // `a-z`
          code >= 97 && code <= 122 || // `_`
          code === 95
        ) {
          name += str[j++];
          continue;
        }
        break;
      }
      if (!name)
        throw new TypeError("Missing parameter name at ".concat(i));
      tokens.push({ type: "NAME", index: i, value: name });
      i = j;
      continue;
    }
    if (char === "(") {
      var count = 1;
      var pattern = "";
      var j = i + 1;
      if (str[j] === "?") {
        throw new TypeError('Pattern cannot start with "?" at '.concat(j));
      }
      while (j < str.length) {
        if (str[j] === "\\") {
          pattern += str[j++] + str[j++];
          continue;
        }
        if (str[j] === ")") {
          count--;
          if (count === 0) {
            j++;
            break;
          }
        } else if (str[j] === "(") {
          count++;
          if (str[j + 1] !== "?") {
            throw new TypeError("Capturing groups are not allowed at ".concat(j));
          }
        }
        pattern += str[j++];
      }
      if (count)
        throw new TypeError("Unbalanced pattern at ".concat(i));
      if (!pattern)
        throw new TypeError("Missing pattern at ".concat(i));
      tokens.push({ type: "PATTERN", index: i, value: pattern });
      i = j;
      continue;
    }
    tokens.push({ type: "CHAR", index: i, value: str[i++] });
  }
  tokens.push({ type: "END", index: i, value: "" });
  return tokens;
}
__name(lexer, "lexer");
__name2(lexer, "lexer");
function parse(str, options) {
  if (options === void 0) {
    options = {};
  }
  var tokens = lexer(str);
  var _a = options.prefixes, prefixes = _a === void 0 ? "./" : _a, _b = options.delimiter, delimiter = _b === void 0 ? "/#?" : _b;
  var result = [];
  var key = 0;
  var i = 0;
  var path = "";
  var tryConsume = /* @__PURE__ */ __name2(function(type) {
    if (i < tokens.length && tokens[i].type === type)
      return tokens[i++].value;
  }, "tryConsume");
  var mustConsume = /* @__PURE__ */ __name2(function(type) {
    var value2 = tryConsume(type);
    if (value2 !== void 0)
      return value2;
    var _a2 = tokens[i], nextType = _a2.type, index = _a2.index;
    throw new TypeError("Unexpected ".concat(nextType, " at ").concat(index, ", expected ").concat(type));
  }, "mustConsume");
  var consumeText = /* @__PURE__ */ __name2(function() {
    var result2 = "";
    var value2;
    while (value2 = tryConsume("CHAR") || tryConsume("ESCAPED_CHAR")) {
      result2 += value2;
    }
    return result2;
  }, "consumeText");
  var isSafe = /* @__PURE__ */ __name2(function(value2) {
    for (var _i = 0, delimiter_1 = delimiter; _i < delimiter_1.length; _i++) {
      var char2 = delimiter_1[_i];
      if (value2.indexOf(char2) > -1)
        return true;
    }
    return false;
  }, "isSafe");
  var safePattern = /* @__PURE__ */ __name2(function(prefix2) {
    var prev = result[result.length - 1];
    var prevText = prefix2 || (prev && typeof prev === "string" ? prev : "");
    if (prev && !prevText) {
      throw new TypeError('Must have text between two parameters, missing text after "'.concat(prev.name, '"'));
    }
    if (!prevText || isSafe(prevText))
      return "[^".concat(escapeString(delimiter), "]+?");
    return "(?:(?!".concat(escapeString(prevText), ")[^").concat(escapeString(delimiter), "])+?");
  }, "safePattern");
  while (i < tokens.length) {
    var char = tryConsume("CHAR");
    var name = tryConsume("NAME");
    var pattern = tryConsume("PATTERN");
    if (name || pattern) {
      var prefix = char || "";
      if (prefixes.indexOf(prefix) === -1) {
        path += prefix;
        prefix = "";
      }
      if (path) {
        result.push(path);
        path = "";
      }
      result.push({
        name: name || key++,
        prefix,
        suffix: "",
        pattern: pattern || safePattern(prefix),
        modifier: tryConsume("MODIFIER") || ""
      });
      continue;
    }
    var value = char || tryConsume("ESCAPED_CHAR");
    if (value) {
      path += value;
      continue;
    }
    if (path) {
      result.push(path);
      path = "";
    }
    var open = tryConsume("OPEN");
    if (open) {
      var prefix = consumeText();
      var name_1 = tryConsume("NAME") || "";
      var pattern_1 = tryConsume("PATTERN") || "";
      var suffix = consumeText();
      mustConsume("CLOSE");
      result.push({
        name: name_1 || (pattern_1 ? key++ : ""),
        pattern: name_1 && !pattern_1 ? safePattern(prefix) : pattern_1,
        prefix,
        suffix,
        modifier: tryConsume("MODIFIER") || ""
      });
      continue;
    }
    mustConsume("END");
  }
  return result;
}
__name(parse, "parse");
__name2(parse, "parse");
function match(str, options) {
  var keys = [];
  var re = pathToRegexp(str, keys, options);
  return regexpToFunction(re, keys, options);
}
__name(match, "match");
__name2(match, "match");
function regexpToFunction(re, keys, options) {
  if (options === void 0) {
    options = {};
  }
  var _a = options.decode, decode = _a === void 0 ? function(x) {
    return x;
  } : _a;
  return function(pathname) {
    var m = re.exec(pathname);
    if (!m)
      return false;
    var path = m[0], index = m.index;
    var params = /* @__PURE__ */ Object.create(null);
    var _loop_1 = /* @__PURE__ */ __name2(function(i2) {
      if (m[i2] === void 0)
        return "continue";
      var key = keys[i2 - 1];
      if (key.modifier === "*" || key.modifier === "+") {
        params[key.name] = m[i2].split(key.prefix + key.suffix).map(function(value) {
          return decode(value, key);
        });
      } else {
        params[key.name] = decode(m[i2], key);
      }
    }, "_loop_1");
    for (var i = 1; i < m.length; i++) {
      _loop_1(i);
    }
    return { path, index, params };
  };
}
__name(regexpToFunction, "regexpToFunction");
__name2(regexpToFunction, "regexpToFunction");
function escapeString(str) {
  return str.replace(/([.+*?=^!:${}()[\]|/\\])/g, "\\$1");
}
__name(escapeString, "escapeString");
__name2(escapeString, "escapeString");
function flags(options) {
  return options && options.sensitive ? "" : "i";
}
__name(flags, "flags");
__name2(flags, "flags");
function regexpToRegexp(path, keys) {
  if (!keys)
    return path;
  var groupsRegex = /\((?:\?<(.*?)>)?(?!\?)/g;
  var index = 0;
  var execResult = groupsRegex.exec(path.source);
  while (execResult) {
    keys.push({
      // Use parenthesized substring match if available, index otherwise
      name: execResult[1] || index++,
      prefix: "",
      suffix: "",
      modifier: "",
      pattern: ""
    });
    execResult = groupsRegex.exec(path.source);
  }
  return path;
}
__name(regexpToRegexp, "regexpToRegexp");
__name2(regexpToRegexp, "regexpToRegexp");
function arrayToRegexp(paths, keys, options) {
  var parts = paths.map(function(path) {
    return pathToRegexp(path, keys, options).source;
  });
  return new RegExp("(?:".concat(parts.join("|"), ")"), flags(options));
}
__name(arrayToRegexp, "arrayToRegexp");
__name2(arrayToRegexp, "arrayToRegexp");
function stringToRegexp(path, keys, options) {
  return tokensToRegexp(parse(path, options), keys, options);
}
__name(stringToRegexp, "stringToRegexp");
__name2(stringToRegexp, "stringToRegexp");
function tokensToRegexp(tokens, keys, options) {
  if (options === void 0) {
    options = {};
  }
  var _a = options.strict, strict = _a === void 0 ? false : _a, _b = options.start, start = _b === void 0 ? true : _b, _c = options.end, end = _c === void 0 ? true : _c, _d = options.encode, encode = _d === void 0 ? function(x) {
    return x;
  } : _d, _e = options.delimiter, delimiter = _e === void 0 ? "/#?" : _e, _f = options.endsWith, endsWith = _f === void 0 ? "" : _f;
  var endsWithRe = "[".concat(escapeString(endsWith), "]|$");
  var delimiterRe = "[".concat(escapeString(delimiter), "]");
  var route = start ? "^" : "";
  for (var _i = 0, tokens_1 = tokens; _i < tokens_1.length; _i++) {
    var token = tokens_1[_i];
    if (typeof token === "string") {
      route += escapeString(encode(token));
    } else {
      var prefix = escapeString(encode(token.prefix));
      var suffix = escapeString(encode(token.suffix));
      if (token.pattern) {
        if (keys)
          keys.push(token);
        if (prefix || suffix) {
          if (token.modifier === "+" || token.modifier === "*") {
            var mod = token.modifier === "*" ? "?" : "";
            route += "(?:".concat(prefix, "((?:").concat(token.pattern, ")(?:").concat(suffix).concat(prefix, "(?:").concat(token.pattern, "))*)").concat(suffix, ")").concat(mod);
          } else {
            route += "(?:".concat(prefix, "(").concat(token.pattern, ")").concat(suffix, ")").concat(token.modifier);
          }
        } else {
          if (token.modifier === "+" || token.modifier === "*") {
            throw new TypeError('Can not repeat "'.concat(token.name, '" without a prefix and suffix'));
          }
          route += "(".concat(token.pattern, ")").concat(token.modifier);
        }
      } else {
        route += "(?:".concat(prefix).concat(suffix, ")").concat(token.modifier);
      }
    }
  }
  if (end) {
    if (!strict)
      route += "".concat(delimiterRe, "?");
    route += !options.endsWith ? "$" : "(?=".concat(endsWithRe, ")");
  } else {
    var endToken = tokens[tokens.length - 1];
    var isEndDelimited = typeof endToken === "string" ? delimiterRe.indexOf(endToken[endToken.length - 1]) > -1 : endToken === void 0;
    if (!strict) {
      route += "(?:".concat(delimiterRe, "(?=").concat(endsWithRe, "))?");
    }
    if (!isEndDelimited) {
      route += "(?=".concat(delimiterRe, "|").concat(endsWithRe, ")");
    }
  }
  return new RegExp(route, flags(options));
}
__name(tokensToRegexp, "tokensToRegexp");
__name2(tokensToRegexp, "tokensToRegexp");
function pathToRegexp(path, keys, options) {
  if (path instanceof RegExp)
    return regexpToRegexp(path, keys);
  if (Array.isArray(path))
    return arrayToRegexp(path, keys, options);
  return stringToRegexp(path, keys, options);
}
__name(pathToRegexp, "pathToRegexp");
__name2(pathToRegexp, "pathToRegexp");
var escapeRegex = /[.+?^${}()|[\]\\]/g;
function* executeRequest(request) {
  const requestPath = new URL(request.url).pathname;
  for (const route of [...routes].reverse()) {
    if (route.method && route.method !== request.method) {
      continue;
    }
    const routeMatcher = match(route.routePath.replace(escapeRegex, "\\$&"), {
      end: false
    });
    const mountMatcher = match(route.mountPath.replace(escapeRegex, "\\$&"), {
      end: false
    });
    const matchResult = routeMatcher(requestPath);
    const mountMatchResult = mountMatcher(requestPath);
    if (matchResult && mountMatchResult) {
      for (const handler of route.middlewares.flat()) {
        yield {
          handler,
          params: matchResult.params,
          path: mountMatchResult.path
        };
      }
    }
  }
  for (const route of routes) {
    if (route.method && route.method !== request.method) {
      continue;
    }
    const routeMatcher = match(route.routePath.replace(escapeRegex, "\\$&"), {
      end: true
    });
    const mountMatcher = match(route.mountPath.replace(escapeRegex, "\\$&"), {
      end: false
    });
    const matchResult = routeMatcher(requestPath);
    const mountMatchResult = mountMatcher(requestPath);
    if (matchResult && mountMatchResult && route.modules.length) {
      for (const handler of route.modules.flat()) {
        yield {
          handler,
          params: matchResult.params,
          path: matchResult.path
        };
      }
      break;
    }
  }
}
__name(executeRequest, "executeRequest");
__name2(executeRequest, "executeRequest");
var pages_template_worker_default = {
  async fetch(originalRequest, env, workerContext) {
    let request = originalRequest;
    const handlerIterator = executeRequest(request);
    let data = {};
    let isFailOpen = false;
    const next = /* @__PURE__ */ __name2(async (input, init) => {
      if (input !== void 0) {
        let url = input;
        if (typeof input === "string") {
          url = new URL(input, request.url).toString();
        }
        request = new Request(url, init);
      }
      const result = handlerIterator.next();
      if (result.done === false) {
        const { handler, params, path } = result.value;
        const context = {
          request: new Request(request.clone()),
          functionPath: path,
          next,
          params,
          get data() {
            return data;
          },
          set data(value) {
            if (typeof value !== "object" || value === null) {
              throw new Error("context.data must be an object");
            }
            data = value;
          },
          env,
          waitUntil: workerContext.waitUntil.bind(workerContext),
          passThroughOnException: /* @__PURE__ */ __name2(() => {
            isFailOpen = true;
          }, "passThroughOnException")
        };
        const response = await handler(context);
        if (!(response instanceof Response)) {
          throw new Error("Your Pages function should return a Response");
        }
        return cloneResponse(response);
      } else if ("ASSETS") {
        const response = await env["ASSETS"].fetch(request);
        return cloneResponse(response);
      } else {
        const response = await fetch(request);
        return cloneResponse(response);
      }
    }, "next");
    try {
      return await next();
    } catch (error) {
      if (isFailOpen) {
        const response = await env["ASSETS"].fetch(request);
        return cloneResponse(response);
      }
      throw error;
    }
  }
};
var cloneResponse = /* @__PURE__ */ __name2((response) => (
  // https://fetch.spec.whatwg.org/#null-body-status
  new Response(
    [101, 204, 205, 304].includes(response.status) ? null : response.body,
    response
  )
), "cloneResponse");
var drainBody = /* @__PURE__ */ __name2(async (request, env, _ctx, middlewareCtx) => {
  try {
    return await middlewareCtx.next(request, env);
  } finally {
    try {
      if (request.body !== null && !request.bodyUsed) {
        const reader = request.body.getReader();
        while (!(await reader.read()).done) {
        }
      }
    } catch (e) {
      console.error("Failed to drain the unused request body.", e);
    }
  }
}, "drainBody");
var middleware_ensure_req_body_drained_default = drainBody;
function reduceError(e) {
  return {
    name: e?.name,
    message: e?.message ?? String(e),
    stack: e?.stack,
    cause: e?.cause === void 0 ? void 0 : reduceError(e.cause)
  };
}
__name(reduceError, "reduceError");
__name2(reduceError, "reduceError");
var jsonError = /* @__PURE__ */ __name2(async (request, env, _ctx, middlewareCtx) => {
  try {
    return await middlewareCtx.next(request, env);
  } catch (e) {
    const error = reduceError(e);
    return Response.json(error, {
      status: 500,
      headers: { "MF-Experimental-Error-Stack": "true" }
    });
  }
}, "jsonError");
var middleware_miniflare3_json_error_default = jsonError;
var __INTERNAL_WRANGLER_MIDDLEWARE__ = [
  middleware_ensure_req_body_drained_default,
  middleware_miniflare3_json_error_default
];
var middleware_insertion_facade_default = pages_template_worker_default;
var __facade_middleware__ = [];
function __facade_register__(...args) {
  __facade_middleware__.push(...args.flat());
}
__name(__facade_register__, "__facade_register__");
__name2(__facade_register__, "__facade_register__");
function __facade_invokeChain__(request, env, ctx, dispatch, middlewareChain) {
  const [head, ...tail] = middlewareChain;
  const middlewareCtx = {
    dispatch,
    next(newRequest, newEnv) {
      return __facade_invokeChain__(newRequest, newEnv, ctx, dispatch, tail);
    }
  };
  return head(request, env, ctx, middlewareCtx);
}
__name(__facade_invokeChain__, "__facade_invokeChain__");
__name2(__facade_invokeChain__, "__facade_invokeChain__");
function __facade_invoke__(request, env, ctx, dispatch, finalMiddleware) {
  return __facade_invokeChain__(request, env, ctx, dispatch, [
    ...__facade_middleware__,
    finalMiddleware
  ]);
}
__name(__facade_invoke__, "__facade_invoke__");
__name2(__facade_invoke__, "__facade_invoke__");
var __Facade_ScheduledController__ = class ___Facade_ScheduledController__ {
  static {
    __name(this, "___Facade_ScheduledController__");
  }
  constructor(scheduledTime, cron, noRetry) {
    this.scheduledTime = scheduledTime;
    this.cron = cron;
    this.#noRetry = noRetry;
  }
  static {
    __name2(this, "__Facade_ScheduledController__");
  }
  #noRetry;
  noRetry() {
    if (!(this instanceof ___Facade_ScheduledController__)) {
      throw new TypeError("Illegal invocation");
    }
    this.#noRetry();
  }
};
function wrapExportedHandler(worker) {
  if (__INTERNAL_WRANGLER_MIDDLEWARE__ === void 0 || __INTERNAL_WRANGLER_MIDDLEWARE__.length === 0) {
    return worker;
  }
  for (const middleware of __INTERNAL_WRANGLER_MIDDLEWARE__) {
    __facade_register__(middleware);
  }
  const fetchDispatcher = /* @__PURE__ */ __name2(function(request, env, ctx) {
    if (worker.fetch === void 0) {
      throw new Error("Handler does not export a fetch() function.");
    }
    return worker.fetch(request, env, ctx);
  }, "fetchDispatcher");
  return {
    ...worker,
    fetch(request, env, ctx) {
      const dispatcher = /* @__PURE__ */ __name2(function(type, init) {
        if (type === "scheduled" && worker.scheduled !== void 0) {
          const controller = new __Facade_ScheduledController__(
            Date.now(),
            init.cron ?? "",
            () => {
            }
          );
          return worker.scheduled(controller, env, ctx);
        }
      }, "dispatcher");
      return __facade_invoke__(request, env, ctx, dispatcher, fetchDispatcher);
    }
  };
}
__name(wrapExportedHandler, "wrapExportedHandler");
__name2(wrapExportedHandler, "wrapExportedHandler");
function wrapWorkerEntrypoint(klass) {
  if (__INTERNAL_WRANGLER_MIDDLEWARE__ === void 0 || __INTERNAL_WRANGLER_MIDDLEWARE__.length === 0) {
    return klass;
  }
  for (const middleware of __INTERNAL_WRANGLER_MIDDLEWARE__) {
    __facade_register__(middleware);
  }
  return class extends klass {
    #fetchDispatcher = /* @__PURE__ */ __name2((request, env, ctx) => {
      this.env = env;
      this.ctx = ctx;
      if (super.fetch === void 0) {
        throw new Error("Entrypoint class does not define a fetch() function.");
      }
      return super.fetch(request);
    }, "#fetchDispatcher");
    #dispatcher = /* @__PURE__ */ __name2((type, init) => {
      if (type === "scheduled" && super.scheduled !== void 0) {
        const controller = new __Facade_ScheduledController__(
          Date.now(),
          init.cron ?? "",
          () => {
          }
        );
        return super.scheduled(controller);
      }
    }, "#dispatcher");
    fetch(request) {
      return __facade_invoke__(
        request,
        this.env,
        this.ctx,
        this.#dispatcher,
        this.#fetchDispatcher
      );
    }
  };
}
__name(wrapWorkerEntrypoint, "wrapWorkerEntrypoint");
__name2(wrapWorkerEntrypoint, "wrapWorkerEntrypoint");
var WRAPPED_ENTRY;
if (typeof middleware_insertion_facade_default === "object") {
  WRAPPED_ENTRY = wrapExportedHandler(middleware_insertion_facade_default);
} else if (typeof middleware_insertion_facade_default === "function") {
  WRAPPED_ENTRY = wrapWorkerEntrypoint(middleware_insertion_facade_default);
}
var middleware_loader_entry_default = WRAPPED_ENTRY;

// ../AppData/Roaming/npm/node_modules/wrangler/templates/middleware/middleware-ensure-req-body-drained.ts
var drainBody2 = /* @__PURE__ */ __name(async (request, env, _ctx, middlewareCtx) => {
  try {
    return await middlewareCtx.next(request, env);
  } finally {
    try {
      if (request.body !== null && !request.bodyUsed) {
        const reader = request.body.getReader();
        while (!(await reader.read()).done) {
        }
      }
    } catch (e) {
      console.error("Failed to drain the unused request body.", e);
    }
  }
}, "drainBody");
var middleware_ensure_req_body_drained_default2 = drainBody2;

// ../AppData/Roaming/npm/node_modules/wrangler/templates/middleware/middleware-miniflare3-json-error.ts
function reduceError2(e) {
  return {
    name: e?.name,
    message: e?.message ?? String(e),
    stack: e?.stack,
    cause: e?.cause === void 0 ? void 0 : reduceError2(e.cause)
  };
}
__name(reduceError2, "reduceError");
var jsonError2 = /* @__PURE__ */ __name(async (request, env, _ctx, middlewareCtx) => {
  try {
    return await middlewareCtx.next(request, env);
  } catch (e) {
    const error = reduceError2(e);
    return Response.json(error, {
      status: 500,
      headers: { "MF-Experimental-Error-Stack": "true" }
    });
  }
}, "jsonError");
var middleware_miniflare3_json_error_default2 = jsonError2;

// .wrangler/tmp/bundle-kaBYvg/middleware-insertion-facade.js
var __INTERNAL_WRANGLER_MIDDLEWARE__2 = [
  middleware_ensure_req_body_drained_default2,
  middleware_miniflare3_json_error_default2
];
var middleware_insertion_facade_default2 = middleware_loader_entry_default;

// ../AppData/Roaming/npm/node_modules/wrangler/templates/middleware/common.ts
var __facade_middleware__2 = [];
function __facade_register__2(...args) {
  __facade_middleware__2.push(...args.flat());
}
__name(__facade_register__2, "__facade_register__");
function __facade_invokeChain__2(request, env, ctx, dispatch, middlewareChain) {
  const [head, ...tail] = middlewareChain;
  const middlewareCtx = {
    dispatch,
    next(newRequest, newEnv) {
      return __facade_invokeChain__2(newRequest, newEnv, ctx, dispatch, tail);
    }
  };
  return head(request, env, ctx, middlewareCtx);
}
__name(__facade_invokeChain__2, "__facade_invokeChain__");
function __facade_invoke__2(request, env, ctx, dispatch, finalMiddleware) {
  return __facade_invokeChain__2(request, env, ctx, dispatch, [
    ...__facade_middleware__2,
    finalMiddleware
  ]);
}
__name(__facade_invoke__2, "__facade_invoke__");

// .wrangler/tmp/bundle-kaBYvg/middleware-loader.entry.ts
var __Facade_ScheduledController__2 = class ___Facade_ScheduledController__2 {
  constructor(scheduledTime, cron, noRetry) {
    this.scheduledTime = scheduledTime;
    this.cron = cron;
    this.#noRetry = noRetry;
  }
  static {
    __name(this, "__Facade_ScheduledController__");
  }
  #noRetry;
  noRetry() {
    if (!(this instanceof ___Facade_ScheduledController__2)) {
      throw new TypeError("Illegal invocation");
    }
    this.#noRetry();
  }
};
function wrapExportedHandler2(worker) {
  if (__INTERNAL_WRANGLER_MIDDLEWARE__2 === void 0 || __INTERNAL_WRANGLER_MIDDLEWARE__2.length === 0) {
    return worker;
  }
  for (const middleware of __INTERNAL_WRANGLER_MIDDLEWARE__2) {
    __facade_register__2(middleware);
  }
  const fetchDispatcher = /* @__PURE__ */ __name(function(request, env, ctx) {
    if (worker.fetch === void 0) {
      throw new Error("Handler does not export a fetch() function.");
    }
    return worker.fetch(request, env, ctx);
  }, "fetchDispatcher");
  return {
    ...worker,
    fetch(request, env, ctx) {
      const dispatcher = /* @__PURE__ */ __name(function(type, init) {
        if (type === "scheduled" && worker.scheduled !== void 0) {
          const controller = new __Facade_ScheduledController__2(
            Date.now(),
            init.cron ?? "",
            () => {
            }
          );
          return worker.scheduled(controller, env, ctx);
        }
      }, "dispatcher");
      return __facade_invoke__2(request, env, ctx, dispatcher, fetchDispatcher);
    }
  };
}
__name(wrapExportedHandler2, "wrapExportedHandler");
function wrapWorkerEntrypoint2(klass) {
  if (__INTERNAL_WRANGLER_MIDDLEWARE__2 === void 0 || __INTERNAL_WRANGLER_MIDDLEWARE__2.length === 0) {
    return klass;
  }
  for (const middleware of __INTERNAL_WRANGLER_MIDDLEWARE__2) {
    __facade_register__2(middleware);
  }
  return class extends klass {
    #fetchDispatcher = /* @__PURE__ */ __name((request, env, ctx) => {
      this.env = env;
      this.ctx = ctx;
      if (super.fetch === void 0) {
        throw new Error("Entrypoint class does not define a fetch() function.");
      }
      return super.fetch(request);
    }, "#fetchDispatcher");
    #dispatcher = /* @__PURE__ */ __name((type, init) => {
      if (type === "scheduled" && super.scheduled !== void 0) {
        const controller = new __Facade_ScheduledController__2(
          Date.now(),
          init.cron ?? "",
          () => {
          }
        );
        return super.scheduled(controller);
      }
    }, "#dispatcher");
    fetch(request) {
      return __facade_invoke__2(
        request,
        this.env,
        this.ctx,
        this.#dispatcher,
        this.#fetchDispatcher
      );
    }
  };
}
__name(wrapWorkerEntrypoint2, "wrapWorkerEntrypoint");
var WRAPPED_ENTRY2;
if (typeof middleware_insertion_facade_default2 === "object") {
  WRAPPED_ENTRY2 = wrapExportedHandler2(middleware_insertion_facade_default2);
} else if (typeof middleware_insertion_facade_default2 === "function") {
  WRAPPED_ENTRY2 = wrapWorkerEntrypoint2(middleware_insertion_facade_default2);
}
var middleware_loader_entry_default2 = WRAPPED_ENTRY2;
export {
  __INTERNAL_WRANGLER_MIDDLEWARE__2 as __INTERNAL_WRANGLER_MIDDLEWARE__,
  middleware_loader_entry_default2 as default
};
/*! Bundled license information:

@google/generative-ai/dist/index.mjs:
  (**
   * @license
   * Copyright 2024 Google LLC
   *
   * Licensed under the Apache License, Version 2.0 (the "License");
   * you may not use this file except in compliance with the License.
   * You may obtain a copy of the License at
   *
   *   http://www.apache.org/licenses/LICENSE-2.0
   *
   * Unless required by applicable law or agreed to in writing, software
   * distributed under the License is distributed on an "AS IS" BASIS,
   * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
   * See the License for the specific language governing permissions and
   * limitations under the License.
   *)

@google/generative-ai/dist/index.mjs:
  (**
   * @license
   * Copyright 2024 Google LLC
   *
   * Licensed under the Apache License, Version 2.0 (the "License");
   * you may not use this file except in compliance with the License.
   * You may obtain a copy of the License at
   *
   *   http://www.apache.org/licenses/LICENSE-2.0
   *
   * Unless required by applicable law or agreed to in writing, software
   * distributed under the License is distributed on an "AS IS" BASIS,
   * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
   * See the License for the specific language governing permissions and
   * limitations under the License.
   *)
*/
//# sourceMappingURL=functionsWorker-0.26158561439965644.js.map
