interface TestimonialProps {
  quote: string
  name: string
  company: string
  type: "large-blue" | "small-dark" | "large-light"
}

const testimonials: TestimonialProps[] = [
  {
    quote:
      "Resyft helps me keep my forms organized and with knowing what forms I need based on my situation.",
    name: "Devika Vivek",
    company: "Resyft User",
    type: "large-blue",
  },
  {
    quote:
      "The organizational AI from this website will allow me to simply input my files and have them neatly organized, saving hours of work.",
    name: "Syna Lodaya",
    company: "College Student",
    type: "small-dark",
  },
  {
    quote:
      "As a student, Resyft can help me to find a good job or internship over the summer.",
    name: "Aarush Ravella",
    company: "High School Student",
    type: "small-dark",
  },
  {
    quote:
      "*The AI understood exactly what forms I needed for my business incorporation. Saved me from hiring a consultant.",
    name: "D. Founder",
    company: "Startup Professional",
    type: "small-dark",
  },
  {
    quote:
      "Resyft is a great tool as a productivity software for any forms I need to fill out.",
    name: "Anjay Kannan",
    company: "Resyft User",
    type: "small-dark",
  },
  {
    quote:
      "*The PDF analysis feature extracted all the fields perfectly. I was able to review and fill forms much faster.",
    name: "F. Finance",
    company: "Finance Professional",
    type: "small-dark",
  },
  {
    quote:
      "I would definitely use this tool for research papers or for my school work.",
    name: "Lou Murphy",
    company: "Student",
    type: "large-light",
  },
]

const TestimonialCard = ({ quote, name, company, type }: TestimonialProps) => {
  const isLargeCard = type.startsWith("large")
  const padding = isLargeCard ? "p-6" : "p-[30px]"

  let cardClasses = `flex flex-col justify-between items-start overflow-hidden rounded-[10px] shadow-[0px_2px_4px_rgba(0,0,0,0.08)] relative ${padding}`
  let quoteClasses = ""
  let nameClasses = ""
  let companyClasses = ""
  let backgroundElements = null
  let cardHeight = ""
  const cardWidth = "w-full md:w-[384px]"

  if (type === "large-blue") {
    cardClasses += " bg-blue-600"
    quoteClasses += " text-white text-2xl font-semibold leading-8"
    nameClasses += " text-white text-base font-bold leading-6"
    companyClasses += " text-white/70 text-base font-normal leading-6"
    cardHeight = "h-[502px]"
    backgroundElements = (
      <div
        className="absolute inset-0 w-full h-full bg-gradient-to-br from-blue-600 to-blue-700"
        style={{ zIndex: 0 }}
      />
    )
  } else if (type === "large-light") {
    cardClasses += " bg-blue-50/50 border border-blue-100"
    quoteClasses += " text-slate-900 text-2xl font-semibold leading-8"
    nameClasses += " text-slate-900 text-base font-bold leading-6"
    companyClasses += " text-slate-600 text-base font-normal leading-6"
    cardHeight = "h-[502px]"
    backgroundElements = (
      <div
        className="absolute inset-0 w-full h-full bg-gradient-to-br from-blue-50 to-white/80"
        style={{ zIndex: 0 }}
      />
    )
  } else {
    cardClasses += " bg-white border border-slate-200 shadow-sm hover:shadow-md transition-shadow"
    quoteClasses += " text-slate-700 text-[17px] font-normal leading-6"
    nameClasses += " text-slate-900 text-sm font-bold leading-[22px]"
    companyClasses += " text-slate-600 text-sm font-normal leading-[22px]"
    cardHeight = "h-[244px]"
  }

  return (
    <div className={`${cardClasses} ${cardWidth} ${cardHeight}`}>
      {backgroundElements}
      <div className={`relative z-10 font-normal break-words ${quoteClasses}`}>{quote}</div>
      <div className="relative z-10 flex justify-start items-center">
        <div className="flex flex-col justify-start items-start gap-0.5">
          <div className={nameClasses}>{name}</div>
          <div className={companyClasses}>{company}</div>
        </div>
      </div>
    </div>
  )
}

export function TestimonialGridSection() {
  return (
    <section id="testimonials-section" className="w-full px-5 overflow-hidden flex flex-col justify-start py-6 md:py-8 lg:py-24 bg-gradient-to-b from-slate-50 to-white">
      <div className="self-stretch py-6 md:py-8 lg:py-16 flex flex-col justify-center items-center gap-2">
        <div className="flex flex-col justify-start items-center gap-6">
          <h2 className="text-center text-slate-900 text-3xl md:text-4xl lg:text-5xl font-bold leading-tight md:leading-tight lg:leading-[3.5rem]">
            Trusted by professionals everywhere
          </h2>
          <p className="self-stretch text-center text-slate-600 text-lg md:text-lg lg:text-xl font-light leading-relaxed max-w-4xl mx-auto">
            {"Real feedback from people using Resyft to simplify their work"} <br />{" "}
            {"and get the right forms faster than ever before"}
          </p>
        </div>
      </div>
      <div className="w-full pt-0.5 pb-4 md:pb-6 lg:pb-10 flex flex-col md:flex-row justify-center items-start gap-4 md:gap-4 lg:gap-6 max-w-[1100px] mx-auto">
        <div className="flex-1 flex flex-col justify-start items-start gap-4 md:gap-4 lg:gap-6">
          <TestimonialCard {...testimonials[0]} />
          <TestimonialCard {...testimonials[1]} />
        </div>
        <div className="flex-1 flex flex-col justify-start items-start gap-4 md:gap-4 lg:gap-6">
          <TestimonialCard {...testimonials[2]} />
          <TestimonialCard {...testimonials[3]} />
          <TestimonialCard {...testimonials[4]} />
        </div>
        <div className="flex-1 flex flex-col justify-start items-start gap-4 md:gap-4 lg:gap-6">
          <TestimonialCard {...testimonials[5]} />
          <TestimonialCard {...testimonials[6]} />
        </div>
      </div>
    </section>
  )
}
