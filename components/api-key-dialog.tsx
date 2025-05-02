'use client'

import { Button } from "@/components/ui/button"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import Image from 'next/image'
import { Settings, AlertTriangle } from 'lucide-react'

interface ApiKeyDialogProps {
  apiKey: string
  onApiKeyChange: (key: string) => void
  onSave: () => void
  isOpen: boolean
  onOpenChange: (open: boolean) => void
}

export function ApiKeyDialog({
  apiKey,
  onApiKeyChange,
  onSave,
  isOpen,
  onOpenChange,
}: ApiKeyDialogProps) {
  return (
    <Dialog open={isOpen} onOpenChange={onOpenChange}>
      <DialogTrigger asChild>
        <Button variant="outline" size="sm" className="h-9 w-9 sm:w-auto sm:px-3 flex items-center justify-center gap-2">
          {apiKey ? (
            <Settings className="size-4 sm:size-4" />
          ) : (
            <AlertTriangle className="size-4 sm:size-4" />
          )}
          <span className="hidden sm:inline">{apiKey ? 'Update API Key' : 'Add API Key'}</span>
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-[600px]">
        <DialogHeader>
          <DialogTitle>API Key Setup</DialogTitle>
          <DialogDescription>
            Configure your API key to enable advanced features. Your key will be securely stored locally in your browser.
          </DialogDescription>
        </DialogHeader>
        <div className="grid gap-6 py-4">
          <div className="space-y-4">
            <h3 className="text-sm font-medium">Select Your AI Provider</h3>
            <div className="grid grid-cols-2 gap-4">
              <Button variant="outline" className="flex items-center gap-2" onClick={() => window.open('https://makersuite.google.com/app/apikey', '_blank')}>
                <Image src="/ai-provider/gemini-logo.svg" alt="Gemini" width={20} height={20} />
                Gemini
              </Button>
              <Button variant="outline" className="flex items-center gap-2" onClick={() => window.open('https://platform.openai.com/api-keys', '_blank')}>
                <Image 
                  src="/ai-provider/openai-light-logo.svg" 
                  alt="OpenAI" 
                  width={20} 
                  height={20} 
                  className="dark:hidden" // Hide in dark mode
                />
                <Image 
                  src="/ai-provider/openai-dark-logo.svg" 
                  alt="OpenAI" 
                  width={19} 
                  height={19} 
                  className="hidden dark:block" // Show in dark mode
                />
                OpenAI
              </Button>
            </div>
          </div>
          <div className="space-y-4">
            <h3 className="text-sm font-medium">How to Get Your API Key</h3>
            <div className="space-y-2 text-sm text-muted-foreground">
              <p>1. Click on your preferred AI provider above</p>
              <p>2. Sign in or create an account if needed</p>
              <p>3. Navigate to the API keys section</p>
              <p>4. Create a new API key</p>
              <p>5. Copy the key and paste it below</p>
            </div>
          </div>
          <div className="space-y-2">
            <label htmlFor="apiKey" className="text-sm font-medium">Your API Key</label>
            <Input
              id="apiKey"
              type="password"
              placeholder="Enter your API key"
              value={apiKey}
              onChange={(e) => onApiKeyChange(e.target.value)}
            />
          </div>
        </div>
        <DialogFooter>
          <Button type="submit" onClick={onSave}>
            Save API Key
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}