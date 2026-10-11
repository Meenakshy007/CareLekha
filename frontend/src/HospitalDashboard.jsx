import React, { useState } from "react";

import {
  LayoutDashboard,
  Users,
  FileText,
  Languages,
  ClipboardList,
  Pill,
  Bell,
  Search,
  Settings,
  LogOut,
  Menu,
  X,
  ArrowUpRight,
  ArrowRight,
  Plus,
  Printer,
  Eye,
  Clock,
  CheckCircle2,
  AlertCircle,
  Activity,
  CalendarDays,
  Upload,
  FilePlus2,
  HeartPulse,
  ChevronDown,
  Stethoscope,
  ChartNoAxesCombined,
} from "lucide-react";

import "./HospitalDashboard.css";

const initialPatients = [
  {
    id: "PT001",
    name: "Anjali K",
    age: 23,
    gender: "Female",
    document: "Prescription",
    department: "General Medicine",
    status: "Malayalam Ready",
    color: "green",
  },
  {
    id: "PT002",
    name: "Rahul S",
    age: 45,
    gender: "Male",
    document: "Discharge Summary",
    department: "Cardiology",
    status: "Needs Review",
    color: "yellow",
  },
  {
    id: "PT003",
    name: "Meera P",
    age: 31,
    gender: "Female",
    document: "Medicine Instructions",
    department: "Orthopedics",
    status: "Shared with Patient",
    color: "blue",
  },
  {
    id: "PT004",
    name: "Vijayan K",
    age: 62,
    gender: "Male",
    document: "Follow-up Instructions",
    department: "General Medicine",
    status: "Reminder Scheduled",
    color: "purple",
  },
  {
    id: "PT005",
    name: "Sreelakshmi R",
    age: 27,
    gender: "Female",
    document: "Prescription",
    department: "Gynecology",
    status: "Malayalam Ready",
    color: "green",
  },
];

const navigation = [
  {
    label: "Dashboard",
    icon: LayoutDashboard,
  },
  {
    label: "Patients",
    icon: Users,
  },
  {
    label: "Prescription Translation",
    icon: Languages,
  },
  {
    label: "Discharge Summaries",
    icon: FileText,
  },
  {
    label: "Medicine Instructions",
    icon: Pill,
  },
  {
    label: "Follow-ups & Reminders",
    icon: CalendarDays,
  },
  {
    label: "Reports",
    icon: ChartNoAxesCombined,
  },
  {
    label: "Settings",
    icon: Settings,
  },
];

function HospitalDashboard({
  profile,
  onLogout,
}) {
  const [activePage, setActivePage] = useState("Dashboard");

  const [patients] = useState(initialPatients);

  const [searchQuery, setSearchQuery] = useState("");

  const [showNotifications, setShowNotifications] =
    useState(false);

  const [selectedPatient, setSelectedPatient] =
    useState(null);

  const [showUploadModal, setShowUploadModal] =
    useState(false);

  const [uploadedFile, setUploadedFile] = useState(null);
  const [uploadError, setUploadError] = useState("");
  const [uploadNotice, setUploadNotice] = useState("");
  const [isProcessingDocument, setIsProcessingDocument] = useState(false);
  const [extractedMedicines, setExtractedMedicines] = useState([]);
  const [translationText, setTranslationText] = useState("");
  const [translatedText, setTranslatedText] = useState("");
  const [isTranslating, setIsTranslating] = useState(false);
  const [reviewConfirmed, setReviewConfirmed] = useState(false);

  const [mobileMenuOpen, setMobileMenuOpen] =
    useState(false);

  const hospitalName =
    profile?.hospitalName ||
    profile?.name ||
    "St. Joseph's Hospital";

  const filteredPatients = patients.filter((patient) => {
    const search = searchQuery.toLowerCase();

    return (
      patient.name.toLowerCase().includes(search) ||
      patient.document.toLowerCase().includes(search) ||
      patient.department.toLowerCase().includes(search) ||
      patient.id.toLowerCase().includes(search)
    );
  });

  const handleNavigation = (page) => {
    setActivePage(page);
    setMobileMenuOpen(false);
  };

  const handleUpload = (event) => {
    const file = event.target.files?.[0];
    setUploadError("");
    setUploadNotice("");

    if (!file) {
      setUploadedFile(null);
      return;
    }

    const allowedTypes = ["application/pdf", "image/jpeg", "image/png", "image/webp"];
    const allowedExtensions = /\\.(pdf|jpe?g|png|webp)$/i;
    if (!allowedTypes.includes(file.type) && !allowedExtensions.test(file.name)) {
      setUploadedFile(null);
      setUploadError("Please choose a PDF, JPG, PNG, or WebP file.");
      event.target.value = "";
      return;
    }

    if (file.size > 10 * 1024 * 1024) {
      setUploadedFile(null);
      setUploadError("The file is too large. Please choose a file smaller than 10 MB.");
      event.target.value = "";
      return;
    }

    setUploadedFile(file);
  };

  const handlePrint = () => {
    window.print();
  };

  const handleUploadSubmit = async (event) => {
    event.preventDefault();
    setUploadError("");
    setUploadNotice("");
    setExtractedMedicines([]);
    setTranslatedText("");
    setReviewConfirmed(false);
    if (!uploadedFile) {
      setUploadError("Please choose a document first.");
      return;
    }
    if (uploadedFile.type === "application/pdf" || uploadedFile.name.toLowerCase().endsWith(".pdf")) {
      setUploadError("The current OCR service accepts JPG, PNG, or WebP images only. PDF support will be added next.");
      return;
    }
    setIsProcessingDocument(true);
    try {
      const formData = new FormData();
      formData.append("file", uploadedFile);
      const response = await fetch("http://127.0.0.1:8000/extract-prescription", { method: "POST", body: formData });
      const payload = await response.json().catch(() => ({}));
      if (!response.ok) throw new Error(payload.detail || "Could not read the document. Check that the OCR API is running.");
      const medicines = Array.isArray(payload.medicines) ? payload.medicines : [];
      setExtractedMedicines(medicines);
      setTranslationText(medicines.map((m) => [
        m.medicine_name, m.strength, m.original_dosage_notation || m.prescribed_dose,
        m.frequency, m.food_instruction, m.duration
      ].filter(Boolean).join(" · ")).join("\\n"));
      setUploadNotice(medicines.length ? "Extraction finished. Compare every field with the original document." : "No medicine entries were detected. Try a clearer image.");
    } catch (error) {
      setUploadError(error instanceof Error ? error.message : "Document processing failed.");
    } finally {
      setIsProcessingDocument(false);
    }
  };

  const updateExtractedMedicine = (index, field, value) => {
    setExtractedMedicines((previous) => {
      const updated = previous.map((medicine, i) =>
        i === index ? { ...medicine, [field]: value, uncertainty: "Edited; verify against original" } : medicine
      );
      setTranslationText(updated.map((m) =>
        [m.medicine_name, m.strength, m.original_dosage_notation || m.prescribed_dose, m.frequency, m.food_instruction, m.duration]
          .filter(Boolean).join(" · ")
      ).join("\\n"));
      return updated;
    });
    setReviewConfirmed(false);
    setTranslatedText("");
  };

  const handleTranslateReviewedText = async () => {
    setUploadError("");
    setTranslatedText("");
    if (!reviewConfirmed) {
      setUploadError("Confirm that you compared the extracted details with the original document first.");
      return;
    }
    if (!translationText.trim()) {
      setUploadError("Enter the reviewed instructions to translate.");
      return;
    }
    setIsTranslating(true);
    try {
      const response = await fetch("http://127.0.0.1:8004/translate-malayalam", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ text: translationText.trim() }),
      });
      const payload = await response.json().catch(() => ({}));
      if (!response.ok) throw new Error(payload.detail || "Translation failed. Check the translation API and its configuration.");
      if (!payload.translation) throw new Error("The translation service returned an empty result.");
      setTranslatedText(payload.translation);
      setUploadNotice("Translation generated. A healthcare professional must review it before sharing.");
    } catch (error) {
      setUploadError(error instanceof Error ? error.message : "Translation failed.");
    } finally {
      setIsTranslating(false);
    }
  };

  const pageDescriptions = {
    Dashboard:
      "Help every patient understand their care in their own language.",

    Patients:
      "View and manage patient information and care records.",

    "Prescription Translation":
      "Prepare prescriptions in simple Malayalam for patients.",

    "Discharge Summaries":
      "Make hospital discharge instructions easier to understand.",

    "Medicine Instructions":
      "Organize medicine schedules and patient-friendly instructions.",

    "Follow-ups & Reminders":
      "Keep track of appointments and follow-up instructions.",

    Reports:
      "Review prescription processing and patient instruction activity.",

    Settings:
      "Manage hospital information and dashboard preferences.",
  };

  const pageTitles = {
    Dashboard: "Hospital Dashboard",
    Patients: "Patient Management",
    "Prescription Translation": "Prescription Translation",
    "Discharge Summaries": "Discharge Summaries",
    "Medicine Instructions": "Medicine Instructions",
    "Follow-ups & Reminders": "Follow-ups & Reminders",
    Reports: "Hospital Reports",
    Settings: "Hospital Settings",
  };

  return (
    <div className="carelekha-dashboard">

      {/* SIDEBAR */}

      <aside
        className={`carelekha-sidebar ${
          mobileMenuOpen ? "sidebar-open" : ""
        }`}
      >
        <div className="carelekha-sidebar-brand">

          <img
            src="/images/carelekha-logo.png"
            alt="CareLekha"
            className="dashboard-logo"
          />

          <button
            type="button"
            className="sidebar-close"
            onClick={() => setMobileMenuOpen(false)}
            aria-label="Close navigation"
          >
            <X size={20} />
          </button>
        </div>

        <div className="sidebar-caption">
          HOSPITAL MANAGEMENT
        </div>

        <nav className="dashboard-navigation">
          {navigation.map((item) => {
            const Icon = item.icon;

            return (
              <button
                type="button"
                key={item.label}
                className={`dashboard-nav-item ${
                  activePage === item.label ? "active" : ""
                }`}
                onClick={() => handleNavigation(item.label)}
              >
                <Icon size={19} strokeWidth={1.9} />

                <span>{item.label}</span>
              </button>
            );
          })}
        </nav>

        <div className="sidebar-help-card">
          <div className="sidebar-help-icon">
            <HeartPulse size={23} />
          </div>

          <h4>Care in every language</h4>

          <p>
            Helping patients understand their treatment,
            one instruction at a time.
          </p>
        </div>

        <button
          type="button"
          className="sidebar-logout"
          onClick={onLogout}
        >
          <LogOut size={19} />
          <span>Logout</span>
        </button>
      </aside>

      {/* MAIN APPLICATION */}

      <main className="carelekha-main">

        {/* TOP HEADER */}

        <header className="dashboard-topbar">

          <button
            type="button"
            className="mobile-menu-button"
            onClick={() => setMobileMenuOpen(true)}
            aria-label="Open navigation"
          >
            <Menu size={23} />
          </button>

          <div className="dashboard-search">
            <Search size={19} />

            <input
              type="search"
              placeholder="Search patients, prescriptions, or records..."
              value={searchQuery}
              onChange={(event) =>
                setSearchQuery(event.target.value)
              }
              aria-label="Search patients and records"
            />
          </div>

          <div className="dashboard-topbar-actions">

            <div className="notification-container">

              <button
                type="button"
                className="notification-button"
                onClick={() =>
                  setShowNotifications(!showNotifications)
                }
                aria-label="Notifications"
              >
                <Bell size={21} />
                <span className="notification-count">3</span>
              </button>

              {showNotifications && (
                <div className="notification-popover">
                  <h3>Notifications</h3>

                  <p>
                    <AlertCircle size={17} />
                    One discharge summary needs review.
                  </p>

                  <p>
                    <CalendarDays size={17} />
                    Three patient follow-ups are pending.
                  </p>

                  <p>
                    <FileText size={17} />
                    Prescription processing is ready to begin.
                  </p>
                </div>
              )}

            </div>

            <div className="dashboard-admin-profile">
              <div className="admin-avatar">
                {(hospitalName || "H").charAt(0).toUpperCase()}
              </div>

              <div className="admin-profile-text">
                <strong>{hospitalName}</strong>
                <span>Hospital Admin</span>
              </div>

              <ChevronDown size={17} />
            </div>

          </div>
        </header>

        {/* PAGE CONTENT */}

        <div className="dashboard-content">

          {/* WELCOME BANNER */}

          <section className="dashboard-welcome-banner">

            <div className="welcome-banner-content">

              <span className="welcome-overline">
                CARELEKHA HOSPITAL PORTAL
              </span>

              <h1>
                Good morning,
                <br />
                {hospitalName}
                <span className="welcome-leaf"> ✦</span>
              </h1>

              <p>
                {pageDescriptions[activePage]}
              </p>

              <div className="welcome-language-badge">
                <Languages size={16} />
                Malayalam patient instructions
              </div>

            </div>

            <div className="welcome-decoration">
              <div className="welcome-decoration-circle">
                <Stethoscope size={68} strokeWidth={1.2} />
              </div>

              <div className="welcome-decoration-leaf leaf-one" />
              <div className="welcome-decoration-leaf leaf-two" />
            </div>

          </section>

          {/* PAGE HEADING */}

          <div className="dashboard-page-heading">

            <div>
              <h2>{pageTitles[activePage]}</h2>

              <p>
                {activePage === "Dashboard"
                  ? "Your hospital's patient communication overview."
                  : pageDescriptions[activePage]}
              </p>
            </div>

            <div className="dashboard-date">
              <CalendarDays size={17} />

              {new Date().toLocaleDateString("en-IN", {
                day: "numeric",
                month: "short",
                year: "numeric",
              })}
            </div>

          </div>

          {/* DASHBOARD OVERVIEW */}

          {activePage === "Dashboard" && (
            <>

              {/* STATISTICS */}

              <section className="dashboard-stat-grid">

                <StatCard
                  icon={FileText}
                  label="Prescriptions Processed"
                  value="98"
                  change="+18%"
                  description="from last week"
                  color="green"
                />

                <StatCard
                  icon={Languages}
                  label="Malayalam Summaries Ready"
                  value="42"
                  change="+25%"
                  description="from last week"
                  color="blue"
                />

                <StatCard
                  icon={Pill}
                  label="Patient Instructions"
                  value="76"
                  change="+15%"
                  description="prepared for patients"
                  color="yellow"
                />

                <StatCard
                  icon={CalendarDays}
                  label="Follow-ups Due Today"
                  value="12"
                  change="Pending"
                  description="reminders to review"
                  color="pink"
                />

              </section>

              {/* MAIN DASHBOARD GRID */}

              <div className="dashboard-main-grid">

                {/* RECENT PATIENTS */}

                <section className="dashboard-panel patients-panel">

                  <div className="panel-heading">

                    <div>
                      <h3>Recent Patient Instructions</h3>

                      <p>
                        Prescriptions, summaries and medicine instructions
                      </p>
                    </div>

                    <button
                      type="button"
                      className="panel-link"
                      onClick={() => handleNavigation("Patients")}
                    >
                      View all
                      <ArrowRight size={16} />
                    </button>

                  </div>

                  <div className="patients-table-wrapper">

                    <table className="patients-table">

                      <thead>
                        <tr>
                          <th>Patient</th>
                          <th>Document</th>
                          <th>Department</th>
                          <th>Status</th>
                          <th>Action</th>
                        </tr>
                      </thead>

                      <tbody>

                        {filteredPatients.slice(0, 5).map((patient) => (
                          <tr key={patient.id}>

                            <td>
                              <div className="patient-name-cell">

                                <div
                                  className={`patient-avatar ${patient.color}`}
                                >
                                  {patient.name.charAt(0)}
                                </div>

                                <div>
                                  <strong>{patient.name}</strong>
                                  <span>
                                    {patient.age} years · {patient.id}
                                  </span>
                                </div>

                              </div>
                            </td>

                            <td>{patient.document}</td>

                            <td>{patient.department}</td>

                            <td>
                              <span
                                className={`patient-status ${patient.color}`}
                              >
                                {patient.status}
                              </span>
                            </td>

                            <td>
                              <button
                                type="button"
                                className="table-view-button"
                                onClick={() =>
                                  setSelectedPatient(patient)
                                }
                              >
                                <Eye size={15} />
                                View
                              </button>
                            </td>

                          </tr>
                        ))}

                        {filteredPatients.length === 0 && (
                          <tr>
                            <td colSpan="5" className="empty-table">
                              No matching patient records found.
                            </td>
                          </tr>
                        )}

                      </tbody>

                    </table>

                  </div>

                </section>

                {/* PATIENT COMMUNICATION WORKFLOW */}

                <section className="dashboard-panel workflow-panel">

                  <div className="panel-heading">
                    <div>
                      <h3>Patient Understanding Support</h3>

                      <p>
                        From hospital document to clear instructions
                      </p>
                    </div>
                  </div>

                  <div className="workflow-list">

                    <WorkflowStep
                      number="1"
                      icon={Upload}
                      title="Upload hospital document"
                      description="Prescription, discharge summary or medicine list"
                    />

                    <WorkflowStep
                      number="2"
                      icon={Languages}
                      title="Prepare Malayalam instructions"
                      description="Convert medical information into patient-friendly language"
                    />

                    <WorkflowStep
                      number="3"
                      icon={CheckCircle2}
                      title="Doctor reviews content"
                      description="Check accuracy and safety before sharing"
                    />

                    <WorkflowStep
                      number="4"
                      icon={Printer}
                      title="Share or print instructions"
                      description="Provide a printed sheet or share it digitally"
                    />

                  </div>

                </section>

                {/* QUICK ACTIONS */}

                <section className="dashboard-panel quick-actions-panel">

                  <div className="panel-heading">
                    <div>
                      <h3>Quick Actions</h3>

                      <p>
                        Start a new patient communication task
                      </p>
                    </div>
                  </div>

                  <div className="quick-actions-grid">

                    <QuickAction
                      icon={FilePlus2}
                      title="Upload Prescription"
                      description="Prepare Malayalam instructions"
                      color="green"
                      onClick={() =>
                        setShowUploadModal(true)
                      }
                    />

                    <QuickAction
                      icon={FileText}
                      title="Discharge Summary"
                      description="Create patient-friendly summaries"
                      color="blue"
                      onClick={() =>
                        handleNavigation("Discharge Summaries")
                      }
                    />

                    <QuickAction
                      icon={Languages}
                      title="Review Translation"
                      description="Check translated instructions"
                      color="yellow"
                      onClick={() =>
                        handleNavigation("Prescription Translation")
                      }
                    />

                    <QuickAction
                      icon={Users}
                      title="Manage Patients"
                      description="View patient records"
                      color="purple"
                      onClick={() =>
                        handleNavigation("Patients")
                      }
                    />

                  </div>

                </section>

                {/* RECENT ACTIVITY */}

                <section className="dashboard-panel activity-panel">

                  <div className="panel-heading">
                    <div>
                      <h3>Recent Activity</h3>

                      <p>
                        Recent hospital communication tasks
                      </p>
                    </div>
                  </div>

                  <div className="activity-list">

                    <ActivityItem
                      icon={FileText}
                      title="Prescription prepared"
                      description="Anjali K · Malayalam instructions"
                      time="10 minutes ago"
                      color="green"
                    />

                    <ActivityItem
                      icon={ClipboardList}
                      title="Discharge summary needs review"
                      description="Rahul S · Awaiting approval"
                      time="1 hour ago"
                      color="blue"
                    />

                    <ActivityItem
                      icon={Pill}
                      title="Medicine instructions updated"
                      description="Meera P · Medicine schedule"
                      time="3 hours ago"
                      color="yellow"
                    />

                    <ActivityItem
                      icon={CalendarDays}
                      title="Follow-up reminder scheduled"
                      description="Vijayan K · Follow-up care"
                      time="4 hours ago"
                      color="purple"
                    />

                  </div>

                </section>

                {/* PRINT SUPPORT */}

                <section className="print-support-card">

                  <div className="print-support-icon">
                    <Printer size={30} />
                  </div>

                  <div className="print-support-content">

                    <span className="print-support-label">
                      PATIENT ACCESSIBILITY
                    </span>

                    <h3>No smartphone? No problem.</h3>

                    <p>
                      Provide clear Malayalam medicine and discharge
                      instructions as a printed sheet for patients
                      and caregivers.
                    </p>

                    <button
                      type="button"
                      onClick={handlePrint}
                    >
                      <Printer size={17} />
                      Print Dashboard
                    </button>

                  </div>

                </section>

              </div>

            </>
          )}

          {/* PATIENT MANAGEMENT PAGE */}

          {activePage === "Patients" && (
            <section className="dashboard-panel full-page-panel">

              <div className="panel-heading">
                <div>
                  <h3>Patient Records</h3>

                  <p>
                    Search patients and view their communication status.
                  </p>
                </div>

                <button
                  type="button"
                  className="primary-dashboard-button"
                  onClick={() =>
                    setShowUploadModal(true)
                  }
                >
                  <Plus size={17} />
                  Upload Document
                </button>
              </div>

              <div className="patients-table-wrapper">

                <table className="patients-table">

                  <thead>
                    <tr>
                      <th>Patient</th>
                      <th>Document</th>
                      <th>Department</th>
                      <th>Status</th>
                      <th>Action</th>
                    </tr>
                  </thead>

                  <tbody>

                    {filteredPatients.map((patient) => (
                      <tr key={patient.id}>

                        <td>
                          <div className="patient-name-cell">
                            <div
                              className={`patient-avatar ${patient.color}`}
                            >
                              {patient.name.charAt(0)}
                            </div>

                            <div>
                              <strong>{patient.name}</strong>
                              <span>{patient.id}</span>
                            </div>
                          </div>
                        </td>

                        <td>{patient.document}</td>

                        <td>{patient.department}</td>

                        <td>
                          <span
                            className={`patient-status ${patient.color}`}
                          >
                            {patient.status}
                          </span>
                        </td>

                        <td>
                          <button
                            type="button"
                            className="table-view-button"
                            onClick={() =>
                              setSelectedPatient(patient)
                            }
                          >
                            <Eye size={15} />
                            View
                          </button>
                        </td>

                      </tr>
                    ))}

                  </tbody>

                </table>

              </div>

            </section>
          )}

          {/* PRESCRIPTION TRANSLATION */}

          {activePage === "Prescription Translation" && (
            <section className="dashboard-panel full-page-panel">

              <div className="panel-heading">
                <div>
                  <h3>Prescription Translation</h3>

                  <p>
                    Prepare Malayalam instructions from hospital
                    prescriptions.
                  </p>
                </div>
              </div>

              <div className="feature-page-content">

                <div className="feature-page-icon green">
                  <Languages size={35} />
                </div>

                <h3>Make prescriptions easier to understand</h3>

                <p>
                  Upload a prescription document to begin the
                  Malayalam instruction preparation workflow.
                </p>

                <button
                  type="button"
                  className="primary-dashboard-button"
                  onClick={() =>
                    setShowUploadModal(true)
                  }
                >
                  <Upload size={18} />
                  Upload Prescription
                </button>

                <div className="feature-note">
                  <AlertCircle size={17} />

                  Translated instructions should be reviewed by
                  authorized healthcare staff before being given
                  to a patient.
                </div>

              </div>

            </section>
          )}

          {/* OTHER MODULE PLACEHOLDERS */}

          {[
            "Discharge Summaries",
            "Medicine Instructions",
            "Follow-ups & Reminders",
            "Reports",
            "Settings",
          ].includes(activePage) && (
            <section className="dashboard-panel full-page-panel">

              <div className="feature-page-content">

                <div className="feature-page-icon green">
                  {activePage === "Discharge Summaries" && (
                    <FileText size={35} />
                  )}

                  {activePage === "Medicine Instructions" && (
                    <Pill size={35} />
                  )}

                  {activePage === "Follow-ups & Reminders" && (
                    <CalendarDays size={35} />
                  )}

                  {activePage === "Reports" && (
                    <Activity size={35} />
                  )}

                  {activePage === "Settings" && (
                    <Settings size={35} />
                  )}
                </div>

                <h3>{pageTitles[activePage]}</h3>

                <p>{pageDescriptions[activePage]}</p>

                {activePage === "Discharge Summaries" && (
                  <button
                    type="button"
                    className="primary-dashboard-button"
                    onClick={() =>
                      setShowUploadModal(true)
                    }
                  >
                    <FilePlus2 size={18} />
                    Start Discharge Summary
                  </button>
                )}

                {activePage === "Medicine Instructions" && (
                  <button
                    type="button"
                    className="primary-dashboard-button"
                    onClick={() =>
                      setShowUploadModal(true)
                    }
                  >
                    <Pill size={18} />
                    Prepare Medicine Instructions
                  </button>
                )}

                {activePage === "Follow-ups & Reminders" && (
                  <div className="feature-note">
                    <Clock size={17} />
                    Follow-up management can be connected
                    to your backend next.
                  </div>
                )}

                {activePage === "Reports" && (
                  <div className="feature-note">
                    <ChartNoAxesCombined size={17} />
                    Connect your backend to display actual
                    hospital activity and reports.
                  </div>
                )}

                {activePage === "Settings" && (
                  <div className="feature-note">
                    <Settings size={17} />
                    Hospital profile and account settings
                    can be configured here.
                  </div>
                )}

              </div>

            </section>
          )}

        </div>
      </main>

      {/* MOBILE SIDEBAR BACKDROP */}

      {mobileMenuOpen && (
        <button
          type="button"
          className="sidebar-backdrop"
          onClick={() => setMobileMenuOpen(false)}
          aria-label="Close navigation backdrop"
        />
      )}

      {/* PATIENT DETAILS MODAL */}

      {selectedPatient && (
        <div
          className="dashboard-modal-overlay"
          onClick={() => setSelectedPatient(null)}
        >
          <section
            className="dashboard-modal"
            role="dialog"
            aria-modal="true"
            aria-labelledby="patient-modal-title"
            onClick={(event) => event.stopPropagation()}
          >

            <button
              type="button"
              className="modal-close-button"
              onClick={() => setSelectedPatient(null)}
              aria-label="Close patient details"
            >
              <X size={20} />
            </button>

            <div className="modal-heading-icon">
              <Users size={26} />
            </div>

            <h2 id="patient-modal-title">
              Patient Information
            </h2>

            <p className="modal-subtitle">
              Sample patient record
            </p>

            <div className="patient-detail-list">

              <div>
                <span>Patient name</span>
                <strong>{selectedPatient.name}</strong>
              </div>

              <div>
                <span>Patient ID</span>
                <strong>{selectedPatient.id}</strong>
              </div>

              <div>
                <span>Age / Gender</span>
                <strong>
                  {selectedPatient.age} / {selectedPatient.gender}
                </strong>
              </div>

              <div>
                <span>Department</span>
                <strong>{selectedPatient.department}</strong>
              </div>

              <div>
                <span>Document</span>
                <strong>{selectedPatient.document}</strong>
              </div>

              <div>
                <span>Status</span>
                <strong>{selectedPatient.status}</strong>
              </div>

            </div>

            <button
              type="button"
              className="primary-dashboard-button modal-done-button"
              onClick={() => setSelectedPatient(null)}
            >
              Close
            </button>

          </section>
        </div>
      )}

      {/* DOCUMENT UPLOAD MODAL */}

      {showUploadModal && (
        <div
          className="dashboard-modal-overlay"
          onClick={() => setShowUploadModal(false)}
        >
          <section
            className="dashboard-modal upload-modal"
            role="dialog"
            aria-modal="true"
            aria-labelledby="upload-modal-title"
            onClick={(event) => event.stopPropagation()}
          >

            <button
              type="button"
              className="modal-close-button"
              onClick={() => setShowUploadModal(false)}
              aria-label="Close upload dialog"
            >
              <X size={20} />
            </button>

            <div className="modal-heading-icon">
              <Upload size={26} />
            </div>

            <h2 id="upload-modal-title">
              Upload Hospital Document
            </h2>

            <p className="modal-subtitle">
              Select a prescription or discharge document.
            </p>

            <form onSubmit={handleUploadSubmit}>

              <label className="upload-dropzone">

                <Upload size={32} />

                <strong>
                  {uploadedFile
                    ? uploadedFile.name
                    : "Choose a document"}
                </strong>

                <span>
                  JPG, PNG or WebP · Maximum file size 10 MB
                </span>
                {uploadedFile && (
                  <small aria-live="polite">
                    {(uploadedFile.size / (1024 * 1024)).toFixed(2)} MB selected
                  </small>
                )}

                <input
                  type="file"
                  accept=".pdf,.png,.jpg,.jpeg,.webp"
                  onChange={handleUpload}
                  required
                />

              </label>

              {uploadError && (
                <p className="upload-feedback upload-feedback-error" role="alert">{uploadError}</p>
              )}
              {uploadNotice && (
                <p className="upload-feedback upload-feedback-success" role="status" aria-live="polite">{uploadNotice}</p>
              )}
              <div className="upload-review-note">
                <AlertCircle size={17} />
                For privacy, use a test document for now. Server upload, secure storage, text extraction and translation are not connected yet.
              </div>

              <button
                type="submit"
                className="primary-dashboard-button upload-submit-button"
                disabled={isProcessingDocument}
              >
                {isProcessingDocument ? "Reading document…" : "Upload and extract"}
                {!isProcessingDocument && <ArrowRight size={18} />}
              </button>

            </form>

            {extractedMedicines.length > 0 && (
              <section className="upload-review-section">
                <h3>Review extracted medicine details</h3>
                <p>Compare each value with the original. Do not guess unclear medicine names, strengths, or doses.</p>
                {extractedMedicines.map((medicine, index) => (
                  <article className="upload-medicine-review" key={`medicine-${index}`}>
                    <h4>Medicine {index + 1}</h4>
                    {[
                      ["medicine_name", "Medicine name"],
                      ["strength", "Strength"],
                      ["prescribed_dose", "Prescribed dose"],
                      ["original_dosage_notation", "Original dose notation"],
                      ["frequency", "Frequency"],
                      ["food_instruction", "Food instruction"],
                      ["duration", "Duration"],
                    ].map(([field, label]) => (
                      <label className="upload-review-field" key={field}>
                        <span>{label}</span>
                        <input value={medicine[field] || ""} onChange={(event) => updateExtractedMedicine(index, field, event.target.value)} placeholder="Not detected — verify against original" />
                      </label>
                    ))}
                    <small>{medicine.uncertainty || "Review required"}</small>
                  </article>
                ))}
                <label className="upload-confirm-review">
                  <input type="checkbox" checked={reviewConfirmed} onChange={(event) => { setReviewConfirmed(event.target.checked); setTranslatedText(""); }} />
                  <span>I checked the extracted details against the original document.</span>
                </label>
                <label className="upload-review-field upload-translation-input">
                  <span>Reviewed text to translate</span>
                  <textarea rows={5} value={translationText} onChange={(event) => { setTranslationText(event.target.value); setTranslatedText(""); setReviewConfirmed(false); }} />
                </label>
                <button type="button" className="primary-dashboard-button upload-submit-button" onClick={handleTranslateReviewedText} disabled={isTranslating}>
                  {isTranslating ? "Translating…" : "Translate reviewed text to Malayalam"}
                  {!isTranslating && <Languages size={18} />}
                </button>
              </section>
            )}
            {translatedText && (
              <section className="upload-translation-result" aria-live="polite">
                <h3>Malayalam translation — review required</h3>
                <p>{translatedText}</p>
                <div className="upload-review-note"><AlertCircle size={17} /> A qualified healthcare professional must verify this translation against the original before sharing. This prototype does not save or distribute documents.</div>
                <button type="button" className="primary-dashboard-button" onClick={() => window.print()}><Printer size={17} /> Print for review</button>
              </section>
            )}

          </section>
        </div>
      )}

    </div>
  );
}


/* STATISTIC CARD */

function StatCard({
  icon: Icon,
  label,
  value,
  change,
  description,
  color,
}) {
  return (
    <article className="dashboard-stat-card">

      <div className={`stat-icon ${color}`}>
        <Icon size={26} strokeWidth={1.8} />
      </div>

      <div className="stat-content">

        <span className="stat-label">
          {label}
        </span>

        <div className="stat-value-row">

          <strong>{value}</strong>

          <span className={`stat-change ${color}`}>
            {color === "pink" ? (
              <Clock size={14} />
            ) : (
              <ArrowUpRight size={15} />
            )}

            {change}
          </span>

        </div>

        <span className="stat-description">
          {description}
        </span>

      </div>

    </article>
  );
}


/* WORKFLOW STEP */

function WorkflowStep({
  number,
  icon: Icon,
  title,
  description,
}) {
  return (
    <div className="workflow-step">

      <div className="workflow-number">
        {number}
      </div>

      <div className="workflow-icon">
        <Icon size={21} />
      </div>

      <div className="workflow-text">
        <strong>{title}</strong>
        <p>{description}</p>
      </div>

    </div>
  );
}


/* QUICK ACTION */

function QuickAction({
  icon: Icon,
  title,
  description,
  color,
  onClick,
}) {
  return (
    <button
      type="button"
      className={`quick-action-card ${color}`}
      onClick={onClick}
    >

      <div className="quick-action-icon">
        <Icon size={24} />
      </div>

      <strong>{title}</strong>

      <p>{description}</p>

      <span className="quick-action-arrow">
        <ArrowRight size={16} />
      </span>

    </button>
  );
}


/* ACTIVITY ITEM */

function ActivityItem({
  icon: Icon,
  title,
  description,
  time,
  color,
}) {
  return (
    <div className="activity-item">

      <div className={`activity-icon ${color}`}>
        <Icon size={17} />
      </div>

      <div className="activity-text">
        <strong>{title}</strong>
        <p>{description}</p>
        <span>{time}</span>
      </div>

    </div>
  );
}

export default HospitalDashboard;