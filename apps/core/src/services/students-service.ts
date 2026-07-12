import { logger } from "@/utils/logger.ts";
import { UfabcParserConnector } from "@next/connectors/ufabc-parser";
import { FastifyInstance } from "fastify";

type HandleSigaaParams = {
  sessionId: string;
  viewId: string;
  ra: number,
  login: string;
};

export class StudentService {
  private readonly config: FastifyInstance['config'];
  private readonly globalTraceId: string;
  private readonly logger: typeof logger;
  private readonly ufabcParserConnector: UfabcParserConnector
  private readonly db: FastifyInstance['db'];
  
  constructor({
    config,
    globalTraceId,
    db,
  }: {
    config: FastifyInstance['config'];
    globalTraceId: string;
    db: FastifyInstance['db'];
  }) {
    this.config = config;
    this.globalTraceId = globalTraceId;
    this.logger = logger.child({ globalTraceId });
    this.config = config;
    this.ufabcParserConnector = new UfabcParserConnector({
      baseURL: this.config.UFABC_PARSER_URL,
      traceId: this.globalTraceId,
      requesterKey: this.config.UFABC_PARSER_REQUESTER_KEY,
    });
    this.db = db;
  }

  async handleSigaa(params: HandleSigaaParams) {
    
  }
}
