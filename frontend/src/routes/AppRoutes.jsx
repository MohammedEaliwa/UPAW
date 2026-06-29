import React from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';

import Home from '../pages/public/home/Home';
import News from '../pages/news/news/News';
import About from '../pages/public/about/About';
import Contact from '../pages/public/contact/Contact';
import WorkingPapersPublic from '../pages/papers/working-papers/WorkingPapersPublic';
import Login from '../pages/auth/login/Login';
import Register from '../pages/auth/register/Register';
import InteractiveMap from '../pages/map/interactive-map/InteractiveMap';
import Error404 from '../pages/public/error404/Error404';
import DynamicPage from '../pages/public/dynamic-page/DynamicPage';
import ComplaintsPage from '../pages/public/complaints/ComplaintsPage';
import CompanyRegistration from '../pages/public/company-registration/CompanyRegistration';
import Gallery from '../pages/public/gallery/Gallery';
import Library from '../pages/public/library/Library';

import DashboardLayout from '../layouts/DashboardLayout';
import DashboardHome from '../pages/dashboard/home/DashboardHome';
import AddNews from '../pages/dashboard/news/AddNews';
import ManageNews from '../pages/dashboard/news/ManageNews';
import WorkingPapers from '../pages/dashboard/papers/WorkingPapers';
import InternalNews from '../pages/dashboard/news/InternalNews';
import UserManagement from '../pages/dashboard/users/UserManagement';
import ManageMap from '../pages/dashboard/map/ManageMap';
import Profile from '../pages/dashboard/users/Profile';
import ManageStats from '../pages/dashboard/stats/ManageStats';
import ManagePages from '../pages/dashboard/pages/ManagePages';
import ManageAbout from '../pages/dashboard/pages/ManageAbout';
import Companies from '../pages/dashboard/companies/Companies';
import ManageGallery from '../pages/dashboard/gallery/ManageGallery';
import DecisionsPage from '../pages/papers/decisions/DecisionsPage';

import PublicLayout from '../layouts/PublicLayout';
import DashboardGuard from './DashboardGuard';

const AppRoutes = () => {
  return (
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
      </Route>
    </Routes>
  );
};

export default AppRoutes;
