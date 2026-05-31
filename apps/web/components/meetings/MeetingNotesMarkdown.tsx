'use client';

import React from 'react';
import Markdown from 'react-markdown';
import remarkGfm from 'remark-gfm';

const MeetingNotesMarkdown = ({ message, className }: { message: string; className?: string }) => {
  return (
    <div
      className={`prose dark:prose-invert max-w-none prose-p:leading-relaxed prose-p:my-2 prose-a:break-all prose-hr:my-5 prose-pre:bg-transparent prose-code:before:content-none prose-code:after:content-none prose-pre:max-w-full prose-pre:p-0 ${className ?? ''}`}
    >
      <Markdown
        remarkPlugins={[remarkGfm]}
        components={{
          h2({ children }) {
            return <h2 className='mt-8 text-lg font-semibold tracking-tight first:mt-0'>{children}</h2>;
          },
          h3({ children }) {
            return <h3 className='text-foreground/90 mt-6 text-base font-medium'>{children}</h3>;
          },
          ul({ children }) {
            return <ul className='my-3 list-disc space-y-2 pl-5'>{children}</ul>;
          },
          ol({ children }) {
            return <ol className='my-3 list-decimal space-y-2 pl-5'>{children}</ol>;
          },
          li({ children }) {
            return <li className='text-sm leading-relaxed'>{children}</li>;
          },
          blockquote({ children }) {
            return (
              <blockquote className='border-muted-foreground/30 text-muted-foreground my-3 border-l-2 pl-4 italic'>
                {children}
              </blockquote>
            );
          },
          table({ children }) {
            return (
              <div className='my-2 w-full overflow-x-auto'>
                <table className='w-full table-auto border-collapse text-xs sm:text-sm'>{children}</table>
              </div>
            );
          },
          thead({ children }) {
            return <thead className='bg-muted/50 text-foreground'>{children}</thead>;
          },
          tr({ children }) {
            return <tr className='border-b'>{children}</tr>;
          },
          th({ children }) {
            return (
              <th className='bg-background border px-3 py-2 text-left font-semibold'>
                <div className='break-words whitespace-normal'>{children}</div>
              </th>
            );
          },
          td({ children }) {
            return (
              <td className='border px-3 py-2 align-top'>
                <div className='break-words whitespace-normal'>{children}</div>
              </td>
            );
          },
        }}
      >
        {message}
      </Markdown>
    </div>
  );
};

export const MeetingNotesInlineMarkdown = ({ message }: { message: string }) => (
  <MeetingNotesMarkdown message={message} className='prose-sm [&_p]:m-0 [&_p]:inline' />
);

export default MeetingNotesMarkdown;
