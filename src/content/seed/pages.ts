import { md } from "@/lib/rich";
import type { Block, Page } from "@/lib/types";

let n = 0;
const b = (type: string, props: Record<string, unknown>, hidden = false): Block => ({ id: `${type}-${++n}`, type, props, ...(hidden ? { hidden } : {}) });

const cta = () =>
  b("cta", {
    title: { ar: "لنناقش احتياجات منشأتك", en: "Let's talk about your business" },
    text: {
      ar: "أخبرنا بما تحتاجه، وسيتواصل معك أحد المتخصصين لدينا.",
      en: "Tell us what you need and one of our specialists will get back to you.",
    },
    primary: { label: { ar: "احجز استشارة", en: "Book a consultation" }, href: "/contact" },
    secondary: { label: { ar: "تواصل عبر واتساب", en: "Message us on WhatsApp" }, href: "whatsapp" },
  });

const header = (eyebrow: Record<string, string>, title: Record<string, string>, intro: Record<string, string>) =>
  b("pageHeader", { eyebrow, title, intro });

const aboutBody = {
  ar: "تأسس المكتب الاستشاري المتخصص (SCO) عام 2005، وبدأ تقديم خدماته للعملاء من خلال مجموعة متميزة من العاملين في مجال المحاسبة والمراجعة والضرائب، ثم تطوّر سريعًا ليصبح مؤسسة تقدّم خدمات متكاملة تشمل: الاستشارات المالية والإدارية، والموارد البشرية، والخدمات والاستشارات القانونية، وإنشاء وتأسيس الشركات والجامعات والمدارس الخاصة والهيئات التي لا تهدف إلى الربح (الجمعيات والمؤسسات الأهلية)، والهيكلة المالية والإدارية، وإعداد الخطط الاستراتيجية للشركات وخطط تمويل المشروعات، فضلًا عن خدمات الحراسة القضائية وتصفية الشركات.",
  en: "The Specialized Consulting Office (SCO) was founded in 2005 by a distinguished team of accounting, audit and tax professionals, and quickly grew into a full-service firm. Today our work spans financial and management consulting, human resources, legal services and advice, and the formation of companies, private universities, schools and non-profit organisations (NGOs and foundations). We also lead financial and organisational restructuring, prepare corporate strategic plans and project-financing plans, and act in judicial receiverships and company liquidations.",
};

export const pages: Page[] = [
  {
    slug: "",
    kind: "system",
    published: true,
    title: { ar: "الرئيسية", en: "Home" },
    seo: { ar: {}, en: {} },
    blocks: [
      b("hero", {
        title: { ar: "مراجعة دقيقة ومشورة *تُبنى عليها* القرارات", en: "Rigorous audit. Advice you can *build decisions on.*" },
        subtitle: {
          ar: "منذ عام {founded} يقدّم المكتب الاستشاري المتخصص خدمات المراجعة والمحاسبة والضرائب وتأسيس الشركات ودراسات الجدوى وتمويل المشروعات للشركات والمستثمرين والمؤسسات الأهلية.",
          en: "Since {founded}, the Specialized Consulting Office has provided audit, accounting, tax, company formation, feasibility and project-finance services to companies, investors and non-profit organisations.",
        },
        primary: { label: { ar: "احجز استشارة", en: "Book a consultation" }, href: "/contact" },
        secondary: { label: { ar: "استكشف خدماتنا", en: "Explore our services" }, href: "/services" },
        show_contacts: true,
      }),
      b("textMedia", {
        eyebrow: { ar: "من نحن", en: "Our firm" },
        title: { ar: "{years} عامًا من الخبرة", en: "{years} years of practice" },
        text: aboutBody,
        image: "/legacy/office/office.jpg",
        image_alt: { ar: "قاعة اجتماعات المكتب الاستشاري المتخصص", en: "SCO meeting room" },
        video_url: "https://www.youtube.com/watch?v=3xzxlWo8TGc",
        link: { label: { ar: "تعرّف على المكتب", en: "About the firm" }, href: "/about" },
        media_side: "end",
        collage: [
          { src: "/legacy/gallery/09-swedish-ambassador.jpg", alt: { ar: "لقاء مع سفير دولة السويد", en: "Meeting with the Ambassador of Sweden" } },
          { src: "/legacy/gallery/07-wayana-mou-signing.jpg", alt: { ar: "توقيع مذكرة تفاهم", en: "Signing a memorandum of understanding" } },
        ],
      }),
      b("services", {
        eyebrow: { ar: "خدماتنا", en: "What we do" },
        title: { ar: "خدمات متكاملة لكل مرحلة من مراحل نمو منشأتك", en: "Integrated services for every stage of your organisation's growth" },
        intro: {
          ar: "نساعد المنظمات على العمل بذكاء أكبر والنمو بشكل أسرع: بناء مؤسسات فعّالة، وخفض التكاليف، وإدارة المخاطر والالتزام التنظيمي، والاستفادة من المواهب.",
          en: "We help organisations work smarter and grow faster: building effective organisations, reducing costs, managing risk and regulation, and making the most of their talent.",
        },
        layout: "grid",
      }),
      b("process", {
        eyebrow: { ar: "منهجية المراجعة", en: "How an audit runs" },
        title: { ar: "من التخطيط إلى *تقرير مراقب الحسابات*", en: "From planning to the *auditor's report*" },
        intro: {
          ar: "نُجري المراجعة طبقًا لمعايير المراجعة المصرية والدولية، في مراحل واضحة يعرفها العميل مسبقًا.",
          en: "Every audit follows Egyptian and International Standards on Auditing, in clear stages our clients know in advance.",
        },
        steps: [
          { title: { ar: "التخطيط وفهم المنشأة", en: "Planning around the entity" }, text: { ar: "مراجعة اختبارية للسجلات والمستندات وفق إجراءات مخططة في ضوء ظروف المنشأة.", en: "Test examination of records and documents, following procedures planned around the entity's circumstances." } },
          { title: { ar: "فحص السياسات والتقديرات", en: "Policies and estimates" }, text: { ar: "تقييم المبادئ والسياسات المحاسبية والمخصصات التي تحددها الإدارة بطريق التقدير.", en: "Evaluating accounting principles, policies and the provisions management sets by estimate." } },
          { title: { ar: "المراجعة الدورية ونظم الرقابة", en: "Interim audit and controls" }, text: { ar: "فحص النظم المحاسبية ونظم الرقابة الداخلية واختبار سلامة تطبيقها خلال العام.", en: "Examining accounting systems and internal controls, and testing how soundly they are applied during the year." } },
          { title: { ar: "خطاب الإدارة", en: "Management letter" }, text: { ar: "ملاحظاتنا الهامة وتوصياتنا لمعالجتها، بعد مناقشتها مع إدارة المنشأة.", en: "Our significant findings and recommendations, discussed with management first." } },
          { title: { ar: "المراجعة النهائية", en: "Year-end audit" }, text: { ar: "مطابقة الحسابات الختامية، والتحقق من الأصول والالتزامات، وفحص قائمة الدخل والإفصاحات.", en: "Reconciling final accounts, verifying assets and liabilities, and examining the income statement and disclosures." } },
          { title: { ar: "تقرير مراقب الحسابات", en: "The auditor's report" }, text: { ar: "تقرير مراقب الحسابات على القوائم المالية في نهاية السنة المالية.", en: "The statutory auditor's report on the financial statements at the end of the financial year." } },
        ],
      }),
      b("stats", {
        eyebrow: { ar: "لماذا SCO", en: "Why SCO" },
        title: { ar: "لماذا تختار المكتب الاستشاري المتخصص؟", en: "Why choose the Specialized Consulting Office?" },
        text: {
          ar: "ساعدنا المئات من الشركات الكبرى والآلاف من الشركات الصغيرة والمتوسطة على اتخاذ القرارات الصحيحة.",
          en: "We have helped hundreds of leading companies and thousands of small and medium-sized businesses make the right decisions.",
        },
      }),
      b("cards", {
        eyebrow: { ar: "كيف نعمل", en: "How we work" },
        title: { ar: "شريك ومدير لكل عميل", en: "A partner and a manager for every client" },
        columns: 3,
        items: [
          { icon: "team", title: { ar: "فلسفتنا بسيطة: مساعدتك على النجاح", en: "A simple philosophy: helping clients succeed" }, text: { ar: "نهدف إلى مساعدة عملائنا على النجاح، ولهذا نخصص لكل عميل فريق عمل متخصصًا برئاسة شريك ومدير مراجعة.", en: "We want our clients to succeed. That's why each client has a dedicated team led by a partner and an audit manager." } },
          { icon: "layers", title: { ar: "تنوّعنا في خدمة تركيزك", en: "Our diversity, your focus" }, text: { ar: "مجموعة واسعة من الخدمات عالية الجودة لكل مرحلة من مراحل نمو منشأتك.", en: "A wide range of high-quality services for every stage of your organisation's growth." } },
          { icon: "target", title: { ar: "هدفنا", en: "Our goal" }, text: { ar: "مشورة متخصصة للشركات الريادية والمنظمات غير الهادفة للربح والأفراد.", en: "Specialist advice for entrepreneurial businesses, not-for-profit organisations and private individuals." } },
        ],
      }),
      b("team", { eyebrow: { ar: "القيادة", en: "Leadership" }, title: { ar: "خبرة يقودها محاسبون قانونيون وخبراء ضرائب", en: "Led by chartered accountants and tax experts" }, link: { label: { ar: "تعرّف على الفريق", en: "Meet the team" }, href: "/team" } }),
      b("clients", {
        eyebrow: { ar: "عملاؤنا", en: "Clients" },
        title: { ar: "موضع ثقة الشركات والجهات المانحة والمؤسسات الأهلية", en: "Trusted by companies, donors and non-profits" },
        mode: "marquee",
        link: { label: { ar: "جميع العملاء", en: "All clients" }, href: "/clients" },
      }),
      b("credentials", {
        eyebrow: { ar: "القيد والعضويات", en: "Registrations & memberships" },
        title: { ar: "اعتمادات مهنية موثّقة", en: "Documented professional credentials" },
      }),
      b("gallery", { eyebrow: { ar: "من أنشطتنا", en: "From our activities" }, title: { ar: "لقاءات وفعاليات وشراكات", en: "Meetings, events and partnerships" }, limit: 6, link: { label: { ar: "المعرض كاملًا", en: "Full gallery" }, href: "/gallery" } }),
      b("faq", {
        eyebrow: { ar: "الأسئلة الشائعة", en: "Tax FAQ" },
        title: { ar: "أسئلة متكررة حول ضريبة المرتبات", en: "Common questions on payroll tax" },
        group: "payroll-tax",
        limit: 4,
        link: { label: { ar: "جميع الأسئلة", en: "All questions" }, href: "/faq" },
      }),
      cta(),
    ],
  },
  {
    slug: "about",
    kind: "system",
    published: true,
    title: { ar: "من نحن", en: "About SCO" },
    seo: {
      ar: { title: "من نحن", description: "المكتب الاستشاري المتخصص (SCO) – محمود الشيخ وشركاه: محاسبون قانونيون ومستشارون وخبراء ضرائب منذ عام 2005 في القاهرة." },
      en: { title: "About SCO", description: "Specialized Consulting Office (SCO) – Mahmoud El Sheikh & Co.: chartered accountants, consultants and tax advisers in Cairo since 2005." },
    },
    blocks: [
      header({ ar: "من نحن", en: "About SCO" }, { ar: "{years} عامًا من النجاح", en: "{years} years of success" }, { ar: "المكتب الاستشاري المتخصص (SCO) – محمود الشيخ وشركاه، محاسبون قانونيون ومستشارون وخبراء ضرائب.", en: "Specialized Consulting Office (SCO) – Mahmoud El Sheikh & Co., Chartered Accountants, Consultants & Tax Advisers." }),
      b("textMedia", { eyebrow: { ar: "قصتنا", en: "Our story" }, title: { ar: "من مكتب محاسبة إلى مؤسسة متكاملة الخدمات", en: "From an accounting practice to a full-service firm" }, text: aboutBody, image: "/legacy/office/office.jpg", image_alt: { ar: "قاعة اجتماعات المكتب", en: "SCO meeting room" }, video_url: "https://www.youtube.com/watch?v=3xzxlWo8TGc", media_side: "end" }),
      b("richText", {
        eyebrow: { ar: "لماذا نحن", en: "Why us" },
        title: { ar: "اختيار مراقب الحسابات قرار مهم", en: "Choosing your auditor is an important decision" },
        body: {
          ar: md(`إننا على يقين بأن اختيار مراقب الحسابات أو المستشار المالي أو الإداري لأي منشأة، بغض النظر عن شكلها القانوني، عملية مهمة وحساسة، خصوصًا إذا كانت المنشأة رائدة في أعمالها ونشاطها ولها سمعتها ومكانتها؛ لأن ذلك يعتمد على مدى توافر المهارات والخبرات العملية والعلمية والتقنية لدى مكتب المحاسب القانوني.

وبما أننا نمتلك الكفاءات والخبرات المتخصصة التي تؤهلنا لنكون المكتب الملائم كمراجعين لمنشأتكم، فإنه يسعدنا عرض نطاق الخدمات المختلفة وأسلوب تنفيذها، والاستعداد في أي وقت لتوضيح ومناقشة أي استفسارات، آملين أن يكون ذلك بداية لتعاون مستمر ومثمر.`),
          en: md(`Your company deserves the highest quality of professional service from a well-established firm with strong resources and people of the highest calibre. The Specialized Consulting Office (SCO), Chartered Accountants, Consultants and Tax Advisers, is one of Egypt's professional services firms.

We would welcome the opportunity to serve as your auditors and business advisers. Call us whenever you need more information or would like to discuss our services; we will gladly clarify any matter and look forward to a long and successful relationship.`),
        },
      }),
      b("values", {
        eyebrow: { ar: "قيمنا الجوهرية", en: "Our core values" },
        title: { ar: "ما نلتزم به في كل عمل", en: "What we commit to in every engagement" },
        intro: { ar: "تمشيًا مع متطلبات سياستنا، نلتزم في مكتبنا بالقيم التالية:", en: "In line with our policy, we uphold these core values:" },
        items: [
          { ar: "احترام العميل وممثليه دائمًا.", en: "Always respect clients and their representatives." },
          { ar: "مراعاة القوانين والمحافظة على أخلاقيات المهنة.", en: "Observe the law and uphold high ethical standards." },
          { ar: "الاعتماد على الابتكار والمبادرة لمساعدة العملاء في مواكبة التغيرات.", en: "Use innovation and initiative to help clients manage change." },
          { ar: "إرساء الثقة المشتركة والتفاهم المتبادل مع العميل.", en: "Build mutual trust and understanding." },
          { ar: "السعي المستمر إلى التميز والاحتراف في كل ما نقوم به.", en: "Strive for excellence and professionalism in everything we do." },
        ],
      }),
      b("quote", {
        text: {
          ar: "قبل كل شيء، نسعى باستمرار في المكتب الاستشاري المتخصص «محمود الشيخ وشركاه» – محاسبون قانونيون ومستشارون وخبراء ضرائب – إلى الالتزام بأعلى المعايير المهنية، وتقديم المشورة السليمة لعملائنا مع الحفاظ على استقلالنا بكل وضوح. إننا منفتحون وصادقون في تواصلنا، نتبادل المعلومات والرؤى والمشورة بصورة متكررة وبنّاءة، ونتعامل مع المواقف الصعبة بشجاعة وصراحة.",
          en: "Above all, we act with integrity, constantly striving to uphold the highest professional standards by giving sound advice and rigorously maintaining our independence. We are open and honest in our communication, sharing information, insight and advice frequently and constructively, and managing tough situations with courage and candour.",
        },
        cite: { ar: "محمود الشيخ وشركاه", en: "Mahmoud El Sheikh & Co." },
      }),
      b("cards", {
        eyebrow: { ar: "ما يميزنا", en: "What sets us apart" },
        title: { ar: "خدمة مصممة على مقاسك", en: "Service tailored to you" },
        columns: 3,
        items: [
          { icon: "spark", title: { ar: "الدعم: إحداث فارق", en: "Synergy: making a difference" }, text: { ar: "دور فريق العمل المخصص لك هو تشكيل الخدمة عالية الجودة من المكتب الاستشاري المتخصص وتصميمها عند الحاجة إليها.", en: "Your client service team's role is to tailor the right SCO service, from consultants and tax advisers, exactly when you need it." } },
          { icon: "layers", title: { ar: "تنوّعنا في خدمة تركيزك", en: "Our diversity, your focus" }, text: { ar: "مجموعة واسعة من الخدمات لكل مرحلة من مراحل نمو منشأتكم.", en: "A wide range of high-quality services for every stage of your organisation's growth." } },
          { icon: "building", title: { ar: "مكتبنا يقدّم مختلف الخدمات", en: "One office, a full range of services" }, text: { ar: "خبراء معترف بهم كمقدمي خدمات مالية واستشارية لأعمال المراجعة والاستشارات الضريبية والزكوية، بما يشمل المحاسبة والاستشارات الإدارية واستشارات نظم المعلومات وسائر الخدمات الاستشارية.", en: "Recognised providers of financial and advisory services alongside audit and tax (including zakat) advice, covering accounting, management consulting, information systems consulting and other advisory services." } },
          { icon: "team", title: { ar: "فلسفتنا بسيطة: مساعدتك على النجاح", en: "A simple philosophy: helping clients succeed" }, text: { ar: "نهدف لمساعدة عملائنا على النجاح، ولهذا نخصص لكل عميل فريق عمل متخصصًا برئاسة شريك ومدير مراجعة.", en: "We want to help clients succeed. That's why every client has a dedicated team headed by a partner and a manager." } },
          { icon: "target", title: { ar: "هدفنا", en: "Our goal" }, text: { ar: "المشورة المتخصصة للشركات الريادية والمنظمات غير الهادفة للربح والأفراد.", en: "Specialist advice for entrepreneurial businesses, not-for-profit organisations and private individuals." } },
          // Legacy claim not yet verified (OPEN_QUESTIONS A4) — kept, hidden.
          { icon: "globe", hidden: true, title: { ar: "القوة الدولية", en: "International strength" }, text: { ar: "وقد أنشئت مناطق رئيسية ومنسقة على التوالي من قبل المديرين التنفيذيين الإقليميين في أوروبا والشرق الأوسط وأفريقيا (EMEA).", en: "Key regions have been established and are coordinated by regional executives in Europe, the Middle East and Africa (EMEA)." } },
        ],
      }),
      b("team", { eyebrow: { ar: "القيادة", en: "Leadership" }, title: { ar: "الهيكل الوظيفي", en: "Our leadership team" }, link: { label: { ar: "تعرّف على الفريق", en: "Meet the team" }, href: "/team" } }),
      b("credentials", { eyebrow: { ar: "القيد والعضويات", en: "Registrations & memberships" }, title: { ar: "اعتمادات مهنية موثّقة", en: "Documented professional credentials" } }),
      b("gallery", { eyebrow: { ar: "من أنشطتنا", en: "From our activities" }, title: { ar: "معرض الصور", en: "Gallery" }, limit: 6, link: { label: { ar: "المعرض كاملًا", en: "Full gallery" }, href: "/gallery" } }),
      cta(),
    ],
  },
  {
    slug: "services",
    kind: "system",
    published: true,
    title: { ar: "خدماتنا", en: "Services" },
    seo: {
      ar: { title: "خدماتنا", description: "المراجعة الخارجية، والخدمات المحاسبية، والخدمات الضريبية، وتأسيس الشركات، ودراسات الجدوى، وتمويل المشروعات." },
      en: { title: "Services", description: "External audit, accounting and bookkeeping, tax services, company formation, feasibility studies and project finance in Egypt." },
    },
    blocks: [
      header({ ar: "خدماتنا", en: "Services" }, { ar: "خدمات مالية وضريبية وقانونية متكاملة", en: "Integrated financial, tax and corporate services" }, { ar: "نساعد المنظمات على العمل بذكاء أكبر والنمو بشكل أسرع: بناء مؤسسات فعّالة، وخفض التكاليف، وإدارة المخاطر والالتزام التنظيمي، والاستفادة من المواهب.", en: "We help organisations work smarter and grow faster: building effective organisations, reducing costs, managing risk and regulation, and making the most of their talent." }),
      b("services", { layout: "list" }),
      b("alsoOffered", { eyebrow: { ar: "ضمن نطاق عملنا أيضًا", en: "Also within our practice" }, title: { ar: "خدمات أخرى يقدّمها المكتب", en: "Other services we provide" } }),
      cta(),
    ],
  },
  {
    slug: "team",
    kind: "system",
    published: true,
    title: { ar: "فريق العمل", en: "Team" },
    seo: {
      ar: { title: "فريق العمل والهيكل الوظيفي", description: "قيادة المكتب الاستشاري المتخصص: محاسبون قانونيون وخبراء ضرائب ومستشارون ماليون." },
      en: { title: "Leadership team", description: "Meet SCO's leadership: chartered accountants, tax experts and financial advisers." },
    },
    blocks: [
      header({ ar: "الهيكل الوظيفي", en: "Our people" }, { ar: "فريق يقوده محاسبون قانونيون وخبراء ضرائب", en: "Led by chartered accountants and tax experts" }, { ar: "يُدار كل عميل من خلال فريق متخصص برئاسة شريك ومدير مراجعة.", en: "Every client is served by a dedicated team led by a partner and an audit manager." }),
      b("team", {}),
      b("credentials", { eyebrow: { ar: "القيد والعضويات", en: "Registrations & memberships" }, title: { ar: "اعتمادات مهنية موثّقة", en: "Documented professional credentials" } }),
      cta(),
    ],
  },
  {
    slug: "clients",
    kind: "system",
    published: true,
    title: { ar: "عملاؤنا", en: "Clients" },
    seo: {
      ar: { title: "عملاؤنا", description: "أهم عملاء المكتب الاستشاري المتخصص من الشركات والجهات المانحة والجمعيات والمؤسسات الأهلية." },
      en: { title: "Clients", description: "SCO's principal corporate clients, contracted donors and development agencies, and NGO clients." },
    },
    blocks: [
      header({ ar: "عملاؤنا", en: "Clients" }, { ar: "شركات وجهات مانحة ومؤسسات أهلية", en: "Companies, donors and non-profits" }, { ar: "نفخر بثقة عملائنا في قطاعات الرعاية الصحية والعقارات والصناعة والزراعة والتدريب والعمل الأهلي.", en: "We are proud of the trust placed in us by clients across healthcare, real estate, industry, agriculture, training and the non-profit sector." }),
      b("clients", { mode: "full" }),
      cta(),
    ],
  },
  {
    slug: "faq",
    kind: "system",
    published: true,
    title: { ar: "الأسئلة الشائعة", en: "FAQ" },
    seo: {
      ar: { title: "الأسئلة الشائعة حول ضريبة المرتبات", description: "إجابات عن 30 سؤالًا شائعًا حول ضريبة المرتبات وما في حكمها والإقرارات والإعفاءات والتزامات أصحاب الأعمال." },
      en: { title: "Payroll tax FAQ", description: "Answers to 30 common questions on Egyptian salary tax, returns, exemptions and employer obligations." },
    },
    blocks: [
      header({ ar: "الأسئلة الشائعة", en: "FAQ" }, { ar: "ضريبة المرتبات وما في حكمها", en: "Salary tax and similar payments" }, { ar: "إجابات عن أكثر الأسئلة شيوعًا حول ضريبة المرتبات والإقرارات والإعفاءات والتزامات أصحاب الأعمال.", en: "Answers to the questions we hear most often on salary tax, returns, exemptions and employer obligations." }),
      b("faq", { group: "payroll-tax", show_notice: true }),
      cta(),
    ],
  },
  {
    slug: "gallery",
    kind: "system",
    published: true,
    title: { ar: "معرض الصور", en: "Gallery" },
    seo: {
      ar: { title: "معرض الصور", description: "صور من فعاليات وأنشطة المكتب الاستشاري المتخصص ولقاءاته مع العملاء والشركاء." },
      en: { title: "Gallery", description: "Photos from SCO's events, activities and meetings with clients and partners." },
    },
    blocks: [header({ ar: "معرض الصور", en: "Gallery" }, { ar: "من أنشطتنا وفعالياتنا", en: "From our activities and events" }, { ar: "لقاءات مع العملاء والشركاء، وبرامج تدريبية، ومشاركات مجتمعية.", en: "Client and partner meetings, training programmes and community engagement." }), b("gallery", {})],
  },
  {
    slug: "careers",
    kind: "system",
    published: true,
    title: { ar: "الوظائف", en: "Careers" },
    seo: {
      ar: { title: "الوظائف", description: "انضم إلى فريق المكتب الاستشاري المتخصص. أرسل سيرتك الذاتية." },
      en: { title: "Careers", description: "Join the Specialized Consulting Office. Send us your CV." },
    },
    blocks: [
      header({ ar: "الوظائف", en: "Careers" }, { ar: "انضم إلى فريقنا", en: "Join our team" }, { ar: "نرحّب بالمحاسبين والمراجعين والمتخصصين في الضرائب. أرسل سيرتك الذاتية وسنتواصل معك عند توفر فرصة مناسبة.", en: "We welcome accountants, auditors and tax specialists. Send us your CV and we will be in touch when a suitable opportunity opens." }),
      b("careersForm", {}),
    ],
  },
  {
    slug: "contact",
    kind: "system",
    published: true,
    title: { ar: "اتصل بنا", en: "Contact" },
    seo: {
      ar: { title: "اتصل بنا", description: "تواصل مع المكتب الاستشاري المتخصص: 92 شارع عبد العزيز فهمي، النزهة، القاهرة. هاتف وواتساب وبريد إلكتروني." },
      en: { title: "Contact us", description: "Contact SCO: 92 Abdel Aziz Fahmy St., El Nozha, Cairo. Phone, WhatsApp and email." },
    },
    blocks: [
      header({ ar: "اتصل بنا", en: "Contact" }, { ar: "ابقَ على تواصل معنا", en: "Get in touch" }, { ar: "أخبرنا بما تحتاجه، وسيتواصل معك أحد المتخصصين لدينا.", en: "Tell us what you need and one of our specialists will get back to you." }),
      b("contact", { show_map: true }),
    ],
  },
  {
    slug: "privacy",
    kind: "system",
    published: true,
    title: { ar: "سياسة الخصوصية", en: "Privacy policy" },
    seo: { ar: { title: "سياسة الخصوصية" }, en: { title: "Privacy policy" } },
    blocks: [
      header({ ar: "سياسة الخصوصية", en: "Privacy policy" }, { ar: "كيف نتعامل مع بياناتك", en: "How we handle your data" }, { ar: "مسودة بانتظار الاعتماد القانوني من المكتب.", en: "Draft pending SCO's legal approval." }),
      b("richText", {
        body: {
          ar: md(`## من نحن
المكتب الاستشاري المتخصص (SCO) – محمود الشيخ وشركاه، 92 شارع عبد العزيز فهمي، النزهة، القاهرة. البريد: info@sco-eg.com.

## البيانات التي نجمعها
- البيانات التي ترسلها عبر نماذج الموقع: الاسم ورقم الهاتف والبريد الإلكتروني والرسالة، والسيرة الذاتية في نموذج الوظائف.
- بيانات تقنية محدودة لحماية النماذج من الإساءة (بصمة مشفرة لعنوان IP).
- ملفات تعريف الارتباط التحليلية والتسويقية **فقط بعد موافقتك**.

## كيف نستخدمها
للرد على استفساراتك وطلبات الاستشارة، ودراسة طلبات التوظيف، وإرسال النشرة البريدية لمن اشترك فيها، وتحسين الموقع.

## مشاركة البيانات
لا نبيع بياناتك. نستعين بمزودي خدمات للاستضافة وقواعد البيانات والبريد الإلكتروني يعالجون البيانات نيابةً عنا.

## حقوقك
وفقًا لقانون حماية البيانات الشخصية رقم 151 لسنة 2020، يحق لك طلب الاطلاع على بياناتك أو تصحيحها أو حذفها، وسحب موافقتك على ملفات تعريف الارتباط في أي وقت من رابط «إعدادات ملفات تعريف الارتباط» أسفل الصفحة. تواصل معنا عبر info@sco-eg.com.`),
          en: md(`## Who we are
Specialized Consulting Office (SCO) – Mahmoud El Sheikh & Co., 92 Abdel Aziz Fahmy St., El Nozha, Cairo. Email: info@sco-eg.com.

## What we collect
- Information you send through our forms: name, phone number, email address and message, and your CV on the careers form.
- Limited technical data to protect forms from abuse (a hashed fingerprint of your IP address).
- Analytics and marketing cookies **only after you consent**.

## How we use it
To answer your enquiries and consultation requests, assess job applications, send our newsletter to subscribers, and improve this website.

## Sharing
We do not sell your data. We use service providers for hosting, database and email, who process data on our behalf.

## Your rights
Under Egypt's Personal Data Protection Law No. 151 of 2020 you may ask to access, correct or delete your data, and you can withdraw cookie consent at any time from the “Cookie settings” link in the footer. Contact us at info@sco-eg.com.`),
        },
      }),
    ],
  },
  {
    slug: "terms",
    kind: "system",
    published: true,
    title: { ar: "الشروط والأحكام", en: "Terms of use" },
    seo: { ar: { title: "الشروط والأحكام" }, en: { title: "Terms of use" } },
    blocks: [
      header({ ar: "الشروط والأحكام", en: "Terms of use" }, { ar: "شروط استخدام الموقع", en: "Website terms of use" }, { ar: "مسودة بانتظار الاعتماد القانوني من المكتب.", en: "Draft pending SCO's legal approval." }),
      b("richText", {
        body: {
          ar: md(`## طبيعة المحتوى
المحتوى المنشور على هذا الموقع، بما في ذلك الأسئلة الشائعة والمقالات، للمعلومات العامة فقط ولا يُعد استشارة مهنية أو قانونية أو ضريبية. تتغير القوانين واللوائح باستمرار؛ يُرجى التواصل معنا قبل اتخاذ أي قرار بناءً على هذا المحتوى.

## الملكية الفكرية
جميع المحتويات والعلامات والشعارات مملوكة للمكتب الاستشاري المتخصص أو لأصحابها، ولا يجوز استخدامها دون إذن كتابي. شعارات العملاء معروضة بغرض التعريف فقط.

## المسؤولية
لا يتحمل المكتب مسؤولية أي قرار يُتخذ اعتمادًا على محتوى الموقع دون استشارة مهنية مباشرة.

## القانون الحاكم
تخضع هذه الشروط لقوانين جمهورية مصر العربية.`),
          en: md(`## Nature of the content
Content on this website, including the FAQ and articles, is general information only and is not professional, legal or tax advice. Laws and regulations change frequently; please contact us before acting on any of it.

## Intellectual property
All content, marks and logos belong to the Specialized Consulting Office or their respective owners and may not be used without written permission. Client logos are shown for identification only.

## Liability
SCO accepts no liability for decisions taken on the basis of this website's content without direct professional advice.

## Governing law
These terms are governed by the laws of the Arab Republic of Egypt.`),
        },
      }),
    ],
  },
  {
    slug: "insights",
    kind: "system",
    published: true,
    title: { ar: "رؤى ومقالات", en: "Insights" },
    seo: {
      ar: { title: "رؤى ومقالات", description: "مقالات وتحديثات في المحاسبة والضرائب والمراجعة وتأسيس الشركات من خبراء المكتب الاستشاري المتخصص." },
      en: { title: "Insights", description: "Articles and updates on accounting, tax, audit and company formation from SCO's specialists." },
    },
    blocks: [header({ ar: "رؤى ومقالات", en: "Insights" }, { ar: "تحليلات وتحديثات من خبرائنا", en: "Analysis and updates from our specialists" }, { ar: "مستجدات الضرائب والمحاسبة والمراجعة وشؤون الشركات في مصر.", en: "Developments in Egyptian tax, accounting, audit and corporate affairs." })],
  },
];
