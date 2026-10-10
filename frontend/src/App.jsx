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
  Hospital,
  Languages,
} from "lucide-react";

import HospitalDashboard from "./HospitalDashboard";
import PatientDetailsPage from "./PatientDetailsPage";
import HomePage from "./HomePage";
import LoginSelectionPage from "./LoginSelectionPage";

import "./App.css";

/* =========================
   CARELEKHA LOGO
========================= */

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

/* =========================
   WELCOME PAGE
========================= */

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

        <p className="welcome-description">
          CareLekha helps patients understand prescriptions,
          medicine instructions, and discharge summaries
          in their preferred language.
        </p>

        <button
          type="button"
          className="welcome-button"
          onClick={onGetStarted}
        >
          Get Started
          <ArrowRight size={20} />
        </button>

        <div className="welcome-trust">
          <ShieldCheck size={19} />
          <span>Clear Medicines. Safer Tomorrows.</span>
        </div>
      </section>
    </main>
  );
}

/* =========================
   LANGUAGE SELECTION PAGE
========================= */

function LanguageSelectionPage({
  selectedLanguage,
  onContinue,
  onBack,
}) {
  const [language, setLanguage] = useState(selectedLanguage);

  return (
    <main className="language-page">
      <section className="language-card">
        <button
          type="button"
          className="language-back-button"
          onClick={onBack}
        >
          <ArrowLeft size={18} />
          <span>Back</span>
        </button>

        <CareLekhaLogo />

        <div className="language-icon">
          <Languages size={30} />
        </div>

        <p className="language-eyebrow">
          PERSONALISE YOUR EXPERIENCE
        </p>

        <h1>Choose Your Language</h1>

        <p className="language-description">
          Select your preferred language to continue.
        </p>

        <div className="language-options">
          <button
            type="button"
            className={`language-option ${
              language === "English" ? "selected" : ""
            }`}
            onClick={() => setLanguage("English")}
            aria-pressed={language === "English"}
          >
            <span className="language-option-symbol">
              EN
            </span>

            <span className="language-option-text">
              <strong>English</strong>
              <small>Continue in English</small>
            </span>

            <span className="language-check">
              {language === "English" ? "✓" : ""}
            </span>
          </button>

          <button
            type="button"
            className={`language-option ${
              language === "Malayalam" ? "selected" : ""
            }`}
            onClick={() => setLanguage("Malayalam")}
            aria-pressed={language === "Malayalam"}
          >
            <span className="language-option-symbol malayalam-symbol">
              അ
            </span>

            <span className="language-option-text">
              <strong>മലയാളം</strong>
              <small>മലയാളത്തിൽ തുടരുക</small>
            </span>

            <span className="language-check">
              {language === "Malayalam" ? "✓" : ""}
            </span>
          </button>
        </div>

        <button
          type="button"
          className="language-continue-button"
          onClick={() => onContinue(language)}
        >
          Continue
          <ArrowRight size={19} />
        </button>

        <div className="language-note">
          <ShieldCheck size={16} />
          <span>
            Your healthcare journey, your language.
          </span>
        </div>

        <small className="language-footer">
          CareLekha · Clear Medicines. Safer Tomorrows.
        </small>
      </section>
    </main>
  );
}

/* =========================
   HOSPITAL ADMIN LOGIN
========================= */

function HospitalAdminLogin({ onBack, onLoginSuccess }) {
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState("");

  const [formData, setFormData] = useState({
    hospitalName: "",
    adminId: "",
    email: "",
    password: "",
  });

  function updateField(event) {
    const { name, value } = event.target;

    setFormData((previous) => ({
      ...previous,
      [name]: value,
    }));

    setError("");
  }

  function handleSubmit(event) {
    event.preventDefault();
    setError("");

    if (
      !formData.hospitalName.trim() ||
      !formData.adminId.trim() ||
      !formData.email.trim() ||
      !formData.password
    ) {
      setError("Please fill in all required fields.");
      return;
    }

    if (
      !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(
        formData.email.trim()
      )
    ) {
      setError("Please enter a valid email address.");
      return;
    }

    // Frontend demo login.
    // Connect a backend for real authentication.
    const hospitalProfile = {
      name: formData.hospitalName.trim(),
      hospitalName: formData.hospitalName.trim(),
      adminId: formData.adminId.trim(),
      email: formData.email.trim(),
      role: "hospital",
    };

    try {
      localStorage.setItem(
        "carelekha-profile",
        JSON.stringify(hospitalProfile)
      );
    } catch (storageError) {
      console.error(
        "Could not save hospital profile:",
        storageError
      );
    }

    onLoginSuccess(hospitalProfile);
  }

  return (
    <main className="auth-page">
      <section className="auth-card">
        <button
          type="button"
          className="auth-back-button"
          onClick={onBack}
        >
          <ArrowLeft size={18} />
          <span>Back</span>
        </button>

        <CareLekhaLogo />

        <div className="auth-heading">
          <div className="auth-icon">
            <Hospital size={30} />
          </div>

          <p className="auth-eyebrow">
            HOSPITAL PORTAL
          </p>

          <h1>Hospital Admin Login</h1>

          <p>
            Sign in to access your hospital dashboard.
          </p>
        </div>

        <form onSubmit={handleSubmit}>
          <div className="auth-field">
            <label htmlFor="hospitalName">
              Hospital Name
            </label>

            <div className="auth-input-wrap">
              <Hospital size={19} />

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
          </div>

          <div className="auth-field">
            <label htmlFor="adminId">
              Hospital Admin ID
            </label>

            <div className="auth-input-wrap">
              <User size={19} />

              <input
                id="adminId"
                name="adminId"
                type="text"
                placeholder="Enter admin ID"
                value={formData.adminId}
                onChange={updateField}
                autoComplete="username"
                required
              />
            </div>
          </div>

          <div className="auth-field">
            <label htmlFor="email">
              Email Address
            </label>

            <div className="auth-input-wrap">
              <Mail size={19} />

              <input
                id="email"
                name="email"
                type="email"
                placeholder="Enter email address"
                value={formData.email}
                onChange={updateField}
                autoComplete="email"
                required
              />
            </div>
          </div>

          <div className="auth-field">
            <label htmlFor="password">
              Password
            </label>

            <div className="auth-input-wrap">
              <LockKeyhole size={19} />

              <input
                id="password"
                name="password"
                type={showPassword ? "text" : "password"}
                placeholder="Enter password"
                value={formData.password}
                onChange={updateField}
                autoComplete="current-password"
                required
              />

              <button
                type="button"
                className="auth-eye-button"
                onClick={() =>
                  setShowPassword((previous) => !previous)
                }
                aria-label={
                  showPassword
                    ? "Hide password"
                    : "Show password"
                }
              >
                {showPassword ? (
                  <EyeOff size={19} />
                ) : (
                  <Eye size={19} />
                )}
              </button>
            </div>
          </div>

          {error && (
            <div className="auth-error" role="alert">
              {error}
            </div>
          )}

          <button
            type="submit"
            className="auth-submit-button"
          >
            Login
            <ArrowRight size={19} />
          </button>
        </form>

        <p className="auth-security-note">
          <ShieldCheck size={17} />
          <span>
            Secure access for hospital administrators.
          </span>
        </p>
      </section>
    </main>
  );
}

/* =========================
   MAIN APPLICATION
========================= */

export default function App() {
  const [currentPage, setCurrentPage] = useState("welcome");

  const [selectedRole, setSelectedRole] = useState(null);

  const [selectedLanguage, setSelectedLanguage] =
    useState("English");

  const [profile, setProfile] = useState(null);

  /* WELCOME -> ROLE SELECTION */

  function handleGetStarted() {
    setCurrentPage("role-selection");
  }

  /* ROLE SELECTION */

  function handleRoleSelection(role) {
    setSelectedRole(role);

    if (role === "patient") {
      setSelectedLanguage("English");
      setCurrentPage("language-selection");
    } else if (role === "hospital") {
      setSelectedLanguage("English");
      setCurrentPage("hospital-login");
    }
  }

  /* LANGUAGE -> PATIENT DETAILS */

  function handleLanguageContinue(language) {
    setSelectedLanguage(language);
    setCurrentPage("patient-details");
  }

  /* PATIENT DETAILS -> PATIENT DASHBOARD */

  function handlePatientDetailsContinue(patientDetails) {
    const patientProfile = {
      name:
        patientDetails.name ||
        patientDetails.patientName ||
        "",
      phone:
        patientDetails.phone ||
        patientDetails.patientPhone ||
        "",
      age: patientDetails.age,
      role: "patient",
    };

    setProfile(patientProfile);

    try {
      localStorage.setItem(
        "carelekha-profile",
        JSON.stringify(patientProfile)
      );
    } catch (error) {
      console.error(
        "Could not save patient profile:",
        error
      );
    }

    setCurrentPage("patient-dashboard");
  }

  /* HOSPITAL LOGIN -> HOSPITAL DASHBOARD */

  function handleHospitalLoginSuccess(hospitalProfile) {
    setProfile(hospitalProfile);
    setSelectedLanguage("English");
    setCurrentPage("hospital-dashboard");
  }

  /* LOGOUT */

  function handleLogout() {
    setProfile(null);
    setSelectedRole(null);
    setSelectedLanguage("English");

    try {
      localStorage.removeItem("carelekha-profile");
    } catch (error) {
      console.error("Could not clear profile:", error);
    }

    setCurrentPage("welcome");
  }

  return (
    <>
      {/* 1. WELCOME */}

      {currentPage === "welcome" && (
        <WelcomePage
          onGetStarted={handleGetStarted}
        />
      )}

      {/* 2. ROLE SELECTION */}

      {currentPage === "role-selection" && (
        <LoginSelectionPage
          onHospitalLogin={() =>
            handleRoleSelection("hospital")
          }
          onPatientLogin={() =>
            handleRoleSelection("patient")
          }
          onBack={() =>
            setCurrentPage("welcome")
          }
        />
      )}

      {/* 3. PATIENT LANGUAGE SELECTION */}

      {currentPage === "language-selection" &&
        selectedRole === "patient" && (
          <LanguageSelectionPage
            selectedLanguage={selectedLanguage}
            onContinue={handleLanguageContinue}
            onBack={() =>
              setCurrentPage("role-selection")
            }
          />
        )}

      {/* 4. HOSPITAL ADMIN LOGIN */}

      {currentPage === "hospital-login" &&
        selectedRole === "hospital" && (
          <HospitalAdminLogin
            onBack={() =>
              setCurrentPage("role-selection")
            }
            onLoginSuccess={
              handleHospitalLoginSuccess
            }
          />
        )}

      {/* 5. PATIENT DETAILS */}

      {currentPage === "patient-details" &&
        selectedRole === "patient" && (
          <PatientDetailsPage
            profile={null}
            selectedLanguage={selectedLanguage}
            onBack={() =>
              setCurrentPage("language-selection")
            }
            onContinue={
              handlePatientDetailsContinue
            }
          />
        )}

      {/* 6. PATIENT DASHBOARD */}

      {currentPage === "patient-dashboard" &&
        selectedRole === "patient" &&
        profile && (
          <HomePage
            profile={profile}
            selectedLanguage={selectedLanguage}
            onLogout={handleLogout}
            onEditPatientDetails={() =>
              setCurrentPage("patient-details")
            }
          />
        )}

      {/* 7. HOSPITAL DASHBOARD */}

      {currentPage === "hospital-dashboard" &&
        selectedRole === "hospital" &&
        profile && (
          <HospitalDashboard
            profile={profile}
            onLogout={handleLogout}
          />
        )}
    </>
  );
}