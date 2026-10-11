import { convertManglishToMalayalam } from "./utils/manglishConverter";
import React, { useEffect, useRef, useState } from "react";

import {
  Heart,
  Phone,
  FileText,
  ShieldCheck,
  Clock,
  Volume2,
  AlertCircle,
  Printer,
  UserRound,
  CalendarDays,
  Sparkles,
  Upload,
  CheckCircle2,
  Image as ImageIcon,
  Type,
  ChevronRight,
  ClipboardList,
  Menu,
  X,
  UserRoundCheck,
  Activity,
  HeartPulse,
  LogOut,
} from "lucide-react";

import "./HomePage.css";

// Configure with frontend/.env (VITE_CARELEKHA_API_URL).
// The local OCR backend defaults to port 8000.
const API_BASE_URL = import.meta.env.VITE_CARELEKHA_API_URL || "http://127.0.0.1:8000";

const steps = [
  {
    label: "1. രോഗിയുടെ വിവരങ്ങൾ",
    subtitle: "(Patient Details)",
    icon: UserRound,
  },
  {
    label: "2. കുറിപ്പടി നൽകുക",
    subtitle: "(Upload Prescription)",
    icon: FileText,
  },
  {
    label: "3. വിവരങ്ങൾ പരിശോധിക്കുക",
    subtitle: "(Verify Information)",
    icon: ShieldCheck,
  },
  {
    label: "4. സമയക്രമം",
    subtitle: "(Daily Routine)",
    icon: CalendarDays,
  },
  {
    label: "5. ശബ്ദ സഹായം",
    subtitle: "(Audio Guide)",
    icon: Volume2,
  },
  {
    label: "6. പ്രിന്റ് ചാർട്ട്",
    subtitle: "(Wall Chart)",
    icon: Printer,
  },
];

/*
  Read patient details safely from localStorage.
  Multiple possible keys are checked to support
  different versions of the patient-details form.
*/
function readPatientDetails() {
  const possibleKeys = [
    "carelekha-patient-details",
    "carelekha-patient",
    "patientDetails",
    "patient-details",
    "carelekhaPatientDetails",
  ];

  for (const key of possibleKeys) {
    try {
      const saved = localStorage.getItem(key);

      if (saved) {
        const parsed = JSON.parse(saved);

        if (parsed && typeof parsed === "object") {
          return parsed;
        }
      }
    } catch {
      // Ignore invalid stored data and check the next key.
    }
  }

  return {};
}

/*
  Return the first available value from an object.
*/
function getFirstValue(object, keys) {
  for (const key of keys) {
    const value = object?.[key];

    if (
      value !== undefined &&
      value !== null &&
      String(value).trim() !== ""
    ) {
      return value;
    }
  }

  return "";
}

/*
  Format a date for display.
*/
function formatDate(value) {
  if (!value) return "";

  const date = new Date(value);

  if (Number.isNaN(date.getTime())) {
    return String(value);
  }

  return date.toLocaleDateString("en-GB");
}

export default function HomePage({
  profile,
  selectedLanguage,
  onLogout,
}) {
  const [activeStep, setActiveStep] = useState(1);
  const [inputMode, setInputMode] = useState("upload");
  const [uploadedFile, setUploadedFile] = useState(null);
  const [manualText, setManualText] = useState("");
  const [isConverting, setIsConverting] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [message, setMessage] = useState("");
  const [reviewResult, setReviewResult] = useState(null);
  const [isProcessing, setIsProcessing] = useState(false);
  const [reviewConfirmed, setReviewConfirmed] = useState({});
  const [audioStatus, setAudioStatus] = useState("");
  const [speakingMedicineIndex, setSpeakingMedicineIndex] = useState(null);
  const [scheduleDrafts, setScheduleDrafts] = useState({});
  const [scheduleResults, setScheduleResults] = useState({});
  const [scheduleLoading, setScheduleLoading] = useState({});
  const [scheduleErrors, setScheduleErrors] = useState({});

  const conversionTimer = useRef(null);
  const fileInputRef = useRef(null);

  /*
    Automatically convert Manglish to Malayalam
    after the user stops typing for one second.

    If the text already contains Malayalam characters,
    conversion is skipped.
  */
  useEffect(() => {
    if (!manualText.trim()) {
      setIsConverting(false);
      return undefined;
    }

    // Skip conversion when Malayalam characters are present.
    if (/[\u0D00-\u0D7F]/.test(manualText)) {
      setIsConverting(false);
      return undefined;
    }

    if (conversionTimer.current) {
      clearTimeout(conversionTimer.current);
    }

    let isCurrent = true;

    conversionTimer.current = setTimeout(async () => {
      setIsConverting(true);

      try {
        const convertedText = await Promise.resolve(
          convertManglishToMalayalam(manualText)
        );

        if (
          isCurrent &&
          typeof convertedText === "string" &&
          convertedText.trim() &&
          convertedText !== manualText
        ) {
          setManualText(convertedText);
        }
      } catch (error) {
        console.error(
          "Manglish conversion failed:",
          error
        );
      } finally {
        if (isCurrent) {
          setIsConverting(false);
        }
      }
    }, 1000);

    return () => {
      isCurrent = false;

      if (conversionTimer.current) {
        clearTimeout(conversionTimer.current);
      }
    };
  }, [manualText]);

  /*
    Patient details entered on the previous page.
  */
  const patientDetails = readPatientDetails();

  /*
    Account details from the login/signup page.
  */
  const patientName =
    getFirstValue(patientDetails, [
      "fullName",
      "patientName",
      "name",
      "full_name",
    ]) ||
    getFirstValue(profile, [
      "fullName",
      "name",
      "username",
    ]) ||
    "Patient";

  const age = getFirstValue(patientDetails, [
    "age",
    "patientAge",
  ]);

  const dateOfBirth = getFirstValue(patientDetails, [
    "dateOfBirth",
    "dob",
    "birthDate",
  ]);

  const gender = getFirstValue(patientDetails, [
    "gender",
    "sex",
  ]);

  const location = getFirstValue(patientDetails, [
    "location",
    "address",
    "place",
  ]);

  const conditions = getFirstValue(patientDetails, [
    "medicalConditions",
    "conditions",
    "existingConditions",
    "medicalHistory",
  ]);

  const allergies = getFirstValue(patientDetails, [
    "allergies",
    "knownAllergies",
  ]);

  const otherInformation = getFirstValue(patientDetails, [
    "otherInformation",
    "additionalInformation",
    "notes",
    "otherDetails",
  ]);

  const hospital = getFirstValue(patientDetails, [
    "hospital",
    "hospitalName",
    "healthcareFacility",
  ]);

  const language =
    typeof selectedLanguage === "object"
      ? selectedLanguage?.name ||
        selectedLanguage?.label ||
        "Malayalam"
      : selectedLanguage || "Malayalam";

  /*
    Select and validate a prescription document.
  */
  function handleFileChange(event) {
    const file = event.target.files?.[0];

    if (!file) return;

    // The current OCR endpoint supports image files only, not PDFs.
    const allowedTypes = ["image/jpeg", "image/png", "image/webp"];

    if (!allowedTypes.includes(file.type)) {
      setMessage(
        "Please select a JPG, PNG, or WEBP image. PDF extraction is not supported yet."
      );

      event.target.value = "";
      return;
    }

    if (file.size > 10 * 1024 * 1024) {
      setMessage(
        "Please select a file smaller than 10 MB."
      );

      event.target.value = "";
      return;
    }

    setUploadedFile(file);
    setInputMode("upload");
    setReviewResult(null);
    setReviewConfirmed({});
    setAudioStatus("");
    setSpeakingMedicineIndex(null);
    setScheduleDrafts({});
    setScheduleResults({});
    setScheduleLoading({});
    setScheduleErrors({});
    setMessage("");
  }

  /*
    Analyze the uploaded image with OCR, ML candidate retrieval,
    and safety identity review. ML candidates never overwrite OCR text.
  */
  async function handleContinue() {
    setMessage("");
    setReviewResult(null);
    setReviewConfirmed({});
    setAudioStatus("");
    setSpeakingMedicineIndex(null);
    setScheduleDrafts({});
    setScheduleResults({});
    setScheduleLoading({});
    setScheduleErrors({});
    if ("speechSynthesis" in window) window.speechSynthesis.cancel();

    if (inputMode === "upload" && !uploadedFile) {
      setMessage("Please upload a prescription image first.");
      return;
    }

    if (inputMode === "text") {
      setMessage("Text-only review is not connected yet. Please use an image upload for this demo.");
      return;
    }

    if (!["image/jpeg", "image/png", "image/webp"].includes(uploadedFile.type)) {
      setMessage("Only JPG, PNG, and WEBP images are supported.");
      return;
    }

    setIsProcessing(true);
    try {
      const formData = new FormData();
      formData.append("file", uploadedFile);
      const response = await fetch(`${API_BASE_URL}/extract-and-review`, {
        method: "POST",
        body: formData,
      });
      const payload = await response.json().catch(() => ({}));
      if (!response.ok) {
        throw new Error(payload.detail || `Prescription analysis failed (HTTP ${response.status}).`);
      }

      setReviewResult(payload);
      setActiveStep(2);
      setMessage("Analysis finished. Review every field against the original prescription. Matches are suggestions, not verified identities.");

      try {
        localStorage.setItem("carelekha-prescription-input", JSON.stringify({
          inputMode: "upload",
          fileName: uploadedFile.name,
          fileType: uploadedFile.type,
          submittedAt: new Date().toISOString(),
          processingStatus: "review_required",
        }));
      } catch (storageError) {
        console.warn("Could not save prescription metadata:", storageError);
      }
    } catch (error) {
      console.error("CareLekha review failed:", error);
      setMessage(error instanceof TypeError
        ? "Cannot connect to the OCR API. Check that the backend URL is correct, the OCR service is running, and CORS allows this frontend origin."
        : error.message || "Prescription analysis failed. Please try again.");
    } finally {
      setIsProcessing(false);
    }
  }

  /*
    Speak only OCR fields that the user has compared with the original image.
    This confirms transcription review, not clinical approval.
  */
  function speakMedicineAudio(medicine, index) {
    if (!reviewConfirmed[index]) {
      setAudioStatus("Please compare this medicine's extracted details with the original prescription first.");
      return;
    }

    if (!("speechSynthesis" in window) || !("SpeechSynthesisUtterance" in window)) {
      setAudioStatus("Audio playback is not supported by this browser. Try a recent version of Chrome or Edge.");
      return;
    }

    const fields = [
      ["മരുന്നിന്റെ പേര്", medicine.medicine_name],
      ["ശക്തി", medicine.strength],
      ["കുറിപ്പടിയിലെ ഡോസ് രേഖ", medicine.original_dosage_notation || medicine.prescribed_dose],
      ["ആവൃത്തി", medicine.frequency],
      ["ഭക്ഷണ നിർദ്ദേശം", medicine.food_instruction],
      ["ചികിത്സാ കാലയളവ്", medicine.duration],
    ].filter(([, value]) => value !== null && value !== undefined && String(value).trim() !== "");

    const spokenText = [
      "ശ്രദ്ധിക്കുക. ഇത് കുറിപ്പടിയിൽ നിന്ന് വായിച്ചെടുത്ത വിവരങ്ങളാണ്. ഇത് ഡോക്ടറുടെ ചികിത്സാ അനുമതിയല്ല.",
      ...fields.map(([label, value]) => `${label}: ${value}.`),
      "വ്യക്തമല്ലാത്ത വിവരങ്ങൾ ഊഹിച്ചിട്ടില്ല. മരുന്നിന്റെ ഉപയോഗത്തെക്കുറിച്ച് സംശയമുണ്ടെങ്കിൽ ഡോക്ടറെയോ ഫാർമസിസ്റ്റിനെയോ സമീപിക്കുക."
    ].join(" ");

    window.speechSynthesis.cancel();
    const utterance = new SpeechSynthesisUtterance(spokenText);
    utterance.lang = "ml-IN";
    utterance.rate = 0.88;
    utterance.pitch = 1;

    const voices = window.speechSynthesis.getVoices();
    const malayalamVoice = voices.find((voice) => /^ml([_-]|$)/i.test(voice.lang));
    if (malayalamVoice) utterance.voice = malayalamVoice;

    utterance.onstart = () => {
      setSpeakingMedicineIndex(index);
      setAudioStatus(
        malayalamVoice
          ? "Malayalam audio guide is playing."
          : "Audio requested in Malayalam. If pronunciation is unclear, install or select a Malayalam text-to-speech voice on this device."
      );
    };
    utterance.onend = () => {
      setSpeakingMedicineIndex(null);
    };
    utterance.onerror = () => {
      setSpeakingMedicineIndex(null);
      setAudioStatus("Audio could not be played. Check that your browser or device supports Malayalam speech.");
    };

    setAudioStatus("Starting Malayalam audio guide...");
    window.speechSynthesis.speak(utterance);
  }

  function stopMedicineAudio() {
    if ("speechSynthesis" in window) window.speechSynthesis.cancel();
    setSpeakingMedicineIndex(null);
    setAudioStatus("Audio stopped.");
  }

  useEffect(() => () => {
    if ("speechSynthesis" in window) window.speechSynthesis.cancel();
  }, []);

  function getScheduleDraft(index, medicine) {
    return scheduleDrafts[index] || {
      medicine_name: medicine?.medicine_name || "",
      strength: medicine?.strength || "",
      dose: "",
      confirmed_times: [],
      food_instruction: "",
      instructions_confirmed: false,
    };
  }

  function updateScheduleDraft(index, patch) {
    setScheduleDrafts((previous) => {
      const medicine = reviewResult?.medicines?.[index]?.extracted_medicine;
      const current = previous[index] || {
        medicine_name: medicine?.medicine_name || "",
        strength: medicine?.strength || "",
        dose: "",
        confirmed_times: [],
        food_instruction: "",
        instructions_confirmed: false,
      };
      return { ...previous, [index]: { ...current, ...patch } };
    });
    setScheduleResults((previous) => {
      const next = { ...previous };
      delete next[index];
      return next;
    });
    setScheduleErrors((previous) => ({ ...previous, [index]: "" }));
  }

  async function submitDailyRoutine(entry, index) {
    const medicine = entry?.extracted_medicine || {};
    const draft = getScheduleDraft(index, medicine);
    setScheduleErrors((previous) => ({ ...previous, [index]: "" }));

    if (!reviewConfirmed[index]) {
      setScheduleErrors((previous) => ({
        ...previous,
        [index]: "First compare the medicine details above with the original prescription.",
      }));
      return;
    }

    if (!draft.medicine_name.trim() || !draft.strength.trim() || !draft.dose.trim()) {
      setScheduleErrors((previous) => ({
        ...previous,
        [index]: "Enter the medicine name, strength, and dose exactly as confirmed from the written instructions.",
      }));
      return;
    }

    if (!draft.confirmed_times.length) {
      setScheduleErrors((previous) => ({
        ...previous,
        [index]: "Select at least one time only if it was explicitly confirmed by the doctor or pharmacist.",
      }));
      return;
    }

    if (!draft.instructions_confirmed) {
      setScheduleErrors((previous) => ({
        ...previous,
        [index]: "Confirm that the dose and each selected time match explicit written or professionally confirmed instructions.",
      }));
      return;
    }

    setScheduleLoading((previous) => ({ ...previous, [index]: true }));
    try {
      const response = await fetch(`${API_BASE_URL}/schedule`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          medicine_name: draft.medicine_name.trim(),
          strength: draft.strength.trim(),
          dose: draft.dose.trim(),
          confirmed_times: draft.confirmed_times,
          instructions_confirmed: true,
          confirmed_food_instruction: draft.food_instruction.trim() || null,
        }),
      });
      const payload = await response.json().catch(() => ({}));
      if (!response.ok) {
        throw new Error(payload.detail || `Could not build routine (HTTP ${response.status}).`);
      }

      setScheduleResults((previous) => ({ ...previous, [index]: payload }));
      if (payload.status !== "ready_for_display") {
        setScheduleErrors((previous) => ({
          ...previous,
          [index]: payload.message || "This routine needs further review.",
        }));
      }
    } catch (error) {
      setScheduleErrors((previous) => ({
        ...previous,
        [index]: error instanceof TypeError
          ? "Could not reach the schedule service. Confirm the OCR API and safety API are running."
          : error.message || "Could not build this routine.",
      }));
    } finally {
      setScheduleLoading((previous) => ({ ...previous, [index]: false }));
    }
  }


  /*
    Handle workflow navigation.
  */
  function handleStepClick(index) {
    if (index === 0) {
      setActiveStep(0);

      setMessage(
        "Patient details are displayed below. To edit them, return to the patient details page."
      );

      document
        .getElementById("patient-information")
        ?.scrollIntoView({ behavior: "smooth" });

      return;
    }

    if (index === 1) {
      setActiveStep(1);

      document
        .getElementById("prescriptions")
        ?.scrollIntoView({ behavior: "smooth" });

      return;
    }

    if (index === 2 || index === 4) {
      if (!reviewResult) {
        setMessage("Upload and analyze a prescription first. The review and audio guide will appear with the results.");
        return;
      }

      setActiveStep(index);
      document
        .getElementById("audio-guide")
        ?.scrollIntoView({ behavior: "smooth", block: "start" });
      return;
    }

    if (index === 3) {
      if (!reviewResult) {
        setMessage("Analyze a prescription first to prepare a daily routine from confirmed instructions.");
        return;
      }

      setActiveStep(3);
      document
        .getElementById("daily-routine")
        ?.scrollIntoView({ behavior: "smooth", block: "start" });
      return;
    }

    if (index > 1) {
      setMessage(
        "This step will become available after prescription processing is connected."
      );
      return;
    }

    setActiveStep(index);
  }

  return (
    <div className="carelekha-app">
      {/* HEADER */}
      <header className="cl-header">
        <div className="cl-header-inner">
          {/* Actual CareLekha logo */}
          <a
            className="cl-brand"
            href="#home"
            aria-label="CareLekha home"
          >
            <img
              src="/images/carelekha-logo.png"
              alt="CareLekha"
              className="cl-logo"
            />
          </a>

          <div className="cl-health-message">
            <Heart size={17} />

            <span>
              കൂടുതൽ സുരക്ഷിതവും ലളിതവുമായ ആരോഗ്യ അസിസ്റ്റന്റ്
            </span>
          </div>

          <div className="cl-header-actions">
            <span className="cl-language-badge">
              <Volume2 size={15} />
              {language}
            </span>

            <a
              href="tel:108"
              className="cl-emergency-button"
              aria-label="Call emergency services at 108"
            >
              <Phone size={15} />
              108
            </a>

            <button
              type="button"
              className="cl-mobile-menu-button"
              onClick={() =>
                setMobileMenuOpen((previous) => !previous)
              }
              aria-label="Toggle navigation"
            >
              {mobileMenuOpen ? <X /> : <Menu />}
            </button>
          </div>
        </div>

        {/* MOBILE MENU */}
        {mobileMenuOpen && (
          <nav className="cl-mobile-menu">
            <a
              href="#home"
              onClick={() => setMobileMenuOpen(false)}
            >
              Home
            </a>

            <a
              href="#patient-information"
              onClick={() => setMobileMenuOpen(false)}
            >
              Patient Details
            </a>

            <a
              href="#prescriptions"
              onClick={() => setMobileMenuOpen(false)}
            >
              Prescriptions
            </a>

            <a
              href="#how-it-works"
              onClick={() => setMobileMenuOpen(false)}
            >
              How It Works
            </a>

            <a
              href="#about"
              onClick={() => setMobileMenuOpen(false)}
            >
              About
            </a>

            {onLogout && (
              <button
                type="button"
                onClick={onLogout}
              >
                <LogOut size={16} />
                Logout
              </button>
            )}
          </nav>
        )}
      </header>

      <main className="cl-main" id="home">
        {/* STEP NAVIGATION */}
        <section
          className="cl-step-navigation"
          aria-label="CareLekha workflow"
        >
          {steps.map((step, index) => {
            const Icon = step.icon;

            return (
              <button
                type="button"
                key={step.label}
                className={`cl-step ${
                  activeStep === index ? "active" : ""
                }`}
                onClick={() => handleStepClick(index)}
              >
                <Icon size={18} />

                <span>
                  <strong>{step.label}</strong>
                  <small>{step.subtitle}</small>
                </span>
              </button>
            );
          })}
        </section>

        {/* PATIENT SUMMARY */}
        <section
          className="cl-patient-card"
          id="patient-information"
        >
          <div className="cl-patient-left">
            <div className="cl-patient-avatar">
              <UserRound size={25} />
            </div>

            <div>
              <div className="cl-patient-name">
                {patientName}
                <span>(Patient)</span>
              </div>

              <div className="cl-patient-meta">
                {age && (
                  <span>
                    <UserRoundCheck size={14} />
                    {age} years
                  </span>
                )}

                {gender && <span>{gender}</span>}

                {location && <span>{location}</span>}

                <span>
                  <CalendarDays size={14} />
                  {new Date().toLocaleDateString("en-GB")}
                </span>
              </div>
            </div>
          </div>

          <div className="cl-diagnosis">
            <strong>രോഗനിർണയം:</strong>

            <span>
              {conditions ||
                "No medical conditions provided"}
            </span>
          </div>
        </section>

        {/* ADDITIONAL PATIENT DETAILS */}
        <section className="cl-input-panel">
          <div className="cl-input-heading">
            <div className="cl-input-title">
              <div className="cl-section-eyebrow">
                <UserRoundCheck size={15} />
                രോഗിയുടെ കൂടുതൽ വിവരങ്ങൾ (Patient Information)
              </div>

              <h2>രോഗിയുടെ കൂടുതൽ വിവരങ്ങൾ</h2>

              <p>
                Patient information entered on the previous
                page is displayed here. Missing information
                is not automatically filled in.
              </p>
            </div>
          </div>

          <div className="cl-panel-divider" />

          <div className="cl-patient-details-grid">
            {/* AGE */}
            <article className="cl-how-card">
              <div className="cl-how-icon mint">
                <UserRound size={22} />
              </div>

              <h3>Age / വയസ്സ്</h3>

              <p>{age || "Not provided"}</p>
            </article>

            {/* DATE OF BIRTH */}
            <article className="cl-how-card">
              <div className="cl-how-icon blue">
                <CalendarDays size={22} />
              </div>

              <h3>Date of Birth / ജനനത്തീയതി</h3>

              <p>
                {dateOfBirth
                  ? formatDate(dateOfBirth)
                  : "Not provided"}
              </p>
            </article>

            {/* MEDICAL CONDITIONS */}
            <article className="cl-how-card">
              <div className="cl-how-icon purple">
                <Activity size={22} />
              </div>

              <h3>
                Medical Conditions / രോഗാവസ്ഥകൾ
              </h3>

              <p>{conditions || "Not provided"}</p>
            </article>

            {/* ALLERGIES */}
            <article className="cl-how-card">
              <div className="cl-how-icon mint">
                <HeartPulse size={22} />
              </div>

              <h3>Allergies / അലർജികൾ</h3>

              <p>{allergies || "Not provided"}</p>
            </article>

            {/* HOSPITAL */}
            <article className="cl-how-card">
              <div className="cl-how-icon blue">
                <ClipboardList size={22} />
              </div>

              <h3>Hospital / ആശുപത്രി</h3>

              <p>{hospital || "Not provided"}</p>
            </article>

            {/* OTHER INFORMATION */}
            <article className="cl-how-card">
              <div className="cl-how-icon purple">
                <FileText size={22} />
              </div>

              <h3>
                Other Information / മറ്റ് വിവരങ്ങൾ
              </h3>

              <p>
                {otherInformation || "Not provided"}
              </p>
            </article>
          </div>
        </section>

        {/* PRESCRIPTION INPUT */}
        <section
          className="cl-input-panel"
          id="prescriptions"
        >
          <div className="cl-input-heading">
            <div className="cl-input-title">
              <div className="cl-section-eyebrow">
                <Sparkles size={15} />
                ഘട്ടം 2: കുറിപ്പടി നൽകുക (Input Prescription)
              </div>

              <h1>
                ഡോക്ടറുടെ കുറിപ്പടിയോ ഡിസ്ചാർജ് സമ്മറിയോ നൽകുക
              </h1>

              <p>
                Upload your own prescription or enter the
                prescription text. CareLekha will not display
                another patient's sample medical record.
              </p>
            </div>

            {/* INPUT MODE TABS */}
            <div className="cl-input-tabs">
              <button
                type="button"
                className={
                  inputMode === "upload" ? "active" : ""
                }
                onClick={() => {
                  setInputMode("upload");
                  setMessage("");
                }}
              >
                <ImageIcon size={17} />

                <span>
                  ഫോട്ടോ അപ്‌ലോഡ്
                  <small>(Upload)</small>
                </span>
              </button>

              <button
                type="button"
                className={
                  inputMode === "text" ? "active" : ""
                }
                onClick={() => {
                  setInputMode("text");
                  setMessage("");
                }}
              >
                <Type size={17} />

                <span>
                  ടെക്സ്റ്റ് നൽകുക
                  <small>(Type Text)</small>
                </span>
              </button>
            </div>
          </div>

          <div className="cl-panel-divider" />

          {/* FILE UPLOAD */}
          {inputMode === "upload" && (
            <div className="cl-upload-area">
              <div className="cl-upload-icon">
                <Upload size={32} />
              </div>

              <h3>കുറിപ്പടി അപ്‌ലോഡ് ചെയ്യുക</h3>

              <p>
                Select your own prescription as a JPG, PNG, or WEBP image. Maximum size: 10 MB.
              </p>

              <input
                ref={fileInputRef}
                type="file"
                accept=".jpg,.jpeg,.png,.webp,image/jpeg,image/png,image/webp"
                onChange={handleFileChange}
                hidden
              />

              <button
                type="button"
                className="cl-secondary-button"
                onClick={() =>
                  fileInputRef.current?.click()
                }
              >
                <Upload size={17} />
                Choose File
              </button>

              {/* SELECTED FILE */}
              {uploadedFile && (
                <div className="cl-file-selected">
                  <FileText size={18} />

                  <span>{uploadedFile.name}</span>

                  <button
                    type="button"
                    onClick={() => {
                      setUploadedFile(null);

                      if (fileInputRef.current) {
                        fileInputRef.current.value = "";
                      }

                      setMessage("");
                    }}
                    aria-label="Remove selected file"
                  >
                    <X size={16} />
                  </button>
                </div>
              )}
            </div>
          )}

          {/* MANUAL TEXT INPUT */}
          {inputMode === "text" && (
            <div className="cl-manual-input">
              <label htmlFor="prescription-text">
                കുറിപ്പടിയിലെ വിവരങ്ങൾ ഇവിടെ നൽകുക
              </label>

              <textarea
                id="prescription-text"
                rows={7}
                value={manualText}
                onChange={(event) => {
                  setManualText(event.target.value);
                  setMessage("");
                }}
                placeholder="Manglish-il type cheyyuka... / Enter prescription details"
              />

              <p
                className="conversion-status"
                aria-live="polite"
              >
                {isConverting
                  ? "മലയാളത്തിലേക്ക് മാറ്റുന്നു..."
                  : "Manglish-ൽ ടൈപ്പ് ചെയ്യുക. ടൈപ്പ് നിർത്തിയാൽ മലയാളത്തിലേക്ക് സ്വയം മാറും."}
              </p>

              <p>
                Please verify the Malayalam text, especially
                medicine names, dosages, and timings, before
                saving.
              </p>
            </div>
          )}

          {/* STATUS MESSAGE */}
          {message && (
            <div className="cl-selected-note" role="status">
              <AlertCircle size={17} />
              <span>{message}</span>
            </div>
          )}

          {reviewResult && (
            <section className="cl-review-results" id="audio-guide" aria-live="polite">
              <div className="cl-review-heading">
                <div>
                  <span className="cl-review-eyebrow">REVIEW REQUIRED</span>
                  <h2>Prescription analysis results</h2>
                  <p>Compare each extracted field with the original prescription. Text similarity is not clinical verification.</p>
                </div>
                <span className="cl-review-status">Human review required</span>
              </div>
              {Array.isArray(reviewResult.medicines) && reviewResult.medicines.length > 0 ? (
                <div className="cl-review-list">
                  {reviewResult.medicines.map((entry, index) => {
                    const medicine = entry.extracted_medicine || {};
                    const identity = entry.identity_check || {};
                    const candidates = entry.ml_candidates?.candidates || [];
                    return (
                      <article className="cl-review-medicine" key={`${medicine.medicine_name || "medicine"}-${index}`}>
                        <div className="cl-review-medicine-top">
                          <div>
                            <span className="cl-review-index">MEDICINE {index + 1}</span>
                            <h3>{medicine.medicine_name || "Name not readable"}</h3>
                          </div>
                          <span className="cl-review-pill">Needs review</span>
                        </div>
                        <dl className="cl-review-fields">
                          <div><dt>Strength</dt><dd>{medicine.strength || "Not extracted"}</dd></div>
                          <div><dt>Original dose notation</dt><dd>{medicine.original_dosage_notation || medicine.prescribed_dose || "Not extracted"}</dd></div>
                          <div><dt>Frequency (OCR)</dt><dd>{medicine.frequency || "Not extracted"}</dd></div>
                          <div><dt>Food instruction (OCR)</dt><dd>{medicine.food_instruction || "Not extracted"}</dd></div>
                          <div><dt>Duration (OCR)</dt><dd>{medicine.duration || "Not extracted"}</dd></div>
                          <div><dt>OCR uncertainty</dt><dd>{medicine.uncertainty || "Review required"}</dd></div>
                        </dl>
                        <p className="cl-review-safety-message"><ShieldCheck size={16} />{identity.message || "This information has not been clinically verified."}</p>
                        <div className="cl-audio-review-gate">
                          <label>
                            <input
                              type="checkbox"
                              checked={Boolean(reviewConfirmed[index])}
                              onChange={(event) => {
                                setReviewConfirmed((previous) => ({
                                  ...previous,
                                  [index]: event.target.checked,
                                }));
                                if (!event.target.checked && speakingMedicineIndex === index) {
                                  stopMedicineAudio();
                                }
                                if (!event.target.checked) {
                                  setScheduleResults((previous) => {
                                    const next = { ...previous };
                                    delete next[index];
                                    return next;
                                  });
                                  setScheduleDrafts((previous) => ({
                                    ...previous,
                                    [index]: {
                                      ...getScheduleDraft(index, medicine),
                                      instructions_confirmed: false,
                                    },
                                  }));
                                }
                                setAudioStatus("");
                              }}
                            />
                            <span>ഞാൻ ഈ വിവരങ്ങൾ യഥാർത്ഥ കുറിപ്പടിയുമായി താരതമ്യം ചെയ്തു (I compared these extracted fields with the original prescription).</span>
                          </label>
                          <div className="cl-audio-actions">
                            <button
                              type="button"
                              className="cl-audio-button"
                              onClick={() => speakMedicineAudio(medicine, index)}
                              disabled={!reviewConfirmed[index]}
                            >
                              <Volume2 size={16} />
                              {speakingMedicineIndex === index ? "ഓഡിയോ പ്ലേ ചെയ്യുന്നു…" : "മലയാളം ഓഡിയോ കേൾക്കുക"}
                            </button>
                            {speakingMedicineIndex === index && (
                              <button
                                type="button"
                                className="cl-audio-stop-button"
                                onClick={stopMedicineAudio}
                              >
                                നിർത്തുക
                              </button>
                            )}
                          </div>
                          <small>Audio reads only the extracted fields shown above. This review does not confirm that the medicine or treatment is clinically appropriate.</small>
                        </div>
                        <div className="cl-candidates-heading">
                          <strong>Possible catalogue matches</strong><span>{candidates.length} candidates</span>
                        </div>
                        {candidates.length ? (
                          <div className="cl-candidate-list">
                            {candidates.map((candidate, ci) => (
                              <div className="cl-candidate" key={`${candidate.id || candidate.name}-${ci}`}>
                                <div className="cl-candidate-title">
                                  <strong>{candidate.name || "Unnamed item"}</strong>
                                  <span>Similarity: {Number(candidate.similarity_score || 0).toFixed(3)}</span>
                                </div>
                                <p>{[candidate.short_composition1, candidate.short_composition2, candidate.pack_size_label, candidate.is_discontinued ? "Marked discontinued in catalogue" : ""].filter(Boolean).join(" · ") || "Composition unavailable"}</p>
                                <small>Suggestion only. Confirm medicine, strength and formulation against the original.</small>
                              </div>
                            ))}
                          </div>
                        ) : <p className="cl-review-empty">No candidates returned. Do not guess; request professional review.</p>}
                      </article>
                    );
                  })}
                </div>
              ) : <p className="cl-review-empty">No medicines were extracted. Check image quality and request professional review.</p>}
              {audioStatus && (
                <p className="cl-audio-status" role="status" aria-live="polite">{audioStatus}</p>
              )}
            </section>
          )}

          {reviewResult && Array.isArray(reviewResult.medicines) && reviewResult.medicines.length > 0 && (
            <section className="cl-daily-routine" id="daily-routine" aria-live="polite">
              <div className="cl-routine-heading">
                <span className="cl-review-eyebrow">STEP 4 · DAILY ROUTINE</span>
                <h2>ദൈനംദിന മരുന്ന് ക്രമം</h2>
                <p>Build a display routine only from explicitly confirmed instructions. CareLekha will not convert shorthand such as 1-0-1 into times.</p>
              </div>

              <div className="cl-routine-warning">
                <ShieldCheck size={17} />
                <span>Choose morning, afternoon, evening, or night only when the written instructions or a qualified healthcare professional explicitly confirm that timing. This routine organizes inputs; it does not decide what you should take.</span>
              </div>

              <div className="cl-routine-list">
                {reviewResult.medicines.map((entry, index) => {
                  const medicine = entry.extracted_medicine || {};
                  const draft = getScheduleDraft(index, medicine);
                  const result = scheduleResults[index];
                  const times = [
                    { value: "morning", label: "രാവിലെ", en: "Morning" },
                    { value: "afternoon", label: "ഉച്ചയ്ക്ക്", en: "Afternoon" },
                    { value: "evening", label: "വൈകുന്നേരം", en: "Evening" },
                    { value: "night", label: "രാത്രി", en: "Night" },
                  ];

                  return (
                    <article className="cl-routine-medicine" key={`routine-${medicine.medicine_name || "medicine"}-${index}`}>
                      <div className="cl-routine-medicine-title">
                        <div>
                          <span className="cl-review-index">MEDICINE {index + 1}</span>
                          <h3>{medicine.medicine_name || "Name not readable"}</h3>
                        </div>
                        <span className="cl-review-pill">Review required</span>
                      </div>

                      <div className="cl-routine-form-grid">
                        <label>
                          <span>Medicine name (confirm / correct)</span>
                          <input
                            type="text"
                            value={draft.medicine_name}
                            onChange={(event) => updateScheduleDraft(index, { medicine_name: event.target.value })}
                            autoComplete="off"
                          />
                        </label>
                        <label>
                          <span>Strength (confirm / correct)</span>
                          <input
                            type="text"
                            value={draft.strength}
                            onChange={(event) => updateScheduleDraft(index, { strength: event.target.value })}
                            placeholder="As written, e.g. 500 mg"
                            autoComplete="off"
                          />
                        </label>
                        <label>
                          <span>Dose exactly as confirmed</span>
                          <input
                            type="text"
                            value={draft.dose}
                            onChange={(event) => updateScheduleDraft(index, { dose: event.target.value })}
                            placeholder="Enter confirmed dose; not inferred"
                            autoComplete="off"
                          />
                        </label>
                        <label>
                          <span>Food instruction (optional)</span>
                          <input
                            type="text"
                            value={draft.food_instruction}
                            onChange={(event) => updateScheduleDraft(index, { food_instruction: event.target.value })}
                            placeholder="Only if explicitly confirmed"
                            autoComplete="off"
                          />
                        </label>
                      </div>

                      <fieldset className="cl-routine-times">
                        <legend>Explicitly confirmed time(s)</legend>
                        <div className="cl-routine-time-options">
                          {times.map((time) => (
                            <label key={time.value}>
                              <input
                                type="checkbox"
                                checked={draft.confirmed_times.includes(time.value)}
                                onChange={(event) => {
                                  const nextTimes = event.target.checked
                                    ? [...draft.confirmed_times, time.value]
                                    : draft.confirmed_times.filter((value) => value !== time.value);
                                  updateScheduleDraft(index, { confirmed_times: nextTimes });
                                }}
                              />
                              <span>{time.label}<small>{time.en}</small></span>
                            </label>
                          ))}
                        </div>
                        <p>Do not select times just because the prescription says 1-0-1 or “twice daily”. Confirm actual times separately.</p>
                      </fieldset>

                      <label className="cl-routine-confirm">
                        <input
                          type="checkbox"
                          checked={Boolean(draft.instructions_confirmed)}
                          onChange={(event) => updateScheduleDraft(index, { instructions_confirmed: event.target.checked })}
                        />
                        <span>I confirm that the medicine identity, strength, dose, and every selected time match the original written instructions or have been explicitly confirmed by a qualified healthcare professional. This is my confirmation of the source information, not medical approval.</span>
                      </label>

                      <div className="cl-routine-actions">
                        <button
                          type="button"
                          className="cl-routine-submit"
                          onClick={() => submitDailyRoutine(entry, index)}
                          disabled={Boolean(scheduleLoading[index])}
                        >
                          <CalendarDays size={16} />
                          {scheduleLoading[index] ? "Preparing routine…" : "Build daily routine"}
                        </button>
                        {result?.status === "ready_for_display" && (
                          <span className="cl-routine-ready">Routine entries created from confirmed inputs</span>
                        )}
                      </div>

                      {scheduleErrors[index] && <p className="cl-routine-error" role="alert">{scheduleErrors[index]}</p>}

                      {result?.status === "ready_for_display" && Array.isArray(result.schedule) && (
                        <div className="cl-routine-output">
                          <h4>Daily routine entries</h4>
                          {result.schedule.map((item, itemIndex) => (
                            <div className="cl-routine-output-row" key={`routine-row-${item.time}-${itemIndex}`}>
                              <strong>{({ morning: "രാവിലെ · Morning", afternoon: "ഉച്ചയ്ക്ക് · Afternoon", evening: "വൈകുന്നേരം · Evening", night: "രാത്രി · Night" })[item.time] || item.time}</strong>
                              <span>{item.medicine_name} · {item.strength} · {item.dose}</span>
                              {item.instruction && <small>Food instruction: {item.instruction}</small>}
                            </div>
                          ))}
                          <p>This is a display aid made from confirmed inputs, not a prescription, clinical approval, or reminder system.</p>
                        </div>
                      )}
                    </article>
                  );
                })}
              </div>
            </section>
          )}

          {/* PANEL FOOTER */}
          <div className="cl-panel-footer">
            <div className="cl-secure-note">
              <ShieldCheck size={17} />

              Your medical information should be handled
              carefully.
            </div>

            <button
              type="button"
              className="cl-primary-button"
              onClick={handleContinue}
              disabled={isProcessing}
            >
              {isProcessing ? "Analyzing prescription..." : "Analyze Prescription"}
              {!isProcessing && <ChevronRight size={18} />}
            </button>
          </div>
        </section>

        {/* HOW IT WORKS */}
        <section
          className="cl-how-section"
          id="how-it-works"
        >
          <div className="cl-section-heading">
            <span>HOW IT WORKS</span>

            <h2>
              നിങ്ങളുടെ ആരോഗ്യപരിചരണം എളുപ്പമാക്കാം
            </h2>

            <p>
              Follow these steps to begin using CareLekha.
            </p>
          </div>

          <div className="cl-how-grid">
            {/* STEP 1 */}
            <article className="cl-how-card">
              <div className="cl-how-icon mint">
                <UserRound size={23} />
              </div>

              <span className="cl-how-number">01</span>

              <h3>Enter Patient Details</h3>

              <p>
                Provide the patient's actual information on
                the patient details page.
              </p>
            </article>

            {/* STEP 2 */}
            <article className="cl-how-card">
              <div className="cl-how-icon blue">
                <FileText size={23} />
              </div>

              <span className="cl-how-number">02</span>

              <h3>Provide a Prescription</h3>

              <p>
                Upload a prescription or type the instructions
                given by the doctor.
              </p>
            </article>

            {/* STEP 3 */}
            <article className="cl-how-card">
              <div className="cl-how-icon purple">
                <ShieldCheck size={23} />
              </div>

              <span className="cl-how-number">03</span>

              <h3>Review the Information</h3>

              <p>
                Check the extracted information before using
                any generated explanation or schedule.
              </p>
            </article>
          </div>
        </section>

        {/* MEDICAL DISCLAIMER */}
        <section
          className="cl-disclaimer"
          id="about"
        >
          <div className="cl-disclaimer-icon">
            <AlertCircle size={22} />
          </div>

          <div>
            <h3>
              പ്രധാനപ്പെട്ട മെഡിക്കൽ മുന്നറിയിപ്പ്
            </h3>

            <p>
              CareLekha helps patients understand their
              medical information. It does not replace a
              qualified doctor. Do not change a medicine,
              dosage, or schedule without professional advice.
              In an emergency, call 108.
            </p>
          </div>
        </section>
      </main>

      {/* FOOTER */}
      <footer className="cl-footer">
        <div className="cl-footer-brand">
          <Heart size={17} />
          <strong>CareLekha</strong>
          <span>Your Care in your Language</span>
        </div>

        <p>
          © {new Date().getFullYear()} CareLekha. Built to
          make healthcare information easier to understand.
        </p>

        {onLogout && (
          <button
            type="button"
            className="cl-logout-button"
            onClick={onLogout}
          >
            <LogOut size={16} />
            Logout
          </button>
        )}
      </footer>
    </div>
  );
}

