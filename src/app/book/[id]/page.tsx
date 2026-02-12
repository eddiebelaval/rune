import { createServerClient } from "@/lib/supabase";
import { redirect, notFound } from "next/navigation";
import type { Book, Session } from "@/types/database";
import SessionView from "@/components/SessionView";

interface BookPageProps {
  params: Promise<{ id: string }>;
}

export default async function BookPage({ params }: BookPageProps) {
  const { id } = await params;
  const supabase = await createServerClient();

  // Authenticate
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/");
  }

  // Fetch book and verify ownership
  const { data: book, error: bookError } = await supabase
    .from("books")
    .select("*")
    .eq("id", id)
    .eq("user_id", user.id)
    .single();

  if (bookError || !book) {
    notFound();
  }

  const typedBook = book as Book;

  // Fetch the latest session or create one
  let { data: sessions, error: sessionsError } = await supabase
    .from("sessions")
    .select("*")
    .eq("book_id", id)
    .order("session_number", { ascending: false })
    .limit(1);

  let currentSession: Session;

  if (sessionsError || !sessions || sessions.length === 0) {
    // No sessions exist yet -- create the first one
    const { data: newSession, error: createError } = await supabase
      .from("sessions")
      .insert({
        book_id: id,
        session_number: 1,
        mode: null,
        raw_transcript: null,
        summary: null,
        duration_seconds: null,
      })
      .select()
      .single();

    if (createError || !newSession) {
      throw new Error("Failed to create initial session");
    }

    currentSession = newSession as Session;
  } else {
    currentSession = sessions[0] as Session;
  }

  return (
    <div className="flex h-[calc(100dvh-3.5rem)] flex-col">
      {/* Book header bar */}
      <div className="flex items-center justify-between border-b border-rune-border bg-rune-surface px-6 py-3">
        <div className="flex items-center gap-3">
          <a
            href="/"
            className="text-rune-muted transition-colors duration-200 hover:text-rune-gold"
            aria-label="Back to library"
          >
            <svg
              xmlns="http://www.w3.org/2000/svg"
              fill="none"
              viewBox="0 0 24 24"
              strokeWidth={1.5}
              stroke="currentColor"
              className="h-5 w-5"
              aria-hidden="true"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                d="M10.5 19.5 3 12m0 0 7.5-7.5M3 12h18"
              />
            </svg>
          </a>
          <h1 className="font-serif text-lg text-rune-heading">
            {typedBook.title}
          </h1>
          <span className="label-mono rounded-sm border border-rune-border bg-rune-elevated px-2 py-0.5">
            {typedBook.book_type}
          </span>
        </div>
        <span className="label-mono">
          Session {currentSession.session_number}
        </span>
      </div>

      {/* Session workspace */}
      <SessionView
        bookId={typedBook.id}
        sessionId={currentSession.id}
        bookType={typedBook.book_type}
        qualityLevel={typedBook.quality_level}
        title={typedBook.title}
      />
    </div>
  );
}
