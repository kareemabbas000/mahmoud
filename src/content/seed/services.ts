import { md } from "@/lib/rich";
import type { Service } from "@/lib/types";

/**
 * The six services from sco-eg.com. Arabic is the legacy text with orthography and
 * punctuation corrected (and the wrong firm name on the tax page removed).
 * English is a professional rewrite of the legacy (machine-translated) English.
 * Source: content/inventory.json → pages[*].{ar,en}.blocks
 */
export const services: Service[] = [
  {
    slug: "external-audit",
    legacy_slug: "finance-auditing",
    sort: 1,
    published: true,
    icon: "audit",
    image: null,
    name: { ar: "المراجعة الخارجية", en: "External Audit" },
    summary: {
      ar: "مراجعة القوائم المالية وفق معايير المراجعة المصرية والدولية للوصول إلى تأكيد معقول بخلوّها من التحريف الجوهري.",
      en: "Audits of financial statements under Egyptian and International Standards on Auditing, giving reasonable assurance that they are free from material misstatement.",
    },
    intro: {
      ar: "تعرّف جمعية المحاسبة الأمريكية المراجعة بأنها «عملية منظمة ومنهجية لجمع الأدلة والقرائن المتعلقة بنتائج الأنشطة والأحداث الاقتصادية وتقييمها بموضوعية، لتحديد مدى توافق هذه النتائج مع المعايير المقررة، وإبلاغ الأطراف المعنية بنتائج المراجعة».",
      en: "The American Accounting Association defines auditing as “a systematic process of objectively obtaining and evaluating evidence regarding assertions about economic actions and events, to ascertain the degree of correspondence between those assertions and established criteria, and communicating the results to interested users.”",
    },
    body: {
      ar: md(`نُجري المراجعة طبقًا لمعايير المراجعة الدولية ومعايير المراجعة المصرية، ووفقًا للقوانين واللوائح المصرية ذات الصلة، للوصول إلى تأكيد معقول بأن القوائم المالية لا تنطوي على أخطاء أو تحريف جوهري. وتشمل أعمال المراجعة ما يلي:

## نطاق أعمال المراجعة
- إجراء مراجعة اختبارية للسجلات المحاسبية بالمنشأة ومستنداتها طبقًا لإجراءات المراجعة المخططة في ضوء ظروف المنشأة.
- فحص وتقييم المبادئ والسياسات المحاسبية المتبعة بالمنشأة، والمخصصات التي تحددها إدارة المنشأة بطريق التقدير.
- تقييم عام لطريقة عرض القوائم المالية وما تتضمنه من إفصاحات وإيضاحات.

## المراجعة الدورية خلال العام
عمل مراجعة دورية خلال العام تتضمن فحص وتقييم النظم المحاسبية ونظم الرقابة الداخلية المطبقة بالمنشأة، والقيام بجميع الاختبارات اللازمة للتحقق من سلامة تطبيق تلك النظم وكفاءتها، وبذل العناية المهنية اللازمة لاكتشاف الأخطاء والمخالفات الهامة التي قد يكون لها تأثير على القوائم المالية للمنشأة.

> في حالة وجود ملاحظات هامة تسفر عنها المراجعة الدورية، يتم إرسالها في تقرير لإدارة المنشأة يتضمن هذه الملاحظات وتوصياتنا لمعالجتها، وذلك بعد مناقشتها مع إدارة المنشأة.

## المراجعة النهائية في نهاية العام
- فحص ومطابقة الحسابات الختامية مع السجلات المحاسبية.
- التحقق من وجود الأصول التي تظهر بالميزانية وقيمتها، والمبالغ الخاصة بالالتزامات والمخصصات، للتحقق من أن الميزانية تعبّر بوضوح عن حقيقة المركز المالي.
- فحص قائمة الدخل للتأكد من أنها تُظهر صحة نتيجة أعمال المنشأة.
- التأكد من أن الإفصاح والعرض بالإيضاحات المتممة للقوائم المالية تم وفقًا للمبادئ المحاسبية المتعارف عليها وفي ظل القوانين واللوائح المعمول بها.
- إعداد تقرير مراقب الحسابات على القوائم المالية في نهاية السنة المالية.

عند الانتهاء من أعمال المراجعة النهائية، إذا تبيّن وجود ملاحظات متعلقة بمراجعة القوائم المالية أو أي ملاحظات أخرى بخلاف ما ورد بتقرير المراجعة الدورية، يتم إرسال تقرير يتضمن ملاحظاتنا عن أعمال المراجعة النهائية بعد مناقشته مع إدارة المنشأة.`),
      en: md(`We conduct our audits in accordance with International Standards on Auditing, Egyptian Standards on Auditing and the applicable Egyptian laws and regulations, to obtain reasonable assurance that the financial statements are free from material error or misstatement. Our audit work covers:

## Scope of the audit
- Test examination of the entity's accounting records and supporting documents, following audit procedures planned around the entity's circumstances.
- Review and evaluation of the accounting principles and policies the entity applies, and of the provisions management determines by estimate.
- An overall evaluation of how the financial statements are presented, including their disclosures and notes.

## Interim audit during the year
A periodic review during the year, examining and evaluating the entity's accounting systems and internal controls. We perform the tests needed to confirm those systems are applied soundly and efficiently, and exercise due professional care to detect significant errors and irregularities that could affect the financial statements.

> Where the interim audit raises significant findings, we discuss them with management and then issue a management letter setting out the findings and our recommendations.

## Year-end audit
- Examining the final accounts and reconciling them with the accounting records.
- Verifying the existence and value of the assets on the balance sheet, and the amounts of liabilities and provisions, so that the balance sheet fairly presents the financial position.
- Examining the income statement to confirm it fairly presents the results of operations.
- Confirming that disclosures and notes to the financial statements follow generally accepted accounting principles and applicable laws and regulations.
- Issuing the auditor's report on the financial statements at the end of the financial year.

On completing the year-end audit, if there are findings on the financial statements, or other matters beyond those reported at the interim stage, we discuss them with management and issue a report on the year-end audit work.`),
    },
    highlights: {
      ar: ["معايير المراجعة المصرية والدولية", "مراجعة دورية ونهائية", "خطاب للإدارة بالملاحظات والتوصيات", "تقرير مراقب الحسابات"],
      en: ["Egyptian & International Standards on Auditing", "Interim and year-end audit", "Management letter with recommendations", "Statutory auditor's report"],
    },
    seo: {
      ar: { title: "المراجعة الخارجية ومراقبة الحسابات", description: "مراجعة القوائم المالية وفق معايير المراجعة المصرية والدولية: مراجعة دورية ونهائية، وتقييم نظم الرقابة الداخلية، وتقرير مراقب الحسابات." },
      en: { title: "External Audit", description: "Financial statement audits under Egyptian and International Standards on Auditing: interim and year-end audit, internal control review and the statutory auditor's report." },
    },
  },
  {
    slug: "accounting",
    legacy_slug: "accounting-services",
    sort: 2,
    published: true,
    icon: "ledger",
    image: null,
    name: { ar: "الخدمات المحاسبية", en: "Accounting & Bookkeeping" },
    summary: {
      ar: "من تأسيس النظام المحاسبي ومسك الدفاتر إلى القوائم المالية ومؤشرات الأداء والإقرارات الضريبية والمرتبات.",
      en: "From setting up your accounting system and keeping the books to financial statements, KPIs, tax returns and payroll.",
    },
    intro: {
      ar: "النظام المالي والمحاسبي في أي شركة من أهم عوامل نجاحها، فهو الوسيلة الأساسية لقياس نتائجها؛ وكلما كان لديك نظام محاسبي جيد أصبح اتخاذ القرارات الحالية والمستقبلية أسهل.",
      en: "A company's financial and accounting system is one of the keys to its success: it is how results are measured. The better the system, the easier it becomes to make decisions today and plan for tomorrow.",
    },
    body: {
      ar: md(`لذلك نوفّر لعملائنا خدمات محاسبية متكاملة:

- تأسيس النظام المحاسبي.
- مسك الدفاتر والتسجيل بها.
- إعداد التسويات البنكية والائتمانية وتسويات المخزون.
- إعداد القوائم المالية ومؤشرات الأداء للشركات.
- إعداد الإقرارات الضريبية وفقًا للقوانين الضريبية المختلفة في مصر.
- إعداد كشوف المرتبات وحساب قيمة التأمينات الاجتماعية الشهرية.

يقوم بكل ذلك مختصون لديهم الخبرة العلمية والعملية الكافية. ونهدف من خلال هذه الخدمات إلى أن نرفع عن عملائنا عبء هذا الدور المهم، الذي قد يكلّفك كثيرًا من الوقت والجهد والمال إذا اعتمدت على فريق غير مؤهل أو غير متابع لأحدث التطورات في معايير المحاسبة والقوانين الضريبية المحلية.`),
      en: md(`That is why we offer a complete set of accounting services:

- Designing and setting up the accounting system.
- Bookkeeping and maintaining the books of account.
- Bank, credit and inventory reconciliations.
- Financial statements and performance indicators.
- Tax returns under Egypt's various tax laws.
- Payroll and monthly social insurance calculations.

All of this is handled by specialists with solid academic and practical experience. Our aim is to take this demanding work off your hands. Relying on a team that is not qualified, or not current with developments in accounting standards and local tax law, can cost a business a great deal of time, effort and money.`),
    },
    highlights: {
      ar: ["تأسيس النظام المحاسبي", "مسك الدفاتر والتسويات", "القوائم المالية ومؤشرات الأداء", "المرتبات والتأمينات الاجتماعية"],
      en: ["Accounting system set-up", "Bookkeeping & reconciliations", "Financial statements & KPIs", "Payroll & social insurance"],
    },
    seo: {
      ar: { title: "الخدمات المحاسبية ومسك الدفاتر", description: "تأسيس النظم المحاسبية ومسك الدفاتر والتسويات البنكية والقوائم المالية والإقرارات الضريبية وكشوف المرتبات والتأمينات الاجتماعية." },
      en: { title: "Accounting & Bookkeeping Services", description: "Accounting system set-up, bookkeeping, reconciliations, financial statements, tax returns, payroll and social insurance for companies in Egypt." },
    },
  },
  {
    slug: "company-formation",
    legacy_slug: "establishing-companies",
    sort: 3,
    published: true,
    icon: "building",
    image: null,
    name: { ar: "تأسيس الشركات", en: "Company Formation" },
    summary: {
      ar: "تأسيس جميع أشكال الشركات وفروع الشركات الأجنبية، والقيد في السجلات الرسمية، وشؤون الشركات والتراخيص.",
      en: "Formation of every type of company and foreign branch, registration with the official registers, corporate affairs and licensing.",
    },
    intro: {
      ar: "يقدّم المكتب خدمات الاستثمار وتأسيس الشركات من خلال نخبة من المتخصصين، وتشمل:",
      en: "Our specialists handle investment and company-formation work end to end, including:",
    },
    body: {
      ar: md(`- تأسيس جميع أنواع شركات الأموال وشركات الأشخاص والمنشآت الفردية، وفروع الشركات الأجنبية، ومكاتب التمثيل ومكاتب الاتصال والمكاتب العلمية.
- الاستشارات في مجال شؤون الشركات وجميع القوانين المرتبطة بها.
- تحويل الشكل القانوني للشركات.
- الاندماج أو التقسيم والتصفية.
- قيد الشركات وتسجيلها في: السجل التجاري، والسجل الصناعي، والهيئة العامة للرقابة المالية، والبورصة، وسجل الوكلاء التجاريين، وسجل المصدّرين والمستوردين، وسجل التأجير التمويلي، وسجل مقاولي القطاع الخاص، والاتحاد المصري لمقاولي التشييد والبناء.
- تعديل النظام الأساسي للشركات وتوفيق أوضاعها، وإعداد العقود والاتفاقيات الجانبية، وشهادات الأسهم وصكوكها والسندات، ومحاضر الجمعيات العامة للمساهمين ومجالس الإدارة، وسجلات المساهمين، ودفاتر الملكية والتنازلات.
- المساعدة في الحصول على تصاريح العمل والإقامة لغير المصريين.
- الحصول على التراخيص اللازمة للمشروعات والشركات، والمعاونة في حل مشكلاتها مع الجهات الحكومية وغير الحكومية.`),
      en: md(`- Forming every type of company: joint-stock and limited liability companies, partnerships, sole proprietorships, branches of foreign companies, and representative, liaison and scientific offices.
- Advice on corporate affairs and the laws that govern them.
- Changing a company's legal form.
- Mergers, demergers and liquidations.
- Registration with the Commercial Register, the Industrial Register, the Financial Regulatory Authority, the Egyptian Exchange, the Commercial Agents Register, the Importers and Exporters Registers, the Financial Leasing Register, the Private Sector Contractors Register and the Egyptian Federation for Construction and Building Contractors.
- Amending articles of association and regularising a company's status; drafting contracts and side agreements; share certificates, instruments and bonds; minutes of general assemblies and board meetings; shareholder registers, ownership ledgers and transfers.
- Obtaining work and residence permits for non-Egyptians.
- Obtaining the licences projects and companies need, and resolving issues with government and non-government bodies.`),
    },
    highlights: {
      ar: ["جميع الأشكال القانونية", "السجل التجاري والسجلات الرسمية", "الاندماج والتقسيم والتصفية", "تصاريح العمل والإقامة"],
      en: ["Every legal form", "Commercial register & official registries", "Mergers, demergers & liquidation", "Work & residence permits"],
    },
    seo: {
      ar: { title: "تأسيس الشركات في مصر", description: "تأسيس شركات الأموال والأشخاص وفروع الشركات الأجنبية، والقيد في السجل التجاري والسجلات الرسمية، وتعديل الأنظمة الأساسية والتراخيص." },
      en: { title: "Company Formation in Egypt", description: "Company formation, foreign branches, commercial register and official registrations, corporate governance documents, licences and work permits in Egypt." },
    },
  },
  {
    slug: "feasibility-studies",
    legacy_slug: "feasibility-studies",
    sort: 4,
    published: true,
    icon: "chart",
    image: null,
    name: { ar: "دراسات الجدوى", en: "Feasibility Studies" },
    summary: {
      ar: "دراسات جدوى اقتصادية تسويقية وفنية ومالية تنتهي بقرار واضح بقبول فكرة المشروع أو رفضها.",
      en: "Market, technical and financial feasibility studies that end in a clear decision on whether to proceed.",
    },
    intro: {
      ar: "دراسات الجدوى الاقتصادية من أهم العوامل وأكثرها تأثيرًا عند اختيار مشروع استثماري جديد؛ فهدفها الأساسي دراسة إمكانية قيام المشروع، وتحقيق أقصى عائد ممكن من الموارد المتاحة، وتحقيق أرباح أو عائد يفوق التكلفة المستثمرة، والوصول إلى قرار نهائي بقبول الفكرة أو رفضها.",
      en: "A feasibility study is one of the most important inputs when choosing a new investment. Its purpose is to test whether the project can be established, how to earn the best possible return on the resources available, and whether that return will exceed the capital invested, leading to a final decision to go ahead or not.",
    },
    body: {
      ar: md(`## مراحل دراسة الجدوى الاقتصادية للمشروعات

### الدراسة السوقية
- مدى أهمية المشروع للسوق.
- تحديد الفئات المستهدفة.
- تحديد المنافسين.
- قياس مدى استيعاب السوق للمنتج.
- دراسة العرض والطلب على المنتج.
- دراسة مصغّرة لأساليب التسويق المتبعة للمنتج، واقتراح أنسب الطرق التسويقية للوصول إلى المبيعات المستهدفة.

### الدراسة الفنية
- دراسة واختيار موقع المشروع.
- تخطيط العملية الإنتاجية ومراحل الإنتاج.
- اختيار معدات الإنتاج وتوصيفها.
- تحديد دورة التشغيل.
- دراسة التكاليف الثابتة والمتغيرة.
- تقدير التكاليف الاستثمارية المطلوبة للمشروع.

### الدراسة المالية
- دراسة الإيرادات وأسعار البيع المقترحة.
- إعداد قوائم الدخل وقوائم التدفقات النقدية المستقبلية للمشروع.

### المؤشرات المالية والاقتصادية
- تحليل الربحية والسيولة وفترة استرداد رأس المال.

### تقييم المشروع
- توصيات عامة عن المشروع من وجهة النظر الاقتصادية والاجتماعية.`),
      en: md(`## The stages of an economic feasibility study

### Market study
- How important the project is to the market.
- Defining the target segments.
- Identifying competitors.
- Measuring how much of the product the market can absorb.
- Analysing supply and demand for the product.
- A short review of how the product is currently marketed, with recommendations on the best channels to reach the target sales.

### Technical study
- Assessing and selecting the project site.
- Planning the production process and its stages.
- Selecting and specifying production equipment.
- Defining the operating cycle.
- Analysing fixed and variable costs.
- Estimating the investment the project requires.

### Financial study
- Revenue analysis and proposed selling prices.
- Projected income statements and cash-flow statements for the project.

### Financial and economic indicators
- Profitability, liquidity and payback-period analysis.

### Project evaluation
- Overall recommendations on the project from an economic and social standpoint.`),
    },
    highlights: {
      ar: ["دراسة سوقية", "دراسة فنية", "دراسة مالية وتدفقات نقدية", "الربحية وفترة الاسترداد"],
      en: ["Market study", "Technical study", "Financial study & cash flows", "Profitability & payback"],
    },
    seo: {
      ar: { title: "دراسات الجدوى الاقتصادية", description: "دراسات جدوى سوقية وفنية ومالية للمشروعات: تحليل السوق والمنافسين، والتكاليف الاستثمارية، والتدفقات النقدية، والربحية وفترة الاسترداد." },
      en: { title: "Feasibility Studies", description: "Market, technical and financial feasibility studies: competitor and demand analysis, investment costs, projected cash flows, profitability and payback period." },
    },
  },
  {
    slug: "project-finance",
    legacy_slug: "project-financing",
    sort: 5,
    published: true,
    icon: "finance",
    image: null,
    name: { ar: "تمويل المشروعات", en: "Project Finance" },
    summary: {
      ar: "توفير بدائل التمويل المناسبة لكل مرحلة من البنوك والصناديق والمستثمرين، مع إدارة النقدية ومتابعتها.",
      en: "Sourcing the right financing for each stage from banks, funds and investors, with ongoing cash management.",
    },
    intro: {
      ar: "الحصول على التمويل المناسب في كل مرحلة من مراحل المشروع من أهم المشكلات التي تواجه أي مستثمر، وخصوصًا في المشروعات الناشئة؛ لذلك نساعد عملاءنا بتوفير العديد من البدائل والفرص التمويلية، سواء من المؤسسات المالية المتخصصة أو من جهات التمويل الخاصة، مثل:",
      en: "Securing the right financing at every stage of a project is one of the hardest problems any investor faces, especially for start-ups. We help clients by identifying a range of financing options, from specialised financial institutions and from private sources, including:",
    },
    body: {
      ar: md(`- **التمويل من البنوك والصناديق الخاصة:** نتأكد من استيفاء الشروط التي تطلبها جهة التمويل، ونوفّر جميع المستندات المطلوبة، ونتواصل مع الجهة الممولة، ونيسّر جميع الإجراءات حتى الحصول على التمويل أو القرض المطلوب.
- **التمويل الخاص:** من خلال إيجاد مستثمرين أو شركاء لديهم رأس المال ويرغبون في الاستثمار في الشركات الناشئة، وبخاصة المشروعات المبتكرة والمميزة.
- **صناديق الاستثمار:** للشركات الاستثمارية التي لديها فائض مالي وترغب في استثماره في مشروع قائم يحقق لها عائدًا جيدًا دون الدخول في أعباء الإدارة.

## إدارة النقدية والمتابعة
بالإضافة إلى ذلك نتولّى إدارة النقدية ومتابعة العميل بصفة دورية ومستمرة، للتأكد من كيفية إدارة التمويل داخل المشروع، ومدى الالتزام بالسداد، والعلاقات مع البنوك؛ كما ندرس ونراقب الفروق المتوقعة وغير المتوقعة بين التدفقات النقدية الداخلة والخارجة، ونساعد العملاء في التعامل مع النقدية الزائدة بالطريقة التي تخدم مصلحة المنشأة مستقبلًا.`),
      en: md(`- **Bank and private-fund financing:** we confirm the lender's requirements are met, prepare all the required documents, liaise with the financing institution and manage the process through to drawdown.
- **Private investment:** introducing investors or partners with capital who want to invest in start-ups, particularly innovative and distinctive projects.
- **Investment funds:** for investment companies with surplus capital that want a return from an established project without taking on its management.

## Cash management and monitoring
We also manage cash and follow up with clients regularly to track how financing is used within the project, repayment discipline and banking relationships. We monitor expected and unexpected gaps between cash inflows and outflows, and help clients deploy surplus cash in the way that best serves the business.`),
    },
    highlights: {
      ar: ["البنوك والصناديق", "المستثمرون والشركاء", "صناديق الاستثمار", "إدارة النقدية"],
      en: ["Banks & private funds", "Investors & partners", "Investment funds", "Cash management"],
    },
    seo: {
      ar: { title: "تمويل المشروعات", description: "توفير بدائل التمويل من البنوك والصناديق والمستثمرين، وتجهيز ملفات التمويل، ومتابعة إدارة النقدية والتدفقات النقدية للمشروعات." },
      en: { title: "Project Finance Advisory", description: "Financing from banks, private funds and investors, preparation of financing files, and ongoing cash and cash-flow management for projects." },
    },
  },
  {
    slug: "tax",
    legacy_slug: "tax-services",
    sort: 6,
    published: true,
    icon: "tax",
    image: null,
    name: { ar: "الخدمات الضريبية", en: "Tax Services" },
    summary: {
      ar: "الفحص الضريبي، وإعداد الإقرارات الضريبية بجميع أنواعها وتقديمها، والاستشارات الضريبية.",
      en: "Tax examinations, preparation and filing of every type of tax return, and tax advisory.",
    },
    intro: {
      ar: "نتعامل مع جميع أنواع الفحص الضريبي في مختلف مراحله، ونُعدّ الإقرارات الضريبية ونقدّمها، ونقدّم الاستشارات الضريبية من خلال خبراء متخصصين.",
      en: "We handle every type of tax examination at every stage, prepare and file tax returns, and advise through specialist tax experts.",
    },
    body: {
      ar: md(`## الفحص الضريبي
لدينا فريق متخصص للتعامل مع جميع أنواع الفحص الضريبي في مختلف مراحله، بالإضافة إلى علاقاتنا الممتدة منذ أكثر من 25 عامًا مع معظم مأموريات الضرائب في مصر، مما يُيسّر مهمتنا في توفيق أوضاع عملائنا لدى مصلحة الضرائب المصرية.

ويشمل ذلك فحص الإقرار الضريبي والمستندات المؤيدة له، والحضور أمام المأموريات واللجان المختلفة لتقديم جميع الردود والإجابة عن الاستفسارات التي قد يطلبها موظفو المصلحة، توفيرًا للوقت على الممول والمأمورية، وللحصول على أفضل النتائج الممكنة بما يتوافق مع القوانين الضريبية والتعليمات التنفيذية.

## إعداد الإقرارات الضريبية وتقديمها
يُعدّ إعداد الإقرارات الضريبية من الأمور المهمة التي تترتب عليها آثار مستقبلية قد تُلحق ضررًا كبيرًا بأي شركة؛ فإذا لم تكن الإقرارات المقدمة إلى المأمورية متوافقة مع القوانين والتعليمات التنفيذية الدورية، فقد تظهر عند الفحص فروق ضريبية غير مسددة بالإضافة إلى مقابل التأخير المقرر قانونًا. لذا يجب الحرص عند إعداد إقرارك الضريبي والاطلاع على التعليمات التنفيذية، حتى تتجنب الخلاف مع مأمورية الضرائب وما قد يسببه من أزمة حقيقية لشركتك.

ونحن في المكتب الاستشاري المتخصص نوفّر هذه الخدمة لعملائنا ونتابعهم باستمرار، فنُعدّ ونقدّم الإقرارات الضريبية بجميع أنواعها:
- ضريبة الدخل.
- ضريبة القيمة المضافة.
- ضريبة الخصم والإضافة.
- ضريبة الدمغة.
- ضريبة كسب العمل (المرتبات).

وذلك وفقًا للقوانين المتبعة والتعليمات التنفيذية، لضمان أفضل النتائج في الفحص الضريبي والحفاظ على استقرار الشركات.

## الاستشارات الضريبية
نقدّم الاستشارات الضريبية من خلال خبرائنا المتخصصين في مختلف المراحل الضريبية، ومن خلال علاقتنا بمصلحة الضرائب، لتضمن أنك تسير على الطريق الصحيح وتتجنب الأخطاء التي قد تكلّف شركتك الكثير.`),
      en: md(`## Tax examinations
Our specialist team handles every type of tax examination at every stage. Our relationships with most tax offices across Egypt go back more than 25 years, which makes it easier to settle our clients' positions with the Egyptian Tax Authority.

This covers examining the tax return and its supporting documents, and attending tax offices and appeal committees to provide every response and answer any query the Authority's staff raise. It saves time for the taxpayer and the tax office alike, and secures the best possible outcome within the tax laws and executive regulations.

## Preparing and filing tax returns
Tax returns have consequences that can seriously harm a company years later. If a return does not comply with the law and the periodic executive instructions, an examination may reveal unpaid tax differences plus statutory late-payment charges. That is why a return needs careful preparation against the current instructions, to avoid a dispute with the tax office and a real crisis for the business.

At SCO we provide this service and stay in regular contact with our clients, preparing and filing every type of return:
- Corporate and personal income tax.
- Value added tax (VAT).
- Withholding and advance-payment tax.
- Stamp duty.
- Payroll (salaries) tax.

Every return follows the applicable laws and executive regulations, to secure the best result at examination and keep the business on a stable footing.

## Tax advisory
Our specialists advise at every stage of the tax cycle and draw on our working relationship with the Tax Authority, so you can be confident you are on the right path and avoid mistakes that could cost your company dearly.`),
    },
    highlights: {
      ar: ["الفحص الضريبي واللجان", "ضريبة الدخل والقيمة المضافة", "الخصم والإضافة والدمغة", "الاستشارات الضريبية"],
      en: ["Tax examinations & appeals", "Income tax & VAT", "Withholding tax & stamp duty", "Tax advisory"],
    },
    seo: {
      ar: { title: "الخدمات الضريبية والفحص الضريبي", description: "الفحص الضريبي والحضور أمام المأموريات واللجان، وإعداد وتقديم إقرارات ضريبة الدخل والقيمة المضافة والخصم والإضافة والدمغة والمرتبات، والاستشارات الضريبية." },
      en: { title: "Tax Services in Egypt", description: "Tax examinations and appeals, preparation and filing of income tax, VAT, withholding, stamp duty and payroll tax returns, and tax advisory in Egypt." },
    },
  },
];

/** Services named in the legacy "about" text that have no detail page yet. */
export const servicesAlsoOffered = [
  { ar: "الاستشارات المالية والإدارية", en: "Financial and management consulting" },
  { ar: "الموارد البشرية", en: "Human resources" },
  { ar: "الخدمات والاستشارات القانونية", en: "Legal services and advice" },
  { ar: "تأسيس الجامعات والمدارس الخاصة", en: "Establishing private universities and schools" },
  { ar: "تأسيس الجمعيات والمؤسسات الأهلية", en: "Establishing NGOs and foundations" },
  { ar: "إعادة الهيكلة المالية والإدارية", en: "Financial and organisational restructuring" },
  { ar: "إعداد الخطط الاستراتيجية للشركات", en: "Corporate strategic planning" },
  { ar: "خطط تمويل المشروعات", en: "Project financing plans" },
  { ar: "الحراسة القضائية", en: "Judicial receivership" },
  { ar: "تصفية الشركات", en: "Company liquidation" },
  { ar: "الاستشارات الضريبية والزكوية", en: "Tax and zakat advisory" },
  { ar: "استشارات نظم المعلومات", en: "Information systems consulting" },
];
