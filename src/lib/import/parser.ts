// Import Parser — Extract text from uploaded files (txt, md, docx)
// Handles format detection, text extraction, and basic structure detection.

import type { BookType } from '@/types/database'

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

export interface ParsedDocument {
  /** Raw full text extracted from the file */
  rawText: string
  /** Detected format of the source file */
  format: 'text' | 'markdown' | 'docx'
  /** Rough section breaks detected by simple heuristics (before Claude routing) */
  sections: DetectedSection[]
  /** Metadata extracted from the document */
  metadata: DocumentMetadata
}

export interface DetectedSection {
  /** Section title (from heading, chapter marker, or generated) */
  title: string
  /** Section content */
  content: string
  /** How this section was detected */
  source: 'heading' | 'chapter-marker' | 'separator' | 'single-block'
}

export interface DocumentMetadata {
  /** Approximate word count */
  wordCount: number
  /** Number of sections detected */
  sectionCount: number
  /** Original filename */
  filename: string
  /** File size in bytes */
  fileSizeBytes: number
}

// ---------------------------------------------------------------------------
// Format detection
// ---------------------------------------------------------------------------

function detectFormat(filename: string, contentType?: string): ParsedDocument['format'] {
  const ext = filename.split('.').pop()?.toLowerCase()
  if (ext === 'md' || ext === 'markdown') return 'markdown'
  if (ext === 'docx') return 'docx'
  if (contentType === 'application/vnd.openxmlformats-officedocument.wordprocessingml.document') return 'docx'
  return 'text'
}

// ---------------------------------------------------------------------------
// Text extraction
// ---------------------------------------------------------------------------

/**
 * Extract raw text from a .docx ArrayBuffer.
 *
 * docx files are ZIP archives containing XML. We use Node.js built-in
 * yauzl (via unzip) to read word/document.xml, then extract <w:t> text nodes.
 * Zero external dependencies.
 */
async function extractDocxText(buffer: ArrayBuffer): Promise<string> {
  const { unzipSync } = await import('zlib')

  // A .docx is a ZIP. We need to find and decompress word/document.xml.
  // ZIP format: scan for local file headers (0x04034b50) and find our target.
  const buf = Buffer.from(buffer)
  const xml = extractFileFromZip(buf, 'word/document.xml')

  if (!xml) {
    return '[Could not extract text from this .docx file — word/document.xml not found]'
  }

  // Extract text from <w:t> elements. Paragraphs are <w:p> elements.
  // Add newlines between paragraphs for structure preservation.
  const paragraphs: string[] = []
  const pParts = xml.split(/<w:p[\s>]/)

  for (const p of pParts) {
    const textParts = p.match(/<w:t[^>]*>([^<]*)<\/w:t>/g) ?? []
    const text = textParts
      .map((t) => t.replace(/<[^>]+>/g, ''))
      .join('')
    if (text.trim()) {
      paragraphs.push(text)
    }
  }

  return paragraphs.join('\n\n')
}

/**
 * Minimal ZIP file extractor — finds a named entry and returns its content.
 * Uses Node.js built-in zlib for decompression. No external deps.
 */
function extractFileFromZip(zipBuffer: Buffer, targetPath: string): string | null {
  const { inflateRawSync } = require('zlib') as typeof import('zlib')

  let offset = 0
  while (offset < zipBuffer.length - 4) {
    // Local file header signature: 0x04034b50
    const sig = zipBuffer.readUInt32LE(offset)
    if (sig !== 0x04034b50) break

    const compressionMethod = zipBuffer.readUInt16LE(offset + 8)
    const compressedSize = zipBuffer.readUInt32LE(offset + 18)
    const uncompressedSize = zipBuffer.readUInt32LE(offset + 22)
    const nameLength = zipBuffer.readUInt16LE(offset + 26)
    const extraLength = zipBuffer.readUInt16LE(offset + 28)
    const name = zipBuffer.subarray(offset + 30, offset + 30 + nameLength).toString('utf8')
    const dataStart = offset + 30 + nameLength + extraLength

    if (name === targetPath) {
      if (compressionMethod === 0) {
        // Stored (no compression)
        return zipBuffer.subarray(dataStart, dataStart + compressedSize).toString('utf8')
      } else if (compressionMethod === 8) {
        // Deflate
        const compressed = zipBuffer.subarray(dataStart, dataStart + compressedSize)
        const decompressed = inflateRawSync(compressed)
        return decompressed.toString('utf8')
      }
      return null
    }

    offset = dataStart + compressedSize
  }

  return null
}

/** Extract text from plain text or markdown (identity transform, but normalize line endings). */
function extractPlainText(raw: string): string {
  return raw.replace(/\r\n/g, '\n').replace(/\r/g, '\n')
}

// ---------------------------------------------------------------------------
// Section detection (heuristic, pre-Claude)
// ---------------------------------------------------------------------------

/** Split text into rough sections using headings, chapter markers, and separators. */
function detectSections(text: string, format: ParsedDocument['format']): DetectedSection[] {
  const lines = text.split('\n')
  const sections: DetectedSection[] = []
  let currentTitle = ''
  let currentContent: string[] = []
  let currentSource: DetectedSection['source'] = 'single-block'

  function flush() {
    const content = currentContent.join('\n').trim()
    if (content) {
      sections.push({
        title: currentTitle || `Section ${sections.length + 1}`,
        content,
        source: currentSource,
      })
    }
    currentContent = []
    currentTitle = ''
    currentSource = 'single-block'
  }

  for (const line of lines) {
    // Markdown headings: # Title, ## Title
    if (format === 'markdown' && /^#{1,3}\s+/.test(line)) {
      flush()
      currentTitle = line.replace(/^#{1,3}\s+/, '').trim()
      currentSource = 'heading'
      continue
    }

    // Chapter markers: "Chapter 1", "CHAPTER ONE", "Part I", etc.
    const chapterMatch = line.match(/^(chapter|part|section|prologue|epilogue|interlude|introduction|preface)\s*[\d\w.:—-]*/i)
    if (chapterMatch && line.trim().length < 80) {
      flush()
      currentTitle = line.trim()
      currentSource = 'chapter-marker'
      continue
    }

    // Separator lines: "---", "***", "===", or 3+ blank lines
    if (/^[\s]*[-*=]{3,}[\s]*$/.test(line)) {
      flush()
      currentSource = 'separator'
      continue
    }

    currentContent.push(line)
  }

  flush()

  // If no sections were detected, return the whole thing as one block
  if (sections.length === 0 && text.trim()) {
    return [{
      title: 'Imported Content',
      content: text.trim(),
      source: 'single-block',
    }]
  }

  return sections
}

// ---------------------------------------------------------------------------
// Public API
// ---------------------------------------------------------------------------

/**
 * Parse an uploaded file into a structured document.
 * Handles txt, md, and docx formats.
 */
export async function parseUpload(
  file: File | { name: string; type: string; arrayBuffer: () => Promise<ArrayBuffer> },
): Promise<ParsedDocument> {
  const format = detectFormat(file.name, file.type)
  const buffer = await file.arrayBuffer()

  let rawText: string
  if (format === 'docx') {
    rawText = await extractDocxText(buffer)
  } else {
    rawText = extractPlainText(new TextDecoder().decode(buffer))
  }

  const sections = detectSections(rawText, format)
  const wordCount = rawText.trim().split(/\s+/).filter(Boolean).length

  return {
    rawText,
    format,
    sections,
    metadata: {
      wordCount,
      sectionCount: sections.length,
      filename: file.name,
      fileSizeBytes: buffer.byteLength,
    },
  }
}

/**
 * Parse raw text content (for paste-in imports, no file upload).
 */
export function parseText(text: string, title = 'Pasted Content'): ParsedDocument {
  const rawText = extractPlainText(text)
  const sections = detectSections(rawText, 'text')
  const wordCount = rawText.trim().split(/\s+/).filter(Boolean).length

  return {
    rawText,
    format: 'text',
    sections,
    metadata: {
      wordCount,
      sectionCount: sections.length,
      filename: title,
      fileSizeBytes: new TextEncoder().encode(text).byteLength,
    },
  }
}
