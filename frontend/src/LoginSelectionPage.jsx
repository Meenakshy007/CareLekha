import React from "react";
import {
  Hospital,
  UserRound,
  ArrowRight,
} from "lucide-react";

import "./LoginSelectionPage.css";

const LoginSelectionPage = ({
  onHospitalLogin,
  onPatientLogin,
}) => {
  return (
    <div className="login-selection-page">

      {/* Header */}
      <header className="login-selection-header">
        <div className="login-brand">

          {/* Green and Black CareLekha Logo */}
          <img
            src="/images/carelekha-logo.png"
            alt="CareLekha Logo"
            className="carelekha-logo"
          />

        
          
        </div>
      </header>

      {/* Main Content */}
      <main className="login-selection-main">

        {/* Welcome Section */}
        <section className="login-welcome">
          <span className="login-eyebrow">
            WELCOME TO CARELEKHA
          </span>

          <h2>
            How would you like
            <br />
            to continue?
          </h2>

          <p>
            Choose your account type to access your
            personalized healthcare experience.
          </p>
        </section>

        {/* Login Options */}
        <section className="login-selection-cards">

          {/* Hospital Login Card */}
          <article className="login-selection-card hospital-card">

            <div className="login-card-icon hospital-icon">
              <Hospital
                size={34}
                strokeWidth={1.8}
              />
            </div>

            <span className="login-card-label">
              FOR HEALTHCARE PROVIDERS
            </span>

            <h3>Hospital Login</h3>

            <p>
              Manage patient records, prescriptions,
              and discharge instructions in one place.
            </p>

            <button
              type="button"
              className="login-selection-button hospital-button"
              onClick={onHospitalLogin}
            >
              <span>Continue as Hospital</span>
              <ArrowRight size={18} />
            </button>

          </article>

          {/* Patient Login Card */}
          <article className="login-selection-card patient-card">

            <div className="login-card-icon patient-icon">
              <UserRound
                size={34}
                strokeWidth={1.8}
              />
            </div>

            <span className="login-card-label">
              FOR PATIENTS
            </span>

            <h3>Patient Login</h3>

            <p>
              Access your medical instructions and
              understand your medicines more easily.
            </p>

            <button
              type="button"
              className="login-selection-button patient-button"
              onClick={onPatientLogin}
            >
              <span>Continue as Patient</span>
              <ArrowRight size={18} />
            </button>

          </article>

        </section>

        {/* Footer */}
        <footer className="login-selection-footer">
          <p>Clear Medicines. Safer Tomorrows.</p>
        </footer>

      </main>

    </div>
  );
};

export default LoginSelectionPage;