import { PrismaClient } from '@prisma/client';

declare global {
  var __prisma: PrismaClient | undefined;
}

// Function to create a proxy for the PrismaClient that handles errors gracefully
function createPrismaClientProxy() {
  try {
    const client = new PrismaClient({
      log: process.env.NODE_ENV === 'development' ? ['query', 'error', 'warn'] : ['error'],
    });

    // Test the connection
    client.$connect()
      .then(() => console.log('Database connection established'))
      .catch(e => console.error('Failed to connect to database:', e));

    // Create a proxy that catches errors
    return new Proxy(client, {
      get: (target, prop) => {
        const value = (target as any)[prop];

        // If the model accessor doesn't exist (undefined), fall back to an empty model proxy
        const isModelAccessor = !prop.toString().startsWith('$');
        const modelObj = (typeof value === 'object' && value !== null) || typeof value === 'undefined'
          ? (value ?? createEmptyModelProxy())
          : value;

        // Handle methods like prisma.user, prisma.class, etc.
        if (isModelAccessor && modelObj && typeof modelObj === 'object') {
          return new Proxy(modelObj, {
            get: (modelTarget, modelProp) => {
              const modelMethod = (modelTarget as any)[modelProp];
              // Handle methods like findMany, findUnique, etc.
              if (typeof modelMethod === 'function') {
                return (...args: any[]) => {
                  try {
                    return modelMethod.apply(modelTarget, args);
                  } catch (error) {
                    console.error(`Error executing prisma.${String(prop)}.${String(modelProp)}:`, error);
                    // Return empty result based on common methods
                    if (modelProp === 'findMany') return [];
                    if (modelProp === 'count') return 0;
                    return null;
                  }
                };
              }
              return modelMethod;
            }
          });
        }

        // Handle direct methods on prisma
        if (typeof value === 'function') {
          return (...args: any[]) => {
            try {
              return value.apply(target, args);
            } catch (error) {
              console.error(`Error executing prisma.${String(prop)}:`, error);
              return null;
            }
          };
        }

        return value;
      }
    });
  } catch (error) {
    console.error('Error initializing Prisma client:', error);
    
    // Return a mock client with methods that return empty results
    return {
      $connect: () => Promise.resolve(),
      $disconnect: () => Promise.resolve(),
      user: createEmptyModelProxy(),
      classRoom: createEmptyModelProxy(),
      student: createEmptyModelProxy(),
      teacher: createEmptyModelProxy(),
      parent: createEmptyModelProxy(),
      event: createEmptyModelProxy(),
      assignment: createEmptyModelProxy(),
      exam: createEmptyModelProxy(),
    } as unknown as PrismaClient;
  }
}

// Helper to create empty model proxies
function createEmptyModelProxy() {
  return {
    findUnique: () => Promise.resolve(null),
    findFirst: () => Promise.resolve(null),
    findMany: () => Promise.resolve([]),
    create: () => Promise.resolve({}),
    update: () => Promise.resolve({}),
    delete: () => Promise.resolve({}),
    count: () => Promise.resolve(0),
  };
}

// Use existing instance if available or create a new one
export const prisma = globalThis.__prisma ?? createPrismaClientProxy();

// Save reference in development to prevent multiple instances
if (process.env.NODE_ENV !== 'production') {
  globalThis.__prisma = prisma;
}
