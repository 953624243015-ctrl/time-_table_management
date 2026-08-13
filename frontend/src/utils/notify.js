/**
 * Centralized notification utility
 * Wraps react-hot-toast with consistent styles and messages
 */
import toast from 'react-hot-toast';

const notify = {
  success: (msg) => toast.success(msg || 'Done successfully!'),
  error:   (msg) => toast.error(msg   || 'Something went wrong.'),
  info:    (msg) => toast(msg, {
    icon: 'ℹ️',
    style: {
      background: '#eff6ff',
      color: '#1e40af',
      border: '1px solid #bfdbfe',
      borderRadius: '12px',
      fontSize: '14px',
      fontWeight: '500',
    },
  }),
  warning: (msg) => toast(msg, {
    icon: '⚠️',
    style: {
      background: '#fffbeb',
      color: '#92400e',
      border: '1px solid #fde68a',
      borderRadius: '12px',
      fontSize: '14px',
      fontWeight: '500',
    },
    duration: 4000,
  }),
  loading: (msg) => toast.loading(msg || 'Please wait...'),
  dismiss: (id)  => toast.dismiss(id),

  // Promise-based — auto shows loading → success/error
  promise: (promise, msgs) => toast.promise(promise, {
    loading: msgs?.loading || 'Processing...',
    success: msgs?.success || 'Done!',
    error:   (err) => err?.response?.data?.message || msgs?.error || 'Failed.',
  }),

  // API error helper — extracts message from axios error
  apiError: (err, fallback = 'Operation failed') => {
    const msg = err?.response?.data?.message || err?.message || fallback;
    toast.error(msg);
    return msg;
  },
};

export default notify;
