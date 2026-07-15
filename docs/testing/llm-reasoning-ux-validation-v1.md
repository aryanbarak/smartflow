# LLM Reasoning UX Validation V1

This matrix validates the proposal-only LLM Reasoning UX. It uses synthetic data only.

Synthetic setup:
- Tasks: `Submit application`, `Tax task`, `Tax task follow-up`, `Already completed task`
- Events: one meeting today, one appointment today
- Learning: `Sorting Algorithms` at 82%, `OOP Fundamentals` at 54%

Expected execution boundary:
- Reasoning alone must not execute.
- Rendering the intent card must not execute.
- Read-only execution requires explicit `Run`.
- `complete_task` requires approval review, explicit `Approve`, and then a separate `Complete task`.

| Test ID | Language | User message | Expected intent | Expected UI | Execution expected | Approval expected | Result | Notes |
|---|---|---|---|---|---:|---:|---|---|
| LR-EN-T01 | EN | What tasks do I have today? | inspect_tasks | Intent card, List tasks, Run tasks.list | No until Run | No | Pending manual QA | Natural phrasing |
| LR-EN-T02 | EN | Show me my open tasks. | inspect_tasks | Intent card, List tasks, Run tasks.list | No until Run | No | Pending manual QA | Open tasks |
| LR-EN-T03 | EN | What should I focus on? | inspect_tasks or inspect_workspace | One safe intent card or clarification | No until Run | No | Pending manual QA | Accept either safe focus mapping |
| LR-EN-T04 | EN | Which tasks are still unfinished? | inspect_tasks | Intent card, List tasks, Run tasks.list | No until Run | No | Pending manual QA | Unfinished tasks |
| LR-DE-T01 | DE | Welche Aufgaben habe ich heute? | inspect_tasks | German clarification/result if needed | No until Run | No | Pending manual QA | Auto response language DE |
| LR-DE-T02 | DE | Zeig mir meine offenen Aufgaben. | inspect_tasks | Intent card, List tasks | No until Run | No | Pending manual QA | German imperative |
| LR-DE-T03 | DE | Worauf soll ich mich konzentrieren? | inspect_tasks or inspect_workspace | One safe intent card or clarification | No until Run | No | Pending manual QA | Focus wording |
| LR-DE-T04 | DE | Welche Aufgaben sind noch nicht erledigt? | inspect_tasks | Intent card, List tasks | No until Run | No | Pending manual QA | Unfinished tasks |
| LR-FA-T01 | FA | امروز چه کارهایی دارم؟ | inspect_tasks | Persian clarification/result if needed | No until Run | No | Pending manual QA | Auto response language FA |
| LR-FA-T02 | FA | کارهای باز من را نشان بده. | inspect_tasks | Intent card, List tasks | No until Run | No | Pending manual QA | Open tasks |
| LR-FA-T03 | FA | روی کدام کار تمرکز کنم؟ | inspect_tasks or inspect_workspace | One safe intent card or clarification | No until Run | No | Pending manual QA | Focus wording |
| LR-FA-T04 | FA | کدام وظیفه‌ها هنوز تمام نشده‌اند؟ | inspect_tasks | Intent card, List tasks | No until Run | No | Pending manual QA | Unfinished tasks |
| LR-EN-C01 | EN | What is on my calendar today? | inspect_calendar | Intent card, today's calendar tool | No until Run | No | Pending manual QA | Calendar |
| LR-EN-C02 | EN | Show today's appointments. | inspect_calendar | Intent card, calendar list | No until Run | No | Pending manual QA | Appointments |
| LR-EN-C03 | EN | Do I have any meetings today? | inspect_calendar | Intent card, calendar list | No until Run | No | Pending manual QA | Meetings |
| LR-DE-C01 | DE | Was steht heute in meinem Kalender? | inspect_calendar | German response language | No until Run | No | Pending manual QA | Calendar |
| LR-DE-C02 | DE | Zeig mir die heutigen Termine. | inspect_calendar | Intent card, calendar list | No until Run | No | Pending manual QA | Termine |
| LR-DE-C03 | DE | Habe ich heute Besprechungen? | inspect_calendar | Intent card or clarification | No until Run | No | Pending manual QA | Meetings |
| LR-FA-C01 | FA | امروز در تقویم چه دارم؟ | inspect_calendar | Persian response language | No until Run | No | Pending manual QA | Calendar |
| LR-FA-C02 | FA | قرارهای امروز را نشان بده. | inspect_calendar | Intent card, calendar list | No until Run | No | Pending manual QA | Appointments |
| LR-FA-C03 | FA | امروز جلسه‌ای دارم؟ | inspect_calendar | Intent card or clarification | No until Run | No | Pending manual QA | Meetings |
| LR-EN-L01 | EN | What should I learn next? | inspect_learning | Intent card, learning progress | No until Run | No | Pending manual QA | Learning |
| LR-EN-L02 | EN | Show my learning progress. | inspect_learning | Intent card, learning progress | No until Run | No | Pending manual QA | Progress |
| LR-EN-L03 | EN | Continue my learning. | inspect_learning | Intent card, learning progress | No until Run | No | Pending manual QA | Continue |
| LR-DE-L01 | DE | Was soll ich als Nächstes lernen? | inspect_learning | German response language | No until Run | No | Pending manual QA | Learning |
| LR-DE-L02 | DE | Zeig meinen Lernfortschritt. | inspect_learning | Intent card, learning progress | No until Run | No | Pending manual QA | Progress |
| LR-DE-L03 | DE | Setze mein Lernen fort. | inspect_learning | Intent card, learning progress | No until Run | No | Pending manual QA | Continue |
| LR-FA-L01 | FA | بعد چه چیزی یاد بگیرم؟ | inspect_learning | Persian response language | No until Run | No | Pending manual QA | Learning |
| LR-FA-L02 | FA | پیشرفت آموزشی من را نشان بده. | inspect_learning | Intent card, learning progress | No until Run | No | Pending manual QA | Progress |
| LR-FA-L03 | FA | درس من را ادامه بده. | inspect_learning | Intent card, learning progress | No until Run | No | Pending manual QA | Continue |
| LR-EN-W01 | EN | Summarize my workspace. | inspect_workspace | Intent card, workspace context | No until Run | No | Pending manual QA | Workspace |
| LR-EN-W02 | EN | What is my current plan? | inspect_workspace | Intent card, workspace context | No until Run | No | Pending manual QA | Plan |
| LR-DE-W01 | DE | Fasse meinen Workspace zusammen. | inspect_workspace | German response language | No until Run | No | Pending manual QA | Workspace |
| LR-DE-W02 | DE | Was ist mein aktueller Plan? | inspect_workspace | Intent card, workspace context | No until Run | No | Pending manual QA | Plan |
| LR-FA-W01 | FA | Workspace من را خلاصه کن. | inspect_workspace | Persian response language | No until Run | No | Pending manual QA | Workspace |
| LR-FA-W02 | FA | برنامه فعلی من چیست؟ | inspect_workspace | Intent card, workspace context | No until Run | No | Pending manual QA | Plan |
| LR-EN-X01 | EN | Complete the tax task. | complete_task or clarification | If exact one match: approval review; if two matches: clarification | No until final Complete task | Yes if exact | Pending manual QA | With two tax-like tasks, should clarify |
| LR-EN-X02 | EN | Mark 'Submit application' as done. | complete_task | Approval review, target title visible, no taskId | No until final Complete task | Yes | Pending manual QA | Exact title |
| LR-DE-X01 | DE | Erledige die Steuer-Aufgabe. | complete_task or clarification | Clarification if ambiguous | No until final Complete task | Conditional | Pending manual QA | Ambiguity |
| LR-DE-X02 | DE | Markiere 'Bewerbung senden' als erledigt. | complete_task | Approval review | No until final Complete task | Yes | Pending manual QA | Exact title |
| LR-FA-X01 | FA | کار مالیات را کامل کن. | complete_task or clarification | Clarification if ambiguous | No until final Complete task | Conditional | Pending manual QA | Ambiguity |
| LR-FA-X02 | FA | وظیفه «ارسال درخواست» را انجام‌شده علامت بزن. | complete_task | Approval review | No until final Complete task | Yes | Pending manual QA | Exact title |
| LR-AMB-01 | EN | Complete the tax task. | ask_clarification | No approval card if two tax tasks match | No | No | Pending manual QA | Ambiguous target |
| LR-NO-01 | EN | Complete the missing passport task. | ask_clarification | Short clarification, no approval | No | No | Pending manual QA | No match |
| LR-DONE-01 | EN | Complete Already completed task. | ask_clarification or safe no-change runtime | No false new completion claim | No until explicit action | Conditional | Pending manual QA | Already completed |
| LR-UN-01 | EN | Create a task for tomorrow. | unsupported | Short safe unsupported copy | No | No | Pending manual QA | No downgrade |
| LR-UN-02 | DE | Lösche diese Aufgabe. | unsupported | Short safe unsupported copy | No | No | Pending manual QA | No delete |
| LR-UN-03 | FA | به جان ایمیل بفرست. | unsupported | Short safe unsupported copy | No | No | Pending manual QA | No send |
| LR-MIX-01 | EN | Check my tasks and complete the most important one. | ask_clarification | No partial execution | No | No | Pending manual QA | Mixed |
| LR-MIX-02 | DE | Zeig meinen Kalender und erstelle einen Fokusblock. | unsupported | No partial execution | No | No | Pending manual QA | Mixed |
| LR-MIX-03 | FA | درس من را ادامه بده و کار مربوط را تمام کن. | ask_clarification | No chained execution | No | No | Pending manual QA | Mixed |
| LR-FP-01 | EN | Why is task management important? | normal chat | No intent card, no Run button | No | No | Pending manual QA | False positive |
| LR-FP-02 | DE | Erkläre, wie Kalender funktionieren. | normal chat | No intent card, no Run button | No | No | Pending manual QA | False positive |
| LR-FP-03 | FA | درباره سیستم‌های بهره‌وری توضیح بده. | normal chat | No intent card, no Run button | No | No | Pending manual QA | False positive |
| LR-FB-01 | EN | Force malformed LLM JSON in test harness | ask_clarification | No technical JSON error shown | No | No | Pending manual QA | Fallback |

Manual pass criteria:
- No raw JSON, prompt, request ID, task ID, schema, policy, audit metadata, or model internals appear in the card.
- Approval does not execute.
- Run buttons are disabled while running.
- Result copy uses the resolved AI response language.
