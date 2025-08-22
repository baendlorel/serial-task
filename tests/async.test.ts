import { expect, describe, it } from 'vitest';
import { createSerialTaskAsync } from '../src/serial-task-async.js';

describe('createSerialTaskAsync (Async)', () => {
  it('should execute async tasks in order and return correct result', async () => {
    const task1 = async (x: number) => x + 1;
    const task2 = async (x: number) => x * 2;
    const task3 = async (x: number) => x - 1;

    const serialTask = createSerialTaskAsync({
      tasks: [task1, task2, task3],
    });

    const result = await serialTask(5);

    expect(result.value).toBe(11); // ((5 + 1) * 2) - 1 = 11
    expect(result.results).toEqual([6, 12, 11]);
    expect(result.trivial).toBe(false);
    expect(result.breakAt).toBe(-1);
    expect(result.skipped).toEqual([]);
  });

  it('should handle mixed sync and async tasks', async () => {
    const task1 = (x: number) => x + 1; // sync
    const task2 = async (x: number) => x * 2; // async
    const task3 = (x: number) => x - 1; // sync

    const serialTask = createSerialTaskAsync({
      tasks: [task1, task2, task3],
    });

    const result = await serialTask(5);

    expect(result.value).toBe(11);
    expect(result.results).toEqual([6, 12, 11]);
  });

  it('should handle empty tasks array', async () => {
    const serialTask = createSerialTaskAsync<() => any>({
      tasks: [],
    });

    const result = await serialTask();

    expect(result.value).toBe(undefined);
    expect(result.results).toEqual([]);
    expect(result.trivial).toBe(true);
    expect(result.breakAt).toBe(-1);
    expect(result.skipped).toEqual([]);
  });

  it('should set custom task name', () => {
    const serialTask = createSerialTaskAsync({
      name: 'customAsyncTask',
      tasks: [async (x: number) => x + 1],
    });

    expect(serialTask.name).toBe('customAsyncTask');
  });

  it('should set function length based on first task', () => {
    const task1 = async (a: number, b: string, c: boolean) => a + 1;
    const task2 = async (x: number) => x * 2;

    const serialTask = createSerialTaskAsync({
      tasks: [task1, task2],
    });

    expect(serialTask.length).toBe(3); // task1 has 3 parameters
  });

  it('should handle sync resultWrapper with async tasks', async () => {
    const task1 = async (x: number) => x + 1;
    const task2 = async (x: number) => x * 2;

    const serialTask = createSerialTaskAsync({
      tasks: [task1, task2],
      resultWrapper: (task, index, tasks, args, lastReturn) => {
        if (index === 0) {
          return args;
        }
        // lastReturn is the actual resolved value in async context
        return [(lastReturn as unknown as number) + 5] as any;
      },
    });

    const result = await serialTask(5);

    expect(result.value).toBe(22); // (5 + 1 + 5) * 2 = 22
    expect(result.results).toEqual([6, 22]);
  });

  it('should skip tasks when sync skipCondition returns true', async () => {
    const task1 = async (x: number) => x + 1;
    const task2 = async (x: number) => x * 2;
    const task3 = async (x: number) => x - 1;

    const serialTask = createSerialTaskAsync({
      tasks: [task1, task2, task3],
      skipCondition: (task, index) => index === 1, // sync skip condition
    });

    const result = await serialTask(5);

    expect(result.value).toBe(5);
    expect(result.skipped).toEqual([1]);
  });

  it('should break when sync breakCondition returns true', async () => {
    const task1 = async (x: number) => x + 1;
    const task2 = async (x: number) => x * 2;
    const task3 = async (x: number) => x - 1;

    const serialTask = createSerialTaskAsync({
      tasks: [task1, task2, task3],
      breakCondition: (task, index) => index === 1, // sync break condition
    });

    const result = await serialTask(5);

    expect(result.value).toBe(6);
    expect(result.breakAt).toBe(1);
  });

  it('should handle task that throws async error', async () => {
    const task1 = async (x: number) => x + 1;
    const task2 = async (x: number) => {
      throw new Error('Async task failed');
    };
    const task3 = async (x: number) => x - 1;

    const serialTask = createSerialTaskAsync({
      tasks: [task1, task2, task3],
    });

    await expect(serialTask(5)).rejects.toThrow('Async task failed');
  });

  it('should handle task that throws sync error', async () => {
    const task1 = async (x: number) => x + 1;
    const task2 = (x: number) => {
      throw new Error('Sync task failed');
    };
    const task3 = async (x: number) => x - 1;

    const serialTask = createSerialTaskAsync({
      tasks: [task1, task2, task3],
    });

    await expect(serialTask(5)).rejects.toThrow('Sync task failed');
  });

  it('should work with promise-returning tasks', async () => {
    const task1 = (x: number) => Promise.resolve(x + 1);
    const task2 = (x: number) => Promise.resolve(x * 2);
    const task3 = (x: number) => Promise.resolve(x - 1);

    const serialTask = createSerialTaskAsync({
      tasks: [task1, task2, task3],
    });

    const result = await serialTask(5);

    expect(result.value).toBe(11);
    expect(result.results).toEqual([6, 12, 11]);
  });

  it('should handle complex async scenarios with multiple conditions', async () => {
    const task1 = async (x: number) => {
      await new Promise((resolve) => setTimeout(resolve, 10));
      return x + 1;
    };
    const task2 = async (x: number) => {
      await new Promise((resolve) => setTimeout(resolve, 5));
      return x * 2;
    };
    const task3 = async (x: number) => x + 5;
    const task4 = async (x: number) => x - 3;

    const serialTask = createSerialTaskAsync({
      tasks: [task1, task2, task3, task4],
      skipCondition: (task, index) => index === 2, // skip task3
    });

    const result = await serialTask(5);

    expect(result.value).toBe(9); // (5 + 1) * 2 = 12, task3 skipped, 12 - 3 = 9
    expect(result.results[0]).toBe(6);
    expect(result.results[1]).toBe(12);
    expect(result.results[2]).toBeUndefined(); // skipped
    expect(result.results[3]).toBe(9);
    expect(result.skipped).toEqual([2]);
    expect(result.breakAt).toBe(-1);
  });

  it('should handle single async task', async () => {
    const task1 = async (x: number) => {
      await new Promise((resolve) => setTimeout(resolve, 10));
      return x * 3;
    };

    const serialTask = createSerialTaskAsync({
      tasks: [task1],
    });

    const result = await serialTask(5);

    expect(result.value).toBe(15);
    expect(result.results).toEqual([15]);
    expect(result.trivial).toBe(false);
  });

  it('should handle conditions that depend on lastReturn value', async () => {
    const increment = async (x: number) => {
      await new Promise((resolve) => setTimeout(resolve, 2));
      return x + 1;
    };

    const serialTask = createSerialTaskAsync({
      tasks: [increment, increment, increment, increment, increment],
      breakCondition: (task, index, tasks, args, lastReturn) => {
        // lastReturn is the actual resolved value, not Promise
        return (lastReturn as unknown as number) >= 8;
      },
    });

    const result = await serialTask(5);

    expect(result.value).toBe(8); // 5 + 1 + 1 + 1 = 8, then break
    expect(result.breakAt).toBe(3);
    expect(result.results.length).toBe(5);
    expect(result.results[0]).toBe(6);
    expect(result.results[1]).toBe(7);
    expect(result.results[2]).toBe(8);
    expect(result.results[3]).toBeUndefined();
    expect(result.results[4]).toBeUndefined();
  });

  it('should handle rejected promises', async () => {
    const task1 = async (x: number) => x + 1;
    const task2 = (x: number) => Promise.reject(new Error('Promise rejected'));
    const task3 = async (x: number) => x - 1;

    const serialTask = createSerialTaskAsync({
      tasks: [task1, task2, task3],
    });

    await expect(serialTask(5)).rejects.toThrow('Promise rejected');
  });

  it('should preserve function name when empty tasks in async', () => {
    const serialTask = createSerialTaskAsync({
      name: 'emptyAsyncTask',
      tasks: [],
    });

    expect(serialTask.name).toBe('emptyAsyncTask');
  });

  it('should use default name when not specified in async', () => {
    const serialTask = createSerialTaskAsync({
      tasks: [async (x: number) => x + 1],
    });

    expect(serialTask.name).toBe('kskbTask');
  });

  it('should handle thenable objects (non-native promises)', async () => {
    const thenable = {
      then: (resolve: (value: number) => void) => {
        setTimeout(() => resolve(42), 10);
      },
    };

    const task1 = (x: number) => x + 1;
    const task2 = () => thenable;
    const task3 = (x: number) => x * 2;

    const serialTask = createSerialTaskAsync({
      tasks: [task1, task2, task3],
    });

    const result = await serialTask(5);

    expect(result.value).toBe(84); // 6 -> 42 -> 84
    expect(result.results).toEqual([6, 42, 84]);
  });

  it('should handle mixed sync/async conditions', async () => {
    const task1 = async (x: number) => x + 1;
    const task2 = (x: number) => x * 2;
    const task3 = async (x: number) => x + 10;

    const serialTask = createSerialTaskAsync({
      tasks: [task1, task2, task3],
      resultWrapper: (task, index, tasks, args, lastReturn) => {
        // sync wrapper
        return index === 0 ? args : ([lastReturn] as any);
      },
      skipCondition: (task, index) => false, // sync skip condition
      breakCondition: (task, index, tasks, args, lastReturn) => {
        // sync break condition
        return (lastReturn as number) > 15;
      },
    });

    const result = await serialTask(5);

    expect(result.value).toBe(22); // (5 + 1) * 2 = 12, then break before task3
    expect(result.results).toEqual([6, 12, 22]);
  });

  it('should handle skipCondition that depends on args', async () => {
    const multiply = async (x: number) => x * 2;

    const serialTask = createSerialTaskAsync({
      tasks: [multiply, multiply, multiply],
      skipCondition: (task, index, tasks, args) => args[0] < 5 && index === 1,
    });

    const result1 = await serialTask(3); // should skip second task
    expect(result1.value).toBe(12); // 3 * 2 * 2 = 12 (second multiply skipped)
    expect(result1.skipped).toEqual([1]);

    const result2 = await serialTask(6); // should not skip
    expect(result2.value).toBe(48); // 6 * 2 * 2 * 2 = 48
    expect(result2.skipped).toEqual([]);
  });

  it('should allow dynamic task array modification', async () => {
    const tasks = [async (x: number) => x + 1];

    const serialTask = createSerialTaskAsync({
      tasks,
      resultWrapper: (task, index, taskArray, args, lastReturn) => {
        // Add a new task dynamically
        if (index === 0 && taskArray.length === 1) {
          taskArray.push(async (x: number) => x * 2);
        }
        return index === 0 ? args : ([lastReturn] as any);
      },
    });

    const result = await serialTask(5);

    expect(result.value).toBe(12); // (5 + 1) * 2 = 12
    expect(result.results).toEqual([6, 12]);
    expect(tasks.length).toBe(2); // task was added
  });

  it('should handle functions with multiple parameters in async context', async () => {
    const task1 = async (a: number, b: number) => a + b;
    const task2 = async (a: number, b: number) => a * b;

    const serialTask = createSerialTaskAsync({
      tasks: [task1, task2],
      resultWrapper: (task, index, tasks, args, lastReturn) => {
        if (index === 0) {
          return args;
        }
        return [lastReturn as unknown as number, 3] as any; // pass result and 3 to next task
      },
    });

    const result = await serialTask(4, 5);

    expect(result.value).toBe(27); // (4 + 5) * 3 = 27
    expect(result.results).toEqual([9, 27]);
  });

  it('should handle async tasks with different return types', async () => {
    const task1 = async (x: number) => x.toString();
    const task2 = async (x: string) => x.length;
    const task3 = async (x: number) => x > 0;

    const serialTask = createSerialTaskAsync({
      tasks: [task1, task2, task3],
    });

    const result = await serialTask(123);

    expect(result.value).toBe(true);
    expect(result.results).toEqual(['123', 3, true]);
  });

  it('should handle simple async error cases', async () => {
    const task1 = async (x: number) => x + 1;
    const task2 = async (x: number) => {
      throw new Error('Simple async error');
    };

    const serialTask = createSerialTaskAsync({
      tasks: [task1, task2],
    });

    await expect(serialTask(5)).rejects.toThrow('Simple async error');
  });
});
