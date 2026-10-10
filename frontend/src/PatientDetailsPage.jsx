import { useEffect, useState } from "react";

import {
  ArrowLeft,
  ArrowRight,
  UserRound,
  CalendarDays,
  MapPin,
  ShieldCheck,
  FileText,
  Heart,
  Info,
  LockKeyhole,
  CheckCircle2,
  UsersRound,
  Hospital,
  Volume2,
  Phone,
  ChevronDown,
} from "lucide-react";

import "./PatientDetailsPage.css";

const initialDetails = {
  name: "",
  phone: "",
  age: "",
  dateOfBirth: "",
  gender: "Male",
  location: "",
  allergies: "",
  medicalConditions: "",
  additionalInformation: "",
};

const translations = {
  English: {
    tagline: "A caring assistant for your health",
    title: "Patient Details",
    subtitle: "Enter your basic details to personalise your experience.",
    name: "Full Name",
    phone: "Mobile Number",
    age: "Age",
    dob: "Date of Birth",
    gender: "Gender",
    male: "Male",
    female: "Female",
    other: "Other",
    address: "Address",
    allergies: "Known Allergies",
    conditions: "Existing Medical Conditions",
    additional: "Additional Health Information",
    namePlaceholder: "Enter your full name",
    phonePlaceholder: "Enter your 10-digit mobile number",
    agePlaceholder: "Enter your age",
    addressPlaceholder: "Enter your current address",
    allergiesPlaceholder: "E.g. penicillin, dust",
    conditionsPlaceholder: "E.g. diabetes, blood pressure",
    additionalPlaceholder: "Enter any other important information",
    optional: "(Optional)",
    required: "*",
    back: "Back",
    continue: "Save and Continue",
    privacy: "Your information is private and should be handled securely.",
    infoTitle: "Why do we need these details?",
    infoText: "These details help personalise your medicine instructions and daily routine.",
    reminder: "This information does not replace medical advice.",
    validName: "Please enter your name.",
    validPhone: "Please enter a valid 10-digit Indian mobile number.",
    validAge: "Please enter an age between 1 and 120.",
  },
  Malayalam: {
    tagline: "നിങ്ങളുടെ ആരോഗ്യത്തിനായി കരുതലോടെയുള്ള അസിസ്റ്റന്റ്",
    title: "രോഗിയുടെ വിവരങ്ങൾ",
    subtitle: "നിങ്ങളുടെ അനുഭവം വ്യക്തിഗതമാക്കാൻ വിവരങ്ങൾ നൽകുക.",
    name: "പൂർണ്ണ പേര്",
    phone: "മൊബൈൽ നമ്പർ",
    age: "വയസ്സ്",
    dob: "ജനനത്തീയതി",
    gender: "ലിംഗം",
    male: "പുരുഷൻ",
    female: "സ്ത്രീ",
    other: "മറ്റുള്ളവർ",
    address: "വിലാസം",
    allergies: "അറിയാവുന്ന അലർജികൾ",
    conditions: "നിലവിലുള്ള ആരോഗ്യ പ്രശ്നങ്ങൾ",
    additional: "അധിക ആരോഗ്യ വിവരങ്ങൾ",
    namePlaceholder: "നിങ്ങളുടെ പൂർണ്ണ പേര് നൽകുക",
    phonePlaceholder: "10 അക്ക മൊബൈൽ നമ്പർ നൽകുക",
    agePlaceholder: "വയസ്സ് നൽകുക",
    addressPlaceholder: "നിലവിലെ വിലാസം നൽകുക",
    allergiesPlaceholder: "ഉദാ: പെനിസിലിൻ, പൊടി",
    conditionsPlaceholder: "ഉദാ: പ്രമേഹം, രക്തസമ്മർദ്ദം",
    additionalPlaceholder: "മറ്റ് പ്രധാന വിവരങ്ങൾ നൽകുക",
    optional: "(ഐച്ഛികം)",
    required: "*",
    back: "പിന്നോട്ട്",
    continue: "സംരക്ഷിച്ച് തുടരുക",
    privacy: "നിങ്ങളുടെ വിവരങ്ങൾ സ്വകാര്യമായി സുരക്ഷിതമായി കൈകാര്യം ചെയ്യുക.",
    infoTitle: "എന്തിനാണ് ഈ വിവരങ്ങൾ?",
    infoText: "മരുന്നുകളുടെ നിർദ്ദേശങ്ങളും ദിവസേനയുള്ള സമയക്രമവും വ്യക്തിഗതമാക്കാൻ ഈ വിവരങ്ങൾ സഹായിക്കും.",
    reminder: "ഈ വിവരങ്ങൾ ഡോക്ടറുടെ നിർദ്ദേശങ്ങൾക്ക് പകരമല്ല.",
    validName: "ദയവായി നിങ്ങളുടെ പേര് നൽകുക.",
    validPhone: "ശരിയായ 10 അക്ക മൊബൈൽ നമ്പർ നൽകുക.",
    validAge: "1 മുതൽ 120 വരെയുള്ള ശരിയായ വയസ്സ് നൽകുക.",
  },
};

export default function PatientDetailsPage({
  profile,
  selectedLanguage = "Malayalam",
  onBack,
  onContinue,
}) {
  const t = translations[selectedLanguage] || translations.English;

  const [details, setDetails] = useState(() => ({
    ...initialDetails,
    name: profile?.name || "",
    phone: profile?.phone || "",
  }));

  const [error, setError] = useState("");

  useEffect(() => {
    try {
      const savedDetails = localStorage.getItem(
        "carelekha-patient-details"
      );

      if (savedDetails) {
        const parsed = JSON.parse(savedDetails);

        setDetails((previous) => ({
          ...previous,
          ...parsed,
          name: profile?.name || parsed.name || "",
          phone: profile?.phone || parsed.phone || "",
        }));
      }
    } catch (err) {
      console.error("Unable to load patient details:", err);
    }
  }, [profile?.name, profile?.phone]);

  function updateField(event) {
    const { name, value } = event.target;

    setDetails((previous) => ({
      ...previous,
      [name]: value,
    }));

    setError("");
  }

  function handleSubmit(event) {
    event.preventDefault();
    setError("");

    if (!details.name.trim()) {
      setError(t.validName);
      return;
    }

    if (!/^[6-9]\d{9}$/.test(details.phone.trim())) {
      setError(t.validPhone);
      return;
    }

    const age = Number(details.age);

    if (!details.age || age < 1 || age > 120) {
      setError(t.validAge);
      return;
    }

    const patientDetails = {
      ...details,
      name: details.name.trim(),
      phone: details.phone.trim(),
      age,
      patientName: details.name.trim(),
      patientPhone: details.phone.trim(),
      updatedAt: new Date().toISOString(),
    };

    try {
      localStorage.setItem(
        "carelekha-patient-details",
        JSON.stringify(patientDetails)
      );
    } catch (err) {
      console.error("Unable to save patient details:", err);
    }

    onContinue(patientDetails);
  }

  return (
    <div className="patient-details-app">
      <header className="pd-header">
        <div className="pd-header-inner">
          <div className="pd-brand">
            <img
              src="/images/carelekha-logo.png"
              alt="CareLekha"
              className="pd-logo"
            />
          </div>

          <div className="pd-header-message">
            <Heart size={18} />
            <span>{t.tagline}</span>
          </div>

          <div className="pd-header-actions">
            <span className="pd-language">
              <Volume2 size={17} />
              {selectedLanguage}
              <ChevronDown size={15} />
            </span>

            <a href="tel:108" className="pd-emergency">
              <Phone size={17} />
              108
            </a>
          </div>
        </div>
      </header>

      <main className="pd-main">
        <section className="pd-progress">
          <div className="pd-progress-step active">
            <div className="pd-step-icon">
              <UserRound size={23} />
            </div>
            <div>
              <strong>{t.title}</strong>
              <span>Patient Details</span>
            </div>
          </div>

          <div className="pd-progress-step">
            <div className="pd-step-icon">
              <FileText size={22} />
            </div>
            <div>
              <strong>2. Upload Prescription</strong>
              <span>Prescription</span>
            </div>
          </div>

          <div className="pd-progress-step">
            <div className="pd-step-icon">
              <ShieldCheck size={22} />
            </div>
            <div>
              <strong>3. Verify Information</strong>
              <span>Verification</span>
            </div>
          </div>

          <div className="pd-progress-step">
            <div className="pd-step-icon">
              <CalendarDays size={22} />
            </div>
            <div>
              <strong>4. Daily Routine</strong>
              <span>Schedule</span>
            </div>
          </div>

          <div className="pd-progress-step">
            <div className="pd-step-icon">
              <Volume2 size={22} />
            </div>
            <div>
              <strong>5. Audio Guide</strong>
              <span>Audio</span>
            </div>
          </div>

          <div className="pd-progress-step">
            <div className="pd-step-icon">
              <FileText size={22} />
            </div>
            <div>
              <strong>6. Wall Chart</strong>
              <span>Print</span>
            </div>
          </div>
        </section>

        <div className="pd-content-grid">
          <section className="pd-form-card">
            <div className="pd-title-row">
              <div className="pd-title-icon">
                <UserRound size={29} />
              </div>

              <div>
                <h1>{t.title}</h1>
                <p>{t.subtitle}</p>
              </div>
            </div>

            <div className="pd-account-summary">
              <Info size={20} />
              <p>
                {selectedLanguage === "Malayalam"
                  ? "നിങ്ങളുടെ പേര്, വയസ്സ്, മൊബൈൽ നമ്പർ എന്നിവ നൽകുക."
                  : "Please provide your name, age, and mobile number."}
              </p>
            </div>

            <form onSubmit={handleSubmit}>
              <div className="pd-form-grid">
                <div className="pd-field">
                  <label htmlFor="name">
                    {t.name} <span className="pd-required">*</span>
                  </label>
                  <div className="pd-input-wrap">
                    <UserRound size={21} />
                    <input
                      id="name"
                      name="name"
                      type="text"
                      placeholder={t.namePlaceholder}
                      value={details.name}
                      onChange={updateField}
                      autoComplete="name"
                      required
                    />
                  </div>
                </div>

                <div className="pd-field">
                  <label htmlFor="phone">
                    {t.phone} <span className="pd-required">*</span>
                  </label>
                  <div className="pd-input-wrap">
                    <Phone size={21} />
                    <input
                      id="phone"
                      name="phone"
                      type="tel"
                      inputMode="numeric"
                      maxLength={10}
                      pattern="[6-9][0-9]{9}"
                      placeholder={t.phonePlaceholder}
                      value={details.phone}
                      onChange={updateField}
                      autoComplete="tel"
                      required
                    />
                  </div>
                </div>

                <div className="pd-field">
                  <label htmlFor="age">
                    {t.age} <span className="pd-required">*</span>
                  </label>
                  <div className="pd-input-wrap">
                    <CalendarDays size={21} />
                    <input
                      id="age"
                      name="age"
                      type="number"
                      min="1"
                      max="120"
                      placeholder={t.agePlaceholder}
                      value={details.age}
                      onChange={updateField}
                      required
                    />
                  </div>
                </div>

                <div className="pd-field">
                  <label htmlFor="dateOfBirth">
                    {t.dob} <span className="pd-optional">{t.optional}</span>
                  </label>
                  <div className="pd-input-wrap">
                    <CalendarDays size={21} />
                    <input
                      id="dateOfBirth"
                      name="dateOfBirth"
                      type="date"
                      value={details.dateOfBirth}
                      onChange={updateField}
                    />
                  </div>
                </div>

                <div className="pd-field">
                  <label>{t.gender}</label>
                  <div className="pd-gender-options">
                    {[
                      ["Male", t.male, UserRound],
                      ["Female", t.female, UserRound],
                      ["Other", t.other, UsersRound],
                    ].map(([value, label, Icon]) => (
                      <button
                        key={value}
                        type="button"
                        className={
                          details.gender === value ? "selected" : ""
                        }
                        onClick={() =>
                          setDetails((previous) => ({
                            ...previous,
                            gender: value,
                          }))
                        }
                      >
                        <Icon size={20} />
                        {label}
                      </button>
                    ))}
                  </div>
                </div>

                <div className="pd-field">
                  <label htmlFor="location">
                    {t.address}{" "}
                    <span className="pd-optional">{t.optional}</span>
                  </label>
                  <div className="pd-input-wrap">
                    <MapPin size={21} />
                    <input
                      id="location"
                      name="location"
                      type="text"
                      placeholder={t.addressPlaceholder}
                      value={details.location}
                      onChange={updateField}
                    />
                  </div>
                </div>

                <div className="pd-field">
                  <label htmlFor="allergies">
                    {t.allergies}{" "}
                    <span className="pd-optional">{t.optional}</span>
                  </label>
                  <div className="pd-input-wrap">
                    <ShieldCheck size={21} />
                    <input
                      id="allergies"
                      name="allergies"
                      type="text"
                      placeholder={t.allergiesPlaceholder}
                      value={details.allergies}
                      onChange={updateField}
                    />
                  </div>
                </div>

                <div className="pd-field">
                  <label htmlFor="medicalConditions">
                    {t.conditions}{" "}
                    <span className="pd-optional">{t.optional}</span>
                  </label>
                  <div className="pd-input-wrap">
                    <Heart size={21} />
                    <input
                      id="medicalConditions"
                      name="medicalConditions"
                      type="text"
                      placeholder={t.conditionsPlaceholder}
                      value={details.medicalConditions}
                      onChange={updateField}
                    />
                  </div>
                </div>

                <div className="pd-field pd-full-width">
                  <label htmlFor="additionalInformation">
                    {t.additional}{" "}
                    <span className="pd-optional">{t.optional}</span>
                  </label>
                  <div className="pd-textarea-wrap">
                    <FileText size={21} />
                    <textarea
                      id="additionalInformation"
                      name="additionalInformation"
                      maxLength={300}
                      rows={3}
                      placeholder={t.additionalPlaceholder}
                      value={details.additionalInformation}
                      onChange={updateField}
                    />
                  </div>
                  <div className="pd-character-count">
                    {details.additionalInformation.length}/300
                  </div>
                </div>
              </div>

              {error && (
                <div className="pd-error" role="alert">
                  {error}
                </div>
              )}

              <div className="pd-mobile-actions">
                <button
                  type="button"
                  className="pd-back-button"
                  onClick={onBack}
                >
                  <ArrowLeft size={20} />
                  {t.back}
                </button>

                <button type="submit" className="pd-continue-button">
                  {t.continue}
                  <ArrowRight size={21} />
                </button>
              </div>
            </form>
          </section>

          <aside className="pd-sidebar">
            <section className="pd-info-card pd-green-info">
              <div className="pd-info-heading">
                <ShieldCheck size={25} />
                <h2>{t.infoTitle}</h2>
              </div>
              <p>{t.infoText}</p>
              <ul>
                <li>
                  <CheckCircle2 size={21} />
                  <span>
                    {selectedLanguage === "Malayalam"
                      ? "മരുന്നുകളുടെ നിർദ്ദേശങ്ങൾ മനസ്സിലാക്കാൻ"
                      : "Understand medicine instructions"}
                  </span>
                </li>
                <li>
                  <CheckCircle2 size={21} />
                  <span>
                    {selectedLanguage === "Malayalam"
                      ? "ദിവസേനയുള്ള സമയക്രമം തയ്യാറാക്കാൻ"
                      : "Create a daily medicine routine"}
                  </span>
                </li>
                <li>
                  <CheckCircle2 size={21} />
                  <span>
                    {selectedLanguage === "Malayalam"
                      ? "ആരോഗ്യ വിവരങ്ങൾ പരിഗണിക്കാൻ"
                      : "Consider relevant health information"}
                  </span>
                </li>
              </ul>
            </section>

            <section className="pd-info-card pd-yellow-info">
              <div className="pd-info-heading">
                <LockKeyhole size={25} />
                <h2>
                  {selectedLanguage === "Malayalam"
                    ? "നിങ്ങളുടെ സ്വകാര്യത"
                    : "Your Privacy"}
                </h2>
              </div>
              <p>{t.privacy}</p>
            </section>

            <section className="pd-info-card pd-blue-info">
              <div className="pd-info-heading">
                <FileText size={25} />
                <h2>
                  {selectedLanguage === "Malayalam"
                    ? "ആവശ്യമായത് മാത്രം"
                    : "Only What's Needed"}
                </h2>
              </div>
              <p>
                {selectedLanguage === "Malayalam"
                  ? "ഐച്ഛിക വിവരങ്ങൾ പിന്നീട് നൽകാം."
                  : "Optional details can be added later."}
              </p>
            </section>

            <div className="pd-patient-reminder">
              <Hospital size={19} />
              <span>{t.reminder}</span>
            </div>
          </aside>
        </div>
      </main>

      <footer className="pd-bottom-bar">
        <div className="pd-bottom-inner">
          <button
            type="button"
            className="pd-back-button"
            onClick={onBack}
          >
            <ArrowLeft size={20} />
            {t.back}
          </button>

          <div className="pd-bottom-message">
            <ShieldCheck size={18} />
            {t.privacy}
          </div>

          <button
            type="button"
            className="pd-continue-button"
            onClick={() =>
              document
                .querySelector(".pd-form-card form")
                ?.requestSubmit()
            }
          >
            {t.continue}
            <ArrowRight size={21} />
          </button>
        </div>
      </footer>
    </div>
  );
}