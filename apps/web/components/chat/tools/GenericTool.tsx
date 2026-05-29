import React, { memo } from 'react';
import { getToolName } from 'ai';
import { Check, Loader2, AlertCircle } from 'lucide-react';
import ShinyText from '@/components/ShinyText';
import { ToolProps } from '.';

const PureGenericTool = ({ tool }: ToolProps) => {
  if (!tool.input) {
    return null;
  }

  const isLoading = tool.state === 'input-streaming' || tool.state === 'input-available';
  const toolName = getToolName(tool);

  if (!isLoading) {
    const result = tool.output as unknown as { error?: string; success?: boolean };
    const hasError = tool.errorText || (result && (result.error || result.success === false));

    return (
      <div className='my-1 flex w-fit items-center gap-1 rounded-md text-sm'>
        {hasError ? <AlertCircle className='size-3.5 text-red-500' /> : <Check className='size-3.5 text-green-500' />}
        <div>{hasError ? `Tool failed: ${toolName}` : `Used: ${toolName}`}</div>
      </div>
    );
  }

  return (
    <div className='my-1 flex w-fit items-center gap-1 rounded-md text-base'>
      {/* <Loader2 size={16} className='animate-spin' /> */}
      <ShinyText text={`Using ${toolName}...`} />
    </div>
  );
};

const GenericTool = memo(PureGenericTool, (prevProps, nextProps) => {
  if (JSON.stringify(prevProps.tool.input) !== JSON.stringify(nextProps.tool.input)) {
    return false;
  }
  if (prevProps.tool.state !== nextProps.tool.state) {
    return false;
  }
  if (prevProps.tool.type !== nextProps.tool.type) {
    return false;
  }
  return true;
});

export default GenericTool;
