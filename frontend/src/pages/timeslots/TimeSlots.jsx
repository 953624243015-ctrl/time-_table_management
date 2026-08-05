import { useState, useEffect } from 'react';
import { Plus, Pencil, Trash2, Clock } from 'lucide-react';
import { timeslotAPI } from '../../api';
import Modal from '../../components/common/Modal';
import ConfirmDialog from '../../components/common/ConfirmDialog';
import LoadingSpinner from '../../components/common/LoadingSpinner';
import toast from 'react-hot-toast';

const empty = { slot_name: '', start_time: '', end_time: '', period_number: '', is_break: 0, break_type: '' };

const TimeSlots = () => {
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(false);
  const [modal, setModal] = useState(false);
  const [editing, setEditing] = useState(null);
  const [form, setForm] = useState(empty);
  const [saving, setSaving] = useState(false);
  const [deleteId, setDeleteId] = useState(null);

  const fetchAll = async () => {
    setLoading(true);
    try {
      const res = await timeslotAPI.getAll();
      setItems(res.data.data || []);
    } catch { toast.error('Failed to load time slots'); }
    finally { setLoading(false); }
  };

  useEffect(() => { fetchAll(); }, []);

  const openCreate = () => { setEditing(null); setForm({ ...empty, period_number: (items.length + 1) }); setModal(true); };
  const openEdit = (item) => {
    setEditing(item);
    setForm({ slot_name: item.slot_name, start_time: item.start_time?.substring(0,5), end_time: item.end_time?.substring(0,5), period_number: item.period_number, is_break: item.is_break, break_type: item.break_type || '' });
    setModal(true);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSaving(true);
    try {
      if (editing) await timeslotAPI.update(editing.id, form);
      else await timeslotAPI.create(form);
      toast.success(editing ? 'Updated successfully' : 'Created successfully');
      setModal(false);
      fetchAll();
    } catch (err) { toast.error(err.response?.data?.message || 'Operation failed'); }
    finally { setSaving(false); }
  };

  const handleDelete = async () => {
    try { await timeslotAPI.remove(deleteId); toast.success('Deleted'); setDeleteId(null); fetchAll(); }
    catch (err) { toast.error(err.response?.data?.message || 'Delete failed'); }
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 bg-cyan-50 dark:bg-cyan-900/20 rounded-xl flex items-center justify-center">
            <Clock className="w-6 h-6 text-cyan-600" />
          </div>
          <div>
            <h2 className="text-lg font-semibold text-slate-900 dark:text-slate-100">Time Slots</h2>
            <p className="text-sm text-slate-500">Configure daily schedule periods</p>
          </div>
        </div>
        <button onClick={openCreate} className="btn-primary"><Plus className="w-4 h-4" /> Add Slot</button>
      </div>

      <div className="card overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr>{['Period', 'Slot Name', 'Start Time', 'End Time', 'Duration', 'Type', 'Status', 'Actions'].map(h => <th key={h} className="table-header text-left">{h}</th>)}</tr>
            </thead>
            <tbody>
              {loading ? <tr><td colSpan={8}><LoadingSpinner /></td></tr>
                : !items.length ? <tr><td colSpan={8} className="text-center py-12 text-slate-400">No time slots configured</td></tr>
                : items.map(item => {
                  const start = item.start_time?.substring(0,5);
                  const end = item.end_time?.substring(0,5);
                  const [sh, sm] = (start || '0:0').split(':').map(Number);
                  const [eh, em] = (end || '0:0').split(':').map(Number);
                  const dur = (eh * 60 + em) - (sh * 60 + sm);
                  return (
                    <tr key={item.id} className={`hover:bg-slate-50 dark:hover:bg-slate-700/30 transition-colors ${item.is_break ? 'bg-amber-50/50 dark:bg-amber-900/10' : ''}`}>
                      <td className="table-cell"><span className="font-bold text-slate-700 dark:text-slate-300">{item.period_number}</span></td>
                      <td className="table-cell font-medium text-slate-900 dark:text-slate-100">{item.slot_name}</td>
                      <td className="table-cell font-mono text-primary-600">{start}</td>
                      <td className="table-cell font-mono text-primary-600">{end}</td>
                      <td className="table-cell text-slate-500">{dur > 0 ? `${dur} min` : '—'}</td>
                      <td className="table-cell">
                        {item.is_break
                          ? <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-amber-100 text-amber-800 dark:bg-amber-900/30 dark:text-amber-300">{item.break_type || 'Break'}</span>
                          : <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-300">Teaching</span>}
                      </td>
                      <td className="table-cell"><span className={item.is_active ? 'badge-active' : 'badge-inactive'}>{item.is_active ? 'Active' : 'Inactive'}</span></td>
                      <td className="table-cell">
                        <div className="flex gap-1">
                          <button onClick={() => openEdit(item)} className="p-1.5 rounded-lg hover:bg-blue-50 dark:hover:bg-blue-900/20 text-blue-600"><Pencil className="w-4 h-4" /></button>
                          <button onClick={() => setDeleteId(item.id)} className="p-1.5 rounded-lg hover:bg-red-50 dark:hover:bg-red-900/20 text-red-600"><Trash2 className="w-4 h-4" /></button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
            </tbody>
          </table>
        </div>
      </div>

      <Modal open={modal} onClose={() => setModal(false)} title={editing ? 'Edit Time Slot' : 'Add Time Slot'}>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">Slot Name *</label>
              <input className="input-field" value={form.slot_name} onChange={e => setForm(f => ({ ...f, slot_name: e.target.value }))} placeholder="Period 1" required />
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">Period Number *</label>
              <input type="number" min="1" className="input-field" value={form.period_number} onChange={e => setForm(f => ({ ...f, period_number: +e.target.value }))} required />
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">Start Time *</label>
              <input type="time" className="input-field" value={form.start_time} onChange={e => setForm(f => ({ ...f, start_time: e.target.value }))} required />
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">End Time *</label>
              <input type="time" className="input-field" value={form.end_time} onChange={e => setForm(f => ({ ...f, end_time: e.target.value }))} required />
            </div>
          </div>
          <div className="flex items-center gap-3">
            <label className="flex items-center gap-2 cursor-pointer">
              <input type="checkbox" checked={!!form.is_break} onChange={e => setForm(f => ({ ...f, is_break: e.target.checked ? 1 : 0 }))} className="rounded text-primary-600" />
              <span className="text-sm text-slate-700 dark:text-slate-300">This is a break period</span>
            </label>
          </div>
          {!!form.is_break && (
            <div>
              <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">Break Type</label>
              <select className="input-field" value={form.break_type} onChange={e => setForm(f => ({ ...f, break_type: e.target.value }))}>
                <option value="">Select type</option>
                <option value="lunch">Lunch Break</option>
                <option value="short">Short Break</option>
              </select>
            </div>
          )}
          <div className="flex gap-3 justify-end pt-2">
            <button type="button" onClick={() => setModal(false)} className="btn-secondary">Cancel</button>
            <button type="submit" disabled={saving} className="btn-primary">
              {saving ? <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full spinner" /> : (editing ? 'Update' : 'Create')}
            </button>
          </div>
        </form>
      </Modal>

      <ConfirmDialog open={!!deleteId} title="Delete Time Slot" message="Delete this time slot?" onConfirm={handleDelete} onCancel={() => setDeleteId(null)} />
    </div>
  );
};

export default TimeSlots;
