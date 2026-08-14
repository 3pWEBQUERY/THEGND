"use client";

import * as React from "react";
import Link from "next/link";
import Image from "next/image";
import { useActionState } from "react";
import { BadgeCheck, Expand, Heart, Lock, MessageCircle, Send, Share2 } from "lucide-react";
import { toast } from "sonner";
import { createCommentAction, togglePostLikeAction } from "@/server/actions/interactions";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { AvatarFallback, AvatarImage, AvatarRoot } from "@/components/ui/primitives";
import { MediaLightbox } from "@/components/media/media-lightbox";
import { cn, initials, timeAgo } from "@/lib/utils";

type Post = {
  id: string;
  body: string;
  mediaUrl: string | null;
  visibility: "PUBLIC" | "FOLLOWERS" | "PAID";
  unlockCost: number;
  likeCount: number;
  commentCount: number;
  createdAt: string;
  profile: {
    slug: string;
    displayName: string;
    isVerified: boolean;
    city: { name: string } | null;
    media: { url: string; thumbUrl: string | null }[];
  };
  comments: { id: string; body: string; createdAt: string; author: { displayName: string | null; avatarUrl: string | null } }[];
};

export function PostCard({ post, liked, isLoggedIn }: { post: Post; liked: boolean; isLoggedIn: boolean }) {
  const [isLiked, setIsLiked] = React.useState(liked);
  const [likes, setLikes] = React.useState(post.likeCount);
  const [showComments, setShowComments] = React.useState(false);
  const [grossansicht, setGrossansicht] = React.useState(false);
  const [, startTransition] = React.useTransition();
  const [state, action, pending] = useActionState(createCommentAction, {});
  const formRef = React.useRef<HTMLFormElement>(null);

  React.useEffect(() => {
    if (state.ok) formRef.current?.reset();
    else if (state.message) toast.error(state.message);
  }, [state]);

  const toggleLike = () => {
    if (!isLoggedIn) return toast.error("Bitte melde dich an.");
    const next = !isLiked;
    setIsLiked(next);
    setLikes((v) => v + (next ? 1 : -1));
    startTransition(async () => {
      const res = await togglePostLikeAction(post.id);
      if (!res.ok) {
        setIsLiked(!next);
        setLikes((v) => v + (next ? -1 : 1));
      }
    });
  };

  const avatar = post.profile.media[0]?.thumbUrl ?? post.profile.media[0]?.url;
  const locked = post.visibility === "PAID" && post.unlockCost > 0;

  return (
    <Card className="overflow-hidden">
      <div className="flex items-center gap-3 p-4">
        <Link href={`/escort/${post.profile.slug}`}>
          <AvatarRoot className="size-10">
            {avatar && <AvatarImage src={avatar} alt="" />}
            <AvatarFallback>{initials(post.profile.displayName)}</AvatarFallback>
          </AvatarRoot>
        </Link>
        <div className="min-w-0 flex-1">
          <Link href={`/escort/${post.profile.slug}`} className="flex items-center gap-1.5 font-semibold hover:text-primary">
            <span className="truncate">{post.profile.displayName}</span>
            {post.profile.isVerified && <BadgeCheck className="size-4 shrink-0 text-info" />}
          </Link>
          <p className="text-xs text-muted-foreground">
            {post.profile.city?.name ? `${post.profile.city.name} · ` : ""}
            {timeAgo(post.createdAt)}
          </p>
        </div>
        {post.visibility !== "PUBLIC" && (
          <Badge variant="neutral" size="sm">
            {post.visibility === "PAID" ? `${post.unlockCost} C` : "Follower"}
          </Badge>
        )}
      </div>

      <p className="whitespace-pre-line px-4 pb-3 text-sm leading-relaxed">{post.body}</p>

      {post.mediaUrl &&
        /*
         * Gesperrte Medien bleiben unantastbar — sonst öffnet ein Klick die
         * Grossansicht, wie in der Galerie eines Inserats.
         */
        (locked ? (
          <div className="relative aspect-4/3 bg-muted">
            <Image
              src={post.mediaUrl}
              alt=""
              fill
              sizes="(max-width: 1024px) 100vw, 640px"
              className="object-cover blur-2xl"
            />
            <span className="absolute inset-0 grid place-items-center">
              <span className="flex flex-col items-center gap-2 rounded-2xl bg-black/60 px-6 py-5 text-white backdrop-blur-md">
                <Lock className="size-6" />
                <span className="text-sm font-medium">Für {post.unlockCost} Credits freischalten</span>
              </span>
            </span>
          </div>
        ) : (
          <button
            type="button"
            onClick={() => setGrossansicht(true)}
            aria-label={`Bild von ${post.profile.displayName} gross ansehen`}
            className="group relative block aspect-4/3 w-full bg-muted outline-none focus-visible:ring-2 focus-visible:ring-ring/40"
          >
            <Image
              src={post.mediaUrl}
              alt=""
              fill
              sizes="(max-width: 1024px) 100vw, 640px"
              className="object-cover"
            />
            <span className="absolute top-3 right-3 grid size-9 place-items-center rounded-xl bg-black/50 text-white opacity-0 backdrop-blur-md transition-opacity group-hover:opacity-100">
              <Expand className="size-4" />
            </span>
          </button>
        ))}

      {post.mediaUrl && !locked && (
        <MediaLightbox
          items={[{ id: post.id, url: post.mediaUrl, type: "IMAGE", caption: post.body }]}
          titel={`Beitrag von ${post.profile.displayName}`}
          offen={grossansicht}
          onOpenChange={setGrossansicht}
        />
      )}

      <div className="flex items-center gap-1 border-t border-border px-2 py-1.5">
        <Button variant="ghost" size="sm" onClick={toggleLike}>
          <Heart className={cn("size-4", isLiked && "fill-primary text-primary")} />
          {likes > 0 && likes}
        </Button>
        <Button variant="ghost" size="sm" onClick={() => setShowComments((v) => !v)}>
          <MessageCircle className="size-4" />
          {post.commentCount > 0 && post.commentCount}
        </Button>
        <Button
          variant="ghost"
          size="sm"
          className="ml-auto"
          onClick={() => {
            navigator.clipboard.writeText(`${window.location.origin}/escort/${post.profile.slug}`);
            toast.success("Link kopiert");
          }}
        >
          <Share2 className="size-4" />
        </Button>
      </div>

      {showComments && (
        <div className="space-y-3 border-t border-border p-4">
          {post.comments.map((comment) => (
            <div key={comment.id} className="flex gap-2.5">
              <AvatarRoot className="size-8">
                {comment.author.avatarUrl && <AvatarImage src={comment.author.avatarUrl} alt="" />}
                <AvatarFallback>{initials(comment.author.displayName)}</AvatarFallback>
              </AvatarRoot>
              <div className="min-w-0 flex-1 rounded-xl bg-muted/60 px-3 py-2">
                <p className="text-xs font-semibold">{comment.author.displayName ?? "Mitglied"}</p>
                <p className="mt-0.5 text-sm">{comment.body}</p>
              </div>
            </div>
          ))}

          {isLoggedIn ? (
            <form ref={formRef} action={action} className="flex gap-2">
              <input type="hidden" name="postId" value={post.id} />
              <input
                name="body"
                required
                maxLength={1000}
                placeholder="Kommentieren…"
                className="h-10 flex-1 rounded-xl border border-border bg-background px-3 text-sm outline-none focus-visible:border-ring"
              />
              <Button type="submit" size="icon" variant="brand" loading={pending} aria-label="Senden">
                {!pending && <Send className="size-4" />}
              </Button>
            </form>
          ) : (
            <p className="text-center text-xs text-muted-foreground">
              <Link href="/login" className="text-primary hover:underline">
                Anmelden
              </Link>{" "}
              zum Kommentieren
            </p>
          )}
        </div>
      )}
    </Card>
  );
}
