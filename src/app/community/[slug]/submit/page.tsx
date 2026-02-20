import MinimalistNavigation from '@/components/homepage/MinimalistNavigation'
import Footer from '@/components/homepage/Footer'
import PostForm from '@/components/community/PostForm'
import { prisma } from '@/lib/prisma'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { notFound, redirect } from 'next/navigation'
import Link from 'next/link'
import { ArrowLeft } from 'lucide-react'

export const dynamic = 'force-dynamic'

interface Props {
  params: Promise<{ slug: string }>
}

export default async function SubmitPostPage({ params }: Props) {
  const { slug } = await params
  const session = await getServerSession(authOptions as any)
  const userId = (session as any)?.user?.id

  if (!userId) redirect(`/auth/signin?callbackUrl=/community/${slug}/submit`)

  const community = await (prisma as any).community.findUnique({
    where: { slug },
    include: {
      flairs: true,
    },
  })

  if (!community || community.isArchived) notFound()

  // Check membership
  const membership = await (prisma as any).communityMember.findUnique({
    where: { communityId_userId: { communityId: community.id, userId } },
  })

  if (!membership) {
    return (
      <>
        <MinimalistNavigation />
        <div className="max-w-2xl mx-auto px-4 py-16 text-center">
          <h1 className="text-xl font-thin tracking-wider text-gray-900 mb-4">
            Mitgliedschaft erforderlich
          </h1>
          <p className="text-sm text-gray-500 font-light mb-6">
            Du musst der Community beitreten um Beiträge zu erstellen.
          </p>
          <Link
            href={`/community/${slug}`}
            className="inline-block bg-pink-500 hover:bg-pink-600 text-white text-xs font-light tracking-widest px-6 py-3 uppercase"
          >
            Zur Community
          </Link>
        </div>
        <Footer />
      </>
    )
  }

  return (
    <>
      <MinimalistNavigation />
      <div className="max-w-2xl mx-auto px-4 py-6">
        <Link
          href={`/community/${slug}`}
          className="flex items-center gap-1 text-[10px] uppercase tracking-widest text-gray-500 hover:text-gray-700 mb-4"
        >
          <ArrowLeft className="h-3.5 w-3.5" />
          Zurück zu c/{community.name}
        </Link>

        <h1 className="text-sm uppercase tracking-widest text-gray-900 font-light mb-4">
          Beitrag in c/{community.name} erstellen
        </h1>

        <PostForm
          communitySlug={slug}
          flairs={community.flairs.map((f: any) => ({
            id: f.id,
            name: f.name,
            color: f.color,
            textColor: f.textColor,
          }))}
        />
      </div>
      <Footer />
    </>
  )
}
