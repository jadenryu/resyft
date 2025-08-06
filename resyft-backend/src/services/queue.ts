import { Queue } from 'bullmq'
import IORedis from 'ioredis'

// Lazy initialization to avoid connection errors on startup
let connection: IORedis | null = null
let extractionQueue: Queue | null = null

const getConnection = () => {
  if (!connection) {
    const redisUrl = process.env.REDIS_URL
    if (!redisUrl) {
      throw new Error('Redis not configured. Set REDIS_URL environment variable.')
    }
    
    connection = new IORedis(redisUrl, {
      maxRetriesPerRequest: null,
      enableReadyCheck: false
    })
  }
  return connection
}

const getQueue = () => {
  if (!extractionQueue) {
    extractionQueue = new Queue('paper-extraction', {
      connection: getConnection(),
      defaultJobOptions: {
        removeOnComplete: false,
        removeOnFail: false,
      }
    })
  }
  return extractionQueue
}

// Worker initialization will be done when Redis is properly configured

export const queueService = {
  addExtractionJob: async (data: any) => {
    try {
      const queue = getQueue()
      return await queue.add('extract', data)
    } catch (error) {
      console.error('Queue service unavailable:', error)
      // Return a mock job response for now
      return {
        id: `mock-${Date.now()}`,
        data,
        progress: 0,
        returnvalue: null
      }
    }
  },
  
  getJob: async (jobId: string) => {
    try {
      const queue = getQueue()
      return await queue.getJob(jobId)
    } catch (error) {
      console.error('Queue service unavailable:', error)
      // Return null to indicate job not found when Redis is unavailable
      return null
    }
  }
}