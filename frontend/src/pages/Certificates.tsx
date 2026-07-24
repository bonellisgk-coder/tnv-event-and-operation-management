import React, { useState, useEffect, useRef } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { API_BASE_URL, SERVER_BASE_URL, safeParseJson } from '../utils/api';
import { Award, Upload, ShieldAlert, CheckCircle, Download } from 'lucide-react';

interface Event {
  id: string;
  title: string;
  slug: string;
}

export const Certificates: React.FC = () => {
  const { apiFetch } = useAuth();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const initialEventId = searchParams.get('eventId') || '';

  const [events, setEvents] = useState<Event[]>([]);
  const [selectedEventId, setSelectedEventId] = useState(initialEventId);
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [generating, setGenerating] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  // Image Upload Template
  const [templateImage, setTemplateImage] = useState<string | null>(null);
  const [imageFile, setImageFile] = useState<{ base64: string; name: string } | null>(null);
  const containerRef = useRef<HTMLDivElement>(null);

  // Field Coordinates Configuration (expressed in percentages for responsive mapping, or absolute relative to image size)
  // Let's store percentages (0-100) and convert to image pixels on backend, or display as percentage overlays!
  // Storing absolute pixels relative to a standard template size or storing percentage (0-100) is standard.
  // Let's store absolute pixel offsets (assuming e.g. a standard 1920x1080 canvas or raw image dimension).
  // Sliders with 0 to 100 percentage values is extremely easy and works beautifully! We can map them.
  const [nameX, setNameX] = useState(50); // percentage
  const [nameY, setNameY] = useState(50); // percentage
  const [nameFontSize, setNameFontSize] = useState(36); // absolute font size in px
  const [nameColor, setNameColor] = useState('#275836'); // Deep Forest Green

  const [qrX, setQrX] = useState(50); // percentage
  const [qrY, setQrY] = useState(80); // percentage
  const [qrSize, setQrSize] = useState(120); // size in px

  useEffect(() => {
    fetchEvents();
    if (selectedEventId) {
      fetchTemplateDetails(selectedEventId);
    }
  }, [selectedEventId]);

  const fetchEvents = async () => {
    try {
      const data = await apiFetch('/events');
      // Only keep events that are Published, Ongoing, or Completed
      const filtered = data.filter((e: any) => e.status !== 'DRAFT');
      setEvents(filtered);
    } catch (err) {
      console.error(err);
    }
  };

  const fetchTemplateDetails = async (eventId: string) => {
    try {
      setLoading(true);
      setError('');
      const data = await apiFetch(`/certificates/templates/${eventId}`);
      
      // Load details
      setTemplateImage(`${SERVER_BASE_URL}${data.imageUrl}`);
      
      // Parse coordinates
      setNameX(data.namePosition.x);
      setNameY(data.namePosition.y);
      setNameFontSize(data.namePosition.fontSize || 36);
      setNameColor(data.namePosition.color || '#275836');
      
      setQrX(data.qrPosition.x);
      setQrY(data.qrPosition.y);
      setQrSize(data.qrPosition.size || 120);
    } catch (err: any) {
      // It is normal to fail if no template exists yet
      setTemplateImage(null);
      setImageFile(null);
    } finally {
      setLoading(false);
    }
  };

  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Must be image
    if (!file.type.startsWith('image/')) {
      setError('Please select a valid image template file (PNG or JPG)');
      return;
    }

    const reader = new FileReader();
    reader.onload = () => {
      const base64 = reader.result as string;
      setTemplateImage(base64);
      setImageFile({ base64, name: file.name });
    };
    reader.readAsDataURL(file);
  };

  const handleSaveTemplate = async () => {
    if (!selectedEventId) {
      setError('Please select an event first');
      return;
    }

    setSaving(true);
    setError('');
    setSuccess('');

    try {
      const payload = {
        eventId: selectedEventId,
        imageBase64: imageFile?.base64 || null,
        imageName: imageFile?.name || null,
        namePosition: {
          x: Math.round(nameX),
          y: Math.round(nameY),
          fontSize: nameFontSize,
          color: nameColor
        },
        qrPosition: {
          x: Math.round(qrX),
          y: Math.round(qrY),
          size: qrSize
        }
      };

      await apiFetch('/certificates/templates', {
        method: 'POST',
        body: JSON.stringify(payload),
      });

      setSuccess('Certificate template layout coordinates saved successfully');
      fetchTemplateDetails(selectedEventId);
      setTimeout(() => setSuccess(''), 3000);
    } catch (err: any) {
      setError(err.message || 'Failed to save template coordinates');
    } finally {
      setSaving(false);
    }
  };

  const downloadBulkCertificates = async () => {
    if (!selectedEventId) return;

    setGenerating(true);
    setError('');
    setSuccess('');

    try {
      const storedToken = localStorage.getItem('tnv_token');
      const response = await fetch(`${API_BASE_URL}/certificates/generate-bulk/${selectedEventId}`, {
        headers: {
          'Authorization': `Bearer ${storedToken}`
        }
      });

      if (!response.ok) {
        const errorData = await safeParseJson(response);
        throw new Error(errorData.error || 'Failed to generate bulk ZIP');
      }

      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `Certificates-Bulk-${selectedEventId.substring(0, 5)}.zip`;
      document.body.appendChild(a);
      a.click();
      a.remove();
      window.URL.revokeObjectURL(url);

      setSuccess('Certificates ZIP archive package successfully generated and downloaded');
      setTimeout(() => setSuccess(''), 4000);
    } catch (err: any) {
      setError(err.message || 'Certificate generation failed. Ensure attendees are marked as PRESENT.');
    } finally {
      setGenerating(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div>
        <h1 className="text-2xl font-bold text-primary font-serif">Certificate Generation Console</h1>
        <p className="text-gray-medium text-sm">Upload certificate template designs, configure field positions visually, and batch download attendee packages</p>
      </div>

      {error && (
        <div className="p-4 bg-danger-light text-danger rounded-xl border border-danger/10 text-sm">
          {error}
        </div>
      )}

      {success && (
        <div className="p-4 bg-success-light text-success rounded-xl border border-success/10 text-sm">
          {success}
        </div>
      )}

      {/* Selector and Layout configuration panel */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        
        {/* Controls Column */}
        <div className="bg-white rounded-xl shadow-soft border border-gray-border p-6 space-y-6 self-start">
          <h3 className="font-serif font-bold text-primary text-lg pb-2 border-b border-gray-light">
            Layout Options
          </h3>

          {/* Select Event */}
          <div className="space-y-2">
            <label className="block text-xs font-semibold text-gray-medium uppercase tracking-wider">Select Active Event</label>
            <select
              className="w-full px-4 py-2.5 rounded-lg border border-gray-border focus:ring-2 focus:ring-primary focus:border-transparent outline-none bg-background/20 font-medium text-sm"
              value={selectedEventId}
              onChange={(e) => setSelectedEventId(e.target.value)}
            >
              <option value="">Choose event...</option>
              {events.map((e) => (
                <option key={e.id} value={e.id}>{e.title}</option>
              ))}
            </select>
          </div>

          {selectedEventId && (
            <>
              {/* Template Image Upload */}
              <div className="space-y-2">
                <label className="block text-xs font-semibold text-gray-medium uppercase tracking-wider">Upload Certificate Template Design</label>
                <div className="relative border-2 border-dashed border-gray-border rounded-lg p-4 text-center hover:bg-background/25 transition-all">
                  <input
                    type="file"
                    accept="image/*"
                    className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
                    onChange={handleImageUpload}
                  />
                  <Upload className="w-8 h-8 text-primary mx-auto mb-2" />
                  <span className="text-xs font-semibold text-primary block">Click or Drag Image File</span>
                  <span className="text-[10px] text-gray-medium block mt-0.5">High-res PNG template background</span>
                </div>
              </div>

              {templateImage && (
                <>
                  {/* Name Placement Controls */}
                  <div className="space-y-3 pt-3 border-t border-gray-light">
                    <span className="block text-xs font-bold text-primary uppercase tracking-wider">Name Placement</span>
                    
                    {/* Name X Slider */}
                    <div>
                      <div className="flex justify-between text-xs font-medium text-gray-medium mb-1">
                        <span>Horizontal Offset (X)</span>
                        <span>{nameX}%</span>
                      </div>
                      <input
                        type="range"
                        min="5"
                        max="95"
                        className="w-full accent-primary"
                        value={nameX}
                        onChange={(e) => setNameX(Number(e.target.value))}
                      />
                    </div>

                    {/* Name Y Slider */}
                    <div>
                      <div className="flex justify-between text-xs font-medium text-gray-medium mb-1">
                        <span>Vertical Offset (Y)</span>
                        <span>{nameY}%</span>
                      </div>
                      <input
                        type="range"
                        min="5"
                        max="95"
                        className="w-full accent-primary"
                        value={nameY}
                        onChange={(e) => setNameY(Number(e.target.value))}
                      />
                    </div>

                    {/* Font Settings */}
                    <div className="grid grid-cols-2 gap-3">
                      <div>
                        <label className="block text-[10px] font-semibold text-gray-medium uppercase mb-1">Font Size (px)</label>
                        <input
                          type="number"
                          className="w-full px-2 py-1.5 rounded border border-gray-border text-xs"
                          value={nameFontSize}
                          onChange={(e) => setNameFontSize(Number(e.target.value))}
                        />
                      </div>
                      <div>
                        <label className="block text-[10px] font-semibold text-gray-medium uppercase mb-1">Font Color (Hex)</label>
                        <input
                          type="color"
                          className="w-full h-8 px-1 rounded border border-gray-border cursor-pointer bg-transparent"
                          value={nameColor}
                          onChange={(e) => setNameColor(e.target.value)}
                        />
                      </div>
                    </div>
                  </div>

                  {/* QR Placement Controls */}
                  <div className="space-y-3 pt-3 border-t border-gray-light">
                    <span className="block text-xs font-bold text-primary uppercase tracking-wider">QR Code Placement</span>

                    {/* QR X */}
                    <div>
                      <div className="flex justify-between text-xs font-medium text-gray-medium mb-1">
                        <span>Horizontal Offset (X)</span>
                        <span>{qrX}%</span>
                      </div>
                      <input
                        type="range"
                        min="5"
                        max="95"
                        className="w-full accent-primary"
                        value={qrX}
                        onChange={(e) => setQrX(Number(e.target.value))}
                      />
                    </div>

                    {/* QR Y */}
                    <div>
                      <div className="flex justify-between text-xs font-medium text-gray-medium mb-1">
                        <span>Vertical Offset (Y)</span>
                        <span>{qrY}%</span>
                      </div>
                      <input
                        type="range"
                        min="5"
                        max="95"
                        className="w-full accent-primary"
                        value={qrY}
                        onChange={(e) => setQrY(Number(e.target.value))}
                      />
                    </div>

                    {/* QR Size */}
                    <div>
                      <label className="block text-[10px] font-semibold text-gray-medium uppercase mb-1">QR Code Block Size (px)</label>
                      <input
                        type="number"
                        className="w-full px-2 py-1.5 rounded border border-gray-border text-xs"
                        value={qrSize}
                        onChange={(e) => setQrSize(Number(e.target.value))}
                      />
                    </div>
                  </div>

                  {/* Operations Buttons */}
                  <div className="pt-4 border-t border-gray-light space-y-3">
                    <button
                      onClick={handleSaveTemplate}
                      disabled={saving}
                      className="w-full py-2.5 bg-primary hover:bg-primary-hover text-background font-bold rounded-lg border-b-2 border-accent transition-all text-xs shadow-md"
                    >
                      {saving ? 'Saving...' : 'Save Configuration'}
                    </button>

                    <button
                      onClick={downloadBulkCertificates}
                      disabled={generating}
                      className="w-full py-2.5 bg-accent hover:bg-accent-hover text-primary font-bold rounded-lg transition-all text-xs shadow-soft flex items-center justify-center gap-2"
                    >
                      <Download className="w-4 h-4" />
                      <span>{generating ? 'Zipping Certificates...' : 'Bulk Generate Certificates (ZIP)'}</span>
                    </button>
                  </div>
                </>
              )}
            </>
          )}
        </div>

        {/* Visual Preview Window Column */}
        <div className="lg:col-span-2 bg-white rounded-xl shadow-soft border border-gray-border p-6 flex flex-col justify-center min-h-[500px]">
          <h3 className="font-serif font-bold text-primary text-lg pb-2 border-b border-gray-light mb-4 self-stretch">
            Layout Preview Window
          </h3>

          {loading ? (
            <div className="text-center flex-grow flex flex-col justify-center items-center">
              <div className="animate-spin inline-block w-8 h-8 border-4 border-primary border-t-transparent rounded-full mb-2"></div>
              <p className="text-gray-medium text-sm">Loading template image file...</p>
            </div>
          ) : !templateImage ? (
            <div className="text-center flex-grow flex flex-col justify-center items-center p-8 bg-background/20 rounded-lg border border-dashed border-gray-border">
              <Award className="w-16 h-16 text-gray-medium opacity-65 mb-3" />
              <h4 className="font-bold font-serif text-primary text-base">Select Event and Upload Design</h4>
              <p className="text-gray-medium text-xs max-w-sm mt-1">Configure layout visually. Choose an event, upload a template layout, and position details using placement sliders.</p>
            </div>
          ) : (
            <div className="flex-grow flex items-center justify-center bg-gray-light p-4 rounded-lg overflow-hidden border border-gray-border">
              {/* Relative layout wrapper mapping percentages */}
              <div 
                ref={containerRef}
                className="relative bg-white shadow-premium border border-gray-border overflow-hidden select-none"
                style={{ width: '100%', maxWidth: '600px', aspectRatio: '4/3' }}
              >
                {/* Background template */}
                <img 
                  src={templateImage} 
                  alt="Template layout visual preview" 
                  className="w-full h-full object-fill pointer-events-none"
                />

                {/* Overlaid visual name block */}
                <div 
                  className="absolute pointer-events-none transform -translate-x-1/2 -translate-y-1/2 flex items-center justify-center font-bold font-serif border border-dashed border-primary/45 px-2 py-0.5 rounded bg-white/60 select-none text-center"
                  style={{ 
                    left: `${nameX}%`, 
                    top: `${nameY}%`,
                    fontSize: `${Math.round(nameFontSize * 0.4)}px`, // scaled preview size
                    color: nameColor
                  }}
                >
                  [Selvan Karthik]
                </div>

                {/* Overlaid visual QR block */}
                <div 
                  className="absolute pointer-events-none transform -translate-x-1/2 -translate-y-1/2 border border-dashed border-accent/75 bg-accent-light bg-opacity-80 flex items-center justify-center text-[10px] font-bold text-accent-hover font-mono shadow-soft"
                  style={{ 
                    left: `${qrX}%`, 
                    top: `${qrY}%`,
                    width: `${Math.round(qrSize * 0.45)}px`,
                    height: `${Math.round(qrSize * 0.45)}px`
                  }}
                >
                  QR CODE
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
