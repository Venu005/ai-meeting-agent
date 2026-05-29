import React, { memo } from 'react';
import { AlertCircle, Check, Loader2 } from 'lucide-react';
import ShinyText from '@/components/ShinyText';
import { ToolProps } from '.';

const PureAddMemoryTool = ({ tool }: ToolProps) => {
  if (!tool.input) {
    return null;
  }
  const isLoading = tool.state === 'input-streaming' || tool.state === 'input-available';
  if (!isLoading) {
    const result = tool.output as unknown as { error?: string; success?: boolean };
    const hasError = tool.errorText || (result && (result.error || result.success === false));

    return (
      // <div className='my-1 flex w-fit items-center gap-1 rounded-md text-sm'>
      //   {hasError ? <AlertCircle className='size-3.5 text-red-500' /> : <Check className='size-3.5 text-green-500' />}
      //   <div>{hasError ? `Failed to add memory` : `Added memory`}</div>
      // </div>
      null
    );
  }
  return (
    <div className='my-1 flex w-fit items-center gap-1 rounded-md text-base'>
      {/* <Loader2 size={16} className='text-muted-foreground animate-spin' /> */}
      <ShinyText text={`Saving this for later...`} />
    </div>
  );
};

const AddMemoryTool = memo(PureAddMemoryTool, (prevProps, nextProps) => {
  const prevInput = prevProps.tool.input;
  const nextInput = nextProps.tool.input;
  if (JSON.stringify(prevInput) !== JSON.stringify(nextInput)) return false;
  if (prevProps.tool.state !== nextProps.tool.state) return false;
  if (prevProps.tool.type !== nextProps.tool.type) return false;
  return true;
});
export default AddMemoryTool;
