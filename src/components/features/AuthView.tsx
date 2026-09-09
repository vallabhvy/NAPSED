import React, { useState } from "react";
import { ArrowRight, Lock } from "lucide-react";
import { signInWithGithub } from "../../services/auth";

const GithubIcon = ({ className = "h-5 w-5" }: { className?: string }) => (
  <svg className={className} fill="currentColor" viewBox="0 0 24 24">
    <path
      fillRule="evenodd"
      clipRule="evenodd"
      d="M12 2C6.477 2 2 6.484 2 12.017c0 4.425 2.865 8.18 6.839 9.504.5.092.682-.217.682-.483 0-.237-.008-.868-.013-1.703-2.782.605-3.369-1.343-3.369-1.343-.454-1.158-1.11-1.466-1.11-1.466-.908-.62.069-.608.069-.608 1.003.07 1.53 1.032 1.53 1.032.892 1.53 2.341 1.088 2.91.832.092-.647.35-1.088.636-1.338-2.22-.253-4.555-1.113-4.555-4.951 0-1.093.39-1.988 1.029-2.688-.103-.253-.446-1.272.098-2.65 0 0 .84-.27 2.75 1.026A9.564 9.564 0 0112 6.844c.85.004 1.705.115 2.504.337 1.909-1.296 2.747-1.027 2.747-1.027.546 1.379.202 2.398.1 2.651.64.7 1.028 1.595 1.028 2.688 0 3.848-2.339 4.695-4.566 4.943.359.309.678.92.678 1.855 0 1.338-.012 2.419-.012 2.747 0 .268.18.58.688.482A10.019 10.019 0 0022 12.017C22 6.484 17.522 2 12 2z"
    />
  </svg>
);

export const AuthView: React.FC = () => {
  const [isLoading, setIsLoading] = useState(false);
  const [authError, setAuthError] = useState<string | null>(null);

  const handleGithubSignIn = async () => {
    setIsLoading(true);
    setAuthError(null);
    try {
      await signInWithGithub("SENIOR");
    } catch (e) {
      console.error("GitHub OAuth failed:", e);
      setAuthError("GITHUB AUTHENTICATION FAILED. PLEASE TRY AGAIN.");
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-[85vh] flex items-center justify-center px-4 py-12 bg-theme-base text-theme-ink font-sans">
      <div className="w-full max-w-md rounded-none chassis-plate p-8 space-y-6">
        {/* Header */}
        <div className="text-center space-y-2">
          <div className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-none recessed-meter text-micro font-mono uppercase tracking-wider text-theme-ink mb-1">
            <Lock className="h-3 w-3 text-theme-ink" />
            <span>GITHUB OAUTH REQUIRED</span>
          </div>
          <h2 className="text-2xl font-extrabold text-theme-ink tracking-tight uppercase">
            NAPSED IDENTITY GATE
          </h2>

          <p className="text-xs text-theme-ink leading-relaxed max-w-xs mx-auto">
            NAPSED ENFORCES VERIFIED PROOF-OF-WORK. ONLY ENGINEERS WITH AN
            ACTIVE GITHUB ACCOUNT CAN REGISTER & SUBMIT AUDITS.
          </p>
        </div>

        {/* GitHub OAuth CTA Button */}
        <div className="pt-2">
          <button
            onClick={handleGithubSignIn}
            disabled={isLoading}
className="w-full flex items-center justify-center gap-3 rounded-none tactile-btn-primary py-3.5 px-4 text-xs uppercase font-bold tracking-wider text-theme-base "
          >
            <GithubIcon className="h-5 w-5" />
            <span>
              {isLoading
                ? "CONNECTING TO GITHUB..."
                : "AUTHENTICATE WITH GITHUB"}
            </span>
            <ArrowRight className="h-4 w-4" />
          </button>
        </div>

        {/* Auth Error Message */}
        {authError && (
          <div className="rounded-none border border-red-700 bg-red-700/10 px-3 py-2.5 text-xs text-red-700 text-center uppercase font-medium tracking-wider">
            {authError}
          </div>
        )}

        {/* Footer Notes */}
        <div className="text-center pt-2 border-t border-theme-ink text-micro font-mono uppercase tracking-wider text-theme-ink/60">
          <span>
            NAPSED NEVER REQUESTS WRITE ACCESS TO YOUR REPOSITORIES.
          </span>
        </div>
      </div>
    </div>
  );
};
