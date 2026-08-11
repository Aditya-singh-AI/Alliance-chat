import React, { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import Layout from '../../components/Layout';
import AdminDashboard from './AdminDashboard';
import { useUserStore } from '../../store/useUserStore';
import { toast } from 'react-toastify';

const AdminPage = () => {
  const { user } = useUserStore();
  const navigate = useNavigate();

  useEffect(() => {
    if (user && user.role !== 'admin') {
      toast.error('Access denied: Only administrators can access the Admin Dashboard');
      navigate('/', { replace: true });
    }
  }, [user, navigate]);

  if (!user || user.role !== 'admin') {
    return null;
  }

  return (
    <Layout>
      <AdminDashboard />
    </Layout>
  );
};

export default AdminPage;
