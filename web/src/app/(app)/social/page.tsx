import { redirect } from "next/navigation";

export default function SocialPage() {
  redirect("/explorar?share=1");
}