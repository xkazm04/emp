import React from 'react';

export interface ParsedElement {
  type: 'text' | 'bold' | 'metric' | 'challenge' | 'strength' | 'priority' | 'employee-voice';
  content: string;
  className?: string;
}

export function parseHtmlToReact(htmlString: string): React.ReactNode {
  if (!htmlString) return null;

  // Handle h2 or h3 tags at the top level (executive summary titles and strategic implications)
  if (htmlString.includes('<h2>') || htmlString.includes('<h3>')) {
    return parseExecutiveSummaryWithHeaders(htmlString);
  }

  // Handle leader-summary divs first
  if (htmlString.includes("class='leader-summary'") || htmlString.includes('class="leader-summary"')) {
    return parseLeaderSummary(htmlString);
  }

  // Handle focus-area-item divs
  if (htmlString.includes("class='focus-area-item'") || htmlString.includes('class="focus-area-item"')) {
    return parseFocusAreaItems(htmlString);
  }

  // Split content into paragraphs
  const paragraphs = htmlString
    .split(/<div[^>]*class=['"]analysis-paragraph['"][^>]*>|<\/div>/)
    .filter(p => p.trim().length > 0);

  return (
    <div className="space-y-4">
      {paragraphs.map((paragraph, index) => (
        <div key={index} className="leading-relaxed">
          {parseInlineElements(paragraph)}
        </div>
      ))}
    </div>
  );
}

function parseExecutiveSummaryWithHeaders(htmlString: string): React.ReactNode {
  const elements: React.ReactNode[] = [];
  let elementKey = 0;

  // Split by h2, h3, and p tags while preserving them (using [\s\S] instead of 's' flag for compatibility)
  const parts = htmlString.split(/(<h2>[\s\S]*?<\/h2>|<h3>[\s\S]*?<\/h3>|<p>[\s\S]*?<\/p>)/).filter(part => part.trim());

  parts.forEach(part => {
    if (part.startsWith('<h2>')) {
      // Extract h2 content
      const h2Content = part.replace(/<\/?h2>/g, '');
      elements.push(
        <h2 key={elementKey++} className="text-3xl font-bold text-slate-900 mb-4">
          {parseInlineElements(h2Content)}
        </h2>
      );
    } else if (part.startsWith('<h3>')) {
      // Extract h3 content
      const h3Content = part.replace(/<\/?h3>/g, '');
      elements.push(
        <h3 key={elementKey++} className="text-xl font-bold text-slate-800 mb-3 mt-6">
          {parseInlineElements(h3Content)}
        </h3>
      );
    } else if (part.startsWith('<p>')) {
      // Extract p content
      const pContent = part.replace(/<\/?p>/g, '');
      elements.push(
        <div key={elementKey++} className="leading-relaxed mb-4 text-slate-700">
          {parseInlineElements(pContent)}
        </div>
      );
    } else if (part.trim()) {
      // Handle any loose text
      elements.push(
        <div key={elementKey++} className="leading-relaxed mb-3">
          {parseInlineElements(part)}
        </div>
      );
    }
  });

  return <div className="space-y-4">{elements}</div>;
}

function parseLeaderSummary(htmlString: string): React.ReactNode {
  // Extract content from leader-summary div
  const summaryMatch = htmlString.match(/<div class=['"]leader-summary['"]>([\s\S]*?)<\/div>/);
  if (!summaryMatch) return parseInlineElements(htmlString);

  const content = summaryMatch[1];
  const elements: React.ReactNode[] = [];
  let elementKey = 0;

  // Split by h3 and p tags
  const parts = content.split(/(<h3>[\s\S]*?<\/h3>|<p>[\s\S]*?<\/p>)/).filter(part => part.trim());

  parts.forEach(part => {
    if (part.startsWith('<h3>')) {
      // Extract h3 content
      const h3Content = part.replace(/<\/?h3>/g, '');
      elements.push(
        <h3 key={elementKey++} className="text-lg font-bold text-slate-900 mb-3">
          {parseInlineElements(h3Content)}
        </h3>
      );
    } else if (part.startsWith('<p>')) {
      // Extract p content
      const pContent = part.replace(/<\/?p>/g, '');
      elements.push(
        <div key={elementKey++} className="leading-relaxed mb-3">
          {parseInlineElements(pContent)}
        </div>
      );
    } else if (part.trim()) {
      // Handle loose text
      elements.push(
        <div key={elementKey++} className="leading-relaxed mb-3">
          {parseInlineElements(part)}
        </div>
      );
    }
  });

  return <div className="space-y-2">{elements}</div>;
}

function parseFocusAreaItems(htmlString: string): React.ReactNode {
  // Split by focus-area-item divs
  const items = htmlString.split(/<div class=['"]focus-area-item['"]>/).filter(item => item.trim());
  const elements: React.ReactNode[] = [];
  let elementKey = 0;

  items.forEach(item => {
    if (!item.trim()) return;
    
    // Remove closing div and parse content
    const content = item.replace(/<\/div>$/, '').trim();
    
    elements.push(
      <div key={elementKey++} className="bg-orange-50 border border-orange-200 rounded-lg mb-4">
        <div className="p-4">
          {parseHtmlContent(content)}
        </div>
      </div>
    );
  });

  return <div className="space-y-4">{elements}</div>;
}

function parseHtmlContent(htmlString: string): React.ReactNode {
  const elements: React.ReactNode[] = [];
  let elementKey = 0;

  // Split by various HTML tags
  const parts = htmlString.split(/(<h3>[\s\S]*?<\/h3>|<h4[^>]*>[\s\S]*?<\/h4>|<p[^>]*>[\s\S]*?<\/p>|<ul>[\s\S]*?<\/ul>)/).filter(part => part.trim());

  parts.forEach(part => {
    if (part.startsWith('<h3>')) {
      const h3Content = part.replace(/<\/?h3[^>]*>/g, '');
      elements.push(
        <h3 key={elementKey++} className="text-lg font-semibold text-slate-800 mb-3">
          {parseInlineElements(h3Content)}
        </h3>
      );
    } else if (part.startsWith('<h4')) {
      const h4Content = part.replace(/<\/?h4[^>]*>/g, '');
      elements.push(
        <h4 key={elementKey++} className="text-md font-semibold text-slate-800 mt-4 mb-2">
          {parseInlineElements(h4Content)}
        </h4>
      );
    } else if (part.startsWith('<p')) {
      const pContent = part.replace(/<\/?p[^>]*>/g, '');
      // Check if this is a focus-area-description
      const isFocusDescription = part.includes("class='focus-area-description'") || part.includes('class="focus-area-description"');
      const className = isFocusDescription 
        ? "text-sm text-slate-700 mb-3 leading-relaxed font-medium" 
        : "text-sm text-slate-600 mb-3 leading-relaxed";
      
      elements.push(
        <div key={elementKey++} className={className}>
          {parseInlineElements(pContent)}
        </div>
      );
    } else if (part.startsWith('<ul>')) {
      // Parse list items
      const listItems = part.match(/<li>([\s\S]*?)<\/li>/g);
      if (listItems) {
        elements.push(
          <ul key={elementKey++} className="list-disc list-inside space-y-1 text-sm text-slate-600 ml-4 mb-3">
            {listItems.map((item, idx) => (
              <li key={idx}>
                {parseInlineElements(item.replace(/<\/?li>/g, ''))}
              </li>
            ))}
          </ul>
        );
      }
    } else if (part.trim()) {
      // Handle loose text
      elements.push(
        <div key={elementKey++} className="text-sm text-slate-600 mb-2">
          {parseInlineElements(part)}
        </div>
      );
    }
  });

  return <>{elements}</>;
}

function parseInlineElements(text: string): React.ReactNode {
  const elements: React.ReactNode[] = [];
  let elementKey = 0;

  // Decode HTML entities helper function
  const decodeHtmlEntities = (str: string): string => {
    const entityMap: Record<string, string> = {
      '&darr;': '↓',
      '&uarr;': '↑',
      '&rarr;': '→',
      '&larr;': '←',
      '&nbsp;': ' ',
      '&amp;': '&',
      '&lt;': '<',
      '&gt;': '>',
      '&quot;': '"',
      '&#39;': "'",
      '&mdash;': '—',
      '&ndash;': '–',
    };
    
    let decoded = str;
    Object.keys(entityMap).forEach(entity => {
      decoded = decoded.replace(new RegExp(entity, 'g'), entityMap[entity]);
    });
    
    return decoded;
  };

  // Clean up malformed HTML - fix duplicate closing spans and values
  let cleanedText = text
    // Fix duplicate metric values like "55%55%)" -> "55%)"
    .replace(/(\d+(?:\.\d+)?%)\1\)/g, '$1)')
    // Fix duplicate closing spans
    .replace(/<\/span>\s*<\/span>/g, '</span>')
    // Fix challenge-indicator spans with nested metric-value spans
    .replace(/(<span class=['"]challenge-indicator['"][^>]*>[^<]*\([^<]*)<span class=['"]metric-value['"][^>]*>([^<]*)<\/span>([^<]*)<\/span>/g, '$1<span class="metric-value">$2</span>$3</span>')
    // CRITICAL FIX: Ensure spaces around **bold** markdown are preserved
    // Convert **text** to <strong>text</strong> while preserving spaces
    .replace(/\*\*([^*]+)\*\*/g, '<strong>$1</strong>')
    // SPACING FIXES:
    // Add space after closing parentheses if followed by capital letter or tag (e.g., "1)Empowering" -> "1) Empowering")
    .replace(/(\))([A-Z<])/g, '$1 $2')
    // Add space after punctuation (: , . ;) if followed by letter/tag with no space
    .replace(/([:\.,;!?])(<span[^>]*>|<strong>|<b>|[A-Z])/g, '$1 $2')
    // Add space before opening tags if preceded by letter/digit (not already a space)
    .replace(/([a-zA-Z0-9])(<span[^>]*>|<strong>|<b>)/g, '$1 $2')
    // Add space after closing tags if followed by letter/digit (not already a space)
    .replace(/(<\/span>|<\/strong>|<\/b>)([a-zA-Z0-9])/g, '$1 $2')
    // Add space between concatenated words - only at word boundaries
    // Match complete words followed by prepositions at the start of the next word
    // "employeeswith" -> "employees with", "clarityfrom" -> "clarity from"  
    // Use word boundary \b and specific endings to avoid matching inside words like "communication"
    .replace(/([a-z]{4,}s)(with|from)\b/gi, '$1 $2')  // "employees|strategies" + with/from
    .replace(/([a-z]{4,}y)(from|to)\b/gi, '$1 $2')    // "clarity|strategy" + from/to
    .replace(/([a-z]{4,}s)(to|for)\b/gi, '$1 $2')     // "programs|strategies|gaps" + to/for
    // Add space between consecutive capital words stuck together (e.g., "StabilizeRetention" -> "Stabilize Retention")
    // This handles cases where tags were removed but spacing wasn't added
    .replace(/([a-z])([A-Z])/g, '$1 $2')
    // Convert <br/> and <br> tags to line breaks
    .replace(/<br\s*\/?>/gi, '\n')
    // Normalize quotes
    .replace(/class=["']([^"']*?)["']/g, "class='$1'");
  
  // Decode HTML entities
  cleanedText = decodeHtmlEntities(cleanedText);

  // Regex patterns for different span types
  // Note: **text** markdown is now converted to <strong> earlier in processing
  const patterns = [
    { 
      regex: /<span class=['"]metric-value['"][^>]*>(.*?)<\/span>/g, 
      type: 'metric' as const,
      className: 'font-bold text-slate-900 bg-slate-100 px-2 py-0.5 rounded'
    },
    { 
      regex: /<span class=['"]employee-voice['"][^>]*>(.*?)<\/span>/g, 
      type: 'employee-voice' as const,
      className: 'font-medium text-blue-900 bg-blue-50 px-2 py-0.5 rounded'
    },
    { 
      regex: /<span class=['"]trend-negative['"][^>]*>(.*?)<\/span>/g, 
      type: 'challenge' as const,
      className: 'font-bold text-red-900 bg-red-50 px-2 py-0.5 rounded border border-red-200'
    },
    { 
      regex: /<span class=['"]trend-positive['"][^>]*>(.*?)<\/span>/g, 
      type: 'strength' as const,
      className: 'font-bold text-green-900 bg-green-50 px-2 py-0.5 rounded border border-green-200'
    },
    { 
      regex: /<span class=['"]trend-stable['"][^>]*>(.*?)<\/span>/g, 
      type: 'metric' as const,
      className: 'font-semibold text-slate-700 bg-slate-50 px-2 py-0.5 rounded border border-slate-200'
    },
    { 
      regex: /<span class=['"]challenge-indicator['"][^>]*>(.*?)<\/span>/g, 
      type: 'challenge' as const,
      className: 'font-semibold text-red-900 bg-red-50 px-2 py-0.5 rounded'
    },
    { 
      regex: /<span class=['"]strength-indicator['"][^>]*>(.*?)<\/span>/g, 
      type: 'strength' as const,
      className: 'font-semibold text-green-900 bg-green-50 px-2 py-0.5 rounded'
    },
    { 
      regex: /<span class=['"]priority-high['"][^>]*>(.*?)<\/span>/g, 
      type: 'priority' as const,
      className: 'font-bold text-orange-900 bg-orange-100 px-2 py-1 rounded uppercase text-xs tracking-wide'
    },
    { 
      regex: /<b>(.*?)<\/b>/g, 
      type: 'bold' as const,
      className: 'font-bold text-slate-900'
    },
    { 
      regex: /<strong>(.*?)<\/strong>/g, 
      type: 'bold' as const,
      className: 'font-bold text-slate-900'
    }
  ];

  // Find all matches and their positions
  const matches: Array<{
    start: number;
    end: number;
    content: string;
    className: string;
    fullMatch: string;
  }> = [];

  patterns.forEach(pattern => {
    let match;
    const regex = new RegExp(pattern.regex.source, pattern.regex.flags);
    
    while ((match = regex.exec(cleanedText)) !== null) {
      matches.push({
        start: match.index,
        end: match.index + match[0].length,
        content: match[1],
        className: pattern.className,
        fullMatch: match[0]
      });
    }
  });

  // Sort matches by position
  matches.sort((a, b) => a.start - b.start);

  // Process text with matches
  let lastEnd = 0;
  
  matches.forEach(match => {
    // Add text before the match
    if (match.start > lastEnd) {
      const beforeText = cleanedText.slice(lastEnd, match.start);
      // Only check if there's content (don't trim - we need to preserve spaces!)
      if (beforeText && beforeText.replace(/\s+/g, '')) {
        // Handle line breaks in text
        const parts = beforeText.split('\n');
        parts.forEach((part, idx) => {
          if (part || idx < parts.length - 1) { // Keep even empty parts if not the last
            elements.push(
              <span key={elementKey++} className="text-slate-700">
                {part}
              </span>
            );
          }
          if (idx < parts.length - 1) {
            elements.push(<br key={elementKey++} />);
          }
        });
      }
    }

    // Add the styled match - recursively parse content for nested spans
    const nestedContent = match.content.includes('<span') ? 
      parseInlineElements(match.content) : match.content;
    
    elements.push(
      <span key={elementKey++} className={match.className}>
        {nestedContent}
      </span>
    );

    lastEnd = match.end;
  });

  // Add remaining text
  if (lastEnd < cleanedText.length) {
    const remainingText = cleanedText.slice(lastEnd);
    // Only check if there's non-whitespace content (don't trim - preserve spaces!)
    if (remainingText && remainingText.replace(/\s+/g, '')) {
      // Handle line breaks in remaining text
      const parts = remainingText.split('\n');
      parts.forEach((part, idx) => {
        if (part || idx < parts.length - 1) { // Keep even empty parts if not the last
          elements.push(
            <span key={elementKey++} className="text-slate-700">
              {part}
            </span>
          );
        }
        if (idx < parts.length - 1) {
          elements.push(<br key={elementKey++} />);
        }
      });
    }
  }

  // If no matches found, return plain text
  if (elements.length === 0) {
    return <span className="text-slate-700">{cleanedText.replace(/<[^>]*>/g, ' ').replace(/\s+/g, ' ').trim()}</span>;
  }

  return <>{elements}</>;
}

export function parseFocusArea(htmlString: string): {
  title: string;
  priority: string;
  content: React.ReactNode;
} {
  // Handle focus-area-item format
  if (htmlString.includes("class='focus-area-item'") || htmlString.includes('class="focus-area-item"')) {
    const focusMatch = htmlString.match(/<div class=['"]focus-area-item['"]>([\s\S]*?)<\/div>/);
    if (focusMatch) {
      const content = focusMatch[1];
      
      // Extract title from h3
      const titleMatch = content.match(/<h3[^>]*>([\s\S]*?)<\/h3>/);
      let title = 'Focus Area';
      let priority = 'medium';
      
      if (titleMatch) {
        const h3Content = titleMatch[1];
        // Check for priority span
        const priorityMatch = h3Content.match(/<span class=['"]priority-([^'"]*)['"][^>]*>(.*?)<\/span>/);
        if (priorityMatch) {
          priority = priorityMatch[1];
          title = priorityMatch[2];
        } else {
          // Check for class on h3
          const classMatch = content.match(/<h3 class=['"]([^'"]*)['"]>/);
          if (classMatch && classMatch[1].includes('priority-')) {
            priority = classMatch[1].replace('priority-', '');
          }
          title = h3Content.replace(/<[^>]*>/g, '').trim();
        }
      }
      
      // Extract content after h3
      const contentAfterH3 = content.replace(/<h3[\s\S]*?<\/h3>/, '').trim();
      
      return {
        title,
        priority,
        content: <div className="space-y-2">{parseHtmlContent(contentAfterH3)}</div>
      };
    }
  }

  // Original format - Extract title and priority
  const titleMatch = htmlString.match(/<h3><span class=['"]priority-([^'"]*)['"][^>]*>(.*?)<\/span><\/h3>/);
  const title = titleMatch ? titleMatch[2] : 'Focus Area';
  const priority = titleMatch ? titleMatch[1] : 'medium';

  // Extract content after h3
  const contentAfterH3 = htmlString.replace(/<h3>.*?<\/h3>/, '').trim();
  
  // Parse paragraphs and lists
  const sections = contentAfterH3.split(/<p><strong>(.*?)<\/strong><\/p>/);
  const content: React.ReactNode[] = [];
  let sectionKey = 0;

  for (let i = 0; i < sections.length; i++) {
    const section = sections[i].trim();
    if (!section) continue;

    if (section.includes('<li>')) {
      // This is a list section
      const listItems = section.match(/<li>(.*?)<\/li>/g);
      if (listItems) {
        content.push(
          <ul key={sectionKey++} className="list-disc list-inside space-y-1 text-sm text-slate-600 ml-4">
            {listItems.map((item, idx) => (
              <li key={idx}>
                {parseInlineElements(item.replace(/<\/?li>/g, ''))}
              </li>
            ))}
          </ul>
        );
      }
    } else if (i > 0 && sections[i-1] && !sections[i-1].includes('<li>')) {
      // This is a section header
      content.push(
        <h4 key={sectionKey++} className="font-semibold text-slate-800 mt-4 mb-2">
          {section}
        </h4>
      );
    } else {
      // This is regular paragraph content
      const paragraphs = section.split(/<p>|<\/p>/).filter(p => p.trim());
      paragraphs.forEach(p => {
        if (p.trim()) {
          content.push(
            <p key={sectionKey++} className="text-sm text-slate-600 mb-2">
              {parseInlineElements(p)}
            </p>
          );
        }
      });
    }
  }

  return {
    title,
    priority,
    content: <div className="space-y-2">{content}</div>
  };
} 