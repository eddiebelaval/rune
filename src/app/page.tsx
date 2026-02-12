import { createServerClient } from "@/lib/supabase";
import type { Book } from "@/types/database";
import Link from "next/link";

function formatDate(dateString: string): string {
  const date = new Date(dateString);
  return date.toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
  });
}

function BookTypeBadge({ type }: { type: Book["book_type"] }) {
  const labels: Record<Book["book_type"], string> = {
    memoir: "Memoir",
    fiction: "Fiction",
    nonfiction: "Non-Fiction",
  };

  return (
    <span className="label-mono inline-block rounded-sm border border-rune-border bg-rune-elevated px-2 py-0.5">
      {labels[type]}
    </span>
  );
}

function StatusIndicator({ status }: { status: Book["status"] }) {
  const colors: Record<Book["status"], string> = {
    active: "bg-rune-gold",
    paused: "bg-rune-muted",
    completed: "bg-rune-teal",
  };

  return (
    <span
      className={`inline-block h-2 w-2 rounded-full ${colors[status]}`}
      aria-label={`Status: ${status}`}
    />
  );
}

function BookCard({ book }: { book: Book }) {
  return (
    <Link
      href={`/book/${book.id}`}
      className="group flex flex-col justify-between rounded-lg border border-rune-border bg-rune-surface p-6 transition-colors duration-200 hover:border-rune-gold hover:bg-rune-elevated"
    >
      <div>
        <div className="mb-3 flex items-center justify-between">
          <BookTypeBadge type={book.book_type} />
          <StatusIndicator status={book.status} />
        </div>
        <h3 className="mb-2 font-serif text-lg text-rune-heading transition-colors duration-200 group-hover:text-rune-gold">
          {book.title}
        </h3>
      </div>
      <p className="label-mono mt-4">
        Last updated {formatDate(book.updated_at)}
      </p>
    </Link>
  );
}

function NewBookCard() {
  return (
    <Link
      href="/book/new"
      className="group flex min-h-[180px] flex-col items-center justify-center rounded-lg border border-dashed border-rune-border bg-rune-surface p-6 transition-colors duration-200 hover:border-rune-gold hover:bg-rune-elevated"
    >
      <svg
        xmlns="http://www.w3.org/2000/svg"
        fill="none"
        viewBox="0 0 24 24"
        strokeWidth={1.5}
        stroke="currentColor"
        className="mb-3 h-8 w-8 text-rune-muted transition-colors duration-200 group-hover:text-rune-gold"
        aria-hidden="true"
      >
        <path
          strokeLinecap="round"
          strokeLinejoin="round"
          d="M12 4.5v15m7.5-7.5h-15"
        />
      </svg>
      <span className="font-serif text-rune-muted transition-colors duration-200 group-hover:text-rune-gold">
        Start a new book
      </span>
    </Link>
  );
}

function SignInButton() {
  return (
    <Link
      href="/auth"
      className="inline-flex items-center gap-2 rounded-lg border border-rune-gold bg-transparent px-6 py-3 font-sans text-sm font-medium text-rune-gold transition-colors duration-200 hover:bg-rune-gold hover:text-rune-bg focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-rune-gold"
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
          d="M15.75 9V5.25A2.25 2.25 0 0 0 13.5 3h-6a2.25 2.25 0 0 0-2.25 2.25v13.5A2.25 2.25 0 0 0 7.5 21h6a2.25 2.25 0 0 0 2.25-2.25V15m3 0 3-3m0 0-3-3m3 3H9"
        />
      </svg>
      Sign in
    </Link>
  );
}

export default async function Home() {
  const supabase = await createServerClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  let books: Book[] = [];

  if (user) {
    const { data } = await supabase
      .from("books")
      .select("*")
      .eq("user_id", user.id)
      .order("updated_at", { ascending: false });

    books = (data as Book[]) ?? [];
  }

  return (
    <div className="flex min-h-[calc(100dvh-3.5rem)] flex-col">
      {/* Hero Section */}
      <section className="flex flex-1 flex-col items-center justify-center px-6 py-20 text-center">
        <h1 className="mb-4 max-w-2xl font-serif text-4xl leading-tight text-rune-heading sm:text-5xl md:text-6xl">
          Your story, your voice.
        </h1>
        <p className="mb-8 max-w-lg text-lg text-rune-muted">
          Rune is your AI ghost writer. Just talk, and watch your book take
          shape. No outlines, no blank pages -- just conversation.
        </p>

        {!user && (
          <div className="flex flex-col items-center gap-4">
            <SignInButton />
            <p className="text-sm text-rune-muted">
              Free to start. Your words stay yours.
            </p>
          </div>
        )}
      </section>

      {/* Book Library */}
      {user && (
        <section className="mx-auto w-full max-w-5xl px-6 pb-20">
          <div className="mb-6 flex items-center justify-between">
            <h2 className="font-serif text-2xl text-rune-heading">
              Your Library
            </h2>
            <span className="label-mono">
              {books.length} {books.length === 1 ? "book" : "books"}
            </span>
          </div>

          {books.length === 0 ? (
            <div className="flex flex-col items-center justify-center rounded-lg border border-dashed border-rune-border bg-rune-surface px-6 py-16 text-center">
              <svg
                xmlns="http://www.w3.org/2000/svg"
                fill="none"
                viewBox="0 0 24 24"
                strokeWidth={1}
                stroke="currentColor"
                className="mb-4 h-12 w-12 text-rune-muted"
                aria-hidden="true"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  d="M12 6.042A8.967 8.967 0 0 0 6 3.75c-1.052 0-2.062.18-3 .512v14.25A8.987 8.987 0 0 1 6 18c2.305 0 4.408.867 6 2.292m0-14.25a8.966 8.966 0 0 1 6-2.292c1.052 0 2.062.18 3 .512v14.25A8.987 8.987 0 0 0 18 18a8.967 8.967 0 0 0-6 2.292m0-14.25v14.25"
                />
              </svg>
              <h3 className="mb-2 font-serif text-xl text-rune-heading">
                Your shelf is empty
              </h3>
              <p className="mb-6 max-w-sm text-sm text-rune-muted">
                Every great book begins with a conversation. Start talking and
                Rune will help you shape your first draft.
              </p>
              <Link
                href="/book/new"
                className="inline-flex items-center gap-2 rounded-lg bg-rune-gold px-5 py-2.5 font-sans text-sm font-medium text-rune-bg transition-colors duration-200 hover:bg-rune-teal"
              >
                Start your first book
              </Link>
            </div>
          ) : (
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
              {books.map((book) => (
                <BookCard key={book.id} book={book} />
              ))}
              <NewBookCard />
            </div>
          )}
        </section>
      )}
    </div>
  );
}
