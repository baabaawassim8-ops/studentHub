const $ = (sel, root = document) => root.querySelector(sel);
const $$ = (sel, root = document) => [...root.querySelectorAll(sel)];

function pageName() {
  const file = location.pathname.split("/").pop() || "index.html";
  return file.replace(".html", "") || "index";
}

function initNav() {
  const links = $$(".nav-links a");
  const current = pageName();
  links.forEach((link) => {
    const href = link.getAttribute("href") || "";
    const target = href.replace(".html", "").replace("./", "") || "index";
    if ((current === "index" && (href === "index.html" || href === "./")) || target === current) {
      link.classList.add("active");
    }
  });

  const menu = $(".menu-btn");
  const nav = $(".nav-links");
  if (menu && nav) {
    menu.addEventListener("click", () => nav.classList.toggle("open"));
  }

  const themeBtn = $("#theme-toggle");
  const saved = localStorage.getItem("studenthub-theme") || "light";
  document.documentElement.dataset.theme = saved;
  if (themeBtn) {
    themeBtn.addEventListener("click", () => {
      const next = document.documentElement.dataset.theme === "dark" ? "light" : "dark";
      document.documentElement.dataset.theme = next;
      localStorage.setItem("studenthub-theme", next);
    });
  }
}

function letterFromScore(score) {
  if (score >= 90) return "A";
  if (score >= 80) return "B";
  if (score >= 70) return "C";
  if (score >= 60) return "D";
  return "F";
}

function courseAverages() {
  const groups = {};
  StudentHub.grades.forEach((g) => {
    groups[g.course] ??= { weighted: 0, weight: 0, scores: [] };
    groups[g.course].weighted += g.score * g.weight;
    groups[g.course].weight += g.weight;
    groups[g.course].scores.push(g.score);
  });
  return Object.fromEntries(
    Object.entries(groups).map(([course, data]) => {
      const avg = data.weight ? data.weighted / data.weight : 0;
      return [course, { avg, letter: letterFromScore(avg) }];
    })
  );
}

function overallAverage() {
  const avgs = Object.values(courseAverages()).map((x) => x.avg);
  if (!avgs.length) return 0;
  return avgs.reduce((a, b) => a + b, 0) / avgs.length;
}

function dueMeta(due) {
  const today = new Date("2026-09-26");
  const date = new Date(due + "T00:00:00");
  const diff = Math.round((date - today) / 86400000);
  if (diff < 0) return { label: `${Math.abs(diff)}d late`, cls: "overdue" };
  if (diff === 0) return { label: "Due today", cls: "due-soon" };
  if (diff <= 3) return { label: `In ${diff}d`, cls: "due-soon" };
  return { label: `In ${diff}d`, cls: "upcoming" };
}

function assignmentStatus(a) {
  const done = JSON.parse(localStorage.getItem("studenthub-done") || "[]");
  if (done.includes(a.id)) return { label: "Done", cls: "done" };
  return dueMeta(a.due);
}

function toggleDone(id) {
  const done = new Set(JSON.parse(localStorage.getItem("studenthub-done") || "[]"));
  if (done.has(id)) done.delete(id);
  else done.add(id);
  localStorage.setItem("studenthub-done", JSON.stringify([...done]));
}

function renderDashboard() {
  const stats = $("#dashboard-stats");
  if (!stats) return;
  const avg = overallAverage();
  const open = StudentHub.assignments.filter((a) => assignmentStatus(a).cls !== "done").length;
  const overdue = StudentHub.assignments.filter((a) => assignmentStatus(a).cls === "overdue").length;
  stats.innerHTML = `
    <article class="card stat"><div class="label">GPA average</div><div class="value">${avg.toFixed(1)}%</div><div class="hint">${letterFromScore(avg)} overall</div></article>
    <article class="card stat"><div class="label">Courses</div><div class="value">${StudentHub.courses.length}</div><div class="hint">${StudentHub.courses.reduce((n, c) => n + c.credits, 0)} credits</div></article>
    <article class="card stat"><div class="label">Open tasks</div><div class="value">${open}</div><div class="hint">${overdue} overdue</div></article>
    <article class="card stat"><div class="label">Credits done</div><div class="value">${StudentHub.student.credits}</div><div class="hint">of ${StudentHub.student.creditsRequired}</div></article>
  `;

  const upcoming = $("#upcoming-list");
  if (upcoming) {
    upcoming.innerHTML = StudentHub.assignments
      .slice()
      .sort((a, b) => a.due.localeCompare(b.due))
      .slice(0, 5)
      .map((a) => {
        const s = assignmentStatus(a);
        return `<div class="list-item"><div><strong>${a.title}</strong><div class="meta">${a.course} · ${a.due}</div></div><span class="badge ${s.cls}">${s.label}</span></div>`;
      })
      .join("");
  }

  const today = $("#today-schedule");
  if (today) {
    const weekday = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"][new Date("2026-09-26").getDay()];
    const items = StudentHub.schedule.filter((s) => s.day === weekday);
    today.innerHTML = items.length
      ? items
          .map(
            (s) =>
              `<div class="list-item"><div><strong>${s.title}</strong><div class="meta">${s.start}:00–${s.end}:00 · ${s.room}</div></div><span class="badge upcoming">${s.course}</span></div>`
          )
          .join("")
      : `<p class="meta">No classes today. Use the extra time to catch up on overdue work.</p>`;
  }

  const featured = $("#featured-courses");
  if (featured) {
    featured.innerHTML = StudentHub.courses
      .slice(0, 3)
      .map(
        (c) => `
        <article class="course-card">
          <span class="badge upcoming">${c.code}</span>
          <h3>${c.name}</h3>
          <div class="meta">${c.instructor}</div>
          <div class="bar"><span style="width:${c.progress}%;background:${c.color}"></span></div>
          <div class="meta">${c.progress}% complete · ${c.next}</div>
        </article>`
      )
      .join("");
  }
}

function renderCourses() {
  const grid = $("#course-grid");
  if (!grid) return;
  grid.innerHTML = StudentHub.courses
    .map(
      (c) => `
      <article class="course-card">
        <span class="badge upcoming">${c.code}</span>
        <h3>${c.name}</h3>
        <p class="meta">${c.instructor} · ${c.credits} credits</p>
        <div class="bar"><span style="width:${c.progress}%;background:${c.color}"></span></div>
        <p class="meta">${c.progress}% complete</p>
        <p class="meta">Next: ${c.next}</p>
      </article>`
    )
    .join("");
}

function renderAssignments(filter = "all") {
  const list = $("#assignment-list");
  if (!list) return;
  const items = StudentHub.assignments.filter((a) => {
    const s = assignmentStatus(a).cls;
    if (filter === "all") return true;
    if (filter === "done") return s === "done";
    if (filter === "open") return s !== "done";
    return s === filter;
  });
  list.innerHTML = items
    .map((a) => {
      const s = assignmentStatus(a);
      return `<div class="list-item">
        <div>
          <strong>${a.title}</strong>
          <div class="meta">${a.course} · ${a.type} · due ${a.due}</div>
        </div>
        <div style="display:flex;gap:8px;align-items:center">
          <span class="badge ${s.cls}">${s.label}</span>
          <button class="btn btn-ghost" data-done="${a.id}">${s.cls === "done" ? "Undo" : "Mark done"}</button>
        </div>
      </div>`;
    })
    .join("");

  list.onclick = (e) => {
    const id = e.target.dataset?.done;
    if (!id) return;
    toggleDone(id);
    renderAssignments(filter);
    renderDashboard();
  };
}

function renderSchedule() {
  const grid = $("#week-grid");
  if (!grid) return;
  const colors = Object.fromEntries(StudentHub.courses.map((c) => [c.code, c.color]));
  const cells = ['<div></div>'];
  StudentHub.days.forEach((d) => cells.push(`<div class="day-head">${d}</div>`));
  StudentHub.hours.forEach((hour) => {
    cells.push(`<div class="time-label">${hour}:00</div>`);
    StudentHub.days.forEach((day) => {
      const event = StudentHub.schedule.find((s) => s.day === day && s.start === hour);
      if (event) {
        const span = event.end - event.start;
        cells.push(
          `<div class="slot"><div class="event" style="background:${colors[event.course] || "#4f46e5"};min-height:${span * 44}px">${event.title}<br>${event.room}</div></div>`
        );
      } else {
        cells.push(`<div class="slot"></div>`);
      }
    });
  });
  grid.innerHTML = cells.join("");
}

function renderGrades() {
  const table = $("#grades-table");
  const banner = $("#grade-average");
  if (!table) return;
  const avgs = courseAverages();
  const overall = overallAverage();
  if (banner) {
    banner.innerHTML = `<div><strong>Overall average</strong><div>Weighted by assignment weights, then averaged across courses.</div></div><div style="font-size:2rem;font-weight:800">${overall.toFixed(1)}% · ${letterFromScore(overall)}</div>`;
  }
  table.innerHTML = `
    <thead><tr><th>Course</th><th>Item</th><th>Weight</th><th>Score</th><th>Course avg</th></tr></thead>
    <tbody>
      ${StudentHub.grades
        .map((g) => {
          const a = avgs[g.course];
          return `<tr>
            <td>${g.course}</td>
            <td>${g.item}</td>
            <td>${g.weight}%</td>
            <td>${g.score}%</td>
            <td><strong>${a.avg.toFixed(1)}%</strong> ${a.letter}</td>
          </tr>`;
        })
        .join("")}
    </tbody>`;
}

function renderProfile() {
  const s = StudentHub.student;
  const name = $("#profile-name");
  if (name) name.textContent = `${s.firstName} ${s.lastName}`;
  const id = $("#profile-id");
  if (id) id.textContent = s.id;
  const pct = Math.round((s.credits / s.creditsRequired) * 100);
  const bar = $("#credit-bar");
  if (bar) bar.style.width = `${pct}%`;
  const creditText = $("#credit-text");
  if (creditText) creditText.textContent = `${s.credits} / ${s.creditsRequired} credits (${pct}%)`;

  const form = $("#profile-form");
  if (!form) return;
  const saved = JSON.parse(localStorage.getItem("studenthub-profile") || "null") || s;
  form.firstName.value = saved.firstName;
  form.lastName.value = saved.lastName;
  form.email.value = saved.email;
  form.phone.value = saved.phone;
  form.advisor.value = saved.advisor;
  form.addEventListener("submit", (e) => {
    e.preventDefault();
    const next = {
      ...s,
      firstName: form.firstName.value,
      lastName: form.lastName.value,
      email: form.email.value,
      phone: form.phone.value,
      advisor: form.advisor.value,
    };
    localStorage.setItem("studenthub-profile", JSON.stringify(next));
    $("#profile-name").textContent = `${next.firstName} ${next.lastName}`;
    form.querySelector(".save-msg").textContent = "Profile saved on this device.";
  });
}

document.addEventListener("DOMContentLoaded", () => {
  initNav();
  renderDashboard();
  renderCourses();
  renderAssignments();
  renderSchedule();
  renderGrades();
  renderProfile();

  $$("[data-filter]").forEach((btn) => {
    btn.addEventListener("click", () => {
      $$("[data-filter]").forEach((b) => b.classList.remove("active"));
      btn.classList.add("active");
      renderAssignments(btn.dataset.filter);
    });
  });
});
