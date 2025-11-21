import React, { useState, useEffect } from 'react';
import { Link, useNavigate, useSearchParams } from 'react-router-dom';
import { CheckCircle, XCircle, Mail } from 'lucide-react';
import AlertModal from '../components/ui/AlertModal';
import PromptModal from '../components/ui/PromptModal';

const VerifyEmailPage: React.FC = () => {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const token = searchParams.get('token');

  const [loading, setLoading] = useState(!!token);
  const [verified, setVerified] = useState(false);
  const [error, setError] = useState('');
  
  const [alertModal, setAlertModal] = useState<{
    isOpen: boolean;
    title: string;
    message: string;
    variant?: 'success' | 'error' | 'warning' | 'info';
  }>({
    isOpen: false,
    title: '',
    message: '',
    variant: 'info',
  });
  
  const [promptModal, setPromptModal] = useState<{
    isOpen: boolean;
    title: string;
    message: string;
    onConfirm: (value: string) => void;
  }>({
    isOpen: false,
    title: '',
    message: '',
    onConfirm: () => {},
  });

  useEffect(() => {
    if (token) {
      verifyEmail(token);
    }
  }, [token]);

  const verifyEmail = async (token: string) => {
    setLoading(true);
    setError('');

    try {
      const response = await fetch(`/api/auth/verify-email?token=${token}`, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
        },
      });

      const data = await response.json();

      if (data.success) {
        setVerified(true);
        setTimeout(() => {
          navigate('/auth');
        }, 3000);
      } else {
        setError(data.error || 'Failed to verify email');
      }
    } catch (err) {
      setError('An error occurred. Please try again later.');
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-[var(--color-bg-primary)] to-[var(--color-bg-secondary)] px-4">
        <div className="max-w-md w-full">
          <div className="bg-[var(--color-card-bg)] rounded-2xl shadow-xl p-8 border border-[var(--color-divider-gray)] text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[var(--color-primary)] mx-auto mb-4"></div>
            <p className="text-[var(--color-text-secondary)]">Verifying your email...</p>
          </div>
        </div>
      </div>
    );
  }

  async function resendVerification(email: string) {
    try {
      const response = await fetch('/api/auth/verify-email', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ email }),
      });

      const data = await response.json();
      if (data.success) {
        setAlertModal({
          isOpen: true,
          title: 'Email Sent',
          message: 'Verification email sent! Please check your inbox.',
          variant: 'success',
        });
      } else {
        setAlertModal({
          isOpen: true,
          title: 'Error',
          message: data.error || 'Failed to send verification email',
          variant: 'error',
        });
      }
    } catch (err) {
      setAlertModal({
        isOpen: true,
        title: 'Error',
        message: 'An error occurred. Please try again later.',
        variant: 'error',
      });
    }
  }

  return (
    <>
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-[var(--color-bg-primary)] to-[var(--color-bg-secondary)] px-4">
        <div className="max-w-md w-full">
          <div className="bg-[var(--color-card-bg)] rounded-2xl shadow-xl p-8 border border-[var(--color-divider-gray)]">
            <div className="text-center mb-6">
              <div className="w-16 h-16 bg-red-100 dark:bg-red-900/20 rounded-full flex items-center justify-center mx-auto mb-4">
                <XCircle className="w-8 h-8 text-red-600 dark:text-red-400" />
              </div>
              <h1 className="text-2xl font-bold text-[var(--color-text-primary)] mb-2">
                Verification Failed
              </h1>
              <p className="text-[var(--color-text-secondary)] mb-4">
                {error || 'Invalid or expired verification link.'}
              </p>
            </div>

            <div className="space-y-3">
              <Link
                to="/auth"
                className="block w-full text-center bg-[var(--color-primary)] text-white py-2 px-4 rounded-lg font-medium hover:bg-[var(--color-primary-hover)] transition-colors"
              >
                Go to Sign In
              </Link>
              <button
                onClick={() => {
                  setPromptModal({
                    isOpen: true,
                    title: 'Resend Verification Email',
                    message: 'Enter your email address to receive a new verification link:',
                    onConfirm: (email) => {
                      setPromptModal(prev => ({ ...prev, isOpen: false }));
                      resendVerification(email);
                    },
                  });
                }}
                className="block w-full text-center text-[var(--color-primary)] hover:underline"
              >
                Resend verification email
              </button>
            </div>
          </div>
        </div>
      </div>
      
      <AlertModal
        isOpen={alertModal.isOpen}
        onClose={() => setAlertModal(prev => ({ ...prev, isOpen: false }))}
        title={alertModal.title}
        message={alertModal.message}
        variant={alertModal.variant}
      />
      
      <PromptModal
        isOpen={promptModal.isOpen}
        onClose={() => setPromptModal(prev => ({ ...prev, isOpen: false }))}
        onConfirm={promptModal.onConfirm}
        title={promptModal.title}
        message={promptModal.message}
        placeholder="Enter your email"
        type="email"
      />
    </>
  );
};

export default VerifyEmailPage;

