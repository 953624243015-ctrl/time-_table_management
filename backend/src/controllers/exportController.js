const PDFDocument = require('pdfkit');
const ExcelJS = require('exceljs');
const { pool } = require('../config/database');

const DAYS = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];

// Fetch timetable rows flexible by class_id, staff_id, or room_id
async function fetchTimetableData(filterType, filterId, academicYearId) {
  const columnMap = { class: 't.class_id', staff: 't.staff_id', room: 't.room_id' };
  const col = columnMap[filterType] || 't.class_id';
  const ayClause = academicYearId ? 'AND t.academic_year_id = ?' : '';
  const params = academicYearId ? [filterId, academicYearId] : [filterId];

  const [rows] = await pool.execute(
    `SELECT t.*, ts.slot_name, ts.start_time, ts.end_time, ts.period_number,
      sub.subject_name, sub.subject_code, sub.subject_type,
      s.name as staff_name, r.room_number,
      c.year, c.semester, c.section, d.name as department_name
     FROM timetable t
     JOIN time_slots ts ON t.time_slot_id = ts.id
     JOIN subjects sub ON t.subject_id = sub.id
     JOIN staff s ON t.staff_id = s.id
     JOIN rooms r ON t.room_id = r.id
     JOIN classes c ON t.class_id = c.id
     JOIN departments d ON c.department_id = d.id
     WHERE ${col} = ? AND t.is_active = 1 ${ayClause}
     ORDER BY FIELD(t.day_of_week,"Monday","Tuesday","Wednesday","Thursday","Friday","Saturday"), ts.period_number`,
    params
  );

  const [timeSlots] = await pool.execute(
    'SELECT * FROM time_slots WHERE is_active = 1 ORDER BY period_number'
  );

  return { rows, timeSlots };
}

// ─── Export PDF ───────────────────────────────────────────────────────────────

const exportPDF = async (req, res, next) => {
  try {
    const { class_id, staff_id, room_id, academic_year_id, type } = req.query;
    // Determine filter type and id
    let filterType = 'class', filterId = class_id;
    if (type === 'staff' || staff_id) { filterType = 'staff'; filterId = staff_id || class_id; }
    else if (type === 'room' || room_id) { filterType = 'room'; filterId = room_id || class_id; }
    if (!filterId) return res.status(400).json({ success: false, message: 'An entity id (class_id/staff_id/room_id) is required' });

    const { rows, timeSlots } = await fetchTimetableData(filterType, filterId, academic_year_id);
    const teachingSlots = timeSlots.filter(ts => !ts.is_break);
    if (!rows.length) return res.status(404).json({ success: false, message: 'No timetable found for the selected entity and academic year' });

    const classInfo = rows[0];
    const subtitle = filterType === 'staff'
      ? `Faculty: ${classInfo.staff_name}`
      : filterType === 'room'
        ? `Room: ${classInfo.room_number} (${classInfo.room_type || ''})`
        : `${classInfo.department_name} | Year ${classInfo.year} | Semester ${classInfo.semester} | Section ${classInfo.section}`;

    const doc = new PDFDocument({ margin: 30, size: 'A4', layout: 'landscape' });
    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader('Content-Disposition', `attachment; filename="timetable_${filterType}_${filterId}.pdf"`);
    doc.pipe(res);

    // Header
    doc.fontSize(16).font('Helvetica-Bold').text('AI College Timetable Management System', { align: 'center' });
    doc.fontSize(12).font('Helvetica').text(subtitle, { align: 'center' });
    doc.moveDown(0.5);
    doc.fontSize(9).text(`Generated on: ${new Date().toLocaleString()}`, { align: 'right' });
    doc.moveDown(0.5);

    // Table setup
    const pageWidth = doc.page.width - 60;
    const colWidth = pageWidth / (teachingSlots.length + 1);
    const rowHeight = 40;
    const startX = 30;
    let y = doc.y;

    const drawCell = (text, x, y, w, h, bold = false, bg = null) => {
      if (bg) { doc.rect(x, y, w, h).fill(bg).stroke(); }
      doc.rect(x, y, w, h).stroke('#cccccc');
      doc.font(bold ? 'Helvetica-Bold' : 'Helvetica').fontSize(7)
        .fillColor('#000000')
        .text(text, x + 3, y + 5, { width: w - 6, height: h - 6, ellipsis: true });
    };

    // Header row
    drawCell('Day / Period', startX, y, colWidth, rowHeight, true, '#1e40af');
    doc.fillColor('#ffffff');
    doc.font('Helvetica-Bold').fontSize(7).text('Day / Period', startX + 3, y + 5, { width: colWidth - 6 });

    teachingSlots.forEach((slot, i) => {
      const x = startX + colWidth * (i + 1);
      drawCell('', x, y, colWidth, rowHeight, false, '#1e40af');
      doc.fillColor('#ffffff').font('Helvetica-Bold').fontSize(6)
        .text(`${slot.slot_name}\n${slot.start_time.substring(0, 5)}-${slot.end_time.substring(0, 5)}`,
          x + 2, y + 4, { width: colWidth - 4, align: 'center' });
    });

    // Data rows
    const usedDays = DAYS.filter(d => rows.some(r => r.day_of_week === d));
    usedDays.forEach((day, di) => {
      y += rowHeight;
      const bg = di % 2 === 0 ? '#f0f9ff' : '#ffffff';
      drawCell(day, startX, y, colWidth, rowHeight, true, bg);

      teachingSlots.forEach((slot, i) => {
        const entry = rows.find(r => r.day_of_week === day && r.period_number === slot.period_number);
        const x = startX + colWidth * (i + 1);
        const cellText = entry
          ? `${entry.subject_code}\n${entry.staff_name}\n${entry.room_number}`
          : '';
        const cellBg = entry ? (entry.subject_type === 'lab' ? '#fef3c7' : bg) : bg;
        drawCell(cellText, x, y, colWidth, rowHeight, false, cellBg);
      });
    });

    doc.end();
  } catch (error) { next(error); }
};

// ─── Export Excel ─────────────────────────────────────────────────────────────

const exportExcel = async (req, res, next) => {
  try {
    const { class_id, staff_id, room_id, academic_year_id, type } = req.query;
    let filterType = 'class', filterId = class_id;
    if (type === 'staff' || staff_id) { filterType = 'staff'; filterId = staff_id || class_id; }
    else if (type === 'room' || room_id) { filterType = 'room'; filterId = room_id || class_id; }
    if (!filterId) return res.status(400).json({ success: false, message: 'An entity id is required' });

    const { rows, timeSlots } = await fetchTimetableData(filterType, filterId, academic_year_id);
    const teachingSlots = timeSlots.filter(ts => !ts.is_break);
    if (!rows.length) return res.status(404).json({ success: false, message: 'No timetable found for the selected entity and academic year' });

    const classInfo = rows[0];
    const subtitle = filterType === 'staff'
      ? `Faculty: ${classInfo.staff_name}`
      : filterType === 'room'
        ? `Room: ${classInfo.room_number}`
        : `${classInfo.department_name} | Year ${classInfo.year} | Sem ${classInfo.semester} | Section ${classInfo.section}`;
    const workbook = new ExcelJS.Workbook();
    workbook.creator = 'AI Timetable System';
    workbook.created = new Date();

    const sheet = workbook.addWorksheet('Timetable', { pageSetup: { orientation: 'landscape' } });

    // Title
    sheet.mergeCells(1, 1, 1, teachingSlots.length + 1);
    const titleCell = sheet.getCell('A1');
    titleCell.value = 'AI College Timetable Management System';
    titleCell.font = { size: 14, bold: true, color: { argb: 'FFFFFFFF' } };
    titleCell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FF1e40af' } };
    titleCell.alignment = { horizontal: 'center', vertical: 'middle' };
    sheet.getRow(1).height = 30;

    sheet.mergeCells(2, 1, 2, teachingSlots.length + 1);
    const subTitle = sheet.getCell('A2');
    subTitle.value = subtitle;
    subTitle.font = { size: 11, bold: true };
    subTitle.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FFdbeafe' } };
    subTitle.alignment = { horizontal: 'center', vertical: 'middle' };
    sheet.getRow(2).height = 22;

    // Header row
    const headerRow = sheet.getRow(3);
    headerRow.getCell(1).value = 'Day';
    teachingSlots.forEach((slot, i) => {
      headerRow.getCell(i + 2).value = `${slot.slot_name}\n${slot.start_time.substring(0,5)}-${slot.end_time.substring(0,5)}`;
    });
    headerRow.eachCell(cell => {
      cell.font = { bold: true, color: { argb: 'FFFFFFFF' }, size: 9 };
      cell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FF1e40af' } };
      cell.alignment = { horizontal: 'center', vertical: 'middle', wrapText: true };
      cell.border = { top: { style: 'thin' }, bottom: { style: 'thin' }, left: { style: 'thin' }, right: { style: 'thin' } };
    });
    headerRow.height = 30;

    const usedDays = DAYS.filter(d => rows.some(r => r.day_of_week === d));
    usedDays.forEach((day, di) => {
      const dataRow = sheet.getRow(4 + di);
      dataRow.getCell(1).value = day;
      dataRow.getCell(1).font = { bold: true };
      dataRow.getCell(1).fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FFdbeafe' } };

      teachingSlots.forEach((slot, i) => {
        const entry = rows.find(r => r.day_of_week === day && r.period_number === slot.period_number);
        const cell = dataRow.getCell(i + 2);
        if (entry) {
          cell.value = `${entry.subject_code}\n${entry.subject_name}\n${entry.staff_name}\n${entry.room_number}`;
          cell.fill = {
            type: 'pattern', pattern: 'solid',
            fgColor: { argb: entry.subject_type === 'lab' ? 'FFfef3c7' : (di % 2 === 0 ? 'FFf0f9ff' : 'FFFFFFFF') }
          };
        }
        cell.alignment = { horizontal: 'center', vertical: 'middle', wrapText: true };
        cell.border = { top: { style: 'thin' }, bottom: { style: 'thin' }, left: { style: 'thin' }, right: { style: 'thin' } };
        cell.font = { size: 8 };
      });
      dataRow.height = 50;
    });

    // Column widths
    sheet.getColumn(1).width = 14;
    teachingSlots.forEach((_, i) => { sheet.getColumn(i + 2).width = 18; });

    res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
    res.setHeader('Content-Disposition', `attachment; filename="timetable_${filterType}_${filterId}.xlsx"`);

    await workbook.xlsx.write(res);
    res.end();
  } catch (error) { next(error); }
};

module.exports = { exportPDF, exportExcel };
