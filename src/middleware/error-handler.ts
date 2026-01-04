import { Context } from "hono";
import { HTTPException } from "hono/http-exception";

export class AppError extends Error {
  constructor(
    public message: string,
    public statusCode: number = 500,
    public details?: any
  ) {
    super(message);
    this.name = "AppError";
  }
}

export const errorHandler = (err: Error, c: Context) => {
  console.error(`[Error] ${err.name}: ${err.message}`);

  if (err instanceof AppError) {
    return c.json(
      {
        success: false,
        message: err.message,
        details: err.details,
      },
      err.statusCode as any
    );
  }

  if (err instanceof HTTPException) {
    return c.json(
      {
        success: false,
        message: err.message,
      },
      err.status as any
    );
  }

  // Erreur par défaut
  return c.json(
    {
      success: false,
      message: process.env.NODE_ENV === "production" 
        ? "Une erreur interne est survenue" 
        : err.message,
    },
    500
  );
};
