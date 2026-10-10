import React, { useState } from "react";
import { ArrowLeft, UserRound } from "lucide-react";
import "./PatientLoginPage.css";

export default function PatientLoginPage({
  language,
  onBack,
  onContinue,
}) {
  const isMalayalam = language === "Malayalam";

  const [form, setForm] = useState({
    name: "",
    age: "",
    phone: "",
  });

  const [error, setError] = useState("");

  const text = {
    title: isMalayalam ? "നിങ്ങളുടെ വിവരങ്ങൾ നൽകുക" : "Enter Your Details",
    subtitle: isMalayalam
      ? "തുടരുന്നതിനായി നിങ്ങളുടെ വിവരങ്ങൾ നൽകുക."
      : "Please provide your details to continue.",
    name: isMalayalam ? "പൂർണ്ണമായ പേര്" : "Full Name",
    age: isMalayalam ? "പ്രായം" : "Age",
    phone: isMalayalam ? "ഫോൺ നമ്പർ" : "Phone Number",
    namePlaceholder: isMalayalam
      ? "നിങ്ങളുടെ പേര് നൽകുക"
      : "Enter your full name",
    agePlaceholder: isMalayalam ? "പ്രായം നൽകുക" : "Enter your age",
    phonePlaceholder: isMalayalam
      ? "10 അക്ക ഫോൺ നമ്പർ"
      : "10-digit phone number",
    continue: isMalayalam ? "തുടരുക" : "Continue",
    back: isMalayalam ? "തിരികെ പോകുക" : "Go Back",
    error: isMalayalam
      ? "ശരിയായ പേര്, പ്രായം, 10 അക്ക ഫോൺ നമ്പർ എന്നിവ നൽകുക."
      : "Please enter a valid name, age, and 10-digit phone number.",
  };

  const handleSubmit = (event) => {
    event.preventDefault();

    const name = form.name.trim();
    const age = Number(form.age);
    const phone = form.phone.replace(/\D/g, "");

    if (
      name.length < 2 ||
      !Number.isInteger(age) ||
      age < 1 ||
      age > 120 ||
      !/^[6-9]\d{9}$/.test(phone)
    ) {
      setError(text.error);
      return;
    }

    setError("");

    onContinue({
      name,
      age,
      phone,
      language,
    });
  };

  return (
    <div className="patient-login-page">
      <div className="patient-login-card">
        <button
          type="button"
          className="patient-back-button"
          onClick={onBack}
        >
          <ArrowLeft size={18} />
          {text.back}
        </button>

        <img
          src="/images/carelekha-logo.png"
          alt="CareLekha"
          className="patient-login-logo"
        />

        <div className="patient-login-icon">
          <UserRound size={28} />
        </div>

        <h1>{text.title}</h1>
        <p className="patient-login-subtitle">{text.subtitle}</p>

        <form onSubmit={handleSubmit}>
          <label htmlFor="patient-name">{text.name}</label>
          <input
            id="patient-name"
            type="text"
            placeholder={text.namePlaceholder}
            value={form.name}
            onChange={(e) =>
              setForm({ ...form, name: e.target.value })
            }
            autoComplete="name"
            required
          />

          <label htmlFor="patient-age">{text.age}</label>
          <input
            id="patient-age"
            type="number"
            placeholder={text.agePlaceholder}
            value={form.age}
            onChange={(e) =>
              setForm({ ...form, age: e.target.value })
            }
            min="1"
            max="120"
            required
          />

          <label htmlFor="patient-phone">{text.phone}</label>
          <input
            id="patient-phone"
            type="tel"
            placeholder={text.phonePlaceholder}
            value={form.phone}
            onChange={(e) =>
              setForm({
                ...form,
                phone: e.target.value.replace(/\D/g, "").slice(0, 10),
              })
            }
            inputMode="numeric"
            autoComplete="tel-national"
            maxLength={10}
            required
          />

          {error && <p className="patient-login-error">{error}</p>}

          <button type="submit" className="patient-login-continue">
            {text.continue}
          </button>
        </form>

        <p className="patient-login-footer">
          CareLekha · Clear Medicines. Safer Tomorrows.
        </p>
      </div>
    </div>
  );
}