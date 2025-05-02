'use client'

import React, { useState, useRef, useEffect } from 'react'
import { Send, Bot, User, AlertTriangle, InfoIcon, RefreshCw, FileUp } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { ScrollArea } from '@/components/ui/scroll-area'
import { ApiKeyDialog } from '@/components/api-key-dialog'
import { Card } from '@/components/ui/card'
import { Separator } from '@/components/ui/separator'
import { Badge } from '@/components/ui/badge'
import { ConversionSteps } from '@/components/conversion/copy-command'
import { FormatSelector, getCommonFormats } from '@/components/conversion/format-selector'
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog'

// Message type for our chat
type Message = {
  role: 'user' | 'assistant'
  content: string
  steps?: Array<{
    description: string;
    command: string;
  }>
}

// Conversion unit type
type ConversionUnit = {
  category: string;
  name: string;
  role: 'from' | 'to';
}

// File info type for drag and drop
type FileInfo = {
  name: string;
  size: number;
  type: string;
  lastModified: number;
}

// Conversion categories and their items
const conversions = [
  {
    category: 'Length',
    items: [
      'Kilometers', 'Meters', 'Decimeters', 'Centimeters', 'Millimeters', 
      'Micrometers', 'Picometers', 'Nautical Miles', 'Miles', 'Furlongs', 
      'Fathoms', 'Yards', 'Feet', 'Inches', 'Chinese Units'
    ]
  },
  {
    category: 'Temperature',
    items: [
      'Celsius', 'Fahrenheit', 'Kelvin', 'Rankine', 'Reaumur'
    ]
  },
  {
    category: 'Mass/Weight',
    items: [
      'Metric Tons', 'Kilograms', 'Grams', 'Milligrams', 'Micrograms',
      'Pounds', 'Ounces', 'Carats', 'Grains', 'Stone', 'Long Tons',
      'Short Tons', 'Hundredweight', 'Chinese Units'
    ]
  },
  {
    category: 'Area',
    items: [
      'Square Kilometers', 'Hectares', 'Ares', 'Square Meters', 
      'Square Decimeters', 'Square Centimeters', 'Square Millimeters',
      'Square Miles', 'Acres', 'Square Yards', 'Square Feet', 'Square Inches'
    ]
  },
  {
    category: 'Volume',
    items: [
      'Cubic Meters', 'Cubic Kilometers', 'Cubic Centimeters', 'Cubic Millimeters',
      'Liters', 'Milliliters', 'Gallons', 'Quarts', 'Pints', 'Cups', 'Fluid Ounces',
      'Tablespoons', 'Teaspoons', 'Cubic Inches', 'Cubic Feet', 'Cubic Yards'
    ]
  },
  {
    category: 'Time',
    items: [
      'Years', 'Months', 'Weeks', 'Days', 'Hours', 'Minutes', 'Seconds',
      'Milliseconds', 'Microseconds', 'Nanoseconds'
    ]
  },
  {
    category: 'Speed',
    items: [
      'Meters per Second', 'Kilometers per Hour', 'Miles per Hour',
      'Knots', 'Feet per Second', 'Mach'
    ]
  },
  {
    category: 'Data Storage',
    items: [
      'Bits', 'Bytes', 'Kilobytes', 'Megabytes', 'Gigabytes',
      'Terabytes', 'Petabytes', 'Exabytes', 'Zettabytes'
    ]
  }
];

export function UnitConversionChat() {
  // State for chat messages
  const [messages, setMessages] = useState<Message[]>([
    {
      role: 'assistant',
      content: 'Hello! I can help with file format conversions and unit conversions. Select units from the list, drop files for conversion commands.'
    }
  ])
  
  // State for user input and loading state
  const [input, setInput] = useState('')
  const [isLoading, setIsLoading] = useState(false)
  
  // State for API key management
  const [apiKey, setApiKey] = useState('')
  const [isApiKeyDialogOpen, setIsApiKeyDialogOpen] = useState(false)
  
  // State for sidebar visibility on mobile
  const [showSidebar, setShowSidebar] = useState(false)
  
  // State for unit conversion selection
  const [selectedUnits, setSelectedUnits] = useState<ConversionUnit[]>([])
  const [selectionStep, setSelectionStep] = useState<'from' | 'to' | null>('from')
  
  // State for file drag and drop
  const [isDragging, setIsDragging] = useState(false)
  const [draggedFile, setDraggedFile] = useState<FileInfo | null>(null)
  
  // State for file format selection
  const [showFormatDialog, setShowFormatDialog] = useState(false)
  const [selectedFormat, setSelectedFormat] = useState('')
  
  // Reference to scroll to bottom of chat
  const messagesEndRef = useRef<HTMLDivElement>(null)
  const chatAreaRef = useRef<HTMLDivElement>(null)

  // Load API key from localStorage when component mounts
  useEffect(() => {
    const storedApiKey = localStorage.getItem('ai-api-key')
    if (storedApiKey) {
      setApiKey(storedApiKey)
    } else {
      // If no API key is found, open the dialog
      setIsApiKeyDialogOpen(true)
    }
  }, [])

  // Scroll to bottom when messages change
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages])

  // Save API key to localStorage
  const handleSaveApiKey = () => {
    localStorage.setItem('ai-api-key', apiKey)
    setIsApiKeyDialogOpen(false)
  }

  // Handle file drop events
  const handleDragOver = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault()
    e.stopPropagation()
    setIsDragging(true)
  }

  const handleDragLeave = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault()
    e.stopPropagation()
    setIsDragging(false)
  }

  const handleDrop = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault()
    e.stopPropagation()
    setIsDragging(false)
    
    const files = e.dataTransfer.files
    if (files.length > 0) {
      const file = files[0]
      const fileInfo: FileInfo = {
        name: file.name,
        size: file.size,
        type: file.type,
        lastModified: file.lastModified
      }
      
      setDraggedFile(fileInfo)
      
      // Get the file extension
      const fileExt = file.name.substring(file.name.lastIndexOf('.') + 1).toLowerCase()
      
      // Get potential formats based on the file
      const formats = getCommonFormats(file.type || 'application/' + fileExt)
      
      if (formats.length > 0) {
        // Set the first format as default
        setSelectedFormat(formats[0].value)
        // Show format selection dialog
        setShowFormatDialog(true)
      } else {
        // If no formats available, proceed with conversion
        handleFileConversion(fileInfo, '')
      }
    }
  }

  // Helper function to parse commands from conversion response
  const parseCommands = (text: string): Array<{description: string; command: string}> | undefined => {
    const commandSteps: Array<{description: string; command: string}> = [];
    
    // Enhanced regex to catch different formats of code blocks
    const stepRegex = /(\d+)\.\s+(.*?)(?::|：)\s*```(?:\w*)\s*(.*?)```/gs;
    
    // Alternative pattern to catch commands without code blocks
    const altStepRegex = /(\d+)\.\s+(.*?)(?::|：)\s*([^\d\n]+)/g;
    
    let match;
    let hasMatches = false;
    
    // First try to extract commands with code blocks (preferred format)
    while ((match = stepRegex.exec(text)) !== null) {
      hasMatches = true;
      const stepNumber = parseInt(match[1]);
      const description = match[2].trim();
      const command = match[3].trim();
      
      if (description && command) {
        commandSteps.push({
          description,
          command
        });
      }
    }
    
    // If no code blocks found, try to extract commands without them
    if (!hasMatches) {
      const lines = text.split('\n');
      let currentStep: {description: string; command: string} | null = null;
      
      for (const line of lines) {
        // Check if this line starts a new step
        const stepMatch = line.match(/^(\d+)\.\s+(.*?)(?::|：)\s*(.*)/);
        
        if (stepMatch) {
          // If we have a previous step saved, add it to the results
          if (currentStep) {
            commandSteps.push(currentStep);
          }
          
          // Start a new step
          currentStep = {
            description: stepMatch[2].trim(),
            command: stepMatch[3].trim()
          };
        } else if (currentStep && line.trim() && !line.match(/^#|^Your converted file/)) {
          // If this is a continuation of the current step's command
          currentStep.command += '\n' + line.trim();
        }
      }
      
      // Add the last step if there is one
      if (currentStep) {
        commandSteps.push(currentStep);
      }
    }
    
    // If we found command steps, return them
    if (commandSteps.length > 0) {
      return commandSteps;
    }
    
    return undefined;
  }

  // Generate RAG-based file conversion commands
  const handleFileConversion = async (fileInfo: FileInfo, targetFormat: string) => {
    if (!apiKey) {
      setIsApiKeyDialogOpen(true)
      return
    }
    
    const fileName = fileInfo.name
    const fileExt = fileName.substring(fileName.lastIndexOf('.') + 1).toLowerCase()
    
    // Add user message
    setMessages(prev => [...prev, { 
      role: 'user', 
      content: targetFormat 
        ? `I'd like to convert ${fileName} to ${targetFormat} format`
        : `I'd like to convert this file: ${fileName}` 
    }])
    
    setIsLoading(true)
    
    try {
      // Call our API endpoint for RAG-based conversion commands
      const response = await fetch('/api/conversion-chat', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          message: targetFormat
            ? `Provide commands to convert this file: ${fileName} to ${targetFormat} format. I want to create a folder for it, move the file there, and convert it using Python.`
            : `Provide commands to convert this file: ${fileName}. I want to create a folder for it, move the file there, and convert it to another format using Python.`,
          apiKey,
          fileInfo: {
            name: fileInfo.name,
            type: fileInfo.type,
            size: fileInfo.size,
            targetFormat: targetFormat
          }
        }),
      })
      
      const data = await response.json()
      const responseText = data.response || '';
      
      // Parse commands from the response
      const commandSteps = parseCommands(responseText);
      
      // Add assistant's response with conversion commands
      setMessages(prev => [...prev, { 
        role: 'assistant', 
        content: responseText,
        steps: commandSteps
      }])
    } catch (error) {
      console.error('Error processing file conversion request:', error)
      setMessages(prev => [...prev, { 
        role: 'assistant', 
        content: 'Sorry, there was an error generating conversion commands. Please try again.' 
      }])
    } finally {
      setIsLoading(false)
      setDraggedFile(null)
    }
  }

  // Handle sending messages
  const handleSendMessage = async () => {
    if (!input.trim()) return
    if (!apiKey) {
      setIsApiKeyDialogOpen(true)
      return
    }

    const userMessage = input.trim()
    setInput('')
    
    // Add user message to chat
    setMessages(prev => [...prev, { role: 'user', content: userMessage }])
    
    // Set loading state
    setIsLoading(true)
    
    try {
      // Check if we're in a conversion context (units are selected and we're entering a value)
      const inConversionContext = selectedUnits.length === 2 && selectionStep === null;
      
      // Prepare the conversion context if applicable
      let conversionContext = null;
      if (inConversionContext) {
        const fromUnit = selectedUnits.find(u => u.role === 'from');
        const toUnit = selectedUnits.find(u => u.role === 'to');
        
        if (fromUnit && toUnit) {
          conversionContext = {
            from: fromUnit.name,
            to: toUnit.name,
            category: fromUnit.category
          };
        }
      }
      
      // Call our API endpoint for the RAG-based chat
      const response = await fetch('/api/conversion-chat', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          message: userMessage,
          apiKey,
          // Include conversion context if available
          conversionContext: inConversionContext ? conversionContext : undefined
        }),
      })
      
      const data = await response.json()
      
      // Add assistant's response to chat
      setMessages(prev => [...prev, { role: 'assistant', content: data.response }])
    } catch (error) {
      console.error('Error processing request:', error)
      setMessages(prev => [...prev, { 
        role: 'assistant', 
        content: 'Sorry, there was an error processing your request. Please try again.' 
      }])
    } finally {
      setIsLoading(false)
    }
  }

  // Helper function to handle unit selection from the list
  const handleUnitSelection = (category: string, unit: string) => {
    if (selectionStep === 'from') {
      // First selection - "from" unit
      setSelectedUnits([{ category, name: unit, role: 'from' }])
      setSelectionStep('to')
    } else if (selectionStep === 'to') {
      // Second selection - "to" unit
      const fromUnit = selectedUnits[0]
      
      // Only allow selecting a "to" unit from the same category
      if (category === fromUnit.category) {
        setSelectedUnits(prev => [...prev, { category, name: unit, role: 'to' }])
        
        // After both units are selected, ask for the value to convert
        const conversionQuery = `I want to convert from ${fromUnit.name} to ${unit}`
        setMessages(prev => [...prev, { role: 'user', content: conversionQuery }])
        setIsLoading(true)
        
        // Process the conversion request
        processConversionRequest(fromUnit.name, unit)
        
        // Reset selection state
        setSelectionStep(null)
      } else {
        // Show error if trying to convert between different categories
        setMessages(prev => [...prev, { 
          role: 'assistant', 
          content: `You can only convert between units in the same category. You selected ${fromUnit.name} (${fromUnit.category}) and ${unit} (${category}).`
        }])
        resetSelection()
      }
    }
  }

  // Process the conversion request after both units are selected
  const processConversionRequest = async (fromUnit: string, toUnit: string) => {
    try {
      // Send the conversion request to the API
      const response = await fetch('/api/conversion-chat', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          message: `I want to convert from ${fromUnit} to ${toUnit}`,
          apiKey,
        }),
      })
      
      const data = await response.json()
      
      // Add assistant's response asking for the value
      setMessages(prev => [...prev, { 
        role: 'assistant', 
        content: `I'll help you convert from ${fromUnit} to ${toUnit}. What value would you like to convert?` 
      }])
    } catch (error) {
      console.error('Error processing conversion request:', error)
      setMessages(prev => [...prev, { 
        role: 'assistant', 
        content: 'Sorry, there was an error setting up your conversion. Please try again.' 
      }])
    } finally {
      setIsLoading(false)
    }
  }

  // Reset the unit selection
  const resetSelection = () => {
    setSelectedUnits([])
    setSelectionStep('from')
  }

  // Get the badge text based on selection step
  const getSelectionStepText = () => {
    if (selectionStep === 'from') {
      return 'Select FROM unit'
    } else if (selectionStep === 'to') {
      return 'Select TO unit'
    } else {
      return 'Enter value to convert'
    }
  }

  // Helper function to handle unit conversion
  const handleUnitConversion = (category: string, unit: string) => {
    const message = `Convert to ${unit}`
    setInput(message)
  }

  return (
    <div className="grid grid-cols-1 md:grid-cols-4 gap-0 h-full w-full mx-0 max-w-none">
      {/* Conversion sidebar - hidden on mobile, shown on desktop */}
      <div className="hidden md:block md:col-span-1 h-full overflow-hidden border-r">
        <div className="flex flex-col h-full bg-card">
          <div className="p-4 bg-muted border-b h-14 flex items-center">
            <div className="flex items-center justify-between w-full">
              <h3 className="text-lg font-semibold">Available Conversions</h3>
              <div className="flex items-center gap-2">
                <Badge variant={selectionStep ? "outline" : "secondary"}>
                  {getSelectionStepText()}
                </Badge>
                <Button 
                  variant="ghost" 
                  size="icon" 
                  onClick={resetSelection}
                  disabled={!selectedUnits.length}
                  title="Reset selection"
                >
                  <RefreshCw className="h-4 w-4" />
                </Button>
              </div>
            </div>
          </div>
          <ScrollArea className="flex-1">
            <div className="p-4 space-y-6">
              {conversions.map((group, idx) => (
                <div key={idx} className="space-y-2">
                  <h4 className="text-sm font-medium text-primary">{group.category}</h4>
                  <div className="space-y-1 pl-2">
                    {group.items.map((item, itemIdx) => {
                      // Check if this unit is selected
                      const selectedUnit = selectedUnits.find(u => u.name === item);
                      const isSelected = !!selectedUnit;
                      const isDisabled = selectedUnits.length > 0 && selectedUnits[0].category !== group.category;
                      
                      return (
                        <button
                          key={itemIdx}
                          className={`text-xs hover:text-foreground transition-colors w-full text-left py-1 flex items-center justify-between ${
                            isSelected ? 'text-foreground font-medium' : 'text-muted-foreground'
                          } ${isDisabled ? 'opacity-50 cursor-not-allowed' : ''}`}
                          onClick={() => {
                            if (selectionStep && !isDisabled) {
                              handleUnitSelection(group.category, item);
                            }
                          }}
                          disabled={isDisabled}
                        >
                          <span className="truncate">{item}</span>
                          {isSelected && (
                            <Badge variant="secondary" className="ml-2">
                              {selectedUnit?.role}
                            </Badge>
                          )}
                        </button>
                      );
                    })}
                  </div>
                  {idx < conversions.length - 1 && (
                    <Separator className="my-2" />
                  )}
                </div>
              ))}
            </div>
          </ScrollArea>
        </div>
      </div>

      {/* Chat interface */}
      <div className="col-span-1 md:col-span-3 flex flex-col h-full overflow-hidden">
        <div className="flex items-center justify-between p-4 border-b h-14">
          <h2 className="text-2xl font-bold">Calculations Assistant</h2>
          <div className="flex items-center gap-2">
            {/* Mobile sidebar toggle */}
            <Button 
              variant="outline"
              size="icon"
              className="md:hidden"
              onClick={() => setShowSidebar(!showSidebar)}
            >
              <InfoIcon className="h-4 w-4" />
            </Button>
            
            <ApiKeyDialog
              apiKey={apiKey}
              onApiKeyChange={setApiKey}
              onSave={handleSaveApiKey}
              isOpen={isApiKeyDialogOpen}
              onOpenChange={setIsApiKeyDialogOpen}
            />
          </div>
        </div>
        
        {/* Mobile sidebar (shown when toggle is pressed) */}
        {showSidebar && (
          <Card className="mb-4 md:hidden overflow-hidden">
            <div className="p-3 bg-muted">
              <div className="flex items-center justify-between">
                  <Badge variant={selectionStep ? "outline" : "secondary"} className="text-[10px]">
                    {getSelectionStepText()}
                  </Badge>
                  <Button 
                    variant="ghost" 
                    size="icon" 
                    className="h-6 w-6"
                    onClick={resetSelection}
                    disabled={!selectedUnits.length}
                    title="Reset selection"
                  >
                    <RefreshCw className="h-3 w-3" />
                  </Button>
              </div>
            </div>
            <ScrollArea className="h-[300px]">
              <div className="p-3 space-y-4">
                {conversions.map((group, idx) => (
                  <div key={idx} className="space-y-1">
                    <h4 className="text-xs font-medium text-primary">{group.category}</h4>
                    <div className="grid grid-cols-2 gap-1 pl-2">
                      {group.items.map((item, itemIdx) => {
                        // Check if this unit is selected
                        const selectedUnit = selectedUnits.find(u => u.name === item);
                        const isSelected = !!selectedUnit;
                        const isDisabled = selectedUnits.length > 0 && selectedUnits[0].category !== group.category;
                        
                        return (
                          <button
                            key={itemIdx}
                            className={`text-[10px] hover:text-foreground transition-colors w-full text-left py-0.5 flex items-center justify-between ${
                              isSelected ? 'text-foreground font-medium' : 'text-muted-foreground'
                            } ${isDisabled ? 'opacity-50 cursor-not-allowed' : ''}`}
                            onClick={() => {
                              if (selectionStep && !isDisabled) {
                                handleUnitSelection(group.category, item);
                                setShowSidebar(false);
                              }
                            }}
                            disabled={isDisabled}
                          >
                            <span className="truncate">{item}</span>
                            {isSelected && (
                              <Badge variant="secondary" className="ml-1 text-[8px] px-1 py-0">
                                {selectedUnit?.role}
                              </Badge>
                            )}
                          </button>
                        );
                      })}
                    </div>
                    {idx < conversions.length - 1 && (
                      <Separator className="my-2" />
                    )}
                  </div>
                ))}
              </div>
            </ScrollArea>
          </Card>
        )}
        
        {/* Main chat area - takes up all available space except for input */}
        <ScrollArea 
          className={`flex-1 bg-background ${isDragging ? 'bg-muted/50' : ''}`}
          ref={chatAreaRef}
          onDragOver={handleDragOver}
          onDragLeave={handleDragLeave}
          onDrop={handleDrop}
        >
          {isDragging && (
            <div className="absolute inset-0 flex items-center justify-center bg-primary/10 z-10 pointer-events-none rounded-md border-2 border-dashed border-primary/50">
              <div className="text-center p-4 space-y-2">
                <FileUp className="h-12 w-12 mx-auto text-primary/70" />
                <p className="text-lg font-medium text-primary">Drop file here</p>
                <p className="text-sm text-muted-foreground">I&apos;ll provide conversion commands using RAG</p>
              </div>
            </div>
          )}
          <div className="p-4 space-y-4">
            {messages.map((message, index) => (
              <div
                key={index}
                className={`flex ${
                  message.role === 'assistant' ? 'justify-start' : 'justify-end'
                }`}
              >
                <div
                  className={`flex gap-3 ${
                    message.role === 'assistant'
                      ? 'bg-muted'
                      : 'bg-primary text-primary-foreground'
                  } rounded-lg ${message.steps ? 'px-4 py-3 flex-col w-full max-w-[85%]' : 'px-4 py-2 max-w-[80%]'}`}
                >
                  {message.role === 'assistant' && (
                    <Bot className="h-5 w-5 mt-1 shrink-0" />
                  )}
                  <div className={`space-y-3 ${message.steps ? 'w-full' : ''}`}>
                    <div className="whitespace-pre-wrap">{
                      message.steps 
                        ? message.content.split(/```[\w\s]*[\s\S]*?```/).join('').trim() 
                        : message.content
                    }</div>
                    
                    {message.steps && (
                      <ConversionSteps steps={message.steps} />
                    )}
                  </div>
                  {message.role === 'user' && (
                    <User className="h-5 w-5 mt-1 shrink-0" />
                  )}
                </div>
              </div>
            ))}
            <div ref={messagesEndRef} />
          </div>
        </ScrollArea>
        
        {/* File format selection dialog */}
        <Dialog open={showFormatDialog} onOpenChange={setShowFormatDialog}>
          <DialogContent className="sm:max-w-[425px]">
            <DialogHeader>
              <DialogTitle>Select Conversion Format</DialogTitle>
            </DialogHeader>
            
            {draggedFile && (
              <div className="py-4">
                <p className="text-sm mb-4">
                  What format would you like to convert <span className="font-medium">{draggedFile.name}</span> to?
                </p>
                
                <FormatSelector 
                  fileType={draggedFile.type || 'application/' + draggedFile.name.split('.').pop()} 
                  onFormatChange={setSelectedFormat}
                  selectedFormat={selectedFormat}
                />
              </div>
            )}
            
            <DialogFooter>
              <Button 
                variant="secondary" 
                onClick={() => {
                  setShowFormatDialog(false)
                  setDraggedFile(null)
                }}
              >
                Cancel
              </Button>
              <Button 
                onClick={() => {
                  setShowFormatDialog(false)
                  if (draggedFile) {
                    handleFileConversion(draggedFile, selectedFormat)
                  }
                }}
              >
                Generate Commands
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
        
        {/* File drop indicator */}
        <div className="px-3 py-1 border-t border-dashed border-muted-foreground/30 text-xs text-center text-muted-foreground">
          <p>Drop files here for conversion commands</p>
        </div>
        
        {/* Input area - fixed at bottom */}
        <div className="mt-0 p-3 border-t">
          <div className="flex gap-2">
            <Input
              placeholder={selectionStep === null && selectedUnits.length === 2
                ? "Enter the value to convert..."
                : "Ask about calculations or unit conversions..."}
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === 'Enter' && !e.shiftKey) {
                  e.preventDefault()
                  handleSendMessage()
                }
              }}
              disabled={isLoading}
              className="flex-1"
            />
            <Button 
              onClick={handleSendMessage} 
              disabled={isLoading || !input.trim()}
              size="icon"
            >
              <Send className="h-4 w-4" />
            </Button>
          </div>
          
          {!apiKey && (
            <div className="flex items-center gap-2 mt-2 text-sm text-amber-500">
              <AlertTriangle className="h-4 w-4" />
              <span>Please add your AI API key to use the chat.</span>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}