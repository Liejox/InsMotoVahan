import React, { useEffect, useRef, useState } from 'react';
import { useNavigate, Navigate } from 'react-router-dom';
import { ShieldAlert, ArrowRight, CheckCircle, Zap, Bell, BarChart3, Shield, Users, ChevronDown } from 'lucide-react';
import { useAuthStore } from '../store/authStore';
import ScrollFloat from '../components/ui/ScrollFloat';
import ScrollReveal from '../components/ui/ScrollReveal';

/* ─── Scroll-reveal hook ─────────────────────────────────────── */
function useInView(threshold = 0.15) {
  const ref = useRef<HTMLDivElement>(null);
  const [inView, setInView] = useState(false);
  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const observer = new IntersectionObserver(
      ([entry]) => { if (entry.isIntersecting) { setInView(true); observer.disconnect(); } },
      { threshold }
    );
    observer.observe(el);
    return () => observer.disconnect();
  }, [threshold]);
  return { ref, inView };
}

/* ─── Animated counter ───────────────────────────────────────── */
function useCounter(target: number, duration = 2000, inView = false) {
  const [count, setCount] = useState(0);
  useEffect(() => {
    if (!inView) return;
    let start = 0;
    const step = target / (duration / 16);
    const timer = setInterval(() => {
      start = Math.min(start + step, target);
      setCount(Math.floor(start));
      if (start >= target) clearInterval(timer);
    }, 16);
    return () => clearInterval(timer);
  }, [inView, target, duration]);
  return count;
}

/* ─── Feature Card ───────────────────────────────────────────── */
interface FeatureCardProps {
  icon: React.ElementType;
  title: string;
  desc: string;
  accent: string;
  delay?: string;
  inView: boolean;
}
const FeatureCard: React.FC<FeatureCardProps> = ({ icon: Icon, title, desc, accent, delay = '0ms', inView }) => (
  <div
    style={{
      transitionDelay: delay,
      opacity: inView ? 1 : 0,
      transform: inView ? 'translateY(0)' : 'translateY(32px)',
      transition: 'opacity 0.7s ease, transform 0.7s ease',
    }}
    className="p-6 rounded-2xl border border-slate-800/60 bg-slate-900/60 backdrop-blur-sm hover:border-slate-700 hover:shadow-xl hover:shadow-black/20 transition-all duration-300 group"
  >
    <div className={`w-12 h-12 rounded-xl flex items-center justify-center mb-4 ${accent} group-hover:scale-110 transition-transform duration-300`}>
      <Icon size={24} />
    </div>
    <h3 className="text-lg font-bold text-white mb-2">{title}</h3>
    <p className="text-sm text-slate-400 leading-relaxed">{desc}</p>
  </div>
);

/* ─── Main Landing Component ─────────────────────────────────── */
export const Landing: React.FC = () => {
  const navigate = useNavigate();
  const { accessToken } = useAuthStore();

  // If already logged in, skip the landing page
  if (accessToken) {
    return <Navigate to="/dashboard" replace />;
  }

  return <LandingContent navigate={navigate} />;
};

/* Split out so hooks aren't called conditionally */
const LandingContent: React.FC<{ navigate: ReturnType<typeof useNavigate> }> = ({ navigate }) => {
  /* ── Parallax mouse effect for hero ── */
  const [mouse, setMouse] = useState({ x: 0, y: 0 });
  useEffect(() => {
    const move = (e: MouseEvent) => {
      setMouse({ x: (e.clientX / window.innerWidth - 0.5) * 20, y: (e.clientY / window.innerHeight - 0.5) * 20 });
    };
    window.addEventListener('mousemove', move);
    return () => window.removeEventListener('mousemove', move);
  }, []);

  /* ── Scroll state ── */
  const [scrolled, setScrolled] = useState(false);
  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 40);
    window.addEventListener('scroll', onScroll);
    return () => window.removeEventListener('scroll', onScroll);
  }, []);

  /* ── Section refs ── */
  const featuresSection = useInView();
  const statsSection = useInView(0.2);
  const ctaSection = useInView(0.2);

  /* ── Counters ── */
  const c1 = useCounter(500, 2000, statsSection.inView);
  const c2 = useCounter(99, 2000, statsSection.inView);
  const c3 = useCounter(10, 2000, statsSection.inView);
  const c4 = useCounter(2, 2000, statsSection.inView);

  const features = [
    {
      icon: Shield,
      title: 'Policy Lifecycle Tracking',
      desc: 'Track every policy from creation to renewal. Get smart expiry alerts for today, tomorrow, 7 days, 15 days, and 30 days ahead.',
      accent: 'bg-brand-950/60 text-brand-400',
    },
    {
      icon: Bell,
      title: 'WhatsApp Renewal Alerts',
      desc: 'One-click WhatsApp reminders with pre-filled, personalized messages for customers whose policies are about to expire.',
      accent: 'bg-emerald-950/60 text-emerald-400',
    },
    {
      icon: BarChart3,
      title: 'Reports & Analytics',
      desc: 'Company-wise distribution, vehicle statistics, monthly revenue, and commission reports — all in real-time.',
      accent: 'bg-purple-950/60 text-purple-400',
    },
    {
      icon: Users,
      title: 'Customer Database',
      desc: 'A complete CRM for all your clients — search by name, phone, vehicle number, or policy number in milliseconds.',
      accent: 'bg-cyan-950/60 text-cyan-400',
    },
    {
      icon: Zap,
      title: 'Instant Global Search',
      desc: 'Find any customer, vehicle, or policy record instantly with our live, debounced search from any page.',
      accent: 'bg-amber-950/60 text-amber-400',
    },
    {
      icon: CheckCircle,
      title: 'Document Management',
      desc: 'Upload, replace, and serve customer policy documents securely, with per-customer document history.',
      accent: 'bg-rose-950/60 text-rose-400',
    },
  ];

  const stats = [
    { value: c1, suffix: '+', label: 'Policies Managed' },
    { value: c2, suffix: '.9%', label: 'Uptime SLA' },
    { value: c3, suffix: 'x', label: 'Faster Renewals' },
    { value: c4, suffix: ' min', label: 'Avg Onboarding' },
  ];

  return (
    <div className="min-h-screen bg-slate-950 text-white overflow-x-hidden" style={{ fontFamily: 'Outfit, Inter, system-ui, sans-serif' }}>
      <style>{`
        @keyframes lp-gradient {
          0% { background-position: 0% 50%; }
          50% { background-position: 100% 50%; }
          100% { background-position: 0% 50%; }
        }
        @keyframes lp-float {
          0%, 100% { transform: translateY(0px) rotate(0deg); }
          33% { transform: translateY(-12px) rotate(1deg); }
          66% { transform: translateY(-6px) rotate(-1deg); }
        }
        @keyframes lp-spin-slow {
          from { transform: rotate(0deg); }
          to { transform: rotate(360deg); }
        }
        @keyframes lp-pulse-ring {
          0% { transform: scale(0.9); opacity: 0.7; }
          70% { transform: scale(1.15); opacity: 0; }
          100% { transform: scale(0.9); opacity: 0; }
        }
        @keyframes lp-fade-up {
          from { opacity: 0; transform: translateY(30px); }
          to { opacity: 1; transform: translateY(0); }
        }
        @keyframes lp-fade-in {
          from { opacity: 0; }
          to { opacity: 1; }
        }
        @keyframes lp-slide-right {
          from { opacity: 0; transform: translateX(-30px); }
          to { opacity: 1; transform: translateX(0); }
        }
        @keyframes lp-shimmer {
          0% { background-position: -200% center; }
          100% { background-position: 200% center; }
        }
        .lp-hero-bg {
          background: radial-gradient(ellipse 80% 60% at 50% -10%, #1e3a8a44 0%, transparent 60%),
                      radial-gradient(ellipse 50% 40% at 85% 60%, #312e8133 0%, transparent 50%),
                      radial-gradient(ellipse 40% 40% at 10% 70%, #0e7490 0%, transparent 40%),
                      #020617;
        }
        .lp-float { animation: lp-float 6s ease-in-out infinite; }
        .lp-spin-slow { animation: lp-spin-slow 20s linear infinite; }
        .lp-pulse-ring {
          position: absolute; inset: -8px; border-radius: 50%;
          border: 2px solid #6366f1;
          animation: lp-pulse-ring 2.5s ease-out infinite;
        }
        .lp-hero-h1 { animation: lp-fade-up 0.8s cubic-bezier(0.16, 1, 0.3, 1) 0.1s both; }
        .lp-hero-sub { animation: lp-fade-up 0.8s cubic-bezier(0.16, 1, 0.3, 1) 0.25s both; }
        .lp-hero-cta { animation: lp-fade-up 0.8s cubic-bezier(0.16, 1, 0.3, 1) 0.4s both; }
        .lp-hero-badges { animation: lp-fade-up 0.8s cubic-bezier(0.16, 1, 0.3, 1) 0.55s both; }
        .lp-hero-graphic { animation: lp-fade-in 1s ease 0.6s both; }
        .lp-shimmer-text {
          background: linear-gradient(90deg, #a5b4fc, #e879f9, #38bdf8, #a5b4fc);
          background-size: 200% auto;
          -webkit-background-clip: text;
          -webkit-text-fill-color: transparent;
          background-clip: text;
          animation: lp-shimmer 4s linear infinite;
        }
        .lp-glass-card {
          background: rgba(15, 23, 42, 0.7);
          backdrop-filter: blur(16px);
          border: 1px solid rgba(99, 102, 241, 0.15);
        }
        .lp-glow-btn {
          position: relative;
          overflow: hidden;
          background: linear-gradient(135deg, #4f46e5, #6366f1);
          box-shadow: 0 0 30px rgba(99, 102, 241, 0.35);
          transition: all 0.3s ease;
        }
        .lp-glow-btn::before {
          content: '';
          position: absolute;
          top: -2px; left: -2px; right: -2px; bottom: -2px;
          background: linear-gradient(135deg, #818cf8, #a78bfa, #6366f1);
          border-radius: inherit;
          z-index: -1;
          opacity: 0;
          transition: opacity 0.3s;
        }
        .lp-glow-btn:hover { transform: translateY(-2px); box-shadow: 0 0 45px rgba(99, 102, 241, 0.5); }
        .lp-glow-btn:hover::before { opacity: 1; }
        .lp-orbit {
          position: absolute;
          border-radius: 50%;
          border: 1px dashed rgba(99, 102, 241, 0.2);
          animation: lp-spin-slow 25s linear infinite;
        }
        .lp-orbit-rev {
          position: absolute;
          border-radius: 50%;
          border: 1px dashed rgba(56, 189, 248, 0.15);
          animation: lp-spin-slow 35s linear infinite reverse;
        }
        /* ScrollFloat hero title overrides */
        .lp-scroll-float-title {
          margin: 0 !important;
          overflow: visible !important;
        }
        .lp-scroll-float-text {
          font-size: clamp(2.5rem, 6vw, 4.5rem) !important;
          font-weight: 900 !important;
          line-height: 1.05 !important;
          color: #fff;
          letter-spacing: -0.02em;
        }
        /* ScrollReveal features section overrides */
        .lp-features-reveal {
          margin: 0 0 1rem !important;
        }
        .lp-features-reveal-text {
          font-size: clamp(2rem, 4vw, 3rem) !important;
          font-weight: 900 !important;
          line-height: 1.15 !important;
          color: #fff;
          letter-spacing: -0.01em;
        }
        /* ScrollReveal how-it-works step descriptions */
        .lp-step-reveal {
          margin: 0 !important;
        }
        .lp-step-reveal-text {
          font-size: 0.875rem !important;
          font-weight: 400 !important;
          line-height: 1.6 !important;
          color: #94a3b8;
        }
      `}</style>

      {/* ── Sticky Navbar ──────────────────────────────────────────── */}
      <nav
        className={`fixed top-0 left-0 right-0 z-50 flex items-center justify-between px-6 md:px-12 h-16 transition-all duration-300 ${
          scrolled ? 'bg-slate-950/90 backdrop-blur-xl border-b border-slate-800/60 shadow-lg shadow-black/20' : ''
        }`}
      >
        {/* Logo */}
        <div className="flex items-center gap-2.5">
          <div className="w-8 h-8 rounded-lg bg-brand-600 flex items-center justify-center shadow-lg shadow-brand-600/30">
            <ShieldAlert size={18} className="text-white" />
          </div>
          <span className="text-lg font-bold tracking-tight">
            My Ins <span className="text-brand-400">Monitor</span>
          </span>
        </div>

        {/* Nav CTA */}
        <div className="flex items-center gap-3">
          <button
            onClick={() => navigate('/login')}
            className="text-sm font-semibold text-slate-400 hover:text-white transition-colors hidden sm:block"
          >
            Sign In
          </button>
          <button
            onClick={() => navigate('/register')}
            className="lp-glow-btn flex items-center gap-2 px-4 py-2 text-sm font-bold text-white rounded-xl cursor-pointer"
          >
            Get Started
            <ArrowRight size={15} />
          </button>
        </div>
      </nav>

      {/* ── Hero Section ───────────────────────────────────────────── */}
      <section className="relative lp-hero-bg min-h-screen flex flex-col items-center justify-center px-6 text-center pt-20 pb-24 overflow-hidden">
        {/* Orbit decorations */}
        <div className="lp-orbit" style={{ width: 600, height: 600, top: '50%', left: '50%', marginTop: -300, marginLeft: -300 }} />
        <div className="lp-orbit-rev" style={{ width: 900, height: 900, top: '50%', left: '50%', marginTop: -450, marginLeft: -450 }} />

        {/* Floating orbs */}
        <div
          className="absolute pointer-events-none"
          style={{
            width: 500, height: 500,
            borderRadius: '50%',
            background: 'radial-gradient(circle, rgba(99,102,241,0.12) 0%, transparent 70%)',
            top: '20%', left: '50%', transform: `translate(-50%, 0) translate(${mouse.x * 0.5}px, ${mouse.y * 0.5}px)`,
            transition: 'transform 0.1s ease',
          }}
        />
        <div
          className="absolute pointer-events-none"
          style={{
            width: 300, height: 300,
            borderRadius: '50%',
            background: 'radial-gradient(circle, rgba(56,189,248,0.08) 0%, transparent 70%)',
            bottom: '20%', right: '15%', transform: `translate(${mouse.x * -0.3}px, ${mouse.y * -0.3}px)`,
            transition: 'transform 0.1s ease',
          }}
        />

        {/* Badge */}
        <div className="lp-hero-h1 inline-flex items-center gap-2 px-4 py-1.5 rounded-full border border-brand-500/30 bg-brand-950/40 text-brand-400 text-xs font-bold uppercase tracking-widest mb-8">
          <span className="w-1.5 h-1.5 rounded-full bg-brand-400 animate-pulse" />
          Insurance Agent CRM — Simplified
        </div>

        {/* Main headline — ScrollFloat animates each character in on scroll */}
        <div className="lp-hero-h1 max-w-4xl">
          <ScrollFloat
            animationDuration={1}
            ease="back.inOut(2)"
            scrollStart="top bottom"
            scrollEnd="bottom center"
            stagger={0.03}
            containerClassName="lp-scroll-float-title"
            textClassName="lp-scroll-float-text"
          >
            Manage Every Policy.
          </ScrollFloat>
          <div className="lp-hero-h1" style={{ marginTop: '-0.5rem' }}>
            <span className="lp-shimmer-text text-5xl md:text-6xl lg:text-7xl font-black tracking-tight">Miss Nothing.</span>
          </div>
        </div>

        {/* Sub-headline */}
        <p className="lp-hero-sub mt-6 text-lg md:text-xl text-slate-400 max-w-2xl leading-relaxed">
          A premium insurance agent CRM built for speed. Track renewals, send WhatsApp alerts, 
          analyze performance, and manage your entire customer portfolio — in one powerful platform.
        </p>

        {/* CTA Buttons */}
        <div className="lp-hero-cta flex flex-col sm:flex-row items-center gap-4 mt-10">
          <button
            onClick={() => navigate('/login')}
            className="lp-glow-btn flex items-center gap-2.5 px-8 py-4 text-base font-bold text-white rounded-2xl cursor-pointer"
          >
            Sign In to Your Portal
            <ArrowRight size={18} />
          </button>
          <button
            onClick={() => {
              document.getElementById('features-section')?.scrollIntoView({ behavior: 'smooth' });
            }}
            className="flex items-center gap-2.5 px-8 py-4 text-base font-bold text-slate-300 hover:text-white border border-slate-700 hover:border-slate-500 rounded-2xl cursor-pointer transition-all duration-300 hover:bg-slate-800/40"
          >
            See Features
            <ChevronDown size={18} />
          </button>
        </div>

        {/* Trust badges */}
        <div className="lp-hero-badges flex flex-wrap items-center justify-center gap-6 mt-12 text-xs text-slate-500">
          {['No credit card required', 'Deployed on Vercel', 'Neon PostgreSQL backed', 'Secure JWT Auth'].map((b) => (
            <div key={b} className="flex items-center gap-1.5">
              <CheckCircle size={13} className="text-emerald-500" />
              {b}
            </div>
          ))}
        </div>

        {/* Hero graphic — floating dashboard card */}
        <div className="lp-hero-graphic mt-20 w-full max-w-3xl mx-auto relative">
          <div className="lp-float">
            <div className="lp-glass-card rounded-3xl p-6 shadow-2xl shadow-black/50 text-left">
              {/* Mock navbar */}
              <div className="flex items-center justify-between mb-6 pb-4 border-b border-slate-800/60">
                <div className="flex items-center gap-2">
                  <div className="w-6 h-6 rounded bg-brand-600 flex items-center justify-center">
                    <ShieldAlert size={12} />
                  </div>
                  <span className="text-sm font-bold">My Ins Monitor</span>
                </div>
                <div className="flex gap-1.5">
                  <div className="w-3 h-3 rounded-full bg-red-500/60" />
                  <div className="w-3 h-3 rounded-full bg-amber-500/60" />
                  <div className="w-3 h-3 rounded-full bg-emerald-500/60" />
                </div>
              </div>

              {/* Mock stat cards */}
              <div className="grid grid-cols-3 gap-3 mb-4">
                {[
                  { label: 'Active Policies', value: '284', color: 'text-emerald-400', bg: 'bg-emerald-950/40' },
                  { label: "Today's Renewals", value: '12', color: 'text-rose-400', bg: 'bg-rose-950/40' },
                  { label: 'Total Customers', value: '156', color: 'text-blue-400', bg: 'bg-blue-950/40' },
                ].map((s) => (
                  <div key={s.label} className={`${s.bg} rounded-xl p-3 border border-slate-800/40`}>
                    <p className="text-[10px] text-slate-500 mb-1">{s.label}</p>
                    <p className={`text-xl font-black ${s.color}`}>{s.value}</p>
                  </div>
                ))}
              </div>

              {/* Mock renewal rows */}
              <div className="space-y-2">
                {[
                  { name: 'Rajesh Kumar', vehicle: 'TN01AB1234', days: 'Today', urgent: true },
                  { name: 'Priya Nair', vehicle: 'KL07CD5678', days: '2 Days', urgent: false },
                  { name: 'Anand Sharma', vehicle: 'MH12EF9012', days: '5 Days', urgent: false },
                ].map((r) => (
                  <div key={r.name} className="flex items-center justify-between px-3 py-2 rounded-lg bg-slate-900/50 border border-slate-800/40">
                    <div>
                      <p className="text-xs font-semibold text-slate-200">{r.name}</p>
                      <p className="text-[10px] text-slate-500">{r.vehicle}</p>
                    </div>
                    <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${
                      r.urgent ? 'bg-red-950/60 text-red-400' : 'bg-amber-950/60 text-amber-400'
                    }`}>
                      {r.days}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Glow underneath */}
          <div
            className="absolute -bottom-8 left-1/2 -translate-x-1/2 w-3/4 h-24 pointer-events-none"
            style={{ background: 'radial-gradient(ellipse, rgba(99,102,241,0.2) 0%, transparent 70%)', filter: 'blur(8px)' }}
          />
        </div>

        {/* Scroll indicator */}
        <div className="absolute bottom-8 left-1/2 -translate-x-1/2 flex flex-col items-center gap-2 animate-bounce opacity-50">
          <ChevronDown size={20} className="text-slate-500" />
        </div>
      </section>

      {/* ── Features Section ────────────────────────────────────────── */}
      <section id="features-section" className="py-28 px-6 md:px-12 bg-slate-950 relative">
        {/* Background accent */}
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_60%_40%_at_50%_0%,rgba(99,102,241,0.06),transparent)] pointer-events-none" />

        <div className="max-w-6xl mx-auto">
          {/* Section header */}
          <div
            ref={featuresSection.ref}
            style={{
              opacity: featuresSection.inView ? 1 : 0,
              transform: featuresSection.inView ? 'translateY(0)' : 'translateY(24px)',
              transition: 'opacity 0.7s ease, transform 0.7s ease',
            }}
            className="text-center mb-16"
          >
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-brand-950/60 border border-brand-800/40 text-brand-400 text-xs font-bold uppercase tracking-widest mb-4">
              <Zap size={11} />
              Everything You Need
            </div>
            <ScrollReveal
              baseOpacity={0}
              enableBlur={true}
              baseRotation={3}
              blurStrength={6}
              containerClassName="lp-features-reveal"
              textClassName="lp-features-reveal-text"
            >
              Built for the modern insurance agent
            </ScrollReveal>
            <p className="mt-4 text-slate-400 max-w-xl mx-auto text-base">
              Every feature designed around your daily workflow — from first policy booking to renewal follow-ups.
            </p>
          </div>

          {/* Feature grid */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
            {features.map((f, i) => (
              <FeatureCard
                key={f.title}
                {...f}
                delay={`${i * 80}ms`}
                inView={featuresSection.inView}
              />
            ))}
          </div>
        </div>
      </section>

      {/* ── Stats Section ─────────────────────────────────────────── */}
      <section className="py-24 px-6 md:px-12 relative overflow-hidden">
        {/* Gradient background */}
        <div
          className="absolute inset-0 pointer-events-none"
          style={{
            background: 'linear-gradient(-45deg, #0f172a, #1e1b4b, #0c1445, #0f172a)',
            backgroundSize: '400% 400%',
            animation: 'lp-gradient 12s ease infinite',
          }}
        />

        <div ref={statsSection.ref} className="max-w-5xl mx-auto relative z-10">
          <div
            style={{
              opacity: statsSection.inView ? 1 : 0,
              transform: statsSection.inView ? 'translateY(0)' : 'translateY(24px)',
              transition: 'opacity 0.7s ease, transform 0.7s ease',
            }}
            className="text-center mb-14"
          >
            <h2 className="text-3xl md:text-4xl font-black">
              Trusted by agents who{' '}
              <span className="lp-shimmer-text">never miss a renewal</span>
            </h2>
          </div>

          <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
            {stats.map((s, i) => (
              <div
                key={s.label}
                style={{
                  transitionDelay: `${i * 100}ms`,
                  opacity: statsSection.inView ? 1 : 0,
                  transform: statsSection.inView ? 'scale(1)' : 'scale(0.85)',
                  transition: 'opacity 0.6s ease, transform 0.6s ease',
                }}
                className="lp-glass-card rounded-2xl p-6 text-center"
              >
                <div className="text-4xl md:text-5xl font-black lp-shimmer-text mb-1">
                  {s.value}{s.suffix}
                </div>
                <div className="text-sm text-slate-400 font-medium">{s.label}</div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── How It Works Section ─────────────────────────────────── */}
      <section className="py-28 px-6 md:px-12 bg-slate-950">
        <div className="max-w-4xl mx-auto">
          <div className="text-center mb-16">
            <h2 className="text-3xl md:text-4xl font-black">
              Up and running in <span className="lp-shimmer-text">minutes</span>
            </h2>
            <p className="mt-3 text-slate-400">Three simple steps to transform how you manage policies.</p>
          </div>

          <div className="relative">
            {/* Connector line */}
            <div className="hidden md:block absolute top-8 left-[16.7%] right-[16.7%] h-px bg-gradient-to-r from-transparent via-brand-600/40 to-transparent" />

            <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
              {[
                { num: '01', title: 'Create Your Account', desc: 'Register as an agent in under 60 seconds. No credit card, no complex setup.' },
                { num: '02', title: 'Add Customers & Policies', desc: 'Import your customer portfolio. Add vehicles, policies, and documents with ease.' },
                { num: '03', title: 'Never Miss a Renewal', desc: 'Get smart alerts and send WhatsApp reminders directly from your dashboard.' },
              ].map((step, i) => (
                <div key={step.num} className="flex flex-col items-center text-center group" style={{ animationDelay: `${i * 150}ms` }}>
                  <div className="relative mb-6">
                    <div className="lp-pulse-ring" />
                    <div className="w-16 h-16 rounded-full bg-gradient-to-br from-brand-600 to-indigo-700 flex items-center justify-center text-xl font-black text-white shadow-lg shadow-brand-600/30 group-hover:scale-110 transition-transform duration-300 relative z-10">
                      {step.num}
                    </div>
                  </div>
                  <h3 className="text-lg font-bold text-white mb-2">{step.title}</h3>
                  <ScrollReveal
                    baseOpacity={0.05}
                    enableBlur={true}
                    baseRotation={2}
                    blurStrength={4}
                    containerClassName="lp-step-reveal"
                    textClassName="lp-step-reveal-text"
                    wordAnimationEnd="bottom center"
                  >
                    {step.desc}
                  </ScrollReveal>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* ── CTA Section ───────────────────────────────────────────── */}
      <section className="py-28 px-6 md:px-12">
        <div
          ref={ctaSection.ref}
          style={{
            opacity: ctaSection.inView ? 1 : 0,
            transform: ctaSection.inView ? 'translateY(0)' : 'translateY(32px)',
            transition: 'opacity 0.8s ease, transform 0.8s ease',
          }}
          className="max-w-3xl mx-auto text-center"
        >
          <div className="lp-glass-card rounded-3xl p-12 md:p-16 relative overflow-hidden">
            {/* BG glow */}
            <div className="absolute inset-0 bg-[radial-gradient(ellipse_70%_60%_at_50%_100%,rgba(99,102,241,0.12),transparent)] pointer-events-none" />

            <div className="relative z-10">
              <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-brand-600 to-indigo-700 flex items-center justify-center mx-auto mb-6 shadow-xl shadow-brand-600/30">
                <ShieldAlert size={30} />
              </div>

              <h2 className="text-4xl md:text-5xl font-black mb-4">
                Ready to take control?
              </h2>
              <p className="text-slate-400 text-lg mb-10">
                Join the growing community of insurance agents who've modernized their workflow.
              </p>

              <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
                <button
                  onClick={() => navigate('/register')}
                  className="lp-glow-btn flex items-center gap-2.5 px-8 py-4 text-base font-bold text-white rounded-2xl cursor-pointer w-full sm:w-auto justify-center"
                >
                  Create Free Account
                  <ArrowRight size={18} />
                </button>
                <button
                  onClick={() => navigate('/login')}
                  className="flex items-center gap-2.5 px-8 py-4 text-base font-bold text-slate-300 hover:text-white border border-slate-700 hover:border-slate-500 rounded-2xl cursor-pointer transition-all w-full sm:w-auto justify-center"
                >
                  Sign In Instead
                </button>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ── Footer ─────────────────────────────────────────────────── */}
      <footer className="py-8 px-6 border-t border-slate-800/60 bg-slate-950">
        <div className="max-w-6xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-4 text-sm text-slate-600">
          <div className="flex items-center gap-2">
            <div className="w-6 h-6 rounded bg-brand-600 flex items-center justify-center">
              <ShieldAlert size={12} className="text-white" />
            </div>
            <span className="font-bold text-slate-400">My Ins Monitor</span>
          </div>
          <p>© {new Date().getFullYear()} My Ins Monitor. All rights reserved.</p>
          <div className="flex items-center gap-4">
            <button onClick={() => navigate('/login')} className="hover:text-slate-400 transition-colors">Sign In</button>
            <button onClick={() => navigate('/register')} className="hover:text-slate-400 transition-colors">Register</button>
          </div>
        </div>
      </footer>
    </div>
  );
};

export default Landing;
