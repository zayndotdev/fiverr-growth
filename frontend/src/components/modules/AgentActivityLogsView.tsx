import React, { useState, useEffect } from 'react';
import {
  Terminal,
  RefreshCw,
  Trash2,
  Download,
  Search,
  Play,
  Pause,
  ChevronDown,
  ChevronRight,
} from 'lucide-react';

export interface LogEntry {
  id: string;
  timestamp: string;
  category: string;
  agentName?: string;
  level: 'INFO' | 'SUCCESS' | 'WARN' | 'ERROR';
  message: string;
  details?: any;
  durationMs?: number;
}

export interface AgentHealthStatus {
  agentKey: string;
  name: string;
  status: 'idle' | 'active' | 'healthy' | 'warning' | 'error';
  lastActionTime: string | null;
  totalOperations: number;
  errorCount: number;
  lastMessage: string;
}

export const AgentActivityLogsView: React.FC = () => {
  const [logs, setLogs] = useState<LogEntry[]>([]);
  const [health, setHealth] = useState<AgentHealthStatus[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [isLivePolling, setIsLivePolling] = useState<boolean>(true);
  const [selectedCategory, setSelectedCategory] = useState<string>('ALL');
  const [selectedLevel, setSelectedLevel] = useState<string>('ALL');
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [expandedLogId, setExpandedLogId] = useState<string | null>(null);

  // Fetch logs & agent health
  const fetchData = async () => {
    try {
      const [logsRes, healthRes] = await Promise.all([
        fetch('/api/v1/system/logs?limit=250'),
        fetch('/api/v1/system/agent-health'),
      ]);

      const [logsJson, healthJson] = await Promise.all([
        logsRes.json(),
        healthRes.json(),
      ]);

      if (logsJson.success && Array.isArray(logsJson.data)) {
        setLogs(logsJson.data);
      }
      if (healthJson.success && Array.isArray(healthJson.data)) {
        setHealth(healthJson.data);
      }
    } catch (err) {
      console.error('Failed to fetch logs or agent health:', err);
    } finally {
      setLoading(false);
    }
  };

  // Initial fetch + Live polling timer
  useEffect(() => {
    fetchData();

    if (!isLivePolling) return;

    const interval = setInterval(() => {
      fetchData();
    }, 2500);

    return () => clearInterval(interval);
  }, [isLivePolling]);

  // Clear logs handler
  const handleClearLogs = async () => {
    if (!confirm('Are you sure you want to clear the agent memory logs?')) return;
    try {
      const res = await fetch('/api/v1/system/logs', { method: 'DELETE' });
      const json = await res.json();
      if (json.success) {
        setLogs([]);
        fetchData();
      }
    } catch (err) {
      console.error('Failed to clear logs:', err);
    }
  };

  // Export logs handler
  const handleExportLogs = () => {
    const dataStr = 'data:text/json;charset=utf-8,' + encodeURIComponent(JSON.stringify(logs, null, 2));
    const downloadAnchor = document.createElement('a');
    downloadAnchor.setAttribute('href', dataStr);
    downloadAnchor.setAttribute('download', `agent-activity-logs-${new Date().toISOString().substring(0, 19)}.json`);
    document.body.appendChild(downloadAnchor);
    downloadAnchor.click();
    downloadAnchor.remove();
  };

  // Filter logs
  const filteredLogs = logs.filter((log) => {
    if (selectedCategory !== 'ALL' && log.category !== selectedCategory) {
      return false;
    }
    if (selectedLevel !== 'ALL' && log.level !== selectedLevel) {
      return false;
    }
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      const inMsg = log.message.toLowerCase().includes(q);
      const inAgent = (log.agentName || '').toLowerCase().includes(q);
      const inCategory = log.category.toLowerCase().includes(q);
      return inMsg || inAgent || inCategory;
    }
    return true;
  });

  const getLevelBadgeClass = (level: string) => {
    switch (level) {
      case 'SUCCESS':
        return 'bg-emerald-500/15 text-emerald-400 border-emerald-500/30';
      case 'WARN':
        return 'bg-amber-500/15 text-amber-400 border-amber-500/30';
      case 'ERROR':
        return 'bg-red-500/15 text-red-400 border-red-500/30';
      default:
        return 'bg-sky-500/15 text-sky-400 border-sky-500/30';
    }
  };

  const getCategoryBadgeClass = (category: string) => {
    switch (category) {
      case 'AGENT_GIG_STUDIO':
        return 'bg-purple-500/15 text-purple-300 border-purple-500/30';
      case 'AGENT_BRIEFS':
        return 'bg-emerald-500/15 text-emerald-300 border-emerald-500/30';
      case 'AGENT_COMPETITOR':
        return 'bg-cyan-500/15 text-cyan-300 border-cyan-500/30';
      case 'AGENT_SCRAPER':
        return 'bg-blue-500/15 text-blue-300 border-blue-500/30';
      case 'AGENT_ICP':
        return 'bg-amber-500/15 text-amber-300 border-amber-500/30';
      case 'HTTP':
        return 'bg-slate-500/15 text-slate-300 border-slate-500/30';
      default:
        return 'bg-slate-500/15 text-slate-300 border-slate-500/30';
    }
  };

  return (
    <div className="space-y-6 text-[#222325] max-w-7xl mx-auto pb-12">
      {/* Header Banner */}
      <div className="bg-white p-5 rounded-xl border border-[#dadbdd] shadow-sm flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-[#1dbf73]/10 flex items-center justify-center text-[#1dbf73] shrink-0 border border-[#1dbf73]/20">
            <Terminal className="w-5 h-5" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-xl font-bold text-[#222325]">
                Agent Activity & Live Intelligence Feed
              </h1>
              <span className="px-2.5 py-0.5 rounded-full bg-[#1dbf73]/15 text-[#1dbf73] text-[11px] font-bold flex items-center gap-1.5">
                <span className={`w-2 h-2 rounded-full ${isLivePolling ? 'bg-[#1dbf73] animate-pulse' : 'bg-gray-400'}`} />
                {isLivePolling ? 'Live Telemetry' : 'Paused'}
              </span>
            </div>
            <p className="text-xs text-[#74767e] mt-0.5">
              Inspect what each autonomous agent is executing, response times, model outputs, and marketplace queries in real-time.
            </p>
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-2 self-stretch md:self-auto">
          <button
            onClick={() => setIsLivePolling(!isLivePolling)}
            className={`px-3.5 py-2 rounded-lg font-bold text-xs border transition-all flex items-center gap-1.5 cursor-pointer ${
              isLivePolling
                ? 'bg-emerald-50 text-[#19a463] border-emerald-200 hover:bg-emerald-100'
                : 'bg-gray-100 text-gray-700 border-gray-300 hover:bg-gray-200'
            }`}
          >
            {isLivePolling ? <Pause className="w-3.5 h-3.5" /> : <Play className="w-3.5 h-3.5" />}
            {isLivePolling ? 'Pause Polling' : 'Resume Live Feed'}
          </button>

          <button
            onClick={fetchData}
            className="px-3 py-2 rounded-lg bg-[#f5f5f5] hover:bg-[#e4e5e7] text-[#404145] font-bold text-xs border border-[#dadbdd] transition-colors flex items-center gap-1.5 cursor-pointer"
            title="Refresh now"
          >
            <RefreshCw className="w-3.5 h-3.5" />
            Refresh
          </button>

          <button
            onClick={handleExportLogs}
            className="px-3 py-2 rounded-lg bg-[#f5f5f5] hover:bg-[#e4e5e7] text-[#404145] font-bold text-xs border border-[#dadbdd] transition-colors flex items-center gap-1.5 cursor-pointer"
            title="Export Logs"
          >
            <Download className="w-3.5 h-3.5" />
            Export
          </button>

          <button
            onClick={handleClearLogs}
            className="px-3 py-2 rounded-lg bg-red-50 hover:bg-red-100 text-red-600 font-bold text-xs border border-red-200 transition-colors flex items-center gap-1.5 cursor-pointer"
            title="Clear Logs"
          >
            <Trash2 className="w-3.5 h-3.5" />
            Clear
          </button>
        </div>
      </div>

      {/* Agent Health Grid */}
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-3">
        {health.map((ag) => (
          <div
            key={ag.agentKey}
            className="bg-white p-3.5 rounded-xl border border-[#dadbdd] shadow-xs flex flex-col justify-between space-y-2 hover:border-[#1dbf73]/50 transition-colors"
          >
            <div className="flex items-start justify-between gap-1">
              <span className="text-[11px] font-bold text-[#222325] line-clamp-1">
                {ag.name}
              </span>
              <span
                className={`w-2 h-2 rounded-full shrink-0 ${
                  ag.status === 'error'
                    ? 'bg-red-500 animate-ping'
                    : ag.status === 'warning'
                    ? 'bg-amber-500'
                    : 'bg-[#1dbf73]'
                }`}
                title={`Status: ${ag.status}`}
              />
            </div>

            <div className="space-y-1">
              <div className="flex items-center justify-between text-[11px] text-[#74767e]">
                <span>Calls</span>
                <span className="font-bold text-[#222325]">{ag.totalOperations}</span>
              </div>
              <div className="flex items-center justify-between text-[11px] text-[#74767e]">
                <span>Errors</span>
                <span className={`font-bold ${ag.errorCount > 0 ? 'text-red-500' : 'text-[#222325]'}`}>
                  {ag.errorCount}
                </span>
              </div>
            </div>

            <div className="text-[10px] text-[#74767e] pt-1 border-t border-[#efeff0] truncate" title={ag.lastMessage}>
              {ag.lastMessage}
            </div>
          </div>
        ))}
      </div>

      {/* Filter Toolbar */}
      <div className="bg-white p-4 rounded-xl border border-[#dadbdd] shadow-sm space-y-3">
        <div className="flex flex-col md:flex-row items-stretch md:items-center justify-between gap-3">
          {/* Search Box */}
          <div className="relative flex-1">
            <Search className="w-4 h-4 text-[#74767e] absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search logs by keyword, agent name, or message..."
              className="w-full pl-9 pr-4 py-2 border border-[#dadbdd] rounded-lg text-xs text-[#222325] focus:border-[#1dbf73] focus:outline-none"
            />
          </div>

          {/* Level Filter */}
          <div className="flex items-center gap-2">
            <span className="text-xs font-semibold text-[#74767e] shrink-0">Level:</span>
            <select
              value={selectedLevel}
              onChange={(e) => setSelectedLevel(e.target.value)}
              className="px-3 py-2 border border-[#dadbdd] rounded-lg text-xs text-[#222325] bg-white focus:border-[#1dbf73] focus:outline-none"
            >
              <option value="ALL">All Levels</option>
              <option value="SUCCESS">SUCCESS</option>
              <option value="INFO">INFO</option>
              <option value="WARN">WARN</option>
              <option value="ERROR">ERROR</option>
            </select>
          </div>
        </div>

        {/* Category Filter Chips */}
        <div className="flex items-center gap-1.5 overflow-x-auto scrollbar-none pt-1">
          <span className="text-xs font-semibold text-[#74767e] mr-1 shrink-0">Category:</span>
          {[
            { id: 'ALL', label: 'All Activity' },
            { id: 'AGENT_GIG_STUDIO', label: 'Gig Studio' },
            { id: 'AGENT_BRIEFS', label: 'Briefs Closer' },
            { id: 'AGENT_COMPETITOR', label: 'Competitor Radar' },
            { id: 'AGENT_SCRAPER', label: 'Fiverr Scraper' },
            { id: 'AGENT_ICP', label: 'ICP Strategist' },
            { id: 'AGENT_STRATEGIST', label: 'Growth Strategist' },
            { id: 'HTTP', label: 'HTTP API' },
            { id: 'AUTH', label: 'Auth' },
          ].map((cat) => (
            <button
              key={cat.id}
              onClick={() => setSelectedCategory(cat.id)}
              className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all whitespace-nowrap cursor-pointer border ${
                selectedCategory === cat.id
                  ? 'bg-[#1dbf73] text-white border-[#1dbf73] shadow-xs'
                  : 'bg-[#f5f5f5] text-[#404145] border-[#dadbdd] hover:bg-[#e4e5e7]'
              }`}
            >
              {cat.label}
            </button>
          ))}
        </div>
      </div>

      {/* Terminal View */}
      <div className="bg-[#090d16] rounded-xl border border-slate-800 shadow-2xl overflow-hidden font-mono text-xs">
        {/* Terminal Header Bar */}
        <div className="bg-[#0f172a] px-4 py-2.5 border-b border-slate-800 flex items-center justify-between text-slate-400">
          <div className="flex items-center gap-2">
            <div className="flex items-center gap-1.5">
              <span className="w-3 h-3 rounded-full bg-red-500/80 inline-block" />
              <span className="w-3 h-3 rounded-full bg-yellow-500/80 inline-block" />
              <span className="w-3 h-3 rounded-full bg-green-500/80 inline-block" />
            </div>
            <span className="ml-2 text-slate-300 font-bold">fiverr-growth:~/agents/telemetry.log</span>
          </div>

          <div className="flex items-center gap-3 text-[11px]">
            <span>Showing {filteredLogs.length} of {logs.length} events</span>
            <span>&bull;</span>
            <span className="text-[#10b981]">Buffer: OK</span>
          </div>
        </div>

        {/* Logs Stream Container */}
        <div className="p-4 space-y-2 max-h-[600px] overflow-y-auto scrollbar-thin scrollbar-thumb-slate-800 text-slate-200">
          {loading && logs.length === 0 ? (
            <div className="text-center py-12 text-slate-500 flex flex-col items-center gap-2">
              <RefreshCw className="w-6 h-6 animate-spin text-[#1dbf73]" />
              <span>Connecting to agent telemetry socket...</span>
            </div>
          ) : filteredLogs.length === 0 ? (
            <div className="text-center py-12 text-slate-500">
              No log entries match the selected filters.
            </div>
          ) : (
            filteredLogs.map((log) => {
              const isExpanded = expandedLogId === log.id;
              const hasDetails = log.details && Object.keys(log.details).length > 0;

              return (
                <div
                  key={log.id}
                  className="rounded-lg p-2.5 bg-slate-900/60 hover:bg-slate-900 border border-slate-800/80 transition-colors space-y-1.5"
                >
                  <div className="flex flex-wrap items-center justify-between gap-2">
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="text-slate-500 text-[11px]">
                        {log.timestamp.substring(11, 19)}
                      </span>

                      <span
                        className={`px-2 py-0.5 rounded text-[10px] font-bold border ${getLevelBadgeClass(
                          log.level
                        )}`}
                      >
                        {log.level}
                      </span>

                      <span
                        className={`px-2 py-0.5 rounded text-[10px] font-semibold border ${getCategoryBadgeClass(
                          log.category
                        )}`}
                      >
                        {log.category}
                      </span>

                      {log.agentName && (
                        <span className="text-slate-300 font-bold text-[11px]">
                          [{log.agentName}]
                        </span>
                      )}
                    </div>

                    <div className="flex items-center gap-2 text-slate-500 text-[11px]">
                      {log.durationMs !== undefined && (
                        <span>{log.durationMs}ms</span>
                      )}
                      {hasDetails && (
                        <button
                          onClick={() => setExpandedLogId(isExpanded ? null : log.id)}
                          className="text-slate-400 hover:text-white flex items-center gap-0.5 cursor-pointer"
                        >
                          {isExpanded ? <ChevronDown className="w-3.5 h-3.5" /> : <ChevronRight className="w-3.5 h-3.5" />}
                          <span>Details</span>
                        </button>
                      )}
                    </div>
                  </div>

                  <p className="text-slate-200 text-xs font-mono leading-relaxed pl-1">
                    {log.message}
                  </p>

                  {/* Expanded JSON Details */}
                  {isExpanded && hasDetails && (
                    <pre className="mt-2 p-3 rounded bg-black/70 border border-slate-800 text-[11px] text-emerald-400 overflow-x-auto">
                      {JSON.stringify(log.details, null, 2)}
                    </pre>
                  )}
                </div>
              );
            })
          )}
        </div>
      </div>
    </div>
  );
};
