import { useState, useEffect } from 'react';
import { BarChart3, Users, BookOpen, Building2, RefreshCw } from 'lucide-react';
import { Bar, Doughnut, Radar } from 'react-chartjs-2';
import {
  Chart as ChartJS, CategoryScale, LinearScale, BarElement,
  Title, Tooltip, Legend, ArcElement, RadialLinearScale, PointElement, LineElement
} from 'chart.js';
import { statisticsAPI, departmentAPI, timeslotAPI } from '../../api';
import LoadingSpinner from '../../components/common/LoadingSpinner';
import { useTheme } from '../../context/ThemeContext';

ChartJS.register(CategoryScale, LinearScale, BarElement, Title, Tooltip, Legend, ArcElement, RadialLinearScale, PointElement, LineElement);

export default function Statistics() {
  const { dark } = useTheme();
  const [tab, setTab]                 = useState('workload');
  const [workload, setWorkload]       = useState([]);
  const [subjects, setSubjects]       = useState([]);
  const [deptStats, setDeptStats]     = useState([]);
  const [weekly, setWeekly]           = useState(null);
  const [loading, setLoading]         = useState(false);
  const [acYears, setAcYears]         = useState([]);
  const [academicYearId, setAYId]     = useState('');
  const [searchTerm, setSearchTerm]   = useState('');

  const textColor  = dark ? '#94a3b8' : '#64748b';
  const gridColor  = dark ? '#1e293b' : '#f1f5f9';

  const fetchAll = async () => {
    setLoading(true);
    try {
      const params = academicYearId ? { academic_year_id: academicYearId } : {};
      const [w, s, d, wk] = await Promise.all([
        statisticsAPI.workload(params),
        statisticsAPI.subjects(params),
        statisticsAPI.departments(),
        statisticsAPI.weekly(params),
      ]);
      setWorkload(w.data.data || []);
      setSubjects(s.data.data || []);
      setDeptStats(d.data.data || []);
      setWeekly(wk.data.data || null);
    } catch { } finally { setLoading(false); }
  };

  useEffect(() => {
    timeslotAPI.getAcademicYears().then(r => {
      const years = r.data.data || [];
      setAcYears(years);
      const cur = years.find(y => y.is_current);
      if (cur) setAYId(String(cur.id));
    });
  }, []);

  useEffect(() => { fetchAll(); }, [academicYearId]);

  const chartOpts = {
    responsive: true,
    plugins: { legend: { labels: { color: textColor, font: { size: 11 } } } },
    scales: {
      x: { ticks: { color: textColor }, grid: { color: gridColor } },
      y: { ticks: { color: textColor }, grid: { color: gridColor }, beginAtZero: true },
    },
  };

  const filteredWorkload = workload.filter(w =>
    !searchTerm || w.name.toLowerCase().includes(searchTerm.toLowerCase()) || w.dept_code.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const workloadChart = {
    labels: filteredWorkload.slice(0, 12).map(w => w.name.split(' ').slice(-1)[0]),
    datasets: [{
      label: 'Periods/Week',
      data: filteredWorkload.slice(0, 12).map(w => w.total_periods),
      backgroundColor: filteredWorkload.slice(0, 12).map((_, i) => `hsla(${i * 25}, 70%, 55%, 0.8)`),
      borderRadius: 6,
    }],
  };

  const theoryCount = subjects.filter(s => s.subject_type === 'theory').length;
  const labCount    = subjects.filter(s => s.subject_type === 'lab').length;
  const subjDistChart = {
    labels: ['Theory', 'Lab'],
    datasets: [{
      data: [theoryCount, labCount],
      backgroundColor: ['rgba(59,130,246,0.8)', 'rgba(245,158,11,0.8)'],
      borderWidth: 0,
    }],
  };

  const deptChart = {
    labels: deptStats.map(d => d.code),
    datasets: [
      { label: 'Staff',    data: deptStats.map(d => d.staff_count),   backgroundColor: 'rgba(99,102,241,0.7)',  borderRadius:4 },
      { label: 'Classes',  data: deptStats.map(d => d.class_count),   backgroundColor: 'rgba(16,185,129,0.7)', borderRadius:4 },
      { label: 'Subjects', data: deptStats.map(d => d.subject_count), backgroundColor: 'rgba(245,158,11,0.7)', borderRadius:4 },
    ],
  };

  const weeklyChart = weekly ? {
    labels: weekly.labels,
    datasets: [{
      label: 'Periods', data: weekly.data,
      backgroundColor: 'rgba(59,130,246,0.7)',
      borderRadius: 6,
    }],
  } : null;

  const TABS = [
    { key:'workload',    label:'Teacher Workload',   icon: Users },
    { key:'subjects',    label:'Subject Distribution', icon: BookOpen },
    { key:'departments', label:'Dept Statistics',    icon: Building2 },
    { key:'weekly',      label:'Weekly Schedule',    icon: BarChart3 },
  ];

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-3">
          <div style={{ width:40, height:40, background:'#eff6ff', borderRadius:12, display:'flex', alignItems:'center', justifyContent:'center' }}>
            <BarChart3 size={22} color="#2563eb" />
          </div>
          <div>
            <h2 style={{ fontSize:18, fontWeight:700, color:'#0f172a', margin:0 }} className="dark:text-slate-100">Statistics & Analytics</h2>
            <p style={{ fontSize:13, color:'#64748b', margin:0 }}>Workload, subject distribution and schedule insights</p>
          </div>
        </div>
        <div className="flex gap-2">
          <select className="input-field w-40" value={academicYearId} onChange={e => setAYId(e.target.value)}>
            <option value="">All Years</option>
            {acYears.map(y => <option key={y.id} value={String(y.id)}>{y.year_label}{y.is_current?' ★':''}</option>)}
          </select>
          <button onClick={fetchAll} className="btn-secondary"><RefreshCw size={14} /></button>
        </div>
      </div>

      {/* Summary cards */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        {[
          { label:'Active Staff',  val: workload.length,                      color:'#3b82f6' },
          { label:'Total Periods', val: workload.reduce((a,w) => a+w.total_periods, 0), color:'#8b5cf6' },
          { label:'Subjects',      val: subjects.length,                       color:'#f59e0b' },
          { label:'Departments',   val: deptStats.length,                      color:'#10b981' },
        ].map(({ label, val, color }) => (
          <div key={label} className="card p-4" style={{ borderLeft:`4px solid ${color}` }}>
            <p style={{ fontSize:26, fontWeight:800, color, margin:0 }}>{val}</p>
            <p style={{ fontSize:12, color:'#64748b', margin:0 }}>{label}</p>
          </div>
        ))}
      </div>

      {/* Tabs */}
      <div style={{ display:'flex', gap:4, borderBottom:'2px solid #e2e8f0', paddingBottom:0 }} className="dark:border-slate-700">
        {TABS.map(({ key, label, icon: Icon }) => (
          <button key={key} onClick={() => setTab(key)} style={{
            padding:'8px 16px', border:'none', cursor:'pointer', fontWeight:600, fontSize:13,
            background:'transparent', borderBottom: tab===key ? '2px solid #2563eb':'2px solid transparent',
            color: tab===key ? '#2563eb' : '#64748b', marginBottom:'-2px',
            display:'flex', alignItems:'center', gap:6,
          }}>
            <Icon size={14} /> {label}
          </button>
        ))}
      </div>

      {loading ? <LoadingSpinner text="Loading statistics..." /> : (
        <>
          {/* Teacher Workload */}
          {tab === 'workload' && (
            <div className="space-y-4">
              <div className="flex gap-3">
                <input className="input-field w-64" placeholder="Search teacher or dept..." value={searchTerm} onChange={e => setSearchTerm(e.target.value)} />
              </div>
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                <div className="card p-6">
                  <h3 style={{ fontSize:14, fontWeight:600, margin:'0 0 12px', color:'#334155' }} className="dark:text-slate-300">Periods Per Teacher</h3>
                  <Bar data={workloadChart} options={{ ...chartOpts, indexAxis: 'y' }} />
                </div>
                <div className="card overflow-hidden">
                  <div className="overflow-x-auto">
                    <table className="w-full">
                      <thead><tr>{['Teacher','Dept','Periods','Max Hrs','Workload %','Days'].map(h=><th key={h} className="table-header text-left">{h}</th>)}</tr></thead>
                      <tbody>
                        {filteredWorkload.map((w,i) => (
                          <tr key={i} className="hover:bg-slate-50 dark:hover:bg-slate-700/30">
                            <td className="table-cell font-medium" style={{ maxWidth:150 }}>{w.name}</td>
                            <td className="table-cell"><span style={{ fontSize:11, fontWeight:700, background:'#dbeafe', color:'#1e40af', padding:'2px 6px', borderRadius:99 }}>{w.dept_code}</span></td>
                            <td className="table-cell text-center font-bold text-primary-600">{w.total_periods}</td>
                            <td className="table-cell text-center">{w.max_hours_per_week}</td>
                            <td className="table-cell">
                              <div style={{ display:'flex', alignItems:'center', gap:6 }}>
                                <div style={{ flex:1, height:6, background:'#e2e8f0', borderRadius:99 }}>
                                  <div style={{ width:`${Math.min(+w.workload_pct||0,100)}%`, height:'100%', background: +w.workload_pct>90 ? '#ef4444':+w.workload_pct>70 ? '#f59e0b':'#22c55e', borderRadius:99 }} />
                                </div>
                                <span style={{ fontSize:11, fontWeight:600, color: +w.workload_pct>90 ? '#dc2626':+w.workload_pct>70 ? '#d97706':'#16a34a' }}>{w.workload_pct}%</span>
                              </div>
                            </td>
                            <td className="table-cell text-center">{w.active_days}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Subject Distribution */}
          {tab === 'subjects' && (
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
              <div className="card p-6">
                <h3 style={{ fontSize:14, fontWeight:600, margin:'0 0 12px', color:'#334155' }} className="dark:text-slate-300">Theory vs Lab</h3>
                <Doughnut data={subjDistChart} options={{ ...chartOpts, cutout:'65%', scales:{} }} />
                <div className="flex justify-center gap-6 mt-4">
                  <div className="text-center"><p style={{ fontSize:20, fontWeight:800, color:'#3b82f6', margin:0 }}>{theoryCount}</p><p style={{ fontSize:11, color:'#64748b' }}>Theory</p></div>
                  <div className="text-center"><p style={{ fontSize:20, fontWeight:800, color:'#f59e0b', margin:0 }}>{labCount}</p><p style={{ fontSize:11, color:'#64748b' }}>Lab</p></div>
                </div>
              </div>
              <div className="card overflow-hidden lg:col-span-2">
                <div className="overflow-x-auto" style={{ maxHeight:420 }}>
                  <table className="w-full">
                    <thead><tr>{['Code','Subject','Dept','Type','Periods','Classes','Color'].map(h=><th key={h} className="table-header text-left">{h}</th>)}</tr></thead>
                    <tbody>
                      {subjects.map((s,i)=>(
                        <tr key={i} className="hover:bg-slate-50 dark:hover:bg-slate-700/30">
                          <td className="table-cell font-mono text-xs font-bold">{s.subject_code}</td>
                          <td className="table-cell font-medium" style={{ maxWidth:160 }}>{s.subject_name}</td>
                          <td className="table-cell text-slate-500 text-xs">{s.dept_code}</td>
                          <td className="table-cell"><span style={{ fontSize:10, fontWeight:700, padding:'2px 6px', borderRadius:99, background: s.subject_type==='lab'?'#fef3c7':'#dbeafe', color: s.subject_type==='lab'?'#92400e':'#1e40af' }}>{s.subject_type}</span></td>
                          <td className="table-cell text-center font-bold text-primary-600">{s.total_periods}</td>
                          <td className="table-cell text-center">{s.classes_count}</td>
                          <td className="table-cell"><div style={{ width:20, height:20, borderRadius:4, background: s.color_hex||'#3b82f6', border:'2px solid rgba(0,0,0,0.1)' }} /></td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          )}

          {/* Department Statistics */}
          {tab === 'departments' && (
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
              <div className="card p-6">
                <h3 style={{ fontSize:14, fontWeight:600, margin:'0 0 12px', color:'#334155' }} className="dark:text-slate-300">Department Overview</h3>
                <Bar data={deptChart} options={chartOpts} height={160} />
              </div>
              <div className="card overflow-hidden">
                <div className="overflow-x-auto">
                  <table className="w-full">
                    <thead><tr>{['Dept','Staff','Classes','Subjects','Theory','Lab','Timetable'].map(h=><th key={h} className="table-header text-left">{h}</th>)}</tr></thead>
                    <tbody>
                      {deptStats.map((d,i)=>(
                        <tr key={i} className="hover:bg-slate-50 dark:hover:bg-slate-700/30">
                          <td className="table-cell"><span style={{ fontWeight:700, fontSize:12, background:'#dbeafe', color:'#1e40af', padding:'2px 6px', borderRadius:99 }}>{d.code}</span></td>
                          <td className="table-cell text-center">{d.staff_count}</td>
                          <td className="table-cell text-center">{d.class_count}</td>
                          <td className="table-cell text-center">{d.subject_count}</td>
                          <td className="table-cell text-center text-blue-600">{d.theory_subjects}</td>
                          <td className="table-cell text-center text-amber-600">{d.lab_subjects}</td>
                          <td className="table-cell text-center">{d.timetable_entries}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          )}

          {/* Weekly Schedule */}
          {tab === 'weekly' && weeklyChart && (
            <div className="card p-6">
              <h3 style={{ fontSize:14, fontWeight:600, margin:'0 0 12px', color:'#334155' }} className="dark:text-slate-300">Periods Distribution by Day</h3>
              <Bar data={weeklyChart} options={chartOpts} height={100} />
            </div>
          )}
        </>
      )}
    </div>
  );
}
