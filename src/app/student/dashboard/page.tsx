import type { Metadata } from "next";
import { redirect } from "next/navigation";
import Link from "next/link";
import {
  ArrowRight,
  BookOpen,
  Calendar as CalendarIcon,
  ChevronLeft,
  ChevronRight,
  Clock,
  MapPin,
  MoreVertical,
  User as UserIcon,
  Briefcase,
  Layers,
  Sparkles,
  ClipboardList,
  CheckCircle2,
  AlertCircle,
  FolderClosed,
  GraduationCap,
  Building2,
  ExternalLink,
} from "lucide-react";
import { createServerSideClient } from "@/lib/supabase";
import { ApplicationStatusBadge } from "@/components/app/application-status-badge";

export const metadata: Metadata = { title: "Student Portal | NOVA" };

interface TrackCardData {
  id: string;
  code: string;
  title: string;
  lead: string;
  schedule: string;
  time: string;
  location: string;
  bgColor: string;
  borderColor: string;
  textColor: string;
  dividerColor: string;
  shadowColor: string;
}

const NOVA_PROGRAM_TRACKS: TrackCardData[] = [
  {
    id: "t1",
    code: "ART101",
    title: "Graphic Fundamentals",
    lead: "Prof. Smith",
    schedule: "Monday & Wednesday",
    time: "9:00 AM - 10:30 AM",
    location: "Design Studio A",
    bgColor: "bg-[#E5DEFF]/80",
    borderColor: "border-white/80",
    textColor: "text-[#2E1065]",
    dividerColor: "border-[#D4C8FF]/70",
    shadowColor: "hover:shadow-[0_12px_30px_rgba(147,51,234,0.15)]",
  },
  {
    id: "t2",
    code: "ITD001",
    title: "Advanced Web Design",
    lead: "Dr. Johnson",
    schedule: "Tuesday & Thursday",
    time: "1:30 PM - 3:00 PM",
    location: "Computer Lab 3",
    bgColor: "bg-[#FFF0C2]/80",
    borderColor: "border-white/80",
    textColor: "text-[#78350F]",
    dividerColor: "border-[#FFE28A]/70",
    shadowColor: "hover:shadow-[0_12px_30px_rgba(234,179,8,0.15)]",
  },
  {
    id: "t3",
    code: "UXD301",
    title: "User Experience Research",
    lead: "Prof. Davis",
    schedule: "Monday & Saturday",
    time: "9:00 AM - 12:00 AM",
    location: "Design Lab 2",
    bgColor: "bg-[#C6F1FE]/80",
    borderColor: "border-white/80",
    textColor: "text-[#0C4A6E]",
    dividerColor: "border-[#93E3FD]/70",
    shadowColor: "hover:shadow-[0_12px_30px_rgba(14,165,233,0.15)]",
  },
  {
    id: "t4",
    code: "ANI501",
    title: "3D Animation Techniques",
    lead: "Dr. Martinez",
    schedule: "Wednesday",
    time: "3:00 PM - 5:00 PM",
    location: "Animation Studio",
    bgColor: "bg-[#D7F9DE]/80",
    borderColor: "border-white/80",
    textColor: "text-[#14532D]",
    dividerColor: "border-[#A7F3B9]/70",
    shadowColor: "hover:shadow-[0_12px_30px_rgba(34,197,94,0.15)]",
  },
];

interface MilestoneItem {
  id: string;
  name: string;
  course: string;
  date: string;
  time: string;
  location: string;
  status: "Completed" | "Upcoming";
}

const EXAM_ITEMS: MilestoneItem[] = [
  {
    id: "e1",
    name: "Mid-Term Review",
    course: "Graphic Fundamentals",
    date: "20 Jan 2024",
    time: "10:00 AM - 12:00 PM",
    location: "Studio 4B",
    status: "Completed",
  },
  {
    id: "e2",
    name: "Frontend Practical",
    course: "Advanced Web Design",
    date: "22 Jan 2024",
    time: "02:00 PM - 04:00 PM",
    location: "Lab 3",
    status: "Completed",
  },
  {
    id: "e3",
    name: "Heuristic Evaluation",
    course: "UX Research",
    date: "25 Jan 2024",
    time: "11:00 AM - 01:00 PM",
    location: "Online (Meet)",
    status: "Upcoming",
  },
  {
    id: "e4",
    name: "Final Render Defense",
    course: "3D Animation",
    date: "28 Jan 2024",
    time: "09:30 AM - 11:30 AM",
    location: "Animation Hall",
    status: "Upcoming",
  },
];

interface HomeworkItem {
  id: string;
  course: string;
  assignment: string;
  dueDate: string;
  status: "Submitted" | "In Progress" | "Pending";
  statusBadge: string;
  accentBarColor: string;
  cardBorder: string;
}

const HOMEWORKS_LIST: HomeworkItem[] = [
  {
    id: "h1",
    course: "Graphic Fundamentals",
    assignment: "Brand Identity Vector Kit",
    dueDate: "21 Jan 2024",
    status: "In Progress",
    statusBadge: "bg-[#FFF7ED] text-[#EA580C] border border-[#FDBA74]",
    accentBarColor: "bg-[#F97316]",
    cardBorder: "border-[#FED7AA]/60",
  },
  {
    id: "h2",
    course: "Advanced Web Design",
    assignment: "Next.js SSR Dashboard Layout",
    dueDate: "23 Jan 2024",
    status: "Submitted",
    statusBadge: "bg-[#F0FDF4] text-[#16A34A] border border-[#86EFAC]",
    accentBarColor: "bg-[#22C55E]",
    cardBorder: "border-[#BBF7D0]/60",
  },
  {
    id: "h3",
    course: "UX Research",
    assignment: "Usability Testing Report",
    dueDate: "26 Jan 2024",
    status: "Pending",
    statusBadge: "bg-[#FAF5FF] text-[#9333EA] border border-[#D8B4FE]",
    accentBarColor: "bg-[#A855F7]",
    cardBorder: "border-[#E9D5FF]/60",
  },
  {
    id: "h4",
    course: "3D Animation Techniques",
    assignment: "Character Rigging Scene",
    dueDate: "29 Jan 2024",
    status: "In Progress",
    statusBadge: "bg-[#FFF1F2] text-[#E11D48] border border-[#FDA4AF]",
    accentBarColor: "bg-[#F43F5E]",
    cardBorder: "border-[#FECDD3]/60",
  },
  {
    id: "h5",
    course: "Systems Architecture",
    assignment: "Distributed State Diagram",
    dueDate: "31 Jan 2024",
    status: "Pending",
    statusBadge: "bg-[#FEFCE8] text-[#CA8A04] border border-[#FDE047]",
    accentBarColor: "bg-[#EAB308]",
    cardBorder: "border-[#FEF08A]/60",
  },
];

const CALENDAR_DAYS = [
  1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13, 14, 15, 16, 17, 18, 19, 20, 21,
  22, 23, 24, 25, 26, 27, 28, 29, 30, 31,
];

export default async function StudentDashboardPage() {
  const supabase = await createServerSideClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/login");
  }

  // Parallel server-side fetching of student profile data
  const [{ data: profile }] = await Promise.all([
    supabase.from("profiles").select("first_name, last_name, email, onboarded").eq("id", user.id).single(),
  ]);

  if (!profile?.onboarded) {
    redirect("/student/onboarding");
  }

  const studentName = profile.first_name || profile.email.split("@")[0];

  return (
    <div className="flex flex-col gap-6 text-slate-800">
      {/* ── TOP GREETING & DATE BAR ── */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pb-1">
        <div className="flex items-center gap-2">
          <span className="text-2xl">👋</span>
          <h1 className="text-xl sm:text-2xl font-bold tracking-tight text-slate-900">
            Welcome, {studentName}!
          </h1>
        </div>
        <span className="text-xs font-semibold text-slate-500 font-sans">
          18 Jan 2024, Friday
        </span>
      </div>

      {/* ── MAIN 2-COLUMN GRID (MAIN STAGE + RIGHT SIDEBAR) ── */}
      <div className="grid grid-cols-1 xl:grid-cols-12 gap-6 items-start">
        {/* ═════════════════════════════════════════════════════════════════════ */}
        {/* LEFT / CENTER CONTENT AREA (Col 8/9)                                  */}
        {/* ═════════════════════════════════════════════════════════════════════ */}
        <div className="xl:col-span-8 2xl:col-span-9 flex flex-col gap-6">
          {/* 1. HERO BANNER WITH GLASSMORPHISM */}
          <div className="relative rounded-3xl bg-white/80 backdrop-blur-2xl border border-white/90 p-6 sm:p-8 shadow-[0_8px_30px_rgb(0,0,0,0.04)] overflow-hidden flex flex-col md:flex-row items-center justify-between gap-6 hover:shadow-[0_12px_35px_rgb(0,0,0,0.06)] transition-all duration-300">
            <div className="flex flex-col gap-2.5 max-w-xl z-10">
              <h2 className="text-lg sm:text-xl font-bold text-slate-900 tracking-tight">
                Get Involved – Join a Club Today!
              </h2>
              <p className="text-xs sm:text-[13px] text-slate-600 leading-relaxed font-normal">
                Explore your interests and meet like-minded students by joining one of our many clubs. Whether you&apos;re into sports, arts, or academics, there&apos;s a club for you. Find your community!
              </p>
              <div className="pt-2">
                <Link
                  href="/student/internships"
                  className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-[#0F172A] hover:bg-slate-800 text-white text-xs font-semibold shadow-xs transition-colors"
                >
                  <span>Learn More</span>
                  <ArrowRight className="h-3.5 w-3.5" />
                </Link>
              </div>
            </div>

            {/* Vector Collaborative Illustration */}
            <div className="relative w-48 h-36 sm:w-64 sm:h-44 shrink-0 flex items-center justify-center">
              <svg viewBox="0 0 260 170" fill="none" xmlns="http://www.w3.org/2000/svg" className="w-full h-full">
                <circle cx="130" cy="85" r="55" fill="#FEF3C7" opacity="0.65" />
                <circle cx="185" cy="55" r="28" fill="#E0F2FE" opacity="0.85" />
                <circle cx="75" cy="115" r="32" fill="#EDE9FE" opacity="0.85" />
                
                {/* Chat Bubbles */}
                <rect x="90" y="25" width="52" height="26" rx="13" fill="#F97316" />
                <path d="M106 50L100 58L114 50Z" fill="#F97316" />
                <circle cx="104" cy="38" r="2.2" fill="white" />
                <circle cx="114" cy="38" r="2.2" fill="white" />
                <circle cx="124" cy="38" r="2.2" fill="white" />

                <rect x="152" y="36" width="46" height="22" rx="11" fill="#3B82F6" />
                <circle cx="165" cy="47" r="1.8" fill="white" />
                <circle cx="174" cy="47" r="1.8" fill="white" />
                <circle cx="183" cy="47" r="1.8" fill="white" />

                {/* Left Student Character */}
                <circle cx="95" cy="86" r="17" fill="#FCD34D" />
                <path d="M82 86C82 78.82 87.82 73 95 73C102.18 73 108 78.82 108 86H82Z" fill="#7C2D12" />
                <path d="M74 150C74 125.7 93.7 106 118 106H118C118 106 118 150 118 150H74Z" fill="#FDBA74" />
                <path d="M74 150C74 122 90 108 107 108V150H74Z" fill="#FB923C" />

                {/* Center Gear / Sync Graphic */}
                <circle cx="130" cy="92" r="14" fill="#E2E8F0" />
                <circle cx="130" cy="92" r="7" fill="#FFFFFF" />

                {/* Right Student Character */}
                <circle cx="165" cy="84" r="17" fill="#FCD34D" />
                <path d="M152 84C152 76.82 157.82 71 165 71C172.18 71 178 76.82 178 84H152Z" fill="#1E293B" />
                <path d="M142 150C142 122.5 158.5 106 184 106H184C184 106 184 150 184 150H142Z" fill="#991B1B" />
                <path d="M142 150C142 119 158 104 180 104V150H142Z" fill="#DC2626" />
              </svg>
            </div>
          </div>

          {/* 2. ENROLLED COURSES SECTION (4 VIBRANT GLASSMORPHIC CARDS) */}
          <div className="flex flex-col gap-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <BookOpen className="h-4 w-4 text-slate-800" />
                <h2 className="text-sm font-bold text-slate-900">Enrolled Courses</h2>
              </div>
              <Link
                href="/student/enrollments"
                className="text-xs font-semibold text-sky-600 hover:text-sky-700 flex items-center gap-1"
              >
                <span>View all</span>
                <ChevronRight className="h-3 w-3" />
              </Link>
            </div>

            {/* 4 Glassmorphic Pastel Cards Grid */}
            <div className="grid grid-cols-1 sm:grid-cols-2 2xl:grid-cols-4 gap-4">
              {NOVA_PROGRAM_TRACKS.map((course) => (
                <div
                  key={course.id}
                  className={`rounded-2xl p-5 border backdrop-blur-xl flex flex-col justify-between gap-4 transition-all duration-300 hover:-translate-y-0.5 shadow-[0_4px_20px_-2px_rgba(0,0,0,0.03)] ${course.shadowColor} ${course.bgColor} ${course.borderColor}`}
                >
                  {/* Top: Course Title & Code with clean divider */}
                  <div className={`flex flex-col gap-1 pb-3 border-b ${course.dividerColor}`}>
                    <h3 className={`text-[13.5px] font-bold leading-tight ${course.textColor}`}>
                      {course.title} - <span className="font-mono text-xs opacity-90">{course.code}</span>
                    </h3>
                  </div>

                  {/* Details (Instructor, Schedule, Time, Location) */}
                  <div className="flex flex-col gap-2.5 text-xs text-slate-800">
                    <div className="flex items-center gap-2">
                      <UserIcon className="h-3.5 w-3.5 shrink-0 opacity-70" />
                      <span className="font-semibold">{course.lead}</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <CalendarIcon className="h-3.5 w-3.5 shrink-0 opacity-70" />
                      <span>{course.schedule}</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <Clock className="h-3.5 w-3.5 shrink-0 opacity-70" />
                      <span>{course.time}</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <MapPin className="h-3.5 w-3.5 shrink-0 opacity-70" />
                      <span>{course.location}</span>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* 3. EXAM BOARD SECTION (GLASSMORPHIC TABLE CONTAINER) */}
          <div className="rounded-3xl bg-white/80 backdrop-blur-2xl border border-white/90 p-6 sm:p-7 shadow-[0_8px_30px_rgb(0,0,0,0.04)] flex flex-col gap-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <ClipboardList className="h-4 w-4 text-slate-800" />
                <h2 className="text-sm font-bold text-slate-900">Exam Board</h2>
              </div>
              <Link
                href="/student/programs"
                className="text-xs font-semibold text-sky-600 hover:text-sky-700 flex items-center gap-1"
              >
                <span>View all</span>
                <ChevronRight className="h-3 w-3" />
              </Link>
            </div>

            {/* Table */}
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs border-collapse">
                <thead>
                  <tr className="border-b border-slate-100 text-slate-400 font-medium">
                    <th className="py-3 px-3">Exam Name ⇅</th>
                    <th className="py-3 px-3">Course ⇅</th>
                    <th className="py-3 px-3">Date ⇅</th>
                    <th className="py-3 px-3">Time ⇅</th>
                    <th className="py-3 px-3">Location ⇅</th>
                    <th className="py-3 px-3">Status ⇅</th>
                    <th className="py-3 px-2 text-right"></th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 text-slate-700 font-normal">
                  {EXAM_ITEMS.map((item, idx) => (
                    <tr
                      key={item.id}
                      className={idx % 2 === 0 ? "bg-slate-50/40 hover:bg-white/80" : "bg-transparent hover:bg-white/80"}
                    >
                      <td className="py-3.5 px-3 font-semibold text-slate-900">{item.name}</td>
                      <td className="py-3.5 px-3 font-mono text-slate-600">{item.course}</td>
                      <td className="py-3.5 px-3">{item.date}</td>
                      <td className="py-3.5 px-3">{item.time}</td>
                      <td className="py-3.5 px-3">{item.location}</td>
                      <td className="py-3.5 px-3">
                        {item.status === "Completed" ? (
                          <span className="inline-flex items-center px-3 py-0.5 rounded-full text-[11px] font-semibold bg-[#DCFCE7] text-[#15803D] border border-[#86EFAC]/70 shadow-2xs">
                            Completed
                          </span>
                        ) : (
                          <span className="inline-flex items-center px-3 py-0.5 rounded-full text-[11px] font-semibold bg-[#E0F2FE] text-[#0369A1] border border-[#7DD3FC]/70 shadow-2xs">
                            Upcoming
                          </span>
                        )}
                      </td>
                      <td className="py-3.5 px-2 text-right">
                        <button type="button" className="p-1 rounded hover:bg-slate-200/60 text-slate-400">
                          <MoreVertical className="h-3.5 w-3.5" />
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>

        {/* ═════════════════════════════════════════════════════════════════════ */}
        {/* RIGHT SIDEBAR (Col 4/3): SEMESTER, CALENDAR & HOMEWORKS               */}
        {/* ═════════════════════════════════════════════════════════════════════ */}
        <div className="xl:col-span-4 2xl:col-span-3 flex flex-col gap-6">
          {/* SEMESTER PROGRESS BAR (GLASSMORPHIC) */}
          <div className="rounded-3xl bg-white/80 backdrop-blur-2xl border border-white/90 p-5 sm:p-6 shadow-[0_8px_30px_rgb(0,0,0,0.04)] flex flex-col gap-2">
            <div className="flex items-center justify-between text-xs font-bold text-slate-800">
              <span>Semester 3 of 4</span>
              <span className="text-slate-400 font-mono">75%</span>
            </div>
            <div className="h-1.5 w-full bg-slate-100/90 rounded-full overflow-hidden">
              <div className="h-full bg-[#0F172A] rounded-full w-3/4" />
            </div>
          </div>

          {/* CALENDAR WIDGET (GLASSMORPHIC) */}
          <div className="rounded-3xl bg-white/80 backdrop-blur-2xl border border-white/90 p-5 sm:p-6 shadow-[0_8px_30px_rgb(0,0,0,0.04)] flex flex-col gap-3">
            <div className="flex items-center justify-between">
              <button type="button" className="p-1 rounded hover:bg-slate-100 text-slate-400">
                <ChevronLeft className="h-4 w-4" />
              </button>
              <span className="text-xs font-bold text-slate-800">January 2024</span>
              <button type="button" className="p-1 rounded hover:bg-slate-100 text-slate-400">
                <ChevronRight className="h-4 w-4" />
              </button>
            </div>

            <div className="grid grid-cols-7 text-center text-[11px] font-semibold text-slate-400">
              <span>MO</span>
              <span>TU</span>
              <span>WE</span>
              <span>TH</span>
              <span>FR</span>
              <span>SA</span>
              <span>SU</span>
            </div>

            <div className="grid grid-cols-7 gap-1 text-center text-xs">
              {CALENDAR_DAYS.map((day) => {
                const isSelected = day === 18;
                return (
                  <div
                    key={day}
                    className={`h-7 w-7 mx-auto flex items-center justify-center rounded-full text-xs font-medium cursor-pointer transition-colors ${
                      isSelected
                        ? "bg-[#0F172A] text-white font-bold shadow-xs"
                        : "text-slate-700 hover:bg-slate-100"
                    }`}
                  >
                    {day}
                  </div>
                );
              })}
            </div>
          </div>

          {/* HOMEWORKS SECTION (5 COLORFUL GLASSMORPHIC CARDS) */}
          <div className="rounded-3xl bg-white/80 backdrop-blur-2xl border border-white/90 p-5 sm:p-6 shadow-[0_8px_30px_rgb(0,0,0,0.04)] flex flex-col gap-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Briefcase className="h-4 w-4 text-slate-800" />
                <h2 className="text-sm font-bold text-slate-900">Homeworks</h2>
              </div>
              <Link
                href="/student/projects"
                className="text-xs font-semibold text-sky-600 hover:text-sky-700 flex items-center gap-1"
              >
                <span>View all</span>
                <ChevronRight className="h-3 w-3" />
              </Link>
            </div>

            <div className="flex flex-col gap-3">
              {HOMEWORKS_LIST.map((hw) => (
                <div
                  key={hw.id}
                  className={`relative rounded-2xl border p-4 flex flex-col gap-2 bg-white/70 backdrop-blur-md overflow-hidden transition-all duration-200 hover:bg-white/90 hover:shadow-sm ${hw.cardBorder}`}
                >
                  <div className="flex items-center justify-between gap-2">
                    <h3 className="text-xs font-bold text-slate-900 leading-snug">{hw.course}</h3>
                    <span
                      className={`px-2.5 py-0.5 rounded-full text-[10px] font-semibold shrink-0 ${hw.statusBadge}`}
                    >
                      {hw.status}
                    </span>
                  </div>

                  <div className="flex flex-col text-[11px] text-slate-600">
                    <span>Assignment: {hw.assignment}</span>
                    <span className="text-slate-400">Due Date: {hw.dueDate}</span>
                  </div>

                  {/* Colored Bottom Accent Bar */}
                  <div className="h-1.5 w-full bg-slate-100 rounded-full overflow-hidden mt-1">
                    <div className={`h-full ${hw.accentBarColor} rounded-full w-4/5`} />
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
