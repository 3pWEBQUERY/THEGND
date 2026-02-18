import { MultiSelectOption } from '@/components/ui/multi-select'
import { COUNTRIES_DE } from '@/data/countries.de'

// Kontinente mit ISO 3166-1 Alpha-2 Codes
export const CONTINENT_COUNTRY_CODES: Record<string, string[]> = {
  Europa: [
    'AL','AD','AT','BY','BE','BA','BG','HR','CY','CZ','DK','EE','FI','FR','DE','GR','HU','IS','IE','IT','LV','LI','LT','LU','MT','MD','MC','ME','NL','MK','NO','PL','PT','RO','RU','SM','RS','SK','SI','ES','SE','CH','UA','GB','VA'
  ],
  Asien: [
    'AF','AM','AZ','BH','BD','BT','BN','KH','CN','GE','IN','ID','IR','IQ','IL','JP','JO','KZ','KW','KG','LA','LB','MY','MV','MN','MM','NP','KP','OM','PK','PH','QA','SA','SG','KR','LK','SY','TJ','TH','TL','TR','TM','AE','UZ','VN','YE'
  ],
  Afrika: [
    'DZ','AO','BJ','BW','BF','BI','CM','CV','CF','TD','KM','CI','CD','CG','DJ','EG','GQ','ER','SZ','ET','GA','GM','GH','GN','GW','KE','LS','LR','LY','MG','MW','ML','MR','MU','MA','MZ','NA','NE','NG','RW','ST','SN','SC','SL','SO','ZA','SS','SD','TZ','TG','TN','UG','ZM','ZW'
  ],
  Nordamerika: [
    'AG','BS','BB','BZ','CA','CR','CU','DM','DO','SV','GD','GT','HT','HN','JM','MX','NI','PA','KN','LC','VC','US'
  ],
  Südamerika: [
    'AR','BO','BR','CL','CO','EC','GY','PY','PE','SR','UY','VE'
  ],
  Ozeanien: [
    'AU','FJ','KI','MH','FM','NR','NZ','PW','PG','WS','SB','TO','TV','VU'
  ],
}

export const CONTINENT_ORDER: (keyof typeof CONTINENT_COUNTRY_CODES)[] = [
  'Europa', 'Asien', 'Afrika', 'Nordamerika', 'Südamerika', 'Ozeanien'
]

export function optionsForContinent(continent: keyof typeof CONTINENT_COUNTRY_CODES): MultiSelectOption[] {
  const codes = new Set(CONTINENT_COUNTRY_CODES[continent])
  return COUNTRIES_DE.filter(c => codes.has(c.value))
}

export function allCountryOptionsByContinent(): Record<string, MultiSelectOption[]> {
  const out: Record<string, MultiSelectOption[]> = {}
  for (const k of CONTINENT_ORDER) out[k] = optionsForContinent(k)
  return out
}
