import Transport = require("winston-transport");

import { CloudWatch, CloudWatchLogs } from "aws-sdk";

type LogObject = { level: string; msg: string; meta?: any };

class WinstonCloudWatch extends Transport {
  kthxbye(callback: () => void): void;
  upload(
    aws: CloudWatchLogs,
    groupName: string,
    streamName: string,
    logEvents: any[],
    retentionInDays: number,
    cb: ((err: Error, data: any) => void)
  ): void;
  getToken(
    aws: CloudWatchLogs,
    groupName: string,
    streamName: string,
    retentionInDays: number,
    cb: ((err: Error, data: string) => void)
  ): void;
  ensureGroupPresent(
    aws: CloudWatchLogs,
    name: string,
    retentionInDays: number,
    cb: ((err: Error, data: boolean) => void)
  ): void;
  getStream(
    aws: CloudWatchLogs,
    groupName: string,
    streamName: string,
    cb: ((
      err: Error,
      data: CloudWatchLogs.Types.DescribeLogStreamsResponse
    ) => void)
  ): void;
  ignoreInProgress(cb: ((err: Error) => void)): void;
  constructor (options?: CloudwatchTransportOptions): WinstonCloudWatch;
}

interface CloudwatchTransportOptions {
  level?: string;
  logGroupName?: string | (() => string);
  logStreamName?: string | (() => string);
  awsAccessKeyId?: string;
  awsSecretKey?: string;
  awsRegion?: string;
  awsOptions?: CloudWatch.Types.ClientConfiguration;
  jsonMessage?: boolean;
  messageFormatter?: (logObject: LogObject) => string;
  proxyServer?: string;
  uploadRate?: number;
  errorHandler?: ((err: Error) => void);
  silent?: boolean;
}

declare module "winston-cloudwatch" {
  export  = WinstonCloudWatch;
}

