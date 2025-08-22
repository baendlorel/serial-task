import { expect, describe, it } from 'vitest';
import { createSerialTask } from '../src/serial-task-sync.js';

describe('scenarios ', () => {
  it('Function Composition Pipeline', () => {
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
    expect(result.value).toEqual({
      name: 'john doe',
      email: 'john@example.com',
      age: 25,
      isAdult: true,
      displayName: 'John doe',
      summary: 'John doe (john@example.com) - Adult',
    });
  });

  it('Event Handler Chain with Conditional Logic', () => {
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
    expect(result.breakAt).toBe(2);
  });
});
