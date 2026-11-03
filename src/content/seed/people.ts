import { md, emptyDoc } from "@/lib/rich";
import type { Certificate, Client, GalleryItem, TeamMember } from "@/lib/types";

/** Leadership as listed on /functional-structure/ (order preserved). */
export const team: TeamMember[] = [
  {
    slug: "mahmoud-al-sheikh",
    sort: 1,
    published: true,
    has_profile: true,
    photo: "/legacy/team/mahmoud-al-sheikh.jpg",
    name: { ar: "محمود محمد عبد الحليم الشيخ", en: "Mahmoud Mohamed Abdel-Halim Al-Sheikh" },
    role: { ar: "المالك والمؤسس", en: "Founder & Managing Partner" },
    credentials: {
      ar: [
        "محاسب قانوني وخبير ضرائب",
        "عضو جمعية الضرائب المصرية",
        "عضو الجمعية المصرية لحوكمة الشركات",
        "عضو اتحاد المحاسبين والمراجعين العرب",
        "زميل الجمعية المصرية للمالية العامة والضرائب",
      ],
      en: [
        "Chartered Accountant and Tax Expert",
        "Member, Egyptian Tax Association",
        "Member, Egyptian Association for Corporate Governance",
        "Member, Arab Union of Accountants and Auditors",
        "Fellow, Egyptian Association for Public Finance and Taxation",
      ],
    },
    bio: {
      ar: md(`## المؤهل
بكالوريوس التجارة، شعبة المحاسبة، جامعة عين شمس، 1999.

## الشهادات والخبرات
- مسجل بسجل المحاسبين والمراجعين برقم 21145.
- المشاركة في البرنامج التدريبي للقانون رقم 91 لسنة 2005 «قانون الضريبة على الدخل» ولائحته التنفيذية وكيفية تطبيقه على الإقرار الضريبي، بنقابة التجاريين.
- عضو جمعية الضرائب المصرية، مسجل برقم 8385 منذ عام 2012.
- زميل الجمعية المصرية للمالية العامة والضرائب، مسجل برقم 2262 لسنة 2010.
- عضو الجمعية المصرية لحوكمة الشركات.
- المشاركة في امتحانات جمعية المحاسبين والمراجعين (المستوى المتوسط).
- المشاركة في البرنامج التدريبي للجمعية المصرية للمحاسبين والمراجعين (ESAA) الخاص بمعايير المحاسبة المصرية.
- المشاركة في البرنامج التدريبي للجمعية المصرية للمحاسبين والمراجعين (ESAA) الخاص بالقانون رقم 67 لسنة 2016 بشأن الضريبة على القيمة المضافة.
- مدرب معتمد لشركة هيروتك للتدريب والاستشارات.
- مدرب معتمد لأكاديمية وصال للتدريب.

## الخبرات السابقة
- محاسب تحت التمرين بالمركز الاستشاري العربي (عمرو علي وشركاه، محاسبون ومراجعون قانونيون) من مارس 2001 حتى أغسطس 2005.
- محاسب ومراجع قانوني بمكتب محمد الجلالي وشركاه (محاسبون ومراجعون قانونيون) من سبتمبر 2005 حتى مايو 2007.
- مدير قسم الضرائب بمكتب نصر أبو العباس أحمد وشركاه (محاسبون قانونيون ومستشارون) من سبتمبر 2007 حتى 2012.

## العمل الحالي
مالك ومدير المكتب الاستشاري المتخصص (SCO) – محمود الشيخ وشركاه.`),
      en: md(`## Education
Bachelor of Commerce, Accounting, Ain Shams University, 1999.

## Registrations and professional development
- Registered in the Register of Accountants and Auditors, No. 21145.
- Training programme on Income Tax Law No. 91 of 2005, its executive regulations and their application to tax returns (Syndicate of Commercial Professions).
- Member of the Egyptian Tax Association, No. 8385, since 2012.
- Fellow of the Egyptian Association for Public Finance and Taxation, No. 2262, since 2010.
- Member of the Egyptian Association for Corporate Governance.
- Egyptian Society of Accountants and Auditors (ESAA) examinations, intermediate level.
- ESAA training programme on Egyptian Accounting Standards.
- ESAA training programme on VAT Law No. 67 of 2016.
- Certified trainer, Herotec Training & Consulting.
- Certified trainer, Wesal Training Academy.

## Career
- Trainee accountant, Arab Consulting Center (Amr Ali & Co., Accountants and Auditors), March 2001 – August 2005.
- Accountant and auditor, Mohamed El-Galaly & Co. (Certified Public Accountants and Auditors), September 2005 – May 2007.
- Head of Tax, Nasr Abu El-Abbas Ahmed & Co. (Chartered Accountants and Consultants), September 2007 – 2012.

## Today
Owner and Managing Partner of the Specialized Consulting Office (SCO) – Mahmoud El Sheikh & Co.`),
    },
  },
  {
    slug: "hamdy-mousharafa",
    sort: 2,
    published: true,
    has_profile: false,
    photo: null,
    name: { ar: "حمدي مشرفة", en: "Hamdy Mousharafa" },
    role: { ar: "شريك ضريبي", en: "Tax Partner" },
    credentials: { ar: [], en: [] },
    bio: { ar: emptyDoc(), en: emptyDoc() },
  },
  {
    slug: "shaaban-abdel-gayied",
    sort: 3,
    published: true,
    has_profile: false,
    photo: "/legacy/team/shaaban-abdel-gayied.jpg",
    name: { ar: "د. شعبان عبد الجيد عبد المنعم", en: "Dr. Shaaban Abdel Gayied Abdel Moneim" },
    role: {
      ar: "رئيس قطاع الاستشارات المالية والاقتصادية ودراسات الجدوى",
      en: "Head of Financial & Economic Advisory and Feasibility Studies",
    },
    credentials: { ar: [], en: [] },
    bio: { ar: emptyDoc(), en: emptyDoc() },
  },
  {
    slug: "taha-ali-abdel-hafeez",
    sort: 4,
    published: true,
    has_profile: false,
    photo: null,
    name: { ar: "طه علي عبد الحفيظ", en: "Taha Ali Abdel Hafeez" },
    role: { ar: "المدير التنفيذي للمكتب", en: "Executive Director" },
    credentials: { ar: ["محاسب قانوني وخبير ضرائب"], en: ["Chartered Accountant and Tax Expert"] },
    bio: { ar: emptyDoc(), en: emptyDoc() },
  },
  {
    slug: "hossam-shaaban-abdel-gayied",
    sort: 5,
    published: true,
    has_profile: false,
    photo: "/legacy/team/hossam-shaaban.jpg",
    name: { ar: "حسام شعبان عبد الجيد", en: "Hossam Shaaban Abdel Gayied" },
    role: { ar: "مدير العمليات", en: "Director of Operations" },
    credentials: { ar: ["محاسب قانوني وخبير ضرائب"], en: ["Chartered Accountant and Tax Expert"] },
    bio: { ar: emptyDoc(), en: emptyDoc() },
  },
  {
    slug: "hany-ali-abdel-karim",
    sort: 6,
    published: true,
    has_profile: false,
    photo: "/legacy/team/hany-ali.jpg",
    name: { ar: "هاني علي عبد الكريم", en: "Hany Ali Abdel Karim" },
    role: { ar: "مدير المراجعة", en: "Audit Manager" },
    credentials: { ar: ["محاسب قانوني وخبير ضرائب"], en: ["Chartered Accountant and Tax Expert"] },
    bio: { ar: emptyDoc(), en: emptyDoc() },
  },
];

const c = (kind: Client["kind"], sort: number, ar: string, en: string, logo: string | null = null, featured = false): Client => ({
  kind,
  sort,
  published: true,
  featured,
  name: { ar, en },
  logo,
  url: null,
});

/** /our-clients/ lists, in legacy order. Legal-form abbreviations normalised. */
export const clients: Client[] = [
  c("corporate", 1, "جلوب ميد لإدارة برامج الرعاية الصحية", "GlobeMed (healthcare benefits management)", "/legacy/clients/globemed.png", true),
  c("corporate", 2, "يونايتد أراب للرعاية الطبية (ش.م.م)", "United Arab Medical Care (S.A.E.)"),
  c("corporate", 3, "الشركة الفنية التجارية – تكنكو (ش.م.م)", "Technical & Commercial Company – TecnCo (S.A.E.)", "/legacy/clients/tecnco.png", true),
  c("corporate", 4, "قرطبة للاستثمار العقاري (ش.م.م)", "Cordoba Real Estate Investment (S.A.E.)", "/legacy/clients/cordoba.png", true),
  c("corporate", 5, "أوسكار مصر (ش.م.م)", "Oscar Misr (S.A.E.)", "/legacy/clients/oscar-misr.png", true),
  c("corporate", 6, "نيرين فودز للاستثمار (ش.م.م)", "Nirin Foods Investment (S.A.E.)"),
  c("corporate", 7, "مستشفى البدر (ش.م.م)", "Al-Badr Hospital (S.A.E.)", "/legacy/clients/badr-hospital.png", true),
  c("corporate", 8, "مستشفى د. محمد مقبل (ش.م.م)", "Dr. Mohamed Moqbel Hospital (S.A.E.)"),
  c("corporate", 9, "السهام للتنمية الزراعية (ش.م.م)", "El Seham Agricultural Development (S.A.E.)"),
  c("corporate", 10, "الخبراء للتنمية الزراعية (ش.م.م)", "Experts Agricultural Development (S.A.E.)"),
  c("corporate", 11, "الدولة للنظافة (ش.م.م)", "El Dawla Cleaning Company (S.A.E.)"),
  c("corporate", 12, "دي. إف. سي (ش.م.م)", "D.F.C. (S.A.E.)"),
  c("corporate", 13, "إيديوبيديا للتدريبات (ش.م.م)", "Edupedia Training (S.A.E.)"),
  c("corporate", 14, "الشركة المصرية الكندية – إيكاد (ش.م.م)", "Egyptian Canadian Company – ECCAD (S.A.E.)", "/legacy/clients/eccad.png", true),
  c("corporate", 15, "الرواد الزراعية (ذ.م.م)", "Al Rowad Agricultural Company (LLC)"),
  c("corporate", 16, "اسمعني للتخاطب (ذ.م.م)", "Esmaany Speech Therapy (LLC)"),
  c("corporate", 17, "إتش أناليتكس للاستشارات (ذ.م.م)", "H Analytics Consulting (LLC)"),
  c("corporate", 18, "استبداع (ذ.م.م)", "Estebdaa (LLC)"),
  c("corporate", 19, "هيروتك للتدريب (ذ.م.م)", "Herotec Training (LLC)", "/legacy/clients/herotec.png", true),
  c("corporate", 20, "كامل ستيل (ذ.م.م)", "Kamel Steel (LLC)"),
  c("corporate", 21, "لاروز للتجميل (ذ.م.م)", "La Rose Cosmetics (LLC)"),
  c("corporate", 22, "التميز للتأهيل والتدريب (ذ.م.م)", "Tamayoz Rehabilitation & Training (LLC)", "/legacy/clients/tamayoz.png", true),
  c("corporate", 23, "أكاديمية الاتحاد العربي (ذ.م.م)", "Arab Union Academy (LLC)"),
  c("corporate", 24, "أكاديمية هوب سيتي (ذ.م.م)", "Hope City Academy (LLC)"),
  c("corporate", 25, "المهندس للاستشارات الهندسية (ت.ب)", "Al Mohandes Engineering Consultants (General Partnership)"),
  c("corporate", 26, "باندا للتجارة والتنمية", "Panda Trading & Development"),
  c("corporate", 27, "مجموعة مراكز ألفا", "Alpha Centers Group", "/legacy/clients/alpha.png", true),
  c("donor", 1, "مؤسسة مصر الخير", "Misr El Kheir Foundation"),
  c("donor", 2, "البنك الدولي", "The World Bank"),
  c("donor", 3, "بنك مصر", "Banque Misr"),
  c("donor", 4, "مؤسسة إنقاذ الطفولة", "Save the Children"),
  c("donor", 5, "كافينا", "Cafina"),
  c("donor", 6, "بنك باركليز", "Barclays Bank"),
  c("donor", 7, "مؤسسة بلان الدولية", "Plan International"),
  c("donor", 8, "الوكالة الأمريكية للتنمية الدولية", "USAID"),
  c("donor", 9, "الوكالة الألمانية للتعاون الدولي (GIZ)", "German Agency for International Cooperation (GIZ)"),
  c("donor", 10, "معهد فستر", "Fester Institute"),
  c("donor", 11, "المفوضية السامية للأمم المتحدة لشؤون اللاجئين", "UNHCR – The UN Refugee Agency"),
  c("donor", 12, "مؤسسة دروسوس مصر", "Drosos Foundation Egypt"),
  c("ngo", 1, "جمعية الوصال الخيرية", "Al Wesal Charitable Association"),
  c("ngo", 2, "مؤسسة وسارعوا للتنمية «د. حسين ثابت»", "Wa Sare'ou Development Foundation (Dr. Hussein Thabet)"),
  c("ngo", 3, "مؤسسة البناء الإنساني «د. علياء رافع»", "Human Building Foundation (Dr. Alia Rafea)"),
  c("ngo", 4, "مؤسسة ويانا الدولية لدمج الحالات الخاصة", "Wayana International Foundation for Inclusion"),
  c("ngo", 5, "مؤسسة الثقافة «د. سهير الدفراوي»", "Culture Foundation (Dr. Soheir El-Dafrawy)"),
  c("ngo", 6, "المؤسسة المصرية لتنمية الأسرة", "Egyptian Foundation for Family Development"),
  c("ngo", 7, "جمعية افهمني لضعاف السمع", "Efhamny Association for the Hard of Hearing"),
  c("ngo", 8, "جمعية جنات الخلود الخيرية", "Gannat Al-Kholoud Charitable Association"),
  c("ngo", 9, "جمعية أصدقاء الأرض للتنمية", "Friends of the Earth Development Association"),
  c("ngo", 10, "جمعية الهمة للمساعدات الاجتماعية", "El Hemma Social Aid Association"),
  c("ngo", 11, "جمعية من أحياها للخدمات", "Man Ahyaha Services Association"),
  c("ngo", 12, "جمعية الولاء للعاملين برئاسة مجلس الوزراء", "Al-Walaa Association of Cabinet Office Employees"),
  c("ngo", 13, "جمعية شباب منشأة ناصر", "Manshiet Nasser Youth Association"),
];

/** Founder's registrations and memberships (from his profile page), shown as credentials. */
export const certificates: Certificate[] = [
  { sort: 1, published: true, title: { ar: "القيد بسجل المحاسبين والمراجعين", en: "Register of Accountants and Auditors" }, issuer: { ar: "وزارة المالية – مصر", en: "Ministry of Finance – Egypt" }, reference: "21145", year: null, image: null },
  { sort: 2, published: true, title: { ar: "عضوية جمعية الضرائب المصرية", en: "Membership, Egyptian Tax Association" }, issuer: { ar: "جمعية الضرائب المصرية", en: "Egyptian Tax Association" }, reference: "8385", year: 2012, image: null },
  { sort: 3, published: true, title: { ar: "زمالة الجمعية المصرية للمالية العامة والضرائب", en: "Fellowship, Egyptian Association for Public Finance and Taxation" }, issuer: { ar: "الجمعية المصرية للمالية العامة والضرائب", en: "Egyptian Association for Public Finance and Taxation" }, reference: "2262", year: 2010, image: null },
  { sort: 4, published: true, title: { ar: "عضوية الجمعية المصرية لحوكمة الشركات", en: "Membership, Egyptian Association for Corporate Governance" }, issuer: { ar: "الجمعية المصرية لحوكمة الشركات", en: "Egyptian Association for Corporate Governance" }, reference: null, year: null, image: null },
  { sort: 5, published: true, title: { ar: "عضوية اتحاد المحاسبين والمراجعين العرب", en: "Membership, Arab Union of Accountants and Auditors" }, issuer: { ar: "اتحاد المحاسبين والمراجعين العرب", en: "Arab Union of Accountants and Auditors" }, reference: null, year: null, image: null },
  { sort: 6, published: true, title: { ar: "مدرب معتمد", en: "Certified Trainer" }, issuer: { ar: "هيروتك للتدريب والاستشارات", en: "Herotec Training & Consulting" }, reference: null, year: null, image: null },
  { sort: 7, published: true, title: { ar: "مدرب معتمد", en: "Certified Trainer" }, issuer: { ar: "أكاديمية وصال للتدريب", en: "Wesal Training Academy" }, reference: null, year: null, image: null },
];

const g = (sort: number, file: string, w: number, h: number, ar: string, en: string): GalleryItem => ({
  sort,
  published: true,
  image: `/legacy/gallery/${file}`,
  width: w,
  height: h,
  caption: { ar, en },
});

export const gallery: GalleryItem[] = [
  g(1, "01-certified-trainer-programme.jpg", 720, 960, "برنامج تدريب مدرب دولي محترف معتمد", "Certified international professional trainer programme"),
  g(2, "02-alpha-hospital-opening.jpg", 720, 540, "افتتاح مستشفى ألفا الدولي", "Opening of Alpha International Hospital"),
  g(3, "03-agritech-expo-luxor.jpg", 720, 540, "افتتاح معرض أجري تك الزراعي بالأقصر", "Opening of the Agri-Tech agricultural exhibition, Luxor"),
  g(4, "04-qadiroon-festival.jpg", 1080, 2160, "فعاليات مهرجان «قادرون» الذي ينظمه الاتحاد الرياضي المصري للإعاقة الذهنية", "The “Qadiroon” festival organised by the Egyptian Sports Federation for Intellectual Disabilities"),
  g(5, "05-giz-training-sohag.jpg", 1152, 864, "المشاركة في برنامج تدريب منظمة GIZ بمحافظة سوهاج", "Taking part in a GIZ training programme in Sohag Governorate"),
  g(6, "06-accountants-register.jpg", 864, 1152, "تسجيل المحاسبين بسجل المحاسبين والمراجعين", "Registering accountants in the Register of Accountants and Auditors"),
  g(7, "07-wayana-mou-signing.jpg", 1082, 720, "توقيع مذكرة تفاهم بين مؤسسة ويانا للتوعية ودمج الحالات الخاصة في المجتمع والمنظمة العربية للتنمية الإدارية", "Signing an MoU between the Wayana Foundation for Inclusion and the Arab Administrative Development Organization"),
  g(8, "08-equestrian-championship.jpg", 1280, 851, "حضور بطولة الجمهورية للفروسية بنادي الحرس الجمهوري، والتكريم بصفة عضو مجلس إدارة الاتحاد المصري للإعاقات الذهنية", "At the national equestrian championship, Republican Guard Club, honoured as a board member of the Egyptian Federation for Intellectual Disabilities"),
  g(9, "09-swedish-ambassador.jpg", 1280, 960, "لقاء مع سفير دولة السويد", "Meeting with the Ambassador of Sweden"),
  g(10, "10-client-meeting-china.jpg", 780, 1040, "لقاء مع عميل من الصين", "Meeting a client from China"),
  g(11, "11-client-meeting-kuwait.jpg", 960, 1280, "لقاء مع عميل من الكويت لإعداد دراسة جدوى", "Meeting a client from Kuwait on a feasibility study"),
];
