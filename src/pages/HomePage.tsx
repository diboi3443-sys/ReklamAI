import * as React from "react";
import { useNavigate } from "react-router-dom";
import {
  Image,
  Video,
  Mic,
  Type,
  Play,
  Flame,
  ChevronLeft,
  ChevronRight,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { useTranslation } from "@/i18n";
import { OnboardingModal } from "@/components/onboarding/OnboardingModal";
import { useOnboarding } from "@/hooks/useOnboarding";

// ── Creation type cards ──────────────────────────────────────────────
const creationTypes = [
  {
    label: "Фото AI",
    sub: "Создать",
    mode: "image",
    icon: Image,
    iconColor: "#2563EB",
    gradient: "from-blue-600/15 to-orange-500/10",
    shadow: "shadow-[0_4px_30px_rgba(37,99,235,0.06)]",
  },
  {
    label: "Видео AI",
    sub: "Создать",
    mode: "video",
    icon: Video,
    iconColor: "#F97316",
    gradient: "from-orange-500/15 to-blue-600/10",
    shadow: "shadow-[0_4px_30px_rgba(249,115,22,0.09)]",
    borderAccent: true,
  },
  {
    label: "Голос AI",
    sub: "Создать",
    mode: "voice",
    icon: Mic,
    iconColor: "#10B981",
    gradient: "from-emerald-500/15 to-blue-600/10",
    shadow: "shadow-[0_4px_30px_rgba(16,185,129,0.06)]",
  },
  {
    label: "Текст AI",
    sub: "Создать",
    mode: "text",
    icon: Type,
    iconColor: "#2563EB",
    gradient: "from-blue-600/15 to-orange-500/10",
    shadow: "shadow-[0_4px_30px_rgba(37,99,235,0.06)]",
  },
];

// ── Filter pills ─────────────────────────────────────────────────────
const filterPills = [
  "Все инструменты",
  "Визуальные эффекты",
  "Камера",
  "Коммерция",
  "Мультимедиа",
];

// ── AI tool cards ────────────────────────────────────────────────────
const aiTools = [
  {
    title: "Управление движением",
    desc: "Анимируйте любое изображение с AI",
    img: "https://images.unsplash.com/photo-1550745165-9bc0b252726f?w=400&h=240&fit=crop",
  },
  {
    title: "Замена лица",
    desc: "Замена лиц на фото и видео",
    img: "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=400&h=240&fit=crop",
  },
  {
    title: "Апскейл",
    desc: "Увеличение разрешения до 4x",
    img: "https://images.unsplash.com/photo-1506744038136-46273834b3fb?w=400&h=240&fit=crop",
  },
  {
    title: "Липсинк студия",
    desc: "Синхронизация губ с аудио",
    img: "https://images.unsplash.com/photo-1478737270239-2f02b77fc618?w=400&h=240&fit=crop",
  },
  {
    title: "Перенос стиля",
    desc: "Применяйте художественные стили",
    img: "https://images.unsplash.com/photo-1579783902614-a3fb3927b6a5?w=400&h=240&fit=crop",
  },
  {
    title: "Удаление фона",
    desc: "Мгновенное удаление фона",
    img: "https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?w=400&h=240&fit=crop",
  },
];

// ── Trending gallery cards ───────────────────────────────────────────
const trendingItems = [
  {
    prompt: "Киберпанк-самурай на неоновых улицах Токио...",
    model: "Flux Pro",
    time: "5 мин назад",
    img: "https://images.unsplash.com/photo-1545569341-9eb8b30979d9?w=480&h=320&fit=crop",
  },
  {
    prompt: "Волшебный лес с биолюминесцентными грибами...",
    model: "SDXL",
    time: "12 мин назад",
    img: "https://images.unsplash.com/photo-1518710843675-2540dd79065c?w=480&h=320&fit=crop",
  },
  {
    prompt: "Рекламный ролик люксовой машины, кинематографичный...",
    model: "Runway",
    time: "23 мин назад",
    img: "https://images.unsplash.com/photo-1492144534655-ae79c964c9d7?w=480&h=320&fit=crop",
  },
  {
    prompt: "Минималистичная продуктовая фотография, парящий кроссовок...",
    model: "DALL-E",
    time: "1 ч назад",
    img: "https://images.unsplash.com/photo-1542291026-7eec264c27ff?w=480&h=320&fit=crop",
  },
  {
    prompt: "Абстрактное флюид-арт, яркие цвета сливаются...",
    model: "MidJourney",
    time: "2 ч назад",
    img: "https://images.unsplash.com/photo-1541701494587-cb58502866ab?w=480&h=320&fit=crop",
  },
];

// ── Recent activity items ────────────────────────────────────────────
const recentActivity = [
  {
    icon: Image,
    iconColor: "#2563EB",
    iconBg: "bg-blue-600/10",
    title: "Изображение создано — Киберпанк Город",
    time: "5 минут назад  ·  2 кредита",
  },
  {
    icon: Video,
    iconColor: "#F97316",
    iconBg: "bg-orange-500/10",
    title: "Видео отрендерено — Демо продукта",
    time: "23 минуты назад  ·  8 кредитов",
  },
  {
    icon: Mic,
    iconColor: "#10B981",
    iconBg: "bg-emerald-500/10",
    title: "Озвучка завершена — Интро подкаста",
    time: "1 час назад  ·  3 кредита",
  },
  {
    icon: Type,
    iconColor: "#3B82F6",
    iconBg: "bg-blue-500/10",
    title: "Рекламный текст создан — Летняя распродажа",
    time: "2 часа назад  ·  1 кредит",
  },
];

// ── News items ───────────────────────────────────────────────────────
const newsItems = [
  {
    badge: "Новое",
    title: "Модель Flux Pro теперь доступна",
    desc: "Генерируйте фотореалистичные изображения с нашей новейшей моделью.",
  },
  {
    title: "На 50% больше кредитов в эти выходные",
    desc: "Перейдите на Pro и получите бонусные кредиты на ограниченное время.",
  },
  {
    title: "AI-инфлюенсер — бета-запуск",
    desc: "Создавайте виртуальных инфлюенсеров для ваших рекламных кампаний.",
  },
];

export default function HomePage() {
  const navigate = useNavigate();
  const { t } = useTranslation();
  const { showOnboarding, setShowOnboarding, completeOnboarding } =
    useOnboarding();
  const [activePill, setActivePill] = React.useState(0);

  return (
    <div className="flex-1 flex flex-col overflow-hidden bg-background">
      <div className="flex-1 overflow-y-auto">
        {/* ── Mesh gradient background (light mode only) ── */}
        <div className="relative">
          <div
            className="pointer-events-none absolute inset-0 -z-0 dark:hidden"
            aria-hidden
          >
            <div className="absolute left-1/4 top-0 h-[300px] w-[600px] -translate-x-1/2 rounded-full bg-blue-600/10 blur-[120px]" />
            <div className="absolute right-1/4 top-12 h-[250px] w-[500px] -translate-x-1/2 rounded-full bg-orange-400/10 blur-[120px]" />
            <div className="absolute left-1/2 top-32 h-[200px] w-[400px] -translate-x-1/2 rounded-full bg-white/60 blur-[80px]" />
          </div>

          {/* ── Hero Section ── */}
          <section className="relative z-10 flex flex-col items-center gap-10 px-6 pt-14 pb-10 md:px-12 lg:px-20">
            <div className="flex flex-col items-center gap-4 text-center">
              <h1 className="hero-gradient-text text-4xl sm:text-5xl font-bold tracking-[-0.04em] leading-tight">
                Что вы создадите сегодня?
              </h1>
              <p className="text-slate-500 dark:text-slate-400 text-lg">
                AI-генерация контента: изображения, видео, голос и текст
              </p>
            </div>

            {/* Creation type cards */}
            <div className="flex flex-wrap justify-center gap-4">
              {creationTypes.map((c) => {
                const Icon = c.icon;
                return (
                  <button
                    key={c.mode}
                    onClick={() => navigate(`/studio?mode=${c.mode}`)}
                    className={cn(
                      "flex flex-col items-center justify-center gap-3 w-40 h-[140px] rounded-2xl bg-white dark:bg-card border",
                      c.borderAccent
                        ? "border-blue-600/25 dark:border-blue-500/30"
                        : "border-border",
                      c.shadow,
                      "transition-all duration-200 hover:scale-[1.03] hover:shadow-lg",
                      "p-6"
                    )}
                  >
                    <div
                      className={cn(
                        "w-12 h-12 rounded-xl flex items-center justify-center bg-gradient-to-br",
                        c.gradient
                      )}
                    >
                      <Icon
                        className="w-5 h-5"
                        style={{ color: c.iconColor }}
                      />
                    </div>
                    <span className="text-sm font-semibold text-foreground">
                      {c.label}
                    </span>
                    <span className="text-xs text-slate-400">{c.sub}</span>
                  </button>
                );
              })}
            </div>
          </section>
        </div>

        {/* ── AI Tools Section ── */}
        <section className="px-6 md:px-12 lg:px-12 pb-10">
          {/* Header */}
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-2xl font-bold tracking-[-0.02em] text-foreground">
              AI-инструменты
            </h2>
            <button className="text-sm font-medium text-primary hover:underline">
              Все
            </button>
          </div>

          {/* Filter pills */}
          <div className="flex flex-wrap gap-2 mb-6">
            {filterPills.map((pill, i) => (
              <button
                key={pill}
                onClick={() => setActivePill(i)}
                className={cn(
                  "rounded-full px-4 py-2 text-[13px] transition-colors",
                  i === activePill
                    ? "bg-gradient-to-b from-blue-600 to-blue-700 text-white font-semibold"
                    : "border border-slate-300 dark:border-slate-600 text-slate-600 dark:text-slate-300 hover:bg-muted"
                )}
              >
                {pill}
              </button>
            ))}
          </div>

          {/* Tool cards grid */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {aiTools.map((tool) => (
              <div
                key={tool.title}
                className="group rounded-xl border border-border bg-white dark:bg-card overflow-hidden cursor-pointer hover:shadow-md transition-shadow"
              >
                <div className="relative h-[120px] overflow-hidden bg-gradient-to-br from-slate-50 to-blue-600/5">
                  <img
                    src={tool.img}
                    alt={tool.title}
                    className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-105"
                  />
                </div>
                <div className="p-3.5 space-y-1">
                  <h3 className="text-sm font-semibold text-foreground">
                    {tool.title}
                  </h3>
                  <p className="text-xs text-slate-500 dark:text-slate-400">
                    {tool.desc}
                  </p>
                </div>
              </div>
            ))}
          </div>
        </section>

        {/* ── Trending Gallery ── */}
        <section className="px-6 md:px-12 lg:px-12 pb-10">
          {/* Header */}
          <div className="flex items-center justify-between mb-6">
            <div className="flex items-center gap-2.5">
              <Flame className="w-5 h-5 text-red-500" />
              <h2 className="text-2xl font-bold tracking-[-0.02em] text-foreground">
                Популярные работы
              </h2>
            </div>
            <div className="flex gap-2">
              <button className="w-9 h-9 rounded-lg border border-slate-300 dark:border-slate-600 flex items-center justify-center text-slate-500 hover:bg-muted transition-colors">
                <ChevronLeft className="w-4 h-4" />
              </button>
              <button className="w-9 h-9 rounded-lg bg-gradient-to-b from-violet-500 to-blue-500 flex items-center justify-center text-white">
                <ChevronRight className="w-4 h-4" />
              </button>
            </div>
          </div>

          {/* Generation cards */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4">
            {trendingItems.map((item, i) => (
              <div
                key={i}
                className="group rounded-xl border border-border bg-white dark:bg-card overflow-hidden cursor-pointer hover:shadow-md transition-shadow"
              >
                <div className="relative h-[160px] overflow-hidden">
                  <img
                    src={item.img}
                    alt={item.prompt}
                    className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-105"
                  />
                  {/* Play button overlay */}
                  <div className="absolute inset-0 flex items-center justify-center">
                    <div className="w-10 h-10 rounded-full bg-white/50 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                      <Play className="w-4 h-4 text-white" />
                    </div>
                  </div>
                </div>
                <div className="p-3.5 space-y-2">
                  <p className="text-[13px] text-slate-500 dark:text-slate-400 line-clamp-2">
                    {item.prompt}
                  </p>
                  <div className="flex items-center justify-between">
                    <span className="text-xs bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 px-2 py-0.5 rounded-md">
                      {item.model}
                    </span>
                    <span className="text-[11px] text-slate-400">
                      {item.time}
                    </span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </section>

        {/* ── Bottom Section ── */}
        <section className="px-6 md:px-12 lg:px-12 pb-12">
          <div className="flex flex-col lg:flex-row gap-6">
            {/* Recent Activity */}
            <div className="flex-1 rounded-xl border border-border bg-white dark:bg-card p-6 shadow-[0_2px_16px_rgba(15,23,42,0.03)]">
              <div className="flex items-center justify-between mb-5">
                <h3 className="text-base font-semibold text-foreground">
                  Недавняя активность
                </h3>
                <button className="text-[13px] font-medium text-primary hover:underline">
                  Все
                </button>
              </div>
              <div className="space-y-3">
                {recentActivity.map((item, i) => {
                  const Icon = item.icon;
                  return (
                    <div
                      key={i}
                      className="flex items-center gap-3 rounded-[10px] bg-white dark:bg-card p-3 hover:bg-slate-50 dark:hover:bg-slate-800/50 transition-colors"
                    >
                      <div
                        className={cn(
                          "w-9 h-9 rounded-lg flex items-center justify-center shrink-0",
                          item.iconBg
                        )}
                      >
                        <Icon
                          className="w-4 h-4"
                          style={{ color: item.iconColor }}
                        />
                      </div>
                      <div className="min-w-0 flex-1">
                        <p className="text-[13px] font-medium text-foreground truncate">
                          {item.title}
                        </p>
                        <p className="text-[11px] text-slate-400">
                          {item.time}
                        </p>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* News & Updates */}
            <div className="w-full lg:w-[380px] shrink-0 rounded-xl border border-border bg-white dark:bg-card p-6 shadow-[0_2px_16px_rgba(15,23,42,0.03)]">
              <h3 className="text-base font-semibold text-foreground mb-5">
                Новости и обновления
              </h3>
              <div className="space-y-4">
                {newsItems.map((item, i) => (
                  <div
                    key={i}
                    className="rounded-[10px] bg-white dark:bg-card p-3 space-y-1.5 hover:bg-slate-50 dark:hover:bg-slate-800/50 transition-colors"
                  >
                    {item.badge && (
                      <span className="inline-block text-[11px] font-semibold text-white bg-gradient-to-r from-blue-600 to-blue-700 rounded-full px-2.5 py-0.5 mb-1">
                        {item.badge}
                      </span>
                    )}
                    <p className="text-[13px] font-semibold text-foreground">
                      {item.title}
                    </p>
                    <p className="text-xs text-slate-500 dark:text-slate-400">
                      {item.desc}
                    </p>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </section>
      </div>

      {/* Onboarding Modal */}
      <OnboardingModal
        open={showOnboarding}
        onOpenChange={setShowOnboarding}
        onComplete={completeOnboarding}
      />
    </div>
  );
}
