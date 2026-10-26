import {NextResponse} from "next/server";import {getEpisodes} from "@/lib/api";
export async function GET(_request:Request,{params}:{params:Promise<{id:string}>}){const {id}=await params;const data=await getEpisodes(id);return NextResponse.json({data,count:data.length},{headers:{"Cache-Control":"public, s-maxage=120, stale-while-revalidate=300"}});}
