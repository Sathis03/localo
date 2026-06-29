import React, { useState } from 'react';
import { useAppStore } from '../store';
import { Card, CardContent, CardHeader, CardTitle, CardDescription, Button, Input, Select } from '../components/ui';
import { FileCode, Copy, Download, Save, Check } from 'lucide-react';
import axios from 'axios';

export const SchemaPage: React.FC = () => {
  const { activeBusiness, token, apiBaseUrl } = useAppStore();
  const [schemaType, setSchemaType] = useState<any>('LocalBusiness');
  
  // Input fields
  const [name, setName] = useState(activeBusiness?.name || '');
  const [logo, setLogo] = useState('');
  const [street, setStreet] = useState(activeBusiness?.address?.street || '');
  const [city, setCity] = useState(activeBusiness?.address?.city || '');
  const [state, setState] = useState(activeBusiness?.address?.state || '');
  const [zip, setZip] = useState(activeBusiness?.address?.zip || '');
  const [phone, setPhone] = useState(activeBusiness?.phone || '');
  const [url, setUrl] = useState(activeBusiness?.websiteUrl || '');

  // JSON LD output state
  const [jsonLd, setJsonLd] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);
  const [saved, setSaved] = useState(false);

  const handleGenerate = (e: React.FormEvent) => {
    e.preventDefault();
    setSaved(false);

    let schemaObj: Record<string, any> = {};

    if (schemaType === 'LocalBusiness') {
      schemaObj = {
        "@context": "https://schema.org",
        "@type": "LocalBusiness",
        "name": name,
        "image": logo || "https://example.com/logo.png",
        "@id": url || "https://example.com",
        "url": url || "https://example.com",
        "telephone": phone,
        "address": {
          "@type": "PostalAddress",
          "streetAddress": street,
          "addressLocality": city,
          "addressRegion": state,
          "postalCode": zip,
          "addressCountry": "US"
        }
      };
    } else if (schemaType === 'Organization') {
      schemaObj = {
        "@context": "https://schema.org",
        "@type": "Organization",
        "name": name,
        "url": url || "https://example.com",
        "logo": logo || "https://example.com/logo.png",
        "contactPoint": {
          "@type": "ContactPoint",
          "telephone": phone,
          "contactType": "customer service"
        }
      };
    } else if (schemaType === 'FAQ') {
      schemaObj = {
        "@context": "https://schema.org",
        "@type": "FAQPage",
        "mainEntity": [{
          "@type": "Question",
          "name": "What are your business hours?",
          "acceptedAnswer": {
            "@type": "Answer",
            "text": "We are open Monday through Friday from 9 AM to 6 PM."
          }
        }]
      };
    } else {
      schemaObj = {
        "@context": "https://schema.org",
        "@type": "WebSite",
        "name": name,
        "url": url || "https://example.com"
      };
    }

    setJsonLd(JSON.stringify(schemaObj, null, 2));
  };

  const handleCopy = () => {
    if (!jsonLd) return;
    navigator.clipboard.writeText(`<script type="application/ld+json">\n${jsonLd}\n</script>`);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleDownload = () => {
    if (!jsonLd) return;
    const blob = new Blob([`<script type="application/ld+json">\n${jsonLd}\n</script>`], { type: 'text/html' });
    const href = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = href;
    link.download = `schema_${schemaType.toLowerCase()}.html`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const handleSaveToDb = async () => {
    if (!jsonLd || !activeBusiness) return;
    try {
      await axios.post(`${apiBaseUrl}/schemas`, {
        businessId: activeBusiness._id,
        schemaType,
        schemaData: JSON.parse(jsonLd)
      }, {
        headers: { Authorization: `Bearer ${token}` }
      });
      setSaved(true);
    } catch (error) {
      console.error('Failed to save schema:', error);
    }
  };

  if (!activeBusiness) {
    return <div className="text-center py-12 text-slate-400">Select business profile first.</div>;
  }

  return (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
      {/* Schema Inputs Column */}
      <div className="lg:col-span-1">
        <Card>
          <CardHeader>
            <CardTitle className="text-sm font-bold text-slate-900 dark:text-white">Structured Data Schema Builder</CardTitle>
            <CardDescription className="text-xs">Configure structured data settings.</CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleGenerate} className="space-y-4">
              <Select
                label="Schema Markup Type"
                value={schemaType}
                onChange={(e) => setSchemaType(e.target.value)}
                options={[
                  { value: 'LocalBusiness', label: 'LocalBusiness (Store/Office)' },
                  { value: 'Organization', label: 'Organization (Company)' },
                  { value: 'FAQ', label: 'FAQ Page' },
                  { value: 'WebSite', label: 'WebSite' }
                ]}
              />

              <Input label="Business/Brand Name" required value={name} onChange={(e) => setName(e.target.value)} />
              <Input label="Website Address" type="url" required value={url} onChange={(e) => setUrl(e.target.value)} />
              <Input label="Logo image URL" type="url" placeholder="https://example.com/logo.png" value={logo} onChange={(e) => setLogo(e.target.value)} />

              {schemaType === 'LocalBusiness' && (
                <>
                  <Input label="Street Address" required value={street} onChange={(e) => setStreet(e.target.value)} />
                  <div className="grid grid-cols-2 gap-2">
                    <Input label="City" required value={city} onChange={(e) => setCity(e.target.value)} />
                    <Input label="State/Region" required value={state} onChange={(e) => setState(e.target.value)} />
                  </div>
                  <div className="grid grid-cols-2 gap-2">
                    <Input label="Zip/Postal Code" required value={zip} onChange={(e) => setZip(e.target.value)} />
                    <Input label="Contact Phone" required value={phone} onChange={(e) => setPhone(e.target.value)} />
                  </div>
                </>
              )}

              {schemaType === 'Organization' && (
                <Input label="Contact Phone" required value={phone} onChange={(e) => setPhone(e.target.value)} />
              )}

              <Button type="submit" className="w-full flex items-center justify-center gap-1.5 font-semibold text-xs">
                <FileCode className="w-4 h-4" /> Generate JSON-LD Code
              </Button>
            </form>
          </CardContent>
        </Card>
      </div>

      {/* Code Preview Column */}
      <div className="lg:col-span-2">
        <Card className="h-full flex flex-col">
          <CardHeader className="flex flex-row items-center justify-between border-b border-slate-100 dark:border-slate-800 pb-4">
            <div>
              <CardTitle className="text-sm font-bold text-slate-900 dark:text-white flex items-center gap-1.5">
                <FileCode className="w-4 h-4 text-purple-500" /> Script Preview
              </CardTitle>
              <CardDescription className="text-xs">JSON-LD code block structure.</CardDescription>
            </div>
            {jsonLd && (
              <div className="flex gap-2">
                <Button variant="outline" size="sm" onClick={handleCopy} className="flex items-center gap-1 text-xs cursor-pointer">
                  {copied ? <Check className="w-3.5 h-3.5 text-emerald-500" /> : <Copy className="w-3.5 h-3.5" />}
                  {copied ? 'Copied!' : 'Copy'}
                </Button>
                <Button variant="outline" size="sm" onClick={handleDownload} className="flex items-center gap-1 text-xs cursor-pointer">
                  <Download className="w-3.5 h-3.5" />
                  Download
                </Button>
                <Button size="sm" onClick={handleSaveToDb} className="flex items-center gap-1 text-xs cursor-pointer">
                  <Save className="w-3.5 h-3.5" />
                  {saved ? 'Saved!' : 'Save'}
                </Button>
              </div>
            )}
          </CardHeader>
          <CardContent className="flex-1 p-0 overflow-auto bg-slate-950 font-mono text-xs text-slate-200">
            {jsonLd ? (
              <pre className="p-5 overflow-auto select-text leading-relaxed">
                {`# Add this inside the <head> tag of your webpage:\n\n`}
                {`<script type="application/ld+json">\n`}
                {jsonLd}
                {`\n</script>`}
              </pre>
            ) : (
              <div className="h-full min-h-[300px] flex flex-col items-center justify-center text-slate-500 py-16">
                <FileCode className="w-10 h-10 mb-2 animate-pulse text-slate-650" />
                <p className="text-xs font-semibold">Schema Script preview block.</p>
                <p className="text-[10px] text-slate-550 mt-1">Configure options on the left and tap generate.</p>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
};
