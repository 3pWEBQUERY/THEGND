import type { Metadata } from "next";
import Link from "next/link";
import { Newspaper } from "lucide-react";
import { db } from "@/lib/db";
import { PageHeader, EmptyState } from "@/components/dashboard/page-header";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { formatDate } from "@/lib/utils";

export const metadata: Metadata = { title: "Magazin · Admin" };

export default async function AdminBlogPage() {
  const posts = await db.blogPost.findMany({ orderBy: { createdAt: "desc" }, take: 60 });

  return (
    <>
      <PageHeader
        title="Magazin"
        description="Artikel werden im Seed oder direkt in der Datenbank gepflegt (Prisma Studio)."
      />

      {posts.length === 0 ? (
        <EmptyState icon={Newspaper} title="Noch keine Artikel" description="Lege Beiträge über den Seed oder Prisma Studio an." />
      ) : (
        <Card className="divide-y divide-border">
          {posts.map((post) => (
            <div key={post.id} className="flex flex-wrap items-center justify-between gap-3 p-4">
              <div className="min-w-0">
                <p className="truncate font-medium">{post.title}</p>
                <p className="text-xs text-muted-foreground">
                  /{post.slug} · {post.category} · {post.readMinutes} Min.
                  {post.publishedAt ? ` · ${formatDate(post.publishedAt)}` : ""}
                </p>
              </div>
              <div className="flex items-center gap-2">
                <Badge size="sm" variant={post.published ? "success" : "neutral"}>
                  {post.published ? "veröffentlicht" : "Entwurf"}
                </Badge>
                {post.published && (
                  <Link href={`/magazin/${post.slug}`} target="_blank" className="text-xs text-primary hover:underline">
                    ansehen ↗
                  </Link>
                )}
              </div>
            </div>
          ))}
        </Card>
      )}
    </>
  );
}
