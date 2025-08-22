# Serial Task

[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)

> Put a list of functions in and get a composed task function. Similar to functional programming's compose (function composition), but with more fine-grained and precise control, and the generated task incurs almost no runtime overhead. ✨

**Note**: For async functions, use `createSerialTaskAsync` instead of `createSerialTask`. Both functions have the same API, but `createSerialTaskAsync` properly handles async/await and Promise-based functions.

For more awesome packages, check out [my homepage💛](https://baendlorel.github.io/?repoType=npm)

## 📦 Installation

```bash
npm install serial-task
```

```bash
pnpm add serial-task
```

## 🎯 Quick Start

> Note: For async functions(tasks/resultWrapper/conditions), use `createSerialTaskAsync` instead.

```typescript
import { createSerialTask } from 'serial-task';

// Create a serial task with multiple functions
const mathTask = createSerialTask({
  tasks: [
    (x: number) => x + 1, // Step 1: add 1
    (x: number) => x * 2, // Step 2: multiply by 2
    (x: number) => x - 1, // Step 3: subtract 1
  ],
});

const result = mathTask(5);
console.log(result.value); // 11 -> ((5 + 1) * 2) - 1 = 11
console.log(result.results); // [6, 12, 11]
```

## 🔄 Execution Flow

The following diagram shows how functions are called in each iteration of the loop:

<div style="text-align: center">
  <img src="https://raw.githubusercontent.com/baendlorel/serial-task/main/assets/flow.svg" alt="Execution Flow" width="80%" style="margin-left:10%; border:4px dashed #eee;border-radius:20px"/>
</div>

## 📖 API Reference

### createSerialTask(options) / createSerialTaskAsync(options)

Creates a sync/async serial task function.

#### Parameters

- **options**: `SerialTaskOptions<F>`
  - **name?**: `string` - Name of the generated task function (default: `'kskbTask'`)
  - **tasks**: `F[]` - Array of functions to be executed in order
  - **breakCondition?**: `function` - Function that determines when to break the loop (default: `() => false`)
  - **skipCondition?**: `function` - Function that determines when to skip a task (default: `() => false`)
  - **resultWrapper?**: `function` - Function that transforms input between tasks, default(means the first task gets original args, subsequent tasks get the last return value):
  ```ts
  (_task: Fn, index: number, _tasks: Fn[], args: unknown[], lastReturn: unknown) =>
    index === 0 ? args : [lastReturn];
  ```

#### Returns

A function that executes the tasks in order and returns a `TaskReturn<R>` object:

```typescript
interface TaskReturn<R> {
  value: R; // Result of the last executed task
  results: R[]; // All results (skipped tasks are undefined)
  trivial: boolean; // True if tasks array was empty
  breakAt: number; // Index where loop broke (-1 if not broken)
  skipped: number[]; // Indices of skipped tasks
}
```

## 🎨 Usage Scenarios

### Scenario 1: Function Composition Pipeline

Perfect for data transformation pipelines where you need to apply multiple transformations in sequence:

```typescript
import { createSerialTask } from 'serial-task';

// Data processing pipeline
interface UserData {
  name: string;
  email: string;
  age: number;
}

const processUser = createSerialTask({
  name: 'userProcessor',
  tasks: [
    // Step 1: Validate input
    (user: UserData) => {
      if (!user.email.includes('@')) {
        throw new Error('Invalid email');
      }
      return user;
    },

    // Step 2: Normalize data
    (user: UserData) => ({
      ...user,
      name: user.name.trim().toLowerCase(),
      email: user.email.toLowerCase(),
    }),

    // Step 3: Add computed fields
    (user: UserData) => ({
      ...user,
      isAdult: user.age >= 18,
      displayName: user.name.charAt(0).toUpperCase() + user.name.slice(1),
    }),

    // Step 4: Generate summary
    (user: any) => ({
      ...user,
      summary: `${user.displayName} (${user.email}) - ${user.isAdult ? 'Adult' : 'Minor'}`,
    }),
  ],
});

const result = processUser({
  name: '  John Doe  ',
  email: 'JOHN@EXAMPLE.COM',
  age: 25,
});

console.log(result.value);
// Output: {
//   name: 'john doe',
//   email: 'john@example.com',
//   age: 25,
//   isAdult: true,
//   displayName: 'John doe',
//   summary: 'John doe (john@example.com) - Adult'
// }
```

### Scenario 2: Event Handler Chain with Conditional Logic

Great for building middleware-like handler chains with skip and break logic:

```typescript
import { createSerialTask } from 'serial-task';

interface Request {
  path: string;
  method: string;
  headers: Record<string, string>;
  body?: any;
  metadata?: Record<string, any>;
}

// HTTP request handler chain
const requestHandler = createSerialTask({
  name: 'httpHandler',
  tasks: [
    // Handler 1: Authentication
    (req: Request) => {
      console.log('🔐 Authenticating request...');
      return {
        ...req,
        metadata: { ...req.metadata, authenticated: true, userId: 'user123' },
      };
    },

    // Handler 2: Rate limiting
    (req: Request) => {
      console.log('⏱️ Checking rate limits...');
      return {
        ...req,
        metadata: { ...req.metadata, rateLimited: false },
      };
    },

    // Handler 3: Input validation
    (req: Request) => {
      console.log('✅ Validating input...');
      if (req.method === 'POST' && !req.body) {
        throw new Error('Body required for POST requests');
      }
      return {
        ...req,
        metadata: { ...req.metadata, validated: true },
      };
    },

    // Handler 4: Business logic
    (req: Request) => {
      console.log('🔄 Processing business logic...');
      return {
        ...req,
        metadata: { ...req.metadata, processed: true, result: 'success' },
      };
    },

    // Handler 5: Response formatting
    (req: Request) => {
      console.log('📤 Formatting response...');
      return {
        ...req,
        metadata: { ...req.metadata, formatted: true },
      };
    },
  ],

  // Skip rate limiting for admin users
  skipCondition: (task, index, tasks, args, lastReturn) => {
    if (index === 1) {
      // rate limiting handler
      const req = lastReturn as Request;
      return req.metadata?.userId === 'admin';
    }
    return false;
  },

  // Break early if user is not authenticated
  breakCondition: (task, index, tasks, args, lastReturn) => {
    if (index > 0) {
      // after authentication
      const req = lastReturn as Request;
      return !req.metadata?.authenticated;
    }
    return false;
  },

  // Pass the result to the next handler
  resultWrapper: (task, index, tasks, args, lastReturn) => {
    if (index === 0) {
      return args; // First handler gets original args
    }
    return [...args, lastReturn]; // Subsequent handlers get the result from previous
  },
});

// Example usage
const request: Request = {
  path: '/api/users',
  method: 'GET',
  headers: { Authorization: 'Bearer token123' },
  metadata: {},
};

const result = requestHandler(request);

console.log('Final result:', result.value);
console.log('Skipped handlers:', result.skipped); // e.g., [1] if rate limiting was skipped
console.log('Broke at:', result.breakAt); // -1 if completed successfully

// Example output:
// 🔐 Authenticating request...
// ⏱️ Checking rate limits...
// ✅ Validating input...
// 🔄 Processing business logic...
// 📤 Formatting response...
// Final result: { ... processed request with all metadata ... }
// Skipped handlers: []
// Broke at: -1
```

## 🔧 Advanced Features

### Conditional Execution

Control the flow of your task execution with powerful conditions:

```typescript
const conditionalTask = createSerialTask({
  tasks: [taskA, taskB, taskC, taskD],

  // Skip tasks based on conditions
  skipCondition: (task, index, tasks, args, lastReturn) => {
    // Skip taskB if input is negative
    if (index === 1 && args[0] < 0) return true;
    return false;
  },

  // Break early if result exceeds threshold
  breakCondition: (task, index, tasks, args, lastReturn) => {
    return lastReturn > 100;
  },
});
```

### Dynamic Task Arrays

Modify the task array during execution:

```typescript
const dynamicTask = createSerialTask({
  tasks: [initialTask],
  resultWrapper: (task, index, taskArray, args, lastReturn) => {
    // Add more tasks dynamically
    if (index === 0 && someCondition) {
      taskArray.push(additionalTask);
    }
    return index === 0 ? args : [lastReturn];
  },
});
```

## 🔄 Async Support

For async functions, use `createSerialTaskAsync`:

```typescript
import { createSerialTaskAsync } from 'serial-task';

const asyncTask = createSerialTaskAsync({
  tasks: [
    async (data) => await fetchUserData(data),
    async (user) => await validateUser(user),
    async (user) => await saveUser(user),
  ],
});

const result = await asyncTask(inputData);
```

## 🎪 Error Handling

Tasks can throw errors, which will propagate up and stop execution:

```typescript
const taskWithErrors = createSerialTask({
  tasks: [
    (x) => x + 1,
    (x) => {
      if (x > 10) throw new Error('Value too large!');
      return x * 2;
    },
    (x) => x - 1,
  ],
});

try {
  const result = taskWithErrors(15);
} catch (error) {
  console.error('Task failed:', error.message);
}
```

## 📄 License

MIT
