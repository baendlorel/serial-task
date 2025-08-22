/* eslint-disable @typescript-eslint/no-explicit-any */
import { defineProperty } from './common.js';
import './promise-try.js';
import { PromiseTrapply, PromiseTry } from './promise-try.js';

/**
 * Creates a serial task that executes a series of functions in order.
 * - **Strongly Recommended**: all task functions must have same input type and output type
 *   - returned function.length will be the same as the first task function's length
 * @param opts Options for creating a serial task, details in `SerialTaskOptions`
 * @returns a funtcion that executes the tasks in order, returns `TaskReturn<OriginalReturn>`
 */
export function createSerialTask<F extends Fn>(opts: SerialTaskOptions<F>): Taskify<F> {
  type R = ReturnType<F>;

  const {
    name = '',
    tasks: tks,
    breakCondition: rawBreaker,
    skipCondition: rawSkipper,
    resultWrapper: rawResWrapper,
  } = opts;

  if (tks.length === 0) {
    const fn = () => ({ value: null, results: [], trivial: true } as TaskReturn<null>);
    defineProperty(fn, 'name', { value: name, configurable: true });
    return fn as unknown as Taskify<F>;
  }

  const tasks = tks.slice();

  // & creating the task
  const fn = async function (...args: Parameters<F>): Promise<TaskReturn<R>> {
    let last = null as R;
    const results = new Array<R>(tasks.length);
    for (let i = 0; i < tasks.length; i++) {
      const input = await PromiseTry(resultWrapper, null, tasks[i], i, tasks, args, last);

      const toBreak = await PromiseTry(breakCondition, null, tasks[i], i, tasks, args, last);
      if (toBreak) {
        break; // end this task
      }

      const toSkip = await PromiseTry(skipCondition, null, tasks[i], i, tasks, args, last);
      if (toSkip) {
        continue; // skip this task
      }

      last = await PromiseTrapply(tasks[i], null, input);
      results[i] = last;
    }

    return { value: last, results, trivial: false };
  };

  defineProperty(fn, 'name', { value: name, configurable: true });
  defineProperty(fn, 'length', { value: tasks[0].length, configurable: true });
  return fn;
}
