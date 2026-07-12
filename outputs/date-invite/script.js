const state = {
  activity: "Pizza",
  date: "",
  time: "",
};

const noMessages = [
  "Are u sure?",
  "Like... 100% sure?",
  "Think about snacks though.",
  "Final answer?",
  "What if I ask really nicely?",
  "This button is getting shy.",
  "Okay but the yes button is right there.",
  "Last chance before I start pouting.",
  "No is not looking very clickable anymore.",
  "I accept your almost-yes."
];

const screens = document.querySelectorAll(".screen");
const noButton = document.querySelector("#noButton");
const yesButton = document.querySelector("#yesButton");
const noMessage = document.querySelector("#noMessage");
const dateInput = document.querySelector("#dateInput");
const timeInput = document.querySelector("#timeInput");
const summaryCard = document.querySelector("#summaryCard");
const googleCalendarLink = document.querySelector("#googleCalendarLink");
const outlookCalendarLink = document.querySelector("#outlookCalendarLink");
const downloadIcsButton = document.querySelector("#downloadIcsButton");

let noClicks = 0;

function showScreen(name) {
  screens.forEach((screen) => {
    screen.classList.toggle("is-active", screen.dataset.screen === name);
    screen.scrollTop = 0;
  });
  window.scrollTo(0, 0);
}

function formatDate(value) {
  if (!value) return "";
  const date = new Date(`${value}T00:00:00`);
  return date.toLocaleDateString(undefined, {
    weekday: "long",
    month: "long",
    day: "numeric",
    year: "numeric",
  });
}

function formatTime(value) {
  if (!value) return "";
  const [hour, minute] = value.split(":").map(Number);
  const date = new Date();
  date.setHours(hour, minute, 0, 0);
  return date.toLocaleTimeString(undefined, {
    hour: "numeric",
    minute: "2-digit",
  });
}

function getEventDates() {
  const start = new Date(`${state.date}T${state.time || "19:00"}:00`);
  const end = new Date(start.getTime() + 2 * 60 * 60 * 1000);
  return { start, end };
}

function pad(value) {
  return String(value).padStart(2, "0");
}

function toCalendarDate(value) {
  return [
    value.getUTCFullYear(),
    pad(value.getUTCMonth() + 1),
    pad(value.getUTCDate()),
    "T",
    pad(value.getUTCHours()),
    pad(value.getUTCMinutes()),
    pad(value.getUTCSeconds()),
    "Z",
  ].join("");
}

function escapeIcsText(value) {
  return String(value)
    .replace(/\\/g, "\\\\")
    .replace(/;/g, "\\;")
    .replace(/,/g, "\\,")
    .replace(/\n/g, "\\n");
}

function buildEventDescription(details) {
  return [
    "It is officially a date!",
    "",
    `What we are doing: ${details.activity}`,
    `Date: ${details.date}`,
    `Time: ${details.time}`,
    "",
    "See u then :)",
  ].join("\n");
}

function buildDetails() {
  return {
    activity: state.activity,
    date: formatDate(state.date),
    time: formatTime(state.time),
  };
}

function buildCalendarLinks(details) {
  const { start, end } = getEventDates();
  const title = `Date: ${details.activity}`;
  const description = buildEventDescription(details);
  const dateRange = `${toCalendarDate(start)}/${toCalendarDate(end)}`;
  const sharedParams = new URLSearchParams({
    text: title,
    dates: dateRange,
    details: description,
  });
  const outlookParams = new URLSearchParams({
    path: "/calendar/action/compose",
    rru: "addevent",
    subject: title,
    startdt: start.toISOString(),
    enddt: end.toISOString(),
    body: description,
  });

  googleCalendarLink.href = `https://calendar.google.com/calendar/render?action=TEMPLATE&${sharedParams.toString()}`;
  outlookCalendarLink.href = `https://outlook.live.com/calendar/0/deeplink/compose?${outlookParams.toString()}`;
}

function buildIcs(details) {
  const { start, end } = getEventDates();
  const now = toCalendarDate(new Date());
  const uid = `date-invite-${Date.now()}@local`;
  const title = `Date: ${details.activity}`;
  const description = buildEventDescription(details);

  return [
    "BEGIN:VCALENDAR",
    "VERSION:2.0",
    "PRODID:-//Date Invite//Date Invite//EN",
    "CALSCALE:GREGORIAN",
    "METHOD:REQUEST",
    "BEGIN:VEVENT",
    `UID:${uid}`,
    `DTSTAMP:${now}`,
    `DTSTART:${toCalendarDate(start)}`,
    `DTEND:${toCalendarDate(end)}`,
    `SUMMARY:${escapeIcsText(title)}`,
    `DESCRIPTION:${escapeIcsText(description)}`,
    "END:VEVENT",
    "END:VCALENDAR",
  ].join("\r\n");
}

function downloadIcs(details) {
  const blob = new Blob([buildIcs(details)], { type: "text/calendar;charset=utf-8" });
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");

  link.href = url;
  link.download = "our-date.ics";
  document.body.appendChild(link);
  link.click();
  link.remove();
  URL.revokeObjectURL(url);
}

function updateSummary() {
  const details = buildDetails();

  summaryCard.innerHTML = `
    <div><strong>Activity:</strong> ${details.activity}</div>
    <div><strong>Date:</strong> ${details.date}</div>
    <div><strong>Time:</strong> ${details.time}</div>
  `;

  buildCalendarLinks(details);
}

yesButton.addEventListener("click", () => {
  showScreen("activities");
});

noButton.addEventListener("click", () => {
  const message = noMessages[Math.min(noClicks, noMessages.length - 1)];
  const yesScale = 1 + Math.min(noClicks + 1, 8) * 0.12;
  const noScale = Math.max(0.48, 1 - (noClicks + 1) * 0.07);

  noMessage.textContent = message;
  yesButton.style.transform = `scale(${yesScale})`;
  noButton.style.transform = `scale(${noScale})`;
  noButton.textContent = noClicks > 7 ? "no?" : "No";
  noClicks += 1;
});

document.querySelectorAll("[data-next]").forEach((button) => {
  button.addEventListener("click", () => showScreen(button.dataset.next));
});

document.querySelectorAll("[data-back]").forEach((button) => {
  button.addEventListener("click", () => showScreen(button.dataset.back));
});

document.querySelectorAll(".activity-card").forEach((button) => {
  button.addEventListener("click", () => {
    document.querySelectorAll(".activity-card").forEach((card) => card.classList.remove("is-selected"));
    button.classList.add("is-selected");
    state.activity = button.dataset.activity;
  });
});

document.querySelector("#dateForm").addEventListener("submit", (event) => {
  event.preventDefault();
  state.date = dateInput.value;
  state.time = timeInput.value;
  updateSummary();
  showScreen("done");
});

downloadIcsButton.addEventListener("click", () => {
  downloadIcs(buildDetails());
});

const today = new Date();
const offset = today.getTimezoneOffset();
const localToday = new Date(today.getTime() - offset * 60 * 1000).toISOString().slice(0, 10);
dateInput.min = localToday;
dateInput.value = localToday;
timeInput.value = "19:00";
