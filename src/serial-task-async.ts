import { Fn, SerialTaskOptions, TaskifyAsync, TaskReturn } from './global.js';
import { defineProperty, normalize } from './common.js';
import { PromiseTrapply, PromiseTry } from './promise-try.js';

/**
 * ## Usage
 * Use this when you have async functions in tasks, conditions or result wrapper
 *
 * Creates an async serial task function that executes a series of functions in order
 * - all given functions(`options.tasks`) will be called in order
 * - generated task function will have the same length as the first task function
 * - you can appoint generated task function's name by `options.name`
 * - **Strongly Recommended**: all task functions have same input type and output type
 *   - returned function.length will be the same as the first task function's length
 * @param opts Options for creating a serial task, details in `SerialTaskOptions`
 * @returns a funtcion that executes the tasks in order, returns `TaskReturn<OriginalReturn>`
 *
 * __PKG_INFO__
 */
export function createSerialTaskAsync<F extends Fn>(opts: SerialTaskOptions<F>): TaskifyAsync<F> {
  type R = ReturnType<F>;

  const { name, tasks, breakCondition, skipCondition, resultWrapper } = normalize(opts);

  if (tasks.length === 0) {
    const fn = () =>
      ({
        value: undefined,
        results: [],
        trivial: true,
        breakAt: -1,
        skipped: [],
      }) as TaskReturn<undefined>;
    defineProperty(fn, 'name', { value: name, configurable: true });
    return fn as unknown as TaskifyAsync<F>;
  }

  // & creating the task
  const fn = async function (...args: Parameters<F>): Promise<TaskReturn<R>> {
    let last = undefined as R;

    const results = new Array<R>(tasks.length);

    let breakAt = -1;
    const skipped: number[] = [];

    for (let i = 0; i < tasks.length; i++) {
      const task = tasks[i] as F;

      const input = await PromiseTry(resultWrapper, null, task, i, tasks, args, last);

      const toBreak = await PromiseTry(breakCondition, null, task, i, tasks, args, last);
      if (toBreak) {
        breakAt = i;
        break; // end this task
      }

      const toSkip = await PromiseTry(skipCondition, null, task, i, tasks, args, last);
      if (toSkip) {
        skipped.push(i);
        continue; // skip this task
      }

      last = await PromiseTrapply(task, null, input);
      results[i] = last;
    }

    return { value: last, results, trivial: false, breakAt, skipped };
  };

  defineProperty(fn, 'name', { value: name, configurable: true });
  defineProperty(fn, 'length', { value: tasks[0].length, configurable: true });
  return fn;
}
