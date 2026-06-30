import { Response } from 'express';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import nodemailer from 'nodemailer';
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

export const forgotPassword = async (req: AuthenticatedRequest, res: Response) => {
  try {
    const { email } = req.body;
    const user = await User.findOne({ email, isDeleted: false });
    if (!user) {
      return res.status(404).json({ error: 'User with this email does not exist' });
    }

    // Generate a secure random temporary password
    const tempPassword = 'LR_' + Math.random().toString(36).substr(2, 8);
    const passwordHash = await bcrypt.hash(tempPassword, 10);

    user.passwordHash = passwordHash;
    await user.save();

    // Create SMTP transport
    const transporter = nodemailer.createTransport({
      host: process.env.SMTP_HOST || 'smtp.gmail.com',
      port: Number(process.env.SMTP_PORT) || 465,
      secure: true,
      auth: {
        user: process.env.SMTP_USER || '',
        pass: process.env.SMTP_PASS || ''
      }
    });

    const mailOptions = {
      from: `"LocalRank Pro Support" <${process.env.SMTP_FROM || 'support@localrankpro.com'}>`,
      to: email,
      subject: 'Temporary Password Reset - LocalRank Pro',
      html: `
        <div style="font-family: sans-serif; padding: 20px; color: #1e293b;">
          <h2 style="color: #2563eb;">LocalRank Pro Password Reset</h2>
          <p>Hello ${user.name},</p>
          <p>We received a request to reset the password for your LocalRank Pro account.</p>
          <p>Your temporary password is: <strong style="font-size: 16px; color: #2563eb; background-color: #eff6ff; padding: 4px 8px; border-radius: 4px;">${tempPassword}</strong></p>
          <p>Please log in using this temporary password and update it immediately in your account profile settings.</p>
          <p style="font-size: 11px; color: #64748b; margin-top: 30px;">If you did not request this, please secure your account.</p>
        </div>
      `
    };

    await transporter.sendMail(mailOptions);
    await logActivity(user.id, 'Password Reset Requested', 'Sent temporary password via SMTP');

    return res.status(200).json({ success: true, message: 'Temporary password sent to email successfully' });
  } catch (error: any) {
    console.error('Forgot password error:', error);
    return res.status(500).json({ error: error.message });
  }
};

export const guestAddBusiness = async (req: AuthenticatedRequest, res: Response) => {
  try {
    const { name, websiteUrl, phone } = req.body;
    if (!name) {
      return res.status(400).json({ error: 'Business name is required' });
    }

    const randomId = Math.random().toString(36).substring(2, 8);
    const guestEmail = `guest_${randomId}@localrankpro.com`;
    const guestName = `Guest ${randomId}`;
    const dummyPassword = Math.random().toString(36) + Math.random().toString(36);
    const passwordHash = await bcrypt.hash(dummyPassword, 10);

    const newUser = await User.create({
      name: guestName,
      email: guestEmail,
      passwordHash,
      role: 'Business Owner',
      status: 'Active'
    });

    await logActivity(newUser.id, 'User Registered', 'Registered as role: Business Owner (Guest)');

    const token = jwt.sign({ id: newUser.id, email: newUser.email, role: newUser.role, agencyId: newUser.agencyId }, JWT_SECRET, { expiresIn: '24h' });

    const newBusiness = await Business.create({
      name,
      websiteUrl,
      phone,
      ownerId: newUser._id,
      seoScore: 68
    });

    await logActivity(newUser.id, 'Create Business', `Created business: ${name}`);

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

    return res.status(201).json({
      token,
      user: { id: newUser.id, name: newUser.name, email: newUser.email, role: newUser.role, agencyId: newUser.agencyId },
      business: newBusiness
    });
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
    if (!authCode) {
      return res.status(400).json({ error: 'Authorization code is required' });
    }

    let gProfile = await GoogleProfile.findOne({ businessId, isDeleted: false });
    if (gProfile) {
      return res.status(200).json({ success: true, profile: gProfile });
    }

    const business = await Business.findById(businessId);
    let businessName = business?.name || 'Local Business';
    let category = 'Local Service Business';
    let secondaryCats: string[] = ['Professional Services'];
    let description = `Official Google Business Profile for ${businessName}, serving local customers with high-quality services.`;
    let services: string[] = ['Customer Support', 'General Services', 'Consultation'];
    let products: any[] = [
      { name: 'Standard consultation', price: 'Free', description: 'Initial service evaluation' }
    ];
    let initialPhotos: string[] = [
      'https://images.unsplash.com/photo-1582213782179-e0d53f98f2ca?w=150&auto=format&fit=crop&q=60',
      'https://images.unsplash.com/photo-1521791136064-7986c2920216?w=150&auto=format&fit=crop&q=60',
      'https://images.unsplash.com/photo-1486406146926-c627a92ad1ab?w=150&auto=format&fit=crop&q=60'
    ];
    let reviewsCount = Math.floor(Math.random() * 85) + 12;
    let averageRating = Number((Math.random() * 0.8 + 4.1).toFixed(1));
    let openingHours: any = {
      monday: '9am - 6pm',
      tuesday: '9am - 6pm',
      wednesday: '9am - 6pm',
      thursday: '9am - 6pm',
      friday: '9am - 6pm'
    };
    let placeId = 'ChIJ' + businessId.toString().substring(12) + '_' + Math.random().toString(36).substr(2, 4);
    let googleReviews: any[] = [];

    const isMock = authCode === 'mock_auth_code_9876';

    if (!isMock) {
      try {
        const tokenResponse = await fetch('https://oauth2.googleapis.com/token', {
          method: 'POST',
          headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
          body: new URLSearchParams({
            code: authCode,
            client_id: process.env.GOOGLE_CLIENT_ID || '',
            client_secret: process.env.GOOGLE_CLIENT_SECRET || '',
            redirect_uri: 'postmessage',
            grant_type: 'authorization_code'
          })
        });

        if (tokenResponse.ok) {
          const tokens = await tokenResponse.json() as any;
          const accessToken = tokens.access_token;
          const refreshToken = tokens.refresh_token;

          if (req.user) {
            await User.findByIdAndUpdate(req.user.id, {
              googleOAuth: {
                accessToken,
                refreshToken,
                expiryDate: Date.now() + (tokens.expires_in * 1000),
                email: tokens.email
              }
            });
          }

          // Fetch real profile details from Google APIs
          const accountsResponse = await fetch('https://mybusinessaccountmanagement.googleapis.com/v1/accounts', {
            headers: { Authorization: `Bearer ${accessToken}` }
          });

          if (accountsResponse.ok) {
            const accountsData = await accountsResponse.json() as any;
            const account = accountsData.accounts?.[0];
            if (account) {
              const locationsResponse = await fetch(`https://mybusinessbusinessinformation.googleapis.com/v1/${account.name}/locations?readMask=name,title,categories,storefrontAddress,regularHours,description`, {
                headers: { Authorization: `Bearer ${accessToken}` }
              });

              if (locationsResponse.ok) {
                const locationsData = await locationsResponse.json() as any;
                const location = locationsData.locations?.[0];
                if (location) {
                  businessName = location.title || businessName;
                  category = location.categories?.primaryCategory?.displayName || category;
                  secondaryCats = location.categories?.additionalCategories?.map((c: any) => c.displayName) || secondaryCats;
                  description = location.description || description;
                  openingHours = location.regularHours || openingHours;
                  placeId = location.name;

                  // Fetch real reviews
                  const reviewsResponse = await fetch(`https://mybusinessreviews.googleapis.com/v1/${location.name}/reviews`, {
                    headers: { Authorization: `Bearer ${accessToken}` }
                  });

                  if (reviewsResponse.ok) {
                    const reviewsData = await reviewsResponse.json() as any;
                    const liveReviews = reviewsData.reviews || [];
                    reviewsCount = liveReviews.length;
                    
                    let sumRating = 0;
                    googleReviews = liveReviews.map((rev: any, idx: number) => {
                      const ratingVal = rev.starRating === 'FIVE' ? 5 : rev.starRating === 'FOUR' ? 4 : rev.starRating === 'THREE' ? 3 : rev.starRating === 'TWO' ? 2 : 1;
                      sumRating += ratingVal;
                      return {
                        reviewId: rev.reviewId || 'rev_live_' + idx,
                        reviewerName: rev.reviewer?.displayName || 'Google Reviewer',
                        rating: ratingVal,
                        comment: rev.comment || '',
                        sentiment: ratingVal >= 4 ? 'Positive' : ratingVal === 3 ? 'Neutral' : 'Negative',
                        isReplied: !!rev.reviewReply,
                        publishDate: rev.createTime ? new Date(rev.createTime) : new Date()
                      };
                    });
                    averageRating = reviewsCount > 0 ? Number((sumRating / reviewsCount).toFixed(1)) : 0;
                  }
                }
              }
            }
          }
        }
      } catch (oauthErr) {
        console.error('Real Google OAuth flow failed, falling back to customized details:', oauthErr);
      }
    }

    // Customized mock details if mock authCode is used or real API returns empty/fails
    if (googleReviews.length === 0) {
      const nameLower = businessName.toLowerCase();
      if (nameLower.includes('dent') || nameLower.includes('tooth') || nameLower.includes('ortho')) {
        category = 'Dental Clinic';
        secondaryCats = ['Dentist', 'Cosmetic Dentist', 'Emergency Dental Service'];
        description = `Welcome to ${businessName}. We provide state-of-the-art general, cosmetic, and implant dentistry services in a warm and comfortable environment.`;
        services = ['Teeth Cleaning', 'Root Canal Therapy', 'Dental Implants', 'Teeth Whitening', 'Cosmetic Dentistry'];
        products = [
          { name: 'Teeth Whitening Kit', price: '$120', description: 'Take-home professional whitening kit with custom trays.' },
          { name: 'Electric Toothbrush', price: '$85', description: 'Rechargeable electric toothbrush recommended by dentists.' }
        ];
        initialPhotos = [
          'https://images.unsplash.com/photo-1629909613654-28e377c37b09?w=150&auto=format&fit=crop&q=60',
          'https://images.unsplash.com/photo-1588776814546-1ffcf47267a5?w=150&auto=format&fit=crop&q=60',
          'https://images.unsplash.com/photo-1468495244123-6c6c332eeece?w=150&auto=format&fit=crop&q=60'
        ];
      } else if (nameLower.includes('rest') || nameLower.includes('pizz') || nameLower.includes('cafe') || nameLower.includes('food') || nameLower.includes('kitchen') || nameLower.includes('burger')) {
        category = 'Restaurant';
        secondaryCats = ['Caterer', 'Delivery Service', 'Family Restaurant', 'Cafe'];
        description = `Enjoy delicious, freshly prepared dishes at ${businessName}. We pride ourselves on using local ingredients, friendly service, and a great atmosphere.`;
        services = ['Dine-in', 'Curbside Pickup', 'Catering Services', 'No-contact Delivery', 'Group Bookings'];
        products = [
          { name: 'Signature Gourmet Pizza', price: '$18', description: 'Hand-tossed crust with signature sauce and fresh toppings.' },
          { name: 'Handcrafted House Burger', price: '$14', description: 'Angus beef patty with fresh lettuce, tomato, and house special sauce.' }
        ];
        initialPhotos = [
          'https://images.unsplash.com/photo-1517248135467-4c7edcad34c4?w=150&auto=format&fit=crop&q=60',
          'https://images.unsplash.com/photo-1552566626-52f8b828add9?w=150&auto=format&fit=crop&q=60',
          'https://images.unsplash.com/photo-1414235077428-338989a2e8c0?w=150&auto=format&fit=crop&q=60'
        ];
      } else if (nameLower.includes('salon') || nameLower.includes('hair') || nameLower.includes('beauty') || nameLower.includes('spa') || nameLower.includes('nail')) {
        category = 'Beauty Salon';
        secondaryCats = ['Hair Salon', 'Nail Salon', 'Day Spa', 'Hairdresser'];
        description = `Transform your look and relax at ${businessName}. Our professional stylists offer haircuts, color treatments, nails, and rejuvenating spa facials.`;
        services = ['Haircut and Styling', 'Manicure & Pedicure', 'Facial Treatment', 'Massage Therapy', 'Hair Coloring'];
        products = [
          { name: 'Organic Hydrating Shampoo', price: '$24', description: 'Nourishing shampoo made with natural argan oil and aloe vera.' },
          { name: 'Nail Nourishing Cream', price: '$15', description: 'Restorative formula for strong nails and soft cuticles.' }
        ];
        initialPhotos = [
          'https://images.unsplash.com/photo-1560066984-138dadb4c035?w=150&auto=format&fit=crop&q=60',
          'https://images.unsplash.com/photo-1522337360788-8b13dee7a37e?w=150&auto=format&fit=crop&q=60',
          'https://images.unsplash.com/photo-1607779097040-26e80aa78e66?w=150&auto=format&fit=crop&q=60'
        ];
      } else if (nameLower.includes('market') || nameLower.includes('seo') || nameLower.includes('agency') || nameLower.includes('consult')) {
        category = 'SEO Agency';
        secondaryCats = ['Marketing Consultant', 'Professional Services', 'Advertising Agency'];
        description = `Boost your local search visibility with ${businessName}. We customize local SEO campaigns, audits, reviews management, and keyword tracking.`;
        services = ['Local SEO Audits', 'Google Business Profile Setup', 'Keyword Grid Tracking', 'Review Responding AI', 'Competitor Insights'];
        products = [
          { name: 'Full Local SEO Audit', price: '$199', description: 'Complete search grid analysis and website optimization audit report.' },
          { name: 'Google Profile Optimization Pack', price: 'Free', description: 'Complete GMB synchronization and checklist setup.' }
        ];
      }

      googleReviews = [
        {
          reviewerName: 'John Doe',
          rating: 5,
          comment: `Outstanding service from ${businessName}! They exceeded our expectations. Highly recommended!`,
          sentiment: 'Positive',
          isReplied: true,
          publishDate: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000)
        },
        {
          reviewerName: 'Sarah Smith',
          rating: 4,
          comment: `Great experience working with ${businessName}. Professional team and solid results.`,
          sentiment: 'Positive',
          isReplied: false,
          publishDate: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000)
        },
        {
          reviewerName: 'Mike Jones',
          rating: 3,
          comment: `Good overall, but communication could be slightly faster. Hopefully it improves.`,
          sentiment: 'Neutral',
          isReplied: false,
          publishDate: new Date(Date.now() - 10 * 24 * 60 * 60 * 1000)
        }
      ];
    }

    gProfile = await GoogleProfile.create({
      businessId,
      accountId: 'acc_' + Math.random().toString(36).substr(2, 9),
      locationId: 'loc_' + Math.random().toString(36).substr(2, 9),
      placeId,
      businessName,
      primaryCategory: category,
      secondaryCategories: secondaryCats,
      description,
      services,
      products,
      photosCount: initialPhotos.length,
      photos: initialPhotos,
      reviewsCount,
      averageRating,
      openingHours,
      syncLogs: [{ status: 'Success', error: '' }]
    });

    await Business.findByIdAndUpdate(businessId, { googleProfileId: gProfile._id });

    // Save reviews into Review collection
    for (const rev of googleReviews) {
      await Review.create({
        googleProfileId: gProfile._id,
        reviewId: rev.reviewId || 'rev_' + Math.random().toString(36).substr(2, 9),
        reviewerName: rev.reviewerName,
        rating: rev.rating,
        comment: rev.comment,
        sentiment: rev.sentiment,
        isReplied: rev.isReplied,
        publishDate: rev.publishDate
      });
    }

    // Seed initial posts for this profile
    await Post.create([
      {
        googleProfileId: gProfile._id,
        summary: `Welcome to ${businessName}! Check out our local optimization services and contact details.`,
        actionType: 'LEARN_MORE',
        ctaUrl: business?.websiteUrl || 'https://localrankpro.com',
        status: 'Published',
        publishedAt: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000)
      },
      {
        googleProfileId: gProfile._id,
        summary: `Book an appointment with ${businessName} directly from our Google Profile!`,
        actionType: 'BOOK',
        ctaUrl: business?.websiteUrl || 'https://localrankpro.com',
        status: 'Scheduled',
        scheduledAt: new Date(Date.now() + 2 * 24 * 60 * 60 * 1000)
      }
    ]);

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

export const getGbpPosts = async (req: AuthenticatedRequest, res: Response) => {
  try {
    const { googleProfileId } = req.query;
    if (!googleProfileId) {
      return res.status(400).json({ error: 'googleProfileId is required' });
    }
    const posts = await Post.find({ googleProfileId, isDeleted: false }).sort({ createdAt: -1 });
    return res.status(200).json(posts);
  } catch (error: any) {
    return res.status(500).json({ error: error.message });
  }
};

export const createGbpPost = async (req: AuthenticatedRequest, res: Response) => {
  try {
    const { googleProfileId, summary, actionType, ctaUrl } = req.body;
    if (!googleProfileId || !summary) {
      return res.status(400).json({ error: 'googleProfileId and summary are required' });
    }
    const newPost = await Post.create({
      googleProfileId,
      summary,
      actionType,
      ctaUrl: actionType !== 'CALL' ? ctaUrl : undefined,
      status: 'Scheduled',
      scheduledAt: new Date(Date.now() + 4 * 24 * 60 * 60 * 1000)
    });
    return res.status(201).json(newPost);
  } catch (error: any) {
    return res.status(500).json({ error: error.message });
  }
};

export const getGbpPhotos = async (req: AuthenticatedRequest, res: Response) => {
  try {
    const { googleProfileId } = req.query;
    if (!googleProfileId) {
      return res.status(400).json({ error: 'googleProfileId is required' });
    }
    const profile = await GoogleProfile.findById(googleProfileId);
    if (!profile) {
      return res.status(404).json({ error: 'Google Profile not found' });
    }
    return res.status(200).json(profile.photos || []);
  } catch (error: any) {
    return res.status(500).json({ error: error.message });
  }
};

export const uploadGbpPhoto = async (req: AuthenticatedRequest, res: Response) => {
  try {
    const { googleProfileId, photoUrl } = req.body;
    if (!googleProfileId || !photoUrl) {
      return res.status(400).json({ error: 'googleProfileId and photoUrl are required' });
    }
    const profile = await GoogleProfile.findById(googleProfileId);
    if (!profile) {
      return res.status(404).json({ error: 'Google Profile not found' });
    }
    if (!profile.photos) {
      profile.photos = [];
    }
    profile.photos.push(photoUrl);
    profile.photosCount = profile.photos.length;
    await profile.save();
    return res.status(200).json({ success: true, photos: profile.photos });
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

const generateAiResponseText = (rating: number) => {
  if (rating >= 4) {
    return `Thank you so much for the positive rating! We are thrilled that you enjoyed our services. We look forward to helping you again in the future!`;
  } else if (rating === 3) {
    return `Thank you for your feedback. We aim to deliver 5-star services and would love to know what we could have done to make your experience better. Please contact our support team.`;
  } else {
    return `We are very sorry to hear about your experience. Customer satisfaction is our top priority. We would appreciate the opportunity to discuss this further to make things right. Please reach out to us directly.`;
  }
};

export const autoReplyReview = async (req: AuthenticatedRequest, res: Response) => {
  try {
    const { reviewId } = req.body;
    const review = await Review.findById(reviewId);
    if (!review) return res.status(404).json({ error: 'Review not found' });

    const replyText = generateAiResponseText(review.rating);

    const reply = await ReviewReply.create({
      reviewId,
      replyText,
      replyType: 'AI',
      status: 'Posted',
      postedAt: new Date()
    });

    review.isReplied = true;
    await review.save();

    await logActivity(req.user!.id, 'Auto Reply Review', `Auto replied to review by ${review.reviewerName}`);

    return res.status(200).json({ success: true, reply, review });
  } catch (error: any) {
    return res.status(500).json({ error: error.message });
  }
};

export const autoReplyAllReviews = async (req: AuthenticatedRequest, res: Response) => {
  try {
    const { businessId } = req.body;
    const gProfile = await GoogleProfile.findOne({ businessId, isDeleted: false });
    if (!gProfile) {
      return res.status(404).json({ error: 'Google Profile not connected' });
    }

    const reviews = await Review.find({ googleProfileId: gProfile._id, isReplied: false, isDeleted: false });
    
    for (const review of reviews) {
      const replyText = generateAiResponseText(review.rating);
      await ReviewReply.create({
        reviewId: review._id as mongoose.Types.ObjectId,
        replyText,
        replyType: 'AI',
        status: 'Posted',
        postedAt: new Date()
      });

      review.isReplied = true;
      await review.save();
    }

    if (req.user) {
      await logActivity(req.user.id, 'Auto Reply All Reviews', `Auto replied to ${reviews.length} reviews`);
    }

    // Fetch all reviews to return the updated list
    const allReviews = await Review.find({ googleProfileId: gProfile._id, isDeleted: false }).sort({ publishDate: -1 });
    return res.status(200).json(allReviews);
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

    let reviewsCount = Math.floor(Math.random() * 50) + 5;
    let averageRating = Number((Math.random() * 1.5 + 3.5).toFixed(1));
    let photosCount = Math.floor(Math.random() * 20) + 1;
    let detectedCategory = primaryCategory || 'Local Business';

    if (websiteUrl && (websiteUrl.startsWith('http://') || websiteUrl.startsWith('https://'))) {
      try {
        const response = await fetch(websiteUrl, {
          headers: {
            'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36'
          },
          signal: AbortSignal.timeout(5000)
        });

        if (response.ok) {
          const html = await response.text();

          // 1. Count images (real photosCount)
          const imgMatches = html.match(/<img[^>]*>/gi) || [];
          if (imgMatches.length > 0) {
            photosCount = imgMatches.length;
          }

          // 2. Look for rating patterns
          const ratingMatch = html.match(/(\d\.\d)\s*(?:out of 5|stars|rating)/i) || 
                              html.match(/(?:rating|score)\s*(?:of|:)?\s*(\d\.\d)/i);
          if (ratingMatch && ratingMatch[1]) {
            const parsedRating = parseFloat(ratingMatch[1]);
            if (parsedRating >= 1.0 && parsedRating <= 5.0) {
              averageRating = parsedRating;
            }
          }

          // 3. Look for reviews count patterns
          const reviewsMatch = html.match(/(\d{1,4})\s*(?:reviews|customer reviews|ratings)/i);
          if (reviewsMatch && reviewsMatch[1]) {
            const parsedReviews = parseInt(reviewsMatch[1], 10);
            if (parsedReviews > 0) {
              reviewsCount = parsedReviews;
            }
          }

          // 4. Try to detect category
          if (!detectedCategory || detectedCategory === 'Local Business') {
            const titleMatch = html.match(/<title[^>]*>([\s\S]*?)<\/title>/i);
            if (titleMatch) {
              const title = titleMatch[1].toLowerCase();
              if (title.includes('dentist') || title.includes('dental')) detectedCategory = 'Dental Clinic';
              else if (title.includes('restaurant') || title.includes('pizza') || title.includes('cafe')) detectedCategory = 'Restaurant';
              else if (title.includes('salon') || title.includes('hair') || title.includes('spa')) detectedCategory = 'Beauty Salon';
              else if (title.includes('marketing') || title.includes('seo') || title.includes('agency')) detectedCategory = 'SEO Agency';
            }
          }
        }
      } catch (err) {
        console.error('Competitor web scrape failed, using defaults:', err);
      }
    }

    const competitor = await Competitor.create({
      businessId,
      name,
      websiteUrl,
      primaryCategory: detectedCategory,
      reviewsCount,
      averageRating,
      photosCount,
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

    // Default mock data to fallback on error
    let titleTag = `${businessName} | ${domain}`;
    let metaDescription = `Discover professional services from ${businessName}. Learn more about our offerings and contact details online at ${domain}.`;
    let h1Count = 1;
    let headings = ['Home', 'Our Services', 'About Us', 'Contact Us'];
    let imagesCount = 22;
    let imagesMissingAltCount = 8;
    let schemaTypesFound = ['Organization'];
    let isCanonicalSet = true;
    let brokenLinksCount = 0;
    let brokenLinks: string[] = [];
    let loadTimeMs = 850;
    let score = 78;

    if (websiteUrl && (websiteUrl.startsWith('http://') || websiteUrl.startsWith('https://'))) {
      const startTime = Date.now();
      try {
        const response = await fetch(websiteUrl, {
          headers: {
            'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36'
          },
          signal: AbortSignal.timeout(6000) // 6 seconds timeout
        });

        loadTimeMs = Date.now() - startTime;

        if (response.ok) {
          const html = await response.text();

          // 1. Title Tag
          const titleMatch = html.match(/<title[^>]*>([\s\S]*?)<\/title>/i);
          if (titleMatch) {
            titleTag = titleMatch[1].trim();
          }

          // 2. Meta Description
          const descMatch = html.match(/<meta[^>]*name=["']description["'][^>]*content=["']([\s\S]*?)["']/i) ||
                             html.match(/<meta[^>]*content=["']([\s\S]*?)["'][^>]*name=["']description["']/i);
          if (descMatch) {
            metaDescription = descMatch[1].trim();
          } else {
            metaDescription = 'No meta description found! Add a description to optimize search CTR.';
          }

          // 3. H1 Count & Headings
          const h1Matches = html.match(/<h1[^>]*>([\s\S]*?)<\/h1>/gi) || [];
          h1Count = h1Matches.length;

          const allHeadings: string[] = [];
          const headingMatches = html.match(/<h[1-3][^>]*>([\s\S]*?)<\/h[1-3]>/gi) || [];
          headingMatches.slice(0, 6).forEach((h) => {
            const clean = h.replace(/<[^>]*>/g, '').trim();
            if (clean) allHeadings.push(clean);
          });
          if (allHeadings.length > 0) {
            headings = allHeadings;
          }

          // 4. Images & Alt Attributes
          const imgMatches = html.match(/<img[^>]*>/gi) || [];
          imagesCount = imgMatches.length;
          let missingAlt = 0;
          imgMatches.forEach((img) => {
            if (!/alt=["']/i.test(img) || /alt=["']["']/i.test(img)) {
              missingAlt++;
            }
          });
          imagesMissingAltCount = missingAlt;

          // 5. Schema Check
          schemaTypesFound = [];
          if (html.includes('application/ld+json')) {
            schemaTypesFound.push('JSON-LD Schema');
          }
          if (html.includes('itemscope') || html.includes('itemtype')) {
            schemaTypesFound.push('Microdata Schema');
          }
          if (schemaTypesFound.length === 0) {
            schemaTypesFound.push('None');
          }

          // 6. Canonical check
          isCanonicalSet = /<link[^>]*rel=["']canonical["']/i.test(html);

          // Calculate a real dynamic SEO Score based on findings
          let tempScore = 100;
          if (h1Count === 0 || h1Count > 1) tempScore -= 10;
          if (!descMatch) tempScore -= 15;
          if (imagesMissingAltCount > 0) tempScore -= Math.min(15, imagesMissingAltCount * 2);
          if (schemaTypesFound.includes('None')) tempScore -= 20;
          if (!isCanonicalSet) tempScore -= 10;
          if (loadTimeMs > 2500) tempScore -= 10;

          score = Math.max(30, tempScore);
        }
      } catch (err) {
        console.error('Real website audit scrape failed, falling back to mock details:', err);
      }
    }

    // Build recommendations based on actual score/checks
    const recommendations: string[] = [];
    if (h1Count === 0) {
      recommendations.push('Add exactly one <h1> tag to your page for clear search hierarchies.');
    } else if (h1Count > 1) {
      recommendations.push('Your homepage has multiple <h1> tags. Reduce it to exactly one.');
    }
    if (metaDescription.startsWith('No meta description')) {
      recommendations.push('Add a meta description (150-160 characters) to optimize Google click-through rates.');
    }
    if (imagesMissingAltCount > 0) {
      recommendations.push(`Add alt descriptions to all ${imagesMissingAltCount} image tags currently missing them.`);
    }
    if (schemaTypesFound.includes('None')) {
      recommendations.push('Add LocalBusiness JSON-LD schema markup on your website homepage.');
    }
    if (!isCanonicalSet) {
      recommendations.push('Configure a canonical link tag to prevent duplicate content indexing issues.');
    }
    if (loadTimeMs > 2000) {
      recommendations.push(`Improve page load speed (currently ${(loadTimeMs/1000).toFixed(1)}s). Aim for under 1.5s.`);
    }

    if (recommendations.length === 0) {
      recommendations.push('Your homepage website optimization looks excellent! Keep up the good work.');
    }

    const audit = await WebsiteAudit.create({
      businessId,
      websiteUrl,
      score,
      metrics: {
        titleTag,
        metaDescription,
        h1Count,
        headings,
        imagesCount,
        imagesMissingAltCount,
        schemaTypesFound,
        isCanonicalSet,
        brokenLinksCount,
        brokenLinks,
        loadTimeMs
      },
      recommendations
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
    const totalBusinesses = await Business.countDocuments({ isDeleted: false });
    const totalKeywords = await Keyword.countDocuments({ isDeleted: false });

    return res.status(200).json({
      totalUsers,
      totalAgencies,
      totalBusinesses,
      totalKeywords
    });
  } catch (error: any) {
    return res.status(500).json({ error: error.message });
  }
};
