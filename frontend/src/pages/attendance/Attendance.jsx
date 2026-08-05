import { useState, useEffect } from 'react';
import { ClipboardList, CheckCircle2, XCircle, Clock, Calendar } from 'lucide-react';
import { attendanceAPI, classAPI, timeslotAPI } from '../../api';
import LoadingSpinner from '../../components/common/LoadingSpinner';
import toast from 'react-hot-toast';

const STATUS_STYLES = {
  conducted:    { bg:'#dcfce7', color:'#166534', label:'Conducted' },
  cancelled:    { bg:'#fee2e2', color:'#991b1b', label:'Cancelled' },
  holiday:      { bg:'#fef3c7', color:'#92400e', label:'Holiday' },
  substituted:  { bg:'#ede9fe', color:'#5b21b6', label:'Substituted' },
};

export default function Attendance() {
  const [todayData, setTodayData]   = useState(null);
  const [loading, setLoading]       = useState(true);
  const [marking, setMarking]       = useState({});
  const [filterClass, setFilterClass] = useState('');
  const [classes, setClasses]       = useState([]);

  const fetchToday = async () => {
    setLoading(true);
    try {
      const res = await attendanceAPI.getToday();
      setTodayData(res.data.data);
    } catch { toast.error('Failed to load today\'s schedule'); }
    finally { setLoading(false); }
  };

  useEffect(() => {
    fetchToday();
    classAPI.getAll({ limit: 200 }).then(r => setClasses(r.data.data || []));
  }, []);

  const handleMark = async (entry, status) => {
    const key = `${entry.timetable_id}_${entry.time_slot_id || entry.timetable_id}`;
    setMarking(p => ({ ...p, [key]: true }));
    try {
      await attendanceAPI.mark({
        timetable_id: entry.timetable_id,
        class_id:     entry.class_id,
        subject_id:   entry.subject_id,
        staff_id:     entry.staff_id,
        time_slot_id: entry.time_slot_id,
        attendance_date: todayData.date,
        day_of_week:  todayData.day,
        status,
      });
      toast.success(`Marked as ${status}`);
      fetchToday();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed');
    } finally {
      setMarking(p => ({ ...p, [key]: false }));
    }
  };

  const filtered = todayData?.classes?.filter(c =>
    !filterClass || String(c.class_id) === String(filterClass)
  ) || [];

  const groupedByPeriod = filtered.reduce((acc, c) => {
    const key = `${c.start_time}–${c.end_time} (${c.slot_name})`;
    if (!acc[key]) acc[key] = [];
    acc[key].push(c);
    return acc;
  }, {});

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-3">
          <div style={{ width:40, height:40, background:'#f0fdf4', borderRadius:12, display:'flex', alignItems:'center', justifyContent:'center' }}>
            <ClipboardList size={22} color="#16a34a" />
          </div>
          <div>
            <h2 style={{ fontSize:18, fontWeight:700, color:'#0f172a', margin:0 }} className="dark:text-slate-100">Today's Attendance</h2>
            <p style={{ fontSize:13, color:'#64748b', margin:0 }}>
              {todayData ? `${todayData.day}, ${todayData.date}` : '...'}
            </p>
          </div>
        </div>
        <div className="flex gap-3 flex-wrap">
          <select className="input-field w-52" value={filterClass} onChange={e => setFilterClass(e.target.value)}>
            <option value="">All Classes</option>
            {classes.map(c => <option key={c.id} value={c.id}>{c.department_code} Y{c.year} S{c.semester} {c.section}</option>)}
          </select>
          <button onClick={fetchToday} className="btn-secondary"><Clock size={15} /> Refresh</button>
        </div>
      </div>

      {/* Summary cards */}
      {todayData && (
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          {[
            { label:'Total Classes',  val: todayData.totalClasses, color:'#3b82f6', bg:'#eff6ff' },
            { label:'Conducted',      val: todayData.conducted,    color:'#16a34a', bg:'#f0fdf4' },
            { label:'Pending',        val: todayData.pending,      color:'#d97706', bg:'#fffbeb' },
            { label:'Cancelled',      val: todayData.cancelled,    color:'#dc2626', bg:'#fef2f2' },
          ].map(({ label, val, color, bg }) => (
            <div key={label} className="card p-4" style={{ borderLeft:`4px solid ${color}` }}>
              <p style={{ fontSize:26, fontWeight:800, color, margin:0 }}>{val}</p>
              <p style={{ fontSize:12, color:'#64748b', margin:0 }}>{label}</p>
            </div>
          ))}
        </div>
      )}

      {loading ? <LoadingSpinner text="Loading today's schedule..." /> : (
        !Object.keys(groupedByPeriod).length ? (
          <div className="card p-16 text-center text-slate-400">
            <Calendar size={48} style={{ margin:'0 auto 12px', opacity:0.3 }} />
            <p style={{ fontSize:16, fontWeight:600 }}>No classes scheduled today</p>
            <p style={{ fontSize:13 }}>Generate a timetable that includes {todayData?.day || 'today'}</p>
          </div>
        ) : (
          Object.entries(groupedByPeriod).map(([period, entries]) => (
            <div key={period} className="card overflow-hidden">
              <div style={{ padding:'10px 16px', background:'#1e40af', color:'#fff', fontSize:13, fontWeight:600 }}>
                🕐 {period}
              </div>
              <div className="divide-y divide-slate-100 dark:divide-slate-700">
                {entries.map((entry, i) => {
                  const key = `${entry.timetable_id}_${entry.time_slot_id}`;
                  const statusStyle = STATUS_STYLES[entry.attendance_status] || null;
                  return (
                    <div key={i} style={{ display:'flex', alignItems:'center', gap:12, padding:'12px 16px' }}>
                      {/* Subject badge */}
                      <div style={{ width:44, height:44, borderRadius:10, background: entry.subject_type === 'lab' ? '#fef3c7' : '#dbeafe', display:'flex', alignItems:'center', justifyContent:'center', flexShrink:0 }}>
                        <span style={{ fontSize:10, fontWeight:700, color: entry.subject_type === 'lab' ? '#92400e' : '#1e40af' }}>{entry.subject_code?.substring(0,4)}</span>
                      </div>
                      <div style={{ flex:1, minWidth:0 }}>
                        <p style={{ fontSize:14, fontWeight:600, color:'#0f172a', margin:0 }} className="dark:text-slate-100">
                          {entry.subject_name}
                          <span style={{ marginLeft:6, fontSize:10, fontWeight:600, padding:'2px 6px', borderRadius:99, background: entry.subject_type === 'lab' ? '#fef3c7' : '#dbeafe', color: entry.subject_type === 'lab' ? '#92400e' : '#1e40af' }}>
                            {entry.subject_type}
                          </span>
                        </p>
                        <p style={{ fontSize:12, color:'#64748b', margin:'2px 0 0' }}>
                          {entry.staff_name} · {entry.dept_name} Y{entry.year} S{entry.semester} {entry.section} · {entry.room_number}
                        </p>
                      </div>
                      {/* Status badge */}
                      {statusStyle && (
                        <span style={{ fontSize:11, fontWeight:700, padding:'3px 10px', borderRadius:99, background:statusStyle.bg, color:statusStyle.color }}>
                          {statusStyle.label}
                        </span>
                      )}
                      {/* Action buttons */}
                      <div className="flex gap-1">
                        <button
                          onClick={() => handleMark(entry, 'conducted')}
                          disabled={marking[key]}
                          title="Mark Conducted"
                          style={{ padding:'6px 10px', borderRadius:8, border:'none', cursor:'pointer', background: entry.attendance_status === 'conducted' ? '#dcfce7' : '#f1f5f9', color: entry.attendance_status === 'conducted' ? '#16a34a' : '#64748b', fontWeight:600, fontSize:12, display:'flex', alignItems:'center', gap:4 }}
                        >
                          <CheckCircle2 size={14} /> Done
                        </button>
                        <button
                          onClick={() => handleMark(entry, 'cancelled')}
                          disabled={marking[key]}
                          title="Mark Cancelled"
                          style={{ padding:'6px 10px', borderRadius:8, border:'none', cursor:'pointer', background: entry.attendance_status === 'cancelled' ? '#fee2e2' : '#f1f5f9', color: entry.attendance_status === 'cancelled' ? '#dc2626' : '#64748b', fontWeight:600, fontSize:12, display:'flex', alignItems:'center', gap:4 }}
                        >
                          <XCircle size={14} /> Cancel
                        </button>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          ))
        )
      )}
    </div>
  );
}
