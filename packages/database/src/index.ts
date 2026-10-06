import { PrismaClient } from '@prisma/client';

declare global { var researchflowPrisma: PrismaClient | undefined }
export const db = globalThis.researchflowPrisma ?? new PrismaClient();
if (process.env.NODE_ENV !== 'production') globalThis.researchflowPrisma = db;
