declare namespace Express {
    export interface Request {
      user?: { sub: string; [key: string]: any }; // Define the user property based on our JWT payload
    }
  } 