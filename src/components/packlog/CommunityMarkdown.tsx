import type { ReactNode } from "react";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import { cn } from "@/lib/utils";
import { packlogProseCompact } from "@/lib/packlog-button-classes";

/** F1 区块标题 — 与 `packlogSectionTitle` 同源变量 */
const mdSectionTitle =
  "font-display text-foreground [font-size:var(--font-section-title-size)] [font-weight:var(--font-section-title-weight)] [line-height:var(--font-section-title-leading)]";

/** 与 `packlogCatTitle` 同源 */
const mdSubsection =
  "font-sans font-semibold text-foreground [font-size:var(--font-item-meta-size)] [line-height:var(--font-item-meta-leading)]";

/** 与 `packlogLabel` 同源 */
const mdMinorHeading =
  "font-sans font-medium text-foreground [font-size:var(--font-label-size)] [font-weight:var(--font-label-weight)] leading-snug";

/**
 * Renders trusted, bundled Markdown (community guide seeds only — not a public CMS).
 * Typography follows PACKLOG-SPEC F1/F2 (`styles.css` variables).
 *
 * `nestedGuide`: when the block sits under page `h1` and section `h2` (CloneSheet),
 * markdown `#`→`h3`、`##`→`h4`、`###`→`h5` so heading levels stay under「指南正文」`h2`.
 */
export function CommunityMarkdown({
  markdown,
  nestedGuide = true,
}: {
  markdown: string;
  /** Default true — only CloneSheet uses this component today. */
  nestedGuide?: boolean;
}) {
  const h1Class = nestedGuide
    ? cn(mdSectionTitle, "mt-6 scroll-mt-28 first:mt-0")
    : cn(
        "font-display font-bold tracking-tight text-foreground [font-size:var(--font-page-title-size)] [font-weight:var(--font-page-title-weight)] [line-height:var(--font-page-title-leading)]",
        "mt-6 scroll-mt-28 first:mt-0",
      );

  const h2Class = nestedGuide
    ? cn(mdSubsection, "mt-6 scroll-mt-24 border-b border-border pb-1.5 first:mt-0")
    : cn(mdSectionTitle, "mt-8 scroll-mt-28 border-b border-border pb-2 first:mt-0");

  const h3Class = nestedGuide
    ? cn(mdMinorHeading, "mt-4 scroll-mt-20 first:mt-0")
    : cn(mdSubsection, "mt-5 scroll-mt-24 first:mt-0");

  const h4Class = cn(mdMinorHeading, "mt-4 text-[var(--text-secondary)] first:mt-0");

  const headingComponents = nestedGuide
    ? {
        h1: ({ children }: { children?: ReactNode }) => <h3 className={h1Class}>{children}</h3>,
        h2: ({ children }: { children?: ReactNode }) => <h4 className={h2Class}>{children}</h4>,
        h3: ({ children }: { children?: ReactNode }) => <h5 className={h3Class}>{children}</h5>,
        h4: ({ children }: { children?: ReactNode }) => <h6 className={h4Class}>{children}</h6>,
      }
    : {
        h1: ({ children }: { children?: ReactNode }) => <h1 className={h1Class}>{children}</h1>,
        h2: ({ children }: { children?: ReactNode }) => <h2 className={h2Class}>{children}</h2>,
        h3: ({ children }: { children?: ReactNode }) => <h3 className={h3Class}>{children}</h3>,
        h4: ({ children }: { children?: ReactNode }) => <h4 className={h4Class}>{children}</h4>,
      };

  return (
    <div
      className={cn(
        "community-md max-w-none text-pretty",
        packlogProseCompact,
        "[&_p]:mt-3 [&_p]:first:mt-0",
        "[&_ul]:mt-3 [&_ul]:list-disc [&_ul]:pl-5",
        "[&_ol]:mt-3 [&_ol]:list-decimal [&_ol]:pl-5",
        "[&_li]:mt-1.5",
        "[&_strong]:font-semibold [&_strong]:text-foreground",
        "[&_em]:italic",
        "[&_a]:text-link [&_a]:underline [&_a]:underline-offset-2",
        "[&_code]:rounded [&_code]:border [&_code]:border-border-strong [&_code]:bg-surface-2 [&_code]:px-1.5 [&_code]:py-0.5 [&_code]:font-mono [&_code]:[font-size:var(--font-card-mono-size)] [&_code]:leading-[var(--font-card-mono-leading)]",
        "[&_pre]:mt-3 [&_pre]:overflow-x-auto [&_pre]:rounded-md [&_pre]:border [&_pre]:border-border-strong [&_pre]:bg-surface-2 [&_pre]:p-3 [&_pre]:font-mono [&_pre]:[font-size:var(--font-card-mono-size)] [&_pre]:leading-relaxed",
        "[&_table]:mt-4 [&_table]:w-full [&_table]:border-collapse [&_table]:font-mono [&_table]:[font-size:var(--font-card-mono-size)] [&_table]:leading-[var(--font-card-mono-leading)] [&_table]:text-[var(--text-secondary)]",
        "[&_th]:border [&_th]:border-border-strong [&_th]:bg-surface-2 [&_th]:px-3 [&_th]:py-2 [&_th]:text-left",
        "[&_td]:border [&_td]:border-border [&_td]:px-3 [&_td]:py-2",
        "[&_hr]:my-8 [&_hr]:border-border",
        "[&_blockquote]:mt-3 [&_blockquote]:border-l-2 [&_blockquote]:border-signal/45 [&_blockquote]:pl-4 [&_blockquote]:[font-size:var(--font-hint-size)] [&_blockquote]:[font-weight:var(--font-hint-weight)] [&_blockquote]:leading-relaxed [&_blockquote]:text-[var(--text-tertiary)]",
      )}
    >
      <ReactMarkdown
        remarkPlugins={[remarkGfm]}
        components={{
          a: ({ href, children, ...rest }) => (
            <a href={href} target="_blank" rel="noopener noreferrer" {...rest}>
              {children}
            </a>
          ),
          ...headingComponents,
        }}
      >
        {markdown}
      </ReactMarkdown>
    </div>
  );
}
