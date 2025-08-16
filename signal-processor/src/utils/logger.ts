/**
 * Logger Utility - Structured logging with Winston
 */

import winston from 'winston';
import { config } from '../config/environment';

const logFormat = winston.format.combine(
  winston.format.timestamp({ format: 'YYYY-MM-DD HH:mm:ss' }),
  winston.format.errors({ stack: true }),
  winston.format.json(),
  winston.format.printf(({ timestamp, level, message, service, ...meta }) => {
    return JSON.stringify({
      timestamp,
      level,
      service,
      message,
      ...meta
    });
  })
);

const createTransports = () => {
  const transports: winston.transport[] = [
    new winston.transports.Console({
      format: winston.format.combine(
        winston.format.colorize(),
        winston.format.simple()
      )
    })
  ];
  
  // Add file transport for production
  if (config.app.nodeEnv === 'production') {
    transports.push(
      new winston.transports.File({
        filename: 'logs/error.log',
        level: 'error',
        format: logFormat
      }),
      new winston.transports.File({
        filename: 'logs/combined.log',
        format: logFormat
      })
    );
  }
  
  return transports;
};

export const createLogger = (service: string) => {
  return winston.createLogger({
    level: config.app.logLevel,
    format: logFormat,
    defaultMeta: { service },
    transports: createTransports(),
    exceptionHandlers: [
      new winston.transports.Console(),
      ...(config.app.nodeEnv === 'production' ? [
        new winston.transports.File({ filename: 'logs/exceptions.log' })
      ] : [])
    ],
    rejectionHandlers: [
      new winston.transports.Console(),
      ...(config.app.nodeEnv === 'production' ? [
        new winston.transports.File({ filename: 'logs/rejections.log' })
      ] : [])
    ]
  });
};

// Global logger instance
export const logger = createLogger('signal-processor');