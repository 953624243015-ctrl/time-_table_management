import { useState, useEffect, useCallback } from 'react';
import toast from 'react-hot-toast';

const useCRUD = (apiFns, defaultParams = {}) => {
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(false);
  const [pagination, setPagination] = useState({ page: 1, totalPages: 1, total: 0, limit: 10 });
  const [params, setParams] = useState({ page: 1, limit: 10, search: '', ...defaultParams });

  const fetchAll = useCallback(async (p = params) => {
    setLoading(true);
    try {
      const res = await apiFns.getAll(p);
      const d = res.data;
      setItems(d.data || []);
      if (d.pagination) setPagination(d.pagination);
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to load data');
    } finally {
      setLoading(false);
    }
  }, [params]);

  useEffect(() => { fetchAll(params); }, [params.page, params.search, params.limit]);

  const updateParam = (key, value) => setParams(p => ({ ...p, [key]: value, ...(key !== 'page' ? { page: 1 } : {}) }));

  const create = async (data) => {
    const res = await apiFns.create(data);
    toast.success(res.data.message || 'Created successfully');
    fetchAll(params);
    return res.data.data;
  };

  const update = async (id, data) => {
    const res = await apiFns.update(id, data);
    toast.success(res.data.message || 'Updated successfully');
    fetchAll(params);
    return res.data.data;
  };

  const remove = async (id) => {
    await apiFns.remove(id);
    toast.success('Deleted successfully');
    fetchAll(params);
  };

  return { items, loading, pagination, params, updateParam, create, update, remove, refresh: () => fetchAll(params) };
};

export default useCRUD;
