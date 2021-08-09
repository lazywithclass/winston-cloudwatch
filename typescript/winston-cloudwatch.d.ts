import TransportStream = require("winston-transport");

import { CloudWatch, CloudWatchLogs } from "aws-sdk";

import winston = require('winston');

// Declare the default WinstonCloudwatch class
declare class WinstonCloudwatch extends TransportStream {
  kthxbye(callback: () => void): void;
  upload(
    aws: CloudWatchLogs,
    groupName: string,
    streamName: string,
    logEvents: any[],
    retentionInDays: number,
    options: WinstonCloudwatch.CloudwatchTransportOptions,
    cb: ((err: Error, data: any) => void)
  ): void;
  getToken(
    aws: CloudWatchLogs,
    groupName: string,
    streamName: string,
    retentionInDays: number,
    options: WinstonCloudwatch.CloudwatchTransportOptions,
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
  constructor (options?: WinstonCloudwatch.CloudwatchTransportOptions);
}
// Export the default winston cloudwatch class
export = WinstonCloudwatch;

// Declare optional exports
declare namespace WinstonCloudwatch {

  export type LogObject = winston.LogEntry;

  export interface CloudwatchTransportOptions {
    name: string;
    cloudWatchLogs?: CloudWatchLogs;
    level?: string;
    ensureLogGroup?: boolean;
    ignoreDataAlreadyAcceptedException?: boolean;
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
    retentionInDays?: number;
  }
}
