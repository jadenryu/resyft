export function Header() {
  return (
      <header className="bg-slate-900 px-6 py-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div>
              <h1 className="text-xl font-bold text-white">TITLE</h1>
              <p className="text-xs text-slate-400">INTELLIGENT FORM FILLER</p>
            </div>
          </div>
          <button className="px-6 py-2 text-white text-sm font-semibold hover:text-slate-300 transition-colors">
            LOG IN
          </button>
        </div>
      </header>
  )
}


export function SimpleTwoColumn() {
  return (
    <div className="h-screen flex flex-col bg-slate-50">

      <div className="flex-1 flex overflow-hidden">
       
       
       
       
        <aside className="w-1/2 bg-slate-900 p-12 overflow-y-auto flex flex-col items-center justify-center">
          <div className="text-center mb-8">
            <div className="bg-slate-800 p-8 rounded-lg mb-8">
              <h2 className="text-2xl font-bold text-white mb-2">TITLE</h2>
              <p className="text-sm text-slate-400">INTELLIGENT FORM FILLERE</p>
            </div>
          </div>
          
          <h1 className="text-4xl font-bold text-white mb-4">Form Filler</h1>
          <p className="text-2xl font-bold text-blue-500">POWERED BY ___</p>
        </aside>




        <main className="flex-1 bg-slate-50 p-12 overflow-y-auto flex flex-col items-center justify-center">
          <div className="w-full max-w-md space-y-6">
            <button className="w-full bg-slate-900 text-blue-500 font-semibold py-4 px-6 rounded-full hover:bg-slate-800 transition-colors">
              START A PROJECT (QUICK ROUTE)
            </button>
            
            <div className="text-center text-xl font-bold text-slate-900">OR</div>
            
            <button className="w-full bg-slate-900 text-blue-500 font-semibold py-4 px-6 rounded-full hover:bg-slate-800 transition-colors">
              START A PROJECT (ACCOUNT ROUTE)
            </button>
            
            <div className="text-center text-xl font-bold text-slate-900">OR</div>
            
            <button className="w-full bg-slate-900 text-blue-500 font-semibold py-4 px-6 rounded-full hover:bg-slate-800 transition-colors">
              CONNECT WITH OTHERS
            </button>
          </div>
        </main>
      </div>
    </div>
  )
}