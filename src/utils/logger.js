import winston from 'winston';
import config from '../config/index.js';

const { combine, timestamp, printf, colorize, errors } = winston.format;

// Custom format for console output
const consoleFormat = printf(({ level, message, timestamp, stack }) => {
  const ts = timestamp.slice(11, 19); // HH:MM:SS
  return stack 
    ? `${ts} ${level}: ${message}\n${stack}`
    : `${ts} ${level}: ${message}`;
});

// Create logger instance
const logger = winston.createLogger({
  level: config.isProduction ? 'info' : 'debug',
  format: combine(
    errors({ stack: true }),
    timestamp()
  ),
  transports: [
    // Console transport
    new winston.transports.Console({
      format: combine(
        colorize(),
        consoleFormat
      )
    }),
  ],
});

// Add file transport in production
if (config.isProduction) {
  logger.add(new winston.transports.File({ 
    filename: 'logs/error.log', 
    level: 'error',
    format: combine(timestamp(), winston.format.json())
  }));
  logger.add(new winston.transports.File({ 
    filename: 'logs/combined.log',
    format: combine(timestamp(), winston.format.json())
  }));
}

export default logger;
