// ============================================
// EMAIL PARSER
// Handles pasted email text and .eml files
// Extracts headers, body, handles MIME encoding
// ============================================

interface ParsedEmail {
  from: string | null;
  to: string | null;
  date: string | null;
  subject: string | null;
  body: string;
}

/**
 * Strip HTML tags and extract plain text
 */
function stripHtml(html: string): string {
  return html
    .replace(/<style[^>]*>[\s\S]*?<\/style>/gi, '')
    .replace(/<script[^>]*>[\s\S]*?<\/script>/gi, '')
    .replace(/<br\s*\/?>/gi, '\n')
    .replace(/<\/p>/gi, '\n\n')
    .replace(/<\/div>/gi, '\n')
    .replace(/<\/li>/gi, '\n')
    .replace(/<[^>]+>/g, '')
    .replace(/&nbsp;/g, ' ')
    .replace(/&amp;/g, '&')
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'")
    .replace(/\n{3,}/g, '\n\n')
    .trim();
}

/**
 * Decode MIME encoded words (=?UTF-8?B?...?= etc.)
 */
function decodeMimeWord(encoded: string): string {
  try {
    const match = encoded.match(/=\?([^?]+)\?([BQ])\?([^?]+)\?=/i);
    if (!match) return encoded;

    const encoding = match[2].toUpperCase();
    const data = match[3];

    if (encoding === 'B') {
      // Base64
      return Buffer.from(data, 'base64').toString('utf-8');
    } else if (encoding === 'Q') {
      // Quoted-Printable
      return data
        .replace(/_/g, ' ')
        .replace(/=([0-9A-Fa-f]{2})/g, (_, hex) =>
          String.fromCharCode(parseInt(hex, 16))
        );
    }
    return encoded;
  } catch {
    return encoded;
  }
}

/**
 * Decode quoted-printable body content
 */
function decodeQuotedPrintable(text: string): string {
  return text
    .replace(/=\r?\n/g, '') // Soft line breaks
    .replace(/=([0-9A-Fa-f]{2})/g, (_, hex) =>
      String.fromCharCode(parseInt(hex, 16))
    );
}

/**
 * Extract header value from raw header lines
 */
function extractHeader(headers: string, name: string): string | null {
  const pattern = new RegExp(`^${name}:\\s*(.+?)(?=\\n[^\\s]|$)`, 'ims');
  const match = headers.match(pattern);
  if (!match) return null;

  let value = match[1].trim().replace(/\r?\n\s+/g, ' '); // Unfold
  // Decode MIME words
  value = value.replace(/=\?[^?]+\?[BQ]\?[^?]+\?=/gi, decodeMimeWord);
  return value;
}

/**
 * Parse pasted email text — tries to detect headers
 */
export function parseEmailText(text: string): ParsedEmail {
  if (!text || text.trim().length === 0) {
    return { from: null, to: null, date: null, subject: null, body: '' };
  }

  // Try to detect common header patterns
  const headerPatterns = {
    from: /^(?:From|De|Von):\s*(.+)$/im,
    to: /^(?:To|À|An):\s*(.+)$/im,
    date: /^(?:Date|Sent|Dated?):\s*(.+)$/im,
    subject: /^(?:Subject|Objet|Betreff|Re|Fwd):\s*(.+)$/im,
  };

  let from: string | null = null;
  let to: string | null = null;
  let date: string | null = null;
  let subject: string | null = null;
  let body = text;

  const fromMatch = text.match(headerPatterns.from);
  if (fromMatch) from = fromMatch[1].trim();

  const toMatch = text.match(headerPatterns.to);
  if (toMatch) to = toMatch[1].trim();

  const dateMatch = text.match(headerPatterns.date);
  if (dateMatch) date = dateMatch[1].trim();

  const subjectMatch = text.match(headerPatterns.subject);
  if (subjectMatch) subject = subjectMatch[1].trim();

  // If headers detected, extract body as everything after the last header
  if (from || to || date || subject) {
    // Find the blank line separating headers from body
    const blankLineIndex = text.search(/\n\s*\n/);
    if (blankLineIndex !== -1) {
      body = text.substring(blankLineIndex).trim();
    } else {
      // No clear separator — remove detected header lines
      const lines = text.split('\n');
      const bodyLines: string[] = [];
      let pastHeaders = false;

      for (const line of lines) {
        if (!pastHeaders) {
          const isHeader = /^(?:From|To|Date|Subject|Sent|Cc|Bcc|Reply-To|De|À|Von|An|Objet|Betreff):\s/i.test(line);
          if (!isHeader && line.trim().length > 0) {
            pastHeaders = true;
            bodyLines.push(line);
          }
        } else {
          bodyLines.push(line);
        }
      }
      body = bodyLines.join('\n').trim();
    }
  }

  // Clean up quoted replies (lines starting with >)
  body = body
    .split('\n')
    .filter(line => !line.startsWith('>'))
    .join('\n')
    .trim();

  return { from, to, date, subject, body };
}

/**
 * Parse .eml file content
 */
export function parseEmlFile(content: string): ParsedEmail {
  if (!content || content.trim().length === 0) {
    return { from: null, to: null, date: null, subject: null, body: '' };
  }

  try {
    // Split headers from body (blank line separator)
    const headerBodySplit = content.indexOf('\r\n\r\n');
    const headersSplit = headerBodySplit !== -1
      ? headerBodySplit
      : content.indexOf('\n\n');

    if (headersSplit === -1) {
      // No clear headers — treat as plain text
      return parseEmailText(content);
    }

    const headersRaw = content.substring(0, headersSplit);
    let bodyRaw = content.substring(headersSplit).trim();

    // Extract headers
    const from = extractHeader(headersRaw, 'From');
    const to = extractHeader(headersRaw, 'To');
    const date = extractHeader(headersRaw, 'Date');
    const subject = extractHeader(headersRaw, 'Subject');
    const contentType = extractHeader(headersRaw, 'Content-Type') || '';
    const transferEncoding = extractHeader(headersRaw, 'Content-Transfer-Encoding') || '';

    // Handle MIME multipart
    const boundaryMatch = contentType.match(/boundary="?([^";\s]+)"?/i);

    if (boundaryMatch) {
      const boundary = boundaryMatch[1];
      const parts = bodyRaw.split(`--${boundary}`);

      // Find plain text part first, then HTML part
      let plainText = '';
      let htmlText = '';

      for (const part of parts) {
        if (part.trim() === '--' || part.trim() === '') continue;

        const partHeaderEnd = part.indexOf('\r\n\r\n') !== -1
          ? part.indexOf('\r\n\r\n')
          : part.indexOf('\n\n');

        if (partHeaderEnd === -1) continue;

        const partHeaders = part.substring(0, partHeaderEnd).toLowerCase();
        const partBody = part.substring(partHeaderEnd).trim();

        if (partHeaders.includes('text/plain')) {
          plainText = partBody;
        } else if (partHeaders.includes('text/html')) {
          htmlText = partBody;
        }
      }

      bodyRaw = plainText || (htmlText ? stripHtml(htmlText) : bodyRaw);
    }

    // Handle Content-Transfer-Encoding
    if (transferEncoding.toLowerCase().includes('quoted-printable')) {
      bodyRaw = decodeQuotedPrintable(bodyRaw);
    } else if (transferEncoding.toLowerCase().includes('base64')) {
      try {
        bodyRaw = Buffer.from(bodyRaw.replace(/\s/g, ''), 'base64').toString('utf-8');
      } catch {
        // Keep as-is if base64 decode fails
      }
    }

    // Strip HTML if still present
    if (bodyRaw.includes('<html') || bodyRaw.includes('<div') || bodyRaw.includes('<p>')) {
      bodyRaw = stripHtml(bodyRaw);
    }

    // Clean up quoted replies
    bodyRaw = bodyRaw
      .split('\n')
      .filter(line => !line.startsWith('>'))
      .join('\n')
      .replace(/\n{3,}/g, '\n\n')
      .trim();

    return { from, to, date, subject, body: bodyRaw };
  } catch (error) {
    console.error('[ClauseWall] EML parsing failed, falling back to text parser:', error);
    return parseEmailText(content);
  }
}
