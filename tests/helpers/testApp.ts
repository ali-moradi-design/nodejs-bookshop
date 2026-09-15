import mongoose from 'mongoose';
import { MongoMemoryServer } from 'mongodb-memory-server';
import request from 'supertest';
import type { Express } from 'express';

export type TestAgent = ReturnType<typeof request>;

export type TestContext = {
  app: Express;
  request: TestAgent;
  mongod: MongoMemoryServer;
  adminToken: string;
  adminRefresh: string;
};

let shared: TestContext | null = null;
let refs = 0;

export async function setupTestApp(): Promise<TestContext> {
  refs += 1;
  if (shared) return shared;

  const mongod = await MongoMemoryServer.create();
  const uri = mongod.getUri();
  process.env.MONGODB_URI = uri;

  // Reconnect if a previous suite left mongoose connected to a dead server
  if (mongoose.connection.readyState !== 0) {
    await mongoose.disconnect();
  }

  mongoose.set('strictQuery', true);
  await mongoose.connect(uri, { serverSelectionTimeoutMS: 10_000 });

  const { runSeed } = await import('../../src/scripts/seed');
  await runSeed({ minimalBooks: true });

  const { default: app } = await import('../../src/app');
  const agent = request(app);

  const login = await agent
    .post('/api/v1/auth/login')
    .send({ email: 'admin@bookstore.local', password: 'Admin123!' })
    .expect(200);

  shared = {
    app,
    request: agent,
    mongod,
    adminToken: login.body.accessToken as string,
    adminRefresh: login.body.refreshToken as string,
  };
  return shared;
}

export async function teardownTestApp(): Promise<void> {
  refs = Math.max(0, refs - 1);
  if (refs > 0 || !shared) return;

  try {
    await mongoose.disconnect();
  } catch {
    /* ignore */
  }
  try {
    await shared.mongod.stop();
  } catch {
    /* ignore */
  }
  shared = null;
}

export function authHeader(token: string): { Authorization: string } {
  return { Authorization: `Bearer ${token}` };
}

export const shippingAddress = {
  fullName: 'Test User',
  line1: '1 Test St',
  city: 'Tehran',
  postalCode: '12345',
  country: 'IR',
};

export async function registerCustomer(
  agent: TestAgent,
  suffix = `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
): Promise<{ accessToken: string; refreshToken: string; email: string; userId: string }> {
  const email = `customer_${suffix}@test.local`;
  const res = await agent
    .post('/api/v1/auth/register')
    .send({ name: 'Customer', email, password: 'Customer123!' })
    .expect(201);
  return {
    accessToken: res.body.accessToken,
    refreshToken: res.body.refreshToken,
    email,
    userId: res.body.user.id,
  };
}
