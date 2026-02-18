export type BusinessServiceOption = { value: string; label: string }

export const AGENCY_SERVICES_DE: BusinessServiceOption[] = [
  // Buchungsarten & Dauer
  { value: 'short-date', label: 'Kurzdate (1–2 Stunden)' },
  { value: 'dinner-date', label: 'Dinner-Date (3–4 Stunden)' },
  { value: 'overnight', label: 'Overnight (ca. 12 Stunden)' },
  { value: 'day-24h', label: '24-Stunden Begleitung' },
  { value: 'weekend', label: 'Wochenend-Begleitung' },

  // Einsatzort / Art
  { value: 'incall', label: 'Incall (Besuch bei Escort/Location)' },
  { value: 'outcall', label: 'Outcall (Hotel/Adresse des Kunden)' },
  { value: 'city-date', label: 'City Date / Stadterkundung' },
  { value: 'business-dinner', label: 'Business-Dinner Begleitung' },
  { value: 'cultural-event', label: 'Kulturelle Events (Konzert/Theater)' },
  { value: 'club-night', label: 'Club-/Nachtleben-Begleitung' },
  { value: 'event-companion', label: 'Event-/Gala-/Messe-Begleitung' },

  // Reisen & Umfang
  { value: 'travel-companion-domestic', label: 'Reisebegleitung – Inland' },
  { value: 'travel-companion-international', label: 'Reisebegleitung – International' },
  { value: 'vacation-companion', label: 'Urlaubs-/Kurztrip-Begleitung' },

  // Konstellationen
  { value: 'duo-booking', label: 'Duo-Buchung (2 Escorts)' },
  { value: 'trio-booking', label: 'Trio-Buchung (3 Escorts)' },
  { value: 'couple-service', label: 'Pärchen-Buchung' },

  // Zusatzleistungen (agenturorganisiert)
  { value: 'gift-arrangement', label: 'Geschenk-/Blumen-Arrangement' },
  { value: 'dress-code-styling', label: 'Dresscode-/Styling-Abstimmung' },
  { value: 'restaurant-reservation', label: 'Restaurant-/Tischreservierung' },
  { value: 'discreet-pickup', label: 'Diskreter Abhol-/Bringservice' },
  { value: 'multilingual-companion', label: 'Mehrsprachige Begleitung' },
  { value: 'nda-confidentiality', label: 'Diskretion/Vertraulichkeit (NDA auf Wunsch)' },

  // Erfahrung/Atmosphäre (agenturnahe Kategorisierung)
  { value: 'girlfriend-experience', label: 'Girlfriend Experience (GFE)' },
  { value: 'elegant-dinner-companion', label: 'Elegante Dinner-Begleitung' },
  { value: 'vip-evening', label: 'VIP-Abend (Premium Betreuung)' },

  // Anlässe & Special Occasions
  { value: 'red-carpet', label: 'Red-Carpet / Gala Begleitung' },
  { value: 'wedding-plus-one', label: 'Hochzeit – Plus-One' },
  { value: 'business-trip', label: 'Geschäftsreise-Begleitung' },
  { value: 'spa-day', label: 'Spa-/Wellness-Tag' },
  { value: 'shopping-companion', label: 'Shopping-Begleitung' },
  { value: 'wine-tasting', label: 'Wine-Tasting / Bar-Abend' },
  { value: 'museum-tour', label: 'Museum-/Ausstellungsbesuch' },

  // Reise & Transport-Optionen (auf Wunsch organisiert)
  { value: 'airport-pickup', label: 'Airport Pickup / Drop-off' },
  { value: 'chauffeur-service', label: 'Chauffeur-Service (auf Wunsch)' },
  { value: 'yacht-day', label: 'Yacht-/Bootstag (auf Wunsch)' },
  { value: 'ski-trip', label: 'Ski-Trip Begleitung' },
  { value: 'beach-day', label: 'Beach-/Sommer-Tag' },

  // Stil & Themen
  { value: 'evening-gown', label: 'Abendkleid / Elegant' },
  { value: 'business-attire', label: 'Business Attire' },
  { value: 'smart-casual', label: 'Smart Casual' },
  { value: 'theme-dress-up', label: 'Themen-Outfits (nach Absprache)' },

  // Add-ons & Diskretion
  { value: 'photo-free-zone', label: 'Keine Fotos – Diskret' },
  { value: 'gift-curation', label: 'Geschenkberatung & -Besorgung' },
  { value: 'hotel-restaurant-booking', label: 'Hotel-/Restaurant-Buchungen' },
  
  // Weitere Date-Formate & Erlebnisse
  { value: 'breakfast-date', label: 'Breakfast-Date' },
  { value: 'lunch-date', label: 'Lunch-Date' },
  { value: 'after-work-drink', label: 'After-Work Drink' },
  { value: 'opera-night', label: 'Opern-/Ballettabend' },
  { value: 'concert-night', label: 'Konzert-/Premierenabend' },
  { value: 'sports-event', label: 'Sportevent-Begleitung' },
  { value: 'city-weekend', label: 'City-Weekend' },
  { value: 'road-trip', label: 'Road-Trip Begleitung' },
  { value: 'mountain-retreat', label: 'Berg-/Wellness-Retreat' },
  { value: 'island-getaway', label: 'Insel-/Strand-Wochenende' },
]

// Für CLUB: Ausstattung & Räume (Facility-Features)
export const CLUB_SERVICES_DE: BusinessServiceOption[] = [
  // Ausstattung
  { value: 'air_conditioning', label: 'Klimaanlage' },
  { value: 'heating', label: 'Heizung' },
  { value: 'bar', label: 'Bar' },
  { value: 'lounge', label: 'Lounge' },
  { value: 'smoking_area', label: 'Raucherbereich' },
  { value: 'parking', label: 'Parkplätze' },
  { value: 'vip_area', label: 'VIP-Bereich' },
  { value: 'cloakroom', label: 'Garderobe' },
  { value: 'wifi', label: 'WLAN' },
  { value: 'wheelchair_access', label: 'Barrierefreier Zugang' },
  { value: 'sound_system', label: 'Soundsystem / PA' },
  { value: 'lighting', label: 'Lichtanlage' },
  { value: 'cashless_payment', label: 'Bargeldloses Bezahlen' },
  // Räume
  { value: 'darkroom', label: 'Darkroom' },
  { value: 'porn_cinema', label: 'Pornokino' },
  { value: 'bdsm_room', label: 'BDSM Room' },
  { value: 'private_cabins', label: 'Private Kabinen' },
  { value: 'jacuzzi', label: 'Whirlpool' },
  { value: 'sauna', label: 'Sauna' },
  { value: 'steam_room', label: 'Dampfbad' },
  { value: 'massage_room', label: 'Massageraum' },
  { value: 'dance_floor', label: 'Tanzfläche' },
  { value: 'stage', label: 'Bühne' },
  { value: 'poles', label: 'Pole-Stangen' },
  { value: 'cages', label: 'Käfige' },
  { value: 'sling_area', label: 'Sling Area' },
  { value: 'glory_holes', label: 'Glory Holes' },
  { value: 'couples_area', label: 'Pärchenbereich' },
  { value: 'outdoor_area', label: 'Außenbereich' },
  // Services/Events
  { value: 'theme_nights', label: 'Themenabende' },
  { value: 'live_shows', label: 'Live Shows' },
  { value: 'couple_nights', label: 'Pärchenabende' },
  { value: 'ladies_night', label: 'Ladies Night' },
  { value: 'workshops', label: 'Workshops' },
  { value: 'foam_party', label: 'Schaumparty' },
  { value: 'dj_events', label: 'DJ-Events' },
  { value: 'photo_policy', label: 'Fotopolitik (No-Photo-Zonen)' },
]

// Für STUDIO: Ausstattung & Räume (ebenfalls Facility-Features)
export const STUDIO_SERVICES_DE: BusinessServiceOption[] = [
  // Ausstattung
  { value: 'air_conditioning', label: 'Klimaanlage' },
  { value: 'heating', label: 'Heizung' },
  { value: 'bar', label: 'Bar' },
  { value: 'lounge', label: 'Lounge' },
  { value: 'smoking_area', label: 'Raucherbereich' },
  { value: 'parking', label: 'Parkplätze' },
  { value: 'vip_area', label: 'VIP-Bereich' },
  { value: 'client_lounge', label: 'Kundenlounge' },
  { value: 'kitchenette', label: 'Teeküche' },
  { value: 'makeup_room', label: 'Make-up Raum / Schminkplätze' },
  { value: 'wardrobe_room', label: 'Garderobenraum' },
  { value: 'props_storage', label: 'Requisitenlager' },
  { value: 'wifi', label: 'WLAN' },
  { value: 'loading_ramp', label: 'Laderampe / ebenerdiger Zugang' },
  { value: 'power_three_phase', label: 'Drehstrom / Starkstrom' },
  // Räume
  { value: 'darkroom', label: 'Darkroom' },
  { value: 'porn_cinema', label: 'Pornokino' },
  { value: 'bdsm_room', label: 'BDSM Room' },
  { value: 'private_cabins', label: 'Private Kabinen' },
  { value: 'jacuzzi', label: 'Whirlpool' },
  { value: 'sauna', label: 'Sauna' },
  { value: 'steam_room', label: 'Dampfbad' },
  { value: 'massage_room', label: 'Massageraum' },
  { value: 'daylight_studio', label: 'Tageslichtstudio' },
  { value: 'blackout_curtains', label: 'Verdunklungsvorhänge' },
  { value: 'cyclorama', label: 'Hohlkehle / Cyclorama' },
  { value: 'green_screen', label: 'Greenscreen' },
  { value: 'backdrops_system', label: 'Hintergrundsystem (Papier/Leinen)' },
  { value: 'rigging_points', label: 'Rigging-Punkte / Traverse' },
  { value: 'soundproofing', label: 'Schallschutz / Akustik' },
  { value: 'editing_suite', label: 'Editing Suite' },
  { value: 'grading_suite', label: 'Color-Grading Suite' },
  // Services/Events
  { value: 'theme_nights', label: 'Themenabende' },
  { value: 'live_shows', label: 'Live Shows' },
  { value: 'workshops', label: 'Workshops' },
  { value: 'equipment_rental_list', label: 'Equipment-Verleih (Licht/Kamera)' },
  { value: 'tethering_station', label: 'Tethering-Station' },
  { value: 'haze_fog', label: 'Hazer / Nebel' },
]
