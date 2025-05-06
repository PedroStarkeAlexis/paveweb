import { onRequestGet as __api_questions_filters_js_onRequestGet } from "C:\\Users\\Pedro\\PAVE-react\\functions\\api\\questions\\filters.js"
import { onRequest as __api_questions_filters_js_onRequest } from "C:\\Users\\Pedro\\PAVE-react\\functions\\api\\questions\\filters.js"
import { onRequestPost as __api_ask_jsx_onRequestPost } from "C:\\Users\\Pedro\\PAVE-react\\functions\\api\\ask.jsx"
import { onRequestPost as __api_ask___Copia_js_onRequestPost } from "C:\\Users\\Pedro\\PAVE-react\\functions\\api\\ask - Copia.js"
import { onRequestPost as __api_index_questions_js_onRequestPost } from "C:\\Users\\Pedro\\PAVE-react\\functions\\api\\index-questions.js"
import { onRequestGet as __api_questions_js_onRequestGet } from "C:\\Users\\Pedro\\PAVE-react\\functions\\api\\questions.js"
import { onRequestGet as __api_search_questions_js_onRequestGet } from "C:\\Users\\Pedro\\PAVE-react\\functions\\api\\search-questions.js"
import { onRequest as __api_ask_jsx_onRequest } from "C:\\Users\\Pedro\\PAVE-react\\functions\\api\\ask.jsx"
import { onRequest as __api_ask___Copia_js_onRequest } from "C:\\Users\\Pedro\\PAVE-react\\functions\\api\\ask - Copia.js"
import { onRequest as __api_index_questions_js_onRequest } from "C:\\Users\\Pedro\\PAVE-react\\functions\\api\\index-questions.js"
import { onRequest as __api_questions_js_onRequest } from "C:\\Users\\Pedro\\PAVE-react\\functions\\api\\questions.js"
import { onRequest as __api_search_questions_js_onRequest } from "C:\\Users\\Pedro\\PAVE-react\\functions\\api\\search-questions.js"

export const routes = [
    {
      routePath: "/api/questions/filters",
      mountPath: "/api/questions",
      method: "GET",
      middlewares: [],
      modules: [__api_questions_filters_js_onRequestGet],
    },
  {
      routePath: "/api/questions/filters",
      mountPath: "/api/questions",
      method: "",
      middlewares: [],
      modules: [__api_questions_filters_js_onRequest],
    },
  {
      routePath: "/api/ask",
      mountPath: "/api",
      method: "POST",
      middlewares: [],
      modules: [__api_ask_jsx_onRequestPost],
    },
  {
      routePath: "/api/ask - Copia",
      mountPath: "/api",
      method: "POST",
      middlewares: [],
      modules: [__api_ask___Copia_js_onRequestPost],
    },
  {
      routePath: "/api/index-questions",
      mountPath: "/api",
      method: "POST",
      middlewares: [],
      modules: [__api_index_questions_js_onRequestPost],
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
      routePath: "/api/ask",
      mountPath: "/api",
      method: "",
      middlewares: [],
      modules: [__api_ask_jsx_onRequest],
    },
  {
      routePath: "/api/ask - Copia",
      mountPath: "/api",
      method: "",
      middlewares: [],
      modules: [__api_ask___Copia_js_onRequest],
    },
  {
      routePath: "/api/index-questions",
      mountPath: "/api",
      method: "",
      middlewares: [],
      modules: [__api_index_questions_js_onRequest],
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