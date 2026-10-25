import React, { useState } from 'react';
import {
  Sparkles,
  Clock,
  Database,
  Download,
  Trash2,
  AlertTriangle,
  CheckCircle,
  Coins,
  Layers,
  Wrench,
  Save,
  Palette,
  X
} from 'lucide-react';
import type { SystemSettings, MemberTierPolicy, DatabaseBackupRecord } from '../../types';
import { StorageService } from '../../utils/storage';
import { ProfileSettingsSkeleton } from '../common/skeleton';
import { ThemeSwitcher } from '../common/ThemeSwitcher';

interface SystemSettingsViewProps {
  onSaveSettingsNotice: () => void;
  onMaintenanceModeChanged?: (active: boolean) => void;
  isLoading?: boolean;
}

export const SystemSettingsView: React.FC<SystemSettingsViewProps> = ({
  onSaveSettingsNotice,
  onMaintenanceModeChanged,
  isLoading = false
}) => {
  // Load initial settings
  const [settings, setSettings] = useState<SystemSettings>(() => StorageService.getSystemSettings());
  const [backups, setBackups] = useState<DatabaseBackupRecord[]>(() => StorageService.getBackups());
  const [activeTab, setActiveTab] = useState<'config' | 'infrastructure' | 'ai_meta'>('config');

  // Confirmation modal state for log purging
  const [isPurgeModalOpen, setIsPurgeModalOpen] = useState(false);
  const [purgeScope, setPurgeScope] = useState<'older_30' | 'older_90' | 'all'>('older_30');
  const [purgeConfirmationText, setPurgeConfirmationText] = useState('');
  const [backupSuccessMessage, setBackupSuccessMessage] = useState<string | null>(null);

  // Editing tier policy modal / inline
  const [editingTier, setEditingTier] = useState<MemberTierPolicy | null>(null);

  if (isLoading) {
    return <ProfileSettingsSkeleton />;
  }

  // Handle general field changes
  const updateSetting = <K extends keyof SystemSettings>(key: K, value: SystemSettings[K]) => {
    setSettings((prev) => ({
      ...prev,
      [key]: value
    }));
  };

  // Save changes to storage
  const handleSaveAll = (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    StorageService.saveSystemSettings(settings);
    if (onMaintenanceModeChanged) {
      onMaintenanceModeChanged(settings.isMaintenanceMode);
    }
    onSaveSettingsNotice();
  };

  // Trigger Database Backup Snapshot
  const handleCreateBackup = () => {
    const { record, jsonData } = StorageService.createBackup('Superadmin');
    setBackups(StorageService.getBackups());

    // Trigger browser file download
    const blob = new Blob([jsonData], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = record.filename;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);

    setBackupSuccessMessage(`Backup "${record.filename}" successfully generated and downloaded.`);
    setTimeout(() => setBackupSuccessMessage(null), 5000);
  };

  // Download previous backup from history
  const handleDownloadHistoricalBackup = (backup: DatabaseBackupRecord) => {
    // Re-create snapshot content representation
    const snapshot = {
      backupId: backup.id,
      filename: backup.filename,
      timestamp: backup.timestamp,
      recordCounts: backup.recordCounts,
      exportedAt: new Date().toISOString()
    };
    const blob = new Blob([JSON.stringify(snapshot, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = backup.filename;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  };

  // Confirm and purge system audit logs
  const handleExecutePurge = () => {
    if (purgeConfirmationText !== 'CONFIRM PURGE') return;
    const count = StorageService.clearAuditLogs(purgeScope, 'Superadmin');
    setIsPurgeModalOpen(false);
    setPurgeConfirmationText('');
    setBackupSuccessMessage(`Successfully cleared ${count} system audit logs.`);
    setTimeout(() => setBackupSuccessMessage(null), 5000);
  };

  // Update a single tier policy
  const handleSaveTierPolicy = (updatedPolicy: MemberTierPolicy) => {
    const updatedPolicies = settings.tierPolicies.map((p) =>
      p.id === updatedPolicy.id ? updatedPolicy : p
    );
    setSettings((prev) => ({
      ...prev,
      tierPolicies: updatedPolicies
    }));
    StorageService.saveSystemSettings({
      ...settings,
      tierPolicies: updatedPolicies
    });
    setEditingTier(null);
  };

  return (
    <div>
      <div className="page-header">
        <div>
          <div className="page-title">Superadmin System Infrastructure</div>
          <div className="page-subtitle">
            Configure global business logic variables, manage data integrity, and oversee system governance
          </div>
        </div>
        <div className="page-actions">
          <button type="button" onClick={() => handleSaveAll()} className="btn btn-primary btn-sm">
            <Save size={15} />
            <span>Save All Configurations</span>
          </button>
        </div>
      </div>

      {backupSuccessMessage && (
        <div
          style={{
            padding: '12px 18px',
            backgroundColor: 'var(--success-bg)',
            color: 'var(--success)',
            border: '1px solid var(--success-border, #86efac)',
            borderRadius: 'var(--radius-md)',
            marginBottom: '20px',
            display: 'flex',
            alignItems: 'center',
            gap: '10px',
            fontSize: '13.5px',
            fontWeight: 600
          }}
        >
          <CheckCircle size={18} />
          <span>{backupSuccessMessage}</span>
        </div>
      )}

      {/* Navigation Tabs */}
      <div
        style={{
          display: 'flex',
          gap: '8px',
          borderBottom: '1px solid var(--border-subtle)',
          marginBottom: '24px'
        }}
      >
        <button
          onClick={() => setActiveTab('config')}
          style={{
            padding: '10px 18px',
            background: 'none',
            border: 'none',
            borderBottom: activeTab === 'config' ? '3px solid var(--brand-green)' : '3px solid transparent',
            color: activeTab === 'config' ? 'var(--brand-green)' : 'var(--text-secondary)',
            fontWeight: activeTab === 'config' ? 700 : 500,
            fontSize: '14px',
            cursor: 'pointer',
            display: 'flex',
            alignItems: 'center',
            gap: '8px'
          }}
        >
          <Coins size={16} />
          <span>System Configuration & Tiers</span>
        </button>

        <button
          onClick={() => setActiveTab('infrastructure')}
          style={{
            padding: '10px 18px',
            background: 'none',
            border: 'none',
            borderBottom: activeTab === 'infrastructure' ? '3px solid var(--brand-green)' : '3px solid transparent',
            color: activeTab === 'infrastructure' ? 'var(--brand-green)' : 'var(--text-secondary)',
            fontWeight: activeTab === 'infrastructure' ? 700 : 500,
            fontSize: '14px',
            cursor: 'pointer',
            display: 'flex',
            alignItems: 'center',
            gap: '8px'
          }}
        >
          <Database size={16} />
          <span>Data & Infrastructure Management</span>
        </button>

        <button
          onClick={() => setActiveTab('ai_meta')}
          style={{
            padding: '10px 18px',
            background: 'none',
            border: 'none',
            borderBottom: activeTab === 'ai_meta' ? '3px solid var(--brand-green)' : '3px solid transparent',
            color: activeTab === 'ai_meta' ? 'var(--brand-green)' : 'var(--text-secondary)',
            fontWeight: activeTab === 'ai_meta' ? 700 : 500,
            fontSize: '14px',
            cursor: 'pointer',
            display: 'flex',
            alignItems: 'center',
            gap: '8px'
          }}
        >
          <Sparkles size={16} />
          <span>AI Cataloging & Municipal Parameters</span>
        </button>
      </div>

      {/* ─────────────────── TAB 1: SYSTEM CONFIGURATION ─────────────────── */}
      {activeTab === 'config' && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '24px', maxWidth: '1000px' }}>
          {/* Workstation Appearance & Theme Standard */}
          <div className="card" style={{ padding: '24px' }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '16px', flexWrap: 'wrap', gap: '12px' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                <div className="stat-icon" style={{ backgroundColor: 'var(--success-bg)', color: 'var(--brand-forest)' }}>
                  <Palette size={18} />
                </div>
                <div>
                  <h3 style={{ fontSize: '16px', fontWeight: 700, margin: 0, color: 'var(--text-primary)' }}>Interface Appearance & Theme Standard</h3>
                  <div style={{ fontSize: '12px', color: 'var(--text-muted)' }}>
                    Choose between Light Mode, Dark Mode, or Automatic System appearance
                  </div>
                </div>
              </div>
            </div>

            <ThemeSwitcher variant="cards" />
          </div>

          {/* Overdue Fines & Circulation Parameters */}
          <div className="card" style={{ padding: '24px' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '16px' }}>
              <div className="stat-icon" style={{ backgroundColor: 'var(--warning-bg)', color: 'var(--warning)' }}>
                <Coins size={18} />
              </div>
              <div>
                <h3 style={{ fontSize: '16px', fontWeight: 700, margin: 0 }}>Global Business Logic & Overdue Fines</h3>
                <div style={{ fontSize: '12px', color: 'var(--text-muted)' }}>
                  Set standard overdue penalty rates, grace windows, and maximum loan durations
                </div>
              </div>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '16px', marginBottom: '20px' }}>
              <div className="form-group">
                <label className="form-label">Default Daily Overdue Fine Rate (₱/day)</label>
                <div style={{ position: 'relative' }}>
                  <span style={{ position: 'absolute', left: '12px', top: '10px', fontWeight: 700, color: 'var(--text-muted)' }}>₱</span>
                  <input
                    type="number"
                    min="0"
                    step="0.50"
                    className="form-input"
                    style={{ paddingLeft: '28px' }}
                    value={settings.dailyFineRate}
                    onChange={(e) => updateSetting('dailyFineRate', parseFloat(e.target.value) || 0)}
                  />
                </div>
                <span style={{ fontSize: '11px', color: 'var(--text-muted)' }}>Accrues per overdue book copy</span>
              </div>

              <div className="form-group">
                <label className="form-label">Grace Period (Days)</label>
                <input
                  type="number"
                  min="0"
                  max="14"
                  className="form-input"
                  value={settings.gracePeriodDays}
                  onChange={(e) => updateSetting('gracePeriodDays', parseInt(e.target.value, 10) || 0)}
                />
                <span style={{ fontSize: '11px', color: 'var(--text-muted)' }}>Days before fines commence</span>
              </div>

              <div className="form-group">
                <label className="form-label">Maximum Fine Cap / Book (₱)</label>
                <div style={{ position: 'relative' }}>
                  <span style={{ position: 'absolute', left: '12px', top: '10px', fontWeight: 700, color: 'var(--text-muted)' }}>₱</span>
                  <input
                    type="number"
                    min="0"
                    step="10"
                    className="form-input"
                    style={{ paddingLeft: '28px' }}
                    value={settings.maxFineCap}
                    onChange={(e) => updateSetting('maxFineCap', parseFloat(e.target.value) || 0)}
                  />
                </div>
                <span style={{ fontSize: '11px', color: 'var(--text-muted)' }}>Maximum cumulative fee</span>
              </div>

              <div className="form-group">
                <label className="form-label">Standard Loan Duration (Days)</label>
                <input
                  type="number"
                  min="1"
                  max="60"
                  className="form-input"
                  value={settings.standardLoanPeriodDays}
                  onChange={(e) => updateSetting('standardLoanPeriodDays', parseInt(e.target.value, 10) || 14)}
                />
                <span style={{ fontSize: '11px', color: 'var(--text-muted)' }}>Default loan window</span>
              </div>

              <div className="form-group">
                <label className="form-label">Max Allowed Renewals</label>
                <input
                  type="number"
                  min="0"
                  max="5"
                  className="form-input"
                  value={settings.maxRenewals}
                  onChange={(e) => updateSetting('maxRenewals', parseInt(e.target.value, 10) || 0)}
                />
                <span style={{ fontSize: '11px', color: 'var(--text-muted)' }}>Permitted book renewals</span>
              </div>

              <div className="form-group">
                <label className="form-label">Renewal Extension (Days)</label>
                <input
                  type="number"
                  min="1"
                  max="30"
                  className="form-input"
                  value={settings.renewalPeriodDays}
                  onChange={(e) => updateSetting('renewalPeriodDays', parseInt(e.target.value, 10) || 7)}
                />
                <span style={{ fontSize: '11px', color: 'var(--text-muted)' }}>Additional days upon renewal</span>
              </div>
            </div>
          </div>

          {/* Member Tier Borrowing Thresholds */}
          <div className="card" style={{ padding: '24px' }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '16px' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                <div className="stat-icon" style={{ backgroundColor: 'var(--info-bg)', color: 'var(--info)' }}>
                  <Layers size={18} />
                </div>
                <div>
                  <h3 style={{ fontSize: '16px', fontWeight: 700, margin: 0 }}>Borrowing Thresholds by Member Tier</h3>
                  <div style={{ fontSize: '12px', color: 'var(--text-muted)' }}>
                    Exclusive Superadmin rules for borrow limits, loan duration, and tier fine rates
                  </div>
                </div>
              </div>
            </div>

            <div className="table-container" style={{ margin: 0 }}>
              <table className="table">
                <thead>
                  <tr>
                    <th>Member Tier</th>
                    <th>Borrow Threshold</th>
                    <th>Loan Period</th>
                    <th>Max Reservations</th>
                    <th>Daily Fine</th>
                    <th>Grace Period</th>
                    <th>Fine Status</th>
                    <th style={{ textAlign: 'right' }}>Action</th>
                  </tr>
                </thead>
                <tbody>
                  {settings.tierPolicies.map((tier) => (
                    <tr key={tier.id}>
                      <td>
                        <div style={{ fontWeight: 700, color: 'var(--text-primary)' }}>{tier.tierName}</div>
                        <div style={{ fontSize: '11.5px', color: 'var(--text-muted)' }}>{tier.description}</div>
                      </td>
                      <td>
                        <span className="badge badge-neutral" style={{ fontWeight: 700 }}>
                          {tier.maxLoanLimit} Books Max
                        </span>
                      </td>
                      <td>{tier.loanPeriodDays} Days</td>
                      <td>{tier.maxReservations} Items</td>
                      <td style={{ fontWeight: 600 }}>
                        {tier.fineExempt ? '₱0.00' : `₱${tier.dailyFineRate.toFixed(2)} / day`}
                      </td>
                      <td>{tier.gracePeriodDays} Days</td>
                      <td>
                        {tier.fineExempt ? (
                          <span className="badge badge-success">Exempt</span>
                        ) : (
                          <span className="badge badge-warning">Standard Fine</span>
                        )}
                      </td>
                      <td style={{ textAlign: 'right' }}>
                        <button
                          type="button"
                          onClick={() => setEditingTier(tier)}
                          className="btn btn-ghost btn-sm"
                        >
                          Edit Tier
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* ─────────────────── TAB 2: DATA & INFRASTRUCTURE ─────────────────── */}
      {activeTab === 'infrastructure' && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '24px', maxWidth: '1000px' }}>
          {/* Maintenance Mode Toggle Card */}
          <div
            className="card"
            style={{
              padding: '24px',
              border: settings.isMaintenanceMode ? '2px solid var(--warning)' : '1px solid var(--border-subtle)',
              backgroundColor: settings.isMaintenanceMode ? '#fffbeb' : '#ffffff'
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '16px' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                <div
                  className="stat-icon"
                  style={{
                    backgroundColor: settings.isMaintenanceMode ? '#fef3c7' : 'var(--bg-subtle)',
                    color: settings.isMaintenanceMode ? '#d97706' : 'var(--text-muted)'
                  }}
                >
                  <Wrench size={18} />
                </div>
                <div>
                  <h3 style={{ fontSize: '16px', fontWeight: 700, margin: 0 }}>System Maintenance Mode</h3>
                  <div style={{ fontSize: '12px', color: 'var(--text-muted)' }}>
                    Pause member operations, loan processing, and public access during infrastructure updates
                  </div>
                </div>
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                <span
                  className={`badge ${settings.isMaintenanceMode ? 'badge-warning' : 'badge-success'}`}
                  style={{ fontSize: '13px', padding: '6px 12px' }}
                >
                  {settings.isMaintenanceMode ? '● Maintenance Active' : '● Operational Normal'}
                </span>
                <button
                  type="button"
                  onClick={() => {
                    const newStatus = !settings.isMaintenanceMode;
                    updateSetting('isMaintenanceMode', newStatus);
                    if (onMaintenanceModeChanged) onMaintenanceModeChanged(newStatus);
                  }}
                  className={`btn btn-sm ${settings.isMaintenanceMode ? 'btn-secondary' : 'btn-primary'}`}
                >
                  {settings.isMaintenanceMode ? 'Turn Off Maintenance' : 'Enable Maintenance'}
                </button>
              </div>
            </div>

            {settings.isMaintenanceMode && (
              <div style={{ marginTop: '16px', display: 'flex', flexDirection: 'column', gap: '14px' }}>
                <div className="form-group">
                  <label className="form-label">Maintenance Announcement Notice</label>
                  <textarea
                    rows={2}
                    className="form-input"
                    value={settings.maintenanceMessage}
                    onChange={(e) => updateSetting('maintenanceMessage', e.target.value)}
                    placeholder="Describe maintenance scope for library patrons..."
                  />
                </div>
                <div
                  style={{
                    padding: '12px 16px',
                    backgroundColor: '#fef3c7',
                    borderRadius: 'var(--radius-md)',
                    border: '1px solid #fde68a',
                    fontSize: '12.5px',
                    color: '#92400e',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '8px'
                  }}
                >
                  <AlertTriangle size={16} />
                  <span>
                    <strong>Patron Notice Preview:</strong> "⚠️ {settings.maintenanceMessage || 'System maintenance in progress.'}"
                  </span>
                </div>
              </div>
            )}
          </div>

          {/* Database Backup Tool */}
          <div className="card" style={{ padding: '24px' }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '16px' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                <div className="stat-icon" style={{ backgroundColor: 'var(--accent-blue-light)', color: 'var(--accent-blue)' }}>
                  <Database size={18} />
                </div>
                <div>
                  <h3 style={{ fontSize: '16px', fontWeight: 700, margin: 0 }}>Database Backup & Integrity Management</h3>
                  <div style={{ fontSize: '12px', color: 'var(--text-muted)' }}>
                    Export live system snapshots containing Books, Members, Transactions, Attendance, and Audit Logs
                  </div>
                </div>
              </div>
              <button
                type="button"
                onClick={handleCreateBackup}
                className="btn btn-primary btn-sm"
              >
                <Download size={15} />
                <span>Initiate Database Backup Snapshot</span>
              </button>
            </div>

            <div className="table-container" style={{ margin: 0 }}>
              <table className="table">
                <thead>
                  <tr>
                    <th>Backup Filename</th>
                    <th>Timestamp</th>
                    <th>Size</th>
                    <th>Records Captured</th>
                    <th>Status</th>
                    <th style={{ textAlign: 'right' }}>Action</th>
                  </tr>
                </thead>
                <tbody>
                  {backups.map((bk) => (
                    <tr key={bk.id}>
                      <td>
                        <div style={{ fontWeight: 600, fontFamily: 'var(--font-mono)', fontSize: '12.5px' }}>
                          {bk.filename}
                        </div>
                        <div style={{ fontSize: '11px', color: 'var(--text-muted)' }}>{bk.notes}</div>
                      </td>
                      <td style={{ fontSize: '12px', color: 'var(--text-secondary)' }}>{bk.timestamp}</td>
                      <td style={{ fontSize: '12.5px' }}>{(bk.sizeBytes / 1024).toFixed(1)} KB</td>
                      <td style={{ fontSize: '12px' }}>
                        {bk.recordCounts.books} Books • {bk.recordCounts.members} Members • {bk.recordCounts.transactions} Loans
                      </td>
                      <td>
                        <span className="badge badge-success">{bk.status}</span>
                      </td>
                      <td style={{ textAlign: 'right' }}>
                        <button
                          type="button"
                          onClick={() => handleDownloadHistoricalBackup(bk)}
                          className="btn btn-ghost btn-sm"
                          title="Download Snapshot File"
                        >
                          <Download size={14} />
                          <span>Export</span>
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          {/* System Logs Clearance Card */}
          <div className="card" style={{ padding: '24px' }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '16px' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                <div className="stat-icon" style={{ backgroundColor: 'var(--danger-bg)', color: 'var(--danger)' }}>
                  <Trash2 size={18} />
                </div>
                <div>
                  <h3 style={{ fontSize: '16px', fontWeight: 700, margin: 0 }}>Clear System Logs & Audit Trails</h3>
                  <div style={{ fontSize: '12px', color: 'var(--text-muted)' }}>
                    Securely purge historical audit logs to reclaim storage space while protecting audit integrity
                  </div>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setIsPurgeModalOpen(true)}
                className="btn btn-danger btn-sm"
              >
                <Trash2 size={15} />
                <span>Purge Audit Logs...</span>
              </button>
            </div>

            <div
              style={{
                fontSize: '12.5px',
                color: 'var(--text-secondary)',
                backgroundColor: 'var(--bg-subtle)',
                padding: '12px 16px',
                borderRadius: 'var(--radius-md)',
                lineHeight: 1.5
              }}
            >
              <strong>Security Protocol:</strong> Clearing logs is an irreversible administrative operation requiring two-step verification. An initial database backup is automatically recommended prior to executing log clearance.
            </div>
          </div>
        </div>
      )}

      {/* ─────────────────── TAB 3: AI & MUNICIPAL PARAMETERS ─────────────────── */}
      {activeTab === 'ai_meta' && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '24px', maxWidth: '1000px' }}>
          {/* LLM Studio API Integration Card */}
          <div className="card" style={{ padding: '24px' }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '16px' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                <div className="stat-icon" style={{ backgroundColor: 'var(--accent-blue-light)', color: 'var(--accent-blue)' }}>
                  <Sparkles size={18} />
                </div>
                <div>
                  <h3 style={{ fontSize: '16px', fontWeight: 700, margin: 0 }}>LLM Studio AI Cataloging Integration</h3>
                  <div style={{ fontSize: '12px', color: 'var(--text-muted)' }}>
                    Local municipal LLM for auto Dewey Decimal classification and ISBN resolution
                  </div>
                </div>
              </div>
              <span className="badge badge-success">Connected & Active</span>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
              <div className="form-group">
                <label className="form-label">LLM Studio Local API Endpoint</label>
                <input
                  type="text"
                  className="form-input"
                  value={settings.llmEndpoint}
                  onChange={(e) => updateSetting('llmEndpoint', e.target.value)}
                  style={{ fontFamily: 'var(--font-mono)' }}
                />
              </div>
              <div className="form-group">
                <label className="form-label">Model Identifier</label>
                <input
                  type="text"
                  className="form-input"
                  value={settings.llmModel}
                  onChange={(e) => updateSetting('llmModel', e.target.value)}
                  style={{ fontFamily: 'var(--font-mono)' }}
                />
              </div>
            </div>
          </div>

          {/* Municipal Operating Metadata */}
          <div className="card" style={{ padding: '24px' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '16px' }}>
              <div className="stat-icon" style={{ backgroundColor: 'var(--success-bg)', color: 'var(--success)' }}>
                <Clock size={18} />
              </div>
              <div>
                <h3 style={{ fontSize: '16px', fontWeight: 700, margin: 0 }}>Municipal Library Identity & Schedule</h3>
                <div style={{ fontSize: '12px', color: 'var(--text-muted)' }}>
                  Official public parameters displayed on landing pages and library receipts
                </div>
              </div>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
              <div className="form-group">
                <label className="form-label">Library Name</label>
                <input
                  type="text"
                  className="form-input"
                  value={settings.libraryName}
                  onChange={(e) => updateSetting('libraryName', e.target.value)}
                />
              </div>
              <div className="form-group">
                <label className="form-label">Operating Schedule</label>
                <input
                  type="text"
                  className="form-input"
                  value={settings.operatingHours}
                  onChange={(e) => updateSetting('operatingHours', e.target.value)}
                />
              </div>
              <div className="form-group">
                <label className="form-label">Official Contact Email</label>
                <input
                  type="email"
                  className="form-input"
                  value={settings.contactEmail}
                  onChange={(e) => updateSetting('contactEmail', e.target.value)}
                />
              </div>
              <div className="form-group">
                <label className="form-label">Contact Phone</label>
                <input
                  type="text"
                  className="form-input"
                  value={settings.contactPhone}
                  onChange={(e) => updateSetting('contactPhone', e.target.value)}
                />
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ─────────────────── EDIT TIER POLICY MODAL ─────────────────── */}
      {editingTier && (
        <div className="modal-backdrop">
          <div className="modal-content" style={{ maxWidth: '520px' }}>
            <div className="modal-header">
              <h3 className="modal-title">Configure Member Tier: {editingTier.tierName}</h3>
              <button
                type="button"
                onClick={() => setEditingTier(null)}
                className="btn-icon"
                aria-label="Close"
              >
                <X size={18} />
              </button>
            </div>
            <div className="modal-body">
              <div className="form-group">
                <label className="form-label">Borrowing Threshold (Max Concurrent Books)</label>
                <input
                  type="number"
                  min="1"
                  max="30"
                  className="form-input"
                  value={editingTier.maxLoanLimit}
                  onChange={(e) =>
                    setEditingTier({
                      ...editingTier,
                      maxLoanLimit: parseInt(e.target.value, 10) || 1
                    })
                  }
                />
              </div>

              <div className="form-group">
                <label className="form-label">Loan Period (Days)</label>
                <input
                  type="number"
                  min="1"
                  max="90"
                  className="form-input"
                  value={editingTier.loanPeriodDays}
                  onChange={(e) =>
                    setEditingTier({
                      ...editingTier,
                      loanPeriodDays: parseInt(e.target.value, 10) || 1
                    })
                  }
                />
              </div>

              <div className="form-group">
                <label className="form-label">Max Active Reservations</label>
                <input
                  type="number"
                  min="1"
                  max="15"
                  className="form-input"
                  value={editingTier.maxReservations}
                  onChange={(e) =>
                    setEditingTier({
                      ...editingTier,
                      maxReservations: parseInt(e.target.value, 10) || 1
                    })
                  }
                />
              </div>

              <div className="form-group">
                <label className="form-label">Daily Fine Rate (₱/day)</label>
                <div style={{ position: 'relative' }}>
                  <span style={{ position: 'absolute', left: '12px', top: '10px', fontWeight: 700, color: 'var(--text-muted)' }}>₱</span>
                  <input
                    type="number"
                    min="0"
                    step="0.5"
                    className="form-input"
                    style={{ paddingLeft: '28px' }}
                    value={editingTier.dailyFineRate}
                    disabled={editingTier.fineExempt}
                    onChange={(e) =>
                      setEditingTier({
                        ...editingTier,
                        dailyFineRate: parseFloat(e.target.value) || 0
                      })
                    }
                  />
                </div>
              </div>

              <div className="form-group">
                <label className="form-label">Grace Period (Days)</label>
                <input
                  type="number"
                  min="0"
                  max="14"
                  className="form-input"
                  value={editingTier.gracePeriodDays}
                  onChange={(e) =>
                    setEditingTier({
                      ...editingTier,
                      gracePeriodDays: parseInt(e.target.value, 10) || 0
                    })
                  }
                />
              </div>

              <div className="form-group" style={{ display: 'flex', alignItems: 'center', gap: '10px', marginTop: '12px' }}>
                <input
                  type="checkbox"
                  id="tierFineExempt"
                  checked={editingTier.fineExempt}
                  onChange={(e) =>
                    setEditingTier({
                      ...editingTier,
                      fineExempt: e.target.checked,
                      dailyFineRate: e.target.checked ? 0 : editingTier.dailyFineRate || 5
                    })
                  }
                  style={{ width: '18px', height: '18px', accentColor: 'var(--brand-green)' }}
                />
                <label htmlFor="tierFineExempt" style={{ fontSize: '14px', fontWeight: 600, cursor: 'pointer' }}>
                  Fine Exempt Status (No overdue charges)
                </label>
              </div>
            </div>
            <div className="modal-footer">
              <button
                type="button"
                onClick={() => setEditingTier(null)}
                className="btn btn-secondary"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={() => handleSaveTierPolicy(editingTier)}
                className="btn btn-primary"
              >
                Apply Changes
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ─────────────────── 2-STEP PURGE LOGS CONFIRMATION MODAL ─────────────────── */}
      {isPurgeModalOpen && (
        <div className="modal-backdrop">
          <div className="modal-content" style={{ maxWidth: '480px' }}>
            <div className="modal-header">
              <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                <div style={{ color: 'var(--danger)' }}>
                  <AlertTriangle size={22} />
                </div>
                <h3 className="modal-title" style={{ color: 'var(--danger)' }}>
                  Confirm Log Clearance
                </h3>
              </div>
              <button
                type="button"
                onClick={() => {
                  setIsPurgeModalOpen(false);
                  setPurgeConfirmationText('');
                }}
                className="btn-icon"
                aria-label="Close"
              >
                <X size={18} />
              </button>
            </div>
            <div className="modal-body">
              <p style={{ fontSize: '13.5px', color: 'var(--text-secondary)', lineHeight: 1.5 }}>
                You are about to permanently purge system logs. This action cannot be undone.
              </p>

              <div className="form-group">
                <label className="form-label">Purge Scope</label>
                <select
                  className="form-input"
                  value={purgeScope}
                  onChange={(e) => setPurgeScope(e.target.value as any)}
                >
                  <option value="older_30">Purge logs older than 30 days</option>
                  <option value="older_90">Purge logs older than 90 days</option>
                  <option value="all">Purge ALL historical audit logs</option>
                </select>
              </div>

              <div className="form-group">
                <label className="form-label">
                  To confirm this destructive action, please type <strong>CONFIRM PURGE</strong> below:
                </label>
                <input
                  type="text"
                  className="form-input"
                  placeholder="CONFIRM PURGE"
                  value={purgeConfirmationText}
                  onChange={(e) => setPurgeConfirmationText(e.target.value)}
                />
              </div>
            </div>
            <div className="modal-footer">
              <button
                type="button"
                onClick={() => {
                  setIsPurgeModalOpen(false);
                  setPurgeConfirmationText('');
                }}
                className="btn btn-secondary"
              >
                Cancel
              </button>
              <button
                type="button"
                disabled={purgeConfirmationText !== 'CONFIRM PURGE'}
                onClick={handleExecutePurge}
                className="btn btn-danger"
              >
                Permanently Purge Logs
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
