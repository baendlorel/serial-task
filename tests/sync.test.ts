import { expect, describe, it } from 'vitest';
import { createSerialTask } from '../src/serial-task-sync.js';

describe('createSerialTask (Sync)', () => {
  it('should execute tasks in order and return correct result', () => {
    const task1 = (x: number) => x + 1;
    const task2 = (x: number) => x * 2;
    const task3 = (x: number) => x - 1;

    const serialTask = createSerialTask({
      tasks: [task1, task2, task3],
    });

    const result = serialTask(5);

    expect(result.value).toBe(11); // ((5 + 1) * 2) - 1 = 11
    expect(result.results).toEqual([6, 12, 11]);
    expect(result.trivial).toBe(false);
    expect(result.breakAt).toBe(-1);
    expect(result.skipped).toEqual([]);
  });

  it('should handle empty tasks array', () => {
    const serialTask = createSerialTask<() => any>({
      tasks: [],
    });

    const result = serialTask();

    expect(result.value).toBe(undefined);
    expect(result.results).toEqual([]);
    expect(result.trivial).toBe(true);
    expect(result.breakAt).toBe(-1);
    expect(result.skipped).toEqual([]);
  });

  it('should set custom task name', () => {
    const serialTask = createSerialTask({
      name: 'customTask',
      tasks: [(x: number) => x + 1],
    });

    expect(serialTask.name).toBe('customTask');
  });

  it('should set function length based on first task', () => {
    const task1 = (a: number, b: string, c: boolean) => a + 1;
    const task2 = (x: number) => x * 2;

    const serialTask = createSerialTask({
      tasks: [task1, task2],
    });

    expect(serialTask.length).toBe(3); // task1 has 3 parameters
  });

  it('should handle resultWrapper to transform input between tasks', () => {
    const task1 = (x: number) => x + 1;
    const task2 = (x: number) => x * 2;

    const serialTask = createSerialTask({
      tasks: [task1, task2],
      resultWrapper: (task, index, tasks, args, lastReturn) => {
        if (index === 0) {
          return args; // first task gets original args
        }
        return [lastReturn + 10] as [number]; // add 10 to result before passing to next task
      },
    });

    const result = serialTask(5);

    expect(result.value).toBe(32); // (5 + 1 + 10) * 2 = 32
    expect(result.results).toEqual([6, 32]);
  });

  it('should skip tasks when skipCondition returns true', () => {
    const task1 = (x: number) => x + 1;
    const task2 = (x: number) => x * 2;
    const task3 = (x: number) => x - 1;

    const serialTask = createSerialTask({
      tasks: [task1, task2, task3],
      skipCondition: (task, index) => index === 1, // skip task2
    });

    const result = serialTask(5);

    expect(result.value).toBe(5); // (5 + 1) - 1 = 5, task2 skipped
    expect(result.results[0]).toBe(6);
    expect(result.results[1]).toBeUndefined(); // skipped task
    expect(result.results[2]).toBe(5);
    expect(result.skipped).toEqual([1]);
  });

  it('should break when breakCondition returns true', () => {
    const task1 = (x: number) => x + 1;
    const task2 = (x: number) => x * 2;
    const task3 = (x: number) => x - 1;

    const serialTask = createSerialTask({
      tasks: [task1, task2, task3],
      breakCondition: (task, index) => index === 1, // break at task2
    });

    const result = serialTask(5);

    expect(result.value).toBe(6); // only task1 executed
    expect(result.results[0]).toBe(6);
    expect(result.results[1]).toBeUndefined();
    expect(result.results[2]).toBeUndefined();
    expect(result.breakAt).toBe(1);
  });

  it('should handle complex scenarios with multiple conditions', () => {
    const task1 = (x: number) => x + 1;
    const task2 = (x: number) => x * 2;
    const task3 = (x: number) => x + 5;
    const task4 = (x: number) => x - 3;

    const serialTask = createSerialTask({
      tasks: [task1, task2, task3, task4],
      skipCondition: (task, index) => index === 2, // skip task3
      breakCondition: (task, index, tasks, args, lastReturn) => lastReturn > 20,
    });

    const result = serialTask(5);

    expect(result.value).toBe(9); // (5 + 1) * 2 = 12, task3 skipped, task4 executed
    expect(result.results[0]).toBe(6);
    expect(result.results[1]).toBe(12);
    expect(result.results[2]).toBeUndefined(); // skipped
    expect(result.results[3]).toBe(9); // 12 - 3 = 9
    expect(result.skipped).toEqual([2]);
    expect(result.breakAt).toBe(-1);
  });

  it('should handle functions with multiple parameters', () => {
    const task1 = (a: number, b: number) => a + b;
    const task2 = (a: number, b: number) => a * b;

    const serialTask = createSerialTask({
      tasks: [task1, task2],
      resultWrapper: (task, index, tasks, args, lastReturn) => {
        if (index === 0) {
          return args;
        }
        return [lastReturn, 2] as [number, number]; // pass result and 2 to next task
      },
    });

    const result = serialTask(3, 4);

    expect(result.value).toBe(14); // (3 + 4) * 2 = 14
    expect(result.results).toEqual([7, 14]);
  });

  it('should handle single task', () => {
    const task1 = (x: number) => x * 3;

    const serialTask = createSerialTask({
      tasks: [task1],
    });

    const result = serialTask(5);

    expect(result.value).toBe(15);
    expect(result.results).toEqual([15]);
    expect(result.trivial).toBe(false);
  });

  it('should handle task that throws error', () => {
    const task1 = (x: number) => x + 1;
    const task2 = (x: number) => {
      throw new Error('Task failed');
    };
    const task3 = (x: number) => x - 1;

    const serialTask = createSerialTask({
      tasks: [task1, task2, task3],
    });

    expect(() => serialTask(5)).toThrow('Task failed');
  });

  it('should work with different return types in sequence', () => {
    const task1 = (x: number) => x.toString();
    const task2 = (x: string) => x.length;
    const task3 = (x: number) => x > 0;

    const serialTask = createSerialTask({
      tasks: [task1, task2, task3],
    });

    const result = serialTask(123);

    expect(result.value).toBe(true);
    expect(result.results).toEqual(['123', 3, true]);
  });

  it('should handle conditions that depend on lastReturn', () => {
    const increment = (x: number) => x + 1;

    const serialTask = createSerialTask({
      tasks: [increment, increment, increment, increment, increment],
      breakCondition: (task, index, tasks, args, lastReturn) => lastReturn >= 8,
    });

    const result = serialTask(5);

    expect(result.value).toBe(8); // 5 + 1 + 1 + 1 = 8, then break
    expect(result.breakAt).toBe(3);
    expect(result.results.length).toBe(5);
    expect(result.results[0]).toBe(6);
    expect(result.results[1]).toBe(7);
    expect(result.results[2]).toBe(8);
    expect(result.results[3]).toBeUndefined();
    expect(result.results[4]).toBeUndefined();
  });

  it('should handle skipCondition that depends on args', () => {
    const multiply = (x: number) => x * 2;

    const serialTask = createSerialTask({
      tasks: [multiply, multiply, multiply],
      skipCondition: (task, index, tasks, args) => args[0] < 5 && index === 1,
    });

    const result1 = serialTask(3); // should skip second task
    expect(result1.value).toBe(12); // 3 * 2 * 2 = 12 (second multiply skipped)
    expect(result1.skipped).toEqual([1]);

    const result2 = serialTask(6); // should not skip
    expect(result2.value).toBe(48); // 6 * 2 * 2 * 2 = 48
    expect(result2.skipped).toEqual([]);
  });

  it('should allow dynamic task array modification', () => {
    const tasks = [(x: number) => x + 1];

    const serialTask = createSerialTask({
      tasks,
      resultWrapper: (task, index, taskArray, args, lastReturn) => {
        // Add a new task dynamically
        if (index === 0 && taskArray.length === 1) {
          taskArray.push((x: number) => x * 2);
        }
        return index === 0 ? args : ([lastReturn] as [number]);
      },
    });

    const result = serialTask(5);

    expect(result.value).toBe(12); // (5 + 1) * 2 = 12
    expect(result.results).toEqual([6, 12]);
    expect(tasks.length).toBe(2); // task was added
  });

  it('should preserve function name when empty tasks', () => {
    const serialTask = createSerialTask({
      name: 'emptyTask',
      tasks: [],
    });

    expect(serialTask.name).toBe('emptyTask');
  });

  it('should use default name when not specified', () => {
    const serialTask = createSerialTask({
      tasks: [(x: number) => x + 1],
    });

    expect(serialTask.name).toBe('kskbTask');
  });
});
