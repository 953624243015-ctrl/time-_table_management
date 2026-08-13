import { useState, useEffect } from 'react';
import { Eye, Download, FileSpreadsheet, Printer } from 'lucide-react';
import { timetableAPI, classAPI, staffAPI, roomAPI, timeslotAPI } from '../../api';
import LoadingSpinner from '../../components/common/LoadingSpinner';
import notify from '../../utils/notify';

const DAYS = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];

const TimetableViewer = () => {
  const [viewType, setViewType]             = useState('class');
  const [entities, setEntities]             = useState([]);
  const [timeSlots, setTimeSlots]           = useState([]);
  const [selectedId, setSelectedId]         = useState('');
  const [academicYearId, setAcademicYearId] = useState('');
  const [acYears, setAcYears]               = useState([]);
  const [timetable, setTimetable]           = useState(null);
  const [loading, setLoading]               = useState(false);
  const [loadingEntities, setLoadingEntities] = useState(false);

  // On mount: load time slots + academic years, default to current year
  useEffect(() => {
    timeslotAPI.getAll().then(r => {
      setTimeSlots((r.data.data || []).filter(t => !t.is_break));
    });
    timeslotAPI.getAcademicYears().then(r => {
      const years = r.data.data || [];
      setAcYears(years);
      // Default to the year marked is_current=1
      const cur = years.find(y => y.is_current == 1);
      if (cur) setAcademicYearId(String(cur.id));
    });
  }, []);

  // When view type changes reload entity list
  useEffect(() => {
    setSelectedId('');
    setTimetable(null);
    setLoadingEntities(true);
    const apiFn = viewType === 'class' ? classAPI.getAll({ limit: 200 })
                : viewType === 'staff' ? staffAPI.getAll({ limit: 200 })
                : roomAPI.getAll({ limit: 200 });
    apiFn.then(r => setEntities(r.data.data || [])).finally(() => setLoadingEntities(false));
  }, [viewType]);

  const getEntityLabel = (e) => {
    if (viewType === 'class') return `${e.department_code || ''} Y${e.year} S${e.semester} Sec-${e.section}`;
    if (viewType === 'staff') return `${e.staff_id} â€” ${e.name}`;
    return `${e.room_number} (${(e.room_type || '').replace(/_/g, ' ')})`;
  };

  const fetchTimetable = async () => {
    if (!selectedId) return notify.error('Please select a ' + viewType);
    setLoading(true);
    setTimetable(null);
    try {
      const params = academicYearId ? { academic_year_id: academicYearId } : {};
      let res;
      if (viewType === 'class') res = await timetableAPI.getClassTimetable(selectedId, params);
      else if (viewType === 'staff') res = await timetableAPI.getStaffTimetable(selectedId, params);
      else res = await timetableAPI.getRoomTimetable(selectedId, params);
      setTimetable(res.data.data);
    } catch (err) {
      notify.error(err.response?.data?.message || 'Failed to load timetable');
    } finally { setLoading(false); }
  };

  // Get the first class_id found in the current timetable data (needed for export)
  const getExportClassId = () => {
    if (viewType === 'class') return selectedId;
    // For staff/room views, use the first class_id from the loaded entries
    if (timetable?.entries?.length) return timetable.entries[0].class_id;
    return null;
  };

  const handleExportPDF = async () => {
    if (!timetable?.entries?.length) return notify.error('No timetable data to export');
    try {
      notify.loading('Generating PDF...', { id: 'pdf' });
      // Build params based on viewType
      const params = { academic_year_id: academicYearId || '' };
      if (viewType === 'class')  params.class_id = selectedId;
      else if (viewType === 'staff') { params.staff_id = selectedId; params.type = 'staff'; }
      else { params.room_id = selectedId; params.type = 'room'; }

      const res = await timetableAPI.exportPDF(params);
      notify.dismiss('pdf');
      const blob = new Blob([res.data], { type: 'application/pdf' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `timetable_${viewType}_${selectedId}.pdf`;
      document.body.appendChild(a); a.click(); document.body.removeChild(a);
      URL.revokeObjectURL(url);
      notify.success('PDF downloaded successfully');
    } catch (err) {
      notify.dismiss('pdf');
      notify.error(err.response?.data?.message || 'PDF export failed');
    }
  };

  const handleExportExcel = async () => {
    if (!timetable?.entries?.length) return notify.error('No timetable data to export');
    try {
      notify.loading('Generating Excel...', { id: 'excel' });
      const params = { academic_year_id: academicYearId || '' };
      if (viewType === 'class')  params.class_id = selectedId;
      else if (viewType === 'staff') { params.staff_id = selectedId; params.type = 'staff'; }
      else { params.room_id = selectedId; params.type = 'room'; }

      const res = await timetableAPI.exportExcel(params);
      notify.dismiss('excel');
      const blob = new Blob([res.data], { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `timetable_${viewType}_${selectedId}.xlsx`;
      document.body.appendChild(a); a.click(); document.body.removeChild(a);
      URL.revokeObjectURL(url);
      notify.success('Excel downloaded successfully');
    } catch (err) {
      notify.dismiss('excel');
      notify.error(err.response?.data?.message || 'Excel export failed');
    }
  };

  const handlePrint = () => window.print();

  const getCellEntry = (day, slot) => {
    if (!timetable?.grouped) return null;
    return timetable.grouped[day]?.[slot.period_number] || null;
  };

  const usedDays = timetable?.entries?.length
    ? DAYS.filter(d => timetable.entries.some(e => e.day_of_week === d))
    : [];

  return (
    <div className="space-y-4">
      {/* Controls bar */}
      <div className="card p-4">
        <div className="flex flex-wrap items-end gap-3">

          {/* View type */}
          <div>
            <p className="text-xs font-semibold text-slate-500 mb-1.5 uppercase tracking-wide">View Type</p>
            <div style={{ display: 'flex', border: '1px solid #e2e8f0', borderRadius: 8, overflow: 'hidden' }}>
              {['class', 'staff', 'room'].map(t => (
                <button
                  key={t}
                  onClick={() => setViewType(t)}
                  style={{
                    padding: '8px 18px',
                    fontSize: 13,
                    fontWeight: 500,
                    textTransform: 'capitalize',
                    border: 'none',
                    cursor: 'pointer',
                    background: viewType === t ? '#2563eb' : '#ffffff',
                    color: viewType === t ? '#ffffff' : '#475569',
                    transition: 'all 0.15s',
                  }}
                >{t}</button>
              ))}
            </div>
          </div>

          {/* Entity selector */}
          <div style={{ flex: 1, minWidth: 200 }}>
            <p className="text-xs font-semibold text-slate-500 mb-1.5 uppercase tracking-wide">
              Select {viewType}
            </p>
            <select
              className="input-field"
              value={selectedId}
              onChange={e => { setSelectedId(e.target.value); setTimetable(null); }}
              disabled={loadingEntities}
            >
              <option value="">â€” Select {viewType} â€”</option>
              {entities.map(e => (
                <option key={e.id} value={e.id}>{getEntityLabel(e)}</option>
              ))}
            </select>
          </div>

          {/* Academic year */}
          <div style={{ minWidth: 160 }}>
            <p className="text-xs font-semibold text-slate-500 mb-1.5 uppercase tracking-wide">Academic Year</p>
            <select
              className="input-field"
              value={academicYearId}
              onChange={e => { setAcademicYearId(e.target.value); setTimetable(null); }}
            >
              <option value="">All Years</option>
              {acYears.map(y => (
                <option key={y.id} value={String(y.id)}>
                  {y.year_label}{y.is_current ? ' â˜…' : ''}
                </option>
              ))}
            </select>
          </div>

          {/* View button */}
          <button
            onClick={fetchTimetable}
            disabled={loading || !selectedId}
            className="btn-primary"
            style={{ alignSelf: 'flex-end' }}
          >
            {loading
              ? <span className="w-4 h-4 border-2 border-white border-t-transparent rounded-full spinner" />
              : <Eye size={16} />
            }
            View
          </button>

          {/* Export buttons â€” only show when timetable loaded */}
          {timetable?.entries?.length > 0 && (
            <>
              <button onClick={handleExportPDF} className="btn-secondary" style={{ alignSelf: 'flex-end' }}>
                <Download size={15} /> PDF
              </button>
              <button onClick={handleExportExcel} className="btn-secondary" style={{ alignSelf: 'flex-end' }}>
                <FileSpreadsheet size={15} /> Excel
              </button>
              <button onClick={handlePrint} className="btn-secondary" style={{ alignSelf: 'flex-end' }}>
                <Printer size={15} /> Print
              </button>
            </>
          )}
        </div>
      </div>

      {/* Loading */}
      {loading && <LoadingSpinner text="Loading timetable..." />}

      {/* Timetable grid */}
      {!loading && timetable && (
        <div className="card overflow-hidden animate-fade-in">
          {!timetable.entries?.length ? (
            <div style={{ textAlign: 'center', padding: '60px 20px', color: '#94a3b8' }}>
              <Eye size={48} style={{ margin: '0 auto 12px', opacity: 0.3 }} />
              <p style={{ fontSize: 16, fontWeight: 600, marginBottom: 6 }}>No timetable found</p>
              <p style={{ fontSize: 13 }}>
                Make sure you selected the correct Academic Year (â˜… = current) and generated a timetable first.
              </p>
            </div>
          ) : (
            <>
              {/* Info bar */}
              <div style={{ padding: '10px 16px', background: '#eff6ff', borderBottom: '1px solid #bfdbfe', display: 'flex', alignItems: 'center', gap: 16 }}>
                <span style={{ fontSize: 13, fontWeight: 600, color: '#1e40af' }}>
                  {timetable.entries.length} schedule entries
                </span>
                <span style={{ fontSize: 12, color: '#3b82f6' }}>
                  {usedDays.join(' Â· ')}
                </span>
                <div style={{ marginLeft: 'auto', display: 'flex', gap: 12 }}>
                  <span style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 12, color: '#475569' }}>
                    <span style={{ width: 12, height: 12, background: '#dbeafe', border: '1px solid #93c5fd', borderRadius: 3 }} />Theory
                  </span>
                  <span style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 12, color: '#475569' }}>
                    <span style={{ width: 12, height: 12, background: '#fef3c7', border: '1px solid #fcd34d', borderRadius: 3 }} />Lab
                  </span>
                </div>
              </div>

              <div style={{ overflowX: 'auto' }}>
                <table style={{ width: '100%', borderCollapse: 'collapse', minWidth: 760 }}>
                  <thead>
                    <tr style={{ background: '#1e40af' }}>
                      <th style={{ padding: '10px 14px', color: '#ffffff', fontSize: 12, fontWeight: 700, textAlign: 'left', width: 90, border: '1px solid #1d4ed8' }}>
                        Day
                      </th>
                      {timeSlots.map(slot => (
                        <th key={slot.id} style={{ padding: '8px 6px', color: '#ffffff', fontSize: 11, fontWeight: 600, textAlign: 'center', border: '1px solid #1d4ed8', minWidth: 110 }}>
                          <div>{slot.slot_name}</div>
                          <div style={{ fontWeight: 400, opacity: 0.75, fontSize: 10, marginTop: 2 }}>
                            {slot.start_time?.substring(0, 5)}â€“{slot.end_time?.substring(0, 5)}
                          </div>
                        </th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {usedDays.map((day, di) => (
                      <tr key={day} style={{ background: di % 2 === 0 ? '#ffffff' : '#f8fafc' }}>
                        <td style={{ padding: '8px 14px', fontWeight: 700, fontSize: 13, color: '#334155', border: '1px solid #e2e8f0', whiteSpace: 'nowrap' }}>
                          {day.substring(0, 3)}
                        </td>
                        {timeSlots.map(slot => {
                          const entry = getCellEntry(day, slot);
                          return (
                            <td key={slot.id} style={{ border: '1px solid #e2e8f0', padding: 6, verticalAlign: 'top', minHeight: 80 }}>
                              {entry ? (
                                <div style={{
                                  borderRadius: 6,
                                  padding: '5px 7px',
                                  fontSize: 11,
                                  fontWeight: 500,
                                  background: entry.subject_type === 'lab' ? '#fef3c7' : '#dbeafe',
                                  border: `1px solid ${entry.subject_type === 'lab' ? '#fcd34d' : '#93c5fd'}`,
                                  color: entry.subject_type === 'lab' ? '#92400e' : '#1e40af',
                                  lineHeight: 1.4,
                                }}>
                                  <div style={{ fontWeight: 700, fontSize: 12 }}>{entry.subject_code}</div>
                                  <div style={{ opacity: 0.85, marginTop: 1 }} title={entry.subject_name}>
                                    {entry.subject_name?.length > 18
                                      ? entry.subject_name.substring(0, 16) + 'â€¦'
                                      : entry.subject_name}
                                  </div>
                                  <div style={{ opacity: 0.75, marginTop: 2 }}>
                                    {entry.staff_name?.split(' ').slice(-1)[0]}
                                  </div>
                                  <div style={{ opacity: 0.65 }}>{entry.room_number}</div>
                                </div>
                              ) : (
                                <div style={{ textAlign: 'center', color: '#cbd5e1', fontSize: 18, paddingTop: 20 }}>â€”</div>
                              )}
                            </td>
                          );
                        })}
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </>
          )}
        </div>
      )}

      {/* Empty state */}
      {!loading && !timetable && (
        <div className="card" style={{ padding: '80px 20px', textAlign: 'center', color: '#94a3b8' }}>
          <Eye size={56} style={{ margin: '0 auto 16px', opacity: 0.2 }} />
          <p style={{ fontSize: 18, fontWeight: 600, marginBottom: 8 }}>No timetable loaded</p>
          <p style={{ fontSize: 13 }}>Select a view type and entity, choose the Academic Year (â˜…), then click View</p>
        </div>
      )}
    </div>
  );
};

export default TimetableViewer;

