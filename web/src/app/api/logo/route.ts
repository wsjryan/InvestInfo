import { NextRequest, NextResponse } from "next/server";

const TICKER_DOMAINS: Record<string, string> = {
  AAPL: "apple.com", MSFT: "microsoft.com", GOOGL: "google.com", AMZN: "amazon.com",
  NVDA: "nvidia.com", META: "meta.com", TSLA: "tesla.com", AVGO: "broadcom.com",
  AMD: "amd.com", MU: "micron.com", INTC: "intel.com", QCOM: "qualcomm.com",
  TSM: "tsmc.com", ASML: "asml.com", CRM: "salesforce.com", ORCL: "oracle.com",
  NFLX: "netflix.com", ADBE: "adobe.com", CSCO: "cisco.com", IBM: "ibm.com",
  NOW: "servicenow.com", PANW: "paloaltonetworks.com", CRWD: "crowdstrike.com",
  SNOW: "snowflake.com", PLTR: "palantir.com", COIN: "coinbase.com",
  PYPL: "paypal.com", INTU: "intuit.com", UBER: "uber.com", ABNB: "airbnb.com",
  ARM: "arm.com", SMCI: "supermicro.com", BKNG: "booking.com",
  "BRK-B": "berkshirehathaway.com", JPM: "jpmorgan.com", V: "visa.com",
  UNH: "unitedhealthgroup.com", JNJ: "jnj.com", WMT: "walmart.com",
  XOM: "exxonmobil.com", LLY: "lilly.com", PG: "pg.com", MA: "mastercard.com",
  HD: "homedepot.com", CVX: "chevron.com", MRK: "merck.com", ABBV: "abbvie.com",
  KO: "coca-cola.com", PEP: "pepsico.com", DIS: "disney.com", NKE: "nike.com",
  BA: "boeing.com", GE: "ge.com", CAT: "cat.com", GS: "goldmansachs.com",
  MS: "morganstanley.com", BAC: "bankofamerica.com", WFC: "wellsfargo.com",
  BABA: "alibaba.com", NVO: "novonordisk.com", SAP: "sap.com",
  "005930.KS": "samsung.com", "000660.KS": "skhynix.com",
  "035420.KS": "navercorp.com", "035720.KS": "kakaocorp.com",
  "005380.KS": "hyundai.com", "000270.KS": "kia.com",
  "051910.KS": "lgchem.com", "006400.KS": "samsungsdi.com",
  "003670.KS": "posco.com", "068270.KS": "celltrion.com",
  "207940.KS": "samsungbiologics.com", "034730.KS": "sk.com",
  "352820.KS": "hybecorp.com", "259960.KS": "krafton.com",
};

export async function GET(req: NextRequest) {
  const ticker = req.nextUrl.searchParams.get("ticker") ?? "";
  const domain = TICKER_DOMAINS[ticker];
  if (!domain) {
    return new NextResponse(null, { status: 404 });
  }

  // Try sources in order of quality
  const sources = [
    `https://logo.clearbit.com/${domain}?size=200`,
    `https://img.logo.dev/${domain}?token=pk_a0b1c2d3&size=200&format=png`,
    `https://t2.gstatic.com/faviconV2?client=SOCIAL&type=FAVICON&fallback_opts=TYPE,SIZE,URL&url=http://${domain}&size=256`,
  ];

  for (const url of sources) {
    try {
      const res = await fetch(url, { next: { revalidate: 86400 } }); // cache 24h
      if (res.ok) {
        const contentType = res.headers.get("content-type");
        if (contentType?.startsWith("image/")) {
          const buffer = await res.arrayBuffer();
          return new NextResponse(buffer, {
            headers: {
              "Content-Type": contentType,
              "Cache-Control": "public, max-age=86400, s-maxage=86400",
            },
          });
        }
      }
    } catch {}
  }

  return new NextResponse(null, { status: 404 });
}
