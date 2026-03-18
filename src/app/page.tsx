import { createServerClient } from "@/lib/supabase";
import type { Book } from "@/types/database";
import Link from "next/link";
import AppFooter from "@/components/AppFooter";
import BookCardMenu from "@/components/BookCardMenu";
import LandingPage from "@/components/landing/LandingPage";

function formatDate(dateString: string): string {
  const date = new Date(dateString);
  return date.toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
  });
}

function timeAgo(dateString: string): string {
  const diff = Date.now() - new Date(dateString).getTime();
  const minutes = Math.floor(diff / 60000);
  if (minutes < 60) return `${minutes}m ago`;
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `${hours}h ago`;
  const days = Math.floor(hours / 24);
  if (days < 7) return `${days}d ago`;
  return formatDate(dateString);
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
    <div className="group relative rounded-lg border border-rune-border bg-rune-surface transition-colors duration-200 hover:border-rune-gold hover:bg-rune-elevated">
      <Link
        href={`/book/${book.id}`}
        className="flex flex-col justify-between p-6"
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
      <div className="absolute right-3 top-3">
        <BookCardMenu book={book} />
      </div>
    </div>
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

function StatCard({ label, value }: { label: string; value: string }) {
  return (
    <div
      className="rounded-lg border p-4"
      style={{
        backgroundColor: 'var(--rune-surface)',
        borderColor: 'var(--rune-border)',
      }}
    >
      <p className="label-mono mb-1">{label}</p>
      <p className="font-serif text-xl" style={{ color: 'var(--rune-heading)' }}>
        {value}
      </p>
    </div>
  );
}

function ContinueWritingCard({ book }: { book: Book }) {
  return (
    <Link
      href={`/book/${book.id}`}
      className="group flex items-center gap-4 rounded-lg border p-5 transition-colors duration-200"
      style={{
        backgroundColor: 'color-mix(in srgb, var(--rune-gold) 5%, var(--rune-surface))',
        borderColor: 'color-mix(in srgb, var(--rune-gold) 20%, var(--rune-border))',
      }}
    >
      <div
        className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg"
        style={{
          backgroundColor: 'color-mix(in srgb, var(--rune-gold) 15%, transparent)',
        }}
      >
        <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="h-5 w-5" style={{ color: 'var(--rune-gold)' }}>
          <path strokeLinecap="round" strokeLinejoin="round" d="m16.862 4.487 1.687-1.688a1.875 1.875 0 1 1 2.652 2.652L10.582 16.07a4.5 4.5 0 0 1-1.897 1.13L6 18l.8-2.685a4.5 4.5 0 0 1 1.13-1.897l8.932-8.931Zm0 0L19.5 7.125M18 14v4.75A2.25 2.25 0 0 1 15.75 21H5.25A2.25 2.25 0 0 1 3 18.75V8.25A2.25 2.25 0 0 1 5.25 6H10" />
        </svg>
      </div>
      <div className="flex-1">
        <p className="text-xs" style={{ color: 'var(--rune-muted)' }}>
          Continue writing
        </p>
        <p className="font-serif text-base transition-colors duration-200 group-hover:text-rune-gold" style={{ color: 'var(--rune-heading)' }}>
          {book.title}
        </p>
      </div>
      <span className="label-mono">{timeAgo(book.updated_at)}</span>
      <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="h-4 w-4 text-rune-muted transition-colors duration-200 group-hover:text-rune-gold">
        <path strokeLinecap="round" strokeLinejoin="round" d="m8.25 4.5 7.5 7.5-7.5 7.5" />
      </svg>
    </Link>
  );
}

export default async function Home() {
  const supabase = await createServerClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return (
      <div>
        <LandingPage />
        <AppFooter />
      </div>
    );
  }

  const { data: booksData } = await supabase
    .from("books")
    .select("*")
    .eq("user_id", user.id)
    .order("updated_at", { ascending: false });

  const books = (booksData as Book[]) ?? [];
  const bookIds = books.map((b) => b.id);

  const { count: sessionCount } = bookIds.length > 0
    ? await supabase
        .from("sessions")
        .select("*", { count: "exact", head: true })
        .in("book_id", bookIds)
    : { count: 0 };
  const activeBooks = books.filter((b) => b.status === "active");
  const mostRecent = activeBooks[0] ?? books[0];
  const displayName = user.user_metadata?.full_name ?? user.email?.split("@")[0] ?? "Writer";

  return (
    <div className="flex min-h-dvh flex-col">
      <section className="mx-auto w-full max-w-5xl flex-1 px-6 py-10">
        <div className="mb-8">
          <h1 className="mb-1 font-serif text-2xl text-rune-heading">
            Welcome back, {displayName}
          </h1>
          <p className="text-sm text-rune-muted">
            {books.length === 0
              ? "Ready to start writing?"
              : `You have ${activeBooks.length} active ${activeBooks.length === 1 ? "book" : "books"}.`}
          </p>
        </div>

        {mostRecent && (
          <div className="mb-8">
            <ContinueWritingCard book={mostRecent} />
          </div>
        )}

        {books.length > 0 && (
          <div className="mb-8 grid grid-cols-3 gap-4">
            <StatCard label="Books" value={String(books.length)} />
            <StatCard label="Sessions" value={String(sessionCount ?? 0)} />
            <StatCard label="Active" value={String(activeBooks.length)} />
          </div>
        )}

        <div className="mb-6 flex items-center justify-between">
          <h2 className="font-serif text-xl text-rune-heading">
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
              Sam will help you shape your first draft.
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
    </div>
  );
}
