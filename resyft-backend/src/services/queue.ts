import axios from 'axios'

// AI Service configuration
const AI_SERVICE_URL = process.env.AI_SERVICE_URL || 'http://localhost:8001'

// Job storage for status tracking (in production, use Redis or database)
const jobs = new Map<string, any>()

// Generate unique job ID
const generateJobId = () => `job-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`

export const queueService = {
  addExtractionJob: async (data: any) => {
    const jobId = generateJobId()
    
    try {
      console.log(`🚀 Processing extraction job ${jobId} - Type: ${data.extraction_type}`)
      console.log(`📄 URL: ${data.paper_url || 'N/A'}, Text length: ${data.paper_text?.length || 0}`)
      
      // Initialize job with processing state
      jobs.set(jobId, {
        id: jobId,
        data,
        progress: 0,
        state: 'active',
        returnvalue: null,
        failedReason: null,
        createdAt: new Date()
      })
      
      // Process job asynchronously by calling AI service
      processExtractionJob(jobId, data).catch(error => {
        console.error(`❌ Job ${jobId} failed:`, error)
        const job = jobs.get(jobId)
        if (job) {
          job.state = 'failed'
          job.failedReason = error.message
          job.progress = 100
        }
      })
      
      return {
        id: jobId,
        data,
        progress: 0,
        returnvalue: null
      }
      
    } catch (error) {
      console.error(`❌ Failed to create extraction job:`, error)
      throw error
    }
  },
  
  getJob: async (jobId: string) => {
    const job = jobs.get(jobId)
    if (!job) {
      return null
    }
    
    return {
      id: job.id,
      getState: async () => job.state,
      progress: job.progress,
      returnvalue: job.returnvalue,
      failedReason: job.failedReason
    }
  }
}

// Process extraction job by calling AI service
async function processExtractionJob(jobId: string, data: any) {
  const job = jobs.get(jobId)
  if (!job) {
    throw new Error(`Job ${jobId} not found`)
  }
  
  try {
    // Update progress
    job.progress = 25
    console.log(`🔄 Job ${jobId}: Calling AI service at ${AI_SERVICE_URL}/extract`)
    
    // Call AI service
    const response = await axios.post(`${AI_SERVICE_URL}/extract`, {
      paper_url: data.paper_url,
      paper_text: data.paper_text,
      extraction_type: data.extraction_type,
      project_id: data.project_id,
      use_pydantic_agent: true  // Force use of Gemini + PydanticAI
    }, {
      timeout: 120000,  // 2 minutes timeout
      headers: {
        'Content-Type': 'application/json'
      }
    })
    
    job.progress = 100
    job.state = 'completed'
    job.returnvalue = response.data
    
    console.log(`✅ Job ${jobId}: Successfully completed extraction`)
    console.log(`📊 Results: Methods: ${response.data.methods ? 'Yes' : 'No'}, Sample: ${response.data.sample_size || 'N/A'}`)
    
  } catch (error: any) {
    console.error(`❌ Job ${jobId}: AI service error:`, error.message)
    
    job.progress = 100
    job.state = 'failed'
    job.failedReason = `AI service error: ${error.response?.data?.detail || error.message}`
    
    // Provide fallback result instead of complete failure
    job.returnvalue = {
      methods: "Extraction service temporarily unavailable",
      sample_size: null,
      conclusions: `Analysis could not be completed: ${error.message}`,
      important_quotes: [],
      reliability_score: 0.0,
      relevance_score: 0.0,
      support_score: 0.0,
      error: error.message
    }
  }
}