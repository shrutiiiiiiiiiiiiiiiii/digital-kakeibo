export type EntryCategory = "needs" | "wants" | "culture" | "unexpected";

export type Entry = {
  _id: string;
  userId: string;
  amount: number;
  currency: string;
  category: EntryCategory;
  note?: string;
  noteHandwritingImage?: string | null;
  date: string;
  createdAt: string;
};

export type EntriesResponse = {
  entries: Entry[];
};

export type EntryResponse = {
  entry: Entry;
};
