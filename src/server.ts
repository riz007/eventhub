import { PrismaClient } from '@prisma/client';
import dotenv from "dotenv";
import Fastify from 'fastify';
import { z} from 'zod';
import bcrypt from "bcrypt";
import rateLimit from "@fastify/rate-limit";
import helmet from "@fastify/helmet";
import crypto from "crypto";

dotenv.config();

const prisma = new PrismaClient();

const app = Fastify({
  logger: {
    transport: {
      target: "pino-pretty",
      options: {translateTime: "SYS:standard", ignore: "pid,hostname"},
    },
    level: "info"
  },
  genReqId: () => crypto.randomUUID()
});

app.register(rateLimit, {
  max: 100,
  timeWindow: "1 minute",
  ban: 3
});

app.register(helmet, {
  contentSecurityPolicy: false
});

app.addHook("onRequest", async (req) => {
  req.log.info({ url: req.url, method: req.method }, "incoming request");
});

app.addHook("onResponse", async (req, reply) => {
  req.log.info({ statusCode: reply.statusCode }, "response sent");
});

app.addHook("onRequest", async (req) => {
  (req as any).startTime = Date.now();
});

// Log slow requests
app.addHook("onResponse", async (req, reply) => {
  const duration = Date.now() - (req as any).startTime;
  if (duration > 1000) {
    req.log.warn({ duration }, "slow request");
  }
});

// Health check endpoint
app.get('/health', async () => {
  return { status: 'ok' }
});

// Create user
app.post("/users", async (request, reply) => {
  try {
    const userSchema = z.object({
      email: z.string().email(),
      passwordHash: z.string().min(6),
    });

    const { email, passwordHash } = userSchema.parse(request.body);

    const hashedPassword = await bcrypt.hash(passwordHash, 10)

    const user = await prisma.user.create({
      data: { email, passwordHash: hashedPassword }
    });

    const { passwordHash: _, ...userWithoutPassword } = user;
    reply.status(201).send(userWithoutPassword);
  } catch (err) {
    reply.status(400).send({error: err instanceof Error ? err.message : String(err)})
  }
})

// Get all users
app.get("/users", async () => {
  const users = await prisma.user.findMany({
    select: { id: true, email: true, createdAt: true },
  });
  return users;
});

// Get single user by id
app.get("/users/:id", async (request, reply) => {
  const paramsSchema = z.object({ id: z.string().regex(/^\d+$/) });
  const { id } = paramsSchema.parse(request.params);

  const user = await prisma.user.findUnique({
    where: { id: Number(id) },
    select: { id: true, email: true, createdAt: true },
  });

  if (!user) return reply.status(404).send({ error: "User not found" });
  return user;
})

// Update user
app.patch("/users/:id", async (request, reply) => {
  try {
    const paramsSchema = z.object({ id: z.string().regex(/^\d+$/) });
    const bodySchema = z.object({
      email: z.string().email().optional(),
      passwordHash: z.string().min(6).optional(),
    });

    const { id } = paramsSchema.parse(request.params);
    const { email, passwordHash } = bodySchema.parse(request.body);

    const data: any = {};
    if (email) data.email = email;
    if (passwordHash) data.passwordHash = await bcrypt.hash(passwordHash, 10);

    const updatedUser = await prisma.user.update({
      where: { id: Number(id) },
      data,
      select: { id: true, email: true, createdAt: true },
    });

    return updatedUser;
  } catch (err) {
    reply.status(400).send({ error: err instanceof Error ? err.message : String(err) });
  }
})

// Delete user
app.delete("/users/:id", async (request, reply) => {
  const paramsSchema = z.object({ id: z.string().regex(/^\d+$/) });
  const { id } = paramsSchema.parse(request.params);

  try {
    await prisma.user.delete({ where: { id: Number(id) } });
    reply.status(204).send();
  } catch {
    reply.status(404).send({ error: "User not found" });
  }
})

export async function start() {
  try {
    await app.listen({ port: 3000, host: '0.0.0.0' });
  } catch (err) {
    app.log.error(err);
    process.exit(1);
  }
}

if (require.main === module) {
  start()
}