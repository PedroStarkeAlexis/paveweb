import { onRequestPost as __api_ask_js_onRequestPost } from "C:\\Users\\Pedro\\PAVE-react\\functions\\api\\ask.js"
import { onRequestGet as __api_debug_uploader_js_onRequestGet } from "C:\\Users\\Pedro\\PAVE-react\\functions\\api\\debug-uploader.js"
import { onRequestPost as __api_generate_flashcards_js_onRequestPost } from "C:\\Users\\Pedro\\PAVE-react\\functions\\api\\generate-flashcards.js"
import { onRequestGet as __api_get_filter_options_js_onRequestGet } from "C:\\Users\\Pedro\\PAVE-react\\functions\\api\\get-filter-options.js"
import { onRequestGet as __api_get_models_js_onRequestGet } from "C:\\Users\\Pedro\\PAVE-react\\functions\\api\\get-models.js"
import { onRequestPost as __api_index_questions_js_onRequestPost } from "C:\\Users\\Pedro\\PAVE-react\\functions\\api\\index-questions.js"
import { onRequestGet as __api_prova_js_onRequestGet } from "C:\\Users\\Pedro\\PAVE-react\\functions\\api\\prova.js"
import { onRequestGet as __api_questions_js_onRequestGet } from "C:\\Users\\Pedro\\PAVE-react\\functions\\api\\questions.js"
import { onRequestGet as __api_search_questions_js_onRequestGet } from "C:\\Users\\Pedro\\PAVE-react\\functions\\api\\search-questions.js"
import { onRequestGet as __api_test_bindings_js_onRequestGet } from "C:\\Users\\Pedro\\PAVE-react\\functions\\api\\test-bindings.js"
import { onRequest as __api_ask_js_onRequest } from "C:\\Users\\Pedro\\PAVE-react\\functions\\api\\ask.js"
import { onRequest as __api_get_filter_options_js_onRequest } from "C:\\Users\\Pedro\\PAVE-react\\functions\\api\\get-filter-options.js"
import { onRequest as __api_get_models_js_onRequest } from "C:\\Users\\Pedro\\PAVE-react\\functions\\api\\get-models.js"
import { onRequest as __api_index_questions_js_onRequest } from "C:\\Users\\Pedro\\PAVE-react\\functions\\api\\index-questions.js"
import { onRequest as __api_prova_js_onRequest } from "C:\\Users\\Pedro\\PAVE-react\\functions\\api\\prova.js"
import { onRequest as __api_questions_js_onRequest } from "C:\\Users\\Pedro\\PAVE-react\\functions\\api\\questions.js"
import { onRequest as __api_search_questions_js_onRequest } from "C:\\Users\\Pedro\\PAVE-react\\functions\\api\\search-questions.js"

export const routes = [
    {
      routePath: "/api/ask",
      mountPath: "/api",
      method: "POST",
      middlewares: [],
      modules: [__api_ask_js_onRequestPost],
    },
  {
      routePath: "/api/debug-uploader",
      mountPath: "/api",
      method: "GET",
      middlewares: [],
      modules: [__api_debug_uploader_js_onRequestGet],
    },
  {
      routePath: "/api/generate-flashcards",
      mountPath: "/api",
      method: "POST",
      middlewares: [],
      modules: [__api_generate_flashcards_js_onRequestPost],
    },
  {
      routePath: "/api/get-filter-options",
      mountPath: "/api",
      method: "GET",
      middlewares: [],
      modules: [__api_get_filter_options_js_onRequestGet],
    },
  {
      routePath: "/api/get-models",
      mountPath: "/api",
      method: "GET",
      middlewares: [],
      modules: [__api_get_models_js_onRequestGet],
    },
  {
      routePath: "/api/index-questions",
      mountPath: "/api",
      method: "POST",
      middlewares: [],
      modules: [__api_index_questions_js_onRequestPost],
    },
  {
      routePath: "/api/prova",
      mountPath: "/api",
      method: "GET",
      middlewares: [],
      modules: [__api_prova_js_onRequestGet],
    },
  {
      routePath: "/api/questions",
      mountPath: "/api",
      method: "GET",
      middlewares: [],
      modules: [__api_questions_js_onRequestGet],
    },
  {
      routePath: "/api/search-questions",
      mountPath: "/api",
      method: "GET",
      middlewares: [],
      modules: [__api_search_questions_js_onRequestGet],
    },
  {
      routePath: "/api/test-bindings",
      mountPath: "/api",
      method: "GET",
      middlewares: [],
      modules: [__api_test_bindings_js_onRequestGet],
    },
  {
      routePath: "/api/ask",
      mountPath: "/api",
      method: "",
      middlewares: [],
      modules: [__api_ask_js_onRequest],
    },
  {
      routePath: "/api/get-filter-options",
      mountPath: "/api",
      method: "",
      middlewares: [],
      modules: [__api_get_filter_options_js_onRequest],
    },
  {
      routePath: "/api/get-models",
      mountPath: "/api",
      method: "",
      middlewares: [],
      modules: [__api_get_models_js_onRequest],
    },
  {
      routePath: "/api/index-questions",
      mountPath: "/api",
      method: "",
      middlewares: [],
      modules: [__api_index_questions_js_onRequest],
    },
  {
      routePath: "/api/prova",
      mountPath: "/api",
      method: "",
      middlewares: [],
      modules: [__api_prova_js_onRequest],
    },
  {
      routePath: "/api/questions",
      mountPath: "/api",
      method: "",
      middlewares: [],
      modules: [__api_questions_js_onRequest],
    },
  {
      routePath: "/api/search-questions",
      mountPath: "/api",
      method: "",
      middlewares: [],
      modules: [__api_search_questions_js_onRequest],
    },
  ]