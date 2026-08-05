import { useState, useEffect } from 'react';
import { Plus, Pencil, Trash2, GraduationCap } from 'lucide-react';
import { classAPI, departmentAPI, timeslotAPI } from '../../api';
import useCRUD from '../../hooks/useCRUD';
import SearchBar from '../../components/common/SearchBar';
import Pagination from '../../components/common/Pagination';
import Modal from '../../components/common/Modal';
import ConfirmDialog from '../../components/common/ConfirmDialog';
import LoadingSpinner from '../../components/common/LoadingSpinner';
import toast from 'react-hot-toast';

const empty = { department_id: '', year: '', semester: '', section: '', strength: 60, academic_year_id: '' };

const Classes = () => {
  const { items, loading, pagination, params, updateParam, create, update, remove } = useCRUD(classAPI);
  const [depts, setDepts] = useState([]);
  const [acYears, setAcYears] = useState([]);
  const [modal, setModal] = useState(false);
  const [editing, setEditing] = useState(null);
  const [form, setForm] = useState(empty);
  const [saving, setSaving] = useState(false);
  const [deleteId, setDeleteId] = useState(null);

  useEffect(() => {
    departmentAPI.getAll({ limit: 100 }).then(r => setDepts(r.data.data || []));
    timeslotAPI.getAcademicYears().then(r => setAcYears(r.data.data || []));
  }, []);

  const openCreate = () => { setEditing(null); setForm({ ...empty, academic_year_id: acYears.find(y => y.is_current)?.id || '' }); setModal(true); };
  const openEdit = (item) => { setEditing(item); setForm({ department_id: item.department_id, year: item.year, semester: item.semester, section: item.section, strength: item.strength, academic_year_id: item.academic_year_id || '' }); setModal(true); };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSaving(true);
    try {
      if (editing) await update(editing.id, form);
      else await create(form);
      setModal(false);
    } catch (err) { toast.error(err.response?.data?.message || 'Operation failed'); }
    finally { setSaving(false); }
  };

  return (
    <div className="space-y-4">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 bg-purple-50 dark:bg-purple-900/20 rounded-xl flex items-center justify-center">
            <GraduationCap className="w-6 h-6 text-purple-600" />
          </div>
          <div>
            <h2 className="text-lg font-semibold text-slate-900 dark:text-slate-100">Classes</h2>
            <p className="text-sm text-slate-500">{pagination.total} classes</p>
          </div>
        </div>
        <div className="flex gap-3 flex-wrap">
          <select className="input-field w-40" value={params.department_id || ''} onChange={e => updateParam('department_id', e.target.value || undefined)}>
            <option value="">All Depts</option>
            {depts.map(d => <option key={d.id} value={d.id}>{d.code}</option>)}
          </select>
          <SearchBar value={params.search} onChange={v => updateParam('search', v)} placeholder="Search classes..." className="w-52" />
          <button onClick={openCreate} className="btn-primary"><Plus className="w-4 h-4" /> Add Class</button>
        </div>
      </div>

      <div className="card overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr>{['#', 'Department', 'Year', 'Semester', 'Section', 'Strength', 'Academic Year', 'Actions'].map(h => <th key={h} className="table-header text-left">{h}</th>)}</tr>
            </thead>
            <tbody>
              {loading ? <tr><td colSpan={8}><LoadingSpinner /></td></tr>
                : !items.length ? <tr><td colSpan={8} className="text-center py-12 text-slate-400">No classes found</td></tr>
                : items.map((item, i) => (
                  <tr key={item.id} className="hover:bg-slate-50 dark:hover:bg-slate-700/30 transition-colors">
                    <td className="table-cell w-10">{(params.page - 1) * params.limit + i + 1}</td>
                    <td className="table-cell"><span className="bg-purple-50 dark:bg-purple-900/20 text-purple-700 dark:text-purple-300 px-2 py-0.5 rounded text-xs font-medium">{item.department_code}</span></td>
                    <td className="table-cell font-medium">Year {item.year}</td>
                    <td className="table-cell">Sem {item.semester}</td>
                    <td className="table-cell"><span className="font-bold text-primary-600">{item.section}</span></td>
                    <td className="table-cell text-center">{item.strength}</td>
                    <td className="table-cell text-slate-500 text-xs">{item.academic_year || '—'}</td>
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

      <Modal open={modal} onClose={() => setModal(false)} title={editing ? 'Edit Class' : 'Add Class'}>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">Department *</label>
            <select className="input-field" value={form.department_id} onChange={e => setForm(f => ({ ...f, department_id: e.target.value }))} required>
              <option value="">Select Department</option>
              {depts.map(d => <option key={d.id} value={d.id}>{d.name}</option>)}
            </select>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">Year *</label>
              <select className="input-field" value={form.year} onChange={e => setForm(f => ({ ...f, year: +e.target.value }))} required>
                <option value="">Select Year</option>
                {[1,2,3,4].map(y => <option key={y} value={y}>Year {y}</option>)}
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
              <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">Section *</label>
              <input className="input-field uppercase" value={form.section} onChange={e => setForm(f => ({ ...f, section: e.target.value.toUpperCase() }))} placeholder="A" maxLength={2} required />
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">Strength</label>
              <input type="number" min="1" max="120" className="input-field" value={form.strength} onChange={e => setForm(f => ({ ...f, strength: +e.target.value }))} />
            </div>
          </div>
          <div>
            <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">Academic Year</label>
            <select className="input-field" value={form.academic_year_id} onChange={e => setForm(f => ({ ...f, academic_year_id: e.target.value }))}>
              <option value="">Select Academic Year</option>
              {acYears.map(y => <option key={y.id} value={y.id}>{y.year_label}{y.is_current ? ' (Current)' : ''}</option>)}
            </select>
          </div>
          <div className="flex gap-3 justify-end pt-2">
            <button type="button" onClick={() => setModal(false)} className="btn-secondary">Cancel</button>
            <button type="submit" disabled={saving} className="btn-primary">
              {saving ? <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full spinner" /> : (editing ? 'Update' : 'Create')}
            </button>
          </div>
        </form>
      </Modal>

      <ConfirmDialog open={!!deleteId} title="Delete Class" message="Delete this class?" onConfirm={async () => { try { await remove(deleteId); setDeleteId(null); } catch(e) { toast.error(e.response?.data?.message||'Failed'); } }} onCancel={() => setDeleteId(null)} />
    </div>
  );
};

export default Classes;
