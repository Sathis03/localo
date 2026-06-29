import React, { useState } from 'react';
import { useAppStore } from '../store';
import { Card, CardContent, CardHeader, CardTitle, CardDescription, Button, Select, Alert } from '../components/ui';
import { Sparkles, Copy, RefreshCw, FileText } from 'lucide-react';
import axios from 'axios';

export const AiContentPage: React.FC = () => {
  const { activeBusiness, token, apiBaseUrl } = useAppStore();
  const [templateType, setTemplateType] = useState<any>('Google Post');
  const [prompt, setPrompt] = useState('');
  const [generatedText, setGeneratedText] = useState('');
  const [loading, setLoading] = useState(false);
  const [copied, setCopied] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleGenerate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!activeBusiness) return;
    setError(null);
    setGeneratedText('');

    if (!prompt.trim()) {
      setError('A descriptive prompt prompt is required to guide the AI model.');
      return;
    }

    try {
      setLoading(true);
      const res = await axios.post(`${apiBaseUrl}/ai/generate`, {
        businessId: activeBusiness._id,
        prompt,
        templateType
      }, {
        headers: { Authorization: `Bearer ${token}` }
      });
      setGeneratedText(res.data.generatedContent);
    } catch (err: any) {
      console.error(err);
      setError('AI Copywriting engine failed to generate text. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleCopy = () => {
    navigator.clipboard.writeText(generatedText);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  if (!activeBusiness) {
    return <div className="text-center py-12 text-slate-400">Select business profile first.</div>;
  }

  return (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
      {/* Configuration Column */}
      <div className="lg:col-span-1">
        <Card>
          <CardHeader>
            <CardTitle className="text-sm font-bold text-slate-900 dark:text-white">AI Content Settings</CardTitle>
            <CardDescription className="text-xs">Select a local SEO copywriting template.</CardDescription>
          </CardHeader>
          <CardContent>
            {error && (
              <Alert variant="danger" className="mb-4">
                <span>{error}</span>
              </Alert>
            )}

            <form onSubmit={handleGenerate} className="space-y-4">
              <Select
                label="Copywriting Template Type"
                value={templateType}
                onChange={(e) => setTemplateType(e.target.value)}
                options={[
                  { value: 'Google Post', label: 'Google Business Profile Post' },
                  { value: 'Business Description', label: 'GMB Business Description' },
                  { value: 'Service Description', label: 'GBP Service Description' },
                  { value: 'FAQ Content', label: 'Local FAQ Question & Answer' }
                ]}
              />

              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-350 mb-1.5">Contextual Prompts</label>
                <textarea
                  required
                  placeholder="e.g. Write about a 15% discount for first-time visitors this weekend for our bakery shop..."
                  rows={6}
                  value={prompt}
                  onChange={(e) => setPrompt(e.target.value)}
                  className="w-full px-3 py-2 text-sm bg-white dark:bg-slate-950 border border-slate-300 dark:border-slate-800 rounded-lg text-slate-900 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>

              <Button type="submit" disabled={loading} className="w-full flex items-center justify-center gap-1.5">
                {loading ? (
                  <>
                    <RefreshCw className="w-4 h-4 animate-spin" />
                    Generating Copy...
                  </>
                ) : (
                  <>
                    <Sparkles className="w-4 h-4" />
                    Generate SEO Content
                  </>
                )}
              </Button>
            </form>
          </CardContent>
        </Card>
      </div>

      {/* Generation Results Output */}
      <div className="lg:col-span-2">
        <Card className="h-full flex flex-col">
          <CardHeader className="flex flex-row items-center justify-between border-b border-slate-100 dark:border-slate-800/60 pb-4">
            <div>
              <CardTitle className="text-sm font-bold text-slate-900 dark:text-white flex items-center gap-1.5">
                <FileText className="w-4 h-4 text-blue-500" /> Generated Output
              </CardTitle>
              <CardDescription className="text-xs">Preview and copy your generated text block.</CardDescription>
            </div>
            {generatedText && (
              <Button variant="outline" size="sm" onClick={handleCopy} className="flex items-center gap-1 text-xs">
                <Copy className="w-3.5 h-3.5" />
                {copied ? 'Copied!' : 'Copy to Clipboard'}
              </Button>
            )}
          </CardHeader>
          <CardContent className="flex-1 p-6 bg-slate-50 dark:bg-slate-950/20 font-sans text-sm text-slate-800 dark:text-slate-305 flex flex-col justify-center">
            {generatedText ? (
              <p className="whitespace-pre-wrap leading-relaxed select-text font-normal">{generatedText}</p>
            ) : (
              <div className="text-center text-slate-400 py-16 flex flex-col items-center">
                <Sparkles className="w-10 h-10 text-slate-300 dark:text-slate-750 mb-3 animate-pulse" />
                <p className="text-xs font-semibold">Your generated copywriting will appear here.</p>
                <p className="text-[11px] text-slate-400 mt-1 max-w-xs leading-normal">Select a template on the left, input details, and tap generate.</p>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
};
