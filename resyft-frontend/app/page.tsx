'use client'

import { useState } from "react"
import { Header, Sidebar, ProjectSection, SharedSection, CreateProjectPopup } from "../components/projectTracker"
import * as tf from '@tensorflow/tfjs';
import { classifyHealthInsuranceQuery } from "./modelWorking"
var numberProjects = 1;

export default function ProjectDashboard() {
  const [showPopup, setShowPopup] = useState(false)
  const [miscforms, setmiscForms] = useState([{ formName: "Forms Populate Here", purpose: "Purpose Goes Here", accessibility: "AI Reader Linked Here" }])
  const [projects, setProjects] = useState([

  ])

  const [text, setText] = useState("")

  

  
  const addForm = () => {
    // const formsVAR = []
    // // THis code segment is going to add some number of forms depending in the NLP:
    // // if (model true) {
    //   formsVAR.push({ formName: "New Form", purpose: "Purpose Goes Here", accessibility: "AI Reader Linked Here" })
    //   formsVAR.push({ formName: "New Form2", purpose: "Purpose Goes Here", accessibility: "AI Reader Linked Here" })
    const formsVAR = classifyHealthInsuranceQuery(text)

    
    if (formsVAR.length === 0) {
      console.warn("No forms detected! Check input text.");
      alert("No matching forms found. Please try again with different input.");
      return;
    }

    // }
    const newProject = { name: "Project " + numberProjects, forms: formsVAR  }
    numberProjects += 1;
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
        <Sidebar onCreateProject={() => setShowPopup(true)} onFormManually={() => wormwhole()} />
        <main className="flex-1 bg-white flex">
          <ProjectSection miscforms={miscforms} projects={projects} />
          <SharedSection />
        </main>
      </div>
      {showPopup && (
        <CreateProjectPopup 
          text ={text}
            setText={setText}
          onClose={() => setShowPopup(false)}
          onSubmit={addForm}
        />
      )}
    </div>
  )
}