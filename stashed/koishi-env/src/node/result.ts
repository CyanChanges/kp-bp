import Console, {Client, DataService} from "@koishijs/console";
import {Context} from "koishi";
import type {BackendCheckResult, BackendKONChecks} from "../shared";

declare module '@koishijs/console' {
  export namespace Console {
    export interface Services {
      env: FullResultProvider
      'env.kon': KONResultProvider
    }
  }
}

type ResultProviderKey<T> = T extends `env.${infer P}` ? P : never

export abstract class ResultProvider<T> extends DataService<T> {
  static inject = ['env']

  protected constructor(ctx: Context, key: ResultProviderKey<keyof Console.Services>, options: DataService.Options = {}) {
    super(ctx, `env.${key}`, options);
  }

  async refresh(forced?: boolean) {
    await this.ctx.get('env').check(forced)
  }
}

export interface KONResult {
  checks: BackendKONChecks
  probability: number
  isKON: boolean
}

export class KONResultProvider extends ResultProvider<KONResult> {
  constructor(ctx: Context) {
    super(ctx, 'kon')
  }

  async get(forced?: boolean, client?: Client): Promise<KONResult> {
    const env = this.ctx.get('env')
    return {
      checks: env.OnlineChecks,
      probability: env.konProb(),
      isKON: env.isKON
    }
  }
}

export class FullResultProvider extends DataService<BackendCheckResult> {
  static inject = ['env']

  constructor(ctx: Context) {
    super(ctx, 'env');
  }

  async get(forced?: boolean, client?: Client): Promise<BackendCheckResult> {
    return await this.ctx.get('env').getResult()
  }

  async refresh(forced?: boolean) {
    await this.ctx.get('env').check(forced)
  }
}

export default {
  inject: ['env'],
  apply(ctx: Context) {
    ctx.plugin(FullResultProvider)
    ctx.plugin(KONResultProvider)
  }
}
