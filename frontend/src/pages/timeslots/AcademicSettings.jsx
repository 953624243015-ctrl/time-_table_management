import { useState, useEffect } from 'react';
import { Settings, Save, RefreshCw } from 'lucide-react';
import { timeslotAPI } from '../../api';
import LoadingSpinner from '../../components/common/LoadingSpinner';
import toast from 'react-hot-toast';

const DAYS = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];

const AcademicSettings = () => {
  const [settings, setSettings] = useState({});
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [workingDays, setWorkingDays] = useState([]);
  const [academicYears, setAcademicYears] = useState([]);
  const [semesters, setSemesters] = useState([]);

  const fetchAll = async () => {
    setLoading(true);
    try {
      const [setRes, ayRes, semRes] = await Promise.all([
        timeslotAPI.getSettings(),
        timeslotAPI.getAcademicYears(),
        timeslotAPI.getSemesters(),
      ]);
      const s = setRes.data.data || {};
      setSettings(s);
      setWorkingDays((s.working_days || 'Monday,Tuesday,Wednesday,Thursday,Friday').split(',').map(d => d.trim()));
      setAcademicYears(ayRes.data.data || []);
      setSemesters(semRes.data.data || []);
    } catch { toast.error('Failed to load settings'); }
    finally { setLoading(false); }
  };

  useEffect(() => { fetchAll(); }, []);

  const toggleDay = (day) => {
    setWorkingDays(prev => prev.includes(day) ? prev.filter(d => d !== day) : [...prev, day]);
  };

  const handleSave = async () => {
    setSaving(true);
    try {
      const ordered = DAYS.filter(d => workingDays.includes(d));
      await timeslotAPI.updateSettings({
        settings: {
          ...settings,
          working_days: ordered.join(','),
        }
      });
      toast.success('Academic settings saved successfully');
    } catch (err) { toast.error(err.response?.data?.message || 'Save failed'); }
    finally { setSaving(false); }
  };

  if (loading) return <LoadingSpinner text="Loading settings..." />;

  return (
    <div className="space-y-6 max-w-3xl">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 bg-indigo-50 dark:bg-indigo-900/20 rounded-xl flex items-center justify-center">
            <Settings className="w-6 h-6 text-indigo-600" />
          </div>
          <div>
            <h2 className="text-lg font-semibold text-slate-900 dark:text-slate-100">Academic Settings</h2>
            <p className="text-sm text-slate-500">Configure academic year, working days and schedule</p>
          </div>
        </div>
        <div className="flex gap-2">
          <button onClick={fetchAll} className="btn-secondary"><RefreshCw className="w-4 h-4" /> Reload</button>
          <button onClick={handleSave} disabled={saving} className="btn-primary">
            {saving ? <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full spinner" /> : <Save className="w-4 h-4" />}
            Save Settings
          </button>
        </div>
      </div>

      {/* Working Days */}
      <div className="card p-6">
        <h3 className="font-semibold text-slate-900 dark:text-slate-100 mb-4">Working Days</h3>
        <div className="flex flex-wrap gap-3">
          {DAYS.map(day => (
            <button
              key={day}
              type="button"
              onClick={() => toggleDay(day)}
              className={`px-4 py-2 rounded-xl text-sm font-medium transition-all border-2 ${
                workingDays.includes(day)
                  ? 'bg-primary-600 border-primary-600 text-white shadow-md'
                  : 'bg-white dark:bg-slate-800 border-slate-200 dark:border-slate-600 text-slate-600 dark:text-slate-400 hover:border-primary-300'
              }`}
            >
              {day}
            </button>
          ))}
        </div>
        <p className="text-xs text-slate-400 mt-3">Active: {workingDays.join(', ')}</p>
      </div>

      {/* General Settings */}
      <div className="card p-6">
        <h3 className="font-semibold text-slate-900 dark:text-slate-100 mb-4">Schedule Configuration</h3>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">Academic Year</label>
            <input className="input-field" value={settings.academic_year || ''} onChange={e => setSettings(s => ({ ...s, academic_year: e.target.value }))} placeholder="2025-2026" />
          </div>
          <div>
            <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">Periods Per Day</label>
            <input type="number" min="4" max="12" className="input-field" value={settings.periods_per_day || 8} onChange={e => setSettings(s => ({ ...s, periods_per_day: e.target.value }))} />
          </div>
          <div>
            <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">Lunch Period Number</label>
            <input type="number" min="1" max="10" className="input-field" value={settings.lunch_period || 5} onChange={e => setSettings(s => ({ ...s, lunch_period: e.target.value }))} />
          </div>
          <div>
            <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">Max Consecutive Periods (Faculty)</label>
            <input type="number" min="1" max="6" className="input-field" value={settings.max_consecutive_periods || 3} onChange={e => setSettings(s => ({ ...s, max_consecutive_periods: e.target.value }))} />
          </div>
        </div>
      </div>

      {/* Academic Years */}
      <div className="card p-6">
        <h3 className="font-semibold text-slate-900 dark:text-slate-100 mb-4">Academic Years</h3>
        <div className="space-y-2">
          {academicYears.map(ay => (
            <div key={ay.id} className="flex items-center justify-between p-3 bg-slate-50 dark:bg-slate-700/50 rounded-lg">
              <span className="font-medium text-slate-900 dark:text-slate-100">{ay.year_label}</span>
              <div className="flex items-center gap-3">
                <span className="text-xs text-slate-500">{ay.start_date?.substring(0,10)} → {ay.end_date?.substring(0,10)}</span>
                {ay.is_current ? <span className="badge-active">Current</span> : <span className="badge-inactive">Inactive</span>}
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Semesters */}
      <div className="card p-6">
        <h3 className="font-semibold text-slate-900 dark:text-slate-100 mb-4">Semesters</h3>
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr>{['Semester', 'Academic Year', 'Start Date', 'End Date', 'Status'].map(h => <th key={h} className="table-header text-left">{h}</th>)}</tr>
            </thead>
            <tbody>
              {semesters.map(sem => (
                <tr key={sem.id} className="hover:bg-slate-50 dark:hover:bg-slate-700/30">
                  <td className="table-cell font-medium">{sem.name}</td>
                  <td className="table-cell text-slate-500">{sem.year_label}</td>
                  <td className="table-cell text-slate-500">{sem.start_date?.substring(0,10)}</td>
                  <td className="table-cell text-slate-500">{sem.end_date?.substring(0,10)}</td>
                  <td className="table-cell"><span className={sem.is_current ? 'badge-active' : 'badge-inactive'}>{sem.is_current ? 'Current' : 'Inactive'}</span></td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

export default AcademicSettings;
