import React, { useState } from 'react';
import { Sparkles, Shield, Clock, BookOpen } from 'lucide-react';

interface SystemSettingsViewProps {
  onSaveSettingsNotice: () => void;
}

export const SystemSettingsView: React.FC<SystemSettingsViewProps> = ({
  onSaveSettingsNotice
}) => {
  const [llmEndpoint, setLlmEndpoint] = useState('http://localhost:1234/v1');
  const [llmModel, setLlmModel] = useState('meta-llama-3-8b-instruct');
  const [loanPeriodDays, setLoanPeriodDays] = useState(14);
  const [maxConcurrentLoans, setMaxConcurrentLoans] = useState(3);
  const [maxRenewals, setMaxRenewals] = useState(2);
  const [libraryHours, setLibraryHours] = useState('8:00 AM - 5:00 PM (Mon-Fri)');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSaveSettingsNotice();
  };

  return (
    <div>
      <div className="page-header">
        <div>
          <div className="page-title">System & Library Settings</div>
          <div className="page-subtitle">
            Configure LLM Studio AI cataloging endpoints, circulation policies, and municipal parameters
          </div>
        </div>
      </div>

      <form onSubmit={handleSubmit} style={{ maxWidth: '800px' }}>
        {/* LLM Studio API Integration Card */}
        <div className="card" style={{ padding: '24px', marginBottom: '24px' }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '16px' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
              <div className="stat-icon" style={{ backgroundColor: 'var(--accent-blue-light)', color: 'var(--accent-blue)' }}>
                <Sparkles size={18} />
              </div>
              <div>
                <h3 style={{ fontSize: '16px', fontWeight: 700 }}>LLM Studio Cataloging API</h3>
                <div style={{ fontSize: '12px', color: 'var(--text-muted)' }}>
                  Assists in ISBN lookup & structured Dewey classification
                </div>
              </div>
            </div>
            <span className="badge badge-success">Connected & Active</span>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
            <div className="form-group">
              <label className="form-label">LLM Studio Local Endpoint</label>
              <input
                type="text"
                className="form-input"
                value={llmEndpoint}
                onChange={(e) => setLlmEndpoint(e.target.value)}
                style={{ fontFamily: 'var(--font-mono)' }}
              />
            </div>
            <div className="form-group">
              <label className="form-label">Model Identifier</label>
              <input
                type="text"
                className="form-input"
                value={llmModel}
                onChange={(e) => setLlmModel(e.target.value)}
                style={{ fontFamily: 'var(--font-mono)' }}
              />
            </div>
          </div>

          <div style={{ fontSize: '12px', color: 'var(--text-secondary)', backgroundColor: 'var(--bg-subtle)', padding: '10px 14px', borderRadius: 'var(--radius-md)' }}>
            ✓ Backend Laravel proxy handles all LLM API communications to protect local network tokens.
          </div>
        </div>

        {/* Circulation Policies */}
        <div className="card" style={{ padding: '24px', marginBottom: '24px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '16px' }}>
            <div className="stat-icon" style={{ backgroundColor: 'var(--warning-bg)', color: 'var(--warning)' }}>
              <BookOpen size={18} />
            </div>
            <div>
              <h3 style={{ fontSize: '16px', fontWeight: 700 }}>Circulation Rules & Policies</h3>
              <div style={{ fontSize: '12px', color: 'var(--text-muted)' }}>
                Loan periods, maximum borrowing allowances, and renewals
              </div>
            </div>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '16px' }}>
            <div className="form-group">
              <label className="form-label">Standard Loan Duration (Days)</label>
              <input
                type="number"
                min="1"
                max="60"
                className="form-input"
                value={loanPeriodDays}
                onChange={(e) => setLoanPeriodDays(Number(e.target.value))}
              />
            </div>
            <div className="form-group">
              <label className="form-label">Max Concurrent Loans / Patron</label>
              <input
                type="number"
                min="1"
                max="10"
                className="form-input"
                value={maxConcurrentLoans}
                onChange={(e) => setMaxConcurrentLoans(Number(e.target.value))}
              />
            </div>
            <div className="form-group">
              <label className="form-label">Allowed Renewals Count</label>
              <input
                type="number"
                min="0"
                max="5"
                className="form-input"
                value={maxRenewals}
                onChange={(e) => setMaxRenewals(Number(e.target.value))}
              />
            </div>
          </div>

          <div
            style={{
              padding: '12px 14px',
              backgroundColor: 'var(--info-bg)',
              color: 'var(--info)',
              borderRadius: 'var(--radius-md)',
              border: '1px solid var(--info-border)',
              fontSize: '12.5px',
              display: 'flex',
              alignItems: 'center',
              gap: '8px'
            }}
          >
            <Shield size={16} />
            <span>
              <strong>Specification Standard:</strong> This public library system operates on community service principles with <strong>NO FINES</strong> module.
            </span>
          </div>
        </div>

        {/* Operating Hours */}
        <div className="card" style={{ padding: '24px', marginBottom: '24px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '16px' }}>
            <div className="stat-icon" style={{ backgroundColor: 'var(--success-bg)', color: 'var(--success)' }}>
              <Clock size={18} />
            </div>
            <div>
              <h3 style={{ fontSize: '16px', fontWeight: 700 }}>Library Operating Schedule</h3>
              <div style={{ fontSize: '12px', color: 'var(--text-muted)' }}>
                Balingasag Public Library, Misamis Oriental
              </div>
            </div>
          </div>

          <div className="form-group">
            <label className="form-label">Public Service Hours</label>
            <input
              type="text"
              className="form-input"
              value={libraryHours}
              onChange={(e) => setLibraryHours(e.target.value)}
            />
          </div>
        </div>

        <button type="submit" className="btn btn-primary">
          Save Configuration Changes
        </button>
      </form>
    </div>
  );
};
