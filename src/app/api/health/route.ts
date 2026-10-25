import {NextResponse} from "next/server";import {apiHealth} from "@/lib/api";
export const dynamic="force-dynamic";
export async function GET(){const status=await apiHealth();return NextResponse.json(status,{status:status.reachable?200:503});}
