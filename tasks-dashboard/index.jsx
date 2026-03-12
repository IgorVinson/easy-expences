import { useState, useEffect, useCallback } from 'react';

const PHASES = [
  {
    id: 'phase1',
    title: 'Phase 1: Setup + Coding + Security',
    weeks: 'Week 1\u20132',
    color: '#7C3AED',
    icon: '\u26a1',
    tasks: [
      { id: 't1', text: 'Register Google Play Developer ($25)', priority: 'must', effort: '1 day' },
      {
        id: 't2',
        text: 'Register Apple Developer ($99)',
        priority: 'must',
        effort: '1\u20132 days',
      },
      { id: 't3', text: 'Buy sayspend.app domain', priority: 'must', effort: '30 min' },
      {
        id: 't4',
        text: 'Rename app everywhere \u2192 SaySpend',
        priority: 'must',
        effort: '2\u20133 hrs',
      },
      {
        id: 't5',
        text: 'Move Gemini API to Firebase Cloud Functions',
        priority: 'must',
        effort: '6\u20138 hrs',
        tag: 'SECURITY',
      },
      {
        id: 't6',
        text: 'Add auth check in Cloud Function',
        priority: 'must',
        effort: '2\u20133 hrs',
        tag: 'SECURITY',
      },
      {
        id: 't7',
        text: 'Add 30-sec recording limit (client + server)',
        priority: 'must',
        effort: '1\u20132 hrs',
        tag: 'SECURITY',
      },
      {
        id: 't8',
        text: 'Add rate limiting: 5/min, 50/hr per user',
        priority: 'must',
        effort: '3\u20134 hrs',
        tag: 'SECURITY',
      },
      {
        id: 't9',
        text: 'Server-side free tier validation (15/mo)',
        priority: 'must',
        effort: '2\u20133 hrs',
        tag: 'SECURITY',
      },
      {
        id: 't10',
        text: 'Abuse detection: flag 200+ recordings/day',
        priority: 'should',
        effort: '2\u20133 hrs',
      },
      {
        id: 't11',
        text: 'Voice: handle edge cases (unclear speech, no amount)',
        priority: 'must',
        effort: '4\u20136 hrs',
      },
      {
        id: 't12',
        text: 'Increase free tier: 5 \u2192 15 recordings/month',
        priority: 'must',
        effort: '1\u20132 hrs',
      },
      {
        id: 't13',
        text: 'Add expense search and filters',
        priority: 'should',
        effort: '4\u20136 hrs',
      },
      {
        id: 't14',
        text: 'Add pull-to-refresh on expense list',
        priority: 'must',
        effort: '1\u20132 hrs',
      },
      {
        id: 't15',
        text: 'Add empty states (no data screens)',
        priority: 'must',
        effort: '2\u20133 hrs',
      },
      {
        id: 't16',
        text: 'Add currency selector in settings',
        priority: 'should',
        effort: '3\u20134 hrs',
      },
      {
        id: 't17',
        text: 'Add haptic feedback on record start/stop',
        priority: 'nice',
        effort: '1\u20132 hrs',
      },
      {
        id: 't18',
        text: 'Bug testing on real devices (3 Android + 2 iOS)',
        priority: 'must',
        effort: '4\u20138 hrs',
      },
    ],
  },
  {
    id: 'phase2',
    title: 'Phase 2: Monetization',
    weeks: 'Week 2\u20133',
    color: '#10B981',
    icon: '\ud83d\udcb0',
    tasks: [
      {
        id: 't19',
        text: 'Set up RevenueCat + SDK integration',
        priority: 'must',
        effort: '6\u20138 hrs',
      },
      {
        id: 't20',
        text: 'Configure monthly $6.99 in Google Play',
        priority: 'must',
        effort: '2\u20133 hrs',
      },
      {
        id: 't21',
        text: 'Configure annual $67.10 in Google Play',
        priority: 'must',
        effort: '1\u20132 hrs',
      },
      {
        id: 't22',
        text: 'Configure same plans in App Store Connect',
        priority: 'must',
        effort: '2\u20133 hrs',
      },
      {
        id: 't23',
        text: 'Rebuild paywall screen (SaySpend branding)',
        priority: 'must',
        effort: '4\u20136 hrs',
      },
      {
        id: 't24',
        text: 'Implement restore purchases flow',
        priority: 'must',
        effort: '2\u20133 hrs',
      },
      {
        id: 't25',
        text: 'Add 7-day free trial on annual plan',
        priority: 'should',
        effort: '2\u20133 hrs',
      },
      {
        id: 't26',
        text: 'Set up 100 promo codes for early users',
        priority: 'must',
        effort: '2\u20133 hrs',
      },
      {
        id: 't27',
        text: 'Build promo code redemption flow in app',
        priority: 'must',
        effort: '3\u20134 hrs',
      },
      {
        id: 't28',
        text: 'Test purchase flow in sandbox (both platforms)',
        priority: 'must',
        effort: '4\u20136 hrs',
      },
      { id: 't29', text: 'Enable Firebase Analytics', priority: 'must', effort: '1\u20132 hrs' },
      { id: 't30', text: 'Enable Firebase Crashlytics', priority: 'must', effort: '1\u20132 hrs' },
      {
        id: 't31',
        text: 'Add events: voice_record_start/complete/error',
        priority: 'must',
        effort: '2\u20133 hrs',
      },
      {
        id: 't32',
        text: 'Add events: paywall_shown/purchased',
        priority: 'must',
        effort: '1\u20132 hrs',
      },
      { id: 't33', text: 'Add event: onboarding_complete', priority: 'must', effort: '30 min' },
      {
        id: 't34',
        text: 'Create Google Sheet for cost tracking',
        priority: 'should',
        effort: '1 hr',
      },
      {
        id: 't35',
        text: 'Add per-user voice recording counter in Firebase',
        priority: 'should',
        effort: '2\u20133 hrs',
      },
    ],
  },
  {
    id: 'phase3',
    title: 'Phase 3: Localization + Design + Store Assets',
    weeks: 'Week 3\u20134',
    color: '#06B6D4',
    icon: '\ud83c\udf0d',
    tasks: [
      {
        id: 't36',
        text: 'Set up i18n framework (i18next / expo-localization)',
        priority: 'must',
        effort: '3\u20134 hrs',
      },
      {
        id: 't37',
        text: 'Extract all UI strings to translation files',
        priority: 'must',
        effort: '4\u20136 hrs',
      },
      {
        id: 't38',
        text: 'Translate all strings to Ukrainian',
        priority: 'must',
        effort: '3\u20134 hrs',
      },
      {
        id: 't39',
        text: 'Translate all strings to Spanish',
        priority: 'must',
        effort: '3\u20134 hrs',
      },
      {
        id: 't40',
        text: 'Test special characters rendering',
        priority: 'must',
        effort: '2\u20133 hrs',
      },
      {
        id: 't41',
        text: 'Translate store descriptions (UA + ES)',
        priority: 'must',
        effort: '2\u20133 hrs',
      },
      { id: 't42', text: 'Design SaySpend app icon', priority: 'must', effort: '4\u20136 hrs' },
      {
        id: 't43',
        text: 'Create 5 screenshots for Google Play',
        priority: 'must',
        effort: '4\u20136 hrs',
      },
      {
        id: 't44',
        text: 'Design feature graphic 1024x500 (Google Play)',
        priority: 'must',
        effort: '2\u20133 hrs',
      },
      {
        id: 't45',
        text: 'Create 5 screenshots for App Store',
        priority: 'must',
        effort: '4\u20136 hrs',
      },
      {
        id: 't46',
        text: 'Write Google Play description (EN)',
        priority: 'must',
        effort: '2\u20133 hrs',
      },
      {
        id: 't47',
        text: 'Write App Store description + keywords (EN)',
        priority: 'must',
        effort: '2\u20133 hrs',
      },
      {
        id: 't48',
        text: 'Create privacy policy on sayspend.app',
        priority: 'must',
        effort: '2\u20134 hrs',
      },
      {
        id: 't49',
        text: 'Add 3-slide onboarding (Voice \u2192 Budget \u2192 Insights)',
        priority: 'should',
        effort: '4\u20136 hrs',
      },
    ],
  },
  {
    id: 'phase4',
    title: 'Phase 4: Google Play Launch',
    weeks: 'Week 4\u20135',
    color: '#F59E0B',
    icon: '\ud83d\udcf1',
    tasks: [
      {
        id: 't50',
        text: 'Build production .aab with EAS Build',
        priority: 'must',
        effort: '2\u20133 hrs',
      },
      {
        id: 't51',
        text: 'Create Google Play store listing',
        priority: 'must',
        effort: '2\u20133 hrs',
      },
      {
        id: 't52',
        text: 'Upload screenshots + feature graphic',
        priority: 'must',
        effort: '1\u20132 hrs',
      },
      { id: 't53', text: 'Fill content rating questionnaire', priority: 'must', effort: '30 min' },
      { id: 't54', text: 'Fill data safety section', priority: 'must', effort: '1\u20132 hrs' },
      { id: 't55', text: 'Upload to internal testing track', priority: 'must', effort: '30 min' },
      { id: 't56', text: 'Recruit 20+ testers', priority: 'must', effort: 'ongoing' },
      {
        id: 't57',
        text: '14-day testing \u2014 collect feedback, fix bugs',
        priority: 'must',
        effort: '14 days',
      },
      { id: 't58', text: 'Promote to production', priority: 'must', effort: '30 min' },
      {
        id: 't59',
        text: 'Distribute promo codes to first users',
        priority: 'must',
        effort: '1 hr',
      },
      {
        id: 't60',
        text: 'Ask testers to leave reviews on day 1',
        priority: 'must',
        effort: '1 hr',
      },
    ],
  },
  {
    id: 'phase5',
    title: 'Phase 5: Apple App Store Launch',
    weeks: 'Week 6\u20137',
    color: '#3B82F6',
    icon: '\ud83c\udf4e',
    tasks: [
      {
        id: 't61',
        text: 'Build production .ipa with EAS Build',
        priority: 'must',
        effort: '2\u20134 hrs',
      },
      {
        id: 't62',
        text: 'Create App Store Connect listing',
        priority: 'must',
        effort: '2\u20133 hrs',
      },
      {
        id: 't63',
        text: 'Upload screenshots + metadata (EN, UA, ES)',
        priority: 'must',
        effort: '1\u20132 hrs',
      },
      {
        id: 't64',
        text: 'Set age rating, pricing, availability',
        priority: 'must',
        effort: '30 min',
      },
      {
        id: 't65',
        text: 'Prepare demo account for Apple reviewers',
        priority: 'must',
        effort: '30 min',
      },
      { id: 't66', text: 'Submit for Apple review', priority: 'must', effort: '30 min' },
      {
        id: 't67',
        text: 'Handle rejection feedback (expect 1\u20133 rounds)',
        priority: 'must',
        effort: 'varies',
      },
      { id: 't68', text: 'Distribute Apple promo codes', priority: 'must', effort: '1 hr' },
      {
        id: 't69',
        text: 'Ask early users to leave App Store reviews',
        priority: 'must',
        effort: '1 hr',
      },
    ],
  },
  {
    id: 'phase6',
    title: 'Phase 6: Marketing',
    weeks: 'Week 5+ ongoing',
    color: '#EF4444',
    icon: '\ud83d\udce3',
    tasks: [
      {
        id: 't70',
        text: 'Create landing page on sayspend.app',
        priority: 'should',
        effort: '4\u20136 hrs',
      },
      {
        id: 't71',
        text: 'Set up TikTok + Instagram @sayspend',
        priority: 'should',
        effort: '2\u20133 hrs',
      },
      {
        id: 't72',
        text: 'Record 3\u20135 short demo videos (voice feature)',
        priority: 'must',
        effort: '4\u20136 hrs',
      },
      {
        id: 't73',
        text: 'Post in Ukrainian diaspora Facebook groups',
        priority: 'must',
        effort: '1\u20132 hrs',
      },
      {
        id: 't74',
        text: 'Post on Reddit (r/personalfinance, r/budgeting)',
        priority: 'should',
        effort: '2\u20133 hrs',
      },
      {
        id: 't75',
        text: 'Ask 15\u201320 people to review on day 1',
        priority: 'must',
        effort: '1 hr',
      },
      {
        id: 't76',
        text: 'Ongoing: 2\u20133 TikToks per week',
        priority: 'should',
        effort: 'ongoing',
      },
      {
        id: 't77',
        text: 'Month 2+: Apple Search Ads ($5\u201310/day)',
        priority: 'nice',
        effort: 'ongoing',
      },
    ],
  },
];

const FINANCIAL_PLAN = [
  {
    month: 'Month 1',
    income: [{ item: 'SaySpend subscriptions (2\u20135 users)', amount: 25 }],
    expenses: [
      { item: 'Apple Developer', amount: 99 },
      { item: 'Google Play Developer', amount: 25 },
      { item: 'sayspend.app domain', amount: 20 },
      { item: 'Firebase (Blaze plan)', amount: 5 },
      { item: 'Gemini API', amount: 1 },
    ],
  },
  {
    month: 'Month 2',
    income: [{ item: 'SaySpend subscriptions (10\u201320 users)', amount: 100 }],
    expenses: [
      { item: 'Firebase (Blaze plan)', amount: 10 },
      { item: 'Gemini API', amount: 2 },
      { item: 'Apple Search Ads (test)', amount: 150 },
    ],
  },
  {
    month: 'Month 3',
    income: [{ item: 'SaySpend subscriptions (20\u201330 users)', amount: 180 }],
    expenses: [
      { item: 'Firebase (Blaze plan)', amount: 10 },
      { item: 'Gemini API', amount: 3 },
      { item: 'Apple Search Ads', amount: 200 },
    ],
  },
];

export default function SaySpendDashboard() {
  const [checked, setChecked] = useState({});
  const [collapsed, setCollapsed] = useState({});
  const [activeTab, setActiveTab] = useState('tasks');

  useEffect(() => {
    async function load() {
      try {
        const res = await fetch('/api/db');
        if (res.ok) {
          const parsed = await res.json();
          if (parsed.checked) setChecked(parsed.checked);
          if (parsed.collapsed) setCollapsed(parsed.collapsed);
        }
      } catch (err) {
        console.error('Failed to load DB:', err);
      }
    }
    load();
  }, []);

  const saveState = useCallback(async (c, col) => {
    try {
      await fetch('/api/db', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ checked: c, collapsed: col }),
      });
    } catch (err) {
      console.error('Failed to save DB:', err);
    }
  }, []);

  const toggle = (id) => {
    const next = { ...checked, [id]: !checked[id] };
    setChecked(next);
    saveState(next, collapsed);
  };

  const toggleCollapse = (id) => {
    const next = { ...collapsed, [id]: !collapsed[id] };
    setCollapsed(next);
    saveState(checked, next);
  };

  const mustTasks = PHASES.reduce(
    (s, p) => s + p.tasks.filter((t) => t.priority === 'must').length,
    0
  );
  const doneMust = PHASES.reduce(
    (s, p) => s + p.tasks.filter((t) => t.priority === 'must' && checked[t.id]).length,
    0
  );
  const pct = mustTasks > 0 ? Math.round((doneMust / mustTasks) * 100) : 0;
  const doneAll = PHASES.reduce((s, p) => s + p.tasks.filter((t) => checked[t.id]).length, 0);

  const priorityColor = (p) => {
    if (p === 'must') return '#10B981';
    if (p === 'should') return '#F59E0B';
    return '#9CA3AF';
  };

  return (
    <div
      style={{
        minHeight: '100vh',
        background: '#0f0f17',
        color: '#e2e2e8',
        fontFamily: "'DM Sans', 'Segoe UI', system-ui, sans-serif",
      }}>
      <link
        href="https://fonts.googleapis.com/css2?family=DM+Sans:ital,opsz,wght@0,9..40,300;0,9..40,500;0,9..40,700;1,9..40,400&family=DM+Mono:wght@400&display=swap"
        rel="stylesheet"
      />

      <div
        style={{
          background: 'linear-gradient(135deg, #7C3AED 0%, #4F46E5 50%, #2563EB 100%)',
          padding: '32px 24px 24px',
          position: 'relative',
          overflow: 'hidden',
        }}>
        <div
          style={{
            position: 'absolute',
            top: -40,
            right: -40,
            width: 160,
            height: 160,
            borderRadius: '50%',
            background: 'rgba(255,255,255,0.06)',
          }}
        />
        <div style={{ position: 'relative', maxWidth: 720, margin: '0 auto' }}>
          <div
            style={{
              fontSize: 14,
              letterSpacing: 2,
              opacity: 0.7,
              marginBottom: 4,
              fontWeight: 500,
            }}>
            LAUNCH DASHBOARD
          </div>
          <h1
            style={{
              fontSize: 32,
              fontWeight: 700,
              margin: '0 0 16px',
              color: '#fff',
              letterSpacing: -0.5,
            }}>
            SaySpend
          </h1>
          <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 8 }}>
            <div
              style={{
                flex: 1,
                height: 10,
                background: 'rgba(255,255,255,0.15)',
                borderRadius: 8,
                overflow: 'hidden',
              }}>
              <div
                style={{
                  width: `${pct}%`,
                  height: '100%',
                  background: pct === 100 ? '#10B981' : '#fff',
                  borderRadius: 8,
                  transition: 'width 0.5s cubic-bezier(0.4,0,0.2,1)',
                }}
              />
            </div>
            <span
              style={{
                fontSize: 18,
                fontWeight: 700,
                color: '#fff',
                minWidth: 50,
                textAlign: 'right',
              }}>
              {pct}%
            </span>
          </div>
          <div style={{ fontSize: 13, opacity: 0.75 }}>
            {doneMust} of {mustTasks} must-have tasks
            {doneAll > doneMust && (
              <span style={{ opacity: 0.6 }}> &middot; +{doneAll - doneMust} bonus</span>
            )}
          </div>
        </div>
      </div>

      <div style={{ maxWidth: 720, margin: '0 auto', padding: '0 16px' }}>
        <div
          style={{
            display: 'flex',
            marginTop: 20,
            marginBottom: 20,
            background: '#1a1a28',
            borderRadius: 12,
            padding: 4,
          }}>
          {[
            { key: 'tasks', label: '\ud83d\udccb Tasks' },
            { key: 'finance', label: '\ud83d\udcb5 Project Costs' },
          ].map((tab) => (
            <button
              key={tab.key}
              onClick={() => setActiveTab(tab.key)}
              style={{
                flex: 1,
                padding: '10px 16px',
                border: 'none',
                borderRadius: 10,
                fontSize: 14,
                fontWeight: 600,
                cursor: 'pointer',
                transition: 'all 0.2s',
                fontFamily: 'inherit',
                background: activeTab === tab.key ? '#7C3AED' : 'transparent',
                color: activeTab === tab.key ? '#fff' : '#888',
              }}>
              {tab.label}
            </button>
          ))}
        </div>

        {activeTab === 'tasks' && (
          <div style={{ paddingBottom: 40 }}>
            {PHASES.map((phase) => {
              const phaseMust = phase.tasks.filter((t) => t.priority === 'must').length;
              const phaseDoneMust = phase.tasks.filter(
                (t) => t.priority === 'must' && checked[t.id]
              ).length;
              const phasePct = phaseMust > 0 ? Math.round((phaseDoneMust / phaseMust) * 100) : 100;
              const isCollapsed = collapsed[phase.id];
              return (
                <div key={phase.id} style={{ marginBottom: 16 }}>
                  <button
                    onClick={() => toggleCollapse(phase.id)}
                    style={{
                      width: '100%',
                      display: 'flex',
                      alignItems: 'center',
                      gap: 12,
                      padding: '14px 16px',
                      background: `${phase.color}18`,
                      border: `1px solid ${phase.color}40`,
                      borderRadius: isCollapsed ? 12 : '12px 12px 0 0',
                      cursor: 'pointer',
                      color: '#e2e2e8',
                      fontFamily: 'inherit',
                      textAlign: 'left',
                    }}>
                    <span style={{ fontSize: 20 }}>{phase.icon}</span>
                    <div style={{ flex: 1 }}>
                      <div style={{ fontSize: 14, fontWeight: 700, color: phase.color }}>
                        {phase.title}
                      </div>
                      <div style={{ fontSize: 12, opacity: 0.6, marginTop: 2 }}>{phase.weeks}</div>
                    </div>
                    <div style={{ textAlign: 'right', minWidth: 70 }}>
                      <div
                        style={{
                          fontSize: 16,
                          fontWeight: 700,
                          color: phasePct === 100 ? '#10B981' : phase.color,
                        }}>
                        {phasePct === 100 ? '\u2713' : `${phaseDoneMust}/${phaseMust}`}
                      </div>
                      <div
                        style={{
                          width: 60,
                          height: 4,
                          background: `${phase.color}30`,
                          borderRadius: 4,
                          marginTop: 4,
                        }}>
                        <div
                          style={{
                            width: `${phasePct}%`,
                            height: '100%',
                            background: phasePct === 100 ? '#10B981' : phase.color,
                            borderRadius: 4,
                            transition: 'width 0.3s',
                          }}
                        />
                      </div>
                    </div>
                    <span
                      style={{
                        fontSize: 14,
                        opacity: 0.5,
                        transform: isCollapsed ? 'rotate(-90deg)' : 'rotate(0deg)',
                        transition: 'transform 0.2s',
                      }}>
                      \u25bc
                    </span>
                  </button>
                  {!isCollapsed && (
                    <div
                      style={{
                        border: `1px solid ${phase.color}25`,
                        borderTop: 'none',
                        borderRadius: '0 0 12px 12px',
                        overflow: 'hidden',
                      }}>
                      {phase.tasks.map((task, i) => {
                        const isOptional = task.priority !== 'must';
                        return (
                          <div
                            key={task.id}
                            onClick={() => toggle(task.id)}
                            style={{
                              display: 'flex',
                              alignItems: 'center',
                              gap: 12,
                              padding: '11px 16px',
                              cursor: 'pointer',
                              background: i % 2 === 0 ? '#13131f' : '#161623',
                              borderBottom:
                                i < phase.tasks.length - 1 ? '1px solid #1e1e30' : 'none',
                              opacity: checked[task.id] ? 0.45 : isOptional ? 0.65 : 1,
                            }}>
                            <div
                              style={{
                                width: 22,
                                height: 22,
                                borderRadius: 6,
                                border: checked[task.id]
                                  ? 'none'
                                  : `2px solid ${isOptional ? '#555' : phase.color + '60'}`,
                                background: checked[task.id]
                                  ? isOptional
                                    ? '#555'
                                    : phase.color
                                  : 'transparent',
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'center',
                                flexShrink: 0,
                              }}>
                              {checked[task.id] && (
                                <span style={{ color: '#fff', fontSize: 13, fontWeight: 700 }}>
                                  {'\u2713'}
                                </span>
                              )}
                            </div>
                            <div style={{ flex: 1, minWidth: 0 }}>
                              <span
                                style={{
                                  fontSize: 13,
                                  textDecoration: checked[task.id] ? 'line-through' : 'none',
                                  lineHeight: 1.4,
                                  color: isOptional ? '#999' : '#e2e2e8',
                                }}>
                                {task.text}
                              </span>
                              {task.tag && (
                                <span
                                  style={{
                                    fontSize: 9,
                                    fontWeight: 700,
                                    background: '#EF444430',
                                    color: '#EF4444',
                                    padding: '2px 6px',
                                    borderRadius: 4,
                                    marginLeft: 8,
                                    letterSpacing: 0.5,
                                  }}>
                                  {task.tag}
                                </span>
                              )}
                              {isOptional && (
                                <span
                                  style={{
                                    fontSize: 9,
                                    fontWeight: 600,
                                    color: '#666',
                                    marginLeft: 8,
                                    fontStyle: 'italic',
                                  }}>
                                  bonus
                                </span>
                              )}
                            </div>
                            <span
                              style={{
                                fontSize: 9,
                                fontWeight: 700,
                                color: priorityColor(task.priority),
                                letterSpacing: 0.5,
                                flexShrink: 0,
                              }}>
                              {task.priority.toUpperCase()}
                            </span>
                            <span
                              style={{
                                fontSize: 11,
                                color: '#666',
                                minWidth: 55,
                                textAlign: 'right',
                                flexShrink: 0,
                                fontFamily: "'DM Mono', monospace",
                              }}>
                              {task.effort}
                            </span>
                          </div>
                        );
                      })}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        )}

        {activeTab === 'finance' && (
          <div style={{ paddingBottom: 40 }}>
            <div style={{ fontSize: 13, color: '#888', marginBottom: 16, lineHeight: 1.6 }}>
              3-month SaySpend project costs &amp; revenue only.
            </div>
            {FINANCIAL_PLAN.map((month, mi) => {
              const totalIncome = month.income.reduce((s, i) => s + i.amount, 0);
              const totalExpenses = month.expenses.reduce((s, e) => s + e.amount, 0);
              const net = totalIncome - totalExpenses;
              return (
                <div
                  key={mi}
                  style={{
                    marginBottom: 20,
                    background: '#13131f',
                    borderRadius: 12,
                    overflow: 'hidden',
                    border: '1px solid #1e1e30',
                  }}>
                  <div
                    style={{
                      padding: '14px 16px',
                      background: mi === 0 ? '#7C3AED20' : mi === 1 ? '#3B82F620' : '#10B98120',
                      display: 'flex',
                      justifyContent: 'space-between',
                      alignItems: 'center',
                    }}>
                    <span style={{ fontSize: 16, fontWeight: 700 }}>{month.month}</span>
                    <span
                      style={{
                        fontSize: 16,
                        fontWeight: 700,
                        color: net >= 0 ? '#10B981' : '#EF4444',
                      }}>
                      Net: {net >= 0 ? '+' : ''}${net.toLocaleString()}
                    </span>
                  </div>
                  <div style={{ padding: '12px 16px 4px' }}>
                    <div
                      style={{
                        fontSize: 11,
                        fontWeight: 700,
                        color: '#10B981',
                        letterSpacing: 1,
                        marginBottom: 8,
                      }}>
                      REVENUE
                    </div>
                    {month.income.map((item, i) => (
                      <div
                        key={i}
                        style={{
                          display: 'flex',
                          justifyContent: 'space-between',
                          padding: '6px 0',
                          borderBottom: '1px solid #1a1a28',
                        }}>
                        <span style={{ fontSize: 13 }}>{item.item}</span>
                        <span
                          style={{
                            fontSize: 13,
                            fontWeight: 600,
                            color: '#10B981',
                            fontFamily: "'DM Mono', monospace",
                          }}>
                          +${item.amount}
                        </span>
                      </div>
                    ))}
                    <div
                      style={{
                        display: 'flex',
                        justifyContent: 'space-between',
                        padding: '8px 0',
                        fontWeight: 700,
                        fontSize: 13,
                      }}>
                      <span>Total Revenue</span>
                      <span style={{ color: '#10B981', fontFamily: "'DM Mono', monospace" }}>
                        ${totalIncome}
                      </span>
                    </div>
                  </div>
                  <div style={{ padding: '4px 16px 12px' }}>
                    <div
                      style={{
                        fontSize: 11,
                        fontWeight: 700,
                        color: '#EF4444',
                        letterSpacing: 1,
                        marginBottom: 8,
                      }}>
                      COSTS
                    </div>
                    {month.expenses.map((item, i) => (
                      <div
                        key={i}
                        style={{
                          display: 'flex',
                          justifyContent: 'space-between',
                          padding: '6px 0',
                          borderBottom: '1px solid #1a1a28',
                        }}>
                        <span style={{ fontSize: 13 }}>{item.item}</span>
                        <span
                          style={{
                            fontSize: 13,
                            fontWeight: 600,
                            color: '#EF4444',
                            fontFamily: "'DM Mono', monospace",
                          }}>
                          -${item.amount}
                        </span>
                      </div>
                    ))}
                    <div
                      style={{
                        display: 'flex',
                        justifyContent: 'space-between',
                        padding: '8px 0',
                        fontWeight: 700,
                        fontSize: 13,
                      }}>
                      <span>Total Costs</span>
                      <span style={{ color: '#EF4444', fontFamily: "'DM Mono', monospace" }}>
                        -${totalExpenses}
                      </span>
                    </div>
                  </div>
                </div>
              );
            })}
            <div
              style={{
                marginTop: 8,
                marginBottom: 24,
                background: '#1a1a28',
                borderRadius: 12,
                padding: 16,
                border: '1px solid #2a2a3a',
              }}>
              <div style={{ fontSize: 14, fontWeight: 700, marginBottom: 12 }}>
                {'\ud83d\udcca'} 3-Month Summary
              </div>
              {(() => {
                const totalRev = FINANCIAL_PLAN.reduce(
                  (s, m) => s + m.income.reduce((a, i) => a + i.amount, 0),
                  0
                );
                const totalCost = FINANCIAL_PLAN.reduce(
                  (s, m) => s + m.expenses.reduce((a, e) => a + e.amount, 0),
                  0
                );
                const totalNet = totalRev - totalCost;
                return (
                  <div style={{ display: 'flex', gap: 16, flexWrap: 'wrap' }}>
                    <div
                      style={{
                        flex: 1,
                        minWidth: 120,
                        background: '#10B98115',
                        borderRadius: 8,
                        padding: '12px 16px',
                      }}>
                      <div
                        style={{
                          fontSize: 11,
                          color: '#10B981',
                          fontWeight: 600,
                          marginBottom: 4,
                        }}>
                        TOTAL REVENUE
                      </div>
                      <div
                        style={{
                          fontSize: 20,
                          fontWeight: 700,
                          color: '#10B981',
                          fontFamily: "'DM Mono', monospace",
                        }}>
                        ${totalRev}
                      </div>
                    </div>
                    <div
                      style={{
                        flex: 1,
                        minWidth: 120,
                        background: '#EF444415',
                        borderRadius: 8,
                        padding: '12px 16px',
                      }}>
                      <div
                        style={{
                          fontSize: 11,
                          color: '#EF4444',
                          fontWeight: 600,
                          marginBottom: 4,
                        }}>
                        TOTAL COSTS
                      </div>
                      <div
                        style={{
                          fontSize: 20,
                          fontWeight: 700,
                          color: '#EF4444',
                          fontFamily: "'DM Mono', monospace",
                        }}>
                        ${totalCost}
                      </div>
                    </div>
                    <div
                      style={{
                        flex: 1,
                        minWidth: 120,
                        background: totalNet >= 0 ? '#10B98115' : '#EF444415',
                        borderRadius: 8,
                        padding: '12px 16px',
                      }}>
                      <div
                        style={{
                          fontSize: 11,
                          color: totalNet >= 0 ? '#10B981' : '#EF4444',
                          fontWeight: 600,
                          marginBottom: 4,
                        }}>
                        NET (3 MO)
                      </div>
                      <div
                        style={{
                          fontSize: 20,
                          fontWeight: 700,
                          color: totalNet >= 0 ? '#10B981' : '#EF4444',
                          fontFamily: "'DM Mono', monospace",
                        }}>
                        {totalNet >= 0 ? '+' : ''}${totalNet}
                      </div>
                    </div>
                  </div>
                );
              })()}
            </div>
            <div
              style={{
                background: '#13131f',
                borderRadius: 12,
                overflow: 'hidden',
                border: '1px solid #1e1e30',
              }}>
              <div style={{ padding: '14px 16px', background: '#7C3AED15' }}>
                <span style={{ fontSize: 15, fontWeight: 700 }}>
                  {'\ud83d\udcca'} Gemini API Cost Projection
                </span>
              </div>
              <div style={{ padding: '0 4px' }}>
                <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 12 }}>
                  <thead>
                    <tr style={{ borderBottom: '1px solid #1e1e30' }}>
                      {['Users', 'Rec/mo', 'API cost', 'Revenue', 'Margin'].map((h) => (
                        <th
                          key={h}
                          style={{
                            padding: '10px 8px',
                            textAlign: 'center',
                            color: '#888',
                            fontWeight: 600,
                            fontSize: 11,
                          }}>
                          {h}
                        </th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {[
                      ['50 free', '750', '$0.04', '$0', '\u2014'],
                      ['200 free + 20 pro', '4,000', '$0.20', '$140', '99.9%'],
                      ['500 free + 50 pro', '10,000', '$0.50', '$350', '99.9%'],
                      ['1k free + 100 pro', '20,000', '$1.00', '$699', '99.9%'],
                    ].map((row, i) => (
                      <tr
                        key={i}
                        style={{
                          borderBottom: '1px solid #1a1a28',
                          background: i % 2 === 0 ? 'transparent' : '#0f0f17',
                        }}>
                        {row.map((cell, j) => (
                          <td
                            key={j}
                            style={{
                              padding: '10px 8px',
                              textAlign: 'center',
                              fontFamily: j > 0 ? "'DM Mono', monospace" : 'inherit',
                              color:
                                j === 4 && cell !== '\u2014'
                                  ? '#10B981'
                                  : j === 3
                                    ? '#10B981'
                                    : '#ccc',
                              fontWeight: j === 4 ? 700 : 400,
                            }}>
                            {cell}
                          </td>
                        ))}
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
              <div
                style={{
                  padding: '12px 16px',
                  fontSize: 11,
                  color: '#666',
                  borderTop: '1px solid #1e1e30',
                }}>
                Gemini 2.5 Flash: ~$0.00005 per voice recording. Costs are negligible at any indie
                scale.
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
