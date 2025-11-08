"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.prisma = exports.customCors = void 0;
const client_1 = require("@prisma/client");
const globalForPrisma = globalThis;
const CORS_HEADERS = {
    "Access-Control-Allow-Origin": "http://localhost:3000", // Changez pour votre client
    "Access-Control-Allow-Methods": "GET, POST, PUT, DELETE, OPTIONS",
    "Access-Control-Allow-Headers": "Content-Type, Authorization",
    "Access-Control-Allow-Credentials": "true", // Souvent requis pour les cookies/sessions
    "Access-Control-Max-Age": "86400", // Cache le preflight pour 24 heures
};
/**
 * Gère les requêtes OPTIONS (preflight) et ajoute les en-têtes CORS aux réponses.
 * @param c Le contexte Hono.
 * @param next La fonction pour passer au middleware/route suivant.
 */
const customCors = async (c, next) => {
    if (c.req.method === "OPTIONS") {
        const headers = new Headers(CORS_HEADERS);
        headers.set("Access-Control-Allow-Origin", CORS_HEADERS["Access-Control-Allow-Origin"]);
        return new Response(null, {
            status: 204, // verry important for preflight
            headers: headers,
        });
    }
    await next();
    // Ajoute les headers CORS à toutes les réponses
    Object.entries(CORS_HEADERS).forEach(([key, value]) => {
        if (key === "Access-Control-Allow-Origin" ||
            "Access-Control-Allow-Credentials") {
            c.res.headers.set(key, value);
        }
    });
};
exports.customCors = customCors;
exports.prisma = globalForPrisma.prisma ?? new client_1.PrismaClient();
if (process.env.NODE_ENV !== "production")
    globalForPrisma.prisma = exports.prisma;
