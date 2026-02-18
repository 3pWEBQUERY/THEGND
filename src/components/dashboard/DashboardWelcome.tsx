"use client"

export default function DashboardWelcome() {
  return (
    <div className="bg-white border border-gray-100 rounded-none">
      <div className="p-8">
        <div className="text-center mb-6">
          <h2 className="text-2xl font-thin tracking-wider text-gray-800 mb-2">WILLKOMMEN IN DEINEM DASHBOARD</h2>
          <div className="w-12 h-px bg-pink-500 mx-auto mb-4"></div>
          <p className="text-sm font-light tracking-wide text-gray-600">
            Verwalte dein Profil, vernetzen dich mit anderen und bleib auf dem Laufenden
          </p>
        </div>
        {/* Quick Stats */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
          <div className="text-center p-6 bg-gray-50">
            <div className="text-xl font-thin tracking-wider text-gray-800 mb-2">0</div>
            <div className="text-xs font-light tracking-widest text-gray-500 uppercase">BEITRÄGE</div>
          </div>
          <div className="text-center p-6 bg-gray-50">
            <div className="text-xl font-thin tracking-wider text-gray-800 mb-2">0</div>
            <div className="text-xs font-light tracking-widest text-gray-500 uppercase">FOLLOWER</div>
          </div>
          <div className="text-center p-6 bg-gray-50">
            <div className="text-xl font-thin tracking-wider text-gray-800 mb-2">0</div>
            <div className="text-xs font-light tracking-widest text-gray-500 uppercase">FOLGE ICH</div>
          </div>
          <div className="text-center p-6 bg-gray-50">
            <div className="text-xl font-thin tracking-wider text-gray-800 mb-2">0</div>
            <div className="text-xs font-light tracking-widest text-gray-500 uppercase">NACHRICHTEN</div>
          </div>
        </div>
      </div>
    </div>
  )
}
