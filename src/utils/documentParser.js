/**
 * Document Parser — extracts text from various file formats
 * Supports: PDF, TXT, MD, CSV, JSON, XML, LOG, DOCX
 */
import * as pdfjsLib from 'pdfjs-dist';

// Configure PDF.js worker
pdfjsLib.GlobalWorkerOptions.workerSrc = `https://cdnjs.cloudflare.com/ajax/libs/pdf.js/${pdfjsLib.version}/pdf.worker.min.mjs`;

const MAX_FILE_SIZE = 10 * 1024 * 1024; // 10MB
const MAX_TEXT_LENGTH = 100000; // 100K characters

const TEXT_EXTENSIONS = ['.txt', '.md', '.csv', '.json', '.xml', '.log', '.yaml', '.yml', '.ini', '.conf', '.cfg', '.env'];

/**
 * Parse a file and extract its text content
 * @param {File} file - The file to parse
 * @returns {Promise<{name: string, content: string, size: number, type: string, charCount: number}>}
 */
export async function parseDocument(file) {
    if (file.size > MAX_FILE_SIZE) {
        throw new Error(`File "${file.name}" exceeds 10MB limit (${(file.size / 1024 / 1024).toFixed(1)}MB)`);
    }

    const ext = getFileExtension(file.name);
    let content;

    if (ext === '.pdf') {
        content = await parsePDF(file);
    } else if (ext === '.docx') {
        content = await parseDOCX(file);
    } else if (TEXT_EXTENSIONS.includes(ext)) {
        content = await parseText(file);
    } else {
        // Try as plain text
        content = await parseText(file);
    }

    // Truncate if too long
    if (content.length > MAX_TEXT_LENGTH) {
        content = content.substring(0, MAX_TEXT_LENGTH) + '\n\n[... Document truncated at 100K characters ...]';
    }

    return {
        id: Date.now().toString() + Math.random().toString(36).substr(2, 5),
        name: file.name,
        content,
        size: file.size,
        type: ext.replace('.', '').toUpperCase(),
        charCount: content.length,
    };
}

/**
 * Parse a PDF file
 */
async function parsePDF(file) {
    const arrayBuffer = await file.arrayBuffer();
    const pdf = await pdfjsLib.getDocument({ data: arrayBuffer }).promise;
    const pages = [];

    for (let i = 1; i <= pdf.numPages; i++) {
        const page = await pdf.getPage(i);
        const textContent = await page.getTextContent();
        const pageText = textContent.items
            .map(item => item.str)
            .join(' ');
        if (pageText.trim()) {
            pages.push(`[Page ${i}]\n${pageText.trim()}`);
        }
    }

    return pages.join('\n\n');
}

/**
 * Parse a DOCX file using mammoth
 */
async function parseDOCX(file) {
    const mammoth = await import('mammoth');
    const arrayBuffer = await file.arrayBuffer();
    const result = await mammoth.extractRawText({ arrayBuffer });
    return result.value;
}

/**
 * Parse a plain text file
 */
async function parseText(file) {
    return await file.text();
}

/**
 * Get file extension (lowercase)
 */
function getFileExtension(filename) {
    const idx = filename.lastIndexOf('.');
    return idx >= 0 ? filename.substring(idx).toLowerCase() : '';
}

/**
 * Get supported file accept string
 */
export const SUPPORTED_EXTENSIONS = '.pdf,.txt,.md,.csv,.json,.xml,.log,.yaml,.yml,.docx,.ini,.conf';

/**
 * Format file size nicely
 */
export function formatFileSize(bytes) {
    if (bytes < 1024) return bytes + ' B';
    if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(1) + ' KB';
    return (bytes / (1024 * 1024)).toFixed(1) + ' MB';
}

/**
 * Build document context string for the AI prompt
 */
export function buildDocumentContext(documents) {
    if (!documents || documents.length === 0) return '';

    const docTexts = documents.map(doc =>
        `--- ${doc.name} ---\n${doc.content}`
    ).join('\n\n');

    return `[DOCUMENTS CONTEXT — Answer based on these uploaded documents when relevant]\n${docTexts}\n[END DOCUMENTS]\n\n`;
}
