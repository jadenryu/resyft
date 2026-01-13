'use client'
import { Search, X } from "lucide-react"

export function Header() {
  return (
    <header className="bg-slate-900 px-6 py-4 flex justify-between items-center">
      <div>
        <h1 className="text-xl font-bold text-white">TITLE</h1>
        <p className="text-xs text-slate-400">FORM FILLER</p>
      </div>
      <button className="text-white text-sm">LOG OUT</button>
    </header>
  )
}

export function Sidebar({ onCreateProject, onFormManually }) {
  return (
    <aside className="w-1/16 bg-slate-400">
      <button onClick={onCreateProject} className="mb-2 rounded h-1/2" style={{ transform: 'rotate(-90deg)'}}>
        Create new project
      </button>
      <button onClick={onFormManually} className="mb-2 rounded h-1/2" style={{ transform: 'rotate(-90deg)'}}>
        Add form manually
      </button>
    </aside>
  )
}

export function ProjectSection({ projects, miscforms }) {
  return (
    <div className="flex-1 p-8 overflow-y-auto">
      <h1 className="text-5xl font-bold mb-8">Misc. Forms</h1>
      <h2 className="text-2xl font-semibold mb-4"></h2>
      {miscforms.map((f, i) => (
        <div key={i} className="bg-slate-200 p-6 rounded mb-4">
          <h3 className="text-xl font-bold italic mb-2">{f.formName}</h3>
          <p className="text-sm italic">Purpose: {f.purpose}</p>
          <p className="text-sm italic">Accessibility: {f.accessibility}</p>
        </div>
      ))}
      {projects.map((project, i) => (
        <div key={i}>
          <h1 className="text-5xl font-bold mb-8">{project.name}</h1>
          {project.forms.map((f, j) => (
            <div key={j} className="bg-slate-200 p-6 rounded mb-4">
              <h3 className="text-xl font-bold italic mb-2">{f.formName}</h3>
              <p className="text-sm italic">Purpose: {f.purpose}</p>
              <p className="text-sm italic">Accessibility: {f.accessibility}</p>
            </div>
          ))}
        </div>
      ))}
    </div>
  )
}

export function SharedSection() {
  return (
    <div className="w-96 p-8 border-l">
      <div className="bg-slate-200 p-4 rounded flex items-center gap-2 mb-8">
        <input type="text" placeholder="Insert Join Code..." className="flex-1 bg-transparent outline-none" />
      </div>
      <h2 className="text-3xl font-bold mb-4">Shared With Me</h2>
      <p className="text-xl text-slate-600 mb-6">Rocky Run Middle School</p>
      <div className="bg-slate-200 p-6 rounded">
        <h3 className="text-xl font-bold italic">Student Permission Form</h3>
        <p className="text-sm italic">Purpose: Registration</p>
        <p className="text-sm italic"><a href = "">AI Reader</a></p>
      </div>
    </div>
  )
}

export function CreateProjectPopup({ onClose, onSubmit, text, setText}) {
  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center">

        <div className="bg-white p-8 rounded w-96">
          

          <h1 style={{
            fontSize: "1.8rem",
            fontWeight: 600,
            marginBottom: "12px",
            fontFamily: "system-ui, sans-serif",
            color: "#111"
          }}>
            Tell Us About Your Project
          </h1>

          <p style={{
            fontSize: "0.8rem",
            marginBottom: "12px",
            fontFamily: "system-ui, sans-serif",
            color: "#111"
          }}>
            Include ALL relevant details to ensure your project is created successfully. As much detail as possible will help us understand your needs better. 
            For things like taxes, include income ranged and other information that may help us distinguish what forms you may require.
          </p>

          <textarea
            placeholder="Insert join code..."
            onChange={(e) => setText(e.target.value)}
            style={{
              padding: "10px 14px",
              borderRadius: "8px",
              height: "50%",
              border: "1px solid #ccc",
              fontSize: "1rem",
              width: "100%",
              maxWidth: "320px",
              outline: "none"
            }}
            onFocus={(e) => e.target.style.borderColor = "#2563eb"}
            onBlur={(e) => e.target.style.borderColor = "#ccc"}
          />

            <div className="flex gap-3">
                <button onClick={onClose} className="flex-1 px-4 py-2 border rounded">Cancel</button>
                <button onClick={onSubmit} className="flex-1 px-4 py-2 bg-purple-600 text-white rounded">Submit</button>
             </div>
      </div>
    </div>
  )
}