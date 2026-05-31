import '@testing-library/jest-dom';
import React from 'react';

jest.mock('remark-gfm', () => () => undefined);

jest.mock('react-markdown', () => {
  type MarkdownComponent = React.ComponentType<{ children?: React.ReactNode }>;

  const renderInline = (text: string, components?: Record<string, MarkdownComponent>) => {
    const parts = text.split(/(\*\*[^*]+\*\*|\*[^*]+\*)/g).filter(Boolean);

    return parts.map((part, index) => {
      const boldMatch = part.match(/^\*\*([^*]+)\*\*$/);
      if (boldMatch) {
        const Strong = components?.strong ?? 'strong';
        return React.createElement(Strong, { key: index }, boldMatch[1]);
      }

      const emMatch = part.match(/^\*([^*]+)\*$/);
      if (emMatch) {
        const Em = components?.em ?? 'em';
        return React.createElement(Em, { key: index }, emMatch[1]);
      }

      return part;
    });
  };

  return function Markdown({
    children,
    components,
  }: {
    children: string;
    components?: Record<string, MarkdownComponent>;
  }) {
    const lines = String(children).split('\n');

    return React.createElement(
      React.Fragment,
      null,
      ...lines.map((line, index) => {
        const trimmed = line.trim();
        if (!trimmed) {
          return null;
        }

        if (trimmed.startsWith('## ')) {
          const H2 = components?.h2 ?? 'h2';
          return React.createElement(H2, { key: index }, trimmed.slice(3));
        }

        if (trimmed.startsWith('### ')) {
          const H3 = components?.h3 ?? 'h3';
          return React.createElement(H3, { key: index }, trimmed.slice(4));
        }

        if (trimmed.startsWith('> ')) {
          const Blockquote = components?.blockquote ?? 'blockquote';
          return React.createElement(Blockquote, { key: index }, renderInline(trimmed.slice(2), components));
        }

        if (/^\d+\.\s/.test(trimmed)) {
          const Li = components?.li ?? 'li';
          return React.createElement(Li, { key: index }, renderInline(trimmed.replace(/^\d+\.\s/, ''), components));
        }

        if (trimmed.startsWith('- ')) {
          const Li = components?.li ?? 'li';
          return React.createElement(Li, { key: index }, renderInline(trimmed.slice(2), components));
        }

        const P = components?.p ?? 'p';
        return React.createElement(P, { key: index }, renderInline(trimmed, components));
      }),
    );
  };
});
