import { formatINR } from "./money";

// Forecasts are estimates: show whole rupees, never ₹1,746.67.
const roundRupee = (paise: number) => Math.round(paise / 100) * 100;

export type TodayCard = {
  message: string;
  cta: "review_reminders" | "remind_anyway" | "tell_me" | null;
  gapPaise: number;
};

type Templates = {
  gapPositive: (supplier: string, amountPaise: number, day: string, expectedPaise: number, gapPaise: number, n: number) => string;
  gapZero: (day: string, n: number, owedPaise: number) => string;
  empty: string;
};

const TEMPLATES: Record<"en" | "kn" | "hi", Templates> = {
  en: {
    gapPositive: (supplier, amountPaise, day, expectedPaise, gapPaise, n) =>
      `You owe ${supplier} ${formatINR(amountPaise)} on ${day}. You'll likely collect ${formatINR(roundRupee(expectedPaise))} by then: ${formatINR(roundRupee(gapPaise))} short. Remind these ${n} customers.`,
    gapZero: (day, n, owedPaise) =>
      `You're covered for ${day}. ${n} customers still owe you ${formatINR(owedPaise)}.`,
    empty: "Tell me what happened today. Snap your khata page to start.",
  },
  kn: {
    gapPositive: (supplier, amountPaise, day, expectedPaise, gapPaise, n) =>
      `ನೀವು ${supplier} ಗೆ ${day} ರಂದು ${formatINR(amountPaise)} ಕೊಡಬೇಕು. ಅಲ್ಲಿಯವರೆಗೆ ${formatINR(roundRupee(expectedPaise))} ಸಿಗಬಹುದು: ${formatINR(roundRupee(gapPaise))} ಕಡಿಮೆ. ಈ ${n} ಗ್ರಾಹಕರಿಗೆ ನೆನಪಿಸಿ.`,
    gapZero: (day, n, owedPaise) =>
      `${day} ಕ್ಕೆ ನೀವು ಸುರಕ್ಷಿತರಾಗಿದ್ದೀರಿ. ${n} ಗ್ರಾಹಕರು ಇನ್ನೂ ${formatINR(owedPaise)} ಕೊಡಬೇಕು.`,
    empty: "ಇಂದು ಏನಾಯಿತು ಎಂದು ಹೇಳಿ. ನಿಮ್ಮ ಖಾತಾ ಪುಟದ ಫೋಟೋ ತೆಗೆಯಿರಿ.",
  },
  hi: {
    gapPositive: (supplier, amountPaise, day, expectedPaise, gapPaise, n) =>
      `आपको ${supplier} को ${day} को ${formatINR(amountPaise)} देने हैं। तब तक ${formatINR(roundRupee(expectedPaise))} मिलने की उम्मीद है: ${formatINR(roundRupee(gapPaise))} कम। इन ${n} ग्राहकों को याद दिलाएं।`,
    gapZero: (day, n, owedPaise) =>
      `${day} के लिए आप सुरक्षित हैं। ${n} ग्राहकों पर अभी भी ${formatINR(owedPaise)} बकाया है।`,
    empty: "आज क्या हुआ बताइए। अपने खाता पेज की फोटो खींचिए।",
  },
};

export function buildTodayCard(input: {
  language: "en" | "kn" | "hi";
  hasData: boolean;
  gapPaise: number;
  supplierName: string | null;
  supplierAmountPaise: number;
  horizonLabel: string;
  expectedInPaise: number;
  remindCount: number;
  totalOwedToMePaise: number;
}): TodayCard {
  const t = TEMPLATES[input.language] ?? TEMPLATES.en;

  if (!input.hasData) {
    return { message: t.empty, cta: "tell_me", gapPaise: 0 };
  }

  if (input.gapPaise > 0 && input.supplierName) {
    return {
      message: t.gapPositive(
        input.supplierName,
        input.supplierAmountPaise,
        input.horizonLabel,
        input.expectedInPaise,
        input.gapPaise,
        input.remindCount
      ),
      cta: "review_reminders",
      gapPaise: input.gapPaise,
    };
  }

  return {
    message: t.gapZero(input.horizonLabel, input.remindCount, input.totalOwedToMePaise),
    cta: "remind_anyway",
    gapPaise: input.gapPaise,
  };
}
