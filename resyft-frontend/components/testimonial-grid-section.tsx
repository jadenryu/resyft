import Image from "next/image"

interface TestimonialProps {
  quote: string
  name: string
  company: string
  avatar: string
  type: "large-blue" | "small-dark" | "large-light"
}

const testimonials: TestimonialProps[] = [
  {
    quote:
      "The form recommendations saved me hours of research. I didn't know which insurance forms I needed, and it figured it out instantly.",
    name: "Sarah Chen",
    company: "Small Business Owner",
    avatar: "/placeholder.svg",
    type: "large-blue",
  },
  {
    quote:
      "Uploading my tax forms and having them automatically analyzed was incredible. No more manual data entry.",
    name: "Marcus Johnson",
    company: "Freelance Designer",
    avatar: "/placeholder.svg",
    type: "small-dark",
  },
  {
    quote:
      "As a healthcare administrator, managing patient forms is a nightmare. This tool made it so much easier.",
    name: "Emily Rodriguez",
    company: "Healthcare Admin",
    avatar: "/placeholder.svg",
    type: "small-dark",
  },
  {
    quote:
      "The AI understood exactly what forms I needed for my business incorporation. Saved me from hiring a consultant.",
    name: "David Kim",
    company: "Startup Founder",
    avatar: "/placeholder.svg",
    type: "small-dark",
  },
  {
    quote:
      "Finally, a tool that understands the complexity of insurance paperwork. It recommended forms I didn't even know existed.",
    name: "Lisa Thompson",
    company: "Insurance Agent",
    avatar: "/placeholder.svg",
    type: "small-dark",
  },
  {
    quote:
      "The PDF analysis feature extracted all the fields perfectly. I was able to review and fill forms much faster.",
    name: "Ahmed Hassan",
    company: "Financial Advisor",
    avatar: "/placeholder.svg",
    type: "small-dark",
  },
  {
    quote:
      "From form discovery to completion, this tool streamlines every step. It's become indispensable for my practice.",
    name: "Jennifer Adams",
    company: "Legal Assistant",
    avatar: "/placeholder.svg",
    type: "large-light",
  },
]

const TestimonialCard = ({ quote, name, company, avatar, type }: TestimonialProps) => {
  const isLargeCard = type.startsWith("large")
  const avatarSize = isLargeCard ? 48 : 36
  const avatarBorderRadius = isLargeCard ? "rounded-[41px]" : "rounded-[30.75px]"
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
      <div className="relative z-10 flex justify-start items-center gap-3">
        <Image
          src={avatar || "/placeholder.svg"}
          alt={`${name} avatar`}
          width={avatarSize}
          height={avatarSize}
          className={`${avatarBorderRadius}`}
          style={{ border: "1px solid rgba(255, 255, 255, 0.08)" }}
        />
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
            {"Real feedback from people using Form Filler to simplify their work"} <br />{" "}
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
