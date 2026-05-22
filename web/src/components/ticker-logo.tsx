"use client";

import { useState } from "react";

// Map tickers to company domains for logo fetching
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
  "035900.KS": "jypentertainment.com", "352820.KS": "hybecorp.com",
  "259960.KS": "krafton.com",
};

interface TickerLogoProps {
  ticker: string;
  size?: number;
  className?: string;
}

export function TickerLogo({ ticker, size = 28, className = "" }: TickerLogoProps) {
  const [failed, setFailed] = useState(false);
  const domain = TICKER_DOMAINS[ticker];

  if (!domain || failed) {
    // Fallback: colored circle with first letter
    const letter = ticker.replace(/\d.*/g, "").charAt(0).toUpperCase();
    return (
      <div
        className={`shrink-0 rounded-full bg-slate-200 dark:bg-zinc-700 flex items-center justify-center text-xs font-bold text-slate-500 dark:text-zinc-400 ${className}`}
        style={{ width: size, height: size }}
      >
        {letter}
      </div>
    );
  }

  return (
    // eslint-disable-next-line @next/next/no-img-element
    <img
      src={`https://www.google.com/s2/favicons?sz=128&domain=${domain}`}
      alt={ticker}
      width={size}
      height={size}
      className={`shrink-0 rounded-full bg-white ${className}`}
      onError={() => setFailed(true)}
    />
  );
}
