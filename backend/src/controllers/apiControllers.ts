import { Response } from 'express';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import mongoose from 'mongoose';
import { AuthenticatedRequest } from '../middleware/auth';
import {
  User, Agency, Business, GoogleProfile, Keyword, KeywordRanking, Review,
  ReviewReply, Task, Competitor, Citation, SeoAudit, WebsiteAudit, SchemaGenerator,
  AiGeneration, Post, Report, Subscription, Payment, Notification, ActivityLog
} from '../models';

// Helpers
const JWT_SECRET = process.env.JWT_SECRET || 'super_secret_localrank_pro_key_12345';
const logActivity = async (userId: string, action: string, details?: string, ip?: string) => {
  await ActivityLog.create({ userId, action, details, ipAddress: ip });
};

// ==========================================
// AUTHENTICATION CONTROLLER
// ==========================================
export const registerUser = async (req: AuthenticatedRequest, res: Response) => {
  try {
    const { name, email, password, role, agencyName } = req.body;

    const existingUser = await User.findOne({ email, isDeleted: false });
    if (existingUser) {
      return res.status(400).json({ error: 'User with this email already exists' });
    }

    const passwordHash = await bcrypt.hash(password, 10);
    
    // If Agency Owner, create an agency first
    let agencyId: mongoose.Types.ObjectId | undefined;
    if (role === 'Agency Owner') {
      const newAgency = await Agency.create({
        name: agencyName || `${name}'s Agency`,
        ownerId: new mongoose.Types.ObjectId(), // updated below
        settings: { themeColor: '#3b82f6' }
      });
      agencyId = newAgency._id as mongoose.Types.ObjectId;
    }

    const newUser = await User.create({
      name,
      email,
      passwordHash,
      role,
      agencyId,
      status: 'Active'
    });

    if (role === 'Agency Owner' && agencyId) {
      await Agency.findByIdAndUpdate(agencyId, { ownerId: newUser._id });
    }

    await logActivity(newUser.id, 'User Registered', `Registered as role: ${role}`);

    const token = jwt.sign({ id: newUser.id, email: newUser.email, role: newUser.role, agencyId: newUser.agencyId }, JWT_SECRET, { expiresIn: '24h' });

    return res.status(201).json({
      token,
      user: { id: newUser.id, name: newUser.name, email: newUser.email, role: newUser.role, agencyId: newUser.agencyId }
    });
  } catch (error: any) {
    return res.status(500).json({ error: error.message });
  }
};

export const loginUser = async (req: AuthenticatedRequest, res: Response) => {
  try {
    const { email, password } = req.body;

    const user = await User.findOne({ email, isDeleted: false });
    if (!user) {
      return res.status(401).json({ error: 'Invalid email or password' });
    }

    if (user.status !== 'Active') {
      return res.status(403).json({ error: 'Your account is suspended or pending approval' });
    }

    const isMatch = await bcrypt.compare(password, user.passwordHash);
    if (!isMatch) {
      return res.status(401).json({ error: 'Invalid email or password' });
    }

    const token = jwt.sign({ id: user.id, email: user.email, role: user.role, agencyId: user.agencyId }, JWT_SECRET, { expiresIn: '24h' });

    await logActivity(user.id, 'User Logged In', `Logged in from IP: ${req.ip}`);

    return res.status(200).json({
      token,
      user: { id: user.id, name: user.name, email: user.email, role: user.role, agencyId: user.agencyId }
    });
  } catch (error: any) {
    return res.status(500).json({ error: error.message });
  }
};

export const googleLogin = async (req: AuthenticatedRequest, res: Response) => {
  try {
    const { idToken } = req.body;
    if (!idToken) {
      return res.status(400).json({ error: 'idToken is required' });
    }

    // Verify token with Google API
    const googleResponse = await fetch(`https://oauth2.googleapis.com/tokeninfo?id_token=${idToken}`);
    if (!googleResponse.ok) {
      return res.status(400).json({ error: 'Invalid Google token' });
    }

    const payload: any = await googleResponse.json();
    
    // Check client ID matching
    const GOOGLE_CLIENT_ID = process.env.GOOGLE_CLIENT_ID;
    if (GOOGLE_CLIENT_ID && payload.aud !== GOOGLE_CLIENT_ID) {
      return res.status(400).json({ error: 'Token audience mismatch' });
    }

    const email = payload.email;
    const name = payload.name || `${payload.given_name || ''} ${payload.family_name || ''}`.trim();

    // Look for user in database
    const user = await User.findOne({ email, isDeleted: false });

    if (user) {
      if (user.status !== 'Active') {
        return res.status(403).json({ error: 'Your account is suspended or pending approval' });
      }

      // Generate session token
      const token = jwt.sign(
        { id: user.id, email: user.email, role: user.role, agencyId: user.agencyId },
        JWT_SECRET,
        { expiresIn: '24h' }
      );

      await logActivity(user.id, 'User Logged In via Google');

      return res.status(200).json({
        exists: true,
        token,
        user: { id: user.id, name: user.name, email: user.email, role: user.role, agencyId: user.agencyId }
      });
    } else {
      // User doesn't exist - return information to let them register
      return res.status(200).json({
        exists: false,
        email,
        name
      });
    }
  } catch (error: any) {
    return res.status(500).json({ error: error.message });
  }
};

// ==========================================
// DASHBOARD & BUSINESS CONTROLLER
// ==========================================
export const getDashboardMetrics = async (req: AuthenticatedRequest, res: Response) => {
  try {
    const { businessId } = req.query;

    if (!businessId) {
      return res.status(400).json({ error: 'businessId is required' });
    }

    const business = await Business.findById(businessId);
    if (!business || business.isDeleted) {
      return res.status(404).json({ error: 'Business not found' });
    }

    // Google Profile sync stats
    const gProfile = await GoogleProfile.findOne({ businessId, isDeleted: false });

    // Review counts and averages
    const reviews = await Review.find({ googleProfileId: gProfile?._id, isDeleted: false });
    const totalReviews = reviews.length;
    const avgRating = totalReviews > 0 ? Number((reviews.reduce((acc, curr) => acc + curr.rating, 0) / totalReviews).toFixed(1)) : 0;

    // Competitor count
    const competitorCount = await Competitor.countDocuments({ businessId, isDeleted: false });

    // Pending tasks
    const pendingTasks = await Task.countDocuments({ businessId, status: { $ne: 'Completed' }, isDeleted: false });

    // Keywords ranking improvements (gains/losses)
    // For demonstration, let's fetch keyword count
    const keywordCount = await Keyword.countDocuments({ businessId, isDeleted: false });

    // Activity Logs
    const recentActivities = await ActivityLog.find({ userId: req.user?.id, isDeleted: false })
      .sort({ createdAt: -1 })
      .limit(5);

    return res.status(200).json({
      seoScore: business.seoScore || 75,
      totalBusinesses: await Business.countDocuments({ ownerId: req.user?.id, isDeleted: false }),
      totalReviews,
      averageRating: avgRating || gProfile?.averageRating || 4.2,
      rankingImprovements: keywordCount > 0 ? '+12%' : '0%',
      competitorCount,
      pendingTasks,
      recentActivities
    });
  } catch (error: any) {
    return res.status(500).json({ error: error.message });
  }
};

export const createBusiness = async (req: AuthenticatedRequest, res: Response) => {
  try {
    const { name, websiteUrl, phone, address } = req.body;
    const ownerId = req.user?.id;

    const newBusiness = await Business.create({
      name,
      websiteUrl,
      phone,
      address,
      ownerId,
      agencyId: req.user?.agencyId,
      seoScore: 68 // initial base score before audit
    });

    await logActivity(ownerId!, 'Create Business', `Created business: ${name}`);

    // Auto-generate some initial SEO tasks
    const initialTasks = [
      { businessId: newBusiness._id, title: 'Verify Google Business Profile connection', category: 'GBP Optimization', priority: 'High', status: 'Pending' },
      { businessId: newBusiness._id, title: 'Set up 5 primary tracking keywords', category: 'Technical SEO', priority: 'High', status: 'Pending' },
      { businessId: newBusiness._id, title: 'Generate LocalBusiness Schema JSON-LD', category: 'Technical SEO', priority: 'Medium', status: 'Pending' },
      { businessId: newBusiness._id, title: 'Perform initial Website Speed and SEO Audit', category: 'Technical SEO', priority: 'Medium', status: 'Pending' }
    ];
    await Task.insertMany(initialTasks);

    // Set up default citations
    const defaultCitations = [
      { businessId: newBusiness._id, directoryName: 'Google', status: 'Not Submitted' },
      { businessId: newBusiness._id, directoryName: 'Bing Places', status: 'Not Submitted' },
      { businessId: newBusiness._id, directoryName: 'Yelp', status: 'Not Submitted' }
    ];
    await Citation.insertMany(defaultCitations);

    return res.status(201).json(newBusiness);
  } catch (error: any) {
    return res.status(500).json({ error: error.message });
  }
};

export const getBusinesses = async (req: AuthenticatedRequest, res: Response) => {
  try {
    const filter: any = { isDeleted: false };
    if (req.user?.role !== 'Super Admin') {
      filter.ownerId = req.user?.id;
    }
    const list = await Business.find(filter);
    return res.status(200).json(list);
  } catch (error: any) {
    return res.status(500).json({ error: error.message });
  }
};

// ==========================================
// GBP PROFILE CONTROLLER
// ==========================================
export const connectGoogleAccount = async (req: AuthenticatedRequest, res: Response) => {
  try {
    const { authCode, businessId } = req.body;
    
    // In a real application, authCode is exchanged with Google OAuth servers.
    // We mock the successful Google account connection and GBP import.
    let gProfile = await GoogleProfile.findOne({ businessId, isDeleted: false });
    if (!gProfile) {
      const business = await Business.findById(businessId);
      const businessName = business?.name || 'Local Business';
      const category = businessName.toLowerCase().includes('marketing') || businessName.toLowerCase().includes('seo')
        ? 'SEO Agency'
        : 'Local Service Business';

      gProfile = await GoogleProfile.create({
        businessId,
        accountId: 'acc_' + Math.random().toString(36).substr(2, 9),
        locationId: 'loc_' + Math.random().toString(36).substr(2, 9),
        placeId: 'ChIJP3Sa12K2uS4R182a51a_',
        businessName,
        primaryCategory: category,
        secondaryCategories: ['Marketing Consultant', 'Professional Services'],
        description: `Official Google Business Profile for ${businessName}, serving local customers with high-quality services.`,
        services: ['Customer Support', 'General Services', 'Consultation'],
        products: [
          { name: 'Standard Plan', price: '$99/month', description: 'Standard service tier' },
          { name: 'Premium Audit', price: '$299', description: 'Advanced consultation' }
        ],
        photosCount: 8,
        reviewsCount: 3,
        averageRating: 4.7,
        openingHours: {
          monday: '9am - 6pm',
          tuesday: '9am - 6pm',
          wednesday: '9am - 6pm',
          thursday: '9am - 6pm',
          friday: '9am - 6pm'
        },
        syncLogs: [{ status: 'Success', error: '' }]
      });

      await Business.findByIdAndUpdate(businessId, { googleProfileId: gProfile._id });

      // Import initial mock reviews for this profile
      await Review.create([
        {
          googleProfileId: gProfile._id,
          reviewId: 'rev_1',
          reviewerName: 'John Doe',
          rating: 5,
          comment: `Outstanding service from ${businessName}! They exceeded our expectations. Highly recommended!`,
          sentiment: 'Positive',
          isReplied: true,
          publishDate: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000)
        },
        {
          googleProfileId: gProfile._id,
          reviewId: 'rev_2',
          reviewerName: 'Sarah Smith',
          rating: 4,
          comment: `Great experience working with ${businessName}. Professional team and solid results.`,
          sentiment: 'Positive',
          isReplied: false,
          publishDate: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000)
        },
        {
          googleProfileId: gProfile._id,
          reviewId: 'rev_3',
          reviewerName: 'Mike Jones',
          rating: 3,
          comment: `Good overall, but communication could be slightly faster. Hopefully it improves.`,
          sentiment: 'Neutral',
          isReplied: false,
          publishDate: new Date(Date.now() - 10 * 24 * 60 * 60 * 1000)
        }
      ]);
    }

    return res.status(200).json({ success: true, profile: gProfile });
  } catch (error: any) {
    return res.status(500).json({ error: error.message });
  }
};

export const getGoogleProfile = async (req: AuthenticatedRequest, res: Response) => {
  try {
    const { businessId } = req.query;
    const profile = await GoogleProfile.findOne({ businessId, isDeleted: false });
    if (!profile) return res.status(404).json({ error: 'GBP Profile not connected' });
    return res.status(200).json(profile);
  } catch (error: any) {
    return res.status(500).json({ error: error.message });
  }
};

// ==========================================
// KEYWORD RANK TRACKER CONTROLLER
// ==========================================
export const addKeyword = async (req: AuthenticatedRequest, res: Response) => {
  try {
    const { businessId, keyword, location, trackingFrequency } = req.body;
    const newKeyword = await Keyword.create({
      businessId,
      keyword,
      location,
      trackingFrequency
    });

    // Populate initial rank
    const initialRank = Math.floor(Math.random() * 25) + 1;
    await KeywordRanking.create({
      keywordId: newKeyword._id as mongoose.Types.ObjectId,
      rank: initialRank,
      rankDate: new Date(),
      searchEngine: 'Google Local'
    });

    // Historical values for trend charts
    for (let i = 1; i <= 6; i++) {
      await KeywordRanking.create({
        keywordId: newKeyword._id as mongoose.Types.ObjectId,
        rank: Math.max(1, initialRank + (i - 3) * (Math.random() > 0.5 ? 1 : -1)),
        rankDate: new Date(Date.now() - i * 7 * 24 * 60 * 60 * 1000),
        searchEngine: 'Google Local'
      });
    }

    return res.status(201).json(newKeyword);
  } catch (error: any) {
    return res.status(500).json({ error: error.message });
  }
};

export const getKeywords = async (req: AuthenticatedRequest, res: Response) => {
  try {
    const { businessId } = req.query;
    const keywords = await Keyword.find({ businessId, isDeleted: false });

    const keywordsWithRank = await Promise.all(keywords.map(async (k) => {
      const rankings = await KeywordRanking.find({ keywordId: k._id, isDeleted: false })
        .sort({ rankDate: -1 });
      
      const currentRank = rankings[0]?.rank || 0;
      const previousRank = rankings[1]?.rank || 0;
      const change = previousRank > 0 ? previousRank - currentRank : 0;

      return {
        _id: k._id,
        keyword: k.keyword,
        location: k.location,
        trackingFrequency: k.trackingFrequency,
        status: k.status,
        currentRank,
        change,
        rankings: rankings.slice(0, 10).reverse()
      };
    }));

    return res.status(200).json(keywordsWithRank);
  } catch (error: any) {
    return res.status(500).json({ error: error.message });
  }
};

export const getGridRankings = async (req: AuthenticatedRequest, res: Response) => {
  try {
    const { keywordId } = req.query;
    if (!keywordId) return res.status(400).json({ error: 'keywordId is required' });

    // Generate local grid rankings (e.g. 3x3 grid around location coordinates)
    const coordinatesGrid = [];
    const baseRank = Math.floor(Math.random() * 10) + 1;

    for (let x = -1; x <= 1; x++) {
      for (let y = -1; y <= 1; y++) {
        // Vary rank based on distance from center (0,0)
        const distance = Math.sqrt(x*x + y*y);
        const rank = Math.max(1, Math.min(25, Math.round(baseRank + distance * (Math.random() * 5 + 1))));
        coordinatesGrid.push({
          latOffset: x * 0.005,
          lngOffset: y * 0.005,
          rank
        });
      }
    }

    return res.status(200).json({
      keywordId,
      gridSize: '3x3',
      coordinatesGrid
    });
  } catch (error: any) {
    return res.status(500).json({ error: error.message });
  }
};

// ==========================================
// REVIEW MANAGEMENT CONTROLLER
// ==========================================
export const getReviews = async (req: AuthenticatedRequest, res: Response) => {
  try {
    const { businessId } = req.query;
    const gProfile = await GoogleProfile.findOne({ businessId, isDeleted: false });
    if (!gProfile) {
      return res.status(200).json([]);
    }
    const reviews = await Review.find({ googleProfileId: gProfile._id, isDeleted: false })
      .sort({ publishDate: -1 });
    return res.status(200).json(reviews);
  } catch (error: any) {
    return res.status(500).json({ error: error.message });
  }
};

export const replyToReview = async (req: AuthenticatedRequest, res: Response) => {
  try {
    const { reviewId, replyText, replyType } = req.body;

    const review = await Review.findById(reviewId);
    if (!review) return res.status(404).json({ error: 'Review not found' });

    const reply = await ReviewReply.create({
      reviewId,
      replyText,
      replyType,
      status: 'Posted',
      postedAt: new Date()
    });

    review.isReplied = true;
    await review.save();

    await logActivity(req.user!.id, 'Reply Review', `Replied to review by ${review.reviewerName}`);

    return res.status(200).json(reply);
  } catch (error: any) {
    return res.status(500).json({ error: error.message });
  }
};

export const generateAiReviewResponse = async (req: AuthenticatedRequest, res: Response) => {
  try {
    const { comment, rating } = req.body;
    
    // Simulate AI model response generation
    let reply = '';
    if (rating >= 4) {
      reply = `Thank you so much for the positive rating! We are thrilled that you enjoyed our services. We look forward to helping you again in the future!`;
    } else if (rating === 3) {
      reply = `Thank you for your feedback. We aim to deliver 5-star services and would love to know what we could have done to make your experience better. Please contact our support team.`;
    } else {
      reply = `We are very sorry to hear about your experience. Customer satisfaction is our top priority. We would appreciate the opportunity to discuss this further to make things right. Please reach out to us directly.`;
    }

    return res.status(200).json({ responseText: reply });
  } catch (error: any) {
    return res.status(500).json({ error: error.message });
  }
};

// ==========================================
// COMPETITOR ANALYSIS CONTROLLER
// ==========================================
export const addCompetitor = async (req: AuthenticatedRequest, res: Response) => {
  try {
    const { businessId, name, websiteUrl, primaryCategory } = req.body;
    const competitor = await Competitor.create({
      businessId,
      name,
      websiteUrl,
      primaryCategory,
      reviewsCount: Math.floor(Math.random() * 50) + 5,
      averageRating: Number((Math.random() * 1.5 + 3.5).toFixed(1)),
      photosCount: Math.floor(Math.random() * 20) + 1,
      trackedKeywords: ['seo services', 'seo consultant']
    });

    return res.status(201).json(competitor);
  } catch (error: any) {
    return res.status(500).json({ error: error.message });
  }
};

export const getCompetitors = async (req: AuthenticatedRequest, res: Response) => {
  try {
    const { businessId } = req.query;
    const competitors = await Competitor.find({ businessId, isDeleted: false });
    return res.status(200).json(competitors);
  } catch (error: any) {
    return res.status(500).json({ error: error.message });
  }
};

// ==========================================
// CITATION TRACKER CONTROLLER
// ==========================================
export const getCitations = async (req: AuthenticatedRequest, res: Response) => {
  try {
    const { businessId } = req.query;
    const citations = await Citation.find({ businessId, isDeleted: false });
    return res.status(200).json(citations);
  } catch (error: any) {
    return res.status(500).json({ error: error.message });
  }
};

export const updateCitationStatus = async (req: AuthenticatedRequest, res: Response) => {
  try {
    const { citationId, status, listingUrl } = req.body;
    const citation = await Citation.findByIdAndUpdate(citationId, { status, listingUrl }, { new: true });
    return res.status(200).json(citation);
  } catch (error: any) {
    return res.status(500).json({ error: error.message });
  }
};

// ==========================================
// SEO AUDIT & WEBSITE AUDIT CONTROLLER
// ==========================================
export const runSeoAudit = async (req: AuthenticatedRequest, res: Response) => {
  try {
    const { businessId } = req.body;

    const passedChecks = [
      { checkName: 'Primary Category Set', category: 'GBP profile', description: 'Your business has a primary category configured.' },
      { checkName: 'Phone Number Present', category: 'GBP profile', description: 'Active phone number is linked to the profile.' },
      { checkName: 'Opening Hours Configured', category: 'GBP profile', description: 'Business hours are detailed for searchers.' }
    ];

    const warnings = [
      { checkName: 'Service Descriptions Missing', category: 'Services', description: '3 of your custom services lack descriptions.' },
      { checkName: 'Low Photo Activity', category: 'Photos', description: 'You haven\'t uploaded any photos in the last 30 days.' }
    ];

    const criticalIssues = [
      { checkName: 'Unanswered Reviews', category: 'Reviews', description: 'You have 3 reviews with 1 or 2 stars that have no replies.' },
      { checkName: 'Missing Website Schema', category: 'Website Link', description: 'Your website is not utilizing local business schema JSON-LD.' }
    ];

    const score = 82;

    const audit = await SeoAudit.create({
      businessId,
      score,
      passedChecks,
      warnings,
      criticalIssues,
      recommendations: [
        'Add schemas markup on your homepage website.',
        'Upload 10 new high-quality geotagged images.',
        'Reply to all negative reviews within 24 hours.'
      ]
    });

    await Business.findByIdAndUpdate(businessId, { seoScore: score });

    return res.status(201).json(audit);
  } catch (error: any) {
    return res.status(500).json({ error: error.message });
  }
};

export const runWebsiteAudit = async (req: AuthenticatedRequest, res: Response) => {
  try {
    const { businessId, websiteUrl } = req.body;

    const business = await Business.findById(businessId);
    const businessName = business?.name || 'Local Business';
    let domain = 'business.com';
    try {
      if (websiteUrl) {
        domain = new URL(websiteUrl).hostname;
      }
    } catch (e) {
      domain = websiteUrl || 'business.com';
    }

    const audit = await WebsiteAudit.create({
      businessId,
      websiteUrl,
      score: 74,
      metrics: {
        titleTag: `${businessName} | ${domain}`,
        metaDescription: `Discover professional services from ${businessName}. Learn more about our offerings and contact details online at ${domain}.`,
        h1Count: 1,
        headings: ['Home', 'Our Services', 'About Us', 'Contact Us'],
        imagesCount: 22,
        imagesMissingAltCount: 8,
        schemaTypesFound: ['Organization'],
        isCanonicalSet: true,
        brokenLinksCount: 1,
        brokenLinks: [`${websiteUrl}/broken-link-sample`],
        loadTimeMs: 1250
      },
      recommendations: [
        'Add Alt descriptions to all 8 images missing them.',
        `Fix the broken link on ${domain}/broken-link-sample.`,
        'Add LocalBusiness schema alongside the existing Organization schema.'
      ]
    });

    return res.status(201).json(audit);
  } catch (error: any) {
    return res.status(500).json({ error: error.message });
  }
};

// ==========================================
// TASK GENERATOR CONTROLLER
// ==========================================
export const getTasks = async (req: AuthenticatedRequest, res: Response) => {
  try {
    const { businessId } = req.query;
    const tasks = await Task.find({ businessId, isDeleted: false });
    return res.status(200).json(tasks);
  } catch (error: any) {
    return res.status(500).json({ error: error.message });
  }
};

export const createTask = async (req: AuthenticatedRequest, res: Response) => {
  try {
    const { businessId, title, description, category, priority } = req.body;
    const task = await Task.create({ businessId, title, description, category, priority });
    return res.status(201).json(task);
  } catch (error: any) {
    return res.status(500).json({ error: error.message });
  }
};

export const updateTaskStatus = async (req: AuthenticatedRequest, res: Response) => {
  try {
    const { taskId, status } = req.body;
    const task = await Task.findByIdAndUpdate(taskId, { status }, { new: true });
    return res.status(200).json(task);
  } catch (error: any) {
    return res.status(500).json({ error: error.message });
  }
};

// ==========================================
// AI CONTENT GENERATOR CONTROLLER
// ==========================================
export const generateAiContent = async (req: AuthenticatedRequest, res: Response) => {
  try {
    const { businessId, prompt, templateType } = req.body;
    
    // Simulate AI generation content based on templates
    let content = '';
    if (templateType === 'Google Post') {
      content = `🎉 Exciting news! We are happy to launch our new premium local SEO consultation program. Whether you want to rank higher on Google Maps or generate more organic leads, our certified experts have you covered! 📈\n\n👉 Learn more at our website or call us today to secure a slot! #SEO #GoogleMyBusiness #Marketing`;
    } else if (templateType === 'Business Description') {
      content = `At our agency, we believe that local visibility drives foot traffic. We help small to medium enterprises reach customers directly in their zip codes by setting up highly optimized Google Business Profiles, citations, and fast web designs.`;
    } else if (templateType === 'Service Description') {
      content = `Our Local Rank Grid Tracker allows you to monitor how your business ranks in a 5-mile radius around your physical address. See exactly where your competitors outrank you and improve with geotargeted local signals.`;
    } else {
      content = `FAQ Content Answer: We recommend posting on your Google Business Profile at least once a week to show Google that your profile is active, which aids search visibility.`;
    }

    const aiGen = await AiGeneration.create({
      userId: req.user!.id,
      businessId,
      prompt,
      templateType,
      generatedContent: content
    });

    return res.status(201).json(aiGen);
  } catch (error: any) {
    return res.status(500).json({ error: error.message });
  }
};

// ==========================================
// SCHEMA GENERATOR CONTROLLER
// ==========================================
export const createSchema = async (req: AuthenticatedRequest, res: Response) => {
  try {
    const { businessId, schemaType, schemaData } = req.body;
    const schema = await SchemaGenerator.create({ businessId, schemaType, schemaData });
    return res.status(201).json(schema);
  } catch (error: any) {
    return res.status(500).json({ error: error.message });
  }
};

export const getSchemas = async (req: AuthenticatedRequest, res: Response) => {
  try {
    const { businessId } = req.query;
    const list = await SchemaGenerator.find({ businessId, isDeleted: false });
    return res.status(200).json(list);
  } catch (error: any) {
    return res.status(500).json({ error: error.message });
  }
};

// ==========================================
// REPORT GENERATOR CONTROLLER
// ==========================================
export const generateReport = async (req: AuthenticatedRequest, res: Response) => {
  try {
    const { businessId, reportName, sections } = req.body;

    const report = await Report.create({
      businessId,
      reportName,
      sections,
      status: 'Ready',
      pdfUrl: `/reports/pdf_${businessId}_${Date.now()}.pdf`
    });

    return res.status(201).json(report);
  } catch (error: any) {
    return res.status(500).json({ error: error.message });
  }
};

export const getReports = async (req: AuthenticatedRequest, res: Response) => {
  try {
    const { businessId } = req.query;
    const list = await Report.find({ businessId, isDeleted: false });
    return res.status(200).json(list);
  } catch (error: any) {
    return res.status(500).json({ error: error.message });
  }
};

// ==========================================
// BILLING / SUBSCRIPTION CONTROLLER
// ==========================================
export const getSubscription = async (req: AuthenticatedRequest, res: Response) => {
  try {
    const sub = await Subscription.findOne({ agencyId: req.user?.agencyId, isDeleted: false });
    if (!sub) {
      // Create a trial subscription
      const defaultSub = await Subscription.create({
        agencyId: req.user?.agencyId || new mongoose.Types.ObjectId(),
        plan: 'Starter',
        status: 'Active',
        billingCycle: 'Monthly',
        price: 29.00,
        currentPeriodStart: new Date(),
        currentPeriodEnd: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000)
      });
      return res.status(200).json(defaultSub);
    }
    return res.status(200).json(sub);
  } catch (error: any) {
    return res.status(500).json({ error: error.message });
  }
};

// ==========================================
// ADMIN PANEL CONTROLLER
// ==========================================
export const getAdminMetrics = async (req: AuthenticatedRequest, res: Response) => {
  try {
    const totalUsers = await User.countDocuments({ isDeleted: false });
    const totalAgencies = await Agency.countDocuments({ isDeleted: false });
    const totalPayments = await Payment.find({ isDeleted: false });
    const totalRevSum = totalPayments.reduce((acc, curr) => acc + curr.amount, 0);

    const activeSubscriptions = await Subscription.find({ status: 'Active', isDeleted: false });

    return res.status(200).json({
      totalUsers,
      totalAgencies,
      totalRevenue: totalRevSum,
      activeSubscriptionsCount: activeSubscriptions.length
    });
  } catch (error: any) {
    return res.status(500).json({ error: error.message });
  }
};
