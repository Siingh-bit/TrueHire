import { Routes, Route, Navigate, useLocation } from 'react-router-dom';
import { useEffect } from 'react';
import { useAuth } from './context/AuthContext';
import Navbar from './components/Layout/Navbar';
import Landing from './pages/Landing';
import Login from './pages/Auth/Login';
import Register from './pages/Auth/Register';
import CandidateDashboard from './pages/Candidate/Dashboard';
import CandidateCertifications from './pages/Candidate/Certifications';
import CandidateInterviews from './pages/Candidate/InterviewCalendar';
import CandidateProfile from './pages/Candidate/Profile';
import JobSearch from './pages/Candidate/JobSearch';
import JobDetail from './pages/Candidate/JobDetail';
import PublicJobs from './pages/Public/PublicJobs';
import PublicJob from './pages/Public/PublicJob';
import PublicCompany from './pages/Public/PublicCompany';
import Applications from './pages/Candidate/Applications';
import EmployerDashboard from './pages/Employer/Dashboard';
import EmployerAnalytics from './pages/Employer/Analytics';
import PostJob from './pages/Employer/PostJob';
import ManageJobs from './pages/Employer/ManageJobs';
import Applicants from './pages/Employer/Applicants';
import TakeAssessment from './pages/Assessment/TakeAssessment';
import AssessmentResults from './pages/Assessment/Results';
import RequestFeedback from './pages/Feedback/RequestFeedback';
import SubmitFeedback from './pages/Feedback/SubmitFeedback';

import CandidateAgreement from './pages/Candidate/Agreement';
import CandidateAvailability from './pages/Candidate/Availability';
import AdminDashboard from './pages/Admin/Dashboard';
import AdminCandidates from './pages/Admin/Candidates';
import AdminPipeline from './pages/Admin/Pipeline';
import AdminInterviews from './pages/Admin/Interviews';
import MatchingCandidates from './pages/Employer/MatchingCandidates';

import api from './api/client';

function ProtectedRoute({ children, role }) {
  const { isAuthenticated, user, profile, loading } = useAuth();
  if (loading) return <div className="page-loader"><div className="spinner" /></div>;
  if (!isAuthenticated) return <Navigate to="/login" />;
  if (role && user?.role !== role) return <Navigate to="/" />;
  // Agreement gate for candidates
  if (user?.role === 'candidate' && profile && !profile.agreement_accepted && window.location.pathname !== '/candidate/agreement') {
    return <Navigate to="/candidate/agreement" />;
  }
  return children;
}

function PageTracker() {
  const location = useLocation();
  useEffect(() => {
    // Only track page views for main routes to avoid spamming the database on every sub-render
    if (!location.pathname.startsWith('/api')) {
      api.trackAnalytics('page_view', location.pathname).catch(console.error);
    }
  }, [location.pathname]);
  return null;
}

import LiveRoom from './pages/Interview/LiveRoom';

export default function App() {
  return (
    <div className="app">
      <PageTracker />
      <Routes>
        {/* Assessment has no navbar - fullscreen */}
        <Route path="/assessment/:id" element={
          <ProtectedRoute role="candidate">
            <TakeAssessment />
          </ProtectedRoute>
        } />

        {/* Live Interview has no navbar - fullscreen */}
        <Route path="/interview/live/:id" element={
          <ProtectedRoute>
            <LiveRoom />
          </ProtectedRoute>
        } />

        {/* All other routes with navbar */}
        <Route path="*" element={
          <>
            <Navbar />
            <main className="main-content">
              <Routes>
                <Route path="/" element={<Landing />} />
                <Route path="/login" element={<Login />} />
                <Route path="/register" element={<Register />} />

                {/* Public job pages (SEO + shareable) */}
                <Route path="/jobs" element={<PublicJobs />} />
                <Route path="/jobs/location/:slug" element={<PublicJobs />} />
                <Route path="/jobs/role/:slug" element={<PublicJobs />} />
                <Route path="/jobs/skill/:slug" element={<PublicJobs />} />
                <Route path="/jobs/:id" element={<PublicJob />} />
                <Route path="/company/:id" element={<PublicCompany />} />

                {/* Candidate Routes */}
                <Route path="/candidate/agreement" element={<ProtectedRoute role="candidate"><CandidateAgreement /></ProtectedRoute>} />
                <Route path="/candidate/dashboard" element={<ProtectedRoute role="candidate"><CandidateDashboard /></ProtectedRoute>} />
                <Route path="/candidate/profile" element={<ProtectedRoute role="candidate"><CandidateProfile /></ProtectedRoute>} />
                <Route path="/candidate/jobs" element={<ProtectedRoute role="candidate"><JobSearch /></ProtectedRoute>} />
                <Route path="/candidate/jobs/:id" element={<ProtectedRoute role="candidate"><JobDetail /></ProtectedRoute>} />
                <Route path="/candidate/certifications" element={<ProtectedRoute role="candidate"><CandidateCertifications /></ProtectedRoute>} />
                <Route path="/candidate/interviews" element={<ProtectedRoute role="candidate"><CandidateInterviews /></ProtectedRoute>} />
                <Route path="/candidate/applications" element={<ProtectedRoute role="candidate"><Applications /></ProtectedRoute>} />
                <Route path="/candidate/availability" element={<ProtectedRoute role="candidate"><CandidateAvailability /></ProtectedRoute>} />
                <Route path="/candidate/feedback/request" element={<ProtectedRoute role="candidate"><RequestFeedback /></ProtectedRoute>} />

                {/* Employer Routes */}
                <Route path="/employer/dashboard" element={<ProtectedRoute role="employer"><EmployerDashboard /></ProtectedRoute>} />
                <Route path="/employer/analytics" element={<ProtectedRoute role="employer"><EmployerAnalytics /></ProtectedRoute>} />
                <Route path="/employer/post-job" element={<ProtectedRoute role="employer"><PostJob /></ProtectedRoute>} />
                <Route path="/employer/jobs" element={<ProtectedRoute role="employer"><ManageJobs /></ProtectedRoute>} />
                <Route path="/employer/jobs/:jobId/applicants" element={<ProtectedRoute role="employer"><Applicants /></ProtectedRoute>} />
                <Route path="/employer/jobs/:jobId/matching" element={<ProtectedRoute role="employer"><MatchingCandidates /></ProtectedRoute>} />

                {/* Admin Routes */}
                <Route path="/admin/dashboard" element={<ProtectedRoute role="admin"><AdminDashboard /></ProtectedRoute>} />
                <Route path="/admin/candidates" element={<ProtectedRoute role="admin"><AdminCandidates /></ProtectedRoute>} />
                <Route path="/admin/pipeline" element={<ProtectedRoute role="admin"><AdminPipeline /></ProtectedRoute>} />
                <Route path="/admin/interviews" element={<ProtectedRoute role="admin"><AdminInterviews /></ProtectedRoute>} />

                {/* Assessment Results */}
                <Route path="/assessment/:id/results" element={<ProtectedRoute><AssessmentResults /></ProtectedRoute>} />

                {/* Public Feedback Submission */}
                <Route path="/feedback/submit/:token" element={<SubmitFeedback />} />
              </Routes>
            </main>
          </>
        } />
      </Routes>
    </div>
  );
}
