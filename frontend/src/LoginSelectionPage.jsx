import React from "react";

import {
  ArrowLeft,
  ArrowRight,
  Hospital,
  UserRound,
  ShieldCheck,
} from "lucide-react";

import "./LoginSelectionPage.css";

export default function LoginSelectionPage({
  onHospitalLogin,
  onPatientLogin,
  onBack,
}) {
  return (
    <main className="login-selection-page">
      <section className="login-selection-card">

        {/* BACK BUTTON */}

        <button
          type="button"
          className="selection-back-button"
          onClick={onBack}
        >
          <ArrowLeft size={18} />
          Back
        </button>

        {/* LOGO */}

        <img
          src="/images/carelekha-logo.png"
          alt="CareLekha"
          className="selection-logo"
        />

        {/* HEADING */}

        <div className="selection-icon">
          <ShieldCheck size={30} />
        </div>

        <h1>Welcome to CareLekha</h1>

        <p className="selection-description">
          Please select how you would like to continue.
        </p>

        {/* ROLE OPTIONS */}

        <div className="selection-options">

          {/* PATIENT */}

          <button
            type="button"
            className="selection-option"
            onClick={onPatientLogin}
          >
            <span className="selection-option-icon">
              <UserRound size={28} />
            </span>

            <span className="selection-option-text">
              <strong>Patient</strong>

              <small>
                Understand prescriptions and medicine instructions.
              </small>
            </span>

            <ArrowRight size={20} />
          </button>

          {/* HOSPITAL */}

          <button
            type="button"
            className="selection-option"
            onClick={onHospitalLogin}
          >
            <span className="selection-option-icon">
              <Hospital size={28} />
            </span>

            <span className="selection-option-text">
              <strong>Hospital</strong>

              <small>
                Access the hospital administration dashboard.
              </small>
            </span>

            <ArrowRight size={20} />
          </button>

        </div>

        {/* FOOTER */}

        <p className="selection-footer">
          CareLekha · Clear Medicines. Safer Tomorrows.
        </p>

      </section>
    </main>
  );
}