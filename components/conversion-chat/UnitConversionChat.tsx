'use client'

import React, { useState, useRef, useEffect } from 'react'
import { Send, Bot, User, AlertTriangle } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { ApiKeyDialog } from '@/components/api-key-dialog'
import { ScrollArea } from '@/components/ui/scroll-area'

type Message = {
  role: 'user' | 'assistant'
  content: string
}

export function UnitConversionChat() {
  const [messages, setMessages] = useState<Message[]>([
    {
      role: 'assistant',
      content: 'Hello! I can help you with unit conversions and calculations. What would you like to calculate today?'
    }
  ])
  const [input, setInput] = useState('')
  const [loading, setLoading] = useState(false)
  const [apiKey, setApiKey] = useState('')
  const [isApiKeyDialogOpen, setIsApiKeyDialogOpen] = useState(false)
  
  const messagesEndRef = useRef<HTMLDivElement>(null)

  // Load API key from localStorage on component mount
  useEffect(() => {
    const storedApiKey = localStorage.getItem('calculations_api_key')
    if (storedApiKey) {
      setApiKey(storedApiKey)
    } else {
      // Show API key dialog if no key is stored
      setIsApiKeyDialogOpen(true)
    }
  }, [])

  // Scroll to bottom on new messages
  useEffect(() => {
    if (messagesEndRef.current) {
      messagesEndRef.current.scrollIntoView({ behavior: 'smooth' })
    }
  }, [messages])

  const handleApiKeySave = () => {
    if (apiKey) {
      localStorage.setItem('calculations_api_key', apiKey)
    }
    setIsApiKeyDialogOpen(false)
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    
    if (!input.trim()) return
    if (!apiKey) {
      setIsApiKeyDialogOpen(true)
      return
    }

    // Add user message to chat
    const userMessage: Message = { role: 'user', content: input }
    setMessages(prev => [...prev, userMessage])
    setInput('')
    setLoading(true)

    try {
      // Call the API route we'll create next
      const response = await fetch('/api/conversion-chat', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          message: input,
          apiKey
        }),
      })

      if (!response.ok) {
        throw new Error('Failed to get response')
      }

      const data = await response.json()
      
      // Add assistant response to chat
      setMessages(prev => [...prev, { 
        role: 'assistant', 
        content: data.response 
      }])
    } catch (error) {
      console.error('Error:', error)
      setMessages(prev => [...prev, { 
        role: 'assistant', 
        content: 'Sorry, there was an error processing your request. Please try again.' 
      }])
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="flex flex-col h-[calc(100vh-200px)] max-w-3xl mx-auto bg-background rounded-lg border shadow-sm overflow-hidden">
      {/* Chat Header */}
      <div className="p-4 border-b flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Bot className="h-5 w-5" />
          <h2 className="font-medium text-lg">Calculations Assistant</h2>
        </div>
        <ApiKeyDialog
          apiKey={apiKey}
          onApiKeyChange={setApiKey}
          onSave={handleApiKeySave}
          isOpen={isApiKeyDialogOpen}
          onOpenChange={setIsApiKeyDialogOpen}
        />
      </div>

      {/* Chat Messages */}
      <ScrollArea className="flex-grow p-4 space-y-4">
        {messages.map((message, index) => (
          <div
            key={index}
            className={`flex ${
              message.role === 'assistant' ? 'justify-start' : 'justify-end'
            } mb-4`}
          >
            <div
              className={`flex items-start max-w-[80%] ${
                message.role === 'assistant'
                  ? 'bg-muted text-foreground'
                  : 'bg-primary text-primary-foreground'
              } rounded-lg px-4 py-2`}
            >
              <div className="mr-2 mt-1">
                {message.role === 'assistant' ? (
                  <Bot className="h-5 w-5" />
                ) : (
                  <User className="h-5 w-5" />
                )}
              </div>
              <div>
                <p className="text-sm whitespace-pre-wrap break-words">{message.content}</p>
              </div>
            </div>
          </div>
        ))}
        <div ref={messagesEndRef} />
      </ScrollArea>

      {/* API Key Warning */}
      {!apiKey && (
        <div className="p-2 bg-amber-100 dark:bg-amber-900/30 text-amber-800 dark:text-amber-200 flex items-center gap-2 text-sm">
          <AlertTriangle className="h-4 w-4" />
          <span>Please add your API key to use the chat</span>
        </div>
      )}

      {/* Input Form */}
      <form onSubmit={handleSubmit} className="p-4 border-t flex gap-2">
        <Input
          value={input}
          onChange={(e) => setInput(e.target.value)}
          placeholder="Enter a unit conversion or calculation..."
          disabled={loading || !apiKey}
          className="flex-grow"
        />
        <Button type="submit" disabled={loading || !apiKey}>
          {loading ? (
            <span className="animate-pulse">...</span>
          ) : (
            <Send className="h-4 w-4" />
          )}
        </Button>
      </form>
    </div>
  )
}