import { useState, useEffect } from 'react';
import { Plus, Pencil, Trash2, BookOpen } from 'lucide-react';
import { subjectAPI, departmentAPI, staffAPI } from '../../api';
import useCRUD from '../../hooks/useCRUD';
import SearchBar from '../../components/common/SearchBar';
import Pagination from '../../components/common/Pagination';
import Modal from '../../components/common/Modal';
import ConfirmDialog from '../../components/common/ConfirmDialog';
import LoadingSpinner from '../../components/common/LoadingSpinner';
import notify from '../../utils/notify';

const empty = { subject_code: '', subject_name: '', department_id: '', semester: '', hours_per_week: 3, subject_type: 'theory', credits: 3 };

const Subjects = () => {
  const { items, loading, pagination, params, updateParam, create, update, remove } = useCRUD(subjectAPI);
  const [depts, setDepts] = useState([]);
  const [modal, setModal] = useState(false);
  const [editing, setEditing] = useState(null);
  const [form, setForm] = useState(empty);
  const [saving, setSaving] = useState(false);
  const [deleteId, setDeleteId] = useState(null);

  useEffect(() => { departmentAPI.getAll({ limit: 100 }).then(r => setDepts(r.data.data || [])); }, []);

  const openCreate = () => { setEditing(null); setForm(empty); setModal(true); };
  const openEdit = (item) => {
    setEditing(item);
    setForm({ subject_code: item.subject_code, subject_name: item.subject_name, department_id: item.department_id, semester: item.semester, hours_per_week: item.hours_per_week, subject_type: item.subject_type, credits: item.credits });
    setModal(true);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSaving(true);
    try {
      if (editing) await update(editing.id, form);
      else await create(form);
      setModal(false);
    } catch (err) { notify.error(err.response?.data?.message || 'Operation failed'); }
    finally { setSaving(false); }
  };

  const typeColor = (t) => t === 'lab' ? 'bg-amber-100 text-amber-800 dark:bg-amber-900/30 dark:text-amber-300' : 'bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-300';

  return (
    <div className="space-y-4">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 bg-orange-50 dark:bg-orange-900/20 rounded-xl flex items-center justify-center">
            <BookOpen className="w-6 h-6 text-orange-600" />
          </div>
          <div>
            <h2 className="text-lg font-semibold text-slate-900 dark:text-slate-100">Subjects</h2>
            <p className="text-sm text-slate-500">{pagination.total} subjects</p>
          </div>
        </div>
        <div className="flex gap-3 flex-wrap">
          <select className="input-field w-44" value={params.department_id || ''} onChange={e => updateParam('department_id', e.target.value || undefined)}>
            <option value="">All Depts</option>
            {depts.map(d => <option key={d.id} value={d.id}>{d.code}</option>)}
          </select>
          <select className="input-field w-28" value={params.semester || ''} onChange={e => updateParam('semester', e.target.value || undefined)}>
            <option value="">All Sem</option>
            {[1,2,3,4,5,6,7,8].map(s => <option key={s} value={s}>Sem {s}</option>)}
          </select>
          <select className="input-field w-32" value={params.subject_type || ''} onChange={e => updateParam('subject_type', e.target.value || undefined)}>
            <option value="">All Types</option>
            <option value="theory">Theory</option>
            <option value="lab">Lab</option>
          </select>
          <SearchBar value={params.search} onChange={v => updateParam('search', v)} placeholder="Search subjects..." className="w-56" />
          <button onClick={openCreate} className="btn-primary"><Plus className="w-4 h-4" /> Add Subject</button>
        </div>
      </div>

      <div className="card overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr>{['#', 'Code', 'Subject Name', 'Department', 'Sem', 'Type', 'Hrs/Week', 'Credits', 'Faculty', 'Actions'].map(h => <th key={h} className="table-header text-left">{h}</th>)}</tr>
            </thead>
            <tbody>
              {loading ? <tr><td colSpan={10}><LoadingSpinner /></td></tr>
                : !items.length ? <tr><td colSpan={10} className="text-center py-12 text-slate-400">No subjects found</td></tr>
                : items.map((item, i) => (
                  <tr key={item.id} className="hover:bg-slate-50 dark:hover:bg-slate-700/30 transition-colors">
                    <td className="table-cell w-10">{(params.page - 1) * params.limit + i + 1}</td>
                    <td className="table-cell font-mono text-xs font-bold text-slate-600 dark:text-slate-400">{item.subject_code}</td>
                    <td className="table-cell font-medium text-slate-900 dark:text-slate-100">{item.subject_name}</td>
                    <td className="table-cell text-slate-500 text-xs">{item.department_code}</td>
                    <td className="table-cell text-center">Sem {item.semester}</td>
                    <td className="table-cell"><span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${typeColor(item.subject_type)}`}>{item.subject_type}</span></td>
                    <td className="table-cell text-center">{item.hours_per_week}</td>
                    <td className="table-cell text-center">{item.credits}</td>
                    <td className="table-cell text-xs text-slate-500 max-w-[140px] truncate">{item.assigned_faculty || 'â€”'}</td>
                    <td className="table-cell">
                      <div className="flex gap-1">
                        <button onClick={() => openEdit(item)} className="p-1.5 rounded-lg hover:bg-blue-50 dark:hover:bg-blue-900/20 text-blue-600"><Pencil className="w-4 h-4" /></button>
                        <button onClick={() => setDeleteId(item.id)} className="p-1.5 rounded-lg hover:bg-red-50 dark:hover:bg-red-900/20 text-red-600"><Trash2 className="w-4 h-4" /></button>
                      </div>
                    </td>
                  </tr>
                ))}
            </tbody>
          </table>
        </div>
        <Pagination page={pagination.page} totalPages={pagination.totalPages} total={pagination.total} limit={pagination.limit} onPageChange={p => updateParam('page', p)} />
      </div>

      <Modal open={modal} onClose={() => setModal(false)} title={editing ? 'Edit Subject' : 'Add Subject'} size="lg">
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">Subject Code *</label>
              <input className="input-field" value={form.subject_code} onChange={e => setForm(f => ({ ...f, subject_code: e.target.value.toUpperCase() }))} placeholder="CS101" required />
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">Subject Name *</label>
              <input className="input-field" value={form.subject_name} onChange={e => setForm(f => ({ ...f, subject_name: e.target.value }))} placeholder="Data Structures" required />
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">Department *</label>
              <select className="input-field" value={form.department_id} onChange={e => setForm(f => ({ ...f, department_id: e.target.value }))} required>
                <option value="">Select Department</option>
                {depts.map(d => <option key={d.id} value={d.id}>{d.name}</option>)}
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">Semester *</label>
              <select className="input-field" value={form.semester} onChange={e => setForm(f => ({ ...f, semester: +e.target.value }))} required>
                <option value="">Select Semester</option>
                {[1,2,3,4,5,6,7,8].map(s => <option key={s} value={s}>Semester {s}</option>)}
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">Subject Type</label>
              <select className="input-field" value={form.subject_type} onChange={e => setForm(f => ({ ...f, subject_type: e.target.value }))}>
                <option value="theory">Theory</option>
                <option value="lab">Lab</option>
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">Hours Per Week</label>
              <input type="number" min="1" max="10" className="input-field" value={form.hours_per_week} onChange={e => setForm(f => ({ ...f, hours_per_week: +e.target.value }))} />
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">Credits</label>
              <input type="number" min="1" max="6" className="input-field" value={form.credits} onChange={e => setForm(f => ({ ...f, credits: +e.target.value }))} />
            </div>
          </div>
          <div className="flex gap-3 justify-end pt-2">
            <button type="button" onClick={() => setModal(false)} className="btn-secondary">Cancel</button>
            <button type="submit" disabled={saving} className="btn-primary">
              {saving ? <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full spinner" /> : (editing ? 'Update' : 'Create')}
            </button>
          </div>
        </form>
      </Modal>

      <ConfirmDialog open={!!deleteId} title="Delete Subject" message="Delete this subject?" onConfirm={async () => { try { await remove(deleteId); setDeleteId(null); } catch(e){ notify.error(e.response?.data?.message||'Failed'); } }} onCancel={() => setDeleteId(null)} />
    </div>
  );
};

export default Subjects;

