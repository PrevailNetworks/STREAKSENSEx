import React from 'react';

interface MarkdownRendererProps {
  content: string;
}

const MarkdownRenderer: React.FC<MarkdownRendererProps> = ({ content }) => {
  if (!content) {
    return <p className="font-['Open_Sans'] text-xs font-normal text-[var(--text-secondary)]">No detailed analysis available.</p>;
  }

  // Split content into major sections (separated by one or more empty lines)
  const sections = content.split(/\n\s*\n/).map(section => section.trim()).filter(Boolean);

  const parseInlineMarkdown = (text: string): React.ReactNode[] => {
    const elements: React.ReactNode[] = [];
    let lastIndex = 0;

    // Regex to find **bold** or *italic*
    const regex = /(\*\*(.*?)\*\*)|(\*(.*?)\*)/g;
    let match;

    while ((match = regex.exec(text)) !== null) {
        // Text before the match
        if (match.index > lastIndex) {
            elements.push(text.substring(lastIndex, match.index));
        }
        // Matched bold or italic
        if (match[2] !== undefined) { // Bold
            elements.push(<strong className="font-semibold text-[var(--text-primary)]" key={`${lastIndex}-strong-${match[2]}`}>{match[2]}</strong>);
        } else if (match[4] !== undefined) { // Italic
            elements.push(<em className="italic text-[var(--text-primary)]" key={`${lastIndex}-em-${match[4]}`}>{match[4]}</em>);
        }
        lastIndex = regex.lastIndex;
    }

    // Text after the last match
    if (lastIndex < text.length) {
        elements.push(text.substring(lastIndex));
    }
    
    // Convert newlines within a single parsed block (that's not a list item) to <br />
    const finalElementsWithBreaks: React.ReactNode[] = [];
    elements.forEach((el, elIdx) => {
        if (typeof el === 'string') {
            el.split(/(\n)/g).forEach((part, partIdx) => { // Use regex to capture \n
                if (part === '\n') {
                    finalElementsWithBreaks.push(<br key={`br-${elIdx}-${partIdx}`} />);
                } else if (part) {
                    finalElementsWithBreaks.push(part);
                }
            });
        } else {
            finalElementsWithBreaks.push(el);
        }
    });

    return finalElementsWithBreaks;
  };

  // Renders a block of text that could be paragraphs and/or lists
  const renderContentLines = (contentBlock: string, baseKey: string): React.ReactNode[] => {
    const elements: React.ReactNode[] = [];
    let currentListItems: string[] = [];
    // Split the block into individual lines for processing
    const lines = contentBlock.split('\n');

    for (let i = 0; i < lines.length; i++) {
        const line = lines[i].trim(); // Trim each line before checking its type
        
        if (!line && currentListItems.length === 0) continue; // Skip empty lines unless in middle of list

        const isListItem = line.startsWith('* ') || line.startsWith('- ');

        if (isListItem) {
            currentListItems.push(line.replace(/^(\*|-)\s*/, ''));
        } else {
            // Not a list item, so if there was a list being built, render it
            if (currentListItems.length > 0) {
                elements.push(
                    <ul key={`${baseKey}-ul-${elements.length}`} className="list-disc list-inside pl-4 mb-3 space-y-1">
                        {currentListItems.map((item, itemIndex) => (
                            <li key={itemIndex} className="text-xs font-normal text-[var(--text-secondary)] leading-relaxed">
                                {parseInlineMarkdown(item)}
                            </li>
                        ))}
                    </ul>
                );
                currentListItems = []; // Reset for next list
            }
            // Render the current non-list line as a paragraph, if it's not empty
            if (line) { // Ensure line has content after trim
                elements.push(
                    <p key={`${baseKey}-p-${elements.length}`} className="text-xs font-normal text-[var(--text-secondary)] leading-relaxed mb-3">
                        {parseInlineMarkdown(line)}
                    </p>
                );
            }
        }
    }

    // After loop, if there's a pending list, render it
    if (currentListItems.length > 0) {
        elements.push(
            <ul key={`${baseKey}-ul-${elements.length}`} className="list-disc list-inside pl-4 mb-3 space-y-1">
                {currentListItems.map((item, itemIndex) => (
                    <li key={itemIndex} className="text-xs font-normal text-[var(--text-secondary)] leading-relaxed">
                        {parseInlineMarkdown(item)}
                    </li>
                ))}
            </ul>
        );
    }
    return elements;
  };


  const renderSection = (sectionText: string, index: number): React.ReactNode => {
    // Split the current section (which might be "### Heading\nContent") into lines
    const lines = sectionText.split('\n');
    const firstLine = lines[0].trim(); // Trim for matching headings
    // Re-join the rest of the lines, preserving their original newlines for further processing by renderContentLines
    const restOfLinesContent = lines.slice(1).join('\n'); 

    const keyPrefix = `section-${index}`;

    if (firstLine.startsWith('## ')) {
        return (
            <React.Fragment key={keyPrefix}>
                <h2 className="text-xl font-[var(--font-display)] text-[var(--primary-glow)] mt-5 mb-3 border-b border-[var(--border-color)] pb-2">
                    {parseInlineMarkdown(firstLine.substring(3))}
                </h2>
                {restOfLinesContent.trim() && renderContentLines(restOfLinesContent, `${keyPrefix}-content`)}
            </React.Fragment>
        );
    }
    if (firstLine.startsWith('### ')) {
         return (
            <React.Fragment key={keyPrefix}>
                <h3 className="text-lg font-semibold text-[var(--text-primary)] mt-4 mb-2">
                     {parseInlineMarkdown(firstLine.substring(4))}
                </h3>
                 {restOfLinesContent.trim() && renderContentLines(restOfLinesContent, `${keyPrefix}-content`)}
            </React.Fragment>
        );
    }
    if (firstLine.startsWith('#### ')) {
        return (
            <React.Fragment key={keyPrefix}>
                <h4 className="text-md font-semibold text-[var(--text-primary)] mt-3 mb-1">
                    {parseInlineMarkdown(firstLine.substring(5))}
                </h4>
                 {restOfLinesContent.trim() && renderContentLines(restOfLinesContent, `${keyPrefix}-content`)}
            </React.Fragment>
        );
    }
    
    // If the entire sectionText didn't start with a heading, process all its lines for paragraphs/lists
    return renderContentLines(sectionText, keyPrefix);
  };

  return (
    <div className="font-['Open_Sans'] max-w-none">
      {sections.map((section, index) => renderSection(section, index))}
    </div>
  );
};

export default MarkdownRenderer;
