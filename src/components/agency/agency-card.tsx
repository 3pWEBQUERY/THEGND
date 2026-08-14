import Link from "next/link";
import Image from "next/image";
import { BadgeCheck, Clock, MapPin, Users } from "lucide-react";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { AGENCY_KIND_LABEL } from "@/lib/constants";
import { formatDistanz } from "@/lib/geo";
import { formatPrice } from "@/lib/utils";

export type AgencyCardProps = {
  slug: string;
  name: string;
  kind: string;
  headline: string | null;
  about: string | null;
  coverUrl: string | null;
  cityName: string | null;
  district: string | null;
  city: { name: string } | null;
  priceFrom: number | null;
  currency: string;
  isVerified: boolean;
  modelCount: number;
  distanzKm?: number | null;
  geoeffnet?: boolean | null;
};

export function AgencyCard({ agency }: { agency: AgencyCardProps }) {
  const ort = [agency.district, agency.city?.name ?? agency.cityName].filter(Boolean).join(", ") || "—";

  return (
    <Link href={`/agenturen/${agency.slug}`}>
      <Card className="h-full overflow-hidden">
        <div className="relative aspect-16/9 bg-muted">
          {agency.coverUrl && (
            <Image
              src={agency.coverUrl}
              alt=""
              fill
              sizes="(max-width: 768px) 100vw, 33vw"
              className="object-cover"
            />
          )}
          <div className="absolute left-2 top-2 flex flex-wrap gap-1.5">
            <Badge variant="solid" size="sm">
              {AGENCY_KIND_LABEL[agency.kind] ?? agency.kind}
            </Badge>
            {agency.geoeffnet === true && (
              <Badge variant="success" size="sm">
                <Clock className="size-3" /> Jetzt offen
              </Badge>
            )}
            {agency.distanzKm != null && (
              <Badge variant="neutral" size="sm">
                {formatDistanz(agency.distanzKm)}
              </Badge>
            )}
          </div>
        </div>

        <div className="p-5">
          <div className="flex items-center gap-2">
            <h2 className="truncate text-base font-semibold">{agency.name}</h2>
            {agency.isVerified && (
              <Badge variant="success" size="sm">
                <BadgeCheck className="size-3" /> Geprüft
              </Badge>
            )}
          </div>

          <p className="mt-1.5 flex items-center gap-1.5 text-xs text-muted-foreground">
            <MapPin className="size-3.5 shrink-0" />
            <span className="truncate">{ort}</span>
          </p>

          {(agency.headline || agency.about) && (
            <p className="mt-3 line-clamp-2 text-sm text-muted-foreground">{agency.headline ?? agency.about}</p>
          )}

          <div className="mt-4 flex items-center justify-between gap-3 text-xs">
            <span className="flex items-center gap-1.5 font-medium">
              <Users className="size-3.5 text-primary" />
              {agency.modelCount} {agency.modelCount === 1 ? "Model" : "Models"}
            </span>
            {agency.priceFrom != null && (
              <span className="font-semibold">
                ab {formatPrice(agency.priceFrom, agency.currency)}
              </span>
            )}
          </div>
        </div>
      </Card>
    </Link>
  );
}
