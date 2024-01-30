import {Dict} from "koishi";

export interface BackendCheckResult {
  consoleService: boolean
  koishiEnv: string
  consoleClassName: string
  components: string[]
  done: boolean
}

export interface BackendKONChecks {
  consoleService: boolean,
  koishiEnv: boolean,
  consoleClassName: boolean,
  browserComponent: boolean
}

interface FrontendCheckResult {
}

export type FullCheckResult = BackendCheckResult & FrontendCheckResult
