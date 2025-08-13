import { NextRequest, NextResponse } from 'next/server'
import { researchTools, toolHandlers } from '../../../lib/research-tools'

export async function POST(request: NextRequest) {
  try {
    const { message, conversation_history = [], preferred_tool } = await request.json()
    
    const apiKey = process.env.OPEN_ROUTER_API_KEY
    const model = process.env.OPEN_ROUTER_MODEL || 'google/gemini-2.5-flash-lite'
    
    if (!apiKey) {
      throw new Error('OpenRouter API key not configured')
    }
    
    // Build message history
    const messages = [
      {
        role: 'system',
        content: `You are a helpful research assistant powered by Google Gemini 2.5 Flash Lite. You have access to specialized research tools for analyzing papers, extracting statistics, assessing methodology, and more. Use these tools when users ask for specific research tasks. Be conversational and educational. Always explain what tool you're using and why it's helpful for their request.${preferred_tool ? `\n\nIMPORTANT: The user has specifically requested to use the tool: ${preferred_tool}. Please prioritize using this tool if it's relevant to their request.` : ''}`
      },
      ...conversation_history,
      {
        role: 'user',
        content: message
      }
    ]

    // Initial API call with tools
    const response = await fetch('https://openrouter.ai/api/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${apiKey}`,
        'Content-Type': 'application/json',
        'HTTP-Referer': 'https://resyft.com',
        'X-Title': 'Resyft Research Agent',
      },
      body: JSON.stringify({
        model: model,
        messages: messages,
        tools: researchTools,
        tool_choice: 'auto',
        temperature: 0.7,
        max_tokens: 1500
      })
    })

    if (!response.ok) {
      const errorText = await response.text()
      throw new Error(`OpenRouter API error: ${response.status} - ${errorText}`)
    }

    const data = await response.json()
    const assistantMessage = data.choices[0].message

    // Check if model wants to use tools
    if (assistantMessage.tool_calls && assistantMessage.tool_calls.length > 0) {
      // Execute tool calls
      const toolResults = []
      
      for (const toolCall of assistantMessage.tool_calls) {
        const toolName = toolCall.function.name
        const toolArgs = JSON.parse(toolCall.function.arguments)
        
        try {
          const handler = toolHandlers[toolName as keyof typeof toolHandlers]
          if (handler) {
            const result = await handler(toolArgs)
            toolResults.push({
              role: 'tool',
              tool_call_id: toolCall.id,
              name: toolName,
              content: JSON.stringify(result, null, 2)
            })
          }
        } catch (error) {
          toolResults.push({
            role: 'tool',
            tool_call_id: toolCall.id,
            name: toolName,
            content: JSON.stringify({ error: 'Tool execution failed', details: error instanceof Error ? error.message : 'Unknown error' })
          })
        }
      }

      // Add assistant message and tool results to conversation
      messages.push(assistantMessage)
      messages.push(...toolResults)

      // Second API call to get final response
      const finalResponse = await fetch('https://openrouter.ai/api/v1/chat/completions', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${apiKey}`,
          'Content-Type': 'application/json',
          'HTTP-Referer': 'https://resyft.com',
          'X-Title': 'Resyft Research Agent',
        },
        body: JSON.stringify({
          model: model,
          messages: messages,
          tools: researchTools,
          temperature: 0.7,
          max_tokens: 1500
        })
      })

      if (!finalResponse.ok) {
        const errorText = await finalResponse.text()
        throw new Error(`OpenRouter API error: ${finalResponse.status} - ${errorText}`)
      }

      const finalData = await finalResponse.json()
      const finalMessage = finalData.choices[0].message

      return NextResponse.json({
        response: finalMessage.content.trim(),
        tools_used: assistantMessage.tool_calls.map((tc: any) => tc.function.name),
        usage: finalData.usage,
        conversation_history: [
          ...conversation_history,
          { role: 'user', content: message },
          assistantMessage,
          ...toolResults,
          finalMessage
        ]
      })
    } else {
      // No tools needed, return direct response
      return NextResponse.json({
        response: assistantMessage.content.trim(),
        tools_used: [],
        usage: data.usage,
        conversation_history: [
          ...conversation_history,
          { role: 'user', content: message },
          assistantMessage
        ]
      })
    }
    
  } catch (error) {
    console.error('Chat API Error:', error)
    return NextResponse.json(
      { 
        error: 'Failed to generate response',
        details: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    )
  }
}