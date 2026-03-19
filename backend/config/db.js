"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.prisma = void 0;
const client_1 = require("@prisma/client");
const adapter_pg_1 = require("@prisma/adapter-pg");
const pg_1 = require("pg");
const dbUrl = process.env.DATABASE_URL || "";
if (!dbUrl) {
    console.warn("DATABASE_URL is not set; Prisma will fail to connect.");
}
const pool = new pg_1.Pool({ connectionString: dbUrl });
const adapter = new adapter_pg_1.PrismaPg(pool);
const globalForPrisma = globalThis;
exports.prisma = globalForPrisma.prisma ||
    new client_1.PrismaClient({
        log: ["warn", "error"],
        adapter,
    });
// Reuse client in all modes to avoid opening extra connections
globalForPrisma.prisma = exports.prisma;
