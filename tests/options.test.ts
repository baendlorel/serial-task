import { expect, describe, it } from 'vitest';
import { createSerialTask } from '../src/serial-task-sync.js';
import { createSerialTaskAsync } from '../src/serial-task-async.js';

describe('Options Validation', () => {
  describe('Common validation for both sync and async', () => {
    it('should throw TypeError when options is not an object', () => {
      expect(() => createSerialTask(null as any)).toThrow(TypeError);
      expect(() => createSerialTask(undefined as any)).toThrow(TypeError);
      expect(() => createSerialTask('string' as any)).toThrow(TypeError);
      expect(() => createSerialTask(123 as any)).toThrow(TypeError);
      expect(() => createSerialTask(true as any)).toThrow(TypeError);
      expect(() => createSerialTask([] as any)).toThrow(TypeError);

      expect(() => createSerialTaskAsync(null as any)).toThrow(TypeError);
      expect(() => createSerialTaskAsync(undefined as any)).toThrow(TypeError);
      expect(() => createSerialTaskAsync('string' as any)).toThrow(TypeError);
      expect(() => createSerialTaskAsync(123 as any)).toThrow(TypeError);
      expect(() => createSerialTaskAsync(true as any)).toThrow(TypeError);
      expect(() => createSerialTaskAsync([] as any)).toThrow(TypeError);
    });

    it('should throw TypeError when options is null', () => {
      expect(() => createSerialTask(null as any)).toThrow(TypeError);
      expect(() => createSerialTask(null as any)).toThrow("options' must be an object");

      expect(() => createSerialTaskAsync(null as any)).toThrow(TypeError);
      expect(() => createSerialTaskAsync(null as any)).toThrow("options' must be an object");
    });

    it('should throw TypeError when name is not a string', () => {
      expect(() =>
        createSerialTask({
          name: 123 as any,
          tasks: [() => 1],
        })
      ).toThrow(TypeError);
      expect(() =>
        createSerialTask({
          name: 123 as any,
          tasks: [() => 1],
        })
      ).toThrow("name' must be a string or omitted");

      expect(() =>
        createSerialTask({
          name: null as any,
          tasks: [() => 1],
        })
      ).toThrow(TypeError);

      expect(() =>
        createSerialTask({
          name: {} as any,
          tasks: [() => 1],
        })
      ).toThrow(TypeError);

      expect(() =>
        createSerialTask({
          name: [] as any,
          tasks: [() => 1],
        })
      ).toThrow(TypeError);

      // Same for async
      expect(() =>
        createSerialTaskAsync({
          name: 123 as any,
          tasks: [() => 1],
        })
      ).toThrow(TypeError);
    });

    it('should allow valid string names', () => {
      expect(() =>
        createSerialTask({
          name: 'validName',
          tasks: [() => 1],
        })
      ).not.toThrow();

      expect(() =>
        createSerialTask({
          name: '',
          tasks: [() => 1],
        })
      ).not.toThrow();

      expect(() =>
        createSerialTaskAsync({
          name: 'validAsyncName',
          tasks: [() => 1],
        })
      ).not.toThrow();
    });

    it('should allow omitted name (use default)', () => {
      expect(() =>
        createSerialTask({
          tasks: [() => 1],
        })
      ).not.toThrow();

      expect(() =>
        createSerialTaskAsync({
          tasks: [() => 1],
        })
      ).not.toThrow();
    });

    it('should throw TypeError when tasks is not an array', () => {
      expect(() =>
        createSerialTask({
          tasks: null as any,
        })
      ).toThrow(TypeError);
      expect(() =>
        createSerialTask({
          tasks: null as any,
        })
      ).toThrow("tasks' must be a function array");

      expect(() =>
        createSerialTask({
          tasks: undefined as any,
        })
      ).toThrow(TypeError);

      expect(() =>
        createSerialTask({
          tasks: 'string' as any,
        })
      ).toThrow(TypeError);

      expect(() =>
        createSerialTask({
          tasks: 123 as any,
        })
      ).toThrow(TypeError);

      expect(() =>
        createSerialTask({
          tasks: {} as any,
        })
      ).toThrow(TypeError);

      // Same for async
      expect(() =>
        createSerialTaskAsync({
          tasks: null as any,
        })
      ).toThrow(TypeError);
    });

    it('should throw TypeError when tasks array contains non-functions', () => {
      expect(() =>
        createSerialTask({
          tasks: [null] as any,
        })
      ).toThrow(TypeError);
      expect(() =>
        createSerialTask({
          tasks: [null] as any,
        })
      ).toThrow("tasks' must be a function array");

      expect(() =>
        createSerialTask({
          tasks: [undefined] as any,
        })
      ).toThrow(TypeError);

      expect(() =>
        createSerialTask({
          tasks: ['string'] as any,
        })
      ).toThrow(TypeError);

      expect(() =>
        createSerialTask({
          tasks: [123] as any,
        })
      ).toThrow(TypeError);

      expect(() =>
        createSerialTask({
          tasks: [{}] as any,
        })
      ).toThrow(TypeError);

      expect(() =>
        createSerialTask({
          tasks: [() => 1, null, () => 2] as any,
        })
      ).toThrow(TypeError);

      expect(() =>
        createSerialTask({
          tasks: [() => 1, 'string', () => 2] as any,
        })
      ).toThrow(TypeError);

      // Same for async
      expect(() =>
        createSerialTaskAsync({
          tasks: [null] as any,
        })
      ).toThrow(TypeError);

      expect(() =>
        createSerialTaskAsync({
          tasks: [() => 1, 'invalid', () => 2] as any,
        })
      ).toThrow(TypeError);
    });

    it('should allow empty tasks array', () => {
      expect(() =>
        createSerialTask({
          tasks: [],
        })
      ).not.toThrow();

      expect(() =>
        createSerialTaskAsync({
          tasks: [],
        })
      ).not.toThrow();
    });

    it('should allow valid function arrays', () => {
      expect(() =>
        createSerialTask({
          tasks: [() => 1],
        })
      ).not.toThrow();

      expect(() =>
        createSerialTask({
          tasks: [
            () => 1,
            (x: number) => x * 2,
            function named() {
              return 3;
            },
          ],
        })
      ).not.toThrow();

      expect(() =>
        createSerialTaskAsync({
          tasks: [async () => 1, () => 2],
        })
      ).not.toThrow();
    });

    it('should throw TypeError when breakCondition is not a function', () => {
      expect(() =>
        createSerialTask({
          tasks: [() => 1],
          breakCondition: null as any,
        })
      ).toThrow(TypeError);
      expect(() =>
        createSerialTask({
          tasks: [() => 1],
          breakCondition: null as any,
        })
      ).toThrow("breakCondition' must be a function or omitted");

      expect(() =>
        createSerialTask({
          tasks: [() => 1],
          breakCondition: 'string' as any,
        })
      ).toThrow(TypeError);

      expect(() =>
        createSerialTask({
          tasks: [() => 1],
          breakCondition: 123 as any,
        })
      ).toThrow(TypeError);

      expect(() =>
        createSerialTask({
          tasks: [() => 1],
          breakCondition: {} as any,
        })
      ).toThrow(TypeError);

      expect(() =>
        createSerialTask({
          tasks: [() => 1],
          breakCondition: [] as any,
        })
      ).toThrow(TypeError);

      // Same for async
      expect(() =>
        createSerialTaskAsync({
          tasks: [() => 1],
          breakCondition: null as any,
        })
      ).toThrow(TypeError);
    });

    it('should allow valid breakCondition functions', () => {
      expect(() =>
        createSerialTask({
          tasks: [() => 1],
          breakCondition: () => false,
        })
      ).not.toThrow();

      expect(() =>
        createSerialTask({
          tasks: [() => 1],
          breakCondition: function () {
            return false;
          },
        })
      ).not.toThrow();

      // For async, we test sync functions since async validation requires more complex setup
      expect(() =>
        createSerialTaskAsync({
          tasks: [() => 1],
          breakCondition: () => false, // sync function in async context
        })
      ).not.toThrow();
    });

    it('should allow omitted breakCondition (use default)', () => {
      expect(() =>
        createSerialTask({
          tasks: [() => 1],
        })
      ).not.toThrow();

      expect(() =>
        createSerialTaskAsync({
          tasks: [() => 1],
        })
      ).not.toThrow();
    });

    it('should throw TypeError when skipCondition is not a function', () => {
      expect(() =>
        createSerialTask({
          tasks: [() => 1],
          skipCondition: null as any,
        })
      ).toThrow(TypeError);
      expect(() =>
        createSerialTask({
          tasks: [() => 1],
          skipCondition: null as any,
        })
      ).toThrow("skipCondition' must be a function or omitted");

      expect(() =>
        createSerialTask({
          tasks: [() => 1],
          skipCondition: 'string' as any,
        })
      ).toThrow(TypeError);

      expect(() =>
        createSerialTask({
          tasks: [() => 1],
          skipCondition: 123 as any,
        })
      ).toThrow(TypeError);

      expect(() =>
        createSerialTask({
          tasks: [() => 1],
          skipCondition: {} as any,
        })
      ).toThrow(TypeError);

      // Same for async
      expect(() =>
        createSerialTaskAsync({
          tasks: [() => 1],
          skipCondition: null as any,
        })
      ).toThrow(TypeError);
    });

    it('should allow valid skipCondition functions', () => {
      expect(() =>
        createSerialTask({
          tasks: [() => 1],
          skipCondition: () => false,
        })
      ).not.toThrow();

      expect(() =>
        createSerialTask({
          tasks: [() => 1],
          skipCondition: function () {
            return false;
          },
        })
      ).not.toThrow();

      // For async, we test sync functions since async validation requires more complex setup
      expect(() =>
        createSerialTaskAsync({
          tasks: [() => 1],
          skipCondition: () => false, // sync function in async context
        })
      ).not.toThrow();
    });

    it('should allow omitted skipCondition (use default)', () => {
      expect(() =>
        createSerialTask({
          tasks: [() => 1],
        })
      ).not.toThrow();

      expect(() =>
        createSerialTaskAsync({
          tasks: [() => 1],
        })
      ).not.toThrow();
    });

    it('should throw TypeError when resultWrapper is not a function', () => {
      expect(() =>
        createSerialTask({
          tasks: [() => 1],
          resultWrapper: null as any,
        })
      ).toThrow(TypeError);
      expect(() =>
        createSerialTask({
          tasks: [() => 1],
          resultWrapper: null as any,
        })
      ).toThrow("resultWrapper' must be a function or omitted");

      expect(() =>
        createSerialTask({
          tasks: [() => 1],
          resultWrapper: 'string' as any,
        })
      ).toThrow(TypeError);

      expect(() =>
        createSerialTask({
          tasks: [() => 1],
          resultWrapper: 123 as any,
        })
      ).toThrow(TypeError);

      expect(() =>
        createSerialTask({
          tasks: [() => 1],
          resultWrapper: {} as any,
        })
      ).toThrow(TypeError);

      // Same for async
      expect(() =>
        createSerialTaskAsync({
          tasks: [() => 1],
          resultWrapper: null as any,
        })
      ).toThrow(TypeError);
    });

    it('should allow valid resultWrapper functions', () => {
      expect(() =>
        createSerialTask({
          tasks: [(x: number) => x + 1],
          resultWrapper: (task, index, tasks, args, lastReturn) => args,
        })
      ).not.toThrow();

      expect(() =>
        createSerialTask({
          tasks: [(x: number) => x + 1],
          resultWrapper: function (task, index, tasks, args, lastReturn) {
            return args;
          },
        })
      ).not.toThrow();

      // For async, test basic functionality without complex types
      expect(() =>
        createSerialTaskAsync({
          tasks: [(x: number) => x + 1],
          resultWrapper: (task, index, tasks, args, lastReturn) => args,
        })
      ).not.toThrow();
    });

    it('should allow omitted resultWrapper (use default)', () => {
      expect(() =>
        createSerialTask({
          tasks: [() => 1],
        })
      ).not.toThrow();

      expect(() =>
        createSerialTaskAsync({
          tasks: [() => 1],
        })
      ).not.toThrow();
    });

    it('should handle complex validation scenarios', () => {
      // Multiple invalid options at once
      expect(() =>
        createSerialTask({
          name: 123 as any,
          tasks: ['not a function'] as any,
          breakCondition: 'not a function' as any,
        })
      ).toThrow(TypeError);

      // The first error should be about name
      try {
        createSerialTask({
          name: 123 as any,
          tasks: ['not a function'] as any,
          breakCondition: 'not a function' as any,
        });
      } catch (error: any) {
        expect(error.message).toContain("name' must be a string or omitted");
      }
    });

    it('should validate tasks before other options', () => {
      // When tasks is invalid, it should throw about tasks first
      try {
        createSerialTask({
          tasks: 'invalid' as any,
          breakCondition: 'also invalid' as any,
        });
      } catch (error: any) {
        expect(error.message).toContain("tasks' must be a function array");
      }
    });

    it('should work with minimal valid options', () => {
      const task = createSerialTask({ tasks: [] });
      expect(task.name).toBe('kskbTask'); // default name

      const asyncTask = createSerialTaskAsync({ tasks: [] });
      expect(asyncTask.name).toBe('kskbTask'); // default name
    });

    it('should work with all valid options provided', () => {
      const options = {
        name: 'customTask',
        tasks: [(x: number) => x + 1, (x: number) => x * 2],
        breakCondition: () => false,
        skipCondition: () => false,
        resultWrapper: (task: any, index: any, tasks: any, args: any, lastReturn: any) => args,
      };

      expect(() => createSerialTask(options as any)).not.toThrow();
      expect(() => createSerialTaskAsync(options as any)).not.toThrow();

      const task = createSerialTask(options as any);
      expect(task.name).toBe('customTask');
      expect(task.length).toBe(1); // first task has 1 parameter

      const asyncTask = createSerialTaskAsync(options as any);
      expect(asyncTask.name).toBe('customTask');
      expect(asyncTask.length).toBe(1);
    });

    it('should handle arrow functions, function expressions, and named functions in tasks', () => {
      const arrowFunc = (x: number) => x + 1;
      const funcExpression = function (x: number) {
        return x * 2;
      };
      function namedFunc(x: number) {
        return x - 1;
      }

      expect(() =>
        createSerialTask({
          tasks: [arrowFunc, funcExpression, namedFunc],
        })
      ).not.toThrow();

      expect(() =>
        createSerialTaskAsync({
          tasks: [arrowFunc, funcExpression, namedFunc],
        })
      ).not.toThrow();
    });

    it('should handle class methods and bound functions', () => {
      class TestClass {
        value = 10;
        method(x: number) {
          return x + this.value;
        }
      }

      const instance = new TestClass();
      const boundMethod = instance.method.bind(instance);

      expect(() =>
        createSerialTask({
          tasks: [boundMethod],
        })
      ).not.toThrow();

      expect(() =>
        createSerialTaskAsync({
          tasks: [boundMethod],
        })
      ).not.toThrow();
    });
  });

  describe('Edge cases and boundary conditions', () => {
    it('should handle very long task arrays', () => {
      const tasks = Array(1000)
        .fill(0)
        .map(() => (x: number) => x + 1);

      expect(() => createSerialTask({ tasks })).not.toThrow();
      expect(() => createSerialTaskAsync({ tasks })).not.toThrow();
    });

    it('should handle unicode and special characters in name', () => {
      expect(() =>
        createSerialTask({
          name: '测试任务',
          tasks: [() => 1],
        })
      ).not.toThrow();

      expect(() =>
        createSerialTask({
          name: '🚀 rocket task 🚀',
          tasks: [() => 1],
        })
      ).not.toThrow();

      expect(() =>
        createSerialTask({
          name: 'task-with-special-chars_123!@#',
          tasks: [() => 1],
        })
      ).not.toThrow();
    });

    it('should handle function objects with additional properties', () => {
      function taskWithProps(x: number) {
        return x + 1;
      }
      (taskWithProps as any).customProp = 'custom';

      expect(() =>
        createSerialTask({
          tasks: [taskWithProps],
        })
      ).not.toThrow();
    });

    it('should validate options object with prototype pollution attempts', () => {
      const maliciousOptions = Object.create(null);
      maliciousOptions.tasks = [() => 1];

      expect(() => createSerialTask(maliciousOptions)).not.toThrow();
    });
  });
});
