import { useState, useEffect } from 'react';
import { History, Save, RotateCcw, Eye, Calendar, Star } from 'lucide-react';
import { historyAPI, departmentAPI, timeslotAPI } from '../../api';
import Modal from '../../components/common/Modal';
import ConfirmDialog from '../../components/common/ConfirmDialog';
import LoadingSpinner from '../../components/common/LoadingSpinner';
import toast from 'react-hot-toast';

export default function TimetableHistory() {
  const [versions, setVersions]     = useState([]);
  const [depts, setDepts]           = useState([]);
  const [acYears, setAcYears]       = useState([]);
  const [loading, setLoading]       = useState(false);
  const [saving, setSaving]         = useState(false);
  const [filters, setFilters]       = useState({ department_id:'', semester:'', academic_year_id:'' });
  const [previewId, setPreviewId]   = useState(null);
  const [preview, setPreview]       = useState(null);
  const [loadingPreview, setLoadingPreview] = useState(false);
  const [restoreId, setRestoreId]   = useState(null);
  const [restoring, setRestoring]   = useState(false);

  const fetchVersions = async () => {
    setLoading(true);
    try {
      const res = await historyAPI.list(filters);
      setVersions(res.data.data || []);
    } catch { toast.error('Failed to load history'); }
    finally { setLoading(false); }
  };

  useEffect(() => {
    departmentAPI.getAll({ limit:100 }).then(r => setDepts(r.data.data || []));
    timeslotAPI.getAcademicYears().then(r => {
      const years = r.data.data || [];
      setAcYears(years);
      const cur = years.find(y => y.is_current);
      if (cur) setFilters(f => ({ ...f, academic_year_id: String(cur.id) }));
    });
  }, []);

  useEffect(() => { fetchVersions(); }, [filters.department_id, filters.semester, filters.academic_year_id]);

  const handleSaveVersion = async () => {
    if (!filters.department_id || !filters.semester || !filters.academic_year_id) {
      return toast.error('Select Department, Semester and Academic Year first');
    }
    setSaving(true);
    try {
      const res = await historyAPI.save({
        department_id:    +filters.department_id,
        semester:         +filters.semester,
        academic_year_id: +filters.academic_year_id,
        version_label:    `Snapshot ${new Date().toLocaleDateString('en-IN')}`,
      });
      toast.success(res.data.message);
      fetchVersions();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Snapshot failed');
    } finally { setSaving(false); }
  };

  const openPreview = async (id) => {
    setPreviewId(id);
    setLoadingPreview(true);
    try {
      const res = await historyAPI.getOne(id);
      setPreview(res.data.data);
    } catch { toast.error('Failed to load version'); }
    finally { setLoadingPreview(false); }
  };

  const handleRestore = async () => {
    setRestoring(true);
    try {
      const res = await historyAPI.restore(restoreId);
      toast.success(res.data.message);
      setRestoreId(null);
      fetchVersions();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Restore failed');
    } finally { setRestoring(false); }
  };

  const DAYS = ['Monday','Tuesday','Wednesday','Thursday','Friday','Saturday'];

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-3">
          <div style={{ width:40, height:40, background:'#fdf4ff', borderRadius:12, display:'flex', alignItems:'center', justifyContent:'center' }}>
            <History size={22} color="#a855f7" />
          </div>
          <div>
            <h2 style={{ fontSize:18, fontWeight:700, color:'#0f172a', margin:0 }} className="dark:text-slate-100">Timetable History</h2>
            <p style={{ fontSize:13, color:'#64748b', margin:0 }}>View, compare and restore previous versions</p>
          </div>
        </div>
        <button onClick={handleSaveVersion} disabled={saving} className="btn-primary">
          {saving ? <span className="w-4 h-4 border-2 border-white border-t-transparent rounded-full spinner" /> : <Save size={15} />}
          Save Current Snapshot
        </button>
      </div>

      {/* Filters */}
      <div className="card p-4 flex flex-wrap gap-3">
        <select className="input-field w-52" value={filters.department_id} onChange={e => setFilters(f => ({ ...f, department_id:e.target.value }))}>
          <option value="">All Departments</option>
          {depts.map(d => <option key={d.id} value={d.id}>{d.code} – {d.name}</option>)}
        </select>
        <select className="input-field w-36" value={filters.semester} onChange={e => setFilters(f => ({ ...f, semester:e.target.value }))}>
          <option value="">All Semesters</option>
          {[1,2,3,4,5,6,7,8].map(s => <option key={s} value={s}>Semester {s}</option>)}
        </select>
        <select className="input-field w-40" value={filters.academic_year_id} onChange={e => setFilters(f => ({ ...f, academic_year_id:e.target.value }))}>
          <option value="">All Years</option>
          {acYears.map(y => <option key={y.id} value={y.id}>{y.year_label}{y.is_current ? ' ★':''}</option>)}
        </select>
      </div>

      {/* Versions table */}
      <div className="card overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr>{['Version','Department','Semester','Entries','Fitness','Saved By','Date','Active','Actions'].map(h => (
                <th key={h} className="table-header text-left">{h}</th>
              ))}</tr>
            </thead>
            <tbody>
              {loading ? <tr><td colSpan={9}><LoadingSpinner /></td></tr>
                : !versions.length ? <tr><td colSpan={9} className="text-center py-12 text-slate-400">No snapshots found. Save the current timetable as a version first.</td></tr>
                : versions.map(v => (
                  <tr key={v.id} className={`hover:bg-slate-50 dark:hover:bg-slate-700/30 transition-colors ${v.is_active ? 'bg-green-50/50 dark:bg-green-900/10' : ''}`}>
                    <td className="table-cell">
                      <div className="flex items-center gap-2">
                        {v.is_active && <Star size={12} color="#16a34a" fill="#16a34a" />}
                        <span style={{ fontWeight:700, color:'#7c3aed' }}>v{v.version_number}</span>
                      </div>
                      <p style={{ fontSize:11, color:'#94a3b8', margin:0 }}>{v.version_label}</p>
                    </td>
                    <td className="table-cell">{v.dept_name || '—'}</td>
                    <td className="table-cell text-center">Sem {v.semester}</td>
                    <td className="table-cell text-center font-mono">{v.total_entries}</td>
                    <td className="table-cell text-center">
                      <span style={{ fontWeight:700, color: +v.fitness_score >= 90 ? '#16a34a' : '#d97706' }}>
                        {Number(v.fitness_score).toFixed(1)}
                      </span>
                    </td>
                    <td className="table-cell text-slate-500">{v.created_by_name || '—'}</td>
                    <td className="table-cell text-slate-500 text-xs">{new Date(v.created_at).toLocaleString('en-IN')}</td>
                    <td className="table-cell">{v.is_active ? <span className="badge-active">Active</span> : <span className="badge-inactive">Old</span>}</td>
                    <td className="table-cell">
                      <div className="flex gap-1">
                        <button onClick={() => openPreview(v.id)} className="p-1.5 rounded-lg hover:bg-blue-50 text-blue-600 transition-colors" title="Preview">
                          <Eye size={15} />
                        </button>
                        <button onClick={() => setRestoreId(v.id)} className="p-1.5 rounded-lg hover:bg-purple-50 text-purple-600 transition-colors" title="Restore">
                          <RotateCcw size={15} />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Preview modal */}
      <Modal open={!!previewId} onClose={() => { setPreviewId(null); setPreview(null); }} title={preview ? `Version ${preview.version_number} — ${preview.dept_name}` : 'Loading...'} size="xl">
        {loadingPreview ? <LoadingSpinner /> : preview && (
          <div>
            <div className="flex gap-4 mb-4 flex-wrap">
              {[['Entries', preview.total_entries], ['Fitness', Number(preview.fitness_score).toFixed(1)], ['Semester', `Sem ${preview.semester}`], ['Year', preview.year_label]].map(([l,v]) => (
                <div key={l} style={{ background:'#f8fafc', borderRadius:8, padding:'8px 14px', textAlign:'center', border:'1px solid #e2e8f0' }}>
                  <p style={{ fontSize:18, fontWeight:700, color:'#7c3aed', margin:0 }}>{v}</p>
                  <p style={{ fontSize:11, color:'#64748b', margin:0 }}>{l}</p>
                </div>
              ))}
            </div>
            <div style={{ maxHeight:400, overflowY:'auto' }}>
              <table className="w-full" style={{ borderCollapse:'collapse', fontSize:12 }}>
                <thead>
                  <tr style={{ background:'#1e40af' }}>
                    {['Day','Period','Subject','Staff','Room','Class'].map(h => (
                      <th key={h} style={{ padding:'8px 10px', color:'#fff', textAlign:'left', border:'1px solid #1d4ed8' }}>{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {(preview.snapshot || []).slice(0,50).map((e, i) => (
                    <tr key={i} style={{ background: i%2===0 ? '#fff':'#f8fafc' }}>
                      <td style={{ padding:'6px 10px', border:'1px solid #e2e8f0' }}>{e.day_of_week}</td>
                      <td style={{ padding:'6px 10px', border:'1px solid #e2e8f0' }}>P{e.period_number}</td>
                      <td style={{ padding:'6px 10px', border:'1px solid #e2e8f0', fontWeight:600 }}>{e.subject_code}</td>
                      <td style={{ padding:'6px 10px', border:'1px solid #e2e8f0' }}>{e.staff_name}</td>
                      <td style={{ padding:'6px 10px', border:'1px solid #e2e8f0' }}>{e.room_number}</td>
                      <td style={{ padding:'6px 10px', border:'1px solid #e2e8f0' }}>Y{e.year} S{e.semester} {e.section}</td>
                    </tr>
                  ))}
                  {(preview.snapshot || []).length > 50 && (
                    <tr><td colSpan={6} style={{ textAlign:'center', padding:8, color:'#94a3b8', fontSize:12 }}>
                      ... and {(preview.snapshot || []).length - 50} more entries
                    </td></tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </Modal>

      <ConfirmDialog
        open={!!restoreId}
        title="Restore Timetable Version"
        message="This will replace the current active timetable with this version. The current timetable will be deactivated. Continue?"
        onConfirm={handleRestore}
        onCancel={() => setRestoreId(null)}
        loading={restoring}
        danger={false}
      />
    </div>
  );
}
