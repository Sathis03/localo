import React, { useState } from 'react';
import { Dialog, Input, Button } from './ui';
import { useAppStore } from '../store';
import axios from 'axios';
import { useNavigate } from 'react-router-dom';

const slugify = (text: string) => {
  return text
    .toString()
    .toLowerCase()
    .trim()
    .replace(/\s+/g, '-')
    .replace(/[^\w\-]+/g, '')
    .replace(/\-\-+/g, '-');
};

export const AddBusinessModal: React.FC = () => {
  const { isAddBusinessOpen, setIsAddBusinessOpen, token, apiBaseUrl, businesses, setBusinesses, setActiveBusiness } = useAppStore();
  const navigate = useNavigate();

  const [bName, setBName] = useState('');
  const [bWeb, setBWeb] = useState('');
  const [bPhone, setBPhone] = useState('');
  const [loading, setLoading] = useState(false);

  const handleAddBusiness = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!bName.trim()) return;
    setLoading(true);

    try {
      const res = await axios.post(`${apiBaseUrl}/businesses`, {
        name: bName,
        websiteUrl: bWeb,
        phone: bPhone
      }, {
        headers: { Authorization: `Bearer ${token}` }
      });
      
      setBName('');
      setBWeb('');
      setBPhone('');
      setIsAddBusinessOpen(false);
      
      const newBusiness = res.data;
      setBusinesses([...businesses, newBusiness]);
      setActiveBusiness(newBusiness);
      navigate(`/${slugify(newBusiness.name)}/${newBusiness._id}/dashboard`);
    } catch (error) {
      console.error('Failed to create business:', error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog isOpen={isAddBusinessOpen} onClose={() => setIsAddBusinessOpen(false)} title="Track New Local Business">
      <form onSubmit={handleAddBusiness} className="space-y-4 text-left">
        <Input 
          label="Business/Profile Name" 
          required 
          placeholder="e.g. California Dental Clinic" 
          value={bName} 
          onChange={(e) => setBName(e.target.value)} 
        />
        <Input 
          label="Website Homepage URL" 
          placeholder="https://californiadental.com" 
          value={bWeb} 
          onChange={(e) => setBWeb(e.target.value)} 
        />
        <Input 
          label="Phone Number" 
          placeholder="+1 555-0199" 
          value={bPhone} 
          onChange={(e) => setBPhone(e.target.value)} 
        />
        <div className="flex justify-end gap-2 pt-2">
          <Button type="button" variant="secondary" onClick={() => setIsAddBusinessOpen(false)} className="text-xs">
            Cancel
          </Button>
          <Button type="submit" disabled={loading} className="text-xs">
            {loading ? 'Adding...' : 'Add Profile'}
          </Button>
        </div>
      </form>
    </Dialog>
  );
};
