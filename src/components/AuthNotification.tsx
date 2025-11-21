import React from 'react';
import { X, LogIn, UserPlus, Lock } from 'lucide-react';
import { useTheme } from '../contexts/ThemeContext';

interface AuthNotificationProps {
  isOpen: boolean;
  onClose: () => void;
  onLogin: () => void;
  onSignup: () => void;
  message?: string;
}

const AuthNotification: React.FC<AuthNotificationProps> = ({
  isOpen,
  onClose,
  onLogin,
  onSignup,
  message = "This page requires authentication. Please sign in or create an account to continue."
}) => {
  const { theme } = useTheme();
  
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
      <div className="bg-[var(--color-background-surface)] rounded-lg shadow-xl max-w-md w-full border border-[var(--color-divider-gray)]">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-[var(--color-divider-gray)]">
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 rounded-full bg-[var(--color-primary-teal)]/10 flex items-center justify-center">
              <Lock className="w-5 h-5 text-[var(--color-primary-teal)]" />
            </div>
            <div>
              <h3 className="text-lg font-semibold text-[var(--color-text-primary)]">
                Authentication Required
              </h3>
              <p className="text-sm text-[var(--color-text-secondary)]">
                Access restricted
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="text-[var(--color-text-secondary)] hover:text-[var(--color-text-primary)] transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content */}
        <div className="p-6">
          <p className="text-[var(--color-text-primary)] mb-6">
            {message}
          </p>

          {/* Action Buttons */}
          <div className="flex flex-col sm:flex-row gap-3">
            <button
              onClick={onLogin}
              className="flex-1 flex items-center justify-center space-x-2 px-4 py-3 bg-[var(--color-primary-teal)] hover:bg-[var(--color-primary-teal)]/90 text-white rounded-lg transition-colors font-medium"
            >
              <LogIn className="w-4 h-4" />
              <span>Sign In</span>
            </button>
            <button
              onClick={onSignup}
              className="flex-1 flex items-center justify-center space-x-2 px-4 py-3 bg-[var(--color-background-default)] hover:bg-[var(--color-background-surface)] text-[var(--color-text-primary)] border border-[var(--color-divider-gray)] rounded-lg transition-colors font-medium"
            >
              <UserPlus className="w-4 h-4" />
              <span>Create Account</span>
            </button>
          </div>

          {/* Additional Info */}
          <div className="mt-4 p-3 bg-[var(--color-primary-teal)]/5 border border-[var(--color-primary-teal)]/20 rounded-lg">
            <p className="text-sm text-[var(--color-text-primary)]">
              <strong>Free accounts</strong> get access to basic features. 
              <strong> Paid accounts</strong> unlock advanced tools and data.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default AuthNotification;
