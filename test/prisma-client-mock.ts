export class PrismaClient {}

export namespace Prisma {
  export type LogLevel = 'query' | 'info' | 'warn' | 'error';
  export type LogDefinition = { emit: 'stdout' | 'event'; level: LogLevel };

  export class PrismaClientKnownRequestError extends Error {
    code: string;
    clientVersion: string;
    meta?: Record<string, unknown>;

    constructor(
      message: string,
      props: { code: string; clientVersion: string; meta?: Record<string, unknown> },
    ) {
      super(message);
      this.code = props.code;
      this.clientVersion = props.clientVersion;
      this.meta = props.meta;
    }
  }
}
