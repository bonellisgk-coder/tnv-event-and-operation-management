import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { Html5QrcodeScanner } from 'html5-qrcode';
import { ArrowLeft, Camera, QrCode, ShieldAlert, CheckCircle } from 'lucide-react';

interface Event {
  id: string;
  title: string;
  slug: string;
}

export const CheckIn: React.FC = () => {
  const { eventId } = useParams();
  const navigate = useNavigate();
  const { apiFetch } = useAuth();

  const [event, setEvent] = useState<Event | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [scanResult, setScanResult] = useState<string | null>(null);
  const [checkingIn, setCheckingIn] = useState(false);
  const [checkedParticipant, setCheckedParticipant] = useState<{
    name: string;
    email: string;
  } | null>(null);

  useEffect(() => {
    if (eventId) {
      fetchEventDetails();
    }
  }, [eventId]);

  useEffect(() => {
    if (!event) return;

    // Initialize HTML5 QR Code Scanner
    const scanner = new Html5QrcodeScanner(
      'reader',
      {
        fps: 10,
        qrbox: { width: 250, height: 250 },
        rememberLastUsedCamera: true
      },
      /* verbose= */ false
    );

    const onScanSuccess = async (decodedText: string) => {
      // Avoid multiple requests for same code
      if (checkingIn) return;
      
      console.log('QR Code Decoded:', decodedText);
      setScanResult(decodedText);
      scanner.clear(); // Stop scanning once successfully decoded

      await processCheckIn(decodedText);
    };

    const onScanFailure = (err: any) => {
      // Standard logging failure, doesn't need alerts as it runs on every frame failure
    };

    scanner.render(onScanSuccess, onScanFailure);

    // Cleanup
    return () => {
      scanner.clear().catch(e => console.error('Failed to clear scanner:', e));
    };
  }, [event]);

  const fetchEventDetails = async () => {
    try {
      setLoading(true);
      const data = await apiFetch(`/events/${eventId}`);
      setEvent(data);
    } catch (err: any) {
      setError(err.message || 'Failed to load event details');
    } finally {
      setLoading(false);
    }
  };

  const processCheckIn = async (decodedUrl: string) => {
    setCheckingIn(true);
    setError('');
    setCheckedParticipant(null);

    try {
      // The QR code contains: http://.../verify/attendance/:id
      // Extract the ID from the URL
      const parts = decodedUrl.split('/');
      const participantId = parts[parts.length - 1];

      if (!participantId || participantId.length < 10) {
        throw new Error('Invalid QR code format. Ensure you scan a valid participant card.');
      }

      // Mark the participant as PRESENT
      const data = await apiFetch(`/participants/${participantId}/status`, {
        method: 'PATCH',
        body: JSON.stringify({ status: 'PRESENT' })
      });

      setCheckedParticipant({
        name: data.name,
        email: data.email
      });
    } catch (err: any) {
      setError(err.message || 'Check-in failed. Participant might not exist or QR code is invalid.');
    } finally {
      setCheckingIn(false);
    }
  };

  const resumeScanning = () => {
    setScanResult(null);
    setCheckedParticipant(null);
    setError('');
    // Reload page or force re-render to start scanner again
    window.location.reload();
  };

  return (
    <div className="space-y-6">
      {/* Top Header */}
      <div className="flex items-center gap-4">
        <button
          onClick={() => navigate(`/dashboard/events/${eventId}`)}
          className="p-2 bg-white hover:bg-gray-light rounded-lg border border-gray-border text-primary transition-all shadow-soft"
        >
          <ArrowLeft className="w-5 h-5" />
        </button>
        <div>
          <h1 className="text-2xl font-bold text-primary font-serif">
            {event ? `Check-In Reader: ${event.title}` : 'QR Check-In'}
          </h1>
          <p className="text-gray-medium text-sm font-medium">Scan attendee registration QR cards to mark them present at the reception desk</p>
        </div>
      </div>

      {loading ? (
        <div className="text-center py-12">
          <div className="animate-spin inline-block w-8 h-8 border-4 border-primary border-t-transparent rounded-full mb-2"></div>
          <p className="text-gray-medium text-sm">Initializing camera checkin reader...</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Scanner Box */}
          <div className="bg-white rounded-xl border border-gray-border shadow-soft p-6 flex flex-col justify-center items-center">
            {!scanResult ? (
              <div className="w-full space-y-4 text-center">
                <div className="inline-flex justify-center items-center w-12 h-12 bg-primary-light text-primary rounded-full mb-2">
                  <Camera className="w-6 h-6" />
                </div>
                <h3 className="font-serif font-bold text-primary text-base">Align QR code inside box</h3>
                
                {/* HTML5 Qrcode element hook */}
                <div id="reader" className="w-full max-w-[320px] mx-auto border border-gray-border overflow-hidden rounded-lg"></div>
              </div>
            ) : (
              <div className="w-full space-y-6 text-center py-8">
                {checkingIn ? (
                  <div>
                    <div className="animate-spin inline-block w-8 h-8 border-4 border-primary border-t-transparent rounded-full mb-2"></div>
                    <p className="text-gray-medium text-sm">Processing verification check-in...</p>
                  </div>
                ) : checkedParticipant ? (
                  <div className="space-y-4">
                    <div className="inline-flex justify-center items-center w-16 h-16 bg-success-light text-success rounded-full border border-success/25">
                      <CheckCircle className="w-8 h-8" />
                    </div>
                    <div>
                      <h4 className="font-serif font-bold text-primary text-lg">Check-In Successful!</h4>
                      <p className="text-sm font-semibold text-gray-dark mt-1">{checkedParticipant.name}</p>
                      <p className="text-xs text-gray-medium font-mono">{checkedParticipant.email}</p>
                    </div>
                  </div>
                ) : (
                  <div className="space-y-4">
                    <div className="inline-flex justify-center items-center w-16 h-16 bg-danger-light text-danger rounded-full border border-danger/25">
                      <ShieldAlert className="w-8 h-8" />
                    </div>
                    <div>
                      <h4 className="font-serif font-bold text-primary text-lg">Verification Failed</h4>
                      <p className="text-xs text-danger mt-1 font-medium">{error || 'An error occurred during verification checkin'}</p>
                    </div>
                  </div>
                )}

                <button
                  onClick={resumeScanning}
                  className="px-6 py-2.5 bg-primary hover:bg-primary-hover text-background font-bold rounded-lg border-b-2 border-accent transition-all text-xs shadow-md inline-flex items-center gap-2"
                >
                  <QrCode className="w-4 h-4" />
                  <span>Scan Next Roster</span>
                </button>
              </div>
            )}
          </div>

          {/* Quick Roster summary panel */}
          <div className="bg-white rounded-xl border border-gray-border shadow-soft p-6 self-start space-y-4">
            <h3 className="font-serif font-bold text-primary text-lg pb-1.5 border-b border-gray-light">
              Reception Manual
            </h3>
            <div className="text-xs text-gray-medium leading-relaxed space-y-2 font-medium">
              <p>1. Open this check-in reader page on any mobile device or webcam-enabled browser.</p>
              <p>2. Ask the volunteer to present their confirmation QR card (available in their registration email).</p>
              <p>3. Align the QR code in the camera center viewport. Upon success, they are marked present automatically.</p>
              <p>4. Alternatively, coordinators can manually check-in volunteers on the <Link to={`/dashboard/events/${eventId}/attendance`} className="text-primary hover:underline font-bold">Event Roster Sheet</Link>.</p>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
