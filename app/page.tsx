import Link from 'next/link';

type Tool = {
  title: string;
  description: string;
  href: string;
  external?: boolean;
};

const tools: Tool[] = [
  {
    title: 'Sample Size Calculator',
    description:
      'Estimate how many users you need before launching an experiment.',
    href: '/sample-size'
  },
  {
    title: 'MDE Calculator',
    description:
      'Define the smallest uplift worth detecting and plan test sensitivity.',
    href: '/mde'
  },
  {
    title: 'SRM Check',
    description:
      'Detect sample ratio mismatch quickly before trusting experiment results.',
    href: '/srm'
  },
  {
    title: 'Statistical Significance Test',
    description:
      'Validate if treatment effects are likely real and not random noise.',
    href: '/stat-test'
  },
  {
    title: 'Bonferroni Correction',
    description:
      'Adjust alpha for multiple comparisons and avoid false positive spikes.',
    href: '/bonferroni'
  },
  {
    title: 'A/B/C Statistical Test',
    description:
      'Compare conversion rates between A, B, and C with Bonferroni correction.',
    href: '/stat-test-abc'
  },
  {
    title: 'ARPU Statistical Test',
    description: 'Compare ARPU between control and test with Welch t-test.',
    href: '/stat-test-arpu'
  }
];

export default function Home() {
  return (
    <main className="min-h-screen bg-canvas text-ink">
      <div className="mx-auto w-full max-w-6xl px-6 py-14 md:px-10 md:py-20">
        <section className="border-y border-border py-10 md:py-16">
          <p className="text-xs uppercase tracking-[0.24em] text-muted">
            A/B testing platform
          </p>
          <h1 className="mt-4 max-w-3xl text-4xl font-semibold leading-tight md:text-6xl">
            A/B Test Toolkit
          </h1>
          <p className="mt-5 max-w-2xl text-lg text-muted md:text-xl">
            Tools for running better experiments
          </p>
        </section>

        <section className="mt-10 md:mt-14">
          <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
            {tools.map((tool, idx) => (
              <article
                key={tool.title}
                className="group flex min-h-64 flex-col justify-between rounded-2xl border border-border bg-white p-6 shadow-card transition-all duration-200 hover:-translate-y-1 hover:border-ink/20"
              >
                <div>
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
                  Open tool
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
