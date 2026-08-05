import { useState, useEffect } from 'react';
import { Plus, Pencil, Trash2, Users } from 'lucide-react';
import { staffAPI, departmentAPI } from '../../api';
import useCRUD from '../../hooks/useCRUD';
import SearchBar from '../../components/common/SearchBar';
import Pagination from '../../components/common/Pagination';
import Modal from '../../components/common/Modal';
import ConfirmDialog from '../../components/common/ConfirmDialog';
import LoadingSpinner from '../../components/common/LoadingSpinner';
import toast from 'react-hot-toast';

const DAYS = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
const empty = { staff_id: '', name: '', department_id: '', designation: '', email: '', phone: '', max_hours_per_week: 20, status: 'active', availability: Object.fromEntries(DAYS.map(d => [d, 1])) };

const Staff = () => {
  const { items, loading, pagination, params, updateParam, create, update, remove } = useCRUD(staffAPI);
  const [depts, setDepts] = useState([]);
  const [modal, setModal] = useState(false);
  const [editing, setEditing] = useState(null);
  const [form, setForm] = useState(empty);
  const [saving, setSaving] = useState(false);
  const [deleteId, setDeleteId] = useState(null);
  const [deleting, setDeleting] = useState(false);

  useEffect(() => { departmentAPI.getAll({ limit: 100 }).then(r => setDepts(r.data.data || [])); }, []);

  const openCreate = () => { setEditing(null); setForm(empty); setModal(true); };
  const openEdit = (item) => {
    setEditing(item);
    const avail = Object.fromEntries(DAYS.map(d => [d, item.available_days?.includes(d) ? 1 : 0]));
    setForm({ staff_id: item.staff_id, name: item.name, department_id: item.department_id, designation: item.designation || '', email: item.email || '', phone: item.phone || '', max_hours_per_week: item.max_hours_per_week, status: item.status, availability: avail });
    setModal(true);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!form.staff_id || !form.name || !form.department_id) return toast.error('Staff ID, Name and Department are required');
    setSaving(true);
    try {
      if (editing) await update(editing.id, form);
      else await create(form);
      setModal(false);
    } catch (err) { toast.error(err.response?.data?.message || 'Operation failed'); }
    finally { setSaving(false); }
  };

  const statusColors = { active: 'badge-active', inactive: 'badge-inactive', on_leave: 'inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-yellow-100 text-yellow-800' };

  return (
    <div className="space-y-4">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 bg-green-50 dark:bg-green-900/20 rounded-xl flex items-center justify-center">
            <Users className="w-6 h-6 text-green-600" />
          </div>
          <div>
            <h2 className="text-lg font-semibold text-slate-900 dark:text-slate-100">Staff</h2>
            <p className="text-sm text-slate-500">{pagination.total} members</p>
          </div>
        </div>
        <div className="flex gap-3 flex-wrap">
          <select className="input-field w-44" value={params.department_id || ''} onChange={e => updateParam('department_id', e.target.value || undefined)}>
            <option value="">All Departments</option>
            {depts.map(d => <option key={d.id} value={d.id}>{d.code}</option>)}
          </select>
          <SearchBar value={params.search} onChange={v => updateParam('search', v)} placeholder="Search staff..." className="w-56" />
          <button onClick={openCreate} className="btn-primary"><Plus className="w-4 h-4" /> Add Staff</button>
        </div>
      </div>

      <div className="card overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr>{['#', 'Staff ID', 'Name', 'Department', 'Designation', 'Email', 'Phone', 'Max Hrs', 'Status', 'Actions'].map(h => <th key={h} className="table-header text-left">{h}</th>)}</tr>
            </thead>
            <tbody>
              {loading ? <tr><td colSpan={10}><LoadingSpinner /></td></tr>
                : !items.length ? <tr><td colSpan={10} className="text-center py-12 text-slate-400">No staff found</td></tr>
                : items.map((item, i) => (
                  <tr key={item.id} className="hover:bg-slate-50 dark:hover:bg-slate-700/30 transition-colors">
                    <td className="table-cell w-10">{(params.page - 1) * params.limit + i + 1}</td>
                    <td className="table-cell font-mono text-xs font-bold text-slate-600 dark:text-slate-400">{item.staff_id}</td>
                    <td className="table-cell font-medium text-slate-900 dark:text-slate-100">{item.name}</td>
                    <td className="table-cell"><span className="bg-indigo-50 dark:bg-indigo-900/20 text-indigo-700 dark:text-indigo-300 px-2 py-0.5 rounded text-xs font-medium">{item.department_code}</span></td>
                    <td className="table-cell text-slate-500">{item.designation || '—'}</td>
                    <td className="table-cell text-slate-500 text-xs">{item.email || '—'}</td>
                    <td className="table-cell text-slate-500 text-xs">{item.phone || '—'}</td>
                    <td className="table-cell text-center">{item.max_hours_per_week}</td>
                    <td className="table-cell"><span className={statusColors[item.status] || 'badge-inactive'}>{item.status?.replace('_', ' ')}</span></td>
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

      <Modal open={modal} onClose={() => setModal(false)} title={editing ? 'Edit Staff' : 'Add Staff'} size="lg">
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">Staff ID *</label>
              <input className="input-field" value={form.staff_id} onChange={e => setForm(f => ({ ...f, staff_id: e.target.value }))} placeholder="e.g. CSE001" required />
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">Full Name *</label>
              <input className="input-field" value={form.name} onChange={e => setForm(f => ({ ...f, name: e.target.value }))} placeholder="Prof. John Doe" required />
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">Department *</label>
              <select className="input-field" value={form.department_id} onChange={e => setForm(f => ({ ...f, department_id: e.target.value }))} required>
                <option value="">Select Department</option>
                {depts.map(d => <option key={d.id} value={d.id}>{d.name}</option>)}
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">Designation</label>
              <input className="input-field" value={form.designation} onChange={e => setForm(f => ({ ...f, designation: e.target.value }))} placeholder="Assistant Professor" />
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">Email</label>
              <input type="email" className="input-field" value={form.email} onChange={e => setForm(f => ({ ...f, email: e.target.value }))} placeholder="staff@college.edu" />
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">Phone</label>
              <input className="input-field" value={form.phone} onChange={e => setForm(f => ({ ...f, phone: e.target.value }))} placeholder="9876543210" />
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">Max Hours/Week</label>
              <input type="number" min="1" max="40" className="input-field" value={form.max_hours_per_week} onChange={e => setForm(f => ({ ...f, max_hours_per_week: +e.target.value }))} />
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">Status</label>
              <select className="input-field" value={form.status} onChange={e => setForm(f => ({ ...f, status: e.target.value }))}>
                <option value="active">Active</option>
                <option value="inactive">Inactive</option>
                <option value="on_leave">On Leave</option>
              </select>
            </div>
          </div>
          <div>
            <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">Availability (Working Days)</label>
            <div className="flex flex-wrap gap-2">
              {DAYS.map(d => (
                <label key={d} className="flex items-center gap-1.5 cursor-pointer">
                  <input type="checkbox" checked={!!form.availability[d]} onChange={e => setForm(f => ({ ...f, availability: { ...f.availability, [d]: e.target.checked ? 1 : 0 } }))} className="rounded text-primary-600" />
                  <span className="text-sm text-slate-600 dark:text-slate-400">{d.substring(0, 3)}</span>
                </label>
              ))}
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

      <ConfirmDialog open={!!deleteId} title="Delete Staff" message="Delete this staff member? This cannot be undone." onConfirm={handleDelete} onCancel={() => setDeleteId(null)} loading={deleting} />
    </div>
  );

  async function handleDelete() {
    setDeleting(true);
    try { await remove(deleteId); setDeleteId(null); }
    catch (err) { toast.error(err.response?.data?.message || 'Delete failed'); }
    finally { setDeleting(false); }
  }
};

export default Staff;
