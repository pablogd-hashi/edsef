import { Queue } from "bullmq";
import IORedis from "ioredis";

const connection = new IORedis(process.env.REDIS_URL ?? "redis://localhost:6379", {
  maxRetriesPerRequest: null,
});

export const mediaQueue = new Queue("media-processing", { connection });
export const exportQueue = new Queue("export", { connection });
export const backupQueue = new Queue("backup", { connection });

export { connection as redisConnection };
