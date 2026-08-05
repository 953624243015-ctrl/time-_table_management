import { useState, useEffect } from 'react';
import { Timer, Play, Save, Check, RefreshCw, Zap } from 'lucide-react';
import { intervalAPI } from '../../api';
import LoadingSpinner from '../../components/common/LoadingSpinner';
import toast from 'react-hot-toast';

const DEFAULT_FORM = {
  start_time: '09:00',
  period_duration: 60,
  num_periods: 8,
  interval_duration: 15,
  interval_after_period: 2,
  lunch_duration: 50,
  lunch_after_period: 4,
  include_saturday: 1,
};

export default function IntervalSettings() {
  const [form, setForm]         = useState(DEFAULT_FORM);
  const [preview, setPreview]   = useState([]);
  const [loading, setLoading]   = useState(false);
  const [saving, setSaving]     = useState(false);
  const [applying, setApplying] = useState(false);

  useEffect(() => {
    intervalAPI.getSettings().then(r => {
      if (r.data.data) {
        const s = r.data.data;
        setForm({
          start_time:           s.start_time?.substring(0, 5) || '09:00',
          period_duration:      s.period_duration,
          num_periods:          s.num_periods,
          interval_duration:    s.interval_duration,
          interval_after_period:s.interval_after_period,
          lunch_duration:       s.lunch_duration,
          lunch_after_period:   s.lunch_after_period,
          include_saturday:     s.include_saturday,
        });
      }
    });
  }, []);

  const f = (key, val) => setForm(p => ({ ...p, [key]: val }));

  const handleCalculate = async () => {
    setLoading(true);
    try {
      const res = await intervalAPI.calculate(form);
      setPreview(res.data.data.slots);
      toast.success(res.data.message);
    } catch (err) {
      toast.error(err.response?.data?.message || 'Calculation failed');
    } finally { setLoading(false); }
  };

  const handleSave = async () => {
    setSaving(true);
    try {
      await intervalAPI.saveSettings(form);
      toast.success('Interval settings saved');
    } catch (err) {
      toast.error(err.response?.data?.message || 'Save failed');
    } finally { setSaving(false); }
  };

  const handleApply = async () => {
    if (!preview.length) return toast.error('Generate preview first');
    if (!confirm(`Apply ${preview.length} time slots? This will REPLACE current time slots.`)) return;
    setApplying(true);
    try {
      await intervalAPI.apply({ slots: preview });
      toast.success('Time slots applied to schedule!');
    } catch (err) {
      toast.error(err.response?.data?.message || 'Apply failed');
    } finally { setApplying(false); }
  };

  const slotColor = (slot) => {
    if (slot.is_break && slot.break_type === 'lunch') return { bg: '#fef3c7', border: '#fcd34d', text: '#92400e' };
    if (slot.is_break) return { bg: '#f0fdf4', border: '#86efac', text: '#166534' };
    return { bg: '#eff6ff', border: '#93c5fd', text: '#1e40af' };
  };

  return (
    <div className="space-y-6 max-w-5xl">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div style={{ width:40, height:40, background:'#eff6ff', borderRadius:12, display:'flex', alignItems:'center', justifyContent:'center' }}>
            <Timer size={22} color="#2563eb" />
          </div>
          <div>
            <h2 style={{ fontSize:18, fontWeight:700, color:'#0f172a', margin:0 }} className="dark:text-slate-100">Interval & Time Settings</h2>
            <p style={{ fontSize:13, color:'#64748b', margin:0 }}>Auto-calculate period timings with breaks</p>
          </div>
        </div>
        <div className="flex gap-2">
          <button onClick={handleSave} disabled={saving} className="btn-secondary">
            {saving ? <span className="w-4 h-4 border-2 border-slate-400 border-t-transparent rounded-full spinner" /> : <Save size={15} />}
            Save Settings
          </button>
          <button onClick={handleCalculate} disabled={loading} className="btn-primary">
            {loading ? <span className="w-4 h-4 border-2 border-white border-t-transparent rounded-full spinner" /> : <Play size={15} />}
            Generate Preview
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Config form */}
        <div className="card p-6 space-y-4">
          <h3 style={{ fontSize:15, fontWeight:600, margin:0, color:'#334155' }} className="dark:text-slate-200">Schedule Configuration</h3>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-slate-600 dark:text-slate-400 mb-1">Start Time</label>
              <input type="time" className="input-field" value={form.start_time} onChange={e => f('start_time', e.target.value)} />
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-600 dark:text-slate-400 mb-1">Period Duration (min)</label>
              <select className="input-field" value={form.period_duration} onChange={e => f('period_duration', +e.target.value)}>
                {[45, 50, 55, 60, 75, 90].map(d => <option key={d} value={d}>{d} minutes</option>)}
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-600 dark:text-slate-400 mb-1">Number of Periods</label>
              <select className="input-field" value={form.num_periods} onChange={e => f('num_periods', +e.target.value)}>
                {[4,5,6,7,8,9,10].map(n => <option key={n} value={n}>{n} periods</option>)}
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-600 dark:text-slate-400 mb-1">Short Interval (min)</label>
              <select className="input-field" value={form.interval_duration} onChange={e => f('interval_duration', +e.target.value)}>
                {[10, 15, 20, 30].map(d => <option key={d} value={d}>{d} minutes</option>)}
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-600 dark:text-slate-400 mb-1">Interval After Period</label>
              <select className="input-field" value={form.interval_after_period} onChange={e => f('interval_after_period', +e.target.value)}>
                {[1,2,3,4].map(n => <option key={n} value={n}>After Period {n}</option>)}
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-600 dark:text-slate-400 mb-1">Lunch Duration (min)</label>
              <select className="input-field" value={form.lunch_duration} onChange={e => f('lunch_duration', +e.target.value)}>
                {[30, 40, 45, 50, 60].map(d => <option key={d} value={d}>{d} minutes</option>)}
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-600 dark:text-slate-400 mb-1">Lunch After Period</label>
              <select className="input-field" value={form.lunch_after_period} onChange={e => f('lunch_after_period', +e.target.value)}>
                {[2,3,4,5,6].map(n => <option key={n} value={n}>After Period {n}</option>)}
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-600 dark:text-slate-400 mb-1">Include Saturday</label>
              <select className="input-field" value={form.include_saturday} onChange={e => f('include_saturday', +e.target.value)}>
                <option value={1}>Yes</option>
                <option value={0}>No (Mon–Fri only)</option>
              </select>
            </div>
          </div>

          {/* Example display */}
          <div style={{ background:'#f8fafc', borderRadius:8, padding:12, border:'1px solid #e2e8f0' }}>
            <p style={{ fontSize:12, fontWeight:600, color:'#64748b', marginBottom:6 }}>EXAMPLE</p>
            <p style={{ fontSize:13, color:'#475569', margin:0 }}>
              Period 1: {form.start_time} → {addMinutes(form.start_time, +form.period_duration)}
            </p>
            <p style={{ fontSize:13, color:'#10b981', margin:'2px 0' }}>
              Interval: {addMinutes(form.start_time, +form.period_duration)} → {addMinutes(form.start_time, +form.period_duration + +form.interval_duration)} ({form.interval_duration} min)
            </p>
            <p style={{ fontSize:13, color:'#475569' }}>
              Period 2: {addMinutes(form.start_time, +form.period_duration + +form.interval_duration)} → {addMinutes(form.start_time, +form.period_duration * 2 + +form.interval_duration)}
            </p>
          </div>
        </div>

        {/* Preview */}
        <div className="card p-6">
          <div className="flex items-center justify-between mb-4">
            <h3 style={{ fontSize:15, fontWeight:600, margin:0, color:'#334155' }} className="dark:text-slate-200">Generated Schedule Preview</h3>
            {preview.length > 0 && (
              <button onClick={handleApply} disabled={applying} className="btn-primary" style={{ fontSize:12, padding:'6px 12px' }}>
                {applying ? <span className="w-3 h-3 border-2 border-white border-t-transparent rounded-full spinner" /> : <Zap size={13} />}
                Apply to System
              </button>
            )}
          </div>

          {loading && <LoadingSpinner />}

          {!loading && preview.length === 0 && (
            <div style={{ textAlign:'center', padding:'40px 20px', color:'#94a3b8' }}>
              <Timer size={40} style={{ margin:'0 auto 10px', opacity:0.3 }} />
              <p style={{ fontSize:14 }}>Click "Generate Preview" to see the schedule</p>
            </div>
          )}

          {!loading && preview.length > 0 && (
            <div className="space-y-2" style={{ maxHeight:360, overflowY:'auto' }}>
              {preview.map((slot, i) => {
                const c = slotColor(slot);
                return (
                  <div key={i} style={{ display:'flex', alignItems:'center', gap:10, padding:'8px 12px', borderRadius:8, background:c.bg, border:`1px solid ${c.border}` }}>
                    <div style={{ width:28, height:28, borderRadius:6, background:c.border, display:'flex', alignItems:'center', justifyContent:'center', flexShrink:0 }}>
                      {slot.is_break ? '☕' : <span style={{ fontSize:11, fontWeight:700, color:c.text }}>{slot.period_number}</span>}
                    </div>
                    <div style={{ flex:1 }}>
                      <p style={{ fontSize:13, fontWeight:600, color:c.text, margin:0 }}>{slot.slot_name}</p>
                      <p style={{ fontSize:11, color:c.text, opacity:0.8, margin:0 }}>{slot.start_time} – {slot.end_time} ({slot.duration} min)</p>
                    </div>
                    {slot.is_break && <span style={{ fontSize:10, fontWeight:700, background:c.border, color:c.text, padding:'2px 6px', borderRadius:99 }}>{slot.break_type?.toUpperCase()}</span>}
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

function addMinutes(timeStr, mins) {
  const [h, m] = (timeStr || '09:00').split(':').map(Number);
  const total = h * 60 + m + mins;
  return `${String(Math.floor(total / 60) % 24).padStart(2,'0')}:${String(total % 60).padStart(2,'0')}`;
}
