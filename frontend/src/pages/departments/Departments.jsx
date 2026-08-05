import { useState } from 'react';
import { Plus, Pencil, Trash2, Building2 } from 'lucide-react';
import { departmentAPI } from '../../api';
import useCRUD from '../../hooks/useCRUD';
import SearchBar from '../../components/common/SearchBar';
import Pagination from '../../components/common/Pagination';
import Modal from '../../components/common/Modal';
import ConfirmDialog from '../../components/common/ConfirmDialog';
import LoadingSpinner from '../../components/common/LoadingSpinner';
import toast from 'react-hot-toast';

const empty = { name: '', code: '', hod_name: '' };

const Departments = () => {
  const { items, loading, pagination, params, updateParam, create, update, remove } = useCRUD(departmentAPI);
  const [modal, setModal] = useState(false);
  const [editing, setEditing] = useState(null);
  const [form, setForm] = useState(empty);
  const [saving, setSaving] = useState(false);
  const [deleteId, setDeleteId] = useState(null);
  const [deleting, setDeleting] = useState(false);

  const openCreate = () => { setEditing(null); setForm(empty); setModal(true); };
  const openEdit = (item) => { setEditing(item); setForm({ name: item.name, code: item.code, hod_name: item.hod_name || '' }); setModal(true); };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!form.name.trim() || !form.code.trim()) return toast.error('Name and Code are required');
    setSaving(true);
    try {
      if (editing) await update(editing.id, form);
      else await create(form);
      setModal(false);
    } catch (err) {
      toast.error(err.response?.data?.message || 'Operation failed');
    } finally { setSaving(false); }
  };

  const handleDelete = async () => {
    setDeleting(true);
    try { await remove(deleteId); setDeleteId(null); }
    catch (err) { toast.error(err.response?.data?.message || 'Delete failed'); }
    finally { setDeleting(false); }
  };

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 bg-blue-50 dark:bg-blue-900/20 rounded-xl flex items-center justify-center">
            <Building2 className="w-6 h-6 text-blue-600" />
          </div>
          <div>
            <h2 className="text-lg font-semibold text-slate-900 dark:text-slate-100">Departments</h2>
            <p className="text-sm text-slate-500">{pagination.total} departments</p>
          </div>
        </div>
        <div className="flex gap-3">
          <SearchBar value={params.search} onChange={v => updateParam('search', v)} placeholder="Search departments..." className="w-64" />
          <button onClick={openCreate} className="btn-primary"><Plus className="w-4 h-4" /> Add Department</button>
        </div>
      </div>

      {/* Table */}
      <div className="card overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr>
                {['#', 'Department Name', 'Code', 'HOD', 'Staff', 'Classes', 'Subjects', 'Status', 'Actions'].map(h => (
                  <th key={h} className="table-header text-left">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr><td colSpan={9}><LoadingSpinner /></td></tr>
              ) : !items.length ? (
                <tr><td colSpan={9} className="text-center py-12 text-slate-400">No departments found</td></tr>
              ) : items.map((item, i) => (
                <tr key={item.id} className="hover:bg-slate-50 dark:hover:bg-slate-700/30 transition-colors">
                  <td className="table-cell w-12">{(params.page - 1) * params.limit + i + 1}</td>
                  <td className="table-cell font-medium text-slate-900 dark:text-slate-100">{item.name}</td>
                  <td className="table-cell"><span className="bg-primary-100 dark:bg-primary-900/30 text-primary-700 dark:text-primary-300 px-2 py-0.5 rounded-full text-xs font-mono font-bold">{item.code}</span></td>
                  <td className="table-cell">{item.hod_name || '—'}</td>
                  <td className="table-cell text-center">{item.staff_count || 0}</td>
                  <td className="table-cell text-center">{item.class_count || 0}</td>
                  <td className="table-cell text-center">{item.subject_count || 0}</td>
                  <td className="table-cell"><span className={item.is_active ? 'badge-active' : 'badge-inactive'}>{item.is_active ? 'Active' : 'Inactive'}</span></td>
                  <td className="table-cell">
                    <div className="flex gap-1">
                      <button onClick={() => openEdit(item)} className="p-1.5 rounded-lg hover:bg-blue-50 dark:hover:bg-blue-900/20 text-blue-600 transition-colors" title="Edit"><Pencil className="w-4 h-4" /></button>
                      <button onClick={() => setDeleteId(item.id)} className="p-1.5 rounded-lg hover:bg-red-50 dark:hover:bg-red-900/20 text-red-600 transition-colors" title="Delete"><Trash2 className="w-4 h-4" /></button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        <Pagination page={pagination.page} totalPages={pagination.totalPages} total={pagination.total} limit={pagination.limit} onPageChange={p => updateParam('page', p)} />
      </div>

      {/* Modal */}
      <Modal open={modal} onClose={() => setModal(false)} title={editing ? 'Edit Department' : 'Add Department'}>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">Department Name *</label>
            <input className="input-field" value={form.name} onChange={e => setForm(f => ({ ...f, name: e.target.value }))} placeholder="e.g. Computer Science and Engineering" required />
          </div>
          <div>
            <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">Department Code *</label>
            <input className="input-field uppercase" value={form.code} onChange={e => setForm(f => ({ ...f, code: e.target.value.toUpperCase() }))} placeholder="e.g. CSE" required />
          </div>
          <div>
            <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">HOD Name</label>
            <input className="input-field" value={form.hod_name} onChange={e => setForm(f => ({ ...f, hod_name: e.target.value }))} placeholder="Head of Department" />
          </div>
          <div className="flex gap-3 justify-end pt-2">
            <button type="button" onClick={() => setModal(false)} className="btn-secondary">Cancel</button>
            <button type="submit" disabled={saving} className="btn-primary">
              {saving ? <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full spinner" /> : (editing ? 'Update' : 'Create')}
            </button>
          </div>
        </form>
      </Modal>

      <ConfirmDialog open={!!deleteId} title="Delete Department" message="Are you sure you want to delete this department? This cannot be undone." onConfirm={handleDelete} onCancel={() => setDeleteId(null)} loading={deleting} />
    </div>
  );
};

export default Departments;
