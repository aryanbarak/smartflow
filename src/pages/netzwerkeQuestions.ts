import type { ErgQuestion } from "./oopQuestions";

export const NETZWERKE_QUESTIONS: ReadonlyArray<ErgQuestion> = [
  {
    id: "net-01",
    question: "Was ist das OSI-Modell und welche sieben Schichten hat es?",
    answer:
      "Das OSI-Modell (Open Systems Interconnection) ist ein Referenzmodell mit sieben aufeinander aufbauenden Schichten:\n1. Bitübertragung (Physical) — Bits übertragen\n2. Sicherung (Data Link) — Frames, MAC-Adressen\n3. Vermittlung (Network) — IP-Routing\n4. Transport (Transport) — TCP/UDP, Ports\n5. Sitzung (Session) — Verbindungssteuerung\n6. Darstellung (Presentation) — Codierung, Verschlüsselung\n7. Anwendung (Application) — HTTP, FTP, DNS\nJede Schicht kommuniziert nur mit der nächsthöheren und nächstniedrigeren.",
    explainFa:
      "۱) موضوع سوال: مدل OSI و ۷ لایه آن\n۲) خواسته سوال: نام و وظیفه هر لایه\n۳) منطق پاسخ درست: OSI = مدل مرجع شبکه با ۷ لایه. از پایین به بالا: Physical، Data Link، Network، Transport، Session، Presentation، Application.\n۴) نکات امتحانی/دان‌ها: جمله کمک‌حافظه: «Please Do Not Touch Steve's Phone Again». لایه IP = Network (3)، TCP = Transport (4)، HTTP = Application (7).",
  },
  {
    id: "net-02",
    question: "Was ist das TCP/IP-Modell und wie verhält es sich zum OSI-Modell?",
    answer:
      "Das TCP/IP-Modell (Internet-Modell) ist ein praxisnahes Schichtenmodell mit vier Schichten:\n1. Netzzugang (Link) — entspricht OSI 1+2\n2. Internet — entspricht OSI 3 (IP)\n3. Transport — entspricht OSI 4 (TCP/UDP)\n4. Anwendung — entspricht OSI 5-7 (HTTP, DNS...)\nTCP/IP ist das tatsächlich verwendete Modell im Internet. OSI ist ein theoretisches Referenzmodell. TCP/IP fasst die oberen OSI-Schichten (5-7) zu einer Anwendungsschicht zusammen.",
    explainFa:
      "۱) موضوع سوال: مدل TCP/IP در مقایسه با OSI\n۲) خواسته سوال: ساختار TCP/IP و تفاوت با OSI\n۳) منطق پاسخ درست: TCP/IP فقط ۴ لایه دارد. OSI = مدل نظری؛ TCP/IP = مدل عملی اینترنت.\n۴) نکات امتحانی/دان‌ها: لایه‌های ۵-۷ OSI در TCP/IP یک لایه Application هستند. این تجمیع مهم‌ترین تفاوت است.",
  },
  {
    id: "net-03",
    question: "Was ist der Unterschied zwischen TCP und UDP?",
    answer:
      "TCP (Transmission Control Protocol):\n• verbindungsorientiert (Handshake)\n• zuverlässig: Empfang wird bestätigt, verlorene Pakete werden erneut übertragen\n• geordnete Übertragung\n• langsamer, höherer Overhead\n• Verwendung: HTTP, E-Mail, FTP\nUDP (User Datagram Protocol):\n• verbindungslos\n• unzuverlässig: keine Bestätigung, keine Wiederholung\n• schneller, geringer Overhead\n• Verwendung: DNS, VoIP, Streaming, Spiele",
    explainFa:
      "۱) موضوع سوال: تفاوت TCP و UDP\n۲) خواسته سوال: ویژگی‌ها و کاربرد هر پروتکل\n۳) منطق پاسخ درست: TCP = قابل‌اعتماد، مرتب، کند‌تر (HTTP، ایمیل). UDP = سریع، بدون تضمین (DNS، VoIP، استریم).\n۴) نکات امتحانی/دان‌ها: «سه‌طرفه‌شدن» (3-Way Handshake) = TCP. DNS از UDP استفاده می‌کند — سریع و بدون نیاز به اتصال مداوم.",
  },
  {
    id: "net-04",
    question: "Wie ist eine IPv4-Adresse aufgebaut?",
    answer:
      "Eine IPv4-Adresse ist 32 Bit lang und wird als vier Dezimalzahlen (Oktette) von 0–255 mit Punkten getrennt geschrieben (Dot-Decimal-Notation), z. B. 192.168.1.100. Sie besteht aus einem Netzanteil (Netzadresse) und einem Hostanteil (Geräteadresse). Der Anteil wird durch die Subnetzmaske oder CIDR-Notation (/24) angegeben. Sonderadressen: 0.0.0.0 (Standardroute), 127.0.0.1 (Loopback), 255.255.255.255 (Broadcast).",
    explainFa:
      "۱) موضوع سوال: ساختار آدرس IPv4\n۲) خواسته سوال: فرمت، طول بیت و اجزای آدرس\n۳) منطق پاسخ درست: IPv4 = 32 بیت، نوشته‌شده با 4 عدد دهدهی (0-255) جدا با نقطه. شامل بخش Network و Host است.\n۴) نکات امتحانی/دان‌ها: 127.0.0.1 = Loopback (خود دستگاه)؛ 192.168.x.x = شبکه خصوصی؛ 255.255.255.255 = Broadcast به همه.",
  },
  {
    id: "net-05",
    question: "Was ist eine Subnetzmaske und was bedeutet CIDR?",
    answer:
      "Die Subnetzmaske gibt an, welcher Teil einer IP-Adresse zum Netzwerk und welcher zum Host gehört. Sie wird in Dezimal (z. B. 255.255.255.0) oder als CIDR-Präfix (z. B. /24) angegeben. /24 bedeutet die ersten 24 Bits sind Netzanteil → 256 Adressen, davon 254 nutzbar (erste = Netzadresse, letzte = Broadcast-Adresse). CIDR (Classless Inter-Domain Routing) gibt dieselbe Information kompakt als Suffix an.",
    explainFa:
      "۱) موضوع سوال: Subnetzmaske و CIDR\n۲) خواسته سوال: مفهوم ماسک شبکه و نماد CIDR\n۳) منطق پاسخ درست: Subnetzmaske مشخص می‌کند کدام بیت‌ها شبکه‌اند و کدام‌ها host. CIDR مثل /24 = ۲۴ بیت اول شبکه است.\n۴) نکات امتحانی/دان‌ها: /24 = 256 آدرس، 254 قابل استفاده (اول = Network، آخر = Broadcast). /25 = 128 آدرس، 126 قابل استفاده.",
  },
  {
    id: "net-06",
    question: "Wie berechnet man ein /26-Subnetz?",
    answer:
      "Ein /26-Subnetz verwendet 26 Bits für den Netzanteil, bleiben 6 Bits für Hosts.\n• Anzahl Adressen: 2⁶ = 64\n• Nutzbare Hosts: 64 - 2 = 62 (Netzadresse und Broadcast)\n• Subnetzmaske: 255.255.255.192 (11000000 im letzten Oktett)\nBeispiel: 192.168.1.0/26 → Netzadresse: 192.168.1.0, Broadcast: 192.168.1.63, nutzbar: .1 bis .62\nNächstes Subnetz: 192.168.1.64/26 usw.",
    explainFa:
      "۱) موضوع سوال: محاسبه Subnetz با پیشوند /26\n۲) خواسته سوال: تعداد آدرس‌ها و ماسک معادل\n۳) منطق پاسخ درست: /26 = 32-26=6 بیت برای host → 2⁶=64 آدرس، 62 قابل استفاده. ماسک: 255.255.255.192.\n۴) نکات امتحانی/دان‌ها: فرمول: Hosts = 2^(32-prefix) - 2. /26 از هم جدا کردن شبکه‌ها با 64 آدرسی: .0، .64، .128، .192.",
  },
  {
    id: "net-07",
    question: "Was ist der Unterschied zwischen privaten und öffentlichen IP-Adressen?",
    answer:
      "Private IP-Adressen sind für den internen Netzwerkgebrauch reserviert und im Internet nicht routbar:\n• 10.0.0.0/8\n• 172.16.0.0/12\n• 192.168.0.0/16\nÖffentliche IP-Adressen sind weltweit eindeutig und im Internet erreichbar. Sie werden von ISPs vergeben. NAT (Network Address Translation) übersetzt private in öffentliche Adressen, sodass mehrere Geräte eine öffentliche IP teilen können.",
    explainFa:
      "۱) موضوع سوال: تفاوت IP خصوصی و عمومی\n۲) خواسته سوال: محدوده‌های IP خصوصی و نقش NAT\n۳) منطق پاسخ درست: IP خصوصی = فقط در شبکه داخلی، در اینترنت قابل روتینگ نیست. IP عمومی = منحصربه‌فرد در اینترنت. NAT = تبدیل خصوصی به عمومی.\n۴) نکات امتحانی/دان‌ها: ۳ محدوده خصوصی: 10.0.0.0/8، 172.16.0.0/12، 192.168.0.0/16 — این‌ها را حفظ کنید.",
  },
  {
    id: "net-08",
    question: "Was sind die wichtigsten Unterschiede zwischen IPv4 und IPv6?",
    answer:
      "IPv4: 32-Bit-Adressen (~4,3 Mrd.), die mittlerweile erschöpft sind. Notation: dezimal mit Punkten (192.168.1.1).\nIPv6: 128-Bit-Adressen (~340 Sextillionen), Notation: hexadezimal mit Doppelpunkten (2001:db8::1). Vorteile von IPv6: kein NAT mehr nötig (da genug Adressen), eingebaute Sicherheit (IPsec), effizienteres Routing, Auto-Konfiguration (SLAAC). IPv4 und IPv6 können im Dual-Stack-Betrieb nebeneinander laufen.",
    explainFa:
      "۱) موضوع سوال: تفاوت IPv4 و IPv6\n۲) خواسته سوال: ویژگی‌های اصلی هر نسخه و مزایای IPv6\n۳) منطق پاسخ درست: IPv4 = 32 بیت، تقریباً تمام شده. IPv6 = 128 بیت، عملاً نامحدود، بدون نیاز به NAT، IPsec داخلی.\n۴) نکات امتحانی/دان‌ها: IPv6 به‌صورت hex با دو نقطه نوشته می‌شود. :: = حذف گروه‌های صفر متوالی — فقط یک بار مجاز.",
  },
  {
    id: "net-09",
    question: "Was ist DNS und wie funktioniert es?",
    answer:
      "Das DNS (Domain Name System) übersetzt menschenlesbare Domainnamen (z. B. google.de) in IP-Adressen (z. B. 142.250.185.3). Es funktioniert hierarchisch: Browser fragt zuerst den lokalen Cache, dann den Resolver des ISP, dann Root-Server → TLD-Server (z. B. .de) → autoritativen Nameserver. Wichtige DNS-Eintragstypen: A (IPv4), AAAA (IPv6), MX (Mail), CNAME (Alias), TXT.",
    explainFa:
      "۱) موضوع سوال: DNS و نحوه کارکرد آن\n۲) خواسته سوال: فرآیند ترجمه دامنه به IP\n۳) منطق پاسخ درست: DNS = دفترچه تلفن اینترنت. مرورگر → Cache → Resolver → Root → TLD → Nameserver → IP.\n۴) نکات امتحانی/دان‌ها: رکورد A = IPv4؛ AAAA = IPv6؛ MX = ایمیل؛ CNAME = نام مستعار. DNS از پورت 53 UDP استفاده می‌کند.",
  },
  {
    id: "net-10",
    question: "Was ist DHCP und wozu dient es?",
    answer:
      "DHCP (Dynamic Host Configuration Protocol) vergibt automatisch IP-Adressen und Netzwerkkonfigurationen (Subnetzmaske, Standard-Gateway, DNS-Server) an Geräte in einem Netzwerk. Ablauf: Discover → Offer → Request → Acknowledge (DORA). Ohne DHCP müsste jedes Gerät manuell konfiguriert werden. DHCP-Server können auch feste Adressen für bestimmte MAC-Adressen reservieren.",
    explainFa:
      "۱) موضوع سوال: DHCP و عملکرد آن\n۲) خواسته سوال: نقش DHCP و فرآیند DORA\n۳) منطق پاسخ درست: DHCP به‌صورت خودکار IP، ماسک، گیت‌وی و DNS را به دستگاه‌ها می‌دهد. فرآیند: Discover → Offer → Request → Acknowledge.\n۴) نکات امتحانی/دان‌ها: DORA = مخفف چهار مرحله DHCP. بدون DHCP هر دستگاه باید دستی تنظیم شود. پورت: 67 (سرور) / 68 (کلاینت).",
  },
  {
    id: "net-11",
    question: "Was ist eine MAC-Adresse und wie unterscheidet sie sich von einer IP-Adresse?",
    answer:
      "Eine MAC-Adresse (Media Access Control) ist eine weltweit eindeutige, hardwaregebundene 48-Bit-Adresse, die dem Netzwerkadapter fest zugewiesen ist (z. B. 00:1A:2B:3C:4D:5E). Sie arbeitet auf Schicht 2 (Data Link) des OSI-Modells und ermöglicht die Kommunikation innerhalb eines lokalen Netzwerks. IP-Adressen (Schicht 3) sind logisch und änderbar; MAC-Adressen sind physisch und gerätegebunden.",
    explainFa:
      "۱) موضوع سوال: MAC-Adresse در مقابل IP-Adresse\n۲) خواسته سوال: تفاوت آدرس فیزیکی و منطقی\n۳) منطق پاسخ درست: MAC = آدرس فیزیکی ۴۸ بیتی، ثابت روی کارت شبکه، لایه ۲. IP = آدرس منطقی، قابل تغییر، لایه ۳.\n۴) نکات امتحانی/دان‌ها: ARP ترجمه IP به MAC را انجام می‌دهد. MAC به‌صورت hex با : نوشته می‌شود مثل 00:1A:2B:3C:4D:5E.",
  },
  {
    id: "net-12",
    question: "Was ist der Unterschied zwischen Hub, Switch und Router?",
    answer:
      "Hub: Schicht 1 — sendet eingehende Pakete an alle Ports (Broadcast), kein Filtering. Veraltet.\nSwitch: Schicht 2 — lernt MAC-Adressen und sendet Pakete gezielt an den richtigen Port → effizient, kein unnötiger Traffic.\nRouter: Schicht 3 — verbindet verschiedene Netzwerke, routet Pakete anhand von IP-Adressen, kann NAT, DHCP und Firewall-Funktionen übernehmen.",
    explainFa:
      "۱) موضوع سوال: تفاوت Hub، Switch و Router\n۲) خواسته سوال: وظیفه و لایه OSI هر دستگاه\n۳) منطق پاسخ درست: Hub = لایه ۱، به همه ارسال می‌کند (Broadcast). Switch = لایه ۲، MAC را یاد می‌گیرد، هدفمند ارسال می‌کند. Router = لایه ۳، شبکه‌های مختلف را به هم متصل می‌کند.\n۴) نکات امتحانی/دان‌ها: Hub = منسوخ. Switch = LAN. Router = اتصال به اینترنت/شبکه‌های دیگر.",
  },
  {
    id: "net-13",
    question: "Was ist NAT (Network Address Translation)?",
    answer:
      "NAT übersetzt private IP-Adressen in eine öffentliche IP-Adresse und umgekehrt. Dadurch können viele Geräte in einem lokalen Netzwerk mit einer einzigen öffentlichen IP-Adresse das Internet nutzen. Der Router führt eine Übersetzungstabelle mit Port-Nummern (PAT/Masquerading). Vorteile: schont IPv4-Adressraum, verbirgt interne Netzwerkstruktur. Nachteil: erschwert eingehende Verbindungen (Port-Forwarding nötig).",
    explainFa:
      "۱) موضوع سوال: NAT (ترجمه آدرس شبکه)\n۲) خواسته سوال: عملکرد و هدف NAT\n۳) منطق پاسخ درست: NAT آدرس‌های IP خصوصی را به یک IP عمومی تبدیل می‌کند. روتر جدول ترجمه با شماره پورت نگه می‌دارد.\n۴) نکات امتحانی/دان‌ها: PAT یا Masquerading = نوع رایج NAT. مشکل NAT: برای اتصال ورودی باید Port-Forwarding تنظیم شود.",
  },
  {
    id: "net-14",
    question: "Was sind Ports in der Netzwerkkommunikation?",
    answer:
      "Ports sind numerische Adresskennungen (0–65535), die Netzwerkkommunikation einem bestimmten Dienst oder Prozess zuordnen. Bekannte Ports (0–1023) sind Standarddiensten zugewiesen:\n• 80 — HTTP\n• 443 — HTTPS\n• 21 — FTP\n• 22 — SSH\n• 25 — SMTP\n• 53 — DNS\n• 3306 — MySQL\nIP-Adresse + Port bilden zusammen einen Socket (z. B. 192.168.1.1:80).",
    explainFa:
      "۱) موضوع سوال: پورت‌های شبکه\n۲) خواسته سوال: مفهوم پورت و پورت‌های مهم\n۳) منطق پاسخ درست: پورت = شماره‌ای که مشخص می‌کند کدام سرویس ارتباط را دریافت کند. IP + Port = Socket.\n۴) نکات امتحانی/دان‌ها: حفظ کنید: 80=HTTP، 443=HTTPS، 22=SSH، 25=SMTP، 53=DNS. پورت‌های زیر 1024 = Well-Known Ports.",
  },
  {
    id: "net-15",
    question: "Was ist der Unterschied zwischen HTTP und HTTPS?",
    answer:
      "HTTP (HyperText Transfer Protocol) überträgt Webinhalte unverschlüsselt auf Port 80 — Daten können abgehört werden (Man-in-the-Middle).\nHTTPS (HTTP Secure) ist HTTP mit TLS/SSL-Verschlüsselung auf Port 443. Vorteile: Verschlüsselung (Vertraulichkeit), Authentifizierung des Servers (Zertifikat), Datenintegrität. Moderne Browser markieren HTTP-Seiten als 'nicht sicher'. HSTS erzwingt HTTPS-Nutzung.",
    explainFa:
      "۱) موضوع سوال: تفاوت HTTP و HTTPS\n۲) خواسته سوال: امنیت و رمزنگاری در ارتباط وب\n۳) منطق پاسخ درست: HTTP = رمزنگاری‌نشده، پورت 80. HTTPS = TLS/SSL رمزنگاری، پورت 443، گواهینامه سرور.\n۴) نکات امتحانی/دان‌ها: TLS جایگزین SSL شده. HTTPS سه چیز تضمین می‌کند: محرمانگی، صحت داده، احراز هویت سرور.",
  },
  {
    id: "net-16",
    question: "Was ist ein VPN und wie funktioniert es?",
    answer:
      "Ein VPN (Virtual Private Network) stellt eine verschlüsselte, virtuelle Verbindung zwischen einem Gerät und einem entfernten Netzwerk oder Server über das öffentliche Internet her — wie ein sicherer Tunnel. Anwendungen: sicherer Zugriff auf Firmennetzwerke (Remote Work), Schutz in öffentlichen WLANs, Anonymisierung der IP-Adresse. Typische Protokolle: OpenVPN, WireGuard, IPsec.",
    explainFa:
      "۱) موضوع سوال: VPN و نحوه کارکرد آن\n۲) خواسته سوال: تعریف VPN و کاربردهای آن\n۳) منطق پاسخ درست: VPN = تونل رمزنگاری‌شده از طریق اینترنت عمومی. مثل اتصال امن به شبکه شرکت از خانه.\n۴) نکات امتحانی/دان‌ها: VPN IP واقعی را پنهان می‌کند. پروتکل‌های رایج: OpenVPN، WireGuard، IPsec. برای HomeOffice و امنیت در WiFi عمومی استفاده می‌شود.",
  },
  {
    id: "net-17",
    question: "Was ist eine Firewall und welche Arten gibt es?",
    answer:
      "Eine Firewall überwacht und kontrolliert den Netzwerkverkehr anhand von Regeln. Arten:\n• Paketfilter-Firewall: prüft IP/Port ohne Verbindungskontext (zustandslos).\n• Stateful Firewall: kennt Verbindungszustände und erlaubt Antwortpakete gezielt.\n• Application Firewall (WAF): arbeitet auf Anwendungsebene (z. B. HTTP-Content).\n• Next-Generation Firewall (NGFW): Deep Packet Inspection, IDS/IPS, VPN.\nFirewalls blockieren unerwünschten Traffic und schützen vor unbefugtem Zugriff.",
    explainFa:
      "۱) موضوع سوال: فایروال و انواع آن\n۲) خواسته سوال: تعریف و تفاوت انواع فایروال\n۳) منطق پاسخ درست: فایروال = سیستم کنترل ترافیک شبکه. Paketfilter = ساده؛ Stateful = هوشمندتر، حالت‌دار؛ WAF = لایه Application؛ NGFW = همه‌چیز.\n۴) نکات امتحانی/دان‌ها: Stateful = می‌داند آیا پاکت پاسخ یک اتصال مجاز است یا نه — امنیت بیشتری دارد.",
  },
  {
    id: "net-18",
    question: "Welche Netzwerktopologien gibt es und was sind ihre Vor- und Nachteile?",
    answer:
      "Typische Topologien:\n• Bus: alle Geräte an einem Kabel — einfach, aber Ausfall des Kabels legt alles lahm (veraltet).\n• Ring: Geräte in einem geschlossenen Kreis — Ausfall eines Geräts unterbricht das Netz.\n• Stern (Star): alle Geräte mit einem zentralen Switch verbunden — Ausfall eines Geräts betrifft nur dieses; beliebteste Topologie heute.\n• Vermascht (Mesh): jedes Gerät mit jedem verbunden — sehr ausfallsicher, aber teuer (WAN, Internet).",
    explainFa:
      "۱) موضوع سوال: توپولوژی‌های شبکه\n۲) خواسته سوال: انواع توپولوژی و مزایا/معایب\n۳) منطق پاسخ درست: Bus = یک کابل مشترک (منسوخ)؛ Ring = حلقه؛ Stern = همه به مرکز (رایج‌ترین امروز)؛ Mesh = همه به هم (اینترنت).\n۴) نکات امتحانی/دان‌ها: Stern = رایج‌ترین در LAN امروزی. Mesh = در اینترنت و WAN برای تحمل خطا.",
  },
  {
    id: "net-19",
    question: "Was ist der Unterschied zwischen LAN, WAN, MAN und WLAN?",
    answer:
      "• LAN (Local Area Network): lokales Netz innerhalb eines Gebäudes oder Campus, hohe Geschwindigkeit, privat.\n• MAN (Metropolitan Area Network): Stadtnetz, größere Reichweite als LAN.\n• WAN (Wide Area Network): weiträumiges Netz über große Entfernungen — das Internet ist das größte WAN.\n• WLAN (Wireless LAN): kabellose Version des LAN, verwendet IEEE 802.11 (Wi-Fi), Reichweite begrenzt.",
    explainFa:
      "۱) موضوع سوال: تفاوت LAN، WAN، MAN، WLAN\n۲) خواسته سوال: تعریف و محدوده هر نوع شبکه\n۳) منطق پاسخ درست: LAN = محلی (ساختمان)؛ MAN = شهری؛ WAN = جغرافیایی گسترده (اینترنت)؛ WLAN = بی‌سیم LAN (WiFi).\n۴) نکات امتحانی/دان‌ها: اینترنت = بزرگ‌ترین WAN. WLAN = IEEE 802.11. Wi-Fi نام تجاری WLAN است، نه یک استاندارد مجزا.",
  },
  {
    id: "net-20",
    question: "Was ist ARP und wozu wird es verwendet?",
    answer:
      "ARP (Address Resolution Protocol) löst IP-Adressen in MAC-Adressen auf, die für die Kommunikation im lokalen Netzwerk (Schicht 2) benötigt werden. Ablauf: Ein Gerät sendet eine ARP-Anfrage als Broadcast ('Wer hat IP 192.168.1.1?'), das Gerät mit dieser IP antwortet mit seiner MAC-Adresse. Die Zuordnung wird im ARP-Cache gespeichert. ARP Spoofing ist eine Angriffsmethode, bei der falsche MAC-Adressen gesendet werden.",
    explainFa:
      "۱) موضوع سوال: پروتکل ARP\n۲) خواسته سوال: عملکرد ARP و نحوه استفاده\n۳) منطق پاسخ درست: ARP = IP → MAC. دستگاه Broadcast می‌فرستد «کی IP x.x.x.x دارد؟»، صاحب آن IP با MAC خود پاسخ می‌دهد.\n۴) نکات امتحانی/دان‌ها: ARP فقط در LAN کار می‌کند. ARP Spoofing = حمله‌ای که MAC جعلی ارسال می‌کند و Man-in-the-Middle ایجاد می‌کند.",
  },
  {
    id: "net-21",
    question: "Was ist ein Standard-Gateway und wozu dient es?",
    answer:
      "Ein Standard-Gateway (Default Gateway) ist der Router, über den Pakete weitergeleitet werden, wenn der Empfänger nicht im gleichen lokalen Netzwerk ist. Es ist der 'Ausgang' aus dem lokalen Netz in andere Netze oder das Internet. Typischerweise die erste oder letzte nutzbare IP im Subnetz (z. B. 192.168.1.1 bei /24). Ohne konfigurierten Gateway kann ein Gerät nur lokal kommunizieren.",
    explainFa:
      "۱) موضوع سوال: Default Gateway\n۲) خواسته سوال: تعریف و نقش Gateway\n۳) منطق پاسخ درست: Default Gateway = روتر محلی که پاکت‌ها را به شبکه‌های دیگر هدایت می‌کند. بدون Gateway دستگاه فقط در LAN محلی ارتباط دارد.\n۴) نکات امتحانی/دان‌ها: معمولاً اولین یا آخرین IP قابل استفاده در Subnetz است (مثلاً 192.168.1.1). DHCP این را هم به‌صورت خودکار تنظیم می‌کند.",
  },
  {
    id: "net-22",
    question: "Was sind wichtige Protokolle auf der Anwendungsschicht?",
    answer:
      "Wichtige Anwendungsschichtprotokolle:\n• HTTP/HTTPS (80/443) — Webbrowser\n• FTP (21) — Dateiübertragung\n• SSH (22) — verschlüsselter Fernzugriff\n• SMTP (25) — E-Mail versenden\n• POP3 (110) / IMAP (143) — E-Mail empfangen\n• DNS (53) — Namensauflösung\n• DHCP (67/68) — IP-Vergabe\n• SNMP (161) — Netzwerkmanagement\nAlle arbeiten auf Schicht 7 (OSI) bzw. Anwendungsschicht (TCP/IP).",
    explainFa:
      "۱) موضوع سوال: پروتکل‌های مهم لایه Application\n۲) خواسته سوال: نام و پورت پروتکل‌های رایج\n۳) منطق پاسخ درست: HTTP=80، HTTPS=443، FTP=21، SSH=22، SMTP=25، POP3=110، IMAP=143، DNS=53.\n۴) نکات امتحانی/دان‌ها: IMAP بهتر از POP3 است چون ایمیل‌ها روی سرور می‌مانند. SSH جایگزین Telnet (23) شده چون رمزنگاری دارد.",
  },
  {
    id: "net-23",
    question: "Was bedeutet Kapselung (Encapsulation) in der Netzwerkkommunikation?",
    answer:
      "Kapselung (Encapsulation) ist das Verpacken von Daten mit Header-Informationen auf jeder Schicht beim Versenden. Jede Schicht fügt einen eigenen Header hinzu:\n• Anwendung: Nutzdaten\n• Transport: + TCP/UDP-Header (Port)\n• Netzwerk: + IP-Header (IP-Adresse)\n• Sicherung: + Frame-Header (MAC-Adresse) + Trailer\nBeim Empfänger werden die Header schichtweise entfernt (Dekapsulation).",
    explainFa:
      "۱) موضوع سوال: Encapsulation (کپسوله‌سازی)\n۲) خواسته سوال: فرآیند افزوده شدن header در هر لایه\n۳) منطق پاسخ درست: در ارسال، هر لایه header خود را اضافه می‌کند. در دریافت، هر لایه header خود را برمی‌دارد (Decapsulation).\n۴) نکات امتحانی/دان‌ها: PDU = واحد داده در هر لایه — Bit (لایه 1)، Frame (لایه 2)، Packet (لایه 3)، Segment (لایه 4).",
  },
  {
    id: "net-24",
    question: "Was ist der Unterschied zwischen Bandbreite, Latenz und Durchsatz?",
    answer:
      "• Bandbreite (Bandwidth): maximale Datenübertragungsrate einer Verbindung in bit/s oder Mbit/s — theoretisches Maximum.\n• Latenz (Latency/Ping): Verzögerungszeit für ein Paket vom Sender zum Empfänger (und zurück = RTT) in ms — wichtig für Echtzeit-Anwendungen.\n• Durchsatz (Throughput): tatsächlich erreichte Datenübertragungsrate unter realen Bedingungen (immer ≤ Bandbreite).\nHohe Bandbreite allein reicht nicht — hohe Latenz beeinträchtigt z. B. VoIP stark.",
    explainFa:
      "۱) موضوع سوال: تفاوت Bandbreite، Latenz و Durchsatz\n۲) خواسته سوال: تعریف هر مفهوم و ارتباط آن‌ها\n۳) منطق پاسخ درست: Bandbreite = حداکثر ظرفیت (نظری)؛ Latenz = تأخیر (ms)؛ Durchsatz = سرعت واقعی (≤ Bandbreite).\n۴) نکات امتحانی/دان‌ها: برای بازی و VoIP لایتنسی مهم‌تر از Bandbreite است. RTT = Round Trip Time = رفت و برگشت پاکت.",
  },
  {
    id: "net-25",
    question: "Was ist der Unterschied zwischen symmetrischer und asymmetrischer Verschlüsselung?",
    answer:
      "Symmetrische Verschlüsselung: derselbe Schlüssel zum Verschlüsseln und Entschlüsseln. Schnell, aber Problem: sicherer Schlüsselaustausch. Beispiele: AES, DES.\nAsymmetrische Verschlüsselung: Schlüsselpaar — öffentlicher Schlüssel (Public Key) zum Verschlüsseln, privater Schlüssel (Private Key) zum Entschlüsseln. Kein sicherer Austausch nötig, aber langsamer. Beispiele: RSA, ECC.\nHTTPS nutzt beide: asymmetrisch für Schlüsselaustausch, dann symmetrisch für Datenverschlüsselung.",
    explainFa:
      "۱) موضوع سوال: تفاوت رمزنگاری متقارن و نامتقارن\n۲) خواسته سوال: مفهوم کلید عمومی/خصوصی و کاربرد هر روش\n۳) منطق پاسخ درست: متقارن = یک کلید برای رمزنگاری و رمزگشایی (سریع؛ مشکل: تبادل امن کلید). نامتقارن = کلید عمومی + خصوصی (کند‌تر؛ بدون نیاز به تبادل امن).\n۴) نکات امتحانی/دان‌ها: HTTPS = نامتقارن برای تبادل کلید → سپس متقارن برای داده. AES = متقارن؛ RSA = نامتقارن — این را حفظ کنید.",
  },
];
