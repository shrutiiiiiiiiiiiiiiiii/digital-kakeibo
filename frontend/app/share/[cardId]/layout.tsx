import type { Metadata } from "next";
import { API_BASE_URL } from "@/lib/api";
import type { ShareCardPayload } from "@/lib/share-cards";

export async function generateMetadata({
  params,
}: {
  params: Promise<{ cardId: string }>;
}): Promise<Metadata> {
  const { cardId } = await params;
  const title = "Shared Monthly Card";
  const description = "A shared Digital Kakeibo monthly card.";

  try {
    const response = await fetch(`${API_BASE_URL}/share-cards/${cardId}`, {
      method: "GET",
      cache: "no-store",
    });
    if (response.ok) {
      const data = (await response.json()) as ShareCardPayload;
      const month = data.monthYear;
      return {
        title: `${month} - Shared Kakeibo Card`,
        description,
        openGraph: {
          title: `${month} - Shared Kakeibo Card`,
          description,
          type: "article",
        },
        twitter: {
          card: "summary_large_image",
          title: `${month} - Shared Kakeibo Card`,
          description,
        },
      };
    }
  } catch {
    // Fallback metadata below.
  }

  return {
    title,
    description,
  };
}

export default function ShareCardLayout({ children }: { children: React.ReactNode }) {
  return children;
}
