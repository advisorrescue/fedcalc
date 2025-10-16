import { NextResponse } from "next/server";

async function getZohoAccessToken() {
  const dc = process.env.ZOHO_DC || "com";
  const r = await fetch(
    `https://accounts.zoho.${dc}/oauth/v2/token` +
      `?refresh_token=${encodeURIComponent(process.env.ZOHO_REFRESH_TOKEN!)}` +
      `&client_id=${encodeURIComponent(process.env.ZOHO_CLIENT_ID!)}` +
      `&client_secret=${encodeURIComponent(process.env.ZOHO_CLIENT_SECRET!)}` +
      `&grant_type=refresh_token`,
    { method: "POST" }
  );
  if (!r.ok) throw new Error("Zoho token request failed");
  const j = await r.json();
  return j.access_token as string;
}

async function createZohoLead(payload: any) {
  const dc = process.env.ZOHO_DC || "com";
  const token = await getZohoAccessToken();
  const body = {
    data: [
      {
        Last_Name: payload.name?.split(" ").slice(-1).join(" ") || "Website Lead",
        First_Name: payload.name?.split(" ").slice(0, -1).join(" ") || "",
        Email: payload.email || "",
        Phone: payload.phone || "",
        State: payload.state || "",
        Lead_Source: "Fed Rate Calculator",
        Description: `Product: ${payload.product}\nΔ bps: ${payload.delta_bps}\nΔ income (est): ${payload.est_delta_income}\nConsent: ${payload.leadConsent}\nUTM: ${payload.utm_source}/${payload.utm_medium}/${payload.utm_campaign}`,
      },
    ],
    trigger: ["workflow"],
  };

  const r = await fetch(`https://www.zohoapis.${dc}/crm/v2/Leads`, {
    method: "POST",
    headers: {
      Authorization: `Zoho-oauthtoken ${token}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify(body),
  });
  const j = await r.json();
  if (!r.ok || j.data?.[0]?.status !== "success") {
    throw new Error("Zoho lead create failed: " + JSON.stringify(j));
  }
  return j;
}

async function emailTeam(payload: any) {
  const apiKey = process.env.RESEND_API_KEY!;
  const to = process.env.TEAM_NOTIFY_EMAIL!;
  const from = process.env.FROM_EMAIL || "leads@planliferight.com";

  const html = `
    <h3>New Calculator Lead</h3>
    <p><b>Name:</b> ${payload.name || ""}<br/>
    <b>Email:</b> ${payload.email || ""}<br/>
    <b>Phone:</b> ${payload.phone || ""}<br/>
    <b>State:</b> ${payload.state || ""}<br/>
    <b>Product:</b> ${payload.product || ""}<br/>
    <b>Δ bps:</b> ${payload.delta_bps || ""}<br/>
    <b>Δ income (est):</b> ${payload.est_delta_income || ""}<br/>
    <b>Consent:</b> ${payload.leadConsent ? "Yes" : "No"}<br/>
    <b>UTM:</b> ${payload.utm_source}/${payload.utm_medium}/${payload.utm_campaign}</p>
  `;

  await fetch("https://api.resend.com/emails", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${apiKey}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({ from, to, subject: "New Fed Rate Calculator Lead", html }),
  });
}

export async function POST(req: Request) {
  try {
    const payload = await req.json();
    if (!payload?.email || !payload?.name) {
      return NextResponse.json({ ok: false, error: "name and email required" }, { status: 400 });
    }

    const [zoho] = await Promise.all([
      createZohoLead(payload).catch((e) => ({ error: String(e) })),
      emailTeam(payload).catch(() => null),
    ]);

    return NextResponse.json({ ok: true, zoho });
  } catch (e: any) {
    return NextResponse.json({ ok: false, error: String(e) }, { status: 500 });
  }
}
