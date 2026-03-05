import { useEffect, useState } from 'react';
import { List } from 'lucide-react';

interface TocItem {
  id: string;
  text: string;
  level: number;
}

interface TableOfContentsProps {
  content: string;
}

export function TableOfContents({ content }: TableOfContentsProps) {
  const [items, setItems] = useState<TocItem[]>([]);
  const [activeId, setActiveId] = useState<string>('');

  useEffect(() => {
    // Parse headings from HTML content
    const parser = new DOMParser();
    const doc = parser.parseFromString(content, 'text/html');
    const headings = doc.querySelectorAll('h1, h2, h3');
    
    const tocItems: TocItem[] = [];
    headings.forEach((heading, index) => {
      const id = `heading-${index}`;
      const text = heading.textContent || '';
      const level = parseInt(heading.tagName.charAt(1));
      if (text.trim()) {
        tocItems.push({ id, text, level });
      }
    });
    
    setItems(tocItems);
  }, [content]);

  useEffect(() => {
    // Add IDs to actual headings in the DOM
    const articleContent = document.querySelector('.article-content');
    if (articleContent) {
      const headings = articleContent.querySelectorAll('h1, h2, h3');
      headings.forEach((heading, index) => {
        heading.id = `heading-${index}`;
      });
    }

    // Intersection observer for active heading
    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            setActiveId(entry.target.id);
          }
        });
      },
      { rootMargin: '-20% 0px -80% 0px' }
    );

    items.forEach((item) => {
      const element = document.getElementById(item.id);
      if (element) observer.observe(element);
    });

    return () => observer.disconnect();
  }, [items]);

  if (items.length < 2) return null;

  const scrollToHeading = (id: string) => {
    const element = document.getElementById(id);
    if (element) {
      element.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }
  };

  return (
    <nav className="hidden xl:block fixed left-8 top-1/3 w-56 no-print">
      <div className="flex items-center gap-2 mb-4 text-sm font-semibold">
        <List className="h-4 w-4" />
        Contents
      </div>
      <ul className="space-y-2 text-sm border-l border-border">
        {items.map((item) => (
          <li key={item.id}>
            <button
              onClick={() => scrollToHeading(item.id)}
              className={`block w-full text-left pl-4 py-1 transition-colors hover:text-foreground ${
                activeId === item.id
                  ? 'text-foreground border-l-2 border-foreground -ml-[1px]'
                  : 'text-muted-foreground'
              }`}
              style={{ paddingLeft: `${(item.level - 1) * 12 + 16}px` }}
            >
              {item.text}
            </button>
          </li>
        ))}
      </ul>
    </nav>
  );
}
