import 'express';

declare global {
  namespace Express {
    interface Request {
      requestId?: string;
    }
    
    interface Response {
      locals: {
        requestId?: string;
        [key: string]: unknown;
      };
    }
  }
}

export {};