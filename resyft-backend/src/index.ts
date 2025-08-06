import express from 'express'
import cors from 'cors'
import dotenv from 'dotenv'
import { extractRouter } from './routes/extract'
import { projectRouter } from './routes/projects'
import { authMiddleware } from './middlewares/auth'

dotenv.config()

const app = express()  // Production-ready backend service
const PORT = process.env.PORT || 8000

app.use(cors())
app.use(express.json())

// Health check
app.get('/health', (_req, res) => {
  res.json({ status: 'ok' })
})

// Public routes
app.use('/api/extract', extractRouter)

// Protected routes
app.use('/api/projects', authMiddleware, projectRouter)

app.listen(PORT, () => {
  console.log(`Backend server running on port ${PORT}`)
})