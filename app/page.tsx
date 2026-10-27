'use client';

import React, { useState, ChangeEvent, DragEvent } from 'react';

export default function VoiceIngestPage() {
  const [status, setStatus] = useState<string>('');
  const [statusColor, setStatusColor] = useState<string>('#3b82f6');
  const [isDragging, setIsDragging] = useState<boolean>(false);

  const handleUpload = async (file: File) => {
    setStatusColor('#3b82f6');
    setStatus(`Uploading: ${file.name}...`);

    const formData = new FormData();
    formData.append('voiceSample', file);

    try {
      const response = await fetch('/api/upload-voice-processor', {
        method: 'POST',
        body: formData,
      });

      const result = await response.json();

      if (response.ok) {
        setStatusColor('#10b981');
        setStatus('✅ Uploaded cleanly to Supabase storage!');
      } else {
        throw new Error(result.error || 'Server processing error');
      }
    } catch (err: any) {
      setStatusColor('#ef4444');
      setStatus(`❌ Error: ${err.message}`);
    }
  };

  const handleFileChange = (e: ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      handleUpload(e.target.files[0]);
    }
  };

  const handleDrop = (e: DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    setIsDragging(false);
    if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
      handleUpload(e.dataTransfer.files[0]);
    }
  };

  return (
    <div style={styles.container}>
      <div style={styles.card}>
        <h1 style={styles.heading}>Voice Pipeline Ingest</h1>
        <p style={styles.subtext}>
          Upload iOS Lossless M4A recordings directly into the storage pipeline without quality degradation.
        </p>

        <div
          style={{
            ...styles.dropZone,
            borderColor: isDragging ? '#3b82f6' : '#475569',
            backgroundColor: isDragging ? 'rgba(59, 130, 246, 0.05)' : 'rgba(15, 23, 42, 0.2)',
          }}
          onDragOver={(e) => {
            e.preventDefault();
            setIsDragging(true);
          }}
          onDragLeave={(e) => {
            e.preventDefault();
            setIsDragging(false);
          }}
          onDrop={handleDrop}
        >
          <span style={{ fontSize: '2.5rem' }}>🎵</span>
          <p style={{ margin: '12px 0 0 0', color: '#94a3b8', fontSize: '0.9rem' }}>
            Drag file here (Web)<br />or tap below to browse files (Mobile)
          </p>

          <label htmlFor="voice-file" style={styles.fileLabel}>
            Select Audio File
          </label>
          <input
            type="file"
            id="voice-file"
            accept="audio/x-m4a,audio/m4a,audio/*"
            style={{ display: 'none' }}
            onChange={handleFileChange}
          />
        </div>

        {status && (
          <div style={{ ...styles.status, color: statusColor }}>
            {status}
          </div>
        )}
      </div>
    </div>
  );
}

const styles: { [key: string]: React.CSSProperties } = {
  container: {
    backgroundColor: '#0f172a',
    color: '#f8fafc',
    minHeight: '100vh',
    display: 'flex',
    justifyContent: 'center',
    alignItems: 'center',
    padding: '20px',
    boxSizing: 'border-box',
    fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif',
  },
  card: {
    backgroundColor: '#1e293b',
    padding: '32px',
    borderRadius: '16px',
    width: '100%',
    maxWidth: '480px',
    boxShadow: '0 10px 25px -5px rgba(0, 0, 0, 0.3)',
    textAlign: 'center',
  },
  heading: {
    fontSize: '1.5rem',
    marginBottom: '8px',
  },
  subtext: {
    color: '#94a3b8',
    fontSize: '0.9rem',
    marginBottom: '24px',
    lineHeight: 1.4,
  },
  dropZone: {
    border: '2px dashed #475569',
    borderRadius: '12px',
    padding: '40px 20px',
    cursor: 'pointer',
    transition: 'all 0.2s ease',
  },
  fileLabel: {
    display: 'inline-block',
    backgroundColor: '#3b82f6',
    color: '#ffffff',
    padding: '14px 28px',
    borderRadius: '8px',
    fontWeight: 600,
    marginTop: '16px',
    fontSize: '1rem',
    width: '80%',
    cursor: 'pointer',
    boxShadow: '0 4px 6px -1px rgba(59, 130, 246, 0.2)',
  },
  status: {
    marginTop: '20px',
    fontWeight: 500,
    fontSize: '0.95rem',
  },
};