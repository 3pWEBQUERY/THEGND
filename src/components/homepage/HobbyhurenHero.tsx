export default function HobbyhurenHero() {
  return (
    <section className="relative h-[50vh] min-h-[400px]">
      {/* Background image with dark overlay */}
      <div className="absolute inset-0">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src="/Hobbyhuren_Hero.jpg"
          alt="Hobbyhuren Hero"
          className="h-full w-full object-cover"
        />
        <div className="absolute inset-0 bg-black/50" />
      </div>

      {/* Content */}
      <div className="relative z-10 h-full flex items-center justify-center text-center px-6">
        <div>
          <h1 className="text-5xl md:text-6xl font-thin tracking-wider text-white mb-4">HOBBYHUREN</h1>
          <div className="w-24 h-px bg-pink-500 mx-auto" />
        </div>
      </div>
    </section>
  )
}
