import type { Metadata } from "next";
import Link from "next/link";
import Image from "next/image";
import { Newspaper } from "lucide-react";
import { db } from "@/lib/db";
import { Badge } from "@/components/ui/badge";
import { formatDate } from "@/lib/utils";

export const metadata: Metadata = {
  title: "Magazin",
  description: "Ratgeber, Sicherheitstipps und Hintergründe rund um Begleitservice, Etikette und Selbstständigkeit.",
  alternates: { canonical: "/magazin" },
};

export default async function MagazinePage() {
  const posts = await db.blogPost.findMany({
    where: { published: true },
    orderBy: { publishedAt: "desc" },
    take: 40,
  });

  const [featured, ...rest] = posts;

  return (
    <div className="mx-auto max-w-[1400px] px-4 py-10 sm:px-6">
      <header className="mb-10 max-w-2xl">
        <p className="mb-2 flex items-center gap-1.5 text-xs font-semibold uppercase tracking-[0.18em] text-primary">
          <Newspaper className="size-3.5" /> Magazin
        </p>
        <h1 className="font-display text-4xl font-bold tracking-tight">Wissen, das weiterhilft</h1>
        <p className="mt-3 text-muted-foreground">
          Sicherheit, Etikette, Steuern, Marketing — praxisnahe Artikel für beide Seiten.
        </p>
      </header>

      {!featured ? (
        <p className="rounded-2xl border border-dashed border-border py-16 text-center text-sm text-muted-foreground">
          Noch keine Artikel veröffentlicht.
        </p>
      ) : (
        <>
          <Link
            href={`/magazin/${featured.slug}`}
            className="mb-10 grid overflow-hidden rounded-3xl border border-border bg-card md:grid-cols-2"
          >
            <div className="relative aspect-16/10 bg-muted md:aspect-auto">
              {featured.coverUrl && (
                <Image
                  src={featured.coverUrl}
                  alt=""
                  fill
                  sizes="(max-width: 768px) 100vw, 50vw"
                  className="object-cover"
                  priority
                />
              )}
            </div>
            <div className="flex flex-col justify-center p-8">
              <Badge variant="default" size="sm" className="mb-4 w-fit capitalize">
                {featured.category}
              </Badge>
              <h2 className="font-display text-3xl font-bold leading-tight tracking-tight">{featured.title}</h2>
              {featured.excerpt && <p className="mt-4 text-muted-foreground">{featured.excerpt}</p>}
              <p className="mt-6 text-xs text-muted-foreground">
                {featured.publishedAt ? formatDate(featured.publishedAt) : ""} · {featured.readMinutes} Min. Lesezeit ·{" "}
                {featured.authorName}
              </p>
            </div>
          </Link>

          <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
            {rest.map((post) => (
              <Link
                key={post.id}
                href={`/magazin/${post.slug}`}
                className="overflow-hidden rounded-2xl border border-border bg-card"
              >
                <div className="relative aspect-16/9 bg-muted">
                  {post.coverUrl && (
                    <Image
                      src={post.coverUrl}
                      alt=""
                      fill
                      sizes="(max-width: 768px) 100vw, 33vw"
                      className="object-cover"
                    />
                  )}
                </div>
                <div className="p-5">
                  <Badge variant="neutral" size="sm" className="mb-3 capitalize">
                    {post.category}
                  </Badge>
                  <h3 className="line-clamp-2 text-base font-semibold leading-snug">{post.title}</h3>
                  {post.excerpt && <p className="mt-2 line-clamp-2 text-sm text-muted-foreground">{post.excerpt}</p>}
                  <p className="mt-3 text-xs text-muted-foreground">
                    {post.publishedAt ? formatDate(post.publishedAt) : ""} · {post.readMinutes} Min.
                  </p>
                </div>
              </Link>
            ))}
          </div>
        </>
      )}
    </div>
  );
}
