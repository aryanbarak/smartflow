import type { ErgQuestion } from "./oopQuestions";

export const SOFTWAREENGINEERING_QUESTIONS: ReadonlyArray<ErgQuestion> = [
  {
    id: "se-01",
    question: "Was ist Software-Engineering und welche Phasen hat ein typischer Entwicklungsprozess?",
    answer:
      "Software-Engineering ist die ingenieurmäßige, systematische Entwicklung und Wartung von Software nach anerkannten Methoden. Ziel ist es, hochwertige Software termingerecht und im Budget zu entwickeln. Typische Phasen: Planung, Analyse (Anforderungen), Entwurf (Design), Implementierung (Programmierung), Test, Betrieb/Wartung.",
    explainFa:
      "۱) موضوع سوال: تعریف Software-Engineering و مراحل توسعه\n۲) خواسته سوال: مفهوم و فازهای اصلی چرخه حیات نرم‌افزار\n۳) منطق پاسخ درست: SE = رشته مهندسی برای توسعه سیستماتیک نرم‌افزار. فازها: برنامه‌ریزی → تحلیل → طراحی → پیاده‌سازی → تست → نگهداری.\n۴) نکات امتحانی/دان‌ها: SE با برنامه‌نویسی ساده فرق دارد — SE رویکرد سازمان‌یافته و مستند است. SDLC = Software Development Life Cycle.",
  },
  {
    id: "se-02",
    question: "Was ist das Wasserfallmodell und was sind seine Vor- und Nachteile?",
    answer:
      "Das Wasserfallmodell ist ein sequenzielles Vorgehensmodell: jede Phase muss vollständig abgeschlossen sein, bevor die nächste beginnt (wie ein Wasserfall). Phasen: Anforderungen → Design → Implementierung → Test → Wartung.\nVorteile: klar strukturiert, leicht planbar, gute Dokumentation.\nNachteile: unflexibel bei Änderungen, späte Fehlererkennung (Fehler erst beim Test entdeckt), Kundenfeedback erst am Ende.",
    explainFa:
      "۱) موضوع سوال: مدل آبشاری (Wasserfallmodell)\n۲) خواسته سوال: ساختار و مزایا/معایب این مدل\n۳) منطق پاسخ درست: Wasserfall = مراحل خطی یکی پس از دیگری. مزیت: ساختار واضح، مستندسازی خوب. عیب: انعطاف کم، خطاها دیر کشف می‌شوند.\n۴) نکات امتحانی/دان‌ها: Wasserfall برای پروژه‌های با نیازمندی‌های ثابت مناسب است. برای پروژه‌های پویا و نیازمندی‌های متغیر، Agile بهتر است.",
  },
  {
    id: "se-03",
    question: "Was ist das V-Modell?",
    answer:
      "Das V-Modell ist eine Erweiterung des Wasserfallmodells, das jeder Entwicklungsphase eine entsprechende Testphase gegenüberstellt. Die linke Seite des V zeigt Entwicklungsphasen (Anforderungen, Design, Implementierung), die rechte Seite die zugehörigen Tests (Abnahmetest, Integrationstest, Unit-Test). So wird Qualitätssicherung frühzeitig mitgeplant und jede Anforderung hat eine korrespondierende Prüfung.",
    explainFa:
      "۱) موضوع سوال: مدل V (V-Modell)\n۲) خواسته سوال: ساختار V-Modell و ارتباط توسعه-تست\n۳) منطق پاسخ درست: V-Modell = Wasserfall + تست متناظر. هر فاز توسعه یک فاز تست مرتبط دارد. کیفیت از ابتدا برنامه‌ریزی می‌شود.\n۴) نکات امتحانی/دان‌ها: سمت چپ V = توسعه؛ سمت راست V = تست. Unittest = پایین V؛ Abnahmetest = بالای V سمت راست.",
  },
  {
    id: "se-04",
    question: "Was sind die Grundprinzipien agiler Softwareentwicklung?",
    answer:
      "Agile Softwareentwicklung (nach dem Agilen Manifest) basiert auf vier Werten:\n• Individuen und Interaktionen über Prozesse und Werkzeuge\n• Funktionierende Software über umfassende Dokumentation\n• Zusammenarbeit mit Kunden über Vertragsverhandlungen\n• Reagieren auf Änderungen über das Befolgen eines Plans\nAgile Methoden liefern in kurzen Iterationen (Sprints) lauffähige Produktinkremente und binden den Kunden kontinuierlich ein.",
    explainFa:
      "۱) موضوع سوال: اصول توسعه Agile\n۲) خواسته سوال: چهار ارزش اصلی مانیفست Agile\n۳) منطق پاسخ درست: Agile = چهار ارزش: افراد بر فرآیند، نرم‌افزار کارکننده بر مستندات، همکاری مشتری، پاسخ به تغییر.\n۴) نکات امتحانی/دان‌ها: Agile Manifest = ۲۰۰۱. ۱۲ اصل در پشت. Sprint = بازه کوتاه تحویل (۱-۴ هفته). تحویل مداوم ارزش به مشتری مهم‌ترین هدف است.",
  },
  {
    id: "se-05",
    question: "Was sind die Rollen in Scrum?",
    answer:
      "Scrum definiert drei Rollen:\n• Product Owner: vertritt die Interessen des Kunden, pflegt und priorisiert das Product Backlog.\n• Scrum Master: sorgt für die Einhaltung des Scrum-Prozesses, beseitigt Hindernisse (Impediments), dienende Führung.\n• Development Team: selbstorganisiertes, cross-funktionales Team (3–9 Personen), das die Produktinkremente entwickelt.\nEs gibt in Scrum keinen klassischen Projektleiter — die Verantwortung ist auf diese drei Rollen verteilt.",
    explainFa:
      "۱) موضوع سوال: نقش‌های Scrum\n۲) خواسته سوال: سه نقش اصلی و وظایف هر کدام\n۳) منطق پاسخ درست: Product Owner = صدای مشتری، اولویت‌بندی Backlog؛ Scrum Master = مراقب فرآیند، رفع موانع؛ Development Team = تیم خودسازمان‌یافته.\n۴) نکات امتحانی/دان‌ها: Scrum Master = مدیر پروژه نیست — نقش خدمت‌گزار (servant leader) دارد. PO و SM نباید یک نفر باشند.",
  },
  {
    id: "se-06",
    question: "Was sind die wichtigsten Artefakte und Events in Scrum?",
    answer:
      "Artefakte:\n• Product Backlog: priorisierte Liste aller Anforderungen (User Stories).\n• Sprint Backlog: für den aktuellen Sprint ausgewählte Aufgaben.\n• Increment: das fertige, auslieferbare Produktinkrement am Ende des Sprints.\nEvents (Ceremonies):\n• Sprint Planning: Planung des nächsten Sprints.\n• Daily Scrum: tägliches 15-Minuten-Standup.\n• Sprint Review: Demo des Inkrements an Stakeholder.\n• Sprint Retrospective: übergeordnete Prozessverbesserung im Team.",
    explainFa:
      "۱) موضوع سوال: آرتیفکت‌ها و رویدادهای Scrum\n۲) خواسته سوال: تعریف Backlog، Sprint و چهار Ceremony\n۳) منطق پاسخ درست: Product Backlog = لیست کامل نیازمندی‌ها. Sprint Backlog = کارهای Sprint جاری. Increment = محصول قابل تحویل.\n۴) نکات امتحانی/دان‌ها: Daily Scrum = 15 دقیقه روزانه. Retrospective = بازنگری فرآیند (نه محصول). Review = نمایش محصول به مشتری.",
  },
  {
    id: "se-07",
    question: "Was ist der Unterschied zwischen Lastenheft und Pflichtenheft?",
    answer:
      "Das Lastenheft (Requirements Specification) beschreibt, WAS das System leisten soll — aus Kundensicht. Es enthält die Gesamtheit der Anforderungen des Auftraggebers und wird vom Kunden erstellt.\nDas Pflichtenheft (Functional Specification) beschreibt, WIE die Anforderungen umgesetzt werden — aus Entwicklersicht. Es enthält das Lösungskonzept des Auftragnehmers und wird vom Entwickler als Antwort auf das Lastenheft erstellt.",
    explainFa:
      "۱) موضوع سوال: تفاوت Lastenheft و Pflichtenheft\n۲) خواسته سوال: تعریف هر سند و اینکه چه کسی آن را می‌نویسد\n۳) منطق پاسخ درست: Lastenheft = مشتری می‌نویسد، «چه می‌خواهم؟». Pflichtenheft = توسعه‌دهنده می‌نویسد، «چطور پیاده می‌کنم؟».\n۴) نکات امتحانی/دان‌ها: Lasten = بار، خواسته مشتری؛ Pflicht = تکلیف، تعهد توسعه‌دهنده. این تفاوت بسیار مهم است.",
  },
  {
    id: "se-08",
    question: "Was ist der Unterschied zwischen funktionalen und nicht-funktionalen Anforderungen?",
    answer:
      "Funktionale Anforderungen beschreiben WAS ein System tun soll — konkrete Funktionen und Verhaltensweisen (z. B. 'Der Nutzer kann sich anmelden', 'Das System exportiert Berichte als PDF').\nNicht-funktionale Anforderungen beschreiben WIE GUT das System funktioniert — Qualitätsmerkmale wie Leistung, Sicherheit, Verfügbarkeit, Benutzerfreundlichkeit, Skalierbarkeit, Wartbarkeit (auch 'Qualitätsanforderungen' genannt).",
    explainFa:
      "۱) موضوع سوال: تفاوت نیازمندی‌های کارکردی و غیرکارکردی\n۲) خواسته سوال: تعریف و مثال هر نوع\n۳) منطق پاسخ درست: کارکردی = «سیستم چه کاری انجام می‌دهد؟» (ورود کاربر، صدور گزارش). غیرکارکردی = «سیستم چقدر خوب کار می‌کند؟» (سرعت، امنیت، دسترس‌پذیری).\n۴) نکات امتحانی/دان‌ها: غیرکارکردی = Qualitätsmerkmale. ISO 25010 فهرست کاملی از این مشخصه‌ها دارد.",
  },
  {
    id: "se-09",
    question: "Welche UML-Diagramme gibt es und für was werden sie verwendet?",
    answer:
      "UML (Unified Modeling Language) bietet verschiedene Diagrammtypen:\nStrukturdiagramme:\n• Klassendiagramm: Klassen, Attribute, Methoden, Beziehungen\n• Komponentendiagramm: Systemkomponenten und Schnittstellen\nVerhaltensdiagramme:\n• Use-Case-Diagramm: Akteure und Anwendungsfälle\n• Aktivitätsdiagramm: Abläufe und Entscheidungen\n• Sequenzdiagramm: zeitliche Abfolge von Nachrichten\n• Zustandsdiagramm: Zustände und Zustandsübergänge",
    explainFa:
      "۱) موضوع سوال: انواع نمودارهای UML\n۲) خواسته سوال: دسته‌بندی و کاربرد نمودارها\n۳) منطق پاسخ درست: UML دو دسته دارد — ساختاری (کلاس، کامپوننت) و رفتاری (Use-Case، Aktivität، Sequenz، Zustand).\n۴) نکات امتحانی/دان‌ها: در آزمون اغلب Klassendiagramm، Use-Case و Sequenzdiagramm پرسیده می‌شود. UML = زبان بصری استاندارد برای مدل‌سازی نرم‌افزار.",
  },
  {
    id: "se-10",
    question: "Was ist ein Use-Case-Diagramm und wie liest man es?",
    answer:
      "Ein Use-Case-Diagramm zeigt die Anwendungsfälle (Funktionen) eines Systems und die Akteure (Benutzer oder externe Systeme), die damit interagieren. Notation:\n• Akteur: Strichmännchen\n• Use Case: Ellipse mit Beschriftung\n• System: Rechteck (Systemgrenze)\n• Assoziation: Linie zwischen Akteur und Use Case\n• <<include>>: wird immer ausgeführt\n• <<extend>>: optionale Erweiterung\nUse-Case-Diagramme zeigen das WAS, nicht das WIE.",
    explainFa:
      "۱) موضوع سوال: نمودار Use-Case\n۲) خواسته سوال: ساختار و نمادها در Use-Case Diagram\n۳) منطق پاسخ درست: Use-Case = رابطه بین کاربر (Akteur) و عملکردهای سیستم. نماد: آدمک = Akteur، بیضی = Use-Case، مستطیل = مرز سیستم.\n۴) نکات امتحانی/دان‌ها: include = همیشه اجرا می‌شود؛ extend = اختیاری. Use-Case نشان می‌دهد «چه» نه «چطور».",
  },
  {
    id: "se-11",
    question: "Was ist ein Sequenzdiagramm und was zeigt es?",
    answer:
      "Ein Sequenzdiagramm zeigt die zeitliche Abfolge von Nachrichten (Methodenaufrufen) zwischen Objekten oder Systemkomponenten. Es wird zur Darstellung von Szenarien und Abläufen verwendet. Elemente:\n• Objekte/Akteure: oben als Kästen\n• Lebenslinie: senkrechte gestrichelte Linie\n• Nachrichten: waagerechte Pfeile (synchron: ausgefüllte Pfeilspitze, asynchron: offene Pfeilspitze)\n• Aktivierungsbalken: Rechteck auf Lebenslinie\n• Rückgabe: gestrichelter Pfeil",
    explainFa:
      "۱) موضوع سوال: نمودار Sequenz\n۲) خواسته سوال: ساختار و کاربرد Sequenzdiagramm\n۳) منطق پاسخ درست: Sequenzdiagramm = ترتیب زمانی پیام‌ها بین اشیاء. Lebenslinie = خط عمودی هر شیء. پیام‌ها = فلش‌های افقی.\n۴) نکات امتحانی/دان‌ها: فلش توپر = فراخوانی همگام (synchron)؛ فلش خط‌چین = بازگشت. برای نمایش یک سناریوی مشخص (مثل ورود کاربر) استفاده می‌شود.",
  },
  {
    id: "se-12",
    question: "Was ist ein Aktivitätsdiagramm?",
    answer:
      "Ein Aktivitätsdiagramm zeigt den Ablauf von Aktionen und Entscheidungen — ähnlich einem Flussdiagramm. Es stellt Abläufe, Verzweigungen und parallele Aktivitäten dar. Elemente:\n• Startknoten: ausgefüllter Kreis\n• Aktionen: abgerundete Rechtecke\n• Entscheidungen werden über Rauten dargestellt (Bedingungen an Kanten)\n• Endknoten: Kreis mit Ring\n• Gabelung/Zusammenführung für Parallelität\nVerwendung: Geschäftsprozesse, Algorithmen, Workflows.",
    explainFa:
      "۱) موضوع سوال: نمودار Aktivität\n۲) خواسته سوال: ساختار و کاربرد Aktivitätsdiagramm\n۳) منطق پاسخ درست: Aktivitätsdiagramm = فلوچارت UML. عمل‌ها (Action)، تصمیم‌ها (Raute)، شروع (دایره توپر)، پایان (دایره با حلقه).\n۴) نکات امتحانی/دان‌ها: برای نمایش الگوریتم و فرآیند کسب‌وکار استفاده می‌شود. Fork/Join = موازی‌سازی در این نمودار.",
  },
  {
    id: "se-13",
    question: "Was sind die vier Teststufen und was wird jeweils geprüft?",
    answer:
      "Die vier Teststufen:\n1. Unit-Test (Modultest): prüft einzelne Funktionen oder Klassen isoliert — meist automatisiert (z. B. JUnit).\n2. Integrationstest: prüft das Zusammenspiel mehrerer Komponenten/Module.\n3. Systemtest: prüft das gesamte System gegen die Anforderungen (Lastenheft).\n4. Abnahmetest (UAT): prüft, ob das System die Kundenerwartungen erfüllt — meist vom Kunden durchgeführt.",
    explainFa:
      "۱) موضوع سوال: چهار سطح تست نرم‌افزار\n۲) خواسته سوال: تعریف و هدف هر سطح تست\n۳) منطق پاسخ درست: Unit-Test = تست مجزا؛ Integrationstest = تست همکاری؛ Systemtest = کل سیستم؛ Abnahmetest = تأیید مشتری.\n۴) نکات امتحانی/دان‌ها: V-Modell این چهار سطح را به چهار فاز توسعه نسبت می‌دهد. UAT = User Acceptance Test، معمولاً توسط مشتری انجام می‌شود.",
  },
  {
    id: "se-14",
    question: "Was ist der Unterschied zwischen Black-Box- und White-Box-Test?",
    answer:
      "Black-Box-Test: das System wird von außen geprüft, ohne Kenntnis des Quellcodes. Getestet wird: stimmt die Ausgabe für eine gegebene Eingabe? Beispiel: Äquivalenzklassentest, Grenzwertanalyse.\nWhite-Box-Test: der interne Aufbau ist bekannt. Getestet wird, ob alle Codepfade durchlaufen werden (z. B. Zweigüberdeckung, Pfadüberdeckung). Beispiel: Unit-Tests mit Codezugriff.\nKombination beider Ansätze führt zu umfassender Testabdeckung.",
    explainFa:
      "۱) موضوع سوال: تفاوت Black-Box و White-Box Test\n۲) خواسته سوال: رویکرد و کاربرد هر نوع تست\n۳) منطق پاسخ درست: Black-Box = بدون دیدن کد، فقط ورودی/خروجی. White-Box = با دانستن کد، تست مسیرهای کد.\n۴) نکات امتحانی/دان‌ها: Black-Box → Äquivalenzklassen، Grenzwertanalyse. White-Box → Zweigüberdeckung (Branch Coverage).",
  },
  {
    id: "se-15",
    question: "Was sind Äquivalenzklassen und warum werden sie verwendet?",
    answer:
      "Äquivalenzklassen teilen den Eingabebereich in Gruppen auf, bei denen das System voraussichtlich gleich reagiert — so muss nicht jeder Einzelwert getestet werden. Typen:\n• Gültige Äquivalenzklassen: korrekte Eingaben (z. B. Alter 18–99)\n• Ungültige Äquivalenzklassen: fehlerhafte Eingaben (z. B. Alter <18 oder >99)\nErgänzend: Grenzwertanalyse testet die Randwerte (17, 18, 99, 100).",
    explainFa:
      "۱) موضوع سوال: کلاس‌های هم‌ارزی (Äquivalenzklassen)\n۲) خواسته سوال: تعریف و دلیل استفاده\n۳) منطق پاسخ درست: Äquivalenzklassen = تقسیم ورودی‌ها به گروه‌هایی که رفتار مشابه دارند. یک نماینده از هر گروه کافی است.\n۴) نکات امتحانی/دان‌ها: همیشه هم کلاس معتبر (gültig) هم نامعتبر (ungültig) تست کنید. Grenzwertanalyse = تست مقادیر مرزی (دقیقاً سر مرز).",
  },
  {
    id: "se-16",
    question: "Was ist Git und wozu wird es verwendet?",
    answer:
      "Git ist ein verteiltes Versionskontrollsystem, das Änderungen am Quellcode über die Zeit aufzeichnet und mehreren Entwicklern ermöglicht, gleichzeitig an einem Projekt zu arbeiten. Wichtige Konzepte:\n• Repository: vollständiges Projektarchiv mit History\n• Commit: gespeicherter Snapshot\n• Branch: parallele Entwicklungslinie\n• Merge/Pull Request: Zusammenführen von Branches\n• Konflikt: widersprüchliche Änderungen müssen manuell aufgelöst werden\nGit ermöglicht Nachvollziehbarkeit (wer hat was wann geändert).",
    explainFa:
      "۱) موضوع سوال: Git و کاربرد آن\n۲) خواسته سوال: مفاهیم اصلی Git و چرا استفاده می‌شود\n۳) منطق پاسخ درست: Git = سیستم کنترل نسخه توزیع‌شده. Commit = اسنپشات، Branch = خط موازی توسعه، Merge = ادغام.\n۴) نکات امتحانی/دان‌ها: git init → git add → git commit → git push. Pull Request = درخواست ادغام Branch. Conflict = وقتی دو نفر یک خط را تغییر می‌دهند.",
  },
  {
    id: "se-17",
    question: "Was ist Refactoring?",
    answer:
      "Refactoring ist das Umstrukturieren von bestehendem Code, ohne sein äußeres Verhalten zu ändern. Ziel ist die Verbesserung der Lesbarkeit, Wartbarkeit und Verringerung der Komplexität des Codes (Codequalität). Typische Refactoring-Maßnahmen: Methoden extrahieren, Variablen umbenennen, doppelten Code eliminieren, Klassen aufteilen. Refactoring wird durch automatisierte Tests abgesichert.",
    explainFa:
      "۱) موضوع سوال: Refactoring چیست؟\n۲) خواسته سوال: تعریف و هدف Refactoring\n۳) منطق پاسخ درست: Refactoring = بازنویسی کد بدون تغییر رفتار. هدف: خوانایی، نگهداری‌پذیری، کاهش پیچیدگی.\n۴) نکات امتحانی/دان‌ها: Refactoring فقط با تست‌های خودکار امن است — بدون تست خطر regression وجود دارد. «مثل تمیز کردن خانه بدون اضافه کردن وسیله جدید».",
  },
  {
    id: "se-18",
    question: "Was ist ein Code Review und welche Vorteile hat es?",
    answer:
      "Ein Code Review ist die Überprüfung von Quellcode durch andere Entwickler, bevor er in den Hauptzweig integriert wird. Vorteile:\n• Fehlererkennung vor der Produktion\n• Aufdecken von Verstößen gegen Coding-Standards\n• Wissensaustausch im Team\n• Verbesserung der Codequalität\n• Verbreitung von Best Practices\nCode Reviews erfolgen typischerweise über Pull/Merge Requests in Versionskontrollsystemen.",
    explainFa:
      "۱) موضوع سوال: Code Review و مزایای آن\n۲) خواسته سوال: تعریف و فواید بررسی کد\n۳) منطق پاسخ درست: Code Review = بررسی کد توسط همتیمی‌ها قبل از ادغام. مزایا: خطاکمتر، کیفیت بالاتر، انتقال دانش.\n۴) نکات امتحانی/دان‌ها: Code Review از طریق Pull Request انجام می‌شود. Pair Programming = بررسی بلادرنگ — هر دو رویکرد Code Review محسوب می‌شوند.",
  },
  {
    id: "se-19",
    question: "Was ist das MVC-Muster?",
    answer:
      "MVC (Model-View-Controller) ist ein bewährtes Architekturmuster zur Trennung von Zuständigkeiten (Separation of Concerns):\n• Model: Datenhaltung und Geschäftslogik\n• View: Benutzeroberfläche (Darstellung)\n• Controller: Steuerung, verbindet Model und View, verarbeitet Benutzereingaben\nVorteile: klare Struktur, leichtere Testbarkeit (Model unabhängig testbar), parallele Entwicklung möglich.",
    explainFa:
      "۱) موضوع سوال: الگوی MVC\n۲) خواسته سوال: سه بخش MVC و نقش هر کدام\n۳) منطق پاسخ درست: Model = داده و منطق؛ View = رابط کاربری؛ Controller = واسط که ورودی را پردازش می‌کند.\n۴) نکات امتحانی/دان‌ها: MVC = جداسازی نگرانی‌ها (Separation of Concerns). مزیت: Model بدون View قابل تست است. در وب: Angular، Spring MVC این الگو را پیاده می‌کنند.",
  },
  {
    id: "se-20",
    question: "Was sind Qualitätsmerkmale nach ISO 25010?",
    answer:
      "ISO 25010 definiert Qualitätsmerkmale für Software:\n• Funktionale Eignung: erfüllt das System die Anforderungen?\n• Zuverlässigkeit: Fehlerrate, Wiederherstellbarkeit\n• Leistungseffizienz: Antwortzeit, Ressourcenverbrauch\n• Sicherheit: Vertraulichkeit, Integrität, Verfügbarkeit\n• Wartbarkeit: Analysierbarkeit, Änderbarkeit, Testbarkeit\n• Kompatibilität: Interoperabilität, Co-Existenz\n• Benutzbarkeit: Erlernbarkeit, Bedienbarkeit\n• Portabilität: Übertragbarkeit auf andere Systeme",
    explainFa:
      "۱) موضوع سوال: معیارهای کیفیت نرم‌افزار ISO 25010\n۲) خواسته سوال: مشخصه‌های اصلی کیفیت\n۳) منطق پاسخ درست: ISO 25010 = استاندارد کیفیت نرم‌افزار با ۸ ویژگی اصلی: کارایی، قابلیت اطمینان، کارایی عملکرد، امنیت، قابلیت نگهداری، سازگاری، قابلیت استفاده، قابلیت انتقال.\n۴) نکات امتحانی/دان‌ها: ISO 25010 جانشین ISO 9126 است. Wartbarkeit و Zuverlässigkeit بیشترین تأکید در آزمون دارند.",
  },
  {
    id: "se-21",
    question: "Was ist Softwarewartung und welche Arten gibt es?",
    answer:
      "Softwarewartung umfasst alle Änderungen an Software nach der Auslieferung. Arten:\n• Korrektiv: Fehlerbehebung (Bugs)\n• Adaptiv: Anpassung an neue Umgebungen (z. B. neues Betriebssystem, neue API)\n• Perfektiv: Verbesserung von Funktionen oder Performance\n• Präventiv: vorbeugend, z. B. Refactoring zur Fehlervermeidung\nWartbarkeit als Qualitätsmerkmal beschreibt, wie leicht sich Software ändern lässt. Wartung macht den größten Kostenanteil im Softwarelebenszyklus aus.",
    explainFa:
      "۱) موضوع سوال: نگهداری نرم‌افزار (Softwarewartung)\n۲) خواسته سوال: انواع نگهداری و اهمیت آن\n۳) منطق پاسخ درست: نگهداری = تمام تغییرات پس از تحویل. انواع: Korrektiv (رفع باگ)، Adaptiv (تطبیق)، Perfektiv (بهبود)، Präventiv (پیشگیرانه).\n۴) نکات امتحانی/دان‌ها: نگهداری بیشترین هزینه چرخه حیات نرم‌افزار را دارد (۶۰-۷۰٪). Wartbarkeit = مشخصه کیفیت ISO 25010.",
  },
  {
    id: "se-22",
    question: "Was ist der Unterschied zwischen klassischen und agilen Vorgehensmodellen?",
    answer:
      "Klassische Modelle (Wasserfall, V-Modell): plangetrieben und sequenziell, vollständige Anforderungen vor Beginn nötig, Änderungen sind aufwändig, Ergebnis erst am Ende, gut für stabile Anforderungen.\nAgile Modelle (Scrum, Kanban): iterativ und inkrementell, Anforderungen können sich während der Entwicklung ändern, kontinuierliche Lieferung lauffähiger Inkremente, enger Kundenkontakt, gut für veränderlichen und unsicheren Anforderungen.",
    explainFa:
      "۱) موضوع سوال: مقایسه مدل‌های کلاسیک و Agile\n۲) خواسته سوال: تفاوت رویکرد و کاربرد هر دسته\n۳) منطق پاسخ درست: کلاسیک = خطی، برنامه‌محور، نیازمند نیازمندی‌های ثابت. Agile = تکراری، انعطاف‌پذیر، تحویل مداوم.\n۴) نکات امتحانی/دان‌ها: آزمون اغلب می‌پرسد «کدام مدل برای پروژه X مناسب‌تر است؟» — پاسخ به میزان ثبات نیازمندی‌ها بستگی دارد.",
  },
  {
    id: "se-23",
    question: "Was sind Arten der Softwaredokumentation?",
    answer:
      "Wichtige Dokumentationsarten:\n• Anforderungsdokumentation: Lastenheft, Pflichtenheft, User Stories\n• Architekturdokumentation: Systemstruktur, Komponenten, Schnittstellen\n• Technische Dokumentation: Code-Kommentare, API-Dokumentation\n• Benutzerdokumentation: Handbuch, Onlinehilfe für Anwender\n• Testdokumentation: Testplan, Testergebnisse\nDokumentation sichert Nachvollziehbarkeit, ermöglicht Einarbeitung neuer Mitarbeiter und reduziert die Abhängigkeit von einzelnen Personen.",
    explainFa:
      "۱) موضوع سوال: انواع مستندسازی نرم‌افزار\n۲) خواسته سوال: انواع مستندات و هدف هر کدام\n۳) منطق پاسخ درست: مستندات = نیازمندی، معماری، کد، کاربر، تست. هر کدام مخاطب خاص دارند.\n۴) نکات امتحانی/دان‌ها: مستندسازی دانش را از شخص به سازمان منتقل می‌کند — اگر کسی برود، کار متوقف نمی‌شود. بهترین کد نیاز به توضیح ندارد اما معماری و تصمیمات باید مستند باشند.",
  },
  {
    id: "se-24",
    question: "Was ist das EVA-Prinzip und was bedeutet strukturierte Programmierung?",
    answer:
      "Das EVA-Prinzip beschreibt die grundlegende Verarbeitungsstruktur: Eingabe → Verarbeitung → Ausgabe. Jedes Programm nimmt Daten entgegen, verarbeitet sie und gibt Ergebnisse aus.\nStrukturierte Programmierung bedeutet, dass Programme ausschließlich aus drei Kontrollstrukturen aufgebaut werden:\n• Sequenz (Folge von Anweisungen)\n• Selektion (if/else, Verzweigung)\n• Wiederholung/Iteration (Schleifen)\nDabei wird auf unkontrollierte Sprünge (GOTO) verzichtet — Code wird übersichtlicher und wartbarer.",
    explainFa:
      "۱) موضوع سوال: اصل EVA و برنامه‌نویسی ساختاریافته\n۲) خواسته سوال: مفهوم EVA و سه ساختار کنترلی\n۳) منطق پاسخ درست: EVA = Eingabe → Verarbeitung → Ausgabe. برنامه‌نویسی ساختاریافته = فقط Sequenz، Selektion، Iteration — بدون GOTO.\n۴) نکات امتحانی/دان‌ها: GOTO ممنوع است چون خوانایی را خراب می‌کند. این سه ساختار برای نوشتن هر الگوریتمی کافی‌اند (قضیه ساختار بوهم-ژاکوپینی).",
  },
  {
    id: "se-25",
    question: "Was ist Continuous Integration (CI) und wie hängt es mit DevOps zusammen?",
    answer:
      "Continuous Integration (CI) ist die Praxis, Codeänderungen häufig (mehrmals täglich) in ein gemeinsames Repository einzuchecken und automatisch zu bauen und zu testen — um Integrationsfehler früh zu erkennen. DevOps verbindet Entwicklung (Dev) und Betrieb (Ops) durch Automatisierung, CI/CD-Pipelines, Monitoring und gemeinsame Verantwortung. CD = Continuous Delivery/Deployment: automatische Auslieferung in Produktion. CI/CD macht Releases häufiger, kleiner und zuverlässiger.",
    explainFa:
      "۱) موضوع سوال: CI (Continuous Integration) و DevOps\n۲) خواسته سوال: تعریف CI و رابطه آن با DevOps\n۳) منطق پاسخ درست: CI = ادغام مداوم کد با build و تست خودکار. DevOps = فرهنگ همکاری توسعه و عملیات با خودکارسازی.\n۴) نکات امتحانی/دان‌ها: CI/CD Pipeline: کد → build → test → deploy. CD = Continuous Delivery (دستی در پایان) یا Continuous Deployment (کاملاً خودکار). ابزارها: GitHub Actions، Jenkins، GitLab CI.",
  },
];
