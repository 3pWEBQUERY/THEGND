import type { Metadata } from "next";
import Link from "next/link";
import Image from "next/image";
import { notFound } from "next/navigation";
import { ArrowLeft, Clock } from "lucide-react";
import { db } from "@/lib/db";
import { Badge } from "@/components/ui/badge";
import { formatDate, truncate } from "@/lib/utils";

type Params = Promise<{ slug: string }>;

export async function generateMetadata({ params }: { params: Params }): Promise<Metadata> {
  const { slug } = await params;
  const post = await db.blogPost.findFirst({ where: { slug, published: true } });
  if (!post) return { title: "Artikel nicht gefunden" };

  return {
    title: post.title,
    description: post.excerpt ?? truncate(post.body, 155),
    alternates: { canonical: `/magazin/${slug}` },
    openGraph: { title: post.title, description: post.excerpt ?? "", images: post.coverUrl ? [post.coverUrl] : undefined },
  };
}

export default async function ArticlePage({ params }: { params: Params }) {
  const { slug } = await params;
  const post = await db.blogPost.findFirst({ where: { slug, published: true } });
  if (!post) notFound();

  const related = await db.blogPost.findMany({
    where: { published: true, id: { not: post.id }, category: post.category },
    orderBy: { publishedAt: "desc" },
    take: 3,
  });

  return (
    <article className="mx-auto max-w-3xl px-4 py-10 sm:px-6">
      <Link
        href="/magazin"
        className="inline-flex items-center gap-1.5 text-sm text-muted-foreground transition-colors hover:text-foreground"
      >
        <ArrowLeft className="size-4" /> Alle Artikel
      </Link>

      <header className="mt-6">
        <Badge variant="default" size="sm" className="capitalize">
          {post.category}
        </Badge>
        <h1 className="mt-4 font-display text-4xl font-bold leading-tight tracking-tight sm:text-5xl">{post.title}</h1>
        {post.excerpt && <p className="mt-4 text-lg text-muted-foreground">{post.excerpt}</p>}
        <div className="mt-5 flex flex-wrap items-center gap-4 text-sm text-muted-foreground">
          <span>{post.authorName}</span>
          {post.publishedAt && <span>{formatDate(post.publishedAt)}</span>}
          <span className="flex items-center gap-1">
            <Clock className="size-3.5" /> {post.readMinutes} Min. Lesezeit
          </span>
        </div>
      </header>

      {post.coverUrl && (
        <div className="relative mt-8 aspect-16/9 overflow-hidden rounded-2xl bg-muted">
          <Image src={post.coverUrl} alt="" fill sizes="(max-width: 768px) 100vw, 768px" className="object-cover" priority />
        </div>
      )}

      <div className="mt-8 space-y-5 text-base leading-relaxed text-foreground/90">
        {post.body.split(/\n{2,}/).map((paragraph, i) =>
          paragraph.startsWith("## ") ? (
            <h2 key={i} className="pt-4 font-display text-2xl font-bold tracking-tight">
              {paragraph.replace("## ", "")}
            </h2>
          ) : paragraph.startsWith("- ") ? (
            <ul key={i} className="ml-5 list-disc space-y-1.5">
              {paragraph.split("\n").map((line, j) => (
                <li key={j}>{line.replace(/^- /, "")}</li>
              ))}
            </ul>
          ) : (
            <p key={i} className="whitespace-pre-line">
              {paragraph}
            </p>
          ),
        )}
      </div>

      {post.tags.length > 0 && (
        <div className="mt-10 flex flex-wrap gap-2 border-t border-border pt-6">
          {post.tags.map((tag) => (
            <Badge key={tag} variant="neutral" size="sm">
              #{tag}
            </Badge>
          ))}
        </div>
      )}

      {related.length > 0 && (
        <section className="mt-14">
          <h2 className="mb-5 font-display text-2xl font-bold tracking-tight">Weiterlesen</h2>
          <div className="grid gap-4 sm:grid-cols-3">
            {related.map((item) => (
              <Link
                key={item.id}
                href={`/magazin/${item.slug}`}
                className="rounded-2xl border border-border bg-card p-4 transition-colors hover:border-primary/40"
              >
                <p className="line-clamp-3 text-sm font-medium">{item.title}</p>
                <p className="mt-2 text-xs text-muted-foreground">{item.readMinutes} Min.</p>
              </Link>
            ))}
          </div>
        </section>
      )}
    </article>
  );
}
