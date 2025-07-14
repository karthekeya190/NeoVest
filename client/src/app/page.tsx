'use client';

import { useEffect, useState } from "react";
import { auth } from "@/lib/firebaseClient";

export default function TestFirebasePage() {
  const [user, setUser] = useState<any>(null);

  useEffect(() => {
    const unsub = auth.onAuthStateChanged(setUser);
    return () => unsub();
  }, []);

  return (
    <div className="p-4">
      <h1 className="text-xl font-bold">Firebase Test</h1>
      {user ? <p>Logged in as {user.email}</p> : <p>No user logged in</p>}
    </div>
  );
}
