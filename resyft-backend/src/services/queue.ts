import { Queue, Worker } from 'bullmq'
import IORedis from 'ioredis'

const connection = new IORedis(process.env.REDIS_URL || 'redis://localhost:6379', {
  maxRetriesPerRequest: null
})

const extractionQueue = new Queue('paper-extraction', {
  connection,
  defaultJobOptions: {
    removeOnComplete: false,
    removeOnFail: false,
  }
})

// Worker will be implemented separately to handle the actual extraction
const worker = new Worker('paper-extraction', async (job) => {
  console.log(`Processing job ${job.id}`)
  
  // Call AI service for extraction
  const response = await fetch(`${process.env.AI_SERVICE_URL}/extract`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(job.data)
  })

  if (!response.ok) {
    throw new Error('AI service extraction failed')
  }

  return response.json()
}, {
  connection,
  concurrency: 5
})

worker.on('completed', (job) => {
  console.log(`Job ${job.id} completed`)
})

worker.on('failed', (job, err) => {
  console.error(`Job ${job?.id} failed:`, err)
})

export const queueService = {
  addExtractionJob: async (data: any) => {
    return extractionQueue.add('extract', data)
  },
  
  getJob: async (jobId: string) => {
    return extractionQueue.getJob(jobId)
  }
}