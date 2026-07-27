import { lazy, Suspense } from 'react';
import { Routes, Route } from 'react-router-dom';

// Lazy-loaded public pages
const Home                = lazy(() => import('../pages/public/home/Home'));
const News                = lazy(() => import('../pages/news/news/News'));
const About               = lazy(() => import('../pages/public/about/About'));
const Contact             = lazy(() => import('../pages/public/contact/Contact'));
const WorkingPapersPublic = lazy(() => import('../pages/papers/working-papers/WorkingPapersPublic'));
const Login               = lazy(() => import('../pages/auth/login/Login'));
const Register            = lazy(() => import('../pages/auth/register/Register'));
const InteractiveMap      = lazy(() => import('../pages/map/interactive-map/InteractiveMap'));
const Error404            = lazy(() => import('../pages/public/error404/Error404'));
const DynamicPage         = lazy(() => import('../pages/public/dynamic-page/DynamicPage'));
const ComplaintsPage      = lazy(() => import('../pages/public/complaints/ComplaintsPage'));
const CompanyRegistration = lazy(() => import('../pages/public/company-registration/CompanyRegistration'));
const Gallery             = lazy(() => import('../pages/public/gallery/Gallery'));
const Library             = lazy(() => import('../pages/public/library/Library'));
const ExpertsRegistration = lazy(() => import('../pages/public/experts-registration/ExpertsRegistration'));
const DecisionsPage       = lazy(() => import('../pages/papers/decisions/DecisionsPage'));

// Lazy-loaded dashboard pages
const DashboardLayout   = lazy(() => import('../layouts/DashboardLayout'));
const DashboardHome     = lazy(() => import('../pages/dashboard/home/DashboardHome'));
const AddNews           = lazy(() => import('../pages/dashboard/news/AddNews'));
const ManageNews        = lazy(() => import('../pages/dashboard/news/ManageNews'));
const WorkingPapers     = lazy(() => import('../pages/dashboard/papers/WorkingPapers'));
const InternalNews      = lazy(() => import('../pages/dashboard/news/InternalNews'));
const UserManagement    = lazy(() => import('../pages/dashboard/users/UserManagement'));
const ManageMap         = lazy(() => import('../pages/dashboard/map/ManageMap'));
const Profile           = lazy(() => import('../pages/dashboard/users/Profile'));
const ManageStats       = lazy(() => import('../pages/dashboard/stats/ManageStats'));
const ManagePages       = lazy(() => import('../pages/dashboard/pages/ManagePages'));
const ManageAbout       = lazy(() => import('../pages/dashboard/pages/ManageAbout'));
const Companies         = lazy(() => import('../pages/dashboard/companies/Companies'));
const ManageGallery     = lazy(() => import('../pages/dashboard/gallery/ManageGallery'));
const ManageHomeImages  = lazy(() => import('../pages/dashboard/gallery/ManageHomeImages'));
const RequestsDashboard = lazy(() => import('../pages/dashboard/requests/RequestsDashboard'));
const SubmitRequests    = lazy(() => import('../pages/dashboard/requests/SubmitRequests'));
const AuditLogs         = lazy(() => import('../pages/dashboard/audit/AuditLogs'));

import PublicLayout  from '../layouts/PublicLayout';
import DashboardGuard from './DashboardGuard';

// Simple loading fallback - minimal to avoid flicker
const PageLoader = () => (
  <div style={{
    display: 'flex', alignItems: 'center', justifyContent: 'center',
    minHeight: '100vh', background: 'var(--bg, #020d1f)'
  }}>
    <div className="spinner-border" style={{ color: 'var(--primary, #0066cc)', width: 40, height: 40 }} role="status" />
  </div>
);

const AppRoutes = () => {
  return (
    <Suspense fallback={<PageLoader />}>
      <Routes>
        {/* Auth Routes (no nav/footer) */}
        <Route path="/login" element={<Login />} />
        <Route path="/register" element={<Register />} />
        <Route path="/404" element={<Error404 />} />

        {/* Public Routes */}
        <Route path="/" element={<PublicLayout><Home /></PublicLayout>} />
        <Route path="/interactive-map" element={<PublicLayout><InteractiveMap /></PublicLayout>} />
        <Route path="/news" element={<PublicLayout><News /></PublicLayout>} />
        <Route path="/working-papers" element={<PublicLayout><WorkingPapersPublic /></PublicLayout>} />
        <Route path="/about" element={<PublicLayout><About /></PublicLayout>} />
        <Route path="/contact" element={<PublicLayout><Contact /></PublicLayout>} />
        <Route path="/page/:id" element={<PublicLayout><DynamicPage /></PublicLayout>} />
        <Route path="/complaints" element={<PublicLayout><ComplaintsPage /></PublicLayout>} />
        <Route path="/company-registration" element={<PublicLayout><CompanyRegistration /></PublicLayout>} />
        <Route path="/experts-registration" element={<PublicLayout><ExpertsRegistration /></PublicLayout>} />
        <Route path="/gallery" element={<PublicLayout><Gallery /></PublicLayout>} />
        <Route path="/library" element={<PublicLayout><Library /></PublicLayout>} />
        <Route path="/decisions" element={<PublicLayout><DecisionsPage /></PublicLayout>} />

        {/* Dashboard Routes */}
        <Route path="/dashboard" element={<DashboardGuard><DashboardLayout /></DashboardGuard>}>
          <Route index element={<DashboardHome />} />
          <Route path="add-news" element={<AddNews />} />
          <Route path="manage-news" element={<ManageNews />} />
          <Route path="working-papers" element={<WorkingPapers />} />
          <Route path="internal-news" element={<InternalNews />} />
          <Route path="user-management" element={<UserManagement />} />
          <Route path="manage-map" element={<ManageMap />} />
          <Route path="manage-pages" element={<ManagePages />} />
          <Route path="manage-about" element={<ManageAbout />} />
          <Route path="profile" element={<Profile />} />
          <Route path="manage-stats" element={<ManageStats />} />
          <Route path="companies" element={<Companies />} />
          <Route path="manage-gallery" element={<ManageGallery />} />
          <Route path="manage-home-images" element={<ManageHomeImages />} />
          <Route path="requests" element={<RequestsDashboard />} />
          <Route path="submit-requests" element={<SubmitRequests />} />
          <Route path="audit-logs" element={<AuditLogs />} />
        </Route>
      </Routes>
    </Suspense>
  );
};

export default AppRoutes;
