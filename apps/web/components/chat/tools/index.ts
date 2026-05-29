import { ToolUIPart } from 'ai';
import SearchWebTool from './SearchWebTool';
import AddMemoryTool from './AddMemoryTool';
import SearchMemoryTool from './SearchMemoryTool';

export type ToolProps = {
  tool: ToolUIPart;
};

export const toolComponents = {
  web_search: SearchWebTool,
  addMemory: AddMemoryTool,
  searchMemories: SearchMemoryTool,
};
