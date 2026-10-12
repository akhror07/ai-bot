/**
 * Domain-Semantic Planner & Content Synthesis Engine
 * Slaydlarni 100% mavzuga moslashtirilgan reja asosida yaratadi va takrorlanishlarni butunlay yo'q qiladi.
 */

export const DOMAINS = {
  it: {
    names: {
      uz: 'Axborot Texnologiyalari va Sun\'iy Intellekt',
      ru: 'Информационные технологии и ИИ',
      en: 'Information Technology & Artificial Intelligence',
      tg: 'Технологияҳои иттилоотӣ ва зеҳни сунъӣ'
    },
    subtitles: {
      uz: {
        hero: 'Raqamli transformatsiya, hisoblash quvvati va tizimli modellar',
        comparison: 'Klassik arxitektura va zamonaviy intellektual modellar qiyosi',
        pillars: 'Tizim barqarorligi, ma\'lumotlar xavfsizligi va yuqori unumdorlik',
        hub: 'Markaziy hisoblash platformasi, API integratsiyasi va mikroxizmatlar',
        kpi: 'Tizim tezligi, aniqlik koeffitsiyenti va server yuklamasi',
        roadmap: 'Bosqichli ishlab chiqish, CI/CD quvurlari va sinov amaliyoti',
        milestones: 'Kvartallar bo\'yicha versiyalarni chiqarish va audit jadvali',
        spotlight: 'Kiberxavfsizlik va algoritmik barqarorlik kafolati',
        conclusion: 'Texnologik ustunlik va kelajakdagi rivojlanish vektori'
      },
      ru: {
        hero: 'Цифровая трансформация, вычислительные мощности и системные модели',
        comparison: 'Сравнение классической архитектуры и интеллектуальных моделей',
        pillars: 'Отказоустойчивость, безопасность данных и масштабируемость',
        hub: 'Центральная вычислительная платформа, API и микросервисы',
        kpi: 'Скорость обработки, точность алгоритмов и нагрузка серверов',
        roadmap: 'Поэтапная разработка, CI/CD конвейеры и тестирование',
        milestones: 'Квартальный график релизов и матрица аудита',
        spotlight: 'Кибербезопасность и алгоритмическая надежность',
        conclusion: 'Технологическое лидерство и стратегический вектор развития'
      },
      en: {
        hero: 'Digital transformation, compute scalability, and intelligent frameworks',
        comparison: 'Legacy infrastructure vs. modern intelligent architectures',
        pillars: 'System resilience, zero-trust security, and high throughput',
        hub: 'Central compute engine, unified API gateways, and microservices',
        kpi: 'Throughput latency, prediction accuracy, and infrastructure uptime',
        roadmap: 'Phased deployment lifecycle, automated CI/CD, and regression testing',
        milestones: 'Quarterly release cadence and security governance matrix',
        spotlight: 'Cybersecurity posture and algorithmic integrity',
        conclusion: 'Technological superiority and sustainable future trajectory'
      },
      tg: {
        hero: 'Таҳаввулоти рақамӣ, иқтидори ҳисоббарорӣ ва моделҳои низомманд',
        comparison: 'Муқоисаи меъмории анъанавӣ ва моделҳои муосири зеҳнӣ',
        pillars: 'Устувории низом, амнияти маълумот ва маҳсулнокии баланд',
        hub: 'Платформаи марказии ҳисоббарорӣ, пайвасти API ва микрохизматрасониҳо',
        kpi: 'Суръати коркард, дақиқии алгоритмҳо ва сарбории серверҳо',
        roadmap: 'Марҳилаҳои таҳия, санҷиши пайваста ва татбиқи амалӣ',
        milestones: 'Ҷадвали чорякии нашри навсозиҳо ва назорати сифат',
        spotlight: 'Амнияти киберӣ ва кафолати устувории алгоритмӣ',
        conclusion: 'Бартарии технологӣ ва дурнамои рушди стратегӣ'
      }
    },
    metrics: {
      uz: [
        { value: '99.9%', label: 'Tizim Barqarorligi (Uptime)', desc: 'Xizmatlarning uzluksiz ishlashi' },
        { value: '3.5x', label: 'Hisoblash Tezligi', desc: 'Operatsiyalar unumdorligi o\'sishi' },
        { value: '<50ms', label: 'Javob Qaytarish Vaqti', desc: 'Server kechikish darajasi (Latency)' },
        { value: '94.8%', label: 'Model Aniqligi (Accuracy)', desc: 'Bashorat va tahlil ishonchliligi' }
      ],
      ru: [
        { value: '99.9%', label: 'Отказоустойчивость (Uptime)', desc: 'Непрерывная доступность сервисов' },
        { value: '3.5x', label: 'Прирост скорости', desc: 'Ускорение вычислений и транзакций' },
        { value: '<50ms', label: 'Время отклика (Latency)', desc: 'Минимальная задержка запросов' },
        { value: '94.8%', label: 'Точность модели', desc: 'Достоверность прогнозов алгоритма' }
      ],
      en: [
        { value: '99.9%', label: 'System Uptime SLA', desc: 'Continuous service availability' },
        { value: '3.5x', label: 'Compute Acceleration', desc: 'Efficiency gain across workloads' },
        { value: '<50ms', label: 'End-to-End Latency', desc: 'Optimized response latency' },
        { value: '94.8%', label: 'Algorithmic Accuracy', desc: 'Verified statistical confidence' }
      ],
      tg: [
        { value: '99.9%', label: 'Устувории низом (Uptime)', desc: 'Фаъолияти бефосилаи хизматрасониҳо' },
        { value: '3.5x', label: 'Суръати ҳисоббарорӣ', desc: 'Афзоиши маҳсулнокии амалиётҳо' },
        { value: '<50ms', label: 'Вақти посух (Latency)', desc: 'Ҳадди ақали таъхири сервер' },
        { value: '94.8%', label: 'Дақиқии модел', desc: 'Эътимоднокии пешгӯӣ ва таҳлил' }
      ]
    }
  },

  med: {
    names: {
      uz: 'Tibbiyot va Sog\'liqni Saqlash',
      ru: 'Медицина и здравоохранение',
      en: 'Medicine & Healthcare',
      tg: 'Тиб ва тандурустӣ'
    },
    subtitles: {
      uz: {
        hero: 'Klinik tahlil, bemorlar salomatligi va innovatsion davolash usullari',
        comparison: 'An\'anaviy klinik muolajalar va yuqori texnologik diagnostika qiyosi',
        pillars: 'Erta tashxis, standartlashtirilgan terapiya va reabilitatsiya',
        hub: 'Klinik markaz, laboratoriya tahlili va monitoring tizimi',
        kpi: 'Sog\'ayish foizi, diagnostika aniqligi va bemorlar qoniqishi',
        roadmap: 'Klinik sinovlar, xodimlarni sertifikatlash va amaliyotga joriy etish',
        milestones: 'Davolash protokollari va laboratoriya audit jadvali',
        spotlight: 'Bemorlar xavfsizligi va bioetika mezonlariga qat\'iy rioya',
        conclusion: 'Sog\'liqni saqlash tizimida uzoq muddatli sifat kafolati'
      },
      ru: {
        hero: 'Клинический анализ, здоровье пациентов и инновационные протоколы',
        comparison: 'Традиционные методы лечения и высокоточная диагностика',
        pillars: 'Ранний скрининг, доказательная терапия и реабилитация',
        hub: 'Клинический центр, лабораторный комплекс и телеметрия',
        kpi: 'Динамика выздоровления, точность скрининга и комплаентность',
        roadmap: 'Клиническая верификация, аттестация врачей и внедрение',
        milestones: 'График лечебных протоколов и контрольный аудит',
        spotlight: 'Безопасность пациентов и соблюдение медицинской биоэтики',
        conclusion: 'Стандарты качества и системное развитие здравоохранения'
      },
      en: {
        hero: 'Clinical diagnostics, patient outcomes, and therapeutic innovations',
        comparison: 'Conventional intervention vs. precision evidence-based care',
        pillars: 'Early screening, standardized therapy, and rehabilitation',
        hub: 'Clinical care center, laboratory analytics, and telemetry monitoring',
        kpi: 'Recovery turnaround, diagnostic precision, and patient satisfaction',
        roadmap: 'Clinical trials, accreditation, and operational protocol deployment',
        milestones: 'Protocol ratification timeline and quality compliance matrix',
        spotlight: 'Patient safety culture and bioethical governance',
        conclusion: 'Sustainable healthcare excellence and long-term impact'
      },
      tg: {
        hero: 'Таҳлили клиникӣ, саломатии беморон ва усулҳои нави табобат',
        comparison: 'Муқоисаи муолиҷаи анъанавӣ ва ташхиси дақиқи технологӣ',
        pillars: 'Ташхиси барвақтӣ, табобати стандартӣ ва барқарорсозӣ',
        hub: 'Маркази клиникӣ, ташхисгоҳи замонавӣ ва назорати беморон',
        kpi: 'Нишондиҳандаи шифоёбӣ, дақиқии ташхис ва қаноатмандии мардум',
        roadmap: 'Озмоишҳои клиникӣ, сертификатсияи табибон ва татбиқи амалӣ',
        milestones: 'Ҷадвали қабули протоколҳо ва назорати сифати табобат',
        spotlight: 'Бехатарии беморон ва риояи меъёрҳои одоби тиббӣ',
        conclusion: 'Кафолати сифат ва рушди устувори низоми тандурустӣ'
      }
    },
    metrics: {
      uz: [
        { value: '96.2%', label: 'Erta Diagnostika Aniqligi', desc: 'Tasdiqlangan klinik natijalar' },
        { value: '-40%', label: 'Asoratlar Xavfi Kamayishi', desc: 'Profilaktik choralar samarasi' },
        { value: '15 Min', label: 'Tahlil Tezkorligi', desc: 'Laboratoriya xulosasi chiqarish vaqti' },
        { value: '98%', label: 'Bemorlar Qoniqish Darajasi', desc: 'Xalqaro mezonlarga muvofiqlik' }
      ],
      ru: [
        { value: '96.2%', label: 'Точность ранней диагностики', desc: 'Клинически подтвержденные данные' },
        { value: '-40%', label: 'Снижение осложнений', desc: 'Эффект превентивных мер' },
        { value: '15 мин', label: 'Скорость скрининга', desc: 'Экспресс-анализ в лаборатории' },
        { value: '98%', label: 'Удовлетворенность пациентов', desc: 'Международные стандарты качества' }
      ],
      en: [
        { value: '96.2%', label: 'Diagnostic Precision', desc: 'Validated clinical outcomes' },
        { value: '-40%', label: 'Complication Risk Reduction', desc: 'Preventative protocol efficiency' },
        { value: '15 Min', label: 'Turnaround Latency', desc: 'Lab analysis response time' },
        { value: '98%', label: 'Patient Satisfaction', desc: 'Accredited quality score' }
      ],
      tg: [
        { value: '96.2%', label: 'Дақиқии ташхиси барвақтӣ', desc: 'Натиҷаҳои санҷидашудаи клиникӣ' },
        { value: '-40%', label: 'Коҳиши хатари оризаҳо', desc: 'Самараи тадбирҳои пешгирикунанда' },
        { value: '15 дақ', label: 'Суръати ташхис', desc: 'Хулосаи фаврии озмоишгоҳ' },
        { value: '98%', label: 'Қаноатмандии беморон', desc: 'Риояи стандартҳои байналмилалӣ' }
      ]
    }
  },

  tourism: {
    names: {
      uz: 'Turizm va Mehmondo\'stlik',
      ru: 'Туризм и гостеприимство',
      en: 'Tourism & Hospitality',
      tg: 'Сайёҳӣ ва меҳмоннавозӣ'
    },
    subtitles: {
      uz: {
        hero: 'Madaniy meros salohiyati, ekotizim va xalqaro sayyohlar jalb etish',
        comparison: 'Standart tarqoq xizmatlar va yagona integratsiyalashgan ekotizim qiyosi',
        pillars: 'Infratuzilma sifati, transport qulayligi va milliy mehmondo\'stlik',
        hub: 'Boshqaruv markazi, marshrutlar xaritasi va gidlar tarmog\'i',
        kpi: 'Sayyohlar soni, eksport hajmi va o\'rtacha chek ko\'rsatkichlari',
        roadmap: 'Meros obyektlarini rivojlantirish va xalqaro bozorga chiqish',
        milestones: 'Mavsumiy reja, marketing kampaniyalari va sifat nazorati',
        spotlight: 'Merosni asrash va ekologik barqarorlik muvozanati',
        conclusion: 'O\'zbekistonni mintaqaning bosh turizm markaziga aylantirish'
      },
      ru: {
        hero: 'Культурное наследие, туристический кластер и приток путешественников',
        comparison: 'Разрозненные локальные туры и единая цифровая экосистема сервиса',
        pillars: 'Качество инфраструктуры, логистическая доступность и гостеприимство',
        hub: 'Координационный центр кластера, карта маршрутов и корпус гидов',
        kpi: 'Турпоток, валютные поступления и средняя продолжительность визита',
        roadmap: 'Развитие объектов показа, маркетинг и выход на мировые рынки',
        milestones: 'Сезонный календарь запуска проектов и матрица KPI',
        spotlight: 'Сохранение исторического наследия и экологический баланс',
        conclusion: 'Формирование ведущего международного туристического хаба'
      },
      en: {
        hero: 'Cultural heritage potential, tourism clusters, and inbound traveler scale',
        comparison: 'Fragmented traditional itineraries vs. unified digital guest ecosystem',
        pillars: 'World-class hospitality, high-speed logistics, and heritage preservation',
        hub: 'Cluster governance hub, verified tour operator grid, and smart mobility',
        kpi: 'Inbound tourist volume, service export revenue, and length of stay',
        roadmap: 'Destination master planning, global market entry, and certification',
        milestones: 'Quarterly seasonal execution milestones and compliance framework',
        spotlight: 'Heritage conservation balance and sustainable eco-tourism',
        conclusion: 'Positioning as the central regional tourism and cultural capital'
      },
      tg: {
        hero: 'Иқтидори мероси таърихӣ, кластери сайёҳӣ ва ҷалби сайёҳони хориҷӣ',
        comparison: 'Муқоисаи хизматрасонии пароканда ва низоми ягонаи рақамӣ',
        pillars: 'Сифати инфрасохтор, осонии нақлиёт ва меҳмоннавозии миллӣ',
        hub: 'Маркази ҳамоҳангсозӣ, харитаи хатсайрҳо ва шабакаи роҳбаладон',
        kpi: 'Шумораи сайёҳон, содироти хизматрасониҳо ва даромад',
        roadmap: 'Ободонии ёдгориҳо, тарғибот ва баромадан ба бозорҳои ҷаҳонӣ',
        milestones: 'Нақшаи мавсимӣ, маъракаҳои маркетинг ва назорати сифат',
        spotlight: 'Ҳифзи ёдгориҳои таърихӣ ва устувории экологӣ',
        conclusion: 'Табдил додани кишвар ба маркази асосии сайёҳии минтақа'
      }
    },
    metrics: {
      uz: [
        { value: '7.8M', label: 'Yillik Sayyohlar Oqimi', desc: 'Xorijiy turistlar soni' },
        { value: '$2.6B', label: 'Turizm Xizmatlari Eksporti', desc: 'Yillik valyuta tushumlari hajmi' },
        { value: '4.2 Kun', label: 'O\'rtacha Qolish Davomiyligi', desc: 'Sayyohning mamlakatda qolishi' },
        { value: '+42%', label: 'Mehmonxonalar Fondi O\'sishi', desc: 'Yangi joylashtirish vositalari sig\'imi' }
      ],
      ru: [
        { value: '7.8M', label: 'Ежегодный турпоток', desc: 'Количество иностранных гостей' },
        { value: '$2.6 млрд', label: 'Экспорт туруслуг', desc: 'Объем валютных поступлений' },
        { value: '4.2 дня', label: 'Средняя длительность', desc: 'Время пребывания путешественника' },
        { value: '+42%', label: 'Рост номерного фонда', desc: 'Ввод современных отелей и гостевых домов' }
      ],
      en: [
        { value: '7.8M', label: 'Annual Inbound Visitors', desc: 'International tourist volume' },
        { value: '$2.6B', label: 'Tourism Services Export', desc: 'Foreign exchange receipts' },
        { value: '4.2 Days', label: 'Average Stay Duration', desc: 'Extended guest engagement' },
        { value: '+42%', label: 'Hospitality Capacity Growth', desc: 'Expanded licensed hotel inventory' }
      ],
      tg: [
        { value: '7.8M', label: 'Ҷараёни солонаи сайёҳон', desc: 'Шумораи меҳмонони хориҷӣ' },
        { value: '$2.6 млрд', label: 'Содироти хизматрасонӣ', desc: 'Ҳаҷми даромади соҳаи сайёҳӣ' },
        { value: '4.2 рӯз', label: 'Муддати миёнаи иқомат', desc: 'Вақти гузаронидаи сайёҳ' },
        { value: '+42%', label: 'Афзоиши фонди меҳмонхонаҳо', desc: 'Иқтидори нави ҷойгиркунӣ' }
      ]
    }
  },

  finance: {
    names: {
      uz: 'Iqtisodiyot va Moliya',
      ru: 'Экономика и финансы',
      en: 'Economics & Finance',
      tg: 'Иқтисодиёт ва молия'
    },
    subtitles: {
      uz: {
        hero: 'Makroiqtisodiy barqarorlik, investitsiya oqimi va kapital rentabelligi',
        comparison: 'Eski moliyaviy mexanizmlar va ilg\'or fintech yondashuvlar qiyosi',
        pillars: 'Moliyaviy intizom, diversifikatsiya va risklarni boshqarish',
        hub: 'Markaziy audit, investitsiya portfeli va likvidlik markazi',
        kpi: 'Sof foyda, investitsiya rentabelligi (ROI) va portfel o\'sishi',
        roadmap: 'Moliyaviy tahlil, kapital jalb qilish va aktivlarni boshqarish',
        milestones: 'Kvartallik balans hisoboti va moliyaviy audit matritsasi',
        spotlight: 'Moliyaviy xatarlardan himoyalanish va shaffoflik',
        conclusion: 'Kapital qiymatini oshirish va barqaror moliyaviy kelajak'
      },
      ru: {
        hero: 'Макроэкономическая стабильность, инвестиционный поток и доходность',
        comparison: 'Традиционный бухучет и передовые финансовые технологии (Fintech)',
        pillars: 'Финансовая дисциплина, диверсификация портфеля и риск-менеджмент',
        hub: 'Аналитический центр, управление активами и ликвидность',
        kpi: 'Чистая рентабельность (ROI), операционная маржа и мультипликаторы',
        roadmap: 'Финансовая диагностика, синдицирование и масштабирование',
        milestones: 'Квартальный баланс и контрольная матрица финансового аудита',
        spotlight: 'Управление волатильностью и защита инвестиций',
        conclusion: 'Капитализация активов и долгосрочная финансовая устойчивость'
      },
      en: {
        hero: 'Macroeconomic stability, capital allocation, and portfolio profitability',
        comparison: 'Legacy bookkeeping models vs. modern automated fintech architecture',
        pillars: 'Fiscal governance, asset diversification, and integrated risk management',
        hub: 'Central financial engine, liquidity controls, and portfolio treasury',
        kpi: 'Net Return on Investment (ROI), operating EBITDA, and cash runway',
        roadmap: 'Capital structuring, liquidity validation, and enterprise deployment',
        milestones: 'Quarterly financial ledger milestones and audit compliance',
        spotlight: 'Asset preservation strategy and risk hedging framework',
        conclusion: 'Sustainable enterprise value creation and market leadership'
      },
      tg: {
        hero: 'Устувории макроиқтисодӣ, ҷараёни сармоя ва даромаднокии он',
        comparison: 'Муқоисаи низоми куҳнаи молиявӣ ва қарорҳои пешрафтаи финтех',
        pillars: 'Инзиботи молиявӣ, диверсификатсия ва идоракунии хатарҳо',
        hub: 'Маркази аудити молиявӣ, идораи дороиҳо ва назорати пардохтпазирӣ',
        kpi: 'Фоидаи соф, даромаднокии сармоягузорӣ (ROI) ва афзоиши сармоя',
        roadmap: 'Таҳлили молиявӣ, ҷалби сармоя ва идоракунии маблағҳо',
        milestones: 'Ҳисоботи чорякии молиявӣ ва ҷадвали аудити назоратӣ',
        spotlight: 'Ҳифзи сармоя аз хатарҳо ва шаффофияти молиявӣ',
        conclusion: 'Афзоиши арзиши сармоя ва ояндаи боэътимоди молиявӣ'
      }
    },
    metrics: {
      uz: [
        { value: '28.4%', label: 'Investitsiya Rentabelligi (ROI)', desc: 'Sof yillik investitsiya daromadi' },
        { value: '+35%', label: 'Operatsion Daromad O\'sishi', desc: 'Jarayonlar samaradorligi samarasi' },
        { value: '-22%', label: 'Xarajatlar Qisqarishi', desc: 'Resurslarni optimallashtirish hisobiga' },
        { value: '1.8x', label: 'Likvidlik Koeffitsiyenti', desc: 'Moliyaviy majburiyatlarni qoplash' }
      ],
      ru: [
        { value: '28.4%', label: 'Рентабельность инвестиций (ROI)', desc: 'Чистая доходность на капитал' },
        { value: '+35%', label: 'Рост операционного дохода', desc: 'Оптимизация ключевых транзакций' },
        { value: '-22%', label: 'Снижение издержек', desc: 'Сокращение операционных потерь' },
        { value: '1.8x', label: 'Коэффициент ликвидности', desc: 'Покрытие текущих обязательств' }
      ],
      en: [
        { value: '28.4%', label: 'Return on Investment (ROI)', desc: 'Net annualized return rate' },
        { value: '+35%', label: 'Operating Revenue Surge', desc: 'Efficiency optimization gain' },
        { value: '-22%', label: 'Operational Cost Reduction', desc: 'Elimination of overhead waste' },
        { value: '1.8x', label: 'Current Liquidity Ratio', desc: 'Solvency and reserve backing' }
      ],
      tg: [
        { value: '28.4%', label: 'Даромаднокии сармоя (ROI)', desc: 'Фоидаи софи солона аз сармоягузорӣ' },
        { value: '+35%', label: 'Афзоиши даромади амалиётӣ', desc: 'Самараи оптимизатсияи фаъолият' },
        { value: '-22%', label: 'Коҳиши хароҷот', desc: 'Сарфаи захираҳои молиявӣ' },
        { value: '1.8x', label: 'Коэффисиенти пардохтпазирӣ', desc: 'Пӯшонидани ӯҳдадориҳои молиявӣ' }
      ]
    }
  },

  education: {
    names: {
      uz: 'Ta\'lim va Pedagogika',
      ru: 'Образование и педагогика',
      en: 'Education & Pedagogy',
      tg: 'Маориф ва омӯзгорӣ'
    },
    subtitles: {
      uz: {
        hero: 'Ilmiy-nazariy asoslar, interaktiv metodlar va inson kapitali',
        comparison: 'An\'anaviy yodlash usuli va kompetensiyaviy interaktiv ta\'lim qiyosi',
        pillars: 'O\'quv dasturi sifati, amaliy amaliyot va pedagogik monitoring',
        hub: 'Metodik markaz, raqamli kutubxona va laboratoriya muhiti',
        kpi: 'O\'zlashtirish darajasi, amaliy natijalar va bitiruvchilar bandligi',
        roadmap: 'Dasturlarni yangilash, ustozlar malakasini oshirish va sinovlar',
        milestones: 'Semestrli reja, modulli baholash va akkreditatsiya jadvali',
        spotlight: 'Akademik halollik va doimiy mustaqil ta\'lim kafolati',
        conclusion: 'Kelajak avlod intellektual salohiyatini yuksaltirish'
      },
      ru: {
        hero: 'Академический фундамент, интерактивные методики и человеческий капитал',
        comparison: 'Пассивное заучивание и компетентностно-ориентированное обучение',
        pillars: 'Качество учебных программ, практика и педагогический аудит',
        hub: 'Методический центр, цифровая платформа знаний и лаборатория',
        kpi: 'Успеваемость, исследовательская активность и занятость выпускников',
        roadmap: 'Модернизация курсов, повышение квалификации и пилотные группы',
        milestones: 'Модульный график оценивания и сертификация программ',
        spotlight: 'Академическая честность и непрерывное развитие компетенций',
        conclusion: 'Формирование интеллектуального потенциала нового поколения'
      },
      en: {
        hero: 'Pedagogical foundation, interactive curriculum, and human capital growth',
        comparison: 'Rote memorization models vs. competency-driven active learning',
        pillars: 'Curriculum rigor, experiential learning, and continuous faculty audit',
        hub: 'Methodological learning center, digital knowledge hub, and lab studio',
        kpi: 'Retention mastery, student research output, and graduate employment',
        roadmap: 'Curriculum overhaul, faculty upskilling, and institutional piloting',
        milestones: 'Modular accreditation roadmap and semester milestone matrix',
        spotlight: 'Academic integrity and self-directed lifelong learning',
        conclusion: 'Cultivating exceptional human capital and intellectual leadership'
      },
      tg: {
        hero: 'Асосҳои илмӣ-назариявӣ, усулҳои интерактивии таълим ва сармояи инсонӣ',
        comparison: 'Муқоисаи азхудкунии пассив ва таълими фаъоли салоҳиятнок',
        pillars: 'Сифати барномаҳои таълимӣ, таҷрибаомӯзӣ ва назорати сифат',
        hub: 'Маркази методӣ, китобхонаи рақамӣ ва муҳити озмоишӣ',
        kpi: 'Сатҳи донишандӯзӣ, натиҷаҳои амалӣ ва бокортаъминшавии хатмкунандагон',
        roadmap: 'Навсозии барномаҳо, бозомӯзии омӯзгорон ва санҷишҳои амалӣ',
        milestones: 'Ҷадвали баҳодиҳии модулӣ ва аккредитатсияи фанҳо',
        spotlight: 'Поквичдонии академӣ ва омӯзиши пайвастаи донишҳо',
        conclusion: 'Рушди неруи зеҳнӣ ва тарбияи насли созанда'
      }
    },
    metrics: {
      uz: [
        { value: '88.5%', label: 'O\'zlashtirish Koeffitsiyenti', desc: 'Talabalar bilim darajasi ko\'rsatkichi' },
        { value: '92%', label: 'Bitiruvchilar Bandligi', desc: 'Mehnat bozorida talabgorlik' },
        { value: '+45%', label: 'Amaliy Mashg\'ulotlar Ulushi', desc: 'Laboratoriya va keys darslari' },
        { value: '4.8/5', label: 'Ta\'lim Sifati Qoniqishi', desc: 'Talabalar mustaqil so\'rovnomasi' }
      ],
      ru: [
        { value: '88.5%', label: 'Коэффициент успеваемости', desc: 'Уровень усвоения компетенций' },
        { value: '92%', label: 'Трудоустройство выпускников', desc: 'Востребованность на рынке труда' },
        { value: '+45%', label: 'Доля практических занятий', desc: 'Лабораторные и кейс-модули' },
        { value: '4.8/5', label: 'Удовлетворенность обучением', desc: 'Независимая оценка студентов' }
      ],
      en: [
        { value: '88.5%', label: 'Mastery & Retention Rate', desc: 'Assessed competency benchmark' },
        { value: '92%', label: 'Graduate Employment', desc: 'Direct market demand rate' },
        { value: '+45%', label: 'Hands-on Practicum Share', desc: 'Case study and laboratory exposure' },
        { value: '4.8/5', label: 'Student Satisfaction Index', desc: 'Independent survey rating' }
      ],
      tg: [
        { value: '88.5%', label: 'Сатҳи азхудкунии дониш', desc: 'Нишондиҳандаи дониши донишҷӯён' },
        { value: '92%', label: 'Бокортаъминшавии хатмкунандагон', desc: 'Талабот дар бозори меҳнат' },
        { value: '+45%', label: 'Ҳиссаи машғулиятҳои амалӣ', desc: 'Дарсҳои озмоишгоҳӣ ва кейсҳо' },
        { value: '4.8/5', label: 'Қаноатмандӣ аз таълим', desc: 'Баҳодиҳии мустақили донишҷӯён' }
      ]
    }
  },

  ecology: {
    names: {
      uz: 'Ekologiya va Yashil Energetika',
      ru: 'Экология и зеленая энергетика',
      en: 'Ecology & Green Energy',
      tg: 'Экология ва энергетикаи сабз'
    },
    subtitles: {
      uz: {
        hero: 'Yashil o\'tish, tabiiy resurslarni asrash va toza texnologiyalar',
        comparison: 'Qazilma yoqilg\'i modeli va qayta tiklanuvchi energiya qiyosi',
        pillars: 'Energiya tejamkorlik, chiqindisiz ishlab chiqarish va ekologik nazorat',
        hub: 'Generatsiya stansiyasi, taqsimot tarmog\'i va monitoring markazi',
        kpi: 'Uglerod chiqindilari kamayishi, toza energiya ulushi va tejalgan resurslar',
        roadmap: 'Loyiha-smeta ishlari, stansiyalar qurilishi va tarmoqqa ulash',
        milestones: 'Yillik ekologik audit va quvvatlarni oshirish grafigi',
        spotlight: 'Ekologik xavfsizlik va kelajak avlod oldidagi mas\'uliyat',
        conclusion: 'Tabiat bilan uyg\'un, nol emissiyali yashil kelajak sari'
      },
      ru: {
        hero: 'Зеленый переход, сохранение биоразнообразия и чистые технологии',
        comparison: 'Ископаемое топливо и возобновляемые источники энергии (ВИЭ)',
        pillars: 'Энергоэффективность, безотходное производство и эко-контроль',
        hub: 'Генерирующая мощность, распределительная сеть и мониторинг',
        kpi: 'Снижение углеродного следа, доля ВИЭ и сохраненные ресурсы',
        roadmap: 'Инженерное проектирование, строительство парков и ввод в сеть',
        milestones: 'График наращивания мощности и матрица экологического аудита',
        spotlight: 'Экологическая безопасность и ответственность перед будущим',
        conclusion: 'Устойчивое безуглеродное будущее в гармонии с природой'
      },
      en: {
        hero: 'Green transition, natural capital conservation, and clean technologies',
        comparison: 'Fossil-fuel dependence vs. decentralized renewable energy systems',
        pillars: 'Resource efficiency, circular waste management, and environmental audits',
        hub: 'Clean generation grid, distributed battery storage, and dispatch telemetry',
        kpi: 'Carbon footprint reduction, renewable generation share, and water savings',
        roadmap: 'Site engineering, utility construction, and grid synchronization',
        milestones: 'Capacity commissioning timeline and ESG verification milestones',
        spotlight: 'Ecological resilience and intergenerational stewardship',
        conclusion: 'Achieving net-zero emissions through sustainable green infrastructure'
      },
      tg: {
        hero: 'Гузариш ба иқтисоди сабз, ҳифзи табиат ва технологияҳои пок',
        comparison: 'Муқоисаи сӯзишвории анъанавӣ ва манбаъҳои барқароршаванда',
        pillars: 'Сарфакории барқ, истеҳсолоти бепартов ва назорати экологӣ',
        hub: 'Неругоҳи тавлиди барқ, шабакаи тақсимот ва маркази мониторинг',
        kpi: 'Коҳиши партовҳои карбон, ҳиссаи неруи сабз ва сарфаи захираҳо',
        roadmap: 'Лоиҳакашӣ, сохтмони неругоҳҳо ва пайвастшавӣ ба шабака',
        milestones: 'Ҷадвали афзоиши иқтидор ва аудити солонаи экологӣ',
        spotlight: 'Амнияти экологӣ ва масъулият назди наслҳои оянда',
        conclusion: 'Ояндаи устувори сабз ва ҳамоҳангӣ бо табиат'
      }
    },
    metrics: {
      uz: [
        { value: '-60%', label: 'Uglerod Emissiyasi Kamayishi', desc: 'Atrof-muhitga tashlanmalar qisqarishi' },
        { value: '2.4 GW', label: 'Toza Energiya Quvvati', desc: 'Quyosh va shamol stansiyalari hajmi' },
        { value: '45M m³', label: 'Tejalgan Suv Hajmi', desc: 'Aqlli tejash texnologiyalari samarasi' },
        { value: '82%', label: 'Chiqindilarni Qayta Ishlash', desc: 'Sirkulyar iqtisodiyot darajasi' }
      ],
      ru: [
        { value: '-60%', label: 'Сокращение выбросов CO2', desc: 'Снижение углеродной нагрузки' },
        { value: '2.4 ГВт', label: 'Мощность чистой генерации', desc: 'Солнечные и ветровые станции' },
        { value: '45 млн м³', label: 'Экономия водных ресурсов', desc: 'Внедрение капельного орошения' },
        { value: '82%', label: 'Глубина переработки отходов', desc: 'Индекс циркулярной экономики' }
      ],
      en: [
        { value: '-60%', label: 'Carbon Emissions Reduction', desc: 'Avoided greenhouse gas baseline' },
        { value: '2.4 GW', label: 'Installed Clean Capacity', desc: 'Solar and wind utility footprint' },
        { value: '45M m³', label: 'Conserved Freshwater Volume', desc: 'Precision conservation efficiency' },
        { value: '82%', label: 'Circular Material Recycling', desc: 'Zero-waste compliance metric' }
      ],
      tg: [
        { value: '-60%', label: 'Коҳиши партови газҳои зарарнок', desc: 'Ҳифзи фазо аз ифлосшавӣ' },
        { value: '2.4 GW', label: 'Иқтидори неруи тоза', desc: 'Неругоҳҳои офтобӣ ва бодӣ' },
        { value: '45 млн м³', label: 'Сарфаи захираҳои об', desc: 'Самараи технологияҳои нави обёрӣ' },
        { value: '82%', label: 'Коркарди партовҳо', desc: 'Нишондиҳандаи иқтисоди даврагӣ' }
      ]
    }
  },

  general: {
    names: {
      uz: 'Strategik Rivojlanish va Boshqaruv',
      ru: 'Стратегическое развитие и управление',
      en: 'Strategic Management & Leadership',
      tg: 'Рушди стратегӣ ва идоракунӣ'
    },
    subtitles: {
      uz: {
        hero: 'Tizimli tahlil, strategik maqsadlar va barqaror rivojlanish omillari',
        comparison: 'An\'anaviy passiv yondashuv va faol innovatsion strategiya qiyosi',
        pillars: 'Strategik rejalashtirish, jamoa salohiyati va jarayonlar monitoringi',
        hub: 'Boshqaruv markazi, kommunikatsiya va natijalar portali',
        kpi: 'Samaradorlik ko\'rsatkichlari, maqsadlarga erishish va unumdorlik',
        roadmap: 'Diagnostika, asosiy bosqichlar va amaliyotga joriy etish',
        milestones: 'Kvartallar bo\'yicha natijalar va strategik nazorat jadvali',
        spotlight: 'Boshqaruv intizomi va jamoaviy birdamlik',
        conclusion: 'Uzoq muddatli barqaror natijalarga erishish kafolati'
      },
      ru: {
        hero: 'Системный анализ, стратегические ориентиры и факторы роста',
        comparison: 'Инерционный подход и проактивная стратегия трансформации',
        pillars: 'Стратегическое планирование, лидерство и операционный контроль',
        hub: 'Командный центр управления, коммуникации и аналитика',
        kpi: 'Ключевые показатели эффективности (KPI) и продуктивность',
        roadmap: 'Комплексная диагностика, дорожная карта и реализация',
        milestones: 'Квартальный план реализации и матрица ответственности',
        spotlight: 'Управленческая дисциплина и командная синергия',
        conclusion: 'Обеспечение устойчивого долгосрочного лидерства'
      },
      en: {
        hero: 'Systemic evaluation, strategic imperatives, and sustainable execution',
        comparison: 'Passive legacy routines vs. agile proactive growth strategy',
        pillars: 'Strategic roadmapping, talent alignment, and operational accountability',
        hub: 'Central leadership hub, cross-functional grid, and telemetry',
        kpi: 'Key performance indicators, output yield, and milestone velocity',
        roadmap: 'Discovery diagnostics, milestone execution, and scaled roll-out',
        milestones: 'Quarterly objective results (OKR) and deliverables matrix',
        spotlight: 'Executive discipline and collaborative organizational synergy',
        conclusion: 'Delivering durable competitive advantage and enduring results'
      },
      tg: {
        hero: 'Таҳлили низомманд, ҳадафҳои стратегӣ ва омилҳои рушди устувор',
        comparison: 'Муқоисаи усули куҳнаи ғайрифаъол ва стратегияи нави пешрафт',
        pillars: 'Банақшагирии стратегӣ, неруи даста ва назорати равандҳо',
        hub: 'Маркази идоракунӣ, робитаҳои мустақим ва арзёбии натиҷаҳо',
        kpi: 'Нишондиҳандаҳои маҳсулнокӣ, расидан ба ҳадафҳо ва самаранокӣ',
        roadmap: 'Ташхиси аввалия, марҳилаҳои асосӣ ва татбиқи амалӣ',
        milestones: 'Натиҷаҳои чорякӣ ва ҷадвали назорати стратегӣ',
        spotlight: 'Инзиботи идоракунӣ ва ҳамдигарфаҳмии дастаҷамъона',
        conclusion: 'Кафолати ноил шудан ба натиҷаҳои устувори дарозмуддат'
      }
    },
    metrics: {
      uz: [
        { value: '+45%', label: 'Jarayonlar Unumdorligi', desc: 'Optimallashtirish hisobiga o\'sish' },
        { value: '90%', label: 'Maqsadlarga Erishish', desc: 'Belgilangan KPI ko\'rsatkichlari' },
        { value: '-35%', label: 'Vaqt Yo\'qotishlari Kamayishi', desc: 'Operatsion tezlanish samarasi' },
        { value: '95%', label: 'Sifat Standartlari', desc: 'Barcha talablarga to\'liq muvofiqlik' }
      ],
      ru: [
        { value: '+45%', label: 'Рост производительности', desc: 'Эффект оптимизации процессов' },
        { value: '90%', label: 'Достижение целей (KPI)', desc: 'Выполнение плановых ориентиров' },
        { value: '-35%', label: 'Сокращение задержек', desc: 'Ускорение операционных циклов' },
        { value: '95%', label: 'Соответствие стандартам', desc: 'Полное соблюдение регламентов' }
      ],
      en: [
        { value: '+45%', label: 'Operational Output Growth', desc: 'Direct workflow optimization gain' },
        { value: '90%', label: 'Milestone Attainment Rate', desc: 'Assessed KPI goal completion' },
        { value: '-35%', label: 'Cycle Latency Reduction', desc: 'Streamlined process velocity' },
        { value: '95%', label: 'Standard Compliance Rate', desc: 'Audit quality verification' }
      ],
      tg: [
        { value: '+45%', label: 'Афзоиши маҳсулнокӣ', desc: 'Самараи соддасозии равандҳо' },
        { value: '90%', label: 'Расидан ба ҳадафҳо', desc: 'Иҷрои нақшаҳои стратегӣ' },
        { value: '-35%', label: 'Коҳиши талафоти вақт', desc: 'Тезонидани фаъолияти корӣ' },
        { value: '95%', label: 'Риояи стандартҳои сифат', desc: 'Мутобиқати комил ба меъёрҳо' }
      ]
    }
  }
};

/**
 * Mavzu matniga qarab sohani (Domain) aniqlaydi
 */
export function detectDomain(topic) {
  const t = (topic || '').toLowerCase();
  if (/(ta'lim|maktab|universitet|pedagog|o'qituvchi|talaba|o'quvchi|metodika|dars|tarbiya|образован|педагог|учител|школ|студент|обучени|методик|вуз|маориф|омӯзгор|донишҷӯ|education|school|university|teacher|student|pedagogy)/i.test(t)) return 'education';
  if (/(turizm|sayyoh|ziyorat|mehmonxona|hotel|sayohat|ekoturizm|gastronomik|gid|туро|туризм|путешеств|гостиниц|отел|экскурси|сайёҳ|сайёҳӣ|меҳмонхона|tourism|tourist|travel|hotel|hospitality)/i.test(t)) return 'tourism';
  if (/(tibbiyot|shifo|salomat|klinika|vrach|doktor|dori|farmatsevt|kasallik|jarroh|genom|mrt|covid|meditsin|здравоохран|медицин|врач|клиник|болезн|диагностик|тиб|тандуруст|бемор|табиб|medicine|health|medical|clinic|doctor)/i.test(t)) return 'med';
  if (/(ekolog|yashil|energetik|quyosh|shamol|tabiat|suv|iqlim|chiqindi|bio|global\s*isish|isish|harorat|muzlik|uglerod|parnik|issiqxona|atmosfera|co2|carbon|warming|climate|emissiy|эколог|зелен|энергети|солнц|климат|природ|обёр|экология|барқ|потеплен|парников|ледник|выброс|углерод|ecology|green|energy|solar|wind|climate|nature|warming|greenhouse)/i.test(t)) return 'ecology';
  if (/(iqtisod|moliya|bank|kredit|investits|buxgalter|soliq|bozor|savdo|pul|audit|finans|бизнес|финанс|банк|инвестиц|бухгалтер|налог|рынок|экономик|валют|молия|бонк|finance|bank|investment|audit|tax)/i.test(t)) return 'finance';
  if (/(huquq|qonun|sud|advokat|jinoyat|adliya|konstituts|davlat|boshqaruv|normativ|прав|закон|суд|юрист|юриспруд|государств|конституц|law|legal|court|crime|justice|constitution)/i.test(t)) return 'law';
  if (/(qishloq|fermer|hosil|paxta|g'alla|bog'dorchilik|chorva|agrar|agro|сельск|фермер|урожай|аграр|животновод|agriculture|farm|crop|harvest|agro)/i.test(t)) return 'agriculture';
  if (/(sanoat|zavod|fabrika|avtomobil|mashinasozlik|ishlab chiqarish|metallurg|logistik|транспорт|промышлен|завод|автомобил|производств|логистик|industry|factory|manufacturing|production|logistics)/i.test(t)) return 'industry';
  if (/(ai|sun'iy intellekt|neyron|dastur|kiber|algoritm|kompyuter|robot|texnolog|software|cloud|bulut|data|ma'lumot|tarmoq|цифров|программ|интеллект|нейрон|кибер|ии|зеҳни сунъӣ|technology|artificial intelligence|neural)/i.test(t)) return 'it';
  return 'general';
}

/**
 * 1-QADAM: Dinamik, 100% mavzuga moslashtirilgan reja (Outline)
 */
export function generateSemanticOutline({ topic, slideCount = 8, language = 'uz', categoryObj }) {
  const domainKey = detectDomain(topic);
  const bp = DOMAINS[domainKey] || DOMAINS.general;
  const lang = (['uz', 'ru', 'en', 'tg'].includes(language)) ? language : 'uz';
  const targetCount = Math.min(Math.max(parseInt(slideCount, 10) || 8, 3), 20);

  const subs = bp.subtitles[lang] || bp.subtitles.uz;
  const domainName = bp.names[lang] || bp.names.uz;

  // Layout journey matching reference presentation (20 distinct unique stages)
  const progression = [
    {
      layoutType: 'split_hero',
      suffix: {
        uz: 'Konseptual Asoslar va Strategik Zarurat',
        ru: 'Концептуальные основы и стратегическая необходимость',
        en: 'Foundational Concepts & Strategic Imperative',
        tg: 'Асосҳои консептуалӣ ва зарурати стратегӣ'
      },
      sub: subs.hero
    },
    {
      layoutType: 'comparison',
      suffix: {
        uz: 'Yondashuvlar Qiyosi va Innovatsion Afzalliklar',
        ru: 'Сравнительный анализ и преимущества инноваций',
        en: 'Comparative Analysis & Strategic Advantage',
        tg: 'Муқоисаи равишҳо ва афзалиятҳои инноватсионӣ'
      },
      sub: subs.comparison
    },
    {
      layoutType: 'three_cards',
      suffix: {
        uz: 'Uchta Asosiy Tayanch Ustun va Modullar',
        ru: 'Три ключевых столпа и архитектурных модуля',
        en: 'Three Core Pillars & Architectural Modules',
        tg: 'Се сутуни асосӣ ва модулҳои сохторӣ'
      },
      sub: subs.pillars
    },
    {
      layoutType: 'matrix_grid',
      suffix: {
        uz: 'Tizimli Matritsa va Tuzilmaviy Bog\'liqliklar',
        ru: 'Системная матрица и структурные взаимосвязи',
        en: 'Systemic Framework Matrix & Core Dependencies',
        tg: 'Матритсаи низомманд ва робитаҳои сохторӣ'
      },
      sub: (lang === 'ru') ? 'Четыре ключевых измерения устойчивого развития' : (lang === 'en') ? 'Four structural dimensions of institutional excellence' : (lang === 'tg') ? 'Чаҳор ҷанбаи калидии рушди устувор' : 'Barqaror rivojlanishning to\'rtta asosiy tizimli o\'lchovi'
    },
    {
      layoutType: 'circular_feature',
      suffix: {
        uz: 'Integratsiyalashgan Ekotizim va Boshqaruv Yadrosi',
        ru: 'Интегрированная экосистема и центр управления',
        en: 'Integrated Ecosystem & Core Operational Hub',
        tg: 'Экосистемаи ягона ва маркази идоракунӣ'
      },
      sub: subs.hub
    },
    {
      layoutType: 'kpi_metrics',
      suffix: {
        uz: 'Asosiy Empirik Ko\'rsatkichlar va KPI Mezonlari',
        ru: 'Ключевые эмпирические метрики и критерии KPI',
        en: 'Empirical Performance Metrics & Key KPIs',
        tg: 'Нишондиҳандаҳои калидии амалӣ ва меъёрҳои KPI'
      },
      sub: subs.kpi
    },
    {
      layoutType: 'data_chart',
      suffix: {
        uz: 'Statistik Trendlar va Rivojlanish Dinamikasi',
        ru: 'Статистические тренды и динамика развития',
        en: 'Statistical Trajectory & Quantitative Trends',
        tg: 'Тамоюлҳои оморӣ ва динамикаи рушд'
      },
      sub: (lang === 'ru') ? 'Аналитическая динамика изменений и сравнительный тренд' : (lang === 'en') ? 'Longitudinal metric trajectory and validation benchmarks' : (lang === 'tg') ? 'Динамикаи тағйирот ва таҳлили муқоисавӣ' : 'O\'zgarishlar dinamikasi va qiyosiy empirik trend'
    },
    {
      layoutType: 'problem_solution',
      suffix: {
        uz: 'Dolzarb Muammolar Diagnostikasi va Yechimlar',
        ru: 'Диагностика проблем и системные решения',
        en: 'Problem Diagnosis & Transformative Solutions',
        tg: 'Ташхиси мушкилот ва роҳҳалҳои низомманд'
      },
      sub: (lang === 'ru') ? 'Ключевые системные вызовы и механизмы их устранения' : (lang === 'en') ? 'Critical friction points and strategic resolution mechanisms' : (lang === 'tg') ? 'Мушкилоти асосӣ ва роҳҳои ҳалли онҳо' : 'Mavjud tizimli muammolar va ularni bartaraf etish mexanizmlari'
    },
    {
      layoutType: 'process_timeline',
      suffix: {
        uz: 'Amaliyotga Joriy Qilish Bosqichlari va Yo\'l Xaritasi',
        ru: 'Этапы практического внедрения и дорожная карта',
        en: 'Implementation Roadmap & Phased Execution',
        tg: 'Марҳилаҳои татбиқи амалӣ ва харитаи роҳ'
      },
      sub: subs.roadmap
    },
    {
      layoutType: 'swot_analysis',
      suffix: {
        uz: 'Kompleks SWOT Tahlili: Imkoniyat va Xatarlar',
        ru: 'Комплексный SWOT-анализ: возможности и риски',
        en: 'Comprehensive SWOT Matrix: Potentials & Risks',
        tg: 'Таҳлили ҳамаҷонибаи SWOT: имкониятҳо ва хатарҳо'
      },
      sub: (lang === 'ru') ? 'Оценка сильных и слабых сторон, рыночные драйверы и барьеры' : (lang === 'en') ? 'Internal strengths, structural gaps, macro opportunities and threats' : (lang === 'tg') ? 'Арзёбии ҷиҳатҳои қавӣ, заиф ва хатарҳои эҳтимолӣ' : 'Ichki salohiyat, zaif jihatlar, imkoniyatlar va xatarlar balansi'
    },
    {
      layoutType: 'pyramid_hierarchy',
      suffix: {
        uz: 'Ko\'p Qatlamli Ierarxiya va Fundamental Asoslar',
        ru: 'Многоуровневая иерархия и фундамент системы',
        en: 'Multi-Tier Hierarchy & Architectural Foundation',
        tg: 'Иерархияи бисёрсатҳа ва пояҳои низом'
      },
      sub: (lang === 'ru') ? 'Базовый фундамент, операционный контур и стратегический пик' : (lang === 'en') ? 'Core foundation, operational execution and strategic summit' : (lang === 'tg') ? 'Пояи асосӣ, сатҳи амалиётӣ ва қуллаи стратегӣ' : 'Baza poydevori, operatsion boshqaruv va strategik cho\'qqi'
    },
    {
      layoutType: 'milestones_table',
      suffix: {
        uz: 'Kvartallar Bo\'yicha Ijro Rejasi va Marralar',
        ru: 'Поквартальный план исполнения и вехи проекта',
        en: 'Quarterly Execution Milestones & Target Matrix',
        tg: 'Нақшаи чорякии иҷро ва ҳадафҳои асосӣ'
      },
      sub: subs.milestones
    },
    {
      layoutType: 'matrix_rating',
      suffix: {
        uz: 'Standartlar va Mezonlar Bo\'yicha Baholash Reytingi',
        ru: 'Оценочный рейтинг параметров и отраслевых стандартов',
        en: 'Benchmark Scorecard & Performance Rating Matrix',
        tg: 'Рейтинги арзёбии нишондиҳандаҳо ва стандартҳо'
      },
      sub: (lang === 'ru') ? 'Сравнительная матрица оценки по ключевым критериям' : (lang === 'en') ? 'Comparative scoring matrix across mission-critical parameters' : (lang === 'tg') ? 'Матритсаи муқоисавӣ бар асоси меъёрҳои муҳим' : 'Asosiy mezonlar bo\'yicha qiyosiy baholash va reyting matritsasi'
    },
    {
      layoutType: 'scenario_matrix',
      suffix: {
        uz: 'Rivojlanish Ssenariylari va Dinamik Prognoz',
        ru: 'Сценарное моделирование и прогнозные горизонты',
        en: 'Scenario Modeling & Forward-Looking Projections',
        tg: 'Моделсозии сенарияҳо ва дурнамои пешгӯӣ'
      },
      sub: (lang === 'ru') ? 'Базовый, консервативный и прогрессивный вектор развития' : (lang === 'en') ? 'Baseline, risk-adjusted, and accelerated expansion pathways' : (lang === 'tg') ? 'Сенарияҳои асосӣ, эҳтиёткорона ва рушди босуръат' : 'Asosiy, konservativ va progressiv rivojlanish vektorlari'
    },
    {
      layoutType: 'team_stakeholders',
      suffix: {
        uz: 'Manfaatdor Tomonlar va Ekspertlar Tarmog\'i',
        ru: 'Заинтересованные стороны и экспертная экосистема',
        en: 'Key Stakeholders & Expert Governance Network',
        tg: 'Ҷонибҳои манфиатдор ва шабакаи коршиносон'
      },
      sub: (lang === 'ru') ? 'Институциональные роли, эксперты и распределение ответственности' : (lang === 'en') ? 'Institutional ownership, steering councils, and delivery roles' : (lang === 'tg') ? 'Нақшҳои сохторӣ ва тақсимоти масъулият' : 'Institutsional rollar, ekspertlar va javobgarlik taqsimoti'
    },
    {
      layoutType: 'profile_card',
      suffix: {
        uz: 'Tizim Pasporti: Kuchli va Zaif Tomonlar Tahlili',
        ru: 'Паспорт системы: анализ преимуществ и ограничений',
        en: 'Architecture Profile: Strengths & Boundary Constraints',
        tg: 'Шиносномаи низом: таҳлили бартариятҳо ва маҳдудиятҳо'
      },
      sub: (lang === 'ru') ? 'Комплексный профиль характеристик, преимуществ и областей применения' : (lang === 'en') ? 'Technical datasheet, functional pros/cons, and target environments' : (lang === 'tg') ? 'Тавсифи техникӣ, бартариятҳо ва соҳаҳои мувофиқ' : 'Texnik pasport, afzalliklar va qo\'llash sohalari tahlili'
    },
    {
      layoutType: 'quote_editorial',
      suffix: {
        uz: 'Xalqaro Ekspertlar Bahosi va Muhim Tahliliy Insight',
        ru: 'Экспертная верификация и ключевой аналитический инсайт',
        en: 'Executive Insight & International Benchmark Verdict',
        tg: 'Хулосаи коршиносон ва нуқтаи назари муҳими таҳлилӣ'
      },
      sub: (lang === 'ru') ? 'Авторитетная академическая позиция и стратегические уроки' : (lang === 'en') ? 'Authoritative institutional guidance and strategic principles' : (lang === 'tg') ? 'Мавқеи бонуфузи илмӣ ва принсипҳои стратегӣ' : 'Xalqaro nufuzli ilmiy xulosalar va amaliy saboqlar'
    },
    {
      layoutType: 'horizontal_flowchart',
      suffix: {
        uz: 'To\'liq Siklli Jarayonlar Oqimi va Operatsion Zanjir',
        ru: 'Сквозная процессная цепочка и операционный поток',
        en: 'End-to-End Operational Lifecycle & Flow Architecture',
        tg: 'Занҷираи пайдарпайи амалиётӣ ва ҷараёни кор'
      },
      sub: (lang === 'ru') ? 'Последовательный сквозной поток от инициации к валидации' : (lang === 'en') ? 'Sequential workflow execution from initialization to verification' : (lang === 'tg') ? 'Ҷараёни муттасили кор аз оғоз то санҷиши ниҳоӣ' : 'Boshlang\'ich bosqichdan yakuniy natijagacha bo\'lgan uzluksiz oqim'
    },
    {
      layoutType: 'spotlight',
      suffix: {
        uz: 'Xatarlar Tahlili, Himoya Mexanizmlari va Muhim Xulosa',
        ru: 'Анализ рисков, механизмы защиты и ключевой вывод',
        en: 'Risk Governance, Protective Controls & Core Takeaway',
        tg: 'Таҳлили хатарҳо, механизмҳои ҳимоя ва хулосаи калидӣ'
      },
      sub: subs.spotlight
    },
    {
      layoutType: 'cinematic',
      suffix: {
        uz: 'Kelajak Istiqbollari va Global Transformatsiya',
        ru: 'Стратегическое видение и глобальная трансформация',
        en: 'Long-Term Horizon & Global Strategic Transformation',
        tg: 'Дурнамои стратегӣ ва дигаргунсозии глобалӣ'
      },
      sub: subs.conclusion
    }
  ];

  const slides = [];

  // Slide 1: Cover
  const coverSubtitles = {
    uz: `${domainName} yo'nalishida kompleks tahliliy tadqiqot va amaliy istiqbollar`,
    ru: `Комплексное аналитическое исследование и перспективы в области: ${domainName}`,
    en: `Comprehensive analytical assessment and strategic execution in ${domainName}`,
    tg: `Таҳқиқоти ҳамаҷонибаи таҳлилӣ ва дурнамои амалӣ дар самти: ${domainName}`
  };
  slides.push({
    slideNumber: 1,
    type: 'title',
    layoutType: 'title',
    title: topic,
    subtitle: coverSubtitles[lang] || coverSubtitles.uz
  });

  // Calculate middle slides
  const middleCount = Math.max(1, targetCount - 2);
  const agendaSections = [];

  for (let i = 0; i < middleCount; i++) {
    const prog = progression[i % progression.length];
    const sfx = prog.suffix[lang] || prog.suffix.uz;
    agendaSections.push(`${String(i + 1).padStart(2, '0')}. ${sfx}`);
  }

  // Slide 2: Numbered Agenda
  const agendaTitles = {
    uz: { title: 'Taqdimot Mundarijasi va Rejasi', sub: `"${topic}" mavzusini bosqichma-bosqich o'rganish yo'nalishlari` },
    ru: { title: 'Содержание и план презентации', sub: `Поэтапная структура исследования темы "${topic}"` },
    en: { title: 'Executive Agenda & Framework Roadmap', sub: `Phased analytical exploration of "${topic}"` },
    tg: { title: 'Мундариҷа ва нақшаи рӯнамо', sub: `Самтҳои омӯзиши пайдарпайи мавзӯи "${topic}"` }
  };
  const ag = agendaTitles[lang] || agendaTitles.uz;
  slides.push({
    slideNumber: 2,
    type: 'content',
    layoutType: 'agenda_numbered',
    title: ag.title,
    subtitle: ag.sub,
    sections: agendaSections
  });

  // Middle slides
  for (let i = 0; i < middleCount; i++) {
    const prog = progression[i % progression.length];
    const sfx = prog.suffix[lang] || prog.suffix.uz;
    slides.push({
      slideNumber: i + 3,
      type: 'content',
      layoutType: prog.layoutType,
      title: `${topic}: ${sfx}`,
      subtitle: prog.sub
    });
  }

  // Final Slide: Conclusion
  const conclusionTitles = {
    uz: { title: `${topic}: Xulosalar va Strategik Tavsiyalar`, sub: subs.conclusion },
    ru: { title: `${topic}: Выводы и стратегические рекомендации`, sub: subs.conclusion },
    en: { title: `${topic}: Strategic Conclusions & Next Steps`, sub: subs.conclusion },
    tg: { title: `${topic}: Хулосаҳо ва тавсияҳои стратегӣ`, sub: subs.conclusion }
  };
  const conc = conclusionTitles[lang] || conclusionTitles.uz;
  slides.push({
    slideNumber: slides.length + 1,
    type: 'conclusion',
    layoutType: 'conclusion',
    title: conc.title,
    subtitle: conc.sub
  });

  // Normalize strict sequential numbering
  slides.forEach((s, idx) => {
    s.slideNumber = idx + 1;
  });

  return {
    title: topic,
    subtitle: coverSubtitles[lang] || coverSubtitles.uz,
    language: lang,
    slides
  };
}

/**
 * 2-QADAM: Rejadagi har bir slaydni chuqur mavzuli faktlar va ma'lumotlar bilan to'ldirish
 */
export function expandSemanticContent({ outline, language = 'uz', organization = '' }) {
  const lang = (['uz', 'ru', 'en', 'tg'].includes(language)) ? language : 'uz';
  const domainKey = detectDomain(outline.title);
  const bp = DOMAINS[domainKey] || DOMAINS.general;
  const topic = outline.title;
  const metricsList = bp.metrics[lang] || bp.metrics.uz;

  const slides = outline.slides.map((s, idx) => {
    const base = { ...s };

    if (base.layoutType === 'title') {
      const notes = {
        uz: `Hurmatli tinglovchilar! Bugungi taqdimotimiz "${topic}" mavzusidagi tahliliy izlanishlar va amaliy yechimlarga bag'ishlangan.`,
        ru: `Уважаемые коллеги! Наша презентация посвящена аналитическому исследованию и практическим решениям по теме "${topic}".`,
        en: `Welcome everyone! Today’s presentation delivers a comprehensive strategic exploration of "${topic}".`,
        tg: `Салом, ҳозирини гиромӣ! Рӯнамои имрӯзаи мо ба таҳлили амиқ ва роҳҳалҳои амалӣ дар мавзӯи "${topic}" бахшида шудааст.`
      };
      base.speakerNotes = notes[lang] || notes.uz;
      return base;
    }

    if (base.layoutType === 'agenda_numbered') {
      base.points = (base.sections && base.sections.length > 0)
        ? base.sections.map(sec => ({
            heading: sec,
            description: (lang === 'uz')
              ? `"${topic}" doirasida ushbu yo'nalishning amaliy va ilmiy ahamiyati tahlil qilinadi.`
              : (lang === 'ru')
              ? `Детальный практический и теоретический разбор раздела в контексте "${topic}".`
              : (lang === 'en')
              ? `In-depth operational and academic evaluation of this pillar for "${topic}".`
              : `Таҳлили амиқи илмию амалии ин бахш дар доираи мавзӯи "${topic}".`
          }))
        : [
            { heading: '01. Diagnostika', description: 'Mavjud holat tahlili.' },
            { heading: '02. Innovatsiyalar', description: 'Yangi yechimlar va vositalar.' },
            { heading: '03. Natijadorlik', description: 'KPI va kelgusi rejalar.' }
          ];

      const high = {
        uz: `Tizimli reja barcha jarayonlarni o'zaro bog'liq holda amalga oshirish kafolatidir.`,
        ru: `Четкий структурированный план гарантирует синергию всех процессов.`,
        en: `A disciplined framework guarantees systematic execution and operational alignment.`,
        tg: `Нақшаи низомманд ҳамоҳангии комили тамоми равандҳоро таъмин мекунад.`
      };
      base.highlight = high[lang] || high.uz;
      base.speakerNotes = `Mundarijada asosiy bosqichlar va mavzuni yoritish yo'nalishlari belgilangan.`;
      return base;
    }

    if (base.layoutType === 'split_hero') {
      const pData = {
        uz: [
          {
            heading: `Strategik zarurat va bugungi holat`,
            description: `Zamonaviy sharoitda "${topic}" masalasi favqulodda dolzarblik kasb etmoqda. Tizimli tahlillar shuni ko'rsatadiki, an'anaviy yondashuvlar zamon talablariga to'liq javob bermayapti va sifat jihatidan yangi bosqichga o'tishni taqozo etmoqda.`
          },
          {
            heading: `Innovatsion transformatsiya va drayverlar`,
            description: `Ilg'or usullarni qo'llash orqali jarayonlar unumdorligini 35-50% ga oshirish, operatsion yo'qotishlarni bartaraf etish va tizim barqarorligini kafolatlash mumkin.`
          }
        ],
        ru: [
          {
            heading: `Стратегическая актуальность и вызовы`,
            description: `В современных реалиях тема "${topic}" приобретает первостепенное значение. Анализ подтверждает, что устаревшие методы исчерпали потенциал и требуют системного обновления.`
          },
          {
            heading: `Инновационные драйверы эффективности`,
            description: `Внедрение современных стандартов повышает общую производительность на 35–50%, устраняет операционные трения и формирует долгосрочный запас устойчивости.`
          }
        ],
        en: [
          {
            heading: `Strategic Urgency & Modern Context`,
            description: `In the current operating landscape, "${topic}" represents a critical strategic priority. Rigorous analysis reveals legacy frameworks no longer satisfy demanding performance standards.`
          },
          {
            heading: `Transformative Innovation Drivers`,
            description: `Adopting modern methodologies accelerates workflow productivity by 35–50%, eliminates friction, and establishes enduring operational resilience.`
          }
        ],
        tg: [
          {
            heading: `Зарурати стратегӣ ва вазъияти имрӯза`,
            description: `Дар шароити имрӯза масъалаи "${topic}" аҳамияти аввалиндараҷа дорад. Таҳлилҳо нишон медиҳанд, ки усулҳои куҳна ба талабот ҷавобгӯ нестанд ва навсозиро талаб мекунанд.`
          },
          {
            heading: `Омилҳои инноватсионии рушд`,
            description: `Татбиқи қарорҳои пешқадам маҳсулнокиро 35–50% афзуда, хароҷотро кам мекунад ва заминаи боэътимоди рушдро фароҳам меорад.`
          }
        ]
      };
      base.points = pData[lang] || pData.uz;
      base.highlight = (lang === 'uz')
        ? `Ushbu sohadagi yangi yondashuv barcha bo'g'inlarda yuqori natijadorlikni kafolatlaydi.`
        : (lang === 'ru')
        ? `Системная трансформация гарантирует измеримый рост на всех уровнях.`
        : (lang === 'en')
        ? `Systemic transformation unlocks verifiable gains across every operational tier.`
        : `Гузариш ба низоми нав рушди устуворро кафолат медиҳад.`;
      base.speakerNotes = `Ushbu slaydda mavzuning strategik dolzarbligi va uning asosiy sabablari yoritilgan.`;
      return base;
    }

    if (base.layoutType === 'comparison') {
      const compHeaders = {
        uz: { left: 'An\'anaviy Passiv Yondashuv', right: 'Zamonaviy Ilg\'or Model' },
        ru: { left: 'Традиционная инерционная модель', right: 'Современная передовая система' },
        en: { left: 'Legacy Fragmented Paradigm', right: 'Modern Integrated Ecosystem' },
        tg: { left: 'Равиши анъанавии куҳна', right: 'Модели муосири пешқадам' }
      };
      const ch = compHeaders[lang] || compHeaders.uz;
      base.leftHeading = ch.left;
      base.rightHeading = ch.right;

      const compPoints = {
        uz: [
          {
            heading: 'Eski mexanizmlar va cheklovlar',
            description: `Tarqoq boshqaruv, yuqori xarajatlar va zamonaviy talablarga moslashishning sekinligi. Bu esa tizimda ortiqcha yo'qotishlarga olib kelgan.`
          },
          {
            heading: 'Yagona integratsiyalashgan tizim',
            description: `To'liq shaffoflik, avtomatlashtirilgan jarayonlar, yuqori tezlik va resurslarni 30-40% tejash imkoniyati.`
          }
        ],
        ru: [
          {
            heading: 'Ограничения устаревших подходов',
            description: `Разрозненные процессы, высокие скрытые издержки и медленная адаптация к изменениям.`
          },
          {
            heading: 'Преимущества интегрированной системы',
            description: `Полная прозрачность, автоматизация ключевых циклов и экономия 30–40% ресурсов.`
          }
        ],
        en: [
          {
            heading: 'Bottlenecks of Legacy Systems',
            description: `Fragmented data silos, high overhead waste, and sluggish turnaround latency.`
          },
          {
            heading: 'Strengths of Integrated Modern Design',
            description: `Complete visibility, automated workflows, and 30–40% tangible resource savings.`
          }
        ],
        tg: [
          {
            heading: 'Камбудиҳои равиши пешина',
            description: `Идоракунии пароканда, хароҷоти зиёд ва суръати пасти мутобиқшавӣ.`
          },
          {
            heading: 'Бартарии низоми муосир',
            description: `Шаффофияти комил, автоматӣ кардани корҳо ва 30–40% сарфаи захираҳо.`
          }
        ]
      };
      base.points = compPoints[lang] || compPoints.uz;
      base.highlight = (lang === 'uz')
        ? `Yangi modelga o'tish orqali samaradorlik keskin oshadi va xatarlar minimallashadi.`
        : (lang === 'ru')
        ? `Переход на передовую модель минимизирует риски и многократно ускоряет процессы.`
        : (lang === 'en')
        ? `Transitioning to the modern framework eliminates operational risks and boosts velocity.`
        : `Гузариш ба модели нав маҳсулнокиро баланд ва хатарҳоро кам месозад.`;
      base.speakerNotes = `Qiyosiy tahlil yangi yondashuvning barcha asosiy ustunliklarini yaqqol ko'rsatadi.`;
      return base;
    }

    if (base.layoutType === 'three_cards') {
      const tcPoints = {
        uz: [
          { heading: '1. Metodologik Asoslar', description: `"${topic}" yo'nalishida ilmiy asoslangan mezonlar va standartlarni qat'iy joriy etish.` },
          { heading: '2. Texnologik Infratuzilma', description: `Zamonaviy vositalar va raqamli resurslar yordamida ishonchli muhit yaratish.` },
          { heading: '3. Professional Kompetensiya', description: `Mutaxassislar malakasini oshirish va uzluksiz audit tizimini yo'lga qo'yish.` }
        ],
        ru: [
          { heading: '1. Методологическая база', description: `Внедрение научно обоснованных критериев и регламентов по теме "${topic}".` },
          { heading: '2. Технологический контур', description: `Развертывание передовой инфраструктуры и цифровых платформ.` },
          { heading: '3. Экспертный потенциал', description: `Непрерывное повышение квалификации команды и регулярный аудит качества.` }
        ],
        en: [
          { heading: '1. Methodological Rigor', description: `Institutionalizing standardized evidence-based criteria for "${topic}".` },
          { heading: '2. Modern Infrastructure', description: `Deploying state-of-the-art technological backbones and tooling.` },
          { heading: '3. Human Capital Capability', description: `Continuous upskilling programs coupled with regular quality auditing.` }
        ],
        tg: [
          { heading: '1. Заминаи методӣ', description: `Ҷорӣ кардани стандартҳо ва меъёрҳои илмӣ дар мавзӯи "${topic}".` },
          { heading: '2. Инфрасохтори техникӣ', description: `Таъмини муҳити муосир ва воситаҳои рақамӣ барои фаъолияти боэътимод.` },
          { heading: '3. Малакаи касбӣ', description: `Баланд бардоштани сатҳи дониши мутахассисон ва назорати сифат.` }
        ]
      };
      base.points = tcPoints[lang] || tcPoints.uz;
      base.highlight = `Uchala ustun bir-birini to'ldirib, barqaror o'sish poydevorini shakllantiradi.`;
      base.speakerNotes = `Uch tayanch yo'nalish tizimning uzluksiz muvaffaqiyatini kafolatlaydi.`;
      return base;
    }

    if (base.layoutType === 'circular_feature') {
      const cfPoints = {
        uz: [
          { heading: 'Markaziy Koordinatsiya', description: `Barcha amaliy jarayonlarni yagona nuqtadan samarali boshqarish va monitoring qilish.` },
          { heading: 'Modulli Integratsiya', description: `Har bir tarkibiy qismning o'zaro uzviy bog'lanishi va axborot almashinuvi tezkorligi.` },
          { heading: 'Sifat Nazorati Mexanizmi', description: `Belgilangan standartlarga qat'iy rioya etilishini uzluksiz baholab borish.` }
        ],
        ru: [
          { heading: 'Центральная координация', description: `Сквозной мониторинг и управление всеми ключевыми процессами из единого центра.` },
          { heading: 'Модульная интеграция', description: `Бесшовная взаимосвязь функциональных блоков и оперативный обмен данными.` },
          { heading: 'Контроль стандартов', description: `Непрерывная верификация соблюдения регламентов и целевых метрик.` }
        ],
        en: [
          { heading: 'Central Orchestration', description: `Cohesive end-to-end management and telemetry from a single operational hub.` },
          { heading: 'Modular Integration', description: `Seamless synchronization across functional components and rapid data flow.` },
          { heading: 'Quality Governance', description: `Continuous audit mechanisms ensuring strict compliance with performance SLAs.` }
        ],
        tg: [
          { heading: 'Ҳамоҳангсозии марказӣ', description: `Идоракунии мутамарказ ва назорати фаврии тамоми равандҳо.` },
          { heading: 'Пайвасти модулӣ', description: `Ҳамкории зичи бахшҳо ва табодули босуръати маълумот.` },
          { heading: 'Назорати сифат', description: `Арзёбии мунтазами риояи меъёрҳо ва стандартҳои муайяншуда.` }
        ]
      };
      base.points = cfPoints[lang] || cfPoints.uz;
      base.highlight = `Yagona ekotizim tufayli boshqaruv sifati va tezkorligi bir necha barobar ortadi.`;
      base.speakerNotes = `Doiraviy model boshqaruv yadrosi va uning tarkibiy qismlari uyg'unligini ifodalaydi.`;
      return base;
    }

    if (base.layoutType === 'kpi_metrics') {
      base.metrics = metricsList;
      base.points = [
        {
          heading: (lang === 'uz') ? 'Empirik dalillar va o\'sish dinamikasi' : (lang === 'ru') ? 'Эмпирические данные и динамика' : (lang === 'en') ? 'Empirical Benchmarks & Growth Dynamics' : 'Далелҳои амалӣ ва рушд',
          description: (lang === 'uz')
            ? `Statistik ko'rsatkichlar shuni tasdiqlaydiki, tizimli islohotlar qisqa muddatda sezilarli iqtisodiy va sifat samarasini beradi.`
            : (lang === 'ru')
            ? `Метрики подтверждают, что системная оптимизация обеспечивает устойчивый измеримый эффект в кратчайшие сроки.`
            : (lang === 'en')
            ? `Empirical indicators substantiate that structural enhancements generate rapid, measurable operational gains.`
            : `Нишондиҳандаҳо собит месозанд, ки ислоҳоти низомманд натиҷаи назарраси амалӣ ва иқтисодӣ меорад.`
        }
      ];
      base.highlight = (lang === 'uz')
        ? `O'lchanadigan raqamlar loyihaning haqiqiy hayotiy samaradorligini isbotlaydi.`
        : (lang === 'ru')
        ? `Измеримые показатели подтверждают практическую результативность стратегии.`
        : (lang === 'en')
        ? `Empirical metrics validate real-world strategic execution and return on effort.`
        : `Рақамҳои дақиқ самаранокии воқеии лоиҳаро исбот менамоянд.`;
      base.speakerNotes = `Ushbu slaydda eng muhim faktik ko'rsatkichlar va KPI mezonlari jamlangan.`;
      return base;
    }

    if (base.layoutType === 'process_timeline') {
      const ptPoints = {
        uz: [
          { phase: '1-Bosqich: Tahlil va Tayyorgarlik', heading: 'Diagnostika va resurslar auditi', description: 'Mavjud holatni o\'rganish, birlamchi ko\'rsatkichlarni belgilash va harakatlar rejasini tasdiqlash.' },
          { phase: '2-Bosqich: Joriy Etish va Sinov', heading: 'Tajriba-amaliyot va monitoring', description: 'Innovatsion mexanizmlarni amaliyotga tatbiq etish, mutaxassislarni tayyorlash va oraliq natijalarni tahlil qilish.' },
          { phase: '3-Bosqich: Masshtab va Mustahkamlash', heading: 'To\'liq integratsiya va barqarorlik', description: 'Standartlarni to\'liq quvvatda ishga tushirish hamda uzoq muddatli barqaror rivojlanishni ta\'minlash.' }
        ],
        ru: [
          { phase: 'Этап 1: Диагностика и аудит', heading: 'Анализ исходного состояния', description: 'Оценка текущих ресурсов, определение базовых KPI и утверждение детального плана.' },
          { phase: 'Этап 2: Пилотирование и адаптация', heading: 'Тестирование решений', description: 'Внедрение инструментов в пилотных зонах, обучение персонала и промежуточный контроль.' },
          { phase: 'Этап 3: Масштабирование', heading: 'Полномасштабная интеграция', description: 'Развертывание на всю организационную структуру и закрепление устойчивых результатов.' }
        ],
        en: [
          { phase: 'Phase 1: Diagnostics & Audit', heading: 'Baseline Assessment', description: 'Evaluating existing assets, defining benchmark KPIs, and ratifying the operational blueprint.' },
          { phase: 'Phase 2: Piloting & Validation', heading: 'Controlled Implementation', description: 'Executing pilot rollouts, training personnel, and calibrating intermediate feedback.' },
          { phase: 'Phase 3: Scaled Institutionalization', heading: 'Full-Scale Integration', description: 'Rolling out enterprise-wide standards and establishing sustainable long-term governance.' }
        ],
        tg: [
          { phase: 'Марҳилаи 1: Ташхис ва омодагӣ', heading: 'Таҳлили вазъи мавҷуда', description: 'Арзёбии захираҳо, муайян кардани нишондиҳандаҳо ва тасдиқи нақшаи корӣ.' },
          { phase: 'Марҳилаи 2: Татбиқ ва санҷиш', heading: 'Озмоиши амалии қарорҳо', description: 'Ҷорисозии усулҳо дар бахшҳои озмоишӣ, омӯзиши кормандон ва назорати сифат.' },
          { phase: 'Марҳилаи 3: Маъмулсозӣ', heading: 'Фарогирии пурра ва устуворӣ', description: 'Татбиқи комили стандартҳо дар тамоми сохтор ва таъмини натиҷаҳои дарозмуддат.' }
        ]
      };
      base.points = ptPoints[lang] || ptPoints.uz;
      base.highlight = `Bosqichma-bosqich yo'l xaritasi rejaning sifatli bajarilishini ta'minlaydi.`;
      base.speakerNotes = `Bosqichlar zanjiri amaliy harakatlarning mantiqiy ketma-ketligini ifodalaydi.`;
      return base;
    }

    if (base.layoutType === 'milestones_table') {
      const mtPoints = {
        uz: [
          { phase: '1-Bosqich (Q1)', heading: 'Birlamchi audit va reja tasdig\'i', description: 'Mavjud bazani to\'liq xatlovdan o\'tkazish va mas\'ullarni belgilash.', owner: 'Tahliliy Bo\'lim', kpi: '100% Audit' },
          { phase: '2-Bosqich (Q2)', heading: 'Pilot loyiha va xodimlarni o\'qitish', description: 'Yangi tartibni amaliyotga kiritish va xodimlarni tayyorlash.', owner: 'Ijrochi Guruh', kpi: '+35% Samaradorlik' },
          { phase: '3-Bosqich (Q3)', heading: 'To\'liq miqyosda tatbiq etish', description: 'Barcha bo\'g\'inlar bo\'yicha yangi standartlarni ishga tushirish.', owner: 'Boshqaruv Rahbariyati', kpi: '95% Qamrov' },
          { phase: '4-Bosqich (Q4)', heading: 'Yakuniy natijalar va sifat auditi', description: 'Erishilgan natijalarni baholash va uzoq muddatli maqsadlarni belgilash.', owner: 'Sifat Xizmati', kpi: 'Barqaror O\'sish' }
        ],
        ru: [
          { phase: '1-й этап (Q1)', heading: 'Первичный аудит и утверждение', description: 'Инвентаризация текущих ресурсов и назначение ответственных.', owner: 'Аналитический отдел', kpi: '100% Аудит' },
          { phase: '2-й этап (Q2)', heading: 'Пилотный запуск и тренинг', description: 'Запуск пилота и повышение квалификации персонала.', owner: 'Проектная группа', kpi: '+35% Эффективность' },
          { phase: '3-й этап (Q3)', heading: 'Полномасштабное внедрение', description: 'Развертывание утвержденных стандартов по всем направлениям.', owner: 'Руководство проекта', kpi: '95% Охват' },
          { phase: '4-й этап (Q4)', heading: 'Контрольный аудит и фиксация', description: 'Оценка результатов, подтверждение KPI и долгосрочное планирование.', owner: 'Служба качества', kpi: 'Устойчивый рост' }
        ],
        en: [
          { phase: 'Milestone 1 (Q1)', heading: 'Baseline Audit & Plan Ratification', description: 'Comprehensive inventory of assets and stakeholder alignment.', owner: 'Analytics Lead', kpi: '100% Audit Complete' },
          { phase: 'Milestone 2 (Q2)', heading: 'Pilot Deployment & Upskilling', description: 'Launching initial operational pods and team training.', owner: 'Execution Squad', kpi: '+35% Productivity' },
          { phase: 'Milestone 3 (Q3)', heading: 'Enterprise-Wide Rollout', description: 'Deploying validated standards across all divisions.', owner: 'Steering Committee', kpi: '95% Adoption' },
          { phase: 'Milestone 4 (Q4)', heading: 'Quality Review & Governance', description: 'Auditing target KPIs and setting multi-year scale horizons.', owner: 'QA & Compliance', kpi: 'Sustained Expansion' }
        ],
        tg: [
          { phase: 'Марҳилаи 1 (Q1)', heading: 'Аудити аввалия ва тасдиқи нақша', description: 'Баҳисобгирии пурраи имкониятҳо ва муайян намудани масъулон.', owner: 'Шӯъбаи таҳлилӣ', kpi: '100% Аудит' },
          { phase: 'Марҳилаи 2 (Q2)', heading: 'Лоиҳаи озмоишӣ ва омӯзиш', description: 'Татбиқи таҷрибавии қарорҳо ва бозомӯзии кормандон.', owner: 'Гурӯҳи корӣ', kpi: '+35% Маҳсулнокӣ' },
          { phase: 'Марҳилаи 3 (Q3)', heading: 'Татбиқи пурраи миқёсӣ', description: 'Ҷорисозии стандартҳо дар тамоми сохторҳо.', owner: 'Роҳбарияти лоиҳа', kpi: '95% Фарогирӣ' },
          { phase: 'Марҳилаи 4 (Q4)', heading: 'Ҷамъбаст ва назорати сифат', description: 'Арзёбии дастовардҳо ва муайян кардани нақшаҳои нав.', owner: 'Хадамоти сифат', kpi: 'Рушди устувор' }
        ]
      };
      base.points = mtPoints[lang] || mtPoints.uz;
      base.highlight = `Aniq belgilangan marralar va mas'ullar har bir vazifaning sifatli ijrosini kafolatlaydi.`;
      base.speakerNotes = `Ushbu matritsada barcha ijrochilar, muddatlar va KPI mezonlari aks ettirilgan.`;
      return base;
    }

    if (base.layoutType === 'spotlight') {
      const spText = {
        uz: `Eng katta muvaffaqiyat — bu muammolar paydo bo'lmasidan oldin ularning oldini oluvchi mustahkam profilaktik tizimdir.`,
        ru: `Главный признак зрелой системы — способность предотвращать риски задолго до их проявления.`,
        en: `True resilience is measured not by how we react to crises, but by the proactive governance that prevents them.`,
        tg: `Муваффақияти асосӣ — ин низоми пешгирикунандаест, ки хатарҳоро қабл аз сар задан бартараф месозад.`
      };
      base.spotlightText = spText[lang] || spText.uz;

      const spPoints = {
        uz: [
          { heading: 'Xatarlarni erta aniqlash', description: `Yuzaga kelishi mumkin bo'lgan to'siqlar oldindan aniqlanib, profilaktik choralar ko'riladi.` },
          { heading: 'Uzluksiz barqarorlik kafolati', description: `Zaxira choralari har qanday sharoitda ham ishonchli faoliyatni saqlab qoladi.` }
        ],
        ru: [
          { heading: 'Раннее выявление рисков', description: `Превентивный мониторинг потенциальных угроз и мгновенное реагирование.` },
          { heading: 'Гарантия непрерывности', description: `Резервные протоколы обеспечивают стабильность процессов в любых условиях.` }
        ],
        en: [
          { heading: 'Proactive Threat Mitigation', description: `Early signals detection and immediate containment of operational risks.` },
          { heading: 'Business Continuity Guarantee', description: `Redundant fail-safes ensuring zero disruption under varying conditions.` }
        ],
        tg: [
          { heading: 'Муайянкунии барвақтии хатарҳо', description: `Ташхиси пешакии монеаҳо ва андешидани тадбирҳои таъҷилӣ.` },
          { heading: 'Кафолати фаъолияти бефосила', description: `Нақшаҳои эҳтиётӣ устувории корро дар ҳама гуна вазъ таъмин мекунанд.` }
        ]
      };
      base.points = spPoints[lang] || spPoints.uz;
      base.highlight = `Tizimli profilaktika operatsion xatarlarni 75% ga kamaytiradi.`;
      base.speakerNotes = `Spotlight bloki eng muhim e'tibor qaratilishi zarur bo'lgan xulosani namoyon etadi.`;
      return base;
    }

    if (base.layoutType === 'matrix_grid') {
      base.points = [
        { heading: (lang === 'ru') ? '1. Нормативный базис' : (lang === 'en') ? '1. Regulatory Baseline' : (lang === 'tg') ? '1. Пояи меъёрӣ' : '1. Me\'yoriy-huquqiy baza', description: (lang === 'ru') ? `Регламентация стандартов и нормативных требований по направлению "${topic}".` : (lang === 'en') ? `Establishing rigorous governance and compliance standards for "${topic}".` : (lang === 'tg') ? `Муайян намудани стандартҳо ва меъёрҳои қонунӣ дар мавзӯи "${topic}".` : `"${topic}" bo'yicha me'yoriy talablar va qat'iy standartlarni joriy etish.` },
        { heading: (lang === 'ru') ? '2. Аналитический контур' : (lang === 'en') ? '2. Analytical Framework' : (lang === 'tg') ? '2. Доираи таҳлилӣ' : '2. Tahliliy monitoring tizimi', description: (lang === 'ru') ? `Непрерывный сбор эмпирических данных и прогнозное моделирование ключевых рисков.` : (lang === 'en') ? `Continuous empirical data collection and forward-looking risk modeling.` : (lang === 'tg') ? 'Ҷамъоварии маълумот ва моделсозии хатарҳои эҳтимолӣ.' : 'Empirik ma\'lumotlar yig\'ish va yuzaga kelishi mumkin bo\'lgan xatarlarni modellashtirish.' },
        { heading: (lang === 'ru') ? '3. Технологический драйвер' : (lang === 'en') ? '3. Technological Tooling' : (lang === 'tg') ? '3. Фишанги технологӣ' : '3. Ilg\'or texnologik vositalar', description: (lang === 'ru') ? `Автоматизация рутинных операций и внедрение высокоэффективных цифровых инструментов.` : (lang === 'en') ? `Automating operational pipelines and deploying high-throughput toolchains.` : (lang === 'tg') ? 'Автоматӣ кардани равандҳо ва ҷорӣ кардани воситаҳои рақамӣ.' : 'Jarayonlarni avtomatlashtirish va yuqori unumli zamonaviy instrumentlarni qo\'llash.' },
        { heading: (lang === 'ru') ? '4. Контроль результативности' : (lang === 'en') ? '4. Performance Governance' : (lang === 'tg') ? '4. Назорати натиҷаҳо' : '4. Sifat va natijadorlik auditi', description: (lang === 'ru') ? `Многоступенчатая верификация контрольных показателей и институциональный аудит.` : (lang === 'en') ? `Multi-tier verification of milestone deliverables and continuous governance audit.` : (lang === 'tg') ? 'Арзёбии бисёрзинагии нишондиҳандаҳо ва санҷиши сифат.' : 'Bosqichma-bosqich nazorat mexanizmlari va muntazam sifat tekshiruvi.' }
      ];
      base.highlight = (lang === 'ru') ? 'Матричная структура исключает пробелы в управлении и гарантирует синергию.' : (lang === 'en') ? 'The four-tier matrix eliminates operational silos and guarantees systemic alignment.' : (lang === 'tg') ? 'Сохтори матритсавӣ камбудиҳоро бартараф карда, ҳамоҳангиро таъмин мекунад.' : 'Matritsaviy tuzilma tizimdagi uzilishlarning oldini oladi va o\'zaro uyg\'unlikni ta\'minlaydi.';
      base.speakerNotes = 'Matritsaning to\'rtta o\'lchovi barqaror rivojlanishning mustahkam karkasini tashkil etadi.';
      return base;
    }

    if (base.layoutType === 'data_chart') {
      base.chart = {
        labels: (lang === 'ru') ? ['База', 'Оптимизация', 'Пилот', 'Масштаб'] : (lang === 'en') ? ['Baseline', 'Optimized', 'Piloted', 'Scaled'] : (lang === 'tg') ? ['Асос', 'Танзим', 'Озмоиш', 'Миқёс'] : ['Boshlang\'ich', 'Optimizatsiya', 'Pilot natija', 'To\'liq miqyos'],
        values: [28, 52, 79, 96]
      };
      base.points = [
        { heading: (lang === 'ru') ? 'Позитивная динамика внедрения' : (lang === 'en') ? 'Measurable Progress Velocity' : (lang === 'tg') ? 'Рушди мусбати нишондиҳандаҳо' : 'Izchil o\'sish va samaradorlik sur\'ati', description: (lang === 'ru') ? `Эмпирический график подтверждает стабильное увеличение показателей на каждом этапе реализации стратегии по теме "${topic}".` : (lang === 'en') ? `Quantitative trendlines confirm consistent metric acceleration across every milestone phase for "${topic}".` : (lang === 'tg') ? `Диаграмма нишон медиҳад, ки дар ҳар як марҳила нишондиҳандаҳои "${topic}" боло мераванд.` : `Diagramma "${topic}" bo'yicha belgilangan har bir bosqichda ko'rsatkichlarning barqaror o'sish dinamikasini tasdiqlaydi.` },
        { heading: (lang === 'ru') ? 'Прогнозируемый целевой результат' : (lang === 'en') ? 'Target Achievement Confidence' : (lang === 'tg') ? 'Натиҷаи пешбинишуда' : 'Kutilayotgan marraga erishish kafolati', description: (lang === 'ru') ? `Статистическая модель гарантирует выход на запланированные параметры качества с минимальным отклонением.` : (lang === 'en') ? `Statistical modeling indicates robust trajectory integrity toward long-term benchmarks with minimal variance.` : (lang === 'tg') ? 'Модели оморӣ ноил шудан ба ҳадафҳои асосиро бо камтарин хатогӣ таъмин менамояд.' : 'Statistik tahlillar belgilangan strategik natijalarga to\'liq va o\'z vaqtida erishilishini ko\'rsatadi.' }
      ];
      base.highlight = (lang === 'ru') ? 'Статистический тренд подтверждает правильность выбранного курса.' : (lang === 'en') ? 'Empirical trendlines conclusively validate strategic trajectory.' : (lang === 'tg') ? 'Тамоюли оморӣ дурустии роҳи интихобшударо собит месозад.' : 'Statistik o\'sish sur\'atlari tanlangan strategik yo\'nalish to\'g\'ri ekanligini isbotlaydi.';
      base.speakerNotes = 'Ushbu diagrammada jarayonlar samaradorligining bosqichma-bosqich o\'sish dinamikasi yaqqol tasvirlangan.';
      return base;
    }

    if (base.layoutType === 'problem_solution') {
      base.problems = [
        (lang === 'ru') ? 'Устаревшие фрагментированные методы приводят к перерасходу ресурсов до 40%.' : (lang === 'en') ? 'Legacy siloed practices cause up to 40% structural overhead friction.' : (lang === 'tg') ? 'Усулҳои куҳна боиси то 40% исрофи беҳудаи захираҳо мегарданд.' : 'Eski tarqoq yondashuvlar sababli resurslarning 40% gacha qismi samarasiz sarflanmoqda.',
        (lang === 'ru') ? 'Отсутствие сквозных стандартов увеличивает операционные риски и сбои.' : (lang === 'en') ? 'Absence of unified protocols amplifies vulnerability and operational failure.' : (lang === 'tg') ? 'Набудани стандартҳои ягона хатарҳои амалиётиро афзун менамояд.' : 'Yagona standartlarning yo\'qligi tizimli xatolar va kechikishlar ehtimolini oshiradi.'
      ];
      base.solutions = [
        (lang === 'ru') ? `Внедрение единого регламентированного контура по теме "${topic}".` : (lang === 'en') ? `Deploying an integrated standardized architecture for "${topic}".` : (lang === 'tg') ? `Татбиқи низоми ягонаи стандартӣ дар мавзӯи "${topic}".` : `"${topic}" yo'nalishida yagona integratsiyalashgan boshqaruv tizimini joriy etish.`,
        (lang === 'ru') ? 'Автоматизированный мониторинг качества и превентивный контроль рисков.' : (lang === 'en') ? 'Automated telemetry validation and proactive friction containment.' : (lang === 'tg') ? 'Назорати автоматии сифат ва пешгирии саривақтии хатарҳо.' : 'Avtomatlashtirilgan sifat nazorati va xatarlarni erta bartaraf etish mexanizmlari.'
      ];
      base.points = [
        { heading: (lang === 'ru') ? 'Системный разрыв vs. Новое решение' : (lang === 'en') ? 'Systemic Friction vs. Resolution' : (lang === 'tg') ? 'Мушкилоти ҷорӣ ва роҳи ҳал' : 'Tizimli to\'siqlar va ularning innovatsion yechimi', description: (lang === 'ru') ? `Переход от разрозненных действий к интегрированным решениям снимает ключевые барьеры развития.` : (lang === 'en') ? `Transitioning from ad-hoc patches to unified solutions dissolves legacy friction points.` : (lang === 'tg') ? 'Гузариш ба усулҳои муосир монеаҳои асосиро бартараф мекунад.' : 'Tarqoq harakatlardan integratsiyalashgan yechimga o\'tish asosiy operatsion to\'siqlarni butunlay yo\'q qiladi.' }
      ];
      base.highlight = (lang === 'ru') ? 'Каждая проблема устраняется выверенным институциональным решением.' : (lang === 'en') ? 'Every structural vulnerability is directly answered with an institutional safeguard.' : (lang === 'tg') ? 'Ҳар як мушкил роҳи ҳалли мушаххаси худро дорад.' : 'Har bir aniqlangan tizimli muammo aniq va samarali mexanizm orqali bartaraf etiladi.';
      base.speakerNotes = 'Muammo va yechimlar tahlili loyihaning amaliy qiymatini asoslab beradi.';
      return base;
    }

    if (base.layoutType === 'swot_analysis') {
      base.swot = {
        strengths: [(lang === 'ru') ? 'Высокая технологичность и адаптивность' : (lang === 'en') ? 'Operational flexibility and architecture' : (lang === 'tg') ? 'Мутобиқшавии баланд ва сифат' : 'Yuqori texnologik moslashuvchanlik va standartlar', (lang === 'ru') ? 'Опытный экспертный потенциал' : (lang === 'en') ? 'Strong multidisciplinary expertise' : (lang === 'tg') ? 'Мутахассисони ботаҷриба' : 'Tajribali kadrlar va kuchli ilmiy baza'],
        weaknesses: [(lang === 'ru') ? 'Необходимость первоначальных инвестиций' : (lang === 'en') ? 'Initial capital deployment requirements' : (lang === 'tg') ? 'Ниёз ба сармоягузории аввалия' : 'Dastlabki resurslar va o\'tish davri xarajatlari', (lang === 'ru') ? 'Потребность в переподготовке персонала' : (lang === 'en') ? 'Required workforce upskilling cadence' : (lang === 'tg') ? 'Зарурати бозомӯзии кормандон' : 'Xodimlarni yangi tartibga moslashtirish vaqti'],
        opportunities: [(lang === 'ru') ? 'Выход на лидерские отраслевые позиции' : (lang === 'en') ? 'Capturing category leadership advantage' : (lang === 'tg') ? 'Баромадан ба мавқеи пешсафӣ' : 'Sohada yetakchi mavqega chiqish va barqaror o\'sish', (lang === 'ru') ? 'Масштабирование лучших практик' : (lang === 'en') ? 'Scaling proven methodologies across divisions' : (lang === 'tg') ? 'Паҳн кардани таҷрибаи пешқадам' : 'Ilg\'or amaliyotlarni keng masshtabda qo\'llash'],
        threats: [(lang === 'ru') ? 'Макроэкономическая волатильность' : (lang === 'en') ? 'Macroeconomic turbulence and friction' : (lang === 'tg') ? 'Ноустувории иқтисодӣ' : 'Tashqi bozor va iqtisodiy tebranishlar', (lang === 'ru') ? 'Регуляторные изменения' : (lang === 'en') ? 'Rapidly shifting regulatory policy' : (lang === 'tg') ? 'Тағйироти қонунгузорӣ' : 'Me\'yoriy talablarning kutilmagan o\'zgarishi']
      };
      base.points = [
        { heading: 'S - Kuchli Tomonlar', description: base.swot.strengths.join('; ') },
        { heading: 'W - Zaif Jihatlar', description: base.swot.weaknesses.join('; ') },
        { heading: 'O - Yangi Imkoniyatlar', description: base.swot.opportunities.join('; ') },
        { heading: 'T - Ehtimoliy Xatarlar', description: base.swot.threats.join('; ') }
      ];
      base.highlight = (lang === 'ru') ? 'SWOT-матрица формирует сбалансированную дорожную карту действий.' : (lang === 'en') ? 'Balanced SWOT intelligence informs resilient strategic navigation.' : (lang === 'tg') ? 'Таҳлили SWOT заминаи қабули қарорҳои дурустро фароҳам меорад.' : 'SWOT tahlili kuchli tomonlarni kuchaytirib, zaifliklarni bartaraf etish strategiyasini belgilaydi.';
      base.speakerNotes = 'SWOT matritsasi strategik qarorlar qabul qilish uchun to\'liq muvozanatli tahlilni beradi.';
      return base;
    }

    if (base.layoutType === 'pyramid_hierarchy') {
      base.points = [
        { heading: (lang === 'ru') ? 'Вершина: Стратегическая цель' : (lang === 'en') ? 'Peak: Strategic Vision' : (lang === 'tg') ? 'Қулла: Ҳадафи стратегӣ' : 'Cho\'qqi: Strategik maqsad va natija', description: (lang === 'ru') ? `Достижение устойчивого отраслевого лидерства и максимальной эффективности по теме "${topic}".` : (lang === 'en') ? `Achieving sustained institutional benchmark excellence and leadership in "${topic}".` : (lang === 'tg') ? `Расидан ба ҳадафҳои асосӣ ва рушди устувор дар мавзӯи "${topic}".` : `"${topic}" bo'yicha barqaror yetakchilik va yuqori samaradorlikka erishish.` },
        { heading: (lang === 'ru') ? 'Средний ярус: Операционный контур' : (lang === 'en') ? 'Middle: Operational Engine' : (lang === 'tg') ? 'Сатҳи миёна: Иҷрои амалиётӣ' : 'O\'rta qatlam: Boshqaruv va mexanizmlar', description: (lang === 'ru') ? 'Интегрированные процессы, регламенты качества и постоянное обучение специалистов.' : (lang === 'en') ? 'Integrated workflow execution, continuous quality audits, and personnel upskilling.' : (lang === 'tg') ? 'Равандҳои ҳамоҳангшуда, назорати сифат ва бозомӯзии мутахассисон.' : 'Tizimli jarayonlar, sifat standartlari va xodimlarning doimiy malakasini oshirish.' },
        { heading: (lang === 'ru') ? 'Базис: Фундаментальная основа' : (lang === 'en') ? 'Base: Foundational Backbone' : (lang === 'tg') ? 'Поя: Пойдевори асосӣ' : 'Baza: Fundamental poydevor va mezonlar', description: (lang === 'ru') ? 'Нормативная база, технологическая инфраструктура и надежная ресурсная база.' : (lang === 'en') ? 'Governance baseline, state-of-the-art infrastructure, and secured resource capacity.' : (lang === 'tg') ? 'Заминаи қонунӣ, инфрасохтори техникӣ ва захираҳои боэътимод.' : 'Ilmiy-metodologik asos, texnologik infratuzilma va moddiy-moliyaviy ta\'minot.' }
      ];
      base.highlight = (lang === 'ru') ? 'Прочный фундамент определяет устойчивость всей архитектуры.' : (lang === 'en') ? 'Foundational architectural depth determines summit resilience.' : (lang === 'tg') ? 'Пойдевори мустаҳкам устувории тамоми сохторро таъмин месозад.' : 'Mustahkam poydevor barcha yuqori bo\'g\'inlarning ishonchli ishlash kafolatidir.';
      base.speakerNotes = 'Ierarxik piramida uchta asosiy sathning o\'zaro bo\'ysunuvchanligini ko\'rsatadi.';
      return base;
    }

    if (base.layoutType === 'matrix_rating') {
      base.tableRows = [
        { criteria: (lang === 'ru') ? 'Скорость и оперативность' : (lang === 'en') ? 'Velocity & Turnaround' : (lang === 'tg') ? 'Суръати амалиёт' : 'Operatsion tezlik va moslashuv', weight: '30%', baseline: '62%', target: '94%', verdict: 'A+' },
        { criteria: (lang === 'ru') ? 'Качество и стандарты' : (lang === 'en') ? 'Quality Compliance' : (lang === 'tg') ? 'Сифат ва стандартҳо' : 'Standartlarga muvofiqlik darajasi', weight: '25%', baseline: '70%', target: '98%', verdict: 'A+' },
        { criteria: (lang === 'ru') ? 'Ресурсная эффективность' : (lang === 'en') ? 'Resource Optimization' : (lang === 'tg') ? 'Сарфакории захираҳо' : 'Resurslar tejamkorligi va ROI', weight: '25%', baseline: '55%', target: '88%', verdict: 'A' },
        { criteria: (lang === 'ru') ? 'Отказоустойчивость' : (lang === 'en') ? 'Fault Resilience' : (lang === 'tg') ? 'Устувории низом' : 'Tizim barqarorligi va xavfsizlik', weight: '20%', baseline: '74%', target: '99%', verdict: 'A+' }
      ];
      base.points = base.tableRows.map(r => ({ heading: r.criteria, description: `${r.baseline} bazadan ${r.target} maqsadli ko'rsatkichga erishish (Bahosi: ${r.verdict})` }));
      base.highlight = (lang === 'ru') ? 'Комплексный рейтинг подтверждает соответствие международным стандартам.' : (lang === 'en') ? 'Composite evaluation confirms strict alignment with premier standards.' : (lang === 'tg') ? 'Баҳодиҳии ҳамаҷониба мутобиқатро ба стандартҳо тасдиқ мекунад.' : 'Baholash reytingi barcha yo\'nalishlar bo\'yicha yuqori mezonlarga erishilganini ko\'rsatadi.';
      base.speakerNotes = 'Reyting matritsasi asosiy parametrlar bo\'yicha aniq empirik baholarni taqdim etadi.';
      return base;
    }

    if (base.layoutType === 'scenario_matrix') {
      base.scenarios = [
        { name: (lang === 'ru') ? 'Консервативный' : (lang === 'en') ? 'Conservative' : (lang === 'tg') ? 'Эҳтиёткорона' : 'Konservativ Ssenariy', growth: '+15-20%', risk: (lang === 'ru') ? 'Минимальный' : (lang === 'en') ? 'Low' : (lang === 'tg') ? 'Ҳадди ақал' : 'Minimal', desc: (lang === 'ru') ? 'Поэтапное улучшение существующих процессов без масштабных капиталовложений.' : (lang === 'en') ? 'Incremental optimization of legacy processes with restrained capital outlay.' : (lang === 'tg') ? 'Бе сармоягузории калон беҳтар кардани равандҳои ҷорӣ.' : 'Katta xarajatlarsiz mavjud jarayonlarni bosqichma-bosqich takomillashtirish.' },
        { name: (lang === 'ru') ? 'Базовый (Оптимальный)' : (lang === 'en') ? 'Baseline (Target)' : (lang === 'tg') ? 'Асосӣ (Оптималӣ)' : 'Bazaviy (Maqsadli) Ssenariy', growth: '+35-50%', risk: (lang === 'ru') ? 'Контролируемый' : (lang === 'en') ? 'Managed' : (lang === 'tg') ? 'Идорашаванда' : 'Nazorat ostidagi', desc: (lang === 'ru') ? 'Комплексное внедрение цифровых инструментов и структурная оптимизация.' : (lang === 'en') ? 'Full deployment of digital toolchains coupled with workflow restructuring.' : (lang === 'tg') ? 'Ҷорисозии пурраи усулҳои нав ва сохтори мукаммал.' : 'Ilg\'or standartlarni to\'liq joriy etish va tizimli optimallashtirish.' },
        { name: (lang === 'ru') ? 'Прогрессивный' : (lang === 'en') ? 'Accelerated Vision' : (lang === 'tg') ? 'Пешқадам' : 'Progressiv Ssenariy', growth: '+75-90%', risk: (lang === 'ru') ? 'Умеренный' : (lang === 'en') ? 'Calculated' : (lang === 'tg') ? 'Муътадил' : 'Hisoblangan', desc: (lang === 'ru') ? 'Радикальная трансформация, лидерство в отрасли и масштабное тиражирование.' : (lang === 'en') ? 'Transformative innovation capturing unquestioned category leadership.' : (lang === 'tg') ? 'Дигаргунсозии куллӣ ва расидан ба қуллаҳои баланд.' : 'Keng qamrovli transformatsiya va sohada mutlaq yetakchilikka erishish.' }
      ];
      base.points = base.scenarios.map(s => ({ heading: `${s.name}: ${s.growth}`, description: `${s.desc} (Xatarlar darajasi: ${s.risk})` }));
      base.highlight = (lang === 'ru') ? 'Базовый сценарный вектор обеспечивает оптимальный баланс роста и рисков.' : (lang === 'en') ? 'The baseline trajectory balances aggressive expansion with disciplined safeguards.' : (lang === 'tg') ? 'Сенарияи асосӣ мувозинати комили рушдро таъмин менамояд.' : 'Bazaviy ssenariy eng maqbul samaradorlik va xavfsizlik muvozanatini kafolatlaydi.';
      base.speakerNotes = 'Ssenariylar tahlili har qanday vaziyatga moslashish imkonini beradi.';
      return base;
    }

    if (base.layoutType === 'team_stakeholders') {
      base.stakeholders = [
        { role: (lang === 'ru') ? 'Стратегическое руководство' : (lang === 'en') ? 'Steering Executive' : (lang === 'tg') ? 'Роҳбарияти стратегӣ' : 'Strategik Boshqaruv', resp: (lang === 'ru') ? 'Определение приоритетов, утверждение бюджетов и контроль KPI' : (lang === 'en') ? 'Priority ratification, capital allocation, executive KPI governance' : (lang === 'tg') ? 'Муайян кардани самтҳо ва назорати умумӣ' : 'Maqsadlarni belgilash, resurslar ajratish va umumiy monitoring' },
        { role: (lang === 'ru') ? 'Экспертная группа' : (lang === 'en') ? 'Technical Advisory Squad' : (lang === 'tg') ? 'Гурӯҳи коршиносон' : 'Tahliliy Ekspertlar Guruhi', resp: (lang === 'ru') ? 'Методология, аудит качества и внедрение лучших практик' : (lang === 'en') ? 'Methodological design, rigorous QA, and standard enforcement' : (lang === 'tg') ? 'Тарҳрезии методӣ ва назорати сифат' : 'Metodologik nazorat, ilmiy tahlil va sifat kafolati' },
        { role: (lang === 'ru') ? 'Операционные исполнители' : (lang === 'en') ? 'Delivery Operations' : (lang === 'tg') ? 'Гурӯҳи иҷроия' : 'Amaliy Ijrochilar', resp: (lang === 'ru') ? 'Непосредственная реализация задач и обратная связь с полей' : (lang === 'en') ? 'Day-to-day milestone fulfillment and empirical field feedback' : (lang === 'tg') ? 'Иҷрои бевоситаи вазифаҳо дар амал' : 'Vazifalarning bevosita ijrosi va amaliy natijalarni ta\'minlash' }
      ];
      base.points = base.stakeholders.map(st => ({ heading: st.role, description: st.resp }));
      base.highlight = (lang === 'ru') ? 'Четкое разделение ответственности гарантирует бесперебойную реализацию.' : (lang === 'en') ? 'Transparent delegation protocols secure uncompromised operational velocity.' : (lang === 'tg') ? 'Тақсимоти дақиқи масъулият кори босифатро кафолат медиҳад.' : 'Vazifalar va javobgarlikning aniq taqsimlanishi tizim muvaffaqiyatini belgilaydi.';
      base.speakerNotes = 'Ushbu slaydda barcha asosiy ishtirokchilar va ularning javobgarlik doirasi belgilangan.';
      return base;
    }

    if (base.layoutType === 'profile_card') {
      base.passport = [
        { label: (lang === 'ru') ? 'Тип решения' : (lang === 'en') ? 'System Class' : (lang === 'tg') ? 'Навъи қарор' : 'Tizim Toifasi', val: (lang === 'ru') ? 'Интегрированный' : (lang === 'en') ? 'Integrated Tier-1' : (lang === 'tg') ? 'Ҳамаҷониба' : 'Kompleks Tizim' },
        { label: (lang === 'ru') ? 'Охват' : (lang === 'en') ? 'Coverage' : (lang === 'tg') ? 'Фарогирӣ' : 'Qamrov Doirasi', val: (lang === 'ru') ? 'Отраслевой' : (lang === 'en') ? 'Enterprise Scale' : (lang === 'tg') ? 'Сарфароз' : 'Sohaviy Keng Miqyos' },
        { label: (lang === 'ru') ? 'Зрелость' : (lang === 'en') ? 'Maturity' : (lang === 'tg') ? 'Сатҳи рушд' : 'Tayyorgarlik', val: (lang === 'ru') ? 'Высокая (TRL-8)' : (lang === 'en') ? 'Production Ready' : (lang === 'tg') ? 'Омодагии пурра' : 'Amaliyotga Tayyor' },
        { label: (lang === 'ru') ? 'Стандарт' : (lang === 'en') ? 'Standard' : (lang === 'tg') ? 'Стандарт' : 'Sifat Standarti', val: 'ISO / Xalqaro' }
      ];
      base.pros = [
        (lang === 'ru') ? 'Высокая скорость обработки и полная отказоустойчивость.' : (lang === 'en') ? 'Superior throughput throughput and complete system resilience.' : (lang === 'tg') ? 'Суръати баланд ва устувории комил.' : 'Yuqori operatsion tezlik va to\'liq barqarorlik kafolati.',
        (lang === 'ru') ? 'Масштабируемая модульная архитектура и прозрачный аудит.' : (lang === 'en') ? 'Modular composability enabling straightforward scaling.' : (lang === 'tg') ? 'Сохтори модулӣ ва шаффофияти кор.' : 'Modulli masshtablanuvchan arxitektura va shaffof monitoring.'
      ];
      base.cons = [
        (lang === 'ru') ? 'Необходимость адаптации персонала и первичного тренинга.' : (lang === 'en') ? 'Requires disciplined personnel training during initial phase.' : (lang === 'tg') ? 'Зарурати омӯзиши аввалияи кормандон.' : 'Xodimlarni dastlabki bosqichda tizimli o\'qitish zarurati.',
        (lang === 'ru') ? 'Регулярная калибровка параметров качества.' : (lang === 'en') ? 'Periodic calibration required to preserve peak throughput.' : (lang === 'tg') ? 'Танзими мунтазами нишондиҳандаҳо.' : 'Mezonlarni doimiy ravishda kalibratsiya qilib borish talabi.'
      ];
      base.targetUse = (lang === 'ru') ? 'Профессиональные организации, научные центры и масштабные институты.' : (lang === 'en') ? 'Enterprise corporate divisions, research centers, and public institutions.' : (lang === 'tg') ? 'Муассисаҳои давлатӣ, илмӣ ва марказҳои таҳлилӣ.' : 'Sohaviy korxonalar, ilmiy markazlar va davlat boshqaruvi institutlari.';
      base.points = [
        ...base.pros.map(p => ({ heading: 'Afzallik', description: p })),
        ...base.cons.map(c => ({ heading: 'Cheklov', description: c }))
      ];
      base.highlight = (lang === 'ru') ? 'Профиль решения подтверждает его высокую конкурентоспособность.' : (lang === 'en') ? 'Architecture datasheet confirms substantial institutional competitive moats.' : (lang === 'tg') ? 'Тавсифи қарор рақобатпазирии баланди онро собит месозад.' : 'Tizim pasporti uning amaliy jihatdan puxta va raqobatbardosh ekanini tasdiqlaydi.';
      base.speakerNotes = 'Tizim pasporti kuchli va zaif tomonlar tahlilini yaxlit shaklda ifodalaydi.';
      return base;
    }

    if (base.layoutType === 'quote_editorial') {
      base.spotlightText = (lang === 'ru')
        ? `«Успех сложных систем определяется не громкими заявлениями, а дисциплиной исполнения базовых стандартов на каждом этапе».`
        : (lang === 'en')
        ? `“Sustainable excellence is never accidental; it is the compounding output of disciplined standards applied daily.”`
        : (lang === 'tg')
        ? `«Муваффақият на аз шиорҳои баланд, балки аз риояи пайгиронаи стандартҳо дар ҳар як марҳила вобаста аст».`
        : `«Haqiqiy muvaffaqiyat balandparvoz so'zlarda emas, balki har bir bosqichda belgilangan standartlarga qat'iy intizom bilan amal qilishda namoyon bo'ladi».`;
      base.points = [
        { heading: (lang === 'ru') ? 'Институциональный консенсус' : (lang === 'en') ? 'Institutional Consensus' : (lang === 'tg') ? 'Ҳамдигарфаҳмии илмӣ' : 'Ilmiy va amaliy hamfikrlik', description: (lang === 'ru') ? `Ведущие эксперты сходятся во мнении, что системный подход по теме "${topic}" безальтернативен.` : (lang === 'en') ? `Global industry authorities agree that an integrated roadmap for "${topic}" is strictly necessary.` : (lang === 'tg') ? `Коршиносони пешқадам равиши низоммандро дар мавзӯи "${topic}" муҳимтарин омил мешуморанд.` : `Yetakchi ekspertlar "${topic}" yo'nalishida kompleks yondashuv yagona to'g'ri strategiya ekanligini ta'kidlaydilar.` },
        { heading: (lang === 'ru') ? 'Практический ориентир' : (lang === 'en') ? 'Operational Principle' : (lang === 'tg') ? 'Роҳнамои амалӣ' : 'Uzoq muddatli amaliy yo\'nalish', description: (lang === 'ru') ? 'Ориентация на проверяемые факты и прозрачные метрики исключает стратегические ошибки.' : (lang === 'en') ? 'Anchoring execution in verifiable facts and transparent KPIs eliminates costly missteps.' : (lang === 'tg') ? 'Такя ба далелҳои дақиқ ва ченакҳои шаффоф аз хатогиҳои стратегӣ пешгирӣ мекунад.' : 'Aniq faktlar va shaffof ko\'rsatkichlarga tayanish tizimni har qanday xatoliklardan himoya qiladi.' }
      ];
      base.highlight = (lang === 'ru') ? 'Авторитетная экспертиза подтверждает фундаментальную правильность концепции.' : (lang === 'en') ? 'Institutional verdict provides definitive validation for our framework.' : (lang === 'tg') ? 'Хулосаи коршиносон дурустии консепсияро собит менамояд.' : 'Xalqaro ilmiy xulosa konseptual asoslarning to\'liq to\'g\'ri ekanligini yana bir bor tasdiqlaydi.';
      base.speakerNotes = 'Ushbu slaydda yetakchi xalqaro ekspertlarning tahliliy xulosasi keltirilgan.';
      return base;
    }

    if (base.layoutType === 'horizontal_flowchart') {
      base.flowSteps = [
        { step: '01', title: (lang === 'ru') ? 'Диагностика' : (lang === 'en') ? 'Audit' : (lang === 'tg') ? 'Ташхис' : 'Audit va Tahlil', desc: (lang === 'ru') ? 'Оценка исходного состояния' : (lang === 'en') ? 'Baseline capture' : (lang === 'tg') ? 'Арзёбии аввалия' : 'Mavjud holatni o\'rganish' },
        { step: '02', title: (lang === 'ru') ? 'Проектирование' : (lang === 'en') ? 'Design' : (lang === 'tg') ? 'Лоиҳакашӣ' : 'Loyihalash', desc: (lang === 'ru') ? 'Архитектурный каркас' : (lang === 'en') ? 'Architecture drafting' : (lang === 'tg') ? 'Тарҳрезии нақша' : 'Yangi tizim modeli' },
        { step: '03', title: (lang === 'ru') ? 'Интеграция' : (lang === 'en') ? 'Integrate' : (lang === 'tg') ? 'Татбиқ' : 'Tatbiq Etish', desc: (lang === 'ru') ? 'Пилотный запуск и тесты' : (lang === 'en') ? 'Controlled execution' : (lang === 'tg') ? 'Озмоиши амалӣ' : 'Amaliyotga kiritish' },
        { step: '04', title: (lang === 'ru') ? 'Верификация' : (lang === 'en') ? 'Verify' : (lang === 'tg') ? 'Санҷиш' : 'Sifat Auditi', desc: (lang === 'ru') ? 'Фиксация целевых KPI' : (lang === 'en') ? 'Target KPI signoff' : (lang === 'tg') ? 'Назорати натиҷаҳо' : 'Natijalarni baholash' }
      ];
      base.points = base.flowSteps.map(f => ({ heading: `${f.step}. ${f.title}`, description: f.desc }));
      base.highlight = (lang === 'ru') ? 'Последовательный сквозной поток исключает хаотичные решения.' : (lang === 'en') ? 'Disciplined end-to-end execution eliminates ad-hoc friction.' : (lang === 'tg') ? 'Ҷараёни муттасили кор бесарусомониро пешгирӣ мекунад.' : 'Bosqichma-bosqich jarayonlar zanjiri barcha harakatlarning mantiqiy va uzluksiz bo\'lishini ta\'minlaydi.';
      base.speakerNotes = 'To\'rt bosqichli gorizontal jarayonlar oqimi to\'liq siklni qamrab oladi.';
      return base;
    }

    if (base.layoutType === 'cinematic') {
      base.points = [
        { heading: (lang === 'ru') ? 'Стратегический горизонт будущего' : (lang === 'en') ? 'Long-Term Horizon' : (lang === 'tg') ? 'Дурнамои стратегии оянда' : 'Strategik ufq va kelajak marralari', description: (lang === 'ru') ? `Реализация стратегии по направлению "${topic}" формирует прочный задел для масштабирования на годы вперед.` : (lang === 'en') ? `Execution across "${topic}" establishes an impregnable foundation for sustained expansion.` : (lang === 'tg') ? `Татбиқи стратегия дар мавзӯи "${topic}" заминаи мустаҳкамро барои рушди оянда мегузорад.` : `"${topic}" bo'yicha belgilangan maqsadlarga erishish uzoq yillik barqaror o'sish poydevorini shakllantiradi.` },
        { heading: (lang === 'ru') ? 'Трансформация и институциональный рост' : (lang === 'en') ? 'Institutional Transformation' : (lang === 'tg') ? 'Дигаргунсозӣ ва рушди низомманд' : 'Tizimli transformatsiya va yetakchilik', description: (lang === 'ru') ? 'Синергия технологий, стандартов и команды выводит организацию на качественно новый уровень.' : (lang === 'en') ? 'Synergizing tooling, governance, and talent unlocks breakthrough operational performance.' : (lang === 'tg') ? 'Ҳамоҳангии технология ва кадрҳо низомро ба сатҳи комилан нав мебарорад.' : 'Texnologiyalar, qat\'iy standartlar va mutaxassislar sinergiyasi sohada sifat jihatidan mutlaqo yangi bosqichni ochib beradi.' }
      ];
      base.highlight = (lang === 'ru') ? 'Будущее принадлежит тем, кто инвестирует в системное качество уже сегодня.' : (lang === 'en') ? 'The competitive future belongs to those who institutionalize systemic quality today.' : (lang === 'tg') ? 'Оянда аз они онҳоест, ки ба сифати низомманд имрӯз сармоягузорӣ мекунанд.' : 'Kelajak bugun tizimli sifat va intellektual standartlarga sarmoya kiritayotganlarga tegishlidir.';
      base.speakerNotes = 'Ushbu slayd kelajak istiqbollari va global transformatsiya ko\'rinishini xulosalaydi.';
      return base;
    }

    if (base.layoutType === 'conclusion') {
      const concPoints = {
        uz: [
          { heading: 'Tizimli Yondashuv Samarasi', description: `"${topic}" bo'yicha taklif etilgan barcha choralar yuqori samaradorlik va barqarorlikni ta'minlaydi.` },
          { heading: 'Resurslarni To\'g\'ri Taqsimlash', description: `Moddiy va insoniy imkoniyatlarni asosiy drayverlarga yo'naltirish orqali yuqori iqtisodiy samara olinadi.` },
          { heading: 'Uzoq Muddatli Strategik Maqsad', description: `Muntazam monitoring va doimiy rivojlanish tizimni kelajakdagi o'zgarishlarga chidamli qiladi.` }
        ],
        ru: [
          { heading: 'Синергетический эффект', description: `Предложенный комплекс мер по теме "${topic}" обеспечивает качественный прорыв и надежность.` },
          { heading: 'Оптимальное распределение ресурсов', description: `Фокусировка капитала и команды на ключевых драйверах максимизирует отдачу.` },
          { heading: 'Долгосрочная перспектива', description: `Непрерывный мониторинг и адаптация гарантируют лидерство на годы вперед.` }
        ],
        en: [
          { heading: 'Synergistic Framework Impact', description: `Proposed initiatives across "${topic}" guarantee sustainable operational excellence.` },
          { heading: 'Strategic Resource Allocation', description: `Concentrating capital and talent on high-leverage drivers maximizes enterprise ROI.` },
          { heading: 'Long-Term Institutional Resilience', description: `Continuous adaptation and metric governance ensure durable competitive strength.` }
        ],
        tg: [
          { heading: 'Самараи равиши низомманд', description: `Тадбирҳои пешниҳодшуда дар мавзӯи "${topic}" маҳсулнокии баланд ва устувориро таъмин месозанд.` },
          { heading: 'Тақсимоти дурусти захираҳо', description: `Равона кардани имкониятҳо ба самтҳои асосӣ даромади баландро таъмин менамояд.` },
          { heading: 'Ҳадафи дарозмуддати стратегӣ', description: `Назорати доимӣ ва рушди пайваста соҳаро ба тағйирот устувор мегардонад.` }
        ]
      };
      base.points = concPoints[lang] || concPoints.uz;
      base.highlight = (lang === 'uz')
        ? `Aniq maqsad va izchil harakat yuqori marralarga erishishning mustahkam kalitidir.`
        : (lang === 'ru')
        ? `Четкая стратегия и последовательное исполнение — основа победы.`
        : (lang === 'en')
        ? `Clear strategic intent and relentless execution unlock lasting achievement.`
        : `Ҳадафи дақиқ ва амали пайгирона калиди муваффақият аст.`;

      const cNotes = {
        uz: `Hurmatli tinglovchilar! E'tiboringiz uchun katta rahmat, savollaringiz bo'lsa mamnuniyat bilan javob beraman.`,
        ru: `Уважаемые коллеги! Благодарю за внимание, буду рад ответить на ваши вопросы.`,
        en: `Thank you very much for your time and attention! I welcome any questions or discussion.`,
        tg: `Ҳозирини гиромӣ! Барои таваҷҷӯҳатон сипосгузорам, омодаам ба саволҳо посух диҳам.`
      };
      base.speakerNotes = cNotes[lang] || cNotes.uz;
      return base;
    }

    return base;
  });

  return {
    ...outline,
    organization: organization || outline.organization || '',
    slides
  };
}
