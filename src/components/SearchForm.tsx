"use client";
import { Search } from "lucide-react";
export default function SearchForm({ initial = "" }: { initial?: string }) {
 return <form action="/search" className="big-search"><Search size={20}/><input name="q" defaultValue={initial} placeholder="Search by anime title..." aria-label="Search by anime title"/><button type="submit">Search anime</button></form>;
}
