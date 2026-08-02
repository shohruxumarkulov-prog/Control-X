import { useState, useEffect, useRef, createContext, useContext } from "react";
import {
  Users, Calendar, Wallet, LogOut, Plus, Trash2, CheckCircle2,
  XCircle, Eye, EyeOff, UserPlus, ShieldCheck, ClipboardList, TrendingDown,
  MoreVertical, Copy, Check, KeyRound, Settings, Lock, X, Palette, Type,
  Camera, Globe, User as UserIcon, ChevronDown, Sun, Moon, ChevronLeft, ChevronRight
} from "lucide-react";
import { supabase } from "./lib/supabase";

const todayISO = () => new Date().toISOString().slice(0, 10);
const fmt = (n) => Number(n || 0).toLocaleString("uz-UZ") + " so'm";
const fmtDays = (n) => {
  const r = Math.round(Number(n || 0) * 10) / 10;
  return Number.isInteger(r) ? String(r) : r.toFixed(1);
};

// ---------- i18n ----------
const LANGS = [
  { code: "uz", label: "O'zbekcha" },
  { code: "ru", label: "Русский" },
  { code: "en", label: "English" },
];

const STR = {
  appName: { uz: "Ish Nazorati", ru: "Контроль работы", en: "Work Control" },
  loginTitle: { uz: "Tizimga kirish", ru: "Вход в систему", en: "Sign in" },
  loginSubtitle: { uz: "Login va parolingizni kiriting", ru: "Введите логин и пароль", en: "Enter your login and password" },
  login: { uz: "Login", ru: "Логин", en: "Username" },
  password: { uz: "Parol", ru: "Пароль", en: "Password" },
  loginBtn: { uz: "Kirish", ru: "Войти", en: "Sign in" },
  firstTimeHint: { uz: "Birinchi marta kiryapsizmi? Admin uchun:", ru: "Первый раз здесь? Для админа:", en: "First time here? For admin:" },
  changeLaterHint: { uz: "Keyinchalik parolni albatta o'zgartiring.", ru: "Обязательно смените пароль позже.", en: "Be sure to change the password later." },
  wrongLogin: { uz: "Login yoki parol noto'g'ri", ru: "Неверный логин или пароль", en: "Incorrect username or password" },
  logout: { uz: "Chiqish", ru: "Выход", en: "Log out" },
  adminPanel: { uz: "Admin panel", ru: "Панель админа", en: "Admin panel" },
  employeePanel: { uz: "Ishchi paneli", ru: "Панель сотрудника", en: "Employee panel" },
  navEmployees: { uz: "Ishchilar", ru: "Сотрудники", en: "Employees" },
  navAttendance: { uz: "Davomat", ru: "Посещаемость", en: "Attendance" },
  navAdvances: { uz: "Avanslar", ru: "Авансы", en: "Advances" },
  navReport: { uz: "Hisobot", ru: "Отчёт", en: "Report" },
  addEmployeeHeader: { uz: "Yangi ishchi qo'shish", ru: "Добавить сотрудника", en: "Add new employee" },
  fullName: { uz: "Ism familiya", ru: "Имя фамилия", en: "Full name" },
  dailyWage: { uz: "Kunlik ish haqi (so'm)", ru: "Дневная зарплата (сум)", en: "Daily wage" },
  add: { uz: "Qo'shish", ru: "Добавить", en: "Add" },
  noEmployees: { uz: "Hali ishchilar qo'shilmagan", ru: "Сотрудники ещё не добавлены", en: "No employees added yet" },
  perDay: { uz: "/kun", ru: "/день", en: "/day" },
  daysWorkedSuffix: { uz: "kun ishlagan", ru: "дней отработано", en: "days worked" },
  details: { uz: "Batafsil", ru: "Подробнее", en: "Details" },
  credentialsHeader: { uz: "Kirish ma'lumotlari", ru: "Данные для входа", en: "Login credentials" },
  copy: { uz: "Nusxalash", ru: "Копировать", en: "Copy" },
  copied: { uz: "Nusxalandi", ru: "Скопировано", en: "Copied" },
  day: { uz: "Kun", ru: "Дни", en: "Days" },
  advance: { uz: "To'langan", ru: "Выплачено", en: "Paid" },
  remaining: { uz: "Qoldiq", ru: "Остаток", en: "Remaining" },
  deleteEmployee: { uz: "Ishchini o'chirish", ru: "Удалить сотрудника", en: "Delete employee" },
  confirmDelete: { uz: "Rostdan ham {name}ni o'chirmoqchimisiz? Davomat va avans tarixi ham butunlay o'chib ketadi.", ru: "Точно удалить {name}? История посещаемости и авансов тоже удалится.", en: "Really delete {name}? Attendance and advance history will be deleted too." },
  yesDelete: { uz: "Ha, o'chirish", ru: "Да, удалить", en: "Yes, delete" },
  cancel: { uz: "Bekor qilish", ru: "Отмена", en: "Cancel" },
  markAttendanceHeader: { uz: "Davomatni belgilash", ru: "Отметить посещаемость", en: "Mark attendance" },
  selectPlaceholder: { uz: "Tanlang...", ru: "Выберите...", en: "Select..." },
  employee: { uz: "Ishchi", ru: "Сотрудник", en: "Employee" },
  date: { uz: "Sana", ru: "Дата", en: "Date" },
  present: { uz: "Ishga keldi", ru: "Пришёл", en: "Present" },
  fullDay: { uz: "To'liq kun", ru: "Полный день", en: "Full day" },
  halfDay: { uz: "Yarim kun", ru: "Полдня", en: "Half day" },
  absent: { uz: "Kelmadi", ru: "Не пришёл", en: "Absent" },
  clear: { uz: "Tozalash", ru: "Очистить", en: "Clear" },
  statusPrefix: { uz: "holati:", ru: "статус:", en: "status:" },
  statusFull: { uz: "to'liq kun ishlagan", ru: "отработал полный день", en: "worked full day" },
  statusHalf: { uz: "yarim kun ishlagan", ru: "отработал полдня", en: "worked half day" },
  statusAbsent: { uz: "kelmagan", ru: "отсутствовал", en: "absent" },
  statusNone: { uz: "belgilanmagan", ru: "не отмечено", en: "not marked" },
  totalWorkedDays: { uz: "Jami ishlagan kunlar:", ru: "Всего отработано дней:", en: "Total days worked:" },
  giveAdvanceHeader: { uz: "Avans / to'lov berish", ru: "Выдать аванс / оплату", en: "Give an advance / payment" },
  typeAvans: { uz: "Avans", ru: "Аванс", en: "Advance" },
  typeSalary: { uz: "Ish haqi to'lovi", ru: "Выплата зарплаты", en: "Salary payment" },
  addSalaryPayment: { uz: "To'lovni qo'shish", ru: "Добавить выплату", en: "Add payment" },
  amount: { uz: "Summa (so'm)", ru: "Сумма (сум)", en: "Amount" },
  note: { uz: "Izoh (ixtiyoriy)", ru: "Заметка (необязательно)", en: "Note (optional)" },
  addAdvance: { uz: "Avans qo'shish", ru: "Добавить аванс", en: "Add advance" },
  advanceHistory: { uz: "Avanslar tarixi", ru: "История авансов", en: "Advance history" },
  noAdvances: { uz: "Hali avans olinmagan", ru: "Авансов ещё не было", en: "No advances yet" },
  reportHeader: { uz: "Barcha ishchilar bo'yicha hisobot", ru: "Отчёт по всем сотрудникам", en: "Report for all employees" },
  colEmployee: { uz: "Ishchi", ru: "Сотрудник", en: "Employee" },
  colDays: { uz: "Kun", ru: "Дни", en: "Days" },
  colCalculated: { uz: "Hisoblangan", ru: "Начислено", en: "Calculated" },
  colAdvance: { uz: "To'langan", ru: "Выплачено", en: "Paid" },
  colRemaining: { uz: "Qoldiq", ru: "Остаток", en: "Remaining" },
  noData: { uz: "Ma'lumot yo'q", ru: "Нет данных", en: "No data" },
  myWorkedDays: { uz: "Ishlagan kunlarim", ru: "Мои отработанные дни", en: "My worked days" },
  noAttendanceYet: { uz: "Hali davomat belgilanmagan", ru: "Посещаемость ещё не отмечена", en: "No attendance marked yet" },
  futureDateWarning: { uz: "Hali kelmagan sanaga davomat belgilab bo'lmaydi", ru: "Нельзя отметить посещаемость на будущую дату", en: "You can't mark attendance for a future date" },
  myAdvances: { uz: "Avanslarim", ru: "Мои авансы", en: "My advances" },
  noAdvancesYet: { uz: "Hali avans olmagansiz", ru: "Вы ещё не получали аванс", en: "You haven't taken an advance yet" },
  statWorkedDays: { uz: "Ishlagan kunlar", ru: "Отработано дней", en: "Days worked" },
  statTakenAdvance: { uz: "Olingan avans", ru: "Взятый аванс", en: "Advance taken" },
  statRemainingSalary: { uz: "Qolgan maosh", ru: "Остаток зарплаты", en: "Remaining salary" },
  profile: { uz: "Profil", ru: "Профиль", en: "Profile" },
  changePhoto: { uz: "Rasm qo'yish", ru: "Загрузить фото", en: "Upload photo" },
  security: { uz: "Xavfsizlik", ru: "Безопасность", en: "Security" },
  currentPassword: { uz: "Joriy parol", ru: "Текущий пароль", en: "Current password" },
  newLogin: { uz: "Yangi login", ru: "Новый логин", en: "New username" },
  newPassword: { uz: "Yangi parol", ru: "Новый пароль", en: "New password" },
  repeatNewPassword: { uz: "Yangi parolni takrorlang", ru: "Повторите новый пароль", en: "Repeat new password" },
  save: { uz: "Saqlash", ru: "Сохранить", en: "Save" },
  language: { uz: "Til", ru: "Язык", en: "Language" },
  themeColor: { uz: "Mavzu rangi", ru: "Цвет темы", en: "Theme color" },
  lightBg: { uz: "Oq fon", ru: "Светлый фон", en: "Light background" },
  darkBg: { uz: "Qora fon", ru: "Тёмный фон", en: "Dark background" },
  fontSize: { uz: "Shrift o'lchami", ru: "Размер шрифта", en: "Font size" },
  fontSmall: { uz: "Kichik", ru: "Мелкий", en: "Small" },
  fontMedium: { uz: "O'rta", ru: "Средний", en: "Medium" },
  fontLarge: { uz: "Katta", ru: "Крупный", en: "Large" },
  errWrongCurrentPassword: { uz: "Joriy parol noto'g'ri", ru: "Текущий пароль неверен", en: "Current password is incorrect" },
  errEmptyLogin: { uz: "Login bo'sh bo'lmasin", ru: "Логин не может быть пустым", en: "Username can't be empty" },
  errShortPassword: { uz: "Yangi parol kamida 4 belgidan iborat bo'lsin", ru: "Новый пароль должен быть не короче 4 символов", en: "New password must be at least 4 characters" },
  errPasswordMismatch: { uz: "Yangi parollar bir xil emas", ru: "Новые пароли не совпадают", en: "New passwords don't match" },
  errLoginTaken: { uz: "Bu login band, boshqasini tanlang", ru: "Этот логин занят, выберите другой", en: "This username is taken, choose another" },
  savedOk: { uz: "Saqlandi! Endi yangi login-parol bilan kiring.", ru: "Сохранено! Теперь входите с новым логином и паролем.", en: "Saved! Sign in with the new username and password now." },
  fillAllFields: { uz: "Barcha maydonlarni to'ldiring", ru: "Заполните все поля", en: "Fill in all fields" },
  loading: { uz: "Yuklanmoqda...", ru: "Загрузка...", en: "Loading..." },
  admin: { uz: "Admin", ru: "Админ", en: "Admin" },
  enterAsAdmin: { uz: "Boshqaruvchi sifatida kirish", ru: "Войти как руководитель", en: "Sign in as manager" },
  enterAsEmployee: { uz: "Ishchi sifatida kirish", ru: "Войти как сотрудник", en: "Sign in as employee" },
  backToEmployeeLogin: { uz: "Ishchi kirishiga qaytish", ru: "Назад ко входу сотрудника", en: "Back to employee sign in" },
  adminLoginTitle: { uz: "Boshqaruvchi kirishi", ru: "Вход руководителя", en: "Manager sign in" },
  employeeLoginTitle: { uz: "Ishchi kirishi", ru: "Вход сотрудника", en: "Employee sign in" },
  registerTitle: { uz: "Yangi boshqaruvchi yaratish", ru: "Создать нового руководителя", en: "Create a new manager account" },
  registerSubtitle: { uz: "O'z login-parolingizni o'ylab toping va o'z ishchilaringizni boshqaring", ru: "Придумайте свой логин и пароль и управляйте своими сотрудниками", en: "Choose your own username and password to manage your own employees" },
  chooseLogin: { uz: "Login o'ylab toping", ru: "Придумайте логин", en: "Choose a username" },
  choosePassword: { uz: "Parol o'ylab toping", ru: "Придумайте пароль", en: "Choose a password" },
  createAccountBtn: { uz: "Boshqaruvchi bo'lib ro'yxatdan o'tish", ru: "Зарегистрироваться руководителем", en: "Register as manager" },
  alreadyHaveAccount: { uz: "Mavjud hisobga kirish", ru: "Войти в существующий аккаунт", en: "Sign in to an existing account" },
  newHere: { uz: "Birinchi marta kiryapsizmi?", ru: "Впервые здесь?", en: "First time here?" },
};

function makeT(lang) {
  return (key, vars) => {
    let s = (STR[key] && (STR[key][lang] || STR[key].uz)) || key;
    if (vars) Object.entries(vars).forEach(([k, v]) => { s = s.replace(`{${k}}`, v); });
    return s;
  };
}

// ---------- App-wide context (theme + language) ----------
const AppContext = createContext({ accent: "#d99a3c", lang: "uz", t: makeT("uz") });
const useApp = () => useContext(AppContext);

const ACCENT_PRESETS = [
  { name: "Oltin", value: "#d99a3c" },
  { name: "Ko'k", value: "#4d8fd9" },
  { name: "Yashil", value: "#4fae7a" },
  { name: "Binafsha", value: "#9b7fd9" },
  { name: "Qizil", value: "#e2685f" },
  { name: "Pushti", value: "#d9709a" },
];

const FONT_SCALES = [
  { key: "fontSmall", value: 90 },
  { key: "fontMedium", value: 100 },
  { key: "fontLarge", value: 115 },
];

const PALETTES = {
  dark: {
    "--bg-app": "#12161c",
    "--bg-card": "#181d25",
    "--bg-panel": "#141920",
    "--border": "#262d38",
    "--border-input": "#2a323d",
    "--border-soft": "#1e242c",
    "--text-primary": "#e8ebef",
    "--text-secondary": "#8b96a5",
    "--text-muted": "#6b7684",
    "--text-faint": "#4d5665",
  },
  light: {
    "--bg-app": "#f2f3f5",
    "--bg-card": "#ffffff",
    "--bg-panel": "#ffffff",
    "--border": "#e3e6ea",
    "--border-input": "#d5d9df",
    "--border-soft": "#ebedf0",
    "--text-primary": "#1c2128",
    "--text-secondary": "#5b6472",
    "--text-muted": "#828a95",
    "--text-faint": "#9aa1ab",
  },
};

// Default admin — used both as the initial seed and as an absolute
// fallback so login always works even if the storage layer never
// loads for any reason.
const ADMIN_DEFAULT = { username: "admin", password: "admin123" };

// In-memory fallback store. If Supabase is unreachable (offline, network
// error), everything still works for the current session — it just
// won't survive a page refresh until the connection comes back.
const memoryStore = {};

async function safeGet(key) {
  try {
    const { data, error } = await supabase
      .from("app_storage")
      .select("value")
      .eq("key", key)
      .maybeSingle();
    if (!error && data && typeof data.value !== "undefined") {
      memoryStore[key] = data.value;
      return data.value;
    }
  } catch (e) {
    // fall through to memory
  }
  return memoryStore[key];
}

async function safeSet(key, value) {
  memoryStore[key] = value;
  try {
    await supabase.from("app_storage").upsert({ key, value, updated_at: new Date().toISOString() });
  } catch (e) {
    // already saved in memory, ignore
  }
}

// Resize/crop an image file to a small square JPEG data URL so it stays
// well under storage size limits.
function fileToAvatarDataUrl(file) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onerror = () => reject(new Error("read failed"));
    reader.onload = () => {
      const img = new Image();
      img.onerror = () => reject(new Error("image failed"));
      img.onload = () => {
        const size = 200;
        const canvas = document.createElement("canvas");
        canvas.width = size; canvas.height = size;
        const ctx = canvas.getContext("2d");
        const minSide = Math.min(img.width, img.height);
        const sx = (img.width - minSide) / 2;
        const sy = (img.height - minSide) / 2;
        ctx.drawImage(img, sx, sy, minSide, minSide, 0, 0, size, size);
        resolve(canvas.toDataURL("image/jpeg", 0.82));
      };
      img.src = reader.result;
    };
    reader.readAsDataURL(file);
  });
}

// ---------- SMALL REUSABLE PIECES ----------
function Field({ label, value, onChange, type = "text" }) {
  const [reveal, setReveal] = useState(false);
  const isPassword = type === "password";
  return (
    <div>
      <label className="block text-xs text-[var(--text-secondary)] mb-1.5">{label}</label>
      <div className={isPassword ? "relative" : ""}>
        <input
          type={isPassword ? (reveal ? "text" : "password") : type}
          value={value}
          onChange={(e) => onChange(e.target.value)}
          className={`w-full px-3 py-2.5 ${isPassword ? "pr-10" : ""} rounded-lg bg-[var(--bg-app)] border border-[var(--border-input)] text-[var(--text-primary)] text-sm outline-none focus:border-[var(--accent)] transition-colors`}
        />
        {isPassword && (
          <button
            type="button"
            onClick={() => setReveal((v) => !v)}
            className="absolute right-0 top-0 h-full px-3 flex items-center text-[var(--text-muted)] hover:text-[var(--text-primary)] transition-colors"
          >
            {reveal ? <EyeOff size={15} /> : <Eye size={15} />}
          </button>
        )}
      </div>
    </div>
  );
}

function Stat({ label, value, tone = "default", icon }) {
  const toneMap = {
    default: "text-[var(--text-primary)]",
    good: "text-[#5cbf8f]",
    bad: "text-[#e2685f]",
  };
  return (
    <div className="bg-[var(--bg-card)] border border-[var(--border)] rounded-xl p-4">
      <div className="flex items-center gap-1.5 text-[var(--text-muted)] text-[11px] mb-1.5">
        {icon}{label}
      </div>
      <div className={`text-lg font-semibold ${toneMap[tone]}`}>{value}</div>
    </div>
  );
}

function Avatar({ src, name, size = 40 }) {
  const initials = (name || "?").trim().split(/\s+/).map((w) => w[0]).slice(0, 2).join("").toUpperCase();
  const style = { width: size, height: size, fontSize: Math.max(11, size * 0.35) };
  if (src) {
    return <img src={src} alt={name} style={style} className="rounded-full object-cover shrink-0" />;
  }
  return (
    <div style={style} className="rounded-full bg-[#2a323d] text-[var(--text-secondary)] font-semibold flex items-center justify-center shrink-0">
      {initials || <UserIcon size={size * 0.5} />}
    </div>
  );
}

function Shell({ title, userName, avatar, onLogout, onTitleClick, bottomNav, children }) {
  const { accent } = useApp();
  return (
    <div className="min-h-screen bg-[var(--bg-app)] flex flex-col">
      <header className="border-b border-[var(--border-soft)] px-5 py-4 flex items-center justify-between sticky top-0 bg-[var(--bg-app)]/95 backdrop-blur z-10">
        <button
          type="button"
          onClick={onTitleClick}
          disabled={!onTitleClick}
          className={`flex items-center gap-2.5 text-left ${onTitleClick ? "cursor-pointer active:opacity-70" : ""}`}
        >
          {avatar !== undefined ? (
            <Avatar src={avatar} name={userName} size={32} />
          ) : (
            <div className="w-8 h-8 rounded-lg flex items-center justify-center shrink-0" style={{ backgroundColor: accent }}>
              <ShieldCheck size={16} className="text-[#12161c]" />
            </div>
          )}
          <div>
            <div className="text-[var(--text-primary)] font-semibold text-sm leading-tight">{title}</div>
            <div className="text-[var(--text-muted)] text-xs leading-tight">{userName}</div>
          </div>
        </button>
        <button onClick={onLogout} className="flex items-center gap-1.5 text-[var(--text-secondary)] hover:text-[#e2685f] text-xs transition-colors">
          <LogOut size={14} /> {useApp().t("logout")}
        </button>
      </header>
      <main className={`flex-1 p-5 max-w-4xl w-full mx-auto ${bottomNav ? "pb-28" : ""}`}>{children}</main>
      {bottomNav}
    </div>
  );
}

// ---------- LOGIN ----------
function LoginScreen({ loginForm, setLoginForm, loginError, onSubmit, onRegister }) {
  const [showPassword, setShowPassword] = useState(false);
  const [asAdmin, setAsAdmin] = useState(false);
  const [registering, setRegistering] = useState(false);
  const [regForm, setRegForm] = useState({ username: "", password: "", confirm: "" });
  const [regError, setRegError] = useState("");
  const [showRegPassword, setShowRegPassword] = useState(false);
  const { accent, t } = useApp();

  function submitRegister() {
    setRegError("");
    if (regForm.password !== regForm.confirm) {
      setRegError(t("errPasswordMismatch"));
      return;
    }
    const result = onRegister(regForm.username.trim(), regForm.password);
    if (result && result.error) {
      setRegError(result.error);
    }
  }

  if (asAdmin && registering) {
    return (
      <div className="min-h-screen bg-[var(--bg-app)] flex items-center justify-center px-4">
        <div className="w-full max-w-sm">
          <div className="flex items-center gap-2 justify-center mb-8">
            <div className="w-9 h-9 rounded-lg flex items-center justify-center" style={{ backgroundColor: accent }}>
              <ShieldCheck size={18} className="text-[#12161c]" />
            </div>
            <span className="text-[var(--text-primary)] font-semibold text-lg tracking-tight">{t("appName")}</span>
          </div>
          <div className="bg-[var(--bg-card)] border border-[var(--border)] rounded-2xl p-7">
            <h1 className="text-[var(--text-primary)] text-xl font-semibold mb-1">{t("registerTitle")}</h1>
            <p className="text-[var(--text-muted)] text-sm mb-6">{t("registerSubtitle")}</p>
            <div className="space-y-3.5">
              <Field label={t("chooseLogin")} value={regForm.username} onChange={(v) => setRegForm({ ...regForm, username: v })} />
              <Field label={t("choosePassword")} type="password" value={regForm.password} onChange={(v) => setRegForm({ ...regForm, password: v })} />
              <Field label={t("repeatNewPassword")} type="password" value={regForm.confirm} onChange={(v) => setRegForm({ ...regForm, confirm: v })} />
            </div>
            {regError && <p className="text-[#e2685f] text-xs mt-3">{regError}</p>}
            <button type="button" onClick={submitRegister} className="w-full mt-4 py-2.5 rounded-lg text-[#12161c] text-sm font-semibold transition-opacity hover:opacity-90 active:scale-[0.98]" style={{ backgroundColor: accent }}>
              {t("createAccountBtn")}
            </button>
            <button
              type="button"
              onClick={() => { setRegistering(false); setRegForm({ username: "", password: "", confirm: "" }); setRegError(""); }}
              className="w-full mt-3 py-2 rounded-lg text-[var(--text-secondary)] text-xs font-medium hover:text-[var(--text-primary)] transition-colors"
            >
              {t("alreadyHaveAccount")}
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[var(--bg-app)] flex items-center justify-center px-4">
      <div className="w-full max-w-sm">
        <div className="flex items-center gap-2 justify-center mb-8">
          <div className="w-9 h-9 rounded-lg flex items-center justify-center" style={{ backgroundColor: accent }}>
            <ShieldCheck size={18} className="text-[#12161c]" />
          </div>
          <span className="text-[var(--text-primary)] font-semibold text-lg tracking-tight">{t("appName")}</span>
        </div>
        <div className="bg-[var(--bg-card)] border border-[var(--border)] rounded-2xl p-7">
          <h1 className="text-[var(--text-primary)] text-xl font-semibold mb-1">
            {asAdmin ? t("adminLoginTitle") : t("employeeLoginTitle")}
          </h1>
          <p className="text-[var(--text-muted)] text-sm mb-6">{t("loginSubtitle")}</p>
          <label className="block text-xs text-[var(--text-secondary)] mb-1.5">{t("login")}</label>
          <input
            className="w-full mb-4 px-3.5 py-2.5 rounded-lg bg-[var(--bg-app)] border border-[var(--border-input)] text-[var(--text-primary)] text-sm outline-none focus:border-[var(--accent)] transition-colors"
            value={loginForm.username}
            onChange={(e) => setLoginForm({ ...loginForm, username: e.target.value })}
            onKeyDown={(e) => { if (e.key === "Enter") onSubmit(asAdmin); }}
            autoFocus
          />
          <label className="block text-xs text-[var(--text-secondary)] mb-1.5">{t("password")}</label>
          <div className="relative mb-2">
            <input
              type={showPassword ? "text" : "password"}
              className="w-full px-3.5 py-2.5 pr-10 rounded-lg bg-[var(--bg-app)] border border-[var(--border-input)] text-[var(--text-primary)] text-sm outline-none focus:border-[var(--accent)] transition-colors"
              value={loginForm.password}
              onChange={(e) => setLoginForm({ ...loginForm, password: e.target.value })}
              onKeyDown={(e) => { if (e.key === "Enter") onSubmit(asAdmin); }}
            />
            <button
              type="button"
              onClick={() => setShowPassword((v) => !v)}
              className="absolute right-0 top-0 h-full px-3 flex items-center text-[var(--text-muted)] hover:text-[var(--text-primary)] transition-colors"
            >
              {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
            </button>
          </div>
          {loginError && <p className="text-[#e2685f] text-xs mb-2 mt-1">{loginError}</p>}
          <button type="button" onClick={() => onSubmit(asAdmin)} className="w-full mt-4 py-2.5 rounded-lg text-[#12161c] text-sm font-semibold transition-opacity hover:opacity-90 active:scale-[0.98]" style={{ backgroundColor: accent }}>
            {t("loginBtn")}
          </button>

          {asAdmin ? (
            <>
              <button
                type="button"
                onClick={() => { setRegistering(true); setLoginForm({ username: "", password: "" }); }}
                className="w-full mt-3 py-2.5 rounded-lg border border-dashed border-[var(--border-input)] text-[var(--text-secondary)] text-xs font-medium hover:text-[var(--text-primary)] hover:border-[var(--accent)] transition-colors flex items-center justify-center gap-1.5"
              >
                <UserPlus size={13} /> {t("registerTitle")}
              </button>
              <button
                type="button"
                onClick={() => { setAsAdmin(false); setLoginForm({ username: "", password: "" }); }}
                className="w-full mt-2 py-2 rounded-lg text-[var(--text-secondary)] text-xs font-medium hover:text-[var(--text-primary)] transition-colors"
              >
                {t("backToEmployeeLogin")}
              </button>
            </>
          ) : (
            <button
              type="button"
              onClick={() => { setAsAdmin(true); setLoginForm({ username: "", password: "" }); }}
              className="w-full mt-3 py-2.5 rounded-lg border border-[var(--border-input)] text-[var(--text-secondary)] text-xs font-medium hover:text-[var(--text-primary)] hover:border-[var(--text-muted)] transition-colors flex items-center justify-center gap-1.5"
            >
              <ShieldCheck size={13} /> {t("enterAsAdmin")}
            </button>
          )}
        </div>
      </div>
    </div>
  );
}

// ---------- EMPLOYEE ROW (with expandable "..." details panel) ----------
function CopyButton({ text }) {
  const [copied, setCopied] = useState(false);
  const { t } = useApp();
  async function doCopy() {
    try {
      await navigator.clipboard.writeText(text);
      setCopied(true);
      setTimeout(() => setCopied(false), 1500);
    } catch (e) {
      // clipboard unavailable — ignore silently, value is still visible on screen
    }
  }
  return (
    <button
      type="button"
      onClick={doCopy}
      className="flex items-center gap-1 px-2 py-1 rounded-md bg-[var(--bg-app)] border border-[var(--border-input)] text-[var(--text-secondary)] hover:text-[var(--text-primary)] hover:border-[#3a4552] text-[11px] transition-colors shrink-0"
    >
      {copied ? <Check size={12} className="text-[#5cbf8f]" /> : <Copy size={12} />}
      {copied ? t("copied") : t("copy")}
    </button>
  );
}

function Lightbox({ src, name, onClose }) {
  return (
    <div
      className="fixed inset-0 bg-black/70 backdrop-blur-sm z-50 flex items-center justify-center px-6"
      onClick={onClose}
    >
      <button
        type="button"
        onClick={onClose}
        className="absolute top-5 right-5 w-9 h-9 rounded-full bg-black/40 text-white flex items-center justify-center"
        aria-label="Close"
      >
        <X size={18} />
      </button>
      <div onClick={(e) => e.stopPropagation()} className="flex flex-col items-center gap-3">
        {src ? (
          <img src={src} alt={name} className="max-w-[85vw] max-h-[70vh] rounded-2xl object-contain shadow-2xl" />
        ) : (
          <Avatar src={null} name={name} size={180} />
        )}
        <div className="text-white text-sm font-medium">{name}</div>
      </div>
    </div>
  );
}

function EmployeeRow({ emp, summary: s, onDelete }) {
  const [open, setOpen] = useState(false);
  const [reveal, setReveal] = useState(false);
  const [confirmDelete, setConfirmDelete] = useState(false);
  const [showPhoto, setShowPhoto] = useState(false);
  const { accent, t } = useApp();

  return (
    <div className="bg-[var(--bg-card)] border border-[var(--border)] rounded-xl overflow-hidden">
      {showPhoto && <Lightbox src={emp.avatar} name={emp.name} onClose={() => setShowPhoto(false)} />}
      <div className="p-4 flex items-center justify-between gap-3">
        <div className="flex items-center gap-3 min-w-0">
          <button type="button" onClick={() => setShowPhoto(true)} className="shrink-0" aria-label={t("details")}>
            <Avatar src={emp.avatar} name={emp.name} size={36} />
          </button>
          <div className="min-w-0">
            <div className="text-[var(--text-primary)] text-sm font-medium truncate">{emp.name}</div>
            <div className="text-[var(--text-muted)] text-xs mt-0.5">
              {fmt(emp.dailyWage)}{t("perDay")} &middot; {fmtDays(s.workedDays)} {t("daysWorkedSuffix")}
            </div>
          </div>
        </div>
        <div className="flex items-center gap-2 shrink-0">
          <div className={`text-sm font-semibold ${s.remaining < 0 ? "text-[#e2685f]" : "text-[#5cbf8f]"}`}>
            {fmt(s.remaining)}
          </div>
          <button
            type="button"
            onClick={() => setOpen((v) => !v)}
            className={`p-1.5 rounded-md transition-colors ${open ? "text-[#12161c]" : "text-[var(--text-muted)] hover:text-[var(--text-primary)]"}`}
            style={open ? { backgroundColor: accent } : undefined}
            aria-label={t("details")}
          >
            <MoreVertical size={16} />
          </button>
        </div>
      </div>


      {open && (
        <div className="border-t border-[var(--border)] bg-[var(--bg-panel)] p-4 space-y-3">
          <button type="button" onClick={() => setShowPhoto(true)} className="w-full flex flex-col items-center gap-2 pb-2">
            <Avatar src={emp.avatar} name={emp.name} size={64} />
            <div className="text-[var(--text-primary)] text-sm font-semibold">{emp.name}</div>
          </button>

          <div className="flex items-center gap-1.5 text-[var(--text-secondary)] text-xs font-medium mb-1">
            <KeyRound size={12} /> {t("credentialsHeader")}
          </div>

          <div className="flex items-center justify-between gap-2 bg-[var(--bg-app)] border border-[var(--border-input)] rounded-lg px-3 py-2">
            <div className="min-w-0">
              <div className="text-[10px] text-[var(--text-muted)]">{t("login")}</div>
              <div className="text-[var(--text-primary)] text-sm truncate">{emp.username}</div>
            </div>
            <CopyButton text={emp.username} />
          </div>

          <div className="flex items-center justify-between gap-2 bg-[var(--bg-app)] border border-[var(--border-input)] rounded-lg px-3 py-2">
            <div className="min-w-0">
              <div className="text-[10px] text-[var(--text-muted)]">{t("password")}</div>
              <div className="text-[var(--text-primary)] text-sm truncate">{reveal ? emp.password : "•".repeat(Math.max(emp.password.length, 6))}</div>
            </div>
            <div className="flex items-center gap-1.5 shrink-0">
              <button
                type="button"
                onClick={() => setReveal((v) => !v)}
                className="p-1.5 rounded-md text-[var(--text-muted)] hover:text-[var(--text-primary)] transition-colors"
              >
                {reveal ? <EyeOff size={14} /> : <Eye size={14} />}
              </button>
              <CopyButton text={emp.password} />
            </div>
          </div>

          <div className="grid grid-cols-3 gap-2 pt-1">
            <div className="text-center">
              <div className="text-[var(--text-primary)] text-sm font-semibold">{fmtDays(s.workedDays)}</div>
              <div className="text-[9px] text-[var(--text-muted)] uppercase tracking-wide mt-0.5">{t("day")}</div>
            </div>
            <div className="text-center">
              <div className="text-[#e2685f] text-sm font-semibold">{fmt(s.totalAdvance)}</div>
              <div className="text-[9px] text-[var(--text-muted)] uppercase tracking-wide mt-0.5">{t("advance")}</div>
            </div>
            <div className="text-center">
              <div className="text-[#5cbf8f] text-sm font-semibold">{fmt(s.remaining)}</div>
              <div className="text-[9px] text-[var(--text-muted)] uppercase tracking-wide mt-0.5">{t("remaining")}</div>
            </div>
          </div>

          {!confirmDelete ? (
            <button
              type="button"
              onClick={() => setConfirmDelete(true)}
              className="w-full flex items-center justify-center gap-1.5 py-2 rounded-lg bg-[#2a1a18] text-[#e2685f] text-xs font-medium hover:bg-[#33201d] transition-colors mt-1"
            >
              <Trash2 size={13} /> {t("deleteEmployee")}
            </button>
          ) : (
            <div className="mt-1 bg-[#2a1a18] border border-[#4a2a26] rounded-lg p-3">
              <p className="text-[#e2685f] text-xs mb-2.5">{t("confirmDelete", { name: emp.name })}</p>
              <div className="flex gap-2">
                <button type="button" onClick={onDelete} className="flex-1 py-2 rounded-lg bg-[#e2685f] text-[#12161c] text-xs font-semibold hover:bg-[#ea7a72] transition-colors">
                  {t("yesDelete")}
                </button>
                <button type="button" onClick={() => setConfirmDelete(false)} className="flex-1 py-2 rounded-lg bg-[var(--bg-app)] border border-[var(--border-input)] text-[var(--text-secondary)] text-xs font-medium hover:text-[var(--text-primary)] transition-colors">
                  {t("cancel")}
                </button>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

// ---------- PROFILE DRAWER (role-aware: admin or employee) ----------
function AccordionRow({ icon, label, valueHint, isOpen, onToggle, children }) {
  return (
    <div className="border-b border-[var(--border)] last:border-b-0">
      <button
        type="button"
        onClick={onToggle}
        className="w-full flex items-center justify-between py-3.5 text-left"
      >
        <span className="flex items-center gap-3 text-[var(--text-primary)] text-sm">
          {icon} {label}
        </span>
        <span className="flex items-center gap-1.5 text-[var(--text-muted)] text-xs">
          {valueHint}
          <ChevronDown size={15} className={`transition-transform ${isOpen ? "rotate-180" : ""}`} />
        </span>
      </button>
      {isOpen && <div className="pb-4">{children}</div>}
    </div>
  );
}

function ProfileDrawer({
  open, onClose, me, roleLabel,
  changeOwnCredentials, updateAvatar,
  accent, setAccent, mode, setMode, fontScale, setFontScale, lang, setLang,
}) {
  const { t } = useApp();
  const fileRef = useRef(null);
  const [section, setSection] = useState(null); // which accordion row is open
  const [currentPw, setCurrentPw] = useState("");
  const [newUsername, setNewUsername] = useState(me.username);
  const [newPw, setNewPw] = useState("");
  const [newPw2, setNewPw2] = useState("");
  const [msg, setMsg] = useState({ type: "", text: "" });
  const [avatarBusy, setAvatarBusy] = useState(false);

  function toggle(id) {
    setSection((cur) => (cur === id ? null : id));
  }

  async function handleFile(e) {
    const file = e.target.files && e.target.files[0];
    if (!file) return;
    setAvatarBusy(true);
    try {
      const dataUrl = await fileToAvatarDataUrl(file);
      await updateAvatar(dataUrl);
    } catch (err) {
      // ignore — avatar upload is best-effort
    }
    setAvatarBusy(false);
    if (fileRef.current) fileRef.current.value = "";
  }

  function submitPassword() {
    setMsg({ type: "", text: "" });
    if (currentPw !== me.password) {
      setMsg({ type: "error", text: t("errWrongCurrentPassword") });
      return;
    }
    if (!newUsername.trim()) {
      setMsg({ type: "error", text: t("errEmptyLogin") });
      return;
    }
    if (!newPw || newPw.length < 4) {
      setMsg({ type: "error", text: t("errShortPassword") });
      return;
    }
    if (newPw !== newPw2) {
      setMsg({ type: "error", text: t("errPasswordMismatch") });
      return;
    }
    const result = changeOwnCredentials(newUsername.trim(), newPw);
    if (result && result.error) {
      setMsg({ type: "error", text: result.error });
      return;
    }
    setCurrentPw(""); setNewPw(""); setNewPw2("");
    setMsg({ type: "ok", text: t("savedOk") });
  }

  const currentLangLabel = LANGS.find((l) => l.code === lang)?.label || "";
  const currentFontLabel = t(FONT_SCALES.find((f) => f.value === fontScale)?.key || "fontMedium");

  return (
    <>
      {/* Backdrop: blurs the app content behind it, fully covers the right side */}
      {open && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-30 transition-opacity" onClick={onClose} />
      )}
      {/* Panel: fully opaque, slides in from the left, sits above the blurred backdrop */}
      <div
        className={`fixed top-0 left-0 h-full w-[86%] max-w-sm bg-[var(--bg-panel)] border-r border-[var(--border)] shadow-2xl z-40 overflow-y-auto transition-transform duration-200 ${
          open ? "translate-x-0" : "-translate-x-full"
        }`}
      >
        <div className="flex items-center justify-between px-5 py-4 border-b border-[var(--border)] sticky top-0 bg-[var(--bg-panel)] z-10">
          <div className="flex items-center gap-1.5 text-[var(--text-primary)] text-sm font-semibold">
            <Settings size={15} /> {t("profile")}
          </div>
          <button type="button" onClick={onClose} className="text-[var(--text-muted)] hover:text-[var(--text-primary)] transition-colors">
            <X size={18} />
          </button>
        </div>

        <div className="px-5 pt-5">
          {/* Profile identity + avatar */}
          <div className="flex flex-col items-center text-center pb-5">
            <div className="relative">
              <Avatar src={me.avatar} name={me.name} size={76} />
              <button
                type="button"
                onClick={() => fileRef.current && fileRef.current.click()}
                disabled={avatarBusy}
                className="absolute -bottom-1 -right-1 w-7 h-7 rounded-full flex items-center justify-center border-2"
                style={{ backgroundColor: accent, color: "#12161c", borderColor: "var(--bg-panel)" }}
                aria-label={t("changePhoto")}
              >
                <Camera size={13} />
              </button>
              <input ref={fileRef} type="file" accept="image/*" className="hidden" onChange={handleFile} />
            </div>
            <div className="text-[var(--text-primary)] text-sm font-semibold mt-3">{me.name}</div>
            <div className="text-[var(--text-muted)] text-xs">{roleLabel}</div>
          </div>
        </div>

        {/* Telegram-style accordion rows */}
        <div className="px-5">
          <AccordionRow
            icon={<Palette size={16} className="text-[var(--text-muted)]" />}
            label={t("themeColor")}
            valueHint={<span className="w-3.5 h-3.5 rounded-full inline-block" style={{ backgroundColor: accent }} />}
            isOpen={section === "theme"}
            onToggle={() => toggle("theme")}
          >
            <div className="flex gap-2.5 mb-4">
              <button
                type="button"
                onClick={() => setMode("light")}
                className="flex-1 flex flex-col items-center gap-1.5 py-2.5 rounded-lg border transition-colors"
                style={{
                  backgroundColor: "#ffffff",
                  borderColor: mode === "light" ? accent : "var(--border-input)",
                  borderWidth: mode === "light" ? 2 : 1,
                }}
              >
                <Sun size={16} color="#1c2128" />
                <span className="text-[11px]" style={{ color: "#1c2128" }}>{t("lightBg")}</span>
              </button>
              <button
                type="button"
                onClick={() => setMode("dark")}
                className="flex-1 flex flex-col items-center gap-1.5 py-2.5 rounded-lg border transition-colors"
                style={{
                  backgroundColor: "#12161c",
                  borderColor: mode === "dark" ? accent : "#2a323d",
                  borderWidth: mode === "dark" ? 2 : 1,
                }}
              >
                <Moon size={16} color="#e8ebef" />
                <span className="text-[11px]" style={{ color: "#e8ebef" }}>{t("darkBg")}</span>
              </button>
            </div>
            <div className="flex flex-wrap gap-2.5">
              {ACCENT_PRESETS.map((p) => (
                <button
                  key={p.value}
                  type="button"
                  onClick={() => setAccent(p.value)}
                  className="w-9 h-9 rounded-full flex items-center justify-center transition-transform active:scale-90"
                  style={{ backgroundColor: p.value, boxShadow: accent === p.value ? `0 0 0 2px var(--bg-panel), 0 0 0 4px ${p.value}` : "none" }}
                  aria-label={p.name}
                >
                  {accent === p.value && <Check size={14} className="text-[#12161c]" />}
                </button>
              ))}
            </div>
          </AccordionRow>

          <AccordionRow
            icon={<Type size={16} className="text-[var(--text-muted)]" />}
            label={t("fontSize")}
            valueHint={currentFontLabel}
            isOpen={section === "font"}
            onToggle={() => toggle("font")}
          >
            <div className="flex gap-2">
              {FONT_SCALES.map((f) => (
                <button
                  key={f.value}
                  type="button"
                  onClick={() => setFontScale(f.value)}
                  className="flex-1 py-2.5 rounded-lg text-xs font-medium transition-colors"
                  style={
                    fontScale === f.value
                      ? { backgroundColor: accent, color: "#12161c" }
                      : { backgroundColor: "var(--bg-app)", color: "var(--text-secondary)", border: "1px solid var(--border-input)" }
                  }
                >
                  {t(f.key)}
                </button>
              ))}
            </div>
          </AccordionRow>

          <AccordionRow
            icon={<Globe size={16} className="text-[var(--text-muted)]" />}
            label={t("language")}
            valueHint={currentLangLabel}
            isOpen={section === "lang"}
            onToggle={() => toggle("lang")}
          >
            <div className="flex flex-col gap-2">
              {LANGS.map((l) => (
                <button
                  key={l.code}
                  type="button"
                  onClick={() => setLang(l.code)}
                  className="flex items-center justify-between px-3.5 py-2.5 rounded-lg text-sm transition-colors"
                  style={
                    lang === l.code
                      ? { backgroundColor: accent, color: "#12161c", fontWeight: 600 }
                      : { backgroundColor: "var(--bg-app)", color: "var(--text-secondary)", border: "1px solid var(--border-input)" }
                  }
                >
                  {l.label}
                  {lang === l.code && <Check size={14} />}
                </button>
              ))}
            </div>
          </AccordionRow>

          <AccordionRow
            icon={<Lock size={16} className="text-[var(--text-muted)]" />}
            label={t("security")}
            isOpen={section === "security"}
            onToggle={() => toggle("security")}
          >
            <div className="space-y-3">
              <Field label={t("currentPassword")} type="password" value={currentPw} onChange={setCurrentPw} />
              <Field label={t("newLogin")} value={newUsername} onChange={setNewUsername} />
              <Field label={t("newPassword")} type="password" value={newPw} onChange={setNewPw} />
              <Field label={t("repeatNewPassword")} type="password" value={newPw2} onChange={setNewPw2} />
            </div>
            {msg.text && (
              <p className={`text-xs mt-2.5 ${msg.type === "error" ? "text-[#e2685f]" : "text-[#5cbf8f]"}`}>{msg.text}</p>
            )}
            <button
              type="button"
              onClick={submitPassword}
              className="mt-3 w-full py-2.5 rounded-lg text-[#12161c] text-xs font-semibold hover:opacity-90 transition-opacity"
              style={{ backgroundColor: accent }}
            >
              {t("save")}
            </button>
          </AccordionRow>
        </div>
        <div className="h-5" />
      </div>
    </>
  );
}

// ---------- ADMIN ----------
function AdminApp({
  usersData, currentUser, onLogout, summaryFor,
  adminTab, setAdminTab,
  newEmp, setNewEmp, empError, addEmployee, deleteEmployee,
  attendance, attDate, setAttDate, markAttendance,
  advances, advEmp, setAdvEmp, advForm, setAdvForm, addAdvance, deleteAdvance,
  changeOwnCredentials, updateAvatar, accent, setAccent, mode, setMode, fontScale, setFontScale, lang, setLang,
}) {
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [showAddForm, setShowAddForm] = useState(false);
  const { t } = useApp();
  const myAdmin = usersData.admins[currentUser.username] || { password: "", avatar: null };
  const myEmployees = usersData.employees.filter((e) => e.owner === currentUser.username);
  const tabs = [
    { id: "employees", label: t("navEmployees"), icon: <Users size={18} /> },
    { id: "attendance", label: t("navAttendance"), icon: <Calendar size={18} /> },
    { id: "advances", label: t("navAdvances"), icon: <Wallet size={18} /> },
    { id: "report", label: t("navReport"), icon: <ClipboardList size={18} /> },
  ];
  const localeTag = lang === "ru" ? "ru-RU" : lang === "en" ? "en-US" : "uz-UZ";
  const [weekOffset, setWeekOffset] = useState(0);
  const dateStrip = (() => {
    const today = new Date();
    const day = today.getDay(); // 0 = Sunday ... 6 = Saturday
    const mondayOffset = day === 0 ? -6 : 1 - day;
    const monday = new Date(today);
    monday.setDate(today.getDate() + mondayOffset + weekOffset * 7);
    return Array.from({ length: 7 }, (_, i) => {
      const d = new Date(monday);
      d.setDate(monday.getDate() + i);
      return d.toISOString().slice(0, 10);
    });
  })();

  const bottomNav = (
    <nav className="fixed bottom-0 left-0 right-0 bg-[var(--bg-card)]/90 backdrop-blur-md border-t border-[var(--border)] z-20" style={{ paddingBottom: "env(safe-area-inset-bottom)" }}>
      <div className="max-w-4xl mx-auto flex">
        {tabs.map((tab) => (
          <button
            key={tab.id}
            type="button"
            onClick={() => setAdminTab(tab.id)}
            className="flex-1 flex flex-col items-center gap-1 py-2.5 text-[10px] font-medium transition-colors"
            style={{ color: adminTab === tab.id ? accent : "#6b7684" }}
          >
            {tab.icon}
            {tab.label}
          </button>
        ))}
      </div>
    </nav>
  );

  return (
    <>
      <ProfileDrawer
        open={drawerOpen}
        onClose={() => setDrawerOpen(false)}
        me={{ name: currentUser.username, username: currentUser.username, password: myAdmin.password, avatar: myAdmin.avatar }}
        roleLabel={t("adminPanel")}
        changeOwnCredentials={changeOwnCredentials}
        updateAvatar={updateAvatar}
        accent={accent} setAccent={setAccent}
        mode={mode} setMode={setMode}
        fontScale={fontScale} setFontScale={setFontScale}
        lang={lang} setLang={setLang}
      />
      <Shell
        title={t("adminPanel")}
        userName={currentUser.username}
        avatar={myAdmin.avatar || null}
        onLogout={onLogout}
        onTitleClick={() => setDrawerOpen(true)}
        bottomNav={bottomNav}
      >
      {adminTab === "employees" && (
        <div className="space-y-5">
          {!showAddForm ? (
            <button
              type="button"
              onClick={() => setShowAddForm(true)}
              className="w-full flex items-center justify-center gap-1.5 py-3 rounded-xl border border-dashed border-[var(--border-input)] text-[var(--text-secondary)] text-sm font-medium hover:text-[var(--text-primary)] hover:border-[var(--accent)] transition-colors"
            >
              <UserPlus size={16} /> {t("addEmployeeHeader")}
            </button>
          ) : (
            <div className="bg-[var(--bg-card)] border border-[var(--border)] rounded-xl p-5">
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-1.5 text-[var(--text-primary)] text-sm font-semibold">
                  <UserPlus size={15} /> {t("addEmployeeHeader")}
                </div>
                <button type="button" onClick={() => { setShowAddForm(false); setEmpError(""); }} className="text-[var(--text-muted)] hover:text-[var(--text-primary)] transition-colors">
                  <X size={16} />
                </button>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <Field label={t("fullName")} value={newEmp.name} onChange={(v) => setNewEmp({ ...newEmp, name: v })} />
                <Field label={t("dailyWage")} type="number" value={newEmp.dailyWage} onChange={(v) => setNewEmp({ ...newEmp, dailyWage: v })} />
                <Field label={t("login")} value={newEmp.username} onChange={(v) => setNewEmp({ ...newEmp, username: v })} />
                <Field label={t("password")} type="password" value={newEmp.password} onChange={(v) => setNewEmp({ ...newEmp, password: v })} />
              </div>
              {empError && <p className="text-[#e2685f] text-xs mt-3">{empError}</p>}
              <button
                type="button"
                onClick={async () => { await addEmployee(); setShowAddForm(false); }}
                className="mt-4 flex items-center gap-1.5 px-4 py-2 rounded-lg text-[#12161c] text-xs font-semibold hover:opacity-90 transition-opacity"
                style={{ backgroundColor: accent }}
              >
                <Plus size={14} /> {t("add")}
              </button>
            </div>
          )}

          <div className="space-y-2">
            {myEmployees.length === 0 && (
              <p className="text-[var(--text-muted)] text-sm text-center py-8">{t("noEmployees")}</p>
            )}
            {myEmployees.map((emp) => (
              <EmployeeRow key={emp.id} emp={emp} summary={summaryFor(emp.id)} onDelete={() => deleteEmployee(emp.id)} />
            ))}
          </div>
        </div>
      )}

      {adminTab === "attendance" && (
        <div className="space-y-4">
          <div className="bg-[var(--bg-card)] border border-[var(--border)] rounded-xl p-4">
            <div className="flex items-center justify-between mb-3">
              <div className="flex items-center gap-1.5 text-[var(--text-primary)] text-sm font-semibold">
                <Calendar size={15} /> {t("markAttendanceHeader")}
              </div>
              <label className="text-[var(--text-muted)]">
                <input type="date" max={todayISO()} value={attDate} onChange={(e) => setAttDate(e.target.value)} className="bg-transparent text-[var(--text-secondary)] text-xs outline-none" />
              </label>
            </div>
            <div className="flex items-center gap-1.5">
              <button
                type="button"
                onClick={() => setWeekOffset((w) => w - 1)}
                className="shrink-0 w-7 h-14 rounded-lg flex items-center justify-center text-[var(--text-muted)] hover:text-[var(--text-primary)] bg-[var(--bg-app)] border border-[var(--border-input)] transition-colors"
                aria-label="prev week"
              >
                <ChevronLeft size={16} />
              </button>
              <div className="flex-1 grid grid-cols-7 gap-1.5">
                {dateStrip.map((d) => {
                  const dt = new Date(d + "T00:00:00");
                  const weekday = dt.toLocaleDateString(localeTag, { weekday: "short" });
                  const isToday = d === todayISO();
                  const isSelected = d === attDate;
                  const isFuture = d > todayISO();
                  const markedCount = myEmployees.filter((emp) => attendance[emp.id]?.[d] !== undefined).length;
                  const dotColor = myEmployees.length === 0 || isFuture
                    ? "transparent"
                    : markedCount === 0
                      ? "var(--border-input)"
                      : markedCount < myEmployees.length
                        ? "#d9b23c"
                        : "#5cbf8f";
                  const style = isFuture
                    ? { backgroundColor: "var(--bg-app)", color: "var(--text-faint)", border: "1px solid var(--border-input)", opacity: 0.45 }
                    : isToday
                      ? { backgroundColor: "#5cbf8f", color: "#0e1712", boxShadow: isSelected ? `0 0 0 2px var(--bg-card), 0 0 0 4px ${accent}` : "none" }
                      : isSelected
                        ? { backgroundColor: accent, color: "#12161c" }
                        : { backgroundColor: "var(--bg-app)", color: "var(--text-secondary)", border: "1px solid var(--border-input)" };
                  return (
                    <button
                      key={d}
                      type="button"
                      disabled={isFuture}
                      onClick={() => setAttDate(d)}
                      className="flex flex-col items-center justify-center py-2 rounded-lg text-xs transition-colors disabled:cursor-not-allowed"
                      style={style}
                    >
                      <span className="text-[10px] opacity-80 capitalize">{weekday}</span>
                      <span className="text-sm font-semibold">{dt.getDate()}</span>
                      <span className="w-1.5 h-1.5 rounded-full mt-1" style={{ backgroundColor: dotColor }} />
                    </button>
                  );
                })}
              </div>
              <button
                type="button"
                onClick={() => setWeekOffset((w) => w + 1)}
                className="shrink-0 w-7 h-14 rounded-lg flex items-center justify-center text-[var(--text-muted)] hover:text-[var(--text-primary)] bg-[var(--bg-app)] border border-[var(--border-input)] transition-colors"
                aria-label="next week"
              >
                <ChevronRight size={16} />
              </button>
            </div>
          </div>

          <div className="space-y-2">
            {myEmployees.length === 0 && (
              <p className="text-[var(--text-muted)] text-sm text-center py-8">{t("noEmployees")}</p>
            )}
            {myEmployees.length > 0 && attDate > todayISO() && (
              <p className="text-[#d9b23c] text-xs text-center py-2 bg-[var(--bg-card)] border border-[var(--border)] rounded-lg">{t("futureDateWarning")}</p>
            )}
            {myEmployees.map((emp) => {
              const st = attendance[emp.id]?.[attDate];
              const isFuture = attDate > todayISO();
              return (
                <div key={emp.id} className="bg-[var(--bg-card)] border border-[var(--border)] rounded-xl p-3.5">
                  <div className="flex items-center gap-2.5 mb-3">
                    <Avatar src={emp.avatar} name={emp.name} size={32} />
                    <div className="min-w-0">
                      <div className="text-[var(--text-primary)] text-sm font-medium truncate">{emp.name}</div>
                      <div className="text-[var(--text-muted)] text-[11px]">{fmt(emp.dailyWage)}{t("perDay")}</div>
                    </div>
                  </div>
                  <div className="grid grid-cols-3 gap-1.5">
                    <button
                      type="button"
                      disabled={isFuture}
                      onClick={() => markAttendance(emp.id, 1)}
                      className="flex items-center justify-center gap-1 py-2 rounded-lg text-[11px] font-medium transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
                      style={st === 1 ? { backgroundColor: "#5cbf8f", color: "#0e1712" } : { backgroundColor: "var(--bg-app)", color: "var(--text-secondary)", border: "1px solid var(--border-input)" }}
                    >
                      <CheckCircle2 size={13} /> {t("fullDay")}
                    </button>
                    <button
                      type="button"
                      disabled={isFuture}
                      onClick={() => markAttendance(emp.id, 0.5)}
                      className="flex items-center justify-center gap-1 py-2 rounded-lg text-[11px] font-medium transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
                      style={st === 0.5 ? { backgroundColor: "#d9b23c", color: "#1a1608" } : { backgroundColor: "var(--bg-app)", color: "var(--text-secondary)", border: "1px solid var(--border-input)" }}
                    >
                      <Calendar size={13} /> {t("halfDay")}
                    </button>
                    <button
                      type="button"
                      disabled={isFuture}
                      onClick={() => markAttendance(emp.id, 0)}
                      className="flex items-center justify-center gap-1 py-2 rounded-lg text-[11px] font-medium transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
                      style={st === 0 ? { backgroundColor: "#e2685f", color: "#1c0e0c" } : { backgroundColor: "var(--bg-app)", color: "var(--text-secondary)", border: "1px solid var(--border-input)" }}
                    >
                      <XCircle size={13} /> {t("absent")}
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {adminTab === "advances" && (
        <div className="space-y-5">
          <div className="bg-[var(--bg-card)] border border-[var(--border)] rounded-xl p-5">
            <div className="flex items-center gap-1.5 text-[var(--text-primary)] text-sm font-semibold mb-4">
              <Wallet size={15} /> {t("giveAdvanceHeader")}
            </div>
            <div className="grid grid-cols-2 gap-1.5 mb-3">
              <button
                type="button"
                onClick={() => setAdvForm({ ...advForm, type: "avans" })}
                className="py-2 rounded-lg text-xs font-medium transition-colors"
                style={(advForm.type || "avans") === "avans" ? { backgroundColor: accent, color: "#12161c" } : { backgroundColor: "var(--bg-app)", color: "var(--text-secondary)", border: "1px solid var(--border-input)" }}
              >
                {t("typeAvans")}
              </button>
              <button
                type="button"
                onClick={() => setAdvForm({ ...advForm, type: "salary" })}
                className="py-2 rounded-lg text-xs font-medium transition-colors"
                style={advForm.type === "salary" ? { backgroundColor: accent, color: "#12161c" } : { backgroundColor: "var(--bg-app)", color: "var(--text-secondary)", border: "1px solid var(--border-input)" }}
              >
                {t("typeSalary")}
              </button>
            </div>
            <div className="grid grid-cols-2 gap-3 mb-3">
              <div className="col-span-2">
                <label className="block text-xs text-[var(--text-secondary)] mb-1.5">{t("employee")}</label>
                <select value={advEmp} onChange={(e) => setAdvEmp(e.target.value)}
                  className="w-full px-3 py-2.5 rounded-lg bg-[var(--bg-app)] border border-[var(--border-input)] text-[var(--text-primary)] text-sm outline-none focus:border-[var(--accent)]">
                  <option value="">{t("selectPlaceholder")}</option>
                  {myEmployees.map((e) => <option key={e.id} value={e.id}>{e.name}</option>)}
                </select>
              </div>
              <Field label={t("amount")} type="number" value={advForm.amount} onChange={(v) => setAdvForm({ ...advForm, amount: v })} />
              <Field label={t("date")} type="date" value={advForm.date} onChange={(v) => setAdvForm({ ...advForm, date: v })} />
              <div className="col-span-2">
                <Field label={t("note")} value={advForm.note} onChange={(v) => setAdvForm({ ...advForm, note: v })} />
              </div>
            </div>
            <button type="button" onClick={addAdvance} className="flex items-center gap-1.5 px-4 py-2 rounded-lg text-[#12161c] text-xs font-semibold hover:opacity-90 transition-opacity" style={{ backgroundColor: accent }}>
              <Plus size={14} /> {(advForm.type === "salary") ? t("addSalaryPayment") : t("addAdvance")}
            </button>
          </div>

          {advEmp && (
            <div className="bg-[var(--bg-card)] border border-[var(--border)] rounded-xl p-5">
              <div className="text-[var(--text-primary)] text-sm font-semibold mb-3">{t("advanceHistory")}</div>
              {(advances[advEmp] || []).length === 0 && <p className="text-[var(--text-muted)] text-xs">{t("noAdvances")}</p>}
              <div className="space-y-2">
                {(advances[advEmp] || []).slice().reverse().map((a) => (
                  <div key={a.id} className="flex items-center justify-between text-sm py-1.5">
                    <div>
                      <span className="text-[var(--text-primary)]">{fmt(a.amount)}</span>
                      <span
                        className="text-[9px] uppercase tracking-wide ml-2 px-1.5 py-0.5 rounded"
                        style={a.type === "salary" ? { backgroundColor: "rgba(92,191,143,0.15)", color: "#5cbf8f" } : { backgroundColor: "rgba(217,178,60,0.15)", color: "#d9b23c" }}
                      >
                        {a.type === "salary" ? t("typeSalary") : t("typeAvans")}
                      </span>
                      <span className="text-[var(--text-muted)] text-xs ml-2">{a.date}{a.note ? ` · ${a.note}` : ""}</span>
                    </div>
                    <button onClick={() => deleteAdvance(advEmp, a.id)} className="text-[var(--text-muted)] hover:text-[#e2685f]">
                      <Trash2 size={13} />
                    </button>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      )}

      {adminTab === "report" && (
        <div className="bg-[var(--bg-card)] border border-[var(--border)] rounded-xl overflow-hidden">
          <div className="p-5 pb-3 text-[var(--text-primary)] text-sm font-semibold flex items-center gap-1.5">
            <ClipboardList size={15} /> {t("reportHeader")}
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="text-[var(--text-muted)] text-xs border-t border-[var(--border)]">
                  <th className="text-left font-medium py-2.5 px-5">{t("colEmployee")}</th>
                  <th className="text-right font-medium py-2.5 px-3">{t("colDays")}</th>
                  <th className="text-right font-medium py-2.5 px-3">{t("colCalculated")}</th>
                  <th className="text-right font-medium py-2.5 px-3">{t("colAdvance")}</th>
                  <th className="text-right font-medium py-2.5 px-5">{t("colRemaining")}</th>
                </tr>
              </thead>
              <tbody>
                {myEmployees.map((emp) => {
                  const s = summaryFor(emp.id);
                  return (
                    <tr key={emp.id} className="border-t border-[var(--border-soft)]">
                      <td className="py-2.5 px-5 text-[var(--text-primary)]">{emp.name}</td>
                      <td className="py-2.5 px-3 text-right text-[var(--text-secondary)]">{fmtDays(s.workedDays)}</td>
                      <td className="py-2.5 px-3 text-right text-[var(--text-secondary)]">{fmt(s.totalWage)}</td>
                      <td className="py-2.5 px-3 text-right text-[#e2685f]">-{fmt(s.totalAdvance)}</td>
                      <td className="py-2.5 px-5 text-right font-semibold text-[#5cbf8f]">{fmt(s.remaining)}</td>
                    </tr>
                  );
                })}
                {myEmployees.length === 0 && (
                  <tr><td colSpan={5} className="py-8 text-center text-[var(--text-muted)]">{t("noData")}</td></tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}
      </Shell>
    </>
  );
}

// ---------- EMPLOYEE ----------
function EmployeeApp({
  currentUser, usersData, summaryFor, onLogout,
  changeOwnCredentials, updateAvatar, accent, setAccent, mode, setMode, fontScale, setFontScale, lang, setLang,
}) {
  const [drawerOpen, setDrawerOpen] = useState(false);
  const { t } = useApp();
  const s = summaryFor(currentUser.id);
  const attDays = Object.entries(s.att)
    .map(([date, v]) => [date, typeof v === "number" ? v : (v === true ? 1 : 0)])
    .sort((a, b) => (a[0] < b[0] ? 1 : -1));

  return (
    <>
      <ProfileDrawer
        open={drawerOpen}
        onClose={() => setDrawerOpen(false)}
        me={{ name: s.emp.name, username: s.emp.username, password: s.emp.password, avatar: s.emp.avatar }}
        roleLabel={t("employeePanel")}
        changeOwnCredentials={changeOwnCredentials}
        updateAvatar={updateAvatar}
        accent={accent} setAccent={setAccent}
        mode={mode} setMode={setMode}
        fontScale={fontScale} setFontScale={setFontScale}
        lang={lang} setLang={setLang}
      />
      <Shell
        title={t("employeePanel")}
        userName={currentUser.name}
        avatar={s.emp.avatar || null}
        onLogout={onLogout}
        onTitleClick={() => setDrawerOpen(true)}
      >
        <div className="grid grid-cols-2 gap-2 sm:gap-3 mb-2">
          <Stat label={t("statWorkedDays")} value={fmtDays(s.workedDays)} icon={<Calendar size={12} />} />
          <Stat label={t("statRemainingSalary")} value={fmt(s.remaining)} tone="good" icon={<Wallet size={12} />} />
        </div>
        <div className="grid grid-cols-2 gap-2 sm:gap-3 mb-6">
          <Stat label={t("typeAvans")} value={fmt(s.totalAvans)} tone="bad" icon={<TrendingDown size={12} />} />
          <Stat label={t("typeSalary")} value={fmt(s.totalSalaryPaid)} tone="bad" icon={<Wallet size={12} />} />
        </div>

        <div className="bg-[var(--bg-card)] border border-[var(--border)] rounded-xl p-5 mb-5">
          <div className="text-[var(--text-primary)] text-sm font-semibold mb-3 flex items-center justify-between">
            <span>{t("myWorkedDays")}</span>
            <span className="text-[var(--text-muted)] text-xs font-normal">{s.emp.dailyWage ? fmt(s.emp.dailyWage) + t("perDay") : ""}</span>
          </div>
          {attDays.length === 0 && <p className="text-[var(--text-muted)] text-xs">{t("noAttendanceYet")}</p>}
          <div className="space-y-1.5 max-h-52 overflow-y-auto pr-1">
            {attDays.map(([date, v]) => (
              <div key={date} className="flex items-center justify-between text-sm py-1">
                <span className="flex items-center gap-1.5 text-[var(--text-primary)]">
                  {v === 0 ? (
                    <XCircle size={13} className="text-[#e2685f]" />
                  ) : (
                    <CheckCircle2 size={13} className={v === 1 ? "text-[#5cbf8f]" : "text-[#d9b23c]"} />
                  )}
                  {date} {v === 0.5 && <span className="text-[10px] text-[#d9b23c]">({t("halfDay")})</span>}
                  {v === 0 && <span className="text-[10px] text-[#e2685f]">({t("absent")})</span>}
                </span>
                <span className={v === 0 ? "text-[#e2685f] text-xs" : "text-[var(--text-muted)] text-xs"}>{fmt(v * s.emp.dailyWage)}</span>
              </div>
            ))}
          </div>
        </div>

        <div className="bg-[var(--bg-card)] border border-[var(--border)] rounded-xl p-5">
          <div className="text-[var(--text-primary)] text-sm font-semibold mb-3">{t("myAdvances")}</div>
          {s.advList.length === 0 && <p className="text-[var(--text-muted)] text-xs">{t("noAdvancesYet")}</p>}
          <div className="space-y-2">
            {s.advList.slice().reverse().map((a) => (
              <div key={a.id} className="flex items-center justify-between text-sm py-1">
                <span className="text-[var(--text-primary)] flex items-center gap-2">
                  {fmt(a.amount)}
                  <span
                    className="text-[9px] uppercase tracking-wide px-1.5 py-0.5 rounded"
                    style={a.type === "salary" ? { backgroundColor: "rgba(92,191,143,0.15)", color: "#5cbf8f" } : { backgroundColor: "rgba(217,178,60,0.15)", color: "#d9b23c" }}
                  >
                    {a.type === "salary" ? t("typeSalary") : t("typeAvans")}
                  </span>
                </span>
                <span className="text-[var(--text-muted)] text-xs">{a.date}{a.note ? ` · ${a.note}` : ""}</span>
              </div>
            ))}
          </div>
        </div>
      </Shell>
    </>
  );
}

// ---------- ROOT ----------
export default function WorkforceApp() {
  const [loading, setLoading] = useState(true);
  const [usersData, setUsersData] = useState(null);
  const [attendance, setAttendance] = useState({});
  const [advances, setAdvances] = useState({});
  const [currentUser, setCurrentUserState] = useState(() => {
    try {
      const raw = localStorage.getItem("current-user");
      return raw ? JSON.parse(raw) : null;
    } catch (e) {
      return null;
    }
  });
  // Wraps setCurrentUser so the logged-in session survives a page reload
  // (e.g. pull-to-refresh) instead of dropping the person back to the
  // login screen every time.
  function setCurrentUser(user) {
    setCurrentUserState(user);
    try {
      if (user) localStorage.setItem("current-user", JSON.stringify(user));
      else localStorage.removeItem("current-user");
    } catch (e) {
      // ignore storage errors (e.g. private browsing)
    }
  }
  const [loginForm, setLoginForm] = useState({ username: "", password: "" });
  const [loginError, setLoginError] = useState("");

  const [adminTab, setAdminTab] = useState("employees");
  const [newEmp, setNewEmp] = useState({ name: "", username: "", password: "", dailyWage: "" });
  const [empError, setEmpError] = useState("");
  const [attDate, setAttDate] = useState(todayISO());
  const [advEmp, setAdvEmp] = useState("");
  const [advForm, setAdvForm] = useState({ amount: "", date: todayISO(), note: "", type: "avans" });
  const [accent, setAccent] = useState(ACCENT_PRESETS[0].value);
  const [mode, setMode] = useState("dark");
  const [fontScale, setFontScale] = useState(100);
  const [lang, setLang] = useState("uz");

  useEffect(() => {
    init();
    // Safety net: never let the app hang on the loading screen forever,
    // even if a storage call never resolves.
    const timer = setTimeout(() => setLoading(false), 4000);
    return () => clearTimeout(timer);
  }, []);

  // Live sync: whenever ANY device saves users/attendance/advances data,
  // every other open screen picks up the change automatically — no manual
  // refresh needed. Falls back gracefully (just does nothing) if realtime
  // isn't enabled on the Supabase table.
  useEffect(() => {
    const channel = supabase
      .channel("app_storage_live")
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "app_storage" },
        (payload) => {
          const row = payload.new;
          if (!row || typeof row.value === "undefined") return;
          try {
            if (row.key === "users-data") setUsersData(JSON.parse(row.value));
            else if (row.key === "attendance-data") setAttendance(JSON.parse(row.value));
            else if (row.key === "advances-data") setAdvances(JSON.parse(row.value));
          } catch (e) {
            // ignore malformed payloads
          }
        }
      )
      .subscribe();
    return () => {
      supabase.removeChannel(channel);
    };
  }, []);

  // Apply the chosen font size by scaling the real root font-size, so every
  // rem-based Tailwind text class scales correctly — unlike CSS `zoom`,
  // this never breaks `position: fixed` elements like the bottom nav.
  useEffect(() => {
    if (typeof document !== "undefined" && document.documentElement) {
      document.documentElement.style.fontSize = fontScale + "%";
    }
    return () => {
      if (typeof document !== "undefined" && document.documentElement) {
        document.documentElement.style.fontSize = "";
      }
    };
  }, [fontScale]);

  async function init() {
    let usersVal = null;
    try {
      const raw = await safeGet("users-data");
      usersVal = raw ? JSON.parse(raw) : null;
    } catch (e) {
      usersVal = null;
    }
    if (!usersVal) {
      usersVal = { admins: { [ADMIN_DEFAULT.username]: { password: ADMIN_DEFAULT.password, avatar: null } }, employees: [] };
      await safeSet("users-data", JSON.stringify(usersVal));
    } else if (usersVal.admin && !usersVal.admins) {
      // Migrate old single-admin data shape to the new multi-admin shape,
      // without losing the existing admin's login or employees.
      const owner = usersVal.admin.username;
      usersVal = {
        admins: { [owner]: { password: usersVal.admin.password, avatar: usersVal.admin.avatar || null } },
        employees: (usersVal.employees || []).map((e) => ({ ...e, owner })),
      };
      await safeSet("users-data", JSON.stringify(usersVal));
    } else if (!usersVal.admins) {
      usersVal = { admins: { [ADMIN_DEFAULT.username]: { password: ADMIN_DEFAULT.password, avatar: null } }, employees: usersVal.employees || [] };
      await safeSet("users-data", JSON.stringify(usersVal));
    }
    setUsersData(usersVal);

    // If this device had a saved session but the account no longer exists
    // (e.g. deleted or renamed from another device), sign out safely
    // instead of showing a broken/empty screen.
    setCurrentUserState((prevUser) => {
      if (!prevUser) return prevUser;
      const stillValid = prevUser.role === "admin"
        ? !!usersVal.admins[prevUser.username]
        : (usersVal.employees || []).some((e) => e.id === prevUser.id);
      if (!stillValid) {
        try { localStorage.removeItem("current-user"); } catch (e) {}
        return null;
      }
      return prevUser;
    });

    try {
      const rawAtt = await safeGet("attendance-data");
      setAttendance(rawAtt ? JSON.parse(rawAtt) : {});
    } catch (e) {
      setAttendance({});
    }

    try {
      const rawAdv = await safeGet("advances-data");
      setAdvances(rawAdv ? JSON.parse(rawAdv) : {});
    } catch (e) {
      setAdvances({});
    }

    setLoading(false);
  }

  async function persistUsers(data) {
    setUsersData(data);
    await safeSet("users-data", JSON.stringify(data));
  }
  async function persistAttendance(data) {
    setAttendance(data);
    await safeSet("attendance-data", JSON.stringify(data));
  }
  async function persistAdvances(data) {
    setAdvances(data);
    await safeSet("advances-data", JSON.stringify(data));
  }

  function handleLogin(asAdmin) {
    setLoginError("");
    try {
      const username = loginForm.username.trim();
      const password = loginForm.password;
      const admins = (usersData && usersData.admins) ? usersData.admins : { [ADMIN_DEFAULT.username]: { password: ADMIN_DEFAULT.password } };
      const employees = (usersData && usersData.employees) ? usersData.employees : [];

      if (asAdmin) {
        if (admins[username] && admins[username].password === password) {
          setCurrentUser({ role: "admin", name: makeT(lang)("admin"), username });
          return;
        }
      } else {
        const emp = employees.find((x) => x.username === username && x.password === password);
        if (emp) {
          setCurrentUser({ role: "employee", id: emp.id, name: emp.name, owner: emp.owner });
          return;
        }
      }
      setLoginError(makeT(lang)("wrongLogin"));
    } catch (err) {
      setLoginError(String(err && err.message ? err.message : err));
    }
  }

  // Anyone can create their own manager account — each admin only ever
  // sees and manages the employees they personally created.
  function registerAdmin(newUsername, newPassword) {
    const admins = usersData.admins || {};
    if (!newUsername || !newUsername.trim()) return { error: makeT(lang)("errEmptyLogin") };
    const uname = newUsername.trim();
    if (admins[uname] || usersData.employees.some((e) => e.username === uname)) {
      return { error: makeT(lang)("errLoginTaken") };
    }
    if (!newPassword || newPassword.length < 4) {
      return { error: makeT(lang)("errShortPassword") };
    }
    const updated = { ...usersData, admins: { ...admins, [uname]: { password: newPassword, avatar: null } } };
    persistUsers(updated);
    setCurrentUser({ role: "admin", name: makeT(lang)("admin"), username: uname });
    return {};
  }

  function logout() {
    setCurrentUser(null);
    setLoginForm({ username: "", password: "" });
  }

  function summaryFor(empId) {
    const emp = usersData.employees.find((x) => x.id === empId);
    if (!emp) return null;
    const att = attendance[empId] || {};
    const workedDays = Object.values(att).reduce((sum, v) => {
      if (typeof v === "number") return sum + v;
      if (v === true) return sum + 1; // legacy data before half-day support
      return sum;
    }, 0);
    const totalWage = workedDays * Number(emp.dailyWage);
    const advList = advances[empId] || [];
    const totalAvans = advList.filter((a) => a.type !== "salary").reduce((sum, a) => sum + Number(a.amount), 0);
    const totalSalaryPaid = advList.filter((a) => a.type === "salary").reduce((sum, a) => sum + Number(a.amount), 0);
    const totalAdvance = totalAvans + totalSalaryPaid; // combined, kept for backward compatibility
    return { emp, workedDays, totalWage, totalAdvance, totalAvans, totalSalaryPaid, remaining: totalWage - totalAdvance, advList, att };
  }

  async function addEmployee() {
    setEmpError("");
    if (!newEmp.name || !newEmp.username || !newEmp.password || !newEmp.dailyWage) {
      setEmpError(makeT(lang)("fillAllFields"));
      return;
    }
    if (usersData.employees.some((x) => x.username === newEmp.username) || Object.keys(usersData.admins).includes(newEmp.username)) {
      setEmpError(makeT(lang)("errLoginTaken"));
      return;
    }
    const id = "e" + Date.now();
    const updated = {
      ...usersData,
      employees: [...usersData.employees, {
        id, name: newEmp.name, username: newEmp.username,
        password: newEmp.password, dailyWage: Number(newEmp.dailyWage), avatar: null,
        owner: currentUser.username,
      }],
    };
    await persistUsers(updated);
    setNewEmp({ name: "", username: "", password: "", dailyWage: "" });
  }

  async function deleteEmployee(id) {
    const target = usersData.employees.find((x) => x.id === id);
    if (!target || (currentUser && currentUser.role === "admin" && target.owner !== currentUser.username)) return;
    await persistUsers({ ...usersData, employees: usersData.employees.filter((x) => x.id !== id) });
    const att2 = { ...attendance }; delete att2[id]; await persistAttendance(att2);
    const adv2 = { ...advances }; delete adv2[id]; await persistAdvances(adv2);
    if (advEmp === id) setAdvEmp("");
  }

  async function markAttendance(empId, status) {
    if (attDate > todayISO()) return; // safety guard — future dates can't be marked
    const dayMap = { ...(attendance[empId] || {}) };
    if (dayMap[attDate] === status) {
      delete dayMap[attDate]; // clicking the active status again clears it
    } else {
      dayMap[attDate] = status;
    }
    await persistAttendance({ ...attendance, [empId]: dayMap });
  }

  async function addAdvance() {
    if (!advEmp || !advForm.amount) return;
    const list = advances[advEmp] ? [...advances[advEmp]] : [];
    list.push({ id: "a" + Date.now(), amount: Number(advForm.amount), date: advForm.date, note: advForm.note, type: advForm.type || "avans" });
    await persistAdvances({ ...advances, [advEmp]: list });
    setAdvForm({ amount: "", date: todayISO(), note: "", type: advForm.type || "avans" });
  }

  async function deleteAdvance(empId, advId) {
    const list = (advances[empId] || []).filter((a) => a.id !== advId);
    await persistAdvances({ ...advances, [empId]: list });
  }

  // Works for whichever role is currently logged in.
  function changeOwnCredentials(newUsername, newPassword) {
    if (!currentUser) return { error: "—" };
    if (currentUser.role === "admin") {
      const oldUsername = currentUser.username;
      const taken = newUsername !== oldUsername &&
        (Object.keys(usersData.admins).includes(newUsername) || usersData.employees.some((e) => e.username === newUsername));
      if (taken) return { error: makeT(lang)("errLoginTaken") };
      const admins = { ...usersData.admins };
      const data = admins[oldUsername];
      delete admins[oldUsername];
      admins[newUsername] = { ...data, password: newPassword };
      // Keep this admin's employees pointing at them under their new username.
      const employees = usersData.employees.map((e) => (e.owner === oldUsername ? { ...e, owner: newUsername } : e));
      persistUsers({ ...usersData, admins, employees });
      setCurrentUser({ role: "admin", name: currentUser.name, username: newUsername });
      return {};
    }
    const taken = usersData.employees.some((e) => e.id !== currentUser.id && e.username === newUsername) || Object.keys(usersData.admins).includes(newUsername);
    if (taken) return { error: makeT(lang)("errLoginTaken") };
    const employees = usersData.employees.map((e) => (e.id === currentUser.id ? { ...e, username: newUsername, password: newPassword } : e));
    persistUsers({ ...usersData, employees });
    setCurrentUser({ role: "employee", id: currentUser.id, name: currentUser.name, owner: currentUser.owner });
    return {};
  }

  async function updateAvatar(dataUrl) {
    if (!currentUser) return;
    if (currentUser.role === "admin") {
      const admins = { ...usersData.admins, [currentUser.username]: { ...usersData.admins[currentUser.username], avatar: dataUrl } };
      await persistUsers({ ...usersData, admins });
    } else {
      const employees = usersData.employees.map((e) => (e.id === currentUser.id ? { ...e, avatar: dataUrl } : e));
      await persistUsers({ ...usersData, employees });
    }
  }

  const t = makeT(lang);

  let screen;
  if (loading) {
    screen = <div className="min-h-screen flex items-center justify-center bg-[var(--bg-app)] text-[var(--text-secondary)] text-sm">{t("loading")}</div>;
  } else if (!currentUser) {
    screen = (
      <LoginScreen
        loginForm={loginForm}
        setLoginForm={setLoginForm}
        loginError={loginError}
        onSubmit={handleLogin}
        onRegister={registerAdmin}
      />
    );
  } else if (currentUser.role === "admin") {
    screen = (
      <AdminApp
        usersData={usersData}
        currentUser={currentUser}
        onLogout={logout}
        summaryFor={summaryFor}
        adminTab={adminTab}
        setAdminTab={setAdminTab}
        newEmp={newEmp}
        setNewEmp={setNewEmp}
        empError={empError}
        addEmployee={addEmployee}
        deleteEmployee={deleteEmployee}
        attendance={attendance}
        attDate={attDate}
        setAttDate={setAttDate}
        markAttendance={markAttendance}
        advances={advances}
        advEmp={advEmp}
        setAdvEmp={setAdvEmp}
        advForm={advForm}
        setAdvForm={setAdvForm}
        addAdvance={addAdvance}
        deleteAdvance={deleteAdvance}
        changeOwnCredentials={changeOwnCredentials}
        updateAvatar={updateAvatar}
        accent={accent} setAccent={setAccent}
        mode={mode} setMode={setMode}
        fontScale={fontScale} setFontScale={setFontScale}
        lang={lang} setLang={setLang}
      />
    );
  } else {
    screen = (
      <EmployeeApp
        currentUser={currentUser}
        usersData={usersData}
        summaryFor={summaryFor}
        onLogout={logout}
        changeOwnCredentials={changeOwnCredentials}
        updateAvatar={updateAvatar}
        accent={accent} setAccent={setAccent}
        mode={mode} setMode={setMode}
        fontScale={fontScale} setFontScale={setFontScale}
        lang={lang} setLang={setLang}
      />
    );
  }

  return (
    <AppContext.Provider value={{ accent, lang, t }}>
      <div style={{ ...PALETTES[mode], "--accent": accent }}>{screen}</div>
    </AppContext.Provider>
  );
}
