import { createServerClient } from "@/lib/supabase";
import { redirect } from "next/navigation";
import NewBookForm from "@/components/NewBookForm";

export default async function NewBookPage() {
  const supabase = await createServerClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/auth");
  }

  return (
    <div className="flex min-h-[calc(100dvh-3.5rem)] items-center justify-center px-6 py-12">
      <NewBookForm />
    </div>
  );
}
