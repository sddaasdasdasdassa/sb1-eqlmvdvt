
'use client'

import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { useState } from "react"
import { Button } from "@/components/ui/button"

export function ApiKeyModal({ show, onClose }: { show: boolean, onClose: () => void }) {
  const [apiKey, setApiKey] = useState('')

  const handleSaveKey = () => {
    localStorage.setItem('geminiApiKey', apiKey)
    onClose()
  }

  return (
    <Dialog open={show} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle className="text-center">Gemini API Key Required</DialogTitle>
        </DialogHeader>
        
        <div className="space-y-4">
          <p className="text-sm text-muted-foreground">
            Get your API key from{' '}
            <a 
              href="https://aistudio.google.com/app/apikey" 
              target="_blank"
              className="text-primary underline"
            >
              Google AI Studio
            </a>
          </p>
          
          <Input
            value={apiKey}
            onChange={(e) => setApiKey(e.target.value)}
            placeholder="Enter your API key"
          />
          
          <Button 
            className="w-full"
            onClick={handleSaveKey}
          >
            Save API Key
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  )
} 
