import { Request, Response, NextFunction } from 'express'

export interface AppError extends Error {
  statusCode?: number
  isOperational?: boolean
}

export function errorHandler(
  err: AppError,
  req: Request,
  res: Response,
  next: NextFunction
): void {
  const statusCode = err.statusCode || 500
  const message = err.message || 'Internal server error'

  // Log all errors in dev, only unexpected ones in prod
  if (process.env.NODE_ENV !== 'production' || !err.isOperational) {
    console.error(`[Error] ${req.method} ${req.path}:`, err)
  }

  res.status(statusCode).json({
    success: false,
    message,
    ...(process.env.NODE_ENV !== 'production' && { stack: err.stack }),
  })
}

export function notFound(req: Request, res: Response): void {
  res.status(404).json({
    success: false,
    message: `Route not found: ${req.method} ${req.path}`,
  })
}

export function createError(message: string, statusCode = 500): AppError {
  const err: AppError = new Error(message)
  err.statusCode = statusCode
  err.isOperational = true
  return err
}
