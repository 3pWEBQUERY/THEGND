'use client'
import StoriesGallery from './StoriesGallery'

export default function ServicesSection() {
  return (
    <>
      {/* Services Section */}
      <section className="py-20 bg-white">
        <div className="max-w-7xl mx-auto px-6">
          <div className="text-center mb-16">
            <h2 className="text-4xl font-thin tracking-wider text-gray-800 mb-4">ESCORT AGENTUREN</h2>
            <div className="w-24 h-px bg-pink-500 mx-auto mb-8"></div>
          </div>
          
          <div className="grid md:grid-cols-3 gap-12">
            <div className="text-center">
              <div className="w-16 h-16 bg-pink-100 rounded-full flex items-center justify-center mx-auto mb-6">
                <div className="w-8 h-8 bg-pink-500 rounded-full"></div>
              </div>
              <h3 className="text-xl font-light tracking-wider text-gray-800 mb-4">VERIFIZIERT</h3>
              <p className="text-sm font-light text-gray-600 leading-relaxed">
                Unser Team verpflichtet sich, alle Escorts gründlich zu verifizieren.
              </p>
            </div>
            
            <div className="text-center">
              <div className="w-16 h-16 bg-pink-100 rounded-full flex items-center justify-center mx-auto mb-6">
                <div className="w-8 h-8 bg-pink-500 rounded-full"></div>
              </div>
              <h3 className="text-xl font-light tracking-wider text-gray-800 mb-4">DISKRET</h3>
              <p className="text-sm font-light text-gray-600 leading-relaxed">
                Unser Team respektiert Ihre Privatsphäre und verpflichtet sich zu höchstem Maß an Konfidenzialität.
              </p>
            </div>
            
            <div className="text-center">
              <div className="w-16 h-16 bg-pink-100 rounded-full flex items-center justify-center mx-auto mb-6">
                <div className="w-8 h-8 bg-pink-500 rounded-full"></div>
              </div>
              <h3 className="text-xl font-light tracking-wider text-gray-800 mb-4">SUPPORT</h3>
              <p className="text-sm font-light text-gray-600 leading-relaxed">
                Unser 24/7-Team steht Ihnen für jede Hilfe zur Verfügung.
              </p>
            </div>
          </div>
        </div>
      </section>

      <StoriesGallery />
    </>
  )
}