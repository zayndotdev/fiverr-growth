import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";
import { Request, Response, NextFunction } from "express";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const LOGS_DIR = path.resolve(__dirname, "../../logs");
const LOG_FILE = path.join(LOGS_DIR, "activity.log");

// Ensure logs directory exists
if (!fs.existsSync(LOGS_DIR)) {
  try {
    fs.mkdirSync(LOGS_DIR, { recursive: true });
  } catch (err) {
    console.warn("Could not create logs directory:", err);
  }
}

// ANSI Color Codes for terminal
const colors = {
  reset: "\x1b[0m",
  bold: "\x1b[1m",
  dim: "\x1b[2m",
  red: "\x1b[31m",
  green: "\x1b[32m",
  yellow: "\x1b[33m",
  blue: "\x1b[34m",
  magenta: "\x1b[35m",
  cyan: "\x1b[36m",
  white: "\x1b[37m",
  gray: "\x1b[90m",
};

export type LogLevel = "INFO" | "SUCCESS" | "WARN" | "ERROR";

export type LogCategory =
  | "HTTP"
  | "AGENT_SCRAPER"
  | "AGENT_ICP"
  | "AGENT_STRATEGIST"
  | "AGENT_COMPETITOR"
  | "AGENT_BRIEFS"
  | "AGENT_GIG_STUDIO"
  | "AGENT_IMAGE_GENERATOR"
  | "AUTH"
  | "SYSTEM";

export interface LogEntry {
  id: string;
  timestamp: string;
  category: LogCategory;
  agentName?: string;
  level: LogLevel;
  message: string;
  details?: any;
  durationMs?: number;
}

export interface AgentHealthStatus {
  agentKey: string;
  name: string;
  status: "idle" | "active" | "healthy" | "warning" | "error";
  lastActionTime: string | null;
  totalOperations: number;
  errorCount: number;
  lastMessage: string;
}

class Logger {
  private memoryLogs: LogEntry[] = [];
  private readonly maxMemoryLogs = 1000;
  private agentHealthMap: Map<string, AgentHealthStatus> = new Map();

  constructor() {
    this.initializeAgentHealth();
  }

  private initializeAgentHealth() {
    const defaultAgents = [
      { key: "AGENT_SCRAPER", name: "Fiverr Scraper Agent" },
      { key: "AGENT_ICP", name: "Gemini ICP Strategist" },
      { key: "AGENT_STRATEGIST", name: "Growth Strategist Agent" },
      { key: "AGENT_COMPETITOR", name: "Competitor Radar Agent" },
      { key: "AGENT_BRIEFS", name: "Buyer Briefs Closer" },
      { key: "AGENT_GIG_STUDIO", name: "Gig Studio Architect" },
      { key: "AGENT_IMAGE_GENERATOR", name: "Gig Visual Design Agent" },
    ];

    for (const ag of defaultAgents) {
      this.agentHealthMap.set(ag.key, {
        agentKey: ag.key,
        name: ag.name,
        status: "healthy",
        lastActionTime: null,
        totalOperations: 0,
        errorCount: 0,
        lastMessage: "Agent initialized and standing by.",
      });
    }
  }

  private writeToFile(line: string) {
    try {
      const cleanLine = line.replace(/\x1b\[[0-9;]*m/g, ""); // strip ANSI colors
      fs.appendFileSync(LOG_FILE, cleanLine + "\n", "utf-8");
    } catch {
      // ignore disk write errors
    }
  }

  private timestamp(): string {
    return new Date().toISOString();
  }

  private pushLog(entry: LogEntry) {
    this.memoryLogs.push(entry);
    if (this.memoryLogs.length > this.maxMemoryLogs) {
      this.memoryLogs.shift();
    }
  }

  /**
   * Universal Agent Logging Method
   */
  public agentLog(
    category: LogCategory,
    agentName: string,
    level: LogLevel,
    message: string,
    details?: any,
    durationMs?: number
  ) {
    const time = this.timestamp();
    const id = `log_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`;

    const entry: LogEntry = {
      id,
      timestamp: time,
      category,
      agentName,
      level,
      message,
      details,
      durationMs,
    };

    this.pushLog(entry);

    // Update agent health stats
    const health = this.agentHealthMap.get(category);
    if (health) {
      health.totalOperations += 1;
      health.lastActionTime = time;
      health.lastMessage = message;
      if (level === "ERROR") {
        health.errorCount += 1;
        health.status = "error";
      } else if (level === "WARN") {
        health.status = "warning";
      } else {
        health.status = "active";
      }
    }

    // Terminal output
    const levelColor =
      level === "SUCCESS"
        ? colors.green
        : level === "WARN"
        ? colors.yellow
        : level === "ERROR"
        ? colors.red
        : colors.cyan;

    const formatted = `[${colors.gray}${time.substring(11, 19)}${colors.reset}] [${levelColor}${category}${colors.reset}] [${colors.bold}${agentName}${colors.reset}] ${message}${
      durationMs ? ` ${colors.dim}(${durationMs}ms)${colors.reset}` : ""
    }`;

    console.log(formatted);
    this.writeToFile(formatted);
  }

  public http(method: string, url: string, status: number, durationMs: number, bodySummary?: string) {
    const time = this.timestamp();
    const statusColor = status < 300 ? colors.green : status < 400 ? colors.yellow : colors.red;
    const methodColor = method === "GET" ? colors.blue : method === "POST" ? colors.green : colors.yellow;
    const level: LogLevel = status < 400 ? "INFO" : status < 500 ? "WARN" : "ERROR";

    this.pushLog({
      id: `http_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`,
      timestamp: time,
      category: "HTTP",
      agentName: "API Gateway",
      level,
      message: `${method} ${url} -> ${status} (${durationMs}ms)`,
      details: bodySummary ? { body: bodySummary } : undefined,
      durationMs,
    });

    const formatted = `[${colors.gray}${time.substring(11, 19)}${colors.reset}] [${colors.cyan}HTTP${colors.reset}] ${methodColor}${method.padEnd(6)}${colors.reset} ${url.padEnd(32)} ${statusColor}${status}${colors.reset} ${colors.dim}(${durationMs}ms)${colors.reset}${bodySummary ? ` - ${colors.gray}${bodySummary}${colors.reset}` : ""}`;
    console.log(formatted);
    this.writeToFile(formatted);
  }

  public auth(action: string, details: string) {
    this.agentLog("AUTH", "Auth Engine", "INFO", `${action} -> ${details}`);
  }

  public strategist(action: string, details: string) {
    this.agentLog("AGENT_STRATEGIST", "Growth Strategist Agent", "INFO", `${action} -> ${details}`);
  }

  public research(source: string, details: string) {
    this.agentLog("AGENT_COMPETITOR", "Live Market Radar", "INFO", `[${source}] ${details}`);
  }

  public ai(agent: string, details: string) {
    this.agentLog("AGENT_ICP", agent, "INFO", details);
  }

  public info(category: string, message: string) {
    this.agentLog("SYSTEM", category, "INFO", message);
  }

  public warn(category: string, message: string) {
    this.agentLog("SYSTEM", category, "WARN", message);
  }

  public error(category: string, message: string, err?: any) {
    this.agentLog("SYSTEM", category, "ERROR", `${message} ${err?.message || (typeof err === "string" ? err : "")}`);
  }

  public getLogs(options: { category?: string; level?: string; limit?: number; since?: string } = {}): LogEntry[] {
    let result = [...this.memoryLogs];

    if (options.category && options.category !== "ALL") {
      result = result.filter((l) => l.category === options.category);
    }

    if (options.level && options.level !== "ALL") {
      result = result.filter((l) => l.level === options.level);
    }

    if (options.since) {
      result = result.filter((l) => l.timestamp > options.since!);
    }

    const limit = options.limit || 200;
    return result.slice(-limit).reverse();
  }

  public getAgentHealth(): AgentHealthStatus[] {
    return Array.from(this.agentHealthMap.values());
  }

  public clearLogs() {
    this.memoryLogs = [];
    this.initializeAgentHealth();
  }
}

export const logger = new Logger();

/**
 * Express Middleware to track all API requests, execution time, and response status
 */
export const httpLoggingMiddleware = (req: Request, res: Response, next: NextFunction) => {
  const start = Date.now();
  const url = req.originalUrl || req.url;

  // Summarize body without passwords
  let bodySummary = "";
  if (req.body && Object.keys(req.body).length > 0) {
    const safeBody = { ...req.body };
    if (safeBody.password) safeBody.password = "******";
    bodySummary = JSON.stringify(safeBody);
    if (bodySummary.length > 80) {
      bodySummary = bodySummary.substring(0, 77) + "...";
    }
  }

  res.on("finish", () => {
    const duration = Date.now() - start;
    logger.http(req.method, url, res.statusCode, duration, bodySummary);
  });

  next();
};
