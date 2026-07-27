"use client";

import { useEffect, useRef, useState } from "react";
import type { DetailedHTMLProps, HTMLAttributes } from "react";

// Pagefind's Component UI ships as web components that are not known to JSX.
// Declare the three we use so TSX accepts them. React 19 keeps JSX types under
// the react module, so augment there rather than the deprecated global.
type CustomElement<E = unknown> = DetailedHTMLProps<
  HTMLAttributes<HTMLElement>,
  HTMLElement
> &
  E;
declare module "react" {
  namespace JSX {
    interface IntrinsicElements {
      "pagefind-config": CustomElement<{ "excerpt-length"?: string }>;
      "pagefind-input": CustomElement<{ placeholder?: string }>;
      "pagefind-summary": CustomElement;
      "pagefind-results": CustomElement;
    }
  }
}

// Custom result template in Pagefind's template syntax ({{ }} escaped,
// {{+ +}} raw, {{#if}}/{{#each … as …}} blocks, `|` filters). It is a static
// string we author — no user input — so injecting it as HTML is safe. House
// list idiom (matching more-stories and archive): Fraunces title, ink link that
// goes crimson on hover, body excerpt, heading-scoped sub-results. The main
// link must be an <a> for the components' keyboard navigation. `meta.url` is
// read first so the clean route from data-pagefind-meta wins over Pagefind's
// `.html` file path; `{{+ excerpt +}}` keeps the <mark> highlights.
const RESULT_TEMPLATE = `
<script type="text/pagefind-template">
  <li class="result-item py-6">
    <p class="font-display text-2xl font-semibold leading-tight">
      <a class="result-link text-brand-dark transition-colors duration-200 hover:text-brand-crimson" href="{{ meta.url | default(url) | safeUrl }}">{{ meta.title | default("Untitled") }}</a>
    </p>
    {{#if excerpt}}
    <p class="mt-2 leading-relaxed text-brand-dark">{{+ excerpt +}}</p>
    {{/if}}
    {{#if sub_results}}
    <ul class="mt-3 space-y-3 pl-4">
      {{#each sub_results as sub}}
      <li>
        <p class="font-display text-lg font-semibold leading-tight">
          <span aria-hidden="true" class="mr-2 font-normal text-brand-muted">↳</span><a class="text-brand-dark transition-colors duration-200 hover:text-brand-crimson" href="{{ sub.url | safeUrl }}">{{ sub.title }}</a>
        </p>
        <p class="mt-1 leading-relaxed text-brand-dark">{{+ sub.excerpt +}}</p>
      </li>
      {{/each}}
    </ul>
    {{/if}}
  </li>
</script>
`;

export default function SearchClient() {
  const [failed, setFailed] = useState(false);
  // Guard against React strict mode double-invoking the effect in dev.
  const loadedRef = useRef(false);

  useEffect(() => {
    if (loadedRef.current) return;
    loadedRef.current = true;

    // The components are a build-time static bundle emitted into
    // public/pagefind/, not an npm package. Loading the build's own copy (not
    // @pagefind/component-ui from npm) guarantees it matches the CLI version
    // that built the index.
    const link = document.createElement("link");
    link.rel = "stylesheet";
    link.href = "/pagefind/pagefind-component-ui.css";
    document.head.appendChild(link);

    const script = document.createElement("script");
    script.type = "module";
    script.src = "/pagefind/pagefind-component-ui.js";
    // The index only exists after a production build, so the module 404s on
    // `next dev`. Show the friendly fallback rather than a broken UI.
    script.onerror = () => setFailed(true);
    document.body.appendChild(script);

    return () => {
      link.remove();
      script.remove();
    };
  }, []);

  if (failed) {
    return (
      <p className="text-brand-muted">
        Search is unavailable. The index is generated at build time, so it does
        not exist on the dev server until a production build has run.
      </p>
    );
  }

  return (
    <div className="pagefind-scope">
      <pagefind-config excerpt-length="30"></pagefind-config>
      <pagefind-input placeholder="What are you looking for?"></pagefind-input>
      {/* Result count / no-results line ("N results for X" / "No results for
          X"). The component fills the text; globals.css styles it and hides it
          while the input is empty. */}
      <pagefind-summary></pagefind-summary>
      {/* The result template is a static, self-authored string (see
          RESULT_TEMPLATE) injected as the element's only child; there is no
          user input, so dangerouslySetInnerHTML is safe here. */}
      <pagefind-results dangerouslySetInnerHTML={{ __html: RESULT_TEMPLATE }} />
    </div>
  );
}
