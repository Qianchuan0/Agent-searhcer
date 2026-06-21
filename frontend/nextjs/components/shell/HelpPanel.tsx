'use client';

const HELP_ITEMS = [
  {
    title: '发起研究',
    text: '在首页输入问题后提交，系统会自动建立研究计划、抓取资料并生成中文报告。',
  },
  {
    title: '查看历史',
    text: '点击左侧“历史记录”，在中间栏集中查看此前保存的研究任务，并可直接重新打开。',
  },
  {
    title: '追问结果',
    text: '研究完成后，可以继续在结果页追问，系统会基于当前研究上下文继续回答。',
  },
  {
    title: '检查来源',
    text: '点击“资料来源”查看当前研究引用过的网页和域名，必要时可以回到原文核对。',
  },
];

export default function HelpPanel() {
  return (
    <section className="min-h-full px-6 py-6 lg:px-8">
      <div className="mx-auto max-w-5xl space-y-6">
        <div className="rounded-[28px] border border-white/8 bg-[linear-gradient(180deg,rgba(255,255,255,0.04),rgba(255,255,255,0.02))] p-6 shadow-[0_18px_60px_rgba(0,0,0,0.24)]">
          <p className="text-[11px] font-semibold uppercase tracking-[0.22em] text-cyan-200/70">
            Help
          </p>
          <h2 className="mt-2 text-2xl font-semibold text-white">使用帮助</h2>
          <p className="mt-2 text-sm text-ink-muted">把常见操作说明集中放在这里，避免跳到外部文档。</p>
        </div>

        <div className="grid gap-4 md:grid-cols-2">
          {HELP_ITEMS.map((item, index) => (
            <div
              key={item.title}
              className="rounded-[24px] border border-white/8 bg-white/[0.03] p-5 shadow-[0_14px_40px_rgba(0,0,0,0.18)]"
            >
              <div className="flex items-center gap-3">
                <span className="flex h-9 w-9 items-center justify-center rounded-xl border border-white/10 bg-white/[0.05] text-sm font-semibold text-cyan-200">
                  {index + 1}
                </span>
                <h3 className="text-lg font-semibold text-white">{item.title}</h3>
              </div>
              <p className="mt-4 text-sm leading-7 text-ink-muted">{item.text}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
