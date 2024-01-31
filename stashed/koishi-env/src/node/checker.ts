import {Awaitable, camelize, capitalize, Context, Dict, ForkScope, MainScope, Plugin, Service} from "koishi";
import {BackendCheckResult, BackendKONChecks} from "../shared";
import {normalize, normalizeValue} from "./utils";

type KeysMatching<T extends object, V> = {
  [K in keyof T]-?: T[K] extends V ? K : never
}[keyof T];


type ScanTypes = 'services' | 'plugins'

// https://github.com/koishijs/webui/blob/main/plugins/insight/src/index.ts#L14
function format(name: string) {
  return capitalize(camelize(name));
}

// https://github.com/koishijs/webui/blob/main/plugins/insight/src/index.ts#L18C1-L22C2
function getName(plugin: Plugin) {
  if (!plugin) return 'App';
  if (!plugin.name || plugin.name === 'apply') return 'Anonymous';
  return format(plugin.name);
}

declare module 'koishi' {
  export interface Context {
    env: Checker;
    envChecker: Checker;
    isKON: Checker;
  }
}

export class Checker extends Service {
  private _services: Record<number, string[]>;
  private _plugins: Dict<Record<number, [MainScope, ForkScope[]]>>;

  get isKON() {
    const prob = this.konProb();
    if (Number.isNaN(prob)) return;
    return prob >= 0.5;
  }

  get services() {
    if (this._services) return this._services;
    return this.scanService();
  }

  get plugins() {
    if (this._plugins) return this._plugins;
    return this.scanPlugins();
  }

  get result(): Awaitable<BackendCheckResult> {
    if (!this._result) return this.check().then(() => this._result);
    return this._result;
  }

  static inject = {
    optional: ['console']
  };

  static konWeights = {
    consoleService: true,
    koishiEnv: 0.4,
    consoleClassName: 0.01,
    browserComponent: 0.1
  };
  static checks: (keyof BackendCheckResult)[] = ['consoleService', 'consoleClassName', 'components', 'koishiEnv'];
  private _result: BackendCheckResult = Object.create(null);

  constructor(protected ctx: Context, protected config: Checker.Config) {
    super(ctx, 'env', true);
    ctx.alias('env', ['envChecker', 'isKON']);

    this._result.done = false;

    for (const check of Checker.checks)
      this._result[check as any] = false;
  }

  async start() {
    await this.check();
  }

  async getResult<K extends keyof typeof this._result, O = K | undefined>(op: O = undefined):
    Promise<O extends undefined ? typeof this._result : BackendCheckResult> {
    if (op) return (await this.result)[op as any];
    return await this.result as any;
  }

  private r<K extends keyof typeof this._result, R extends any = boolean>
  (op: K, transform: (val: any) => R = Boolean as any, fallback: any = undefined): NonNullable<R> | any {
    this.ensureChecked()?.then();
    if (!transform) transform = x => x;
    if (!this._result[op as any]) return fallback;
    return transform(this._result[op as any]) ?? fallback;
  }

  private update<K extends keyof BackendCheckResult>(option: K, val: BackendCheckResult[K]) {
    this._result[option] = val;
    return val;
  }

  private extend<K extends KeysMatching<BackendCheckResult, any[]>>(option: K, val: any | BackendCheckResult[K]) {
    let data: any[] = this._result[option];
    if (!Array.isArray(data)) (data ||= []).push(data);
    if (Array.isArray(val))
      data.push(...val);
    else data.push(val);
    return data;
  }

  scanService() {
    const app = this.ctx.root;
    // https://github.com/koishijs/webui/blob/main/plugins/insight/src/index.ts#L59C5-L68C6
    const services = {} as Record<number, string[]>;
    for (const [key, {type}] of Object.entries(app[Context.internal])) {
      if (type !== 'service') continue;
      const instance = this.ctx.get(key);
      if (!(instance instanceof Object)) continue;
      const ctx: Context = Reflect.getOwnPropertyDescriptor(instance, Context.current)?.value;
      if (ctx?.scope.uid) {
        (services[ctx.scope.uid] ||= []).push(key);
      }
    }
    return this._services = services;
  }

  scanPlugins() {
    const plugins: Dict<Record<number, [MainScope, ForkScope[]]>> = Object.create(null);
    // https://github.com/koishijs/webui/blob/main/plugins/insight/src/index.ts#L70
    for (const runtime of this.ctx.registry.values()) {
      const name = getName(runtime.plugin);
      ((plugins[name] ||= Object.create(null))[runtime.uid] ||= [])
        .push(runtime, [...runtime.children]);
    }
    return this._plugins = plugins;
  }

  toScan(types: 'all' | ScanTypes[]) {
    if (types === 'all') types = ['services', 'plugins'];
    if (types.includes('services')) this.scanService();
    if (types.includes('plugins')) this.scanPlugins();

  }

  ensureScanned() {
    const types = [];
    if (!this._services) types.push('services');
    if (!this._plugins) types.push('plugins');
    this.toScan(types);
  }

  ensureChecked() {
    if (!this._result.done) return this.check();
  }

  // Some checks need to be async
  async asyncChecks() {}

  get OnlineChecks(): BackendKONChecks {
    return {
      consoleService: this.r('consoleService'),
      consoleClassName: this.r('consoleClassName'),
      browserComponent: this.r('components', (arr: string[]) => arr.includes('html')),
      koishiEnv: this.r('koishiEnv')
    };
  }

  konProb(): number {
    const konChecks = this.OnlineChecks;

    const keys = Object.keys(konChecks);
    const vals = Object.values(konChecks).map(val => typeof val === 'undefined' ? false : val).map(Number);

    const possVals = Object.values(Checker.konWeights);

    if (possVals.some((val, idx) => val === true && !vals[idx])){
      return 0
    }

    const normalize1 = normalize(possVals.map(Number))
      .map((val, idx)=>possVals[idx] === true ? 0 : Number(val));

    return vals
      .map(val => Number.isNaN(val) ? 0 : val)
      .map((val, idx) => val * normalize1[idx])
      .reduce((a, b) => a + b, 0);
  }

  check(rescan: boolean = false) {
    const promise = this.asyncChecks().then(() => this._result.done = true);

    if (rescan) this.toScan("all");

    const app = this.ctx.root;
    const console = app.get('console');
    if (console) {
      this.update('consoleService', true);
      this.update('consoleClassName', console.name);
    }
    this.extend(
      'components',
      Object.keys(this.plugins)
        .filter(val => val.startsWith('component:'))
        .map(val => val.slice('component:'.length))
    );

    this.update('koishiEnv', process.env.KOISHI_ENV ?? false as any);

    return promise;
  }
}

export namespace Checker {
  export interface Config {

  }
}

export default Checker;
