export default function CommunityHero({ title = 'COMMUNITIES' }: { title?: string }) {
  return (
    <section className="relative h-[50vh] min-h-[400px]">
      <div className="absolute inset-0">
        <img src="/forum.jpg" alt="Communities Hero" className="h-full w-full object-cover" />
        <div className="absolute inset-0 bg-black/50" />
      </div>
      <div className="relative z-10 h-full flex items-center justify-center text-center px-6">
        <div>
          <h1 className="text-5xl md:text-6xl font-thin tracking-wider text-white mb-4">{title}</h1>
          <div className="w-24 h-px bg-pink-500 mx-auto" />
        </div>
      </div>
    </section>
  )
}
