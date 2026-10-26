import {NextResponse} from "next/server";import {getAnime} from "@/lib/api";
export async function GET(_request:Request,{params}:{params:Promise<{id:string}>}){const {id}=await params;const data=await getAnime(id);return data?NextResponse.json({data}):NextResponse.json({error:"Anime not found"}, {status:404});}
