import { SignupForm } from "@/components/auth/SignupForm";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Sign Up | HomeDirectly",
  description: "Create your HomeDirectly account to buy or sell property",
};

export default function SignupPage() {
  return <SignupForm />;
}
