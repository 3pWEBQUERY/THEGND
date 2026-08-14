import type { Metadata } from "next";
import { PageHeader } from "@/components/dashboard/page-header";
import { AgencyEditor } from "@/components/admin/agency-editor";
import { saveAgencyAction } from "@/server/actions/admin";
import { agenturStammdaten } from "@/app/admin/agenturen/stammdaten";

export const metadata: Metadata = { title: "Neues Haus · Admin" };

export default async function NeueAgenturPage() {
  const { cities, serviceCategories, languages } = await agenturStammdaten();

  return (
    <>
      <PageHeader title="Neues Haus" description="Agentur, Club, Studio, Massagesalon, Sauna oder Bar anlegen." />
      <AgencyEditor
        agency={{
          slug: "",
          name: "",
          kind: "AGENCY",
          headline: null,
          about: null,
          logoUrl: null,
          coverUrl: null,
          website: null,
          phone: null,
          whatsapp: null,
          email: null,
          street: null,
          zip: null,
          district: null,
          cityId: null,
          lat: null,
          lng: null,
          priceFrom: null,
          isOpen24h: false,
          hasParking: false,
          hasBar: false,
          acceptsCards: false,
          barrierFree: false,
          isVerified: false,
          isPublished: true,
          serviceIds: [],
          languageIds: [],
          hours: [],
        }}
        cities={cities}
        serviceCategories={serviceCategories}
        languages={languages}
        action={saveAgencyAction}
      />
    </>
  );
}
