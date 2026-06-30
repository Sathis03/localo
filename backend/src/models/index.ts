import mongoose, { Schema, Document, Model } from 'mongoose';

// ==========================================
// 1. USER MODEL
// ==========================================
export interface IUser extends Document {
  name: string;
  email: string;
  passwordHash: string;
  role: 'Super Admin' | 'Agency Owner' | 'Agency Staff' | 'Business Owner';
  agencyId?: mongoose.Types.ObjectId;
  status: 'Active' | 'Suspended' | 'Pending';
  googleOAuth?: {
    accessToken?: string;
    refreshToken?: string;
    expiryDate?: number;
    email?: string;
  };
  resetPasswordToken?: string;
  resetPasswordExpires?: Date;
  isDeleted: boolean;
  createdAt: Date;
  updatedAt: Date;
}

const UserSchema = new Schema<IUser>({
  name: { type: String, required: true },
  email: { type: String, required: true, unique: true, index: true, lowercase: true },
  passwordHash: { type: String, required: true },
  role: { type: String, required: true, enum: ['Super Admin', 'Agency Owner', 'Agency Staff', 'Business Owner'] },
  agencyId: { type: Schema.Types.ObjectId, ref: 'Agency', index: true },
  status: { type: String, default: 'Active', enum: ['Active', 'Suspended', 'Pending'] },
  googleOAuth: {
    accessToken: String,
    refreshToken: String,
    expiryDate: Number,
    email: String
  },
  resetPasswordToken: String,
  resetPasswordExpires: Date,
  isDeleted: { type: Boolean, default: false, index: true }
}, { timestamps: true });

// ==========================================
// 2. AGENCY MODEL
// ==========================================
export interface IAgency extends Document {
  name: string;
  logoUrl?: string;
  website?: string;
  ownerId: mongoose.Types.ObjectId;
  settings: {
    themeColor?: string;
    whiteLabelDomain?: string;
    senderEmail?: string;
  };
  status: 'Active' | 'Suspended';
  isDeleted: boolean;
  createdAt: Date;
  updatedAt: Date;
}

const AgencySchema = new Schema<IAgency>({
  name: { type: String, required: true },
  logoUrl: String,
  website: String,
  ownerId: { type: Schema.Types.ObjectId, ref: 'User', required: true, index: true },
  settings: {
    themeColor: { type: String, default: '#3b82f6' },
    whiteLabelDomain: String,
    senderEmail: String
  },
  status: { type: String, default: 'Active', enum: ['Active', 'Suspended'] },
  isDeleted: { type: Boolean, default: false, index: true }
}, { timestamps: true });

// ==========================================
// 3. BUSINESS MODEL
// ==========================================
export interface IBusiness extends Document {
  name: string;
  agencyId?: mongoose.Types.ObjectId;
  ownerId: mongoose.Types.ObjectId;
  websiteUrl?: string;
  phone?: string;
  address?: {
    street?: string;
    city?: string;
    state?: string;
    zip?: string;
    country?: string;
  };
  googleProfileId?: mongoose.Types.ObjectId;
  seoScore: number;
  status: 'Active' | 'Inactive';
  isDeleted: boolean;
  createdAt: Date;
  updatedAt: Date;
}

const BusinessSchema = new Schema<IBusiness>({
  name: { type: String, required: true },
  agencyId: { type: Schema.Types.ObjectId, ref: 'Agency', index: true },
  ownerId: { type: Schema.Types.ObjectId, ref: 'User', required: true, index: true },
  websiteUrl: String,
  phone: String,
  address: {
    street: String,
    city: String,
    state: String,
    zip: String,
    country: String
  },
  googleProfileId: { type: Schema.Types.ObjectId, ref: 'GoogleProfile' },
  seoScore: { type: Number, default: 0 },
  status: { type: String, default: 'Active', enum: ['Active', 'Inactive'] },
  isDeleted: { type: Boolean, default: false, index: true }
}, { timestamps: true });

// ==========================================
// 4. GOOGLE PROFILE MODEL
// ==========================================
export interface IGoogleProfile extends Document {
  businessId: mongoose.Types.ObjectId;
  accountId: string;
  locationId: string;
  placeId?: string;
  businessName: string;
  primaryCategory?: string;
  secondaryCategories: string[];
  description?: string;
  services: string[];
  products: Array<{ name: string; price?: string; description?: string }>;
  photosCount: number;
  photos?: string[];
  reviewsCount: number;
  averageRating: number;
  openingHours?: Record<string, any>;
  attributes?: Record<string, any>;
  syncLogs: Array<{ syncedAt: Date; status: 'Success' | 'Failed'; error?: string }>;
  isDeleted: boolean;
  createdAt: Date;
  updatedAt: Date;
}

const GoogleProfileSchema = new Schema<IGoogleProfile>({
  businessId: { type: Schema.Types.ObjectId, ref: 'Business', required: true, index: true },
  accountId: { type: String, required: true },
  locationId: { type: String, required: true },
  placeId: String,
  businessName: { type: String, required: true },
  primaryCategory: String,
  secondaryCategories: [String],
  description: String,
  services: [String],
  products: [{
    name: String,
    price: String,
    description: String
  }],
  photosCount: { type: Number, default: 0 },
  photos: { type: [String], default: [] },
  reviewsCount: { type: Number, default: 0 },
  averageRating: { type: Number, default: 0 },
  openingHours: Schema.Types.Mixed,
  attributes: Schema.Types.Mixed,
  syncLogs: [{
    syncedAt: { type: Date, default: Date.now },
    status: { type: String, enum: ['Success', 'Failed'] },
    error: String
  }],
  isDeleted: { type: Boolean, default: false, index: true }
}, { timestamps: true });

// ==========================================
// 5. KEYWORD MODEL
// ==========================================
export interface IKeyword extends Document {
  businessId: mongoose.Types.ObjectId;
  keyword: string;
  location: string;
  trackingFrequency: 'Daily' | 'Weekly' | 'Monthly';
  lastCheckedAt?: Date;
  status: 'Active' | 'Paused';
  isDeleted: boolean;
  createdAt: Date;
  updatedAt: Date;
}

const KeywordSchema = new Schema<IKeyword>({
  businessId: { type: Schema.Types.ObjectId, ref: 'Business', required: true, index: true },
  keyword: { type: String, required: true },
  location: { type: String, required: true },
  trackingFrequency: { type: String, default: 'Weekly', enum: ['Daily', 'Weekly', 'Monthly'] },
  lastCheckedAt: Date,
  status: { type: String, default: 'Active', enum: ['Active', 'Paused'] },
  isDeleted: { type: Boolean, default: false, index: true }
}, { timestamps: true });

// ==========================================
// 6. KEYWORD RANKING MODEL
// ==========================================
export interface IKeywordRanking extends Document {
  keywordId: mongoose.Types.ObjectId;
  rank: number; // 0 or 100+ means unranked
  rankDate: Date;
  searchEngine: 'Google Local' | 'Google Search';
  gridCoordinates?: { lat: number; lng: number };
  isDeleted: boolean;
  createdAt: Date;
  updatedAt: Date;
}

const KeywordRankingSchema = new Schema<IKeywordRanking>({
  keywordId: { type: Schema.Types.ObjectId, ref: 'Keyword', required: true, index: true },
  rank: { type: Number, required: true },
  rankDate: { type: Date, required: true, index: true },
  searchEngine: { type: String, default: 'Google Local', enum: ['Google Local', 'Google Search'] },
  gridCoordinates: {
    lat: Number,
    lng: Number
  },
  isDeleted: { type: Boolean, default: false, index: true }
}, { timestamps: true });

// ==========================================
// 7. REVIEW MODEL
// ==========================================
export interface IReview extends Document {
  googleProfileId: mongoose.Types.ObjectId;
  reviewId: string; // Google Review ID
  reviewerName: string;
  reviewerPhotoUrl?: string;
  rating: number;
  comment?: string;
  sentiment: 'Positive' | 'Neutral' | 'Negative';
  isReplied: boolean;
  publishDate: Date;
  isDeleted: boolean;
  createdAt: Date;
  updatedAt: Date;
}

const ReviewSchema = new Schema<IReview>({
  googleProfileId: { type: Schema.Types.ObjectId, ref: 'GoogleProfile', required: true, index: true },
  reviewId: { type: String, required: true, unique: true, index: true },
  reviewerName: { type: String, required: true },
  reviewerPhotoUrl: String,
  rating: { type: Number, required: true },
  comment: String,
  sentiment: { type: String, default: 'Neutral', enum: ['Positive', 'Neutral', 'Negative'] },
  isReplied: { type: Boolean, default: false },
  publishDate: { type: Date, required: true },
  isDeleted: { type: Boolean, default: false, index: true }
}, { timestamps: true });

// ==========================================
// 8. REVIEW REPLY MODEL
// ==========================================
export interface IReviewReply extends Document {
  reviewId: mongoose.Types.ObjectId;
  replyText: string;
  replyType: 'AI' | 'Manual';
  status: 'Pending' | 'Posted' | 'Failed';
  errorMessage?: string;
  postedAt?: Date;
  isDeleted: boolean;
  createdAt: Date;
  updatedAt: Date;
}

const ReviewReplySchema = new Schema<IReviewReply>({
  reviewId: { type: Schema.Types.ObjectId, ref: 'Review', required: true, index: true },
  replyText: { type: String, required: true },
  replyType: { type: String, enum: ['AI', 'Manual'], default: 'AI' },
  status: { type: String, default: 'Pending', enum: ['Pending', 'Posted', 'Failed'] },
  errorMessage: String,
  postedAt: Date,
  isDeleted: { type: Boolean, default: false, index: true }
}, { timestamps: true });

// ==========================================
// 9. TASK MODEL
// ==========================================
export interface ITask extends Document {
  businessId: mongoose.Types.ObjectId;
  title: string;
  description?: string;
  category: 'GBP Optimization' | 'Content' | 'Reviews' | 'Citations' | 'Technical SEO';
  priority: 'High' | 'Medium' | 'Low';
  status: 'Pending' | 'In Progress' | 'Completed';
  dueDate?: Date;
  isDeleted: boolean;
  createdAt: Date;
  updatedAt: Date;
}

const TaskSchema = new Schema<ITask>({
  businessId: { type: Schema.Types.ObjectId, ref: 'Business', required: true, index: true },
  title: { type: String, required: true },
  description: String,
  category: { type: String, required: true, enum: ['GBP Optimization', 'Content', 'Reviews', 'Citations', 'Technical SEO'] },
  priority: { type: String, default: 'Medium', enum: ['High', 'Medium', 'Low'] },
  status: { type: String, default: 'Pending', enum: ['Pending', 'In Progress', 'Completed'] },
  dueDate: Date,
  isDeleted: { type: Boolean, default: false, index: true }
}, { timestamps: true });

// ==========================================
// 10. COMPETITOR MODEL
// ==========================================
export interface ICompetitor extends Document {
  businessId: mongoose.Types.ObjectId;
  name: string;
  placeId?: string;
  reviewsCount?: number;
  averageRating?: number;
  photosCount?: number;
  primaryCategory?: string;
  websiteUrl?: string;
  trackedKeywords: string[];
  isDeleted: boolean;
  createdAt: Date;
  updatedAt: Date;
}

const CompetitorSchema = new Schema<ICompetitor>({
  businessId: { type: Schema.Types.ObjectId, ref: 'Business', required: true, index: true },
  name: { type: String, required: true },
  placeId: String,
  reviewsCount: { type: Number, default: 0 },
  averageRating: { type: Number, default: 0 },
  photosCount: { type: Number, default: 0 },
  primaryCategory: String,
  websiteUrl: String,
  trackedKeywords: [String],
  isDeleted: { type: Boolean, default: false, index: true }
}, { timestamps: true });

// ==========================================
// 11. CITATION MODEL
// ==========================================
export interface ICitation extends Document {
  businessId: mongoose.Types.ObjectId;
  directoryName: 'Google' | 'Bing Places' | 'Yelp' | 'Justdial' | 'Sulekha' | 'IndiaMART' | 'Other';
  status: 'Not Submitted' | 'Submitted' | 'Pending' | 'Live';
  listingUrl?: string;
  auditNotes?: string;
  isDeleted: boolean;
  createdAt: Date;
  updatedAt: Date;
}

const CitationSchema = new Schema<ICitation>({
  businessId: { type: Schema.Types.ObjectId, ref: 'Business', required: true, index: true },
  directoryName: { type: String, required: true, enum: ['Google', 'Bing Places', 'Yelp', 'Justdial', 'Sulekha', 'IndiaMART', 'Other'] },
  status: { type: String, default: 'Not Submitted', enum: ['Not Submitted', 'Submitted', 'Pending', 'Live'] },
  listingUrl: String,
  auditNotes: String,
  isDeleted: { type: Boolean, default: false, index: true }
}, { timestamps: true });

// ==========================================
// 12. SEO AUDIT MODEL
// ==========================================
export interface ISeoAudit extends Document {
  businessId: mongoose.Types.ObjectId;
  score: number; // 0 - 100
  passedChecks: Array<{ checkName: string; category: string; description: string }>;
  warnings: Array<{ checkName: string; category: string; description: string }>;
  criticalIssues: Array<{ checkName: string; category: string; description: string }>;
  recommendations: string[];
  isDeleted: boolean;
  createdAt: Date;
  updatedAt: Date;
}

const SeoAuditSchema = new Schema<ISeoAudit>({
  businessId: { type: Schema.Types.ObjectId, ref: 'Business', required: true, index: true },
  score: { type: Number, default: 0 },
  passedChecks: [{ checkName: String, category: String, description: String }],
  warnings: [{ checkName: String, category: String, description: String }],
  criticalIssues: [{ checkName: String, category: String, description: String }],
  recommendations: [String],
  isDeleted: { type: Boolean, default: false, index: true }
}, { timestamps: true });

// ==========================================
// 13. WEBSITE AUDIT MODEL
// ==========================================
export interface IWebsiteAudit extends Document {
  businessId: mongoose.Types.ObjectId;
  websiteUrl: string;
  score: number; // 0 - 100
  metrics: {
    titleTag?: string;
    metaDescription?: string;
    h1Count: number;
    headings: string[];
    imagesCount: number;
    imagesMissingAltCount: number;
    schemaTypesFound: string[];
    isCanonicalSet: boolean;
    brokenLinksCount: number;
    brokenLinks: string[];
    loadTimeMs?: number;
  };
  recommendations: string[];
  isDeleted: boolean;
  createdAt: Date;
  updatedAt: Date;
}

const WebsiteAuditSchema = new Schema<IWebsiteAudit>({
  businessId: { type: Schema.Types.ObjectId, ref: 'Business', required: true, index: true },
  websiteUrl: { type: String, required: true },
  score: { type: Number, default: 0 },
  metrics: {
    titleTag: String,
    metaDescription: String,
    h1Count: { type: Number, default: 0 },
    headings: [String],
    imagesCount: { type: Number, default: 0 },
    imagesMissingAltCount: { type: Number, default: 0 },
    schemaTypesFound: [String],
    isCanonicalSet: { type: Boolean, default: false },
    brokenLinksCount: { type: Number, default: 0 },
    brokenLinks: [String],
    loadTimeMs: Number
  },
  recommendations: [String],
  isDeleted: { type: Boolean, default: false, index: true }
}, { timestamps: true });

// ==========================================
// 14. SCHEMA GENERATOR MODEL
// ==========================================
export interface ISchemaGenerator extends Document {
  businessId: mongoose.Types.ObjectId;
  schemaType: 'LocalBusiness' | 'Organization' | 'Service' | 'FAQ' | 'Review' | 'Breadcrumb' | 'Article' | 'WebSite';
  schemaData: Record<string, any>;
  isDeleted: boolean;
  createdAt: Date;
  updatedAt: Date;
}

const SchemaGeneratorSchema = new Schema<ISchemaGenerator>({
  businessId: { type: Schema.Types.ObjectId, ref: 'Business', required: true, index: true },
  schemaType: { type: String, required: true, enum: ['LocalBusiness', 'Organization', 'Service', 'FAQ', 'Review', 'Breadcrumb', 'Article', 'WebSite'] },
  schemaData: { type: Schema.Types.Mixed, required: true },
  isDeleted: { type: Boolean, default: false, index: true }
}, { timestamps: true });

// ==========================================
// 15. AI GENERATION MODEL
// ==========================================
export interface IAiGeneration extends Document {
  userId: mongoose.Types.ObjectId;
  businessId: mongoose.Types.ObjectId;
  prompt: string;
  templateType: 'Google Post' | 'Business Description' | 'Service Description' | 'Review Reply' | 'FAQ Content' | 'Location Page';
  generatedContent: string;
  isDeleted: boolean;
  createdAt: Date;
  updatedAt: Date;
}

const AiGenerationSchema = new Schema<IAiGeneration>({
  userId: { type: Schema.Types.ObjectId, ref: 'User', required: true, index: true },
  businessId: { type: Schema.Types.ObjectId, ref: 'Business', required: true, index: true },
  prompt: { type: String, required: true },
  templateType: { type: String, required: true, enum: ['Google Post', 'Business Description', 'Service Description', 'Review Reply', 'FAQ Content', 'Location Page'] },
  generatedContent: { type: String, required: true },
  isDeleted: { type: Boolean, default: false, index: true }
}, { timestamps: true });

// ==========================================
// 16. POST MODEL
// ==========================================
export interface IPost extends Document {
  googleProfileId: mongoose.Types.ObjectId;
  summary: string;
  mediaUrl?: string;
  callToAction?: {
    actionType: 'BOOK' | 'ORDER' | 'SHOP' | 'LEARN_MORE' | 'SIGN_UP' | 'CALL';
    url?: string;
  };
  scheduledAt?: Date;
  status: 'Draft' | 'Scheduled' | 'Published' | 'Failed';
  publishedAt?: Date;
  gmbPostId?: string;
  errorMessage?: string;
  isDeleted: boolean;
  createdAt: Date;
  updatedAt: Date;
}

const PostSchema = new Schema<IPost>({
  googleProfileId: { type: Schema.Types.ObjectId, ref: 'GoogleProfile', required: true, index: true },
  summary: { type: String, required: true },
  mediaUrl: String,
  callToAction: {
    actionType: { type: String, enum: ['BOOK', 'ORDER', 'SHOP', 'LEARN_MORE', 'SIGN_UP', 'CALL'], default: 'LEARN_MORE' },
    url: String
  },
  scheduledAt: Date,
  status: { type: String, default: 'Draft', enum: ['Draft', 'Scheduled', 'Published', 'Failed'] },
  publishedAt: Date,
  gmbPostId: String,
  errorMessage: String,
  isDeleted: { type: Boolean, default: false, index: true }
}, { timestamps: true });

// ==========================================
// 17. REPORT MODEL
// ==========================================
export interface IReport extends Document {
  businessId: mongoose.Types.ObjectId;
  reportName: string;
  whiteLabelLogoUrl?: string;
  sections: Array<'SEO Score' | 'Review Summary' | 'Keyword Rankings' | 'Competitor Analysis' | 'Tasks Completed'>;
  status: 'Generating' | 'Ready' | 'Failed';
  pdfUrl?: string;
  sentToEmails?: string[];
  isDeleted: boolean;
  createdAt: Date;
  updatedAt: Date;
}

const ReportSchema = new Schema<IReport>({
  businessId: { type: Schema.Types.ObjectId, ref: 'Business', required: true, index: true },
  reportName: { type: String, required: true },
  whiteLabelLogoUrl: String,
  sections: [{ type: String, enum: ['SEO Score', 'Review Summary', 'Keyword Rankings', 'Competitor Analysis', 'Tasks Completed'] }],
  status: { type: String, default: 'Generating', enum: ['Generating', 'Ready', 'Failed'] },
  pdfUrl: String,
  sentToEmails: [String],
  isDeleted: { type: Boolean, default: false, index: true }
}, { timestamps: true });

// ==========================================
// 18. SUBSCRIPTION MODEL
// ==========================================
export interface ISubscription extends Document {
  agencyId: mongoose.Types.ObjectId;
  plan: 'Starter' | 'Professional' | 'Agency';
  status: 'Active' | 'Cancelled' | 'Expired' | 'Past Due';
  billingCycle: 'Monthly' | 'Yearly';
  price: number;
  currentPeriodStart: Date;
  currentPeriodEnd: Date;
  stripeSubscriptionId?: string;
  isDeleted: boolean;
  createdAt: Date;
  updatedAt: Date;
}

const SubscriptionSchema = new Schema<ISubscription>({
  agencyId: { type: Schema.Types.ObjectId, ref: 'Agency', required: true, index: true },
  plan: { type: String, required: true, enum: ['Starter', 'Professional', 'Agency'] },
  status: { type: String, required: true, enum: ['Active', 'Cancelled', 'Expired', 'Past Due'] },
  billingCycle: { type: String, required: true, enum: ['Monthly', 'Yearly'] },
  price: { type: Number, required: true },
  currentPeriodStart: { type: Date, required: true },
  currentPeriodEnd: { type: Date, required: true },
  stripeSubscriptionId: String,
  isDeleted: { type: Boolean, default: false, index: true }
}, { timestamps: true });

// ==========================================
// 19. PAYMENT MODEL
// ==========================================
export interface IPayment extends Document {
  subscriptionId: mongoose.Types.ObjectId;
  agencyId: mongoose.Types.ObjectId;
  amount: number;
  currency: string;
  status: 'Success' | 'Failed' | 'Pending';
  invoiceId?: string;
  paymentDate: Date;
  isDeleted: boolean;
  createdAt: Date;
  updatedAt: Date;
}

const PaymentSchema = new Schema<IPayment>({
  subscriptionId: { type: Schema.Types.ObjectId, ref: 'Subscription', required: true, index: true },
  agencyId: { type: Schema.Types.ObjectId, ref: 'Agency', required: true, index: true },
  amount: { type: Number, required: true },
  currency: { type: String, default: 'USD' },
  status: { type: String, required: true, enum: ['Success', 'Failed', 'Pending'] },
  invoiceId: String,
  paymentDate: { type: Date, default: Date.now },
  isDeleted: { type: Boolean, default: false, index: true }
}, { timestamps: true });

// ==========================================
// 20. NOTIFICATION MODEL
// ==========================================
export interface INotification extends Document {
  userId: mongoose.Types.ObjectId;
  title: string;
  message: string;
  type: 'Task Reminders' | 'Ranking Updates' | 'Billing' | 'System Alerts';
  read: boolean;
  isDeleted: boolean;
  createdAt: Date;
  updatedAt: Date;
}

const NotificationSchema = new Schema<INotification>({
  userId: { type: Schema.Types.ObjectId, ref: 'User', required: true, index: true },
  title: { type: String, required: true },
  message: { type: String, required: true },
  type: { type: String, required: true, enum: ['Task Reminders', 'Ranking Updates', 'Billing', 'System Alerts'] },
  read: { type: Boolean, default: false },
  isDeleted: { type: Boolean, default: false, index: true }
}, { timestamps: true });

// ==========================================
// 21. ACTIVITY LOG MODEL
// ==========================================
export interface IActivityLog extends Document {
  userId?: mongoose.Types.ObjectId;
  action: string;
  details?: string;
  ipAddress?: string;
  isDeleted: boolean;
  createdAt: Date;
  updatedAt: Date;
}

const ActivityLogSchema = new Schema<IActivityLog>({
  userId: { type: Schema.Types.ObjectId, ref: 'User', index: true },
  action: { type: String, required: true },
  details: String,
  ipAddress: String,
  isDeleted: { type: Boolean, default: false, index: true }
}, { timestamps: true });

// ==========================================
// EXPORTS
// ==========================================
export const User = mongoose.model<IUser>('User', UserSchema);
export const Agency = mongoose.model<IAgency>('Agency', AgencySchema);
export const Business = mongoose.model<IBusiness>('Business', BusinessSchema);
export const GoogleProfile = mongoose.model<IGoogleProfile>('GoogleProfile', GoogleProfileSchema);
export const Keyword = mongoose.model<IKeyword>('Keyword', KeywordSchema);
export const KeywordRanking = mongoose.model<IKeywordRanking>('KeywordRanking', KeywordRankingSchema);
export const Review = mongoose.model<IReview>('Review', ReviewSchema);
export const ReviewReply = mongoose.model<IReviewReply>('ReviewReply', ReviewReplySchema);
export const Task = mongoose.model<ITask>('Task', TaskSchema);
export const Competitor = mongoose.model<ICompetitor>('Competitor', CompetitorSchema);
export const Citation = mongoose.model<ICitation>('Citation', CitationSchema);
export const SeoAudit = mongoose.model<ISeoAudit>('SeoAudit', SeoAuditSchema);
export const WebsiteAudit = mongoose.model<IWebsiteAudit>('WebsiteAudit', WebsiteAuditSchema);
export const SchemaGenerator = mongoose.model<ISchemaGenerator>('SchemaGenerator', SchemaGeneratorSchema);
export const AiGeneration = mongoose.model<IAiGeneration>('AiGeneration', AiGenerationSchema);
export const Post = mongoose.model<IPost>('Post', PostSchema);
export const Report = mongoose.model<IReport>('Report', ReportSchema);
export const Subscription = mongoose.model<ISubscription>('Subscription', SubscriptionSchema);
export const Payment = mongoose.model<IPayment>('Payment', PaymentSchema);
export const Notification = mongoose.model<INotification>('Notification', NotificationSchema);
export const ActivityLog = mongoose.model<IActivityLog>('ActivityLog', ActivityLogSchema);
