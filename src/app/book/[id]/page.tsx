import { createServerClient } from "@/lib/supabase";
import { redirect, notFound } from "next/navigation";
import type { Book, Session } from "@/types/database";
import BookWorkspace from "@/components/BookWorkspace";

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

  // Fetch ALL sessions for sidebar display
  const { data: sessions } = await supabase
    .from("sessions")
    .select("*")
    .eq("book_id", id)
    .order("session_number", { ascending: true });

  let currentSession: Session;

  if (!sessions || sessions.length === 0) {
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
    // Default to latest session
    currentSession = sessions[sessions.length - 1] as Session;
  }

  return (
    <BookWorkspace
      book={typedBook}
      initialSessionId={currentSession.id}
    />
  );
}
