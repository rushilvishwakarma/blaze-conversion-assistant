export type Action = {
  file: any;
  file_name: string;
  file_size: number;
  from: string;
  to: String | null;
  file_type: string;
  is_converting?: boolean;
  is_converted?: boolean;
  is_error?: boolean;
  url?: any;
  output?: any;
  metadata?: Metadata; // Optional metadata property for audio files
};

type Metadata = {
  bitrate?: number; // e.g., 128 kbps
  sampleRate?: number; // e.g., 44100 Hz
  bitDepth?: number; // e.g., 16 Bits
};
