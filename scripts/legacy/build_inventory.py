"""Build content/inventory.json from the legacy-site crawl.

Inputs (produced by scripts/legacy/crawl.js + extract.py, kept outside the repo):
  argv[1]  pages_extracted.json  - verbatim blocks per crawled page (AR + EN)
  argv[2]  faqs.json             - FAQ accordion Q/A pairs (AR + EN)
  argv[3]  wp media JSON files dir (media_1.txt, media_2.txt from /wp-json/wp/v2/media)
Output: content/inventory.json

The inventory is a FAITHFUL RECORD of what exists on sco-eg.com (Nov 2026 crawl).
Curated entities point back to source pages; nothing here is invented. Improved copy
for the new site lives separately (content/seed/*) and references these records.
"""
import json
import os
import sys

pages_raw = json.load(open(sys.argv[1]))
faqs_raw = json.load(open(sys.argv[2]))
media = json.load(open(os.path.join(sys.argv[3], "media_1.txt"))) + json.load(
    open(os.path.join(sys.argv[3], "media_2.txt"))
)

OLD = "https://sco-eg.com"
CRAWLED = "2026-11-03"

# Real (non-demo) legacy pages: key -> (ar path, en path)
REAL_PAGES = {
    "home": ("/ar/", "/"),
    "company-profile": ("/ar/company-profile/", "/company-profile/"),
    "our-services": ("/ar/our-services/", "/our-services/"),
    "finance-auditing": ("/ar/finance-auditing/", "/finance-auditing/"),
    "accounting-services": ("/ar/accounting-services/", "/accounting-services/"),
    "establishing-companies": ("/ar/establishing-companies/", "/establishing-companies/"),
    "feasibility-studies": ("/ar/feasibility-studies/", "/feasibility-studies/"),
    "project-financing": ("/ar/project-financing/", "/project-financing/"),
    "tax-services": ("/ar/tax-services/", "/tax-services/"),
    "functional-structure": ("/ar/functional-structure/", "/functional-structure/"),
    "mahmoud-al-sheikh": ("/ar/mahmoud-al-sheikh/", "/mahmoud-al-sheikh/"),
    "careers": ("/ar/careers/", "/careers/"),
    "our-clients": ("/ar/our-clients/", "/our-clients/"),
    "faqs": ("/ar/faqs/", "/faqs/"),
    "gallery": ("/ar/gallery/", "/gallery/"),
    "contact-us-2": ("/ar/contact-us-2/", "/contact-us-2/"),
}


def crawl_key(path):
    k = path.strip("/").replace("/", "__")
    return k or "home_en"


def page_record(key, ar_path, en_path):
    rec = {"key": key, "legacy_urls": {"ar": OLD + ar_path, "en": OLD + en_path}}
    for lang, path in (("ar", ar_path), ("en", en_path)):
        p = pages_raw.get(crawl_key(path))
        if not p:
            rec[lang] = None
            continue
        rec[lang] = {
            "status": p["status"],
            "seo_title": p["title"],
            "meta_description": p["meta_description"],
            "og": p["og"],
            "canonical": p["canonical"],
            "html_lang": p["lang"],
            "html_dir": p["dir"],
            "headings": p["headings"],
            "images": p["images"],
            "background_images": p["background_images"],
            "iframes": p["iframes"],
            "blocks": p["blocks"],
        }
    return rec


pages = [page_record(k, a, e) for k, (a, e) in REAL_PAGES.items()]

demo_urls = sorted(
    OLD + "/" + k.replace("__", "/") + "/"
    for k in pages_raw
    if any(
        s in k
        for s in (
            "colombia-gets",
            "counting-the-cost",
            "recurring-debate",
            "blake-morgan",
            "tag__wordpress",
            "blog__page",
            "our-team-style",
        )
    )
) + [OLD + "/blog/", OLD + "/ar/blog/"]

services = [
    {
        "slug": "finance-auditing",
        "order": 1,
        "name": {"ar": "المراجعة المالية", "en": "Finance Auditing"},
        "icon": "content/legacy-assets/service-icons/finance-auditing.png",
        "source_page": "finance-auditing",
        "summary_on_home": {
            "ar": "تعرف المراجعة كما عرفتها جمعية المحاسبة الامريكية بأنها “عملية منظمة ومنهجية لجمع وتقييم الادلة والقرائن بشكل موضوعى التى تتعلق بنتائج الانشطة والاحداث الاقتصادية،",
            "en": "The audit, as defined by the American Accounting Association, is defined as “an organized and systematic process of objectively gathering and evaluating",
        },
    },
    {
        "slug": "accounting-services",
        "order": 2,
        "name": {"ar": "الخدمات المحاسبية", "en": "Accounting Services"},
        "icon": "content/legacy-assets/service-icons/accounting-services.png",
        "source_page": "accounting-services",
        "summary_on_home": {
            "ar": "النظام المالى والمحاسبى فى أى شركة من العوامل الهامة جدا للنجاح حيث انها تعتبر الوسيلة الوحيدة لقياس نتائج الشركة وكل ما كان لديك نظام محاسبى جيد سيجعل ذلك مهمة",
            "en": "The financial and accounting system in any company is one of the very important factors for success as it is the only way to measure the results",
        },
    },
    {
        "slug": "establishing-companies",
        "order": 3,
        "name": {"ar": "تأسيس الشركات", "en": "Establishing Companies"},
        "icon": "content/legacy-assets/service-icons/establishing-companies.png",
        "source_page": "establishing-companies",
        "summary_on_home": {
            "ar": "يقوم المكتب بتقديم خدمات الاستثمار وتأسيس الشركات بواسطة نخبة ممتازة من المتخصصين تقوم بالاعمال التالية: تأسيس كافة أنواع شركات الأموال وشركات الأشخاص والمنشاة الفردية",
            "en": "The office provides investment services and company establishment by an excellent group of specialists who do the following",
        },
    },
    {
        "slug": "feasibility-studies",
        "order": 4,
        "name": {"ar": "دراسات الجدوى", "en": "Feasibility Studies"},
        "icon": "content/legacy-assets/service-icons/feasibility-studies.png",
        "source_page": "feasibility-studies",
        "summary_on_home": {
            "ar": "دراسات الجدوى الاقتصادية للمشروعات من العوامل الهامة والمؤثرة جدا عند اختيارك لمشروع استثمارى جديد حيث ان الهدف الاساسى من دراسة الجدوى هو دراسة امكانية قيام",
            "en": "Economic feasibility studies for projects is one of the most important and influential factors when choosing a new investment project",
        },
    },
    {
        "slug": "project-financing",
        "order": 5,
        "name": {"ar": "تمويل المشروع", "en": "Project Financing"},
        "icon": "content/legacy-assets/service-icons/project-financing.png",
        "source_page": "project-financing",
        "summary_on_home": {
            "ar": "الحصول على التمويل المناسب فى كل مرحلة من مراحل المشروع من اهم المشكلات التى تواجه اى مستثمر وخصوصا فى المشروعات الناشئة لذلك نقوم بمساعدة عملائنا عن طريق",
            "en": "monitoring the expected and unexpected difference between the cash inflows and outflows and assisting clients in dealing",
        },
    },
    {
        "slug": "tax-services",
        "order": 6,
        "name": {"ar": "خدمات ضريبية", "en": "TAX Services"},
        "icon": "content/legacy-assets/service-icons/tax-services.png",
        "source_page": "tax-services",
        "summary_on_home": {
            "ar": "الفحص الضريبى: لدينا فريق متخصص للتعامل مع جميع انواع الفحص الضريبى فى مختلف المراحل بالاضافة الى علاقتنا الممتدة منذ اكثر من 25 سنة مع معظم مأموريات الضرئب فى",
            "en": "We have a specialized team to deal with all types of tax examination in various stages, in addition to our relationship that has spanned for",
        },
    },
]

# Services mentioned in the "about" text but with no dedicated page on the legacy site.
services_mentioned_without_page = [
    {"ar": "الإستشارات المالية والإدارية", "en": "Financial and administrative consulting"},
    {"ar": "الموارد البشرية", "en": "Human resources"},
    {"ar": "الخدمات والإستشارات القانونية", "en": "Legal services and advice"},
    {"ar": "إنشاء وتأسيس الجامعات والمدارس الخاصة", "en": "Establishing universities and private schools"},
    {"ar": "الهيئات التى لا تهدف الى الربح (الجمعيات والمؤسسات الأهلية)", "en": "Non-profit organisations (NGOs and private foundations)"},
    {"ar": "الهيكلة المالية والإدارية", "en": "Financial and administrative restructuring"},
    {"ar": "إعداد الخطط الإستراتيجية للشركات", "en": "Corporate strategic plans"},
    {"ar": "خطط تمويل المشروعات", "en": "Project financing plans"},
    {"ar": "الحراسات القضائية", "en": "Judicial receivership"},
    {"ar": "تصفية الشركات", "en": "Company liquidation"},
    {"ar": "الاستشارات الضريبية والزكوية", "en": "Tax and zakat advisory"},
    {"ar": "الاستشارات فى مجال تقنية المعلومات", "en": "Information-systems consulting"},
]

team = [
    {
        "slug": "mahmoud-al-sheikh",
        "order": 1,
        "name": {"ar": "محمود محمد عبد الحليم الشيخ", "en": "Mahmoud Mohamed Abdel-Halim Al-Sheikh"},
        "role": {"ar": "مالك ومؤسس المكتب", "en": "Owner and Founder of the Office"},
        "credentials": {
            "ar": [
                "محاسب قانوني وخبير ضرائب",
                "عضو جمعية الضرائب المصرية",
                "عضو الجمعية المصرية لحوكمة الشركات",
                "عضو اتحاد المحاسبين والمراجعين العرب",
                "زميل الجمعية المصرية للمالية العامة والضرائب",
            ],
            "en": [
                "Chartered Accountant and Tax Expert",
                "Member of the Egyptian Tax Association",
                "Member of the Egyptian Association for Corporate Governance",
                "Member of the Union of Arab Accountants and Auditors",
                "Fellow of the Egyptian Association for Public Finance and Taxes",
            ],
        },
        "photos": [
            "content/legacy-assets/team/mahmoud-al-sheikh-framed.jpg",
            "content/legacy-assets/team/mahmoud-al-sheikh-cutout.png",
            "content/legacy-assets/team/mahmoud-al-sheikh-cutout-tall.png",
        ],
        "profile_page": "mahmoud-al-sheikh",
        "registrations": [
            {"ar": "مسجل بسجل المحاسبين والمراجعين القانونيين برقم 21145", "en": "Registered in the Register of Accountants and Auditors, No. 21145"},
            {"ar": "عضو جمعية الضرائب المصرية المسجل تحت رقم 8385 من عام 2012", "en": "Member of the Egyptian Tax Association, No. 8385 (since 2012)"},
            {"ar": "عضو الجمعية المصرية للمالية العامة والضرائب المسجل تحت رقم 2262 لسنة 2010", "en": "Fellow of the Egyptian Association for Public Finance and Taxes, No. 2262 (2010)"},
        ],
    },
    {
        "slug": "hamdy-mousharafa",
        "order": 2,
        "name": {"ar": "أ/ حمدي مشرفة", "en": "Hamdy Mousharafa"},
        "role": {"ar": "شريك ضريبى", "en": "Tax Partner"},
        "credentials": {"ar": [], "en": []},
        "photos": ["content/legacy-assets/team/placeholder-tax.jpg"],
        "photo_note": "Legacy site shows a 'TAX' placeholder. Media library has an unused portrait 'ham.jpg' (saved as unconfirmed-ham-possibly-hamdy-mousharafa.jpg) - identity unconfirmed.",
    },
    {
        "slug": "shaaban-abdel-gayied",
        "order": 3,
        "name": {"ar": "د/ شعبان عبد الجيد عبد المنعم", "en": "Dr. Shaaban Abdel Gayied Abdel Moa'men"},
        "role": {"ar": "رئيس قطاع الإستشارات المالية والاقتصادية ودراسات الجدوى", "en": "Head of the financial advisory and economic feasibility studies"},
        "credentials": {"ar": [], "en": []},
        "photos": ["content/legacy-assets/team/shaaban-abdel-gayied-framed.jpg"],
        "name_note": "English page omits the 'Dr.' title present in Arabic.",
    },
    {
        "slug": "taha-ali-abdel-hafeez",
        "order": 4,
        "name": {"ar": "طه علي عبد الحفيظ", "en": "Taha Ali Abdul Hafeez"},
        "role": {"ar": "مدير المكتب التنفيذي", "en": "Office Executive Director"},
        "credentials": {"ar": ["محاسب قانوني وخبير ضرائب"], "en": ["Chartered Accountant and Tax Expert"]},
        "photos": ["content/legacy-assets/team/placeholder-avatar.jpg"],
        "photo_note": "Legacy site shows a cartoon avatar placeholder.",
    },
    {
        "slug": "hossam-shaaban-abdel-gayied",
        "order": 5,
        "name": {"ar": "حسام شعبان عبد الجيد", "en": "Hossam Shaaban Abdel Gayied"},
        "role": {"ar": "مدير عمليات", "en": "Director of Operations"},
        "credentials": {"ar": ["محاسب قانوني وخبير ضرائب"], "en": ["Chartered Accountant and Tax Expert"]},
        "photos": ["content/legacy-assets/team/hossam-shaaban-framed.jpg"],
    },
    {
        "slug": "hany-ali-abdel-karim",
        "order": 6,
        "name": {"ar": "هاني علي عبد الكريم", "en": "Hany Ali Abd El Krim"},
        "role": {"ar": "مدير المراجعة", "en": "Review Manager"},
        "credentials": {"ar": ["محاسب قانوني وخبير ضرائب"], "en": ["Chartered Accountant and Tax Expert"]},
        "photos": ["content/legacy-assets/team/hany-ali-framed.jpg"],
    },
]

# Client lists exactly as on /our-clients/ (AR order; EN equivalents paired by position).
corporate_clients = [
    ("شركة جلوب ميد لادارة برامج الرعاية الصحية", "GlobeMed Company for managing health care program", "client-logo-1.png"),
    ("شركة يونيتد اراب للرعاية الطبية (ش.م.م)", "United Arab Medical Care (SAE)", None),
    ("الشركة الفنية التجارية تكنكو (ش.م.م)", "The Technical and Commercial Company, Technco (SAE)", "client-logo-4.png"),
    ("شركة قرطبة للاستثمار العقاري(ش.م.م)", "Cordoba Real Estate Investment (SAE)", "client-logo-6.png"),
    ("شركة أوسكار مصر (ش.م.م)", "Oscar Egypt (S.A.E)", "client-logo-3.png"),
    ("شركة نيرين فودز للاستثمار (ش.م.م)", "Nirin Foods Investment Company (SAE)", None),
    ("مستشفي البدر (ش.م.م)", "Al-Badr Hospital (SAE)", "client-logo-8.png"),
    ("مستشفي د. محمد مقبل (ش.م.م)", "Dr. Mohamed Moqbel Hospital (S.A.E)", None),
    ("شركة السهام للتنمية الزراعية (ش.م.م)", "Arrows for Agricultural Development (SAE)", None),
    ("شركة الخبراء للتنمية الزراعية (ش.م.م)", "Experts Company for Agricultural Development (SAE)", None),
    ("الشركة الدولة للنظافة (ش.م.م)", "The State Cleaning Company (SAE)", None),
    ("شركة دي. اف. سي ( ش.م.م)", "Company D. F. C (SAE)", None),
    ("شركة ايديوبيديا للتدريبات (ش.م.م)", "Idipedia Training Company (SAE)", None),
    ("الشركة المصرية الكندية eccad(ش.م.م)", "The Egyptian Canadian Company, ECCAD (SAE)", "client-logo-5.png"),
    ("شركة الرواد الزراعية (ذ.م.م)", "Al Rowad Agricultural Company (LLC)", None),
    ("شركة اسمعني للتخاطب (ذ.م.م)", "Listen to Speak Company (LLC)", None),
    ("شركة اتش انالتكس للاستشارات (ذ.م.م)", "H Analytics Consulting (LLC)", None),
    ("شركة استبداع (ذ.م.م)", "Ibda'a Company (LLC)", None),
    ("شركة هيروتيك للتدريب (ذ.م.م)", "Herotec Training Company (LLC)", "client-logo-7.png"),
    ("شركة كامل ستيل (ذ.م.م)", "Kamel Steel Company (LLC)", None),
    ("شركة لاروز للتجميل (ذ.م.م)", "La Rose Beauty Company (LLC)", None),
    ("شركة التميز للتأهيل والتدريب (ذ.م.م)", "Excellence for Rehabilitation and Training Company (LLC)", "client-logo-2.png"),
    ("شركة اكاديمية الاتحاد العربي ( ذ.م.م)", "Arab Union Academy Company (LLC)", None),
    ("شركة اكاديمية هوب سيتي ( ذ.م.م)", "Hope City Academy Company (LLC)", None),
    ("شركة المهندس للاستشارات الهندسية (ت.ب)", "Al Mohandes Engineering Consulting Company (TB)", None),
    ("شركة باندا للتجارة والتنمية", "Panda Company for Trade and Development", None),
]
logo_only_clients = [
    {"ar": "مجموعة مراكز ألفا", "en": "Alpha Centers Group", "logo": "client-logo-9.png", "note": "Appears in the home-page logo carousel only, not in the written client list."},
]
donors = [
    ("مصر الخير", "Misr El Kheir Foundation"),
    ("البنك الدولي", "The World Bank"),
    ("بنك مصر", "Banque Misr"),
    ("مؤسسة انقاذ الطفولة", "Save the Children"),
    ("كافينا", "Caffeine (as written on EN page) - see OPEN_QUESTIONS"),
    ("بنك باركليز", "Barclays Bank"),
    ("مؤسسة بلان الدولية", "Plan International"),
    ("المعونة الأمريكية.", "USAID (EN page: 'S. aid.')"),
    ("الوكالة الالمانية للتعاون الانمائىGIZ", "German Agency for International Cooperation (GIZ)"),
    ("معهد فستر", "Fester Institute"),
    ("المفوضية السامية للأمم المتحدة", "UNHCR (EN page: 'The United Nations High Commissioner')"),
    ("مؤسسة دروسوس مصر", "Drosos Foundation Egypt"),
]
ngo_clients = [
    ("جمعية الوصال الخيرية", "Al Wesal Charitable Society"),
    ("مؤسسة وسارعوا للتنمية “د.حسين ثابت”", "Wa Sare'ou Development Foundation (Dr. Hussein Thabet)"),
    ("مؤسسة البناء الانساني “د.علياء رافع”", "Human Building Foundation (Dr. Alia Rafea)"),
    ("مؤسسة ويانا الدولية لدمج الحالات الخاصة", "Wayana International Foundation for the integration of special cases"),
    ("مؤسسة الثقافة “د.سهير الدفراوي”", "Culture Foundation (Dr. Soheir El-Dafrawy)"),
    ("المؤسسة المصرية لتنمية الاسرة", "Egyptian Foundation for Family Development"),
    ("جمعية افهمني لضعاف السمع", "Efhamny Association for the Hard of Hearing"),
    ("جمعية جنات الخلود الخيرية", "Gannat Al-Kholoud Charitable Society"),
    ("جمعية أصدقاء الأرض للتنمية", "Friends of the Earth Society for Development"),
    ("جمعية الهمة للمساعدات الاجتماعية", "El Himma Association for Social Aid"),
    ("جمعية من أحياها للخدمات", "Man Ahyaha Services Association"),
    ("جمعية الولاء للعاملين برئاسة مجلس الوزراء", "Al-Walaa Association for Cabinet Employees"),
    ("جمعية شباب منشأة ناصر", "Manshiet Nasser Youth Association"),
]

gallery = [
    ("01-certified-trainer-programme.jpg", "برنامج تدريب مدرب دولي محترف معتمد"),
    ("02-alpha-hospital-opening.jpg", "افتتاح مستشفى ألفا الدولي"),
    ("03-agritech-expo-luxor.jpg", "افتتاح معرض اجري تك الزراعي بالاقصر"),
    ("04-qadiroon-festival.jpg", "فعاليات مهرجان قادرون الذي ينظمه الاتحاد الرياضي المصري للإعاقة الذهنية"),
    ("05-giz-training-sohag.jpg", "المشاركه في برنامج تدريب منظمه بمحافظه سوهاج GIZ"),
    ("06-accountants-register.jpg", "تسجيل المحاسبين بسجل المحاسبين والمراجعين"),
    ("07-wayana-mou-signing.jpg", "توقيع مذكره تفاهم بين مؤسسه ويانا للتوعية ودمج الحالات الخاصه في المجتمع مع المنظمه العربيه للتنميه الاداريه"),
    ("08-equestrian-championship.jpg", "حضور بطولة الجمهوريه للفورسيه بنادي الحرس الجمهوري وتكريمي بصفتي عضو مجلس اداره الاتحاد المصري للاعاقات الذهنيه"),
    ("09-swedish-ambassador.jpg", "لقاء مع سفير دوله السويد"),
    ("10-client-meeting-china.jpg", "لقاء مع عميل من دوله الصين"),
    ("11-client-meeting-kuwait.jpg", "لقاء مع عميل من دوله الكويت لعمل دراسه الجدوى"),
]

faqs = []
for i, (a, e) in enumerate(zip(faqs_raw["ar"], faqs_raw["en"]), start=1):
    faqs.append({"n": i, "ar": a, "en": e, "legal_basis": "Income Tax Law No. 91 of 2005 (as cited on the legacy page)", "needs_legal_review": True})

inventory = {
    "meta": {
        "source": OLD,
        "crawled": CRAWLED,
        "method": "Rendered with headless Chromium (Playwright) + WordPress REST API (/wp-json/wp/v2/pages, /media). Arabic is served by a translation layer under /ar/ over the English WordPress pages.",
        "platform": "WordPress 5.4 + Themesflat theme + WPBakery + Slider Revolution + Photo Gallery (bwg) + Quform; designed by MyCairo (mycairo.net), copyright 2021",
        "real_page_count": len(REAL_PAGES) * 2,
        "crawled_url_count": len(pages_raw),
    },
    "organisation": {
        "short_name": "SCO",
        "name": {"ar": "المكتب الإستشاري المتخصص", "en": "Specialized Consulting Office"},
        "logo_tagline_en": "Specialized Consultative Office",
        "legal_style": {"ar": "محمود الشيخ وشركاه - محاسبون قانونيون و مستشارون و خبراء ضرائب", "en": "Mahmoud El Sheikh & Co. - Chartered Accountants, Consultants, Tax Advisers"},
        "founded": 2005,
        "founder": "mahmoud-al-sheikh",
    },
    "brand": {
        "colors_sampled": {"blue": "#04019F", "orange": "#FC4E08", "navy_site_chrome": "#0F3661"},
        "logos": [
            {"file": "content/legacy-assets/brand/logo-ar.png", "px": [255, 113], "lang": "ar", "source": OLD + "/ar/wp-content/uploads/2021/04/logo-ar.png"},
            {"file": "content/legacy-assets/brand/logo-en-300.png", "px": [300, 125], "lang": "en", "source": OLD + "/wp-content/uploads/2021/01/logo-SCO.png"},
            {"file": "content/legacy-assets/brand/logo-en-270.png", "px": [270, 113], "lang": "en", "source": OLD + "/wp-content/uploads/2021/01/SCO-logo.png"},
            {"file": "content/legacy-assets/brand/favicon-380.png", "px": [380, 380], "lang": None, "source": OLD + "/wp-content/uploads/2021/02/favicon.png"},
        ],
        "svg_available": False,
    },
    "contact": {
        "address": {
            "ar": "92 عبد العزيز فهمى، النزهة، محافظة القاهرة، مصر",
            "en": "92 Abd El-Aziz Fahmy, El-Nozha, Cairo Governorate, Egypt",
            "landmark_ar": "بجوار قسم شرطة النزهة – وقريب من محطة مترو هليوبوليس.",
            "landmark_en": "Next to Nozha police station.",
        },
        "other_address_mentioned": {
            "ar": "5 عمارات العبور – صلاح سالم – مدينه نصر – القاهرة",
            "en": "5 El Obour Buildings - Salah Salem - Nasr City - Cairo",
            "where": "mahmoud-al-sheikh page ('current work') - see OPEN_QUESTIONS",
        },
        "map": {"lat": 30.107487, "lng": 31.337956, "embed": "https://www.google.com/maps/embed?pb=!1m18!1m12!1m3!1d1725.7677448441127!2d31.337956256377186!3d30.107487014174357!2m3!1f0!2f0!3f0!3m2!1i1024!2i768!4f13.1!3m3!1m2!1s0x0%3A0x0!2zMzDCsDA2JzI2LjciTiAzMcKwMjAnMjAuNiJF!5e0!3m2!1sen!2seg!4v1634557323283!5m2!1sen!2seg"},
        "mobiles": ["+201011315442", "+201001046442"],
        "landlines": ["+20220824165", "+20220824409"],
        "whatsapp": "+201010494857",
        "email": "info@sco-eg.com",
        "working_hours": None,
        "social": {
            "facebook": "https://www.facebook.com/MahmmoudElshekh",
            "messenger": "https://m.me/MahmmoudElshekh",
            "youtube_video": "https://www.youtube.com/watch?v=3xzxlWo8TGc",
            "footer_icons_without_links": ["linkedin", "facebook", "twitter"],
        },
    },
    "stats": {
        "note": "Counter values differ between pages and languages on the legacy site; none verified. See OPEN_QUESTIONS.",
        "home_ar": {"consultations": 5149, "services_provided": 2742, "clients": 590, "years_experience": 16},
        "home_en": {"years_experience": 16, "customers": 590, "services_provided": 5742, "consultants": 5149},
        "company_profile_and_services_pages": "different, lower placeholder-looking values (e.g. 257/137/30/1)",
        "claims_in_copy": [
            {"ar": "16 عام من النجاح", "en": "16 Years Of Success", "note": "Written in 2021; founded 2005."},
            {"ar": "علاقتنا الممتدة منذ اكثر من 25 سنة مع معظم مأموريات الضرائب فى مصر", "en": "relationship that has spanned for more than 25 years with most of the tax offices in Egypt", "note": "25 years > firm age; refers to team experience?"},
            {"ar": "تمكنا من مساعدة المئات من أفضل الشركات والآلاف من الشركات الصغيرة والمتوسطة", "en": "We Were Able To Help Hundreds Of Top Companies And Thousands Of SMBs"},
        ],
    },
    "services": services,
    "services_mentioned_without_page": services_mentioned_without_page,
    "team": team,
    "clients": {
        "corporate": [{"order": i + 1, "ar": a, "en": e, "logo": ("content/legacy-assets/clients/" + l) if l else None} for i, (a, e, l) in enumerate(corporate_clients)],
        "logo_only": [dict(x, logo="content/legacy-assets/clients/" + x["logo"]) for x in logo_only_clients],
        "donors": [{"order": i + 1, "ar": a, "en": e} for i, (a, e) in enumerate(donors)],
        "ngos": [{"order": i + 1, "ar": a, "en": e} for i, (a, e) in enumerate(ngo_clients)],
        "collages": [
            "content/legacy-assets/clients/clients-collage.jpg",
            "content/legacy-assets/clients/clients-collage-alt.jpg",
            "content/legacy-assets/clients/donors-collage.jpg",
            "content/legacy-assets/clients/donors-collage-alt.jpg",
        ],
    },
    "gallery": [{"order": i + 1, "file": "content/legacy-assets/gallery/" + f, "caption": {"ar": c, "en": None}} for i, (f, c) in enumerate(gallery)],
    "faqs": faqs,
    "forms": {
        "contact": {"fields": ["name*", "mobile*", "message*", "captcha*"], "plugin": "Quform"},
        "careers": {"fields": ["name*", "mobile*", "email*", "job_title*", "cv_file*", "captcha*"], "plugin": "Quform"},
    },
    "floating_widgets": ["ar-contactus button: WhatsApp, Messenger, Facebook", "back-to-top"],
    "documents": [
        {"title": "Mahmoud Al-Sheikh CV", "source": OLD + "/wp-content/uploads/2021/03/Mahmoud-Al-Sheikh-CV.pdf", "linked_from_site": False, "contains_personal_data": True, "committed_to_repo": False, "note": "Contains DOB, religion, home address, personal email. Kept out of the public repo; will be uploaded to private storage."},
    ],
    "media_library": [
        {"id": m["id"], "url": m["source_url"], "mime": m["mime_type"], "w": m["media_details"].get("width"), "h": m["media_details"].get("height"), "alt": m["alt_text"],
         "classification": ("sco" if "/2021/" in m["source_url"] else "theme-demo-stock")}
        for m in media
    ],
    "pages": pages,
    "not_migrated_demo_content": {
        "reason": "Themesflat theme demo content (Lorem Ipsum posts, fake team pages). Not SCO content; 301-redirected to the nearest real page.",
        "urls": demo_urls,
    },
}

out = os.path.join(os.path.dirname(__file__), "..", "..", "content", "inventory.json")
json.dump(inventory, open(out, "w"), ensure_ascii=False, indent=1)
print("wrote", os.path.normpath(out), "pages:", len(pages), "faqs:", len(faqs), "media:", len(media))
