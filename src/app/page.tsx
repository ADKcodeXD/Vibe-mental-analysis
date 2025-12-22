import QuestionEngine from '../components/QuestionEngine';

export default function Home() {
  return (
    <main className="min-h-screen bg-[#050505] text-gray-100 selection:bg-red-500/30 selection:text-red-200">
      <div className="fixed inset-0 bg-[linear-gradient(rgba(18,18,18,0)_1px,transparent_1px),linear-gradient(90deg,rgba(18,18,18,0)_1px,transparent_1px)] bg-[size:40px_40px] [mask-image:radial-gradient(ellipse_60%_50%_at_50%_0%,#000_70%,transparent_100%)] pointer-events-none z-0" />
      <div className="relative z-10">
        <QuestionEngine />
      </div>
    </main>
  );
}
