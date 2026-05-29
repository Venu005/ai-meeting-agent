'use client';
import React from 'react';
import Markdown from 'react-markdown';
import remarkGfm from 'remark-gfm';

const CustomMarkdown = ({ message, className }: { message: string; className?: string }) => {
  return (
    <div
      className={`prose max-sm:prose-sm prose-a:break-all dark:prose-invert prose-hr:my-5 prose-p:my-1 prose-pre:bg-transparent prose-code:before:content-none prose-code:after:content-none prose-pre:max-w-full prose-pre:p-0 max-w-full ${className}`}
    >
      <Markdown
        remarkPlugins={[remarkGfm]}
        components={{
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

export default CustomMarkdown;
