import type { ErgQuestion } from "./oopQuestions";

export const DATENBANKEN_QUESTIONS: ReadonlyArray<ErgQuestion> = [
  {
    id: "db-01",
    question: "Was ist eine relationale Datenbank und was macht ein DBMS?",
    answer:
      "Eine relationale Datenbank speichert Daten in Tabellen (Relationen) mit Zeilen (Datensätzen) und Spalten (Attributen), die über Schlüssel miteinander verknüpft sind. Ein DBMS (Datenbankmanagementsystem) ist die Software, die diese Daten verwaltet, CRUD-Operationen ermöglicht, Zugriffsrechte kontrolliert und Transaktionen sicherstellt (z. B. MySQL, PostgreSQL, Oracle).",
    explainFa:
      "۱) موضوع سوال: تعریف پایگاه داده رابطه‌ای و نقش DBMS\n۲) خواسته سوال: تفاوت بین پایگاه داده و سیستم مدیریت آن و ساختار جدول‌ها\n۳) منطق پاسخ درست: پایگاه داده رابطه‌ای داده‌ها را در جدول‌هایی ذخیره می‌کند که از طریق کلید به هم متصل‌اند. DBMS نرم‌افزاری است که این داده‌ها را مدیریت می‌کند (مثل MySQL).\n۴) نکات امتحانی/دان‌ها: «رابطه» = جدول، «تاپل» = سطر، «ویژگی» = ستون — این اصطلاحات را با هم یاد بگیرید.",
  },
  {
    id: "db-02",
    question: "Was ist ein Primärschlüssel und welche Eigenschaften muss er haben?",
    answer:
      "Ein Primärschlüssel (Primary Key) ist ein Attribut oder eine Attributkombination, das jeden Datensatz in einer Tabelle eindeutig identifiziert. Er muss eindeutig sein (keine Duplikate) und darf nie NULL sein. Es ist möglich, einen zusammengesetzten Schlüssel aus mehreren Attributen zu bilden, wenn kein einzelnes Attribut eindeutig ist.",
    explainFa:
      "۱) موضوع سوال: ویژگی‌های کلید اصلی (Primary Key)\n۲) خواسته سوال: تعریف و شرایط کلید اصلی\n۳) منطق پاسخ درست: کلید اصلی هر رکورد را به‌صورت یکتا شناسایی می‌کند — باید منحصربه‌فرد و غیر NULL باشد.\n۴) نکات امتحانی/دان‌ها: کلید مرکب (composite key) = ترکیب چند ستون — اگر سوال پرسید «چه زمانی؟»، جواب دهید «وقتی هیچ ستون تنهایی یکتا نباشد».",
  },
  {
    id: "db-03",
    question: "Was ist ein Fremdschlüssel und was bedeutet referentielle Integrität?",
    answer:
      "Ein Fremdschlüssel (Foreign Key) ist ein Attribut in einer Tabelle, das auf den Primärschlüssel einer anderen Tabelle verweist und so eine Beziehung zwischen den Tabellen herstellt. Referentielle Integrität bedeutet, dass kein Fremdschlüsselwert auf einen nicht existierenden Datensatz zeigen darf — das DBMS verhindert verwaiste Verweise z. B. durch CASCADE oder RESTRICT beim Löschen eines referenzierten Datensatzes.",
    explainFa:
      "۱) موضوع سوال: کلید خارجی و یکپارچگی ارجاعی\n۲) خواسته سوال: تعریف foreign key و مفهوم referential integrity\n۳) منطق پاسخ درست: کلید خارجی به کلید اصلی جدول دیگری اشاره می‌کند. یکپارچگی ارجاعی یعنی این اشاره همیشه معتبر باشد — رکورد «مرجع» باید وجود داشته باشد.\n۴) نکات امتحانی/دان‌ها: CASCADE DELETE = حذف خودکار رکوردهای وابسته؛ RESTRICT = جلوگیری از حذف اگر رکورد وابسته وجود داشته باشد.",
  },
  {
    id: "db-04",
    question: "Was besagt die erste Normalform (1NF)?",
    answer:
      "Die erste Normalform (1NF) fordert, dass alle Attributwerte atomar (unteilbar) sind — also keine Mehrfachwerte, Listen oder Wiederholungsgruppen in einer Zelle enthalten sind. Beispiel für einen Verstoß: ein Feld 'Telefonnummern' mit dem Wert '0123, 0456'. Lösung: mehrere Telefonnummern in eine separate Tabelle auslagern.",
    explainFa:
      "۱) موضوع سوال: قانون فرم نرمال اول (1NF)\n۲) خواسته سوال: تعریف اتمیک بودن مقادیر\n۳) منطق پاسخ درست: 1NF می‌گوید هر سلول باید فقط یک مقدار داشته باشد — بدون لیست، بدون گروه تکرار.\n۴) نکات امتحانی/دان‌ها: نمونه نقض: ستون «تلفن» با مقدار «0123, 0456» — این ۱NF را نقض می‌کند. راه‌حل: جدول جداگانه برای تلفن‌ها.",
  },
  {
    id: "db-05",
    question: "Was besagt die zweite Normalform (2NF)?",
    answer:
      "Die zweite Normalform (2NF) setzt 1NF voraus und fordert zusätzlich, dass jedes Nicht-Schlüssel-Attribut vollständig funktional abhängig vom gesamten Primärschlüssel ist — keine Teilabhängigkeiten (partielle Abhängigkeit) sind erlaubt. Dies ist nur relevant, wenn der Primärschlüssel aus mehreren Attributen besteht.",
    explainFa:
      "۱) موضوع سوال: فرم نرمال دوم (2NF)\n۲) خواسته سوال: تعریف وابستگی کامل به کلید\n۳) منطق پاسخ درست: 2NF = 1NF + هر ستون غیرکلیدی باید به تمام کلید اصلی وابسته باشد، نه فقط بخشی از آن. فقط برای کلیدهای مرکب مهم است.\n۴) نکات امتحانی/دان‌ها: مثال نقض: کلید (Bestell-ID, Produkt-ID) ولی نام محصول فقط به Produkt-ID وابسته باشد — این وابستگی جزئی = نقض 2NF.",
  },
  {
    id: "db-06",
    question: "Was besagt die dritte Normalform (3NF)?",
    answer:
      "Die dritte Normalform (3NF) setzt 2NF voraus und fordert, dass kein Nicht-Schlüssel-Attribut transitiv von einem anderen Nicht-Schlüssel-Attribut abhängt. Beispiel-Verstoß: die Spalte 'PLZ' bestimmt 'Ort' — 'Ort' hängt transitiv über 'PLZ' vom Primärschlüssel ab. Lösung: Auslagerung in eine separate Tabelle (PLZ → Ort).",
    explainFa:
      "۱) موضوع سوال: فرم نرمال سوم (3NF)\n۲) خواسته سوال: تعریف وابستگی تراگذر (transitive dependency)\n۳) منطق پاسخ درست: 3NF = 2NF + هیچ ستون غیرکلیدی نباید از طریق ستون غیرکلیدی دیگری به کلید وابسته باشد.\n۴) نکات امتحانی/دان‌ها: مثال کلاسیک: PLZ تعیین‌کننده Ort است — Ort از طریق PLZ به کلید وابسته است. این وابستگی تراگذر = نقض 3NF.",
  },
  {
    id: "db-07",
    question: "Was sind Anomalien in Datenbanken und welche Arten gibt es?",
    answer:
      "Anomalien entstehen bei schlecht normalisierten Tabellen:\n• Einfügeanomalie: Ein neuer Datensatz lässt sich nicht einfügen, ohne andere unnötige Daten anzugeben.\n• Änderungsanomalie: Eine Änderung muss an mehreren Stellen gemacht werden und kann inkonsistent bleiben.\n• Löschanomalie: Beim Löschen eines Datensatzes gehen andere wichtige Informationen unbeabsichtigt verloren.\nNormalisierung beseitigt diese Anomalien.",
    explainFa:
      "۱) موضوع سوال: ناهنجاری‌های پایگاه داده (Anomalien)\n۲) خواسته سوال: سه نوع ناهنجاری و دلیل وجودشان\n۳) منطق پاسخ درست: ناهنجاری = مشکلاتی که در جداول نرمال‌سازی‌نشده پیش می‌آید — درج، تغییر، حذف.\n۴) نکات امتحانی/دان‌ها: Einfüge = نمی‌توانی بدون داده اضافی درج کنی؛ Änderungs = باید چند جا ویرایش کنی؛ Lösch = با حذف، داده مهم هم می‌رود.",
  },
  {
    id: "db-08",
    question: "Was ist ein ER-Modell und wozu dient es?",
    answer:
      "Das Entity-Relationship-Modell (ER-Modell) ist ein konzeptionelles Datenmodell zur grafischen Darstellung von Datenstrukturen. Es zeigt Entitäten (z. B. Kunde, Produkt), ihre Attribute und die Beziehungen (Relationen) zwischen ihnen. Das ER-Modell dient als Vorstufe zum relationalen Datenbankschema und ermöglicht eine sprachunabhängige Kommunikation zwischen Entwicklern und Fachbereichen.",
    explainFa:
      "۱) موضوع سوال: مدل ER (Entity-Relationship)\n۲) خواسته سوال: تعریف و هدف مدل ER\n۳) منطق پاسخ درست: ER = نقشه مفهومی پایگاه داده. موجودیت‌ها (Entity)، ویژگی‌ها (Attribute) و روابط (Relationship) را نشان می‌دهد.\n۴) نکات امتحانی/دان‌ها: مستطیل = Entity، بیضی = Attribute، لوزی = Relationship — این نمادها را حفظ کنید.",
  },
  {
    id: "db-09",
    question: "Was bedeuten die Kardinalitäten 1:1, 1:n und m:n?",
    answer:
      "Kardinalitäten beschreiben die Anzahl der Beziehungen zwischen Entitäten:\n• 1:1 — ein Datensatz ist genau mit einem anderen verknüpft (z. B. Person ↔ Reisepass).\n• 1:n — ein Datensatz ist mit mehreren verknüpft (z. B. Kunde → viele Bestellungen).\n• m:n — viele Datensätze stehen mit vielen anderen in Beziehung (z. B. Schüler ↔ Kurse). m:n-Beziehungen werden durch eine Zwischentabelle (Verknüpfungstabelle) aufgelöst.",
    explainFa:
      "۱) موضوع سوال: کاردینالیتی در مدل ER\n۲) خواسته سوال: تعریف انواع روابط 1:1، 1:n، m:n\n۳) منطق پاسخ درست: کاردینالیتی تعداد رابطه بین موجودیت‌ها را نشان می‌دهد. m:n نیاز به جدول واسط دارد.\n۴) نکات امتحانی/دان‌ها: مثال m:n = دانش‌آموز ↔ درس. راه‌حل: جدول «ثبت‌نام» با دو foreign key.",
  },
  {
    id: "db-10",
    question: "Wie ist ein SELECT-Statement aufgebaut?",
    answer:
      "Ein SELECT-Statement hat folgende Grundstruktur:\nSELECT Spalten FROM Tabelle WHERE Bedingung GROUP BY Spalte HAVING Aggregatbedingung ORDER BY Spalte LIMIT Anzahl;\nDie Reihenfolge der Klauseln ist fest. WHERE filtert Zeilen vor der Aggregation, HAVING filtert nach der Aggregation (bei GROUP BY). Beispiel: SELECT name, COUNT(*) FROM kunden GROUP BY name HAVING COUNT(*) > 1 ORDER BY name;",
    explainFa:
      "۱) موضوع سوال: ساختار دستور SELECT در SQL\n۲) خواسته سوال: ترتیب صحیح کلمات کلیدی SELECT\n۳) منطق پاسخ درست: SELECT → FROM → WHERE → GROUP BY → HAVING → ORDER BY → LIMIT. این ترتیب ثابت است.\n۴) نکات امتحانی/دان‌ها: WHERE قبل از گروه‌بندی فیلتر می‌کند؛ HAVING بعد از گروه‌بندی — این تفاوت مهم است.",
  },
  {
    id: "db-11",
    question: "Was ist der Unterschied zwischen WHERE und HAVING in SQL?",
    answer:
      "WHERE filtert Zeilen vor der Gruppenbildung (GROUP BY) — es kann nicht auf Aggregatfunktionen zugreifen. HAVING filtert Gruppen nach der Aggregation — es wird zusammen mit GROUP BY verwendet und kann Aggregatfunktionen wie COUNT, SUM, AVG nutzen. Beispiel: SELECT abteilung, AVG(gehalt) FROM mitarbeiter GROUP BY abteilung HAVING AVG(gehalt) > 3000;",
    explainFa:
      "۱) موضوع سوال: تفاوت WHERE و HAVING\n۲) خواسته سوال: زمان استفاده از هر کدام\n۳) منطق پاسخ درست: WHERE = فیلتر ردیف‌ها (قبل از GROUP BY)؛ HAVING = فیلتر گروه‌ها (بعد از GROUP BY). WHERE نمی‌تواند روی توابع تجمعی (COUNT, AVG) کار کند.\n۴) نکات امتحانی/دان‌ها: قانون: اگر COUNT یا AVG دارید → HAVING؛ اگر ستون ساده → WHERE.",
  },
  {
    id: "db-12",
    question: "Was ist ein JOIN und wie unterscheiden sich INNER JOIN und LEFT JOIN?",
    answer:
      "Ein JOIN verbindet zwei Tabellen anhand eines gemeinsamen Schlüssels.\n• INNER JOIN: gibt nur Zeilen zurück, die in beiden Tabellen eine Übereinstimmung haben.\n• LEFT JOIN (LEFT OUTER JOIN): gibt alle Zeilen der linken Tabelle zurück, auch wenn keine Übereinstimmung in der rechten Tabelle existiert (rechte Seite dann NULL).\nBeispiel: SELECT k.name, b.betrag FROM kunden k LEFT JOIN bestellungen b ON k.id = b.kunden_id;",
    explainFa:
      "۱) موضوع سوال: انواع JOIN در SQL\n۲) خواسته سوال: تفاوت INNER JOIN و LEFT JOIN\n۳) منطق پاسخ درست: INNER JOIN = فقط ردیف‌های مشترک؛ LEFT JOIN = تمام ردیف‌های جدول چپ + اگر تطابق نبود NULL.\n۴) نکات امتحانی/دان‌ها: مثال: «همه مشتریان حتی بدون سفارش» = LEFT JOIN. «فقط مشتریانی که سفارش دارند» = INNER JOIN.",
  },
  {
    id: "db-13",
    question: "Wofür werden GROUP BY und Aggregatfunktionen verwendet?",
    answer:
      "GROUP BY fasst Zeilen mit gleichem Wert in einer Spalte zu Gruppen zusammen. Aggregatfunktionen berechnen einen Wert pro Gruppe:\n• COUNT(*) — zählt Zeilen\n• SUM(spalte) — summiert\n• AVG(spalte) — Durchschnitt\n• MAX/MIN(spalte) — Maximum/Minimum\nIn der SELECT-Liste dürfen nur gruppierte Spalten und Aggregatfunktionen stehen. Alle anderen Spalten müssen in GROUP BY enthalten sein.",
    explainFa:
      "۱) موضوع سوال: GROUP BY و توابع تجمعی\n۲) خواسته سوال: نحوه استفاده و توابع اصلی\n۳) منطق پاسخ درست: GROUP BY ردیف‌ها را بر اساس ستون گروه‌بندی می‌کند. COUNT, SUM, AVG, MAX, MIN روی هر گروه اعمال می‌شوند.\n۴) نکات امتحانی/دان‌ها: قانون مهم: در SELECT فقط ستون‌هایی مجاز هستند که یا در GROUP BY هستند یا درون تابع تجمعی.",
  },
  {
    id: "db-14",
    question: "Was sind DML, DDL und DCL in SQL?",
    answer:
      "SQL-Befehle werden in drei Kategorien eingeteilt:\n• DDL (Data Definition Language): Strukturdefinition — CREATE TABLE, ALTER TABLE, DROP TABLE\n• DML (Data Manipulation Language): Datenmanipulation — SELECT, INSERT, UPDATE, DELETE\n• DCL (Data Control Language): Zugriffssteuerung — GRANT, REVOKE\nEinige zählen auch TCL (Transaction Control Language) dazu: COMMIT, ROLLBACK, SAVEPOINT.",
    explainFa:
      "۱) موضوع سوال: دسته‌بندی دستورات SQL (DML/DDL/DCL)\n۲) خواسته سوال: تعریف و مثال هر دسته\n۳) منطق پاسخ درست: DDL = تعریف ساختار (CREATE, ALTER, DROP)؛ DML = دستکاری داده (SELECT, INSERT, UPDATE, DELETE)؛ DCL = کنترل دسترسی (GRANT, REVOKE).\n۴) نکات امتحانی/دان‌ها: SELECT هم DML است نه DDL — این اشتباه رایج است. TCL = COMMIT/ROLLBACK جداگانه است.",
  },
  {
    id: "db-15",
    question: "Was ist eine Transaktion und was bedeutet ACID?",
    answer:
      "Eine Transaktion ist eine logisch zusammengehörige Einheit von Datenbankoperationen, die entweder vollständig ausgeführt oder vollständig zurückgerollt wird. ACID steht für:\n• Atomarität (Atomicity): alles oder nichts\n• Konsistenz (Consistency): DB bleibt in einem gültigen Zustand\n• Isolation: parallele Transaktionen beeinflussen sich nicht\n• Dauerhaftigkeit (Durability): committed Änderungen bleiben erhalten\nBeispiel: Eine Banküberweisung muss atomar sein — Abbuchung und Gutschrift dürfen nur gemeinsam gelten.",
    explainFa:
      "۱) موضوع سوال: تراکنش و اصول ACID\n۲) خواسته سوال: تعریف تراکنش و معنای هر حرف ACID\n۳) منطق پاسخ درست: تراکنش = مجموعه عملیات که یا همه اجرا می‌شوند یا هیچ‌کدام. ACID: Atomicity (همه یا هیچ)، Consistency (پایگاه داده معتبر بماند)، Isolation (تراکنش‌های موازی تداخل ندارند)، Durability (تغییرات ذخیره می‌مانند).\n۴) نکات امتحانی/دان‌ها: مثال انتقال بانکی — برداشت و واریز باید هر دو یا هیچ‌کدام انجام شوند = Atomicity.",
  },
  {
    id: "db-16",
    question: "Was ist ein Index in einer Datenbank?",
    answer:
      "Ein Index ist eine Datenstruktur, die das schnelle Auffinden von Datensätzen ohne vollständigen Tabellendurchlauf (Full Table Scan) ermöglicht — ähnlich wie ein Stichwortverzeichnis im Buch. Indizes beschleunigen SELECT-Abfragen auf großen Tabellen erheblich, verlangsamen aber INSERT, UPDATE und DELETE, da der Index aktualisiert werden muss. Sie belegen zusätzlichen Speicherplatz.",
    explainFa:
      "۱) موضوع سوال: Index در پایگاه داده\n۲) خواسته سوال: تعریف Index و مزایا/معایب آن\n۳) منطق پاسخ درست: Index = ساختار داده‌ای که جستجو را سریع می‌کند — مثل فهرست کتاب. SELECT سریع‌تر، اما INSERT/UPDATE/DELETE کندتر می‌شوند.\n۴) نکات امتحانی/دان‌ها: Index روی ستون‌هایی که زیاد در WHERE یا JOIN استفاده می‌شوند مفید است. روی ستون‌های پرتغییر ممکن است ضرر داشته باشد.",
  },
  {
    id: "db-17",
    question: "Was ist eine View (Sicht) in SQL?",
    answer:
      "Eine View ist eine gespeicherte SELECT-Abfrage, die wie eine virtuelle Tabelle verwendet werden kann. Sie enthält keine eigenen Daten, sondern zeigt stets aktuelle Daten aus den Basistabellen. Views werden verwendet zur Vereinfachung komplexer Abfragen, zur Zugriffskontrolle (Benutzer sehen nur bestimmte Spalten/Zeilen) und zur Kapselung von Geschäftslogik. Beispiel: CREATE VIEW aktive_kunden AS SELECT * FROM kunden WHERE aktiv = 1;",
    explainFa:
      "۱) موضوع سوال: View (دیدگاه مجازی) در SQL\n۲) خواسته سوال: تعریف View و کاربرد آن\n۳) منطق پاسخ درست: View = یک SELECT ذخیره‌شده که مثل جدول استفاده می‌شود اما داده خودش ندارد — داده را از جداول اصلی می‌گیرد.\n۴) نکات امتحانی/دان‌ها: View داده ذخیره نمی‌کند — همیشه آخرین داده را نشان می‌دهد. برای کنترل دسترسی مفید است: کاربر فقط View می‌بیند نه جدول اصلی.",
  },
  {
    id: "db-18",
    question: "Was bedeutet NULL in SQL und wie geht man damit um?",
    answer:
      "NULL bedeutet in SQL 'unbekannt' oder 'kein Wert vorhanden' — es ist kein Leerzeichen oder 0. NULL ist nicht gleich NULL (NULL = NULL ergibt UNKNOWN). Vergleiche mit NULL müssen mit IS NULL oder IS NOT NULL gemacht werden. Aggregatfunktionen wie COUNT(*) zählen NULL-Werte mit, COUNT(spalte) ignoriert NULL. COALESCE(spalte, 'Standardwert') kann NULL durch einen Standardwert ersetzen.",
    explainFa:
      "۱) موضوع سوال: NULL در SQL\n۲) خواسته سوال: معنای NULL و نحوه کار با آن\n۳) منطق پاسخ درست: NULL = «ناشناخته» نه صفر یا رشته خالی. NULL = NULL نتیجه UNKNOWN می‌دهد. برای بررسی: IS NULL یا IS NOT NULL.\n۴) نکات امتحانی/دان‌ها: WHERE spalte = NULL کار نمی‌کند — باید WHERE spalte IS NULL بنویسید. COALESCE = جایگزینی NULL با مقدار پیش‌فرض.",
  },
  {
    id: "db-19",
    question: "Was sind Constraints in SQL und welche gibt es?",
    answer:
      "Constraints sind Einschränkungen für Spaltenwerte zur Sicherung der Datenintegrität:\n• PRIMARY KEY: eindeutige ID, kein NULL\n• FOREIGN KEY: Verweis auf Primärschlüssel, Referenzielle Integrität\n• UNIQUE: alle Werte in der Spalte eindeutig\n• NOT NULL: Pflichtfeld, kein NULL erlaubt\n• CHECK: benutzerdefinierte Bedingung (z. B. CHECK(alter >= 18))\n• DEFAULT: Standardwert wenn kein Wert angegeben",
    explainFa:
      "۱) موضوع سوال: محدودیت‌های SQL (Constraints)\n۲) خواسته سوال: انواع Constraint و کاربردشان\n۳) منطق پاسخ درست: Constraint = قانونی که داده‌های نامعتبر را رد می‌کند. PRIMARY KEY، FOREIGN KEY، UNIQUE، NOT NULL، CHECK، DEFAULT — هر کدام یک هدف دارند.\n۴) نکات امتحانی/دان‌ها: CHECK می‌تواند قواعد دلخواه تعریف کند مثل سن بزرگتر از 18. PRIMARY KEY = ضمناً UNIQUE + NOT NULL.",
  },
  {
    id: "db-20",
    question: "Wozu werden ORDER BY und DISTINCT in SQL verwendet?",
    answer:
      "ORDER BY sortiert das Ergebnis einer Abfrage nach einer oder mehreren Spalten. Standardmäßig aufsteigend (ASC), mit DESC absteigend. Beispiel: SELECT name FROM kunden ORDER BY name DESC;\nDISTINCT entfernt doppelte Zeilen aus dem Ergebnis. Beispiel: SELECT DISTINCT stadt FROM kunden; — liefert jede Stadt nur einmal.\nBeide Klauseln können kombiniert werden: SELECT DISTINCT stadt FROM kunden ORDER BY stadt;",
    explainFa:
      "۱) موضوع سوال: ORDER BY و DISTINCT در SQL\n۲) خواسته سوال: کاربرد و ترکیب این دو دستور\n۳) منطق پاسخ درست: ORDER BY = مرتب‌سازی (پیش‌فرض ASC، با DESC نزولی)؛ DISTINCT = حذف ردیف‌های تکراری.\n۴) نکات امتحانی/دان‌ها: DISTINCT روی کل ردیف عمل می‌کند نه فقط یک ستون. ORDER BY همیشه آخرین کلوز است.",
  },
  {
    id: "db-21",
    question: "Was ist eine Unterabfrage (Subquery) in SQL?",
    answer:
      "Eine Unterabfrage (Subquery) ist eine SELECT-Abfrage, die innerhalb einer anderen SQL-Abfrage eingebettet ist. Sie kann in WHERE, FROM oder SELECT verwendet werden. Beispiel in WHERE: SELECT name FROM kunden WHERE id IN (SELECT kunden_id FROM bestellungen WHERE betrag > 100); Unterabfragen können korreliert (referenzieren die äußere Abfrage) oder nicht korreliert sein.",
    explainFa:
      "۱) موضوع سوال: زیرپرس‌وجو (Subquery) در SQL\n۲) خواسته سوال: تعریف و کاربرد Subquery\n۳) منطق پاسخ درست: Subquery = یک SELECT درون SELECT دیگر. می‌تواند در WHERE، FROM یا SELECT باشد.\n۴) نکات امتحانی/دان‌ها: IN (Subquery) = آیا مقدار در نتیجه زیرپرس‌وجو هست؟ EXISTS(Subquery) = آیا نتیجه‌ای وجود دارد؟ هر دو رایج هستند.",
  },
  {
    id: "db-22",
    question: "Was ist der Unterschied zwischen SQL und NoSQL?",
    answer:
      "SQL-Datenbanken (relational) speichern Daten in strukturierten Tabellen mit festem Schema, unterstützen Joins und ACID-Transaktionen. NoSQL-Datenbanken (nicht-relational) sind flexibler im Schema und speichern Daten als Dokumente (MongoDB), Schlüssel-Wert-Paare (Redis), Spalten (Cassandra) oder Graphen (Neo4j). NoSQL skaliert oft besser horizontal und eignet sich für große, unstrukturierte Datenmengen. SQL ist besser für komplexe Abfragen und strikte Konsistenz.",
    explainFa:
      "۱) موضوع سوال: تفاوت SQL و NoSQL\n۲) خواسته سوال: مزایا و معایب هر رویکرد\n۳) منطق پاسخ درست: SQL = ساختار ثابت، جداول، ACID، JOIN. NoSQL = انعطاف در schema، مقیاس‌پذیری افقی، انواع مختلف ذخیره‌سازی.\n۴) نکات امتحانی/دان‌ها: NoSQL به معنای «بدون SQL» نیست — بلکه «Not Only SQL» است. MongoDB = سند (Document)، Redis = کلید-مقدار (Key-Value).",
  },
  {
    id: "db-23",
    question: "Welche Arten der Datensicherung (Backup) gibt es?",
    answer:
      "Es gibt drei Hauptarten der Datensicherung:\n• Vollsicherung: alle Daten werden gesichert — einfach wiederherzustellen, aber speicherintensiv und zeitaufwändig.\n• Differentielle Sicherung: alle Änderungen seit der letzten Vollsicherung — schneller als Voll, Wiederherstellung braucht Voll + letztes Differential.\n• Inkrementelle Sicherung: nur Änderungen seit dem letzten Backup jeder Art — am schnellsten, aber Wiederherstellung braucht alle Inkremente.\nEmpfehlung: 3-2-1-Regel (3 Kopien, 2 Medien, 1 extern).",
    explainFa:
      "۱) موضوع سوال: انواع پشتیبان‌گیری (Backup)\n۲) خواسته سوال: تفاوت Voll، differenziell و inkrementell\n۳) منطق پاسخ درست: Vollsicherung = همه داده‌ها؛ Differenziell = از آخرین کامل؛ Inkrementell = از آخرین هر نوع. بازیابی: کامل از Voll+diff؛ پیچیده‌ترین از inkrementell.\n۴) نکات امتحانی/دان‌ها: قانون 3-2-1 = 3 نسخه، 2 نوع رسانه، 1 نسخه خارج از محل — این قانون را حفظ کنید.",
  },
  {
    id: "db-24",
    question: "Was ist der Unterschied zwischen Datenkonsistenz und Datenintegrität?",
    answer:
      "Datenkonsistenz bedeutet, dass die Daten widerspruchsfrei und aktuell sind — z. B. ein Kontostand stimmt nach jeder Transaktion. Datenintegrität ist ein umfassenderer Begriff und umfasst:\n• Entitätsintegrität: jede Zeile ist eindeutig identifizierbar (Primärschlüssel)\n• Referenzielle Integrität: Fremdschlüssel zeigen auf existierende Datensätze\n• Domänenintegrität: Werte liegen im erlaubten Bereich (Datentyp, Constraints)\nBeide Konzepte sichern die Verlässlichkeit der Datenbank.",
    explainFa:
      "۱) موضوع سوال: تفاوت Datenkonsistenz و Datenintegrität\n۲) خواسته سوال: تعریف دقیق هر مفهوم\n۳) منطق پاسخ درست: Konsistenz = داده‌ها بدون تناقض هستند. Integrität = مفهوم گسترده‌تر: موجودیت، ارجاع و دامنه همه معتبرند.\n۴) نکات امتحانی/دان‌ها: Konsistenz زیرمجموعه Integrität است. ACID حرف C = Consistency = حفظ قواعد Integrität در تراکنش.",
  },
  {
    id: "db-25",
    question: "Wie überführt man ein ER-Modell in ein relationales Schema?",
    answer:
      "Die Überführung erfolgt nach folgenden Regeln:\n• Jede Entität wird zu einer Tabelle, Attribute werden zu Spalten, der Primärschlüssel wird übernommen.\n• 1:n-Beziehung: der Fremdschlüssel wird auf der 'n-Seite' eingefügt.\n• m:n-Beziehung: wird durch eine Zwischentabelle mit den Primärschlüsseln beider Entitäten aufgelöst.\n• 1:1-Beziehung: Fremdschlüssel in einer der Tabellen oder Zusammenführung.\nBeziehungsattribute wandern in die Zwischentabelle (bei m:n).",
    explainFa:
      "۱) موضوع سوال: تبدیل مدل ER به schema رابطه‌ای\n۲) خواسته سوال: قواعد تبدیل Entity، Attribute و Relationship\n۳) منطق پاسخ درست: هر Entity = یک جدول؛ 1:n = foreign key در سمت n؛ m:n = جدول واسط با دو foreign key.\n۴) نکات امتحانی/دان‌ها: ویژگی‌های رابطه m:n در جدول واسط قرار می‌گیرند. برای 1:1 می‌توان دو جدول را ادغام کرد.",
  },
];
