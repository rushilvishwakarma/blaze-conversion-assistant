'use client';

import React from 'react';
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { Check, Copy } from "lucide-react";
import { useState } from "react";

interface CommandButtonProps {
  command: string;
}

function CommandCopyButton({ command }: CommandButtonProps) {
  const [copied, setCopied] = useState<boolean>(false);

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(command);
      setCopied(true);
      setTimeout(() => setCopied(false), 1500);
    } catch (err) {
      console.error("Failed to copy text: ", err);
    }
  };

  return (
    <TooltipProvider delayDuration={0}>
      <Tooltip>
        <TooltipTrigger asChild>
          <Button
            variant="outline"
            size="icon"
            className="disabled:opacity-100 h-7 w-7 ml-2 shrink-0"
            onClick={handleCopy}
            aria-label={copied ? "Copied" : "Copy to clipboard"}
            disabled={copied}
          >
            <div className="relative h-4 w-4 flex items-center justify-center">
              <div
                className={cn(
                  "absolute transition-all",
                  copied ? "scale-100 opacity-100" : "scale-0 opacity-0",
                )}
              >
                <Check className="stroke-emerald-500" size={14} strokeWidth={2} aria-hidden="true" />
              </div>
              <div
                className={cn(
                  "absolute transition-all",
                  copied ? "scale-0 opacity-0" : "scale-100 opacity-100",
                )}
              >
                <Copy size={14} strokeWidth={2} aria-hidden="true" />
              </div>
            </div>
          </Button>
        </TooltipTrigger>
        <TooltipContent className="px-2 py-1 text-xs">Copy command</TooltipContent>
      </Tooltip>
    </TooltipProvider>
  );
}

interface CommandStepProps {
  stepNumber: number;
  description: string;
  command: string;
}

function CommandStep({ stepNumber, description, command }: CommandStepProps) {
  return (
    <div className="flex flex-col gap-2 mb-3">
      <div className="flex items-center">
        <div className="font-medium text-sm truncate flex-1">{stepNumber}. {description}</div>
        <CommandCopyButton command={command} />
      </div>
      <div className="bg-muted p-2 rounded-md text-xs font-mono overflow-x-auto whitespace-pre-wrap break-all">
        {command}
      </div>
    </div>
  );
}

interface ConversionStepsProps {
  steps: {
    description: string;
    command: string;
  }[];
}

function ConversionSteps({ steps }: ConversionStepsProps) {
  return (
    <div className="border rounded-md p-3 bg-card w-full">
      <h3 className="text-sm font-semibold mb-3">Conversion Steps</h3>
      <div className="space-y-3">
        {steps.map((step, index) => (
          <CommandStep 
            key={index} 
            stepNumber={index + 1} 
            description={step.description} 
            command={step.command} 
          />
        ))}
      </div>
    </div>
  );
}

export { CommandCopyButton, CommandStep, ConversionSteps };