type Fn = (...args: any[]) => any;

declare const __IS_DEV__: boolean;

interface TaskReturn<R = any> {
  /**
   * The result of the last task function
   */
  value: R;

  /**
   * All results of the tasks
   * - same order as `tasks`
   */
  results: R[];

  /**
   * Means `opts.tasks.length` is 0 or not
   */
  trivial: boolean;

  /**
   * If the task was broken by `breakCondition`
   * - `-1` means not broken
   * - otherwise, the index of the task that caused the break
   */
  breakAt: number;

  /**
   * Index of the skipped tasks
   */
  skipped: number[];
}

type TaskifyAsync<F extends Fn> = (...args: Parameters<F>) => Promise<TaskReturn<ReturnType<F>>>;
type Taskify<F extends Fn> = (...args: Parameters<F>) => TaskReturn<ReturnType<F>>;

interface SerialTaskOptions<F extends Fn> {
  /**
   * Name of the generated task function
   * - default is `'kskbTask'`
   */
  name?: string;

  /**
   * Functions to be executed in order
   * - **Strongly Recommended**: all task functions must have same input type and output type
   * - creator will use a copy of this array, so you can modify the original array
   * - will be executed from `0` to `length - 1`
   */
  tasks: F[];

  /**
   * Returns an array of arguments that will be spread and passed to the next task
   * @param task current task function
   * @param index index of current task
   * @param tasks All tasks
   * @param args input value of the serial task
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
  resultWrapper?: (
    task: F,
    index: number,
    tasks: F[],
    args: Parameters<F>,
    lastReturn: ReturnType<F>
  ) => Parameters<F>;

  /**
   * Break the loop and return the last result immediately when this function returns `true`
   * @param task current task function
   * @param index index of current task
   * @param tasks All tasks
   * @param args input value of the serial task
   * @param lastReturn returned value of the last task function
   */
  breakCondition?: (
    task: F,
    index: number,
    tasks: F[],
    args: Parameters<F>,
    lastReturn: ReturnType<F>
  ) => boolean;

  /**
   * Give `true` to skip this task item
   * @param task current task function
   * @param index index of current task
   * @param tasks All tasks
   * @param args input value of the serial task
   * @param lastReturn returned value of the last task function
   */
  skipCondition?: (
    task: F,
    index: number,
    tasks: F[],
    args: Parameters<F>,
    lastReturn: ReturnType<F>
  ) => boolean;
}

type StrictSerialTaskOptions<F extends Fn> = Required<SerialTaskOptions<F>>;
