// Simple markdown renderer — no external deps
// Supports: **bold**, *italic*, `code`, links, lists, tables

function escape(s) {
  return s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
}

function parseLine(line) {
  return line
    .replace(/\*\*(.+?)\*\*/g, '<strong>$1</strong>')
    .replace(/\*(.+?)\*/g, '<em>$1</em>')
    .replace(/`(.+?)`/g, '<code>$1</code>')
    .replace(/\[([^\]]+)\]\(([^)]+)\)/g, '<a href="$2" target="_blank" rel="noopener">$1</a>');
}

export default function MarkdownText({ text }) {
  if (!text) return null;
  // Remove full or partially streamed HTML comments
  const cleanText = text.replace(/<!--[\s\S]*?(-->|$)/g, '');
  const lines = cleanText.split('\n');
  let html = '';
  let inList = false;
  let listType = 'ul';

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];
    const trimmed = line.trim();

    // Bullet list
    if (/^[-*]\s/.test(trimmed)) {
      if (!inList || listType !== 'ul') {
        if (inList) html += listType === 'ol' ? '</ol>' : '</ul>';
        html += '<ul>';
        inList = true;
        listType = 'ul';
      }
      html += `<li>${parseLine(escape(trimmed.replace(/^[-*]\s/, '')))}</li>`;
      continue;
    }
    // Numbered list
    if (/^\d+\.\s/.test(trimmed)) {
      if (!inList || listType !== 'ol') {
        if (inList) html += listType === 'ol' ? '</ol>' : '</ul>';
        html += '<ol>';
        inList = true;
        listType = 'ol';
      }
      html += `<li>${parseLine(escape(trimmed.replace(/^\d+\.\s/, '')))}</li>`;
      continue;
    }

    if (inList) {
      html += listType === 'ol' ? '</ol>' : '</ul>';
      inList = false;
    }

    if (!trimmed) { html += '<br/>'; continue; }
    html += `<p>${parseLine(escape(trimmed))}</p>`;
  }
  if (inList) html += listType === 'ol' ? '</ol>' : '</ul>';

  return <div className="chat-md" dangerouslySetInnerHTML={{ __html: html }} />;
}
