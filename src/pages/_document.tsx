import { Head, Html, Main, NextScript } from 'next/document';

import { ACCENT_STORAGE_KEY } from '~/lib/theme';

/**
 * Custom fork: restore the accent colour before hydration to avoid a flash of the default accent.
 * The colour mode itself is handled the same way by `next-themes`.
 */
const ACCENT_SCRIPT = `try{var a=localStorage.getItem('${ACCENT_STORAGE_KEY}');if(a){document.documentElement.dataset.accent=a}}catch(e){}`;

const Document = () => (
  <Html>
    <Head />
    <body>
      <script dangerouslySetInnerHTML={{ __html: ACCENT_SCRIPT }} />
      <Main />
      <NextScript />
    </body>
  </Html>
);

export default Document;
