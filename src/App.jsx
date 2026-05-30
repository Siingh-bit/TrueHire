import { Routes, Route, Navigate } from 'react-router-dom';
import { SpeedInsights } from '@vercel/speed-insights/react';
import { useAuth } from './context/AuthContext';
import Navbar from './components/Layout/Navbar';
import Landing from './pages/Landing';
import Login from './pages/Auth/Login';
import Register from './pages/Auth/Register';
import CandidateDashboard from './pages/Candidate/Dashboard';
import CandidateProfile from './pages/Candidate/Profile';
import JobSearch from './pages/Candidate/JobSearch';
import JobDetail from './pages/Candidate/JobDetail';
import Applications from './pages/Candidate/Applications';
import EmployerDashboard from './pages/Employer/Dashboard';
import PostJob from './pages/Employer/PostJob';
import ManageJobs from './pages/Employer/ManageJobs';
import Applicants from './pages/Employer/Applicants';
import TakeAssessment from './pages/Assessment/TakeAssessment';
import AssessmentResults from './pages/Assessment/Results';
import RequestFeedback from './pages/Feedback/RequestFeedback';
import SubmitFeedback from './pages/Feedback/SubmitFeedback';

function ProtectedRoute({ children, role }) {
  const { isAuthenticated, user, loading } = useAuth();
  if (loading) return <div className="page-loader"><div className="spinner" /></div>;
  if (!isAuthenticated) return <Navigate to="/login" />;
  if (role && user.role !== role) return <Navigate to="/" />;
  return children;
}

export default function App() {
  return (
    <div className="app">
      <Routes>
        {/* Assessment has no navbar - fullscreen */}
        <Route path="/assessment/:id" element={
          <ProtectedRoute role="candidate">
            <TakeAssessment />
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

                {/* Candidate Routes */}
                <Route path="/candidate/dashboard" element={<ProtectedRoute role="candidate"><CandidateDashboard /></ProtectedRoute>} />
                <Route path="/candidate/profile" element={<ProtectedRoute role="candidate"><CandidateProfile /></ProtectedRoute>} />
                <Route path="/candidate/jobs" element={<ProtectedRoute role="candidate"><JobSearch /></ProtectedRoute>} />
                <Route path="/candidate/jobs/:id" element={<ProtectedRoute role="candidate"><JobDetail /></ProtectedRoute>} />
                <Route path="/candidate/applications" element={<ProtectedRoute role="candidate"><Applications /></ProtectedRoute>} />
                <Route path="/candidate/feedback/request" element={<ProtectedRoute role="candidate"><RequestFeedback /></ProtectedRoute>} />

                {/* Employer Routes */}
                <Route path="/employer/dashboard" element={<ProtectedRoute role="employer"><EmployerDashboard /></ProtectedRoute>} />
                <Route path="/employer/post-job" element={<ProtectedRoute role="employer"><PostJob /></ProtectedRoute>} />
                <Route path="/employer/jobs" element={<ProtectedRoute role="employer"><ManageJobs /></ProtectedRoute>} />
                <Route path="/employer/jobs/:jobId/applicants" element={<ProtectedRoute role="employer"><Applicants /></ProtectedRoute>} />

                {/* Assessment Results */}
                <Route path="/assessment/:id/results" element={<ProtectedRoute><AssessmentResults /></ProtectedRoute>} />

                {/* Public Feedback Submission */}
                <Route path="/feedback/submit/:token" element={<SubmitFeedback />} />
              </Routes>
            </main>
          </>
        } />
      </Routes>
      <SpeedInsights />
    </div>
  );
}
