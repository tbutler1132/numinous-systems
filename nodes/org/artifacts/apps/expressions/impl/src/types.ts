export interface Profile {
  register: 'direct' | 'poetic' | 'analytical' | 'conversational' | null
  sacred: 'theist' | 'secular' | 'materialist' | 'exploring' | null
  mode: 'logic' | 'stories' | 'abstractions' | 'practical' | null
  influences: 'ancient' | 'science' | 'art' | 'contemplative' | null
}

export interface Artifact {
  id: string
  title: string
  desc: string
  featured?: boolean
  defaultTab?: TabType
  category?: string
}

export interface Usage {
  input_tokens: number
  output_tokens: number
}

export interface GenerateResponse {
  expression: string
  about: string
  notes: string
  usage?: Usage
}

export type TabType = 'machinic' | 'organic'

export type ThemeType = 'machinic' | 'organic' | null
