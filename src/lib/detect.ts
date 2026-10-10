export type Risk = "Low" | "Medium" | "High";
export type Analysis = { risk: Risk; threat: string; reasons: string[]; score: number };

type Rule = { re: RegExp; weight: number; threat: string; reason: string };

const RULES: Rule[] = [
  { re: /\b(leak|expose|share|post|send).{0,30}(photo|pic|video|nude|image)s?/i, weight: 5, threat: "Sextortion", reason: "Threatens to leak or share your private photos or videos." },
  { re: /\b(i will|i'll|gonna)\s+(leak|expose|ruin|post|tell)/i, weight: 4, threat: "Sextortion", reason: "Uses threats to scare you into obeying." },
  { re: /\byour (photos|pics|videos|images)\b/i, weight: 3, threat: "Sextortion", reason: "Mentions your private photos to make you panic." },
  { re: /\b(otp|one[- ]time password|pin|cvv)\b/i, weight: 4, threat: "Phishing", reason: "Asks for an OTP, PIN or CVV — no real bank ever asks for these." },
  { re: /\b(account|card|kyc).{0,20}(blocked|suspended|locked|expire)/i, weight: 4, threat: "Phishing", reason: "Claims your account is blocked to rush you." },
  { re: /\b(click|tap|open|visit).{0,20}(link|here)|https?:\/\/|bit\.ly/i, weight: 2, threat: "Phishing", reason: "Pushes you to click a link that may steal your details." },
  { re: /\b(you (have )?won|lottery|prize|lucky draw|reward)\b/i, weight: 4, threat: "Fake job or lottery scam", reason: "Promises a prize or reward you never entered for." },
  { re: /\b(work from home|part[- ]time job|earn ₹?\d|per day|registration fee|joining fee)/i, weight: 4, threat: "Fake job or lottery scam", reason: "Offers easy money but asks for a fee upfront." },
  { re: /\b(send|transfer|pay|gpay|upi|paytm).{0,25}(money|₹|rs\.?|amount|\d{3,})/i, weight: 4, threat: "Financial request", reason: "Asks you to send money or make a payment." },
  { re: /\b(new number|lost my phone|it'?s me|this is your (friend|cousin|sister|brother))\b/i, weight: 4, threat: "Impersonation", reason: "Pretends to be someone you know from a new number." },
  { re: /\b(urgent|urgently|immediately|right now|within \d+ (hours?|minutes?)|asap|last chance|today only)\b/i, weight: 3, threat: "", reason: "Creates fake urgency so you don't stop to think." },
  { re: /\b(don'?t tell|keep this secret|no one (must|should) know|between us)\b/i, weight: 3, threat: "", reason: "Asks you to keep it secret — a classic isolation tactic." },
  { re: /\b(police|arrest|legal action|fir)\b/i, weight: 2, threat: "", reason: "Uses fake legal threats to frighten you." },
  { re: /\b(ugly|slut|whore|kill you|watching you|i know where you live|stupid)\b/i, weight: 5, threat: "Harassment", reason: "Contains abusive, intimidating or stalking language." },
];

export function analyze(text: string): Analysis {
  const counts: Record<string, number> = {};
  const reasons: string[] = [];
  let score = 0;
  for (const r of RULES) {
    if (r.re.test(text)) {
      score += r.weight;
      if (!reasons.includes(r.reason)) reasons.push(r.reason);
      if (r.threat) counts[r.threat] = (counts[r.threat] ?? 0) + r.weight;
    }
  }
  let threat = Object.entries(counts).sort((a, b) => b[1] - a[1])[0]?.[0] ?? "No clear threat";
  if (threat === "Financial request") threat = counts["Impersonation"] ? "Impersonation" : "Financial scam";
  const risk: Risk = score >= 7 ? "High" : score >= 3 ? "Medium" : "Low";
  if (reasons.length === 0) reasons.push("No common manipulation patterns found. Still trust your instincts.");
  return { risk, threat, reasons: reasons.slice(0, 4), score };
}

export const EXAMPLES = [
  { label: "Sextortion threat", text: "I have your photos and videos from your Instagram. Send ₹20,000 to this UPI within 24 hours or I will leak them to all your followers and family. Don't tell anyone or it gets worse." },
  { label: "Fake bank OTP", text: "Dear customer, your SBI account will be BLOCKED today due to pending KYC. Click this link http://sbi-kyc-update.co immediately and share the OTP sent to your phone to avoid suspension." },
  { label: "Fake job offer", text: "Congratulations! You are selected for a part-time work from home job. Earn ₹5000 per day by liking videos. Pay a small registration fee of ₹999 to start today only. Limited seats!" },
  { label: "Friend impersonation", text: "Hi it's me Priya, this is my new number, lost my phone. I'm in a hospital emergency, can you urgently send ₹8,000 on GPay? Will return tomorrow. Please don't tell mom." },
];
