import { useState, createContext, useContext, ReactNode, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { BookOpen, X, Minus, Plus, Type } from 'lucide-react';

interface ReadingModeContextType {
  isReadingMode: boolean;
  fontSize: number;
  toggleReadingMode: () => void;
  increaseFontSize: () => void;
  decreaseFontSize: () => void;
}

const ReadingModeContext = createContext<ReadingModeContextType | null>(null);

export function useReadingMode() {
  const context = useContext(ReadingModeContext);
  if (!context) {
    return {
      isReadingMode: false,
      fontSize: 18,
      toggleReadingMode: () => {},
      increaseFontSize: () => {},
      decreaseFontSize: () => {},
    };
  }
  return context;
}

export function ReadingModeProvider({ children }: { children: ReactNode }) {
  const [isReadingMode, setIsReadingMode] = useState(false);
  const [fontSize, setFontSize] = useState(() => {
    const saved = localStorage.getItem('article-font-size');
    return saved ? parseInt(saved) : 18;
  });

  useEffect(() => {
    localStorage.setItem('article-font-size', fontSize.toString());
  }, [fontSize]);

  const toggleReadingMode = () => setIsReadingMode(!isReadingMode);
  const increaseFontSize = () => setFontSize(prev => Math.min(prev + 2, 28));
  const decreaseFontSize = () => setFontSize(prev => Math.max(prev - 2, 14));

  return (
    <ReadingModeContext.Provider value={{ isReadingMode, fontSize, toggleReadingMode, increaseFontSize, decreaseFontSize }}>
      {children}
    </ReadingModeContext.Provider>
  );
}

export function ReadingModeToggle() {
  const { isReadingMode, toggleReadingMode } = useReadingMode();

  return (
    <Button
      variant={isReadingMode ? 'default' : 'ghost'}
      size="sm"
      onClick={toggleReadingMode}
      title={isReadingMode ? 'Exit reading mode' : 'Enter reading mode'}
    >
      {isReadingMode ? (
        <X className="h-4 w-4 mr-2" />
      ) : (
        <BookOpen className="h-4 w-4 mr-2" />
      )}
      {isReadingMode ? 'Exit' : 'Focus'}
    </Button>
  );
}

export function FontSizeControls() {
  const { fontSize, increaseFontSize, decreaseFontSize } = useReadingMode();

  return (
    <div className="flex items-center gap-1 border border-border rounded-md">
      <Button
        variant="ghost"
        size="icon"
        onClick={decreaseFontSize}
        disabled={fontSize <= 14}
        className="h-8 w-8"
        title="Decrease font size"
      >
        <Minus className="h-3 w-3" />
      </Button>
      <div className="flex items-center gap-1 px-2 text-sm">
        <Type className="h-3 w-3" />
        <span className="w-6 text-center">{fontSize}</span>
      </div>
      <Button
        variant="ghost"
        size="icon"
        onClick={increaseFontSize}
        disabled={fontSize >= 28}
        className="h-8 w-8"
        title="Increase font size"
      >
        <Plus className="h-3 w-3" />
      </Button>
    </div>
  );
}

interface ReadingModeWrapperProps {
  children: ReactNode;
  className?: string;
}

export function ReadingModeWrapper({ children, className = '' }: ReadingModeWrapperProps) {
  const { isReadingMode, fontSize } = useReadingMode();

  return (
    <div 
      className={`${className} ${isReadingMode ? 'reading-mode' : ''}`}
      style={{ fontSize: `${fontSize}px` }}
    >
      {children}
    </div>
  );
}
