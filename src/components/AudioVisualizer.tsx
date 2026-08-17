export default function AudioVisualizer({ isActive }: { isActive: boolean }) {
  return (
    <div className="flex items-center justify-center h-16 w-full space-x-1.5">
      {[1, 2, 3, 4, 5, 6, 7].map((i) => (
        <div
          key={i}
          className={`w-1.5 rounded-full transition-all duration-150 ${
            isActive ? 'bg-gradient-to-t from-teal-400 to-emerald-400 animate-pulse shadow-[0_0_8px_rgba(45,212,191,0.6)]' : 'bg-teal-200 h-1 opacity-60'
          }`}
          style={{
            height: isActive ? `${Math.max(20, Math.random() * 50)}px` : '4px',
            animationDelay: `${i * 100}ms`
          }}
        />
      ))}
    </div>
  );
}
