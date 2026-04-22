# 15-Minute Video Script — WAD2 Practical Coursework
# ====================================================
# HOW TO USE THIS SCRIPT:
# - Read it OUT LOUD a few times before recording so it feels natural
# - The [ACTION] lines tell you what to click/show on screen
# - Don't read word for word — use it as a guide, speak in your own voice
# - Pausing to think is fine. Sounding human is better than sounding like a robot
# - Aim for conversational, not formal
# ====================================================

---

## SECTION 1 — Introduction (0:00 – 0:45)

[ACTION: Show the running app in browser — home page]

"Hi, this is my submission for the WAD2 practical coursework. I've built a
booking system for a yoga studio called Serenity Yoga. I'll walk through all
the features, explain the code architecture, talk about security, and reflect
on what it was actually like working with AI to build this."

"The app is built with Node.js and Express on the server side, NeDB as the
database, and Mustache for generating HTML pages. I'll explain what all of
those mean as we go."

"Here it is running — this is the live deployed version on Render."

---

## SECTION 2 — Public Features (0:45 – 3:00)

[ACTION: Stay on home page]

"So starting with what anyone can see without logging in."

"The home page shows upcoming courses — each card has the course title, level,
type, the start and end dates, and when the next session is."

"The data here is coming from the database. When this page loads, the server
fetches all courses, gets the next session for each one, formats the dates, and
sends it all to the Mustache template to render into HTML. The browser just
gets finished HTML — it doesn't talk to the database itself."

[ACTION: Click About in the nav]

"There's an about page covering the studio, location, contact info and opening
hours. The spec required an information page accessible to non-logged-in users,
so this covers that."

[ACTION: Navigate to /courses]

"The courses page lets anyone browse all courses. I can filter by level..."

[ACTION: Select Beginner from the level dropdown and submit]

"...and it shows only beginner courses. These filters work by adding query
parameters to the URL — you can see ?level=beginner up there. The controller
reads those with req.query.level and passes them as a filter to the database."

[ACTION: Reset, then type something in the search box]

"There's also a text search. That one works differently — NeDB doesn't support
full-text search, so instead the controller fetches all courses and then filters
them in JavaScript using .includes() on the title and description. It's not as
efficient as a proper database index but it works fine at this scale."

[ACTION: Click through to a course detail page]

"Each course has a detail page. This shows the full description, dates, location,
price — those are all stored on the course record in the database. Then below
that is a table of sessions."

"Each session has its own database record with a start time, end time, capacity
and booked count. The remaining spaces is just capacity minus bookedCount —
that's calculated in the controller before the page renders."

"A non-logged-in user can see everything but the booking buttons aren't there.
If you look at the Mustache template, there's a {{#user}} block around the
booking form — that only renders if the user object exists, which it only does
when someone's logged in."

---

## SECTION 3 — Authentication (3:00 – 5:30)

[ACTION: Click Register in the header]

"Let me walk through how authentication works, because this is probably the most
important part technically."

"Registration asks for a name, email and password. There's validation — password
needs to be at least 8 characters, and both password fields have to match."

[ACTION: Try submitting with mismatched passwords]

"If they don't match, it redirects back with an error in the URL query string,
and the template displays it."

[ACTION: Fill in a valid registration and submit]

"When registration succeeds, a few things happen in the server. First, the
password is hashed using bcrypt — that turns something like 'password123' into
a long scrambled string that can never be reversed. The hashed version is what
gets stored in the database. The actual password is never saved anywhere."

"I used bcrypt specifically rather than a simpler hashing algorithm because
bcrypt is intentionally slow — it does thousands of rounds of processing. That
means if someone stole the database, it would take years to crack the passwords
by brute force rather than seconds."

"After the user is created, their ID gets saved into the session. A session is
how the server remembers who you are between requests — HTTP itself has no
memory, every request is fresh. The session ID goes into a cookie in your
browser, and the server uses that to look up who you are."

[ACTION: Show the browser's cookies in dev tools if possible, or just describe it]

"You can see there's a session cookie in the browser. It's marked httpOnly —
that means JavaScript on the page can't read it. That's a security measure
against XSS attacks, which I'll cover in a bit."

[ACTION: Show the header has changed — name visible, logout button there]

"Once logged in, the header shows the logged-in user's name. That's coming from
res.locals.user which is set by the attachUser middleware on every request —
Mustache templates can access anything in res.locals automatically."

[ACTION: Open VS Code, show middlewares/auth.js]

"This is the auth middleware. attachUser runs on every single request regardless
of whether the user is logged in. It reads req.session.userId, looks up the
full user in the database, and attaches it to req.user and res.locals.user.
If there's no session it just calls next() and moves on."

"requireOrganiser is used on all the organiser routes. If req.user doesn't exist
or their role isn't organiser, they get blocked. Otherwise next() is called and
the request continues to the controller."

---

## SECTION 4 — Student Booking (5:30 – 7:30)

[ACTION: As logged-in student, go to a course detail page]

"Now I'm logged in as a student, the booking buttons have appeared. That's
because the {{#user}} block in the Mustache template now has data."

[ACTION: Click Enrol in Full Course]

"Booking the full course hits POST /courses/:id/book. The controller calls
bookCourseForUser from the booking service."

[ACTION: Open VS Code, show services/bookingService.js]

"I put the booking logic in a separate service file rather than directly in the
controller. The reason is both the web form and the JSON API need the same
booking rules — so rather than duplicating the code, both controllers just
call this one function."

"What it does: finds the course, fetches all its sessions, checks if every
session has space by comparing bookedCount to capacity. If there's space in all
of them, it increments the booked count on each session and creates a CONFIRMED
booking. If any session is full, it creates a WAITLISTED booking instead and
doesn't touch the counts."

[ACTION: Show the booking confirmation page]

"The confirmation page shows the status — confirmed or waitlisted — along with
a booking reference."

[ACTION: Go to My Bookings]

"My Bookings shows all the user's enrolments. The controller fetches all
bookings where userId matches the logged-in user, then for each one fetches the
course name to display."

[ACTION: Cancel a booking]

"Cancelling a booking does two things — it sets the booking status to CANCELLED,
and it decrements the bookedCount on the sessions so that space opens up for
someone else. There's also an ownership check in the route — a user can only
cancel their own bookings, not anyone else's."

---

## SECTION 5 — Organiser Dashboard (7:30 – 11:00)

[ACTION: Log out, then log in as organiser@yoga.local / organiser123]

"Now logging in as an organiser. The nav changes — there's a Dashboard link
instead of My Bookings."

"The role is stored on the user record in the database as a string — either
student or organiser. When attachUser runs, it adds isOrganiser and isStudent
boolean flags to res.locals.user so Mustache can conditionally show nav items."

[ACTION: Go to /organiser]

"The dashboard shows headline stats — number of courses, sessions and students.
These are just counts from the database."

[ACTION: Go to Manage Courses]

"This is the course management page. All organiser routes are protected by the
requireOrganiser middleware — if I tried to visit this URL as a student or
logged-out user I'd get blocked before the controller even runs."

[ACTION: Open VS Code, show routes/organiser.js — the router.use(requireOrganiser) line]

"This one line — router.use(requireOrganiser) — applies the middleware to every
single route in this file. So I don't have to remember to add it to each route
individually. That's a cleaner and safer pattern."

[ACTION: Back to browser — click Add Course]

"Adding a course — I'll fill in all the fields."

[ACTION: Fill in the form and submit]

"The form posts to POST /organiser/courses. The controller reads req.body,
validates that the required fields are there, and calls CourseModel.create().
NeDB assigns a unique _id automatically."

[ACTION: Click Sessions for the new course]

"Each course has its sessions managed separately. A session is just its own
database record with a courseId linking it back to the course."

[ACTION: Add a couple of sessions with the datetime picker]

"Adding sessions — start time, end time and capacity. The datetime-local input
gives a nice picker. The controller converts it to an ISO string before storing."

[ACTION: Click Class List on a session that has bookings]

"The class list for a session — this is what an instructor would use on the day.
It shows each participant's name, email, booking status and when they booked.
There's a print button so they can take a paper copy."

"The query here finds all bookings where sessionIds contains this session ID,
then for each booking fetches the user record to get the name and email. So
it's joining two database collections — bookings and users — in the controller."

[ACTION: Go to Manage Users]

"The users page shows everyone registered. I can add new organiser accounts —
useful for giving other staff members access."

[ACTION: Point out the delete buttons — show yours doesn't have one]

"I can remove any user and their bookings. But notice my own account doesn't
have a delete button — there's a check in the controller that compares the
target user's ID to req.user._id and blocks it if they match. This prevents
accidentally locking everyone out."

[ACTION: Edit a course — change something and save]

"Editing a course uses the same form as creating one. The form posts to
POST /organiser/courses/:id with a ?_method=PUT query parameter. That's a
workaround because HTML forms can only send GET and POST — they can't send PUT
or DELETE. The router checks for the _method parameter and routes it to the
update controller."

[ACTION: Delete a course — show the confirm dialog]

"Deleting a course also deletes all its sessions. The JavaScript confirm dialog
gives a warning first. In the controller, it calls SessionModel.deleteByCourse()
before CourseModel.delete() to keep the database consistent."

---

## SECTION 6 — Code Architecture (11:00 – 12:30)

[ACTION: Switch to VS Code — show the folder structure in the sidebar]

"Let me step back and explain the overall architecture, because this is what
the MVC section of the written report covers."

"The pattern used here is Model-View-Controller. The idea is to separate three
concerns that would otherwise get tangled together."

[ACTION: Click on models/courseModel.js]

"Models are purely about data. courseModel.js has no idea about HTTP, sessions,
or HTML. It just knows how to talk to the database — create a course, find one
by ID, list them all, update, delete. That's it. If we switched from NeDB to
PostgreSQL, we'd only change this file."

[ACTION: Click on controllers/organiserController.js]

"Controllers handle a specific HTTP request. They receive req and res, call
whatever models they need, shape the data for the view, and call res.render.
They're the coordinator — they don't do database queries directly and they
don't write HTML."

[ACTION: Click on views/organiser/courses.mustache]

"Views are pure presentation. This Mustache template has no logic beyond basic
loops and conditionals. It receives a plain JavaScript object and fills in the
blanks. It has no idea where the data came from."

"The classic MVC pattern was designed for desktop apps in the 1970s. In a web
app it maps onto: HTTP request comes in, router sends it to a controller,
controller calls models, controller passes data to a view, view returns HTML."

"One thing worth noting is that this isn't perfect MVC. Some logic that arguably
belongs in the model — like the booking business rules — is in a service layer
instead. And the controllers do some data formatting like converting dates to
readable strings, which could be argued belongs in the view layer. So it's MVC
as a general guide rather than strict adherence."

---

## SECTION 7 — Security (12:30 – 13:45)

[ACTION: Can stay in VS Code or go back to browser]

"The spec asks to demonstrate understanding of security vulnerabilities. Here
are the main ones and how the app handles them."

"XSS — Cross Site Scripting. This is where an attacker puts malicious JavaScript
into content on the page. Mustache automatically escapes HTML in all {{}}
expressions, so if someone put a script tag in a course title it would be
rendered as harmless text, not executed. That's handled without us doing
anything extra."

[ACTION: Show routes/auth.js — the bcrypt lines]

"Password security — bcrypt hashing means passwords are never stored in plain
text. Even if someone got the database file they'd have hashes they can't
reverse."

[ACTION: Show index.js — the session httpOnly line]

"Session security — the httpOnly flag on the session cookie means browser
JavaScript can't read it. That blocks a whole class of session-stealing attacks.
In production mode the secure flag is also set, which means the cookie only
travels over HTTPS."

[ACTION: Show middlewares/auth.js — requireOrganiser]

"Authorisation — the requireOrganiser middleware means the entire organiser
section is inaccessible to students and guests, no matter what URL they type."

"One vulnerability that isn't addressed is CSRF — Cross Site Request Forgery.
This is where a malicious website tricks your browser into submitting a form
to our site while you're logged in. The fix is CSRF tokens — hidden random
values in forms that the server checks. This app doesn't implement that, which
is a known gap. In a production system you'd add a library like csurf to
handle it."

"There's also no rate limiting on the login form — an attacker could try
thousands of passwords without being blocked. Again, something to add in
production."

---

## SECTION 8 — AI Reflection (13:45 – 15:00)

[ACTION: Can close VS Code, just talk to camera or show browser]

"Finally, reflecting on using AI in this project."

"I used Claude throughout development. The brief allows this at Level 3 —
AI Collaboration — which means using AI to help generate code but critically
evaluating and understanding everything it produces."

"Where AI was genuinely useful — it's good at generating boilerplate quickly.
The model files, the route structure, the CSS — these follow clear patterns and
AI can produce them faster than typing them from scratch. It's also good at
knowing what libraries to use and how they fit together."

"Where it was less reliable — the starter code itself was AI-generated and had
significant bugs. The Mustache templates had broken HTML throughout. Anchor
tags were written as just text without the actual HTML tag. The body tag was
closed immediately in head.mustache, which meant nothing would render. The
filter dropdowns never showed which option was currently selected because the
template booleans were missing. None of these were obvious from reading the
code quickly — you only discovered them by running it."

"That's the core problem with AI-generated code. It looks plausible. It's
syntactically correct. But it doesn't work. The bugs are in the logic and the
integration between parts, not in obvious typos."

"The time I spent understanding and fixing those bugs probably matched the time
the AI saved generating them in the first place. Which matches exactly what the
brief warned about — that debugging AI code means overall project timelines
aren't significantly shortened."

"What AI can't do is understand what you're actually trying to build, notice
when two things don't connect properly, or know that a Mustache template needs
a boolean flag set in the controller before a conditional will work. Those
connections require understanding the whole system."

"The most useful thing AI did was help me understand code I didn't write — I
could ask it to explain why something worked a certain way, and that genuinely
accelerated my understanding. Used as a learning tool alongside a coding tool,
it's more valuable than used as a replacement for thinking."

[ACTION: End on the running app — home page]

"That's the full system. Thanks."

---

## QUICK REFERENCE — Pages to visit in order

1.  `/`                                          Home page (logged out)
2.  `/about`                                     Info page
3.  `/courses`                                   Course list
4.  `/courses?level=beginner`                    Filtered courses
5.  `/courses/:id`                               Course detail (no booking buttons)
6.  `/auth/register`                             Register — show error then success
7.  `/courses/:id`                               Same page — booking buttons now visible
8.  Book full course → `/bookings/:id`           Confirmation page
9.  `/my-bookings`                               Student booking list + cancel
10. Log out → Log in as organiser
11. `/organiser`                                 Dashboard with stats
12. `/organiser/courses`                         Course list
13. `/organiser/courses/new`                     Add course form
14. `/organiser/courses/:id/sessions`            Sessions + add session
15. `/organiser/courses/:id/sessions/:id/list`   Class list
16. `/organiser/users`                           User management

## KEY QUESTIONS TO BE ABLE TO ANSWER

If a marker asks you anything, these are the most likely topics:

Q: What does middleware do?
A: It runs before the controller on every matching request. attachUser checks
   the session and adds the user to req. requireOrganiser blocks non-organisers.

Q: Why bcrypt instead of just storing the password?
A: Bcrypt is a one-way hash — you can't reverse it. It's also intentionally
   slow which makes brute force attacks impractical.

Q: What is a session?
A: A way for the server to remember who you are between requests. HTTP itself
   has no memory. The session stores a user ID on the server, and a session ID
   cookie in the browser links them together.

Q: What is MVC?
A: Model-View-Controller. A pattern that separates data access (Model), 
   presentation (View) and coordination logic (Controller) into distinct layers
   so they don't get tangled together.

Q: What is XSS?
A: Cross-Site Scripting — an attacker injects malicious JavaScript into a page.
   Mustache auto-escapes HTML so this is handled automatically.

Q: What is CSRF and why doesn't the app protect against it?
A: Cross-Site Request Forgery — a malicious site tricks your browser into
   submitting a form to our site. The fix is CSRF tokens but this app doesn't
   implement them — it's a known gap worth mentioning.

Q: Why is the booking logic in a service rather than a controller?
A: Because both the web form and the JSON API need the same rules. A service
   avoids duplicating code across two controllers.

Q: Why can HTML forms only use GET and POST?
A: It's just how the HTML spec works. For PUT/DELETE we use a workaround —
   a hidden ?_method= query parameter that the router intercepts.
