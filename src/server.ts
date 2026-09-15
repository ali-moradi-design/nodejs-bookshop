import app from './app';
import { connectDb } from './infrastructure/config/db';
import { env } from './infrastructure/config/env';

async function main() {
  await connectDb();
  app.listen(env.PORT, () => {
    console.log(`Bookstore API listening on http://localhost:${env.PORT}`);
    console.log(`Swagger UI: http://localhost:${env.PORT}/api/docs`);
  });
}

main().catch((err) => {
  console.error('Failed to start server:', err);
  process.exit(1);
});
