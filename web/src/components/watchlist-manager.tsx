"use client";

import { useState, useRef } from "react";
import { TickerLogo } from "@/components/ticker-logo";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import {
  Dialog,
  DialogTrigger,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogClose,
} from "@/components/ui/dialog";

export interface WatchlistItem {
  ticker: string;
  name: string;
  market: string;
}

interface WatchlistManagerProps {
  items: WatchlistItem[];
  selected: string;
  onSelect: (ticker: string) => void;
  onAdd: (item: WatchlistItem) => void;
  onRemove: (ticker: string) => void;
  onReorder: (items: WatchlistItem[]) => void;
}

const SUGGESTIONS: WatchlistItem[] = [
  // ── NASDAQ Top ~100 by Market Cap ──────────────────────────────
  { ticker: "AAPL", name: "Apple", market: "NASDAQ" },
  { ticker: "MSFT", name: "Microsoft", market: "NASDAQ" },
  { ticker: "GOOGL", name: "Alphabet (Google)", market: "NASDAQ" },
  { ticker: "AMZN", name: "Amazon", market: "NASDAQ" },
  { ticker: "NVDA", name: "NVIDIA", market: "NASDAQ" },
  { ticker: "META", name: "Meta (Facebook)", market: "NASDAQ" },
  { ticker: "TSLA", name: "Tesla", market: "NASDAQ" },
  { ticker: "AVGO", name: "Broadcom", market: "NASDAQ" },
  { ticker: "COST", name: "Costco", market: "NASDAQ" },
  { ticker: "NFLX", name: "Netflix", market: "NASDAQ" },
  { ticker: "AMD", name: "AMD", market: "NASDAQ" },
  { ticker: "INTC", name: "Intel", market: "NASDAQ" },
  { ticker: "MU", name: "Micron", market: "NASDAQ" },
  { ticker: "QCOM", name: "Qualcomm", market: "NASDAQ" },
  { ticker: "TXN", name: "Texas Instruments", market: "NASDAQ" },
  { ticker: "AMAT", name: "Applied Materials", market: "NASDAQ" },
  { ticker: "LRCX", name: "Lam Research", market: "NASDAQ" },
  { ticker: "KLAC", name: "KLA Corporation", market: "NASDAQ" },
  { ticker: "MRVL", name: "Marvell Technology", market: "NASDAQ" },
  { ticker: "ADI", name: "Analog Devices", market: "NASDAQ" },
  { ticker: "ADBE", name: "Adobe", market: "NASDAQ" },
  { ticker: "CRM", name: "Salesforce", market: "NYSE" },
  { ticker: "ORCL", name: "Oracle", market: "NYSE" },
  { ticker: "CSCO", name: "Cisco", market: "NASDAQ" },
  { ticker: "IBM", name: "IBM", market: "NYSE" },
  { ticker: "NOW", name: "ServiceNow", market: "NYSE" },
  { ticker: "PANW", name: "Palo Alto Networks", market: "NASDAQ" },
  { ticker: "CRWD", name: "CrowdStrike", market: "NASDAQ" },
  { ticker: "SNOW", name: "Snowflake", market: "NYSE" },
  { ticker: "PLTR", name: "Palantir", market: "NYSE" },
  { ticker: "DDOG", name: "Datadog", market: "NASDAQ" },
  { ticker: "NET", name: "Cloudflare", market: "NYSE" },
  { ticker: "ZS", name: "Zscaler", market: "NASDAQ" },
  { ticker: "FTNT", name: "Fortinet", market: "NASDAQ" },
  { ticker: "TEAM", name: "Atlassian", market: "NASDAQ" },
  { ticker: "MDB", name: "MongoDB", market: "NASDAQ" },
  { ticker: "WDAY", name: "Workday", market: "NASDAQ" },
  { ticker: "VEEV", name: "Veeva Systems", market: "NYSE" },
  { ticker: "SPLK", name: "Splunk", market: "NASDAQ" },
  { ticker: "ABNB", name: "Airbnb", market: "NASDAQ" },
  { ticker: "BKNG", name: "Booking Holdings", market: "NASDAQ" },
  { ticker: "MELI", name: "MercadoLibre", market: "NASDAQ" },
  { ticker: "PDD", name: "PDD Holdings (Temu)", market: "NASDAQ" },
  { ticker: "JD", name: "JD.com", market: "NASDAQ" },
  { ticker: "BIDU", name: "Baidu", market: "NASDAQ" },
  { ticker: "COIN", name: "Coinbase", market: "NASDAQ" },
  { ticker: "HOOD", name: "Robinhood", market: "NASDAQ" },
  { ticker: "SQ", name: "Block (Square)", market: "NYSE" },
  { ticker: "PYPL", name: "PayPal", market: "NASDAQ" },
  { ticker: "INTU", name: "Intuit", market: "NASDAQ" },
  { ticker: "ADP", name: "ADP", market: "NASDAQ" },
  { ticker: "CDNS", name: "Cadence Design", market: "NASDAQ" },
  { ticker: "SNPS", name: "Synopsys", market: "NASDAQ" },
  { ticker: "ANSS", name: "Ansys", market: "NASDAQ" },
  { ticker: "DASH", name: "DoorDash", market: "NASDAQ" },
  { ticker: "UBER", name: "Uber", market: "NYSE" },
  { ticker: "LYFT", name: "Lyft", market: "NASDAQ" },
  { ticker: "RIVN", name: "Rivian", market: "NASDAQ" },
  { ticker: "LCID", name: "Lucid Group", market: "NASDAQ" },
  { ticker: "ARM", name: "Arm Holdings", market: "NASDAQ" },
  { ticker: "SMCI", name: "Super Micro Computer", market: "NASDAQ" },
  { ticker: "MSTR", name: "MicroStrategy", market: "NASDAQ" },
  { ticker: "ON", name: "ON Semiconductor", market: "NASDAQ" },
  { ticker: "NXPI", name: "NXP Semiconductors", market: "NASDAQ" },
  { ticker: "MCHP", name: "Microchip Technology", market: "NASDAQ" },
  { ticker: "SWKS", name: "Skyworks Solutions", market: "NASDAQ" },
  { ticker: "MPWR", name: "Monolithic Power", market: "NASDAQ" },
  { ticker: "REGN", name: "Regeneron", market: "NASDAQ" },
  { ticker: "GILD", name: "Gilead Sciences", market: "NASDAQ" },
  { ticker: "MRNA", name: "Moderna", market: "NASDAQ" },
  { ticker: "VRTX", name: "Vertex Pharmaceuticals", market: "NASDAQ" },
  { ticker: "ISRG", name: "Intuitive Surgical", market: "NASDAQ" },
  { ticker: "DXCM", name: "DexCom", market: "NASDAQ" },
  { ticker: "IDXX", name: "IDEXX Laboratories", market: "NASDAQ" },
  { ticker: "ILMN", name: "Illumina", market: "NASDAQ" },
  { ticker: "BIIB", name: "Biogen", market: "NASDAQ" },
  { ticker: "AMGN", name: "Amgen", market: "NASDAQ" },
  { ticker: "MDLZ", name: "Mondelez", market: "NASDAQ" },
  { ticker: "SBUX", name: "Starbucks", market: "NASDAQ" },
  { ticker: "MNST", name: "Monster Beverage", market: "NASDAQ" },
  { ticker: "KHC", name: "Kraft Heinz", market: "NASDAQ" },
  { ticker: "MAR", name: "Marriott", market: "NASDAQ" },
  { ticker: "LULU", name: "Lululemon", market: "NASDAQ" },
  { ticker: "ROST", name: "Ross Stores", market: "NASDAQ" },
  { ticker: "FAST", name: "Fastenal", market: "NASDAQ" },
  { ticker: "ODFL", name: "Old Dominion Freight", market: "NASDAQ" },
  { ticker: "CPRT", name: "Copart", market: "NASDAQ" },
  { ticker: "CTAS", name: "Cintas", market: "NASDAQ" },
  { ticker: "PCAR", name: "PACCAR", market: "NASDAQ" },
  { ticker: "CEG", name: "Constellation Energy", market: "NASDAQ" },
  { ticker: "TTWO", name: "Take-Two Interactive", market: "NASDAQ" },
  { ticker: "EA", name: "Electronic Arts", market: "NASDAQ" },
  { ticker: "SIRI", name: "Sirius XM", market: "NASDAQ" },
  { ticker: "ROKU", name: "Roku", market: "NASDAQ" },
  { ticker: "TTD", name: "The Trade Desk", market: "NASDAQ" },
  { ticker: "FANG", name: "Diamondback Energy", market: "NASDAQ" },
  { ticker: "GEHC", name: "GE HealthCare", market: "NASDAQ" },
  { ticker: "CHTR", name: "Charter Communications", market: "NASDAQ" },
  { ticker: "CMCSA", name: "Comcast", market: "NASDAQ" },
  { ticker: "TMUS", name: "T-Mobile US", market: "NASDAQ" },
  { ticker: "WBD", name: "Warner Bros Discovery", market: "NASDAQ" },

  // ── NYSE Top ~100 by Market Cap ────────────────────────────────
  { ticker: "BRK-B", name: "Berkshire Hathaway", market: "NYSE" },
  { ticker: "JPM", name: "JPMorgan Chase", market: "NYSE" },
  { ticker: "V", name: "Visa", market: "NYSE" },
  { ticker: "UNH", name: "UnitedHealth", market: "NYSE" },
  { ticker: "JNJ", name: "Johnson & Johnson", market: "NYSE" },
  { ticker: "WMT", name: "Walmart", market: "NYSE" },
  { ticker: "XOM", name: "ExxonMobil", market: "NYSE" },
  { ticker: "LLY", name: "Eli Lilly", market: "NYSE" },
  { ticker: "PG", name: "Procter & Gamble", market: "NYSE" },
  { ticker: "MA", name: "Mastercard", market: "NYSE" },
  { ticker: "HD", name: "Home Depot", market: "NYSE" },
  { ticker: "CVX", name: "Chevron", market: "NYSE" },
  { ticker: "MRK", name: "Merck", market: "NYSE" },
  { ticker: "ABBV", name: "AbbVie", market: "NYSE" },
  { ticker: "PEP", name: "PepsiCo", market: "NASDAQ" },
  { ticker: "KO", name: "Coca-Cola", market: "NYSE" },
  { ticker: "TMO", name: "Thermo Fisher", market: "NYSE" },
  { ticker: "ABT", name: "Abbott Laboratories", market: "NYSE" },
  { ticker: "DHR", name: "Danaher", market: "NYSE" },
  { ticker: "PM", name: "Philip Morris", market: "NYSE" },
  { ticker: "NKE", name: "Nike", market: "NYSE" },
  { ticker: "DIS", name: "Walt Disney", market: "NYSE" },
  { ticker: "BA", name: "Boeing", market: "NYSE" },
  { ticker: "GE", name: "GE Aerospace", market: "NYSE" },
  { ticker: "CAT", name: "Caterpillar", market: "NYSE" },
  { ticker: "HON", name: "Honeywell", market: "NASDAQ" },
  { ticker: "UPS", name: "UPS", market: "NYSE" },
  { ticker: "RTX", name: "RTX (Raytheon)", market: "NYSE" },
  { ticker: "LMT", name: "Lockheed Martin", market: "NYSE" },
  { ticker: "GD", name: "General Dynamics", market: "NYSE" },
  { ticker: "NOC", name: "Northrop Grumman", market: "NYSE" },
  { ticker: "MMM", name: "3M", market: "NYSE" },
  { ticker: "DE", name: "Deere & Company", market: "NYSE" },
  { ticker: "WFC", name: "Wells Fargo", market: "NYSE" },
  { ticker: "BAC", name: "Bank of America", market: "NYSE" },
  { ticker: "C", name: "Citigroup", market: "NYSE" },
  { ticker: "GS", name: "Goldman Sachs", market: "NYSE" },
  { ticker: "MS", name: "Morgan Stanley", market: "NYSE" },
  { ticker: "BLK", name: "BlackRock", market: "NYSE" },
  { ticker: "SCHW", name: "Charles Schwab", market: "NYSE" },
  { ticker: "AXP", name: "American Express", market: "NYSE" },
  { ticker: "USB", name: "U.S. Bancorp", market: "NYSE" },
  { ticker: "PNC", name: "PNC Financial", market: "NYSE" },
  { ticker: "TFC", name: "Truist Financial", market: "NYSE" },
  { ticker: "COF", name: "Capital One", market: "NYSE" },
  { ticker: "MCO", name: "Moody's", market: "NYSE" },
  { ticker: "SPGI", name: "S&P Global", market: "NYSE" },
  { ticker: "ICE", name: "Intercontinental Exchange", market: "NYSE" },
  { ticker: "CME", name: "CME Group", market: "NASDAQ" },
  { ticker: "CB", name: "Chubb", market: "NYSE" },
  { ticker: "MMC", name: "Marsh McLennan", market: "NYSE" },
  { ticker: "AON", name: "Aon", market: "NYSE" },
  { ticker: "AIG", name: "AIG", market: "NYSE" },
  { ticker: "MET", name: "MetLife", market: "NYSE" },
  { ticker: "PRU", name: "Prudential Financial", market: "NYSE" },
  { ticker: "TRV", name: "Travelers", market: "NYSE" },
  { ticker: "ALL", name: "Allstate", market: "NYSE" },
  { ticker: "CI", name: "Cigna Group", market: "NYSE" },
  { ticker: "ELV", name: "Elevance Health", market: "NYSE" },
  { ticker: "HCA", name: "HCA Healthcare", market: "NYSE" },
  { ticker: "CVS", name: "CVS Health", market: "NYSE" },
  { ticker: "BMY", name: "Bristol-Myers Squibb", market: "NYSE" },
  { ticker: "PFE", name: "Pfizer", market: "NYSE" },
  { ticker: "SYK", name: "Stryker", market: "NYSE" },
  { ticker: "MDT", name: "Medtronic", market: "NYSE" },
  { ticker: "BSX", name: "Boston Scientific", market: "NYSE" },
  { ticker: "ZTS", name: "Zoetis", market: "NYSE" },
  { ticker: "BDX", name: "Becton Dickinson", market: "NYSE" },
  { ticker: "CL", name: "Colgate-Palmolive", market: "NYSE" },
  { ticker: "EL", name: "Estee Lauder", market: "NYSE" },
  { ticker: "COP", name: "ConocoPhillips", market: "NYSE" },
  { ticker: "EOG", name: "EOG Resources", market: "NYSE" },
  { ticker: "SLB", name: "Schlumberger", market: "NYSE" },
  { ticker: "PSX", name: "Phillips 66", market: "NYSE" },
  { ticker: "VLO", name: "Valero Energy", market: "NYSE" },
  { ticker: "MPC", name: "Marathon Petroleum", market: "NYSE" },
  { ticker: "OXY", name: "Occidental Petroleum", market: "NYSE" },
  { ticker: "DVN", name: "Devon Energy", market: "NYSE" },
  { ticker: "NEE", name: "NextEra Energy", market: "NYSE" },
  { ticker: "DUK", name: "Duke Energy", market: "NYSE" },
  { ticker: "SO", name: "Southern Company", market: "NYSE" },
  { ticker: "D", name: "Dominion Energy", market: "NYSE" },
  { ticker: "AEP", name: "American Electric Power", market: "NASDAQ" },
  { ticker: "SRE", name: "Sempra", market: "NYSE" },
  { ticker: "AMT", name: "American Tower", market: "NYSE" },
  { ticker: "PLD", name: "Prologis", market: "NYSE" },
  { ticker: "CCI", name: "Crown Castle", market: "NYSE" },
  { ticker: "SPG", name: "Simon Property Group", market: "NYSE" },
  { ticker: "EQIX", name: "Equinix", market: "NASDAQ" },
  { ticker: "O", name: "Realty Income", market: "NYSE" },
  { ticker: "PSA", name: "Public Storage", market: "NYSE" },
  { ticker: "LOW", name: "Lowe's", market: "NYSE" },
  { ticker: "TGT", name: "Target", market: "NYSE" },
  { ticker: "TJX", name: "TJX Companies", market: "NYSE" },
  { ticker: "F", name: "Ford Motor", market: "NYSE" },
  { ticker: "GM", name: "General Motors", market: "NYSE" },
  { ticker: "FDX", name: "FedEx", market: "NYSE" },
  { ticker: "CSX", name: "CSX Corporation", market: "NASDAQ" },
  { ticker: "UNP", name: "Union Pacific", market: "NYSE" },
  { ticker: "NSC", name: "Norfolk Southern", market: "NYSE" },
  { ticker: "EMR", name: "Emerson Electric", market: "NYSE" },
  { ticker: "ETN", name: "Eaton", market: "NYSE" },
  { ticker: "ITW", name: "Illinois Tool Works", market: "NYSE" },
  { ticker: "ROK", name: "Rockwell Automation", market: "NYSE" },
  { ticker: "APH", name: "Amphenol", market: "NYSE" },
  { ticker: "CARR", name: "Carrier Global", market: "NYSE" },
  { ticker: "VST", name: "Vistra", market: "NYSE" },
  { ticker: "T", name: "AT&T", market: "NYSE" },
  { ticker: "VZ", name: "Verizon", market: "NYSE" },

  // ── KOSPI Top ~80 ──────────────────────────────────────────────
  { ticker: "005930.KS", name: "Samsung Electronics", market: "KOSPI" },
  { ticker: "000660.KS", name: "SK Hynix", market: "KOSPI" },
  { ticker: "035420.KS", name: "Naver", market: "KOSPI" },
  { ticker: "035720.KS", name: "Kakao", market: "KOSPI" },
  { ticker: "005380.KS", name: "Hyundai Motor", market: "KOSPI" },
  { ticker: "000270.KS", name: "Kia", market: "KOSPI" },
  { ticker: "051910.KS", name: "LG Chem", market: "KOSPI" },
  { ticker: "006400.KS", name: "Samsung SDI", market: "KOSPI" },
  { ticker: "003670.KS", name: "POSCO Holdings", market: "KOSPI" },
  { ticker: "105560.KS", name: "KB Financial", market: "KOSPI" },
  { ticker: "055550.KS", name: "Shinhan Financial", market: "KOSPI" },
  { ticker: "068270.KS", name: "Celltrion", market: "KOSPI" },
  { ticker: "207940.KS", name: "Samsung Biologics", market: "KOSPI" },
  { ticker: "034730.KS", name: "SK Inc.", market: "KOSPI" },
  { ticker: "012330.KS", name: "Hyundai Mobis", market: "KOSPI" },
  { ticker: "066570.KS", name: "LG Electronics", market: "KOSPI" },
  { ticker: "028260.KS", name: "Samsung C&T", market: "KOSPI" },
  { ticker: "009150.KS", name: "Samsung Electro-Mechanics", market: "KOSPI" },
  { ticker: "032830.KS", name: "Samsung Life", market: "KOSPI" },
  { ticker: "086790.KS", name: "Hana Financial", market: "KOSPI" },
  { ticker: "018260.KS", name: "Samsung SDS", market: "KOSPI" },
  { ticker: "010130.KS", name: "Korea Zinc", market: "KOSPI" },
  { ticker: "033780.KS", name: "KT&G", market: "KOSPI" },
  { ticker: "030200.KS", name: "KT", market: "KOSPI" },
  { ticker: "017670.KS", name: "SK Telecom", market: "KOSPI" },
  { ticker: "096770.KS", name: "SK Innovation", market: "KOSPI" },
  { ticker: "010950.KS", name: "S-Oil", market: "KOSPI" },
  { ticker: "011200.KS", name: "HMM", market: "KOSPI" },
  { ticker: "003490.KS", name: "Korean Air", market: "KOSPI" },
  { ticker: "002790.KS", name: "Amorepacific", market: "KOSPI" },
  { ticker: "036570.KS", name: "NCsoft", market: "KOSPI" },
  { ticker: "251270.KS", name: "Netmarble", market: "KOSPI" },
  { ticker: "263750.KS", name: "Pearl Abyss", market: "KOSPI" },
  { ticker: "352820.KS", name: "Hybe", market: "KOSPI" },
  { ticker: "000810.KS", name: "Samsung Fire & Marine", market: "KOSPI" },
  { ticker: "316140.KS", name: "Woori Financial", market: "KOSPI" },
  { ticker: "024110.KS", name: "Industrial Bank of Korea", market: "KOSPI" },
  { ticker: "138930.KS", name: "BNK Financial", market: "KOSPI" },
  { ticker: "139480.KS", name: "E-Mart", market: "KOSPI" },
  { ticker: "004020.KS", name: "Hyundai Steel", market: "KOSPI" },
  { ticker: "047050.KS", name: "POSCO International", market: "KOSPI" },
  { ticker: "010140.KS", name: "Samsung Heavy Industries", market: "KOSPI" },
  { ticker: "009540.KS", name: "HD Hyundai Heavy Industries", market: "KOSPI" },
  { ticker: "329180.KS", name: "HD Hyundai Marine Solution", market: "KOSPI" },
  { ticker: "042660.KS", name: "Hanwha Ocean", market: "KOSPI" },
  { ticker: "267250.KS", name: "HD Hyundai", market: "KOSPI" },
  { ticker: "034020.KS", name: "Doosan Enerbility", market: "KOSPI" },
  { ticker: "011170.KS", name: "Lotte Chemical", market: "KOSPI" },
  { ticker: "051900.KS", name: "LG H&H", market: "KOSPI" },
  { ticker: "003550.KS", name: "LG Corp", market: "KOSPI" },
  { ticker: "006360.KS", name: "GS Engineering", market: "KOSPI" },
  { ticker: "000720.KS", name: "Hyundai Engineering", market: "KOSPI" },
  { ticker: "011070.KS", name: "LG Innotek", market: "KOSPI" },
  { ticker: "373220.KS", name: "LG Energy Solution", market: "KOSPI" },
  { ticker: "247540.KS", name: "Ecopro BM", market: "KOSPI" },
  { ticker: "086280.KS", name: "Hyundai Glovis", market: "KOSPI" },
  { ticker: "015760.KS", name: "Korea Electric Power", market: "KOSPI" },
  { ticker: "032640.KS", name: "LG Uplus", market: "KOSPI" },
  { ticker: "161390.KS", name: "Hankook Tire", market: "KOSPI" },
  { ticker: "078930.KS", name: "GS Holdings", market: "KOSPI" },
  { ticker: "036460.KS", name: "Korea Gas", market: "KOSPI" },
  { ticker: "272210.KS", name: "Hanwha Systems", market: "KOSPI" },
  { ticker: "012450.KS", name: "Hanwha Aerospace", market: "KOSPI" },
  { ticker: "009830.KS", name: "Hanwha Solutions", market: "KOSPI" },
  { ticker: "000100.KS", name: "Yuhan", market: "KOSPI" },
  { ticker: "326030.KS", name: "SK Biopharmaceuticals", market: "KOSPI" },
  { ticker: "128940.KS", name: "Hanmi Pharm", market: "KOSPI" },
  { ticker: "302440.KS", name: "SK Bioscience", market: "KOSPI" },
  { ticker: "180640.KS", name: "Hanmi Semiconductor", market: "KOSPI" },
  { ticker: "006800.KS", name: "Mirae Asset Securities", market: "KOSPI" },
  { ticker: "003410.KS", name: "Ssangyong C&E", market: "KOSPI" },
  { ticker: "005490.KS", name: "POSCO DX", market: "KOSPI" },
  { ticker: "259960.KS", name: "Krafton", market: "KOSPI" },
  { ticker: "000880.KS", name: "Hanwha Corp", market: "KOSPI" },
  { ticker: "011790.KS", name: "SKC", market: "KOSPI" },
  { ticker: "021240.KS", name: "Coway", market: "KOSPI" },
  { ticker: "271560.KS", name: "Orion Corp", market: "KOSPI" },
  { ticker: "097950.KS", name: "CJ CheilJedang", market: "KOSPI" },
  { ticker: "004170.KS", name: "Shinsegae", market: "KOSPI" },

  // ── Global / ADR ───────────────────────────────────────────────
  { ticker: "TSM", name: "TSMC", market: "NYSE" },
  { ticker: "ASML", name: "ASML Holdings", market: "NASDAQ" },
  { ticker: "SAP", name: "SAP", market: "NYSE" },
  { ticker: "NVO", name: "Novo Nordisk", market: "NYSE" },
  { ticker: "BABA", name: "Alibaba", market: "NYSE" },
  { ticker: "TCEHY", name: "Tencent (OTC)", market: "OTC" },
  { ticker: "TM", name: "Toyota Motor", market: "NYSE" },
  { ticker: "SONY", name: "Sony Group", market: "NYSE" },
  { ticker: "SHOP", name: "Shopify", market: "NYSE" },
  { ticker: "SE", name: "Sea Limited", market: "NYSE" },
  { ticker: "GRAB", name: "Grab Holdings", market: "NASDAQ" },
  { ticker: "NIO", name: "NIO", market: "NYSE" },
  { ticker: "XPEV", name: "XPeng", market: "NYSE" },
  { ticker: "LI", name: "Li Auto", market: "NASDAQ" },
  { ticker: "INFY", name: "Infosys", market: "NYSE" },
  { ticker: "WIT", name: "Wipro", market: "NYSE" },
  { ticker: "AZN", name: "AstraZeneca", market: "NASDAQ" },
  { ticker: "GSK", name: "GSK", market: "NYSE" },
  { ticker: "SNY", name: "Sanofi", market: "NASDAQ" },
  { ticker: "DEO", name: "Diageo", market: "NYSE" },
  { ticker: "UL", name: "Unilever", market: "NYSE" },
  { ticker: "HSBC", name: "HSBC Holdings", market: "NYSE" },
  { ticker: "RIO", name: "Rio Tinto", market: "NYSE" },
  { ticker: "BHP", name: "BHP Group", market: "NYSE" },
  { ticker: "VALE", name: "Vale", market: "NYSE" },
  { ticker: "SPOT", name: "Spotify", market: "NYSE" },
  { ticker: "MARA", name: "Marathon Digital", market: "NASDAQ" },
  { ticker: "RIOT", name: "Riot Platforms", market: "NASDAQ" },
];

export function WatchlistManager({
  items,
  selected,
  onSelect,
  onAdd,
  onRemove,
  onReorder,
}: WatchlistManagerProps) {
  const [search, setSearch] = useState("");
  const [dialogOpen, setDialogOpen] = useState(false);
  const [highlightIdx, setHighlightIdx] = useState(0);
  const dragItem = useRef<number | null>(null);
  const [dragOverIndex, setDragOverIndex] = useState<number | null>(null);

  const filteredSuggestions = SUGGESTIONS.filter(
    (s) =>
      !items.some((w) => w.ticker === s.ticker) &&
      (s.name.toLowerCase().includes(search.toLowerCase()) ||
        s.ticker.toLowerCase().includes(search.toLowerCase()))
  ).slice(0, 20); // limit visible results

  const handleSearchKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "ArrowDown") {
      e.preventDefault();
      setHighlightIdx((prev) => Math.min(prev + 1, filteredSuggestions.length - 1));
    } else if (e.key === "ArrowUp") {
      e.preventDefault();
      setHighlightIdx((prev) => Math.max(prev - 1, 0));
    } else if (e.key === "Enter") {
      e.preventDefault();
      if (filteredSuggestions.length > 0) {
        onAdd(filteredSuggestions[highlightIdx]);
        setSearch("");
        setHighlightIdx(0);
      }
    }
  };

  const handleDragStart = (e: React.DragEvent, index: number) => {
    dragItem.current = index;
    e.dataTransfer.effectAllowed = "move";
    // Small drag ghost
    const ghost = document.createElement("div");
    ghost.textContent = items[index].name;
    ghost.style.cssText = "position:fixed;top:-100px;padding:4px 12px;border-radius:9999px;font-size:12px;background:#3b82f6;color:#fff;white-space:nowrap;";
    document.body.appendChild(ghost);
    e.dataTransfer.setDragImage(ghost, ghost.offsetWidth / 2, 14);
    setTimeout(() => document.body.removeChild(ghost), 0);
  };

  const handleDragOver = (e: React.DragEvent, index: number) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = "move";
    setDragOverIndex(index);
  };

  const handleDragLeave = () => {
    setDragOverIndex(null);
  };

  const handleDrop = (index: number) => {
    if (dragItem.current === null || dragItem.current === index) {
      setDragOverIndex(null);
      return;
    }

    const reordered = [...items];
    const [removed] = reordered.splice(dragItem.current, 1);
    reordered.splice(index, 0, removed);
    onReorder(reordered);

    dragItem.current = null;
    setDragOverIndex(null);
  };

  const handleDragEnd = () => {
    dragItem.current = null;
    setDragOverIndex(null);
  };

  return (
    <div className="flex items-center gap-2 overflow-x-auto pb-1">
      {items.map((item, index) => {
        const isDragOver = dragOverIndex === index;
        const isDragging = dragItem.current === index;

        return (
          <div key={item.ticker} className="relative shrink-0 flex items-center">
            {/* Drop indicator — left side ghost */}
            {isDragOver && dragItem.current !== null && dragItem.current > index && (
              <div className="absolute -left-1.5 top-0 bottom-0 w-0.5 bg-blue-500 rounded-full z-10" />
            )}
            <button
              draggable
              onDragStart={(e) => handleDragStart(e, index)}
              onDragOver={(e) => handleDragOver(e, index)}
              onDragLeave={handleDragLeave}
              onDrop={() => handleDrop(index)}
              onDragEnd={handleDragEnd}
              onClick={() => onSelect(item.ticker)}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-medium transition-all cursor-grab active:cursor-grabbing ${
                isDragging ? "opacity-30 scale-95" : ""
              } ${
                isDragOver ? "ring-2 ring-blue-400 ring-offset-1 dark:ring-offset-zinc-950" : ""
              } ${
                selected === item.ticker
                  ? "bg-slate-900 text-white dark:bg-zinc-100 dark:text-zinc-900"
                  : "bg-slate-100 text-slate-700 hover:bg-slate-200 dark:bg-zinc-800 dark:text-zinc-300 dark:hover:bg-zinc-700"
              }`}
            >
              <TickerLogo ticker={item.ticker} size={16} />
              {item.name}
              <span className="text-[10px] opacity-60">{item.market}</span>
            </button>
            {/* Drop indicator — right side ghost */}
            {isDragOver && dragItem.current !== null && dragItem.current < index && (
              <div className="absolute -right-1.5 top-0 bottom-0 w-0.5 bg-blue-500 rounded-full z-10" />
            )}
          </div>
        );
      })}

      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogTrigger
          className="shrink-0 flex items-center gap-1 px-3 py-1.5 rounded-full text-xs font-medium bg-slate-100 text-slate-500 hover:bg-slate-200 dark:bg-zinc-800 dark:text-zinc-400 dark:hover:bg-zinc-700 cursor-pointer"
        >
          + Add
        </DialogTrigger>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Add Ticker</DialogTitle>
            <DialogDescription>Search and add stocks to your watchlist.</DialogDescription>
          </DialogHeader>
          <Input
            placeholder="Search ticker or name... (Enter to add)"
            value={search}
            onChange={(e) => { setSearch(e.target.value); setHighlightIdx(0); }}
            onKeyDown={handleSearchKeyDown}
            className="mb-3"
            autoFocus
          />
          <div className="space-y-1 max-h-60 overflow-y-auto">
            {filteredSuggestions.length === 0 && (
              <p className="text-xs text-slate-400 dark:text-zinc-500 py-4 text-center">
                No results
              </p>
            )}
            {filteredSuggestions.map((s, idx) => (
              <button
                key={s.ticker}
                onClick={() => {
                  onAdd(s);
                  setSearch("");
                  setHighlightIdx(0);
                }}
                className={`w-full flex items-center justify-between px-3 py-2 rounded-md text-sm cursor-pointer ${
                  idx === highlightIdx
                    ? "bg-slate-100 dark:bg-zinc-700"
                    : "hover:bg-slate-50 dark:hover:bg-zinc-800"
                }`}
              >
                <span>
                  {s.name}{" "}
                  <span className="text-xs text-slate-400 dark:text-zinc-500">{s.ticker}</span>
                </span>
                <Badge variant="outline" className="text-[10px]">
                  {s.market}
                </Badge>
              </button>
            ))}
          </div>
          {items.length > 0 && (
            <div className="mt-4 pt-3 border-t border-slate-100 dark:border-zinc-800">
              <p className="text-xs text-slate-400 dark:text-zinc-500 mb-2">Current watchlist</p>
              <div className="flex flex-wrap gap-1.5">
                {items.map((item) => (
                  <Badge
                    key={item.ticker}
                    variant="outline"
                    className="gap-1 text-xs cursor-pointer hover:bg-red-50 hover:text-red-600 hover:border-red-200 dark:hover:bg-red-950 dark:hover:text-red-400"
                    onClick={() => onRemove(item.ticker)}
                  >
                    {item.name} ×
                  </Badge>
                ))}
              </div>
            </div>
          )}
          <DialogClose className="mt-3">
            <Button variant="outline" size="sm" className="w-full">
              Done
            </Button>
          </DialogClose>
        </DialogContent>
      </Dialog>
    </div>
  );
}
