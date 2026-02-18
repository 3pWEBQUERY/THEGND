export default function RentalsHero() {
  return (
    <section className="relative h-[40vh] min-h-[340px]">
      <div className="absolute inset-0">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img src="/2.jpg" alt="Mieten Hero" className="h-full w-full object-cover" />
        <div className="absolute inset-0 bg-black/50" />
      </div>
      <div className="relative z-10 h-full flex items-center justify-center text-center px-6">
        <div>
          <h1 className="text-5xl md:text-6xl font-thin tracking-wider text-white mb-4">MIETEN</h1>
          <div className="w-24 h-px bg-pink-500 mx-auto" />
        </div>
      </div>
    </section>
  )
}
