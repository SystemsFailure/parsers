import { Logger } from '@nestjs/common';
import { WinstonModule, utilities } from 'nest-winston';
import * as winston from 'winston';

export const createLogger = (props: { env: 'dev' | 'prod'; name: string }) => {
  if (props.env === 'dev') {
    return new Logger('Main');
  }
  if (props.env === 'prod') {
    const maxChars = 2_00_000;
    const flowProgramLogsFiles = 3;

    return WinstonModule.createLogger({
      transports: [
        new winston.transports.File({
          dirname: './logs',
          filename: `${props.name}-full.log`,
          maxFiles: flowProgramLogsFiles,
          maxsize: maxChars,
          level: 'info',
          format: winston.format.combine(
            winston.format.timestamp(),
            winston.format.ms(),
            utilities.format.nestLike('', {
              prettyPrint: true,
            }),
          ),
        }),
        new winston.transports.File({
          dirname: './logs',
          filename: `${props.name}-full.log`,
          maxFiles: flowProgramLogsFiles,
          maxsize: maxChars,
          level: 'warn',
          format: winston.format.combine(
            winston.format.timestamp(),
            winston.format.ms(),
            utilities.format.nestLike('', {
              prettyPrint: true,
            }),
          ),
        }),
        new winston.transports.File({
          dirname: './logs',
          filename: `${props.name}-full.log`,
          maxFiles: flowProgramLogsFiles,
          maxsize: maxChars,
          level: 'error',
          format: winston.format.combine(
            winston.format.timestamp(),
            winston.format.ms(),
            utilities.format.nestLike('', {
              prettyPrint: true,
            }),
          ),
        }),
        new winston.transports.File({
          dirname: './logs',
          filename: `${props.name}-debug.log`,
          maxFiles: 2,
          maxsize: 7_000_000,
          level: 'debug',
        }),
      ],
    });
  }
};
