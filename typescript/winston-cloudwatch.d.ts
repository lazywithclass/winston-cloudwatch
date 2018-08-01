import * as winston from "winston";
import * as Transport from "winston-transport";

import { CloudWatch, CloudWatchLogs } from "aws-sdk";

declare module WinstonCloudWatch {
  interface CloudwatchTransportOptions
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
}

declare class WinstonCloudWatch extends Transport {
  constructor(options?: WinstonCloudWatch.CloudwatchTransportOptions);
  kthxbye(cb: (() => void)): void;
}

declare module "winston" {
  export interface Transports {
    CloudWatch: WinstonCloudWatch;
  }
}

export = WinstonCloudWatch;