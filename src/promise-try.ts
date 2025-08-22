import { isThenable } from './common.js';

type PromiseReturn<F extends Fn, T = ReturnType<F>> = Promise<
  T extends Promise<unknown> ? Awaited<T> : T
>;

export function PromiseTry(fn: Fn, thisArg: unknown, ...args: Parameters<Fn>): PromiseReturn<Fn> {
  try {
    const r = fn.apply(thisArg, args);
    if (isThenable(r)) {
      return r;
    } else {
      return Promise.resolve(r);
    }
  } catch (e) {
    return Promise.reject(e);
  }
}

export function PromiseTrapply(fn: Fn, thisArg: unknown, args: Parameters<Fn>): PromiseReturn<Fn> {
  try {
    const r = fn.apply(thisArg, args);
    if (isThenable(r)) {
      return r;
    } else {
      return Promise.resolve(r);
    }
  } catch (e) {
    return Promise.reject(e);
  }
}
