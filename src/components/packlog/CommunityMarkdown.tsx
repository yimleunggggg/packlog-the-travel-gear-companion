import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import { cn } from "@/lib/utils";

/**
 * Renders trusted, bundled Markdown (community guide seeds only — not a public CMS).
 */
export function CommunityMarkdown({ markdown }: { markdown: string }) {
  return (
    <div
      className={cn(
        "community-md max-w-none text-sm leading-relaxed text-foreground/90",
        "[&_h2]:mt-5 [&_h2]:border-b [&_h2]:border-border [&_h2]:pb-1 [&_h2]:font-display [&_h2]:text-base [&_h2]:font-normal",
        "[&_h3]:mt-4 [&_h3]:font-mono [&_h3]:text-[11px] [&_h3]:uppercase [&_h3]:tracking-[0.18em] [&_h3]:text-muted-foreground",
        "[&_p]:mt-2 [&_p]:first:mt-0",
        "[&_ul]:mt-2 [&_ul]:list-disc [&_ul]:pl-5",
        "[&_ol]:mt-2 [&_ol]:list-decimal [&_ol]:pl-5",
        "[&_li]:mt-1",
        "[&_strong]:font-semibold [&_strong]:text-foreground",
        "[&_em]:italic",
        "[&_a]:text-link [&_a]:underline [&_a]:underline-offset-2",
        "[&_code]:rounded [&_code]:border [&_code]:border-border-strong [&_code]:bg-surface-2 px-1 py-px [&_code]:font-mono [&_code]:text-[11px]",
        "[&_pre]:mt-2 [&_pre]:overflow-x-auto [&_pre]:rounded [&_pre]:border [&_pre]:border-border-strong [&_pre]:bg-surface-2 p-3 [&_pre]:font-mono [&_pre]:text-[11px]",
        "[&_table]:mt-3 [&_table]:w-full [&_table]:border-collapse [&_table]:text-xs",
        "[&_th]:border [&_th]:border-border-strong [&_th]:bg-surface-2 px-2 py-1.5 text-left font-mono",
        "[&_td]:border [&_td]:border-border px-2 py-1.5",
        "[&_hr]:my-6 [&_hr]:border-border",
        "[&_blockquote]:mt-2 [&_blockquote]:border-l-2 [&_blockquote]:border-signal/50 [&_blockquote]:pl-3 [&_blockquote]:text-muted-foreground",
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
        }}
      >
        {markdown}
      </ReactMarkdown>
    </div>
  );
}
