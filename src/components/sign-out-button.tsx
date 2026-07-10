"use client";

import { useRouter } from "next/navigation";
import { signOut } from "@/lib/auth-client";

export function SignOutButton() {
  const router = useRouter();
  return (
    <button
      onClick={async () => {
        await signOut();
        router.push("/login");
      }}
      className="ui-button-secondary px-4 py-2 text-sm font-semibold"
    >
      Sign out
    </button>
  );
}
