"use client";

import { useSupabaseSession } from "@/components/supabaseSessionProvider";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

export default function Home() {
  const session = useSupabaseSession();

  if (!session) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-muted">
        <Card className="w-full max-w-md shadow-lg">
          <CardHeader>
            <CardTitle>
              <h1>Welcome</h1>
            </CardTitle>
          </CardHeader>
          <CardContent>
            <Link href="/auth">
              <Button  className="w-full">
                Sign In / Sign Up
              </Button>
            </Link>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-muted">
      <Card className="w-full max-w-md shadow-lg">
        <CardHeader>
          <CardTitle>
            <h1>Home</h1>
          </CardTitle>
        </CardHeader>
        <CardContent>
          <h1 className="mb-4">
            Welcome, <span className="font-semibold">{session.user.email}</span>
            !
          </h1>
          <Link href="/protected">
            <Button className="w-full">Go to Protected</Button>
          </Link>
        </CardContent>
      </Card>
    </div>
  );
}
