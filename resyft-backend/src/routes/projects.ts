import { Router } from 'express'
import { z } from 'zod'
import { AuthRequest } from '../middlewares/auth'
import { createClient } from '@supabase/supabase-js'

const router = Router()

// Initialize Supabase client lazily
let supabase: ReturnType<typeof createClient>
const getSupabase = () => {
  if (!supabase) {
    supabase = createClient(
      process.env.SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_KEY!
    )
  }
  return supabase
}

const projectSchema = z.object({
  name: z.string().min(1),
  description: z.string(),
  research_argument: z.string(),
  extraction_preferences: z.object({
    favor_statistical: z.boolean(),
    favor_qualitative: z.boolean(),
  })
})

router.get('/', async (req: AuthRequest, res) => {
  try {
    const { data, error } = await getSupabase()
      .from('projects')
      .select('*')
      .eq('user_id', req.user.id)
      .order('created_at', { ascending: false })

    if (error) throw error

    return res.json(data)
  } catch (error) {
    console.error('Get projects error:', error)
    return res.status(500).json({ error: 'Internal server error' })
  }
})

router.post('/', async (req: AuthRequest, res) => {
  try {
    const data = projectSchema.parse(req.body)
    
    const { data: project, error } = await supabase
      .from('projects')
      .insert({
        ...data,
        user_id: req.user.id
      })
      .select()
      .single()

    if (error) throw error

    return res.status(201).json(project)
  } catch (error) {
    if (error instanceof z.ZodError) {
      return res.status(400).json({ error: error.issues })
    }
    console.error('Create project error:', error)
    return res.status(500).json({ error: 'Internal server error' })
  }
})

export const projectRouter = router