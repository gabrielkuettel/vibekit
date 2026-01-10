/**
 * Contract Tools
 *
 * Tools for deploying, calling, and managing smart contracts.
 */

import type { ToolRegistration } from '../types.js'

import { appCallTool, handleAppCall } from './app-call.js'
import { appDeployTool, handleAppDeploy } from './app-deploy.js'
import { appGetInfoTool, handleAppGetInfo } from './app-get-info.js'
import { appListMethodsTool, handleAppListMethods } from './app-list-methods.js'
import { appOptInTool, handleAppOptIn } from './app-opt-in.js'
import { appCloseOutTool, handleAppCloseOut } from './app-close-out.js'
import { appDeleteTool, handleAppDelete } from './app-delete.js'

export const contractTools: ToolRegistration[] = [
  { definition: appListMethodsTool, handler: handleAppListMethods },
  { definition: appGetInfoTool, handler: handleAppGetInfo },
  { definition: appDeployTool, handler: handleAppDeploy },
  { definition: appCallTool, handler: handleAppCall },
  { definition: appOptInTool, handler: handleAppOptIn },
  { definition: appCloseOutTool, handler: handleAppCloseOut },
  { definition: appDeleteTool, handler: handleAppDelete },
]
