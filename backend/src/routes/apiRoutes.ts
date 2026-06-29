import { Router } from 'express';
import { authenticateJWT, requireRoles } from '../middleware/auth';
import {
  registerUser, loginUser, getDashboardMetrics, createBusiness, getBusinesses,
  connectGoogleAccount, getGoogleProfile, addKeyword, getKeywords, getGridRankings,
  getReviews, replyToReview, generateAiReviewResponse, addCompetitor, getCompetitors,
  getCitations, updateCitationStatus, runSeoAudit, runWebsiteAudit, getTasks,
  createTask, updateTaskStatus, generateAiContent, createSchema, getSchemas,
  generateReport, getReports, getSubscription, getAdminMetrics
} from '../controllers/apiControllers';

const router = Router();

import { validateRequest, registerSchema, loginSchema } from '../middleware/validate';

// Auth Routes
router.post('/auth/register', validateRequest(registerSchema), registerUser);
router.post('/auth/login', validateRequest(loginSchema), loginUser);

// Dashboard
router.get('/dashboard', authenticateJWT, getDashboardMetrics);

// Businesses
router.post('/businesses', authenticateJWT, createBusiness);
router.get('/businesses', authenticateJWT, getBusinesses);

// Google Profiles
router.post('/google-profiles/connect', authenticateJWT, connectGoogleAccount);
router.get('/google-profiles', authenticateJWT, getGoogleProfile);

// Keywords & Rankings
router.post('/keywords', authenticateJWT, addKeyword);
router.get('/keywords', authenticateJWT, getKeywords);
router.get('/keywords/grid', authenticateJWT, getGridRankings);

// Reviews
router.get('/reviews', authenticateJWT, getReviews);
router.post('/reviews/reply', authenticateJWT, replyToReview);
router.post('/reviews/ai-reply', authenticateJWT, generateAiReviewResponse);

// Competitors
router.post('/competitors', authenticateJWT, addCompetitor);
router.get('/competitors', authenticateJWT, getCompetitors);

// Citations
router.get('/citations', authenticateJWT, getCitations);
router.post('/citations/status', authenticateJWT, updateCitationStatus);

// Audits
router.post('/audits/seo', authenticateJWT, runSeoAudit);
router.post('/audits/website', authenticateJWT, runWebsiteAudit);

// Tasks
router.get('/tasks', authenticateJWT, getTasks);
router.post('/tasks', authenticateJWT, createTask);
router.post('/tasks/status', authenticateJWT, updateTaskStatus);

// AI Content Generator
router.post('/ai/generate', authenticateJWT, generateAiContent);

// Schema Generator
router.post('/schemas', authenticateJWT, createSchema);
router.get('/schemas', authenticateJWT, getSchemas);

// Reports
router.post('/reports', authenticateJWT, generateReport);
router.get('/reports', authenticateJWT, getReports);

// Billing
router.get('/billing/subscription', authenticateJWT, getSubscription);

// Admin Control
router.get('/admin/metrics', authenticateJWT, requireRoles(['Super Admin']), getAdminMetrics);

export default router;
