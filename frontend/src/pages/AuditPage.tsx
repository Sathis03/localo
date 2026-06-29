import React, { useEffect, useState } from 'react';
import { useAppStore } from '../store';
import { Card, CardContent, CardHeader, CardTitle, CardDescription, Button, Badge } from '../components/ui';
import {
  CheckCircle, AlertTriangle, XCircle, Search, Globe, RefreshCw
} from 'lucide-react';
import axios from 'axios';

export const AuditPage: React.FC = () => {
  const { activeBusiness, token, apiBaseUrl } = useAppStore();
  const [seoAudit, setSeoAudit] = useState<any>(null);
  const [webAudit, setWebAudit] = useState<any>(null);
  const [runningGbp, setRunningGbp] = useState(false);
  const [runningWeb, setRunningWeb] = useState(false);

  const fetchAudits = async () => {
    if (!activeBusiness) return;
    try {
      // Fetch audits if already run. For demonstration we check errors.
      const seoRes = await axios.post(`${apiBaseUrl}/audits/seo`, { businessId: activeBusiness._id }, {
        headers: { Authorization: `Bearer ${token}` }
      });
      setSeoAudit(seoRes.data);

      const webRes = await axios.post(`${apiBaseUrl}/audits/website`, {
        businessId: activeBusiness._id,
        websiteUrl: activeBusiness.websiteUrl || 'https://example.com'
      }, {
        headers: { Authorization: `Bearer ${token}` }
      });
      setWebAudit(webRes.data);
    } catch (error) {
      console.log('Audits not generated yet.');
    }
  };

  useEffect(() => {
    fetchAudits();
  }, [activeBusiness, token, apiBaseUrl]);

  const handleRunGbpAudit = async () => {
    if (!activeBusiness) return;
    try {
      setRunningGbp(true);
      const res = await axios.post(`${apiBaseUrl}/audits/seo`, { businessId: activeBusiness._id }, {
        headers: { Authorization: `Bearer ${token}` }
      });
      setSeoAudit(res.data);
    } catch (error) {
      console.error(error);
    } finally {
      setRunningGbp(false);
    }
  };

  const handleRunWebAudit = async () => {
    if (!activeBusiness) return;
    try {
      setRunningWeb(true);
      const res = await axios.post(`${apiBaseUrl}/audits/website`, {
        businessId: activeBusiness._id,
        websiteUrl: activeBusiness.websiteUrl || 'https://example.com'
      }, {
        headers: { Authorization: `Bearer ${token}` }
      });
      setWebAudit(res.data);
    } catch (error) {
      console.error(error);
    } finally {
      setRunningWeb(false);
    }
  };

  if (!activeBusiness) {
    return <div className="text-center py-12 text-slate-400">Select business profile first.</div>;
  }

  return (
    <div className="space-y-6">
      {/* Run Audits Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 p-5 rounded-2xl">
        <div>
          <h2 className="text-base font-bold text-slate-900 dark:text-white">Local SEO & Website Technical Auditor</h2>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">Audit categories, citations, posts, meta tags, schemas, and images.</p>
        </div>
        <div className="flex gap-2">
          <Button onClick={handleRunGbpAudit} disabled={runningGbp} className="flex items-center gap-1 text-xs">
            <RefreshCw className={`w-3.5 h-3.5 ${runningGbp ? 'animate-spin' : ''}`} />
            {runningGbp ? 'Auditing GBP...' : 'Run GBP Profile Audit'}
          </Button>
          <Button onClick={handleRunWebAudit} disabled={runningWeb} variant="secondary" className="flex items-center gap-1 text-xs">
            <RefreshCw className={`w-3.5 h-3.5 ${runningWeb ? 'animate-spin' : ''}`} />
            {runningWeb ? 'Analyzing Web...' : 'Run Technical Website Audit'}
          </Button>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* GBP Audit Results */}
        <Card>
          <CardHeader className="flex flex-row items-center justify-between">
            <div>
              <CardTitle className="text-sm font-bold text-slate-900 dark:text-white flex items-center gap-1.5">
                <Search className="w-4 h-4 text-blue-500" /> Google Business Profile SEO Audit
              </CardTitle>
              <CardDescription className="text-xs">Identified signals from maps API integration.</CardDescription>
            </div>
            {seoAudit && (
              <span className="text-2xl font-black text-blue-600 dark:text-blue-400 bg-blue-500/10 dark:bg-blue-950/30 px-3 py-1.5 rounded-xl border border-blue-200/50 dark:border-blue-900/30">
                {seoAudit.score}/100
              </span>
            )}
          </CardHeader>
          <CardContent className="space-y-5">
            {!seoAudit ? (
              <div className="text-center py-12 text-slate-400 text-xs">Click the button above to generate a GBP SEO Audit Score.</div>
            ) : (
              <div className="space-y-4">
                {/* Check lists */}
                <div className="space-y-2">
                  <h4 className="text-xs font-bold text-slate-800 dark:text-slate-205 flex items-center gap-1.5">
                    <CheckCircle className="w-4 h-4 text-emerald-500" /> Passed Checks ({seoAudit.passedChecks.length})
                  </h4>
                  <div className="space-y-1.5 pl-5">
                    {seoAudit.passedChecks.map((check: any, idx: number) => (
                      <div key={idx} className="text-xs text-slate-600 dark:text-slate-400">
                        <span className="font-semibold text-slate-700 dark:text-slate-300">{check.checkName}</span>: {check.description}
                      </div>
                    ))}
                  </div>
                </div>

                <hr className="border-slate-150 dark:border-slate-850" />

                <div className="space-y-2">
                  <h4 className="text-xs font-bold text-slate-800 dark:text-slate-205 flex items-center gap-1.5">
                    <AlertTriangle className="w-4 h-4 text-amber-500" /> Warnings ({seoAudit.warnings.length})
                  </h4>
                  <div className="space-y-1.5 pl-5">
                    {seoAudit.warnings.map((check: any, idx: number) => (
                      <div key={idx} className="text-xs text-slate-600 dark:text-slate-400">
                        <span className="font-semibold text-slate-700 dark:text-slate-350">{check.checkName}</span>: {check.description}
                      </div>
                    ))}
                  </div>
                </div>

                <hr className="border-slate-150 dark:border-slate-850" />

                <div className="space-y-2">
                  <h4 className="text-xs font-bold text-slate-800 dark:text-slate-205 flex items-center gap-1.5">
                    <XCircle className="w-4 h-4 text-red-500" /> Critical Issues ({seoAudit.criticalIssues.length})
                  </h4>
                  <div className="space-y-1.5 pl-5">
                    {seoAudit.criticalIssues.map((check: any, idx: number) => (
                      <div key={idx} className="text-xs text-slate-600 dark:text-slate-400">
                        <span className="font-semibold text-slate-700 dark:text-slate-350">{check.checkName}</span>: {check.description}
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Website Audit Results */}
        <Card>
          <CardHeader className="flex flex-row items-center justify-between">
            <div>
              <CardTitle className="text-sm font-bold text-slate-900 dark:text-white flex items-center gap-1.5">
                <Globe className="w-4 h-4 text-purple-500" /> Technical Website Audit
              </CardTitle>
              <CardDescription className="text-xs">Analysis of HTML meta descriptions and indexing.</CardDescription>
            </div>
            {webAudit && (
              <span className="text-2xl font-black text-purple-600 dark:text-purple-400 bg-purple-500/10 dark:bg-purple-950/30 px-3 py-1.5 rounded-xl border border-purple-200/50 dark:border-purple-900/30">
                {webAudit.score}/100
              </span>
            )}
          </CardHeader>
          <CardContent className="space-y-5">
            {!webAudit ? (
              <div className="text-center py-12 text-slate-400 text-xs">Click the button above to crawl website tags.</div>
            ) : (
              <div className="space-y-4">
                {/* Meta details */}
                <div className="p-3 bg-slate-50 dark:bg-slate-950/40 border border-slate-100 dark:border-slate-850 rounded-xl space-y-2 text-xs">
                  <div>
                    <span className="font-bold text-slate-500 block uppercase text-[10px]">Title Tag</span>
                    <p className="font-medium text-slate-850 dark:text-slate-200">{webAudit.metrics.titleTag}</p>
                  </div>
                  <div>
                    <span className="font-bold text-slate-500 block uppercase text-[10px]">Meta Description</span>
                    <p className="font-medium text-slate-850 dark:text-slate-200 leading-snug">{webAudit.metrics.metaDescription}</p>
                  </div>
                  <div className="grid grid-cols-2 gap-2 pt-1 border-t border-slate-100 dark:border-slate-850/60 mt-1">
                    <div>
                      <span className="font-bold text-slate-500 block uppercase text-[10px]">Broken Links</span>
                      <Badge variant="danger">{webAudit.metrics.brokenLinksCount} found</Badge>
                    </div>
                    <div>
                      <span className="font-bold text-slate-500 block uppercase text-[10px]">Alt Tags Missing</span>
                      <Badge variant="warning">{webAudit.metrics.imagesMissingAltCount} images</Badge>
                    </div>
                  </div>
                </div>

                {/* Crawl Recommendations */}
                <div className="space-y-2">
                  <h4 className="text-xs font-bold text-slate-800 dark:text-slate-205">Audit Recommendations</h4>
                  <ul className="list-disc pl-5 text-xs text-slate-600 dark:text-slate-400 space-y-1.5">
                    {webAudit.recommendations.map((rec: string, idx: number) => (
                      <li key={idx}>{rec}</li>
                    ))}
                  </ul>
                </div>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
};
