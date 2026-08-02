import React, { createContext, useContext, useState, useEffect } from 'react';

const LanguageContext = createContext();

const translations = {
  ar: {
    // Navbar
    'nav.home': 'الرئيسية',
    'nav.about': 'عن الهيئة',
    'nav.news': 'الأخبار',
    'nav.papers': 'ورقات العمل',
    'nav.map': 'الخريطة التفاعلية',
    'nav.contact': 'اتصل بنا',
    'nav.portal': 'بوابة الموظفين',
    'nav.dashboard': 'لوحة التحكم',
    'nav.logout': 'تسجيل الخروج',
    'nav.profile': 'الصفحة الشخصية',
    'nav.authority': 'الهيئة الوطنية للتخطيط العمراني',
    'nav.libya': 'الجمهورية الليبية',

    // Footer
    'footer.desc': 'بوابة إلكترونية موحدة للتواصل وإدارة المخططات العمرانية والوثائق الرسمية التابعة للهيئة.',
    'footer.quickLinks': 'روابط سريعة',
    'footer.contactUs': 'تواصل معنا',
    'footer.address': 'طرابلس، شارع بن عاشور، مبنى الهيئة الوطنية للتخطيط العمراني',
    'footer.phone': '+218 21 360 0090',
    'footer.email': 'info@upa.gov.ly',
    'footer.workHours': 'الأحد – الخميس: 8:00 ص – 3:00 م',
    'footer.rights': 'جميع الحقوق محفوظة للهيئة الوطنية للتخطيط العمراني',

    // Home Page
    'home.heroBadge': 'الجمهورية الليبية — جهة حكومية سيادية',
    'home.heroTitleHighlight': 'مستقبل ليبيا',
    'home.heroTitlePrefix': 'نبني ',
    'home.heroTitleSuffix': 'بتخطيط عمراني متكامل',
    'home.heroSubtitle': 'الهيئة الوطنية للتخطيط العمراني — الجهة الحكومية المسؤولة عن رسم وتنفيذ سياسات التخطيط العمراني وإعداد المخططات الحضرية والإقليمية لتحقيق تنمية مكانية متوازنة ومستدامة.',
    'home.exploreBtn': 'استعرض أحدث أعمالنا',
    'home.aboutBtn': 'تعرف على الهيئة',
    'home.floatCardPlans': 'مخططات حضرية',
    'home.floatCardBranches': 'فرع على الوطن',
    'home.servicesTag': 'اختصاصات ومهام الهيئة',
    'home.servicesTitle': 'ما نقدمه لليبيا',
    'home.servicesDesc': 'تضطلع الهيئة بمجموعة واسعة من المهام والاختصاصات التي تصب في خدمة التخطيط العمراني الوطني.',
    'home.aboutTag': 'نبذة عن الهيئة',
    'home.aboutTitle': 'الهيئة الوطنية للتخطيط العمراني',
    'home.aboutText1': 'أُنشئت الهيئة الوطنية للتخطيط العمراني لتكون الجهة التخطيطية العليا في ليبيا، تختص بإعداد المخططات العمرانية بكل مستوياتها: الوطنية، والإقليمية، والحضرية.',
    'home.aboutText2': 'تسعى الهيئة إلى تحقيق تنمية مكانية متوازنة من خلال وضع الأطر الاستراتيجية ورسم السياسات التي تحكم توزيع السكان والأنشطة والخدمات عبر التراب الليبي.',
    'home.aboutBtnMore': 'اقرأ المزيد عن الهيئة',
    'home.mediaTag': 'المركز الإعلامي',
    'home.mediaTitle': 'أحدث الأخبار والفعاليات',
    'home.mediaBtn': 'عرض جميع الأخبار',
    'home.readMore': 'اقرأ المزيد',
    'home.linksTag': 'خدمات وروابط مهمة',
    'home.linksTitle': 'وصول سريع للخدمات',

    // Services
    'services.service1.title': 'المخططات العمرانية',
    'services.service1.desc': 'إعداد وتحديث المخططات الحضرية والإقليمية بكافة مستوياتها.',
    'services.service2.title': 'التخطيط الإقليمي',
    'services.service2.desc': 'وضع الأطر الاستراتيجية للتوزيع الأمثل للسكان والأنشطة الاقتصادية.',
    'services.service3.title': 'اللوائح والتشريعات',
    'services.service3.desc': 'اقتراح وتطوير القوانين والتشريعات والمعايير المنظمة للبناء.',
    'services.service4.title': 'التنمية المستدامة',
    'services.service4.desc': 'تطبيق مبادئ ومعايير الاستدامة البيئية والاجتماعية في المخططات.',
    'services.service5.title': 'المرصد الحضري',
    'services.service5.desc': 'جمع وتحليل ورصد المؤشرات والبيانات الحضرية لدعم القرارات.',
    'services.service6.title': 'تقييم المشاريع',
    'services.service6.desc': 'مراجعة وتقييم المشاريع الحضرية للتحقق من انسجامها مع المخططات.',

    // Links
    'links.papers.title': 'الأوراق والوثائق',
    'links.papers.desc': 'تصفح الأوراق البحثية والدراسات والتقارير الصادرة عن الهيئة',
    'links.news.title': 'الأخبار والفعاليات',
    'links.news.desc': 'تابع آخر أخبار الهيئة وفعالياتها وأنشطتها الميدانية',
    'links.map.title': 'المخططات العمرانية',
    'links.map.desc': 'اطلع على المخططات الحضرية المعتمدة للمدن الليبية',

    // About
    'about.historyTag': 'نبذة تاريخية',
    'about.historyTitle': 'تاريخ الهيئة',
    'about.historyDesc': 'أُنشئت الهيئة الوطنية للتخطيط العمراني كجهة حكومية مستقلة تتولى الإشراف على التخطيط العمراني والإقليمي في ليبيا.',
    'about.missionTitle': 'رسالة الهيئة',
    'about.missionDesc': 'الإسهام في تحقيق التنمية المتوازنة والمستدامة للمجتمعات البشرية عبر إعداد وتطوير المخططات العمرانية.',
    'about.visionTitle': 'رؤية الهيئة',
    'about.visionDesc': 'أن تكون الهيئة مرجعاً إقليمياً رائداً في مجالات التخطيط العمراني والإقليمي.',
    'about.tasksTag': 'اختصاصات الهيئة',
    'about.tasksTitle': 'مهام واختصاصات الهيئة',
    'about.leadershipTag': 'القيادة',
    'about.leadershipTitle': 'قيادة الهيئة',
    'about.ctaTitle': 'انضم إلى فريق الهيئة',
    'about.ctaDesc': 'هل تريد المساهمة في بناء مستقبل التخطيط العمراني في ليبيا؟',
    'about.ctaBtn': 'سجّل في بوابة الموظفين',
    'about.chairman': 'المهندس / رئيس الهيئة',
    'about.viceChairman': 'المهندس / نائب الرئيس',
    'about.executive': 'الدكتور / المدير التنفيذي',
    'about.chairmanTitle': 'رئيس مجلس الإدارة',
    'about.viceChairmanTitle': 'نائب رئيس مجلس الإدارة',
    'about.executiveTitle': 'المدير التنفيذي',

    // Contact
    'contact.tag': 'التواصل',
    'contact.title': 'تواصل معنا',
    'contact.subtitle': 'نحن هنا للإجابة على استفساراتكم ومساعدتكم في أي وقت',
    'contact.info': 'معلومات التواصل',
    'contact.infoDesc': 'يسعدنا التواصل معكم والإجابة على استفساراتكم.',
    'contact.mapTitle': 'خريطة الموقع',
    'contact.mapCity': 'طرابلس، ليبيا',
    'contact.formTitle': 'أرسل لنا رسالة',
    'contact.formSubtitle': 'سيتم الرد على رسالتك خلال يومَي عمل',
    'contact.nameLabel': 'الاسم الكامل *',
    'contact.namePlaceholder': 'اسمك الكامل',
    'contact.emailLabel': 'البريد الإلكتروني *',
    'contact.emailPlaceholder': 'example@email.com',
    'contact.subjectLabel': 'الموضوع *',
    'contact.subjectPlaceholder': 'موضوع الرسالة',
    'contact.messageLabel': 'الرسالة *',
    'contact.messagePlaceholder': 'اكتب رسالتك هنا...',
    'contact.sendBtn': 'إرسال الرسالة',
    'contact.sending': 'جارٍ الإرسال...',
    'contact.success': 'تم إرسال رسالتك بنجاح! سنتواصل معك قريباً.',
    'contact.field.address': 'العنوان',
    'contact.field.phone': 'الهاتف',
    'contact.field.email': 'البريد الإلكتروني',
    'contact.field.workHours': 'ساعات العمل',

    // News
    'news.tag': 'المركز الإعلامي',
    'news.title': 'الأخبار والفعاليات',
    'news.subtitle': 'تابع آخر مستجدات الهيئة ونشاطاتها وتحديثات التخطيط العمراني',
    'news.searchPlaceholder': 'ابحث في الأخبار والفعاليات...',
    'news.filterAll': 'الكل',
    'news.empty': 'لا توجد أخبار تطابق بحثك حالياً.',
    'news.comments': 'التعليقات',
    'news.addComment': 'أضف تعليقاً',
    'news.commentPlaceholder': 'اكتب تعليقك هنا...',
    'news.commentBtn': 'إرسال التعليق',
    'news.author': 'بواسطة',

    // Papers
    'papers.tag': 'مكتبة الوثائق',
    'papers.title': 'الأوراق والوثائق',
    'papers.subtitle': 'الدراسات والتقارير والأوراق البحثية الصادرة عن الهيئة',
    'papers.searchPlaceholder': 'ابحث في الوثائق...',
    'papers.empty': 'لا توجد وثائق تطابق بحثك حالياً.',
    'papers.download': 'تحميل',

    // Map
    'map.tag': 'الخدمات التخطيطية الرقمية',
    'map.title': 'الخريطة التفاعلية للمخططات',
    'map.subtitle': 'استكشف المخططات العمرانية والمشاريع السكنية والمباني الخدمية',
    'map.filterTitle': 'تصفية المعالم',
    'map.searchPlaceholder': 'ابحث عن معلم أو مبنى...',
    'map.empty': 'لا توجد معالم تطابق بحثك',
    'map.coordinates': 'الإحداثيات',
    'map.floatingInfo': 'لا تتوفر تفاصيل إضافية لهذا المعلم.',

    'common.backToHome': 'العودة إلى الصفحة الرئيسية',

    // Balegh App
    'balegh.floatTitle': 'تطبيق بَلِّغ',
    'balegh.floatSub': 'قيد التطوير',
    'balegh.badge': 'قريباً',
    'balegh.officialBadge': 'تطبيق الهاتف الرسمي',
    'balegh.devBadge': 'قيد التطوير والاختبار',
    'balegh.title': 'تطبيق بَلِّغ للهاتف المحمول 📲',
    'balegh.titleSub': 'المنصة الرقمية الذكية لهيئة التخطيط العمراني',
    'balegh.subtitle': 'المنصة الرقمية الذكية للهواتف المحمولة التابعة لـ هيئة التخطيط العمراني لتقديم البلاغات العمرانية، تصفح المخططات التفاعلية، ومتابعة الطلبات بسهولة من هاتفك.',
    'balegh.backHome': 'العودة للرئيسية',
    'balegh.progress': 'نسبة الإنجاز',
    'balegh.progressDesc': 'يعمل فريق التطوير الفني في هيئة التخطيط العمراني على إكمال اختبارات الأمان والربط الفوري مع قاعدة البيانات قبل الإطلاق الرسمي.',
    'balegh.featuresTitle': 'مميزات تطبيق "بَلِّغ"',
    'balegh.feat1.title': 'البلاغات المكانية',
    'balegh.feat1.desc': 'إرسال البلاغات العمرانية مرفقة بالصور والموقع الجغرافي الدقيق.',
    'balegh.feat2.title': 'الخرائط والمخططات',
    'balegh.feat2.desc': 'تصفح المخططات الهيكلية والأقاليم المعتمدة من هاتفك.',
    'balegh.feat3.title': 'الإشعارات الفورية',
    'balegh.feat3.desc': 'تنبيهات فورية بأحدث القرارات واللوائح التنظيمية.',
    'balegh.feat4.title': 'الخصوصية والأمان',
    'balegh.feat4.desc': 'تتبع طلباتك برقم مرجعي آمن مع سرية تامة لبياناتك.',
    'balegh.comingSoon': 'قريباً على',
    'balegh.notifyTitle': 'كن أول من يجرّب التطبيق!',
    'balegh.notifyDesc': 'سجّل بريدك أو رقم هاتفك ليصلك رابط التنزيل فور الإطلاق.',
    'balegh.notifyPlaceholder': 'البريد الإلكتروني أو رقم الهاتف',
    'balegh.notifyBtn': 'أبلغني فور الإطلاق',
    'balegh.notifySuccess': 'تم التسجيل! سنرسل لك إشعاراً فور الإطلاق.',
    'balegh.screenStatus': 'هيئة التخطيط العمراني',
    'balegh.screenFeat1': 'تقديم بلاغ مكاني',
    'balegh.screenFeat1Sub': 'إرسال الصور والإحداثيات',
    'balegh.screenFeat2': 'استكشاف المخططات',
    'balegh.screenFeat2Sub': 'خرائط تفاعلية عالية الدقة',
    'balegh.screenFeat3': 'التنبيهات الفورية',
    'balegh.screenFeat3Sub': 'إشعارات القرارات الجديدة',
  },
  en: {
    'nav.home': 'Home',
    'nav.about': 'About Us',
    'nav.news': 'News',
    'nav.papers': 'Working Papers',
    'nav.map': 'Interactive Map',
    'nav.contact': 'Contact Us',
    'nav.portal': 'Staff Portal',
    'nav.dashboard': 'Dashboard',
    'nav.logout': 'Logout',
    'nav.profile': 'My Profile',
    'nav.authority': 'National Urban Planning Authority',
    'nav.libya': 'State of Libya',

    'footer.desc': 'A unified digital portal for communication, urban planning, and official documents.',
    'footer.quickLinks': 'Quick Links',
    'footer.contactUs': 'Contact Us',
    'footer.address': 'Bin Ashour St, Tripoli, Libya, National Urban Planning Authority',
    'footer.phone': '+218 21 360 0090',
    'footer.email': 'info@upa.gov.ly',
    'footer.workHours': 'Sunday – Thursday: 8:00 AM – 3:00 PM',
    'footer.rights': 'All rights reserved. National Urban Planning Authority',

    'home.heroBadge': 'State of Libya — Sovereign Government Entity',
    'home.heroTitleHighlight': "Libya's Future",
    'home.heroTitlePrefix': 'Building ',
    'home.heroTitleSuffix': 'with Integrated Urban Planning',
    'home.heroSubtitle': 'National Urban Planning Authority — The government body responsible for urban planning policies, masterplans, and sustainable regional development.',
    'home.exploreBtn': 'Explore Our Work',
    'home.aboutBtn': 'Learn More',
    'home.floatCardPlans': 'Urban Masterplans',
    'home.floatCardBranches': 'National Branches',
    'home.servicesTag': 'Competencies & Mandates',
    'home.servicesTitle': 'What We Offer Libya',
    'home.servicesDesc': 'The Authority performs a wide range of tasks serving the national urban planning sector.',
    'home.aboutTag': 'About Authority',
    'home.aboutTitle': 'National Urban Planning Authority',
    'home.aboutText1': 'The National Urban Planning Authority is the supreme planning body in Libya, responsible for masterplans at national, regional, and urban levels.',
    'home.aboutText2': 'The authority strives for balanced spatial development by developing strategic frameworks governing population and economic activity distribution across Libya.',
    'home.aboutBtnMore': 'Read More About Us',
    'home.mediaTag': 'Media Center',
    'home.mediaTitle': 'Latest News & Events',
    'home.mediaBtn': 'View All News',
    'home.readMore': 'Read More',
    'home.linksTag': 'Important Services',
    'home.linksTitle': 'Quick Access Services',

    'services.service1.title': 'Urban Masterplans',
    'services.service1.desc': 'Preparing urban and regional plans at all levels for cities and zones.',
    'services.service2.title': 'Regional Planning',
    'services.service2.desc': 'Strategic frameworks for optimal population and economic activity distribution.',
    'services.service3.title': 'Regulations & Legislation',
    'services.service3.desc': 'Developing laws, guidelines, and building code standards.',
    'services.service4.title': 'Sustainable Development',
    'services.service4.desc': 'Applying sustainability principles in all masterplans.',
    'services.service5.title': 'Urban Observatory',
    'services.service5.desc': 'Collecting and analyzing urban data to support planning decisions.',
    'services.service6.title': 'Project Evaluation',
    'services.service6.desc': 'Reviewing projects for compliance with approved masterplans.',

    'links.papers.title': 'Papers & Documents',
    'links.papers.desc': 'Browse research papers, studies, and reports issued by the Authority',
    'links.news.title': 'News & Events',
    'links.news.desc': 'Follow the latest authority news and field activities',
    'links.map.title': 'Urban Masterplans',
    'links.map.desc': 'Browse approved urban plans across Libyan cities',

    'about.historyTag': 'Historical Brief',
    'about.historyTitle': 'Authority History',
    'about.historyDesc': 'The National Urban Planning Authority was established as an independent government agency to oversee urban and regional development in Libya.',
    'about.missionTitle': 'Our Mission',
    'about.missionDesc': 'Contributing to balanced sustainable development by preparing urban and regional masterplans.',
    'about.visionTitle': 'Our Vision',
    'about.visionDesc': 'To be a leading regional reference in urban and regional planning.',
    'about.tasksTag': 'Competencies',
    'about.tasksTitle': 'Mandates & Key Competencies',
    'about.leadershipTag': 'Leadership',
    'about.leadershipTitle': 'Authority Leadership',
    'about.ctaTitle': 'Join the Authority Team',
    'about.ctaDesc': 'Do you want to contribute to the future of urban planning in Libya?',
    'about.ctaBtn': 'Register on the Staff Portal',
    'about.chairman': 'Eng. / President of Authority',
    'about.viceChairman': 'Eng. / Vice President',
    'about.executive': 'Dr. / Executive Director',
    'about.chairmanTitle': 'Chairman of the Board',
    'about.viceChairmanTitle': 'Vice Chairman of the Board',
    'about.executiveTitle': 'Executive Director',

    'contact.tag': 'Contact',
    'contact.title': 'Contact Us',
    'contact.subtitle': 'We are here to answer your questions and assist you anytime',
    'contact.info': 'Contact Information',
    'contact.infoDesc': 'We are happy to connect with you and answer your inquiries.',
    'contact.mapTitle': 'Location Map',
    'contact.mapCity': 'Tripoli, Libya',
    'contact.formTitle': 'Send Us a Message',
    'contact.formSubtitle': 'We will respond within two business days',
    'contact.nameLabel': 'Full Name *',
    'contact.namePlaceholder': 'Your full name',
    'contact.emailLabel': 'Email Address *',
    'contact.emailPlaceholder': 'example@email.com',
    'contact.subjectLabel': 'Subject *',
    'contact.subjectPlaceholder': 'Message subject',
    'contact.messageLabel': 'Message *',
    'contact.messagePlaceholder': 'Write your message here...',
    'contact.sendBtn': 'Send Message',
    'contact.sending': 'Sending...',
    'contact.success': 'Message sent successfully! We will contact you soon.',
    'contact.field.address': 'Address',
    'contact.field.phone': 'Phone',
    'contact.field.email': 'Email',
    'contact.field.workHours': 'Working Hours',

    'news.tag': 'Media Center',
    'news.title': 'News & Events',
    'news.subtitle': 'Follow the latest updates from the Authority',
    'news.searchPlaceholder': 'Search news and events...',
    'news.filterAll': 'All',
    'news.empty': 'No news matches your search.',
    'news.comments': 'Comments',
    'news.addComment': 'Add a comment',
    'news.commentPlaceholder': 'Write your comment here...',
    'news.commentBtn': 'Submit Comment',
    'news.author': 'By',

    'papers.tag': 'Document Library',
    'papers.title': 'Papers & Documents',
    'papers.subtitle': 'Research papers, studies, and planning reports issued by the Authority',
    'papers.searchPlaceholder': 'Search documents...',
    'papers.empty': 'No documents match your search.',
    'papers.download': 'Download',

    'map.tag': 'Digital Planning Services',
    'map.title': 'Interactive Masterplan Map',
    'map.subtitle': 'Explore urban masterplans, housing developments, and official services',
    'map.filterTitle': 'Filter Features',
    'map.searchPlaceholder': 'Search landmark or building...',
    'map.empty': 'No landmarks match your search',
    'map.coordinates': 'Coordinates',
    'map.floatingInfo': 'No additional details available.',

    'common.backToHome': 'Back to Homepage',

    // Balegh App
    'balegh.floatTitle': 'Balegh App',
    'balegh.floatSub': 'Under Development',
    'balegh.badge': 'Soon',
    'balegh.officialBadge': 'Official Mobile App',
    'balegh.devBadge': 'Under Active Development',
    'balegh.title': 'Balegh Mobile App 📲',
    'balegh.titleSub': 'The Smart Digital Platform of the Urban Planning Authority',
    'balegh.subtitle': 'The official smart mobile platform of the National Urban Planning Authority — report urban issues, explore interactive plans, and track your requests directly from your smartphone.',
    'balegh.backHome': 'Back to Home',
    'balegh.progress': 'Development Progress',
    'balegh.progressDesc': 'Our technical team is finalizing security audits and live database integration with the geographic planning data ahead of the official public launch.',
    'balegh.featuresTitle': 'Balegh App Features',
    'balegh.feat1.title': 'Location-Based Reports',
    'balegh.feat1.desc': 'Submit urban reports with photos and precise GPS coordinates.',
    'balegh.feat2.title': 'Maps & Masterplans',
    'balegh.feat2.desc': 'Browse structural plans and approved regions from your phone.',
    'balegh.feat3.title': 'Live Notifications',
    'balegh.feat3.desc': 'Instant alerts for new planning decisions and regulatory updates.',
    'balegh.feat4.title': 'Privacy & Security',
    'balegh.feat4.desc': 'Track requests with a secure reference number and full data confidentiality.',
    'balegh.comingSoon': 'Coming soon on',
    'balegh.notifyTitle': 'Be First to Try the App!',
    'balegh.notifyDesc': 'Enter your email or phone to receive the download link the moment it launches.',
    'balegh.notifyPlaceholder': 'Email address or phone number',
    'balegh.notifyBtn': 'Notify Me at Launch',
    'balegh.notifySuccess': 'Registered! We will notify you the moment the app launches.',
    'balegh.screenStatus': 'Urban Planning Authority',
    'balegh.screenFeat1': 'Submit Location Report',
    'balegh.screenFeat1Sub': 'Send photos & coordinates',
    'balegh.screenFeat2': 'Explore Masterplans',
    'balegh.screenFeat2Sub': 'High-resolution interactive maps',
    'balegh.screenFeat3': 'Live Notifications',
    'balegh.screenFeat3Sub': 'New decision alerts',
  }
};

const AR_EN_MAP = {
  'القرارات واللوائح': 'Decisions & Regulations',
  'القرارات و اللوائح': 'Decisions & Regulations',
  'القرارات': 'Decisions',
  'اللوائح': 'Regulations',
  'قوانين': 'Laws',
  'تشريعات': 'Legislation',
  'ورقات العمل': 'Working Papers',
  'ورقة عمل': 'Working Paper',
  'الخريطة التفاعلية': 'Interactive Map',
  'اتصل بنا': 'Contact Us',
  'عن الهيئة': 'About Authority',
  'الرئيسية': 'Home',
  'الأخبار': 'News',
  'المركز الإعلامي': 'Media Center',
  'عرض القرار': 'View Decision',
  'فتح PDF': 'Open PDF',
  'المُدخل بواسطة': 'Added By',
  'مدخل بيانات': 'Data Entry Staff',
  'مسؤول النظام': 'System Admin',
  'أدمن': 'Admin',
  'رقم القرار': 'Decision No.',
  'السنة': 'Year',
  'التصنيف': 'Category',
  'إغلاق': 'Close',
  'تحميل': 'Download',
  'بحث': 'Search',
  'عرض': 'View',
  'نوع الملف غير مدعوم': 'File type not supported',
  'محتوى محمي': 'Protected Content',
  'حجب أمني تلقائي': 'Automatic Security Shield',
  'لوحة التحكم': 'Dashboard',
  'تسجيل الدخول': 'Login',
  'تسجيل الخروج': 'Logout',
  'إدارة المستخدمين': 'User Management',
  'إحصائيات': 'Statistics',
  'الهيئة الوطنية للتخطيط العمراني': 'National Urban Planning Authority',
  'الجمهورية الليبية': 'State of Libya',
};

export function autoTranslateText(text, currentLocale = 'en') {
  if (!text || typeof text !== 'string') return text;
  if (currentLocale !== 'en') return text;
  let res = text;
  for (const [ar, en] of Object.entries(AR_EN_MAP)) {
    if (res === ar) return en;
    res = res.replaceAll(ar, en);
  }
  return res;
}

export const LanguageProvider = ({ children }) => {
  const [locale, setLocale] = useState(() => {
    const saved = localStorage.getItem('upa_locale');
    return saved === 'en' ? 'en' : 'ar';
  });

  useEffect(() => {
    localStorage.setItem('upa_locale', locale);
    const isRtl = locale === 'ar';
    document.documentElement.dir = isRtl ? 'rtl' : 'ltr';
    document.documentElement.lang = locale;
    if (isRtl) {
      document.body.style.fontFamily = "'Tajawal', 'Cairo', sans-serif";
      document.body.style.textAlign = 'right';
      document.body.dir = 'rtl';
    } else {
      document.body.style.fontFamily = "'Outfit', 'Inter', 'Roboto', sans-serif";
      document.body.style.textAlign = 'left';
      document.body.dir = 'ltr';
    }
  }, [locale]);

  // Instant toggle — switches immediately, pages translate on-demand
  const toggleLanguage = () => {
    setLocale(prev => prev === 'ar' ? 'en' : 'ar');
  };

  const t = (key, fallback) => {
    if (translations[locale] && translations[locale][key]) {
      return translations[locale][key];
    }
    if (locale === 'en') {
      return autoTranslateText(fallback || key, locale);
    }
    return fallback || key;
  };

  return (
    <LanguageContext.Provider value={{ locale, setLocale, toggleLanguage, t, autoTranslateText: (txt) => autoTranslateText(txt, locale) }}>
      {children}
    </LanguageContext.Provider>
  );
};

export const useLanguage = () => {
  const context = useContext(LanguageContext);
  if (!context) throw new Error('useLanguage must be used within a LanguageProvider');
  return context;
};
