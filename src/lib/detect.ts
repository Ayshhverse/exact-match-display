export type Risk = "Low" | "Medium" | "High";
export type Analysis = {
  risk: Risk;
  threat: string;
  reasons: string[];
  score: number; // 0–100
  matches: string[]; // exact phrases found in the message, used for highlighting
};

type Rule = {
  re: RegExp;
  weight: number;
  tactic: string; // plain-language bullet shown in "Why this is risky"
  threat: string; // threat category this signal points to
};

const RULES: Rule[] = [
  // Fake urgency
  {
    re: /\b(urgent|urgently|immediately|right now|within \d+ (hours?|minutes?|days?)|asap|last chance|today only|limited (seats|time)|expires? (today|soon)|act now)\b/i,
    weight: 14,
    tactic: "Fake urgency: pressuring you to act before you think.",
    threat: "",
  },
  // Threats
  {
    re: /\b(i will|i'll|i am going to|gonna)\s+(leak|expose|ruin|post|share|send|tell|upload)/i,
    weight: 25,
    tactic: "Threats: using fear of exposure or harm to make you obey.",
    threat: "Sextortion",
  },
  {
    re: /\b(leak|expose|share|post|send|upload).{0,40}(photo|pic|video|nude|image|follower|family|friend)s?/i,
    weight: 22,
    tactic: "Threatens to leak or share your private photos or videos.",
    threat: "Sextortion",
  },
  {
    re: /\b(police|arrest|legal action|fir|court case)\b/i,
    weight: 12,
    tactic: "Fake legal threats: using police or arrest talk to frighten you.",
    threat: "",
  },
  {
    re: /\b(ugly|slut|whore|kill you|watching you|i know where you live|stupid)\b/i,
    weight: 25,
    tactic: "Abuse or intimidation: contains threatening or stalking language.",
    threat: "Harassment",
  },
  // Requests for money, OTP, passwords, bank details
  {
    re: /\b(otp|one[- ]time password|pin|cvv|password|net ?banking|card number)\b/i,
    weight: 25,
    tactic: "Asks for an OTP, PIN, CVV or password — no real bank ever asks for these.",
    threat: "Phishing",
  },
  {
    re: /\b(send|transfer|pay|gpay|upi|paytm|phonepe).{0,30}(money|₹|rs\.?|amount|\d{3,})/i,
    weight: 20,
    tactic: "Requests for money: pushing you to send a payment.",
    threat: "Financial scam",
  },
  {
    re: /(₹|rs\.?)\s?\d{2,}/i,
    weight: 8,
    tactic: "Mentions a specific amount of money to make the demand feel real.",
    threat: "Financial scam",
  },
  // Requests for photos or videos
  {
    re: /\byour (photos|pics|videos|images|nudes)\b/i,
    weight: 15,
    tactic: "Requests or mentions your photos or videos to make you panic.",
    threat: "Sextortion",
  },
  // Suspicious links
  {
    re: /(https?:\/\/\S+|www\.\S+|\b(bit\.ly|tinyurl|t\.co|goo\.gl|cutt\.ly)\S*)/i,
    weight: 15,
    tactic: "Suspicious link: shortened or unknown URLs can steal your details.",
    threat: "Phishing",
  },
  {
    re: /\b(click|tap|open|visit).{0,20}(link|here)\b/i,
    weight: 10,
    tactic: "Pushes you to click a link instead of using the official app or site.",
    threat: "Phishing",
  },
  // Impersonation of a known person, bank, or company
  {
    re: /\b(new number|lost my phone|it'?s me|this is your (friend|cousin|sister|brother|son|daughter))\b/i,
    weight: 20,
    tactic: "Pretends to be someone you know messaging from a new number.",
    threat: "Impersonation",
  },
  {
    re: /\b(account|card|kyc|sim|wallet).{0,25}(blocked|suspended|locked|expire|deactivat)/i,
    weight: 20,
    tactic: "Pretends to be a bank or company claiming your account is blocked.",
    threat: "Phishing",
  },
  {
    re: /\b(dear customer|dear user|sbi|hdfc|icici|rbi|income tax|customs)\b/i,
    weight: 10,
    tactic: "Impersonation: posing as a bank, company or government office.",
    threat: "Phishing",
  },
  // Prize, lottery, or job-offer language
  {
    re: /\b(you (have )?(won|are selected)|congratulations|lottery|prize|lucky draw|reward|winner)\b/i,
    weight: 18,
    tactic: "Prize or lottery bait: promising a reward you never entered for.",
    threat: "Fake job or lottery scam",
  },
  {
    re: /\b(work from home|part[- ]time job|earn ₹?\s?\d|per day|registration fee|joining fee|liking videos)\b/i,
    weight: 18,
    tactic: "Fake job offer: easy money that asks for a fee upfront.",
    threat: "Fake job or lottery scam",
  },
  // Isolation
  {
    re: /\b(don'?t tell|keep this secret|no one (must|should) know|between us)\b/i,
    weight: 15,
    tactic: "Isolation: asking you to keep it secret so nobody can warn you.",
    threat: "",
  },
];

export function analyze(text: string): Analysis {
  const counts: Record<string, number> = {};
  const reasons: string[] = [];
  const matches: string[] = [];
  let score = 0;

  for (const r of RULES) {
    const m = text.match(r.re);
    if (m) {
      score += r.weight;
      if (!reasons.includes(r.tactic)) reasons.push(r.tactic);
      if (!matches.includes(m[0])) matches.push(m[0]);
      if (r.threat) counts[r.threat] = (counts[r.threat] ?? 0) + r.weight;
    }
  }

  score = Math.min(100, score);

  let threat = Object.entries(counts).sort((a, b) => b[1] - a[1])[0]?.[0] ?? "No clear threat";
  if (threat === "Financial scam" && counts["Impersonation"]) threat = "Impersonation";

  const risk: Risk = score >= 67 ? "High" : score >= 34 ? "Medium" : "Low";
  if (reasons.length === 0)
    reasons.push("No common manipulation patterns found. Still trust your instincts.");

  return { risk, threat, reasons, score, matches };
}

/** Split the message into segments, marking which ones matched a signal. */
export function highlightSegments(
  text: string,
  matches: string[]
): { text: string; hit: boolean }[] {
  if (matches.length === 0) return [{ text, hit: false }];
  const escaped = matches.map((m) => m.replace(/[.*+?^${}()|[\]\\]/g, "\\$&"));
  const splitRe = new RegExp(`(${escaped.join("|")})`, "gi");
  const testRe = new RegExp(`^(${escaped.join("|")})$`, "i");
  return text
    .split(splitRe)
    .filter((s) => s.length > 0)
    .map((s) => ({ text: s, hit: testRe.test(s) }));
}

export const EXAMPLES = [
  { label: "Sextortion threat", text: "I have your photos and videos from your Instagram. Send ₹20,000 to this UPI within 24 hours or I will leak them to all your followers and family. Don't tell anyone or it gets worse." },
  { label: "Fake bank OTP", text: "Dear customer, your SBI account will be BLOCKED today due to pending KYC. Click this link http://sbi-kyc-update.co immediately and share the OTP sent to your phone to avoid suspension." },
  { label: "Fake job offer", text: "Congratulations! You are selected for a part-time work from home job. Earn ₹5000 per day by liking videos. Pay a small registration fee of ₹999 to start today only. Limited seats!" },
  { label: "Friend impersonation", text: "Hi it's me Priya, this is my new number, lost my phone. I'm in a hospital emergency, can you urgently send ₹8,000 on GPay? Will return tomorrow. Please don't tell mom." },
];
