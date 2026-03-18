// Import Parser — Extract text from uploaded files (txt, md, docx)
// Handles format detection, text extraction, and basic structure detection.

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
 * docx files are ZIP archives containing XML. We read word/document.xml
 * via a minimal central-directory-based ZIP extractor, then extract <w:t>
 * text nodes. Zero external dependencies — uses Node.js built-in zlib.
 */
async function extractDocxText(buffer: ArrayBuffer): Promise<string> {
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
 * Uses the central directory (not local headers) for reliable compressed sizes.
 * This handles docx files produced with data descriptors (GP-bit 3 set), where
 * the local file header stores compressedSize = 0. Central directory entries
 * always contain the correct sizes. No external deps — uses Node.js built-in zlib.
 */
function extractFileFromZip(zipBuffer: Buffer, targetPath: string): string | null {
  const { inflateRawSync } = require('zlib') as typeof import('zlib')
  const len = zipBuffer.length

  // Step 1: Locate End of Central Directory (EOCD) by scanning backwards.
  // EOCD signature: 0x06054b50. Fixed part is 22 bytes; may have a trailing
  // comment up to 65535 bytes long.
  const EOCD_SIG = 0x06054b50
  const EOCD_FIXED = 22
  let eocdOffset = -1
  const scanStart = len - EOCD_FIXED
  const scanEnd = Math.max(0, len - EOCD_FIXED - 65535)
  for (let i = scanStart; i >= scanEnd; i--) {
    if (zipBuffer.readUInt32LE(i) === EOCD_SIG) {
      eocdOffset = i
      break
    }
  }
  if (eocdOffset === -1) return null

  const cdCount = zipBuffer.readUInt16LE(eocdOffset + 10)
  const cdOffset = zipBuffer.readUInt32LE(eocdOffset + 16)

  // Step 2: Walk central directory entries.
  // Central directory file header signature: 0x02014b50
  const CD_SIG = 0x02014b50
  let cdPos = cdOffset
  for (let i = 0; i < cdCount; i++) {
    if (cdPos + 46 > len) break
    if (zipBuffer.readUInt32LE(cdPos) !== CD_SIG) break

    const compressionMethod = zipBuffer.readUInt16LE(cdPos + 10)
    const compressedSize = zipBuffer.readUInt32LE(cdPos + 20)
    const cdNameLength = zipBuffer.readUInt16LE(cdPos + 28)
    const cdExtraLength = zipBuffer.readUInt16LE(cdPos + 30)
    const cdCommentLength = zipBuffer.readUInt16LE(cdPos + 32)
    const localHeaderOffset = zipBuffer.readUInt32LE(cdPos + 42)
    const name = zipBuffer.subarray(cdPos + 46, cdPos + 46 + cdNameLength).toString('utf8')

    if (name === targetPath) {
      // Step 3: Jump to local file header for the true data offset.
      // The local extra field length can differ from the CD extra field length —
      // always re-read it from the local header.
      const localNameLen = zipBuffer.readUInt16LE(localHeaderOffset + 26)
      const localExtraLen = zipBuffer.readUInt16LE(localHeaderOffset + 28)
      const dataStart = localHeaderOffset + 30 + localNameLen + localExtraLen

      if (compressionMethod === 0) {
        return zipBuffer.subarray(dataStart, dataStart + compressedSize).toString('utf8')
      } else if (compressionMethod === 8) {
        const compressed = zipBuffer.subarray(dataStart, dataStart + compressedSize)
        return inflateRawSync(compressed).toString('utf8')
      }
      return null
    }

    cdPos += 46 + cdNameLength + cdExtraLength + cdCommentLength
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
