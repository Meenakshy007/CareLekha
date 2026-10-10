import React, { useState } from "react";
import {
  ArrowLeft,
  ArrowRight,
  ShieldCheck,
  User,
  LockKeyhole,
  Eye,
  EyeOff,
  Mail,
  Phone,
  Hospital,
} from "lucide-react";

import HospitalDashboard from "./HospitalDashboard";
import PatientDetailsPage from "./PatientDetailsPage";
import HomePage from "./HomePage";
import LoginSelectionPage from "./LoginSelectionPage";

import "./App.css";

/* =========================================
   CARELEKHA LOGO
========================================= */

function CareLekhaLogo() {
  return (
    <div className="carelekha-brand">
      <img
        src="/images/carelekha-logo.png"
        alt="CareLekha"
        className="carelekha-logo-image"
      />
    </div>
  );
}

/* =========================================
   PATIENT-FACING MALAYALAM TEXT
========================================= */

const patientText = {
  fullName: "പൂർണ്ണ പേര്",
  email: "ഇമെയിൽ വിലാസം",
  phone: "മൊബൈൽ നമ്പർ",
  password: "പാസ്‌വേഡ്",
  confirmPassword: "പാസ്‌വേഡ് സ്ഥിരീകരിക്കുക",
  enterName: "നിങ്ങളുടെ പേര് നൽകുക",
  enterEmail: "ഇമെയിൽ വിലാസം നൽകുക",
  enterPhone: "മൊബൈൽ നമ്പർ നൽകുക",
  enterPassword: "പാസ്‌വേഡ് നൽകുക",
  enterConfirmPassword: "പാസ്‌വേഡ് വീണ്ടും നൽകുക",
  login: "ലോഗിൻ ചെയ്യുക",
  signup: "അക്കൗണ്ട് സൃഷ്ടിക്കുക",
  back: "തിരികെ",
  noAccount: "അക്കൗണ്ട് ഇല്ലേ?",
  haveAccount: "ഇതിനകം അക്കൗണ്ട് ഉണ്ടോ?",
  required: "ആവശ്യമായ എല്ലാ വിവരങ്ങളും നൽകുക.",
  invalidPhone: "ശരിയായ 10 അക്ക മൊബൈൽ നമ്പർ നൽകുക.",
  invalidEmail: "ശരിയായ ഇമെയിൽ വിലാസം നൽകുക.",
  passwordMismatch: "പാസ്‌വേഡുകൾ തമ്മിൽ പൊരുത്തപ്പെടുന്നില്ല.",
};

/* =========================================
   WELCOME PAGE
========================================= */

function WelcomePage({ onGetStarted }) {
  return (
    <main className="welcome-page">
      <header className="welcome-header">
        <CareLekhaLogo />
      </header>

      <section className="welcome-content">
        <div className="welcome-icon">
          <ShieldCheck size={36} />
        </div>

        <p className="welcome-eyebrow">
          YOUR HEALTH. YOUR LANGUAGE. YOUR PEACE OF MIND.
        </p>

        <h1>
          Healthcare made
          <span> easier to understand.</span>
        </h1>

        <p>
          CareLekha helps patients understand prescriptions,
          medicine instructions, and discharge summaries
          in Malayalam.
        </p>

        <button
          className="welcome-button"
          type="button"
          onClick={onGetStarted}
        >
          Get Started <ArrowRight size={20} />
        </button>

        <div className="welcome-trust">
          <ShieldCheck size={19} />
          <span>Clear Medicines. Safer Tomorrows.</span>
        </div>
      </section>
    </main>
  );
}

/* =========================================
   LOGIN AND SIGN-UP PAGE
   Hospital interface: English
   Patient interface: Malayalam
========================================= */

function AuthPage({
  onBack,
  onLoginSuccess,
  selectedRole,
}) {
  const isHospital = selectedRole === "hospital";

  const [mode, setMode] = useState("login");
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] =
    useState(false);
  const [error, setError] = useState("");

  const [formData, setFormData] = useState({
    fullName: "",
    hospitalName: "",
    email: "",
    phone: "",
    password: "",
    confirmPassword: "",
  });

  const isSignup = mode === "signup";

  function updateField(event) {
    const { name, value } = event.target;

    setFormData((previous) => ({
      ...previous,
      [name]: value,
    }));

    setError("");
  }

  function text(malayalam, english) {
    return isHospital ? english : malayalam;
  }

  function handleSubmit(event) {
    event.preventDefault();
    setError("");

    if (!formData.fullName.trim() || !formData.password) {
      setError(
        text(
          patientText.required,
          "Please complete all required fields."
        )
      );
      return;
    }

    if (isHospital && !formData.hospitalName.trim()) {
      setError("Please enter your hospital name.");
      return;
    }

    if (!/^[6-9]\d{9}$/.test(formData.phone.trim())) {
      setError(
        text(
          patientText.invalidPhone,
          "Enter a valid 10-digit mobile number."
        )
      );
      return;
    }

    if (isSignup) {
      if (!formData.email.trim()) {
        setError(
          text(
            patientText.required,
            "Please enter your email address."
          )
        );
        return;
      }

      if (
        !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(
          formData.email.trim()
        )
      ) {
        setError(
          text(
            patientText.invalidEmail,
            "Please enter a valid email address."
          )
        );
        return;
      }

      if (formData.password !== formData.confirmPassword) {
        setError(
          text(
            patientText.passwordMismatch,
            "Passwords do not match."
          )
        );
        return;
      }
    }

    /*
      FRONTEND DEMO ONLY.

      This creates a local profile and does not authenticate
      against a real hospital or patient account.

      Passwords are not stored in localStorage.
    */

    const profile = {
      name: formData.fullName.trim(),
      email: formData.email.trim(),
      phone: formData.phone.trim(),
      role: selectedRole,
      hospitalName: isHospital
        ? formData.hospitalName.trim()
        : "",
    };

    try {
      localStorage.setItem(
        "carelekha-profile",
        JSON.stringify(profile)
      );
    } catch {
      setError(
        text(
          "പ്രൊഫൈൽ സംരക്ഷിക്കാൻ കഴിഞ്ഞില്ല.",
          "Unable to save your demo profile."
        )
      );
      return;
    }

    onLoginSuccess(profile);
  }

  return (
    <main className="welcome-page">
      <header className="welcome-header">
        <CareLekhaLogo />
      </header>

      <section className="auth-card">
        <button
          type="button"
          className="auth-back-button"
          onClick={onBack}
        >
          <ArrowLeft size={18} />
          {text(patientText.back, "Back")}
        </button>

        <div className="auth-icon">
          {isHospital ? (
            <Hospital size={30} />
          ) : (
            <User size={30} />
          )}
        </div>

        <h1>
          {isHospital
            ? isSignup
              ? "Create Hospital Account"
              : "Hospital Admin Login"
            : isSignup
              ? "അക്കൗണ്ട് സൃഷ്ടിക്കുക"
              : "തിരികെ സ്വാഗതം"}
        </h1>

        <p className="auth-description">
          {isHospital
            ? "Manage patient records, prescriptions, and discharge summaries."
            : isSignup
              ? "തുടങ്ങാൻ നിങ്ങളുടെ അക്കൗണ്ട് സൃഷ്ടിക്കുക."
              : "തുടരാൻ നിങ്ങളുടെ വിവരങ്ങൾ നൽകുക."}
        </p>

        <div className="auth-tabs">
          <button
            type="button"
            className={mode === "login" ? "active" : ""}
            onClick={() => {
              setMode("login");
              setError("");
            }}
          >
            {text(patientText.login, "Login")}
          </button>

          <button
            type="button"
            className={mode === "signup" ? "active" : ""}
            onClick={() => {
              setMode("signup");
              setError("");
            }}
          >
            {text(patientText.signup, "Sign Up")}
          </button>
        </div>

        <form className="auth-form" onSubmit={handleSubmit}>
          {isHospital && (
            <>
              <label htmlFor="hospitalName">Hospital Name</label>

              <div className="auth-input-wrap">
                <Hospital size={18} />

                <input
                  id="hospitalName"
                  name="hospitalName"
                  type="text"
                  placeholder="Enter hospital name"
                  value={formData.hospitalName}
                  onChange={updateField}
                  autoComplete="organization"
                  required
                />
              </div>
            </>
          )}

          <label htmlFor="fullName">
            {text(patientText.fullName, "Admin Name")}
          </label>

          <div className="auth-input-wrap">
            <User size={18} />

            <input
              id="fullName"
              name="fullName"
              type="text"
              placeholder={text(
                patientText.enterName,
                "Enter your name"
              )}
              value={formData.fullName}
              onChange={updateField}
              autoComplete="name"
              required
            />
          </div>

          {isSignup && (
            <>
              <label htmlFor="email">
                {text(patientText.email, "Email Address")}
              </label>

              <div className="auth-input-wrap">
                <Mail size={18} />

                <input
                  id="email"
                  name="email"
                  type="email"
                  placeholder={text(
                    patientText.enterEmail,
                    "Enter your email address"
                  )}
                  value={formData.email}
                  onChange={updateField}
                  autoComplete="email"
                  required
                />
              </div>
            </>
          )}

          <label htmlFor="phone">
            {text(patientText.phone, "Mobile Number")}
          </label>

          <div className="auth-input-wrap">
            <Phone size={18} />

            <span className="auth-country-code">+91</span>

            <input
              id="phone"
              name="phone"
              type="tel"
              inputMode="numeric"
              placeholder={text(
                patientText.enterPhone,
                "Enter 10-digit mobile number"
              )}
              value={formData.phone}
              onChange={updateField}
              maxLength={10}
              autoComplete="tel-national"
              required
            />
          </div>

          <label htmlFor="password">
            {text(patientText.password, "Password")}
          </label>

          <div className="auth-input-wrap">
            <LockKeyhole size={18} />

            <input
              id="password"
              name="password"
              type={showPassword ? "text" : "password"}
              placeholder={text(
                patientText.enterPassword,
                "Enter your password"
              )}
              value={formData.password}
              onChange={updateField}
              autoComplete={
                isSignup ? "new-password" : "current-password"
              }
              required
            />

            <button
              className="auth-eye-button"
              type="button"
              onClick={() =>
                setShowPassword((value) => !value)
              }
              aria-label={
                showPassword ? "Hide password" : "Show password"
              }
            >
              {showPassword ? (
                <EyeOff size={18} />
              ) : (
                <Eye size={18} />
              )}
            </button>
          </div>

          {isSignup && (
            <>
              <label htmlFor="confirmPassword">
                {text(
                  patientText.confirmPassword,
                  "Confirm Password"
                )}
              </label>

              <div className="auth-input-wrap">
                <LockKeyhole size={18} />

                <input
                  id="confirmPassword"
                  name="confirmPassword"
                  type={
                    showConfirmPassword ? "text" : "password"
                  }
                  placeholder={text(
                    patientText.enterConfirmPassword,
                    "Confirm your password"
                  )}
                  value={formData.confirmPassword}
                  onChange={updateField}
                  autoComplete="new-password"
                  required
                />

                <button
                  className="auth-eye-button"
                  type="button"
                  onClick={() =>
                    setShowConfirmPassword((value) => !value)
                  }
                  aria-label={
                    showConfirmPassword
                      ? "Hide confirm password"
                      : "Show confirm password"
                  }
                >
                  {showConfirmPassword ? (
                    <EyeOff size={18} />
                  ) : (
                    <Eye size={18} />
                  )}
                </button>
              </div>
            </>
          )}

          {!isSignup && (
            <button
              type="button"
              className="auth-forgot-button"
              onClick={() =>
                setError(
                  text(
                    "പാസ്‌വേഡ് വീണ്ടെടുക്കൽ ഡെമോയിൽ ലഭ്യമല്ല.",
                    "Password recovery is not available in this demo."
                  )
                )
              }
            >
              {text("പാസ്‌വേഡ് മറന്നോ?", "Forgot Password?")}
            </button>
          )}

          {error && (
            <p className="auth-error" role="alert">
              {error}
            </p>
          )}

          <button className="auth-submit-button" type="submit">
            {isHospital
              ? isSignup
                ? "Create Hospital Account"
                : "Sign In"
              : isSignup
                ? patientText.signup
                : patientText.login}

            <ArrowRight size={18} />
          </button>
        </form>

        <p className="auth-switch">
          {isSignup
            ? text(patientText.haveAccount, "Already have an account?")
            : text(patientText.noAccount, "Don't have an account?")}{" "}

          <button
            type="button"
            onClick={() => {
              setMode(isSignup ? "login" : "signup");
              setError("");
            }}
          >
            {isSignup
              ? text(patientText.login, "Login")
              : text(patientText.signup, "Sign Up")}
          </button>
        </p>

        <p className="auth-security">
          <ShieldCheck size={17} />
          {isHospital
            ? "Frontend demonstration only"
            : "ഇത് ഒരു ഡെമോ ലോഗിൻ സംവിധാനമാണ്."}
        </p>
      </section>
    </main>
  );
}

/* =========================================
   MAIN APPLICATION
========================================= */

export default function App() {
  const [currentPage, setCurrentPage] = useState("welcome");

  const [selectedRole, setSelectedRole] = useState("patient");

  const [profile, setProfile] = useState(() => {
    try {
      const savedProfile = localStorage.getItem("carelekha-profile");

      return savedProfile ? JSON.parse(savedProfile) : null;
    } catch {
      return null;
    }
  });

  function handleRoleSelection(role) {
    setSelectedRole(role);
    setCurrentPage("login");
  }

  function handleLoginSuccess(userProfile) {
    setProfile(userProfile);

    if (selectedRole === "hospital") {
      setCurrentPage("hospital-dashboard");
    } else {
      setCurrentPage("patient-details");
    }
  }

  function handlePatientDetailsContinue() {
    setCurrentPage("home");
  }

  function handleLogout() {
    setProfile(null);

    try {
      localStorage.removeItem("carelekha-profile");
    } catch (error) {
      console.error("Unable to clear demo profile:", error);
    }

    setSelectedRole("patient");
    setCurrentPage("role-selection");
  }

  return (
    <>
      {currentPage === "welcome" && (
        <WelcomePage
          onGetStarted={() =>
            setCurrentPage("role-selection")
          }
        />
      )}

      {currentPage === "role-selection" && (
        <LoginSelectionPage
          onHospitalLogin={() =>
            handleRoleSelection("hospital")
          }
          onPatientLogin={() =>
            handleRoleSelection("patient")
          }
        />
      )}

      {currentPage === "login" && (
        <AuthPage
          key={selectedRole}
          selectedRole={selectedRole}
          onBack={() =>
            setCurrentPage("role-selection")
          }
          onLoginSuccess={handleLoginSuccess}
        />
      )}

      {currentPage === "patient-details" &&
        profile &&
        selectedRole === "patient" && (
          <PatientDetailsPage
            profile={profile}
            selectedLanguage="Malayalam"
            onBack={() => setCurrentPage("login")}
            onContinue={handlePatientDetailsContinue}
          />
        )}

      {currentPage === "home" &&
        profile &&
        selectedRole === "patient" && (
          <HomePage
            profile={profile}
            selectedLanguage="Malayalam"
            onLogout={handleLogout}
            onEditPatientDetails={() =>
              setCurrentPage("patient-details")
            }
          />
        )}

      {currentPage === "hospital-dashboard" &&
        profile &&
        selectedRole === "hospital" && (
          <HospitalDashboard
            profile={profile}
            onLogout={handleLogout}
          />
        )}
    </>
  );
}