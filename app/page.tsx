import Link from 'next/link';

type Tool = {
  title: string;
  description: string;
  href: string;
  external?: boolean;
};

const tools: Tool[] = [
  {
    title: 'Калькулятор размера выборки',
    description:
      'Рассчитайте, сколько пользователей нужно, чтобы провести A/B тест.',
    href: '/sample-size'
  },
  {
    title: 'Калькулятор MDE',
    description:
      'Определите минимальный статистический эффект, который возможно поймать.',
    href: '/mde'
  },
  {
    title: 'Проверка SRM',
    description:
      'Проверьте результат A/B теста на соответствие выборочных соотношений.',
    href: '/srm'
  },
  {
    title: 'Проверка статистической значимости',
    description:
      'Поймите, действительно ли есть эффект — или это просто шум. Используется Z-тест для конверсии.',
    href: '/stat-test'
  },
  {
    title: 'Размер выборки для A/B/C теста',
    description:
      'Рассчитайте, сколько пользователей нужно, чтобы провести A/B/C тест.',
    href: '/bonferroni'
  },
  {
    title: 'Проверка A/B/C теста (с поправкой Бонферрони)',
    description:
      'Сравнивайте конверсии между вариантами A, B и C с учётом множественных проверок.',
    href: '/stat-test-abc'
  },
  {
    title: 'Статтест для ARPU',
    description: 'Сравнивайте ARPU между группами с помощью t-теста Уэлча.',
    href: '/stat-test-arpu'
  }
];

function ToolIllustration({ toolIndex }: { toolIndex: number }) {
  const strokeProps = {
    fill: 'none',
    stroke: '#2B2B2B',
    strokeWidth: 1.8,
    strokeLinecap: 'round' as const,
    strokeLinejoin: 'round' as const
  };

  switch (toolIndex) {
    case 0:
      return (
        <svg aria-hidden viewBox="0 0 120 64" className="h-16 w-full max-w-[150px]">
          <g stroke="#BDBDBD" strokeWidth="1.4">
            <circle cx="18" cy="18" r="2.2" fill="#BDBDBD" />
            <circle cx="32" cy="24" r="2.2" fill="#BDBDBD" />
            <circle cx="24" cy="38" r="2.2" fill="#BDBDBD" />
          </g>
          <path d="M45 32 H76" {...strokeProps} />
          <path d="M70 24 L78 32 L70 40" {...strokeProps} />
          <g stroke="#2B2B2B" strokeWidth="1.4">
            <circle cx="90" cy="14" r="2.2" fill="#2B2B2B" />
            <circle cx="102" cy="22" r="2.2" fill="#2B2B2B" />
            <circle cx="90" cy="30" r="2.2" fill="#2B2B2B" />
            <circle cx="102" cy="38" r="2.2" fill="#2B2B2B" />
            <circle cx="90" cy="46" r="2.2" fill="#2B2B2B" />
            <circle cx="102" cy="54" r="2.2" fill="#2B2B2B" />
          </g>
        </svg>
      );
    case 1:
      return (
        <svg aria-hidden viewBox="0 0 120 64" className="h-16 w-full max-w-[150px]">
          <line x1="14" y1="20" x2="44" y2="20" {...strokeProps} />
          <line x1="14" y1="44" x2="44" y2="44" {...strokeProps} />
          <line
            x1="55"
            y1="20"
            x2="55"
            y2="44"
            stroke="#6FCF97"
            strokeWidth="2"
            strokeLinecap="round"
          />
          <circle cx="55" cy="20" r="2.5" fill="#6FCF97" />
          <circle cx="55" cy="44" r="2.5" fill="#6FCF97" />
          <line x1="70" y1="20" x2="106" y2="20" stroke="#BDBDBD" strokeWidth="1.8" />
          <line x1="70" y1="44" x2="106" y2="44" stroke="#2B2B2B" strokeWidth="1.8" />
        </svg>
      );
    case 2:
      return (
        <svg aria-hidden viewBox="0 0 120 64" className="h-16 w-full max-w-[150px]">
          <line x1="20" y1="54" x2="104" y2="54" stroke="#BDBDBD" strokeWidth="1.6" />
          <rect x="26" y="22" width="24" height="32" fill="#2B2B2B" opacity="0.18" />
          <line x1="38" y1="22" x2="38" y2="54" stroke="#2B2B2B" strokeWidth="2" />
          <rect x="70" y="16" width="24" height="38" fill="#2B2B2B" opacity="0.12" />
          <line x1="78" y1="16" x2="78" y2="54" stroke="#6FCF97" strokeWidth="2" />
          <line x1="86" y1="24" x2="86" y2="54" stroke="#2B2B2B" strokeWidth="2" />
        </svg>
      );
    case 3:
      return (
        <svg aria-hidden viewBox="0 0 120 64" className="h-16 w-full max-w-[150px]">
          <path d="M8 50 C22 12, 46 12, 58 50" stroke="#BDBDBD" strokeWidth="1.8" fill="none" />
          <path d="M38 50 C52 14, 82 14, 104 50" stroke="#2B2B2B" strokeWidth="1.8" fill="none" />
          <circle cx="46" cy="30" r="2.4" fill="#6FCF97" />
          <circle cx="58" cy="24" r="2.4" fill="#6FCF97" />
          <circle cx="68" cy="30" r="2.4" fill="#6FCF97" />
        </svg>
      );
    case 4:
      return (
        <svg aria-hidden viewBox="0 0 120 64" className="h-16 w-full max-w-[150px]">
          <g fill="#2B2B2B">
            <circle cx="20" cy="20" r="2.2" />
            <circle cx="28" cy="30" r="2.2" />
            <circle cx="20" cy="40" r="2.2" />
            <circle cx="56" cy="20" r="2.2" />
            <circle cx="64" cy="30" r="2.2" />
            <circle cx="56" cy="40" r="2.2" />
            <circle cx="92" cy="20" r="2.2" />
            <circle cx="100" cy="30" r="2.2" />
            <circle cx="92" cy="40" r="2.2" />
          </g>
          <line x1="40" y1="14" x2="40" y2="46" stroke="#BDBDBD" strokeWidth="1.2" />
          <line x1="76" y1="14" x2="76" y2="46" stroke="#BDBDBD" strokeWidth="1.2" />
        </svg>
      );
    case 5:
      return (
        <svg aria-hidden viewBox="0 0 120 64" className="h-16 w-full max-w-[150px]">
          <circle cx="22" cy="32" r="5" fill="#2B2B2B" />
          <circle cx="60" cy="20" r="5" fill="#BDBDBD" />
          <circle cx="60" cy="44" r="5" fill="#6FCF97" />
          <line x1="27" y1="30" x2="54" y2="22" {...strokeProps} />
          <line x1="27" y1="34" x2="54" y2="42" {...strokeProps} />
          <text x="19" y="50" fontSize="9" fill="#2B2B2B">A</text>
          <text x="57" y="13" fontSize="9" fill="#2B2B2B">B</text>
          <text x="57" y="58" fontSize="9" fill="#2B2B2B">C</text>
        </svg>
      );
    default:
      return (
        <svg aria-hidden viewBox="0 0 120 64" className="h-16 w-full max-w-[150px]">
          <line x1="12" y1="54" x2="108" y2="54" stroke="#BDBDBD" strokeWidth="1.4" />
          <g fill="#BDBDBD">
            <circle cx="24" cy="42" r="2.3" />
            <circle cx="30" cy="36" r="2.3" />
            <circle cx="36" cy="40" r="2.3" />
            <circle cx="42" cy="34" r="2.3" />
            <circle cx="48" cy="38" r="2.3" />
          </g>
          <g fill="#2B2B2B">
            <circle cx="64" cy="26" r="2.3" />
            <circle cx="70" cy="20" r="2.3" />
            <circle cx="76" cy="24" r="2.3" />
            <circle cx="82" cy="18" r="2.3" />
            <circle cx="88" cy="22" r="2.3" />
          </g>
          <line x1="56" y1="47" x2="94" y2="14" stroke="#6FCF97" strokeWidth="1.8" />
        </svg>
      );
  }
}

export default function Home() {
  return (
    <main className="min-h-screen bg-canvas text-ink">
      <div className="mx-auto w-full max-w-6xl px-6 py-14 md:px-10 md:py-20">
        <header className="mb-4 flex flex-wrap items-center justify-between gap-3 text-xs uppercase tracking-[0.24em] text-muted md:mb-6">
          <p>A/B TEST TOOLKIT</p>
          <p>BY MIKHAYLOVA ELIZAVETA</p>
        </header>

        <section className="relative border-y border-border py-8 md:py-12">
          <svg
            aria-hidden
            viewBox="0 0 64 64"
            className="pointer-events-none absolute right-[-120px] top-[-80px] z-0 h-[380px] w-[380px] opacity-[0.05] md:h-[620px] md:w-[620px]"
          >
            <rect x="2" y="2" width="60" height="60" rx="12" fill="#F5F5F5" stroke="#E5E5E5" />
            <circle cx="20" cy="20" r="5" fill="#BDBDBD" />
            <circle cx="32" cy="20" r="5" fill="#BDBDBD" />
            <circle cx="44" cy="20" r="5" fill="#2B2B2B" />
            <circle cx="20" cy="32" r="5" fill="#BDBDBD" />
            <circle cx="32" cy="32" r="5" fill="#6FCF97" />
            <circle cx="44" cy="32" r="5" fill="#2B2B2B" />
            <circle cx="20" cy="44" r="5" fill="#2B2B2B" />
            <circle cx="32" cy="44" r="5" fill="#2B2B2B" />
            <circle cx="44" cy="44" r="5" fill="#BDBDBD" />
          </svg>

          <div className="relative z-[1]">
            <h1 className="max-w-3xl text-4xl font-semibold leading-tight md:text-6xl">
              Набор инструментов для A/B-тестирования
            </h1>
            <p className="mt-5 max-w-2xl text-lg text-muted md:text-xl">
              Считайте. Проверяйте. Запускайте.
            </p>
          </div>
        </section>

        <section className="relative z-[1] mt-10 md:mt-14">
          <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
            {tools.map((tool, idx) => (
              <article
                key={tool.title}
                className="group flex min-h-64 flex-col justify-between rounded-2xl border border-border bg-white p-6 shadow-card transition-all duration-200 hover:-translate-y-1 hover:border-ink/20"
              >
                <div>
                  <div className="mb-3 flex h-16 items-center justify-center">
                    <ToolIllustration toolIndex={idx} />
                  </div>
                  <p className="text-xs uppercase tracking-[0.2em] text-muted">
                    Tool {String(idx + 1).padStart(2, '0')}
                  </p>
                  <h2 className="mt-3 text-2xl font-medium leading-snug">
                    {tool.title}
                  </h2>
                  <p className="mt-3 text-base leading-relaxed text-muted">
                    {tool.description}
                  </p>
                </div>

                <Link
                  href={tool.href}
                  target={tool.external ? '_blank' : undefined}
                  rel={tool.external ? 'noreferrer noopener' : undefined}
                  className="mt-8 inline-flex w-fit items-center gap-2 rounded-full border border-ink px-4 py-2 text-sm font-medium transition-colors group-hover:bg-ink group-hover:text-white"
                >
                  Открыть
                  <span aria-hidden>{tool.external ? '↗' : '→'}</span>
                </Link>
              </article>
            ))}
          </div>
        </section>
      </div>
    </main>
  );
}
