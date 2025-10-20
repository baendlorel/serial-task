import { Fn, SerialTaskOptions, StrictSerialTaskOptions } from './global.js';

export const defineProperty = Reflect.defineProperty;

export const isArray = Array.isArray;

export const PromiseResolve = Promise.resolve.bind(Promise);
export const PromiseReject = Promise.reject.bind(Promise);

export const isThenable = (value: unknown): value is Promise<any> => {
  if ((typeof value !== 'object' || value === null) && typeof value !== 'function') {
    return false;
  }
  return 'then' in value && typeof value.then === 'function';
};

// use same default functions to reduce memory usage
const DEFAULT_BREAKER = () => false;
const DEFAULT_SKIPPER = DEFAULT_BREAKER;
const DEFAULT_RESULT_WRAPPER = (_task: Fn, index: number, _tasks: Fn[], args: unknown[], lastReturn: unknown) =>
  index === 0 ? args : [lastReturn];

export function normalize<F extends Fn>(options: SerialTaskOptions<F>): StrictSerialTaskOptions<F> {
  if (typeof options !== 'object' || options === null) {
    throw new TypeError(`__NAME__: 'options' must be an object`);
  }

  const {
    name = 'kskbTask',
    tasks,
    breakCondition = DEFAULT_BREAKER,
    skipCondition = DEFAULT_SKIPPER,
    resultWrapper = DEFAULT_RESULT_WRAPPER as any,
  } = options;

  if (typeof name !== 'string') {
    throw new TypeError(`__NAME__: 'name' must be a string or omitted`);
  }

  if (!isArray(tasks) || tasks.some((task) => typeof task !== 'function')) {
    throw new TypeError(`__NAME__: 'tasks' must be a function array`);
  }

  if (typeof breakCondition !== 'function') {
    throw new TypeError(`__NAME__: 'breakCondition' must be a function or omitted`);
  }

  if (typeof skipCondition !== 'function') {
    throw new TypeError(`__NAME__: 'skipCondition' must be a function or omitted`);
  }

  if (typeof resultWrapper !== 'function') {
    throw new TypeError(`__NAME__: 'resultWrapper' must be a function or omitted`);
  }

  return {
    name,
    tasks,
    breakCondition,
    skipCondition,
    resultWrapper,
  };
}
