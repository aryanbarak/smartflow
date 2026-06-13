export interface ErgQuestion {
  id: string;
  question: string; // Deutsch
  answer: string;   // Deutsch
  explainFa: string; // Farsi — feste Vorlage
}

export const OOP_QUESTIONS: ReadonlyArray<ErgQuestion> = [
  {
    id: "oop-01",
    question: "Was ist der Unterschied zwischen einer Klasse und einem Objekt?",
    answer:
      "Eine Klasse ist der Bauplan (die Schablone), der Attribute und Methoden definiert. Ein Objekt ist eine konkrete Instanz dieser Klasse zur Laufzeit mit eigenen Attributwerten. Aus einer Klasse können beliebig viele Objekte erzeugt werden, z. B. mit dem Schlüsselwort new: Auto a1 = new Auto();",
    explainFa:
      "۱) موضوع سوال: مفهوم پایه‌ای شیءگرایی — رابطه‌ی بین Klasse (کلاس) و Objekt (شیء).\n۲) خواسته سوال: باید تعریف هرکدام + یک مثال کوتاه با کد بنویسی.\n۳) منطق پاسخ درست: کلاس فقط یک نقشه (Bauplan/Schablone) است و به‌تنهایی داده‌ی واقعی ندارد. با new یک Objekt در حافظه (Heap) ساخته می‌شود که مقادیر مشخص برای هر Attribut دارد. از یک کلاس می‌توان چندین شیء مستقل ساخت که هرکدام وضعیت (Zustand) جداگانه دارند.\n۴) نکات امتحانی/دان‌ها:\n- کلمه‌ی Bauplan را حتماً بنویس — IHK همین واژه را انتظار دارد.\n- مثال کد با new نمره‌ی اضافه دارد.\n- دان رایج: «کلاس مجموعه‌ای از اشیاء است» — غلط است؛ کلاس نقشه است نه مجموعه.",
  },
  {
    id: "oop-02",
    question: "Was versteht man unter Kapselung (Datenkapselung) und welchen Vorteil bietet sie?",
    answer:
      "Kapselung bedeutet, dass Attribute einer Klasse nach außen verborgen werden (meist private) und der Zugriff nur über öffentliche Methoden (Getter/Setter) erfolgt. Vorteil: Die interne Implementierung kann geändert werden, ohne dass externer Code angepasst werden muss. Außerdem können in Settern Validierungen durchgeführt werden, was ungültige Zustände verhindert.",
    explainFa:
      "۱) موضوع سوال: اصل Kapselung (کپسوله‌سازی/پنهان‌سازی داده) در OOP.\n۲) خواسته سوال: تعریف + حداقل یک مزیت مشخص.\n۳) منطق پاسخ درست: Attribute‌ها را private می‌کنیم تا از خارج مستقیم قابل تغییر نباشند. دسترسی فقط از طریق Getter (خواندن) و Setter (نوشتن) امکان‌پذیر است. در Setter می‌توان اعتبارسنجی (Validierung) انجام داد — مثلاً سن نمی‌تواند منفی باشد. اگر ساختار داخلی تغییر کند، کد خارجی نیازی به تغییر ندارد.\n۴) نکات امتحانی/دان‌ها:\n- بگو که private + Getter/Setter = Kapselung.\n- حتماً مزیت «Validierung در Setter» را ذکر کن.\n- دان: public Attribute = بدون Kapselung؛ هر کسی می‌تواند مستقیم مقدار غلط بدهد.",
  },
  {
    id: "oop-03",
    question: "Was ist Vererbung und welche Vorteile bietet sie?",
    answer:
      "Vererbung bedeutet, dass eine Unterklasse (Subklasse) Attribute und Methoden einer Oberklasse (Superklasse) übernimmt — in Java mit extends. Die Unterklasse kann eigene Attribute/Methoden hinzufügen oder geerbte Methoden überschreiben. Vorteile: Wiederverwendung von Code, Vermeidung von Redundanz, zentrale Wartung in der Oberklasse und eine logische Ist-ein-Beziehung (z. B. PKW ist ein Fahrzeug).",
    explainFa:
      "۱) موضوع سوال: اصل Vererbung (وراثت/ارث‌بری) در OOP.\n۲) خواسته سوال: تعریف + مزایا + مثال از Ist-ein-Beziehung.\n۳) منطق پاسخ درست: Unterklasse با کلمه‌ی extends از Oberklasse ارث می‌برد. همه‌ی Attribute و Methode‌های غیر-private به Unterklasse منتقل می‌شوند. Unterklasse می‌تواند موارد اضافه کند یا متدهای موروثی را override کند. مزیت اصلی: کد تکراری حذف می‌شود و تغییرات مرکزی در Oberklasse بر همه‌ی Unterklasse‌ها اثر می‌گذارد.\n۴) نکات امتحانی/دان‌ها:\n- کلمه‌ی Ist-ein (is-a) حتماً ذکر شود: Hund ist ein Tier.\n- فرق Vererbung و Komposition: «Ist-ein» در برابر «Hat-ein».\n- در Java فقط Einfachvererbung مجاز است (یک کلاس فقط از یک کلاس ارث می‌برد).",
  },
  {
    id: "oop-04",
    question: "Was ist der Unterschied zwischen Überladen (Overloading) und Überschreiben (Overriding)?",
    answer:
      "Überladen: Mehrere Methoden mit demselben Namen, aber unterschiedlicher Parameterliste innerhalb derselben Klasse — die Auswahl erfolgt zur Compile-Zeit (statische Bindung). Überschreiben: Eine Unterklasse definiert eine geerbte Methode mit identischer Signatur neu — die Auswahl erfolgt zur Laufzeit (dynamische Bindung). Overriding ist die Grundlage der Polymorphie.",
    explainFa:
      "۱) موضوع سوال: تفاوت Überladen (Overloading) و Überschreiben (Overriding).\n۲) خواسته سوال: باید هر دو تعریف شوند و تفاوت کلیدی مشخص شود.\n۳) منطق پاسخ درست: Überladen = چند متد هم‌نام در همان کلاس با امضای (Signatur) متفاوت؛ انتخاب در Compile-Zeit (statische Bindung) انجام می‌شود. Überschreiben = Unterklasse متد موروثی را با همان امضا از نو تعریف می‌کند؛ انتخاب در Laufzeit (dynamische Bindung) انجام می‌شود و پایه‌ی Polymorphie است.\n۴) نکات امتحانی/دان‌ها:\n- کلیدواژه: statische vs. dynamische Bindung — خیلی مهم!\n- Overloading در همان کلاس؛ Overriding در Unterklasse.\n- دان: Overloading با تغییر نوع بازگشتی تنها امکان‌پذیر نیست؛ حتماً Parameterliste باید فرق داشته باشد.",
  },
  {
    id: "oop-05",
    question: "Was ist Polymorphie? Erklären Sie mit einem Beispiel.",
    answer:
      "Polymorphie (Vielgestaltigkeit) bedeutet, dass eine Referenzvariable vom Typ der Oberklasse Objekte verschiedener Unterklassen aufnehmen kann und beim Methodenaufruf zur Laufzeit die jeweils überschriebene Methode der konkreten Unterklasse ausgeführt wird. Beispiel: Tier t = new Hund(); t.lautGeben(); ruft die Hund-Implementierung auf, obwohl die Variable vom Typ Tier ist.",
    explainFa:
      "۱) موضوع سوال: اصل Polymorphie (چندریختی/چندشکلی) در OOP.\n۲) خواسته سوال: تعریف + مثال کد.\n۳) منطق پاسخ درست: یک متغیر از نوع Oberklasse می‌تواند شیء‌های Unterklasse‌های مختلف نگه دارد. وقتی متدی صدا زده می‌شود، Java در زمان اجرا (Laufzeit) تصمیم می‌گیرد که کدام پیاده‌سازی اجرا شود — این dynamische Bindung است. پایه‌اش Vererbung + Überschreiben است.\n۴) نکات امتحانی/دان‌ها:\n- مثال: Tier t = new Hund(); — متغیر از نوع Tier ولی شیء Hund.\n- کلمه‌ی Vielgestaltigkeit معنی Polymorphie است — می‌توانی در تعریف بنویسی.\n- دان: Overloading را با Polymorphie قاطی نکن؛ Polymorphie مربوط به Overriding است.",
  },
  {
    id: "oop-06",
    question: "Was ist eine abstrakte Klasse?",
    answer:
      "Eine abstrakte Klasse (Schlüsselwort abstract) kann nicht instanziiert werden — es können keine Objekte direkt von ihr erzeugt werden. Sie kann sowohl fertig implementierte Methoden als auch abstrakte Methoden (ohne Rumpf) enthalten, die jede nicht-abstrakte Unterklasse implementieren muss. Sie dient als gemeinsame Basis für verwandte Klassen.",
    explainFa:
      "۱) موضوع سوال: مفهوم abstrakte Klasse (کلاس انتزاعی) در Java.\n۲) خواسته سوال: تعریف + چه چیزی می‌تواند داشته باشد + محدودیت اصلی.\n۳) منطق پاسخ درست: با کلمه‌ی abstract تعریف می‌شود. نمی‌توان مستقیم از آن شیء ساخت (new Tier() ممنوع). می‌تواند هم متدهای کامل داشته باشد هم متدهای abstract (بدون بدنه). هر Unterklasse غیر-abstract باید تمام متدهای abstract را پیاده‌سازی کند.\n۴) نکات امتحانی/دان‌ها:\n- تفاوت کلیدی با Interface: abstrakte Klasse می‌تواند Attribute با Zustand و Konstruktor داشته باشد.\n- اگر Unterklasse همه‌ی متدهای abstract را پیاده نکند، خودش هم abstract می‌شود.\n- مثال: Tier است abstract؛ Hund و Katze extend می‌کنند.",
  },
  {
    id: "oop-07",
    question: "Was ist der Unterschied zwischen einer abstrakten Klasse und einem Interface?",
    answer:
      "Abstrakte Klasse: kann Attribute mit Zustand, Konstruktoren und implementierte Methoden enthalten; eine Klasse kann nur von einer Klasse erben (extends). Interface: definiert einen reinen Vertrag aus Methodensignaturen (und Konstanten); eine Klasse kann beliebig viele Interfaces implementieren (implements). Faustregel: abstrakte Klasse für eine Ist-ein-Beziehung mit gemeinsamem Code, Interface für eine Kann-Beziehung (Fähigkeit).",
    explainFa:
      "۱) موضوع سوال: تفاوت abstrakte Klasse و Interface — یکی از مهم‌ترین سوالات OOP در IHK.\n۲) خواسته سوال: باید سه‌چهار تفاوت کلیدی بنویسی.\n۳) منطق پاسخ درست:\n- Interface: فقط Methodensignaturen (قرارداد)؛ بدون پیاده‌سازی؛ یک کلاس چندین interface پیاده می‌کند (implements).\n- Abstrakte Klasse: می‌تواند Attribute، Konstruktor و متدهای کامل داشته باشد؛ فقط Einfachvererbung (extends).\n- قانون طلایی: Ist-ein → abstrakte Klasse؛ Kann-etwas → Interface.\n۴) نکات امتحانی/دان‌ها:\n- مثال: Tier (abstrakt) ← Hund؛ Comparable (Interface) ← String, Integer.\n- Java 8+: Interface می‌تواند default-Methoden داشته باشد — اگر بپرسند بگو.\n- دان: Interface نمی‌تواند Konstruktor داشته باشد.",
  },
  {
    id: "oop-08",
    question: "Was ist ein Konstruktor und welche Eigenschaften hat er?",
    answer:
      "Ein Konstruktor ist eine spezielle Methode, die beim Erzeugen eines Objekts mit new automatisch aufgerufen wird und das Objekt initialisiert. Er trägt denselben Namen wie die Klasse und hat keinen Rückgabetyp (auch nicht void). Konstruktoren können überladen werden; definiert man keinen, erzeugt der Compiler einen parameterlosen Standardkonstruktor.",
    explainFa:
      "۱) موضوع سوال: Konstruktor (سازنده) در Java — ویژگی‌ها و رفتار آن.\n۲) خواسته سوال: تعریف + سه ویژگی مشخص.\n۳) منطق پاسخ درست: Konstruktor نام کلاس را دارد، نوع بازگشتی ندارد (حتی void نه)، با new خودکار صدا زده می‌شود. می‌تواند Überladen (overload) شود. اگر هیچ سازنده‌ای تعریف نشود، کامپایلر یک Standardkonstruktor بدون پارامتر می‌سازد. اگر سازنده‌ای با پارامتر تعریف شود، Standardkonstruktor دیگر خودکار ساخته نمی‌شود.\n۴) نکات امتحانی/دان‌ها:\n- «هیچ Rückgabetyp ندارد» — حتی void هم نه؛ این تفاوت با متد عادی است.\n- Standardkonstruktor فقط وقتی هیچ Konstruktor نباشد اضافه می‌شود.\n- دان: وقتی سازنده‌ای با پارامتر داری و بدون پارامتر هم می‌خواهی، باید آن را صریح بنویسی.",
  },
  {
    id: "oop-09",
    question: "Was bedeutet das Schlüsselwort static bei Attributen und Methoden?",
    answer:
      "static bedeutet, dass das Attribut bzw. die Methode zur Klasse selbst gehört und nicht zu einem einzelnen Objekt. Ein statisches Attribut (Klassenattribut) existiert genau einmal und wird von allen Objekten geteilt, z. B. ein Zähler für erzeugte Instanzen. Statische Methoden können ohne Objekt über den Klassennamen aufgerufen werden (z. B. Math.max()), dürfen aber nicht direkt auf Instanzattribute zugreifen.",
    explainFa:
      "۱) موضوع سوال: کلمه‌ی کلیدی static در Java — مفهوم و محدودیت.\n۲) خواسته سوال: تفاوت static و non-static + یک مثال.\n۳) منطق پاسخ درست: static به این معناست که Attribut یا Methode به کلاس تعلق دارد، نه به شیء خاص. Statische Attribute یک بار در حافظه وجود دارند و همه‌ی شیء‌ها آن را مشترک دارند. Statische Methode بدون new فراخوانی می‌شود: Math.max(3,5). محدودیت: متد static نمی‌تواند مستقیم به Instanzattribute دسترسی داشته باشد.\n۴) نکات امتحانی/دان‌ها:\n- مثال خوب: private static int anzahl = 0; — شمارنده‌ی تعداد شیء‌های ساخته‌شده.\n- دان: static Methode نمی‌تواند this استفاده کند.\n- در UML: عناصر static زیرخط دارند (underlined).",
  },
  {
    id: "oop-10",
    question: "Welche Sichtbarkeitsmodifikatoren gibt es und was bedeuten sie?",
    answer:
      "private: Zugriff nur innerhalb der eigenen Klasse. (kein Modifikator / package-private): Zugriff innerhalb desselben Pakets. protected: Zugriff im selben Paket und zusätzlich in allen Unterklassen. public: Zugriff von überall. In UML: - (private), # (protected), + (public), ~ (package).",
    explainFa:
      "۱) موضوع سوال: Sichtbarkeitsmodifikatoren (سطح دسترسی) در Java و UML.\n۲) خواسته سوال: چهار سطح دسترسی + نماد UML هرکدام.\n۳) منطق پاسخ درست:\n- private (-): فقط در همان کلاس.\n- package-private (بدون نماد / ~): فقط در همان Package.\n- protected (#): همان Package + تمام Unterklassen.\n- public (+): از همه‌جا.\n۴) نکات امتحانی/دان‌ها:\n- در UML: - private، # protected، + public، ~ package.\n- قانون طلایی: Attribute‌ها private، Methode‌های عمومی public.\n- دان: protected ≠ «فقط در Unterklasse» — در همان Package هم دسترسی دارد.",
  },
  {
    id: "oop-11",
    question: "Was ist der Unterschied zwischen Komposition und Aggregation?",
    answer:
      "Beide beschreiben eine Hat-ein-Beziehung (Teil-Ganzes). Aggregation: Das Teil kann ohne das Ganze existieren — z. B. Student und Universität; UML: leere Raute am Ganzen. Komposition: Das Teil ist existenzabhängig vom Ganzen und wird mit ihm zerstört — z. B. Raum und Gebäude; UML: gefüllte (schwarze) Raute am Ganzen.",
    explainFa:
      "۱) موضوع سوال: تفاوت Komposition و Aggregation در OOP و UML.\n۲) خواسته سوال: تعریف هرکدام + مثال + نماد UML.\n۳) منطق پاسخ درست: هر دو رابطه‌ی Hat-ein (دارد-یک) هستند. Aggregation: بخش می‌تواند مستقل از کل وجود داشته باشد؛ مثال: Student و Universität (دانشگاه بسته می‌شود ولی دانشجو هنوز وجود دارد)؛ نماد UML: لوزی خالی. Komposition: بخش بدون کل وجود ندارد و با حذف کل از بین می‌رود؛ مثال: Raum و Gebäude (اتاق بدون ساختمان معنی ندارد)؛ نماد UML: لوزی پر (سیاه).\n۴) نکات امتحانی/دان‌ها:\n- لوزی همیشه سمت «کل» است نه سمت «بخش».\n- دان: لوزی خالی = Aggregation (ضعیف)؛ لوزی پر = Komposition (قوی/وابستگی وجودی).\n- هر دو Hat-ein هستند، نه Ist-ein (نباید با Vererbung اشتباه گرفته شوند).",
  },
  {
    id: "oop-12",
    question: "Welche Bestandteile hat eine Klasse im UML-Klassendiagramm?",
    answer:
      "Eine Klasse wird als Rechteck mit drei Abschnitten dargestellt: 1. Klassenname (oben, fett; abstrakte Klassen kursiv), 2. Attribute mit Sichtbarkeit und Typ (z. B. - name: String), 3. Methoden/Operationen mit Sichtbarkeit, Parametern und Rückgabetyp (z. B. + getName(): String). Statische Elemente werden unterstrichen.",
    explainFa:
      "۱) موضوع سوال: ساختار کلاس در UML-Klassendiagramm.\n۲) خواسته سوال: سه بخش اصلی + قواعد نمادگذاری.\n۳) منطق پاسخ درست: کلاس = مستطیل با سه بخش. بخش اول: نام کلاس (بولد؛ اگر abstract کج/ایتالیک). بخش دوم: Attribute با فرمت: [نماد] name: Typ مثلاً - name: String. بخش سوم: Methoden با فرمت: [نماد] name(params): Rückgabetyp مثلاً + getName(): String. عناصر static زیرخط دارند.\n۴) نکات امتحانی/دان‌ها:\n- نمادها: - private، + public، # protected، ~ package.\n- interface: با «\\<\\<interface\\>\\>» یا کج در نام مشخص می‌شود.\n- دان: فراموش نکن که ترتیب سه بخش باید حفظ شود: نام / Attribute / Methoden.",
  },
  {
    id: "oop-13",
    question: "Wozu dienen Getter und Setter?",
    answer:
      "Getter und Setter sind öffentliche Methoden für den kontrollierten Zugriff auf private Attribute. Der Getter liefert den Wert zurück (getName()), der Setter setzt ihn (setName(String n)). Vorteile: Im Setter kann validiert werden (z. B. Alter >= 0), Attribute können nur-lesbar gemacht werden (nur Getter), und die interne Darstellung bleibt austauschbar — das setzt das Prinzip der Kapselung um.",
    explainFa:
      "۱) موضوع سوال: Getter و Setter — هدف و مزایا.\n۲) خواسته سوال: تعریف + حداقل دو مزیت.\n۳) منطق پاسخ درست: Getter متد public است که مقدار یک Attribut private را برمی‌گرداند. Setter متد public است که مقدار را تنظیم می‌کند. مزایا: ۱) در Setter می‌توان اعتبارسنجی کرد (alter >= 0)؛ ۲) با فقط Getter داشتن، Attribut فقط‌خواندنی می‌شود؛ ۳) ساختار داخلی در آینده می‌تواند تغییر کند بدون اینکه code خارجی تأثیر بگیرد.\n۴) نکات امتحانی/دان‌ها:\n- این اصل Kapselung را پیاده‌سازی می‌کند — حتماً این ارتباط را ذکر کن.\n- دان: داشتن Getter/Setter با Attribut public فرق دارد — با Setter می‌توانی کنترل داشته باشی.",
  },
  {
    id: "oop-14",
    question: "Was ist ein Interface und wann setzt man es ein?",
    answer:
      "Ein Interface ist ein Vertrag, der ausschließlich Methodensignaturen (und Konstanten) vorgibt — ohne Implementierung. Eine Klasse, die das Interface mit implements einbindet, muss alle Methoden implementieren. Einsatz: wenn unterschiedliche, nicht verwandte Klassen eine gemeinsame Fähigkeit garantieren sollen (z. B. Comparable, Printable) und um lose Kopplung zu erreichen — man programmiert gegen das Interface statt gegen konkrete Klassen.",
    explainFa:
      "۱) موضوع سوال: Interface در Java — مفهوم، کاربرد و زمان استفاده.\n۲) خواسته سوال: تعریف + زمان استفاده + مثال.\n۳) منطق پاسخ درست: Interface یک قرارداد (Vertrag) است که فقط Methodensignaturen را تعریف می‌کند. کلاس‌هایی که implements می‌کنند باید تمام متدها را پیاده‌سازی کنند. وقتی کلاس‌های مختلف و غیرمرتبط باید یک توانایی مشترک داشته باشند، interface مناسب است. هدف: loose Kopplung — برنامه‌نویسی در برابر Interface نه Implementierung.\n۴) نکات امتحانی/دان‌ها:\n- مثال‌های معروف: Comparable, Cloneable, Runnable.\n- قانون: «Kann-etwas» (می‌تواند چیزی انجام دهد) → interface.\n- دان: یک کلاس می‌تواند چندین interface پیاده کند ولی فقط از یک کلاس ارث می‌برد.",
  },
  {
    id: "oop-15",
    question: "Was bewirkt das Schlüsselwort final in Java?",
    answer:
      "final hat drei Einsatzorte: Eine final-Variable kann nach der Initialisierung nicht mehr geändert werden (Konstante, oft mit static kombiniert zu static final). Eine final-Methode kann in Unterklassen nicht überschrieben werden. Eine final-Klasse kann nicht beerbt werden (z. B. String).",
    explainFa:
      "۱) موضوع سوال: کلمه‌ی کلیدی final در Java و سه کاربرد آن.\n۲) خواسته سوال: سه کاربرد final (متغیر، متد، کلاس) با مثال.\n۳) منطق پاسخ درست:\n- final Variable: بعد از مقداردهی اولیه قابل تغییر نیست (ثابت/Konstante)؛ معمولاً با static ترکیب می‌شود: static final double PI = 3.14;\n- final Methode: Unterklasse نمی‌تواند آن را Override کند.\n- final Klasse: نمی‌توان از آن ارث برد؛ مثال: کلاس String در Java.\n۴) نکات امتحانی/دان‌ها:\n- Konstanten با GROSSBUCHSTABEN_MIT_UNTERSTRICH نوشته می‌شوند.\n- دان: final متغیر را غیرقابل تغییر می‌کند، نه شیء را؛ اگر final object باشد، Attribute‌های درون شیء هنوز قابل تغییر هستند.",
  },
  {
    id: "oop-16",
    question: "Was ist der Unterschied zwischen einem Klassenattribut und einem Instanzattribut?",
    answer:
      "Ein Instanzattribut gehört zu einem konkreten Objekt — jedes Objekt hat seine eigene Kopie mit eigenem Wert (z. B. name). Ein Klassenattribut (static) existiert genau einmal pro Klasse und wird von allen Objekten gemeinsam genutzt (z. B. anzahlInstanzen). Änderungen am Klassenattribut sind für alle Objekte sichtbar.",
    explainFa:
      "۱) موضوع سوال: تفاوت Instanzattribut و Klassenattribut (static).\n۲) خواسته سوال: تعریف هر دو + مثال + تفاوت در حافظه.\n۳) منطق پاسخ درست: Instanzattribut: هر شیء کپی مستقل خودش را دارد؛ مثال: name هر Kunde. Klassenattribut (static): فقط یک بار در حافظه وجود دارد و همه‌ی شیء‌ها آن را مشترک می‌بینند؛ مثال: anzahlInstanzen که با هر new بیشتر می‌شود. تغییر Klassenattribut همه‌ی شیء‌ها را تأثیر می‌دهد.\n۴) نکات امتحانی/دان‌ها:\n- Klassenattribut با نام کلاس خوانده می‌شود: Klasse.attribut\n- در UML: Klassenattribute زیرخط دارند.\n- مثال خوب: private static int anzahl = 0; در سازنده ++anzahl;",
  },
  {
    id: "oop-17",
    question: "Was versteht man unter dem Geheimnisprinzip (Information Hiding)?",
    answer:
      "Das Geheimnisprinzip besagt, dass eine Klasse ihre interne Implementierung (Datenstrukturen, Hilfsmethoden) nach außen verbirgt und nur eine klar definierte öffentliche Schnittstelle anbietet. Nutzer der Klasse müssen nur wissen, WAS sie tut, nicht WIE. Dadurch können Interna jederzeit geändert werden, ohne abhängigen Code zu brechen — die Grundlage für wartbare Software.",
    explainFa:
      "۱) موضوع سوال: Geheimnisprinzip (اصل پنهان‌کاری/Information Hiding).\n۲) خواسته سوال: تعریف + رابطه‌اش با Kapselung + مزیت.\n۳) منطق پاسخ درست: کلاس فقط یک رابط عمومی (öffentliche Schnittstelle) ارائه می‌دهد و پیاده‌سازی داخلی را پنهان می‌کند. کاربر فقط باید بداند «چه کاری می‌کند» نه «چطور». اگر پیاده‌سازی داخلی تغییر کند، کد خارجی نیازی به تغییر ندارد — این پایه‌ی نرم‌افزار قابل‌نگهداری است. Kapselung ابزار پیاده‌سازی این اصل است (private + Getter/Setter).\n۴) نکات امتحانی/دان‌ها:\n- Geheimnisprinzip بالاتر از Kapselung است — Kapselung روش است، Geheimnisprinzip اصل.\n- مثال: List.add() — نمی‌دانی چطور ذخیره می‌کند، فقط می‌دانی چه می‌کند.\n- دان: Geheimnisprinzip با امنیت اشتباه گرفته نشود — هدف آن wartbarkeit است.",
  },
  {
    id: "oop-18",
    question: "Was ist Generalisierung und Spezialisierung in der UML?",
    answer:
      "Generalisierung: Gemeinsame Attribute und Methoden mehrerer Klassen werden in eine allgemeinere Oberklasse ausgelagert (Bottom-up, z. B. PKW + LKW → Fahrzeug). Spezialisierung: Aus einer allgemeinen Klasse werden speziellere Unterklassen mit zusätzlichen Eigenschaften abgeleitet (Top-down). Beides beschreibt dieselbe Vererbungsbeziehung aus zwei Richtungen; UML-Notation: Pfeil mit leerem Dreieck zur Oberklasse.",
    explainFa:
      "۱) موضوع سوال: Generalisierung و Spezialisierung در UML — دو جهت نگاه به وراثت.\n۲) خواسته سوال: تعریف هر دو مفهوم + نماد UML.\n۳) منطق پاسخ درست: Generalisierung (Bottom-up): از کلاس‌های مشخص شروع می‌کنیم و ویژگی‌های مشترک را به یک Oberklasse منتقل می‌کنیم؛ مثال: PKW و LKW → Fahrzeug. Spezialisierung (Top-down): از یک کلاس عمومی شروع می‌کنیم و Unterklasse‌های تخصصی‌تر می‌سازیم. هر دو همان رابطه‌ی وراثت را از دو منظر توصیف می‌کنند. نماد UML: فلش با مثلث توخالی از Unterklasse به Oberklasse.\n۴) نکات امتحانی/دان‌ها:\n- فلش UML: از Unterklasse به Oberklasse با مثلث توخالی (بر خلاف Assoziation که فلش معمولی است).\n- دان: جهت فلش در UML اشتباه رایج است — از پایین به بالا رسم می‌شود.",
  },
  {
    id: "oop-19",
    question: "Warum ist Mehrfachvererbung in Java nicht erlaubt und was ist die Alternative?",
    answer:
      "Java erlaubt nur Einfachvererbung bei Klassen, um Mehrdeutigkeiten zu vermeiden — das sogenannte Diamond-Problem: Erben zwei Oberklassen dieselbe Methode, wäre unklar, welche Implementierung gilt. Alternative: Eine Klasse kann beliebig viele Interfaces implementieren, da Interfaces (klassisch) keine Implementierung mitbringen und somit kein Konflikt entsteht.",
    explainFa:
      "۱) موضوع سوال: چرا Mehrfachvererbung در Java مجاز نیست و جایگزین آن چیست.\n۲) خواسته سوال: مشکل + راه‌حل + نام مشکل.\n۳) منطق پاسخ درست: مشکل Diamond-Problem: اگر کلاس C از A و B ارث ببرد و هر دو متد یکسانی داشته باشند، Java نمی‌داند کدام را انتخاب کند. به همین دلیل Java فقط Einfachvererbung برای کلاس‌ها اجازه می‌دهد. جایگزین: یک کلاس می‌تواند چندین Interface پیاده کند (implements A, B, C) چون Interface (به صورت کلاسیک) پیاده‌سازی ندارد و تضادی پیش نمی‌آید.\n۴) نکات امتحانی/دان‌ها:\n- نام مشکل: Diamond-Problem — حتماً ذکر کن.\n- Java 8+: interface می‌تواند default-Method داشته باشد؛ اگر تضادی بود باید override شود.\n- دان: C++ از Mehrfachvererbung پشتیبانی می‌کند ولی Java عمداً آن را حذف کرد.",
  },
  {
    id: "oop-20",
    question: "Was ist der Unterschied zwischen == und equals() beim Objektvergleich?",
    answer:
      "Der Operator == vergleicht bei Objekten die Referenzen — also ob beide Variablen auf dasselbe Objekt im Speicher zeigen (Identität). Die Methode equals() vergleicht (wenn überschrieben) den Inhalt der Objekte (Gleichheit). Beispiel: zwei String-Objekte mit gleichem Text — equals() liefert true, == kann false liefern, wenn es zwei verschiedene Objekte im Heap sind.",
    explainFa:
      "۱) موضوع سوال: تفاوت == (عملگر مقایسه) و equals() برای اشیاء در Java.\n۲) خواسته سوال: تعریف هر دو + مثال با String.\n۳) منطق پاسخ درست: == آدرس حافظه (Referenz) را مقایسه می‌کند — آیا هر دو متغیر به یک شیء در Heap اشاره دارند؟ equals() محتوا را مقایسه می‌کند — آیا محتوای دو شیء یکسان است؟ اگر equals() Override نشود، مثل == رفتار می‌کند. برای String: s1.equals(s2) محتوا؛ s1 == s2 آدرس.\n۴) نکات امتحانی/دان‌ها:\n- برای primitive types (int, double...) هر دو == یکسان رفتار می‌کنند.\n- دان رایج: String s = \"hallo\"; این String Literal است و در String Pool قرار می‌گیرد — ممکن است == true باشد! با new String(\"hallo\") این اتفاق نمی‌افتد.\n- قانون: برای اشیاء همیشه equals() استفاده کن.",
  },
  {
    id: "oop-21",
    question: "Was ist ein Entwurfsmuster (Design Pattern)? Erklären Sie das Singleton-Muster.",
    answer:
      "Ein Entwurfsmuster ist eine bewährte, wiederverwendbare Lösungsschablone für ein häufig auftretendes Entwurfsproblem. Das Singleton-Muster stellt sicher, dass von einer Klasse genau eine Instanz existiert und global zugänglich ist. Umsetzung: privater Konstruktor, privates statisches Attribut für die Instanz und eine öffentliche statische Methode getInstance(), die die Instanz beim ersten Aufruf erzeugt und danach immer dieselbe zurückgibt.",
    explainFa:
      "۱) موضوع سوال: مفهوم Entwurfsmuster (الگوی طراحی) + توضیح Singleton.\n۲) خواسته سوال: تعریف Entwurfsmuster + توضیح کامل Singleton با ساختار پیاده‌سازی.\n۳) منطق پاسخ درست: Entwurfsmuster یک الگوی راه‌حل اثبات‌شده برای مشکلات رایج در طراحی نرم‌افزار است. Singleton: اطمینان از اینکه از یک کلاس دقیقاً یک شیء وجود دارد. پیاده‌سازی: Konstruktor private، یک static Attribut از نوع همان کلاس، متد getInstance() که اگر شیء وجود نداشت می‌سازد وگرنه همان را برمی‌گرداند.\n۴) نکات امتحانی/دان‌ها:\n- Konstruktor private → نمی‌توان با new از خارج شیء ساخت.\n- کاربرد: Logger، Konfiguration، Datenbankverbindung.\n- دان: Singleton در محیط‌های Multi-threading باید با synchronized یا double-checked locking مراقبت شود.",
  },
  {
    id: "oop-22",
    question: "Was bedeuten lose Kopplung (lose Kopplung) und hohe Kohäsion?",
    answer:
      "Lose Kopplung: Klassen/Module sollen möglichst wenige Abhängigkeiten untereinander haben — Änderungen in einer Klasse wirken sich kaum auf andere aus; erreicht z. B. durch Interfaces. Hohe Kohäsion: Eine Klasse soll genau eine klar abgegrenzte Aufgabe erfüllen und alle ihre Elemente sollen zu dieser Aufgabe beitragen (Single Responsibility Principle). Ziel beider Prinzipien: wartbare, testbare und wiederverwendbare Software.",
    explainFa:
      "۱) موضوع سوال: اصول lose Kopplung (کوپلینگ ضعیف) و hohe Kohäsion (انسجام بالا).\n۲) خواسته سوال: تعریف هر دو + هدف + رابطه با Interface و SRP.\n۳) منطق پاسخ درست: Lose Kopplung: کلاس‌ها حداقل وابستگی به هم دارند — تغییر در یکی کمترین اثر را روی دیگران دارد. Interface استفاده کردن به جای Klasse بتن (concrete) کوپلینگ را کاهش می‌دهد. Hohe Kohäsion: هر کلاس فقط یک مسئولیت مشخص دارد (Single Responsibility Principle) و همه‌ی اعضایش به آن مسئولیت مربوط‌اند. هدف: کد قابل‌نگهداری، تست‌پذیر و قابل استفاده مجدد.\n۴) نکات امتحانی/دان‌ها:\n- ارتباط: loose Kopplung + hohe Kohäsion = SOLID Prinzipien.\n- دان: Kopplung بالا یعنی وابستگی زیاد — بد است؛ Kohäsion پایین یعنی کلاس چندین مسئولیت دارد — بد است.",
  },
  {
    id: "oop-23",
    question: "Was ist eine Assoziation im Klassendiagramm und was bedeuten Multiplizitäten?",
    answer:
      "Eine Assoziation ist eine Beziehung zwischen zwei Klassen, dargestellt als Linie, oft mit Rollennamen und Leserichtung. Multiplizitäten geben an, wie viele Objekte der einen Klasse mit wie vielen Objekten der anderen verbunden sein können: 1 (genau eins), 0..1 (optional), * oder 0..* (beliebig viele), 1..* (mindestens eins). Beispiel: Kunde 1 ↔ 0..* Bestellung.",
    explainFa:
      "۱) موضوع سوال: Assoziation و Multiplizitäten در UML-Klassendiagramm.\n۲) خواسته سوال: تعریف Assoziation + معنی چهار نوع Multiplizität + مثال.\n۳) منطق پاسخ درست: Assoziation رابطه‌ای بین دو کلاس است که با خط ساده نشان داده می‌شود. Multiplizitäten تعداد اشیاء مرتبط را نشان می‌دهند:\n- 1: دقیقاً یک\n- 0..1: صفر یا یک (اختیاری)\n- * یا 0..*: صفر تا هر تعداد\n- 1..*: حداقل یک\nمثال: Kunde 1 ↔ 0..* Bestellung (یک مشتری صفر تا چند سفارش دارد).\n۴) نکات امتحانی/دان‌ها:\n- جهت خواندن مهم است: Kunde «hat» Bestellung.\n- دان: Multiplizität را در کجا می‌نویسند — کنار کلاسی که «چندتا» از آن وجود دارد.\n- Assoziation ≠ Komposition/Aggregation؛ Assoziation خنثی است.",
  },
  {
    id: "oop-24",
    question: "Was passiert mit nicht mehr benötigten Objekten in Java? (Garbage Collection)",
    answer:
      "In Java gibt es keine manuelle Speicherfreigabe und keinen Destruktor wie in C++. Der Garbage Collector der JVM erkennt automatisch Objekte, auf die keine Referenz mehr zeigt, und gibt deren Speicher frei. Der Zeitpunkt ist nicht vorhersehbar; man kann ihn mit System.gc() nur anregen, nicht erzwingen. Eine Referenz wird z. B. durch objekt = null oder das Verlassen des Gültigkeitsbereichs aufgehoben.",
    explainFa:
      "۱) موضوع سوال: Garbage Collection در Java — مدیریت حافظه‌ی خودکار.\n۲) خواسته سوال: چطور Java حافظه آزاد می‌کند + تفاوت با C++.\n۳) منطق پاسخ درست: در Java برخلاف C++ هیچ Destruktor و free() یا delete مستقیم وجود ندارد. JVM یک Garbage Collector دارد که به‌طور خودکار اشیائی را که هیچ Referenz‌ی به آن‌ها اشاره نمی‌کند شناسایی و حافظه‌شان را آزاد می‌کند. زمان دقیق آزادسازی قابل پیش‌بینی نیست. System.gc() فقط پیشنهاد می‌دهد، اجبار نیست.\n۴) نکات امتحانی/دان‌ها:\n- referenz = null یا خارج شدن از scope باعث می‌شود شیء «unreachable» شود.\n- دان: Garbage Collection حافظه را «بلافاصله» آزاد نمی‌کند — زمان‌بندی آن در اختیار JVM است.\n- مزیت: برنامه‌نویس نگران memory leak نیست (ولی هنوز ممکن است اگر به اشتباه Referenz نگه دارد).",
  },
  {
    id: "oop-25",
    question: "Wozu dient das Schlüsselwort super in einer Unterklasse?",
    answer:
      "super verweist auf die direkte Oberklasse. Einsatz: 1. super(...) ruft im Konstruktor der Unterklasse den Konstruktor der Oberklasse auf — muss die erste Anweisung im Konstruktor sein. 2. super.methode() ruft die geerbte (ggf. überschriebene) Methode der Oberklasse auf, z. B. um deren Logik zu erweitern statt komplett zu ersetzen. 3. super.attribut greift auf ein Attribut der Oberklasse zu.",
    explainFa:
      "۱) موضوع سوال: کلمه‌ی کلیدی super در Java و سه کاربرد آن.\n۲) خواسته سوال: سه کاربرد super با مثال کد.\n۳) منطق پاسخ درست:\n۱. super(...): در سازنده‌ی Unterklasse، سازنده‌ی Oberklasse را صدا می‌زند — باید اولین دستور Konstruktor باشد.\n۲. super.methode(): متد Override شده‌ی Oberklasse را صدا می‌زند؛ وقتی می‌خواهی منطق Oberklasse را گسترش دهی نه جایگزین کنی.\n۳. super.attribut: به Attribut هم‌نام در Oberklasse دسترسی می‌دهد (اگر در Unterklasse پنهان شده باشد).\n۴) نکات امتحانی/دان‌ها:\n- super() در Konstruktor باید اولین خط باشد — وگرنه compile error.\n- اگر super() نوشته نشود، Java به‌طور ضمنی super() بدون پارامتر صدا می‌زند.\n- دان: super با this اشتباه گرفته نشود — this به همان شیء، super به Oberklasse.",
  },
];
