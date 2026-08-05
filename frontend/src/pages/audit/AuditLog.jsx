import { useState, useEffect } from 'react';
import { ScrollText, RefreshCw, Search, Filter } from 'lucide-react';
import { statisticsAPI } from '../../api';
import LoadingSpinner from '../../components/common/LoadingSpinner';
import Pagination from '../../components/common/Pagination';

const ACTION_COLORS = {
  LOGIN: '#dbeafe', DEPT_CREATE: '#dcfce7', DEPT_UPDATE: '#fef3c7', DEPT_DELETE: '#fee2e2',
  STAFF_CREATE: '#dcfce7', STAFF_UPDATE: '#fef3c7', STAFF_DELETE: '#fee2e2',
  SUBJ_CREATE: '#dcfce7', SUBJ_UPDATE: '#fef3c7', SUBJ_DELETE: '#fee2e2',
  CLASS_CREATE: '#dcfce7', CLASS_UPDATE: '#fef3c7', CLASS_DELETE: '#fee2e2',
  ROOM_CREATE: '#dcfce7', ROOM_UPDATE: '#fef3c7', ROOM_DELETE: '#fee2e2',
  TIMETABLE_GENERATE: '#ede9fe', TIMETABLE_SNAPSHOT: '#fdf4ff', TIMETABLE_RESTORE: '#fef3c7',
  ATTENDANCE_MARK: '#f0fdf4', SETTINGS_UPDATE: '#fff7ed', SLOT_CREATE: '#dcfce7',
  INTERVAL_SETTINGS_SAVE: '#fff7ed', TIMESLOTS_APPLY: '#ede9fe',
};

const ACTION_TEXT = {
  LOGIN:'#1e40af', DEPT_CREATE:'#166534', DEPT_UPDATE:'#92400e', DEPT_DELETE:'#991b1b',
  STAFF_CREATE:'#166534', STAFF_UPDATE:'#92400e', STAFF_DELETE:'#991b1b',
  TIMETABLE_GENERATE:'#5b21b6', TIMETABLE_SNAPSHOT:'#7c3aed', TIMETABLE_RESTORE:'#92400e',
  ATTENDANCE_MARK:'#166534', SETTINGS_UPDATE:'#92400e',
};

export default function AuditLog() {
  const [logs, setLogs]         = useState([]);
  const [loading, setLoading]   = useState(false);
  const [pagination, setPag]    = useState({ page:1, limit:20, total:0, totalPages:1 });
  const [filters, setFilters]   = useState({ action:'', from_date:'', to_date:'', page:1, limit:20 });

  const fetchLogs = async (f = filters) => {
    setLoading(true);
    try {
      const res = await statisticsAPI.audit(f);
      setLogs(res.data.data.logs || []);
      setPag(res.data.data.pagination || {});
    } catch { } finally { setLoading(false); }
  };

  useEffect(() => { fetchLogs(filters); }, [filters.page]);

  const handleSearch = () => fetchLogs({ ...filters, page:1 });
  const setF = (key, val) => setFilters(p => ({ ...p, [key]: val }));

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div className="flex items-center gap-3">
          <div style={{ width:40, height:40, background:'#fafaf9', borderRadius:12, display:'flex', alignItems:'center', justifyContent:'center', border:'1px solid #e7e5e4' }}>
            <ScrollText size={22} color="#78716c" />
          </div>
          <div>
            <h2 style={{ fontSize:18, fontWeight:700, color:'#0f172a', margin:0 }} className="dark:text-slate-100">Audit Log</h2>
            <p style={{ fontSize:13, color:'#64748b', margin:0 }}>Track all admin actions with timestamps</p>
          </div>
        </div>
        <button onClick={() => fetchLogs(filters)} className="btn-secondary"><RefreshCw size={14} /> Refresh</button>
      </div>

      {/* Filters */}
      <div className="card p-4 flex flex-wrap gap-3 items-end">
        <div>
          <label className="block text-xs font-semibold text-slate-500 mb-1 uppercase tracking-wide">Action</label>
          <input className="input-field w-44" placeholder="e.g. LOGIN, CREATE..." value={filters.action} onChange={e => setF('action', e.target.value)} />
        </div>
        <div>
          <label className="block text-xs font-semibold text-slate-500 mb-1 uppercase tracking-wide">From Date</label>
          <input type="date" className="input-field" value={filters.from_date} onChange={e => setF('from_date', e.target.value)} />
        </div>
        <div>
          <label className="block text-xs font-semibold text-slate-500 mb-1 uppercase tracking-wide">To Date</label>
          <input type="date" className="input-field" value={filters.to_date} onChange={e => setF('to_date', e.target.value)} />
        </div>
        <button onClick={handleSearch} className="btn-primary" style={{ alignSelf:'flex-end' }}>
          <Search size={14} /> Search
        </button>
        <button onClick={() => { setFilters({ action:'', from_date:'', to_date:'', page:1, limit:20 }); fetchLogs({ action:'', from_date:'', to_date:'', page:1, limit:20 }); }} className="btn-secondary" style={{ alignSelf:'flex-end' }}>
          Clear
        </button>
      </div>

      {/* Table */}
      <div className="card overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr>{['#','Action','Description','User','Role','IP Address','Timestamp'].map(h => <th key={h} className="table-header text-left">{h}</th>)}</tr>
            </thead>
            <tbody>
              {loading ? <tr><td colSpan={7}><LoadingSpinner /></td></tr>
                : !logs.length ? <tr><td colSpan={7} className="text-center py-12 text-slate-400">No audit logs found</td></tr>
                : logs.map((log, i) => {
                  const bg   = ACTION_COLORS[log.action] || '#f1f5f9';
                  const text = ACTION_TEXT[log.action]   || '#475569';
                  return (
                    <tr key={log.id} className="hover:bg-slate-50 dark:hover:bg-slate-700/30 transition-colors">
                      <td className="table-cell text-xs text-slate-400">#{log.id}</td>
                      <td className="table-cell">
                        <span style={{ fontSize:11, fontWeight:700, padding:'3px 8px', borderRadius:99, background:bg, color:text }}>
                          {log.action}
                        </span>
                      </td>
                      <td className="table-cell text-sm" style={{ maxWidth:300 }}>
                        <span className="truncate block" title={log.description}>{log.description}</span>
                      </td>
                      <td className="table-cell font-medium">{log.user_name || 'System'}</td>
                      <td className="table-cell capitalize text-slate-500">{log.role || '—'}</td>
                      <td className="table-cell font-mono text-xs text-slate-400">{log.ip_address || '—'}</td>
                      <td className="table-cell text-xs text-slate-500 whitespace-nowrap">
                        {new Date(log.created_at).toLocaleString('en-IN')}
                      </td>
                    </tr>
                  );
                })}
            </tbody>
          </table>
        </div>
        <Pagination
          page={pagination.page || 1}
          totalPages={pagination.totalPages || 1}
          total={pagination.total || 0}
          limit={pagination.limit || 20}
          onPageChange={p => setFilters(f => ({ ...f, page: p }))}
        />
      </div>
    </div>
  );
}
