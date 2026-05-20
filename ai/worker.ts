// Set ONNX Runtime logging level before imports
process.env.ORT_LOGGING_LEVEL = '4';
process.env.TRANSFORMERS_JS_LOG_LEVEL = 'error';
process.env.transformers_js_log_level = 'error';

import { Queue, Worker } from "bullmq";
import { AIRouter } from "./router/aiRouter";

// Assuming Redis is running on localhost:6379
const connection = {
  host: process.env.REDIS_HOST || "localhost",
  port: parseInt(process.env.REDIS_PORT || "6379"),
};

export const aiQueue = new Queue("ai-tasks", { 
  connection,
  defaultJobOptions: {
    attempts: 3,
    backoff: {
      type: "exponential",
      delay: 1000,
    },
  }
});

export const aiWorker = new Worker("ai-tasks", async job => {
  console.log(`[Worker] Processing AI task: ${job.data.taskId} (Attempt ${job.attemptsMade + 1})`);
  await AIRouter.processTask(job.data.taskId);
  console.log(`[Worker] Completed AI task: ${job.data.taskId}`);
}, { connection });

aiWorker.on('completed', job => {
  console.log(`Job ${job.id} has completed!`);
});

aiWorker.on('failed', async (job, err) => {
  console.log(`Job ${job?.id} has failed with ${err.message}`);
  if (job && job.attemptsMade >= (job.opts.attempts || 3)) {
    console.log(`[DLQ] Job ${job.id} moved to Dead Letter Queue (failed after ${job.attemptsMade} attempts)`);
    // In a real app, you might save this to a separate DLQ table or send an alert
  }
});
