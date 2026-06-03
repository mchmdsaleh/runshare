import { useMemo, useState } from "react";
import { useAuth } from "../../contexts/AuthContext";
import { useNavigate, Link } from "react-router-dom";
import { Mail, Lock, UserPlus, Eye, EyeOff, ArrowRight, Activity, Check } from "lucide-react";

function passwordStrength(password) {
  if (!password) return { score: 0, label: "Too short" };
  let score = 0;
  if (password.length >= 8) score += 1;
  if (/[A-Z]/.test(password)) score += 1;
  if (/[0-9]/.test(password)) score += 1;
  if (/[^A-Za-z0-9]/.test(password)) score += 1;
  const labels = ["Too short", "Weak", "Fair", "Good", "Strong"];
  return { score, label: labels[score] };
}

function Register() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const { register } = useAuth();
  const navigate = useNavigate();

  const strength = useMemo(() => passwordStrength(password), [password]);
  const passwordsMatch = confirm.length > 0 && password === confirm;

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (submitting) return;
    setError("");

    if (password.length < 8) {
      setError("Password must be at least 8 characters long.");
      return;
    }
    if (password !== confirm) {
      setError("Passwords do not match.");
      return;
    }

    setSubmitting(true);
    try {
      await register(email, password);
      navigate("/login");
    } catch (err) {
      setError(
        err.response?.data?.detail ||
        err.message ||
        "Registration failed. Please try again."
      );
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="auth-stage">
      <div className="auth-card" role="dialog" aria-labelledby="auth-register-title">
        <div className="auth-card-head">
          <span className="auth-icon" aria-hidden="true">
            <UserPlus size={20} />
          </span>
          <div>
            <h2 id="auth-register-title" className="auth-title">Create your account</h2>
            <p className="auth-subtitle">Start turning your runs into shareable stories.</p>
          </div>
        </div>

        {error ? <p className="error-message" role="alert">{error}</p> : null}

        <form onSubmit={handleSubmit} className="auth-form" noValidate>
          <div className="form-group">
            <label htmlFor="register-email">Email</label>
            <div className="input-wrap">
              <Mail size={16} className="input-icon" aria-hidden="true" />
              <input
                id="register-email"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="you@runner.app"
                autoComplete="email"
                required
              />
            </div>
          </div>

          <div className="form-group">
            <label htmlFor="register-password">Password</label>
            <div className="input-wrap">
              <Lock size={16} className="input-icon" aria-hidden="true" />
              <input
                id="register-password"
                type={showPassword ? "text" : "password"}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="At least 8 characters"
                autoComplete="new-password"
                required
              />
              <button
                type="button"
                className="input-action"
                onClick={() => setShowPassword((v) => !v)}
                aria-label={showPassword ? "Hide password" : "Show password"}
              >
                {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
              </button>
            </div>
            {password ? (
              <div className="password-strength" aria-live="polite">
                <div className="strength-bar" data-score={strength.score}>
                  <span style={{ width: `${(strength.score / 4) * 100}%` }} />
                </div>
                <span className="strength-label">{strength.label}</span>
              </div>
            ) : null}
          </div>

          <div className="form-group">
            <label htmlFor="register-confirm">Confirm password</label>
            <div className="input-wrap">
              <Lock size={16} className="input-icon" aria-hidden="true" />
              <input
                id="register-confirm"
                type={showPassword ? "text" : "password"}
                value={confirm}
                onChange={(e) => setConfirm(e.target.value)}
                placeholder="Repeat your password"
                autoComplete="new-password"
                required
              />
              {passwordsMatch ? (
                <span className="input-action input-action-static" aria-label="Passwords match">
                  <Check size={16} />
                </span>
              ) : null}
            </div>
          </div>

          <button type="submit" className="btn-primary btn-block" disabled={submitting}>
            {submitting ? "Creating account..." : (
              <>
                <span>Create account</span>
                <ArrowRight size={16} />
              </>
            )}
          </button>
        </form>

        <div className="auth-footer">
          <p>
            Already have an account?{" "}
            <Link to="/login" className="link-accent">Sign in</Link>
          </p>
        </div>

        <div className="auth-aside" aria-hidden="true">
          <Activity size={14} />
          <span>Free forever. Just bring your running shoes.</span>
        </div>
      </div>
    </div>
  );
}

export default Register;
