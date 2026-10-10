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
  Droplets,
  Hospital,
  Volume2,
  Phone,
  ChevronDown,
} from "lucide-react";

import "./PatientDetailsPage.css";

const initialDetails = {
  age: "",
  dateOfBirth: "",
  gender: "Male",
  location: "",
  allergies: "",
  medicalConditions: "",
  additionalInformation: "",
};

export default function PatientDetailsPage({
  profile,
  selectedLanguage = "Malayalam",
  onBack,
  onContinue,
}) {
  const [details, setDetails] = useState(initialDetails);
  const [error, setError] = useState("");

  useEffect(() => {
    try {
      const savedDetails = localStorage.getItem(
        "carelekha-patient-details"
      );

      if (savedDetails) {
        setDetails({
          ...initialDetails,
          ...JSON.parse(savedDetails),
        });
      }
    } catch {
      setDetails(initialDetails);
    }
  }, []);

  const patientName = profile?.name || "Patient";
  const patientPhone = profile?.phone || "";

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

    if (!details.age || Number(details.age) < 1 || Number(details.age) > 120) {
      setError("Please enter a valid age between 1 and 120.");
      return;
    }

    const patientDetails = {
      ...details,
      age: Number(details.age),
      patientName,
      patientPhone,
      updatedAt: new Date().toISOString(),
    };

    localStorage.setItem(
      "carelekha-patient-details",
      JSON.stringify(patientDetails)
    );

    onContinue(patientDetails);
  }

  return (
    <div className="patient-details-app">
      {/* HEADER */}
      <header className="pd-header">
        <div className="pd-header-inner">
          <a href="#patient-details" className="pd-brand">
            <img
              src="/images/carelekha-logo.png"
              alt="CareLekha"
              className="pd-logo"
            />
          </a>

          <div className="pd-header-message">
            <Heart size={18} />
            <span>
              നിങ്ങളുടെ ആരോഗ്യത്തിനായി കരുതലോടെയുള്ള അസിസ്റ്റന്റ്
            </span>
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

      <main className="pd-main" id="patient-details">
        {/* PROGRESS STEPS */}
        <section className="pd-progress">
          <div className="pd-progress-step active">
            <div className="pd-step-icon">
              <UserRound size={23} />
            </div>

            <div>
              <strong>1. രോഗിയുടെ വിവരങ്ങൾ</strong>
              <span>(Patient Details)</span>
            </div>
          </div>

          <div className="pd-progress-step">
            <div className="pd-step-icon">
              <FileText size={22} />
            </div>

            <div>
              <strong>2. കുറിപ്പടി നൽകുക</strong>
              <span>(Upload Prescription)</span>
            </div>
          </div>

          <div className="pd-progress-step">
            <div className="pd-step-icon">
              <ShieldCheck size={22} />
            </div>

            <div>
              <strong>3. വിവരങ്ങൾ പരിശോധിക്കുക</strong>
              <span>(Verify Information)</span>
            </div>
          </div>

          <div className="pd-progress-step">
            <div className="pd-step-icon">
              <CalendarDays size={22} />
            </div>

            <div>
              <strong>4. സമയക്രമം</strong>
              <span>(Daily Routine)</span>
            </div>
          </div>

          <div className="pd-progress-step">
            <div className="pd-step-icon">
              <Volume2 size={22} />
            </div>

            <div>
              <strong>5. ശബ്ദ സഹായം</strong>
              <span>(Audio Guide)</span>
            </div>
          </div>

          <div className="pd-progress-step">
            <div className="pd-step-icon">
              <FileText size={22} />
            </div>

            <div>
              <strong>6. പ്രിന്റ് ചാർട്ട്</strong>
              <span>(Wall Chart)</span>
            </div>
          </div>
        </section>

        {/* MAIN CONTENT */}
        <div className="pd-content-grid">
          <section className="pd-form-card">
            <div className="pd-title-row">
              <div className="pd-title-icon">
                <UserRound size={29} />
              </div>

              <div>
                <h1>കൂടുതൽ രോഗിയുടെ വിവരങ്ങൾ</h1>
                <p>
                  Help us personalise your experience with accurate
                  information.
                </p>
              </div>
            </div>

            {/* EXISTING LOGIN DETAILS */}
            <div className="pd-account-summary">
              <Info size={20} />

              <p>
                <strong>{patientName}</strong>
                {patientPhone && (
                  <>
                    {" "}· +91 {patientPhone}
                  </>
                )}
                <br />

                നിങ്ങളുടെ പേര്, മൊബൈൽ നമ്പർ എന്നിവ അക്കൗണ്ടിൽ നിന്ന്
                ലഭിച്ചതാണ്. വീണ്ടും നൽകേണ്ടതില്ല.
              </p>
            </div>

            <form onSubmit={handleSubmit}>
              <div className="pd-form-grid">
                {/* AGE */}
                <div className="pd-field">
                  <label htmlFor="age">
                    വയസ്സ് <span className="pd-required">*</span>
                  </label>

                  <div className="pd-input-wrap">
                    <CalendarDays size={21} />

                    <input
                      id="age"
                      name="age"
                      type="number"
                      min="1"
                      max="120"
                      placeholder="ഉദാ: 58"
                      value={details.age}
                      onChange={updateField}
                      required
                    />

                    <span className="pd-input-suffix">വയസ്സ്</span>
                  </div>
                </div>

                {/* DOB */}
                <div className="pd-field">
                  <label htmlFor="dateOfBirth">
                    ജനനത്തീയതി <span className="pd-optional">(ഐച്ഛികം)</span>
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

                {/* GENDER */}
                <div className="pd-field">
                  <label>
                    ലിംഗം <span className="pd-optional">(ഐച്ഛികം)</span>
                  </label>

                  <div className="pd-gender-options">
                    <button
                      type="button"
                      className={
                        details.gender === "Male" ? "selected" : ""
                      }
                      onClick={() =>
                        setDetails((previous) => ({
                          ...previous,
                          gender: "Male",
                        }))
                      }
                    >
                      <UserRound size={20} />
                      പുരുഷൻ
                    </button>

                    <button
                      type="button"
                      className={
                        details.gender === "Female" ? "selected" : ""
                      }
                      onClick={() =>
                        setDetails((previous) => ({
                          ...previous,
                          gender: "Female",
                        }))
                      }
                    >
                      <UserRound size={20} />
                      സ്ത്രീ
                    </button>

                    <button
                      type="button"
                      className={
                        details.gender === "Other" ? "selected" : ""
                      }
                      onClick={() =>
                        setDetails((previous) => ({
                          ...previous,
                          gender: "Other",
                        }))
                      }
                    >
                      <UsersRound size={20} />
                      മറ്റുള്ളവർ
                    </button>
                  </div>
                </div>

                {/* LOCATION */}
                <div className="pd-field">
                  <label htmlFor="location">
                    വിലാസം <span className="pd-optional">(ഐച്ഛികം)</span>
                  </label>

                  <div className="pd-input-wrap">
                    <MapPin size={21} />

                    <input
                      id="location"
                      name="location"
                      type="text"
                      placeholder="നിലവിലെ വിലാസം"
                      value={details.location}
                      onChange={updateField}
                    />
                  </div>
                </div>

                {/* ALLERGIES */}
                <div className="pd-field">
                  <label htmlFor="allergies">
                    പരിചിതമായ അലർജികൾ{" "}
                    <span className="pd-optional">(ഐച്ഛികം)</span>
                  </label>

                  <div className="pd-input-wrap">
                    <ShieldCheck size={21} />

                    <input
                      id="allergies"
                      name="allergies"
                      type="text"
                      placeholder="ഉദാ: പെനിസിലിൻ, പൊടി"
                      value={details.allergies}
                      onChange={updateField}
                    />
                  </div>
                </div>

                {/* MEDICAL CONDITIONS */}
                <div className="pd-field">
                  <label htmlFor="medicalConditions">
                    നിലവിലുള്ള ആരോഗ്യ പ്രശ്നങ്ങൾ{" "}
                    <span className="pd-optional">(ഐച്ഛികം)</span>
                  </label>

                  <div className="pd-input-wrap">
                    <Heart size={21} />

                    <input
                      id="medicalConditions"
                      name="medicalConditions"
                      type="text"
                      placeholder="ഉദാ: പ്രമേഹം, രക്തസമ്മർദ്ദം"
                      value={details.medicalConditions}
                      onChange={updateField}
                    />
                  </div>
                </div>

                {/* ADDITIONAL INFORMATION */}
                <div className="pd-field pd-full-width">
                  <label htmlFor="additionalInformation">
                    പ്രധാനമായ ആരോഗ്യ കുറിപ്പുകൾ{" "}
                    <span className="pd-optional">(ഐച്ഛികം)</span>
                  </label>

                  <div className="pd-textarea-wrap">
                    <FileText size={21} />

                    <textarea
                      id="additionalInformation"
                      name="additionalInformation"
                      maxLength={300}
                      rows={3}
                      placeholder="നിങ്ങൾക്ക് പങ്കുവെക്കാനുള്ള മറ്റ് പ്രധാന വിവരങ്ങൾ ഉണ്ടെങ്കിൽ ഇവിടെ നൽകുക."
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

              {/* FORM ACTIONS */}
              <div className="pd-mobile-actions">
                <button
                  type="button"
                  className="pd-back-button"
                  onClick={onBack}
                >
                  <ArrowLeft size={20} />
                  പിന്നോട്ട്
                </button>

                <button type="submit" className="pd-continue-button">
                  സംരക്ഷിച്ച് തുടരുക
                  <ArrowRight size={21} />
                </button>
              </div>
            </form>
          </section>

          {/* RIGHT SIDEBAR */}
          <aside className="pd-sidebar">
            <section className="pd-info-card pd-green-info">
              <div className="pd-info-heading">
                <ShieldCheck size={25} />

                <h2>എന്തിനാണ് ഈ വിവരങ്ങൾ?</h2>
              </div>

              <p>ഈ വിവരങ്ങൾ CareLekha-യ്ക്ക് സഹായകരമാണ്:</p>

              <ul>
                <li>
                  <CheckCircle2 size={21} />
                  <span>
                    നിങ്ങളുടെ മരുന്നുകൾ ശരിയായി മനസ്സിലാക്കാൻ
                  </span>
                </li>

                <li>
                  <CheckCircle2 size={21} />
                  <span>
                    നിങ്ങൾക്കായി വ്യക്തിഗത സമയക്രമം തയ്യാറാക്കാൻ
                  </span>
                </li>

                <li>
                  <CheckCircle2 size={21} />
                  <span>
                    അലർജികളും ആരോഗ്യ പ്രശ്നങ്ങളും പരിഗണിക്കാൻ
                  </span>
                </li>

                <li>
                  <CheckCircle2 size={21} />
                  <span>
                    നിങ്ങളുടെ ആരോഗ്യ യാത്ര കൂടുതൽ ലളിതമാക്കാൻ
                  </span>
                </li>
              </ul>
            </section>

            <section className="pd-info-card pd-yellow-info">
              <div className="pd-info-heading">
                <LockKeyhole size={25} />

                <h2>നിങ്ങളുടെ സ്വകാര്യത സുരക്ഷിതമാണ്</h2>
              </div>

              <p>
                ആവശ്യമായ വിവരങ്ങൾ മാത്രം നൽകുക. ആരോഗ്യ വിവരങ്ങൾ
                സ്വകാര്യമാണ്. യഥാർത്ഥ രോഗികളുടെ വിവരങ്ങൾ കൈകാര്യം
                ചെയ്യുന്നതിന് സുരക്ഷിതമായ സംഭരണവും പ്രവേശന നിയന്ത്രണവും
                ആവശ്യമാണ്.
              </p>
            </section>

            <section className="pd-info-card pd-blue-info">
              <div className="pd-info-heading">
                <FileText size={25} />

                <h2>ആവശ്യമായത് മാത്രം</h2>
              </div>

              <p>
                എല്ലാ ഐച്ഛിക വിവരങ്ങളും നൽകേണ്ടതില്ല. ഇപ്പോൾ പ്രായം
                നൽകിയാൽ മതി. പിന്നീട് നിങ്ങളുടെ കുറിപ്പടിയും
                ഡിസ്ചാർജ് സംഗ്രഹവും ചേർക്കാം.
              </p>
            </section>

            <div className="pd-patient-reminder">
              <Hospital size={19} />

              <span>
                നിങ്ങളുടെ വിവരങ്ങൾ ഡോക്ടറുടെ നിർദ്ദേശങ്ങൾക്ക്
                പകരമല്ല.
              </span>
            </div>
          </aside>
        </div>
      </main>

      {/* FIXED BOTTOM ACTION BAR */}
      <footer className="pd-bottom-bar">
        <div className="pd-bottom-inner">
          <button
            type="button"
            className="pd-back-button"
            onClick={onBack}
          >
            <ArrowLeft size={20} />
            പിന്നോട്ട്
          </button>

          <div className="pd-bottom-message">
            <ShieldCheck size={18} />
            നിങ്ങളുടെ വിവരങ്ങൾ ശ്രദ്ധയോടെ കൈകാര്യം ചെയ്യുക.
          </div>

          <button
            type="button"
            className="pd-continue-button"
            onClick={() => {
              document
                .querySelector(".pd-form-card form")
                ?.requestSubmit();
            }}
          >
            സംരക്ഷിച്ച് തുടരുക
            <ArrowRight size={21} />
          </button>
        </div>
      </footer>
    </div>
  );
}