export default function GroupHero({
  title,
  subtitle,
  privacy,
  members,
  posts,
  cover,
}: {
  title: string
  subtitle?: string
  privacy: 'PUBLIC' | 'PRIVATE'
  members: number
  posts: number
  cover?: string | null
}) {
  return (
    <section className="relative h-[40vh] min-h-[340px]">
      {/* Background image with dark overlay */}
      <div className="absolute inset-0">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src={cover || '/1.jpg'}
          alt="Group Hero"
          className="h-full w-full object-cover"
        />
        <div className="absolute inset-0 bg-black/50" />
      </div>

      {/* Content */}
      <div className="relative z-10 h-full flex items-center">
        <div className="w-full max-w-7xl mx-auto px-6">
          <div className="text-white">
            <h1 className="text-4xl md:text-5xl font-thin tracking-wider">{title}</h1>
            {subtitle && (
              <p className="mt-3 text-sm max-w-2xl opacity-90">{subtitle}</p>
            )}
            <div className="mt-4 text-xs uppercase tracking-widest opacity-90">
              {privacy === 'PRIVATE' ? 'Privat' : 'Öffentlich'} • {members} Mitglieder • {posts} Beiträge
            </div>
          </div>
        </div>
      </div>
    </section>
  )
}
