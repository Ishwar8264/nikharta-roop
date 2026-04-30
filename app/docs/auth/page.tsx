import { redirect } from "next/navigation";

export default function AuthDocsRedirectPage() {
  redirect("/docs/api");
}
