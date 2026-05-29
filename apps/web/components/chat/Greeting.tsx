import { Bot, Code, FileText, Lightbulb, MessageSquare, Search } from 'lucide-react';
import React, { useState, useRef, useEffect, useMemo } from 'react';
import ChatInput from './ChatInput';
import { cn } from '@repo/ui/lib/utils';

const suggestedPrompts = [
  {
    icon: <FileText className='size-4' />,
    title: 'Writing',
    questions: [
      'Help me write a professional email',
      'How can I improve this paragraph?',
      'Write a summary of this topic',
      'Help me draft a cover letter',
      'Proofread and edit my text',
    ],
  },
  {
    icon: <Search className='size-4' />,
    title: 'Research',
    questions: [
      'Explain this concept to me',
      'What are the pros and cons of...',
      'Help me understand this topic',
      'Compare these two options',
      'Find information about...',
    ],
  },
  {
    icon: <Code className='size-4' />,
    title: 'Code',
    questions: [
      'Help me debug this code',
      'How do I implement this feature?',
      'Explain this code snippet',
      "What's the best practice for...",
      'Review my code for improvements',
    ],
  },
  {
    icon: <Lightbulb className='size-4' />,
    title: 'Ideas',
    questions: [
      'Brainstorm ideas for my project',
      'Help me solve this problem',
      'What are creative ways to...',
      'Suggest alternatives for...',
      'How can I approach this differently?',
    ],
  },
  {
    icon: <MessageSquare className='size-4' />,
    title: 'Planning',
    questions: [
      'Help me create a plan for...',
      'What steps should I take?',
      'How do I organize this project?',
      'Create a schedule for...',
      'What should I prioritize?',
    ],
  },
  {
    icon: <Bot className='size-4' />,
    title: 'General',
    questions: [
      'Tell me about...',
      'What do you think about...',
      'How does this work?',
      'Can you help me with...',
      'I need advice on...',
    ],
  },
];

type Suggestion = {
  question: string;
  category: string;
};

type SuggestionsDropdownProps = {
  suggestions: Suggestion[];
  onSelect: (question: string, category: string) => void;
  onClose: () => void;
};

const SuggestionsDropdown = ({ suggestions, onSelect, onClose }: SuggestionsDropdownProps) => {
  const [selectedIndex, setSelectedIndex] = useState(-1);
  const [prevSuggestions, setPrevSuggestions] = useState(suggestions);
  const suggestionsRef = useRef<HTMLDivElement | null>(null);

  // Reset selectedIndex when suggestions change (React-recommended pattern)
  if (suggestions !== prevSuggestions) {
    setSelectedIndex(-1);
    setPrevSuggestions(suggestions);
  }

  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      if (suggestions.length === 0) return;

      if (event.key === 'ArrowDown') {
        event.preventDefault();
        setSelectedIndex((prev) => (prev < suggestions.length - 1 ? prev + 1 : prev));
      } else if (event.key === 'ArrowUp') {
        event.preventDefault();
        setSelectedIndex((prev) => (prev > -1 ? prev - 1 : -1));
      } else if (event.key === 'Enter' && selectedIndex >= 0 && suggestions[selectedIndex]) {
        event.preventDefault();
        event.stopPropagation();
        const selected = suggestions[selectedIndex];
        onSelect(selected.question, selected.category);
      } else if (event.key === 'Escape') {
        event.preventDefault();
        onClose();
      }
    };

    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [suggestions, selectedIndex, onSelect, onClose]);

  useEffect(() => {
    if (selectedIndex >= 0 && suggestionsRef.current) {
      const selectedElement = suggestionsRef.current.children[selectedIndex] as HTMLElement;
      if (selectedElement) {
        selectedElement.scrollIntoView({ block: 'nearest', behavior: 'smooth' });
      }
    }
  }, [selectedIndex]);

  if (suggestions.length === 0) return null;

  return (
    <div
      ref={suggestionsRef}
      className='bg-card border-input absolute top-full z-50 mt-2 max-h-60 w-full overflow-y-auto rounded-xl border shadow-lg md:top-auto md:bottom-full md:mt-0 md:mb-2'
    >
      {suggestions.map((suggestion, index) => (
        <div
          key={index}
          onMouseDown={(e) => {
            e.preventDefault();
            e.stopPropagation();
          }}
          onClick={(e) => {
            e.preventDefault();
            e.stopPropagation();
            onSelect(suggestion.question, suggestion.category);
          }}
          className={cn(
            'hover:bg-accent border-border/50 cursor-pointer border-b px-4 py-3 transition-colors last:border-b-0',
            selectedIndex === index && 'bg-accent',
          )}
        >
          <div className='text-muted-foreground mb-1 text-xs font-medium'>{suggestion.category}</div>
          <div className='text-sm'>{suggestion.question}</div>
        </div>
      ))}
    </div>
  );
};

type GreetingProps = {
  query: string;
  setQuery: (query: string) => void;
  isSubmitting: boolean;
  handleSubmit: (messageText?: string) => void;
};

const Greeting = ({ query, setQuery, isSubmitting, handleSubmit }: GreetingProps) => {
  const [selectedPrompt, setSelectedPrompt] = useState<string | null>(null);
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [justSelected, setJustSelected] = useState(false);

  const handlePromptClick = (prompt: string) => {
    setQuery(prompt);
    setJustSelected(false);
  };

  const filteredSuggestions = useMemo(() => {
    if (!query.trim() || justSelected) return [];

    const suggestions: Suggestion[] = [];
    const searchTerm = query.toLowerCase();

    suggestedPrompts.forEach((prompt) => {
      prompt.questions.forEach((question) => {
        const questionLower = question.toLowerCase().trim();
        const searchTermLower = searchTerm.toLowerCase().trim();
        if (questionLower.includes(searchTermLower) && questionLower !== searchTermLower) {
          suggestions.push({
            question,
            category: prompt.title,
          });
        }
      });
    });

    return suggestions;
  }, [query, justSelected]);

  useEffect(() => {
    setShowSuggestions(filteredSuggestions.length > 0);
  }, [filteredSuggestions]);

  const handleSuggestionSelect = (question: string, category: string) => {
    setQuery(question);
    setShowSuggestions(false);
    setSelectedPrompt(category);
    setJustSelected(true);
  };

  const handleCloseSuggestions = () => {
    setShowSuggestions(false);
  };

  useEffect(() => {
    if (justSelected && query.trim()) {
      const timer = setTimeout(() => {
        setJustSelected(false);
      }, 100);
      return () => clearTimeout(timer);
    }
  }, [query, justSelected]);

  return (
    <div className='mx-auto flex min-h-full max-w-4xl flex-col items-center justify-center px-4 py-8'>
      <div className='mb-8 flex items-center gap-4 text-3xl font-bold sm:text-5xl'>
        <span className='text-foreground/80'>How can I</span>
        <span className='from-primary/60 to-primary/80 space-y-2 bg-linear-to-r bg-clip-text text-center text-transparent'>
          help you?
        </span>
        <Bot className='size-12 sm:size-16' />
      </div>

      <div className='relative mb-8 w-full max-w-3xl'>
        {showSuggestions && (
          <SuggestionsDropdown
            suggestions={filteredSuggestions}
            onSelect={handleSuggestionSelect}
            onClose={handleCloseSuggestions}
          />
        )}

        <ChatInput
          query={query}
          setQuery={setQuery}
          isSubmitting={isSubmitting}
          onSubmit={handleSubmit}
          initialPage={true}
        />
      </div>

      <div className='w-full max-w-4xl'>
        <div className='flex w-full flex-wrap items-center justify-center gap-8'>
          {suggestedPrompts.map((prompt, index) => (
            <div
              key={index}
              className={cn(
                'bg-primary/10 hover:bg-primary dark:hover:bg-primary dark:bg-primary/30 cursor-pointer rounded-full px-4 py-2 text-xs hover:text-white',
                selectedPrompt === prompt.title && 'bg-primary! text-white',
              )}
              onClick={() => {
                const randomQuestion = prompt.questions[Math.floor(Math.random() * prompt.questions.length)];
                handlePromptClick(randomQuestion || '');
                setSelectedPrompt(prompt.title);
              }}
            >
              <div className='flex items-center gap-2'>
                {prompt.icon}
                <div className='flex-1'>
                  <h3 className='font-medium'>{prompt.title}</h3>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

export default Greeting;
