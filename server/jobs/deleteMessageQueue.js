import { Queue, Worker } from "bullmq";
import IORedis from "ioredis";
import Message from "../models/Message.js";

// BullMQ needs a Redis connection with this specific option set
const connection = new IORedis(process.env.REDIS_URL, {
  maxRetriesPerRequest: null,
});

export const deleteQueue = new Queue("delete-messages", { connection });

// Call this whenever a message with a TTL is created
export async function scheduleDeletion(messageId, delayMs) {
  await deleteQueue.add(
    "delete",
    { messageId },
    { delay: delayMs, removeOnComplete: true, removeOnFail: true }
  );
}

// The worker actually processes the job when its delay elapses.
// `io` is passed in from index.js so we can emit a socket event after deleting.
export function startDeleteWorker(io) {
  const worker = new Worker(
  "delete-messages",
  async (job) => {
    const { messageId } = job.data;
    const message = await Message.findById(messageId);
    if (!message || message.deleted) return;

    await Message.findByIdAndUpdate(messageId, {
      deleted: true,
      content: "",
    });

    // Tell both clients in that room to remove this message from their screen
    io.to(message.room).emit("messageDeleted", { messageId });
  },
  { connection }
);

  worker.on("failed", (job, err) => {
    console.error(`Delete job ${job.id} failed:`, err.message);
  });

  return worker;
}
