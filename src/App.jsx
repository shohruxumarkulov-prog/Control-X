import { useState, useEffect, useRef, createContext, useContext } from "react";
import {
  Users, Calendar, Wallet, LogOut, Plus, Trash2, CheckCircle2,
  XCircle, Eye, EyeOff, UserPlus, ShieldCheck, ClipboardList, TrendingDown,
  MoreVertical, Copy, Check, KeyRound, Settings, Lock, X, Palette, Type,
  Camera, Globe, User as UserIcon, ChevronDown, Sun, Moon, ChevronLeft, ChevronRight,
  Menu, ChevronUp, UserX, ArrowLeft, Paintbrush, Download, Send, Bell, Search, LayoutDashboard
} from "lucide-react";
import { supabase } from "./lib/supabase";
import * as XLSX from "xlsx";
import confetti from "canvas-confetti";

const todayISO = () => new Date().toISOString().slice(0, 10);
const fmt = (n) => Number(n || 0).toLocaleString("uz-UZ") + " so'm";
const fmtDays = (n) => {
  const r = Math.round(Number(n || 0) * 10) / 10;
  return Number.isInteger(r) ? String(r) : r.toFixed(1);
};

function wageForDate(emp, date) {
  const history = emp.wageHistory;
  if (!Array.isArray(history) || history.length === 0) return Number(emp.dailyWage || 0);
  let applicable = history[0];
  for (const entry of history) {
    if (entry.date <= date) applicable = entry;
    else break;
  }
  return Number(applicable.wage);
}

function attEntryStatus(raw) {
  if (raw && typeof raw === "object") return raw.v;
  if (typeof raw === "number") return raw;
  if (raw === true) return 1;
  return 0;
}
function attEntryWage(raw, emp, date) {
  if (raw && typeof raw === "object" && typeof raw.wage === "number") return raw.wage;
  return wageForDate(emp, date);
}

function employeeJoinDate(emp) {
  if (Array.isArray(emp.wageHistory) && emp.wageHistory.length > 0) return emp.wageHistory[0].date;
  return "2000-01-01"; // eski (tarixsiz) ishchilar uchun — hamma joyda ko'rinaveradi
}

const LANGS = [
  { code: "uz", label: "O'zbekcha" },
  { code: "ru", label: "Русский" },
  { code: "en", label: "English" },
];

const STR = {
  appName: { uz: "Nazorat+", ru: "Nazorat+", en: "Nazorat+" },
  loginTitle: { uz: "Tizimga kirish", ru: "Вход в систему", en: "Sign in" },
  loginSubtitle: { uz: "Login va parolingizni kiriting", ru: "Введите логин и пароль", en: "Enter your login and password" },
  login: { uz: "Login", ru: "Логин", en: "Username" },
  password: { uz: "Parol", ru: "Пароль", en: "Password" },
  loginBtn: { uz: "Kirish", ru: "Войти", en: "Sign in" },
  firstTimeHint: { uz: "Birinchi marta kiryapsizmi? Admin uchun:", ru: "Первый раз здесь? Для админа:", en: "First time here? For admin:" },
  changeLaterHint: { uz: "Keyinchalik parolni albatta o'zgartiring.", ru: "Обязательно смените пароль позже.", en: "Be sure to change the password later." },
  wrongLogin: { uz: "Login yoki parol noto'g'ri", ru: "Неверный логин или пароль", en: "Incorrect username or password" },
  logout: { uz: "Chiqish", ru: "Выход", en: "Log out" },
  adminPanel: { uz: "Tizim", ru: "Система", en: "System" },
  employeePanel: { uz: "Profil", ru: "Профиль", en: "Profile" },
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
  markAllFull: { uz: "Hammasi to'liq", ru: "Все полный день", en: "Mark all full" },
  markAllHalf: { uz: "Hammasi yarim", ru: "Все полдня", en: "Mark all half" },
  markAllAbsent: { uz: "Hammasi kelmadi", ru: "Все отсутствуют", en: "Mark all absent" },
  myAdvances: { uz: "Avanslarim", ru: "Мои авансы", en: "My advances" },
  noAdvancesYet: { uz: "Hali avans olmagansiz", ru: "Вы ещё не получали аванс", en: "You haven't taken an advance yet" },
  statWorkedDays: { uz: "Ishlagan kunlar", ru: "Отработано дней", en: "Days worked" },
  statDailyWage: { uz: "Kunlik stavka", ru: "Дневная ставка", en: "Daily rate" },
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
  editWage: { uz: "Ish haqini o'zgartirish", ru: "Изменить зарплату", en: "Edit wage" },
  newDailyWage: { uz: "Yangi kunlik ish haqi (so'm)", ru: "Новая дневная зарплата (сум)", en: "New daily wage" },
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
  deleteAccount: { uz: "Akkauntni o'chirish", ru: "Удалить аккаунт", en: "Delete account" },
  confirmDeleteAccountAdmin: { uz: "Rostdan ham akkauntingizni o'chirmoqchimisiz? Barcha ishchilaringiz, davomat va avans tarixi ham butunlay o'chib ketadi.", ru: "Точно удалить аккаунт? Все ваши сотрудники, посещаемость и авансы тоже будут удалены навсегда.", en: "Really delete your account? All your employees, attendance, and advance history will be permanently deleted too." },
  confirmDeleteAccountEmployee: { uz: "Rostdan ham akkauntingizni o'chirmoqchimisiz? Davomat va avans tarixingiz ham butunlay o'chib ketadi.", ru: "Точно удалить аккаунт? Ваша посещаемость и авансы тоже будут удалены навсегда.", en: "Really delete your account? Your attendance and advance history will be permanently deleted too." },
  yesDeleteAccount: { uz: "Ha, akkauntni o'chirish", ru: "Да, удалить аккаунт", en: "Yes, delete account" },
  appearance: { uz: "Ko'rinish", ru: "Внешний вид", en: "Appearance" },
  privacySecurity: { uz: "Maxfiylik va xavfsizlik", ru: "Конфиденциальность и безопасность", en: "Privacy and Security" },
  updateCredentials: { uz: "Login va parolni yangilash", ru: "Обновить логин и пароль", en: "Update login and password" },
  enableNotifications: { uz: "Bildirishnomalarni yoqish", ru: "Включить уведомления", en: "Enable notifications" },
  notifications: { uz: "Bildirishnomalar", ru: "Уведомления", en: "Notifications" },
  noNotifications: { uz: "Hali bildirishnoma yo'q", ru: "Уведомлений пока нет", en: "No notifications yet" },
  markAllRead: { uz: "Hammasini o'qilgan deb belgilash", ru: "Отметить все как прочитанные", en: "Mark all as read" },
  advanced: { uz: "Kengaytirilgan", ru: "Дополнительно", en: "Advanced" },
};

function makeT(lang) {
  return (key, vars) => {
    let s = (STR[key] && (STR[key][lang] || STR[key].uz)) || key;
    if (vars) Object.entries(vars).forEach(([k, v]) => { s = s.replace(`{${k}}`, v); });
    return s;
  };
}

const AppContext = createContext({ accent: "#4d84d9", lang: "uz", t: makeT("uz") });
const useApp = () => useContext(AppContext);

const ACCENT_PRESETS = [
  { name: "Bronza", value: "#c98a4b" },
  { name: "Feruza", value: "#3a9188" },
  { name: "Ko'k", value: "#4d84d9" },
  { name: "Binafsha", value: "#8f7bd6" },
  { name: "Lolaqizg'aldoq", value: "#d9635a" },
  { name: "Pushti", value: "#cf6f98" },
];

const FONT_SCALES = [
  { key: "fontSmall", value: 90 },
  { key: "fontMedium", value: 100 },
  { key: "fontLarge", value: 115 },
];

const PALETTES = {
  dark: {
    "--bg-app": "#101317",
    "--bg-card": "#181c22",
    "--bg-panel": "#13161b",
    "--border": "#242a32",
    "--border-input": "#2a313a",
    "--border-soft": "#1c2129",
    "--text-primary": "#edeff2",
    "--text-secondary": "#8d97a3",
    "--text-muted": "#69727e",
    "--text-faint": "#4a525e",
  },
  light: {
    "--bg-app": "#eef0f3",
    "--bg-card": "#ffffff",
    "--bg-panel": "#ffffff",
    "--border": "#e0e3e8",
    "--border-input": "#d2d7de",
    "--border-soft": "#e9ecf0",
    "--text-primary": "#181c22",
    "--text-secondary": "#565f6b",
    "--text-muted": "#7c8592",
    "--text-faint": "#9aa2ac",
  },
};

const ADMIN_DEFAULT = { username: "admin", password: "admin123" };
const VAPID_PUBLIC_KEY = "BJHw7YqggwDUKfjS9pOcZyA_y7MO_46FWaRKv-fF8zr71CDEycK7hlEzq_hq4IzW7VhzysMJFZ-jXP4ULEYzn3k";

function urlBase64ToUint8Array(base64String) {
  const padding = "=".repeat((4 - (base64String.length % 4)) % 4);
  const base64 = (base64String + padding).replace(/-/g, "+").replace(/_/g, "/");
  const rawData = atob(base64);
  const outputArray = new Uint8Array(rawData.length);
  for (let i = 0; i < rawData.length; i++) outputArray[i] = rawData.charCodeAt(i);
  return outputArray;
}

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
  }
  return memoryStore[key];
}

async function safeSet(key, value) {
  memoryStore[key] = value;
  try {
    await supabase.from("app_storage").upsert({ key, value, updated_at: new Date().toISOString() });
  } catch (e) {
  }
}

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

function MoneyField({ label, value, onChange, suffix }) {
  const digits = String(value || "").replace(/\D/g, "");
  const display = digits ? Number(digits).toLocaleString("uz-UZ") : "";
  return (
    <div>
      <label className="block text-xs text-[var(--text-secondary)] mb-1.5">{label}</label>
      <div className="relative">
        <input
          type="text"
          inputMode="numeric"
          value={display}
          onChange={(e) => onChange(e.target.value.replace(/\D/g, ""))}
          placeholder="0"
          className={`w-full px-3 py-2.5 ${suffix ? "pr-14" : ""} rounded-lg bg-[var(--bg-app)] border border-[var(--border-input)] text-[var(--text-primary)] text-sm font-mono tabular-nums outline-none focus:border-[var(--accent)] transition-colors`}
        />
        {suffix && (
          <span className="absolute right-3 top-0 h-full flex items-center text-[var(--text-muted)] text-xs">{suffix}</span>
        )}
      </div>
    </div>
  );
}

function Stat({ label, value, tone = "default", icon }) {
  const toneMap = {
    default: "text-[var(--text-primary)]",
    good: "text-[var(--good)]",
    bad: "text-[var(--bad)]",
  };
  const valueLength = String(value).length;
  const sizeClass = valueLength > 13 ? "text-xs" : valueLength > 10 ? "text-sm" : valueLength > 8 ? "text-base" : "text-lg";
  return (
    <div className="bg-[var(--bg-card)] border border-[var(--border)] rounded-xl p-4 shadow-sm min-w-0 overflow-hidden">
      <div className="flex items-center gap-1.5 text-[var(--text-muted)] text-[11px] mb-1.5 leading-snug">
        {icon}<span>{label}</span>
      </div>
      <div className={`${sizeClass} font-semibold font-mono tabular-nums leading-tight whitespace-nowrap ${toneMap[tone]}`}>{value}</div>
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
    <div style={style} className="rounded-full bg-[var(--border-input)] text-[var(--text-secondary)] font-semibold flex items-center justify-center shrink-0">
      {initials || <UserIcon size={size * 0.5} />}
    </div>
  );
}

function Shell({ title, userName, avatar, onTitleClick, bottomNav, headerRight, children }) {
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
            <img src="/logo.svg" alt="" className="w-8 h-8 rounded-lg shrink-0" />
          )}
          <div>
            <div className="text-[var(--text-primary)] font-semibold text-sm leading-tight tracking-tight">{title}</div>
            <div className="text-[var(--text-muted)] text-xs leading-tight">{userName}</div>
          </div>
        </button>
        {headerRight}
      </header>
      <main className={`flex-1 p-5 max-w-4xl w-full mx-auto ${bottomNav ? "pb-32" : ""}`}>{children}</main>
      {bottomNav}
    </div>
  );
}

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
            <img src="/logo.svg" alt={t("appName")} className="w-9 h-9" />
            <span className="text-[var(--text-primary)] font-semibold text-lg tracking-tight">{t("appName")}</span>
          </div>
          <div className="bg-[var(--bg-card)] border border-[var(--border)] rounded-2xl p-7 shadow-lg">
            <h1 className="text-[var(--text-primary)] text-xl font-semibold mb-1 tracking-tight">{t("registerTitle")}</h1>
            <p className="text-[var(--text-muted)] text-sm mb-6">{t("registerSubtitle")}</p>
            <div className="space-y-3.5">
              <Field label={t("chooseLogin")} value={regForm.username} onChange={(v) => setRegForm({ ...regForm, username: v })} />
              <Field label={t("choosePassword")} type="password" value={regForm.password} onChange={(v) => setRegForm({ ...regForm, password: v })} />
              <Field label={t("repeatNewPassword")} type="password" value={regForm.confirm} onChange={(v) => setRegForm({ ...regForm, confirm: v })} />
            </div>
            {regError && <p className="text-[var(--bad)] text-xs mt-3">{regError}</p>}
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
          <img src="/logo.svg" alt={t("appName")} className="w-9 h-9" />
          <span className="text-[var(--text-primary)] font-semibold text-lg tracking-tight">{t("appName")}</span>
        </div>
        <div className="bg-[var(--bg-card)] border border-[var(--border)] rounded-2xl p-7 shadow-lg">
          <h1 className="text-[var(--text-primary)] text-xl font-semibold mb-1 tracking-tight">
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
          {loginError && <p className="text-[var(--bad)] text-xs mb-2 mt-1">{loginError}</p>}
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

function CopyButton({ text }) {
  const [copied, setCopied] = useState(false);
  const { t } = useApp();
  async function doCopy() {
    try {
      await navigator.clipboard.writeText(text);
      setCopied(true);
      setTimeout(() => setCopied(false), 1500);
    } catch (e) {
    }
  }
  return (
    <button
      type="button"
      onClick={doCopy}
      className="flex items-center gap-1 px-2 py-1 rounded-md bg-[var(--bg-app)] border border-[var(--border-input)] text-[var(--text-secondary)] hover:text-[var(--text-primary)] hover:border-[#3a4552] text-[11px] transition-colors shrink-0"
    >
      {copied ? <Check size={12} className="text-[var(--good)]" /> : <Copy size={12} />}
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

function EmployeeRow({ emp, summary: s, onDelete, onUpdateWage }) {
  const [open, setOpen] = useState(false);
  const [reveal, setReveal] = useState(false);
  const [confirmDelete, setConfirmDelete] = useState(false);
  const [showPhoto, setShowPhoto] = useState(false);
  const [editingWage, setEditingWage] = useState(false);
  const [wageDraft, setWageDraft] = useState(String(emp.dailyWage || ""));
  const { accent, t } = useApp();

  function saveWage() {
    const n = Number(wageDraft);
    if (wageDraft && n >= 0) onUpdateWage(n);
    setEditingWage(false);
  }

  return (
    <div className="bg-[var(--bg-card)] border border-[var(--border)] rounded-xl overflow-hidden shadow-sm">
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
          {s.remaining === 0 ? (
            <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[10px] font-semibold" style={{ backgroundColor: "var(--warn-soft)", color: "var(--warn)" }}>
              <Check size={11} /> To'liq to'landi
            </span>
          ) : (
            <div className={`text-sm font-semibold font-mono tabular-nums ${s.remaining < 0 ? "text-[var(--bad)]" : "text-[var(--good)]"}`}>
              {fmt(s.remaining)}
            </div>
          )}
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

          <div className="flex items-center gap-1.5 text-[var(--text-secondary)] text-xs font-medium mb-1 mt-1">
            <Wallet size={12} /> {t("dailyWage")}
          </div>
          {!editingWage ? (
            <div className="flex items-center justify-between gap-2 bg-[var(--bg-app)] border border-[var(--border-input)] rounded-lg px-3 py-2">
              <div className="text-[var(--text-primary)] text-sm font-mono tabular-nums">{fmt(emp.dailyWage)}{t("perDay")}</div>
              <button
                type="button"
                onClick={() => { setWageDraft(String(emp.dailyWage || "")); setEditingWage(true); }}
                className="p-1.5 rounded-md text-[var(--text-muted)] hover:text-[var(--text-primary)] transition-colors"
                aria-label={t("editWage")}
              >
                <Settings size={14} />
              </button>
            </div>
          ) : (
            <div className="bg-[var(--bg-app)] border border-[var(--border-input)] rounded-lg p-3 space-y-2">
              <MoneyField label={t("newDailyWage")} value={wageDraft} onChange={setWageDraft} suffix="so'm" />
              <div className="flex gap-2">
                <button type="button" onClick={saveWage} className="flex-1 py-2 rounded-lg text-[#12161c] text-xs font-semibold hover:opacity-90 transition-opacity" style={{ backgroundColor: accent }}>
                  {t("save")}
                </button>
                <button type="button" onClick={() => setEditingWage(false)} className="flex-1 py-2 rounded-lg bg-transparent border border-[var(--border-input)] text-[var(--text-secondary)] text-xs font-medium hover:text-[var(--text-primary)] transition-colors">
                  {t("cancel")}
                </button>
              </div>
            </div>
          )}

          <div className="grid grid-cols-3 gap-2 pt-1">
            <div className="text-center">
              <div className="text-[var(--text-primary)] text-sm font-semibold font-mono tabular-nums">{fmtDays(s.workedDays)}</div>
              <div className="text-[9px] text-[var(--text-muted)] uppercase tracking-wide mt-0.5">{t("day")}</div>
            </div>
            <div className="text-center">
              <div className="text-[var(--bad)] text-sm font-semibold font-mono tabular-nums">{fmt(s.totalAdvance)}</div>
              <div className="text-[9px] text-[var(--text-muted)] uppercase tracking-wide mt-0.5">{t("advance")}</div>
            </div>
                        <div className="text-center">
              {s.remaining === 0 ? (
                <div className="flex items-center justify-center gap-1 text-[var(--warn)] text-sm font-semibold">
                  <Check size={13} />
                </div>
              ) : (
                <div className="text-[var(--good)] text-sm font-semibold font-mono tabular-nums">{fmt(s.remaining)}</div>
              )}
              <div className="text-[9px] text-[var(--text-muted)] uppercase tracking-wide mt-0.5">{t("remaining")}</div>
            </div>
          </div>

          {!confirmDelete ? (
            <button
              type="button"
              onClick={() => setConfirmDelete(true)}
              className="w-full flex items-center justify-center gap-1.5 py-2 rounded-lg bg-[var(--bad-soft)] text-[var(--bad)] text-xs font-medium hover:opacity-90 transition-opacity mt-1"
            >
              <Trash2 size={13} /> {t("deleteEmployee")}
            </button>
          ) : (
            <div className="mt-1 bg-[var(--bad-soft)] border border-[var(--bad)]/30 rounded-lg p-3">
              <p className="text-[var(--bad)] text-xs mb-2.5">{t("confirmDelete", { name: emp.name })}</p>
              <div className="flex gap-2">
                <button type="button" onClick={onDelete} className="flex-1 py-2 rounded-lg bg-[var(--bad)] text-white text-xs font-semibold hover:opacity-90 transition-opacity">
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

function MenuRow({ icon, label, onClick, danger }) {
  return (
    <button
      type="button"
      onClick={onClick}
      className="w-full flex items-center justify-between py-3.5 border-b border-[var(--border)] last:border-b-0 text-left"
    >
      <span className={`flex items-center gap-3 text-sm ${danger ? "text-[var(--bad)]" : "text-[var(--text-primary)]"}`}>{icon}{label}</span>
      <ChevronRight size={16} className="text-[var(--text-muted)]" />
    </button>
  );
}

function NotificationPanel({ open, onClose, notifications, onMarkAllRead }) {
  const { t } = useApp();
  return (
    <>
      {open && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-30 transition-opacity" onClick={onClose} />
      )}
      <div
        className={`fixed top-0 right-0 h-full w-[86%] max-w-sm bg-[var(--bg-panel)] border-l border-[var(--border)] shadow-2xl z-40 overflow-y-auto transition-transform duration-200 ${
          open ? "translate-x-0" : "translate-x-full"
        }`}
      >
        <div className="flex items-center justify-between px-5 py-4 border-b border-[var(--border)] sticky top-0 bg-[var(--bg-panel)] z-10">
          <span className="text-[var(--text-primary)] text-sm font-semibold flex items-center gap-1.5">
            <Bell size={16} /> {t("notifications")}
          </span>
          <button type="button" onClick={onClose} className="text-[var(--text-muted)] hover:text-[var(--text-primary)] transition-colors">
            <X size={18} />
          </button>
        </div>

        {notifications.length > 0 && (
          <div className="px-5 pt-3">
            <button
              type="button"
              onClick={onMarkAllRead}
              className="text-[var(--accent)] text-xs font-medium hover:opacity-80 transition-opacity"
            >
              {t("markAllRead")}
            </button>
          </div>
        )}

        <div className="px-5 py-4 space-y-2.5">
          {notifications.length === 0 && (
            <p className="text-[var(--text-muted)] text-sm text-center py-10">{t("noNotifications")}</p>
          )}
          {notifications.map((n) => (
            <div
              key={n.id}
              className="bg-[var(--bg-card)] border border-[var(--border)] rounded-xl p-3.5"
              style={!n.is_read ? { borderColor: "var(--accent)" } : undefined}
            >
              <div className="flex items-center justify-between gap-2 mb-1">
                <span className="text-[var(--text-primary)] text-sm font-semibold">{n.title}</span>
                {!n.is_read && <span className="w-2 h-2 rounded-full shrink-0" style={{ backgroundColor: "var(--accent)" }} />}
              </div>
              <p className="text-[var(--text-secondary)] text-xs leading-snug">{n.body}</p>
              <p className="text-[var(--text-faint)] text-[10px] mt-1.5">
                {new Date(n.created_at).toLocaleString()}
              </p>
            </div>
          ))}
        </div>
      </div>
    </>
  );
}

function ProfileDrawer({
  open, onClose, me, roleLabel, isAdmin, onDeleteAccount, onLogout,
  changeOwnCredentials, updateAvatar, enableNotifications,
  accent, setAccent, mode, setMode, fontScale, setFontScale, lang, setLang,
}) {
  const { t } = useApp();
  const fileRef = useRef(null);
  const [page, setPage] = useState(null);
  const [currentPw, setCurrentPw] = useState("");
  const [newUsername, setNewUsername] = useState(me.username);
  const [newPw, setNewPw] = useState("");
  const [newPw2, setNewPw2] = useState("");
  const [msg, setMsg] = useState({ type: "", text: "" });
  const [avatarBusy, setAvatarBusy] = useState(false);
  const [confirmDeleteAcc, setConfirmDeleteAcc] = useState(false);

  useEffect(() => {
    if (!open) setPage(null);
  }, [open]);

  const PAGE_TITLES = { appearance: t("appearance"), privacy: t("privacySecurity"), credentials: t("updateCredentials"), language: t("language"), advanced: t("advanced") };
  const PARENT_PAGE = { credentials: "privacy" };

  async function handleFile(e) {
    const file = e.target.files && e.target.files[0];
    if (!file) return;
    setAvatarBusy(true);
    try {
      const dataUrl = await fileToAvatarDataUrl(file);
      await updateAvatar(dataUrl);
    } catch (err) {
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

  const currentFontLabel = t(FONT_SCALES.find((f) => f.value === fontScale)?.key || "fontMedium");

  return (
    <>
      {open && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-30 transition-opacity" onClick={onClose} />
      )}
      <div
        className={`fixed top-0 left-0 h-full w-[86%] max-w-sm bg-[var(--bg-panel)] border-r border-[var(--border)] shadow-2xl z-40 overflow-y-auto transition-transform duration-200 ${
          open ? "translate-x-0" : "-translate-x-full"
        }`}
      >
        <div className="flex items-center justify-between px-5 py-4 border-b border-[var(--border)] sticky top-0 bg-[var(--bg-panel)] z-10">
          {page ? (
            <button
              type="button"
              onClick={() => setPage(PARENT_PAGE[page] || null)}
              className="flex items-center gap-1.5 text-[var(--text-primary)] text-sm font-semibold"
            >
              <ArrowLeft size={18} /> {PAGE_TITLES[page]}
            </button>
          ) : <span />}
          <button
            type="button"
            onClick={() => setMode(mode === "dark" ? "light" : "dark")}
            className="text-[var(--text-secondary)] hover:text-[var(--accent)] transition-colors"
            aria-label={t("themeColor")}
          >
            {mode === "dark" ? <Sun size={20} /> : <Moon size={20} />}
          </button>
        </div>

        {!page && (
          <>
            <div className="px-5 pt-5">
              <div className="flex items-center gap-3.5 pb-5">
                <div className="relative shrink-0">
                  <Avatar src={me.avatar} name={me.name} size={56} />
                  <button
                    type="button"
                    onClick={() => fileRef.current && fileRef.current.click()}
                    disabled={avatarBusy}
                    className="absolute -bottom-1 -right-1 w-6 h-6 rounded-full flex items-center justify-center border-2"
                    style={{ backgroundColor: accent, color: "#12161c", borderColor: "var(--bg-panel)" }}
                    aria-label={t("changePhoto")}
                  >
                    <Camera size={11} />
                  </button>
                  <input ref={fileRef} type="file" accept="image/*" className="hidden" onChange={handleFile} />
                </div>
                <div className="min-w-0">
                  <div className="text-[var(--text-primary)] text-base font-semibold truncate">{me.name}</div>
                  <div className="text-[var(--text-muted)] text-sm truncate">{roleLabel}</div>
                </div>
              </div>
            </div>

            <div className="px-5">
              <MenuRow icon={<Paintbrush size={18} className="text-[var(--accent)]" />} label={t("appearance")} onClick={() => setPage("appearance")} />
              <MenuRow icon={<ShieldCheck size={18} className="text-[var(--good)]" />} label={t("privacySecurity")} onClick={() => setPage("privacy")} />
              <MenuRow icon={<Globe size={18} className="text-[var(--accent)]" />} label={t("language")} onClick={() => setPage("language")} />
              <MenuRow icon={<Settings size={18} className="text-[var(--text-secondary)]" />} label={t("advanced")} onClick={() => setPage("advanced")} />
              <MenuRow icon={<LogOut size={18} className="text-[var(--bad)]" />} label={t("logout")} onClick={onLogout} danger />
            </div>
            <div className="h-5" />
          </>
        )}

        {page === "appearance" && (
          <div className="px-5 pt-5 pb-8 space-y-6">
            <div>
              <div className="flex items-center gap-1.5 text-[var(--text-secondary)] text-xs font-medium mb-2.5">
                <Palette size={13} /> {t("themeColor")}
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
            </div>
            <div>
              <div className="flex items-center gap-1.5 text-[var(--text-secondary)] text-xs font-medium mb-2.5">
                <Type size={13} /> {t("fontSize")}
              </div>
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
            </div>
          </div>
        )}

        {page === "privacy" && (
          <div className="px-5">
            <MenuRow icon={<KeyRound size={18} className="text-[var(--accent)]" />} label={t("updateCredentials")} onClick={() => setPage("credentials")} />
            {isAdmin && (
              <MenuRow icon={<Send size={18} className="text-[var(--good)]" />} label={t("enableNotifications")} onClick={enableNotifications} />
            )}
          </div>
        )}

        {page === "credentials" && (
          <div className="px-5 pt-5 pb-8">
            <div className="space-y-3">
              <Field label={t("currentPassword")} type="password" value={currentPw} onChange={setCurrentPw} />
              <Field label={t("newLogin")} value={newUsername} onChange={setNewUsername} />
              <Field label={t("newPassword")} type="password" value={newPw} onChange={setNewPw} />
              <Field label={t("repeatNewPassword")} type="password" value={newPw2} onChange={setNewPw2} />
            </div>
            {msg.text && (
              <p className={`text-xs mt-2.5 ${msg.type === "error" ? "text-[var(--bad)]" : "text-[var(--good)]"}`}>{msg.text}</p>
            )}
            <button
              type="button"
              onClick={submitPassword}
              className="mt-3 w-full py-2.5 rounded-lg text-[#12161c] text-xs font-semibold hover:opacity-90 transition-opacity"
              style={{ backgroundColor: accent }}
            >
              {t("save")}
            </button>
          </div>
        )}

        {page === "language" && (
          <div className="px-5 pt-5 pb-8">
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
          </div>
        )}

        {page === "advanced" && (
          <div className="px-5 pt-5 pb-8">
            {!confirmDeleteAcc ? (
              <button
                type="button"
                onClick={() => setConfirmDeleteAcc(true)}
                className="w-full flex items-center justify-center gap-1.5 py-2.5 rounded-lg bg-[var(--bad-soft)] text-[var(--bad)] text-xs font-medium hover:opacity-90 transition-opacity"
              >
                <UserX size={14} /> {t("deleteAccount")}
              </button>
            ) : (
              <div className="bg-[var(--bad-soft)] border border-[var(--bad)]/30 rounded-lg p-3.5">
                <p className="text-[var(--bad)] text-xs mb-2.5">
                  {isAdmin ? t("confirmDeleteAccountAdmin") : t("confirmDeleteAccountEmployee")}
                </p>
                <div className="flex gap-2">
                  <button
                    type="button"
                    onClick={onDeleteAccount}
                    className="flex-1 py-2 rounded-lg bg-[var(--bad)] text-white text-xs font-semibold hover:opacity-90 transition-opacity"
                  >
                    {t("yesDeleteAccount")}
                  </button>
                  <button
                    type="button"
                    onClick={() => setConfirmDeleteAcc(false)}
                    className="flex-1 py-2 rounded-lg bg-[var(--bg-app)] border border-[var(--border-input)] text-[var(--text-secondary)] text-xs font-medium hover:text-[var(--text-primary)] transition-colors"
                  >
                    {t("cancel")}
                  </button>
                </div>
              </div>
            )}
          </div>
        )}
      </div>
    </>
  );
}

function AdminApp({
  usersData, currentUser, onLogout, summaryFor,
  adminTab, setAdminTab,
  newEmp, setNewEmp, empError, addEmployee, deleteEmployee, updateEmployeeWage,
  attendance, attDate, setAttDate, markAttendance, bulkMarkAttendance,
  advances, advEmp, setAdvEmp, advForm, setAdvForm, addAdvance, deleteAdvance,
  changeOwnCredentials, updateAvatar, deleteOwnAccount, accent, setAccent, mode, setMode, fontScale, setFontScale, lang, setLang, enableNotifications,
  notifications, markAllNotificationsRead,
}) {
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [showAddForm, setShowAddForm] = useState(false);
  const [notifOpen, setNotifOpen] = useState(false);
  const [empSearch, setEmpSearch] = useState("");
  const unreadCount = notifications.filter((n) => !n.is_read).length;
  const { t } = useApp();
  const myAdmin = usersData.admins[currentUser.username] || { password: "", avatar: null };
  const myEmployees = usersData.employees.filter((e) => e.owner === currentUser.username);
  const tabs = [
    { id: "employees", label: t("navEmployees"), icon: <Users size={18} /> },
    { id: "attendance", label: t("navAttendance"), icon: <Calendar size={18} /> },
    { id: "advances", label: t("navAdvances"), icon: <Wallet size={18} /> },
    { id: "report", label: t("navReport"), icon: <ClipboardList size={18} /> },
  ];
  const touchStartX = useRef(null);
  const touchStartY = useRef(null);
  function handleTouchStart(e) {
    touchStartX.current = e.touches[0].clientX;
    touchStartY.current = e.touches[0].clientY;
  }
  function handleTouchEnd(e) {
    if (touchStartX.current === null) return;
    const deltaX = e.changedTouches[0].clientX - touchStartX.current;
    const deltaY = e.changedTouches[0].clientY - touchStartY.current;
    touchStartX.current = null;
    touchStartY.current = null;
    if (Math.abs(deltaX) < 110) return;
    if (Math.abs(deltaX) < Math.abs(deltaY) * 1.5) return;
    const idx = tabs.findIndex((t) => t.id === adminTab);
    if (deltaX < 0 && idx < tabs.length - 1) setAdminTab(tabs[idx + 1].id);
    if (deltaX > 0 && idx > 0) setAdminTab(tabs[idx - 1].id);
  }
  
  const localeTag = lang === "ru" ? "ru-RU" : lang === "en" ? "en-US" : "uz-UZ";
  function exportReportToExcel() {
    const rows = myEmployees.map((emp) => {
      const s = summaryFor(emp.id);
      return {
        [t("colEmployee")]: emp.name,
        [t("colDays")]: fmtDays(s.workedDays),
        [t("colCalculated")]: s.totalWage,
        [t("colAdvance")]: s.totalAdvance,
        [t("colRemaining")]: s.remaining,
      };
    });
    const ws = XLSX.utils.json_to_sheet(rows);
    ws["!cols"] = [{ wch: 22 }, { wch: 10 }, { wch: 16 }, { wch: 16 }, { wch: 16 }];
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, t("reportHeader").slice(0, 31));
    XLSX.writeFile(wb, `hisobot-${todayISO()}.xlsx`);
  }
  const [weekOffset, setWeekOffset] = useState(0);
  const dateStrip = (() => {
    const today = new Date();
    const day = today.getDay();
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
    <nav className="fixed bottom-0 left-0 right-0 z-20 px-4" style={{ paddingBottom: "calc(env(safe-area-inset-bottom) + 16px)" }}>
      <div className="max-w-md mx-auto flex bg-[var(--bg-card)]/95 backdrop-blur-md border border-[var(--border)] rounded-full shadow-lg px-1.5 py-1">
        {tabs.map((tab) => {
          const active = adminTab === tab.id;
          return (
            <button
              key={tab.id}
              type="button"
              onClick={() => setAdminTab(tab.id)}
              className="flex-1 flex justify-center"
            >
              <span
                className="w-full flex flex-col items-center gap-0.5 px-4 py-2.5 rounded-full text-[10px] font-medium transition-colors"
                style={active ? { backgroundColor: accent + "26", color: accent } : { color: "var(--text-muted)" }}
              >
                {tab.icon}
                {tab.label}
              </span>
            </button>
          );
        })}
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
        isAdmin={true}
        onDeleteAccount={deleteOwnAccount}
        onLogout={onLogout}
        changeOwnCredentials={changeOwnCredentials}
        updateAvatar={updateAvatar}
        accent={accent} setAccent={setAccent}
        mode={mode} setMode={setMode}
        fontScale={fontScale} setFontScale={setFontScale}
        lang={lang} setLang={setLang}
        enableNotifications={enableNotifications}
      />
      <NotificationPanel
        open={notifOpen}
        onClose={() => setNotifOpen(false)}
        notifications={notifications}
        onMarkAllRead={() => markAllNotificationsRead(currentUser.username)}
      />
      <Shell
        title={t("adminPanel")}
        userName={currentUser.username}
        avatar={myAdmin.avatar || null}
        onTitleClick={() => setDrawerOpen(true)}
        bottomNav={bottomNav}
        headerRight={
          <button
            type="button"
            onClick={() => setNotifOpen(true)}
            className="w-9 h-9 rounded-full flex items-center justify-center text-[var(--text-secondary)] hover:text-[var(--accent)] hover:bg-[var(--bg-card)] transition-colors shrink-0 relative"
            aria-label={t("notifications")}
          >
            <Bell size={18} />
            {unreadCount > 0 && (
              <span className="absolute top-1 right-1 min-w-[16px] h-4 px-1 rounded-full bg-[var(--bad)] text-white text-[9px] font-bold flex items-center justify-center">
                {unreadCount}
              </span>
            )}
          </button>
        }
      >
      <div key={adminTab} className="tab-transition" onTouchStart={handleTouchStart} onTouchEnd={handleTouchEnd}>
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
            <div className="bg-[var(--bg-card)] border border-[var(--border)] rounded-xl p-5 shadow-sm">
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
                <MoneyField label={t("dailyWage")} value={newEmp.dailyWage} onChange={(v) => setNewEmp({ ...newEmp, dailyWage: v })} suffix="so'm" />
                <Field label={t("login")} value={newEmp.username} onChange={(v) => setNewEmp({ ...newEmp, username: v })} />
                <Field label={t("password")} type="password" value={newEmp.password} onChange={(v) => setNewEmp({ ...newEmp, password: v })} />
              </div>
              {empError && <p className="text-[var(--bad)] text-xs mt-3">{empError}</p>}
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

                   {myEmployees.length > 0 && (
            <div className="relative">
              <Search size={15} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-[var(--text-muted)]" />
              <input
                type="text"
                value={empSearch}
                onChange={(e) => setEmpSearch(e.target.value)}
                placeholder="Ism bo'yicha qidirish..."
                className="w-full pl-9 pr-3 py-2.5 rounded-lg bg-[var(--bg-app)] border border-[var(--border-input)] text-[var(--text-primary)] text-sm outline-none focus:border-[var(--accent)] transition-colors"
              />
            </div>
          )}

          <div className="space-y-2">
            {(() => {
              const filteredEmployees = myEmployees.filter((emp) =>
                emp.name.toLowerCase().includes(empSearch.trim().toLowerCase())
              );
              if (myEmployees.length === 0) {
                return <p className="text-[var(--text-muted)] text-sm text-center py-8">{t("noEmployees")}</p>;
              }
              if (filteredEmployees.length === 0) {
                return <p className="text-[var(--text-muted)] text-sm text-center py-8">Hech kim topilmadi</p>;
              }
              return filteredEmployees.map((emp) => (
                <EmployeeRow key={emp.id} emp={emp} summary={summaryFor(emp.id)} onDelete={() => deleteEmployee(emp.id)} onUpdateWage={(w) => updateEmployeeWage(emp.id, w)} />
              ));
            })()}
          </div>
        </div>
      )}

      {adminTab === "attendance" && (
        <div className="space-y-4">
          <div className="bg-[var(--bg-card)] border border-[var(--border)] rounded-xl p-4 shadow-sm">
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
                                    const dayEmployees = myEmployees.filter((emp) => employeeJoinDate(emp) <= d);
                  const markedCount = dayEmployees.filter((emp) => attendance[emp.id]?.[d] !== undefined).length;
                  const dotColor = dayEmployees.length === 0 || isFuture
                    ? "transparent"
                    : markedCount === 0
                      ? "var(--border-input)"
                      : markedCount < dayEmployees.length
                        ? "var(--warn)"
                        : "var(--good)";
                  const style = isFuture
                    ? { backgroundColor: "var(--bg-app)", color: "var(--text-faint)", border: "1px solid var(--border-input)", opacity: 0.45 }
                    : isToday
                      ? { backgroundColor: "var(--good)", color: "#0e1712", boxShadow: isSelected ? `0 0 0 2px var(--bg-card), 0 0 0 4px ${accent}` : "none" }
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

                    {(() => {
            const visibleEmployees = myEmployees.filter((emp) => employeeJoinDate(emp) <= attDate);
            return (
              <>
          {visibleEmployees.length > 0 && attDate <= todayISO() && (
            <div className="flex gap-1.5">
              <button
                type="button"
                onClick={() => bulkMarkAttendance(visibleEmployees.map((e) => ({ id: e.id, wage: e.dailyWage })), 1)}
                className="flex-1 flex items-center justify-center gap-1 py-2 rounded-lg text-[11px] font-medium bg-[var(--good-soft)] text-[var(--good)] hover:opacity-80 transition-opacity"
              >
                <CheckCircle2 size={13} /> {t("markAllFull")}
              </button>
              <button
                type="button"
                onClick={() => bulkMarkAttendance(visibleEmployees.map((e) => ({ id: e.id, wage: e.dailyWage })), 0.5)}
                className="flex-1 flex items-center justify-center gap-1 py-2 rounded-lg text-[11px] font-medium bg-[var(--warn-soft)] text-[var(--warn)] hover:opacity-80 transition-opacity"
              >
                <Calendar size={13} /> {t("markAllHalf")}
              </button>
              <button
                type="button"
                onClick={() => bulkMarkAttendance(visibleEmployees.map((e) => ({ id: e.id, wage: e.dailyWage })), 0)}
                className="flex-1 flex items-center justify-center gap-1 py-2 rounded-lg text-[11px] font-medium bg-[var(--bad-soft)] text-[var(--bad)] hover:opacity-80 transition-opacity"
              >
                <XCircle size={13} /> {t("markAllAbsent")}
              </button>
            </div>
          )}
          
          <div className="space-y-2">
            {visibleEmployees.length === 0 && (
              <p className="text-[var(--text-muted)] text-sm text-center py-8">{t("noEmployees")}</p>
            )}
            {visibleEmployees.length > 0 && attDate > todayISO() && (
              <p className="text-[var(--warn)] text-xs text-center py-2 bg-[var(--bg-card)] border border-[var(--border)] rounded-lg">{t("futureDateWarning")}</p>
            )}
            {visibleEmployees.map((emp) => {
              const st = attEntryStatus(attendance[emp.id]?.[attDate]);
              const hasEntry = attendance[emp.id]?.[attDate] !== undefined;
              const isFuture = attDate > todayISO();
              return (
                <div key={emp.id} className="bg-[var(--bg-card)] border border-[var(--border)] rounded-xl p-3.5 shadow-sm">
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
                      style={st === 1 ? { backgroundColor: "var(--good)", color: "#0e1712" } : { backgroundColor: "var(--bg-app)", color: "var(--text-secondary)", border: "1px solid var(--border-input)" }}
                    >
                      <CheckCircle2 size={13} /> {t("fullDay")}
                    </button>
                    <button
                      type="button"
                      disabled={isFuture}
                      onClick={() => markAttendance(emp.id, 0.5)}
                      className="flex items-center justify-center gap-1 py-2 rounded-lg text-[11px] font-medium transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
                      style={st === 0.5 ? { backgroundColor: "var(--warn)", color: "#1a1608" } : { backgroundColor: "var(--bg-app)", color: "var(--text-secondary)", border: "1px solid var(--border-input)" }}
                    >
                      <Calendar size={13} /> {t("halfDay")}
                    </button>
                    <button
                      type="button"
                      disabled={isFuture}
                      onClick={() => markAttendance(emp.id, 0)}
                      className="flex items-center justify-center gap-1 py-2 rounded-lg text-[11px] font-medium transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
                      style={st === 0 && hasEntry ? { backgroundColor: "var(--bad)", color: "#1c0e0c" } : { backgroundColor: "var(--bg-app)", color: "var(--text-secondary)", border: "1px solid var(--border-input)" }}
                    >
                      <XCircle size={13} /> {t("absent")}
                    </button>
                  </div>
                </div>
              );
                        })}
          </div>
              </>
            );
          })()}
        </div>
      )}

      {adminTab === "advances" && (
        <div className="space-y-5">
          <div className="bg-[var(--bg-card)] border border-[var(--border)] rounded-xl p-5 shadow-sm">
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
              <MoneyField label={t("amount")} value={advForm.amount} onChange={(v) => setAdvForm({ ...advForm, amount: v })} suffix="so'm" />
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
            <div className="bg-[var(--bg-card)] border border-[var(--border)] rounded-xl p-5 shadow-sm">
              <div className="text-[var(--text-primary)] text-sm font-semibold mb-3">{t("advanceHistory")}</div>
              {(advances[advEmp] || []).length === 0 && <p className="text-[var(--text-muted)] text-xs">{t("noAdvances")}</p>}
              <div className="space-y-2">
                {(advances[advEmp] || []).slice().reverse().map((a) => (
                  <div key={a.id} className="flex items-center justify-between text-sm py-1.5">
                    <div>
                      <span className="text-[var(--text-primary)] font-mono tabular-nums">{fmt(a.amount)}</span>
                      <span
                        className="text-[9px] uppercase tracking-wide ml-2 px-1.5 py-0.5 rounded"
                        style={a.type === "salary" ? { backgroundColor: "var(--good-soft)", color: "var(--good)" } : { backgroundColor: "var(--warn-soft)", color: "var(--warn)" }}
                      >
                        {a.type === "salary" ? t("typeSalary") : t("typeAvans")}
                      </span>
                      <span className="text-[var(--text-muted)] text-xs ml-2">{a.date}{a.note ? ` · ${a.note}` : ""}</span>
                    </div>
                    <button onClick={() => deleteAdvance(advEmp, a.id)} className="text-[var(--text-muted)] hover:text-[var(--bad)]">
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
        <div className="space-y-4">
          {(() => {
            const totalOwed = myEmployees.reduce((sum, emp) => {
              const r = summaryFor(emp.id).remaining;
              return sum + (r > 0 ? r : 0);
            }, 0);
            return (
              <div className="bg-[var(--bg-card)] border border-[var(--border)] rounded-xl p-6 shadow-sm text-center">
                <div className="text-[var(--text-muted)] text-xs mb-1.5">Jami to'lash kerak</div>
                <div className={`text-3xl font-bold font-mono tabular-nums ${totalOwed > 0 ? "text-[var(--bad)]" : "text-[var(--good)]"}`}>
                  {fmt(totalOwed)}
                </div>
              </div>
            );
          })()}
        <div className="bg-[var(--bg-card)] border border-[var(--border)] rounded-xl overflow-hidden shadow-sm">
          <div className="p-5 pb-3 flex items-center justify-between gap-2">
            <div className="text-[var(--text-primary)] text-sm font-semibold flex items-center gap-1.5">
              <ClipboardList size={15} /> {t("reportHeader")}
            </div>
            {myEmployees.length > 0 && (
              <button
                type="button"
                onClick={exportReportToExcel}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-[#12161c] text-xs font-semibold hover:opacity-90 transition-opacity shrink-0"
                style={{ backgroundColor: accent }}
              >
                <Download size={13} /> Excel
              </button>
            )}
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="text-[var(--text-muted)] text-xs border-t border-[var(--border)]">
                  <th className="text-left font-medium py-2.5 px-5">{t("colEmployee")}</th>
                  <th className="text-right font-medium py-2.5 px-3">{t("colDays")}</th>
                  <th className="text-right font-medium py-2.5 px-3">{t("colCalculated")}</th>
                  <th className="text-right font-medium py-2.5 px-3">{t("colAdvance")}</th>
                  <th className="text-right font-medium py-2.5 px-3">{t("colRemaining")}</th>
                  <th className="text-right font-medium py-2.5 px-5">Qarz</th>
                </tr>
              </thead>
              <tbody>
                {myEmployees.map((emp) => {
                  const s = summaryFor(emp.id);
                  return (
                    <tr key={emp.id} className="border-t border-[var(--border-soft)]">
                      <td className="py-2.5 px-5 text-[var(--text-primary)]">{emp.name}</td>
                      <td className="py-2.5 px-3 text-right text-[var(--text-secondary)] font-mono tabular-nums">{fmtDays(s.workedDays)}</td>
                      <td className="py-2.5 px-3 text-right text-[var(--text-secondary)] font-mono tabular-nums">{fmt(s.totalWage)}</td>
                                            <td className="py-2.5 px-3 text-right text-[var(--bad)] font-mono tabular-nums">-{fmt(s.totalAdvance)}</td>
                      <td className="py-2.5 px-3 text-right font-semibold font-mono tabular-nums">
                        {s.remaining === 0 ? (
                          <Check size={14} className="inline text-[var(--warn)]" />
                        ) : s.remaining < 0 ? (
                          <span className="text-[var(--text-faint)]">—</span>
                        ) : (
                          <span className="text-[var(--good)]">{fmt(s.remaining)}</span>
                        )}
                      </td>
                      <td className="py-2.5 px-5 text-right font-semibold font-mono tabular-nums">
                        {s.remaining < 0 ? (
                          <span className="text-[var(--bad)]">{fmt(Math.abs(s.remaining))}</span>
                        ) : (
                          <span className="text-[var(--text-faint)]">—</span>
                        )}
                      </td>
                    </tr>
                  );
                })}
                  {myEmployees.length === 0 && (
                  <tr><td colSpan={6} className="py-8 text-center text-[var(--text-muted)]">{t("noData")}</td></tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
        </div>
      )}
      </div>
      </Shell>
    </>
  );
}

function EmployeeApp({
  currentUser, usersData, summaryFor, onLogout,
  changeOwnCredentials, updateAvatar, deleteOwnAccount, accent, setAccent, mode, setMode, fontScale, setFontScale, lang, setLang,
}) {
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [empTab, setEmpTab] = useState("umumiy");
  const { t } = useApp();
  const s = summaryFor(currentUser.id);
  const attDays = Object.entries(s.att)
    .map(([date, raw]) => [date, attEntryStatus(raw), attEntryWage(raw, s.emp, date)])
    .sort((a, b) => (a[0] < b[0] ? 1 : -1));
   const empTabs = [
    { id: "umumiy", label: "Umumiy", icon: <Users size={18} /> },
    { id: "davomat", label: "Davomat", icon: <Calendar size={18} /> },
    { id: "avanslar", label: "Avanslar", icon: <Wallet size={18} /> },
  ];
    const empBottomNav = (
    <nav className="fixed bottom-0 left-0 right-0 z-20 px-4" style={{ paddingBottom: "calc(env(safe-area-inset-bottom) + 16px)" }}>
      <div className="max-w-md mx-auto flex bg-[var(--bg-card)]/95 backdrop-blur-md border border-[var(--border)] rounded-full shadow-lg px-1.5 py-1">
        {empTabs.map((tab) => {
          const active = empTab === tab.id;
          return (
            <button
              key={tab.id}
              type="button"
              onClick={() => setEmpTab(tab.id)}
              className="flex-1 flex justify-center"
            >
              <span
                className="w-full flex flex-col items-center gap-0.5 px-4 py-2.5 rounded-full text-[10px] font-medium transition-colors"
                style={active ? { backgroundColor: accent + "26", color: accent } : { color: "var(--text-muted)" }}
              >
                {tab.icon}
                {tab.label}
              </span>
            </button>
          );
        })}
      </div>
    </nav>
  );

  return (
    <>
      <ProfileDrawer
        open={drawerOpen}
        onClose={() => setDrawerOpen(false)}
        me={{ name: s.emp.name, username: s.emp.username, password: s.emp.password, avatar: s.emp.avatar }}
        roleLabel={t("employeePanel")}
        isAdmin={false}
        onDeleteAccount={deleteOwnAccount}
        onLogout={onLogout}
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
        onTitleClick={() => setDrawerOpen(true)}
        bottomNav={empBottomNav}
      >
                 {empTab === "umumiy" && (
          <div className="tab-transition space-y-3">
            <div className="bg-[var(--bg-card)] border border-[var(--border)] rounded-xl p-6 shadow-sm text-center">
              <div className="flex items-center justify-center gap-1.5 text-[var(--text-muted)] text-xs mb-1.5">
                <Wallet size={13} /> {t("statRemainingSalary")}
              </div>
              <div className="text-3xl font-bold font-mono tabular-nums text-[var(--good)]">
                {fmt(s.remaining)}
              </div>
            </div>
            <div className="grid grid-cols-2 gap-2 sm:gap-3">
              <Stat label={t("statWorkedDays")} value={fmtDays(s.workedDays)} icon={<Calendar size={12} />} />
              <Stat label={t("statDailyWage")} value={fmt(s.emp.dailyWage)} icon={<Wallet size={12} />} />
            </div>
            <div className="grid grid-cols-2 gap-2 sm:gap-3">
              <Stat label={t("typeAvans")} value={fmt(s.totalAvans)} tone="bad" icon={<TrendingDown size={12} />} />
              <Stat label={t("typeSalary")} value={fmt(s.totalSalaryPaid)} tone="bad" icon={<Wallet size={12} />} />
            </div>
          </div>
        )}
        {empTab === "davomat" && (
          <div className="bg-[var(--bg-card)] border border-[var(--border)] rounded-xl p-5 shadow-sm tab-transition">
            <div className="text-[var(--text-primary)] text-sm font-semibold mb-3 flex items-center justify-between">
              <span>{t("myWorkedDays")}</span>
              <span className="text-[var(--text-muted)] text-xs font-normal">{s.emp.dailyWage ? fmt(s.emp.dailyWage) + t("perDay") : ""}</span>
            </div>
            {attDays.length === 0 && <p className="text-[var(--text-muted)] text-xs">{t("noAttendanceYet")}</p>}
            <div className="space-y-1.5">
              {attDays.map(([date, v, wage]) => (
                <div key={date} className="flex items-center justify-between text-sm py-1">
                  <span className="flex items-center gap-1.5 text-[var(--text-primary)]">
                    {v === 0 ? (
                      <XCircle size={13} className="text-[var(--bad)]" />
                    ) : (
                      <CheckCircle2 size={13} className={v === 1 ? "text-[var(--good)]" : "text-[var(--warn)]"} />
                    )}
                    {date} {v === 0.5 && <span className="text-[10px] text-[var(--warn)]">({t("halfDay")})</span>}
                    {v === 0 && <span className="text-[10px] text-[var(--bad)]">({t("absent")})</span>}
                  </span>
                  <span className={`font-mono tabular-nums ${v === 0 ? "text-[var(--bad)] text-xs" : "text-[var(--text-muted)] text-xs"}`}>{fmt(v * wage)}</span>
                </div>
              ))}
            </div>
          </div>
        )}

        {empTab === "avanslar" && (
          <div className="bg-[var(--bg-card)] border border-[var(--border)] rounded-xl p-5 shadow-sm tab-transition">
            <div className="text-[var(--text-primary)] text-sm font-semibold mb-3">{t("myAdvances")}</div>
            {s.advList.length === 0 && <p className="text-[var(--text-muted)] text-xs">{t("noAdvancesYet")}</p>}
            <div className="space-y-2">
              {s.advList.slice().reverse().map((a) => (
                <div key={a.id} className="flex items-center justify-between text-sm py-1">
                  <span className="text-[var(--text-primary)] flex items-center gap-2">
                    <span className="font-mono tabular-nums">{fmt(a.amount)}</span>
                    <span
                      className="text-[9px] uppercase tracking-wide px-1.5 py-0.5 rounded"
                      style={a.type === "salary" ? { backgroundColor: "var(--good-soft)", color: "var(--good)" } : { backgroundColor: "var(--warn-soft)", color: "var(--warn)" }}
                    >
                      {a.type === "salary" ? t("typeSalary") : t("typeAvans")}
                    </span>
                  </span>
                  <span className="text-[var(--text-muted)] text-xs">{a.date}{a.note ? ` · ${a.note}` : ""}</span>
                </div>
              ))}
            </div>
          </div>
        )}
      </Shell>
    </>
  );
}
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
  function setCurrentUser(user) {
    setCurrentUserState(user);
    try {
      if (user) localStorage.setItem("current-user", JSON.stringify(user));
      else localStorage.removeItem("current-user");
    } catch (e) {
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
  const [notifications, setNotifications] = useState([]);
  const [accent, setAccent] = useState(ACCENT_PRESETS[2].value);
 const [mode, setMode] = useState(() => {
    try {
      return localStorage.getItem("app-mode") || "dark";
    } catch (e) {
      return "dark";
    }
  });
  const [fontScale, setFontScale] = useState(100);
  const [lang, setLang] = useState("uz");

  useEffect(() => {
    init();
    const timer = setTimeout(() => setLoading(false), 4000);
    return () => clearTimeout(timer);
  }, []);

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
          }
        }
      )
      .subscribe();
    return () => {
      supabase.removeChannel(channel);
    };
  }, []);

  useEffect(() => {
    try {
      localStorage.setItem("app-mode", mode);
    } catch (e) {}
  }, [mode]);

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

  useEffect(() => {
    if (!currentUser || currentUser.role !== "admin") return;
    loadNotifications(currentUser.username);

    const channel = supabase
      .channel(`notif_${currentUser.username}`)
      .on(
        "postgres_changes",
        { event: "INSERT", schema: "public", table: "notifications", filter: `admin_username=eq.${currentUser.username}` },
        (payload) => {
          setNotifications((prev) => [payload.new, ...prev]);
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [currentUser]);

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
    let workedDays = 0;
    let totalWage = 0;
    for (const [date, raw] of Object.entries(att)) {
      const v = attEntryStatus(raw);
      workedDays += v;
      totalWage += v * attEntryWage(raw, emp, date);
    }
    const advList = advances[empId] || [];
    const totalAvans = advList.filter((a) => a.type !== "salary").reduce((sum, a) => sum + Number(a.amount), 0);
    const totalSalaryPaid = advList.filter((a) => a.type === "salary").reduce((sum, a) => sum + Number(a.amount), 0);
    const totalAdvance = totalAvans + totalSalaryPaid;
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
    const wage = Number(newEmp.dailyWage);
    const updated = {
      ...usersData,
      employees: [...usersData.employees, {
        id, name: newEmp.name, username: newEmp.username,
        password: newEmp.password, dailyWage: wage, avatar: null,
        owner: currentUser.username,
        wageHistory: [{ date: todayISO(), wage }],
      }],
    };
    await persistUsers(updated);
    setNewEmp({ name: "", username: "", password: "", dailyWage: "" });
    confetti({
      particleCount: 100,
      spread: 70,
      origin: { y: 0.6 },
    });
  }

  async function deleteEmployee(id) {
    const target = usersData.employees.find((x) => x.id === id);
    if (!target || (currentUser && currentUser.role === "admin" && target.owner !== currentUser.username)) return;
    await persistUsers({ ...usersData, employees: usersData.employees.filter((x) => x.id !== id) });
    const att2 = { ...attendance }; delete att2[id]; await persistAttendance(att2);
    const adv2 = { ...advances }; delete adv2[id]; await persistAdvances(adv2);
    if (advEmp === id) setAdvEmp("");
  }

  async function updateEmployeeWage(id, newWage) {
    const target = usersData.employees.find((x) => x.id === id);
    if (!target || (currentUser && currentUser.role === "admin" && target.owner !== currentUser.username)) return;
    const today = todayISO();
    const history = Array.isArray(target.wageHistory) && target.wageHistory.length > 0
      ? target.wageHistory
      : [{ date: "2000-01-01", wage: target.dailyWage }];
    const withoutToday = history.filter((h) => h.date !== today);
    const newHistory = [...withoutToday, { date: today, wage: newWage }].sort((a, b) => (a.date < b.date ? -1 : 1));
    const employees = usersData.employees.map((e) => (e.id === id ? { ...e, dailyWage: newWage, wageHistory: newHistory } : e));
    await persistUsers({ ...usersData, employees });
  }

  async function markAttendance(empId, status) {
    if (attDate > todayISO()) return;
    const dayMap = { ...(attendance[empId] || {}) };
    const currentStatus = attEntryStatus(dayMap[attDate]);
    if (dayMap[attDate] !== undefined && currentStatus === status) {
      delete dayMap[attDate];
    } else {
      const emp = usersData.employees.find((e) => e.id === empId);
      dayMap[attDate] = { v: status, wage: Number(emp ? emp.dailyWage : 0) };
    }
    await persistAttendance({ ...attendance, [empId]: dayMap });
  }

  async function bulkMarkAttendance(empList, status) {
    if (attDate > todayISO()) return;
    const updated = { ...attendance };
    empList.forEach(({ id, wage }) => {
      const dayMap = { ...(updated[id] || {}) };
      dayMap[attDate] = { v: status, wage: Number(wage || 0) };
      updated[id] = dayMap;
    });
    await persistAttendance(updated);
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

  async function deleteOwnAccount() {
    if (!currentUser) return;
    if (currentUser.role === "admin") {
      const admins = { ...usersData.admins };
      delete admins[currentUser.username];
      const ownedIds = usersData.employees.filter((e) => e.owner === currentUser.username).map((e) => e.id);
      const employees = usersData.employees.filter((e) => e.owner !== currentUser.username);
      await persistUsers({ ...usersData, admins, employees });
      const att2 = { ...attendance }; ownedIds.forEach((id) => delete att2[id]); await persistAttendance(att2);
      const adv2 = { ...advances }; ownedIds.forEach((id) => delete adv2[id]); await persistAdvances(adv2);
    } else {
      const employees = usersData.employees.filter((e) => e.id !== currentUser.id);
      await persistUsers({ ...usersData, employees });
      const att2 = { ...attendance }; delete att2[currentUser.id]; await persistAttendance(att2);
      const adv2 = { ...advances }; delete adv2[currentUser.id]; await persistAdvances(adv2);
    }
    logout();
  }

  async function loadNotifications(adminUsername) {
    if (!adminUsername) return;
    const { data } = await supabase
      .from("notifications")
      .select("*")
      .eq("admin_username", adminUsername)
      .order("created_at", { ascending: false })
      .limit(30);
    setNotifications(data || []);
  }

  async function markAllNotificationsRead(adminUsername) {
    if (!adminUsername) return;
    await supabase.from("notifications").update({ is_read: true }).eq("admin_username", adminUsername).eq("is_read", false);
    setNotifications((prev) => prev.map((n) => ({ ...n, is_read: true })));
  }

  async function enableNotifications() {
    if (!currentUser || currentUser.role !== "admin") return;
    if (!("serviceWorker" in navigator) || !("PushManager" in window)) {
      alert("Bu qurilma/brauzer bildirishnomani qo'llab-quvvatlamaydi");
      return;
    }
    try {
      const permission = await Notification.requestPermission();
      if (permission !== "granted") return;
      const reg = await navigator.serviceWorker.ready;
      let sub = await reg.pushManager.getSubscription();
      if (!sub) {
        sub = await reg.pushManager.subscribe({
          userVisibleOnly: true,
          applicationServerKey: urlBase64ToUint8Array(VAPID_PUBLIC_KEY),
        });
      }
      await supabase.from("push_subscriptions").insert({
        admin_username: currentUser.username,
        subscription: sub.toJSON(),
      });
      alert("Bildirishnoma yoqildi!");
    } catch (e) {
      console.error(e);
    }
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
    screen = (
      <div className="min-h-screen flex flex-col items-center justify-center gap-4 bg-[var(--bg-app)]">
        <img src="/logo.svg" alt={t("appName")} className="w-16 h-16 animate-pulse" />
        <div className="text-[var(--text-primary)] font-semibold text-base tracking-tight">{t("appName")}</div>
        <div className="text-[var(--text-muted)] text-xs">{t("loading")}</div>
      </div>
    );
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
        updateEmployeeWage={updateEmployeeWage}
        attendance={attendance}
        attDate={attDate}
        setAttDate={setAttDate}
        markAttendance={markAttendance}
        bulkMarkAttendance={bulkMarkAttendance}
        advances={advances}
        advEmp={advEmp}
        setAdvEmp={setAdvEmp}
        advForm={advForm}
        setAdvForm={setAdvForm}
        addAdvance={addAdvance}
        deleteAdvance={deleteAdvance}
        changeOwnCredentials={changeOwnCredentials}
        updateAvatar={updateAvatar}
        deleteOwnAccount={deleteOwnAccount}
        accent={accent} setAccent={setAccent}
        mode={mode} setMode={setMode}
        fontScale={fontScale} setFontScale={setFontScale}
        lang={lang} setLang={setLang}
        enableNotifications={enableNotifications}
        notifications={notifications}
        markAllNotificationsRead={markAllNotificationsRead}
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
        deleteOwnAccount={deleteOwnAccount}
        accent={accent} setAccent={setAccent}
        mode={mode} setMode={setMode}
        fontScale={fontScale} setFontScale={setFontScale}
        lang={lang} setLang={setLang}
      />
    );
  }

  return (
    <AppContext.Provider value={{ accent, lang, t }}>
      <div
        className="font-sans"
        style={{
          ...PALETTES[mode],
          "--accent": accent,
          "--good": mode === "dark" ? "#4fb587" : "#2f9463",
          "--good-soft": "rgba(79,181,135,0.15)",
          "--bad": mode === "dark" ? "#e2685f" : "#d1453b",
          "--bad-soft": mode === "dark" ? "rgba(226,104,95,0.14)" : "rgba(209,69,59,0.1)",
          "--warn": mode === "dark" ? "#d9a53c" : "#b8811f",
          "--warn-soft": "rgba(217,165,60,0.15)",
          fontFamily: "'Manrope', system-ui, -apple-system, sans-serif",
        }}
      >
        <style>{`
          @import url('https://fonts.googleapis.com/css2?family=Manrope:wght@400;500;600;700;800&family=JetBrains+Mono:wght@500;600;700&family=Manrope:ital@0;1&subset=cyrillic&display=swap');
          .font-mono { font-family: 'JetBrains Mono', ui-monospace, monospace; }
          @keyframes fadeSlideIn {
            from { opacity: 0; transform: translateY(10px); }
            to { opacity: 1; transform: translateY(0); }
          }
          .tab-transition { animation: fadeSlideIn 0.28s ease-out; }
        `}</style>
        {screen}
      </div>
    </AppContext.Provider>
  );
}
