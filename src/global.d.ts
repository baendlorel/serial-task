/* eslint-disable @typescript-eslint/no-explicit-any */
export type Fn = (...args: any[]) => any;

export interface TaskReturn<R = any> {
  /**
   * The result of the last task function
   */
  value: R;

  /**
   * All results of the tasks
   * - same order as `tasks`
   * - skipped tasks will be empty slot in this array
   *   - which means `index in results` is `false`
   */
  results: R[];

  /**
   * Means `options.tasks.length` is `0`
   */
  trivial: boolean;

  /**
   * If the task breaks, this will record the index of the task that caused the break.
   * - `-1` means not broken
   * - otherwise, the index of the task that caused the break
   */
  breakAt: number;

  /**
   * Index of the skipped tasks
   */
  skipped: number[];
}

export type TaskifyAsync<F extends Fn> = (...args: Parameters<F>) => Promise<TaskReturn<ReturnType<F>>>;
export type Taskify<F extends Fn> = (...args: Parameters<F>) => TaskReturn<ReturnType<F>>;

export interface SerialTaskOptions<F extends Fn> {
  /**
   * Name of the generated task function
   * - default is `'kskbTask'`
   */
  name?: string;

  /**
   * Functions to be executed in order. The one that iterates internally.
   * - if you use `createSerialTaskAsync`, these functions will be called with `await`
   * - **Strongly Recommended**: all task functions must have same input type and output type
   * - creator will directly use this array, so you can modify it dynamically
   * - will be executed from `0` to `length - 1`
   */
  tasks: F[] | Fn[];

  /**
   * Returns an array of arguments that will be passed to the next task
   * - **MUST return an array of arguments!**
   * - if you use `createSerialTaskAsync`, this function will be called with `await`
   * - when calling the first task(no result before), the `lastReturn` will be set to `undefined`
   * @default
   *  (_task: Fn, index: number, _tasks: Fn[], args: unknown[], lastReturn: unknown) => index === 0 ? args : [lastReturn]
   * @param task current task function
   * @param index index of current task
   * @param tasks is `options.tasks`, since `for tasks.length` loop is used here, you can add new tasks dynamically
   * @param args input value of the whole serial task
   * @param lastReturn returned value of the last task function
   * @returns **must return an array of arguments!**
   * @example
   * ```typescript
   * // Internal implementation
   * // first loop, index = 0
   * // The calling order of each function is as follows:
   * const inputValue = [...arguments]; // arguments of the created task function
   * let returnValue = null
   * for(...){
   *   const currentInput = resultWrapper(index, ...inputValue, returnValue);
   *   const toBreak = breakCondition(index, ...currentInput);
   *   if (toBreak) break;
   *   const toSkip = skipCondition(index, ...currentInput);
   *   if (toSkip) continue;
   *   returnValue = tasks[index](...currentInput);
   * }
   * ```
   */
  resultWrapper?: (task: F, index: number, tasks: F[], args: Parameters<F>, lastReturn: ReturnType<F>) => unknown[];

  /**
   * Break the loop and return the last result immediately when this function returns `true`
   * - if you use `createSerialTaskAsync`, this function will be called with `await`
   * - when calling the first task(no result before), the `lastReturn` will be `undefined`
   * - default is `() => false`
   * @param task current task function
   * @param index index of current task
   * @param tasks is `options.tasks`, since `for tasks.length` loop is used here, you can add new tasks dynamically
   * @param args input value of the whole serial task
   * @param lastReturn returned value of the last task function
   */
  breakCondition?: (task: F, index: number, tasks: F[], args: Parameters<F>, lastReturn: ReturnType<F>) => boolean;

  /**
   * Give `true` to skip this task item
   * - if you use `createSerialTaskAsync`, this function will be called with `await`
   * - when calling the first task(no result before), the `lastReturn` will be `undefined`
   * - default is `() => false`
   * @param task current task function
   * @param index index of current task
   * @param tasks is `options.tasks`, since `for tasks.length` loop is used here, you can add new tasks dynamically
   * @param args input value of the whole serial task
   * @param lastReturn returned value of the last task function
   */
  skipCondition?: (task: F, index: number, tasks: F[], args: Parameters<F>, lastReturn: ReturnType<F>) => boolean;
}

export type StrictSerialTaskOptions<F extends Fn> = Required<SerialTaskOptions<F>>;
