"use client";

import { SignUp } from "@clerk/nextjs";
import { dark } from "@clerk/themes";

export default function SignUpPage() {
  return (
    <SignUp
      appearance={{
        baseTheme: dark
      }}
      redirectUrl="/dashboard"
    />
  );
} 