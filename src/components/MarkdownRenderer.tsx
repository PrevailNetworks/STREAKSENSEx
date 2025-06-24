import React from 'react';

interface MarkdownRendererProps {
  content: string;
}

const MarkdownRenderer: React.FC<MarkdownRendererProps> = ({ content }) => {
  if (!content) {
    return <p className="font-['Open_Sans'] text-xs font-normal text-[var(--text-secondary)]">No detailed analysis available.</p>;
  }

  const sections = content.split(/\n\s*\n/).map(section => section.trim()).filter(Boolean);

  const renderSection = (sectionText: string) => {
    if (sectionText.startsWith('## ')) {
      return <h2 className="text-xl font-[var(--font-display)] text-[var(--primary-glow)] mt-5 mb-3 border-b border-[var(--border-color)] pb-2">{sectionText.substring(3)}</h2>;
    }
    if (sectionText.startsWith('### ')) {
      return <h3 className="text-lg font-semibold text-[var(--text-primary)] mt-4 mb-2">{sectionText.substring(4)}</h3>;
    }
    if (sectionText.startsWith('#### ')) {
        return <h4 className="text-md font-semibold text-[var(--text-primary)] mt-3 mb-1">{sectionText.substring(5)}</h4>;
    }

    if (sectionText.match(/^(\s*(\*|-)\s+.*)(\n\s*(\*|-)\s+.*)*$/s)) {
      const items = sectionText.split('\n').map(item => item.trim().replace(/^(\*|-)\s*/, '')).filter(Boolean);
      return (
        <ul className="list-disc list-inside pl-4"> {/* Default prose margins/spacing will apply */}
          {items.map((item, index) => <li key={index}>{parseInlineMarkdown(item)}</li>)}
        </ul>
      );
    }
    
    // Default prose margins/spacing will apply
    return <p>{parseInlineMarkdown(sectionText)}</p>;
  };

  const parseInlineMarkdown = (text: string): React.ReactNode => {
    text = text.replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>');
    text = text.replace(/\*(.*?)\*/g, '<em>$1</em>');
    
    const parts = text.split(/(\n)/).map((part, index) => {
        if (part === '\n') return <br key={`br-${index}`} />;
        return <span key={`text-${index}`} dangerouslySetInnerHTML={{ __html: part }} />;
    });
    return <>{parts}</>;
  };

  return (
    <div className={`
      prose 
      font-['Open_Sans'] 
      max-w-none 
      /* Base text color for prose, overridden by specific element styles below */
      text-[var(--text-secondary)] 
      prose-headings:text-[var(--text-primary)] 
      prose-strong:text-[var(--text-primary)] 
      prose-em:text-[var(--text-primary)]
      
      /* Paragraphs: Open Sans, 12pt (text-xs), regular (font-normal), specific color */
      prose-p:font-['Open_Sans'] /* Ensures Open Sans, though inherited */
      prose-p:text-xs 
      prose-p:font-normal 
      prose-p:text-[var(--text-secondary)]
      prose-p:leading-relaxed /* Restore leading if needed */
      prose-p:mb-3 /* Restore bottom margin if needed */

      /* List items: Open Sans, 12pt (text-xs), regular (font-normal), specific color */
      prose-li:font-['Open_Sans'] /* Ensures Open Sans, though inherited */
      prose-li:text-xs 
      prose-li:font-normal 
      prose-li:text-[var(--text-secondary)]
      
      /* Unordered Lists: Restore bottom margin if needed */
      prose-ul:mb-3
      prose-ul:space-y-1 /* Restore space between list items if needed */
    `}>
      {sections.map((section, index) => (
        <React.Fragment key={index}>
          {renderSection(section)}
        </React.Fragment>
      ))}
    </div>
  );
};

export default MarkdownRenderer;
