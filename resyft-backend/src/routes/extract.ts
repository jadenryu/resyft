import { Router } from 'express'
import { z } from 'zod'
import { queueService } from '../services/queue'

const router = Router()

const extractionSchema = z.object({
  paper_url: z.string().url().optional(),
  paper_text: z.string().optional(),
  extraction_type: z.enum(['numerical', 'quotes', 'details', 'all']),
  project_id: z.string().optional(),
})

router.post('/', async (req, res) => {
  try {
    const data = extractionSchema.parse(req.body)
    
    if (!data.paper_url && !data.paper_text) {
      return res.status(400).json({ error: 'Either paper_url or paper_text is required' })
    }

    // Add job to queue
    const job = await queueService.addExtractionJob(data)
    
    res.json({ 
      jobId: job.id,
      status: 'queued',
      message: 'Extraction job queued successfully' 
    })
  } catch (error) {
    if (error instanceof z.ZodError) {
      return res.status(400).json({ error: error.errors })
    }
    console.error('Extraction error:', error)
    res.status(500).json({ error: 'Internal server error' })
  }
})

router.get('/status/:jobId', async (req, res) => {
  try {
    const job = await queueService.getJob(req.params.jobId)
    
    if (!job) {
      return res.status(404).json({ error: 'Job not found' })
    }

    const state = await job.getState()
    const progress = job.progress
    const result = job.returnvalue
    const failedReason = job.failedReason

    res.json({
      jobId: job.id,
      state,
      progress,
      result,
      failedReason
    })
  } catch (error) {
    console.error('Status check error:', error)
    res.status(500).json({ error: 'Internal server error' })
  }
})

export const extractRouter = router