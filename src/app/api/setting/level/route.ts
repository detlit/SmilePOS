// src/app/api/groupA/[id]/route.ts
export const GET = async (req: Request) => {
  return new Response(JSON.stringify({ message: "ok" }), {
    headers: { "Content-Type": "application/json" },
  });
};
