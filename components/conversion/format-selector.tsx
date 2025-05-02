import React, { useState } from 'react';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

// This component enables format selection for file conversions
interface FormatSelectorProps {
  fileType: string;
  onFormatChange: (format: string) => void;
  selectedFormat: string;
}

export const getCommonFormats = (fileType: string): { value: string; label: string }[] => {
  // Extract both the MIME subtype and filename extension (if present)
  const mimeSubtype = fileType.split('/').pop()?.toLowerCase() || '';
  const fileExtMatch = mimeSubtype.match(/\.([a-z0-9]+)$/i);
  const fileExtension = fileExtMatch ? fileExtMatch[1].toLowerCase() : mimeSubtype;
  
  // Check for archive files - no conversion options, just return empty array
  if (['zip', 'rar', '7z', 'tar', 'gz', 'bz2'].some(ext => fileExtension.includes(ext))) {
    return [];
  }
  
  // Check for 3D files - no conversion options, just return empty array
  if (['blend', 'obj', 'fbx', 'stl', '3ds', 'dae', 'glb', 'gltf'].some(ext => fileExtension.includes(ext))) {
    return [];
  }
  
  // Image formats
  if (fileType.startsWith('image/')) {
    return [
      { value: 'jpg', label: 'JPEG (.jpg)' },
      { value: 'png', label: 'PNG (.png)' },
      { value: 'webp', label: 'WebP (.webp)' },
      { value: 'gif', label: 'GIF (.gif)' },
      { value: 'bmp', label: 'BMP (.bmp)' },
      { value: 'tiff', label: 'TIFF (.tiff)' },
    ].filter(format => format.value !== fileExtension);
  }
  
  // Video formats
  else if (fileType.startsWith('video/')) {
    return [
      { value: 'mp4', label: 'MP4 (.mp4)' },
      { value: 'webm', label: 'WebM (.webm)' },
      { value: 'avi', label: 'AVI (.avi)' },
      { value: 'mov', label: 'QuickTime (.mov)' },
      { value: 'mkv', label: 'Matroska (.mkv)' },
      { value: 'gif', label: 'Animated GIF (.gif)' },
    ].filter(format => format.value !== fileExtension);
  }
  
  // Audio formats
  else if (fileType.startsWith('audio/')) {
    return [
      { value: 'mp3', label: 'MP3 (.mp3)' },
      { value: 'wav', label: 'WAV (.wav)' },
      { value: 'ogg', label: 'OGG (.ogg)' },
      { value: 'flac', label: 'FLAC (.flac)' },
      { value: 'm4a', label: 'M4A (.m4a)' },
      { value: 'aac', label: 'AAC (.aac)' },
    ].filter(format => format.value !== fileExtension);
  }
  
  // Document formats
  else if (fileType.includes('document') || 
          fileType.includes('pdf') || 
          fileType.includes('text/') || 
          /\.(doc|docx|pdf|txt|rtf)$/.test(fileExtension)) {
    return [
      { value: 'pdf', label: 'PDF (.pdf)' },
      { value: 'docx', label: 'Word (.docx)' },
      { value: 'txt', label: 'Text (.txt)' },
      { value: 'html', label: 'HTML (.html)' },
      { value: 'md', label: 'Markdown (.md)' },
    ].filter(format => format.value !== fileExtension);
  }
  
  // Spreadsheet formats
  else if (fileType.includes('spreadsheet') || 
          /\.(xls|xlsx|csv|tsv)$/.test(fileExtension)) {
    return [
      { value: 'xlsx', label: 'Excel (.xlsx)' },
      { value: 'csv', label: 'CSV (.csv)' },
      { value: 'json', label: 'JSON (.json)' },
      { value: 'xml', label: 'XML (.xml)' },
    ].filter(format => format.value !== fileExtension);
  }
  
  // Presentation formats
  else if (fileType.includes('presentation') || 
          /\.(ppt|pptx)$/.test(fileExtension)) {
    return [
      { value: 'pptx', label: 'PowerPoint (.pptx)' },
      { value: 'pdf', label: 'PDF (.pdf)' },
      { value: 'html', label: 'HTML (.html)' },
    ].filter(format => format.value !== fileExtension);
  }
  
  // Office document formats (common handling)
  else if (/\.(doc|docx|xls|xlsx|ppt|pptx)$/.test(fileExtension)) {
    return [
      { value: 'pdf', label: 'PDF (.pdf)' },
    ].filter(format => format.value !== fileExtension);
  }
  
  // Default/unknown formats - return empty array to indicate not convertible
  return [];
};

const FormatSelector: React.FC<FormatSelectorProps> = ({ fileType, onFormatChange, selectedFormat }) => {
  const formatOptions = getCommonFormats(fileType);
  
  return (
    <div className="space-y-2">
      <label className="text-sm font-medium">Convert to:</label>
      <Select value={selectedFormat} onValueChange={onFormatChange}>
        <SelectTrigger className="w-full">
          <SelectValue placeholder="Select target format" />
        </SelectTrigger>
        <SelectContent>
          {formatOptions.map((format) => (
            <SelectItem key={format.value} value={format.value}>
              {format.label}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
    </div>
  );
};

export { FormatSelector };