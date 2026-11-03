/** Consent Mode v2 defaults — must run before any Google tag. Region-agnostic: denied until the visitor chooses. */
export function ConsentDefaults() {
  const code = `window.dataLayer=window.dataLayer||[];function gtag(){dataLayer.push(arguments)}window.gtag=gtag;gtag('consent','default',{ad_storage:'denied',ad_user_data:'denied',ad_personalization:'denied',analytics_storage:'denied',functionality_storage:'granted',security_storage:'granted',wait_for_update:500});gtag('set','ads_data_redaction',true);gtag('set','url_passthrough',true);`;
  return <script dangerouslySetInnerHTML={{ __html: code }} />;
}
