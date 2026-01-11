'use client'

import { useState, useEffect } from "react"
import { Header, Sidebar, ProjectSection, SharedSection, CreateProjectPopup } from "../components/projectTracker"
import * as tf from '@tensorflow/tfjs';

export default function ProjectDashboard() {
  const [showPopup, setShowPopup] = useState(false)
  const [miscforms, setmiscForms] = useState([
    { formName: "Forms Populate Here", purpose: "Purpose Goes Here", accessibility: "AI Reader Linked Here" }
  ])
  const [projects, setProjects] = useState([])
  const [text, setText] = useState("")
  const [model, setModel] = useState<tf.LayersModel | null>(null)
  const [vocabulary, setVocabulary] = useState<{[key: string]: number} | null>(null)
  const [config, setConfig] = useState<{max_length: number, vocab_size: number} | null>(null)
  const [modelStatus, setModelStatus] = useState<'loading' | 'loaded' | 'error'>('loading')

  useEffect(() => {
    async function loadModel() {
      try {
        setModelStatus('loading')
        
        const loadedModel = await tf.loadLayersModel('/tfjs_model/model.json')
        setModel(loadedModel)
        
        const vocabResponse = await fetch('/vocabulary.json')
        const vocab = await vocabResponse.json()
        setVocabulary(vocab)
        
        const configResponse = await fetch('/config.json')
        const cfg = await configResponse.json()
        setConfig(cfg)
        
        console.log("Model loaded successfully!")
        setModelStatus('loaded')
      } catch (error) {
        console.error("Error loading model:", error)
        setModelStatus('error')
      }
    }
    
    loadModel()
  }, [])

  const tokenizeText = (text: string): number[] => {
    if (!vocabulary || !config) return []
    
    const words = text.toLowerCase().split(/\s+/)
    const sequence: number[] = []
    
    for (const word of words) {
      if (vocabulary[word]) {
        sequence.push(vocabulary[word])
      } else {
        sequence.push(1)
      }
    }
    
    return sequence
  }

  const padSequence = (sequence: number[], maxLength: number): number[] => {
    if (sequence.length >= maxLength) {
      return sequence.slice(0, maxLength)
    }
    return [...sequence, ...Array(maxLength - sequence.length).fill(0)]
  }

  const predictText = async (inputText: string): Promise<boolean> => {
    if (!model || !vocabulary || !config) {
      console.warn("Model not loaded yet, defaulting to true")
      return true
    }

    try {
      const sequence = tokenizeText(inputText)
      const paddedSequence = padSequence(sequence, config.max_length)
      
      const inputTensor = tf.tensor2d([paddedSequence], [1, config.max_length])
      
      const prediction = model.predict(inputTensor) as tf.Tensor
      const predictionData = await prediction.data()
      
      inputTensor.dispose()
      prediction.dispose()
      
      return predictionData[0] > 0.5
    } catch (error) {
      console.error("Error making prediction:", error)
      return true
    }
  }

  const addForm = async () => {
    if (!text.trim()) {
      alert("Please enter a project name")
      return
    }

    const formsVAR = []
    
    const shouldAddForm = await predictText(text)
    
    if (shouldAddForm) {
      formsVAR.push({ 
        formName: "New Form", 
        purpose: "Purpose Goes Here", 
        accessibility: "AI Reader Linked Here" 
      })
    }
    
    const newProject = { name: text, forms: formsVAR }
    setProjects(prev => [...prev, newProject])
    setText("")
    setShowPopup(false)
  }

  const wormwhole = () => {
    setShowPopup(false)
  }

  return (
    <div className="h-screen flex flex-col">
      <Header />
      <div className="flex-1 flex overflow-hidden">
        <Sidebar 
          onCreateProject={() => setShowPopup(true)} 
          onFormManually={() => wormwhole()} 
        />
        <main className="flex-1 bg-white flex">
          <ProjectSection miscforms={miscforms} projects={projects} />
          <SharedSection />
        </main>
      </div>
      {showPopup && (
        <CreateProjectPopup 
          text={text}
          setText={setText}
          onClose={() => setShowPopup(false)}
          onSubmit={addForm}
        />
      )}
    </div>
  )
}