import { ImageResponse } from "next/og";

const SIZES = ["192", "512"] as const;

export function generateStaticParams() {
  return SIZES.map((size) => ({ size }));
}

/** Ícone do app gerado (tesoura dourada sobre preto quente). Troque por arte final depois. */
export async function GET(_req: Request, ctx: RouteContext<"/pwa-icon/[size]">) {
  const { size } = await ctx.params;
  const px = size === "512" ? 512 : 192;
  return new ImageResponse(
    (
      <div style={{ width: "100%", height: "100%", display: "flex", alignItems: "center", justifyContent: "center", background: "#0b0907" }}>
        <div style={{ width: px * 0.62, height: px * 0.62, borderRadius: px, background: "#ffad01", display: "flex", alignItems: "center", justifyContent: "center" }}>
          <svg width={px * 0.32} height={px * 0.32} viewBox="0 0 24 24" fill="none" stroke="#0b0907" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
            <circle cx="6" cy="6" r="3" />
            <circle cx="6" cy="18" r="3" />
            <path d="M20 4 8.12 15.88M14.47 14.48 20 20M8.12 8.12 12 12" />
          </svg>
        </div>
      </div>
    ),
    { width: px, height: px },
  );
}
