import { getAuth } from "@/server/auth";
export const GET = (r: Request) => getAuth().handler(r);
export const POST = (r: Request) => getAuth().handler(r);
