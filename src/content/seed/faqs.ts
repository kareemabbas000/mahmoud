import { md } from "@/lib/rich";
import type { Faq } from "@/lib/types";

/**
 * The 30 payroll-tax FAQs from /faqs/. Arabic: legacy text, numbering prefixes removed
 * and orthography corrected. English: new professional translation (legacy EN was
 * machine-translated). All cite Income Tax Law 91/2005 as it stood when written;
 * thresholds have since been amended → shown with a "legal basis / last reviewed" note.
 * Q25's legacy answer duplicates Q24's; kept verbatim and flagged in OPEN_QUESTIONS (E1).
 */
const LB = { ar: "قانون الضريبة على الدخل رقم 91 لسنة 2005 (بحسب نص الإجابة الأصلية)", en: "Income Tax Law No. 91 of 2005 (as originally written)" };

const raw: [string, string, string, string][] = [
  [
    "من الملتزم بتقديم الإقرار الربع سنوي المنصوص عليه بالبند (1) من المادة (15) من قانون الضريبة على الدخل رقم 91 لسنة 2005؟",
    "يلتزم أصحاب الأعمال والملتزمون بدفع الإيرادات الخاضعة للضريبة، بما في ذلك الشركات والمشروعات المقامة بنظام المناطق الحرة، بتقديم إقرار ربع سنوي إلى مأمورية الضرائب المختصة في يناير وأبريل ويوليو وأكتوبر من كل عام على النموذج المعد لذلك، طبقًا لما تحدده اللائحة التنفيذية للقانون.",
    "Who must file the quarterly return required by Article 15(1) of Income Tax Law No. 91 of 2005?",
    "Employers and payers of taxable income, including companies and projects operating under the free-zone regime, must file a quarterly return with the competent tax office in January, April, July and October each year, on the prescribed form, as set out in the Executive Regulations.",
  ],
  [
    "ما الحالات التي يُعفى فيها الممول (الموظف أو العامل) من تقديم الإقرار الضريبي السنوي؟",
    "يُعفى الممول من تقديم الإقرار في الحالتين الآتيتين:\n1. إذا اقتصر دخله على المرتبات وما في حكمها أيًّا كان مقداره.\n2. إذا اقتصر دخله على المرتبات وما في حكمها وإيرادات الثروة العقارية، ولم يتجاوز صافي دخله السنوي منها 5000 جنيه (الشريحة المعفاة طبقًا للمادة 7 من القانون).",
    "When is a taxpayer (employee or worker) exempt from filing an annual tax return?",
    "A taxpayer is exempt from filing in two cases:\n1. Where their income consists only of salaries and similar payments, whatever the amount.\n2. Where their income consists only of salaries and similar payments plus income from real estate, and their net annual income from these does not exceed EGP 5,000 (the exempt bracket under Article 7 of the Law).",
  ],
  [
    "ما الحالات التي يلتزم فيها الممول (الموظف أو العامل) بتقديم الإقرار الضريبي السنوي؟",
    "يلتزم الممول بتقديم إقراره الضريبي السنوي في الحالتين الآتيتين:\n1. إذا تضمن دخله إيرادات من نشاط تجاري أو صناعي أو من نشاط مهني غير تجاري إلى جانب إيرادات المرتبات وما في حكمها، أيًّا كانت قيمة هذا الدخل.\n2. إذا زاد دخله من المرتبات وما في حكمها وإيرادات الثروة العقارية على 5000 جنيه سنويًّا (الشريحة المعفاة طبقًا للمادة 7 من القانون).",
    "When must a taxpayer (employee or worker) file an annual tax return?",
    "A taxpayer must file an annual return in two cases:\n1. Where, alongside salary income, they also earn income from a commercial or industrial activity or from a non-commercial profession, whatever the amount.\n2. Where their combined income from salaries and real estate exceeds EGP 5,000 a year (the exempt bracket under Article 7 of the Law).",
  ],
  [
    "ما المعاملة الضريبية لما يحصل عليه عمال اليومية من المرتبات وما في حكمها؟",
    "وحّد القانون المعاملة الضريبية للعمال العاديين وعمال اليومية، بحيث تُحدَّد الإيرادات الخاضعة للضريبة عن كل جزء من السنة تم فيه الحصول على الإيراد بنسبة مدته، وذلك بعد تحويل الإيراد الشهري إلى إيراد سنوي، مع تطبيق الشريحة المعفاة المنصوص عليها في المادة (7) وقدرها 5000 جنيه، والإعفاء الشخصي المنصوص عليه في البند (1) من المادة (13) وقدره 4000 جنيه.",
    "How are daily-wage workers taxed on salaries and similar payments?",
    "The Law treats regular and daily-wage workers the same way. Taxable income is determined pro rata for each part of the year in which income was earned, after annualising the monthly income, and both the EGP 5,000 exempt bracket under Article 7 and the EGP 4,000 personal allowance under Article 13(1) apply.",
  ],
  [
    "هل يحق للممول (العامل أو الموظف) الاعتراض على قيمة الضريبة المخصومة منه؟ ولأي جهة يقدَّم الاعتراض؟",
    "نعم، يحق له ذلك بطلب يقدَّم إلى جهة العمل التي قامت بالخصم خلال ثلاثين يومًا من تاريخ استلام المرتب. وإذا لم تكن للعامل جهة يتيسر أن يتقدم إليها بالاعتراض، فله أن يتقدم به إلى مأمورية الضرائب المختصة أو لجنة الطعن المختصة بحسب الأحوال خلال المدة نفسها.",
    "Can an employee object to the amount of tax withheld, and to whom?",
    "Yes. The employee submits a request to the employer that made the deduction within 30 days of receiving the salary. If there is no such employer to object to, the objection may be filed, within the same period, with the competent tax office or appeal committee, as applicable.",
  ],
  [
    "هل يحق لجهة العمل الاعتراض على فروق ضريبة المرتبات الناتجة عن الفحص؟",
    "نعم، يحق لجهة العمل الاعتراض على فروق الضريبة الناتجة عن الفحص خلال ثلاثين يومًا من تاريخ استلام الإخطار، طبقًا لنص المادة (118) من القانون رقم 91 لسنة 2005.",
    "Can an employer object to payroll-tax differences arising from an examination?",
    "Yes. The employer may object to tax differences arising from an examination within 30 days of receiving the notice, under Article 118 of Law No. 91 of 2005.",
  ],
  [
    "هل يجوز خصم 10% مقابل الحصول على الإيراد في ظل العمل بأحكام القانون رقم 91 لسنة 2005؟",
    "لم يقرر القانون رقم 91 لسنة 2005 خصم 10% مقابل الحصول على الإيراد، وإنما قرر زيادة الإعفاءات المقررة للشريحة المعفاة (5000 جنيه) والإعفاء الشخصي (4000 جنيه).",
    "Is a 10% deduction for the cost of earning income allowed under Law No. 91 of 2005?",
    "No. Law No. 91 of 2005 did not provide a 10% deduction for the cost of earning income. Instead it increased the exempt bracket (EGP 5,000) and the personal allowance (EGP 4,000).",
  ],
  [
    "ما المعاملة الضريبية للمبالغ التي يتقاضاها الممول (العامل أو الموظف) من غير جهة عمله الأصلية؟",
    "تخضع المبالغ التي يحصل عليها الممول (منتدبًا كان أو غير منتدب) من جهة غير جهة عمله الأصلية للضريبة على المرتبات وما في حكمها بسعر 10% ضريبة قطعية، دون خصم أي تكاليف أو خصومات أخرى؛ وبناءً على ذلك لا يتمتع من يحصل على هذه المبالغ بأي إعفاءات ضريبية عنها.",
    "How are amounts an employee receives from an entity other than their main employer taxed?",
    "Amounts received from an entity other than the main employer, whether or not the person is seconded, are subject to salary tax at a flat final rate of 10%, with no deduction for costs or any other allowance. No tax exemptions apply to these amounts.",
  ],
  [
    "ما المعاملة الضريبية لما يتقاضاه العاملون من بدل مقابل الوجبة الغذائية؟",
    "نصّت الفقرة (أ) من البند (5) من المادة (13) من القانون صراحةً على إعفاء الوجبة الغذائية التي تُصرف للعاملين، بشرط أن تكون عينية وجماعية. ويترتب على ذلك أنه إذا دفع صاحب العمل مبلغًا نقديًّا مقابل الوجبة، عُدّ ميزة نقدية تخضع للضريبة على المرتبات ويتحملها من صُرفت له.",
    "How is a meal allowance paid to employees taxed?",
    "Article 13(5)(a) of the Law expressly exempts meals provided to employees, provided they are in kind and provided collectively. If the employer instead pays cash in lieu of the meal, the payment is a cash benefit subject to salary tax, borne by the employee who receives it.",
  ],
  [
    "ما المعاملة الضريبية لما يتقاضاه العاملون من بدل نقدي مقابل عدم استفادتهم من ميزة النقل الجماعي في ظل القانون رقم 91 لسنة 2005؟",
    "نصّت الفقرة (ب) من البند (5) من المادة (13) من القانون صراحةً على إعفاء ميزة النقل الجماعي للعاملين أو ما يقابلها من تكلفة، بشرط أن تكون عينية وجماعية. فإذا كانت لدى المنشأة سيارات لنقل العاملين، فإن تكلفة نقلهم لا تُعد ميزة لهم ولا تخضع للضريبة؛ وكذلك إذا استأجرت سيارات من الغير لنقل العاملين نقلًا جماعيًّا، وهذا هو المقصود بعبارة «أو ما يقابلها من تكلفة». أما إذا صرفت الجهة لأي من العاملين مبالغ في صورة بدل نقدي مقابل ميزة النقل الجماعي، فإن هذا المبلغ يُعد ميزة نقدية لمن يحصل عليه ويخضع للضريبة على المرتبات وما في حكمها.",
    "How is a cash allowance paid instead of company group transport taxed under Law No. 91 of 2005?",
    "Article 13(5)(b) expressly exempts group transport provided to employees, or its cost, provided it is in kind and collective. If the company runs its own vehicles to transport staff, or hires vehicles from a third party for group transport, the cost is not a taxable benefit; that is what “or its cost” means. If the company instead pays an employee a cash allowance in place of group transport, that amount is a cash benefit subject to salary tax.",
  ],
  [
    "ما المعاملة الضريبية لما يتقاضاه العاملون من حصص الأرباح التي يتقرر توزيعها قانونًا؟",
    "نصّ البند (6) من المادة (13) من القانون صراحةً على إعفاء حصة العاملين من الأرباح التي يتقرر توزيعها طبقًا للقانون، مع مراعاة أن هذه الحصة لا تُعد من التكاليف واجبة الخصم بالنسبة للشركة أو المنشأة عند تحديد وعائها الضريبي.",
    "How is employees' statutory profit share taxed?",
    "Article 13(6) expressly exempts employees' share of profits distributed in accordance with the law. That share is not a deductible cost for the company when its own taxable base is determined.",
  ],
  [
    "ما المعاملة الضريبية لما يتقاضاه رؤساء وأعضاء مجالس الإدارة من مكافآت العضوية وبدلاتها في شركات الأموال؟",
    "لم يتضمن القانون نصًّا بخضوع ما يتقاضاه رؤساء وأعضاء مجالس الإدارة من مكافآت العضوية أو بدلاتها في شركات الأموال للضريبة على المرتبات وما في حكمها أو غيرها من الضرائب، مع مراعاة أن هذه المكافآت والبدلات لا تُعد من التكاليف واجبة الخصم عند تحديد الوعاء الضريبي للشركة طبقًا للبند (4) من المادة (52) من القانون رقم 91 لسنة 2005.",
    "How are board membership fees and allowances in capital companies taxed?",
    "The Law contains no provision subjecting board chairs' and members' membership fees or allowances in capital companies to salary tax or any other tax. However, under Article 52(4) of Law No. 91 of 2005, these fees and allowances are not deductible costs when the company's taxable base is determined.",
  ],
  [
    "ما المعاملة الضريبية لما يتقاضاه رؤساء وأعضاء مجالس الإدارة المساهمون من حصص الأرباح وأرباح الأسهم الموزعة، ومقابل الحضور الذي يُدفع للمساهمين لحضور الجمعية العامة، في ظل القانون رقم 91 لسنة 2005؟",
    "لم يتضمن القانون نصًّا بخضوع هذه الحصص أو الأرباح الموزعة أو مقابل الحضور للضريبة على المرتبات وما في حكمها أو غيرها من الضرائب، مع مراعاة أن حصص الأرباح وأرباح الأسهم الموزعة ومقابل الحضور الذي يُدفع للمساهمين لحضور الجمعية العامة لا تُعد من التكاليف واجبة الخصم عند تحديد وعاء الضريبة بالنسبة للشركة.",
    "How are profit shares, dividends and general-assembly attendance fees paid to shareholder board members taxed under Law No. 91 of 2005?",
    "The Law contains no provision subjecting these profit shares, dividends or attendance fees to salary tax or any other tax. They are, however, not deductible costs when the company's taxable base is determined.",
  ],
  [
    "ما المعاملة الضريبية لما يتقاضاه رؤساء وأعضاء مجالس الإدارة غير المساهمين في شركات القطاع العام وقطاع الأعمال العام من مرتبات ومكافآت؟",
    "قرر القانون خضوع ما يحصل عليه رؤساء وأعضاء مجالس الإدارة غير المساهمين في شركات القطاع العام وقطاع الأعمال العام من مرتبات ومكافآت للضريبة على المرتبات وما في حكمها، شأنهم شأن باقي العاملين الخاضعين للضريبة.",
    "How are salaries and bonuses paid to non-shareholder board members of public-sector and public-business-sector companies taxed?",
    "They are subject to salary tax, in the same way as any other taxable employee.",
  ],
  [
    "ما المعاملة الضريبية لما يتقاضاه رؤساء وأعضاء مجالس الإدارة والمديرون في شركات الأموال من مرتبات ومكافآت مقابل العمل الإداري؟",
    "قرر القانون خضوع ما يحصل عليه رؤساء وأعضاء مجالس الإدارة والمديرون في شركات الأموال مقابل عملهم الإداري للضريبة على المرتبات وما في حكمها، شأنهم شأن باقي العاملين، ودون تحديد حد أقصى لهذه المبالغ أو لعدد هؤلاء الأعضاء.",
    "How are salaries and bonuses paid to board members and managers of capital companies for management work taxed?",
    "They are subject to salary tax like any other employee, with no cap on the amounts or on the number of such members.",
  ],
  [
    "ما المعاملة الضريبية للمقابل النقدي لرصيد الإجازات الذي يُصرف للعاملين عند انتهاء الخدمة بسبب الوفاة أو الاستقالة أو الإحالة إلى المعاش؟",
    "يُعفى ما يتقاضاه العاملون من مقابل نقدي لرصيد الإجازات عند انتهاء الخدمة، سواء بسبب الوفاة أو الاستقالة أو الإحالة إلى المعاش، من الضريبة على المرتبات وما في حكمها طبقًا للقانون رقم 232 لسنة 1996.",
    "How is cash paid for unused leave on termination of service (death, resignation or retirement) taxed?",
    "Cash paid for an accrued leave balance on termination of service, whether through death, resignation or retirement, is exempt from salary tax under Law No. 232 of 1996.",
  ],
  [
    "هل تُعد التكاليف الفعلية التي يتطلبها أداء العامل لمهام وظيفته من الإيرادات الخاضعة للضريبة؟",
    "لا، فالتكاليف الفعلية التي يتطلبها بالضرورة أداء العامل لوظيفته لا تدخل ضمن الإيرادات الخاضعة للضريبة على المرتبات وما في حكمها، إذ تُعد مقابل تكلفة فعلية وفقًا للأحكام العامة للقانون.",
    "Are actual costs an employee necessarily incurs to do their job taxable income?",
    "No. Actual costs necessarily incurred in performing the job are not part of income subject to salary tax; under the general provisions of the Law they are treated as reimbursement of an actual cost.",
  ],
  [
    "هل يتمتع المحال إلى المعاش الذي يعمل لدى أي جهة بالإعفاءات الواردة بالمادتين (7) و(13) من القانون رقم 91 لسنة 2005 عن المبالغ التي يتقاضاها من جهة عمله؟",
    "العامل الذي يلتحق بعمل بعد إحالته إلى المعاش يخضع ما يحصل عليه مقابل عمله للضريبة على المرتبات شأنه شأن باقي العاملين، ويتمتع بالشريحة المعفاة والإعفاء الشخصي وفقًا للقانون، مع مراعاة أن يظل ما يحصل عليه من المعاش غير خاضع للضريبة، وتُعد الجهة التي يعمل بها جهة عمله الأصلية.",
    "Does a retiree who takes up employment benefit from the exemptions in Articles 7 and 13 of Law No. 91 of 2005?",
    "Yes. A retiree who takes up new employment is taxed on their earnings like any other employee and receives the exempt bracket and personal allowance under the Law. Their pension remains non-taxable, and the new employer is treated as their main employer.",
  ],
  [
    "ما أسعار الضريبة على صافي الإيراد الخاضع للضريبة على المرتبات وما في حكمها؟",
    "الأسعار طبقًا لنص المادة (8) من القانون رقم 91 لسنة 2005:\n- أكثر من 5000 جنيه حتى 20000 جنيه: 10%.\n- أكثر من 20000 جنيه حتى 40000 جنيه: 15%.\n- أكثر من 40000 جنيه: 20%.",
    "What rates apply to net taxable income from salaries and similar payments?",
    "Under Article 8 of Law No. 91 of 2005 as originally enacted:\n- Over EGP 5,000 up to EGP 20,000: 10%.\n- Over EGP 20,000 up to EGP 40,000: 15%.\n- Over EGP 40,000: 20%.",
  ],
  [
    "ما نسبة مقابل التأخير المستحق على ما لم يقم أصحاب الأعمال أو الملتزمون بدفع الإيراد بتوريده في الميعاد؟ ومتى يُستحق؟",
    "يُستحق مقابل التأخير من اليوم التالي لنهاية المهلة المحددة للتوريد، ويُحسب على أساس سعر الائتمان والخصم المعلن من البنك المركزي مضافًا إليه 2%.",
    "What late-payment charge applies when employers or payers fail to remit tax on time, and when does it start?",
    "The late-payment charge accrues from the day after the remittance deadline and is calculated at the Central Bank of Egypt's announced credit and discount rate plus 2%.",
  ],
  [
    "هل يتمتع العامل أو الموظف الذي يعمل جزءًا من السنة بالشريحة المعفاة والإعفاء الشخصي (5000 و4000 جنيه) كاملين أم بنسبة مدة الحصول على الإيراد؟",
    "يستحق الممول (العامل أو الموظف) الذي يعمل جزءًا من السنة الإعفاءات الضريبية المذكورة بنسبة مدة العمل إلى السنة، وفقًا لأحكام المواد (7) و(8) و(10) من القانون.",
    "Does an employee who works only part of the year receive the full exempt bracket and personal allowance (EGP 5,000 and 4,000), or a pro-rata amount?",
    "A pro-rata amount. Under Articles 7, 8 and 10 of the Law, an employee who works part of the year receives these exemptions in proportion to the period worked.",
  ],
  [
    "من المسؤول عن توريد الضريبة إلى المصلحة؟",
    "المسؤول عن توريد الضريبة إلى المصلحة هم أصحاب الأعمال والملتزمون بدفع الإيرادات الخاضعة للضريبة، وذلك بحجز مبلغ مما يكون عليهم دفعه تحت حساب الضريبة وفقًا لما تحدده اللائحة التنفيذية، ويتم التوريد إلى مأمورية الضرائب المختصة خلال الخمسة عشر يومًا الأولى من كل شهر عن الدفعات التي تمت في الشهر السابق. وإذا كان صاحب العمل أو الملتزم بدفع الإيراد الخاضع للضريبة غير مقيم في مصر أو لم يكن له فيها مركز أو منشأة، تقع مسؤولية توريد الضريبة على مستحق الإيراد.",
    "Who is responsible for remitting the tax to the Tax Authority?",
    "Employers and payers of taxable income. They withhold tax on account from the amounts they pay, as set out in the Executive Regulations, and remit it to the competent tax office within the first 15 days of each month for payments made in the previous month. If the employer or payer is not resident in Egypt and has no office or establishment there, the recipient of the income is responsible for remitting the tax.",
  ],
  [
    "ما التزامات صاحب العمل تجاه المصلحة، وتجاه الموظف أو العامل؟",
    "التزامات صاحب العمل تجاه المصلحة:\n1. أن يحجز مما يكون عليه دفعه مبلغًا تحت حساب الضريبة ويورّده خلال 15 يومًا من الشهر التالي.\n2. أن يسدد فروق الضريبة الناشئة عن الفحص، دون إخلال بحقه في الرجوع على الممول بما هو مدين به.\n3. أن يقدّم إقرارًا ربع سنوي إلى المصلحة في يناير وأبريل ويوليو وأكتوبر.\n\nأما التزامه تجاه الموظف أو العامل فهو أن يعطيه، بناءً على طلبه، كشفًا يبيّن اسمه ومبلغ الدخل ونوعه وقيمة الضريبة المحجوزة.",
    "What are an employer's obligations to the Tax Authority and to its employees?",
    "To the Tax Authority, the employer must:\n1. Withhold tax on account from amounts it pays and remit it within 15 days of the following month.\n2. Pay any tax differences arising on examination, without prejudice to its right to recover them from the employee.\n3. File a quarterly return in January, April, July and October.\n\nTo the employee, the employer must provide on request a statement showing the employee's name, the amount and type of income, and the tax withheld.",
  ],
  [
    "ما العقوبة المقررة على الامتناع عن تقديم الإقرار الضريبي في الحالات التي يلتزم فيها الموظف بتقديمه؟",
    "نصّت المادة (135) من القانون على المعاقبة بغرامة لا تقل عن ألفي جنيه ولا تجاوز عشرة آلاف جنيه لكل من امتنع عن تقديم الإقرار الضريبي.",
    "What is the penalty for failing to file a tax return where an employee is required to file?",
    "Article 135 of the Law provides for a fine of not less than EGP 2,000 and not more than EGP 10,000 for anyone who fails to file a tax return.",
  ],
  [
    "ما العقوبة المقررة في حالة امتناع أصحاب الأعمال أو الملتزمين بدفع الإيراد عن استقطاع الضريبة أو خصمها أو توريدها في المواعيد القانونية؟",
    "نصّت المادة (135) من القانون على المعاقبة بغرامة لا تقل عن ألفي جنيه ولا تجاوز عشرة آلاف جنيه لكل من امتنع عن تقديم الإقرار الضريبي.",
    "What is the penalty where employers or payers fail to withhold, deduct or remit tax on time?",
    "The original answer repeats the previous one: Article 135 of the Law provides for a fine of not less than EGP 2,000 and not more than EGP 10,000 for anyone who fails to file a tax return. This answer is awaiting review by SCO.",
  ],
  [
    "ما المعاملة الضريبية للعلاوات الخاصة التي تقرر منحها للموظف عند حساب الضريبة على المرتبات وما في حكمها للأجر الأساسي؟",
    "تضمنت الفقرة الأولى من المادة (13) من القانون حكمًا مفاده عدم الإخلال بالإعفاءات الضريبية الأخرى المقررة بقوانين خاصة؛ وحيث إن هذه العلاوات معفاة بنص صريح في القوانين التي تقررها، فإنها تُعفى من ضريبة المرتبات وفقًا لهذه القوانين.",
    "How are special allowances (al-ʿilawat al-khassa) treated when calculating salary tax on basic pay?",
    "The first paragraph of Article 13 preserves tax exemptions granted under special laws. Because these special allowances are expressly exempted by the laws that grant them, they are exempt from salary tax under those laws.",
  ],
  [
    "ما المعاملة الضريبية للأجور المتغيرة المنصرفة مقابل العلاوات الخاصة التي ضُمّت إلى المرتب الأساسي؟",
    "العلاوات الخاصة معفاة بموجب قوانين منحها، سواء أضيفت إلى المرتب الأساسي أم لم تُضف؛ إلا أن الأجور المتغيرة المنصرفة مقابل العلاوات الخاصة التي أضيفت إلى المرتب الأساسي تخضع للضريبة ولا تتمتع بالإعفاء المقرر للعلاوة، وفقًا لما انتهى إليه رأي الجمعية العمومية لقسمي الفتوى والتشريع بمجلس الدولة ووافقت عليه مصلحة الضرائب.",
    "How are variable wages paid in respect of special allowances merged into basic pay taxed?",
    "Special allowances are exempt under the laws that grant them, whether or not they have been merged into basic pay. However, variable wages paid in respect of special allowances that have been merged into basic pay are taxable and do not share the allowance's exemption. This follows an opinion of the General Assembly of the Fatwa and Legislation Departments of the State Council, adopted by the Tax Authority.",
  ],
  [
    "ما المعاملة الضريبية لما يحصل عليه أعضاء السلكين الدبلوماسي والقنصلي والمنظمات الدولية وغيرهم من الممثلين الدبلوماسيين الأجانب في نطاق عملهم الرسمي؟",
    "تضمن البند (7) من المادة (13) من القانون حكمًا بإعفاء ما يحصل عليه أعضاء السلكين الدبلوماسي والقنصلي والمنظمات الدولية وغيرهم من الممثلين الدبلوماسيين الأجانب من المرتبات وما في حكمها في نطاق عملهم الرسمي، بشرط المعاملة بالمثل وفي حدود تلك المعاملة.",
    "How is income received by foreign diplomatic and consular staff and international-organisation officials in the course of their official duties taxed?",
    "Article 13(7) exempts salaries and similar payments received by members of the diplomatic and consular corps, international organisations and other foreign diplomatic representatives in the course of their official duties, subject to reciprocity and to the extent of it.",
  ],
  [
    "ما المعاملة الضريبية لما يحصل عليه العاملون في السفارات والقنصليات والمنظمات الدولية الكائنة في جمهورية مصر العربية؟",
    "لم يتضمن القانون نصًّا بإعفاء ما يحصل عليه العاملون في السفارات والقنصليات والمنظمات الدولية من غير أعضاء السلكين الدبلوماسي والقنصلي والمنظمات الدولية من المرتبات وما في حكمها؛ وبذلك يخضع ما يحصلون عليه للضريبة على المرتبات وما في حكمها عن أدائهم الخدمة في مصر، مع مراعاة أحكام اتفاقيات تجنب الازدواج الضريبي.",
    "How are local staff of embassies, consulates and international organisations in Egypt taxed?",
    "The Law contains no exemption for employees of embassies, consulates and international organisations who are not themselves members of the diplomatic or consular corps or of the organisation. Their salaries for services performed in Egypt are therefore subject to salary tax, taking into account any applicable double-taxation treaty.",
  ],
  [
    "ما حدود الإعفاء المقرر لاشتراكات العاملين في صناديق التأمين الخاصة المنشأة طبقًا للقانون رقم 54 لسنة 1975، وأقساط التأمين على الحياة والتأمين الصحي على الممول لمصلحته أو لمصلحة زوجه أو أولاده القُصّر، وأي أقساط تأمين لاستحقاق معاش؟",
    "تضمن البندان (3) و(4) من المادة (13) من القانون الإعفاء من:\n- اشتراكات العاملين في صناديق التأمين الخاصة التي تنشأ طبقًا لأحكام قانون صناديق التأمين الخاصة رقم 54 لسنة 1975.\n- أقساط التأمين على الحياة والتأمين الصحي على الممول لمصلحته أو لمصلحة زوجه أو أولاده القُصّر، وأي أقساط تأمين لاستحقاق معاش.\n\nواشترطت المادة نفسها ألا يزيد مجموع ما يُعفى للممول منها على 15% من صافي الإيراد أو ثلاثة آلاف جنيه في السنة أيهما أكبر، ولا يجوز إعفاء الاشتراكات والأقساط ذاتها من أي دخل آخر منصوص عليه في المادة (6) من القانون. وتطبيقًا لذلك:\n- إذا قلّت نسبة الـ15% عن 3000 جنيه، يكون الحد الأقصى لما يُستقطع من الإيراد الخاضع للضريبة 3000 جنيه، ويُستقطع المبلغ المدفوع أو 3000 جنيه أيهما أقل.\n- إذا زادت نسبة الـ15% على 3000 جنيه، يكون الحد الأقصى لما يُستقطع المبلغ المدفوع أو 15% من الدخل أيهما أقل.",
    "What are the limits on the exemption for contributions to private insurance funds (Law No. 54 of 1975), life and health insurance premiums for the taxpayer, spouse or minor children, and pension insurance premiums?",
    "Article 13(3) and (4) exempt:\n- Employee contributions to private insurance funds established under Private Insurance Funds Law No. 54 of 1975.\n- Life and health insurance premiums paid for the taxpayer, their spouse or minor children, and any premiums paid to secure a pension.\n\nThe same Article caps the total exemption at 15% of net income or EGP 3,000 a year, whichever is greater, and the same contributions and premiums cannot also be exempted against any other income listed in Article 6. The legacy answer then explains the cap as follows:\n- Where 15% of income is less than EGP 3,000, the maximum deduction is EGP 3,000, and the deduction is the amount paid or EGP 3,000, whichever is lower.\n- Where 15% of income exceeds EGP 3,000, the deduction is the amount paid or 15% of income, whichever is lower.",
  ],
];

export const faqs: Faq[] = raw.map(([qa, aa, qe, ae], i) => ({
  group_key: "payroll-tax",
  sort: i + 1,
  published: true,
  question: { ar: qa, en: qe },
  answer: { ar: md(aa), en: md(ae) },
  legal_basis: LB,
  reviewed_at: "2021-01-01",
}));
