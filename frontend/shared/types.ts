export type User = {
  id: string;
  email: string;
  locale: "en" | "ja";
  settings: {
    weeklyReminderDay: number;
    currency: string;
  };
  createdAt: string;
};
