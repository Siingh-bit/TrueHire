const API_BASE = window.location.hostname === 'localhost' ? 'http://localhost:3001/api' : '/api';

class ApiClient {
  constructor() {
    this.baseUrl = API_BASE;
  }

  getToken() {
    return localStorage.getItem('truehire_token');
  }

  setToken(token) {
    localStorage.setItem('truehire_token', token);
  }

  removeToken() {
    localStorage.removeItem('truehire_token');
  }

  async request(endpoint, options = {}) {
    const url = `${this.baseUrl}${endpoint}`;
    const token = this.getToken();

    const config = {
      headers: {
        'Content-Type': 'application/json',
        ...(token && { Authorization: `Bearer ${token}` }),
        ...options.headers,
      },
      ...options,
    };

    if (config.body && typeof config.body === 'object' && !(config.body instanceof FormData)) {
      config.body = JSON.stringify(config.body);
    }

    if (config.body instanceof FormData) {
      delete config.headers['Content-Type'];
    }

    try {
      const response = await fetch(url, config);
      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || `HTTP error ${response.status}`);
      }

      return data;
    } catch (error) {
      if (error.message === 'Failed to fetch') {
        throw new Error('Unable to connect to server. Please try again.');
      }
      throw error;
    }
  }

  // Auth
  async sendOtp(email, type, password = null) {
    return this.request('/auth/send-otp', {
      method: 'POST',
      body: { email, type, password },
    });
  }

  async login(email, password, otp) {
    const data = await this.request('/auth/login', {
      method: 'POST',
      body: { email, password, otp },
    });
    if (data.data?.token) {
      this.setToken(data.data.token);
    }
    return data;
  }

  async register(userData) {
    const data = await this.request('/auth/register', {
      method: 'POST',
      body: userData,
    });
    if (data.data?.token) {
      this.setToken(data.data.token);
    }
    return data;
  }

  async getMe() {
    return this.request('/auth/me');
  }

  logout() {
    this.removeToken();
  }

  // Candidates
  async getCandidates(filters = {}) {
    const params = new URLSearchParams(filters).toString();
    return this.request(`/candidates?${params}`);
  }

  async getCandidate(id) {
    return this.request(`/candidates/${id}`);
  }

  async updateProfile(profileData) {
    return this.request('/candidates/profile', {
      method: 'PUT',
      body: profileData,
    });
  }

  async addEducation(data) {
    return this.request('/candidates/education', {
      method: 'POST',
      body: data,
    });
  }

  async updateEducation(id, data) {
    return this.request(`/candidates/education/${id}`, {
      method: 'PUT',
      body: data,
    });
  }

  async deleteEducation(id) {
    return this.request(`/candidates/education/${id}`, {
      method: 'DELETE',
    });
  }

  async addExperience(data) {
    return this.request('/candidates/experience', {
      method: 'POST',
      body: data,
    });
  }

  async updateExperience(id, data) {
    return this.request(`/candidates/experience/${id}`, {
      method: 'PUT',
      body: data,
    });
  }

  async deleteExperience(id) {
    return this.request(`/candidates/experience/${id}`, {
      method: 'DELETE',
    });
  }

  async addSkill(data) {
    return this.request('/candidates/skills', {
      method: 'POST',
      body: data,
    });
  }

  async updateSkill(id, data) {
    return this.request(`/candidates/skills/${id}`, {
      method: 'PUT',
      body: data,
    });
  }

  async deleteSkill(id) {
    return this.request(`/candidates/skills/${id}`, {
      method: 'DELETE',
    });
  }

  // Employers
  async getEmployer(id) {
    return this.request(`/employers/${id}`);
  }

  async updateEmployerProfile(data) {
    return this.request('/employers/profile', {
      method: 'PUT',
      body: data,
    });
  }

  // Jobs
  async getJobs(filters = {}) {
    const params = new URLSearchParams(filters).toString();
    return this.request(`/jobs?${params}`);
  }

  async getJob(id) {
    return this.request(`/jobs/${id}`);
  }

  async createJob(data) {
    return this.request('/jobs', {
      method: 'POST',
      body: data,
    });
  }

  async updateJob(id, data) {
    return this.request(`/jobs/${id}`, {
      method: 'PUT',
      body: data,
    });
  }

  async deleteJob(id) {
    return this.request(`/jobs/${id}`, {
      method: 'DELETE',
    });
  }

  // Applications
  async getMyApplications() {
    return this.request('/applications/candidate');
  }

  async getJobApplications(jobId) {
    return this.request(`/applications/job/${jobId}`);
  }

  async applyForJob(jobId, coverLetter) {
    return this.request('/applications', {
      method: 'POST',
      body: { job_id: jobId, cover_letter: coverLetter },
    });
  }

  async updateApplicationStatus(id, status) {
    return this.request(`/applications/${id}/status`, {
      method: 'PUT',
      body: { status },
    });
  }

  // Assessments
  async getAssessment(id) {
    return this.request(`/assessments/${id}`);
  }

  async generateAssessment(applicationId) {
    return this.request(`/assessments/generate/${applicationId}`, {
      method: 'POST',
    });
  }

  async startAssessment(id) {
    return this.request(`/assessments/${id}/start`, {
      method: 'PUT',
    });
  }

  async submitAssessment(id, answers) {
    return this.request(`/assessments/${id}/submit`, {
      method: 'PUT',
      body: { answers },
    });
  }

  async logViolation(id, violation) {
    return this.request(`/assessments/${id}/violation`, {
      method: 'PUT',
      body: violation,
    });
  }

  // Feedback
  async getCandidateFeedback(candidateId) {
    return this.request(`/feedback/candidate/${candidateId}`);
  }

  async requestFeedback(data) {
    return this.request('/feedback/request', {
      method: 'POST',
      body: data,
    });
  }

  async getFeedbackByToken(token) {
    return this.request(`/feedback/verify/${token}`);
  }

  async verifyFeedbackToken(token) {
    return this.request(`/feedback/verify/${token}`);
  }

  async submitFeedback(token, data) {
    return this.request(`/feedback/submit/${token}`, {
      method: 'POST',
      body: data,
    });
  }

  // Agreement
  async getAgreement() { return this.request('/agreement'); }
  async acceptAgreement() { return this.request('/agreement/accept', { method: 'POST' }); }

  // Switch Plan
  async updateSwitchPlan(data) { return this.request('/candidates/switch-plan', { method: 'PUT', body: data }); }

  // Availability
  async getAvailability() { return this.request('/candidates/availability'); }
  async addAvailability(data) { return this.request('/candidates/availability', { method: 'POST', body: data }); }
  async deleteAvailability(id) { return this.request(`/candidates/availability/${id}`, { method: 'DELETE' }); }

  // Pipeline
  async getCandidatePipeline() { return this.request('/pipeline/candidate'); }
  async getJobPipeline(jobId) { return this.request(`/pipeline/job/${jobId}`); }
  async getAllPipelines() { return this.request('/pipeline/all'); }
  async createPipeline(applicationId) { return this.request(`/pipeline/create/${applicationId}`, { method: 'POST' }); }
  async updateLevel1(id, data) { return this.request(`/pipeline/${id}/level1`, { method: 'PUT', body: data }); }
  async updateLevel2(id, data) { return this.request(`/pipeline/${id}/level2`, { method: 'PUT', body: data }); }
  async sendToEmployer(id) { return this.request(`/pipeline/${id}/send-to-employer`, { method: 'PUT' }); }
  async updateEmployerStatus(id, data) { return this.request(`/pipeline/${id}/employer-status`, { method: 'PUT', body: data }); }

  // Admin
  async getAdminDashboard() { return this.request('/admin/dashboard'); }
  async getAdminCandidates(filters = {}) {
    const params = new URLSearchParams(Object.entries(filters).filter(([,v]) => v)).toString();
    return this.request(`/admin/candidates${params ? '?' + params : ''}`);
  }
  async getAdminCandidate(id) { return this.request(`/admin/candidates/${id}`); }
  async updateAccountStatus(id, status, reason) { return this.request(`/admin/candidates/${id}/account-status`, { method: 'PUT', body: { status, reason } }); }
  async updatePenalty(id, penalty_status, reason) { return this.request(`/admin/candidates/${id}/penalty`, { method: 'PUT', body: { penalty_status, reason } }); }
  async addAdminNote(id, notes) { return this.request(`/admin/candidates/${id}/notes`, { method: 'POST', body: { notes } }); }
  async updateCheatingFlag(id, flag, notes) { return this.request(`/admin/candidates/${id}/cheating-flag`, { method: 'PUT', body: { flag, notes } }); }
  async getMatchingCandidates(jobId) { return this.request(`/jobs/matching-candidates/${jobId}`); }
  async createAdmin(email, password) { return this.request('/admin/admins', { method: 'POST', body: { email, password } }); }
  async getAdmins() { return this.request('/admin/admins'); }

  // Analytics
  async trackAnalytics(event_type, path) {
    // Fire and forget (no need to await or handle errors heavily on the client side)
    return this.request('/analytics/track', {
      method: 'POST',
      body: { event_type, path }
    }).catch(() => {});
  }
}

const api = new ApiClient();
export default api;
