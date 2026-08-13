import { useState } from 'react';
import { Plus, Pencil, Trash2, DoorOpen } from 'lucide-react';
import { roomAPI } from '../../api';
import useCRUD from '../../hooks/useCRUD';
import SearchBar from '../../components/common/SearchBar';
import Pagination from '../../components/common/Pagination';
import Modal from '../../components/common/Modal';
import ConfirmDialog from '../../components/common/ConfirmDialog';
import LoadingSpinner from '../../components/common/LoadingSpinner';
import notify from '../../utils/notify';

const ROOM_TYPES = [
  { value: 'classroom', label: 'Classroom', color: 'bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-300' },
  { value: 'computer_lab', label: 'Computer Lab', color: 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-300' },
  { value: 'electronics_lab', label: 'Electronics Lab', color: 'bg-orange-100 text-orange-800 dark:bg-orange-900/30 dark:text-orange-300' },
  { value: 'seminar_hall', label: 'Seminar Hall', color: 'bg-purple-100 text-purple-800 dark:bg-purple-900/30 dark:text-purple-300' },
];

const empty = { room_number: '', room_type: 'classroom', capacity: 60, building: '' };

const Rooms = () => {
  const { items, loading, pagination, params, updateParam, create, update, remove } = useCRUD(roomAPI);
  const [modal, setModal] = useState(false);
  const [editing, setEditing] = useState(null);
  const [form, setForm] = useState(empty);
  const [saving, setSaving] = useState(false);
  const [deleteId, setDeleteId] = useState(null);

  const openCreate = () => { setEditing(null); setForm(empty); setModal(true); };
  const openEdit = (item) => { setEditing(item); setForm({ room_number: item.room_number, room_type: item.room_type, capacity: item.capacity, building: item.building || '' }); setModal(true); };

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

  const getRoomTypeStyle = (t) => ROOM_TYPES.find(r => r.value === t)?.color || '';
  const getRoomTypeLabel = (t) => ROOM_TYPES.find(r => r.value === t)?.label || t;

  return (
    <div className="space-y-4">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 bg-teal-50 dark:bg-teal-900/20 rounded-xl flex items-center justify-center">
            <DoorOpen className="w-6 h-6 text-teal-600" />
          </div>
          <div>
            <h2 className="text-lg font-semibold text-slate-900 dark:text-slate-100">Rooms</h2>
            <p className="text-sm text-slate-500">{pagination.total} rooms</p>
          </div>
        </div>
        <div className="flex gap-3 flex-wrap">
          <select className="input-field w-44" value={params.room_type || ''} onChange={e => updateParam('room_type', e.target.value || undefined)}>
            <option value="">All Types</option>
            {ROOM_TYPES.map(t => <option key={t.value} value={t.value}>{t.label}</option>)}
          </select>
          <SearchBar value={params.search} onChange={v => updateParam('search', v)} placeholder="Search rooms..." className="w-52" />
          <button onClick={openCreate} className="btn-primary"><Plus className="w-4 h-4" /> Add Room</button>
        </div>
      </div>

      <div className="card overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr>{['#', 'Room Number', 'Type', 'Capacity', 'Building', 'Status', 'Actions'].map(h => <th key={h} className="table-header text-left">{h}</th>)}</tr>
            </thead>
            <tbody>
              {loading ? <tr><td colSpan={7}><LoadingSpinner /></td></tr>
                : !items.length ? <tr><td colSpan={7} className="text-center py-12 text-slate-400">No rooms found</td></tr>
                : items.map((item, i) => (
                  <tr key={item.id} className="hover:bg-slate-50 dark:hover:bg-slate-700/30 transition-colors">
                    <td className="table-cell w-10">{(params.page - 1) * params.limit + i + 1}</td>
                    <td className="table-cell font-bold text-slate-900 dark:text-slate-100">{item.room_number}</td>
                    <td className="table-cell"><span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getRoomTypeStyle(item.room_type)}`}>{getRoomTypeLabel(item.room_type)}</span></td>
                    <td className="table-cell text-center">{item.capacity}</td>
                    <td className="table-cell text-slate-500">{item.building || 'â€”'}</td>
                    <td className="table-cell"><span className={item.is_active ? 'badge-active' : 'badge-inactive'}>{item.is_active ? 'Active' : 'Inactive'}</span></td>
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

      <Modal open={modal} onClose={() => setModal(false)} title={editing ? 'Edit Room' : 'Add Room'}>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">Room Number *</label>
              <input className="input-field" value={form.room_number} onChange={e => setForm(f => ({ ...f, room_number: e.target.value }))} placeholder="e.g. 101" required />
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">Room Type *</label>
              <select className="input-field" value={form.room_type} onChange={e => setForm(f => ({ ...f, room_type: e.target.value }))}>
                {ROOM_TYPES.map(t => <option key={t.value} value={t.value}>{t.label}</option>)}
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">Capacity</label>
              <input type="number" min="1" className="input-field" value={form.capacity} onChange={e => setForm(f => ({ ...f, capacity: +e.target.value }))} />
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">Building</label>
              <input className="input-field" value={form.building} onChange={e => setForm(f => ({ ...f, building: e.target.value }))} placeholder="Block A" />
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

      <ConfirmDialog open={!!deleteId} title="Delete Room" message="Delete this room?" onConfirm={async () => { try { await remove(deleteId); setDeleteId(null); } catch(e) { notify.error(e.response?.data?.message||'Failed'); } }} onCancel={() => setDeleteId(null)} />
    </div>
  );
};

export default Rooms;

