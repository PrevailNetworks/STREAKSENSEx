
import React from 'react';

interface MarkdownRendererProps {
  content: string;
}

const MarkdownRenderer: React.FC<MarkdownRendererProps> = ({ content }) => {
  if (!content) {
    return <p className="text-sm text-[var(--text-secondary)]">No detailed analysis available.</p>;
  }

  // Improved paragraph handling: split by one or more newlines, then filter out empty strings.
  const sections = content.split(/\n\s*\n/).map(section => section.trim()).filter(Boolean);

  const renderSection = (sectionText: string) => {
    // ## Headings (H2)
    if (sectionText.startsWith('## ')) {
      return <h2 className="text-xl font-[var(--font-display)] text-[var(--primary-glow)] mt-5 mb-3 border-b border-[var(--border-color)] pb-2">{sectionText.substring(3)}</h2>;
    }
    // ### Headings (H3)
    if (sectionText.startsWith('### ')) {
      return <h3 className="text-lg font-semibold text-[var(--text-primary)] mt-4 mb-2">{sectionText.substring(4)}</h3>;
    }
    // #### Headings (H4)
    if (sectionText.startsWith('#### ')) {
        return <h4 className="text-md font-semibold text-[var(--text-primary)] mt-3 mb-1">{sectionText.substring(5)}</h4>;
    }

    // Unordered lists
    if (sectionText.match(/^(\s*(\*|-)\s+.*)(\n\s*(\*|-)\s+.*)*$/s)) {
      const items = sectionText.split('\n').map(item => item.trim().replace(/^(\*|-)\s*/, '')).filter(Boolean);
      return (
        <ul className="list-disc list-inside space-y-1 text-sm text-[var(--text-secondary)] pl-4 mb-3">
          {items.map((item, index) => <li key={index}>{parseInlineMarkdown(item)}</li>)}
        </ul>
      );
    }
    
    // Default to paragraph for other text blocks
    return <p className="text-sm text-[var(--text-secondary)] leading-relaxed mb-3">{parseInlineMarkdown(sectionText)}</p>;
  };

  const parseInlineMarkdown = (text: string): React.ReactNode => {
    // **bold**
    text = text.replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>');
    // *italic*
    text = text.replace(/\*(.*?)\*/g, '<em>$1</em>');
    
    // Simple way to handle newlines within a paragraph-like block for pre-formatted text:
    // This assumes that single newlines within a block from Gemini might be intentional for line breaks.
    // If Gemini uses double newlines for paragraphs (which it should for Markdown),
    // the main split already handles paragraphs.
    // This part converts single newlines within those blocks to <br />.
    const parts = text.split(/(\n)/).map((part, index) => {
        if (part === '\n') return <br key={`br-${index}`} />;
        return <span key={`text-${index}`} dangerouslySetInnerHTML={{ __html: part }} />;
    });
    return <>{parts}</>;
  };

  return (
    <div className="prose prose-sm max-w-none text-[var(--text-secondary)] prose-headings:text-[var(--text-primary)] prose-strong:text-[var(--text-primary)] prose-em:text-[var(--text-primary)]">
      {sections.map((section, index) => (
        <React.Fragment key={index}>
          {renderSection(section)}
        </React.Fragment>
      ))}
    </div>
  );
};

export default MarkdownRenderer;
