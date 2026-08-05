/**
 * Interval Settings Controller
 * Handles period timing configuration and auto time calculation
 */
const { pool } = require('../config/database');
const { sendSuccess, sendError } = require('../utils/response');
const { logActivity } = require('../utils/logger');

// ─── Get current interval settings ───────────────────────────────────────────
const getSettings = async (req, res, next) => {
  try {
    const [rows] = await pool.execute(
      'SELECT * FROM interval_settings ORDER BY id DESC LIMIT 1'
    );
    return sendSuccess(res, rows[0] || null);
  } catch (error) { next(error); }
};

// ─── Save / update interval settings ─────────────────────────────────────────
const saveSettings = async (req, res, next) => {
  try {
    const {
      start_time, period_duration, num_periods,
      interval_duration, interval_after_period,
      lunch_duration, lunch_after_period, include_saturday,
    } = req.body;

    // Validate required fields
    if (!start_time || !period_duration || !num_periods) {
      return sendError(res, 'start_time, period_duration and num_periods are required.', 400);
    }

    const [existing] = await pool.execute(
      "SELECT id FROM interval_settings WHERE setting_name = 'default' LIMIT 1"
    );

    if (existing.length) {
      await pool.execute(
        `UPDATE interval_settings SET start_time=?, period_duration=?, num_periods=?,
         interval_duration=?, interval_after_period=?, lunch_duration=?,
         lunch_after_period=?, include_saturday=? WHERE setting_name='default'`,
        [start_time, period_duration, num_periods, interval_duration || 15,
         interval_after_period || 2, lunch_duration || 50,
         lunch_after_period || 4, include_saturday ?? 1]
      );
    } else {
      await pool.execute(
        `INSERT INTO interval_settings
         (setting_name,start_time,period_duration,num_periods,interval_duration,
          interval_after_period,lunch_duration,lunch_after_period,include_saturday,created_by)
         VALUES ('default',?,?,?,?,?,?,?,?,?)`,
        [start_time, period_duration, num_periods, interval_duration || 15,
         interval_after_period || 2, lunch_duration || 50,
         lunch_after_period || 4, include_saturday ?? 1, req.user.id]
      );
    }

    await logActivity(req.user.id, 'INTERVAL_SETTINGS_SAVE', 'Interval settings updated', req.ip);
    const [updated] = await pool.execute("SELECT * FROM interval_settings WHERE setting_name='default'");
    return sendSuccess(res, updated[0], 'Interval settings saved successfully.');
  } catch (error) { next(error); }
};

// ─── Auto-calculate period timings ────────────────────────────────────────────
const calculateTimings = async (req, res, next) => {
  try {
    const {
      start_time = '09:00',
      period_duration = 60,
      num_periods = 8,
      interval_duration = 15,
      interval_after_period = 2,
      lunch_duration = 50,
      lunch_after_period = 4,
    } = req.body;

    const slots = [];
    let currentMinutes = timeToMinutes(start_time);

    for (let p = 1; p <= num_periods; p++) {
      const startStr = minutesToTime(currentMinutes);
      currentMinutes += parseInt(period_duration);
      const endStr = minutesToTime(currentMinutes);

      slots.push({
        period_number: p,
        slot_name: `Period ${p}`,
        start_time: startStr,
        end_time: endStr,
        is_break: false,
        break_type: null,
        duration: parseInt(period_duration),
      });

      // Insert short interval break
      if (p === parseInt(interval_after_period) && p < num_periods) {
        const bStart = minutesToTime(currentMinutes);
        currentMinutes += parseInt(interval_duration);
        const bEnd = minutesToTime(currentMinutes);
        slots.push({
          period_number: null,
          slot_name: `Interval (${interval_duration} min)`,
          start_time: bStart,
          end_time: bEnd,
          is_break: true,
          break_type: 'short',
          duration: parseInt(interval_duration),
        });
      }

      // Insert lunch break
      if (p === parseInt(lunch_after_period) && p < num_periods) {
        const lStart = minutesToTime(currentMinutes);
        currentMinutes += parseInt(lunch_duration);
        const lEnd = minutesToTime(currentMinutes);
        slots.push({
          period_number: null,
          slot_name: `Lunch Break (${lunch_duration} min)`,
          start_time: lStart,
          end_time: lEnd,
          is_break: true,
          break_type: 'lunch',
          duration: parseInt(lunch_duration),
        });
      }
    }

    return sendSuccess(res, {
      slots,
      summary: {
        total_periods: num_periods,
        total_slots: slots.length,
        school_start: minutesToTime(timeToMinutes(start_time)),
        school_end: minutesToTime(currentMinutes),
      },
    }, `Generated ${slots.length} slots (${num_periods} periods + breaks)`);
  } catch (error) { next(error); }
};

// ─── Apply calculated timings to time_slots table ────────────────────────────
const applyTimings = async (req, res, next) => {
  try {
    const { slots } = req.body;
    if (!slots || !slots.length) return sendError(res, 'slots array is required.', 400);

    const conn = await pool.getConnection();
    try {
      await conn.beginTransaction();
      // Clear existing slots
      await conn.execute('DELETE FROM time_slots');
      let periodNumber = 1;
      for (const slot of slots) {
        if (!slot.is_break) {
          await conn.execute(
            'INSERT INTO time_slots (slot_name, start_time, end_time, period_number, is_break) VALUES (?,?,?,?,0)',
            [slot.slot_name, slot.start_time, slot.end_time, periodNumber++]
          );
        } else {
          await conn.execute(
            'INSERT INTO time_slots (slot_name, start_time, end_time, period_number, is_break, break_type) VALUES (?,?,?,?,1,?)',
            [slot.slot_name, slot.start_time, slot.end_time, periodNumber - 1, slot.break_type || 'short']
          );
        }
      }
      await conn.commit();
      await logActivity(req.user.id, 'TIMESLOTS_APPLY', `Applied ${slots.length} time slots`, req.ip);
      return sendSuccess(res, null, `${slots.length} time slots applied successfully.`);
    } catch (e) { await conn.rollback(); throw e; } finally { conn.release(); }
  } catch (error) { next(error); }
};

// ─── Helpers ──────────────────────────────────────────────────────────────────
function timeToMinutes(timeStr) {
  const [h, m] = (timeStr || '09:00').split(':').map(Number);
  return h * 60 + m;
}

function minutesToTime(mins) {
  const h = Math.floor(mins / 60) % 24;
  const m = mins % 60;
  return `${String(h).padStart(2, '0')}:${String(m).padStart(2, '0')}`;
}

module.exports = { getSettings, saveSettings, calculateTimings, applyTimings };
