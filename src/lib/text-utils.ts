// Strip markdown formatting characters from text
export function cleanMarkdown(text: string): string {
  if (!text) return '';
  return text
    .replace(/\*\*/g, '')
    .replace(/\*/g, '')
    .replace(/__/g, '')
    .replace(/(?<!\w)_(?!\w)/g, '')
    .trim();
}

// Remove emoji decorations from text
export function removeEmojiDecorations(text: string): string {
  if (!text) return text;
  // Remove leading emojis
  text = text.replace(/^[\U0001F000-\U0001F9FF\u2600-\u26FF\u2700-\u27BF\s]+/, '');
  // Remove trailing emojis
  text = text.replace(/[\U0001F000-\U0001F9FF\u2600-\u26FF\u2700-\u27BF\s]+$/, '');
  return text.trim();
}

// Clean a description by removing title duplication and arrow chains
export function cleanDescription(description: string, title: string): string {
  if (!description || !title) return description || '';
  
  let cleaned = description.trim();
  
  // Split into lines
  const lines = cleaned.split('\n').map(l => l.trim()).filter(l => l.length > 0);
  
  if (lines.length === 0) return '';
  
  // Clean the title for comparison
  const cleanedTitle = cleanMarkdown(removeEmojiDecorations(title)).toLowerCase();
  
  // Check if first line of description matches the title
  let startIdx = 0;
  const firstLine = lines[0];
  const cleanedFirstLine = cleanMarkdown(removeEmojiDecorations(firstLine)).toLowerCase();
  
  // If first line matches title, skip it
  if (cleanedFirstLine === cleanedTitle || cleanedTitle.includes(cleanedFirstLine) || cleanedFirstLine.includes(cleanedTitle)) {
    startIdx = 1;
  }
  
  // Also check if first line starts with the title (e.g., "🥩 Wisma Haidilao 🥩")
  if (startIdx === 0) {
    const strippedFirstLine = removeEmojiDecorations(cleanMarkdown(firstLine)).trim();
    const strippedTitle = removeEmojiDecorations(cleanMarkdown(title)).trim();
    if (strippedFirstLine === strippedTitle || 
        strippedFirstLine.startsWith(strippedTitle) || 
        strippedTitle.startsWith(strippedFirstLine)) {
      startIdx = 1;
    }
  }
  
  // Get remaining lines
  let remainingLines = lines.slice(startIdx);
  
  // Also check second line for duplication (some messages have the title repeated twice)
  if (remainingLines.length > 1) {
    const secondLine = cleanMarkdown(removeEmojiDecorations(remainingLines[1])).toLowerCase();
    if (secondLine === cleanedFirstLine || secondLine.includes(cleanedFirstLine)) {
      remainingLines = remainingLines.slice(1);
    }
  }
  
  if (remainingLines.length === 0) return '';
  
  // Join lines
  let result = remainingLines.join('\n');
  
  // Remove arrow chains (➡️, →, ->) and their content
  result = result.replace(/[➡→\-]+\s*[^\n]*/g, '');
  
  // Remove standalone arrows at end of lines
  result = result.replace(/\s*[➡→]\s*$/gm, '');
  
  // Clean markdown from result
  result = cleanMarkdown(result);
  
  // Clean up multiple blank lines
  result = result.replace(/\n\s*\n\s*/g, '\n');
  
  // Trim and return
  return result.trim();
}