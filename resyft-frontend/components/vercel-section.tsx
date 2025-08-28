'use client'

import { motion } from 'framer-motion'
import { Card, CardContent } from './ui/card'
import { Badge } from './ui/badge'
import { Button } from './ui/button'
import { ArrowRight, LucideIcon } from 'lucide-react'

interface VercelSectionProps {
  badge?: string
  title: string
  description: string
  features: {
    icon: LucideIcon
    title: string
    description: string
  }[]
  ctaText?: string
  ctaHref?: string
  reversed?: boolean
  className?: string
}

export function VercelSection({
  badge,
  title,
  description,
  features,
  ctaText,
  ctaHref,
  reversed = false,
  className = ""
}: VercelSectionProps) {
  return (
    <section className={`py-24 bg-gradient-to-br from-slate-50 to-white border-t border-slate-200/50 ${className}`}>
      <div className="container px-4 md:px-6 max-w-7xl mx-auto">
        <div className={`grid lg:grid-cols-2 gap-12 items-center ${reversed ? 'lg:flex-row-reverse' : ''}`}>
          {/* Content Side */}
          <motion.div
            initial={{ opacity: 0, x: reversed ? 50 : -50 }}
            whileInView={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.6 }}
            viewport={{ once: true }}
            className={`space-y-6 ${reversed ? 'lg:order-2' : ''}`}
          >
            {badge && (
              <Badge 
                variant="secondary" 
                className="bg-blue-50 text-blue-700 hover:bg-blue-100 border-blue-200 px-3 py-1 text-sm font-medium"
              >
                {badge}
              </Badge>
            )}
            
            <div className="space-y-4">
              <h2 className="text-3xl lg:text-4xl xl:text-5xl font-bold text-slate-900 leading-tight">
                {title}
              </h2>
              <p className="text-xl text-slate-600 leading-relaxed">
                {description}
              </p>
            </div>

            {ctaText && ctaHref && (
              <Button 
                size="lg" 
                className="bg-black hover:bg-slate-800 text-white px-6 py-3 text-base font-semibold group"
                asChild
              >
                <a href={ctaHref}>
                  {ctaText}
                  <ArrowRight className="ml-2 h-4 w-4 transition-transform group-hover:translate-x-1" />
                </a>
              </Button>
            )}
          </motion.div>

          {/* Features Grid Side */}
          <motion.div
            initial={{ opacity: 0, x: reversed ? -50 : 50 }}
            whileInView={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.6, delay: 0.2 }}
            viewport={{ once: true }}
            className={`grid gap-6 ${reversed ? 'lg:order-1' : ''}`}
          >
            {features.map((feature, index) => (
              <motion.div
                key={index}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.4, delay: index * 0.1 }}
                viewport={{ once: true }}
              >
                <Card className="border-0 shadow-sm hover:shadow-md transition-all duration-300 bg-white/50 backdrop-blur-sm">
                  <CardContent className="p-6">
                    <div className="flex items-start gap-4">
                      <div className="p-3 bg-gradient-to-br from-blue-50 to-indigo-50 rounded-xl border border-blue-100">
                        <feature.icon className="h-6 w-6 text-blue-600" />
                      </div>
                      
                      <div className="space-y-2 flex-1">
                        <h3 className="font-semibold text-lg text-slate-900">
                          {feature.title}
                        </h3>
                        <p className="text-slate-600 leading-relaxed">
                          {feature.description}
                        </p>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </motion.div>
            ))}
          </motion.div>
        </div>
      </div>
    </section>
  )
}