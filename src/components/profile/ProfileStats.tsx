'use client'

type Props = {
  postsCount: number
  followersCount: number
  followingCount: number
  storiesCount?: number
}

export default function ProfileStats({ postsCount, followersCount, followingCount, storiesCount = 0 }: Props) {
  return (
    <div className="flex justify-center md:justify-start gap-8 pt-6 border-t border-gray-100">
      <div className="text-center">
        <div className="text-xl font-thin tracking-wider text-gray-800">{postsCount}</div>
        <div className="text-xs font-light tracking-widest text-gray-500 uppercase">BEITRÄGE</div>
      </div>
      <div className="text-center">
        <div className="text-xl font-thin tracking-wider text-gray-800">{followersCount}</div>
        <div className="text-xs font-light tracking-widest text-gray-500 uppercase">FOLLOWER</div>
      </div>
      <div className="text-center">
        <div className="text-xl font-thin tracking-wider text-gray-800">{followingCount}</div>
        <div className="text-xs font-light tracking-widest text-gray-500 uppercase">FOLGE ICH</div>
      </div>
      {storiesCount > 0 && (
        <div className="text-center">
          <div className="text-xl font-thin tracking-wider text-gray-800">{storiesCount}</div>
          <div className="text-xs font-light tracking-widest text-gray-500 uppercase">STORIES</div>
        </div>
      )}
    </div>
  )
}
