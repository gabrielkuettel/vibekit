/**
 * State Tools
 *
 * Tools for reading application state (global, local, and box storage).
 */

import type { ToolRegistration } from '../types.js'

import { readGlobalStateTool, handleReadGlobalState } from './read-global-state.js'
import { readLocalStateTool, handleReadLocalState } from './read-local-state.js'
import { readBoxTool, handleReadBox } from './read-box.js'

export { readGlobalStateTool, handleReadGlobalState } from './read-global-state.js'
export { readLocalStateTool, handleReadLocalState } from './read-local-state.js'
export { readBoxTool, handleReadBox } from './read-box.js'

export const stateTools: ToolRegistration[] = [
  { definition: readGlobalStateTool, handler: handleReadGlobalState },
  { definition: readLocalStateTool, handler: handleReadLocalState },
  { definition: readBoxTool, handler: handleReadBox },
]
