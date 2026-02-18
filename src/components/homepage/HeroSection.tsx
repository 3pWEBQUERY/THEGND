import Image from 'next/image'

export default function HeroSection() {
  return (
    <section className="relative h-screen flex items-center justify-center bg-gray-100">
      {/* Full Width Background Model Image */}
      <div className="absolute inset-0">
        <Image
          src="/1.jpg"
          alt="Model"
          fill
          className="object-cover"
          priority
        />
        <div className="absolute inset-0 bg-black/30"></div>
      </div>
      
      <div className="relative z-10 text-center px-6">
        <h1 className="text-6xl md:text-8xl font-thin tracking-wider text-white mb-4">
          THE GIRL NEXT DOOR
        </h1>
        <div
          className="mx-auto h-[2px] w-40 rounded-full bg-gradient-to-r from-pink-600/0 via-pink-500/80 to-pink-600/0 mb-6"
          aria-hidden="true"
        />
        <p className="text-base md:text-lg font-light tracking-widest text-white max-w-md mx-auto">
          FINDE DEINE VERIFIZIERTE ESCORT DAMEN IN DEINER NÄHE!
        </p>
      </div>
    </section>
  )
}