import * as winston from "winston";
import * as Transport from "winston-transport";

import { CloudWatch, CloudWatchLogs } from "aws-sdk";

export interface CloudwatchTransportOptions
  extends Transport.TransportStreamOptions {
  level?: string;
  name?: string;
  logGroupName?: string | (() => string);
  logStreamName?: string | (() => string);
  awsAccessKeyId?: string;
  awsSecretKey?: string;
  awsRegion?: string;
  awsOptions?: CloudWatch.Types.ClientConfiguration;
  jsonMessage?: boolean;
  messageFormatter?: (logObject: winston.LogEntry) => string;
  proxyServer?: string;
  uploadRate?: number;
  errorHandler?: ((err: Error) => void);
  retentionInDays?: number;
}

export interface CloudwatchTransportInstance extends Transport {
  new (options?: CloudwatchTransportOptions): CloudwatchTransportInstance;
  kthxbye(cb: (() => void)): void;
}

declare module "winston" {
  export interface Transports {
    CloudWatch: CloudwatchTransportInstance;
  }
}

export const WinstonCloudWatch: CloudwatchTransportInstance;
