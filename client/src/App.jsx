import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { Toaster } from 'react-hot-toast';
import useAuthStore from './store/authStore';
import Navbar from './components/common/Navbar';
import HelpPage from './pages/HelpPage';
import ManageTickets from './pages/admin/ManageTickets';

// Pages
import LoginPage from './pages/LoginPage';
import DashboardPage from './pages/DashboardPage';
import FlipbookPage from './pages/FlipbookPage';
import AdminDashboard from './pages/admin/AdminDashboard';
import ManageBooks from './pages/admin/ManageBooks';
import ManageCategories from './pages/admin/ManageCategories';
import ManageAgents from './pages/admin/ManageAgents';
import VisitLogPage from './pages/VisitLogPage';
import ManageVisits from './pages/admin/ManageVisits';

const queryClient = new QueryClient({
  defaultOptions: { queries: { retry: 1, staleTime: 60 * 1000 } }
});

// Route guards
const Protected = ({ children }) => {
  const { token } = useAuthStore();
  return token ? children : <Navigate to="/login" replace />;
};

const AdminOnly = ({ children }) => {
  const { user } = useAuthStore();
  return user?.role === 'admin' ? children : <Navigate to="/dashboard" replace />;
};

const WithNav = ({ children }) => (
  <>
    <Navbar />
    <main>{children}</main>
  </>
);

export default function App() {
  const { token } = useAuthStore();

  return (
    <QueryClientProvider client={queryClient}>
      <BrowserRouter>
        <Routes>
          {/* Public */}
          <Route path="/login" element={token ? <Navigate to="/dashboard" replace /> : <LoginPage />} />

          {/* Agent routes */}
          <Route path="/dashboard" element={
            <Protected><WithNav><DashboardPage /></WithNav></Protected>
          } />
          <Route path="/book/:id" element={
            <Protected><FlipbookPage /></Protected>
          } />

          <Route path="/visits" element={
            <Protected><WithNav><VisitLogPage /></WithNav></Protected>
          } />
          <Route path="/admin/visits" element={
            <Protected><AdminOnly><WithNav><ManageVisits /></WithNav></AdminOnly></Protected>
          } />

          {/* Admin routes */}
          <Route path="/admin" element={
            <Protected><AdminOnly><WithNav><AdminDashboard /></WithNav></AdminOnly></Protected>
          } />
          <Route path="/admin/books" element={
            <Protected><AdminOnly><WithNav><ManageBooks /></WithNav></AdminOnly></Protected>
          } />
          <Route path="/admin/categories" element={
            <Protected><AdminOnly><WithNav><ManageCategories /></WithNav></AdminOnly></Protected>
          } />
          <Route path="/admin/agents" element={
            <Protected><AdminOnly><WithNav><ManageAgents /></WithNav></AdminOnly></Protected>
          } />
          <Route path="/help" element={
            <Protected><WithNav><HelpPage /></WithNav></Protected>
          } />
          <Route path="/admin/tickets" element={
            <Protected><AdminOnly><WithNav><ManageTickets /></WithNav></AdminOnly></Protected>
          } />

          {/* Default redirect */}
          <Route path="*" element={<Navigate to={token ? '/dashboard' : '/login'} replace />} />
        </Routes>
      </BrowserRouter>

      <Toaster position="top-right" toastOptions={{
        style: { borderRadius: '12px', fontSize: '14px' },
        success: { iconTheme: { primary: '#4F46E5', secondary: '#fff' } }
      }} />
    </QueryClientProvider>
  );
}
