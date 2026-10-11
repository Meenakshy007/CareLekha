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
    subtitle: "കുറിപ്പടി പരിശോധിക്കുക",
    icon: ShieldCheck,
  },
  {
    label: "4. ദൈനംദിന ക്രമം",
    subtitle: "മരുന്നുകളുടെ സമയക്രമം",
    icon: CalendarDays,
  },
  {
    label: "5. മലയാളം ശബ്ദസഹായി",
    subtitle: "മരുന്ന് വിവരങ്ങൾ കേൾക്കുക",
    icon: Volume2,
  },
  {
    label: "6. പ്രിന്റ് ചാർട്ട്",
    subtitle: "(Wall Chart)",
    icon: Printer,
  },
];

/*
  Translate only a small set of unambiguous common phrases for speech.
  Drug names, strengths and dose notation remain exactly as extracted.
*/
function valueForMalayalamSpeech(label, rawValue) {
  const original = String(rawValue ?? "").trim();
  const normalized = original.toLowerCase().replace(/[.!]+$/g, "").trim();
  const phraseMap = {
    "ആവൃത്തി": {
      "once daily": "ദിവസത്തിൽ ഒരിക്കൽ",
      "once a day": "ദിവസത്തിൽ ഒരിക്കൽ",
      "twice daily": "ദിവസത്തിൽ രണ്ട് തവണ",
      "twice a day": "ദിവസത്തിൽ രണ്ട് തവണ",
      "three times daily": "ദിവസത്തിൽ മൂന്ന് തവണ",
      "three times a day": "ദിവസത്തിൽ മൂന്ന് തവണ",
      "thrice daily": "ദിവസത്തിൽ മൂന്ന് തവണ",
      "four times daily": "ദിവസത്തിൽ നാല് തവണ",
      "four times a day": "ദിവസത്തിൽ നാല് തവണ",
    },
    "ഭക്ഷണ നിർദ്ദേശം": {
      "after meals": "ഭക്ഷണത്തിന് ശേഷം",
      "after meal": "ഭക്ഷണത്തിന് ശേഷം",
      "after food": "ഭക്ഷണത്തിന് ശേഷം",
      "before meals": "ഭക്ഷണത്തിന് മുമ്പ്",
      "before meal": "ഭക്ഷണത്തിന് മുമ്പ്",
      "before food": "ഭക്ഷണത്തിന് മുമ്പ്",
      "with food": "ഭക്ഷണത്തോടൊപ്പം",
      "with meals": "ഭക്ഷണത്തോടൊപ്പം",
      "empty stomach": "വെറും വയറ്റിൽ",
    },
  };

  if (phraseMap[label]?.[normalized]) return phraseMap[label][normalized];

  if (label === "ചികിത്സാ കാലയളവ്") {
    const match = normalized.match(/^(\d+)\s+days?$/);
    if (match) return `${match[1]} ദിവസം`;
    const weekMatch = normalized.match(/^(\d+)\s+weeks?$/);
    if (weekMatch) return `${weekMatch[1]} ആഴ്ച`;
  }

  return original;
}

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

  useEffect(() => {
    const sectionByStep = {
      2: "review-results",
      3: "daily-routine",
      4: "audio-guide",
    };
    const sectionId = sectionByStep[activeStep];
    if (!sectionId || !reviewResult) return undefined;

    const frame = window.requestAnimationFrame(() => {
      document.getElementById(sectionId)?.scrollIntoView({
        behavior: "smooth",
        block: "start",
      });
    });
    return () => window.cancelAnimationFrame(frame);
  }, [activeStep, reviewResult]);

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
      setAudioStatus("ആദ്യം ഈ മരുന്നിന്റെ വിവരങ്ങൾ യഥാർത്ഥ കുറിപ്പടിയുമായി താരതമ്യം ചെയ്യുക.");
      return;
    }

    if (!("speechSynthesis" in window) || !("SpeechSynthesisUtterance" in window)) {
      setAudioStatus("ഈ ബ്രൗസറിൽ ശബ്ദം പ്ലേ ചെയ്യാൻ കഴിയുന്നില്ല. മറ്റൊരു പുതുക്കിയ ബ്രൗസർ പരീക്ഷിക്കുക.");
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
      ...fields.map(([label, value]) => `${label}: ${valueForMalayalamSpeech(label, value)}.`),
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
          ? "മലയാളം ശബ്ദസഹായി പ്ലേ ചെയ്യുന്നു."
          : "ഉപകരണത്തിൽ മലയാളം ശബ്ദം ലഭ്യമല്ലായിരിക്കാം. ശബ്ദ ക്രമീകരണങ്ങളിൽ മലയാളം ശബ്ദ പിന്തുണ പരിശോധിക്കുക."
      );
    };
    utterance.onend = () => {
      setSpeakingMedicineIndex(null);
    };
    utterance.onerror = () => {
      setSpeakingMedicineIndex(null);
      setAudioStatus("ശബ്ദം പ്ലേ ചെയ്യാനായില്ല. ഉപകരണത്തിൽ മലയാളം ശബ്ദ പിന്തുണയുണ്ടോയെന്ന് പരിശോധിക്കുക.");
    };

    setAudioStatus("മലയാളം ശബ്ദസഹായി ആരംഭിക്കുന്നു…");
    window.speechSynthesis.speak(utterance);
  }

  function stopMedicineAudio() {
    if ("speechSynthesis" in window) window.speechSynthesis.cancel();
    setSpeakingMedicineIndex(null);
    setAudioStatus("ശബ്ദം നിർത്തി.");
  }

  useEffect(() => () => {
    if ("speechSynthesis" in window) window.speechSynthesis.cancel();
  }, []);

  function getScheduleDraft(index, medicine) {
    return scheduleDrafts[index] || {
      medicine_name: medicine?.medicine_name || "",
      strength: medicine?.strength || "",
      dose: medicine?.prescribed_dose || medicine?.original_dosage_notation || "",
      confirmed_times: [],
    };
  }

  function updateScheduleDraft(index, patch) {
    setScheduleDrafts((previous) => {
      const medicine = reviewResult?.medicines?.[index]?.extracted_medicine;
      const current = previous[index] || {
        medicine_name: medicine?.medicine_name || "",
        strength: medicine?.strength || "",
        dose: medicine?.prescribed_dose || medicine?.original_dosage_notation || "",
        confirmed_times: [],
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
        [index]: "ആദ്യം മുകളിലെ മരുന്ന് വിവരങ്ങൾ യഥാർത്ഥ കുറിപ്പടിയുമായി താരതമ്യം ചെയ്യുക.",
      }));
      return;
    }

    if (!draft.medicine_name.trim() || !draft.strength.trim() || !draft.dose.trim()) {
      setScheduleErrors((previous) => ({
        ...previous,
        [index]: "സ്ഥിരീകരിച്ച നിർദ്ദേശങ്ങളിലുള്ള മരുന്നിന്റെ പേര്, ശക്തി, ഡോസ് എന്നിവ രേഖപ്പെടുത്തുക.",
      }));
      return;
    }

    if (!draft.confirmed_times.length) {
      setScheduleErrors((previous) => ({
        ...previous,
        [index]: "ഡോക്ടറോ ഫാർമസിസ്റ്റോ വ്യക്തമായി സ്ഥിരീകരിച്ച സമയങ്ങളിൽ നിന്ന് കുറഞ്ഞത് ഒന്ന് തിരഞ്ഞെടുക്കുക.",
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
          confirmed_food_instruction: medicine.food_instruction || null,
        }),
      });
      const payload = await response.json().catch(() => ({}));
      if (!response.ok) {
        throw new Error("ദൈനംദിന ക്രമം തയ്യാറാക്കാനായില്ല. സുരക്ഷാ സേവനം പ്രവർത്തിക്കുന്നുണ്ടോയെന്ന് പരിശോധിക്കുക.");
      }

      setScheduleResults((previous) => ({ ...previous, [index]: payload }));
      if (payload.status !== "ready_for_display") {
        setScheduleErrors((previous) => ({
          ...previous,
          [index]: "ഈ ക്രമത്തിന് കൂടുതൽ പരിശോധന ആവശ്യമാണ്.",
        }));
      }
    } catch (error) {
      setScheduleErrors((previous) => ({
        ...previous,
        [index]: error instanceof TypeError
          ? "ക്രമം തയ്യാറാക്കുന്ന സേവനവുമായി ബന്ധപ്പെടാനായില്ല. OCR, സുരക്ഷാ സേവനങ്ങൾ പ്രവർത്തിക്കുന്നുണ്ടോയെന്ന് പരിശോധിക്കുക."
          : "ദൈനംദിന ക്രമം തയ്യാറാക്കാനായില്ല. വീണ്ടും ശ്രമിക്കുക.",
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

    if (index === 2) {
      if (!reviewResult) {
        setMessage("ആദ്യം കുറിപ്പടി അപ്‌ലോഡ് ചെയ്ത് വിശകലനം നടത്തുക.");
        return;
      }

      setActiveStep(2);
      return;
    }

    if (index === 3) {
      if (!reviewResult || !Array.isArray(reviewResult.medicines) || reviewResult.medicines.length === 0) {
        setMessage("ദൈനംദിന ക്രമം തയ്യാറാക്കാൻ ആദ്യം വായിക്കാവുന്ന മരുന്ന് വിവരങ്ങളുള്ള കുറിപ്പടി വിശകലനം ചെയ്യുക.");
        return;
      }

      setActiveStep(3);
      return;
    }

    if (index === 4) {
      if (!reviewResult || !Array.isArray(reviewResult.medicines) || reviewResult.medicines.length === 0) {
        setMessage("ആദ്യം കുറിപ്പടി വിശകലനം ചെയ്ത് മരുന്ന് വിവരങ്ങൾ പരിശോധിക്കുക.");
        return;
      }

      setActiveStep(4);
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

          {reviewResult && activeStep === 2 && (
            <section className="cl-review-results" id="review-results" aria-live="polite">
              <div className="cl-review-heading">
                <div>
                  <span className="cl-review-eyebrow">പരിശോധന ആവശ്യമാണ്</span>
                  <h2>കുറിപ്പടി വിശകലന ഫലം</h2>
                  <p>ഓരോ വിവരവും യഥാർത്ഥ കുറിപ്പടിയുമായി താരതമ്യം ചെയ്യുക. പട്ടികയിലെ സാമ്യം മാത്രം മരുന്ന് ശരിയാണെന്നതിന് തെളിവല്ല.</p>
                </div>
                <span className="cl-review-status">നിങ്ങളുടെ പരിശോധന ആവശ്യമാണ്</span>
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
                            <span className="cl-review-index">മരുന്ന് {index + 1}</span>
                            <h3>{medicine.medicine_name || "പേര് വായിക്കാനായില്ല"}</h3>
                          </div>
                          <span className="cl-review-pill">പരിശോധന ആവശ്യമാണ്</span>
                        </div>
                        <dl className="cl-review-fields">
                          <div><dt>ശക്തി</dt><dd>{medicine.strength || "വായിക്കാനായില്ല"}</dd></div>
                          <div><dt>കുറിപ്പടിയിലെ ഡോസ് രേഖ</dt><dd>{medicine.original_dosage_notation || medicine.prescribed_dose || "വായിക്കാനായില്ല"}</dd></div>
                          <div><dt>ആവൃത്തി</dt><dd>{medicine.frequency || "വായിക്കാനായില്ല"}</dd></div>
                          <div><dt>ഭക്ഷണ നിർദ്ദേശം</dt><dd>{medicine.food_instruction || "വായിക്കാനായില്ല"}</dd></div>
                          <div><dt>കാലയളവ്</dt><dd>{medicine.duration || "വായിക്കാനായില്ല"}</dd></div>
                          <div><dt>വായനയിലെ വ്യക്തത</dt><dd>{medicine.uncertainty === "low" ? "കുറഞ്ഞ അനിശ്ചിതത്വം" : medicine.uncertainty === "none" ? "വ്യക്തമായ അനിശ്ചിതത്വം കണ്ടെത്തിയില്ല" : "പരിശോധന ആവശ്യമാണ്"}</dd></div>
                        </dl>
                        <p className="cl-review-safety-message"><ShieldCheck size={16} />{identity.status === "safety_service_unavailable" ? "സുരക്ഷാ സേവനം ലഭ്യമല്ല. ഈ മരുന്ന് സ്ഥിരീകരിച്ചിട്ടില്ല." : identity.status === "verified" ? "പരിശോധിച്ച രേഖയുമായി മരുന്നിന്റെ പേര് പൊരുത്തപ്പെട്ടു." : identity.status === "identity_match_unreviewed" ? "മരുന്നിന്റെ രേഖ കണ്ടെത്തി; എന്നാൽ വിദഗ്ധ പരിശോധന പൂർത്തിയായിട്ടില്ല." : identity.status === "awaiting_confirmation" ? "മരുന്നിന്റെ പേരും ശക്തിയും യഥാർത്ഥ കുറിപ്പടിയുമായി താരതമ്യം ചെയ്യുക." : "കൃത്യമായ പൊരുത്തം കണ്ടെത്തിയില്ല. ഫാർമസിസ്റ്റിന്റെ സഹായം തേടുക."}</p>
                        <div className="cl-verification-check">
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
                            <span>ഈ വിവരങ്ങൾ യഥാർത്ഥ കുറിപ്പടിയുമായി താരതമ്യം ചെയ്ത് പരിശോധിച്ചു.</span>
                          </label>
                          <small>ഈ പരിശോധന കുറിപ്പടിയിലെ വിവരങ്ങൾ ശരിയായി വായിച്ചിട്ടുണ്ടോ എന്നതിനുള്ളതാണ്; ചികിത്സയ്ക്ക് അംഗീകാരം നൽകുന്നതല്ല.</small>
                        </div>
                        <details className="cl-candidates-details">
                          <summary>സമാന മരുന്ന് രേഖകൾ കാണുക ({candidates.length})</summary>
                        {candidates.length ? (
                          <div className="cl-candidate-list">
                            {candidates.map((candidate, ci) => (
                              <div className="cl-candidate" key={`${candidate.id || candidate.name}-${ci}`}>
                                <div className="cl-candidate-title">
                                  <strong>{candidate.name || "പേര് ലഭ്യമല്ല"}</strong>
                                  <span>പാഠസാമ്യം: {Number(candidate.similarity_score || 0).toFixed(3)}</span>
                                </div>
                                <p>{[candidate.short_composition1, candidate.short_composition2, candidate.pack_size_label, candidate.is_discontinued ? "പട്ടികയിൽ നിർത്തലാക്കിയതായി രേഖപ്പെടുത്തിയിരിക്കുന്നു" : ""].filter(Boolean).join(" · ") || "ഘടനാ വിവരം ലഭ്യമല്ല"}</p>
                                <small>ഇത് ഒരു നിർദ്ദേശം മാത്രമാണ്. മരുന്നിന്റെ പേര്, ശക്തി, രൂപം എന്നിവ യഥാർത്ഥ കുറിപ്പടിയുമായി പരിശോധിക്കുക.</small>
                              </div>
                            ))}
                          </div>
                        ) : <p className="cl-review-empty">പൊരുത്തങ്ങൾ കണ്ടെത്തിയില്ല. ഊഹിക്കാതെ ഡോക്ടറുടെയോ ഫാർമസിസ്റ്റിന്റെയോ സഹായം തേടുക.</p>}
                        </details>
                      </article>
                    );
                  })}
                </div>
              ) : <p className="cl-review-empty">മരുന്നുകൾ വായിച്ചെടുക്കാനായില്ല. ചിത്രം പരിശോധിച്ച് വീണ്ടും ശ്രമിക്കുക; ആവശ്യമെങ്കിൽ വിദഗ്ധ സഹായം തേടുക.</p>}
              {Array.isArray(reviewResult.medicines) && reviewResult.medicines.length > 0 && (
                <div className="cl-workflow-next">
                  <button
                    type="button"
                    className="cl-routine-submit"
                    onClick={() => setActiveStep(3)}
                  >
                    അടുത്ത ഘട്ടം: ദൈനംദിന ക്രമം
                    <ChevronRight size={17} />
                  </button>
                </div>
              )}
            </section>
          )}

          {reviewResult && activeStep === 3 && Array.isArray(reviewResult.medicines) && reviewResult.medicines.length > 0 && (
            <section className="cl-daily-routine" id="daily-routine" aria-live="polite">
              <div className="cl-routine-heading">
                <span className="cl-review-eyebrow">ഘട്ടം 4 · ദൈനംദിന ക്രമം</span>
                <h2>ദൈനംദിന മരുന്ന് ക്രമം</h2>
                <p>യഥാർത്ഥ കുറിപ്പടിയിൽ വ്യക്തമായി സ്ഥിരീകരിച്ച സമയങ്ങൾ മാത്രം തിരഞ്ഞെടുക്കുക.</p>
              </div>

              <div className="cl-routine-warning">
                <ShieldCheck size={17} />
                <span>കുറിപ്പടിയിലോ ഡോക്ടർ/ഫാർമസിസ്റ്റിന്റെ നിർദ്ദേശത്തിലോ വ്യക്തമാക്കിയ സമയം മാത്രം തിരഞ്ഞെടുക്കുക. സംശയമുണ്ടെങ്കിൽ സമയം തിരഞ്ഞെടുക്കാതെ സഹായം തേടുക.</span>
              </div>

              <div className="cl-routine-list">
                {reviewResult.medicines.map((entry, index) => {
                  const medicine = entry.extracted_medicine || {};
                  const draft = getScheduleDraft(index, medicine);
                  const result = scheduleResults[index];
                  const times = [
                    { value: "morning", label: "രാവിലെ" },
                    { value: "afternoon", label: "ഉച്ചയ്ക്ക്" },
                    { value: "evening", label: "വൈകുന്നേരം" },
                    { value: "night", label: "രാത്രി" },
                  ];

                  return (
                    <article className="cl-routine-medicine" key={`routine-${medicine.medicine_name || "medicine"}-${index}`}>
                      <div className="cl-routine-medicine-title">
                        <div>
                          <span className="cl-review-index">മരുന്ന് {index + 1}</span>
                          <h3>{medicine.medicine_name || "Name not readable"}</h3>
                        </div>
                        <span className="cl-review-pill">പരിശോധന ആവശ്യമാണ്</span>
                      </div>

                      <details className="cl-routine-identity-details">
                        <summary>മരുന്നിന്റെ പേരോ ശക്തിയോ തിരുത്തുക</summary>
                        <div className="cl-routine-form-grid">
                          <label>
                            <span>മരുന്നിന്റെ പേര്</span>
                            <input type="text" value={draft.medicine_name} onChange={(event) => updateScheduleDraft(index, { medicine_name: event.target.value })} autoComplete="off" />
                          </label>
                          <label>
                            <span>ശക്തി</span>
                            <input type="text" value={draft.strength} onChange={(event) => updateScheduleDraft(index, { strength: event.target.value })} placeholder="കുറിപ്പടിയിൽ ഉള്ളതുപോലെ, ഉദാ. 500 mg" autoComplete="off" />
                          </label>
                        </div>
                      </details>
                      <div className="cl-routine-form-grid">
                        <label>
                          <span>ഡോസ് (കുറിപ്പടിയിൽ ഉള്ളതുപോലെ)</span>
                          <input type="text" value={draft.dose} onChange={(event) => updateScheduleDraft(index, { dose: event.target.value })} placeholder="കുറിപ്പടിയിലെ ഡോസ് സ്ഥിരീകരിക്കുക" autoComplete="off" />
                        </label>
                        <p className="cl-routine-source-food">
                          <strong>ഭക്ഷണ നിർദ്ദേശം:</strong>{" "}
                          {medicine.food_instruction || "വായിച്ചെടുക്കാനായില്ല; ഊഹിച്ചിട്ടില്ല."}
                        </p>
                      </div>

                      <fieldset className="cl-routine-times">
                        <legend>സ്ഥിരീകരിച്ച സമയം(ങ്ങൾ)</legend>
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
                              <span>{time.label}</span>
                            </label>
                          ))}
                        </div>
                        <p>1-0-1 പോലുള്ള ഡോസ് രേഖകളിൽ നിന്ന് സമയം സ്വയം കണക്കാക്കില്ല.</p>
                      </fieldset>

                      <p className="cl-routine-confirm-note">
                        സമയംയും ഡോസും ശരിയാണെന്ന് ഉറപ്പാക്കിയ ശേഷം മാത്രം ബട്ടൺ അമർത്തുക.
                      </p>

                      <div className="cl-routine-actions">
                        <button
                          type="button"
                          className="cl-routine-submit"
                          onClick={() => submitDailyRoutine(entry, index)}
                          disabled={Boolean(scheduleLoading[index])}
                        >
                          <CalendarDays size={16} />
                          {scheduleLoading[index] ? "ക്രമം തയ്യാറാക്കുന്നു…" : "സ്ഥിരീകരിച്ച് ക്രമം തയ്യാറാക്കുക"}
                        </button>
                        {result?.status === "ready_for_display" && (
                          <span className="cl-routine-ready">സ്ഥിരീകരിച്ച വിവരങ്ങളിൽ നിന്ന് ക്രമം തയ്യാറാക്കി</span>
                        )}
                      </div>

                      {scheduleErrors[index] && <p className="cl-routine-error" role="alert">{scheduleErrors[index]}</p>}

                      {result?.status === "ready_for_display" && Array.isArray(result.schedule) && (
                        <div className="cl-routine-output">
                          <h4>ദൈനംദിന മരുന്ന് ക്രമം</h4>
                          {result.schedule.map((item, itemIndex) => (
                            <div className="cl-routine-output-row" key={`routine-row-${item.time}-${itemIndex}`}>
                              <strong>{({ morning: "രാവിലെ", afternoon: "ഉച്ചയ്ക്ക്", evening: "വൈകുന്നേരം", night: "രാത്രി" })[item.time] || item.time}</strong>
                              <span>{item.medicine_name} · {item.strength} · {item.dose}</span>
                              {item.instruction && <small>ഭക്ഷണ നിർദ്ദേശം: {item.instruction}</small>}
                            </div>
                          ))}
                          <p>സ്ഥിരീകരിച്ച വിവരങ്ങൾ ക്രമീകരിച്ച് കാണിക്കാനാണ് ഇത്. ഇത് കുറിപ്പടിയോ ചികിത്സാ അംഗീകാരമോ ഓർമ്മപ്പെടുത്തൽ സേവനമോ അല്ല.</p>
                        </div>
                      )}
                    </article>
                  );
                })}
              </div>
              <div className="cl-workflow-next">
                <button
                  type="button"
                  className="cl-routine-submit"
                  onClick={() => setActiveStep(4)}
                >
                  അടുത്ത ഘട്ടം: മലയാളം ശബ്ദസഹായി
                  <Volume2 size={17} />
                </button>
              </div>
            </section>
          )}

          {/* ഘട്ടം 5: മലയാളം ശബ്ദസഹായി */}
          {reviewResult && activeStep === 4 && Array.isArray(reviewResult.medicines) && reviewResult.medicines.length > 0 && (
            <section className="cl-audio-guide-section" id="audio-guide" aria-live="polite">
              <div className="cl-routine-heading">
                <span className="cl-review-eyebrow">ഘട്ടം 5 · മലയാളം ശബ്ദസഹായി</span>
                <h2>മരുന്ന് വിവരങ്ങൾ മലയാളത്തിൽ കേൾക്കുക</h2>
                <p>മൂന്നാം ഘട്ടത്തിൽ യഥാർത്ഥ കുറിപ്പടിയുമായി താരതമ്യം ചെയ്ത് പരിശോധിച്ച വിവരങ്ങൾ മാത്രം ഇവിടെ കേൾക്കാം.</p>
              </div>

              <div className="cl-routine-warning">
                <Volume2 size={17} />
                <span>ശബ്ദസഹായി കുറിപ്പടിയിൽ നിന്ന് ലഭിച്ച വിവരങ്ങൾ വായിച്ചു കേൾപ്പിക്കുക മാത്രമാണ് ചെയ്യുന്നത്. മരുന്നിന്റെയോ ഡോസിന്റെയോ ചികിത്സാ അംഗീകാരമല്ല ഇത്. വ്യക്തമല്ലാത്ത വിവരങ്ങൾ ഊഹിക്കില്ല.</span>
              </div>

              <div className="cl-routine-list">
                {reviewResult.medicines.map((entry, index) => {
                  const medicine = entry.extracted_medicine || {};
                  return (
                    <article className="cl-routine-medicine" key={`audio-${medicine.medicine_name || "medicine"}-${index}`}>
                      <div className="cl-routine-medicine-title">
                        <div>
                          <span className="cl-review-index">മരുന്ന് {index + 1}</span>
                          <h3>{medicine.medicine_name || "പേര് വായിക്കാനായില്ല"}</h3>
                        </div>
                        <span className="cl-review-pill">{reviewConfirmed[index] ? "വിവരങ്ങൾ പരിശോധിച്ചു" : "പരിശോധന ആവശ്യമാണ്"}</span>
                      </div>

                      <dl className="cl-review-fields">
                        <div><dt>ശക്തി</dt><dd>{medicine.strength || "ലഭ്യമല്ല"}</dd></div>
                        <div><dt>ഡോസ് രേഖ</dt><dd>{medicine.original_dosage_notation || medicine.prescribed_dose || "ലഭ്യമല്ല"}</dd></div>
                        <div><dt>ആവൃത്തി</dt><dd>{medicine.frequency || "ലഭ്യമല്ല"}</dd></div>
                        <div><dt>ഭക്ഷണ നിർദ്ദേശം</dt><dd>{medicine.food_instruction || "ലഭ്യമല്ല"}</dd></div>
                        <div><dt>കാലയളവ്</dt><dd>{medicine.duration || "ലഭ്യമല്ല"}</dd></div>
                      </dl>

                      {!reviewConfirmed[index] && (
                        <p className="cl-routine-error">ശബ്ദം കേൾക്കുന്നതിന് മുമ്പ് മൂന്നാം ഘട്ടത്തിൽ ഈ വിവരങ്ങൾ യഥാർത്ഥ കുറിപ്പടിയുമായി താരതമ്യം ചെയ്ത് പരിശോധിക്കുക.</p>
                      )}

                      <div className="cl-audio-actions">
                        <button
                          type="button"
                          className="cl-audio-button"
                          onClick={() => speakMedicineAudio(medicine, index)}
                          disabled={!reviewConfirmed[index]}
                        >
                          <Volume2 size={16} />
                          {speakingMedicineIndex === index ? "ശബ്ദം പ്ലേ ചെയ്യുന്നു…" : "മലയാളത്തിൽ കേൾക്കുക"}
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
                    </article>
                  );
                })}
              </div>
              {audioStatus && (
                <p className="cl-audio-status" role="status" aria-live="polite">{audioStatus}</p>
              )}
              <div className="cl-workflow-next">
                <button
                  type="button"
                  className="cl-routine-submit"
                  onClick={() => setMessage("പ്രിന്റ് ചാർട്ട് സൗകര്യം ഉടൻ ലഭ്യമാകും.")}
                >
                  അടുത്ത ഘട്ടം: പ്രിന്റ് ചാർട്ട്
                  <ChevronRight size={17} />
                </button>
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

