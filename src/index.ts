import { createSerialTaskAsync } from './serial-task-async.js';
import { createSerialTask } from './serial-task-sync.js';

if (typeof __IS_DEV__ === 'undefined') {
  Reflect.set(globalThis, '__IS_DEV__', true);
}

export { createSerialTask, createSerialTaskAsync };
