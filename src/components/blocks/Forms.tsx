import { CareersForm } from "@/components/site/forms/CareersForm";
import { NewsletterForm } from "@/components/site/forms/NewsletterForm";
import { Band, SectionHead } from "./Section";
import type { BlockProps, HeadProps } from "./types";

export function CareersBlock({ site }: BlockProps) {
  const t = site.t;
  return (
    <section className="bg-paper">
      <div className="container-x max-w-4xl py-16 md:py-24">
        <CareersForm
          locale={site.locale}
          labels={{
            name: t("form.name"), phone: t("form.phone"), email: t("form.email"), job: t("form.job_title"), cv: t("form.cv"), message: t("form.message"),
            consent: t("form.consent"), submit: t("form.submit_career"), sending: t("form.sending"), successTitle: t("form.success_title"), successText: t("form.career_success"),
            errGeneric: t("form.error_generic"), errRate: t("form.error_rate"), errRequired: t("form.error_required"), errEmail: t("form.error_email"),
            errPhone: t("form.error_phone"), errFile: t("form.error_file"), errConsent: t("form.error_consent"),
          }}
        />
      </div>
    </section>
  );
}

export function NewsletterBlock({ site, props, refCode }: BlockProps<HeadProps>) {
  const t = site.t;
  return (
    <Band tone="paper-2">
      <div className="grid gap-8 lg:grid-cols-12 lg:items-end">
        <div className="lg:col-span-7">
          <SectionHead site={site} refCode={refCode} head={{ eyebrow: props.eyebrow, title: props.title ?? { [site.locale]: t("newsletter.title") }, intro: props.intro ?? { [site.locale]: t("newsletter.text") } }} align="stack" />
        </div>
        <div className="lg:col-span-5 lg:pb-16">
          <NewsletterForm locale={site.locale} labels={{ placeholder: t("newsletter.placeholder"), submit: t("newsletter.submit"), success: t("newsletter.check_email"), error: t("form.error_generic"), invalid: t("form.error_email"), rate: t("form.error_rate") }} />
        </div>
      </div>
    </Band>
  );
}
