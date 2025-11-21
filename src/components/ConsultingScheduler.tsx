import React, { useState } from 'react';

const ConsultingScheduler: React.FC = () => {
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [topic, setTopic] = useState('');
  const [preferred, setPreferred] = useState('google_meet');
  const [date, setDate] = useState('');
  const [submitted, setSubmitted] = useState(false);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitted(true);
  };

  return (
    <div className="bg-background-surface p-6 rounded-lg border border-divider space-y-4">
      <h3 className="text-lg font-semibold text-text-primary">Schedule a Consulting Call</h3>
      <p className="text-sm text-text-secondary">Discuss custom research, advisory support, or tailored insights with our team.</p>
      <form onSubmit={handleSubmit} className="grid grid-cols-1 sm:grid-cols-2 gap-3">
        <input className="px-3 py-2 border border-divider rounded-lg bg-background text-text-primary" placeholder="Full name" value={name} onChange={(e)=>setName(e.target.value)} />
        <input className="px-3 py-2 border border-divider rounded-lg bg-background text-text-primary" placeholder="Email" value={email} onChange={(e)=>setEmail(e.target.value)} />
        <select className="px-3 py-2 border border-divider rounded-lg bg-background text-text-primary" value={preferred} onChange={(e)=>setPreferred(e.target.value)}>
          <option value="google_meet">Google Meet</option>
          <option value="zoom">Zoom</option>
          <option value="phone">Phone Call</option>
        </select>
        <input type="date" className="px-3 py-2 border border-divider rounded-lg bg-background text-text-primary" value={date} onChange={(e)=>setDate(e.target.value)} />
        <textarea className="sm:col-span-2 px-3 py-2 border border-divider rounded-lg bg-background text-text-primary" rows={3} placeholder="Describe your needs..." value={topic} onChange={(e)=>setTopic(e.target.value)} />
        <div className="sm:col-span-2 flex justify-end">
          <button className="btn-primary px-4 py-2 rounded-lg" type="submit">Request Call</button>
        </div>
      </form>
      {submitted && (
        <p className="text-sm text-success">Thanks! We’ll reach out shortly to confirm your session.</p>
      )}
    </div>
  );
};

export default ConsultingScheduler; 