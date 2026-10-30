Deno.serve((req) => {
  const h: Record<string,string> = {};
  for (const [k,v] of req.headers) if (/ip|forward|real|cf-|via|x-/i.test(k)) h[k]=v;
  return new Response(JSON.stringify(h,null,1),{headers:{"Content-Type":"application/json"}});
});
