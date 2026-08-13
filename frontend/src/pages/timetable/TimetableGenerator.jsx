import { useState, useEffect } from 'react';
import { Cpu, Zap, CheckCircle2, AlertTriangle, RefreshCw, List } from 'lucide-react';
import { timetableAPI, departmentAPI, timeslotAPI } from '../../api';
import LoadingSpinner from '../../components/common/LoadingSpinner';
import notify from '../../utils/notify';

const TimetableGenerator = () => {
  const [depts, setDepts] = useState([]);
  const [acYears, setAcYears] = useState([]);
  const [logs, setLogs] = useState([]);
  const [form, setForm] = useState({ department_id: '', semester: '', academic_year_id: '' });
  const [generating, setGenerating] = useState(false);
  const [result, setResult] = useState(null);
  const [loadingLogs, setLoadingLogs] = useState(false);

  useEffect(() => {
    departmentAPI.getAll({ limit: 100 }).then(r => setDepts(r.data.data || []));
    timeslotAPI.getAcademicYears().then(r => {
      const years = r.data.data || [];
      setAcYears(years);
      const current = years.find(y => y.is_current);
      if (current) setForm(f => ({ ...f, academic_year_id: current.id }));
    });
    fetchLogs();
  }, []);

  const fetchLogs = async () => {
    setLoadingLogs(true);
    try { const res = await timetableAPI.list(); setLogs(res.data.data || []); }
    catch { }
    finally { setLoadingLogs(false); }
  };

  const handleGenerate = async (e) => {
    e.preventDefault();
    if (!form.department_id || !form.semester || !form.academic_year_id) {
      return notify.error('Please select Department, Semester and Academic Year');
    }
    setGenerating(true);
    setResult(null);
    try {
      const res = await timetableAPI.generate({
        department_id: +form.department_id,
        semester: +form.semester,
        academic_year_id: +form.academic_year_id,
      });
      setResult(res.data.data);
      notify.success('Timetable generated successfully!');
      fetchLogs();
    } catch (err) {
      notify.error(err.response?.data?.message || 'Generation failed');
    } finally {
      setGenerating(false);
    }
  };

  const statusColor = {
    optimal: 'text-green-600 bg-green-50 dark:bg-green-900/20',
    good: 'text-blue-600 bg-blue-50 dark:bg-blue-900/20',
    acceptable: 'text-amber-600 bg-amber-50 dark:bg-amber-900/20',
  };

  const logStatusColor = { completed: 'badge-active', failed: 'badge-inactive', running: 'inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800' };

  return (
    <div className="space-y-6 max-w-4xl">
      <div className="flex items-center gap-3">
        <div className="w-10 h-10 bg-indigo-50 dark:bg-indigo-900/20 rounded-xl flex items-center justify-center">
          <Cpu className="w-6 h-6 text-indigo-600" />
        </div>
        <div>
          <h2 className="text-lg font-semibold text-slate-900 dark:text-slate-100">AI Timetable Generator</h2>
          <p className="text-sm text-slate-500">Powered by Genetic Algorithm â€” generates conflict-free schedules</p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Generator Form */}
        <div className="card p-6">
          <h3 className="font-semibold text-slate-900 dark:text-slate-100 mb-5 flex items-center gap-2">
            <Zap className="w-5 h-5 text-primary-600" /> Generate New Timetable
          </h3>
          <form onSubmit={handleGenerate} className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">Department *</label>
              <select className="input-field" value={form.department_id} onChange={e => setForm(f => ({ ...f, department_id: e.target.value }))} required>
                <option value="">Select Department</option>
                {depts.map(d => <option key={d.id} value={d.id}>{d.name} ({d.code})</option>)}
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">Semester *</label>
              <select className="input-field" value={form.semester} onChange={e => setForm(f => ({ ...f, semester: e.target.value }))} required>
                <option value="">Select Semester</option>
                {[1,2,3,4,5,6,7,8].map(s => <option key={s} value={s}>Semester {s}</option>)}
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">Academic Year *</label>
              <select className="input-field" value={form.academic_year_id} onChange={e => setForm(f => ({ ...f, academic_year_id: e.target.value }))} required>
                <option value="">Select Academic Year</option>
                {acYears.map(y => <option key={y.id} value={y.id}>{y.year_label}{y.is_current ? ' (Current)' : ''}</option>)}
              </select>
            </div>

            <button type="submit" disabled={generating} className="btn-primary w-full justify-center py-3 mt-2">
              {generating ? (
                <span className="flex items-center gap-2">
                  <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full spinner" />
                  Running AI Algorithm...
                </span>
              ) : (
                <span className="flex items-center gap-2"><Cpu className="w-4 h-4" /> Generate Timetable</span>
              )}
            </button>
          </form>

          {/* AI Process Steps */}
          <div className="mt-6 p-4 bg-slate-50 dark:bg-slate-700/50 rounded-xl">
            <p className="text-xs font-semibold text-slate-500 dark:text-slate-400 mb-3">AI Algorithm Steps</p>
            <div className="space-y-2">
              {['Initialize random population','Calculate fitness scores','Detect conflicts','Tournament selection','Single-point crossover','Random mutation','Evolve to next generation','Repeat until zero conflicts'].map((step, i) => (
                <div key={i} className="flex items-center gap-2">
                  <div className={`w-5 h-5 rounded-full flex items-center justify-center text-xs font-bold flex-shrink-0 ${generating ? 'bg-primary-100 text-primary-600 animate-pulse' : 'bg-slate-200 dark:bg-slate-600 text-slate-500'}`}>{i + 1}</div>
                  <span className="text-xs text-slate-600 dark:text-slate-400">{step}</span>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Result Panel */}
        <div className="space-y-4">
          {generating && (
            <div className="card p-8 flex flex-col items-center justify-center gap-4">
              <div className="w-16 h-16 border-4 border-primary-200 border-t-primary-600 rounded-full spinner" />
              <div className="text-center">
                <p className="font-semibold text-slate-900 dark:text-slate-100">AI is optimizing...</p>
                <p className="text-sm text-slate-500 mt-1">Running Genetic Algorithm</p>
              </div>
            </div>
          )}

          {result && !generating && (
            <div className="card p-6 animate-bounce-in">
              <div className="flex items-center gap-2 mb-5">
                <CheckCircle2 className="w-6 h-6 text-green-500" />
                <h3 className="font-semibold text-slate-900 dark:text-slate-100">Generation Complete</h3>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="bg-slate-50 dark:bg-slate-700/50 rounded-xl p-4 text-center">
                  <p className="text-3xl font-bold text-primary-600">{result.fitnessScore?.toFixed(1)}</p>
                  <p className="text-xs text-slate-500 mt-1">Fitness Score</p>
                </div>
                <div className={`rounded-xl p-4 text-center ${result.conflicts === 0 ? 'bg-green-50 dark:bg-green-900/20' : 'bg-amber-50 dark:bg-amber-900/20'}`}>
                  <p className={`text-3xl font-bold ${result.conflicts === 0 ? 'text-green-600' : 'text-amber-600'}`}>{result.conflicts}</p>
                  <p className="text-xs text-slate-500 mt-1">Conflicts</p>
                </div>
                <div className="bg-slate-50 dark:bg-slate-700/50 rounded-xl p-4 text-center">
                  <p className="text-3xl font-bold text-indigo-600">{result.generations}</p>
                  <p className="text-xs text-slate-500 mt-1">Generations Run</p>
                </div>
                <div className="bg-slate-50 dark:bg-slate-700/50 rounded-xl p-4 text-center">
                  <p className="text-3xl font-bold text-teal-600">{result.generated}</p>
                  <p className="text-xs text-slate-500 mt-1">Schedule Entries</p>
                </div>
              </div>
              <div className={`mt-4 px-4 py-3 rounded-xl text-center font-medium text-sm ${statusColor[result.optimizationStatus] || statusColor.acceptable}`}>
                Status: {result.optimizationStatus?.toUpperCase()}
                {result.conflicts === 0 && ' âœ“ Zero Conflicts!'}
              </div>
            </div>
          )}

          {!result && !generating && (
            <div className="card p-8 text-center text-slate-400">
              <Cpu className="w-12 h-12 mx-auto mb-3 opacity-30" />
              <p className="font-medium">Ready to Generate</p>
              <p className="text-sm mt-1">Select options and click Generate</p>
            </div>
          )}
        </div>
      </div>

      {/* Generation Logs */}
      <div className="card">
        <div className="px-6 py-4 border-b border-slate-200 dark:border-slate-700 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <List className="w-5 h-5 text-slate-500" />
            <h3 className="font-semibold text-slate-900 dark:text-slate-100">Generation History</h3>
          </div>
          <button onClick={fetchLogs} className="p-1.5 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-700 text-slate-400"><RefreshCw className="w-4 h-4" /></button>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr>{['Department', 'Semester', 'Academic Year', 'Generations', 'Fitness', 'Conflicts', 'Status', 'Generated By', 'Time'].map(h => <th key={h} className="table-header text-left">{h}</th>)}</tr>
            </thead>
            <tbody>
              {loadingLogs ? <tr><td colSpan={9}><LoadingSpinner /></td></tr>
                : !logs.length ? <tr><td colSpan={9} className="text-center py-8 text-slate-400">No generation history</td></tr>
                : logs.map(log => (
                  <tr key={log.id} className="hover:bg-slate-50 dark:hover:bg-slate-700/30">
                    <td className="table-cell font-medium text-sm">{log.department_name || 'â€”'}</td>
                    <td className="table-cell text-center">Sem {log.semester}</td>
                    <td className="table-cell text-slate-500">{log.year_label}</td>
                    <td className="table-cell text-center">{log.generation_count}</td>
                    <td className="table-cell text-center font-mono text-primary-600">{Number(log.fitness_score).toFixed(1)}</td>
                    <td className="table-cell text-center">{log.conflict_count}</td>
                    <td className="table-cell"><span className={logStatusColor[log.status] || 'badge-inactive'}>{log.status}</span></td>
                    <td className="table-cell text-slate-500 text-xs">{log.generated_by_name || 'â€”'}</td>
                    <td className="table-cell text-slate-500 text-xs">{new Date(log.started_at).toLocaleString()}</td>
                  </tr>
                ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

export default TimetableGenerator;

