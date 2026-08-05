import { useState, useEffect } from 'react';
import { Building2, Users, GraduationCap, BookOpen, DoorOpen, Cpu, Clock, CalendarDays, TrendingUp, AlertCircle } from 'lucide-react';
import { Bar, Doughnut } from 'react-chartjs-2';
import { Chart as ChartJS, CategoryScale, LinearScale, BarElement, Title, Tooltip, Legend, ArcElement, PointElement, LineElement } from 'chart.js';
import { authAPI, attendanceAPI, statisticsAPI, conflictAPI } from '../../api';
import StatCard from '../../components/common/StatCard';
import LoadingSpinner from '../../components/common/LoadingSpinner';
import { useTheme } from '../../context/ThemeContext';
import { useNavigate } from 'react-router-dom';

ChartJS.register(CategoryScale, LinearScale, BarElement, Title, Tooltip, Legend, ArcElement, PointElement, LineElement);

export default function Dashboard() {
  const [data, setData]           = useState(null);
  const [todayData, setTodayData] = useState(null);
  const [conflicts, setConflicts] = useState(null);
  const [loading, setLoading]     = useState(true);
  const { dark } = useTheme();
  const navigate = useNavigate();

  useEffect(() => {
    const load = async () => {
      try {
        const [dash, today, conf] = await Promise.all([
          authAPI.getDashboard(),
          attendanceAPI.getToday().catch(() => ({ data: { data: null } })),
          conflictAPI.report({}).catch(() => ({ data: { data: null } })),
        ]);
        setData(dash.data.data);
        setTodayData(today.data.data);
        setConflicts(conf.data.data);
      } catch { }
      finally { setLoading(false); }
    };
    load();
  }, []);

  if (loading) return <LoadingSpinner text="Loading dashboard..." />;

  const textColor = dark ? '#94a3b8' : '#64748b';
  const gridColor = dark ? '#1e293b' : '#f1f5f9';
  const chartOpts = {
    responsive: true,
    plugins: { legend: { labels: { color: textColor, font: { size: 11 } } } },
    scales: {
      x: { ticks: { color: textColor }, grid: { color: gridColor } },
      y: { ticks: { color: textColor }, grid: { color: gridColor }, beginAtZero: true },
    },
  };

  const stats = data?.stats || {};
  const cards = [
    { title: 'Departments',  value: stats.departments,         icon: Building2,     color: 'blue'   },
    { title: 'Active Staff', value: stats.staff,               icon: Users,         color: 'green'  },
    { title: 'Classes',      value: stats.classes,             icon: GraduationCap, color: 'purple' },
    { title: 'Subjects',     value: stats.subjects,            icon: BookOpen,      color: 'orange' },
    { title: 'Rooms',        value: stats.rooms,               icon: DoorOpen,      color: 'teal'   },
    { title: 'Timetables',   value: stats.generatedTimetables, icon: Cpu,           color: 'indigo' },
  ];

  const workloadData = {
    labels: data?.facultyWorkload?.map(f => f.name.split(' ').slice(-1)[0]) || [],
    datasets: [{ label: 'Periods/Week', data: data?.facultyWorkload?.map(f => f.total_periods) || [], backgroundColor: 'rgba(59,130,246,0.75)', borderRadius: 6 }],
  };

  const deptData = {
    labels: data?.departmentStats?.map(d => d.code) || [],
    datasets: [
      { label: 'Staff',    data: data?.departmentStats?.map(d => d.staff_count)   || [], backgroundColor: 'rgba(99,102,241,0.7)',  borderRadius: 4 },
      { label: 'Classes',  data: data?.departmentStats?.map(d => d.class_count)   || [], backgroundColor: 'rgba(16,185,129,0.7)',  borderRadius: 4 },
      { label: 'Subjects', data: data?.departmentStats?.map(d => d.subject_count) || [], backgroundColor: 'rgba(245,158,11,0.7)',  borderRadius: 4 },
    ],
  };

  return (
    <div className="space-y-6">
      {/* Conflict alert banner */}
      {conflicts && !conflicts.isClean && (
        <div style={{ display:'flex', alignItems:'center', gap:10, padding:'12px 16px', background:'#fef2f2', border:'1px solid #fecaca', borderRadius:10 }}>
          <AlertCircle size={18} color="#dc2626" />
          <p style={{ fontSize:14, color:'#991b1b', margin:0, flex:1 }}>
            <strong>{conflicts.totalConflicts} timetable conflict(s) detected</strong> — {conflicts.teacherConflicts?.length} teacher, {conflicts.roomConflicts?.length} room.
          </p>
          <button onClick={() => navigate('/statistics')} style={{ fontSize:12, fontWeight:600, color:'#dc2626', background:'transparent', border:'1px solid #fecaca', borderRadius:6, padding:'4px 10px', cursor:'pointer' }}>
            View Report
          </button>
        </div>
      )}

      {/* Stat Cards */}
      <div className="grid grid-cols-2 md:grid-cols-3 xl:grid-cols-6 gap-4">
        {cards.map(c => <StatCard key={c.title} {...c} />)}
      </div>

      {/* Today's Classes */}
      {todayData && (
        <div className="card">
          <div style={{ display:'flex', alignItems:'center', justifyContent:'space-between', padding:'14px 20px', borderBottom:'1px solid #e2e8f0' }} className="dark:border-slate-700">
            <div className="flex items-center gap-2">
              <CalendarDays size={18} color="#2563eb" />
              <h3 style={{ fontSize:15, fontWeight:700, color:'#0f172a', margin:0 }} className="dark:text-slate-100">
                Today — {todayData.day}
              </h3>
              <span style={{ fontSize:12, fontWeight:600, background:'#dbeafe', color:'#1e40af', padding:'2px 8px', borderRadius:99 }}>
                {todayData.totalClasses} classes
              </span>
            </div>
            <div className="flex gap-3 text-sm">
              <span style={{ color:'#16a34a', fontWeight:600 }}>✓ {todayData.conducted} conducted</span>
              <span style={{ color:'#d97706', fontWeight:600 }}>⏳ {todayData.pending} pending</span>
              {todayData.cancelled > 0 && <span style={{ color:'#dc2626', fontWeight:600 }}>✕ {todayData.cancelled} cancelled</span>}
            </div>
          </div>
          {todayData.totalClasses === 0 ? (
            <div style={{ textAlign:'center', padding:'32px', color:'#94a3b8' }}>
              <Clock size={32} style={{ margin:'0 auto 8px', opacity:0.3 }} />
              <p style={{ margin:0 }}>No classes scheduled today ({todayData.day})</p>
            </div>
          ) : (
            <div style={{ overflowX:'auto' }}>
              <table className="w-full">
                <thead>
                  <tr>{['Period','Subject','Class','Staff','Room','Status'].map(h=><th key={h} className="table-header text-left">{h}</th>)}</tr>
                </thead>
                <tbody>
                  {todayData.classes.slice(0,8).map((c,i) => (
                    <tr key={i} className="hover:bg-slate-50 dark:hover:bg-slate-700/30">
                      <td className="table-cell text-xs font-semibold text-slate-500">{c.start_time?.substring(0,5)}–{c.end_time?.substring(0,5)}</td>
                      <td className="table-cell">
                        <span style={{ fontSize:13, fontWeight:600, color:'#0f172a' }} className="dark:text-slate-100">{c.subject_code}</span>
                        <span style={{ fontSize:10, marginLeft:4, padding:'1px 5px', borderRadius:99, background: c.subject_type==='lab'?'#fef3c7':'#dbeafe', color: c.subject_type==='lab'?'#92400e':'#1e40af', fontWeight:600 }}>{c.subject_type}</span>
                      </td>
                      <td className="table-cell text-sm">{c.dept_name?.substring(0,3)} Y{c.year} {c.section}</td>
                      <td className="table-cell text-sm text-slate-600 dark:text-slate-400">{c.staff_name?.split(' ').slice(-1)[0]}</td>
                      <td className="table-cell text-sm">{c.room_number}</td>
                      <td className="table-cell">
                        {c.attendance_status
                          ? <span style={{ fontSize:11, fontWeight:700, padding:'2px 7px', borderRadius:99, background: c.attendance_status==='conducted'?'#dcfce7':'#fee2e2', color: c.attendance_status==='conducted'?'#166534':'#991b1b' }}>{c.attendance_status}</span>
                          : <span style={{ fontSize:11, color:'#94a3b8' }}>Pending</span>
                        }
                      </td>
                    </tr>
                  ))}
                  {todayData.classes.length > 8 && (
                    <tr><td colSpan={6} style={{ textAlign:'center', padding:'8px', color:'#94a3b8', fontSize:12 }}>
                      +{todayData.classes.length - 8} more classes · <button onClick={() => navigate('/attendance')} style={{ color:'#2563eb', background:'transparent', border:'none', cursor:'pointer', fontWeight:600, fontSize:12 }}>View All →</button>
                    </td></tr>
                  )}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}

      {/* Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 card p-6">
          <h3 style={{ fontSize:14, fontWeight:600, margin:'0 0 12px', color:'#334155' }} className="dark:text-slate-300">Faculty Workload (Periods/Week)</h3>
          {data?.facultyWorkload?.length
            ? <Bar data={workloadData} options={chartOpts} height={120} />
            : <p className="text-slate-400 text-sm text-center py-8">No workload data yet</p>}
        </div>
        <div className="card p-6">
          <h3 style={{ fontSize:14, fontWeight:600, margin:'0 0 12px', color:'#334155' }} className="dark:text-slate-300">Subject Types</h3>
          <Doughnut data={{
            labels: ['Theory', 'Lab'],
            datasets: [{ data: [Math.round((stats.subjects||0) * 0.65), Math.round((stats.subjects||0) * 0.35)], backgroundColor: ['rgba(59,130,246,0.8)', 'rgba(245,158,11,0.8)'], borderWidth: 0 }],
          }} options={{ responsive:true, plugins:{ legend:{ labels:{ color:textColor } } }, scales:{} }} />
        </div>
      </div>

      <div className="card p-6">
        <h3 style={{ fontSize:14, fontWeight:600, margin:'0 0 12px', color:'#334155' }} className="dark:text-slate-300">Department Statistics</h3>
        {data?.departmentStats?.length
          ? <Bar data={deptData} options={chartOpts} height={80} />
          : <p className="text-slate-400 text-sm text-center py-8">No department data</p>}
      </div>

      {/* Recent Activity */}
      <div className="card">
        <div style={{ display:'flex', alignItems:'center', justifyContent:'space-between', padding:'14px 20px', borderBottom:'1px solid #e2e8f0' }} className="dark:border-slate-700">
          <div className="flex items-center gap-2">
            <TrendingUp size={16} color="#64748b" />
            <h3 style={{ fontSize:15, fontWeight:700, color:'#0f172a', margin:0 }} className="dark:text-slate-100">Recent Activity</h3>
          </div>
          <button onClick={() => navigate('/audit')} style={{ fontSize:12, color:'#2563eb', background:'transparent', border:'none', cursor:'pointer', fontWeight:600 }}>View All →</button>
        </div>
        <div className="divide-y divide-slate-100 dark:divide-slate-700">
          {data?.recentActivity?.length ? data.recentActivity.map((log, i) => (
            <div key={i} style={{ display:'flex', alignItems:'center', gap:10, padding:'10px 20px' }}>
              <div style={{ width:32, height:32, background:'#eff6ff', borderRadius:99, display:'flex', alignItems:'center', justifyContent:'center', flexShrink:0 }}>
                <Clock size={14} color="#2563eb" />
              </div>
              <div style={{ flex:1, minWidth:0 }}>
                <p style={{ fontSize:13, fontWeight:500, color:'#334155', margin:0, overflow:'hidden', textOverflow:'ellipsis', whiteSpace:'nowrap' }} className="dark:text-slate-300">{log.description}</p>
                <p style={{ fontSize:11, color:'#94a3b8', margin:0 }}>{log.user_name} · {new Date(log.created_at).toLocaleString()}</p>
              </div>
              <span style={{ fontSize:10, fontWeight:700, background:'#f1f5f9', color:'#475569', padding:'2px 7px', borderRadius:99, flexShrink:0 }}>{log.action}</span>
            </div>
          )) : <p style={{ textAlign:'center', padding:'32px', color:'#94a3b8', fontSize:14 }}>No recent activity</p>}
        </div>
      </div>
    </div>
  );
}
