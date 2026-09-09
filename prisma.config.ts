import { defineConfig } from '@prisma/config';
// dotenv removed

export default defineConfig({
  datasource: {
    url: process.env.DIRECT_URL || process.env.DATABASE_URL,
    directUrl: process.env.DIRECT_URL,
  },
});
